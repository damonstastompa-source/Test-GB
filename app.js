const KEY='my-god-box-v2';
const LEGACY_KEYS=['my-god-box-v1'];
const SCHEMA_VERSION=2;
const VERSION='2.0.1';
const defaultState={schemaVersion:SCHEMA_VERSION,entries:[],reflections:[],theme:'classic'};
let state=load();
let current='home';
let filter='';
const $=s=>document.querySelector(s);
const main=$('#main');

function normalizeState(raw){
  const next={...defaultState,...raw};
  next.schemaVersion=SCHEMA_VERSION;
  next.entries=Array.isArray(next.entries)?next.entries:[];
  next.reflections=Array.isArray(next.reflections)?next.reflections:[];
  next.entries=next.entries.map(e=>({...e,id:e.id||crypto.randomUUID(),text:String(e.text||''),created:e.created||new Date().toISOString()}));
  next.reflections=next.reflections.map(r=>({...r,id:r.id||crypto.randomUUID(),text:String(r.text||''),created:r.created||new Date().toISOString(),entryId:r.entryId||null,prompt:r.prompt||'',kind:r.kind||'reflection'}));
  return next;
}
function load(){
  try{
    const current=localStorage.getItem(KEY);
    if(current) return normalizeState(JSON.parse(current));
    for(const legacyKey of LEGACY_KEYS){
      const legacy=localStorage.getItem(legacyKey);
      if(legacy){ const migrated=normalizeState(JSON.parse(legacy)); localStorage.setItem(KEY,JSON.stringify(migrated)); return migrated; }
    }
    return {...defaultState,entries:[],reflections:[]};
  }catch{return {...defaultState,entries:[],reflections:[]}}
}
function save(){localStorage.setItem(KEY,JSON.stringify({...state,schemaVersion:SCHEMA_VERSION}))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function dateStr(d){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(d))}
function timeStr(d){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(d))}
function applyTheme(){document.body.className=state.theme==='classic'?'':'theme-'+state.theme}
function setView(v){current=v;filter='';closeDrawer();render();requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}))}
function render(){
  if(current==='home')renderHome();
  else if(current==='entries')renderEntries('entries');
  else if(current==='reflections')renderEntries('reflections');
  else if(current==='quiet')renderQuiet();
  else if(current==='settings')renderSettings();
  else if(current==='about')renderAbout();
}

function renderHome(){
  main.className='screen home-screen';
  main.innerHTML=`
    <section class="hero home-hero">
      <div class="eyebrow">A quiet place to let go</div>
      <h1 class="title">My God Box</h1>
      <p class="subtitle">Turn over what you cannot control. Keep what is yours to do.</p>
    </section>
    <div class="box-wrap"><div class="box"><div class="latch"></div></div></div>
    <section class="home-card card">
      <div class="home-question">What's weighing on you?</div>
      <button class="write-entry-trigger" id="openEntry">Write it down. You don't have to solve it here.</button>
      <button class="primary" id="turnOverHome">TURN IT OVER</button>
    </section>
    <div class="home-links">
      <button class="text-link" id="homeEntries">View what you've turned over →</button>
      <button class="text-link" id="homeReflect">View saved reflections →</button>
    </div>
    <p class="hint">You can write as much or as little as you want.</p>`;
  $('#openEntry').onclick=openTurnOverModal;
  $('#turnOverHome').onclick=openTurnOverModal;
  $('#homeEntries').onclick=()=>setView('entries');
  $('#homeReflect').onclick=()=>setView('reflections');
}

function openTurnOverModal(){
  openModal(`
    <div class="modal-head"><div><div class="eyebrow">Turn it over</div><h2>What's weighing on you?</h2></div><button class="icon-btn" id="close">×</button></div>
    <textarea id="entryModalText" maxlength="2000" placeholder="Write it down. You don't have to solve it here."></textarea>
    <div class="counter" id="entryCounter">0 / 2000</div>
    <button class="primary" id="turnOverModal">TURN IT OVER</button>
    <p class="modal-note">You can write as much or as little as you want.</p>`);
  const ta=$('#entryModalText');
  ta.addEventListener('input',()=>$('#entryCounter').textContent=`${ta.value.length} / 2000`);
  $('#close').onclick=closeModal;
  $('#turnOverModal').onclick=()=>turnOver(ta.value.trim());
  setTimeout(()=>ta.focus(),60);
}

