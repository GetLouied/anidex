const ELEMENTS = Anidex.ELEMENTS, STATS = Anidex.STATS;
let CARDS = [], TALENTS = {};

async function loadData(){
  await Anidex.load(['cards','talents']);
  CARDS = Anidex.store.cards;
  TALENTS = Anidex.store.talents;
  init();
}




const state = {
  search:"", elements:new Set(), talent:"", variant:"",
  ranges:{}, sortKey:"id", sortDir:"asc", expanded:new Set(),
  // PvP mode
  pvp:false,
  banElements:new Set(), banTalents:new Set(), banCards:new Set(), // banCards holds card IDs
  banStatFloor:null, banStatCeiling:null
};
STATS.forEach(s=>state.ranges[s]=[0,200]);
state.ranges.total=[0,800];

// ---- PvP ban persistence (session only) ----
function saveBans(){
  try{
    sessionStorage.setItem('pvpBans', JSON.stringify({
      pvp:state.pvp,
      el:[...state.banElements], tal:[...state.banTalents], card:[...state.banCards],
      floor:state.banStatFloor, ceil:state.banStatCeiling
    }));
  }catch(e){}
}
function loadBans(){
  try{
    const raw=sessionStorage.getItem('pvpBans'); if(!raw)return;
    const b=JSON.parse(raw);
    state.pvp=!!b.pvp;
    state.banElements=new Set(b.el||[]);
    state.banTalents=new Set(b.tal||[]);
    state.banCards=new Set(b.card||[]);
    state.banStatFloor=(b.floor===0||b.floor)?b.floor:null;
    state.banStatCeiling=(b.ceil===0||b.ceil)?b.ceil:null;
  }catch(e){}
}

function statBounds(){
  const b={};
  [...STATS,"total"].forEach(k=>{
    let mn=Infinity,mx=-Infinity;
    CARDS.forEach(c=>{mn=Math.min(mn,c[k]);mx=Math.max(mx,c[k])});
    b[k]=[mn,mx];
  });
  return b;
}

function buildUI(){
  // element chips
  const ec=document.getElementById('elementChips');
  ec.innerHTML='';
  ELEMENTS.forEach(e=>{
    const c=document.createElement('div');
    c.className='chip';c.dataset.el=e;c.textContent=e;
    c.onclick=()=>{state.elements.has(e)?state.elements.delete(e):state.elements.add(e);c.classList.toggle('on');render()};
    ec.appendChild(c);
  });
  // talent select
  const ts=document.getElementById('talentSelect');
  Object.keys(TALENTS).sort().forEach(t=>{
    const o=document.createElement('option');o.value=t;o.textContent=t;ts.appendChild(o);
  });
  ts.onchange=()=>{state.talent=ts.value;state.variant="";populateVariants();render()};
  // sort key
  const sk=document.getElementById('sortKey');
  [["total","TOTAL"],["hp","HP"],["atk","ATK"],["def","DEF"],["spd","SPD"],["name","Name"],["id","ID"],["element","Element"]].forEach(([v,l])=>{
    const o=document.createElement('option');o.value=v;o.textContent=l;sk.appendChild(o);
  });
  sk.value="id";
  sk.onchange=()=>{state.sortKey=sk.value;render()};
  document.getElementById('sortDir').onchange=e=>{state.sortDir=e.target.value;render()};
  document.getElementById('sortDir').value=state.sortDir;
  // sliders
  const b=statBounds();
  const sl=document.getElementById('sliders');sl.innerHTML='';
  [...STATS,"total"].forEach(k=>{
    const [mn,mx]=b[k];
    state.ranges[k]=[mn,mx];
    const g=document.createElement('div');g.className='slider-group';
    g.innerHTML=`<label>${k.toUpperCase()} <span id="lab-${k}">${mn}–${mx}</span></label>
      <div class="dual" data-k="${k}">
        <div class="track"></div><div class="track-fill" id="fill-${k}"></div>
        <input type="range" min="${mn}" max="${mx}" value="${mn}" data-lo>
        <input type="range" min="${mn}" max="${mx}" value="${mx}" data-hi>
      </div>`;
    sl.appendChild(g);
    const lo=g.querySelector('[data-lo]'),hi=g.querySelector('[data-hi]');
    const upd=()=>{
      let l=+lo.value,h=+hi.value;
      if(l>h){[l,h]=[h,l]}
      state.ranges[k]=[Math.min(+lo.value,+hi.value),Math.max(+lo.value,+hi.value)];
      document.getElementById('lab-'+k).textContent=state.ranges[k][0]+'–'+state.ranges[k][1];
      const fill=document.getElementById('fill-'+k);
      const span=mx-mn||1;
      fill.style.left=((state.ranges[k][0]-mn)/span*100)+'%';
      fill.style.right=(100-(state.ranges[k][1]-mn)/span*100)+'%';
      render();
    };
    lo.oninput=upd;hi.oninput=upd;upd();
  });
  // search
  document.getElementById('search').oninput=e=>{state.search=e.target.value.toLowerCase();render()};
  // reset
  document.getElementById('resetBtn').onclick=()=>{
    state.search="";state.elements.clear();state.talent="";state.variant="";state.expanded.clear();
    document.getElementById('search').value="";
    document.getElementById('talentSelect').value="";
    populateVariants();
    document.querySelectorAll('#elementChips .chip.on').forEach(c=>c.classList.remove('on'));
    buildSliders();render();
  };
  // header
  const hr=document.getElementById('headRow');
  [["id","ID","num"],["name","Name",""],["element","Element",""],["hp","HP","num"],["atk","ATK","num"],["def","DEF","num"],["spd","SPD","num"],["total","TOTAL","num"],["talent","Talent",""],["series","Series",""]].forEach(([k,l,cl])=>{
    const th=document.createElement('th');th.textContent=l;if(cl)th.className=cl;
    th.dataset.k=k;
    th.onclick=()=>{
      if(state.sortKey===k){state.sortDir=state.sortDir==="asc"?"desc":"asc"}
      else{state.sortKey=k;state.sortDir=(k==="name"||k==="series"||k==="element")?"asc":"desc"}
      document.getElementById('sortKey').value=["total","hp","atk","def","spd","name","id","element"].includes(k)?k:"total";
      document.getElementById('sortDir').value=state.sortDir;
      render();
    };
    th.innerHTML+='<span class="arr">▾</span>';
    hr.appendChild(th);
  });
}
function buildSliders(){
  const b=statBounds();
  [...STATS,"total"].forEach(k=>{
    const [mn,mx]=b[k];state.ranges[k]=[mn,mx];
    const g=document.querySelector(`.dual[data-k="${k}"]`);if(!g)return;
    g.querySelector('[data-lo]').value=mn;g.querySelector('[data-hi]').value=mx;
    document.getElementById('lab-'+k).textContent=mn+'–'+mx;
    document.getElementById('fill-'+k).style.left='0%';
    document.getElementById('fill-'+k).style.right='0%';
  });
}

