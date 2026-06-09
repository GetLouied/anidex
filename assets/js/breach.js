let BREACH=null, CARDS=[], TALENTS={};
let CARD_BY_ID={}, CARD_BY_NAME={};

async function loadData(){
  await Anidex.load(['cards','talents']);
  CARDS = Anidex.store.cards;
  TALENTS = Anidex.store.talents;
  CARD_BY_ID = Anidex.store.byId;
  CARD_BY_NAME = Anidex.store.byName;
  // Breach data is encrypted. Show the passphrase gate; decrypt on submit.
  showGate();
}

// Remember the passphrase for THIS TAB only (cleared when tab closes).
function rememberPass(p){ try{ sessionStorage.setItem('breachPass', p); }catch(e){} }
function recallPass(){ try{ return sessionStorage.getItem('breachPass'); }catch(e){ return null; } }

async function tryUnlock(passphrase, onFail){
  let ok=false;
  try{ ok = await Anidex.loadBreachEncrypted(passphrase); }
  catch(e){ onFail('Breach data file missing. Contact the site owner.'); return; }
  if(ok){
    BREACH = Anidex.store.breach;
    rememberPass(passphrase);
    document.getElementById('gate').remove();
    init();
  } else {
    onFail('Incorrect passphrase.');
  }
}

function showGate(){
  // If we already unlocked this tab, reuse the passphrase silently.
  const saved = recallPass();
  const main = document.getElementById('main');
  const gate = document.createElement('div');
  gate.id='gate';
  gate.innerHTML = `
    <div class="gate-card">
      <div class="gate-title">Clan Access</div>
      <p class="gate-sub">The breach comps are clan-only. Enter the passphrase shared in Discord.</p>
      <input id="gatePass" type="password" placeholder="Passphrase" autocomplete="off">
      <button class="btn primary" id="gateBtn">Unlock</button>
      <div class="gate-err" id="gateErr"></div>
    </div>`;
  // Replace the layout with the gate
  document.querySelector('.layout').classList.add('hidden');
  document.querySelector('.wrap').appendChild(gate);
  const input=document.getElementById('gatePass');
  const err=document.getElementById('gateErr');
  const submit=()=>{
    err.textContent='';
    const p=input.value;
    if(!p){err.textContent='Enter the passphrase.';return}
    document.getElementById('gateBtn').textContent='Unlocking…';
    tryUnlock(p, msg=>{
      err.textContent=msg;
      document.getElementById('gateBtn').textContent='Unlock';
      input.select();
    });
  };
  document.getElementById('gateBtn').onclick=submit;
  input.onkeydown=e=>{if(e.key==='Enter')submit()};
  input.focus();
  // Auto-attempt with remembered passphrase (no error shown if it fails)
  if(saved){ tryUnlock(saved, ()=>{}); }
}

function revealLayout(){ document.querySelector('.layout').classList.remove('hidden'); }

let state={boss:null,search:"",showRef:false};

const variantDesc = Anidex.variantDesc;

function cardModal(card){
  const m=document.getElementById('modal');
  if(!card){m.innerHTML='<button class="close" onclick="closeModal()">×</button><div class="notfound">Card not found in database.</div>';openModal();return}
  const desc=variantDesc(card.talent,card.variant)||'(no description)';
  m.innerHTML=`<button class="close" onclick="closeModal()">×</button>
    <div class="mname">${card.name}</div>
    <span class="mel el-${card.element}">${card.element}</span>
    <div class="statgrid">
      <div class="st"><div class="lab">HP</div><div class="val">${card.hp}</div></div>
      <div class="st"><div class="lab">ATK</div><div class="val">${card.atk}</div></div>
      <div class="st"><div class="lab">DEF</div><div class="val">${card.def}</div></div>
      <div class="st"><div class="lab">SPD</div><div class="val">${card.spd}</div></div>
      <div class="st total"><div class="lab">TOTAL</div><div class="val">${card.total}</div></div>
    </div>
    <div class="mtalent">${card.talent}${card.variant&&card.variant!=='-'?' · '+card.variant:''}</div>
    <div class="mdesc">${desc}</div>
    <div class="mseries">ID ${card.id} · ${card.series||'—'}</div>`;
  openModal();
}
function openModal(){document.getElementById('modalBg').classList.add('show')}
function closeModal(){document.getElementById('modalBg').classList.remove('show')}
document.getElementById('modalBg').onclick=e=>{if(e.target.id==='modalBg')closeModal()};

function roleLink(label){
  const map=(BREACH.roleTalentMap||{})[label];
  if(!map)return null;
  let url='cards.html#talent='+encodeURIComponent(map.talent);
  if(map.variant)url+='&variant='+encodeURIComponent(map.variant);
  return url;
}

function renderSlot(slot){
  if(slot.type==='card'){
    const card=slot.id?CARD_BY_ID[slot.id]:CARD_BY_NAME[slot.name];
    const el=card?card.element:'';
    const elTag=card?`<span class="el el-${el}">${el.slice(0,3)}</span>`:'';
    const note=slot.note?`<span class="slot-note">${slot.note}</span>`:'';
    const d=`<span class="slot slot-card" data-cid="${card?card.id:''}" data-cname="${slot.name}">
      <span class="nm">${slot.name}</span>${elTag}</span>`;
    return d+note;
  }
  if(slot.type==='role'){
    const url=roleLink(slot.label);
    const note=slot.note?`<span class="slot-note">${slot.note}</span>`:'';
    return `<span class="slot slot-role" ${url?`data-url="${url}"`:''} title="${url?'Open candidates in Card filter':''}">
      <span class="rk">role</span>${slot.label}</span>${note}`;
  }
  if(slot.type==='tag'){
    return `<span class="slot slot-tag">${slot.label}</span>`;
  }
  if(slot.type==='choice'){
    const inner=slot.options.map((o,i)=>renderSlot(o)).join('<span class="or">/</span>');
    const note=slot.note?`<span class="slot-note">${slot.note}</span>`:'';
    return `<span class="choice"><span class="chlabel">any</span>${inner}</span>${note}`;
  }
  return '';
}

