const KEY='my-god-box-v1';
const VERSION='3.0.1';
const defaultState={entries:[],reflections:[],theme:'classic'};
let state=load();
let current='home';
let filter='';
let lookMode='entries';

const $=s=>document.querySelector(s);
const main=$('#main');

function load(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
    return {...defaultState,...saved,entries:Array.isArray(saved.entries)?saved.entries:[],reflections:Array.isArray(saved.reflections)?saved.reflections:[]};
  }catch{return {...defaultState}}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function dateStr(d){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(d))}
function timeStr(d){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(d))}
function applyTheme(){document.body.className=state.theme==='classic'?'':'theme-'+state.theme}
function setView(v){current=v;filter='';render();window.scrollTo({top:0,behavior:'instant'})}
function render(){
  if(current==='home')renderHome();
  else if(current==='lookinside')renderLookInside();
  else if(current==='quiet')renderQuiet();
  else if(current==='settings')renderSettings();
  else if(current==='about')renderAbout();
}

function renderHome(){
  main.innerHTML=`<section class="hero home-hero"><div class="eyebrow">A quiet place to let go</div><h1 class="title">My God Box</h1><p class="subtitle">Turn over what you cannot control. Keep what is yours to do.</p></section>
  <div class="box-wrap"><div class="box"><div class="latch"></div></div></div>
  <section class="card home-action"><div class="small">What's weighing on you?</div><p class="home-prompt">Write it down. You don't have to solve it here.</p><button class="primary" id="homeTurnOver">TURN IT OVER</button></section>
  <div class="home-links"><button class="text-link" id="homeLook">Look Inside →</button></div>
  <p class="hint">You can write as much or as little as you want.</p>`;
  $('#homeTurnOver').onclick=openTurnOverModal;
  $('#homeLook').onclick=()=>{lookMode='entries';setView('lookinside')};
}

function openTurnOverModal(prefill=''){
  openModal(`<div class="modal-head"><h2>Turn It Over</h2><button class="icon-btn" id="close">×</button></div>
    <p class="small">Put down whatever is weighing on you. You don't have to solve it here.</p>
    <div class="modal-scroll"><textarea id="turnText" maxlength="2000" class="modal-textarea" placeholder="Write it down. You don't have to solve it here.">${esc(prefill)}</textarea><div class="counter" id="turnCounter">${prefill.length} / 2000</div></div>
    <button class="primary" id="saveTurn">TURN IT OVER</button>`);
  const ta=$('#turnText');
  ta.addEventListener('input',()=>$('#turnCounter').textContent=`${ta.value.length} / 2000`);
  $('#close').onclick=closeModal;
  $('#saveTurn').onclick=()=>saveTurnOver(ta.value.trim());
  setTimeout(()=>ta.focus(),50);
}

function saveTurnOver(text){
  if(!text){toast('Write something first, even just a few words.');return}
  const entry={id:crypto.randomUUID(),text,created:new Date().toISOString()};
  state.entries.unshift(entry);save();closeModal();showSurrender(entry.id);
}

function showSurrender(entryId){
  const e=state.entries.find(x=>x.id===entryId);
  if(!e)return;
  openModal(`<div class="modal-head"><h2>It's out of your hands.</h2><button class="icon-btn" id="close">×</button></div>
    <div class="surrender-mark">✦</div><p class="surrender-copy">You've done what you can. Now you can let it be.</p>
    <button class="primary" id="done">DONE</button><button class="secondary" id="mine">WHAT'S MINE TO DO?</button>`);
  $('#close').onclick=closeModal;$('#done').onclick=closeModal;
  $('#mine').onclick=()=>openReflectionModal(e.id,'What part of this is actually mine?');
}

