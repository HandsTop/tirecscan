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
const normalizeSearch = (value) => text(value, 80).normalize("NFKD").toUpperCase().replace(/[^A-Z0-9]/g, "");
const tirePublic = (id, data) => ({
  ean: String(data.ean || id), articleNo: text(data.articleNo, 40), brand: text(data.brand, 80), size: text(data.size, 80), description: text(data.description, 160),
  physical: Number(data.physical || 0), available: Number(data.available || 0), ordered: Number(data.ordered || 0), arrivedPending: Number(data.arrivedPending || 0), turnover: Number(data.turnover || 0),
  locations: Array.isArray(data.locations) ? data.locations.slice(0, 20).map(place => ({ site:text(place.site || "Friesoythe", 40), code:text(place.code, 20), level:Number(place.level || 1), quantity:Number(place.quantity || 0), available:Number(place.available ?? place.quantity ?? 0) })) : []
});
function tireMatches(tire, raw, warehouseMode) {
  const search = normalizeSearch(raw); if (!search) return true;
  if (warehouseMode) return tire.locations.some(place => normalizeSearch(place.code).includes(search) || normalizeSearch(place.site).includes(search));
  const fields = [tire.ean, tire.articleNo, tire.brand, tire.description].map(normalizeSearch);
  if (fields.some(value => value.includes(search))) return true;
  const size = String(tire.size || "").toUpperCase(); const match = size.match(/(\d{3})\D*(\d{2})\D*R?\s*(\d{2})/); const dimension = match ? `${match[1]}${match[2]}${match[3]}` : "";
  const speed = (size.match(/\d{2,3}([A-Z])(?:\s|$)/) || [])[1] || ""; const brand = normalizeSearch(tire.brand); const withoutBrand = brand && search.includes(brand) ? search.replace(brand, "") : search;
  return Boolean(dimension && withoutBrand.includes(dimension) && (!/[HTVWY]$/.test(withoutBrand) || withoutBrand.endsWith(speed)));
}
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

exports.searchArticles = callable.onCall(async (data, context) => {
  await activeProfile(context);
  const raw = text(data?.query, 80); const warehouseMode = data?.warehouseMode === true;
  if (raw && normalizeSearch(raw).length < 2) fail("invalid-argument", "Mindestens zwei Zeichen eingeben.");
  const snapshot = await db.collection("tires").limit(500).get();
  const articles = snapshot.docs.map(doc => tirePublic(doc.id, doc.data())).filter(tire => tireMatches(tire, raw, warehouseMode)).slice(0, 50);
  return { articles, truncated: snapshot.size === 500 };
});

exports.getTireDetails = callable.onCall(async (data, context) => {
  await activeProfile(context); const tireEan = ean(data?.ean); const ref = db.doc(`tires/${tireEan}`); const snap = await ref.get();
  if (!snap.exists) fail("not-found", "Artikel nicht gefunden.");
  const [historySnap, arrivalsSnap] = await Promise.all([ref.collection("history").orderBy("createdAt", "desc").limit(100).get(), ref.collection("arrivals").orderBy("date", "desc").limit(100).get()]);
  const history = historySnap.docs.map(doc => { const value=doc.data(); return { from:text(value.from,20), to:text(value.to,20), user:text(value.user || value.actorName,80), at:value.createdAt || null }; });
  const arrivals = arrivalsSnap.docs.map(doc => { const value=doc.data(); return { supplier:text(value.supplier,120), date:value.date || value.createdAt || null, quantity:Number(value.quantity||0), old:Number(value.old||0), new:Number(value.new||0) }; });
  return { ...tirePublic(snap.id, snap.data()), history, arrivals };
});

