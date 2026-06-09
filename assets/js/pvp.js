/* ==========================================================================
   pvp.js — PvP guide page
   ========================================================================== */
let PVP=null, CARD_BY_ID={}, CARD_BY_NAME={};
const variantDesc = Anidex.variantDesc;

async function loadData(){
  await Anidex.load(['cards','talents','pvp']);
  PVP = Anidex.store.pvp;
  CARD_BY_ID = Anidex.store.byId;
  CARD_BY_NAME = Anidex.store.byName;
  init();
}

/* ---------- card modal ---------- */
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
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});

function talentLink(talent,variant){
  let url='cards.html#talent='+encodeURIComponent(talent);
  if(variant)url+='&variant='+encodeURIComponent(variant);
  return url;
}
function roleLink(label, variantOverride){
  const map=(PVP.roleTalentMap||{})[label];
  if(!map)return null;
  return talentLink(map.talent, variantOverride!==undefined && variantOverride!==null ? variantOverride : map.variant);
}

/* ---------- slot rendering (shared) ---------- */
function renderSlot(slot){
  if(slot.type==='card'){
    const card=slot.id?CARD_BY_ID[slot.id]:CARD_BY_NAME[slot.name];
    const el=card?card.element:'';
    const elTag=card?`<span class="el el-${el}">${el.slice(0,3)}</span>`:'';
    return `<span class="slot slot-card" data-cid="${card?card.id:''}" data-cname="${slot.name}"><span class="nm">${slot.name}</span>${elTag}</span>`;
  }
  if(slot.type==='role'){
    // Compound "A / B" labels = pick-one-of; link each half separately.
    if(slot.label.includes(' / ')){
      const parts=slot.label.split(' / ').map(p=>p.trim());
      const inner=parts.map(p=>{
        const url=roleLink(p);
        return url
          ? `<span class="slot slot-role" data-url="${url}" title="Open candidates in Cards"><span class="rk">talent</span>${p}</span>`
          : `<span class="slot slot-role norole"><span class="rk">talent</span>${p}</span>`;
      }).join('<span class="role-or">/</span>');
      return `<span class="role-compound">${inner}</span>`;
    }
    // Single talent. If the slot has a stat-variant note (DEF/ATK/SPD), try to link with it.
    const noteIsVariant = slot.note && ['ATK','DEF','SPD'].includes(slot.note);
    // Talents whose card-data variants are compound (e.g. "Fire/ATK") can't match a bare "ATK" filter.
    const COMPOUND=["Elemental Strike","Double-edged Strike"];
    const linkVariant = (noteIsVariant && !COMPOUND.includes(slot.label)) ? slot.note : null;
    const url = roleLink(slot.label, linkVariant);
    const shownVariant = noteIsVariant ? ' ('+slot.note+')' : (slot.variant?' ('+slot.variant+')':'');
    const otherNote = (slot.note && !noteIsVariant) ? `<span class="slot-note">${slot.note}</span>` : '';
    return `<span class="slot slot-role ${url?'':'norole'}" ${url?`data-url="${url}"`:''} title="${url?'Open candidates in Cards':''}"><span class="rk">talent</span>${slot.label}${shownVariant}</span>${otherNote}`;
  }
  if(slot.type==='any'){
    return `<span class="meta-any">${slot.label}</span>`;
  }
  return '';
}
function bindSlots(root){
  (root||document).querySelectorAll('.slot-card').forEach(el=>{
    el.onclick=()=>{const c=el.dataset.cid?CARD_BY_ID[el.dataset.cid]:CARD_BY_NAME[el.dataset.cname];cardModal(c)};
  });
  (root||document).querySelectorAll('.slot-role[data-url]').forEach(el=>{
    el.onclick=()=>{window.location.href=el.dataset.url};
  });
  (root||document).querySelectorAll('[data-talenturl]').forEach(el=>{
    el.onclick=()=>{window.location.href=el.dataset.talenturl};
  });
}

