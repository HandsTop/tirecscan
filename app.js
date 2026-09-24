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
    picking:"Kommissionierung", myContainers:"Meine Container", administration:"Verwaltung", language:"Sprache", containerNumber:"Containernummer", continueWork:"Aktive und zuletzt bearbeitete Aufträge",
    userAccess:"Benutzerzugang", userAccessHint:"Konten aktivieren und Anzeigenamen vergeben.", reload:"Neu laden", importContainer:"Container importieren", importHint:"JSON mit Container und Positionen einfügen. Bestehende Container werden nicht überschrieben.", import:"Importieren",
    notFound:"Container nicht gefunden.", invalidContainer:"Bitte eine gültige Containernummer eingeben.", loadFailed:"Daten konnten nicht geladen werden.", loginFailed:"Anmeldung fehlgeschlagen. Zugangsdaten prüfen.",
    activate:"Aktivieren", deactivate:"Sperren", imported:"Container wurde importiert.", max70:"Ein Container darf höchstens 70 Reifen enthalten.", demoModule:"Dieses Modul ist für die nächste Ausbaustufe vorbereitet.",
    scan:"SCAN", commissioned:"Kommissioniert", cancel:"ABBRECHEN", done:"ERLEDIGT", wrongEan:"Falscher Reifen – EAN stimmt nicht.", correctEan:"EAN bestätigt.", cameraUnavailable:"Kamera/Barcode-Erkennung ist nicht verfügbar. EAN kann manuell eingegeben werden.",
    confirmContainer:"Bist Du sicher, dass die Container Nummer {id} korrekt ist?", confirmFinish:"Soll die Liste als 'bestätigt' markiert werden?", partial:"Es wurde eine geringere Anzahl kommissioniert als vorgesehen. Trotzdem bestätigen?",
    assignedOther:"Container ist bereits {name} zugewiesen.", saved:"Position bestätigt.", allDone:"Container vollständig kommissioniert.", completeFirst:"Bitte zuerst alle Positionen vollständig kommissionieren.", noItems:"Keine Positionen vorhanden.",
    positions:"Positionen", articleCount:"Artikelanzahl", picked:"Kommissioniert", created:"Erstellt", started:"gestartet", finished:"fertiggestellt", warehouse:"Lager", level:"Ebene", quantity:"Anzahl", locationButton:"LAGERPLÄTZE"
  },
  ru: {
    secureLogin:"Безопасный вход для сотрудников склада", login:"Войти", logout:"Выйти", waiting:"Учётная запись ожидает активации", askAdmin:"Администратор должен активировать эту учётную запись.",
    picking:"Комплектация", myContainers:"Мои контейнеры", administration:"Управление", language:"Язык", containerNumber:"Номер контейнера", continueWork:"Активные и последние задания",
    userAccess:"Доступ пользователей", userAccessHint:"Активируйте аккаунты и задайте имена.", reload:"Обновить", importContainer:"Импорт контейнера", importHint:"Вставьте JSON контейнера и позиций.", import:"Импортировать",
    notFound:"Контейнер не найден.", invalidContainer:"Введите корректный номер контейнера.", loadFailed:"Не удалось загрузить данные.", loginFailed:"Не удалось войти. Проверьте данные.",
    activate:"Активировать", deactivate:"Заблокировать", imported:"Контейнер импортирован.", max70:"В контейнере может быть не более 70 шин.", demoModule:"Этот модуль подготовлен для следующего этапа.",
    scan:"СКАН", commissioned:"Собрано", cancel:"ОТМЕНА", done:"ГОТОВО", wrongEan:"Неверная шина — EAN не совпадает.", correctEan:"EAN подтверждён.", cameraUnavailable:"Камера недоступна. EAN можно ввести вручную.",
    confirmContainer:"Вы уверены, что номер контейнера {id} правильный?", confirmFinish:"Отметить список как подтверждённый?", partial:"Собрано меньше запланированного. Всё равно подтвердить?",
    assignedOther:"Контейнер уже назначен сотруднику {name}.", saved:"Позиция подтверждена.", allDone:"Контейнер полностью собран.", completeFirst:"Сначала полностью соберите все позиции.", noItems:"Нет позиций.",
    positions:"Позиции", articleCount:"Количество", picked:"Собрано", created:"Создан", started:"начат", finished:"завершён", warehouse:"Склад", level:"Уровень", quantity:"Количество", locationButton:"МЕСТА"
  },
  lv: {
    secureLogin:"Droša noliktavas darbinieku pieteikšanās", login:"Pieteikties", logout:"Izrakstīties", waiting:"Konts gaida apstiprinājumu", askAdmin:"Administratoram jāaktivizē šis konts.",
    picking:"Komplektēšana", myContainers:"Mani konteineri", administration:"Pārvaldība", language:"Valoda", containerNumber:"Konteinera numurs", continueWork:"Aktīvie un pēdējie uzdevumi",
    userAccess:"Lietotāju piekļuve", userAccessHint:"Aktivizēt kontus un piešķirt vārdus.", reload:"Atjaunot", importContainer:"Importēt konteineru", importHint:"Ievietojiet konteinera JSON.", import:"Importēt",
    notFound:"Konteiners nav atrasts.", invalidContainer:"Ievadiet derīgu konteinera numuru.", loadFailed:"Neizdevās ielādēt datus.", loginFailed:"Pieteikšanās neizdevās.",
    activate:"Aktivizēt", deactivate:"Bloķēt", imported:"Konteiners importēts.", max70:"Konteinerā drīkst būt ne vairāk kā 70 riepas.", demoModule:"Šis modulis ir sagatavots nākamajam posmam.",
    scan:"SKENĒT", commissioned:"Sakomplektēts", cancel:"ATCELT", done:"GATAVS", wrongEan:"Nepareiza riepa — EAN nesakrīt.", correctEan:"EAN apstiprināts.", cameraUnavailable:"Kamera nav pieejama. EAN var ievadīt manuāli.",
    confirmContainer:"Vai konteinera numurs {id} ir pareizs?", confirmFinish:"Atzīmēt sarakstu kā apstiprinātu?", partial:"Sakomplektēts mazāk nekā paredzēts. Tomēr apstiprināt?",
    assignedOther:"Konteiners jau piešķirts {name}.", saved:"Pozīcija apstiprināta.", allDone:"Konteiners pilnībā sakomplektēts.", completeFirst:"Vispirms pabeidziet visas pozīcijas.", noItems:"Nav pozīciju.",
    positions:"Pozīcijas", articleCount:"Daudzums", picked:"Sakomplektēts", created:"Izveidots", started:"sākts", finished:"pabeigts", warehouse:"Noliktava", level:"Līmenis", quantity:"Daudzums", locationButton:"VIETAS"
  }
};

