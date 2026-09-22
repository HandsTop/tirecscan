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
  importContainer: httpsCallable(functions, "importContainer"),
  setUserAccess: httpsCallable(functions, "setUserAccess")
};

const TEXT = {
  de:{secureLogin:"Sichere Anmeldung für Lagermitarbeiter",login:"Anmelden",logout:"Abmelden",waiting:"Konto wartet auf Freigabe",askAdmin:"Ein Administrator muss dieses Konto aktivieren.",picking:"Kommissionierung",myContainers:"Meine Container",administration:"Administration",language:"Sprache",containerPrompt:"Containernummer eingeben oder scannen",containerNumber:"Containernummer",continueWork:"Aktive und zuletzt bearbeitete Aufträge",container:"Container",verifyPosition:"Position prüfen",startCamera:"Kamera starten",stopCamera:"Kamera stoppen",scanEan:"EAN scannen",quantity:"Menge",confirmPick:"Entnahme bestätigen",userAccess:"Benutzerzugang",userAccessHint:"Konten aktivieren und Anzeigenamen vergeben.",reload:"Neu laden",importContainer:"Container importieren",importHint:"JSON mit Container und Positionen einfügen. Bestehende Container werden nicht überschrieben.",import:"Importieren",notFound:"Container nicht gefunden.",claim:"Container übernehmen",continue:"Weiterarbeiten",assigned:"Zugewiesen an",positions:"Positionen",tires:"Reifen",open:"Offen",active:"In Arbeit",completed:"Fertig",eanCorrect:"EAN ist richtig",eanWrong:"Falscher Reifen – EAN stimmt nicht",cameraUnavailable:"Kamera/Barcode-Erkennung ist nicht verfügbar. EAN kann manuell eingegeben werden.",saved:"Entnahme gespeichert.",allDone:"Container vollständig kommissioniert.",invalidContainer:"Bitte eine gültige Containernummer eingeben.",loginFailed:"Anmeldung fehlgeschlagen. Zugangsdaten prüfen.",loadFailed:"Daten konnten nicht geladen werden.",name:"Name",role:"Rolle",activate:"Aktivieren",deactivate:"Sperren",worker:"Mitarbeiter",admin:"Administrator",imported:"Container wurde importiert.",max70:"Ein Container darf höchstens 70 Reifen enthalten.",noItems:"Keine Positionen vorhanden."},
  ru:{secureLogin:"Безопасный вход для сотрудников склада",login:"Войти",logout:"Выйти",waiting:"Учётная запись ожидает активации",askAdmin:"Администратор должен активировать эту учётную запись.",picking:"Комплектация",myContainers:"Мои контейнеры",administration:"Администрирование",language:"Язык",containerPrompt:"Введите или отсканируйте номер контейнера",containerNumber:"Номер контейнера",continueWork:"Активные и последние задания",container:"Контейнер",verifyPosition:"Проверка позиции",startCamera:"Включить камеру",stopCamera:"Остановить камеру",scanEan:"Отсканируйте EAN",quantity:"Количество",confirmPick:"Подтвердить отбор",userAccess:"Доступ пользователей",userAccessHint:"Активируйте аккаунты и задайте имена.",reload:"Обновить",importContainer:"Импорт контейнера",importHint:"Вставьте JSON контейнера и позиций. Существующий контейнер не перезаписывается.",import:"Импортировать",notFound:"Контейнер не найден.",claim:"Взять контейнер",continue:"Продолжить",assigned:"Назначен",positions:"Позиции",tires:"Шины",open:"Открыт",active:"В работе",completed:"Готов",eanCorrect:"EAN правильный",eanWrong:"Неверная шина — EAN не совпадает",cameraUnavailable:"Камера или распознавание штрихкода недоступны. EAN можно ввести вручную.",saved:"Отбор сохранён.",allDone:"Контейнер полностью собран.",invalidContainer:"Введите корректный номер контейнера.",loginFailed:"Не удалось войти. Проверьте данные.",loadFailed:"Не удалось загрузить данные.",name:"Имя",role:"Роль",activate:"Активировать",deactivate:"Заблокировать",worker:"Сотрудник",admin:"Администратор",imported:"Контейнер импортирован.",max70:"В контейнере может быть не более 70 шин.",noItems:"Нет позиций."},
  lv:{secureLogin:"Droša noliktavas darbinieku pieteikšanās",login:"Pieteikties",logout:"Izrakstīties",waiting:"Konts gaida apstiprinājumu",askAdmin:"Administratoram jāaktivizē šis konts.",picking:"Komplektēšana",myContainers:"Mani konteineri",administration:"Administrēšana",language:"Valoda",containerPrompt:"Ievadiet vai noskenējiet konteinera numuru",containerNumber:"Konteinera numurs",continueWork:"Aktīvie un pēdējie uzdevumi",container:"Konteiners",verifyPosition:"Pārbaudīt pozīciju",startCamera:"Ieslēgt kameru",stopCamera:"Apturēt kameru",scanEan:"Skenēt EAN",quantity:"Daudzums",confirmPick:"Apstiprināt atlasi",userAccess:"Lietotāju piekļuve",userAccessHint:"Aktivizēt kontus un piešķirt vārdus.",reload:"Atjaunot",importContainer:"Importēt konteineru",importHint:"Ievietojiet konteinera un pozīciju JSON. Esošs konteiners netiks pārrakstīts.",import:"Importēt",notFound:"Konteiners nav atrasts.",claim:"Paņemt konteineru",continue:"Turpināt",assigned:"Piešķirts",positions:"Pozīcijas",tires:"Riepas",open:"Atvērts",active:"Procesā",completed:"Pabeigts",eanCorrect:"EAN ir pareizs",eanWrong:"Nepareiza riepa — EAN nesakrīt",cameraUnavailable:"Kamera vai svītrkoda atpazīšana nav pieejama. EAN var ievadīt manuāli.",saved:"Atlase saglabāta.",allDone:"Konteiners pilnībā sakomplektēts.",invalidContainer:"Ievadiet derīgu konteinera numuru.",loginFailed:"Pieteikšanās neizdevās. Pārbaudiet datus.",loadFailed:"Neizdevās ielādēt datus.",name:"Vārds",role:"Loma",activate:"Aktivizēt",deactivate:"Bloķēt",worker:"Darbinieks",admin:"Administrators",imported:"Konteiners importēts.",max70:"Konteinerā drīkst būt ne vairāk kā 70 riepas.",noItems:"Nav pozīciju."}
};