/* ---------- views ---------- */
let state={view:'tiers',arch:null};

function renderTiers(){
  const m=document.getElementById('main');
  let h='<div class="section-intro">Talent tier list for 3v3 PvP. Click any talent to see the cards that have it.</div>';
  PVP.tiers.forEach(t=>{
    const chips=t.talents.map(e=>{
      if(!e.resolved)return `<span class="tier-chip unresolved">${e.label}</span>`;
      // Some talents (Double-edged Strike, Elemental Strike) store compound variants
      // like "Fire/ATK" in the card data, so a bare "ATK" variant filter won't match.
      // For those, link to the talent only; the variant still shows as a label on the chip.
      const COMPOUND=["Double-edged Strike","Elemental Strike"];
      const linkVariant = COMPOUND.includes(e.talent) ? null : e.variant;
      const url=talentLink(e.talent,linkVariant);
      const vtag=e.variant?`<span class="vtag">${e.variant}</span>`:'';
      return `<span class="tier-chip" data-talenturl="${url}">${e.talent}${vtag}</span>`;
    }).join('');
    h+=`<div class="tier-row tier-${t.slug}">
      <div class="tier-label">${t.tier}<span class="tier-desc">${t.desc}</span></div>
      <div class="tier-talents">${chips}</div></div>`;
  });
  m.innerHTML=h; bindSlots(m);
}

function renderComps(){
  const m=document.getElementById('main');
  if(!state.arch)state.arch=PVP.archetypes[0].slug;
  const picker=PVP.archetypes.map(a=>
    `<button class="arch-btn ${a.slug===state.arch?'active':''}" data-arch="${a.slug}">${a.name}</button>`).join('');
  const a=PVP.archetypes.find(x=>x.slug===state.arch);
  const compHtml=(comps)=>comps.map(c=>
    `<div class="comp"><div class="comp-slots">${c.slots.map(renderSlot).join('')}</div>${c.note?`<div class="comp-note">${c.note}</div>`:''}</div>`).join('');
  let body=`<div class="arch-head">${a.name} Comps</div>
    <div class="arch-meta">
      <div class="arch-card"><div class="k">Objective</div><div class="v">${a.objective}</div></div>
      <div class="arch-card"><div class="k">Main Counters</div><div class="v">${a.counters}</div></div>
      <div class="arch-card"><div class="k">Stat Priority</div><div class="v">${a.stats}</div></div>
    </div>`;
  if(a.meta_comps.length){body+=`<div class="comp-group-title">Meta Comps</div>${compHtml(a.meta_comps)}`;}
  if(a.other_comps&&a.other_comps.length){body+=`<div class="comp-group-title">Other Comps</div>${compHtml(a.other_comps)}`;}
  m.innerHTML=`<div class="arch-picker">${picker}</div>${body}`;
  m.querySelectorAll('.arch-btn').forEach(b=>b.onclick=()=>{state.arch=b.dataset.arch;renderComps()});
  bindSlots(m);
}

function renderMeta(){
  const m=document.getElementById('main');
  let h='<div class="section-intro">Best-in-slot cards for each talent. Meta cards improve consistency and survivability over niche picks. Click a card for its stats and talent info, or a talent name to see all cards with it.</div><div class="meta-list">';
  PVP.meta_cards.forEach(mc=>{
    const cards=mc.cards.map(renderSlot).join('');
    h+=`<div class="meta-row">
      <span class="meta-talent" data-talenturl="${talentLink(mc.talent,null)}">${mc.talent}</span>
      <span class="meta-sep">:</span>
      <span class="meta-cards-row">${cards}</span></div>`;
  });
  h+='</div>';
  m.innerHTML=h; bindSlots(m);
}