const demoMode = ["127.0.0.1","localhost"].includes(location.hostname) && new URLSearchParams(location.search).has("demo");
const state = { lang:localStorage.getItem("tirescan.lang") || "de", user:null, profile:null, isAdmin:false, page:"containers", previousPage:"containers", searchContainer:null, container:null, items:[], selected:null, stream:null, scanTimer:null, confirmAction:null, articles:[], selectedArticle:null, articleStream:null, articleScanTimer:null };
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

function applyLanguage(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.dataset.i18n); });
  $("language").value=state.lang;
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
  const titles={home:"Home",article:"Artikelsuche",articlePlaces:"Lagerplätze",articleHistory:"Historie",articleArrivals:"Zugänge",storage:"Einlagerungslisten",containers:t("picking"),myWork:t("myContainers"),settings:"Einstellungen",admin:t("administration"),work:`Container: ${state.container?.number||state.container?.id||""}`};
  $("pageTitle").textContent=titles[page] || "TireScan";
  const detailPage=page==="work"||page.startsWith("articleP")||page==="articleHistory"||page==="articleArrivals";
  $("menuButton").classList.toggle("hidden",detailPage);
  $("backButton").classList.toggle("hidden",!detailPage);
  openDrawer(false);
  if(load && page==="myWork") loadMyContainers();
  if(load && page==="admin") loadUsers();
  if(load && page==="article" && !state.articles.length) searchArticles();
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
    state.searchContainer={id:snap.id,...snap.data()}; $("containerNumber").value=state.searchContainer.number||state.searchContainer.id; renderSearchResult();
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
    try{ await call.claimContainer({containerId:c.id}); await openContainer(c.id); }
    catch(error){ console.error(error); setMessage($("containerMessage"),displayError(error)); }
  });
}