const state = { lang: localStorage.getItem("tirescan.lang") || "de", user:null, profile:null, isAdmin:false, container:null, items:[], selected:null, stream:null, scanTimer:null };
const t = (key) => TEXT[state.lang]?.[key] || TEXT.de[key] || key;
const cleanId = (value) => String(value || "").trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0,32);
const cleanEan = (value) => String(value || "").replace(/\D/g, "").slice(0,14);
const displayError = (error) => String(error?.message || error || t("loadFailed")).replace(/^Firebase:\s*/i, "").replace(/\s*\(functions\/[\w-]+\)\.?$/i, "");

function setMessage(element, text, ok=false){ element.textContent=text || ""; element.classList.toggle("ok",!!ok); }
function applyLanguage(){
  document.documentElement.lang=state.lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const value=t(el.dataset.i18n); if(value) el.textContent=value; });
  $("language").value=state.lang;
  if(state.container) renderWork();
}
function showToast(text){ const el=$("toast"); el.textContent=text; el.classList.remove("hidden"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.add("hidden"),2600); }
function node(tag,className,text){ const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
function statusLabel(status){ return t(status === "completed" ? "completed" : status === "active" ? "active" : "open"); }
function formatDate(value){ const date=value?.toDate?.() || (value ? new Date(value) : null); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString(state.lang) : "—"; }

function openDrawer(open=true){ $("drawer").classList.toggle("open",open); $("drawer").setAttribute("aria-hidden",String(!open)); $("drawerShade").classList.toggle("hidden",!open); }
function showPage(page){
  document.querySelectorAll(".page").forEach(el=>el.classList.add("hidden"));
  $(`${page}Page`)?.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  $("pageTitle").textContent = page === "admin" ? t("administration") : page === "myWork" ? t("myContainers") : t("picking");
  openDrawer(false);
  if(page==="myWork") loadMyContainers();
  if(page==="admin") loadUsers();
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
    state.profile=profileSnap.exists()?profileSnap.data():null;
    state.isAdmin=token.claims.admin===true;
    if(!state.profile?.active && !state.isAdmin){ $("loginView").classList.add("hidden"); $("app").classList.add("hidden"); $("pendingView").classList.remove("hidden"); return; }
    const displayName=state.profile?.displayName || user.email;
    $("identity").textContent=displayName; $("drawerUser").textContent=user.email; $("adminNav").classList.toggle("hidden",!state.isAdmin);
    $("loginView").classList.add("hidden"); $("pendingView").classList.add("hidden"); $("app").classList.remove("hidden"); showPage("containers");
  }catch(error){ console.error(error); setMessage($("loginMessage"),displayError(error)); await signOut(auth); }
}