const talentVariants = Anidex.talentVariants;
function populateVariants(){
  const vs=document.getElementById('variantSelect');
  const opts=state.talent?talentVariants(state.talent):[];
  if(!opts.length){vs.style.display='none';vs.innerHTML='<option value="">All variants</option>';return}
  vs.style.display='block';
  vs.innerHTML='<option value="">All variants</option>'+opts.map(v=>`<option value="${v}">${v}</option>`).join('');
  vs.value=state.variant||"";
  vs.onchange=()=>{state.variant=vs.value;render()};
}
const variantDesc = Anidex.variantDesc;

function filtered(){
  return CARDS.filter(c=>{
    if(state.search){
      const s=state.search;
      if(!(c.name.toLowerCase().includes(s)||(c.series||"").toLowerCase().includes(s)))return false;
    }
    if(state.elements.size&&!state.elements.has(c.element))return false;
    if(state.talent&&c.talent!==state.talent)return false;
    if(state.variant&&c.variant!==state.variant)return false;
    for(const k of [...STATS,"total"]){
      const [lo,hi]=state.ranges[k];
      if(c[k]<lo||c[k]>hi)return false;
    }
    // ---- PvP bans (exclusion) ----
    if(state.pvp){
      if(state.banElements.has(c.element))return false;
      if(state.banTalents.has(c.talent))return false;
      if(state.banCards.has(c.id))return false;
      // stat-ban: ban if ANY of the 4 stats (not TOTAL) is <= floor or >= ceiling
      const f=state.banStatFloor, ce=state.banStatCeiling;
      if(f!==null||ce!==null){
        for(const k of STATS){
          if(f!==null && c[k]<=f)return false;
          if(ce!==null && c[k]>=ce)return false;
        }
      }
    }
    return true;
  });
}

