const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const REGION = "europe-west1";
const callable = functions.region(REGION).https;
const fail = (code, message) => { throw new functions.https.HttpsError(code, message); };
const text = (value, max = 120) => String(value ?? "").trim().slice(0, max);
const safeId = (value, label = "ID") => {
  const result = text(value, 32);
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(result)) fail("invalid-argument", `${label} ist ungültig.`);
  return result;
};
const ean = (value) => {
  const result = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{8,14}$/.test(result)) fail("invalid-argument", "EAN ist ungültig.");
  return result;
};
const integer = (value, min, max, label) => {
  const result = Number(value);
  if (!Number.isInteger(result) || result < min || result > max) fail("invalid-argument", `${label} ist ungültig.`);
  return result;
};
const authenticated = (context) => {
  if (!context.auth) fail("unauthenticated", "Anmeldung erforderlich.");
  if (process.env.REQUIRE_APP_CHECK === "true" && !context.app) fail("failed-precondition", "App Check erforderlich.");
  return context.auth;
};
const isAdmin = (context) => context.auth?.token?.admin === true;
async function activeProfile(context) {
  const auth = authenticated(context);
  const snap = await db.doc(`users/${auth.uid}`).get();
  if (!snap.exists || snap.data().active !== true) fail("permission-denied", "Konto ist nicht aktiviert.");
  return { uid: auth.uid, ...snap.data() };
}
async function writeAudit(transaction, action, actor, details) {
  const ref = db.collection("auditLogs").doc();
  transaction.set(ref, { action, actorUid: actor.uid, actorName: actor.displayName || actor.email || actor.uid, details, createdAt: FieldValue.serverTimestamp() });
}

exports.ensureProfile = callable.onCall(async (_data, context) => {
  const auth = authenticated(context);
  const ref = db.doc(`users/${auth.uid}`);
  const snap = await ref.get();
  const adminUser = isAdmin(context);
  if (!snap.exists) {
    await ref.create({ email: text(auth.token.email, 254), displayName: text(auth.token.name || auth.token.email?.split("@")[0], 80), role: adminUser ? "admin" : "worker", active: adminUser, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  } else if (adminUser && (snap.data().active !== true || snap.data().role !== "admin")) {
    await ref.update({ active: true, role: "admin", updatedAt: FieldValue.serverTimestamp() });
  }
  return { ok: true };
});

exports.claimContainer = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context);
  const containerId = safeId(data?.containerId, "Container");
  const ref = db.doc(`containers/${containerId}`);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) fail("not-found", "Container nicht gefunden.");
    const container = snap.data();
    if (container.status === "completed") fail("failed-precondition", "Container ist bereits fertig.");
    if (container.assignedTo && container.assignedTo !== profile.uid) fail("already-exists", `Container ist bereits ${container.assignedName || "einem Mitarbeiter"} zugewiesen.`);
    transaction.update(ref, { assignedTo: profile.uid, assignedName: profile.displayName || profile.email || profile.uid, status: "active", claimedAt: container.claimedAt || FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await writeAudit(transaction, "container.claim", profile, { containerId });
  });
  return { ok: true };
});

exports.confirmPick = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context);
  const containerId = safeId(data?.containerId, "Container");
  const itemId = safeId(data?.itemId, "Position");
  const scannedEan = ean(data?.ean);
  const quantity = integer(data?.quantity, 1, 70, "Menge");
  const containerRef = db.doc(`containers/${containerId}`);
  const itemRef = db.doc(`containers/${containerId}/items/${itemId}`);
  let response;
  await db.runTransaction(async (transaction) => {
    const [containerSnap, itemSnap] = await Promise.all([transaction.get(containerRef), transaction.get(itemRef)]);
    if (!containerSnap.exists || !itemSnap.exists) fail("not-found", "Container oder Position nicht gefunden.");
    const container = containerSnap.data(); const item = itemSnap.data();
    if (container.assignedTo !== profile.uid && !isAdmin(context)) fail("permission-denied", "Container ist einem anderen Mitarbeiter zugewiesen.");
    if (container.status === "completed") fail("failed-precondition", "Container ist bereits fertig.");
    if (String(item.ean) !== scannedEan) fail("failed-precondition", "Falscher Reifen: EAN stimmt nicht.");
    const requiredQty = integer(item.requiredQty, 1, 70, "Sollmenge"); const pickedBefore = integer(item.pickedQty || 0, 0, requiredQty, "Istmenge"); const pickedAfter = pickedBefore + quantity;
    if (pickedAfter > requiredQty) fail("out-of-range", `Maximal noch ${requiredQty - pickedBefore} Reifen.`);
    const containerTotal = integer(container.totalQty, 1, 70, "Containermenge"); const containerPicked = integer(container.pickedQty || 0, 0, containerTotal, "Container-Istmenge"); const newContainerPicked = containerPicked + quantity;
    if (newContainerPicked > containerTotal) fail("out-of-range", "Containermenge würde überschritten.");
    const itemCompleted = pickedAfter === requiredQty; const allItemsPicked = newContainerPicked === containerTotal;
    transaction.update(itemRef, { pickedQty: pickedAfter, status: itemCompleted ? "completed" : "active", pickedBy: profile.uid, pickedByName: profile.displayName || profile.email || profile.uid, updatedAt: FieldValue.serverTimestamp(), ...(itemCompleted ? { completedAt: FieldValue.serverTimestamp() } : {}) });
    transaction.update(containerRef, { pickedQty: newContainerPicked, status: "active", updatedAt: FieldValue.serverTimestamp() });
    await writeAudit(transaction, "pick.confirm", profile, { containerId, itemId, ean: scannedEan, quantity, pickedAfter, requiredQty });
    response = { ok: true, itemCompleted, allItemsPicked, pickedQty: pickedAfter };
  });
  return response;
});