async function findContainer(){
  const id=cleanId($("containerNumber").value); $("containerNumber").value=id; setMessage($("containerMessage"),""); $("containerResult").replaceChildren();
  if(!id){ setMessage($("containerMessage"),t("invalidContainer")); return; }
  try{ const snap=await getDoc(doc(db,"containers",id)); if(!snap.exists()){setMessage($("containerMessage"),t("notFound"));return;} renderContainerCard({id:snap.id,...snap.data()},$("containerResult"),true); }
  catch(error){console.error(error);setMessage($("containerMessage"),displayError(error));}
}

function renderContainerCard(container,target,searchResult=false){
  const card=node("article","container-card"); const main=node("div"); const top=node("div","container-top"); const title=node("div"); title.append(node("span","status "+(container.status||"open"),statusLabel(container.status)),node("h2",null,`${t("container")} ${container.number||container.id}`)); top.append(title); main.append(top);
  const meta=node("div","meta-grid"); [[t("positions"),container.itemCount||0],[t("tires"),`${container.pickedQty||0} / ${container.totalQty||0}`],[t("assigned"),container.assignedName||"—"]].forEach(([label,value])=>{const box=node("div","meta");box.append(node("span",null,label),node("b",null,String(value)));meta.append(box);}); main.append(meta); card.append(main);
  const canOpen=container.assignedTo===state.user.uid || state.isAdmin; const canClaim=!container.assignedTo && container.status!=="completed";
  const button=node("button",canClaim?"primary compact":"secondary compact",canClaim?t("claim"):t("continue")); button.disabled=!canOpen&&!canClaim; button.addEventListener("click",()=>canClaim?claimContainer(container.id):openContainer(container.id)); card.append(button); target.append(card);
  if(searchResult && container.assignedTo && !canOpen) setMessage($("containerMessage"),`${t("assigned")}: ${container.assignedName||"—"}`);
}

async function claimContainer(containerId){
  try{ await call.claimContainer({containerId}); await openContainer(containerId); }
  catch(error){console.error(error);setMessage($("containerMessage"),displayError(error));}
}
async function loadMyContainers(){
  const target=$("myContainers"); target.replaceChildren();
  try{ const snap=await getDocs(query(collection(db,"containers"),where("assignedTo","==",state.user.uid))); const list=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0)); if(!list.length)target.append(node("p","muted",t("notFound"))); list.forEach(c=>renderContainerCard(c,target)); }
  catch(error){console.error(error);target.append(node("p","message",displayError(error)));}
}
async function openContainer(containerId){
  try{ const cSnap=await getDoc(doc(db,"containers",containerId)); if(!cSnap.exists())throw new Error(t("notFound")); const itemsSnap=await getDocs(collection(db,"containers",containerId,"items")); state.container={id:cSnap.id,...cSnap.data()}; state.items=itemsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sequence||0)-(b.sequence||0)||String(a.location||"").localeCompare(String(b.location||""))); renderWork(); showPage("work"); }
  catch(error){console.error(error);setMessage($("containerMessage"),displayError(error));}
}

