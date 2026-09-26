import { firebaseConfig, appCheckSiteKey, functionsRegion } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app-check.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-functions.js";

const $ = (id) => document.getElementById(id);
const app = initializeApp(firebaseConfig);
if (appCheckSiteKey) initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey), isTokenAutoRefreshEnabled: true });
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, functionsRegion || "europe-west1");
const call = {
  ensureProfile: httpsCallable(functions, "ensureProfile"),
  getContainerBundle: httpsCallable(functions, "getContainerBundle"),
  resolveContainerArticles: httpsCallable(functions, "resolveContainerArticles"),
  claimContainer: httpsCallable(functions, "claimContainer"),
  confirmPick: httpsCallable(functions, "confirmPick"),
  finalizeContainer: httpsCallable(functions, "finalizeContainer"),
  searchArticles: httpsCallable(functions, "searchArticles"),
  getTireDetails: httpsCallable(functions, "getTireDetails"),
  saveTireLocation: httpsCallable(functions, "saveTireLocation"),
  importTires: httpsCallable(functions, "importTires"),
  importContainer: httpsCallable(functions, "importContainer"),
  setUserAccess: httpsCallable(functions, "setUserAccess")
};

const TEXT = {
  de: {
    secureLogin:"Sichere Anmeldung für Lagermitarbeiter", login:"Anmelden", logout:"Abmelden", waiting:"Konto wartet auf Freigabe", askAdmin:"Ein Administrator muss dieses Konto aktivieren.",
    home:"Home", articleSearch:"Artikelsuche", storageLists:"Einlagerungslisten", settings:"Einstellungen", activeContainers:"Aktive Container",
    picking:"Kommissionierung", myContainers:"Meine Container", administration:"Verwaltung", language:"Sprache", containerNumber:"Containernummer", continueWork:"Aktive und zuletzt bearbeitete Aufträge",
    userAccess:"Benutzerzugang", userAccessHint:"Konten aktivieren und Anzeigenamen vergeben.", reload:"Neu laden", importContainer:"Container importieren", importHint:"JSON mit Container und Positionen einfügen. Bestehende Container werden nicht überschrieben.", import:"Importieren",
    notFound:"Container nicht gefunden.", invalidContainer:"Bitte eine gültige Containernummer eingeben.", loadFailed:"Daten konnten nicht geladen werden.", loginFailed:"Anmeldung fehlgeschlagen. Zugangsdaten prüfen.",
    activate:"Aktivieren", deactivate:"Sperren", imported:"Container wurde importiert.", max70:"Ein Container darf höchstens 70 Reifen enthalten.", demoModule:"Dieses Modul ist für die nächste Ausbaustufe vorbereitet.",
    scan:"SCAN", commissioned:"Kommissioniert", cancel:"ABBRECHEN", done:"ERLEDIGT", wrongEan:"Falscher Reifen – EAN stimmt nicht.", correctEan:"EAN bestätigt.", cameraUnavailable:"Kamera/Barcode-Erkennung ist nicht verfügbar. EAN kann manuell eingegeben werden.",
    confirmContainer:"Bist Du sicher, dass die Container Nummer {id} korrekt ist?", confirmFinish:"Soll die Liste als 'bestätigt' markiert werden?", partial:"Es wurde eine geringere Anzahl kommissioniert als vorgesehen. Trotzdem bestätigen?",
    assignedOther:"Container ist bereits {name} zugewiesen.", saved:"Position bestätigt.", allDone:"Container vollständig kommissioniert.", completeFirst:"Bitte zuerst alle Positionen vollständig kommissionieren.", noItems:"Keine Positionen vorhanden.",
    positions:"Positionen", articleCount:"Artikelanzahl", picked:"Kommissioniert", created:"Erstellt", started:"gestartet", finished:"fertiggestellt", warehouse:"Lager", level:"Ebene", quantity:"Anzahl", locationButton:"LAGERPLÄTZE",
    articleSearchHint:"Größe, Marke, Artikelnummer oder EAN eingeben", warehouseSearchHint:"Lagerplatz eingeben", searching:"Suche …", noArticles:"Keine Artikel gefunden.",
    history:"HISTORIE", arrivals:"ZUGÄNGE", salesPeriod:"12 Monate", averageStock:"ø-Best.", physicalStock:"Physischer Lagerbestand:", availableStock:"Verfügbarer Bestand:", add:"HINZUFÜGEN",
    user:"Benutzer", date:"Datum", time:"Uhrzeit", noHistory:"Noch keine Bewegungen.", noArrivals:"Noch keine Zugänge.", total:"Gesamt", synchronize:"Synchronisieren", syncing:"Synchronisiere …", syncDone:"Synchronisierung abgeschlossen.", syncFailed:"Synchronisierung nicht abgeschlossen", historyLoading:"Historie wird geladen …", arrivalsLoading:"Zugänge werden geladen …", arrival:"Zugang", oldStock:"alt", newStock:"neu", yes:"JA", no:"NEIN", scanEan:"EAN scannen", search:"SUCHEN", storagePlace:"Lagerplatz", print:"Drucken", editStoragePlace:"Lagerplatz bearbeiten", adminStockOnly:"Nur Administratoren dürfen Bestände ändern.", storagePlaceSaved:"Lagerplatz gespeichert.",
    createContainer:"Container anlegen", createContainerHint:"Nur Artikelnummer und Menge eingeben. Reifendaten und Lagerplatz werden automatisch aus dem Katalog übernommen.", orderReference:"Auftrag / Referenz", newPosition:"Neue Position", articleNumber:"Artikelnummer", addPosition:"Position hinzufügen", bulkPositions:"Mehrere Positionen aus Excel / CSV hinzufügen", bulkPositionsHint:"Zwei Spalten einfügen: Artikelnummer und Anzahl. Eine Überschrift ist optional.", validateAdd:"Liste prüfen und hinzufügen", saveContainer:"Container speichern",
    createTire:"Reifenartikel anlegen", createTireHint:"Artikel, Bestand und ersten Lagerplatz direkt eingeben.", brand:"Marke", size:"Größe", model:"Modell / Bezeichnung", site:"Standort", physicalP:"Physischer Bestand P", availableV:"Verfügbarer Bestand V", orderedB:"Bestellt B", arrivedT:"Eingetroffen T", sales12:"Verkäufe 12 Monate", average12:"Ø Bestand 12 Monate", saveArticle:"Artikel speichern", catalogImport:"Kompletten Reifenkatalog importieren", catalogImportHint:"CSV/TSV aus Excel laden oder unten einfügen. Auch große Listen werden in Paketen synchronisiert.", validateCatalog:"Katalog prüfen und vormerken"
  },
  ru: {
    secureLogin:"Безопасный вход для сотрудников склада", login:"Войти", logout:"Выйти", waiting:"Учётная запись ожидает активации", askAdmin:"Администратор должен активировать эту учётную запись.",
    home:"Главная", articleSearch:"Поиск шин", storageLists:"Списки размещения", settings:"Настройки", activeContainers:"Активные контейнеры",
    picking:"Комплектация", myContainers:"Мои контейнеры", administration:"Управление", language:"Язык", containerNumber:"Номер контейнера", continueWork:"Активные и последние задания",
    userAccess:"Доступ пользователей", userAccessHint:"Активируйте аккаунты и задайте имена.", reload:"Обновить", importContainer:"Импорт контейнера", importHint:"Вставьте JSON контейнера и позиций.", import:"Импортировать",
    notFound:"Контейнер не найден.", invalidContainer:"Введите корректный номер контейнера.", loadFailed:"Не удалось загрузить данные.", loginFailed:"Не удалось войти. Проверьте данные.",
    activate:"Активировать", deactivate:"Заблокировать", imported:"Контейнер импортирован.", max70:"В контейнере может быть не более 70 шин.", demoModule:"Этот модуль подготовлен для следующего этапа.",
    scan:"СКАН", commissioned:"Собрано", cancel:"ОТМЕНА", done:"ГОТОВО", wrongEan:"Неверная шина — EAN не совпадает.", correctEan:"EAN подтверждён.", cameraUnavailable:"Камера недоступна. EAN можно ввести вручную.",
    confirmContainer:"Вы уверены, что номер контейнера {id} правильный?", confirmFinish:"Отметить список как подтверждённый?", partial:"Собрано меньше запланированного. Всё равно подтвердить?",
    assignedOther:"Контейнер уже назначен сотруднику {name}.", saved:"Позиция подтверждена.", allDone:"Контейнер полностью собран.", completeFirst:"Сначала полностью соберите все позиции.", noItems:"Нет позиций.",
    positions:"Позиции", articleCount:"Количество", picked:"Собрано", created:"Создан", started:"начат", finished:"завершён", warehouse:"Лагер", level:"Уровень", quantity:"Количество", locationButton:"МЕСТА ХРАНЕНИЯ",
    articleSearchHint:"Введите размер, марку, артикул или EAN", warehouseSearchHint:"Введите место хранения", searching:"Поиск …", noArticles:"Шины не найдены.",
    history:"ИСТОРИЯ", arrivals:"ПОСТУПЛЕНИЯ", salesPeriod:"12 месяцев", averageStock:"ср. запас", physicalStock:"Физический запас:", availableStock:"Доступный запас:", add:"ДОБАВИТЬ",
    user:"Пользователь", date:"Дата", time:"Время", noHistory:"Перемещений пока нет.", noArrivals:"Поступлений пока нет.", total:"Всего", synchronize:"Синхронизировать", syncing:"Синхронизация …", syncDone:"Синхронизация завершена.", syncFailed:"Синхронизация не завершена", historyLoading:"История загружается …", arrivalsLoading:"Поступления загружаются …", arrival:"Поступление", oldStock:"было", newStock:"стало", yes:"ДА", no:"НЕТ", scanEan:"Сканировать EAN", search:"НАЙТИ", storagePlace:"Место хранения", print:"Печать", editStoragePlace:"Изменить место хранения", adminStockOnly:"Изменять остатки может только администратор.", storagePlaceSaved:"Место хранения сохранено.",
    createContainer:"Создать контейнер", createContainerHint:"Введите только артикул и количество. Данные шины и место хранения подставятся из каталога.", orderReference:"Заказ / ссылка", newPosition:"Новая позиция", articleNumber:"Артикул", addPosition:"Добавить позицию", bulkPositions:"Добавить несколько позиций из Excel / CSV", bulkPositionsHint:"Вставьте два столбца: артикул и количество. Заголовок необязателен.", validateAdd:"Проверить и добавить список", saveContainer:"Сохранить контейнер",
    createTire:"Добавить шину", createTireHint:"Введите данные шины, запас и первое место хранения.", brand:"Марка", size:"Размер", model:"Модель / описание", site:"Локация", physicalP:"Физический запас P", availableV:"Доступный запас V", orderedB:"Заказано B", arrivedT:"Прибыло T", sales12:"Продажи за 12 месяцев", average12:"Средний запас за 12 месяцев", saveArticle:"Сохранить шину", catalogImport:"Импорт всего каталога шин", catalogImportHint:"Загрузите CSV/TSV из Excel или вставьте данные ниже. Большие списки синхронизируются пакетами.", validateCatalog:"Проверить и подготовить каталог"
  },
  en: {
    secureLogin:"Secure sign-in for warehouse staff", login:"Sign in", logout:"Sign out", waiting:"Account awaiting approval", askAdmin:"An administrator must activate this account.",
    home:"Home", articleSearch:"Tire search", storageLists:"Storage lists", settings:"Settings", activeContainers:"Active containers",
    picking:"Order picking", myContainers:"My containers", administration:"Administration", language:"Language", containerNumber:"Container number", continueWork:"Active and recently processed jobs",
    userAccess:"User access", userAccessHint:"Activate accounts and assign display names.", reload:"Reload", importContainer:"Import container", importHint:"Paste container and item JSON.", import:"Import",
    notFound:"Container not found.", invalidContainer:"Enter a valid container number.", loadFailed:"Data could not be loaded.", loginFailed:"Sign-in failed. Check your credentials.",
    activate:"Activate", deactivate:"Block", imported:"Container imported.", max70:"A container may contain no more than 70 tires.", demoModule:"This module is prepared for the next development stage.",
    scan:"SCAN", commissioned:"Picked", cancel:"CANCEL", done:"DONE", wrongEan:"Wrong tire — EAN does not match.", correctEan:"EAN confirmed.", cameraUnavailable:"Camera/barcode recognition is unavailable. Enter the EAN manually.",
    confirmContainer:"Are you sure container number {id} is correct?", confirmFinish:"Mark this list as confirmed?", partial:"Fewer tires were picked than required. Confirm anyway?",
    assignedOther:"Container is already assigned to {name}.", saved:"Item confirmed.", allDone:"Container picking completed.", completeFirst:"Complete all items first.", noItems:"No items available.",
    positions:"Items", articleCount:"Tire count", picked:"Picked", created:"Created", started:"started", finished:"completed", warehouse:"Location", level:"Level", quantity:"Quantity", locationButton:"STORAGE PLACES",
    articleSearchHint:"Enter size, brand, article number or EAN", warehouseSearchHint:"Enter a storage place", searching:"Searching …", noArticles:"No tires found.",
    history:"HISTORY", arrivals:"ARRIVALS", salesPeriod:"12 months", averageStock:"avg. stock", physicalStock:"Physical stock:", availableStock:"Available stock:", add:"ADD",
    user:"User", date:"Date", time:"Time", noHistory:"No movements yet.", noArrivals:"No arrivals yet.", total:"Total", synchronize:"Synchronize", syncing:"Synchronizing …", syncDone:"Synchronization completed.", syncFailed:"Synchronization was not completed", historyLoading:"Loading history …", arrivalsLoading:"Loading arrivals …", arrival:"Arrival", oldStock:"old", newStock:"new", yes:"YES", no:"NO", scanEan:"Scan EAN", search:"SEARCH", storagePlace:"Storage place", print:"Print", editStoragePlace:"Edit storage place", adminStockOnly:"Only administrators may change stock.", storagePlaceSaved:"Storage place saved.",
    createContainer:"Create container", createContainerHint:"Enter only the article number and quantity. Tire data and storage place are filled from the catalog.", orderReference:"Order / reference", newPosition:"New item", articleNumber:"Article number", addPosition:"Add item", bulkPositions:"Add multiple items from Excel / CSV", bulkPositionsHint:"Paste two columns: article number and quantity. The header is optional.", validateAdd:"Validate and add list", saveContainer:"Save container",
    createTire:"Create tire article", createTireHint:"Enter the tire, stock and first storage place.", brand:"Brand", size:"Size", model:"Model / description", site:"Site", physicalP:"Physical stock P", availableV:"Available stock V", orderedB:"Ordered B", arrivedT:"Arrived T", sales12:"Sales in 12 months", average12:"Average stock in 12 months", saveArticle:"Save article", catalogImport:"Import complete tire catalog", catalogImportHint:"Upload a CSV/TSV from Excel or paste it below. Large lists are synchronized in batches.", validateCatalog:"Validate and prepare catalog"
  }
};