function renderLookInside(){
  const source=(lookMode==='entries'?state.entries:state.reflections);
  const arr=source.filter(e=>{
    const hay=[e.text,e.prompt,e.entryTextSnapshot].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(filter.toLowerCase());
  });
  const isEntries=lookMode==='entries';
  main.innerHTML=`<section class="hero look-hero"><div class="eyebrow">Your private record</div><h1 class="section-title">My Entries</h1><p class="reflect-intro">What you have chosen to turn over.</p></section>
  <div class="segmented"><button class="segment ${isEntries?'active':''}" id="showEntries">Turned Over</button><button class="segment ${!isEntries?'active':''}" id="showReflections">Reflections</button></div>
  <input class="search" id="search" placeholder="Search entries..." value="${esc(filter)}">
  <div class="entry-panel" id="entryPanel"><div class="entry-list">${arr.length?arr.map(e=>entryCard(e,isEntries)).join(''):`<div class="empty">${isEntries?'Nothing has been turned over yet.':'No reflections saved yet.'}<br><br>${isEntries?'When you are ready, put something down and let it go.':'Reflection is always optional.'}</div>`}</div></div>
  <div class="look-action"><button class="text-link" id="addAction">${isEntries?'Turn It Over':'Reflect'} →</button></div>`;
  $('#search').oninput=e=>{filter=e.target.value;renderLookInside()};
  $('#showEntries').onclick=()=>{lookMode='entries';filter='';renderLookInside()};
  $('#showReflections').onclick=()=>{lookMode='reflections';filter='';renderLookInside()};
  document.querySelectorAll('[data-entry-id]').forEach(x=>x.onclick=()=>isEntries?entryDetail(x.dataset.entryId):reflectionDetail(x.dataset.entryId));
  $('#addAction').onclick=isEntries?openTurnOverModal:()=>openReflectionModal();
}

function entryCard(e,isEntries){
  if(isEntries){
    return `<article class="entry" data-entry-id="${esc(e.id)}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text">${esc(e.text)}</div></article>`;
  }
  const label=e.kind==='mine'?" · What’s Mine to Do?":'';
  return `<article class="entry" data-entry-id="${esc(e.id)}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)} · Reflection${label}</div>${e.prompt?`<div class="entry-context">${esc(e.prompt)}</div>`:''}<div class="entry-text">${esc(e.text)}</div></article>`;
}

function connectedReflections(entryId){return state.reflections.filter(r=>r.entryId===entryId)}

function entryDetail(id){
  const e=state.entries.find(x=>x.id===id);if(!e)return;
  const refs=connectedReflections(id);
  openModal(`<div class="modal-head"><h2>Turned Over</h2><button class="icon-btn" id="close">×</button></div>
    <p class="small">${dateStr(e.created)} · ${timeStr(e.created)}</p>
    <div class="detail-block"><div class="small">What you turned over</div><div class="detail-text">${esc(e.text).replace(/\n/g,'<br>')}</div></div>
    <div class="linked-section"><div class="linked-head"><span>Connected Reflections</span><span class="small">${refs.length}</span></div>
      ${refs.length?refs.map(r=>`<button class="linked-reflection" data-ref-id="${esc(r.id)}"><div class="entry-date">${dateStr(r.created)} · ${timeStr(r.created)}</div>${r.prompt?`<div class="entry-context">${esc(r.prompt)}</div>`:''}<div>${esc(r.text)}</div></button>`).join(''):'<div class="small linked-empty">No reflections yet.</div>'}
      <button class="text-link modal-link" id="addReflection">+ Add Reflection</button>
    </div>
    <div class="row"><button class="secondary danger" id="burn">BURN</button><button class="primary" id="modalDone">DONE</button></div>`);
  $('#close').onclick=closeModal;$('#modalDone').onclick=closeModal;
  $('#addReflection').onclick=()=>openReflectionModal(id);
  document.querySelectorAll('[data-ref-id]').forEach(x=>x.onclick=()=>reflectionDetail(x.dataset.refId));
  $('#burn').onclick=()=>burnEntry(id);
}

function burnEntry(id){
  const e=state.entries.find(x=>x.id===id);if(!e)return;
  const refs=connectedReflections(id);
  const message=refs.length?`Burn this turned-over item? The entry will be permanently removed. Its ${refs.length} connected reflection${refs.length===1?'':'s'} will remain.`:'Burn this turned-over item? It will be permanently removed.';
  if(!confirm(message))return;
  state.reflections=state.reflections.map(r=>r.entryId===id?{...r,entryId:null,entryTextSnapshot:r.entryTextSnapshot||e.text,entryWasBurned:true}:r);
  state.entries=state.entries.filter(x=>x.id!==id);save();closeModal();renderLookInside();toast('Turned-over entry burned.');
}