function renderWork(){
  if(!state.container)return; const c=state.container; $("workContainerNumber").textContent=c.number||c.id; $("assignmentBanner").textContent=`${t("assigned")}: ${c.assignedName||"—"}`; const done=state.items.reduce((sum,item)=>sum+Number(item.pickedQty||0),0); const total=state.items.reduce((sum,item)=>sum+Number(item.requiredQty||0),0); $("workProgressLabel").textContent=`${done} / ${total}`; $("workProgress").style.width=`${total?Math.min(100,done/total*100):0}%`;
  const list=$("itemsList"); list.replaceChildren(); if(!state.items.length){list.append(node("p","muted",t("noItems")));return;}
  state.items.forEach(item=>{
    const complete=Number(item.pickedQty||0)>=Number(item.requiredQty||0); const card=node("article","item-card"+(complete?" complete":"")); card.dataset.itemId=item.id;
    const top=node("div","item-top"); const info=node("div"); info.append(node("div","article",item.brand||"—"),node("div","description",item.description||item.size||"—")); top.append(info,node("strong",null,item.articleNo||item.id)); card.append(top);
    const meta=node("div","meta-grid"); [["EAN",item.ean],[t("quantity"),`${item.pickedQty||0} / ${item.requiredQty||0}`],["Lager",item.location||"—"],["Ebene",item.level||"—"]].forEach(([label,value])=>{const box=node("div","meta");box.append(node("span",null,label),node("b",label==="Lager"?"location":"",String(value??"—")));meta.append(box);}); card.append(meta);
    const actions=node("div","item-actions"); const button=node("button",complete?"secondary":"primary compact",complete?`✓ ${t("completed")}`:t("verifyPosition")); button.disabled=complete||c.status==="completed"; button.addEventListener("click",()=>openScanner(item)); actions.append(button); card.append(actions); list.append(card);
  });
}

function openScanner(item){
  state.selected=item; $("scanTitle").textContent=`${item.brand||""} ${item.articleNo||item.id}`.trim(); $("scanExpected").textContent=`${item.description||item.size||""} · Lager ${item.location||"—"} · EAN ${item.ean}`; $("scannedEan").value=""; $("pickedQuantity").value=String(Math.max(1,Number(item.requiredQty||0)-Number(item.pickedQty||0))); $("pickedQuantity").max=String(Math.max(1,Number(item.requiredQty||0)-Number(item.pickedQty||0))); $("eanFeedback").className="scan-feedback neutral"; $("eanFeedback").textContent=t("scanEan"); $("confirmPick").disabled=true; setMessage($("scanMessage"),""); $("scanModal").classList.remove("hidden"); setTimeout(()=>$("scannedEan").focus(),100);
}
async function closeScanner(){ await stopCamera(); $("scanModal").classList.add("hidden"); state.selected=null; }
function validateEan(){ const entered=cleanEan($("scannedEan").value); $("scannedEan").value=entered; const expected=cleanEan(state.selected?.ean); const good=entered.length>=8&&entered===expected; $("eanFeedback").className=`scan-feedback ${entered?(good?"good":"bad"):"neutral"}`; $("eanFeedback").textContent=entered?(good?t("eanCorrect"):t("eanWrong")):t("scanEan"); $("confirmPick").disabled=!good; return good; }

