import { firebaseConfig, ADMIN_UI_PASSWORD } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ==============================
   Firebase init
============================== */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fs = getFirestore(app);

/* ==============================
   Config / storage (local only for UI prefs)
============================== */
const STORAGE = {
  lang: "tires_lang_pub_v1",
  user: "tires_user_fixed_pub_v1",
  page: "tires_page_pub_v1",
  adminUnlocked: "tires_admin_unlock_pub_v1"
};

function loadJSON(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

/* ==============================
   i18n
============================== */
const I18N = {
  ru: {
    title: "Учёт шин",
    home: "Дом",
    scan: "Сканирование",
    pageHome: "Главная",
    pageScan: "Сканирование",

    lblLang: "Язык",
    lblUser: "Имя пользователя",
    confirm: "Подтвердить",
    userNeed: "Сначала введи имя пользователя.",
    userLocked: "Имя закреплено за этим устройством.",

    lblAdminPass: "Пароль администратора",
    adminUnlock: "Включить админ-режим",
    adminUnlocked: "Админ-режим включён на этом устройстве.",
    adminWrong: "Неверный пароль.",
    adminUidNeed: "UID не добавлен в список админов (Firestore /admins).",

    start: "Сканировать",
    stop: "Остановить",
    camOff: "Камера выключена",
    camOn: "Камера включена. Наведи на штрих-код…",
    found: "Найдено",
    autoOff: "(камера выключается)",
    scanHint: "Скан ищет позицию по EAN. Админу дополнительно заполняет форму.",

    ean: "Штрих-код (EAN)",
    eanPh: "сканируется автоматически",
    maker: "Марка",
    makerPh: "например Nexen",
    tireModel: "Модель",
    tireModelPh: "например WinGuard WT1",
    size: "Размер",
    sizePh: "например 195/65 R16 104/102T",
    loc: "Локация",
    locPh: "например 216",
    qty: "Кол-во",
    qtyPh: "например 34",

    save: "Сохранить",
    clear: "Очистить",

    listTitle: "Список шин",
    openGlobalHistory: "Общая история (админ)",
    searchPh: "Поиск или EAN после скана",

    group: "Группировка",
    sort: "Сортировка",
    groupLoc: "По локации",
    groupMaker: "По марке",
    groupNone: "Без группировки",

    sortNew: "Сначала новые",
    sortOld: "Сначала старые",
    sortQty: "Кол-во ↓",
    sortLoc: "Локация A→Z",
    sortMaker: "Марка A→Z",
    sortModel: "Модель A→Z",

    shown: "Показано",
    nothing: "Ничего не найдено.",
    promptSearch: "Введите поиск или отсканируйте штрих-код.",
    all: "Все",
    noLoc: "Без локации",
    noMaker: "Без марки",

    hist: "История",
    del: "Удалить",
    open: "Открыть",

    delConfirm: "Удалить запись?",
    noEan: "Нет EAN (штрих-кода).",
    badQty: "Кол-во должно быть числом (0 или больше).",
    needHttps: "Нужно HTTPS (GitHub Pages). Открой https://…",
    camFail: "Не удалось включить камеру. Проверь разрешение: Настройки → Safari → Камера.",

    histTitleItem: "История позиции",
    histTitleGlobal: "Общая история действий",
    close: "Закрыть",
    created: "Создано",
    updated: "Изменено",
    deleted: "Удалено",
    field: { maker:"Марка", tireModel:"Модель", size:"Размер", loc:"Локация", qty:"Кол-во" }
  },

  de: {
    title: "Reifenverwaltung",
    home: "Start",
    scan: "Scannen",
    pageHome: "Startseite",
    pageScan: "Scannen",

    lblLang: "Sprache",
    lblUser: "Benutzername",
    confirm: "Bestätigen",
    userNeed: "Bitte zuerst einen Benutzernamen eingeben.",
    userLocked: "Name ist an dieses Gerät gebunden.",

    lblAdminPass: "Admin-Passwort",
    adminUnlock: "Admin-Modus aktivieren",
    adminUnlocked: "Admin-Modus ist auf diesem Gerät aktiv.",
    adminWrong: "Falsches Passwort.",
    adminUidNeed: "UID ist nicht in /admins freigeschaltet (Firestore).",

    start: "Scannen",
    stop: "Stop",
    camOff: "Kamera aus",
    camOn: "Kamera an. Auf Barcode richten…",
    found: "Gefunden",
    autoOff: "(Kamera wird beendet)",
    scanHint: "Scan sucht per EAN. Admin füllt zusätzlich das Formular.",

    ean: "Barcode (EAN)",
    eanPh: "wird automatisch gescannt",
    maker: "Hersteller",
    makerPh: "z. B. Nexen",
    tireModel: "Modell",
    tireModelPh: "z. B. WinGuard WT1",
    size: "Größe",
    sizePh: "z. B. 195/65 R16 104/102T",
    loc: "Lagerplatz",
    locPh: "z. B. 216",
    qty: "Menge",
    qtyPh: "z. B. 34",

    save: "Speichern",
    clear: "Leeren",

    listTitle: "Reifenliste",
    openGlobalHistory: "Globaler Verlauf (Admin)",
    searchPh: "Suche oder EAN nach Scan",

    group: "Gruppierung",
    sort: "Sortierung",
    groupLoc: "Nach Lagerplatz",
    groupMaker: "Nach Hersteller",
    groupNone: "Keine Gruppierung",

    sortNew: "Neueste zuerst",
    sortOld: "Älteste zuerst",
    sortQty: "Menge ↓",
    sortLoc: "Lagerplatz A→Z",
    sortMaker: "Hersteller A→Z",
    sortModel: "Modell A→Z",

    shown: "Angezeigt",
    nothing: "Keine Treffer.",
    promptSearch: "Bitte suchen oder Barcode scannen.",
    all: "Alle",
    noLoc: "Ohne Lagerplatz",
    noMaker: "Ohne Hersteller",

    hist: "Verlauf",
    del: "Löschen",
    open: "Öffnen",

    delConfirm: "Eintrag löschen?",
    noEan: "EAN fehlt.",
    badQty: "Menge muss eine Zahl sein (0 oder mehr).",
    needHttps: "HTTPS erforderlich (GitHub Pages). Öffne https://…",
    camFail: "Kamera konnte nicht gestartet werden. Prüfe: Einstellungen → Safari → Kamera.",

    histTitleItem: "Eintragsverlauf",
    histTitleGlobal: "Globaler Aktionsverlauf",
    close: "Schließen",
    created: "Erstellt",
    updated: "Geändert",
    deleted: "Gelöscht",
    field: { maker:"Hersteller", tireModel:"Modell", size:"Größe", loc:"Lagerplatz", qty:"Menge" }
  },

  lv: {
    title: "Riepu uzskaite",
    home: "Sākums",
    scan: "Skenēšana",
    pageHome: "Sākumlapa",
    pageScan: "Skenēšana",

    lblLang: "Valoda",
    lblUser: "Lietotājvārds",
    confirm: "Apstiprināt",
    userNeed: "Vispirms ievadi lietotājvārdu.",
    userLocked: "Vārds piesaistīts šai ierīcei.",

    lblAdminPass: "Admin parole",
    adminUnlock: "Ieslēgt admin režīmu",
    adminUnlocked: "Admin režīms ieslēgts šajā ierīcē.",
    adminWrong: "Nepareiza parole.",
    adminUidNeed: "UID nav atļauts /admins (Firestore).",

    start: "Skenēt",
    stop: "Stop",
    camOff: "Kamera izslēgta",
    camOn: "Kamera ieslēgta. Tēmē uz svītrkodu…",
    found: "Atrasts",
    autoOff: "(kamera izslēdzas)",
    scanHint: "Skenēšana meklē pēc EAN. Adminam papildus aizpilda formu.",

    ean: "Svītrkods (EAN)",
    eanPh: "tiek noskenēts automātiski",
    maker: "Ražotājs",
    makerPh: "piem. Nexen",
    tireModel: "Modelis",
    tireModelPh: "piem. WinGuard WT1",
    size: "Izmērs",
    sizePh: "piem. 195/65 R16 104/102T",
    loc: "Vieta",
    locPh: "piem. 216",
    qty: "Daudzums",
    qtyPh: "piem. 34",

    save: "Saglabāt",
    clear: "Notīrīt",

    listTitle: "Riepu saraksts",
    openGlobalHistory: "Kopējā vēsture (Admin)",
    searchPh: "Meklēšana vai EAN pēc skenējuma",

    group: "Grupēšana",
    sort: "Kārtošana",
    groupLoc: "Pēc vietas",
    groupMaker: "Pēc ražotāja",
    groupNone: "Bez grupēšanas",

    sortNew: "Jaunākie vispirms",
    sortOld: "Vecākie vispirms",
    sortQty: "Daudzums ↓",
    sortLoc: "Vieta A→Z",
    sortMaker: "Ražotājs A→Z",
    sortModel: "Modelis A→Z",

    shown: "Parādīts",
    nothing: "Nav rezultātu.",
    promptSearch: "Lūdzu, meklē vai noskenē svītrkodu.",
    all: "Visi",
    noLoc: "Bez vietas",
    noMaker: "Bez ražotāja",

    hist: "Vēsture",
    del: "Dzēst",
    open: "Atvērt",

    delConfirm: "Dzēst ierakstu?",
    noEan: "Trūkst EAN.",
    badQty: "Daudzumam jābūt skaitlim (0 vai vairāk).",
    needHttps: "Nepieciešams HTTPS (GitHub Pages). Atver https://…",
    camFail: "Neizdevās ieslēgt kameru. Pārbaudi: Iestatījumi → Safari → Kamera.",

    histTitleItem: "Ieraksta vēsture",
    histTitleGlobal: "Kopējā darbību vēsture",
    close: "Aizvērt",
    created: "Izveidots",
    updated: "Mainīts",
    deleted: "Dzēsts",
    field: { maker:"Ražotājs", tireModel:"Modelis", size:"Izmērs", loc:"Vieta", qty:"Daudzums" }
  }
};

/* ==============================
   State
============================== */
let lang = loadJSON(STORAGE.lang, "ru");
if (!I18N[lang]) lang = "ru";

let userName = loadJSON(STORAGE.user, "");
let page = loadJSON(STORAGE.page, "home"); // home|scan

let adminUnlocked = loadJSON(STORAGE.adminUnlocked, false);

let uid = "";
let isAdminUid = false;

let db = [];              // items from Firestore
let globalHistory = [];   // history from Firestore (admin only)

let scanner = null;
let scanning = false;
let lastScan = "";

/* ==============================
   DOM
============================== */
const $ = (id) => document.getElementById(id);
const el = {
  uiTitle: $("uiTitle"),
  pageSubtitle: $("pageSubtitle"),
  topStatus: $("topStatus"),

  // menu
  menuBtn: $("menuBtn"),
  menuBack: $("menuBack"),
  menuPanel: $("menuPanel"),
  menuHome: $("menuHome"),
  menuScan: $("menuScan"),

  lblLang: $("lblLang"),
  lang: $("lang"),

  lblUser: $("lblUser"),
  username: $("username"),
  confirmUser: $("confirmUser"),
  userHint: $("userHint"),

  adminBox: $("adminBox"),
  lblAdminPass: $("lblAdminPass"),
  adminPass: $("adminPass"),
  adminUnlock: $("adminUnlock"),
  adminHint: $("adminHint"),

  uidLine: $("uidLine"),

  // pages
  pageHome: $("pageHome"),
  pageScan: $("pageScan"),

  // scanner
  start: $("start"),
  stop: $("stop"),
  status: $("status"),
  scanHint: $("scanHint"),

  // form
  formCard: $("formCard"),
  lblEan: $("lblEan"),
  ean: $("ean"),
  lblMaker: $("lblMaker"),
  maker: $("maker"),
  lblTireModel: $("lblTireModel"),
  tireModel: $("tireModel"),
  lblSize: $("lblSize"),
  size: $("size"),
  lblLoc: $("lblLoc"),
  loc: $("loc"),
  lblQty: $("lblQty"),
  qty: $("qty"),
  save: $("save"),
  clear: $("clear"),
  rightsHint: $("rightsHint"),

  // list
  listTitle: $("listTitle"),
  openGlobalHistory: $("openGlobalHistory"),
  search: $("search"),
  lblGroup: $("lblGroup"),
  groupBy: $("groupBy"),
  lblSort: $("lblSort"),
  sortBy: $("sortBy"),
  stats: $("stats"),
  list: $("list"),

  // modal
  modalBack: $("modalBack"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  modalClose: $("modalClose")
};

function T(){ return I18N[lang]; }
function normEAN(x){ return String(x||"").replace(/\s+/g,"").trim(); }
function normText(x){ return String(x||"").trim(); }
function nowMs(){ return Date.now(); }

function ensureUser(){
  if (userName) return true;
  alert(T().userNeed);
  return false;
}

function effectiveAdmin(){
  // реальные права = UID в /admins
  // интерфейс админа включается только если пароль введён
  return isAdminUid && adminUnlocked;
}

/* ==============================
   Menu / Pages
============================== */
function openMenu(){ el.menuBack.style.display="block"; el.menuPanel.style.display="block"; }
function closeMenu(){ el.menuBack.style.display="none"; el.menuPanel.style.display="none"; }

function setPage(next){
  page = next;
  saveJSON(STORAGE.page, page);

  el.pageHome.style.display = (page==="home") ? "" : "none";
  el.pageScan.style.display = (page==="scan") ? "block" : "none";
  el.pageSubtitle.textContent = (page==="home") ? T().pageHome : T().pageScan;

  el.menuHome.classList.toggle("active", page==="home");
  el.menuScan.classList.toggle("active", page==="scan");

  closeMenu();
  if (page!=="scan") stopCamera().catch(()=>{});
}

/* ==============================
   i18n apply
============================== */
function applyI18n(){
  const t = T();
  el.uiTitle.textContent = t.title;

  el.menuHome.textContent = t.home;
  el.menuScan.textContent = t.scan;

  el.lblLang.textContent = t.lblLang;
  el.lang.value = lang;

  el.lblUser.textContent = t.lblUser;
  el.username.placeholder = t.userPh;
  el.confirmUser.textContent = t.confirm;

  el.lblAdminPass.textContent = t.lblAdminPass;
  el.adminUnlock.textContent = t.adminUnlock;

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
  el.lblSort.textContent = t.sort;

  el.groupBy.options[0].text = t.groupLoc;
  el.groupBy.options[1].text = t.groupMaker;
  el.groupBy.options[2].text = t.groupNone;

  el.sortBy.options[0].text = t.sortNew;
  el.sortBy.options[1].text = t.sortOld;
  el.sortBy.options[2].text = t.sortQty;
  el.sortBy.options[3].text = t.sortLoc;
  el.sortBy.options[4].text = t.sortMaker;
  el.sortBy.options[5].text = t.sortModel;

  el.modalClose.textContent = t.close;
  el.pageSubtitle.textContent = (page==="home") ? t.pageHome : t.pageScan;
}

/* ==============================
   Visibility
============================== */
function applyAccessVisibility(){
  // форма только если effectiveAdmin()
  el.formCard.style.display = effectiveAdmin() ? "" : "none";
  // общая история только админ
  el.openGlobalHistory.style.display = effectiveAdmin() ? "" : "none";

  // блок ввода пароля показываем всем, но подсказка разная
  el.adminBox.style.display = isAdminUid ? "" : "none";

  // статус сверху
  const parts = [];
  if (!userName) parts.push("—");
  else parts.push(userName);
  if (effectiveAdmin()) parts.push("ADMIN");
  el.topStatus.textContent = parts.join(" • ");

  // подсказки
  if (!userName) el.userHint.textContent = T().userNeed;
  else el.userHint.textContent = T().userLocked;

  el.uidLine.textContent = uid ? `UID: ${uid}` : "";
}

/* ==============================
   Firestore realtime
============================== */
function subscribeItems(){
  const qy = query(collection(fs, "items"), orderBy("updatedAt", "desc"));
  onSnapshot(qy, (snap) => {
    db = snap.docs.map(d => ({ ean: d.id, ...d.data() }));
    renderList();
  });
}

function subscribeGlobalHistory(){
  if (!effectiveAdmin()) return;
  const qy = query(collection(fs, "history"), orderBy("ts", "desc"));
  onSnapshot(qy, (snap) => {
    globalHistory = snap.docs.map(d => d.data());
  });
}

/* ==============================
   History helpers (UI)
============================== */
function openModal(title, html){
  el.modalTitle.textContent = title;
  el.modalBody.innerHTML = html;
  el.modalBack.style.display = "flex";
}
function closeModal(){
  el.modalBack.style.display = "none";
  el.modalBody.innerHTML = "";
}

function renderHistoryEntries(entries, labelFn){
  if (!entries.length) return `<div class="muted">${T().nothing}</div>`;
  return entries.map(h => {
    const ts = new Date(h.tsMs || nowMs()).toLocaleString();
    const label = labelFn(h);
    const lines = (h.changes && h.changes.length)
      ? h.changes.map(c => {
          const name = (T().field && T().field[c.field]) ? T().field[c.field] : c.field;
          return `<div class="histLine">${name}: ${c.from} → ${c.to}</div>`;
        }).join("")
      : `<div class="histLine">—</div>`;
    return `<div class="histItem"><div class="histMeta">${ts} • ${h.user || "—"} • ${label}</div>${lines}</div>`;
  }).join("");
}

async function showItemHistory(ean){
  // читаем историю по позиции из коллекции history (фильтром на клиенте — для простоты)
  const entries = globalHistory.filter(h => h.ean === ean && h.scope === "item");
  const html = renderHistoryEntries(entries, (h) => h.action === "create" ? T().created : (h.action === "delete" ? T().deleted : T().updated));
  openModal(`${T().histTitleItem}: ${ean}`, html);
}

function showGlobalHistory(){
  if (!effectiveAdmin()) return;
  const entries = globalHistory.filter(h => h.scope === "global");
  const html = renderHistoryEntries(entries, (h) => h.action === "create" ? T().created : (h.action === "delete" ? T().deleted : T().updated));
  openModal(T().histTitleGlobal, html);
}

function diffItem(prev, next){
  const fields = ["maker","tireModel","size","loc","qty"];
  const changes = [];
  for (const f of fields) {
    const a = (f==="qty") ? Number(prev[f] ?? 0) : String(prev[f]||"");
    const b = (f==="qty") ? Number(next[f] ?? 0) : String(next[f]||"");
    if (String(a) !== String(b)) changes.push({ field:f, from:a, to:b });
  }
  return changes;
}

async function pushHistory({ scope, action, ean, changes }){
  // history: одна общая коллекция, чтобы всем было видно
  await addDoc(collection(fs, "history"), {
    scope, action, ean,
    changes: changes || [],
    user: userName || "",
    uid: uid || "",
    ts: serverTimestamp(),
    tsMs: nowMs()
  });
}

/* ==============================
   Camera
============================== */
function clearForm({ keepEAN=false } = {}){
  const keep = el.ean.value;
  el.ean.value = keepEAN ? keep : "";
  el.maker.value = "";
  el.tireModel.value = "";
  el.size.value = "";
  el.loc.value = "";
  el.qty.value = "";
}

async function stopCamera(){
  if (scanner && scanning) {
    try { await scanner.stop(); } catch {}
    try { await scanner.clear(); } catch {}
  }
  scanner = null;
  scanning = false;
  el.start.disabled = false;
  el.stop.disabled = true;
  el.status.textContent = T().camOff;
}

async function startCamera(){
  if (!ensureUser()) return;
  if (!window.isSecureContext) { alert(T().needHttps); return; }

  // если камера уже запущена — перезапуск
  await stopCamera();

  // для админа: очистить форму перед новым сканом
  if (effectiveAdmin()) clearForm({ keepEAN:false });

  try {
    scanner = new Html5Qrcode("reader");
    lastScan = "";
    scanning = true;

    el.start.disabled = true;
    el.stop.disabled = false;
    el.status.textContent = T().camOn;

    await scanner.start(
      { facingMode: "environment" },
      { fps: 12, qrbox: { width: 260, height: 160 }, experimentalFeatures:{ useBarCodeDetectorIfSupported:false } },
      async (text) => {
        const v = normEAN(text);
        if (!v || v === lastScan) return;
        lastScan = v;

        // ВСЕМ: поиск по EAN
        el.search.value = v;
        renderList();

        // АДМИНУ: заполняем поле EAN в форме (дальше вводит руками)
        if (effectiveAdmin()) {
          el.ean.value = v;
          el.maker.focus();
        }

        el.status.textContent = `${T().found}: ${v} ${T().autoOff}`;

        // автозакрытие
        await stopCamera();

        // прокрутка к списку
        el.list.scrollIntoView({ behavior:"smooth", block:"start" });
      },
      () => {}
    );
  } catch (e) {
    console.error(e);
    alert(T().camFail);
    await stopCamera();
  }
}

/* ==============================
   Admin actions (Firestore)
============================== */
async function upsertItemFromForm(){
  if (!ensureUser()) return;
  if (!effectiveAdmin()) { alert(T().adminUidNeed); return; }

  const ean = normEAN(el.ean.value);
  if (!ean) { alert(T().noEan); return; }

  const qty = Number(el.qty.value || 0);
  if (!Number.isFinite(qty) || qty < 0) { alert(T().badQty); return; }

  const ref = doc(fs, "items", ean);
  const snap = await getDoc(ref);
  const prev = snap.exists() ? snap.data() : null;

  const next = {
    maker: normText(el.maker.value),
    tireModel: normText(el.tireModel.value),
    size: normText(el.size.value),
    loc: normText(el.loc.value),
    qty,
    updatedAt: serverTimestamp(),
    updatedAtMs: nowMs(),
    createdAt: prev?.createdAt ?? serverTimestamp(),
    createdAtMs: prev?.createdAtMs ?? nowMs()
  };

  await setDoc(ref, next, { merge: true });

  const changes = prev ? diffItem(prev, next) : [];
  await pushHistory({ scope:"global", action: prev ? "update" : "create", ean, changes });
  await pushHistory({ scope:"item", action: prev ? "update" : "create", ean, changes });

  // удобство: после сохранения — форма очищается
  clearForm({ keepEAN:false });
  el.ean.focus();
}

async function deleteItem(ean){
  if (!ensureUser()) return;
  if (!effectiveAdmin()) { alert(T().adminUidNeed); return; }
  if (!confirm(T().delConfirm)) return;

  await deleteDoc(doc(fs, "items", ean));
  await pushHistory({ scope:"global", action:"delete", ean, changes: [] });
  await pushHistory({ scope:"item", action:"delete", ean, changes: [] });
}

function fillFormFromItem(it){
  el.ean.value = it.ean || "";
  el.maker.value = it.maker || "";
  el.tireModel.value = it.tireModel || "";
  el.size.value = it.size || "";
  el.loc.value = it.loc || "";
  el.qty.value = String(it.qty ?? "");
  window.scrollTo({ top:0, behavior:"smooth" });
}

/* ==============================
   List
============================== */
function compareItems(a,b,mode){
  const s = (x)=>String(x||"");
  const ta = a.updatedAtMs || 0;
  const tb = b.updatedAtMs || 0;
  if (mode==="updated_desc") return tb - ta;
  if (mode==="updated_asc")  return ta - tb;
  if (mode==="qty_desc")     return (b.qty||0)-(a.qty||0);
  if (mode==="loc_asc")      return s(a.loc).localeCompare(s(b.loc),"ru");
  if (mode==="maker_asc")    return s(a.maker).localeCompare(s(b.maker),"ru");
  if (mode==="model_asc")    return s(a.tireModel).localeCompare(s(b.tireModel),"ru");
  return 0;
}

// список пустой, пока нет поиска
function filterItems(items){
  const q = normText(el.search.value).toLowerCase();
  if (!q) return [];
  return items.filter(x =>
    String(x.ean||"").toLowerCase().includes(q) ||
    String(x.maker||"").toLowerCase().includes(q) ||
    String(x.tireModel||"").toLowerCase().includes(q) ||
    String(x.size||"").toLowerCase().includes(q) ||
    String(x.loc||"").toLowerCase().includes(q)
  );
}

function groupItems(items, mode){
  if (mode==="none") return { [T().all]: items };
  const map = new Map();
  for (const it of items) {
    const key = (mode==="maker")
      ? (normText(it.maker) || T().noMaker)
      : (normText(it.loc) || T().noLoc);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  const keys = Array.from(map.keys()).sort((a,b)=>String(a).localeCompare(String(b),"ru"));
  const out = {};
  for (const k of keys) out[k] = map.get(k);
  return out;
}

function itemCard(it){
  const head = [it.maker, it.tireModel].filter(Boolean).join(" ") || "—";
  const wrap = document.createElement("div");
  wrap.className = "item";

  wrap.innerHTML = `
    <b>${head}</b>
    <div class="small" style="margin-top:6px;">${T().size}: ${it.size ? it.size : "—"}</div>
    <div class="mono" style="margin-top:6px;">${it.ean}</div>
    <div style="margin-top:8px;">
      <span class="badge">${T().loc}: <b>${it.loc || "-"}</b></span>
      <span class="badge">${T().qty}: <b>${Number.isFinite(it.qty) ? it.qty : 0}</b></span>
    </div>
  `;

  const btnRow = document.createElement("div");
  btnRow.className = "row";
  btnRow.style.marginTop = "10px";
  btnRow.style.gap = "8px";

  const histBtn = document.createElement("button");
  histBtn.className = "ghost";
  histBtn.style.marginTop = "0";
  histBtn.textContent = T().hist;
  histBtn.onclick = () => showItemHistory(it.ean);

  if (effectiveAdmin()) {
    const openBtn = document.createElement("button");
    openBtn.className = "primary";
    openBtn.style.marginTop = "0";
    openBtn.textContent = T().open;
    openBtn.onclick = () => fillFormFromItem(it);

    const delBtn = document.createElement("button");
    delBtn.className = "danger";
    delBtn.style.marginTop = "0";
    delBtn.textContent = T().del;
    delBtn.onclick = () => deleteItem(it.ean);

    const c1 = document.createElement("div"); c1.className = "col"; c1.appendChild(openBtn);
    const c2 = document.createElement("div"); c2.className = "col"; c2.appendChild(histBtn);
    const c3 = document.createElement("div"); c3.className = "col"; c3.appendChild(delBtn);
    btnRow.appendChild(c1); btnRow.appendChild(c2); btnRow.appendChild(c3);
  } else {
    const c = document.createElement("div");
    c.className = "col";
    c.appendChild(histBtn);
    btnRow.appendChild(c);
  }

  wrap.appendChild(btnRow);
  return wrap;
}

function renderList(){
  const filtered = filterItems(db.slice());
  filtered.sort((a,b)=>compareItems(a,b,el.sortBy.value));

  const q = normText(el.search.value);
  el.stats.textContent = q ? `${T().shown}: ${filtered.length}` : "";

  el.list.innerHTML = "";
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = q ? T().nothing : (T().promptSearch || T().nothing);
    el.list.appendChild(empty);
    return;
  }

  const grouped = groupItems(filtered, el.groupBy.value);

  if (el.groupBy.value === "none") {
    const items = grouped[T().all] || filtered;
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
}

/* ==============================
   Init / events
============================== */
function initUserUI(){
  if (userName) {
    el.username.value = userName;
    el.username.disabled = true;
    el.confirmUser.disabled = true;
  } else {
    el.username.value = "";
    el.username.disabled = false;
    el.confirmUser.disabled = false;
  }
}

function bindEvents(){
  // menu
  el.menuBtn.addEventListener("click", openMenu);
  el.menuBack.addEventListener("click", closeMenu);
  el.menuHome.addEventListener("click", () => setPage("home"));
  el.menuScan.addEventListener("click", () => setPage("scan"));

  // lang
  el.lang.addEventListener("change", () => {
    lang = el.lang.value;
    saveJSON(STORAGE.lang, lang);
    applyI18n();
    renderList();
    setPage(page);
  });

  // user confirm
  el.confirmUser.addEventListener("click", () => {
    const v = normText(el.username.value);
    if (!v) { alert(T().userNeed); return; }
    userName = v;
    saveJSON(STORAGE.user, v);
    location.reload();
  });

  // admin unlock (UI)
  el.adminUnlock.addEventListener("click", () => {
    if (el.adminPass.value !== ADMIN_UI_PASSWORD) {
      el.adminHint.textContent = T().adminWrong;
      return;
    }
    adminUnlocked = true;
    saveJSON(STORAGE.adminUnlocked, true);
    el.adminHint.textContent = T().adminUnlocked;
    applyAccessVisibility();
    subscribeGlobalHistory();
  });

  // camera
  el.start.addEventListener("click", startCamera);
  el.stop.addEventListener("click", stopCamera);

  // form
  el.clear.addEventListener("click", () => { clearForm({ keepEAN:false }); el.ean.focus(); });
  el.save.addEventListener("click", upsertItemFromForm);

  // list
  el.openGlobalHistory.addEventListener("click", showGlobalHistory);
  el.search.addEventListener("input", renderList);
  el.groupBy.addEventListener("change", renderList);
  el.sortBy.addEventListener("change", renderList);

  // modal
  el.modalClose.addEventListener("click", closeModal);
  el.modalBack.addEventListener("click", (e) => { if (e.target === el.modalBack) closeModal(); });
}

async function boot(){
  initUserUI();
  applyI18n();

  // sign in anonymously
  await signInAnonymously(auth);

  onAuthStateChanged(auth, async (u) => {
    if (!u) return;
    uid = u.uid;

    // check admin uid
    const adminDoc = await getDoc(doc(fs, "admins", uid));
    isAdminUid = adminDoc.exists();

    // hints
    if (isAdminUid && adminUnlocked) el.adminHint.textContent = T().adminUnlocked;
    else if (isAdminUid && !adminUnlocked) el.adminHint.textContent = "";
    else el.adminHint.textContent = "";

    applyAccessVisibility();
    subscribeItems();
    if (effectiveAdmin()) subscribeGlobalHistory();
  });

  if (page !== "home" && page !== "scan") page = "home";
  setPage(page);

  bindEvents();
  renderList();
}

boot();