const demoMode = ["127.0.0.1","localhost"].includes(location.hostname) && new URLSearchParams(location.search).has("demo");
const savedLanguage=localStorage.getItem("tirescan.lang");
const state = { lang:savedLanguage==="lv"?"en":(TEXT[savedLanguage]?savedLanguage:"de"), user:null, profile:null, isAdmin:false, page:"containers", previousPage:"containers", searchContainer:null, container:null, items:[], selected:null, stream:null, scanTimer:null, confirmAction:null, articles:[], selectedArticle:null, detailCache:new Map(), articleStream:null, articleScanTimer:null, pendingOperations:[], containerCache:{}, containerDraftItems:[], syncing:false };
const t = (key) => TEXT[state.lang]?.[key] || TEXT.de[key] || key;
const cleanId = (value) => String(value || "").trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0,32);
const cleanEan = (value) => String(value || "").replace(/\D/g, "").slice(0,14);
const displayError = (error) => String(error?.message || error || t("loadFailed")).replace(/^Firebase:\s*/i, "").replace(/\s*\(functions\/[\w-]+\)\.?$/i, "");

function node(tag,className,text){ const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
function setMessage(element,text,ok=false){ element.textContent=text || ""; element.classList.toggle("ok",ok); }
function formatDate(value){ const date=value?.toDate?.() || (value ? new Date(value) : null); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString(state.lang,{dateStyle:"short",timeStyle:"medium"}) : "—"; }
function dateFromValue(value){
  if(value?.toDate)return value.toDate();
  if(Number.isFinite(value?.seconds))return new Date(value.seconds*1000);
  const date=value?new Date(value):null;
  return date&&!Number.isNaN(date.valueOf())?date:null;
}
function replace(template,values){ return Object.entries(values).reduce((out,[key,value])=>out.replaceAll(`{${key}}`,String(value)),template); }
function showToast(text){ const el=$("toast"); el.textContent=text; el.classList.remove("hidden"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.add("hidden"),2600); }
function openDrawer(open=true){ $("drawer").classList.toggle("open",open); $("drawer").setAttribute("aria-hidden",String(!open)); $("drawerShade").classList.toggle("hidden",!open); }
function allItemsDone(){ return state.items.length>0 && state.items.every(item=>Number(item.pickedQty||0)===Number(item.requiredQty||0)); }
function storageKey(name){return `tirescan.${name}.${state.user?.uid||"anonymous"}`;}
function loadDeviceState(){
  try{state.pendingOperations=JSON.parse(localStorage.getItem(storageKey("queue"))||"[]");}catch{state.pendingOperations=[];}
  try{state.containerCache=JSON.parse(localStorage.getItem(storageKey("containers"))||"{}");}catch{state.containerCache={};}
  updateSyncUi();
}
function persistDeviceState(){localStorage.setItem(storageKey("queue"),JSON.stringify(state.pendingOperations));localStorage.setItem(storageKey("containers"),JSON.stringify(state.containerCache));updateSyncUi();}
function enqueueOperation(type,payload){state.pendingOperations.push({id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,type,payload,createdAt:new Date().toISOString()});persistDeviceState();}
function cacheContainer(container,items){state.containerCache[container.id]={container,items};persistDeviceState();}
function updateSyncUi(){
  const count=state.pendingOperations.length;const pending=$("syncPending");if(pending)pending.textContent=count?`${count} ${state.lang==="de"?(count===1?"Änderung wartet":"Änderungen warten"):state.lang==="ru"?(count===1?"изменение ожидает":"изменений ожидают"):(count===1?"change pending":"changes pending")}`:(state.lang==="de"?"Keine ausstehenden Änderungen":state.lang==="ru"?"Нет ожидающих изменений":"No pending changes");
  const last=$("syncLast");if(last){const value=localStorage.getItem(storageKey("lastSync"));last.textContent=value?`${state.lang==="de"?"Letzte Synchronisierung":state.lang==="ru"?"Последняя синхронизация":"Last synchronization"}: ${formatDate(value)}`:(state.lang==="de"?"Noch nicht synchronisiert":state.lang==="ru"?"Синхронизации ещё не было":"Not synchronized yet");}
  const syncLabel=$("syncNow")?.querySelector("b");if(syncLabel&&!state.syncing)syncLabel.textContent=t("synchronize");
  $("syncNow")?.classList.toggle("has-pending",count>0);
}
async function syncNow(){
  if(state.syncing)return;state.syncing=true;const button=$("syncNow");button.disabled=true;button.querySelector("b").textContent=t("syncing");
  try{
    if(demoMode){state.pendingOperations=[];}else{
      while(state.pendingOperations.length){const operation=state.pendingOperations[0];if(!call[operation.type])throw new Error(`Unbekannte Aktion: ${operation.type}`);await call[operation.type](operation.payload);state.pendingOperations.shift();persistDeviceState();}
    }
    localStorage.setItem(storageKey("lastSync"),new Date().toISOString());state.detailCache.clear();await loadMyContainers();
    if(state.page==="article"&&normalizeArticleSearch($("articleQuery").value))await searchArticles();
    showToast(t("syncDone"));$("moreMenu").classList.add("hidden");
  }catch(error){console.error(error);showToast(`${t("syncFailed")}: ${displayError(error)}`);}
  finally{state.syncing=false;button.disabled=false;button.querySelector("b").textContent=t("synchronize");updateSyncUi();}
}

function applyLanguage(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.dataset.i18n); });
  $("language").value=state.lang;
  if($("articleQuery"))$("articleQuery").placeholder=$("warehouseMode")?.checked?t("warehouseSearchHint"):t("articleSearchHint");
  if($("articleSearchHint"))$("articleSearchHint").textContent=$("warehouseMode")?.checked?t("warehouseSearchHint"):t("articleSearchHint");
  updateSyncUi();
  showPage(state.page,false);
  if(state.searchContainer) renderSearchResult();
  if(state.container) renderWork();
  if(state.articles.length)renderArticleResults();
  if(state.selectedArticle&&state.page.startsWith("article")&&state.page!=="article")renderArticleDetail(state.page.replace("article","").toLowerCase());
}