function turnOver(text){
  if(!text){toast('Write something first, even just a few words.');return}
  const entry={id:crypto.randomUUID(),text,created:new Date().toISOString()};
  state.entries.unshift(entry);
  save();
  closeModal();
  showSurrender(entry.id);
}

function showSurrender(entryId){
  main.className='screen surrender-screen';
  main.innerHTML=`
    <div class="hero surrender-hero"><div class="eyebrow">Turning it over</div><h1 class="title surrender-title">It's out of your hands.</h1></div>
    <div class="box-wrap"><div class="box surrender-box"><div class="latch"></div></div></div>
    <div class="card surrender-card">
      <div class="quote">“You've done what you can.<br>Now you can let it be.”</div>
      <button class="primary" id="done">DONE</button>
      <button class="secondary" id="mine">WHAT'S MINE TO DO?</button>
    </div>`;
  $('#done').onclick=()=>setView('home');
  $('#mine').onclick=()=>openReflectionModal(state.entries.find(e=>e.id===entryId));
}

function openReflectionModal(entry=null){
  const prompts=[
    'No prompt',
    'What am I trying to control?',
    'What part of this is actually mine?',
    'What can I do today?',
    'What am I willing to let go of?',
    'What outcome am I afraid of?'
  ];
  const selected=entry ? 'What can I do today?' : 'No prompt';
  openModal(`
    <div class="modal-head"><div><div class="eyebrow">Only if you want to...</div><h2>Reflect</h2></div><button class="icon-btn" id="close">×</button></div>
    ${entry?`<div class="linked-context"><div class="small">Reflecting on</div><div class="linked-text">${esc(entry.text)}</div><div class="small">${dateStr(entry.created)} · ${timeStr(entry.created)}</div></div>`:''}
    <label class="modal-label" for="reflectionPrompt">Prompt <span>(optional)</span></label>
    <select id="reflectionPrompt" class="theme-select">${prompts.map(p=>`<option ${p===selected?'selected':''}>${esc(p)}</option>`).join('')}</select>
    <textarea id="reflectModalText" maxlength="2000" placeholder="Write anything you want... (optional)"></textarea>
    <div class="counter" id="reflectCounter">0 / 2000</div>
    <button class="primary" id="saveReflection">SAVE REFLECTION</button>
    <p class="modal-note">Reflection is optional. You don't have to analyze everything you turn over.</p>`);
  const ta=$('#reflectModalText');
  ta.addEventListener('input',()=>$('#reflectCounter').textContent=`${ta.value.length} / 2000`);
  $('#close').onclick=closeModal;
  $('#saveReflection').onclick=()=>saveReflection(ta.value.trim(),$('#reflectionPrompt').value,entry);
  setTimeout(()=>ta.focus(),60);
}

function saveReflection(text,prompt,entry=null){
  if(!text){toast('Write a thought first, even just a few words.');return}
  state.reflections.unshift({
    id:crypto.randomUUID(),
    text,
    created:new Date().toISOString(),
    kind:prompt==='What can I do today?'?'mine':'reflection',
    prompt:prompt==='No prompt'?'':prompt,
    entryId:entry?.id||null
  });
  save();
  closeModal();
  toast('Reflection saved.');
}