async function loadMyContainers(){
  const target=$("myContainers"); target.replaceChildren();
  try{
    const snap=await getDocs(query(collection(db,"containers"),where("assignedTo","==",state.user.uid)));
    const list=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0));
    if(!list.length) target.append(node("p","muted",t("notFound")));
    list.forEach(c=>{
      const card=node("button","my-container-card");
      const top=node("div","preview-top"); top.append(labelValue("ContainerNr.",c.number||c.id,true),labelValue(t("created"),formatDate(c.createdAt),true));
      const totals=node("div","my-totals"); totals.append(labelValue(t("positions"),c.itemCount||0,true),labelValue(t("picked"),`${c.pickedQty||0} / ${c.totalQty||0}`,true));
      card.append(top,totals); card.addEventListener("click",()=>openContainer(c.id)); target.append(card);
    });
  }catch(error){ console.error(error); target.append(node("p","message",displayError(error))); }
}

async function openContainer(containerId){
  try{
    const cSnap=await getDoc(doc(db,"containers",containerId)); if(!cSnap.exists())throw new Error(t("notFound"));
    const itemsSnap=await getDocs(collection(db,"containers",containerId,"items"));
    state.container={id:cSnap.id,...cSnap.data()};
    state.items=itemsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sequence||0)-(b.sequence||0)||String(a.location||"").localeCompare(String(b.location||"")));
    renderWork(); showPage("work",false);
  }catch(error){ console.error(error); showToast(displayError(error)); }
}