function showPage(page,load=true){
  if(state.page!==page)state.previousPage=state.page;
  state.page=page;
  document.querySelectorAll(".page").forEach(el=>el.classList.add("hidden"));
  $((page==="work"?"work":page)+"Page")?.classList.remove("hidden");
  document.querySelectorAll(".nav-item[data-page]").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  const titles={home:t("home"),article:t("articleSearch"),articlePlaces:t("locationButton"),articleHistory:t("history"),articleArrivals:t("arrivals"),storage:t("storageLists"),containers:t("picking"),settings:t("settings"),admin:t("administration"),work:`Container: ${state.container?.number||state.container?.id||""}`};
  $("pageTitle").textContent=titles[page] || "TireScan";
  const detailPage=page==="work"||page.startsWith("articleP")||page==="articleHistory"||page==="articleArrivals";
  $("menuButton").classList.toggle("hidden",detailPage);
  $("backButton").classList.toggle("hidden",!detailPage);
  openDrawer(false);
  if(load && page==="containers") loadMyContainers();
  if(load && page==="admin") loadUsers();
}

async function login(event){
  event.preventDefault(); setMessage($("loginMessage"),"");
  const email=$("email").value.trim(); const password=$("password").value;
  if(!email || password.length<8){ setMessage($("loginMessage"),t("loginFailed")); return; }
  try{ await signInWithEmailAndPassword(auth,email,password); $("password").value=""; }
  catch(error){ console.error(error); setMessage($("loginMessage"),t("loginFailed")); }
}

async function hydrateSession(user){
  state.user=user;
  if(!user){ state.profile=null; state.isAdmin=false; $("app").classList.add("hidden"); $("pendingView").classList.add("hidden"); $("loginView").classList.remove("hidden"); return; }
  try{
    await call.ensureProfile({});
    const [profileSnap,token]=await Promise.all([getDoc(doc(db,"users",user.uid)),user.getIdTokenResult(true)]);
    state.profile=profileSnap.exists()?profileSnap.data():null; state.isAdmin=token.claims.admin===true;
    if(!state.profile?.active && !state.isAdmin){ $("loginView").classList.add("hidden"); $("app").classList.add("hidden"); $("pendingView").classList.remove("hidden"); return; }
    const displayName=state.profile?.displayName || user.email;
    $("identity").textContent=displayName; $("drawerUser").textContent=user.email; $("adminNav").classList.toggle("hidden",!state.isAdmin);
    loadDeviceState();
    $("loginView").classList.add("hidden"); $("pendingView").classList.add("hidden"); $("app").classList.remove("hidden"); showPage("containers");
  }catch(error){ console.error(error); setMessage($("loginMessage"),displayError(error)); await signOut(auth); }
}

async function getContainer(id){
  let snap=await getDoc(doc(db,"containers",id));
  if(!snap.exists() && /^0+\d+$/.test(id)){ const normalized=id.replace(/^0+/,"") || "0"; snap=await getDoc(doc(db,"containers",normalized)); }
  return snap;
}

async function findContainer(){
  const id=cleanId($("containerNumber").value); setMessage($("containerMessage"),""); $("containerResult").replaceChildren(); $("confirmContainer").classList.add("hidden"); state.searchContainer=null;
  if(!id){ setMessage($("containerMessage"),t("invalidContainer")); return; }
  try{
    const snap=await getContainer(id);
    if(!snap.exists()){ setMessage($("containerMessage"),t("notFound")); return; }
    state.searchContainer=state.containerCache[snap.id]?.container||{id:snap.id,...snap.data()}; $("containerNumber").value=state.searchContainer.number||state.searchContainer.id; renderSearchResult();
  }catch(error){ console.error(error); setMessage($("containerMessage"),displayError(error)); }
}

function renderSearchResult(){
  const c=state.searchContainer; if(!c)return;
  const target=$("containerResult"); target.replaceChildren();
  const card=node("article","container-preview"+(c.status==="completed"?" completed":""));
  const top=node("div","preview-top"); top.append(labelValue("ContainerNr.",c.number||c.id,true),labelValue(t("created"),formatDate(c.createdAt),true)); card.append(top);
  if(c.assignedName){ const owner=node("strong","preview-owner",c.assignedName); card.append(owner); }
  const body=node("div","preview-body");
  const timing=node("div","preview-timing"); timing.append(labelValue(t("started"),formatDate(c.claimedAt)),labelValue(t("finished"),formatDate(c.completedAt)));
  const totals=node("div","preview-totals"); totals.append(labelValue(t("positions"),c.itemCount||0,true),labelValue(t("articleCount"),c.totalQty||0,true),labelValue(t("picked"),c.pickedQty||0,true));
  body.append(timing,totals); card.append(body); target.append(card);
  const canClaim=!c.assignedTo; const mine=c.assignedTo===state.user.uid; const canOpen=mine||state.isAdmin;
  if(c.status==="completed"){ $("confirmContainer").classList.add("hidden"); return; }
  if(c.assignedTo&&!canOpen){ setMessage($("containerMessage"),replace(t("assignedOther"),{name:c.assignedName||"—"})); return; }
  $("confirmContainer").classList.remove("hidden");
  $("confirmContainer").dataset.action=canClaim?"claim":"open";
}

function labelValue(label,value,strong=false){
  const row=node("div","label-value"); row.append(node("span",null,label),node(strong?"b":"span",null,String(value??"—"))); return row;
}

function askConfirm(text,action){
  $("confirmText").textContent=text; state.confirmAction=action; $("confirmModal").classList.remove("hidden");
}
function closeConfirm(){ $("confirmModal").classList.add("hidden"); state.confirmAction=null; }

async function confirmSearchedContainer(){
  const c=state.searchContainer; if(!c)return;
  if($("confirmContainer").dataset.action==="open"){ await openContainer(c.id); return; }
  askConfirm(replace(t("confirmContainer"),{id:c.number||c.id}),async()=>{
    try{
      const bundle=await fetchContainerBundle(c.id);const now=new Date().toISOString();bundle.container={...bundle.container,assignedTo:state.user.uid,assignedName:state.profile?.displayName||state.user.email,status:"active",claimedAt:bundle.container.claimedAt||now,updatedAt:now};
      cacheContainer(bundle.container,bundle.items);enqueueOperation("claimContainer",{containerId:c.id});await openContainer(c.id);
    }
    catch(error){ console.error(error); setMessage($("containerMessage"),displayError(error)); }
  });
}

