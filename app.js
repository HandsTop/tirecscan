import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, deleteDoc,
  onSnapshot, collection, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

/* ========= Error overlay ========= */
const showErr = (msg) => {
  const box = document.getElementById("errBox");
  const txt = document.getElementById("errText");
  if (box && txt) { txt.textContent = String(msg || ""); box.style.display = "block"; }
  console.error(msg);
};
window.addEventListener("error", (e) => showErr(e.error?.stack || e.message));
window.addEventListener("unhandledrejection", (e) => showErr(e.reason?.stack || e.reason));

/* ========= CONFIG ========= */
const ADMIN_NAME = "Andrejs O";
const ADMIN_PASSWORD = "1234"; // поменяй

const STORAGE = {
  lang: "tires_lang_cloud_v3",
  user: "tires_user_cloud_v3",
  page: "tires_page_cloud_v3",
  admin: "tires_admin_session_v3",
};

const load = (k, f) => { try { const v = localStorage.getItem(k); return v==null ? f : JSON.parse(v); } catch { return f; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ========= i18n ========= */
const I18N_RU = {
  title:"Учёт шин", home:"Дом", scan:"Сканирование",
  pageHome:"Главная", pageScan:"Сканирование",
  menuSettings:"Настройки", lang:"Язык", user:"Имя пользователя",
  userPh:"Введите имя", confirm:"Подтвердить",
  userNeed:"Сначала введи имя пользователя.",
  userLocked:"Имя закреплено за этим устройством.",
  roleAdmin:"Роль: админ", roleUser:"Роль: просмотр",

  menuAdmin:"Администратор",
  adminPassPh:"Пароль администратора",
  adminLogin:"Войти как админ",
  adminLogout:"Выйти из админа",
  adminOk:"Админ режим включён.",
  adminBad:"Неверный пароль.",
  adminNameOnly:(name)=>`Админ доступ только для имени: ${name}`,

  rightsAdmin:"Права: добавление/редактирование/удаление + общая история.",
  rightsUser:"Права: просмотр + история позиций + изменение локации.",

  start:"Включить камеру", stop:"Выключить",
  camOff:"Камера выключена", camOn:"Камера включена. Наведи на штрих-код…",
  found:"Найдено", autoOff:"(камера выключается)",
  scanHint:"Скан: всем — поиск по EAN; админу дополнительно заполняется форма.",

  ean:"Штрих-код (EAN)", eanPh:"сканируется автоматически",
  maker:"Марка", makerPh:"например Nexen",
  tireModel:"Модель", tireModelPh:"например WinGuard WT1",
  size:"Размер", sizePh:"например 195/65 R16 104/102T",
  loc:"Локация", locPh:"например 216",
  qty:"Кол-во", qtyPh:"например 34",

  save:"Сохранить", clear:"Очистить",
  listTitle:"Список шин",
  openGlobalHistory:"Общая история",
  searchPh:"Поиск или скан: EAN, марка, модель, размер, локация",

  group:"Группировка",
  groupLoc:"По локации", groupMaker:"По марке", groupNone:"Без группировки",

  shown:"Показано", nothing:"Ничего не найдено.",
  promptSearch:"Сначала введи поиск или отсканируй штрих-код.",
  all:"Все", noLoc:"Без локации", noMaker:"Без марки",

  hist:"История", del:"Удалить", open:"Открыть",
  edit:"Изменить",
  editLocTitle:"Изменить локацию",
  newLoc:"Новая локация",
  cancel:"Отмена",
  locUpdated:"Локация обновлена.",

  delConfirm:"Удалить запись?",
  noEan:"Нет EAN (штрих-кода).",
  badQty:"Кол-во должно быть числом (0 или больше).",
  needHttps:"Нужен HTTPS. Открой сайт по https:// ...",
  camFail:"Не удалось включить камеру. Проверь разрешение на камеру.",
  cantEdit:"Доступ запрещён (только админ).",

  histTitleItem:"История позиции",
  histTitleGlobal:"Общая история действий",
  close:"Закрыть",
  created:"Создано", updated:"Изменено", deleted:"Удалено",
  field:{ maker:"Марка", tireModel:"Модель", size:"Размер", loc:"Локация", qty:"Кол-во" }
};

const I18N = {
  ru: I18N_RU,
  de: {
    title:"Reifenverwaltung", home:"Start", scan:"Scannen",
    pageHome:"Startseite", pageScan:"Scannen",
    menuSettings:"Einstellungen", lang:"Sprache", user:"Benutzername",
    userPh:"Name eingeben", confirm:"Bestätigen",
    userNeed:"Bitte zuerst einen Benutzernamen eingeben.",
    userLocked:"Name ist an dieses Gerät gebunden.",
    roleAdmin:"Rolle: Admin", roleUser:"Rolle: Ansicht",

    menuAdmin:"Administrator",
    adminPassPh:"Admin-Passwort",
    adminLogin:"Als Admin anmelden",
    adminLogout:"Admin abmelden",
    adminOk:"Admin-Modus aktiviert.",
    adminBad:"Falsches Passwort.",
    adminNameOnly:(name)=>`Admin-Zugang nur für Namen: ${name}`,

    rightsAdmin:"Rechte: Anlegen/Bearbeiten/Löschen + globaler Verlauf.",
    rightsUser:"Rechte: Ansicht + Verlauf + Lagerplatz ändern.",

    start:"Kamera starten", stop:"Stop",
    camOff:"Kamera aus", camOn:"Kamera an. Auf Barcode richten…",
    found:"Gefunden", autoOff:"(Kamera wird beendet)",
    scanHint:"Scan: alle — Suche per EAN; Admin füllt zusätzlich das Formular.",

    ean:"Barcode (EAN)", eanPh:"wird automatisch gescannt",
    maker:"Hersteller", makerPh:"z.B. Nexen",
    tireModel:"Modell", tireModelPh:"z.B. WinGuard WT1",
    size:"Größe", sizePh:"z.B. 195/65 R16 104/102T",
    loc:"Lagerplatz", locPh:"z.B. 216",
    qty:"Menge", qtyPh:"z.B. 34",

    save:"Speichern", clear:"Leeren",
    listTitle:"Reifenliste",
    openGlobalHistory:"Globaler Verlauf",
    searchPh:"Suche oder Scan: EAN, Hersteller, Modell, Größe, Lagerplatz",

    group:"Gruppierung",
    groupLoc:"Nach Lagerplatz", groupMaker:"Nach Hersteller", groupNone:"Keine Gruppierung",

    shown:"Angezeigt", nothing:"Keine Treffer.",
    promptSearch:"Bitte zuerst suchen oder Barcode scannen.",
    all:"Alle", noLoc:"Ohne Lagerplatz", noMaker:"Ohne Hersteller",

    hist:"Verlauf", del:"Löschen", open:"Öffnen",
    edit:"Ändern",
    editLocTitle:"Lagerplatz ändern",
    newLoc:"Neuer Lagerplatz",
    cancel:"Abbrechen",
    locUpdated:"Lagerplatz aktualisiert.",

    delConfirm:"Eintrag löschen?",
    noEan:"EAN fehlt.",
    badQty:"Menge muss eine Zahl sein (0 oder mehr).",
    needHttps:"HTTPS erforderlich. Öffne die Seite über https:// ...",
    camFail:"Kamera konnte nicht gestartet werden. Prüfe Kamera-Berechtigung.",
    cantEdit:"Nicht erlaubt (nur Admin).",

    histTitleItem:"Eintragsverlauf",
    histTitleGlobal:"Globaler Aktionsverlauf",
    close:"Schließen",
    created:"Erstellt", updated:"Geändert", deleted:"Gelöscht",
    field:{ maker:"Hersteller", tireModel:"Modell", size:"Größe", loc:"Lagerplatz", qty:"Menge" }
  },
  lv: {
    title:"Riepu uzskaite", home:"Sākums", scan:"Skenēšana",
    pageHome:"Sākumlapa", pageScan:"Skenēšana",
    menuSettings:"Iestatījumi", lang:"Valoda", user:"Lietotājvārds",
    userPh:"Ievadi vārdu", confirm:"Apstiprināt",
    userNeed:"Vispirms ievadi lietotājvārdu.",
    userLocked:"Vārds piesaistīts šai ierīcei.",
    roleAdmin:"Loma: Admin", roleUser:"Loma: Skatīšana",

    menuAdmin:"Administrators",
    adminPassPh:"Admin parole",
    adminLogin:"Ieiet kā admins",
    adminLogout:"Iziet no admina",
    adminOk:"Admin režīms ieslēgts.",
    adminBad:"Nepareiza parole.",
    adminNameOnly:(name)=>`Admin pieeja tikai vārdam: ${name}`,

    rightsAdmin:"Tiesības: pievienot/labot/dzēst + kopējā vēsture.",
    rightsUser:"Tiesības: skatīšana + vēsture + mainīt vietu.",

    start:"Ieslēgt kameru", stop:"Izslēgt",
    camOff:"Kamera izslēgta", camOn:"Kamera ieslēgta. Tēmē uz svītrkodu…",
    found:"Atrasts", autoOff:"(kamera izslēdzas)",
    scanHint:"Skenē: visiem — meklēšana pēc EAN; adminam papildus aizpilda formu.",

    ean:"Svītrkods (EAN)", eanPh:"tiek noskenēts automātiski",
    maker:"Ražotājs", makerPh:"piem. Nexen",
    tireModel:"Modelis", tireModelPh:"piem. WinGuard WT1",
    size:"Izmērs", sizePh:"piem. 195/65 R16 104/102T",
    loc:"Vieta", locPh:"piem. 216",
    qty:"Daudzums", qtyPh:"piem. 34",

    save:"Saglabāt", clear:"Notīrīt",
    listTitle:"Riepu saraksts",
    openGlobalHistory:"Kopējā vēsture",
    searchPh:"Meklē vai skenē: EAN, ražotājs, modelis, izmērs, vieta",

    group:"Grupēšana",
    groupLoc:"Pēc vietas", groupMaker:"Pēc ražotāja", groupNone:"Bez grupēšanas",

    shown:"Parādīts", nothing:"Nav rezultātu.",
    promptSearch:"Vispirms meklē vai noskenē svītrkodu.",
    all:"Visi", noLoc:"Bez vietas", noMaker:"Bez ražotāja",

    hist:"Vēsture", del:"Dzēst", open:"Atvērt",
    edit:"Mainīt",
    editLocTitle:"Mainīt vietu",
    newLoc:"Jaunā vieta",
    cancel:"Atcelt",
    locUpdated:"Vieta atjaunināta.",

    delConfirm:"Dzēst ierakstu?",
    noEan:"Trūkst EAN.",
    badQty:"Daudzumam jābūt skaitlim (0 vai vairāk).",
    needHttps:"Nepieciešams HTTPS. Atver vietni ar https:// ...",
    camFail:"Neizdevās ieslēgt kameru. Pārbaudi kameras atļaujas.",
    cantEdit:"Nav atļauts (tikai admins).",

    histTitleItem:"Ieraksta vēsture",
    histTitleGlobal:"Kopējā darbību vēsture",
    close:"Aizvērt",
    created:"Izveidots", updated:"Mainīts", deleted:"Dzēsts",
    field:{ maker:"Ražotājs", tireModel:"Modelis", size:"Izmērs", loc:"Vieta", qty:"Daudzums" }
  }
};

// fallback RU для отсутствующих ключей
const T = (lng) => ({ ...I18N.ru, ...(I18N[lng] || {}) });

/* ========= State ========= */
let lang = load(STORAGE.lang, "ru"); if (!I18N[lang]) lang = "ru";
let user = load(STORAGE.user, "");
let page = load(STORAGE.page, "home");
let adminMode = load(STORAGE.admin, false);

const now = () => Date.now();
const normEAN = (x) => String(x||"").replace(/\s+/g,"").trim();
const normText = (x) => String(x||"").trim();
const isAdmin = () => (user === ADMIN_NAME) && adminMode;

/* ========= DOM ========= */
const $ = (id) => document.getElementById(id);
const el = {
  uiTitle:$("uiTitle"), pageSubtitle:$("pageSubtitle"),

  menuBtn:$("menuBtn"), menuBack:$("menuBack"), menuPanel:$("menuPanel"),
  menuHome:$("menuHome"), menuScan:$("menuScan"),

  menuSettingsTitle:$("menuSettingsTitle"),
  lblLang:$("lblLang"), lang:$("lang"),
  lblUser:$("lblUser"), username:$("username"), confirmUser:$("confirmUser"),
  userHint:$("userHint"), rolePill:$("rolePill"),

  menuAdminTitle:$("menuAdminTitle"),
  adminPass:$("adminPass"), adminLogin:$("adminLogin"), adminHint:$("adminHint"),

  pageHome:$("pageHome"), pageScan:$("pageScan"),
  scannerCard:$("scannerCard"), formCard:$("formCard"),

  start:$("start"), stop:$("stop"),
  status:$("status"), scanHint:$("scanHint"),

  lblEan:$("lblEan"), ean:$("ean"),
  lblMaker:$("lblMaker"), maker:$("maker"),
  lblTireModel:$("lblTireModel"), tireModel:$("tireModel"),
  lblSize:$("lblSize"), size:$("size"),
  lblLoc:$("lblLoc"), loc:$("loc"),
  lblQty:$("lblQty"), qty:$("qty"),
  save:$("save"), clear:$("clear"),
  rightsHint:$("rightsHint"),

  listTitle:$("listTitle"),
  openGlobalHistory:$("openGlobalHistory"),
  search:$("search"),
  lblGroup:$("lblGroup"), groupBy:$("groupBy"),
  stats:$("stats"), list:$("list"),

  modalBack:$("modalBack"),
  modalTitle:$("modalTitle"),
  modalBody:$("modalBody"),
  modalClose:$("modalClose"),
};

const ensureUser = () => {
  if (user) return true;
  alert(T(lang).userNeed);
  return false;
};

/* ========= Menu/pages ========= */
const openMenu = () => { el.menuBack.style.display="block"; el.menuPanel.style.display="block"; };
const closeMenu = () => { el.menuBack.style.display="none"; el.menuPanel.style.display="none"; };

const setPage = async (next) => {
  page = next; save(STORAGE.page, page);
  const t = T(lang);

  el.pageHome.style.display = (page==="home") ? "" : "none";
  el.pageScan.style.display = (page==="scan") ? "block" : "none";
  el.pageSubtitle.textContent = (page==="home") ? t.pageHome : t.pageScan;

  el.menuHome.classList.toggle("active", page==="home");
  el.menuScan.classList.toggle("active", page==="scan");

  closeMenu();
  if (page !== "scan") await stopCamera().catch(()=>{});
};

/* ========= UI apply ========= */
const applyI18n = () => {
  const t = T(lang);

  el.uiTitle.textContent = t.title;
  el.menuHome.textContent = t.home;
  el.menuScan.textContent = t.scan;

  el.menuSettingsTitle.textContent = t.menuSettings;
  el.lblLang.textContent = t.lang;
  el.lblUser.textContent = t.user;

  el.username.placeholder = t.userPh;
  el.confirmUser.textContent = t.confirm;
  el.userHint.textContent = user ? t.userLocked : t.userNeed;

  el.menuAdminTitle.textContent = t.menuAdmin;
  el.adminPass.placeholder = t.adminPassPh;
  el.adminLogin.textContent = adminMode ? t.adminLogout : t.adminLogin;

  el.start.textContent = t.start;
  el.stop.textContent = t.stop;
  el.status.textContent = scanning ? t.camOn : t.camOff;
  el.scanHint.textContent = t.scanHint;

  el.lblEan.textContent = t.ean; el.ean.placeholder = t.eanPh;
  el.lblMaker.textContent = t.maker; el.maker.placeholder = t.makerPh;
  el.lblTireModel.textContent = t.tireModel; el.tireModel.placeholder = t.tireModelPh;
  el.lblSize.textContent = t.size; el.size.placeholder = t.sizePh;
  el.lblLoc.textContent = t.loc; el.loc.placeholder = t.locPh;
  el.lblQty.textContent = t.qty; el.qty.placeholder = t.qtyPh;

  el.save.textContent = t.save;
  el.clear.textContent = t.clear;

  el.listTitle.textContent = t.listTitle;
  el.openGlobalHistory.textContent = t.openGlobalHistory;
  el.search.placeholder = t.searchPh;

  el.lblGroup.textContent = t.group;
  el.groupBy.options[0].text = t.groupLoc;
  el.groupBy.options[1].text = t.groupMaker;
  el.groupBy.options[2].text = t.groupNone;

  el.modalClose.textContent = t.close;
};

const applyAccessVisibility = () => {
  const t = T(lang);

  el.scannerCard.style.display = "";                 // всем
  el.formCard.style.display = isAdmin() ? "" : "none";
  el.openGlobalHistory.style.display = isAdmin() ? "" : "none";

  el.rolePill.style.display = user ? "" : "none";
  el.rolePill.textContent = isAdmin() ? t.roleAdmin : t.roleUser;

  el.rightsHint.textContent = user ? (isAdmin() ? t.rightsAdmin : t.rightsUser) : "";
  el.adminHint.textContent = isAdmin() ? t.adminOk : "";
};

const initMenuUserUI = () => {
  el.lang.value = lang;
  if (user) {
    el.username.value = user;
    el.username.disabled = true;
    el.confirmUser.disabled = true;
  } else {
    el.username.value = "";
    el.username.disabled = false;
    el.confirmUser.disabled = false;
  }
};

/* ========= Modal ========= */
const openModal = (title, html) => {
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = html;
  el.modalBack.style.display = "flex";
};
const closeModal = () => {
  el.modalBack.style.display = "none";
  el.modalBody.innerHTML = "";
};

/* ========= Firebase live ========= */
let firestore, auth;
let tires = [];
let globalHistory = [];

const bootFirebase = async () => {
  if (!firebaseConfig?.apiKey) throw new Error("firebaseConfig пустой. Проверь firebase-config.js");

  const app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  auth = getAuth(app);
  await signInAnonymously(auth);

  const qTires = query(collection(firestore, "tires"), orderBy("updatedAt", "desc"));
  onSnapshot(qTires, (snap) => {
    tires = snap.docs.map(d => d.data());
    renderList();
  });

  const qHist = query(collection(firestore, "globalHistory"), orderBy("ts", "desc"));
  onSnapshot(qHist, (snap) => {
    globalHistory = snap.docs.map(d => d.data());
  });
};

/* ========= History ========= */
const renderHistoryEntries = (entries, labelFn) => {
  const t = T(lang);
  if (!entries.length) return `<div class="muted">${t.nothing}</div>`;
  return entries.map(h => {
    const ts = new Date(h.ts || now()).toLocaleString();
    const label = labelFn(h);
    const lines = (h.changes && h.changes.length)
      ? h.changes.map(c => {
          const name = (t.field && t.field[c.field]) ? t.field[c.field] : c.field;
          return `<div class="histLine">${name}: ${c.from} → ${c.to}</div>`;
        }).join("")
      : `<div class="histLine">—</div>`;
    return `<div class="histItem"><div class="histMeta">${ts} • ${h.user || "—"} • ${label}</div>${lines}</div>`;
  }).join("");
};

const showItemHistory = (ean) => {
  const t = T(lang);
  const it = tires.find(x => x.ean === ean);
  const entries = (it && Array.isArray(it.history)) ? it.history : [];
  const html = renderHistoryEntries(entries, (h) => (h.type === "create") ? t.created : t.updated);
  openModal(`${t.histTitleItem}: ${ean}`, html);
};

const showGlobalHistory = () => {
  if (!isAdmin()) return;
  const t = T(lang);
  const html = renderHistoryEntries(globalHistory, (h) => {
    if (h.action === "create") return t.created;
    if (h.action === "delete") return t.deleted;
    return t.updated;
  }).replaceAll(`<div class="histLine">—</div>`, "");
  openModal(t.histTitleGlobal, html || `<div class="muted">${t.nothing}</div>`);
};

/* ========= Camera ========= */
let scanner = null;
let scanning = false;
let lastScan = "";

const clearForm = ({ keepEAN=false } = {}) => {
  const keep = el.ean.value;
  el.ean.value = keepEAN ? keep : "";
  el.maker.value = "";
  el.tireModel.value = "";
  el.size.value = "";
  el.loc.value = "";
  el.qty.value = "";
};

const stopCamera = async () => {
  if (scanner && scanning) {
    try { await scanner.stop(); } catch {}
    try { await scanner.clear(); } catch {}
  }
  scanner = null;
  scanning = false;
  el.start.disabled = false;
  el.stop.disabled = true;
  el.status.textContent = T(lang).camOff;
};

const startCamera = async () => {
  const t = T(lang);
  if (!ensureUser()) return;
  if (!window.isSecureContext) { alert(t.needHttps); return; }

  if (isAdmin()) clearForm({ keepEAN:false });

  try {
    await stopCamera().catch(()=>{});
    scanner = new Html5Qrcode("reader");
    lastScan = "";
    scanning = true;

    el.start.disabled = true;
    el.stop.disabled = false;
    el.status.textContent = t.camOn;

    await scanner.start(
      { facingMode:"environment" },
      { fps:12, qrbox:{ width:260, height:160 }, experimentalFeatures:{ useBarCodeDetectorIfSupported:false } },
      async (text) => {
        const v = normEAN(text);
        if (!v || v === lastScan) return;
        lastScan = v;

        el.search.value = v;
        renderList();

        if (isAdmin()) {
          el.ean.value = v;
          el.maker.value = "";
          el.tireModel.value = "";
          el.size.value = "";
          el.loc.value = "";
          el.qty.value = "";
          el.maker.focus();
        }

        el.status.textContent = `${t.found}: ${v} ${t.autoOff}`;
        await stopCamera();
        el.list.scrollIntoView({ behavior:"smooth", block:"start" });
      },
      () => {}
    );
  } catch (e) {
    console.error(e);
    alert(t.camFail);
    await stopCamera();
  }
};

/* ========= Writes ========= */
const diffItem = (prev, next) => {
  const fields = ["maker","tireModel","size","loc","qty"];
  const changes = [];
  for (const f of fields) {
    const a = (f==="qty") ? Number(prev[f] ?? 0) : String(prev[f]||"");
    const b = (f==="qty") ? Number(next[f] ?? 0) : String(next[f]||"");
    if (String(a) !== String(b)) changes.push({ field:f, from:a, to:b });
  }
  return changes;
};

const pushGlobalHistory = async (action, ean, changes) => {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  await setDoc(doc(firestore, "globalHistory", id), { ts: now(), user, action, ean, changes: changes || [] });
};

// ADMIN full save
const upsertItemFromForm = async () => {
  const t = T(lang);
  if (!ensureUser()) return;
  if (!isAdmin()) { alert(t.cantEdit); return; }

  const ean = normEAN(el.ean.value);
  if (!ean) { alert(t.noEan); return; }

  const qty = Number(el.qty.value || 0);
  if (!Number.isFinite(qty) || qty < 0) { alert(t.badQty); return; }

  const prev = tires.find(x => x.ean === ean);

  const next = {
    ean,
    maker: normText(el.maker.value),
    tireModel: normText(el.tireModel.value),
    size: normText(el.size.value),
    loc: normText(el.loc.value),
    qty,
    createdAt: prev?.createdAt || now(),
    updatedAt: now(),
    history: Array.isArray(prev?.history) ? prev.history : [],
  };

  if (!prev) {
    next.history.unshift({ type:"create", user, ts: now(), changes: [] });
    await pushGlobalHistory("create", ean, []);
  } else {
    const changes = diffItem(prev, next);
    if (changes.length) {
      next.history.unshift({ type:"update", user, ts: now(), changes });
      await pushGlobalHistory("update", ean, changes);
    }
  }

  await setDoc(doc(firestore, "tires", ean), next);
  clearForm({ keepEAN:false });
  el.ean.focus();
};

// USER (and admin) can change location
const updateLocationOnly = async (ean, newLoc) => {
  const t = T(lang);
  if (!ensureUser()) return;

  const prev = tires.find(x => x.ean === ean);
  if (!prev) return;

  const locTo = normText(newLoc);
  const locFrom = String(prev.loc || "");

  if (locTo === locFrom) return;

  const changes = [{ field:"loc", from: locFrom || "—", to: locTo || "—" }];

  const next = {
    ...prev,
    loc: locTo,
    updatedAt: now(),
    history: Array.isArray(prev.history) ? prev.history.slice() : [],
  };

  next.history.unshift({ type:"update", user, ts: now(), changes });

  await setDoc(doc(firestore, "tires", ean), next);
  await pushGlobalHistory("update", ean, changes);
};

const deleteItem = async (ean) => {
  const t = T(lang);
  if (!ensureUser()) return;
  if (!isAdmin()) { alert(t.cantEdit); return; }
  if (!confirm(t.delConfirm)) return;

  await deleteDoc(doc(firestore, "tires", ean));
  await pushGlobalHistory("delete", ean, []);
};

const fillFormFromItem = (it) => {
  el.ean.value = it.ean || "";
  el.maker.value = it.maker || "";
  el.tireModel.value = it.tireModel || "";
  el.size.value = it.size || "";
  el.loc.value = it.loc || "";
  el.qty.value = String(it.qty ?? "");
  window.scrollTo({ top:0, behavior:"smooth" });
};

/* ========= List ========= */
const filterItems = (items) => {
  const q = normText(el.search.value).toLowerCase();
  if (!q) return [];
  return items.filter(x =>
    String(x.ean||"").toLowerCase().includes(q) ||
    String(x.maker||"").toLowerCase().includes(q) ||
    String(x.tireModel||"").toLowerCase().includes(q) ||
    String(x.size||"").toLowerCase().includes(q) ||
    String(x.loc||"").toLowerCase().includes(q)
  );
};

const groupItems = (items, mode) => {
  const t = T(lang);
  if (mode==="none") return { [t.all]: items };
  const map = new Map();
  for (const it of items) {
    const key = (mode==="maker")
      ? (normText(it.maker) || t.noMaker)
      : (normText(it.loc) || t.noLoc);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  const keys = Array.from(map.keys()).sort((a,b)=>String(a).localeCompare(String(b),"ru"));
  const out = {};
  for (const k of keys) out[k] = map.get(k);
  return out;
};

const openEditLocModal = (it) => {
  const t = T(lang);
  const ean = it.ean;

  openModal(`${t.editLocTitle}: ${ean}`, `
    <label>${t.newLoc}</label>
    <input id="editLocInput" value="${String(it.loc || "")}" />
    <div class="row" style="margin-top:12px;">
      <div class="col"><button id="editLocSave" class="primary" style="margin-top:0;">${t.save}</button></div>
      <div class="col"><button id="editLocCancel" class="ghost" style="margin-top:0;">${t.cancel}</button></div>
    </div>
  `);

  // навешиваем обработчики после вставки HTML
  const inp = document.getElementById("editLocInput");
  const btnSave = document.getElementById("editLocSave");
  const btnCancel = document.getElementById("editLocCancel");

  btnCancel.onclick = () => closeModal();
  btnSave.onclick = async () => {
    const val = inp.value;
    try {
      await updateLocationOnly(ean, val);
      closeModal();
      // небольшое сообщение
      el.stats.textContent = t.locUpdated;
      setTimeout(()=>renderList(), 200);
    } catch (e) {
      showErr(e?.stack || e);
    }
  };

  setTimeout(()=>inp?.focus(), 50);
};

const itemCard = (it) => {
  const t = T(lang);
  const head = [it.maker, it.tireModel].filter(Boolean).join(" ") || "—";
  const wrap = document.createElement("div");
  wrap.className = "item";
  wrap.innerHTML = `
    <b>${head}</b>
    <div class="small" style="margin-top:6px;">${t.size}: ${it.size ? it.size : "—"}</div>
    <div class="mono" style="margin-top:6px;">${it.ean}</div>
    <div style="margin-top:8px;">
      <span class="badge">${t.loc}: <b>${it.loc || "-"}</b></span>
      <span class="badge">${t.qty}: <b>${Number.isFinite(it.qty) ? it.qty : 0}</b></span>
    </div>
  `;

  const btnRow = document.createElement("div");
  btnRow.className = "row";
  btnRow.style.marginTop = "10px";
  btnRow.style.gap = "8px";

  const histBtn = document.createElement("button");
  histBtn.className = "ghost";
  histBtn.style.marginTop = "0";
  histBtn.textContent = t.hist;
  histBtn.onclick = () => showItemHistory(it.ean);

  // КНОПКА ИЗМЕНИТЬ — всем пользователям (и админу тоже можно)
  const editBtn = document.createElement("button");
  editBtn.className = "primary";
  editBtn.style.marginTop = "0";
  editBtn.textContent = t.edit;
  editBtn.onclick = () => openEditLocModal(it);

  if (isAdmin()) {
    const openBtn = document.createElement("button");
    openBtn.className = "ghost";
    openBtn.style.marginTop = "0";
    openBtn.textContent = t.open;
    openBtn.onclick = () => fillFormFromItem(it);

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.style.marginTop = "0";
    delBtn.textContent = t.del;
    delBtn.onclick = () => deleteItem(it.ean);

    const c1 = document.createElement("div"); c1.className = "col"; c1.appendChild(openBtn);
    const c2 = document.createElement("div"); c2.className = "col"; c2.appendChild(histBtn);
    const c3 = document.createElement("div"); c3.className = "col"; c3.appendChild(editBtn);
    const c4 = document.createElement("div"); c4.className = "col"; c4.appendChild(delBtn);
    btnRow.appendChild(c1); btnRow.appendChild(c2); btnRow.appendChild(c3); btnRow.appendChild(c4);
  } else {
    const c1 = document.createElement("div"); c1.className = "col"; c1.appendChild(histBtn);
    const c2 = document.createElement("div"); c2.className = "col"; c2.appendChild(editBtn);
    btnRow.appendChild(c1); btnRow.appendChild(c2);
  }

  wrap.appendChild(btnRow);
  return wrap;
};

const renderList = () => {
  const t = T(lang);
  const filtered = filterItems(tires.slice()); // порядок берём из Firestore (updatedAt desc)
  const q = normText(el.search.value);
  el.stats.textContent = q ? `${t.shown}: ${filtered.length}` : "";

  el.list.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = q ? t.nothing : (t.promptSearch || t.nothing);
    el.list.appendChild(empty);
    return;
  }

  const grouped = groupItems(filtered, el.groupBy.value);
  if (el.groupBy.value === "none") {
    const items = grouped[t.all] || filtered;
    for (const it of items) el.list.appendChild(itemCard(it));
    return;
  }

  for (const [gname, items] of Object.entries(grouped)) {
    const det = document.createElement("details");
    det.className = "group";
    det.open = true;

    const sum = document.createElement("summary");
    sum.textContent = `${gname} • ${items.length}`;
    det.appendChild(sum);

    const body = document.createElement("div");
    body.className = "groupBody";
    for (const it of items) body.appendChild(itemCard(it));

    det.appendChild(body);
    el.list.appendChild(det);
  }
};

/* ========= Events ========= */
const bindEvents = () => {
  el.menuBtn.addEventListener("click", openMenu);
  el.menuBack.addEventListener("click", closeMenu);
  el.menuHome.addEventListener("click", () => setPage("home"));
  el.menuScan.addEventListener("click", () => setPage("scan"));

  el.lang.addEventListener("change", () => {
    lang = el.lang.value;
    save(STORAGE.lang, lang);
    applyI18n();
    applyAccessVisibility();
    renderList();
    setPage(page);
  });

  el.confirmUser.addEventListener("click", () => {
    const v = normText(el.username.value);
    if (!v) { alert(T(lang).userNeed); return; }
    save(STORAGE.user, v);
    location.reload();
  });

  el.adminLogin.addEventListener("click", () => {
    const t = T(lang);
    if (!ensureUser()) return;

    if (adminMode) {
      adminMode = false;
      save(STORAGE.admin, adminMode);
      el.adminPass.value = "";
      applyI18n(); applyAccessVisibility(); renderList();
      return;
    }

    const p = String(el.adminPass.value || "");
    if (p !== ADMIN_PASSWORD) { el.adminHint.textContent = t.adminBad; return; }
    if (user !== ADMIN_NAME) { el.adminHint.textContent = t.adminNameOnly(ADMIN_NAME); return; }

    adminMode = true;
    save(STORAGE.admin, adminMode);
    el.adminHint.textContent = t.adminOk;
    applyI18n(); applyAccessVisibility(); renderList();
  });

  el.start.addEventListener("click", startCamera);
  el.stop.addEventListener("click", stopCamera);

  el.clear.addEventListener("click", () => { clearForm({ keepEAN:false }); el.ean.focus(); });
  el.save.addEventListener("click", upsertItemFromForm);

  el.openGlobalHistory.addEventListener("click", showGlobalHistory);

  el.search.addEventListener("input", renderList);
  el.groupBy.addEventListener("change", renderList);

  el.modalClose.addEventListener("click", closeModal);
  el.modalBack.addEventListener("click", (e) => { if (e.target === el.modalBack) closeModal(); });
};

/* ========= Boot ========= */
const boot = async () => {
  initMenuUserUI();
  applyI18n();
  applyAccessVisibility();

  if (page !== "home" && page !== "scan") page = "home";
  await setPage(page);

  bindEvents();
  renderList();

  try {
    await bootFirebase();
  } catch(e) {
    showErr(e?.stack || e);
  }
};

boot();