function renderEntries(mode){
  const arr=(mode==='entries'?state.entries:state.reflections)
    .filter(e=>e.text.toLowerCase().includes(filter.toLowerCase()));
  const active=mode==='entries';
  main.className='screen entries-screen';
  const empty=active?`<div class="empty">Nothing has been turned over yet.<br><br>When you're ready, put something down and let it go.</div>`:`<div class="empty">No reflections saved yet.<br><br>Reflection is always optional.</div>`;
  main.innerHTML=`
    <div class="hero entries-hero">
      <div class="eyebrow">Your private record</div>
      <h1 class="section-title">My Entries</h1>
      <p class="reflect-intro">What you've chosen to turn over and anything you've chosen to reflect on.</p>
    </div>
    <div class="segmented">
      <button class="segment ${active?'active':''}" id="showEntries">Turned Over</button>
      <button class="segment ${!active?'active':''}" id="showReflections">Reflections</button>
    </div>
    <input class="search" id="search" placeholder="Search ${active?'entries':'reflections'}..." value="${esc(filter)}">
    <div class="record-scroll-panel"><div class="list">${arr.length?arr.map(e=>renderListItem(e,active)).join(''):empty}</div></div>
    <div class="record-actions"><button class="subtle-add-btn" id="entryAction">+ ${active?'Turn something over':'Write a reflection'}</button>${active&&state.entries.length?'<button class="subtle-danger-btn" id="burnAll">Burn turned-over entries</button>':''}</div>`;
  $('#search').oninput=e=>{filter=e.target.value;renderEntries(mode)};
  $('#showEntries').onclick=()=>setView('entries');
  $('#showReflections').onclick=()=>setView('reflections');
  $('#entryAction').onclick=active?openTurnOverModal:()=>openReflectionModal();
  if(active&&state.entries.length) $('#burnAll').onclick=burnAllEntries;
  document.querySelectorAll('.entry[data-id]').forEach(x=>x.onclick=()=>active?entryDetail(x.dataset.id):reflectionDetail(x.dataset.id));
}

function renderListItem(e,active){
  if(active){
    const refs=state.reflections.filter(r=>r.entryId===e.id);
    return `<article class="entry" data-id="${e.id}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}${refs.length?' · Reflection':''}</div><div class="entry-text">${esc(e.text)}</div><div class="entry-meta">${refs.length?`♡ ${refs.length} reflection${refs.length>1?'s':''}`:'○ No reflection'}</div></article>`;
  }
  const linked=e.entryId?state.entries.find(x=>x.id===e.entryId):null;
  return `<article class="entry" data-id="${e.id}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}${e.kind==='mine'?' · What’s mine to do?':' · Reflection'}</div>${e.prompt?`<div class="entry-context">${esc(e.prompt)}</div>`:''}<div class="entry-text">${esc(e.text)}</div>${linked?`<div class="entry-meta">↳ From Turned Over</div>`:''}</article>`;
}

function entryDetail(id){
  const e=state.entries.find(x=>x.id===id);if(!e)return;
  const refs=state.reflections.filter(r=>r.entryId===id);
  openModal(`
    <div class="modal-head"><div><div class="eyebrow">Turned Over</div><h2>Your entry</h2></div><button class="icon-btn" id="close">×</button></div>
    <p class="small">${dateStr(e.created)} · ${timeStr(e.created)}</p>
    <div class="card modal-writing">${esc(e.text).replace(/\n/g,'<br>')}</div>
    <button class="primary" id="reflectOnThis">REFLECT ON THIS</button>
    <div class="row"><button class="secondary" id="deleteEntry">Delete</button><button class="secondary burn-btn" id="burnEntry">Burn</button></div>
    <div class="linked-section"><div class="section-mini">${refs.length?'Reflections':'No reflection yet'}</div>
      ${refs.length?refs.map(r=>`<button class="linked-reflection" data-ref="${r.id}"><div class="small">${esc(r.prompt||'Reflection')} · ${dateStr(r.created)}</div><div>${esc(r.text)}</div></button>`).join(''):'<p class="small">If you want to reflect, you can do that without leaving this entry.</p>'}
    </div>`);
  $('#close').onclick=closeModal;
  $('#reflectOnThis').onclick=()=>{closeModal();openReflectionModal(e)};
  $('#deleteEntry').onclick=()=>{if(confirm('Delete this turned-over entry? Any connected reflections will remain.')){state.entries=state.entries.filter(x=>x.id!==id);save();closeModal();renderEntries('entries');toast('Entry deleted.')}};
  $('#burnEntry').onclick=()=>burnEntry(id);
  document.querySelectorAll('.linked-reflection').forEach(b=>b.onclick=()=>reflectionDetail(b.dataset.ref));
}