async function loadMyContainers(){
  const target=$("myContainers"); target.replaceChildren();
  try{
    let server=[];if(!demoMode){const snap=await getDocs(query(collection(db,"containers"),where("assignedTo","==",state.user.uid)));server=snap.docs.map(d=>({id:d.id,...d.data()}));}
    const merged=new Map(server.map(container=>[container.id,container]));Object.values(state.containerCache).forEach(bundle=>merged.set(bundle.container.id,bundle.container));
    const list=[...merged.values()].filter(container=>container.status!=="completed").sort((a,b)=>(dateFromValue(b.updatedAt)?.valueOf()||0)-(dateFromValue(a.updatedAt)?.valueOf()||0));
    if(!list.length) target.append(node("p","muted",t("notFound")));
    list.forEach(c=>{
      const card=node("button","my-container-card");
      const top=node("div","preview-top"); top.append(labelValue("ContainerNr.",c.number||c.id,true),labelValue(t("created"),formatDate(c.createdAt),true));
      const totals=node("div","my-totals"); totals.append(labelValue(t("positions"),c.itemCount||0,true),labelValue(t("picked"),`${c.pickedQty||0} / ${c.totalQty||0}`,true));
      card.append(top,totals); card.addEventListener("click",()=>openContainer(c.id)); target.append(card);
    });
  }catch(error){ console.error(error); target.append(node("p","message",displayError(error))); }
}

async function fetchContainerBundle(containerId){
  if(state.containerCache[containerId])return state.containerCache[containerId];
  if(demoMode)return {container:state.container,items:state.items};
  const response=await call.getContainerBundle({containerId});return response.data;
}
async function openContainer(containerId){
  try{
    const bundle=await fetchContainerBundle(containerId);if(!bundle?.container)throw new Error(t("notFound"));
    state.container={...bundle.container};state.items=(bundle.items||[]).map(item=>({...item})).sort((a,b)=>(a.sequence||0)-(b.sequence||0)||String(a.location||"").localeCompare(String(b.location||"")));
    cacheContainer(state.container,state.items);
    renderWork(); showPage("work",false);
  }catch(error){ console.error(error); showToast(displayError(error)); }
}

function renderWork(){
  const c=state.container; if(!c)return;
  if(state.page==="work")$("pageTitle").textContent=`Container: ${c.number||c.id}`;
  const overview=$("workOverview"); overview.replaceChildren();
  const owner=node("div","work-owner"); owner.append(node("b",null,c.assignedName||"—"),node("span",null,`${t("picked")}: ${c.pickedQty||0} / ${c.totalQty||0}`)); overview.append(owner);
  const list=$("itemsList"); list.replaceChildren();
  if(!state.items.length) list.append(node("p","muted",t("noItems")));
  state.items.forEach(item=>list.append(renderItem(item)));
  $("finishContainer").classList.toggle("hidden",c.status==="completed"||!allItemsDone());
}

function renderItem(item){
  const required=Number(item.requiredQty||0), picked=Number(item.pickedQty||0), complete=required===picked, partial=picked>0&&!complete;
  const card=node("article",`warehouse-item ${complete?"complete":partial?"partial":"open"}`); card.dataset.itemId=item.id;
  const top=node("div","warehouse-top");
  const product=node("div"); product.append(node("strong",null,item.brand||"—"),node("span",null,item.description||item.size||"—"));
  const identity=node("div","article-identity"); identity.append(node("b",null,item.articleNo||item.id),node("span",null,`${complete?"✓ ":""}EAN: ${item.ean||"—"}`));
  top.append(product,identity); card.append(top);
  const grid=node("div","warehouse-grid");
  grid.append(metric(t("quantity"),required),metric("P",item.sequence||"—"),metric(t("warehouse"),item.location||"—"),metric(t("level"),item.level||"—"),metric(t("picked"),picked));
  const places=node("button","location-button",t("locationButton")); places.type="button"; places.addEventListener("click",event=>{event.stopPropagation();showToast(`${t("warehouse")}: ${item.location||"—"} · ${t("level")}: ${item.level||"—"}`);});
  grid.append(places); card.append(grid);
  if(state.container.status!=="completed"){ card.tabIndex=0; card.setAttribute("role","button"); card.addEventListener("click",()=>openScanner(item)); card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openScanner(item);}}); }
  return card;
}
function metric(label,value){ const el=node("div","metric"); el.append(node("b",null,`${label}:`),node("span",null,String(value))); return el; }