function renderWork(){
  const c=state.container; if(!c)return;
  $("pageTitle").textContent=`Container: ${c.number||c.id}`;
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
  {ean:"5420068698523",articleNo:"23-289",brand:"Nexen",size:"225/45 R18 95V",description:"N'Fera Sport SU2",physical:18,available:14,ordered:8,arrivedPending:2,turnover:72,locations:[{site:"Friesoythe",code:"WX14",level:1,quantity:10,available:8},{site:"Thüle",code:"K59",level:3,quantity:8,available:6}]},
  {ean:"4019238065916",articleNo:"132-777",brand:"Continental",size:"225/45 R17 91Y",description:"UltraContact",physical:9,available:7,ordered:4,arrivedPending:0,turnover:58,locations:[{code:"WT15",level:1,quantity:9}]},
  {ean:"8808956238469",articleNo:"29-1450",brand:"Kumho",size:"205/55 R16 91H",description:"Ecsta HS52",physical:14,available:14,ordered:20,arrivedPending:4,turnover:43,locations:[{code:"9963",level:1,quantity:14}]},
  {ean:"4038526482914",articleNo:"90-1282",brand:"GOODYEAR",size:"265/60 R18 110T",description:"UltraGrip Performance+",physical:6,available:4,ordered:12,arrivedPending:0,turnover:66,locations:[{code:"8469",level:2,quantity:6}]},
  {ean:"4717784243535",articleNo:"60-90",brand:"Maxxis",size:"185 R14 104/102N",description:"CR967",physical:22,available:16,ordered:0,arrivedPending:5,turnover:31,locations:[{code:"9521",level:1,quantity:12},{code:"WW18",level:4,quantity:10}]}
];
const demoHistory={
  "5420068698523":[{from:"WX14",to:"K59",user:"ANDREJS",at:"2026-09-23T10:09:00"},{from:"9000",to:"WX14",user:"MARTIN",at:"2026-09-20T11:32:00"}],
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
  try{
    let articles;
    if(demoMode)articles=DEMO_ARTICLES.filter(article=>articleMatches(article,raw,warehouseMode));
    else { const response=await call.searchArticles({query:raw,warehouseMode}); articles=response.data?.articles||[]; }
    state.articles=articles; renderArticleResults();
  }catch(error){console.error(error);setMessage($("articleMessage"),displayError(error));}
}
function renderArticleResults(){
  const target=$("articleResults"); target.replaceChildren();
  if(!state.articles.length){target.append(node("p","muted","Keine Artikel gefunden."));return;}
  state.articles.forEach(article=>target.append(renderTireCard(article)));
}
function renderTireCard(article){
  const card=node("article","tire-card");
  const head=node("div","tire-card-head"); head.append(node("strong",null,article.brand||"—"),node("b",null,article.articleNo||"—"));
  const sub=node("div","tire-card-sub"); sub.append(node("span",null,`${article.size||""} ${article.description||""}`.trim()));
  const turnoverValue=Math.max(0,Math.min(100,Number(article.turnover||0)));const turnover=node("div","turnover"); const bar=node("span");bar.style.width=`${Math.max(4,turnoverValue)}%`;const turnoverText=node("small",null,`${(turnoverValue/100).toLocaleString(state.lang,{minimumFractionDigits:1,maximumFractionDigits:1})}  (12 Monate, ø-Best. ${article.physical??0})`);turnover.append(bar,turnoverText);
  const locations=article.locations||[];const sites=[...new Set(locations.map(place=>String(place.site||"Friesoythe").trim().toUpperCase()).filter(Boolean))];const multiSite=sites.length>=2;const warehouseQuery=normalizeArticleSearch($("articleQuery").value);const first=($("warehouseMode").checked?locations.find(place=>normalizeArticleSearch(place.code).includes(warehouseQuery)):null)||locations[0]||{};
  const inventory=node("div","inventory-grid");
  const stockColumn=node("div","inventory-column");[["P",article.physical],["V",article.available]].forEach(([key,value])=>{const item=node("div","stock-code");item.append(node("b",null,key),node("span",multiSite?"multi-site":Number(value)<1?"low":null,String(value??0)));stockColumn.append(item);});
  const pendingColumn=node("div","inventory-column");[["T",article.arrivedPending],["B",article.ordered]].forEach(([key,value])=>{const item=node("div","stock-code");item.append(node("b",null,key),node("span",Number(value)<1?"empty":null,String(value??0)));pendingColumn.append(item);});
  const detailColumn=node("div","inventory-column inventory-details");detailColumn.append(node("b",null,"DOT"),node("span",null,`Lager  ${first.code||"—"}`));
  const level=node("div","inventory-level");level.append(node("b",null,"Ebene"),node("span",null,String(first.level||"—")));
  const print=node("button","print-button");print.type="button";print.setAttribute("aria-label","Artikel drucken");print.title="Drucken";print.addEventListener("click",()=>window.print());
  inventory.append(stockColumn,pendingColumn,detailColumn,level,print);
  const actions=node("div","tire-actions"); [["LAGERPLÄTZE","places"],["HISTORIE","history"],["ZUGÄNGE","arrivals"]].forEach(([label,view])=>{const button=node("button",view==="places"&&multiSite?"multi-site-button":null,label);button.type="button";button.addEventListener("click",()=>openArticleDetail(article,view));actions.append(button);});
  card.append(head,sub,turnover,inventory,actions);return card;
}
function articleHeader(article){const header=node("div","article-detail-header");const top=node("div");top.append(node("strong",null,article.brand||"—"),node("b",null,article.articleNo||"—"));header.append(top,node("p",null,`${article.size||""} ${article.description||""}`.trim()));return header;}
async function getArticleDetails(article){
  if(demoMode)return {...article,history:demoHistory[article.ean]||[],arrivals:demoArrivals[article.ean]||[]};
  const response=await call.getTireDetails({ean:article.ean});return response.data;
}
async function openArticleDetail(article,view){
  try{state.selectedArticle=await getArticleDetails(article);renderArticleDetail(view);showPage(`article${view[0].toUpperCase()}${view.slice(1)}`,false);}
  catch(error){console.error(error);showToast(displayError(error));}
}
function renderArticleDetail(view){
  const article=state.selectedArticle;if(!article)return;
  if(view==="places"){
    $("placesArticleHeader").replaceChildren(articleHeader(article));
    const summary=$("placesSummary");summary.replaceChildren();const physical=node("div");physical.append(node("span",null,"Physischer Lagerbestand:"),node("b",null,String(article.physical??0)));const available=node("div");available.append(node("span",null,"Verfügbarer Bestand:"),node("b",null,String(article.available??0)));summary.append(physical,available);$("addLocation").classList.toggle("hidden",!state.isAdmin);renderLocations();
  }else if(view==="history"){
    $("historyArticleHeader").replaceChildren(articleHeader(article));const target=$("articleHistory");target.replaceChildren();
    const header=node("div","history-row header");["Lager","Benutzer","Datum","Uhrzeit"].forEach(value=>header.append(node("span",null,value)));target.append(header);
    const entries=article.history||[];if(!entries.length)target.append(node("p","muted","Noch keine Bewegungen."));
    entries.forEach(entry=>{const date=dateFromValue(entry.at);const row=node("div","history-row");[`${entry.from||"—"} → ${entry.to||"—"}`,entry.user||"—",date?date.toLocaleDateString(state.lang):"—",date?date.toLocaleTimeString(state.lang,{hour:"2-digit",minute:"2-digit"}):"—"].forEach(value=>row.append(node("span",null,value)));target.append(row);});
  }else{
    $("arrivalsArticleHeader").replaceChildren(articleHeader(article));const target=$("articleArrivals");target.replaceChildren();
    const entries=article.arrivals||[];if(!entries.length)target.append(node("p","muted","Noch keine Zugänge."));
    entries.forEach(entry=>{const date=dateFromValue(entry.date);const card=node("article","arrival-card");const head=node("div","arrival-head");head.append(node("span",null,entry.supplier||"—"),node("span",null,date?date.toLocaleDateString(state.lang):"—"));const values=node("div","arrival-values");[["Zugang",entry.quantity],["alt",entry.old],["neu",entry.new]].forEach(([label,value])=>{const field=node("span");field.append(node("small",null,label),node("b",null,String(value??0)));values.append(field);});card.append(head,values);target.append(card);});
  }
}
function renderLocations(){
  const target=$("articleLocations");target.replaceChildren();const locations=state.selectedArticle?.locations||[];
  const totals=node("section","site-totals");const grouped=new Map();locations.forEach(place=>{const name=place.site||"Friesoythe";const current=grouped.get(name)||{physical:0,available:0};current.physical+=Number(place.quantity||0);current.available+=Number(place.available??place.quantity??0);grouped.set(name,current);});grouped.forEach((value,name)=>{const column=node("div","site-total");column.append(node("strong",null,name),node("span",null,`P  ${value.physical}`),node("span",null,`V  ${value.available}`));totals.append(column);});if(grouped.size)target.append(totals);
  const grid=node("section","location-grid");locations.forEach((place,index)=>{const record=node("article","location-record");const top=node("div","location-record-top");top.append(node("strong",null,`LP ${index+1}`),node("small",null,place.site||"Friesoythe"));if(state.isAdmin){const edit=node("button","icon-flat","✎");edit.type="button";edit.setAttribute("aria-label","Lagerplatz bearbeiten");edit.addEventListener("click",()=>openLocationDialog(place));top.append(edit);}const stack=node("div","level-stack");[5,4,3,2,1].forEach(level=>{const row=node("div",`level-row${Number(place.level)===level?" active":""}`,String(level));if(Number(place.level)===level)row.append(node("b",null,place.code));stack.append(row);});record.append(top,stack);grid.append(record);});target.append(grid);
}
function openLocationDialog(place=null){if(!state.isAdmin){showToast("Nur Administratoren dürfen Bestände ändern.");return;}$("locationOriginal").value=place?.code||"";$("locationSite").value=place?.site||"Friesoythe";$("locationCode").value=place?.code||"";$("locationLevel").value=String(place?.level||1);$("locationQuantity").value=String(place?.quantity||0);$("locationAvailable").value=String(place?.available??place?.quantity??0);setMessage($("locationMessage"),"");$("locationModal").classList.remove("hidden");}
function closeLocationDialog(){$("locationModal").classList.add("hidden");}
async function saveLocation(event){
  event.preventDefault();const payload={ean:state.selectedArticle.ean,originalCode:$("locationOriginal").value,site:$("locationSite").value.trim(),code:$("locationCode").value.trim().toUpperCase(),level:Number($("locationLevel").value),quantity:Number($("locationQuantity").value),available:Number($("locationAvailable").value)};
  try{
    if(demoMode){const locations=state.selectedArticle.locations||[];const index=locations.findIndex(place=>place.code===payload.originalCode);const value={site:payload.site,code:payload.code,level:payload.level,quantity:payload.quantity,available:payload.available};if(index>=0)locations[index]=value;else locations.push(value);state.selectedArticle.physical=locations.reduce((sum,item)=>sum+item.quantity,0);state.selectedArticle.available=locations.reduce((sum,item)=>sum+item.available,0);}
    else {const response=await call.saveTireLocation(payload);state.selectedArticle=response.data.tire;}
    closeLocationDialog();renderArticleDetail("places");showToast("Lagerplatz gespeichert.");
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
    if(demoMode){
      const item=state.items.find(entry=>entry.id===selectedId);
      if(!item)throw new Error(t("notFound"));
      item.pickedQty=Number(item.pickedQty||0)+quantity;
      state.container.pickedQty=state.items.reduce((sum,entry)=>sum+Number(entry.pickedQty||0),0);
      await closeScanner(); renderWork();
      document.querySelector(`[data-item-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"});
      showToast(t("saved")); return;
    }
    await call.confirmPick({containerId:state.container.id,itemId:selectedId,ean:cleanEan($("scannedEan").value),quantity});
    await closeScanner(); await openContainer(state.container.id); document.querySelector(`[data-item-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"}); showToast(t("saved"));
  }catch(error){ console.error(error); setMessage($("scanMessage"),displayError(error)); }
}

function requestFinalize(){
  if(!allItemsDone()){ showToast(t("completeFirst")); return; }
  askConfirm(t("confirmFinish"),async()=>{
    try{
      if(demoMode){ state.container.status="completed"; state.container.completedAt=new Date(); renderWork(); showToast(t("allDone")); return; }
      await call.finalizeContainer({containerId:state.container.id}); await openContainer(state.container.id); showToast(t("allDone"));
    }
    catch(error){ console.error(error); showToast(displayError(error)); }
  });
}

async function loadUsers(){
  if(!state.isAdmin)return; const target=$("usersList"); target.replaceChildren();
  try{
    const snap=await getDocs(collection(db,"users"));
    snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.email||"").localeCompare(String(b.email||""))).forEach(user=>{
      const card=node("div","user-card"); const info=node("div"); info.append(node("b",null,user.displayName||user.email||user.id),node("p",null,`${user.email||"—"} · ${user.role||"worker"}`));
      const btn=node("button",user.active?"secondary":"primary",user.active?t("deactivate"):t("activate")); btn.addEventListener("click",()=>editUser(user,!user.active)); card.append(info,btn); target.append(card);
    });
  }catch(error){ console.error(error); target.append(node("p","message",displayError(error))); }
}
async function editUser(user,active){ const displayName=active?(prompt("Name:",user.displayName||"")||"").trim():user.displayName; if(active&&!displayName)return; try{await call.setUserAccess({uid:user.id,active,displayName,role:user.role==="admin"?"admin":"worker"});await loadUsers();}catch(error){alert(displayError(error));} }
async function importContainer(){ setMessage($("adminMessage"),""); try{const payload=JSON.parse($("containerJson").value);const total=(payload.items||[]).reduce((sum,item)=>sum+Number(item.requiredQty||0),0);if(total>70)throw new Error(t("max70"));await call.importContainer(payload);setMessage($("adminMessage"),t("imported"),true);$("containerJson").value="";}catch(error){console.error(error);setMessage($("adminMessage"),displayError(error));} }
async function importTires(){setMessage($("tireImportMessage"),"");try{const payload=JSON.parse($("tireJson").value);const response=await call.importTires({tires:Array.isArray(payload)?payload:[payload]});setMessage($("tireImportMessage"),`${response.data.count} Artikel importiert.`,true);$("tireJson").value="";}catch(error){console.error(error);setMessage($("tireImportMessage"),displayError(error));}}

$("loginForm").addEventListener("submit",login); $("pendingLogout").addEventListener("click",()=>signOut(auth)); $("logoutButton").addEventListener("click",()=>signOut(auth));
$("menuButton").addEventListener("click",()=>openDrawer(true)); $("drawerShade").addEventListener("click",()=>openDrawer(false)); $("backButton").addEventListener("click",()=>showPage(state.page.startsWith("article")?"article":"containers",false));
document.querySelectorAll(".nav-item[data-page]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
$("language").addEventListener("change",event=>{state.lang=event.target.value;localStorage.setItem("tirescan.lang",state.lang);applyLanguage();});
$("findContainer").addEventListener("click",findContainer); $("containerNumber").addEventListener("keydown",event=>{if(event.key==="Enter")findContainer();}); $("scanContainer").addEventListener("click",()=>{showToast(t("cameraUnavailable"));$("containerNumber").focus();});
$("confirmContainer").addEventListener("click",confirmSearchedContainer); $("refreshMine").addEventListener("click",loadMyContainers); $("finishContainer").addEventListener("click",requestFinalize);
$("scannedEan").addEventListener("input",validateEan); $("startCamera").addEventListener("click",startCamera); $("closeScanner").addEventListener("click",closeScanner); $("pickForm").addEventListener("submit",submitPick);
$("confirmNo").addEventListener("click",closeConfirm); $("confirmYes").addEventListener("click",async()=>{const action=state.confirmAction;closeConfirm();if(action)await action();});
$("loadUsers").addEventListener("click",loadUsers); $("importContainer").addEventListener("click",importContainer);$("importTires").addEventListener("click",importTires);
$("articleSearchForm").addEventListener("submit",event=>{event.preventDefault();searchArticles();});
$("warehouseMode").addEventListener("change",()=>{$("articleQuery").placeholder=$("warehouseMode").checked?"Lagerplatz, z. B. K59":"225/45 R18 V Nexen";$("articleSearchHint").textContent=$("warehouseMode").checked?"Alle Reifen an einem Lagerplatz anzeigen":"Größe, Marke, Artikelnummer oder EAN eingeben";});
$("scanArticle").addEventListener("click",openArticleScanner);$("closeArticleScanner").addEventListener("click",closeArticleScanner);$("useArticleEan").addEventListener("click",useArticleEan);$("articleEanInput").addEventListener("keydown",event=>{if(event.key==="Enter")useArticleEan();});
$("addLocation").addEventListener("click",()=>openLocationDialog());$("cancelLocation").addEventListener("click",closeLocationDialog);$("locationForm").addEventListener("submit",saveLocation);
$("messageButton").addEventListener("click",()=>showToast("Keine neuen Nachrichten")); $("moreButton").addEventListener("click",()=>showToast(state.profile?.displayName||state.user?.email||"TireScan"));
if(demoMode){
  state.user={uid:"demo"}; state.profile={displayName:"ANDREJS",active:true};state.isAdmin=true; state.container={id:"23620",number:"23620",assignedTo:"demo",assignedName:"ANDREJS",status:"active",totalQty:12,pickedQty:8};
  state.items=[
    {id:"1",sequence:10,brand:"GOODYEAR",description:"265/60 R 18 110T Wran +",articleNo:"90-1282",ean:"4038526482914",location:"8469",level:"1",requiredQty:4,pickedQty:4},
    {id:"2",sequence:77,brand:"Maxxis",description:"185 R 14 104/102N CR967",articleNo:"60-90",ean:"4717784243535",location:"9521",level:"1",requiredQty:2,pickedQty:1},
    {id:"3",sequence:252,brand:"Kumho",description:"205/55 R 16 91H ES31",articleNo:"29-1450",ean:"8808956238469",location:"9223",level:"1",requiredQty:4,pickedQty:3},
    {id:"4",sequence:107,brand:"PIRELLI",description:"255/45 R 19 104V WSZ3 MO",articleNo:"237-551",ean:"8019227409284",location:"9601",level:"1",requiredQty:2,pickedQty:0}
  ];
  $("loginView").classList.add("hidden"); $("app").classList.remove("hidden"); $("drawerUser").textContent="demo@local"; $("identity").textContent="ANDREJS"; renderWork(); showPage("work",false);
}else{
  onAuthStateChanged(auth,hydrateSession);
}
applyLanguage();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.warn));