function render(){
  let rows=filtered();
  const k=state.sortKey,dir=state.sortDir==="asc"?1:-1;
  rows.sort((a,b)=>{
    let va=a[k],vb=b[k];
    if(typeof va==="string"){return va.localeCompare(vb)*dir}
    return (va-vb)*dir;
  });
  // header arrows
  document.querySelectorAll('thead th').forEach(th=>{
    th.classList.toggle('sorted',th.dataset.k===k);
    const arr=th.querySelector('.arr');if(arr)arr.textContent=state.sortDir==="asc"?"▴":"▾";
  });
  const tb=document.getElementById('tbody');
  tb.innerHTML='';
  if(!rows.length){
    tb.innerHTML='<tr><td colspan="10"><div class="empty">No cards match these filters.</div></td></tr>';
  }else{
    const maxTotal=Math.max(...rows.map(r=>r.total));
    const frag=document.createDocumentFragment();
    rows.forEach(c=>{
      const tr=document.createElement('tr');
      const vpill=c.variant&&c.variant!=="-"?`<span class="variant-pill">${c.variant}</span>`:'';
      tr.innerHTML=`<td class="num cid">${c.id}</td>
        <td><span class="cname">${c.name}</span></td>
        <td><span class="el-tag el-${c.element}">${c.element}</span></td>
        <td class="num">${c.hp}</td><td class="num">${c.atk}</td>
        <td class="num">${c.def}</td><td class="num">${c.spd}</td>
        <td class="num"><span class="tot">${c.total}</span></td>
        <td class="talent-cell">${c.talent}${vpill}</td>
        <td class="series-cell" title="${c.series||''}">${c.series||''}</td>`;
      tr.onclick=()=>{
        if(state.expanded.has(c.id))state.expanded.delete(c.id);else state.expanded.add(c.id);
        render();
      };
      frag.appendChild(tr);
      if(state.expanded.has(c.id)){
        const er=document.createElement('tr');er.className='expand-row';
        const desc=variantDesc(c.talent,c.variant)||'(no description on file)';
        er.innerHTML=`<td colspan="10"><div class="expand-inner">
          <div class="talent-name">${c.talent}${c.variant&&c.variant!=="-"?' · '+c.variant:''}</div>
          <div class="desc">${desc}</div>
          <div class="meta"><span><b>ID</b> ${c.id}</span><span><b>Series</b> ${c.series||'—'}</span>
          <span><b>HP</b> ${c.hp}</span><span><b>ATK</b> ${c.atk}</span><span><b>DEF</b> ${c.def}</span>
          <span><b>SPD</b> ${c.spd}</span><span><b>TOTAL</b> ${c.total}</span></div>
        </div></td>`;
        frag.appendChild(er);
      }
    });
    tb.appendChild(frag);
  }
  document.getElementById('countBadge').textContent=rows.length+' / '+CARDS.length;
  const af=[];
  if(state.elements.size)af.push(state.elements.size+' element'+(state.elements.size>1?'s':''));
  if(state.talent)af.push('talent: '+state.talent+(state.variant?' ['+state.variant+']':''));
  if(state.search)af.push('search active');
  document.getElementById('activeFilters').textContent=af.length?'// '+af.join('  ·  '):'// showing all cards';
}