const DEMO_ARTICLES=[
  {ean:"5420068698523",articleNo:"23-289",brand:"Nexen",size:"225/45 R18 95V",description:"N'Fera Sport SU2",physical:18,available:14,ordered:8,arrivedPending:2,sales12Months:60,averageStock12Months:100,salesRatio:0.6,locations:[{site:"Friesoythe",code:"WX14",level:1,quantity:10,available:8},{site:"Thüle",code:"K59",level:3,quantity:8,available:6}]},
  {ean:"4019238065916",articleNo:"132-777",brand:"Continental",size:"225/45 R17 91Y",description:"UltraContact",physical:9,available:7,ordered:4,arrivedPending:0,sales12Months:155,averageStock12Months:31,salesRatio:5,locations:[{site:"Markhausen",code:"WT15",level:1,quantity:9,available:7}]},
  {ean:"8808956238469",articleNo:"29-1450",brand:"Kumho",size:"205/55 R16 91H",description:"Ecsta HS52",physical:14,available:14,ordered:20,arrivedPending:4,sales12Months:56,averageStock12Months:31,salesRatio:1.8,locations:[{site:"Friesoythe",code:"9963",level:1,quantity:14}]},
  {ean:"4038526482914",articleNo:"90-1282",brand:"GOODYEAR",size:"265/60 R18 110T",description:"UltraGrip Performance+",physical:6,available:4,ordered:12,arrivedPending:0,turnover:66,locations:[{code:"8469",level:2,quantity:6}]},
  {ean:"4717784243535",articleNo:"60-90",brand:"Maxxis",size:"185 R14 104/102N",description:"CR967",physical:22,available:16,ordered:0,arrivedPending:5,turnover:31,locations:[{code:"9521",level:1,quantity:12},{code:"WW18",level:4,quantity:10}]}
];
const demoHistory={
  "5420068698523":[{from:"WX14",to:"K59",fromSite:"Friesoythe",toSite:"Thüle",user:"ANDREJS",at:"2026-09-23T10:09:00"},{from:"9000",to:"WX14",fromSite:"Friesoythe",toSite:"Friesoythe",user:"MARTIN",at:"2026-09-20T11:32:00"}],
  "8808956238469":[{from:"9482",to:"9963",user:"RAITIS",at:"2026-09-03T16:02:00"}]
};
const demoArrivals={
  "5420068698523":[{supplier:"Nexen Tire Europe 335503",date:"2026-04-14",quantity:40,old:14,new:54},{supplier:"Nexen Tire Europe 333260",date:"2026-03-12",quantity:60,old:0,new:60}],
  "8808956238469":[{supplier:"Kumho Tire Europe GmbH 335503",date:"2026-04-14",quantity:40,old:14,new:54},{supplier:"Kumho Tire Europe GmbH 312987",date:"2025-05-30",quantity:88,old:77,new:165}]
};
function normalizeArticleSearch(value){return String(value||"").normalize("NFKD").toUpperCase().replace(/[^A-Z0-9]/g,"");}
function articleMatches(article,raw,warehouseMode=false){
  const queryText=normalizeArticleSearch(raw); if(!queryText)return true;
  if(warehouseMode)return (article.locations||[]).some(place=>normalizeArticleSearch(place.code).includes(queryText)||normalizeArticleSearch(place.site).includes(queryText));
  const eanValue=normalizeArticleSearch(article.ean),articleValue=normalizeArticleSearch(article.articleNo),brand=normalizeArticleSearch(article.brand),description=normalizeArticleSearch(article.description);
  if(eanValue.includes(queryText)||articleValue.includes(queryText)||brand.includes(queryText)||description.includes(queryText))return true;
  const size=String(article.size||"").toUpperCase(); const match=size.match(/(\d{3})\D*(\d{2})\D*R?\s*(\d{2})/); const dimension=match?`${match[1]}${match[2]}${match[3]}`:"";
  const speed=(size.match(/\d{2,3}([A-Z])(?:\s|$)/)||[])[1]||"";
  const withoutBrand=brand&&queryText.includes(brand)?queryText.replace(brand,""):queryText;
  return !!dimension&&withoutBrand.includes(dimension)&&(!/[HTVWY]$/.test(withoutBrand)||withoutBrand.endsWith(speed));
}
async function searchArticles(){
  const raw=$("articleQuery").value.trim(); const warehouseMode=$("warehouseMode").checked; setMessage($("articleMessage"),""); $("articleResults").replaceChildren();
  if(!normalizeArticleSearch(raw)){state.articles=[];setMessage($("articleMessage"),warehouseMode?t("warehouseSearchHint"):t("articleSearchHint"));return;}
  const searchButton=$("searchArticles");searchButton.disabled=true;setMessage($("articleMessage"),t("searching"),true);
  try{
    let articles;
    if(demoMode)articles=DEMO_ARTICLES.filter(article=>articleMatches(article,raw,warehouseMode));
    else { const response=await call.searchArticles({query:raw,warehouseMode}); articles=response.data?.articles||[]; }
    state.articles=applyPendingArticleChanges(articles);setMessage($("articleMessage"),"");renderArticleResults();
  }catch(error){console.error(error);setMessage($("articleMessage"),displayError(error));}
  finally{searchButton.disabled=false;}
}
function applyLocationToArticle(article,payload){
  const locations=(article.locations||[]).map(place=>({...place}));const index=locations.findIndex(place=>place.code===payload.originalCode&&(!payload.originalSite||place.site===payload.originalSite));const value={site:payload.site,code:payload.code,level:payload.level,quantity:payload.quantity,available:payload.available};if(index>=0)locations[index]=value;else locations.push(value);return {...article,locations,physical:locations.reduce((sum,item)=>sum+Number(item.quantity||0),0),available:locations.reduce((sum,item)=>sum+Number(item.available??item.quantity??0),0)};
}
function applyPendingArticleChanges(articles){return articles.map(article=>state.pendingOperations.filter(operation=>operation.type==="saveTireLocation"&&operation.payload.ean===article.ean).reduce((value,operation)=>applyLocationToArticle(value,operation.payload),article));}
function renderArticleResults(){
  const target=$("articleResults"); target.replaceChildren();
  if(!state.articles.length){target.append(node("p","muted",t("noArticles")));return;}
  state.articles.forEach(article=>target.append(renderTireCard(article)));
}
function renderTireCard(article){
  const card=node("article","tire-card");
  const head=node("div","tire-card-head"); head.append(node("strong",null,article.brand||"—"),node("b",null,article.articleNo||"—"));
  const sub=node("div","tire-card-sub"); sub.append(node("span",null,`${article.size||""} ${article.description||""}`.trim()));
  const salesRatio=Number.isFinite(Number(article.salesRatio))?Math.max(0,Number(article.salesRatio)):Math.max(0,Number(article.turnover||0))/20;const turnoverValue=Math.max(0,Math.min(100,salesRatio*20));const turnover=node("div","turnover");turnover.title=`${salesRatio.toLocaleString(state.lang,{minimumFractionDigits:1,maximumFractionDigits:1})} / 5`;const bar=node("span");bar.style.setProperty("--rating-width",`${turnoverValue}%`);const turnoverText=node("small",null,`${salesRatio.toLocaleString(state.lang,{minimumFractionDigits:1,maximumFractionDigits:1})}  (${t("salesPeriod")}, ${t("averageStock")} ${Math.round(Number(article.averageStock12Months??article.physical??0))})`);turnover.append(bar,turnoverText);
  const locations=article.locations||[];const sites=[...new Set(locations.map(place=>String(place.site||"Friesoythe").trim().toUpperCase()).filter(Boolean))];const multiSite=sites.length>=2;const markhausen=sites.includes("MARKHAUSEN");const warehouseQuery=normalizeArticleSearch($("articleQuery").value);const first=($("warehouseMode").checked?locations.find(place=>normalizeArticleSearch(place.code).includes(warehouseQuery)):null)||locations[0]||{};
  const inventory=node("div","inventory-grid");
  const redStock=multiSite||markhausen;
  const stockColumn=node("div","inventory-column");[["P",article.physical],["V",article.available]].forEach(([key,value])=>{const className=[redStock?"stock-link red-stock":"",Number(value)<1?"low":""].filter(Boolean).join(" ");const item=node("div","stock-code");const amount=node(redStock?"button":"span",className||null,String(value??0));if(redStock){amount.type="button";amount.title=t("total");amount.addEventListener("click",()=>openSiteStock(article));}item.append(node("b",null,key),amount);stockColumn.append(item);});
  const pendingColumn=node("div","inventory-column");[["T",article.arrivedPending],["B",article.ordered]].forEach(([key,value])=>{const item=node("div","stock-code");item.append(node("b",null,key),node("span",Number(value)<1?"empty":null,String(value??0)));pendingColumn.append(item);});
  const detailColumn=node("div","inventory-column inventory-details");detailColumn.append(node("b",null,"DOT"),node("span",null,`${t("warehouse")}  ${first.code||"—"}`));
  const level=node("div","inventory-level");level.append(node("b",null,t("level")),node("span",null,String(first.level||"—")));
  const print=node("button","print-button");print.type="button";print.setAttribute("aria-label",t("print"));print.title=t("print");print.addEventListener("click",()=>window.print());
  inventory.append(stockColumn,pendingColumn,detailColumn,level,print);
  const actions=node("div","tire-actions"); [[t("locationButton"),"places"],[t("history"),"history"],[t("arrivals"),"arrivals"]].forEach(([label,view])=>{const button=node("button",view==="places"&&multiSite?"multi-site-button":null,label);button.type="button";button.addEventListener("click",()=>openArticleDetail(article,view));actions.append(button);});
  card.append(head,sub,turnover,inventory,actions);return card;
}
function articleHeader(article){const header=node("div","article-detail-header");const top=node("div");top.append(node("strong",null,article.brand||"—"),node("b",null,article.articleNo||"—"));header.append(top,node("p",null,`${article.size||""} ${article.description||""}`.trim()));return header;}
function openSiteStock(article){
  $("siteStockTitle").textContent=article.brand||"—";$("siteStockArticle").textContent=article.articleNo||"—";$("siteStockSubtitle").textContent=`${article.size||""} ${article.description||""}`.trim();
  const totals=$("siteStockTotals");totals.replaceChildren();[["P",article.physical],["V",article.available]].forEach(([label,value])=>{totals.append(node("b",null,label),node("span",null,String(value??0)));});
  const sites=$("siteStockSites");sites.replaceChildren();const grouped=new Map();(article.locations||[]).forEach(place=>{const name=place.site||"Friesoythe";const value=grouped.get(name)||{physical:0,available:0};value.physical+=Number(place.quantity||0);value.available+=Number(place.available??place.quantity??0);grouped.set(name,value);});
  grouped.forEach((value,name)=>{const column=node("div","site-stock-column");column.append(node("strong",null,name));const values=node("div","site-stock-values");values.append(node("b",null,"P"),node("span",null,String(value.physical)),node("b",null,"V"),node("span",null,String(value.available)));column.append(values);sites.append(column);});
  $("siteStockModal").classList.remove("hidden");
}
function closeSiteStock(){$("siteStockModal").classList.add("hidden");}
async function getArticleDetails(article,view){
  const key=`${article.ean}:${view}`;if(state.detailCache.has(key))return state.detailCache.get(key);
  let details;if(demoMode)details={...article,...(view==="history"?{history:demoHistory[article.ean]||[]}:{arrivals:demoArrivals[article.ean]||[]})};
  else {const response=await call.getTireDetails({ean:article.ean,include:view});details=response.data;}
  if(view==="history"&&!demoMode){const pending=state.pendingOperations.filter(operation=>operation.type==="saveTireLocation"&&operation.payload.ean===article.ean).map(operation=>({from:operation.payload.originalCode||"—",to:operation.payload.code,user:state.profile?.displayName||state.user?.email||"—",at:operation.createdAt}));details={...details,history:[...pending,...(details.history||[])]};}
  state.detailCache.set(key,details);return details;
}
async function openArticleDetail(article,view){
  state.selectedArticle={...article};const page=`article${view[0].toUpperCase()}${view.slice(1)}`;renderArticleDetail(view,view!=="places");showPage(page,false);
  if(view==="places")return;
  try{const details=await getArticleDetails(article,view);if(state.selectedArticle?.ean!==article.ean||state.page!==page)return;state.selectedArticle={...state.selectedArticle,...details};renderArticleDetail(view);}
  catch(error){console.error(error);showToast(displayError(error));}
}
function renderArticleDetail(view,loading=false){
  const article=state.selectedArticle;if(!article)return;
  if(view==="places"){
    $("placesArticleHeader").replaceChildren(articleHeader(article));
    const summary=$("placesSummary");summary.replaceChildren();const physical=node("div");physical.append(node("span",null,t("physicalStock")),node("b",null,String(article.physical??0)));const available=node("div");available.append(node("span",null,t("availableStock")),node("b",null,String(article.available??0)));summary.append(physical,available);$("addLocation").textContent=t("add");$("addLocation").classList.toggle("hidden",!state.isAdmin);renderLocations();
  }else if(view==="history"){
    $("historyArticleHeader").replaceChildren(articleHeader(article));const target=$("articleHistory");target.replaceChildren();
    const header=node("div","history-row header");[t("warehouse"),t("user"),t("date"),t("time")].forEach(value=>header.append(node("span",null,value)));target.append(header);
    if(loading){target.append(node("p","muted",t("historyLoading")));return;}
    const entries=article.history||[];if(!entries.length)target.append(node("p","muted",t("noHistory")));
    entries.forEach(entry=>{const date=dateFromValue(entry.at);const row=node("div","history-row");[`${entry.from||"—"} → ${entry.to||"—"}`,entry.user||"—",date?date.toLocaleDateString(state.lang):"—",date?date.toLocaleTimeString(state.lang,{hour:"2-digit",minute:"2-digit"}):"—"].forEach(value=>row.append(node("span",null,value)));target.append(row);});
  }else{
    $("arrivalsArticleHeader").replaceChildren(articleHeader(article));const target=$("articleArrivals");target.replaceChildren();
    if(loading){target.append(node("p","muted",t("arrivalsLoading")));return;}
    const entries=article.arrivals||[];if(!entries.length)target.append(node("p","muted",t("noArrivals")));
    entries.forEach(entry=>{const date=dateFromValue(entry.date);const card=node("article","arrival-card");const head=node("div","arrival-head");head.append(node("span",null,entry.supplier||"—"),node("span",null,date?date.toLocaleDateString(state.lang):"—"));const values=node("div","arrival-values");[[t("arrival"),entry.quantity],[t("oldStock"),entry.old],[t("newStock"),entry.new]].forEach(([label,value])=>{const field=node("span");field.append(node("small",null,label),node("b",null,String(value??0)));values.append(field);});card.append(head,values);target.append(card);});
  }
}
function renderLocations(){
  const target=$("articleLocations");target.replaceChildren();const locations=state.selectedArticle?.locations||[];
  const totals=node("section","site-totals");const grouped=new Map();locations.forEach(place=>{const name=place.site||"Friesoythe";const current=grouped.get(name)||{physical:0,available:0};current.physical+=Number(place.quantity||0);current.available+=Number(place.available??place.quantity??0);grouped.set(name,current);});grouped.forEach((value,name)=>{const column=node("div","site-total");column.append(node("strong",null,name),node("span",null,`P  ${value.physical}`),node("span",null,`V  ${value.available}`));totals.append(column);});if(grouped.size)target.append(totals);
  const grid=node("section","location-grid");locations.forEach((place,index)=>{const record=node("article","location-record");const top=node("div","location-record-top");top.append(node("strong",null,`LP ${index+1}`),node("small",null,place.site||"Friesoythe"));if(state.isAdmin){const edit=node("button","icon-flat","✎");edit.type="button";edit.setAttribute("aria-label",t("editStoragePlace"));edit.addEventListener("click",()=>openLocationDialog(place));top.append(edit);}const stack=node("div","level-stack");[5,4,3,2,1].forEach(level=>{const row=node("div",`level-row${Number(place.level)===level?" active":""}`,String(level));if(Number(place.level)===level)row.append(node("b",null,place.code));stack.append(row);});record.append(top,stack);grid.append(record);});target.append(grid);
}
function openLocationDialog(place=null){if(!state.isAdmin){showToast(t("adminStockOnly"));return;}$("locationOriginal").value=place?.code||"";$("locationOriginalSite").value=place?.site||"";$("locationSite").value=place?.site||"Friesoythe";$("locationCode").value=place?.code||"";$("locationLevel").value=String(place?.level||1);$("locationQuantity").value=String(place?.quantity||0);$("locationAvailable").value=String(place?.available??place?.quantity??0);setMessage($("locationMessage"),"");$("locationModal").classList.remove("hidden");}
function closeLocationDialog(){$("locationModal").classList.add("hidden");}
async function saveLocation(event){
  event.preventDefault();const payload={ean:state.selectedArticle.ean,originalCode:$("locationOriginal").value,originalSite:$("locationOriginalSite").value,site:$("locationSite").value.trim(),code:$("locationCode").value.trim().toUpperCase(),level:Number($("locationLevel").value),quantity:Number($("locationQuantity").value),available:Number($("locationAvailable").value)};
  try{
    const previous=(state.selectedArticle.locations||[]).find(place=>place.code===payload.originalCode&&(!payload.originalSite||place.site===payload.originalSite));state.selectedArticle=applyLocationToArticle(state.selectedArticle,payload);
    if(demoMode){const history=demoHistory[state.selectedArticle.ean]||(demoHistory[state.selectedArticle.ean]=[]);history.unshift({from:previous?.code||"—",to:payload.code,user:state.profile?.displayName||"Administrator",at:new Date().toISOString()});}
    else enqueueOperation("saveTireLocation",payload);
    const articleIndex=state.articles.findIndex(article=>article.ean===state.selectedArticle.ean);if(articleIndex>=0)state.articles[articleIndex]={...state.articles[articleIndex],...state.selectedArticle};renderArticleResults();state.detailCache.delete(`${state.selectedArticle.ean}:history`);closeLocationDialog();renderArticleDetail("places");showToast(t("storagePlaceSaved"));
  }catch(error){console.error(error);setMessage($("locationMessage"),displayError(error));}
}
async function openArticleScanner(){
  $("articleEanInput").value="";setMessage($("articleScanMessage"),"");$("articleScannerModal").classList.remove("hidden");
  if(!("BarcodeDetector" in window)||!navigator.mediaDevices?.getUserMedia){setMessage($("articleScanMessage"),t("cameraUnavailable"));$("articleEanInput").focus();return;}
  try{const formats=await BarcodeDetector.getSupportedFormats();const detector=new BarcodeDetector({formats:["ean_13","ean_8","upc_a","code_128"].filter(value=>formats.includes(value))});state.articleStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});const video=$("articleCamera");video.srcObject=state.articleStream;video.style.display="block";await video.play();const tick=async()=>{if(!state.articleStream)return;try{const codes=await detector.detect(video);if(codes[0]?.rawValue){$("articleEanInput").value=cleanEan(codes[0].rawValue);await useArticleEan();return;}}catch{}state.articleScanTimer=setTimeout(tick,220);};tick();}catch(error){console.error(error);setMessage($("articleScanMessage"),t("cameraUnavailable"));}
}
async function closeArticleScanner(){clearTimeout(state.articleScanTimer);state.articleScanTimer=null;state.articleStream?.getTracks().forEach(track=>track.stop());state.articleStream=null;const video=$("articleCamera");video.pause();video.srcObject=null;video.style.display="none";$("articleScannerModal").classList.add("hidden");}
async function useArticleEan(){const value=cleanEan($("articleEanInput").value);if(value.length<8){setMessage($("articleScanMessage"),"EAN ist ungültig.");return;}await closeArticleScanner();$("warehouseMode").checked=false;$("articleQuery").value=value;showPage("article",false);await searchArticles();}