function burnEntry(id){
  const e=state.entries.find(x=>x.id===id); if(!e)return;
  const ok=confirm('Burn this turned-over entry?\n\nThe original entry will be permanently removed. Any reflections connected to it will remain.');
  if(!ok)return;
  state.entries=state.entries.filter(x=>x.id!==id);
  save(); closeModal(); renderEntries('entries'); toast('Turned-over entry burned.');
}
function burnAllEntries(){
  const count=state.entries.length; if(!count)return;
  const ok=confirm(`Burn all ${count} turned-over entr${count===1?'y':'ies'}?\n\nThe original entries will be permanently removed. Any reflections connected to them will remain.`);
  if(!ok)return;
  state.entries=[];
  save(); renderEntries('entries'); toast('Turned-over entries burned. Reflections remain.');
}

function reflectionDetail(id){
  const r=state.reflections.find(x=>x.id===id);if(!r)return;
  const source=r.entryId?state.entries.find(e=>e.id===r.entryId):null;
  openModal(`
    <div class="modal-head"><div><div class="eyebrow">Reflection</div><h2>Your reflection</h2></div><button class="icon-btn" id="close">×</button></div>
    <p class="small">${dateStr(r.created)} · ${timeStr(r.created)}</p>
    ${r.prompt?`<div class="reflection-context"><div class="small">Prompt</div><div class="reflection-prompt">${esc(r.prompt)}</div></div>`:''}
    ${source?`<div class="linked-context"><div class="small">From Turned Over</div><div class="linked-text">${esc(source.text)}</div></div>`:''}
    <div class="card modal-writing"><div class="small" style="margin-bottom:8px">Your reflection</div>${esc(r.text).replace(/\n/g,'<br>')}</div>
    <div class="row"><button class="secondary" id="delete">Delete</button><button class="primary" id="done">Done</button></div>`);
  $('#close').onclick=closeModal;
  $('#done').onclick=closeModal;
  $('#delete').onclick=()=>{state.reflections=state.reflections.filter(x=>x.id!==id);save();closeModal();renderEntries('reflections')};
}

function renderQuiet(){
  main.className='screen quiet-screen';
  main.innerHTML=`<section class="quiet"><div class="quiet-content"><div class="moon">☾</div><h1>Quiet Place</h1><p>A place to just be.<br>No writing. No expectations.</p><div style="margin-top:28px;color:var(--gold)">—</div></div></section>`;
}

function renderSettings(){
  const themes=[['classic','Classic','Warm brass & dark wood'],['midnight','Midnight','Cool moonlit blue'],['forest','Forest','Deep green & quiet gold'],['burgundy','Burgundy','Dark wine & soft rose']];
  main.className='screen';
  main.innerHTML=`
    <div class="hero"><div class="eyebrow">Keep it yours</div><h1 class="section-title">Settings</h1></div>
    <section class="settings-group">
      <button class="accordion-head" id="themeToggle"><span>Themes</span><span>⌄</span></button>
      <div id="themePanel" class="accordion-panel collapsed">${themes.map(([id,n,d])=>`<button class="theme-option ${state.theme===id?'selected':''}" data-theme="${id}"><span><b>${n}</b><small>${d}</small></span><span>${state.theme===id?'✓':''}</span></button>`).join('')}</div>
    </section>
    <div class="list settings-list">
      <button class="entry" id="backup"><div>⇧ &nbsp; Backup & Transfer</div><div class="small">Export or import your complete God Box.</div></button>
      <button class="entry" id="exportEntries"><div>▣ &nbsp; Export Writing</div><div class="small">Save a readable text file with your Turned Over entries and reflections.</div></button>
      <button class="entry" id="print"><div>⎙ &nbsp; Print / PDF</div><div class="small">Create a printer-friendly copy of your writing.</div></button>
      <button class="entry danger" id="clear"><div>⌫ &nbsp; Clear All Data</div><div class="small">This cannot be undone unless you have a backup.</div></button>
    </div>
    <p class="hint">Your data stays on this device unless you choose to export it.</p>`;
  $('#themeToggle').onclick=()=>$('#themePanel').classList.toggle('collapsed');
  document.querySelectorAll('[data-theme]').forEach(x=>x.onclick=()=>{state.theme=x.dataset.theme;applyTheme();save();renderSettings()});
  $('#backup').onclick=backupModal;
  $('#exportEntries').onclick=exportEntries;
  $('#print').onclick=printAll;
  $('#clear').onclick=()=>{if(confirm('Clear all God Box data? This cannot be undone.')){state={...defaultState};save();applyTheme();renderSettings()}};
}