async function startCamera(){
  setMessage($("scanMessage"),""); if(!state.selected)return;
  if(!navigator.mediaDevices?.getUserMedia || !("BarcodeDetector" in window)){setMessage($("scanMessage"),t("cameraUnavailable"));return;}
  try{ const formats=await BarcodeDetector.getSupportedFormats(); const wanted=["ean_13","ean_8","upc_a","upc_e","code_128"].filter(x=>formats.includes(x)); const detector=new BarcodeDetector({formats:wanted.length?wanted:formats}); state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},audio:false}); const video=$("camera"); video.srcObject=state.stream; video.style.display="block"; await video.play(); const tick=async()=>{if(!state.stream)return;try{const codes=await detector.detect(video);if(codes[0]?.rawValue){$("scannedEan").value=cleanEan(codes[0].rawValue);if(validateEan())await stopCamera();}}catch{} if(state.stream)state.scanTimer=setTimeout(tick,220);};tick(); }
  catch(error){console.error(error);setMessage($("scanMessage"),t("cameraUnavailable"));await stopCamera();}
}
async function stopCamera(){ clearTimeout(state.scanTimer); state.scanTimer=null; state.stream?.getTracks().forEach(track=>track.stop()); state.stream=null; const video=$("camera"); video.pause(); video.srcObject=null; video.style.display="none"; }
async function confirmPick(event){
  event.preventDefault(); if(!validateEan()||!state.selected)return; const quantity=Number($("pickedQuantity").value); if(!Number.isInteger(quantity)||quantity<1||quantity>Number($("pickedQuantity").max)){setMessage($("scanMessage"),t("loadFailed"));return;}
  $("confirmPick").disabled=true;
  try{ const result=await call.confirmPick({containerId:state.container.id,itemId:state.selected.id,ean:cleanEan($("scannedEan").value),quantity}); const selectedId=state.selected.id; await closeScanner(); await openContainer(state.container.id); const card=document.querySelector(`[data-item-id="${CSS.escape(selectedId)}"]`); card?.classList.add("complete"); showToast(result.data.containerCompleted?t("allDone"):t("saved")); const next=state.items.find(item=>Number(item.pickedQty||0)<Number(item.requiredQty||0)); next&&document.querySelector(`[data-item-id="${CSS.escape(next.id)}"]`)?.scrollIntoView({behavior:"smooth",block:"center"}); }
  catch(error){console.error(error);setMessage($("scanMessage"),displayError(error));$("confirmPick").disabled=false;}
}

async function loadUsers(){
  if(!state.isAdmin)return; const target=$("usersList");target.replaceChildren();
  try{const snap=await getDocs(collection(db,"users"));snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.email||"").localeCompare(String(b.email||""))).forEach(user=>{const card=node("div","user-card");const info=node("div");info.append(node("b",null,user.displayName||user.email||user.id),node("p",null,`${user.email||"—"} · ${user.role||"worker"}`));const actions=node("div","user-actions");const btn=node("button",user.active?"secondary":"primary",user.active?t("deactivate"):t("activate"));btn.addEventListener("click",()=>editUser(user,!user.active));actions.append(btn);card.append(info,actions);target.append(card);});}
  catch(error){console.error(error);target.append(node("p","message",displayError(error)));}
}
async function editUser(user,active){ const displayName=active?(prompt(`${t("name")}:`,user.displayName||"")||"").trim():user.displayName; if(active&&!displayName)return; try{await call.setUserAccess({uid:user.id,active,displayName,role:user.role==="admin"?"admin":"worker"});await loadUsers();}catch(error){alert(displayError(error));} }
async function importContainer(){ setMessage($("adminMessage"),""); try{const payload=JSON.parse($("containerJson").value);const total=(payload.items||[]).reduce((sum,item)=>sum+Number(item.requiredQty||0),0);if(total>70)throw new Error(t("max70"));await call.importContainer(payload);setMessage($("adminMessage"),t("imported"),true);$("containerJson").value="";}catch(error){console.error(error);setMessage($("adminMessage"),displayError(error));} }

$("loginForm").addEventListener("submit",login); $("logoutButton").addEventListener("click",()=>signOut(auth)); $("pendingLogout").addEventListener("click",()=>signOut(auth));
$("menuButton").addEventListener("click",()=>openDrawer(true)); $("drawerShade").addEventListener("click",()=>openDrawer(false)); document.querySelectorAll("[data-page]").forEach(btn=>btn.addEventListener("click",()=>showPage(btn.dataset.page)));
$("language").addEventListener("change",()=>{state.lang=$("language").value;localStorage.setItem("tirescan.lang",state.lang);applyLanguage();});
$("findContainer").addEventListener("click",findContainer); $("containerNumber").addEventListener("keydown",e=>{if(e.key==="Enter")findContainer();}); $("refreshMine").addEventListener("click",loadMyContainers); $("backToMine").addEventListener("click",()=>showPage("myWork"));
$("closeScanner").addEventListener("click",closeScanner); $("startCamera").addEventListener("click",startCamera); $("stopCamera").addEventListener("click",stopCamera); $("scannedEan").addEventListener("input",validateEan); $("pickForm").addEventListener("submit",confirmPick);
$("loadUsers").addEventListener("click",loadUsers); $("importContainer").addEventListener("click",importContainer);
window.addEventListener("pagehide",stopCamera); applyLanguage(); onAuthStateChanged(auth,hydrateSession);