function openScanner(item){
  state.selected=item;
  $("scanTitle").textContent=`${item.brand||""} ${item.description||item.size||""}`.trim();
  $("scanRequired").textContent=String(Number(item.requiredQty||0)-Number(item.pickedQty||0));
  $("scanDescription").textContent=item.articleNo||item.id;
  $("scannedEan").value=""; $("pickedQuantity").value=String(Number(item.requiredQty||0)-Number(item.pickedQty||0));
  setMessage($("scanMessage"),""); validateEan(); $("scanModal").classList.remove("hidden"); setTimeout(()=>$("scannedEan").focus(),80);
}
async function closeScanner(){ await stopCamera(); $("scanModal").classList.add("hidden"); state.selected=null; }

function validateEan(){
  const entered=cleanEan($("scannedEan").value); $("scannedEan").value=entered;
  const expected=cleanEan(state.selected?.ean); const good=entered.length>=8&&entered===expected;
  $("eanState").textContent=good?"✓":entered?"×":"○"; $("eanState").className=`ean-state ${good?"good":entered?"bad":""}`;
  $("eanFeedback").className=`scan-feedback ${entered?(good?"good":"bad"):"neutral"}`;
  $("eanFeedback").textContent=entered?(good?t("correctEan"):t("wrongEan")):"";
  $("confirmPick").disabled=!good; return good;
}

async function startCamera(){
  if(!("BarcodeDetector" in window)||!navigator.mediaDevices?.getUserMedia){ setMessage($("scanMessage"),t("cameraUnavailable")); return; }
  try{
    const formats=await BarcodeDetector.getSupportedFormats(); const wanted=["ean_13","ean_8","upc_a","upc_e","code_128"].filter(x=>formats.includes(x));
    const detector=new BarcodeDetector({formats:wanted.length?wanted:formats});
    state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false});
    const video=$("camera"); video.srcObject=state.stream; video.style.display="block"; await video.play();
    const tick=async()=>{ if(!state.stream)return; try{const codes=await detector.detect(video);if(codes[0]?.rawValue){$("scannedEan").value=cleanEan(codes[0].rawValue);if(validateEan())await stopCamera();}}catch{} if(state.stream)state.scanTimer=setTimeout(tick,220); }; tick();
  }catch(error){ console.error(error); setMessage($("scanMessage"),t("cameraUnavailable")); await stopCamera(); }
}
async function stopCamera(){ clearTimeout(state.scanTimer); state.scanTimer=null; state.stream?.getTracks().forEach(track=>track.stop()); state.stream=null; const video=$("camera"); video.pause(); video.srcObject=null; video.style.display="none"; }