function compMatchesSearch(comp,q){
  if(!q)return true;
  const txt=JSON.stringify(comp).toLowerCase();
  return txt.includes(q);
}

function renderBoss(boss){
  const main=document.getElementById('main');
  const q=state.search.toLowerCase();
  let h=`<div class="boss-head">${boss.name}${boss.fixed?'<span class="fixed-badge">FIXED</span>':''}</div>`;
  h+=`<div class="boss-sub">${boss.series?'Series: '+boss.series+' · ':''}${boss.phases.length} phase${boss.phases.length>1?'s':''}</div>`;
  h+=`<div class="searchbar"><input id="search" placeholder="Search comps (card, talent, role)..." autocomplete="off" value="${state.search}"></div>`;
  if(boss.tips&&boss.tips.length){
    h+=`<div class="tips"><div class="panel-title">Tips</div><ul>${boss.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
  }
  boss.phases.forEach(ph=>{
    const icon=ph.icon?`<span class="phase-icon ${ph.icon}">${ph.icon==='sun'?'☀':'☾'}</span>`:'';
    let phaseHtml='';
    ph.difficulties.forEach(d=>{
      const comps=d.comps.filter(c=>compMatchesSearch(c,q));
      if(!comps.length)return;
      const star=d.best_energy?'<span class="energy-star">safest energy spot</span>':'';
      phaseHtml+=`<div class="diff"><span class="diff-head diff-${d.mode}">${d.mode}${star}</span>`;
      comps.forEach(comp=>{
        phaseHtml+=`<div class="comp"><div class="comp-slots">${comp.slots.map(renderSlot).join('')}</div>${comp.note?`<div class="comp-note">${comp.note}</div>`:''}</div>`;
      });
      phaseHtml+=`</div>`;
    });
    if(phaseHtml){
      h+=`<div class="phase"><div class="phase-head">${icon}${ph.name}</div>${phaseHtml}</div>`;
    }
  });
  main.innerHTML=h;
  const si=document.getElementById('search');
  si.oninput=e=>{state.search=e.target.value;const boss=BREACH.bosses.find(b=>b.id===state.boss);renderBoss(boss);document.getElementById('search').focus();
    const v=document.getElementById('search');v.setSelectionRange(v.value.length,v.value.length)};
  bindSlots();
}

function bindSlots(){
  document.querySelectorAll('.slot-card').forEach(el=>{
    el.onclick=()=>{
      const cid=el.dataset.cid, cname=el.dataset.cname;
      const card=cid?CARD_BY_ID[cid]:CARD_BY_NAME[cname];
      cardModal(card);
    };
  });
  document.querySelectorAll('.slot-role[data-url]').forEach(el=>{
    el.onclick=()=>{window.location.href=el.dataset.url};
  });
}

function renderRef(){
  const main=document.getElementById('main');
  const r=BREACH.reference;
  let h=`<div class="boss-head">Reference &amp; Formulas</div><div class="boss-sub">Permanent breach info</div>`;
  h+=`<div class="ref-section">`;
  h+=`<div class="ref-block"><h3>Energy</h3><ul>${r.energy.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  h+=`<div class="ref-block"><h3>Principles</h3><ul>${r.principles.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  h+=`<div class="ref-block"><h3>Rewards</h3><ul><li><b>Personal:</b> ${r.rewards.personal}</li><li><b>Packs:</b> ${r.rewards.packs}</li><li><b>Clan:</b> ${r.rewards.clan}</li></ul></div>`;
  h+=`<div class="ref-block"><h3>Damage Formulas</h3>
    <div class="formula"><b>Solo:</b> ${r.formulas.solo}</div>
    <div class="formula"><b>Duo:</b> ${r.formulas.duo}</div>
    <div class="formula"><b>Enraged:</b> ${r.formulas.enraged}</div>
    <ul>${r.formulas.conclusions.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  h+=`</div>`;
  main.innerHTML=h;
}

function renderSidebar(){
  const bl=document.getElementById('bossList');
  bl.innerHTML='';
  BREACH.bosses.forEach(b=>{
    const btn=document.createElement('button');
    btn.className='boss-btn'+(state.boss===b.id&&!state.showRef?' active':'');
    btn.innerHTML=`${b.name}${b.fixed?'<span class="fixed-badge">FIXED</span>':''}${b.series?`<span class="ser">${b.series}</span>`:''}`;
    btn.onclick=()=>{state.boss=b.id;state.showRef=false;state.search="";renderSidebar();renderBoss(b)};
    bl.appendChild(btn);
  });
  document.getElementById('refToggle').classList.toggle('active',state.showRef);
}

function init(){
  revealLayout();
  state.boss=BREACH.bosses[0].id;
  renderSidebar();
  renderBoss(BREACH.bosses[0]);
  document.getElementById('refToggle').onclick=()=>{state.showRef=true;state.boss=null;renderSidebar();renderRef()};
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
loadData();