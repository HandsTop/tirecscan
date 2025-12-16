/* ========= Error overlay ========= */
const showErr = (msg) => {
  const box = document.getElementById("errBox");
  const txt = document.getElementById("errText");
  if (box && txt) { txt.textContent = String(msg || ""); box.style.display = "block"; }
  console.error(msg);
};
window.addEventListener("error", (e) => showErr(e.error?.stack || e.message));
window.addEventListener("unhandledrejection", (e) => showErr(e.reason?.stack || e.reason));

/* ========= Firebase (modular CDN) ========= */
import { firebaseConfig } from "./firebase-config.js"; // <-- ВАЖНО: путь
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, deleteDoc,
  onSnapshot, collection, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

/* ========= CONFIG ========= */
const ADMIN_NAME = "Andrejs O";
const ADMIN_PASSWORD = "1234"; // <-- поменяй

const STORAGE = {
  lang: "tires_lang_cloud_v1",
  user: "tires_user_cloud_v1",
  page: "tires_page_cloud_v1",
  admin: "tires_admin_session_v1",
};

const load = (k, f) => { try { const v = localStorage.getItem(k); return v==null ? f : JSON.parse(v); } catch { return f; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ========= i18n (минимум RU, чтобы всё работало) ========= */
const I18N = {
  ru: {
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

    rightsAdmin:"Права: добавление/редактирование/удаление + общая история.",
    rightsUser:"Права: просмотр + история позиций.",

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

    group:"Группировка", sort:"Сортировка",
    groupLoc:"По локации", groupMaker:"По марке", groupNone:"Без группировки",
    sortNew:"Сначала новые", sortOld:"Сначала старые", sortQty:"Кол-во ↓",
    sortLoc:"Локация A→Z", sortMaker:"Марка A→Z", sortModel:"Модель A→Z",

    shown:"Показано", nothing:"Ничего не найдено.",
    promptSearch:"Сначала введи поиск или отсканируй штрих-код.",
    all:"Все", noLoc:"Без локации", noMaker:"Без марки",

    hist:"История", del:"Удалить", open:"Открыть",
    delConfirm:"Удалить запись?",
    noEan:"Нет EAN (штрих-кода).",
    badQty:"Кол-во должно быть числом (0 или больше).",
    needHttps:"Нужен HTTPS (GitHub Pages). Открой страницу по ссылке https://...",
    camFail:"Не удалось включить камеру. Проверь разрешение: Настройки → Safari → Камера.",
    cantEdit:"Доступ запрещён (только админ).",

    histTitleItem:"История позиции",
    histTitleGlobal:"Общая история действий",
    close:"Закрыть",
    created:"Создано", updated:"Изменено", deleted:"Удалено",
    field:{ maker:"Марка", tireModel:"Модель", size:"Размер", loc:"Локация", qty:"Кол-во" }
  }
};

let lang = load(STORAGE.lang, "ru"); if (!I18N[lang]) lang = "ru";
let user = load(STORAGE.user, "");
let page = load(STORAGE.page, "home");
let adminMode = load(STORAGE.admin, false);

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
  lblSort:$("lblSort"), sortBy:$("sortBy"),
  stats:$("stats"), list:$("list"),

  modalBack:$("modalBack"),
  modalTitle:$("modalTitle"),
  modalBody:$("modalBody"),
  modalClose:$("modalClose"),
};

const T = () => I18N[lang] || I18N.ru;
const now = () => Date.now();
const normEAN = (x) => String(x||"").replace(/\s+/g,"").trim();
const normText = (x) => String(x||"").trim();
const isAdmin = () => (user === ADMIN_NAME) && adminMode;
const ensureUser = () => {
  if (user) return true;
  alert(T().userNeed);
  return false;
};

/* ========= Menu/pages ========= */
const openMenu = () => { el.menuBack.style.display="block"; el.menuPanel.style.display="block"; };
const closeMenu = () => { el.menuBack.style.display="none"; el.menuPanel.style.display="none"; };

const setPage = async (next) => {
  page = next; save(STORAGE.page, page);
  el.pageHome.style.display = (page==="home") ? "" : "none";
  el.pageScan.style.display = (page==="scan") ? "block" : "none";
  el.pageSubtitle.textContent = (page==="home") ? T().pageHome : T().pageScan;

  el.menuHome.classList.toggle("active", page==="home");
  el.menuScan.classList.toggle("active", page==="scan");

  closeMenu();
  if (page !== "scan") await stopCamera().catch(()=>{});
};

/* ========= UI apply ========= */
const applyI18n = () => {
  el.uiTitle.textContent = T().title;

  el.menuHome.textContent = T().home;
  el.menuScan.textContent = T().scan;

  el.menuSettingsTitle.textContent = T().menuSettings;
  el.lblLang.textContent = T().lang;
  el.lblUser.textContent = T().user;

  el.username.placeholder = T().userPh;
  el.confirmUser.textContent = T().confirm;
  el.userHint.textContent = user ? T().userLocked : T().userNeed;

  el.menuAdminTitle.textContent = T().menuAdmin;
  el.adminPass.placeholder = T().adminPassPh;
  el.adminLogin.textContent = adminMode ? T().adminLogout : T().adminLogin;

  el.start.textContent = T().start;
  el.stop.textContent = T().stop;
  el.status.textContent = scanning ? T().camOn : T().camOff;
  el.scanHint.textContent = T().scanHint;

  el.lblEan.textContent = T().ean; el.ean.placeholder = T().eanPh;
  el.lblMaker.textContent = T().maker; el.maker.placeholder = T().makerPh;
  el.lblTireModel.textContent = T().tireModel; el.tireModel.placeholder = T().tireModelPh;
  el.lblSize.textContent = T().size; el.size.placeholder = T().sizePh;
  el.lblLoc.textContent = T().loc; el.loc.placeholder = T().locPh;
  el.lblQty.textContent = T().qty; el.qty.placeholder = T().qtyPh;

  el.save.textContent = T().save;
  el.clear.textContent = T().clear;

  el.listTitle.textContent = T().listTitle;
  el.openGlobalHistory.textContent = T().openGlobalHistory;
  el.search.placeholder = T().searchPh;

  el.lblGroup.textContent = T().group;
  el.lblSort.textContent = T().sort;

  el.groupBy.options[0].text = T().groupLoc;
  el.groupBy.options[1].text = T().groupMaker;
  el.groupBy.options[2].text = T().groupNone;

  el.sortBy.options[0].text = T().sortNew;
  el.sortBy.options[1].text = T().sortOld;
  el.sortBy.options[2].text = T().sortQty;
  el.sortBy.options[3].text = T().sortLoc;
  el.sortBy.options[4].text = T().sortMaker;
  el.sortBy.options[5].text = T().sortModel;

  el.modalClose.textContent = T().close;
};

const applyAccessVisibility = () => {
  el.scannerCard.style.display = "";                 // всем
  el.formCard.style.display = isAdmin() ? "" : "none";
  el.openGlobalHistory.style.display = isAdmin() ? "" : "none";

  el.rolePill.style.display = user ? "" : "none";
  el.rolePill.textContent = isAdmin() ? T().roleAdmin : T().roleUser;

  el.rightsHint.textContent = user ? (isAdmin() ? T().rightsAdmin : T().rightsUser) : "";
  el.adminHint.textContent = isAdmin() ? T().adminOk : "";
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

/* ========= Live data (Firestore) ========= */
let app, firestore, auth;
let tires = [];
let globalHistory = [];

const bootFirebase = async () => {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error("firebaseConfig пустой. Проверь firebase-config.js (export const firebaseConfig = {...}).");
  }
  app = initializeApp(firebaseConfig);
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
  if (!entries.length) return `<div class="muted">${T().nothing}</div>`;
  return entries.map(h => {
    const ts = new Date(h.ts || now()).toLocaleString();
    const label = labelFn(h);
    const lines = (h.changes && h.changes.length)
      ? h.changes.map(c => {
          const name = (T().field && T().field[c.field]) ? T().field[c.field] : c.field;
          return `<div class="histLine">${name}: ${c.from} → ${c.to}</div>`;
        }).join("")
      : `<div class="histLine">—</div>`;
    return `<div class="histItem"><div class="histMeta">${ts} • ${h.user || "—"} • ${label}</div>${lines}</div>`;
  }).join("");
};

const showItemHistory = (ean) => {
  const it = tires.find(x => x.ean === ean);
  const entries = (it && Array.isArray(it.history)) ? it.history : [];
  const html = renderHistoryEntries(entries, (h) => (h.type === "create") ? T().created : T().updated);
  openModal(`${T().histTitleItem}: ${ean}`, html);
};

const showGlobalHistory = () => {
  if (!isAdmin()) return;
  const html = renderHistoryEntries(globalHistory, (h) => {
    if (h.action === "create") return T().created;
    if (h.action === "delete") return T().deleted;
    return T().updated;
  }).replaceAll(`<div class="histLine">—</div>`, "");
  openModal(T().histTitleGlobal, html || `<div class="muted">${T().nothing}</div>`);
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
  el.status.textContent = T().camOff;
};

// всем: скан -> поиск по EAN
// админу: дополнительно заполнить форму
const startCamera = async () => {
  if (!ensureUser()) return;
  if (!window.isSecureContext) { alert(T().needHttps); return; }

  if (isAdmin()) clearForm({ keepEAN:false });

  try {
    await stopCamera().catch(()=>{});
    scanner = new Html5Qrcode("reader");
    lastScan = "";
    scanning = true;

    el.start.disabled = true;
    el.stop.disabled = false;
    el.status.textContent = T().camOn;

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

        el.status.textContent = `${T().found}: ${v} ${T().autoOff}`;
        await stopCamera();

        el.list.scrollIntoView({ behavior:"smooth", block:"start" });
      },
      () => {}
    );
  } catch (e) {
    console.error(e);
    alert(T().camFail);
    await stopCamera();
  }
};