const PROMPTS=['No Prompt','What am I trying to control?','What part of this is actually mine?','What can I do today?','What am I willing to let go of?','What outcome am I afraid of?'];

function openReflectionModal(entryId=null,prefillPrompt=''){
  const linked=entryId?state.entries.find(e=>e.id===entryId):null;
  const chosen=prefillPrompt&&PROMPTS.includes(prefillPrompt)?prefillPrompt:'No Prompt';
  openModal(`<div class="modal-head"><h2>Reflect</h2><button class="icon-btn" id="close">×</button></div>
    <p class="small">Reflection is optional. You don't have to analyze everything you turn over.</p>
    ${linked?`<div class="reflection-linked"><div class="small">Reflecting on</div><div>${esc(linked.text)}</div></div>`:''}
    <label class="small prompt-label" for="promptSelect">Prompt</label><select id="promptSelect" class="theme-select">${PROMPTS.map(p=>`<option value="${esc(p)}" ${p===chosen?'selected':''}>${esc(p)}</option>`).join('')}</select>
    <div class="modal-scroll"><textarea id="reflectText" maxlength="2000" class="modal-textarea" placeholder="Write anything you want... (optional)"></textarea><div class="counter" id="reflectCounter">0 / 2000</div></div>
    <button class="primary" id="saveReflection">SAVE REFLECTION</button>`);
  const ta=$('#reflectText');ta.addEventListener('input',()=>$('#reflectCounter').textContent=`${ta.value.length} / 2000`);
  $('#close').onclick=closeModal;
  $('#saveReflection').onclick=()=>saveReflection(ta.value.trim(),$('#promptSelect').value,entryId);
  setTimeout(()=>ta.focus(),50);
}

function saveReflection(text,prompt,entryId=null){
  if(!text){toast('Write something first, even just a few words.');return}
  const linked=entryId?state.entries.find(e=>e.id===entryId):null;
  state.reflections.unshift({id:crypto.randomUUID(),text,prompt:prompt==='No Prompt'?'':prompt,created:new Date().toISOString(),kind:'reflection',entryId:linked?linked.id:null,entryTextSnapshot:linked?linked.text:null});
  save();closeModal();toast('Reflection saved.');
}

function reflectionDetail(id){
  const e=state.reflections.find(x=>x.id===id);if(!e)return;
  const linked=e.entryId?state.entries.find(x=>x.id===e.entryId):null;
  const original=linked?linked.text:e.entryTextSnapshot;
  openModal(`<div class="modal-head"><h2>Reflection</h2><button class="icon-btn" id="close">×</button></div>
    <p class="small">${dateStr(e.created)} · ${timeStr(e.created)}</p>
    ${original?`<div class="reflection-linked"><div class="small">${linked?'Connected to':'Originally connected to'}</div><div>${esc(original)}</div>${linked?`<button class="text-link modal-link" id="openOriginal">View Turned Over →</button>`:''}</div>`:''}
    ${e.prompt?`<div class="reflection-context"><div class="small">Prompt</div><div class="reflection-prompt">${esc(e.prompt)}</div></div>`:''}
    <div class="detail-block"><div class="small">Your reflection</div><div class="detail-text">${esc(e.text).replace(/\n/g,'<br>')}</div></div>
    <button class="text-link modal-link" id="addAnother">+ Add Another Reflection</button>
    <div class="row"><button class="secondary danger" id="delete">DELETE</button><button class="primary" id="modalDone">DONE</button></div>`);
  $('#close').onclick=closeModal;$('#modalDone').onclick=closeModal;
  $('#delete').onclick=()=>{if(confirm('Delete this reflection?')){state.reflections=state.reflections.filter(x=>x.id!==id);save();closeModal();renderLookInside();toast('Reflection deleted.')}};
  $('#addAnother').onclick=()=>openReflectionModal(linked?linked.id:null);
  if(linked)$('#openOriginal').onclick=()=>entryDetail(linked.id);
}