function backupModal(){
  openModal(`<div class="modal-head"><h2>Backup & Transfer</h2><button class="icon-btn" id="close">×</button></div><div class="setting"><h3>Export Backup</h3><p>Save every Turned Over entry, reflection, and setting in one JSON backup.</p><button class="primary" id="export">EXPORT BACKUP</button></div><div class="setting"><h3>Import Backup</h3><p>Choose a previous backup and merge it with this device.</p><input id="file" type="file" accept="application/json,.json" style="margin-top:12px;width:100%"><button class="secondary" id="import">IMPORT & MERGE</button></div><p class="small">Nothing is uploaded to a server. The backup stays wherever you choose to save it.</p>`);
  $('#close').onclick=closeModal;$('#export').onclick=exportBackup;$('#import').onclick=()=>importBackup($('#file').files[0]);
}
function exportBackup(){download('my-god-box-backup.json',JSON.stringify({...state,schemaVersion:SCHEMA_VERSION,exportedAt:new Date().toISOString(),app:'My God Box',version:VERSION},null,2),'application/json');toast('Backup exported.');closeModal()}
function importBackup(file){
  if(!file){toast('Choose a backup file first.');return}
  const r=new FileReader();
  r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.entries)||!Array.isArray(x.reflections))throw 0;const ids=new Set(state.entries.map(e=>e.id));const rids=new Set(state.reflections.map(e=>e.id));state.entries=[...state.entries,...x.entries.filter(e=>e.id&&!ids.has(e.id))];state.reflections=[...state.reflections,...x.reflections.filter(e=>e.id&&!rids.has(e.id))];if(x.theme)state.theme=x.theme;save();applyTheme();closeModal();toast('Backup imported and merged.');render()}catch{toast('That file is not a valid My God Box backup.')}};r.readAsText(file);
}
function exportEntries(){
  const turned=state.entries.map(e=>{const refs=state.reflections.filter(r=>r.entryId===e.id);return `${dateStr(e.created)} · ${timeStr(e.created)}\nTURNED OVER\n${e.text}${refs.length?`\n\nREFLECTIONS\n${refs.map(r=>`${r.prompt||'Reflection'}\n${r.text}`).join('\n\n')}`:''}`}).join('\n\n');
  const standalone=state.reflections.filter(r=>!r.entryId);
  const txt=`MY GOD BOX — TURNED OVER & REFLECTIONS\n\n${turned||'No Turned Over entries yet.'}${standalone.length?`\n\nSTANDALONE REFLECTIONS\n\n${standalone.map(r=>`${dateStr(r.created)} · ${timeStr(r.created)}\n${r.prompt||'Reflection'}\n${r.text}`).join('\n\n')}`:''}`;
  download('my-god-box-writing.txt',txt,'text/plain');toast('Writing exported.');
}
function printAll(){
  const old=main.innerHTML;
  main.innerHTML=`<h1 class="print-title">My God Box — Turned Over & Reflections</h1><p>Printed ${new Date().toLocaleString()}</p><h2>Turned Over</h2>${state.entries.map(e=>{const refs=state.reflections.filter(r=>r.entryId===e.id);return `<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div>${refs.map(r=>`<div style="margin-top:12px;padding:10px;border-left:3px solid #999"><b>${esc(r.prompt||'Reflection')}</b><div style="white-space:pre-wrap;margin-top:4px">${esc(r.text)}</div></div>`).join('')}</article>`}).join('')||'<p>No Turned Over entries.</p>'}<h2>Standalone Reflections</h2>${state.reflections.filter(r=>!r.entryId).map(e=>`<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div></article>`).join('')||'<p>None.</p>'}`;
  setTimeout(()=>{window.print();main.innerHTML=old;renderSettings()},50)
}