/* ========= Admin write ========= */
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

const upsertItemFromForm = async () => {
  if (!ensureUser()) return;
  if (!isAdmin()) { alert(T().cantEdit); return; }

  const ean = normEAN(el.ean.value);
  if (!ean) { alert(T().noEan); return; }

  const qty = Number(el.qty.value || 0);
  if (!Number.isFinite(qty) || qty < 0) { alert(T().badQty); return; }

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

const deleteItem = async (ean) => {
  if (!ensureUser()) return;
  if (!isAdmin()) { alert(T().cantEdit); return; }
  if (!confirm(T().delConfirm)) return;

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
const compareItems = (a,b,mode) => {
  const s = (x)=>String(x||"");
  if (mode==="updated_desc") return (b.updatedAt||0)-(a.updatedAt||0);
  if (mode==="updated_asc")  return (a.updatedAt||0)-(b.updatedAt||0);
  if (mode==="qty_desc")     return (b.qty||0)-(a.qty||0);
  if (mode==="loc_asc")      return s(a.loc).localeCompare(s(b.loc),"ru");
  if (mode==="maker_asc")    return s(a.maker).localeCompare(s(b.maker),"ru");
  if (mode==="model_asc")    return s(a.tireModel).localeCompare(s(b.tireModel),"ru");
  return 0;
};

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
};

const itemCard = (it) => {
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

  if (isAdmin()) {
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
};

const renderList = () => {
  const filtered = filterItems(tires.slice());
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
    if (!v) { alert(T().userNeed); return; }
    save(STORAGE.user, v);
    location.reload();
  });

  el.adminLogin.addEventListener("click", () => {
    if (!ensureUser()) return;

    if (adminMode) {
      adminMode = false;
      save(STORAGE.admin, adminMode);
      el.adminPass.value = "";
      applyI18n(); applyAccessVisibility(); renderList();
      return;
    }

    const p = String(el.adminPass.value || "");
    if (p !== ADMIN_PASSWORD) { el.adminHint.textContent = T().adminBad; return; }
    if (user !== ADMIN_NAME) { el.adminHint.textContent = `Админ доступ только для имени: ${ADMIN_NAME}`; return; }

    adminMode = true;
    save(STORAGE.admin, adminMode);
    el.adminHint.textContent = T().adminOk;
    applyI18n(); applyAccessVisibility(); renderList();
  });

  el.start.addEventListener("click", startCamera);
  el.stop.addEventListener("click", stopCamera);

  el.clear.addEventListener("click", () => { clearForm({ keepEAN:false }); el.ean.focus(); });
  el.save.addEventListener("click", upsertItemFromForm);

  el.openGlobalHistory.addEventListener("click", showGlobalHistory);

  el.search.addEventListener("input", renderList);
  el.groupBy.addEventListener("change", renderList);
  el.sortBy.addEventListener("change", renderList);

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