function renderReference(){
  const m=document.getElementById('main');
  m.innerHTML=`
  <div class="ref-block">
    <h3>What is PvP?</h3>
    <p>PvP is AniGame's most interactive, competitive mode. It comes in 1v1 and 3v3 formats; this guide focuses on 3v3, the most common tournament format. Entry is cheaper than ever — SR evo-1 copies are enough, and most tournaments are now free to enter.</p>
    <h4>What makes a good PvPer</h4>
    <p>Beyond luck: predicting the opponent's picks, adapting to the situation, and playing creatively around talents and the active ruleset. Experience sharpens all of these.</p>
  </div>
  <div class="ref-block">
    <h3>Rules &amp; Terminology</h3>
    <div class="term"><b>Best of / Bo</b><span>How many rounds a match runs. "Bo11" = first to 6 wins out of up to 11.</span></div>
    <div class="term"><b>Deuce</b><span>When a match is tied at match point, you keep playing until someone leads by two.</span></div>
    <div class="term"><b>Starting / Mutual Bans</b><span>Bans set at the start; any named talent is banned for both players the whole match.</span></div>
    <div class="term"><b>Loser Bans</b><span>A talent the losing player bans after losing a round.</span></div>
    <div class="term"><b>Card Bans</b><span>Specific cards banned instead of talents — commonly the round winner bans a card the loser used.</span></div>
    <div class="term"><b>Element Bans</b><span>An element banned from use for the whole match.</span></div>
    <div class="term"><b>Void / Double Suicide</b><span>Both teams die in a round — the round doesn't count.</span></div>
    <div class="term"><b>Timers</b><span>Set timer (team setup between matches), ban timer (stating a ban after a round), round timer (length of a bracket round, often days).</span></div>
    <div class="term"><b>Code / Ruleset</b><span>The tournament's agreed ruleset.</span></div>
    <div class="term"><b>BiS</b><span>Best in Slot — the best available card for a given comp or talent.</span></div>
  </div>
  <div class="ref-block">
    <h3>Meta Rant (summary)</h3>
    <p>As of this guide's update, Stall dominates the meta — it beats most comps, and with cards being very tanky (Null cards especially), running Burst early is high-risk. Hack is considered broken: it makes strong talents stronger and is surprisingly not banned more often. If you own Atom, abusing Hack is a strong plan.</p>
  </div>
  <div class="ref-block">
    <h3>Match Flow (Yami's guide, summarized)</h3>
    <h4>Talent Bans</h4>
    <p>Banning well matters more than your comps. Recommended mutual bans — strong, hard-to-counter talents: Atmospheric (especially on Masahito), Cursed, Omniscient Hack, Yin Yang, Reversion, Elemental Drain, Overload, Reflector, Restricted Instinct, Transformation. If you don't own a talent's key meta card (e.g. Atom for Hack, Kim Chul / Hercules for Reflector), it's usually correct to mutually ban it.</p>
    <h4>Round 1: don't burst</h4>
    <p>R1 is where players overcommit. Defensive talents are open and bursts get punished. Unless you have a strong read, favor anti-burst comps and learn the opponent's habits. If Drain is open, Elemental Manipulation stall comps counter it well.</p>
    <h4>Middle rounds</h4>
    <p>With several bans down, comps diversify — the best window for Burst comps.</p>
    <h4>Endgame</h4>
    <p>Niche comps come out: Pain for Power, Divine, Reaver, Combo, Surge/Thirst.</p>
  </div>
  <div class="ref-block">
    <h3>Final Note</h3>
    <p>PvP is prediction, adaptation, and a bit of luck. Everyone wins and loses — prioritize enjoying it, including running your own non-meta cards and comps. Results follow experience.</p>
  </div>`;
}

function setView(v){
  state.view=v;
  document.querySelectorAll('.pvp-tab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));
  if(v==='tiers')renderTiers();
  else if(v==='comps')renderComps();
  else if(v==='meta')renderMeta();
  else renderReference();
}

function init(){
  document.getElementById('credit').textContent=PVP.meta.credit||'';
  document.querySelectorAll('.pvp-tab').forEach(t=>t.onclick=()=>setView(t.dataset.view));
  setView('tiers');
}
loadData();