async function submitPick(event){
  event.preventDefault(); if(!validateEan())return;
  const remaining=Number(state.selected.requiredQty||0)-Number(state.selected.pickedQty||0); const quantity=Number($("pickedQuantity").value);
  if(!Number.isInteger(quantity)||quantity<1||quantity>remaining){ setMessage($("scanMessage"),`1–${remaining}`); return; }
  if(quantity<remaining){ askConfirm(t("partial"),()=>savePick(quantity)); return; }
  await savePick(quantity);
}
async function savePick(quantity){
  setMessage($("scanMessage"),"");
  try{
    const selectedId=state.selected.id;
    const item=state.items.find(entry=>entry.id===selectedId);if(!item)throw new Error(t("notFound"));const scannedEan=cleanEan($("scannedEan").value);
    item.pickedQty=Number(item.pickedQty||0)+quantity;item.status=item.pickedQty===Number(item.requiredQty||0)?"completed":"active";state.container.pickedQty=state.items.reduce((sum,entry)=>sum+Number(entry.pickedQty||0),0);state.container.updatedAt=new Date().toISOString();cacheContainer(state.container,state.items);
    if(!demoMode)enqueueOperation("confirmPick",{containerId:state.container.id,itemId:selectedId,ean:scannedEan,quantity});
    await closeScanner();renderWork();document.querySelector(`[data-item-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});showToast(`${t("saved")} · Synchronisierung ausstehend`);
  }catch(error){ console.error(error); setMessage($("scanMessage"),displayError(error)); }
}

function requestFinalize(){
  if(!allItemsDone()){ showToast(t("completeFirst")); return; }
  askConfirm(t("confirmFinish"),async()=>{
    try{
      state.container.status="completed";state.container.completedAt=new Date().toISOString();state.container.updatedAt=state.container.completedAt;cacheContainer(state.container,state.items);if(!demoMode)enqueueOperation("finalizeContainer",{containerId:state.container.id});state.searchContainer=null;showPage("containers");showToast(`${t("allDone")} · Synchronisierung ausstehend`);
    }
    catch(error){ console.error(error); showToast(displayError(error)); }
  });
}

async function loadUsers(){
  if(!state.isAdmin)return; const target=$("usersList"); target.replaceChildren();
  if(demoMode){const card=node("div","user-card");const info=node("div");info.append(node("b",null,"ANDREJS"),node("p",null,"demo@local · admin"));card.append(info);target.append(card);return;}
  try{
    const snap=await getDocs(collection(db,"users"));
    snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.email||"").localeCompare(String(b.email||""))).forEach(user=>{
      const card=node("div","user-card"); const info=node("div"); info.append(node("b",null,user.displayName||"Name nicht vergeben"),node("p",null,`${user.email||"—"} · ${user.role||"worker"}`));
      const actions=node("div","user-actions");const nameButton=node("button","secondary","Name ändern");nameButton.addEventListener("click",()=>editUserName(user));const accessButton=node("button",user.active?"secondary":"primary",user.active?t("deactivate"):t("activate"));accessButton.addEventListener("click",()=>editUser(user,!user.active));actions.append(nameButton,accessButton);card.append(info,actions);target.append(card);
    });
  }catch(error){ console.error(error); target.append(node("p","message",displayError(error))); }
}
async function editUser(user,active){ const displayName=active?(prompt("Name:",user.displayName||"")||"").trim():user.displayName; if(active&&!displayName)return; try{await call.setUserAccess({uid:user.id,active,displayName,role:user.role==="admin"?"admin":"worker"});await loadUsers();}catch(error){alert(displayError(error));} }
async function editUserName(user){const displayName=(prompt("Name des Mitarbeiters:",user.displayName||"")||"").trim();if(!displayName)return;try{await call.setUserAccess({uid:user.id,active:user.active===true,displayName,role:user.role==="admin"?"admin":"worker"});await loadUsers();showToast("Name gespeichert.");}catch(error){alert(displayError(error));}}
function parseContainerBulk(value){
  return String(value||"").split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
    const parts=line.split(/\t|;|,|\s+/).map(value=>value.trim()).filter(Boolean);if(index===0&&/artikel|article/i.test(parts[0]||""))return null;
    return {articleNo:parts[0]||"",requiredQty:Number(parts[1]||1)};
  }).filter(Boolean);
}
async function resolveContainerRows(rows){
  if(!rows.length)throw new Error("Mindestens eine Artikelnummer eingeben.");
  if(rows.length>70)throw new Error("Maximal 70 Positionen pro Container.");
  rows.forEach(row=>{if(!row.articleNo||!Number.isInteger(row.requiredQty)||row.requiredQty<1||row.requiredQty>70)throw new Error(`Ungültige Position: ${row.articleNo||"ohne Artikelnummer"}.`);});
  const requestedTotal=rows.reduce((sum,row)=>sum+row.requiredQty,0);if(requestedTotal>70)throw new Error(t("max70"));
  let articles;
  if(demoMode)articles=DEMO_ARTICLES.filter(article=>rows.some(row=>normalizeArticleSearch(row.articleNo)===normalizeArticleSearch(article.articleNo)));
  else {const response=await call.resolveContainerArticles({articleNumbers:rows.map(row=>row.articleNo)});articles=response.data?.articles||[];}
  const byNumber=new Map(articles.map(article=>[normalizeArticleSearch(article.articleNo),article]));const missing=[];
  const resolved=rows.map(row=>{const article=byNumber.get(normalizeArticleSearch(row.articleNo));if(!article){missing.push(row.articleNo);return null;}const place=(article.locations||[]).find(location=>Number(location.available??location.quantity??0)>0)||(article.locations||[])[0]||{};return {articleNo:article.articleNo,ean:article.ean,brand:article.brand,size:article.size,description:article.description,location:place.code||"—",level:String(place.level||1),requiredQty:row.requiredQty};}).filter(Boolean);
  if(missing.length)throw new Error(`Nicht im Reifenkatalog gefunden: ${missing.join(", ")}`);
  return resolved;
}
function appendContainerDraft(items){
  const next=state.containerDraftItems.map(item=>({...item}));items.forEach(item=>{const existing=next.find(value=>normalizeArticleSearch(value.articleNo)===normalizeArticleSearch(item.articleNo));if(existing)existing.requiredQty+=item.requiredQty;else next.push({...item});});
  const total=next.reduce((sum,value)=>sum+value.requiredQty,0);if(total>70)throw new Error(t("max70"));
  next.forEach((item,index)=>{item.id=String(index+1);item.sequence=index+1;});state.containerDraftItems=next;renderContainerDraft();
}
async function addContainerDraftItem(){
  setMessage($("adminMessage"),"");const button=$("addContainerItem");button.disabled=true;
  try{setMessage($("adminMessage"),"Artikel wird gesucht …",true);const items=await resolveContainerRows([{articleNo:$("itemArticleNo").value.trim(),requiredQty:Number($("itemQuantity").value)}]);appendContainerDraft(items);$("itemArticleNo").value="";$("itemQuantity").value="1";setMessage($("adminMessage"),"Artikel und Lagerplatz wurden übernommen.",true);$("itemArticleNo").focus();}
  catch(error){setMessage($("adminMessage"),displayError(error));}finally{button.disabled=false;}
}
async function addContainerBulk(){
  const button=$("addContainerBulk");button.disabled=true;setMessage($("adminMessage"),"Liste wird geprüft …",true);
  try{const items=await resolveContainerRows(parseContainerBulk($("containerBulkText").value));appendContainerDraft(items);$("containerBulkText").value="";setMessage($("adminMessage"),`${items.length} Positionen wurden übernommen.`,true);}
  catch(error){setMessage($("adminMessage"),displayError(error));}finally{button.disabled=false;}
}
function renderContainerDraft(){const target=$("containerDraftList");target.replaceChildren();state.containerDraftItems.forEach((item,index)=>{const row=node("div","draft-row");const text=node("span");text.append(node("b",null,`${item.articleNo} · ${item.brand}`),node("small",null,`${item.size} · ${item.location}/${item.level} · ${item.requiredQty} St.`));const remove=node("button","icon-flat","✕");remove.type="button";remove.addEventListener("click",()=>{state.containerDraftItems.splice(index,1);state.containerDraftItems.forEach((value,i)=>{value.id=String(i+1);value.sequence=i+1;});renderContainerDraft();});row.append(text,remove);target.append(row);});}
function saveContainerForm(event){event.preventDefault();setMessage($("adminMessage"),"");try{const number=cleanId($("containerAdminNumber").value);if(!number||!state.containerDraftItems.length)throw new Error("Containernummer und mindestens eine Position sind erforderlich.");const payload={number,orderNumber:$("containerOrder").value.trim(),items:state.containerDraftItems.map(item=>({...item}))};enqueueOperation("importContainer",payload);state.containerDraftItems=[];event.target.reset();renderContainerDraft();setMessage($("adminMessage"),"Container gespeichert. Bitte synchronisieren.",true);}catch(error){setMessage($("adminMessage"),displayError(error));}}
function saveTireForm(event){event.preventDefault();setMessage($("tireImportMessage"),"");try{const physical=Number($("tirePhysical").value),available=Number($("tireAvailable").value);if(available>physical)throw new Error("Verfügbarer Bestand darf nicht größer als P sein.");const tire={ean:cleanEan($("tireEan").value),articleNo:$("tireArticleNo").value.trim(),brand:$("tireBrand").value.trim(),size:$("tireSize").value.trim(),description:$("tireModel").value.trim(),ordered:Number($("tireOrdered").value),arrivedPending:Number($("tireArrived").value),sales12Months:Number($("tireSales").value),averageStock12Months:Number($("tireAverageStock").value),locations:[{site:$("tireSite").value.trim(),code:$("tireLocation").value.trim().toUpperCase(),level:Number($("tireLevel").value),quantity:physical,available}]};if(tire.ean.length<8||!tire.articleNo||!tire.brand||!tire.size||!tire.locations[0].code)throw new Error("Bitte alle Pflichtfelder korrekt ausfüllen.");enqueueOperation("importTires",{tires:[tire]});event.target.reset();$("tireSite").value="Friesoythe";$("tireLevel").value="1";["tirePhysical","tireAvailable","tireOrdered","tireArrived","tireSales","tireAverageStock"].forEach(id=>$(id).value="0");setMessage($("tireImportMessage"),"Artikel gespeichert. Bitte synchronisieren.",true);}catch(error){setMessage($("tireImportMessage"),displayError(error));}}
function parseDelimitedRow(line,delimiter){let values=[],current="",quoted=false;for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'){if(quoted&&line[i+1]==='"'){current+='"';i++;}else quoted=!quoted;}else if(char===delimiter&&!quoted){values.push(current.trim());current="";}else current+=char;}values.push(current.trim());return values;}
function headerKey(value){return String(value||"").replace(/ß/g,"ss").replace(/ø/g,"o").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");}
function parseCatalogBulk(value){
  const lines=String(value||"").replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim());if(lines.length<2)throw new Error("Die Datei muss eine Kopfzeile und mindestens einen Artikel enthalten.");
  const first=lines[0],delimiter=["\t",";",","].sort((a,b)=>first.split(b).length-first.split(a).length)[0];const headers=parseDelimitedRow(first,delimiter).map(headerKey);const aliases={articleNo:["artikelnummer","artikelnr","articleno","artno"],ean:["ean","barcode"],brand:["marke","brand"],size:["grosse","groesse","size"],description:["modell","model","bezeichnung","description"],site:["standort","site","locationname"],code:["lager","lagerplatz","code","location"],level:["ebene","level"],physical:["p","bestand","physical"],available:["v","verfugbar","available"],ordered:["b","bestellt","ordered"],arrivedPending:["t","eingetroffen","arrived"],sales12Months:["verkaufe12","verkauf12","sales12months"],averageStock12Months:["bestand12","durchschnitt12","obestand12","averagestock12months"]};
  const indexes={};Object.entries(aliases).forEach(([key,names])=>{indexes[key]=headers.findIndex(header=>names.includes(header));});["articleNo","ean","brand","size","code"].forEach(key=>{if(indexes[key]<0)throw new Error(`Pflichtspalte fehlt: ${aliases[key][0]}.`);});
  const number=(row,key,fallback=0)=>{const raw=indexes[key]>=0?row[indexes[key]]:"";const value=raw===""?fallback:Number(String(raw).replace(",","."));if(!Number.isFinite(value)||value<0)throw new Error(`Ungültiger Zahlenwert in ${key}.`);return Math.round(value);};
  const textValue=(row,key,fallback="")=>indexes[key]>=0?(row[indexes[key]]||fallback):fallback;
  const tires=lines.slice(1).map((line,index)=>{const row=parseDelimitedRow(line,delimiter);const physical=number(row,"physical",0),available=number(row,"available",physical);if(available>physical)throw new Error(`Zeile ${index+2}: V darf nicht größer als P sein.`);const tire={articleNo:textValue(row,"articleNo"),ean:cleanEan(textValue(row,"ean")),brand:textValue(row,"brand"),size:textValue(row,"size"),description:textValue(row,"description"),ordered:number(row,"ordered",0),arrivedPending:number(row,"arrivedPending",0),sales12Months:number(row,"sales12Months",0),averageStock12Months:number(row,"averageStock12Months",physical),locations:[{site:textValue(row,"site","Friesoythe"),code:textValue(row,"code").toUpperCase(),level:number(row,"level",1),quantity:physical,available}]};if(!tire.articleNo||tire.ean.length<8||!tire.brand||!tire.size||!tire.locations[0].code)throw new Error(`Zeile ${index+2} enthält unvollständige Pflichtdaten.`);return tire;});
  if(!tires.length||tires.length>10000)throw new Error("1 bis 10000 Artikel pro Datei sind möglich.");return tires;
}
function importCatalogBulk(){setMessage($("catalogBulkMessage"),"");try{const tires=parseCatalogBulk($("catalogBulkText").value);for(let index=0;index<tires.length;index+=100)state.pendingOperations.push({id:crypto.randomUUID?.()||`${Date.now()}-${index}`,type:"importTires",payload:{tires:tires.slice(index,index+100)},createdAt:new Date().toISOString()});persistDeviceState();setMessage($("catalogBulkMessage"),`${tires.length} Artikel in ${Math.ceil(tires.length/100)} Paketen vorgemerkt. Jetzt über ⋮ synchronisieren.`,true);}catch(error){setMessage($("catalogBulkMessage"),displayError(error));}}
async function loadCatalogFile(event){const file=event.target.files?.[0];if(!file)return;try{$("catalogBulkText").value=await file.text();setMessage($("catalogBulkMessage"),`${file.name} geladen. Bitte Liste prüfen und vormerken.`,true);}catch(error){setMessage($("catalogBulkMessage"),displayError(error));}}

$("loginForm").addEventListener("submit",login); $("pendingLogout").addEventListener("click",()=>signOut(auth)); $("logoutButton").addEventListener("click",()=>signOut(auth));
$("menuButton").addEventListener("click",()=>openDrawer(true)); $("drawerShade").addEventListener("click",()=>openDrawer(false)); $("backButton").addEventListener("click",()=>showPage(state.page.startsWith("article")?"article":"containers",false));
document.querySelectorAll(".nav-item[data-page]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
$("language").addEventListener("change",event=>{state.lang=event.target.value;localStorage.setItem("tirescan.lang",state.lang);applyLanguage();});
$("findContainer").addEventListener("click",findContainer); $("containerNumber").addEventListener("keydown",event=>{if(event.key==="Enter")findContainer();}); $("scanContainer").addEventListener("click",()=>{showToast(t("cameraUnavailable"));$("containerNumber").focus();});
$("confirmContainer").addEventListener("click",confirmSearchedContainer); $("refreshMine").addEventListener("click",loadMyContainers); $("finishContainer").addEventListener("click",requestFinalize);
$("scannedEan").addEventListener("input",validateEan); $("startCamera").addEventListener("click",startCamera); $("closeScanner").addEventListener("click",closeScanner); $("pickForm").addEventListener("submit",submitPick);
$("confirmNo").addEventListener("click",closeConfirm); $("confirmYes").addEventListener("click",async()=>{const action=state.confirmAction;closeConfirm();if(action)await action();});
$("loadUsers").addEventListener("click",loadUsers);$("addContainerItem").addEventListener("click",addContainerDraftItem);$("addContainerBulk").addEventListener("click",addContainerBulk);$("containerAdminForm").addEventListener("submit",saveContainerForm);$("tireAdminForm").addEventListener("submit",saveTireForm);$("catalogBulkFile").addEventListener("change",loadCatalogFile);$("importCatalogBulk").addEventListener("click",importCatalogBulk);
$("articleSearchForm").addEventListener("submit",event=>{event.preventDefault();searchArticles();});
$("warehouseMode").addEventListener("change",()=>{$("articleQuery").placeholder=$("warehouseMode").checked?(state.lang==="ru"?"Место, например K59":state.lang==="en"?"Location, e.g. K59":"Lagerplatz, z. B. K59"):"225/45 R18 V Nexen";$("articleSearchHint").textContent=$("warehouseMode").checked?t("warehouseSearchHint"):t("articleSearchHint");});
$("scanArticle").addEventListener("click",openArticleScanner);$("closeArticleScanner").addEventListener("click",closeArticleScanner);$("useArticleEan").addEventListener("click",useArticleEan);$("articleEanInput").addEventListener("keydown",event=>{if(event.key==="Enter")useArticleEan();});
$("addLocation").addEventListener("click",()=>openLocationDialog());$("cancelLocation").addEventListener("click",closeLocationDialog);$("locationForm").addEventListener("submit",saveLocation);
$("closeSiteStock").addEventListener("click",closeSiteStock);$("siteStockModal").addEventListener("click",event=>{if(event.target===$("siteStockModal"))closeSiteStock();});
$("messageButton").addEventListener("click",()=>showToast("Keine neuen Nachrichten"));$("moreButton").addEventListener("click",event=>{event.stopPropagation();$("moreMenu").classList.toggle("hidden");updateSyncUi();});$("syncNow").addEventListener("click",syncNow);document.addEventListener("click",event=>{if(!$("moreMenu").contains(event.target)&&event.target!==$("moreButton"))$("moreMenu").classList.add("hidden");});
if(demoMode){
  state.user={uid:"demo"}; state.profile={displayName:"ANDREJS",active:true};state.isAdmin=true;loadDeviceState(); state.container={id:"23620",number:"23620",assignedTo:"demo",assignedName:"ANDREJS",status:"active",itemCount:4,totalQty:12,pickedQty:8};
  state.items=[
    {id:"1",sequence:10,brand:"GOODYEAR",description:"265/60 R 18 110T Wran +",articleNo:"90-1282",ean:"4038526482914",location:"8469",level:"1",requiredQty:4,pickedQty:4},
    {id:"2",sequence:77,brand:"Maxxis",description:"185 R 14 104/102N CR967",articleNo:"60-90",ean:"4717784243535",location:"9521",level:"1",requiredQty:2,pickedQty:1},
    {id:"3",sequence:252,brand:"Kumho",description:"205/55 R 16 91H ES31",articleNo:"29-1450",ean:"8808956238469",location:"9223",level:"1",requiredQty:4,pickedQty:3},
    {id:"4",sequence:107,brand:"PIRELLI",description:"255/45 R 19 104V WSZ3 MO",articleNo:"237-551",ean:"8019227409284",location:"9601",level:"1",requiredQty:2,pickedQty:0}
  ];
  cacheContainer(state.container,state.items);$("loginView").classList.add("hidden"); $("app").classList.remove("hidden");$("adminNav").classList.remove("hidden"); $("drawerUser").textContent="demo@local"; $("identity").textContent="ANDREJS";showPage("containers");
}else{
  onAuthStateChanged(auth,hydrateSession);
}
applyLanguage();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
