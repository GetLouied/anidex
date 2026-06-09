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
  ranges:{}, sortKey:"total", sortDir:"desc", expanded:new Set()
};
STATS.forEach(s=>state.ranges[s]=[0,200]);
state.ranges.total=[0,800];

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
  sk.value="total";
  sk.onchange=()=>{state.sortKey=sk.value;render()};
  document.getElementById('sortDir').onchange=e=>{state.sortDir=e.target.value;render()};
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
    document.querySelectorAll('.chip.on').forEach(c=>c.classList.remove('on'));
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

function init(){
  buildUI();
  populateVariants();
  applyHashFilters();
  render();
}
loadData();