function renderAbout(){
  main.className='screen';
  main.innerHTML=`<div class="hero"><div class="eyebrow">A simple practice</div><h1 class="section-title">About My God Box</h1></div><section class="card about-card"><p style="line-height:1.7;color:#ddd5c6">My God Box is a private place to write down what you're struggling to control, turn it over, and move forward.</p><div class="setting"><h3>How it works</h3><p>Write it down. Turn it over. Then decide whether you want to reflect or simply leave it there.</p></div><div class="setting"><h3>It is optional</h3><p>You never have to write, reflect, reread, or keep anything. Use as much or as little of the app as feels useful.</p></div><div class="setting"><h3>Your privacy</h3><p>Turned Over entries and reflections are stored locally in your browser. My God Box does not require an account or a server.</p></div><div class="setting"><h3>Higher Power</h3><p>“God” can mean whatever a Higher Power means to you. The app does not prescribe a particular belief.</p></div><div class="about-accordion"><button class="accordion-head" data-accordion="install"><span>How to Install</span><span>⌄</span></button><div class="accordion-content" data-panel="install"><h4>iPhone / iPad</h4><ol><li>Open My God Box in Safari.</li><li>Tap the Share button.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol><h4>Android</h4><ol><li>Open My God Box in Chrome.</li><li>Tap the browser menu.</li><li>Choose <b>Add to Home screen</b> or <b>Install app</b>.</li></ol><h4>Computer</h4><p>Bookmark the site, or use your browser's install option if available.</p><p class="small">Your data stays on this device. Use Backup & Transfer in Settings if you want to preserve or move it.</p></div></div><div class="about-accordion"><button class="accordion-head" data-accordion="details"><span>Version & Credits</span><span>⌄</span></button><div class="accordion-content" data-panel="details"><p>My God Box · v${VERSION}</p><p class="small">A simple, local-first tool for turning over what you cannot control.</p></div></div></section>`;
  document.querySelectorAll('[data-accordion]').forEach(b=>b.onclick=()=>document.querySelector(`[data-panel="${b.dataset.accordion}"]`).classList.toggle('open'));
}

function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modalContent').innerHTML=''}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
let toastTimer;function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';Object.assign(t.style,{position:'fixed',bottom:'22px',left:'50%',transform:'translateX(-50%)',background:'#171a19',border:'1px solid rgba(240,206,145,.3)',color:'#f3ead9',padding:'12px 16px',borderRadius:'12px',zIndex:100,boxShadow:'0 10px 30px rgba(0,0,0,.4)',fontSize:'13px'});document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.opacity='0',2200)}
function openDrawer(){$('#drawer').classList.remove('hidden');$('#drawer').setAttribute('aria-hidden','false')}
function closeDrawer(){$('#drawer').classList.add('hidden');$('#drawer').setAttribute('aria-hidden','true')}
$('#menuBtn').onclick=openDrawer;
$('#closeDrawer').onclick=closeDrawer;
$('#brandHome').onclick=()=>setView('home');
$('#drawer').onclick=e=>{
  if(e.target.id==='drawer'){closeDrawer();return}
  const b=e.target.closest('[data-drawer]');
  if(!b)return;
  const destination=b.dataset.drawer;
  closeDrawer();
  if(destination==='turned')setView('home');
  else if(destination==='reflect')openReflectionModal();
  else setView(destination);
};
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('#lockBtn').onclick=()=>toast('Your writing is stored locally in this browser.');
applyTheme();
render();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().catch(()=>{});
