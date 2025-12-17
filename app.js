import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, deleteDoc,
  onSnapshot, collection, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

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
const STORAGE = {
  lang: "tires_lang_cloud_v3",
  user: "tires_user_cloud_v3",
  page: "tires_page_cloud_v3"
};

const load = (k, f) => { try { const v = localStorage.getItem(k); return v==null ? f : JSON.parse(v); } catch { return f; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ========= i18n (ваш блок I18N оставляю без изменений) ========= */
// ... ВСТАВЬТЕ ВАШИ I18N_RU / I18N / T ТУТ БЕЗ ИЗМЕНЕНИЙ ...

/* ========= State ========= */
let lang = load(STORAGE.lang, "ru"); if (!I18N[lang]) lang = "ru";
let user = load(STORAGE.user, "");
let page = load(STORAGE.page, "home");

const now = () => Date.now();
const normEAN = (x) => String(x||"").replace(/\s+/g,"").trim();
const normText = (x) => String(x||"").trim();

/* ========= Auth state ========= */
let firestore, auth;
let isAdminFlag = false;

const isAdmin = () => isAdminFlag;

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
  adminEmail:$("adminEmail"),
  adminPass:$("adminPass"),
  adminLogin:$("adminLogin"),
  adminHint:$("adminHint"),

  makeAdminBox:$("makeAdminBox"),
  makeAdminUid:$("makeAdminUid"),
  makeAdminBtn:$("makeAdminBtn"),
  makeAdminHint:$("makeAdminHint"),

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
  el.adminLogin.textContent = (auth?.currentUser && !auth.currentUser.isAnonymous) ? t.adminLogout : t.adminLogin;
  el.adminHint.textContent = "";

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

  // блок выдачи админа — виден только админу
  if (el.makeAdminBox) el.makeAdminBox.style.display = isAdmin() ? "" : "none";
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
let tires = [];
let globalHistory = [];

const bootFirebase = async () => {
  if (!firebaseConfig?.apiKey) throw new Error("firebaseConfig пустой. Проверь firebase-config.js");

  const app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  auth = getAuth(app);

  // Всех пользователей подписываем анонимно
  await signInAnonymously(auth);

  // Отслеживаем auth state и вычисляем admin по custom claims
  onAuthStateChanged(auth, async (u) => {
    isAdminFlag = false;
    if (u) {
      try {
        const token = await u.getIdTokenResult(true);
        isAdminFlag = token?.claims?.admin === true;
      } catch {}
    }
    applyI18n();
    applyAccessVisibility();
    renderList();
  });

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
    // item history (можно оставить как у вас)
    history: Array.isArray(prev?.history) ? prev.history : [],
    // подпись пользователя (не для прав!)
    lastUser: user || "—"
  };

  if (!prev) {
    next.history.unshift({ type:"create", user, ts: now(), changes: [] });
  } else {
    const changes = diffItem(prev, next);
    if (changes.length) {
      next.history.unshift({ type:"update", user, ts: now(), changes });
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

  // Важное: обычному пользователю Rules разрешают менять только loc и updatedAt.
  // Поэтому НЕ ТРОГАЕМ history/qty/etc. Здесь только loc+updatedAt+lastUser нельзя (rules запретят),
  // lastUser пишем только админу в full-save, а обычным — не пишем.
  const next = {
    ...prev,
    loc: locTo,
    updatedAt: now()
  };

  // Если хотите сохранять item-history и при loc-изменениях пользователем —
  // это лучше делать сервером (функцией), иначе rules придётся ослаблять.

  await setDoc(doc(firestore, "tires", ean), next);
};

const deleteItem = async (ean) => {
  const t = T(lang);
  if (!ensureUser()) return;
  if (!isAdmin()) { alert(t.cantEdit); return; }
  if (!confirm(t.delConfirm)) return;

  await deleteDoc(doc(firestore, "tires", ean));
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

  const inp = document.getElementById("editLocInput");
  const btnSave = document.getElementById("editLocSave");
  const btnCancel = document.getElementById("editLocCancel");

  btnCancel.onclick = () => closeModal();
  btnSave.onclick = async () => {
    const val = inp.value;
    try {
      await updateLocationOnly(ean, val);
      closeModal();
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
  const filtered = filterItems(tires.slice());
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

/* ========= Admin actions ========= */
const adminLoginOrLogout = async () => {
  const t = T(lang);

  // если сейчас НЕ анонимный пользователь — выходим и возвращаемся к анониму
  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    await signOut(auth);
    await signInAnonymously(auth);
    el.adminEmail.value = "";
    el.adminPass.value = "";
    el.adminHint.textContent = "";
    return;
  }

  const email = String(el.adminEmail.value || "").trim();
  const pass  = String(el.adminPass.value || "");

  if (!email || !pass) {
    el.adminHint.textContent = "Введите email и пароль администратора.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // после входа проверка claims сработает в onAuthStateChanged
    el.adminHint.textContent = "";
  } catch (e) {
    el.adminHint.textContent = "Ошибка входа. Проверь email/пароль.";
  }
};

// выдача admin:true по UID через adminRequests (только текущий админ может создать)
const grantAdminByUid = async () => {
  if (!isAdmin()) return;
  const uid = String(el.makeAdminUid.value || "").trim();
  if (!uid) { el.makeAdminHint.textContent = "Нужен UID."; return; }

  try {
    el.makeAdminHint.textContent = "Отправлено…";
    await addDoc(collection(firestore, "adminRequests"), {
      targetUid: uid,
      ts: now()
    });
    el.makeAdminHint.textContent = "Запрос создан. Если функция настроена — claim будет выдан.";
  } catch (e) {
    el.makeAdminHint.textContent = "Ошибка. Проверь Rules/Functions.";
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

  el.adminLogin.addEventListener("click", adminLoginOrLogout);
  if (el.makeAdminBtn) el.makeAdminBtn.addEventListener("click", grantAdminByUid);

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
