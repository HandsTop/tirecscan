const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

/**
 * 1) Серверная глобальная история: пишем её автоматически
 *    при любом изменении документа tires/{ean}.
 */
exports.onTireWrite = functions.firestore
  .document("tires/{ean}")
  .onWrite(async (change, context) => {
    const ean = context.params.ean;

    const before = change.before.exists ? change.before.data() : null;
    const after  = change.after.exists  ? change.after.data()  : null;

    let action = "update";
    if (!before && after) action = "create";
    if (before && !after) action = "delete";

    // Кто изменил? Мы кладём имя в поле lastUser на клиенте (не для прав, а для подписи)
    // Даже если подделают имя — права это не даёт, это только подпись.
    const user = (after && after.lastUser) || (before && before.lastUser) || "—";

    // Для update посчитаем изменения по ключевым полям
    let changes = [];
    if (action === "update" && before && after) {
      const fields = ["maker", "tireModel", "size", "loc", "qty"];
      for (const f of fields) {
        const a = before[f];
        const b = after[f];
        // сравнение строкой, чтобы нормализовать null/undefined
        if (String(a ?? "") !== String(b ?? "")) {
          changes.push({
            field: f,
            from: (a ?? "—"),
            to: (b ?? "—")
          });
        }
      }
      // если вообще ничего из важных полей не поменялось — можно не писать историю
      if (changes.length === 0) return null;
    }

    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    await db.collection("globalHistory").doc(id).set({
      ts: Date.now(),
      action,
      ean,
      user,
      changes
    });

    return null;
  });

/**
 * 2) Выдача admin-claims через "запрос" из Firestore:
 *    админ на сайте создаёт документ в adminRequests, функция ставит claim admin:true указанному uid.
 *
 * Важно: создать документ может только текущий админ (rules выше).
 */
exports.onAdminRequestCreate = functions.firestore
  .document("adminRequests/{id}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const targetUid = data.targetUid;

    if (!targetUid) {
      await snap.ref.update({ status: "error", error: "targetUid is required" });
      return null;
    }

    try {
      await admin.auth().setCustomUserClaims(targetUid, { admin: true });
      await snap.ref.update({ status: "ok" });
    } catch (e) {
      await snap.ref.update({ status: "error", error: String(e?.message || e) });
    }

    return null;
  });
