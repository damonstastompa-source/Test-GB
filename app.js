const KEY='my-god-box-v1';
const VERSION='1.4.1';
const defaultState={entries:[],reflections:[],theme:'classic'};
let state=load(); let current='home'; let filter=''; let selectedEntryId=null;
const $=s=>document.querySelector(s); const main=$('#main');

function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...defaultState}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function dateStr(d){return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(d))}
function timeStr(d){return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(d))}
function applyTheme(){document.body.className=state.theme==='classic'?'':'theme-'+state.theme}
function setView(v){current=v;filter='';render();requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}))}
function render(){
  if(current==='home')renderHome();
  else if(current==='entries'||current==='reflections')renderEntries();
  else if(current==='reflect')renderReflect();
  else if(current==='quiet')renderQuiet();
  else if(current==='themes')renderThemes();
  else if(current==='settings')renderSettings();
  else if(current==='about')renderAbout();
}
function renderHome(){
  main.className='screen home-screen';
  main.innerHTML=`<section class="hero"><div class="eyebrow">A quiet place to let go</div><h1 class="title">My God Box</h1><p class="subtitle">Turn over what you cannot control. Keep what is yours to do.</p></section>
  <div class="box-wrap"><div class="box"><div class="latch"></div></div></div>
  <section class="card"><label class="small" for="entry">What's weighing on you?</label><textarea id="entry" maxlength="2000" placeholder="Write it down. You don't have to solve it here."></textarea><div class="counter" id="counter">0 / 2000</div><button class="primary" id="turnOver">TURN IT OVER</button></section>
  <div class="home-links"><button class="text-link" id="homeEntries">View what you've turned over →</button><button class="text-link" id="homeReflections">Reflect on something →</button></div><p class="hint">You can write as much or as little as you want.</p>`;
  const ta=$('#entry');
  ta.addEventListener('input',()=>$('#counter').textContent=`${ta.value.length} / 2000`);
  $('#turnOver').onclick=()=>turnOver(ta.value.trim());
  $('#homeEntries').onclick=()=>setView('entries');
  $('#homeReflections').onclick=()=>setView('reflections');
}
function turnOver(text,closeAfter=true){
  if(!text){toast('Write something first, even just a few words.');return}
  const entry={id:crypto.randomUUID(),text,created:new Date().toISOString()};
  state.entries.unshift(entry); selectedEntryId=entry.id;
  save();
  if(closeAfter){showSurrender()} else {closeModal();renderEntries()}
}
function openTurnOverModal(){
  openModal(`<div class="modal-head"><h2>Turn It Over</h2><button class="icon-btn" id="close">×</button></div>
  <p class="small modal-intro">Put down whatever is weighing on you. You don't have to solve it here.</p>
  <label class="small" for="modalEntry">What's weighing on you?</label>
  <textarea class="modal-textarea" id="modalEntry" maxlength="2000" placeholder="Write it down. You don't have to solve it here."></textarea>
  <div class="counter" id="modalCounter">0 / 2000</div>
  <button class="primary" id="modalTurnOver">TURN IT OVER</button>`);
  $('#close').onclick=closeModal;
  const ta=$('#modalEntry');
  ta.oninput=()=>$('#modalCounter').textContent=`${ta.value.length} / 2000`;
  $('#modalTurnOver').onclick=()=>turnOver(ta.value.trim(),false);
  setTimeout(()=>ta.focus(),50);
}
function showSurrender(){
  main.className='screen';
  main.innerHTML=`<div class="hero surrender"><div class="eyebrow">Turning it over</div><h1 class="title" style="font-size:36px">It's out of your hands.</h1></div>
  <div class="box-wrap"><div class="box surrender-box"><div class="latch"></div></div></div>
  <div class="card"><div class="quote">“You've done what you can.<br>Now you can let it be.”</div><button class="primary" id="done">DONE</button><button class="secondary" id="mine">WHAT'S MINE TO DO?</button></div>`;
  $('#done').onclick=()=>setView('home');
  $('#mine').onclick=()=>openReflectionModal(selectedEntryId,true);
}
function renderEntries(){
  main.className='screen entries-screen';
  const mode=current==='entries'?'entries':'reflections';
  const arr=(mode==='entries'?state.entries:state.reflections).filter(e=>{
    const q=filter.toLowerCase();
    return !q || e.text.toLowerCase().includes(q) || (e.prompt||'').toLowerCase().includes(q) || linkedEntryText(e).toLowerCase().includes(q);
  });
  main.innerHTML=`<div class="entries-shell">
    <div class="hero entries-hero"><div class="eyebrow">Your private record</div><h1 class="section-title">My Entries</h1><p class="reflect-intro">What you have chosen to turn over.</p></div>
    <div class="segmented"><button class="segment ${mode==='entries'?'active':''}" id="showEntries">Turned Over</button><button class="segment ${mode==='reflections'?'active':''}" id="showReflections">Reflections</button></div>
    <input class="search" id="search" placeholder="Search entries..." value="${esc(filter)}">
    <div class="entry-scroll">${arr.length?arr.map(e=>entryCard(e,mode)).join(''):`<div class="empty">${mode==='entries'?'Nothing has been turned over yet.':'No reflections saved yet.'}<br><br>${mode==='entries'?'When you’re ready, put something down and let it go.':'Reflection is always optional.'}</div>`}</div>
    <div class="list-action"><button class="text-link" id="addAction">${mode==='entries'?'＋ Turn something over':'＋ Write a reflection'}</button>${mode==='entries'&&state.entries.length?`<button class="text-link burn-link" id="burnAction">Burn turned-over entries</button>`:''}</div>
  </div>`;
  $('#search').oninput=e=>{filter=e.target.value;renderEntries()};
  $('#showEntries').onclick=()=>setView('entries');
  $('#showReflections').onclick=()=>setView('reflections');
  $('#addAction').onclick=()=>mode==='entries'?openTurnOverModal():openReflectionModal(null,false);
  if(mode==='entries'&&state.entries.length)$('#burnAction').onclick=burnAll;
  document.querySelectorAll('.entry').forEach(x=>x.onclick=()=>mode==='entries'?entryDetail(x.dataset.id):reflectionDetail(x.dataset.id));
}
function linkedEntryText(e){
  if(!e.linkedEntryId)return '';
  const linked=state.entries.find(x=>x.id===e.linkedEntryId);
  return linked?linked.text:'';
}
function entryCard(e,mode){
  if(mode==='entries')return `<article class="entry" data-id="${e.id}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)} · Turned Over</div><div class="entry-text">${esc(e.text)}</div>${state.reflections.some(r=>r.linkedEntryId===e.id)?'<div class="linked-note">Reflection attached</div>':''}</article>`;
  const linked=e.linkedEntryId?state.entries.find(x=>x.id===e.linkedEntryId):null;
  return `<article class="entry" data-id="${e.id}"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)} · Reflection</div>${e.prompt?`<div class="entry-context">${esc(e.prompt)}</div>`:''}<div class="entry-text">${esc(e.text)}</div>${linked?`<div class="linked-note">↳ From turned-over entry</div>`:''}</article>`;
}
function entryDetail(id){
  const e=state.entries.find(x=>x.id===id);if(!e)return;
  const linkedReflections=state.reflections.filter(r=>r.linkedEntryId===id);
  openModal(`<div class="modal-head"><h2>Turned Over</h2><button class="icon-btn" id="close">×</button></div>
  <p class="small">${dateStr(e.created)} · ${timeStr(e.created)}</p>
  <div class="reading-box">${esc(e.text).replace(/\n/g,'<br>')}</div>
  ${linkedReflections.length?`<div class="linked-section"><div class="small">Reflections connected to this</div>${linkedReflections.map(r=>`<button class="linked-reflection" data-reflection="${r.id}">${r.prompt?esc(r.prompt)+' — ':''}${esc(r.text)}</button>`).join('')}</div>`:''}
  <div class="modal-actions"><button class="text-link" id="reflectLinked">＋ Reflect on this</button></div>
  <div class="row"><button class="secondary" id="delete">Delete</button><button class="primary" id="modalDone">Done</button></div>`);
  $('#close').onclick=closeModal;$('#modalDone').onclick=closeModal;
  $('#reflectLinked').onclick=()=>openReflectionModal(id,false);
  $('#delete').onclick=()=>{if(confirm('Delete this turned-over entry? Any reflections connected to it will remain.')){state.entries=state.entries.filter(x=>x.id!==id);save();closeModal();renderEntries()}};
  document.querySelectorAll('[data-reflection]').forEach(b=>b.onclick=()=>reflectionDetail(b.dataset.reflection));
}
function reflectionDetail(id){
  const e=state.reflections.find(x=>x.id===id);if(!e)return;
  const linked=e.linkedEntryId?state.entries.find(x=>x.id===e.linkedEntryId):null;
  openModal(`<div class="modal-head"><h2>Reflection</h2><button class="icon-btn" id="close">×</button></div>
  <p class="small">${dateStr(e.created)} · ${timeStr(e.created)}${e.kind==='mine'?' · What’s mine to do?':''}</p>
  ${linked?`<div class="linked-section"><div class="small">Turned over</div><div class="linked-reading">${esc(linked.text).replace(/\n/g,'<br>')}</div></div>`:''}
  ${e.prompt?`<div class="reflection-context"><div class="small">Prompt</div><div class="reflection-prompt">${esc(e.prompt)}</div></div>`:''}
  <div class="reading-box"><div class="small reading-label">Your reflection</div>${esc(e.text).replace(/\n/g,'<br>')}</div>
  <div class="row"><button class="secondary" id="delete">Delete</button><button class="primary" id="modalDone">Done</button></div>`);
  $('#close').onclick=closeModal;$('#modalDone').onclick=closeModal;
  $('#delete').onclick=()=>{if(confirm('Delete this reflection?')){state.reflections=state.reflections.filter(x=>x.id!==id);save();closeModal();renderEntries()}};
}
function openReflectionModal(linkedEntryId=null,isMine=false){
  const prompts=['No prompt','What am I trying to control?','What part of this is actually mine?','What can I do today?','What am I willing to let go of?','What outcome am I afraid of?'];
  openModal(`<div class="modal-head"><h2>${isMine?"What's Mine to Do?":'Reflect'}</h2><button class="icon-btn" id="close">×</button></div>
  <p class="small modal-intro">${isMine?'Surrendering the outcome doesn’t mean giving up your part.':'Reflection is optional. Choose a prompt if it helps, or simply write.'}</p>
  ${linkedEntryId?`<div class="linked-section"><div class="small">Reflecting on</div><div class="linked-reading">${esc(state.entries.find(e=>e.id===linkedEntryId)?.text||'')}</div></div>`:''}
  <label class="small" for="promptSelect">Prompt</label>
  <select id="promptSelect" class="theme-control">${prompts.map((p,i)=>`<option value="${i===0?'':esc(p)}">${esc(p)}</option>`).join('')}</select>
  <textarea class="modal-textarea" id="reflectText" maxlength="2000" placeholder="${isMine?'What is one small thing within your control?':'Write anything you want... (optional)'}"></textarea>
  <div class="counter" id="reflectCounter">0 / 2000</div>
  <button class="primary" id="saveReflect">${isMine?'SAVE REFLECTION':'SAVE REFLECTION'}</button>`);
  $('#close').onclick=closeModal;
  const ta=$('#reflectText');ta.oninput=()=>$('#reflectCounter').textContent=`${ta.value.length} / 2000`;
  $('#saveReflect').onclick=()=>{
    const text=ta.value.trim();
    if(!text){toast('Write something first, even if it is only a few words.');return}
    const prompt=$('#promptSelect').value;
    state.reflections.unshift({id:crypto.randomUUID(),text,prompt,linkedEntryId:linkedEntryId||null,created:new Date().toISOString(),kind:isMine?'mine':'reflection'});
    save();closeModal();toast('Reflection saved.');renderEntries();
  };
  setTimeout(()=>ta.focus(),50);
}
function renderReflect(){setView('reflections')}
function renderQuiet(){
  main.className='screen quiet-screen';
  main.innerHTML=`<section class="quiet"><div class="quiet-content"><div class="moon">☾</div><h1>Quiet Space</h1><p>A place to just be.<br>No writing. No expectations.</p><div style="margin-top:28px;color:var(--gold)">—</div></div></section>`;
}
function renderThemes(){
  main.className='screen';
  main.innerHTML=`<div class="hero"><div class="eyebrow">Appearance</div><h1 class="section-title">Themes</h1></div><div class="list">${[['classic','Classic','Warm brass & dark wood'],['midnight','Midnight','Cool moonlit blue'],['forest','Forest','Deep green & quiet gold'],['burgundy','Burgundy','Dark wine & soft rose']].map(([id,n,d])=>`<button class="entry" data-theme="${id}" style="text-align:left"><div style="font-size:17px">${n} ${state.theme===id?'✓':''}</div><div class="small">${d}</div></button>`).join('')}</div>`;
  document.querySelectorAll('[data-theme]').forEach(x=>x.onclick=()=>{state.theme=x.dataset.theme;applyTheme();save();renderThemes()});
}
function renderSettings(){
  main.className='screen settings-screen';
  main.innerHTML=`<div class="hero"><div class="eyebrow">Keep it yours</div><h1 class="section-title">Settings</h1></div><div class="list">
  <button class="entry" id="themesSetting"><div>✦ &nbsp; Themes</div><div class="small">Change the look without changing how the app works.</div></button>
  <button class="entry" id="backup"><div>⇧ &nbsp; Backup & Transfer</div><div class="small">Export or import your complete God Box.</div></button>
  <button class="entry" id="exportEntries"><div>▣ &nbsp; Export Entries & Reflections</div><div class="small">Save a readable text file with everything you've written.</div></button>
  <button class="entry" id="print"><div>⎙ &nbsp; Print / PDF</div><div class="small">Create a printer-friendly copy of your entries and reflections.</div></button>
  <button class="entry danger" id="clear"><div>⌫ &nbsp; Clear All Data</div><div class="small">This cannot be undone unless you have a backup.</div></button></div><p class="hint">Your data stays on this device unless you choose to export it.</p>`;
  $('#themesSetting').onclick=()=>setView('themes');$('#backup').onclick=backupModal;$('#exportEntries').onclick=exportEntries;$('#print').onclick=printAll;
  $('#clear').onclick=()=>{if(confirm('Clear all God Box data? This cannot be undone.')){state={...defaultState};save();applyTheme();render()}};
}
function backupModal(){openModal(`<div class="modal-head"><h2>Backup & Transfer</h2><button class="icon-btn" id="close">×</button></div><div class="setting"><h3>Export Backup</h3><p>Save every entry, reflection, and setting in one JSON backup.</p><button class="primary" id="export">EXPORT BACKUP</button></div><div class="setting"><h3>Import Backup</h3><p>Choose a previous backup and merge it with this device.</p><input id="file" type="file" accept="application/json,.json" style="margin-top:12px;width:100%"><button class="secondary" id="import">IMPORT & MERGE</button></div><p class="small">Nothing is uploaded to a server. The backup stays wherever you choose to save it.</p>`);$('#close').onclick=closeModal;$('#export').onclick=exportBackup;$('#import').onclick=()=>importBackup($('#file').files[0])}
function exportBackup(){download('my-god-box-backup.json',JSON.stringify({...state,exportedAt:new Date().toISOString(),app:'My God Box',version:VERSION},null,2),'application/json');toast('Backup exported.');closeModal()}
function importBackup(file){if(!file){toast('Choose a backup file first.');return}const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x.entries)||!Array.isArray(x.reflections))throw 0;const ids=new Set(state.entries.map(e=>e.id));const rids=new Set(state.reflections.map(e=>e.id));state.entries=[...state.entries,...x.entries.filter(e=>e.id&&!ids.has(e.id))];state.reflections=[...state.reflections,...x.reflections.filter(e=>e.id&&!rids.has(e.id))];if(x.theme)state.theme=x.theme;save();applyTheme();closeModal();toast('Backup imported and merged.');render()}catch{toast('That file is not a valid My God Box backup.')}};r.readAsText(file)}
function exportEntries(){const sections=[['TURNED OVER',state.entries],['REFLECTIONS',state.reflections]];const txt=sections.map(([h,arr])=>`${h}\n${'='.repeat(h.length)}\n\n${arr.length?arr.map(e=>`${dateStr(e.created)} · ${timeStr(e.created)}${e.kind==='mine'?' · What’s mine to do?':''}${e.prompt?` · ${e.prompt}`:''}\n${e.text}\n`).join('\n'):'None yet.\n'}`).join('\n\n');download('my-god-box-writing.txt',txt,'text/plain');toast('Writing exported.')}
function printAll(){const old=main.innerHTML;main.innerHTML=`<h1 class="print-title">My God Box — My Writing</h1><p>Printed ${new Date().toLocaleString()}</p><h2>Turned Over</h2>${state.entries.map(e=>`<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div><div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div></article>`).join('')||'<p>No entries.</p>'}<h2>Reflections</h2>${state.reflections.map(e=>`<article class="entry" style="margin:14px 0"><div class="entry-date">${dateStr(e.created)} · ${timeStr(e.created)}</div>${e.prompt?`<div>${esc(e.prompt)}</div>`:''}<div class="entry-text" style="white-space:pre-wrap">${esc(e.text)}</div></article>`).join('')||'<p>No reflections.</p>'}`;setTimeout(()=>{window.print();main.innerHTML=old;renderSettings()},50)}
function burnAll(){
  if(!state.entries.length)return;
  if(confirm('Burn all turned-over entries?\n\nThis permanently removes the turned-over items. Any reflections connected to them will remain.')){state.entries=[];save();toast('The turned-over entries have been burned.');renderEntries()}
}
function renderAbout(){
  main.className='screen about-screen';
  main.innerHTML=`<div class="hero"><div class="eyebrow">A simple practice</div><h1 class="section-title">About My God Box</h1></div><section class="card">
  <p style="line-height:1.7;color:#ddd5c6">My God Box is a private place to write down what you're struggling to control, turn it over, and move forward.</p>
  <details class="setting"><summary>How to install</summary><div class="install-copy"><p>Open My God Box in Safari, tap the Share button, then choose <b>Add to Home Screen</b>. Open it from your Home Screen for the app-like experience.</p><p>Everything you write stays on this device unless you choose to export a backup.</p></div></details>
  <details class="setting"><summary>How it works</summary><div class="install-copy"><p>Turn It Over is where you put something down. Reflect is optional. You can choose a prompt or choose <b>No prompt</b> and simply write.</p><p>Reflections can be linked to a turned-over entry so the context stays with the reflection. Burning turned-over entries removes the original entry but leaves connected reflections behind.</p></div></details>
  <details class="setting"><summary>Privacy & storage</summary><div class="install-copy"><p>Entries and reflections are stored locally in your browser. My God Box does not require an account or a server.</p></div></details>
  <details class="setting"><summary>Higher Power</summary><div class="install-copy"><p>“God” can mean whatever a Higher Power means to you. The app does not prescribe a particular belief.</p></div></details>
  <p class="small">My God Box · v${VERSION}</p></section>`;
}
function openModal(html){$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function closeModal(){$('#modal').classList.add('hidden');$('#modalContent').innerHTML=''}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
let toastTimer;function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';Object.assign(t.style,{position:'fixed',bottom:'22px',left:'50%',transform:'translateX(-50%)',background:'#171a19',border:'1px solid rgba(240,206,145,.3)',color:'#f3ead9',padding:'12px 16px',borderRadius:'12px',zIndex:100,fontSize:'13px',maxWidth:'calc(100vw - 40px)',textAlign:'center'});document.body.appendChild(t)}t.textContent=msg;t.style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.style.opacity='0',2200)}
function openDrawer(){$('#drawer').classList.remove('hidden');$('#drawer').setAttribute('aria-hidden','false')}
function closeDrawer(){$('#drawer').classList.add('hidden');$('#drawer').setAttribute('aria-hidden','true')}
$('#menuBtn').onclick=openDrawer;$('#closeDrawer').onclick=closeDrawer;$('#brandHome').onclick=()=>setView('home');
$('#drawer').onclick=e=>{if(e.target.id==='drawer'){closeDrawer();return}const b=e.target.closest('[data-drawer]');if(b){closeDrawer();setView(b.dataset.drawer)}};
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
$('#lockBtn').onclick=()=>toast('Your writing is stored locally in this browser.');
applyTheme();render();
