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
const state = { lang:localStorage.getItem("tirescan.lang") || "de", user:null, profile:null, isAdmin:false, page:"containers", searchContainer:null, container:null, items:[], selected:null, stream:null, scanTimer:null, confirmAction:null };
const t = (key) => TEXT[state.lang]?.[key] || TEXT.de[key] || key;
const cleanId = (value) => String(value || "").trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0,32);
const cleanEan = (value) => String(value || "").replace(/\D/g, "").slice(0,14);
const displayError = (error) => String(error?.message || error || t("loadFailed")).replace(/^Firebase:\s*/i, "").replace(/\s*\(functions\/[\w-]+\)\.?$/i, "");

function node(tag,className,text){ const el=document.createElement(tag); if(className)el.className=className; if(text!==undefined)el.textContent=text; return el; }
function setMessage(element,text,ok=false){ element.textContent=text || ""; element.classList.toggle("ok",ok); }
function formatDate(value){ const date=value?.toDate?.() || (value ? new Date(value) : null); return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString(state.lang,{dateStyle:"short",timeStyle:"medium"}) : "—"; }
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
}

function showPage(page,load=true){
  state.page=page;
  document.querySelectorAll(".page").forEach(el=>el.classList.add("hidden"));
  $((page==="work"?"work":page)+"Page")?.classList.remove("hidden");
  document.querySelectorAll(".nav-item[data-page]").forEach(el=>el.classList.toggle("active",el.dataset.page===page));
  const titles={home:"Home",article:"Artikelsuche",storage:"Einlagerungslisten",containers:t("picking"),myWork:t("myContainers"),settings:"Einstellungen",admin:t("administration"),work:`Container: ${state.container?.number||state.container?.id||""}`};
  $("pageTitle").textContent=titles[page] || "TireScan";
  $("menuButton").classList.toggle("hidden",page==="work");
  $("backButton").classList.toggle("hidden",page!=="work");
  openDrawer(false);
  if(load && page==="myWork") loadMyContainers();
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

$("loginForm").addEventListener("submit",login); $("pendingLogout").addEventListener("click",()=>signOut(auth)); $("logoutButton").addEventListener("click",()=>signOut(auth));
$("menuButton").addEventListener("click",()=>openDrawer(true)); $("drawerShade").addEventListener("click",()=>openDrawer(false)); $("backButton").addEventListener("click",()=>showPage("containers"));
document.querySelectorAll(".nav-item[data-page]").forEach(button=>button.addEventListener("click",()=>showPage(button.dataset.page)));
$("language").addEventListener("change",event=>{state.lang=event.target.value;localStorage.setItem("tirescan.lang",state.lang);applyLanguage();});
$("findContainer").addEventListener("click",findContainer); $("containerNumber").addEventListener("keydown",event=>{if(event.key==="Enter")findContainer();}); $("scanContainer").addEventListener("click",()=>{showToast(t("cameraUnavailable"));$("containerNumber").focus();});
$("confirmContainer").addEventListener("click",confirmSearchedContainer); $("refreshMine").addEventListener("click",loadMyContainers); $("finishContainer").addEventListener("click",requestFinalize);
$("scannedEan").addEventListener("input",validateEan); $("startCamera").addEventListener("click",startCamera); $("closeScanner").addEventListener("click",closeScanner); $("pickForm").addEventListener("submit",submitPick);
$("confirmNo").addEventListener("click",closeConfirm); $("confirmYes").addEventListener("click",async()=>{const action=state.confirmAction;closeConfirm();if(action)await action();});
$("loadUsers").addEventListener("click",loadUsers); $("importContainer").addEventListener("click",importContainer);
$("messageButton").addEventListener("click",()=>showToast("Keine neuen Nachrichten")); $("moreButton").addEventListener("click",()=>showToast(state.profile?.displayName||state.user?.email||"TireScan"));
if(demoMode){
  state.user={uid:"demo"}; state.profile={displayName:"ANDREJS",active:true}; state.container={id:"23620",number:"23620",assignedTo:"demo",assignedName:"ANDREJS",status:"active",totalQty:12,pickedQty:8};
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