exports.finalizeContainer = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context);
  const containerId = safeId(data?.containerId, "Container");
  const ref = db.doc(`containers/${containerId}`);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) fail("not-found", "Container nicht gefunden.");
    const container = snap.data();
    if (container.assignedTo !== profile.uid && !isAdmin(context)) fail("permission-denied", "Container ist einem anderen Mitarbeiter zugewiesen.");
    if (container.status === "completed") return;
    const totalQty = integer(container.totalQty, 1, 70, "Containermenge");
    const pickedQty = integer(container.pickedQty || 0, 0, totalQty, "Container-Istmenge");
    if (pickedQty !== totalQty) fail("failed-precondition", "Nicht alle Positionen sind vollständig kommissioniert.");
    transaction.update(ref, { status: "completed", completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await writeAudit(transaction, "container.finalize", profile, { containerId, pickedQty, totalQty });
  });
  return { ok: true };
});

exports.importContainer = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context);
  if (!isAdmin(context)) fail("permission-denied", "Administratorrechte erforderlich.");
  const containerId = safeId(data?.number || data?.containerId, "Container");
  if (!Array.isArray(data?.items) || data.items.length < 1 || data.items.length > 70) fail("invalid-argument", "1 bis 70 Positionen erforderlich.");
  const seen = new Set();
  const items = data.items.map((raw, index) => {
    const itemId = safeId(raw.id || String(index + 1), "Positions-ID"); if (seen.has(itemId)) fail("invalid-argument", "Doppelte Positions-ID."); seen.add(itemId);
    return { id:itemId, sequence:integer(raw.sequence ?? index + 1,1,999,"Reihenfolge"), ean:ean(raw.ean), articleNo:text(raw.articleNo,40), brand:text(raw.brand,80), description:text(raw.description || raw.size,160), size:text(raw.size,100), location:text(raw.location,40), level:text(raw.level,20), requiredQty:integer(raw.requiredQty,1,70,"Menge"), pickedQty:0, status:"open" };
  });
  const totalQty = items.reduce((sum,item)=>sum+item.requiredQty,0); if (totalQty > 70) fail("out-of-range", "Ein Container darf höchstens 70 Reifen enthalten.");
  const containerRef = db.doc(`containers/${containerId}`); const exists = await containerRef.get(); if (exists.exists) fail("already-exists", "Container existiert bereits.");
  const batch = db.batch(); batch.create(containerRef,{ number:containerId, orderNumber:text(data.orderNumber,40), status:"open", itemCount:items.length, totalQty, pickedQty:0, assignedTo:null, assignedName:null, createdBy:profile.uid, createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp() });
  items.forEach(({id,...item})=>batch.create(containerRef.collection("items").doc(id),{...item,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()}));
  const auditRef=db.collection("auditLogs").doc();batch.create(auditRef,{action:"container.import",actorUid:profile.uid,actorName:profile.displayName||profile.email||profile.uid,details:{containerId,itemCount:items.length,totalQty},createdAt:FieldValue.serverTimestamp()});await batch.commit();
  return { ok:true, containerId, itemCount:items.length, totalQty };
});

exports.setUserAccess = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context); if (!isAdmin(context)) fail("permission-denied", "Administratorrechte erforderlich.");
  const uid=text(data?.uid,128); if(!/^[A-Za-z0-9_-]{8,128}$/.test(uid))fail("invalid-argument","UID ist ungültig."); if(uid===profile.uid && data?.active===false)fail("failed-precondition","Das eigene Konto kann nicht gesperrt werden.");
  const active=data?.active===true; const role=data?.role==="admin"?"admin":"worker"; const displayName=text(data?.displayName,80); if(active&&!displayName)fail("invalid-argument","Name ist erforderlich.");
  const targetRef=db.doc(`users/${uid}`); const target=await targetRef.get(); if(!target.exists)fail("not-found","Benutzer nicht gefunden.");
  await targetRef.update({active,role,displayName,updatedAt:FieldValue.serverTimestamp(),updatedBy:profile.uid});
  const authUser=await getAuth().getUser(uid); await getAuth().setCustomUserClaims(uid,{...(authUser.customClaims||{}),admin:role==="admin"&&active});
  await db.collection("auditLogs").add({action:"user.access",actorUid:profile.uid,actorName:profile.displayName||profile.email||profile.uid,details:{targetUid:uid,active,role},createdAt:FieldValue.serverTimestamp()});
  return {ok:true};
});