exports.saveTireLocation = callable.onCall(async (data, context) => {
  const profile = await activeProfile(context); if (!isAdmin(context)) fail("permission-denied", "Nur Administratoren dürfen Bestände ändern."); const tireEan = ean(data?.ean); const site = text(data?.site, 40); const code = text(data?.code, 20).toUpperCase(); const originalCode = text(data?.originalCode, 20).toUpperCase();
  if (!site) fail("invalid-argument", "Standort ist erforderlich.");
  if (!/^[A-Z0-9_-]{1,20}$/.test(code)) fail("invalid-argument", "Lagerplatz ist ungültig.");
  const level = integer(data?.level, 1, 9, "Ebene"); const quantity = integer(data?.quantity, 0, 999999, "Bestand"); const availableAtLocation = integer(data?.available, 0, quantity, "Verfügbarer Bestand"); const ref = db.doc(`tires/${tireEan}`); let result;
  await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref); if (!snap.exists) fail("not-found", "Artikel nicht gefunden."); const tire = snap.data(); const locations = Array.isArray(tire.locations) ? tire.locations.slice(0, 20).map(place => ({site:text(place.site||"Friesoythe",40),code:text(place.code,20).toUpperCase(),level:Number(place.level||1),quantity:Number(place.quantity||0),available:Number(place.available??place.quantity??0)})) : [];
    const existingIndex = locations.findIndex(place => place.code === (originalCode || code)); const duplicateIndex = locations.findIndex(place => place.code === code);
    if (duplicateIndex >= 0 && duplicateIndex !== existingIndex) fail("already-exists", "Dieser Lagerplatz ist bereits vorhanden.");
    const location = { site, code, level, quantity, available:availableAtLocation }; if (existingIndex >= 0) locations[existingIndex] = location; else { if (locations.length >= 20) fail("resource-exhausted", "Maximal 20 Lagerplätze pro Artikel."); locations.push(location); }
    const physical = locations.reduce((sum, place) => sum + place.quantity, 0); const available = locations.reduce((sum, place) => sum + place.available, 0);
    transaction.update(ref, { locations, physical, available, updatedAt:FieldValue.serverTimestamp(), updatedBy:profile.uid });
    transaction.set(ref.collection("history").doc(), { from:originalCode || "—", to:code, site, user:profile.displayName || profile.email || profile.uid, actorUid:profile.uid, createdAt:FieldValue.serverTimestamp() });
    await writeAudit(transaction, originalCode ? "tire.location.update" : "tire.location.add", profile, { ean:tireEan, originalCode, site, code, level, quantity, available:availableAtLocation }); result=tirePublic(tireEan,{...tire,locations,physical,available});
  });
  return { ok:true, tire:result };
});

exports.importTires = callable.onCall(async (data, context) => {
  authenticated(context); if (!isAdmin(context)) fail("permission-denied", "Nur Administratoren dürfen Artikel importieren.");
  const rows = Array.isArray(data?.tires) ? data.tires : [];
  if (!rows.length || rows.length > 100) fail("invalid-argument", "1 bis 100 Artikel pro Import erforderlich.");
  const batch = db.batch();
  rows.forEach((row) => {
    const tireEan = ean(row?.ean); const locations = Array.isArray(row?.locations) ? row.locations.slice(0,20).map(place => { const quantity=integer(place?.quantity ?? 0,0,999999,"Bestand");return { site:text(place?.site || "Friesoythe",40), code:text(place?.code,20).toUpperCase(), level:integer(place?.level ?? 1,1,9,"Ebene"), quantity, available:integer(place?.available ?? quantity,0,quantity,"Verfügbarer Bestand") }; }) : [];
    if (locations.some(place => !/^[A-Z0-9_-]{1,20}$/.test(place.code))) fail("invalid-argument", `Lagerplatz für EAN ${tireEan} ist ungültig.`);
    const physical = locations.length ? locations.reduce((sum,place)=>sum+place.quantity,0) : integer(row?.physical ?? 0,0,999999,"P");
    const available = locations.length ? locations.reduce((sum,place)=>sum+place.available,0) : integer(row?.available ?? physical,0,physical,"V");
    batch.set(db.doc(`tires/${tireEan}`), { ean:tireEan, articleNo:text(row?.articleNo,40), brand:text(row?.brand,80), size:text(row?.size,80), description:text(row?.description,160), physical, available, ordered:integer(row?.ordered ?? 0,0,999999,"B"), arrivedPending:integer(row?.arrivedPending ?? 0,0,999999,"T"), turnover:integer(row?.turnover ?? 0,0,100,"Umschlag"), locations, updatedAt:FieldValue.serverTimestamp(), updatedBy:context.auth.uid }, { merge:true });
  });
  await batch.commit(); return { ok:true, count:rows.length };
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