function applyHashFilters(){
  const h=location.hash.replace(/^#/,'');
  if(!h)return;
  const params={};
  h.split('&').forEach(kv=>{const[k,v]=kv.split('=');if(k)params[k]=decodeURIComponent(v||'')});
  if(params.talent){
    const ts=document.getElementById('talentSelect');
    if([...ts.options].some(o=>o.value===params.talent)){
      ts.value=params.talent;state.talent=params.talent;state.variant="";populateVariants();
      if(params.variant){
        const vs=document.getElementById('variantSelect');
        if([...vs.options].some(o=>o.value===params.variant)){vs.value=params.variant;state.variant=params.variant}
      }
    }
  }
  if(params.element){
    const els=params.element.split(',');
    els.forEach(e=>{state.elements.add(e);const chip=document.querySelector(`.chip[data-el="${e}"]`);if(chip)chip.classList.add('on')});
  }
}

function buildBanUI(){
  // PvP toggle
  const toggle=document.getElementById('pvpToggle');
  toggle.checked=state.pvp;
  document.getElementById('banPanel').classList.toggle('hidden',!state.pvp);
  toggle.onchange=()=>{
    state.pvp=toggle.checked;
    document.getElementById('banPanel').classList.toggle('hidden',!state.pvp);
    saveBans();render();
  };

  // Ban elements chips
  const bec=document.getElementById('banElementChips');
  bec.innerHTML='';
  ELEMENTS.forEach(e=>{
    const c=document.createElement('div');
    c.className='chip ban-chip'+(state.banElements.has(e)?' on':'');
    c.dataset.el=e;c.textContent=e;
    c.onclick=()=>{
      state.banElements.has(e)?state.banElements.delete(e):state.banElements.add(e);
      c.classList.toggle('on');saveBans();render();renderBanSummary();
    };
    bec.appendChild(c);
  });

  // Ban talents dropdown -> tags
  const bts=document.getElementById('banTalentSelect');
  bts.innerHTML='<option value="">Add a talent to ban…</option>';
  Object.keys(TALENTS).sort().forEach(t=>{
    const o=document.createElement('option');o.value=t;o.textContent=t;bts.appendChild(o);
  });
  bts.onchange=()=>{
    if(bts.value){state.banTalents.add(bts.value);bts.value="";saveBans();render();renderBanTalentTags();renderBanSummary()}
  };
  renderBanTalentTags();

  // Ban specific cards: search -> results -> tags
  const bcs=document.getElementById('banCardSearch');
  bcs.oninput=()=>{
    const q=bcs.value.toLowerCase().trim();
    const res=document.getElementById('banCardResults');
    res.innerHTML='';
    if(q.length<2){res.classList.remove('show');return}
    const matches=CARDS.filter(c=>c.name.toLowerCase().includes(q)&&!state.banCards.has(c.id)).slice(0,8);
    if(!matches.length){res.classList.remove('show');return}
    res.classList.add('show');
    matches.forEach(c=>{
      const d=document.createElement('div');d.className='ban-card-opt';
      d.innerHTML=`<span>${c.name}</span><span class="cid">#${c.id}</span>`;
      d.onclick=()=>{state.banCards.add(c.id);bcs.value="";res.classList.remove('show');res.innerHTML='';saveBans();render();renderBanCardTags();renderBanSummary()};
      res.appendChild(d);
    });
  };
  renderBanCardTags();

  // Stat ban floor/ceiling
  const fl=document.getElementById('banFloor'), ce=document.getElementById('banCeiling');
  fl.value=state.banStatFloor??''; ce.value=state.banStatCeiling??'';
  const updStat=()=>{
    state.banStatFloor = fl.value===''?null:Number(fl.value);
    state.banStatCeiling = ce.value===''?null:Number(ce.value);
    saveBans();render();renderBanSummary();
  };
  fl.oninput=updStat; ce.oninput=updStat;

  // Clear all bans
  document.getElementById('clearBansBtn').onclick=()=>{
    state.banElements.clear();state.banTalents.clear();state.banCards.clear();
    state.banStatFloor=null;state.banStatCeiling=null;
    fl.value='';ce.value='';
    document.querySelectorAll('.ban-chip.on').forEach(c=>c.classList.remove('on'));
    saveBans();render();renderBanTalentTags();renderBanCardTags();renderBanSummary();
  };

  renderBanSummary();
}

function renderBanTalentTags(){
  const wrap=document.getElementById('banTalentTags');
  wrap.innerHTML='';
  [...state.banTalents].sort().forEach(t=>{
    const tag=document.createElement('span');tag.className='ban-tag';
    tag.innerHTML=`${t}<span class="x">×</span>`;
    tag.querySelector('.x').onclick=()=>{state.banTalents.delete(t);saveBans();render();renderBanTalentTags();renderBanSummary()};
    wrap.appendChild(tag);
  });
}
function renderBanCardTags(){
  const wrap=document.getElementById('banCardTags');
  wrap.innerHTML='';
  [...state.banCards].forEach(id=>{
    const card=CARDS.find(c=>c.id===id);if(!card)return;
    const tag=document.createElement('span');tag.className='ban-tag';
    tag.innerHTML=`${card.name}<span class="x">×</span>`;
    tag.querySelector('.x').onclick=()=>{state.banCards.delete(id);saveBans();render();renderBanCardTags();renderBanSummary()};
    wrap.appendChild(tag);
  });
}
function renderBanSummary(){
  const parts=[];
  if(state.banElements.size)parts.push(state.banElements.size+' element'+(state.banElements.size>1?'s':''));
  if(state.banTalents.size)parts.push(state.banTalents.size+' talent'+(state.banTalents.size>1?'s':''));
  if(state.banCards.size)parts.push(state.banCards.size+' card'+(state.banCards.size>1?'s':''));
  if(state.banStatFloor!==null)parts.push('≤'+state.banStatFloor);
  if(state.banStatCeiling!==null)parts.push('≥'+state.banStatCeiling);
  document.getElementById('banSummary').textContent=parts.length?'// banning: '+parts.join(', '):'// no bans set';
}

function init(){
  loadBans();
  buildUI();
  populateVariants();
  buildBanUI();
  applyHashFilters();
  render();
}
loadData();