function renderQuiet(){
  main.innerHTML=`<section class="quiet"><div class="quiet-content"><div class="moon">☾</div><h1>Quiet Space</h1><p>A place to just be.<br>No writing. No expectations.</p><div class="quiet-dash">—</div></div></section>`;
}

function renderSettings(){
  main.innerHTML=`<div class="hero"><div class="eyebrow">Keep it yours</div><h1 class="section-title">Settings</h1></div>
  <div class="list"><button class="entry" id="themes"><div>✦ &nbsp; Themes</div><div class="small">Choose the appearance that feels right.</div></button><button class="entry" id="backup"><div>⇧ &nbsp; Backup & Transfer</div><div class="small">Export or import your complete God Box.</div></button><button class="entry" id="exportEntries"><div>▣ &nbsp; Export Entries & Reflections</div><div class="small">Save a readable text file with everything you've written.</div></button><button class="entry" id="print"><div>⎙ &nbsp; Print / PDF</div><div class="small">Create a printer-friendly copy of your entries and reflections.</div></button><button class="entry danger" id="clear"><div>⌫ &nbsp; Clear All Data</div><div class="small">This cannot be undone unless you have a backup.</div></button></div><p class="hint">Your data stays on this device unless you choose to export it.</p>`;
  $('#themes').onclick=renderThemes;
  $('#backup').onclick=backupModal;$('#exportEntries').onclick=exportEntries;$('#print').onclick=printAll;
  $('#clear').onclick=()=>{if(confirm('Clear all God Box data? This cannot be undone.')){state={...defaultState};save();applyTheme();render()}};
}
function renderThemes(){
  openModal(`<div class="modal-head"><h2>Themes</h2><button class="icon-btn" id="close">×</button></div><div class="theme-list">${[['classic','Classic','Warm brass & dark wood'],['midnight','Midnight','Cool moonlit blue'],['forest','Forest','Deep green & quiet gold'],['burgundy','Burgundy','Dark wine & soft rose']].map(([id,n,d])=>`<button class="theme-option ${state.theme===id?'selected':''}" data-theme="${id}"><div>${n} ${state.theme===id?'✓':''}</div><div class="small">${d}</div></button>`).join('')}</div>`);
  $('#close').onclick=closeModal;document.querySelectorAll('[data-theme]').forEach(x=>x.onclick=()=>{state.theme=x.dataset.theme;applyTheme();save();closeModal();renderSettings()});
}
function backupModal(){
  openModal(`<div class="modal-head"><h2>Backup & Transfer</h2><button class="icon-btn" id="close">×</button></div><div class="setting"><h3>Export Backup</h3><p>Save every entry, reflection, and setting in one JSON backup.</p><button class="primary" id="export">EXPORT BACKUP</button></div><div class="setting"><h3>Import Backup</h3><p>Choose a previous backup and merge it with this device.</p><input id="file" type="file" accept="application/json,.json" class="file-input"><button class="secondary" id="import">IMPORT & MERGE</button></div><p class="small">Nothing is uploaded to a server. The backup stays wherever you choose to save it.</p>`);
  $('#close').onclick=closeModal;$('#export').onclick=exportBackup;$('#import').onclick=()=>importBackup($('#file').files[0]);
}
function exportBackup(){download('my-god-box-backup.json',JSON.stringify({...state,exportedAt:new Date().toISOString(),app:'My God Box',version:VERSION},null,2),'application/json');toast('Backup exported.');closeModal()}
function importBackup(file){if(!file){toast('Choose a backup file first.');return}const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.entries)||!Array.isArray(x.reflections))throw 0;const ids=new Set(state.entries.map(e=>e.id));const rids=new Set(state.reflections.map(e=>e.id));state.entries=[...state.entries,...x.entries.filter(e=>e.id&&!ids.has(e.id))];state.reflections=[...state.reflections,...x.reflections.filter(e=>e.id&&!rids.has(e.id))];if(x.theme)state.theme=x.theme;save();applyTheme();closeModal();toast('Backup imported and merged.');render()}catch{toast('That file is not a valid My God Box backup.')}};r.readAsText(file)}
function exportEntries(){const sections=[['TURNED OVER',state.entries],['REFLECTIONS',state.reflections]];const txt=sections.map(([h,arr])=>`${h}\n${'='.repeat(h.length)}\n\n${arr.length?arr.map(e=>`${dateStr(e.created)} · ${timeStr(e.created)}\n${e.text}\n`).join('\n'):'None yet.\n'}`).join('\n\n');download('my-god-box-writing.txt',txt,'text/plain');toast('Writing exported')}
function printAll(){const old=main.innerHTML;main.innerHTML=`<h1 class="print-title">My God Box — My Writing</h1><p>Printed ${new Date().toLocaleString()}</p><h2>Turned Over</h2>${state.entries.map(e=>`<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div></article>`).join('')||'<p>No entries.</p>'}<h2>Reflections</h2>${state.reflections.map(e=>`<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div></article>`).join('')||'<p>No reflections.</p>'}`;setTimeout(()=>{window.print();main.innerHTML=old;renderSettings()},50)}
function renderAbout(){
  main.innerHTML=`<div class="hero"><div class="eyebrow">A simple practice</div><h1 class="section-title">About My God Box</h1></div><section class="card"><p class="about-copy">My God Box is a private place to write down what you're struggling to control, turn it over, and move forward.</p>
  <details class="about-card"><summary>How to install</summary><div class="setting-body"><p>Open the GitHub Pages link in Safari on your iPhone, tap the Share button, choose <b>Add to Home Screen</b>, then tap <b>Add</b>. Opening My God Box from the Home Screen gives you the app-like experience and helps keep your local data with the installed web app.</p></div></details>
  <details class="about-card"><summary>How it works</summary><div class="setting-body"><p>Write it down. Turn it over. Then decide whether you want to reflect or simply leave it there. Look Inside keeps your turned-over entries and reflections together, with optional connections between them.</p></div></details>
  <details class="about-card"><summary>It is optional</summary><div class="setting-body"><p>You never have to write, reflect, reread, or keep anything. Use as much or as little of the app as feels useful.</p></div></details>
  <details class="about-card"><summary>Your privacy</summary><div class="setting-body"><p>Entries and reflections are stored locally in your browser. My God Box does not require an account or a server. Use Backup & Transfer when you want to move your data.</p></div></details>
  <details class="about-card"><summary>Higher Power</summary><div class="setting-body"><p>“God” can mean whatever a Higher Power means to you. The app does not prescribe a particular belief.</p></div></details>
  <p class="small about-version">My God Box · v${VERSION}</p></section>`;
}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modalContent').innerHTML=''}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
let toastTimer;function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';Object.assign(t.style,{position:'fixed',bottom:'22px',left:'50%',transform:'translateX(-50%)',background:'#171a19',border:'1px solid rgba(240,206,145,.3)',color:'#f3ead9',padding:'12px 16px',borderRadius:'12px',zIndex:100,fontSize:'13px',boxShadow:'0 10px 30px rgba(0,0,0,.4)'}) ;document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.opacity='0',2200)}
function openDrawer(){$('#drawer').classList.remove('hidden');$('#drawer').setAttribute('aria-hidden','false')}
function closeDrawer(){$('#drawer').classList.add('hidden');$('#drawer').setAttribute('aria-hidden','true')}
$('#menuBtn').onclick=openDrawer;$('#closeDrawer').onclick=closeDrawer;$('#brandHome').onclick=()=>setView('home');
$('#drawer').onclick=e=>{if(e.target.id==='drawer'){closeDrawer();return}const b=e.target.closest('[data-drawer]');if(b){closeDrawer();if(b.dataset.drawer==='lookinside'){lookMode='entries';filter='';setView('lookinside')}else if(b.dataset.drawer==='turnover'){openTurnOverModal()}else if(b.dataset.drawer==='reflect'){openReflectionModal()}else setView(b.dataset.drawer)}};
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};$('#lockBtn').onclick=()=>toast('App lock can be added later; your writing is already stored locally in this browser.');
applyTheme();render();
