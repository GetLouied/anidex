/* ==========================================================================
   compare.js — Card Compare & Team Compare
   ========================================================================== */
let CARDS=[], CARD_BY_ID={}, CARD_BY_NAME={};
const variantDesc = Anidex.variantDesc;
const STATS = ['hp','atk','def','spd'];

async function loadData(){
  await Anidex.load(['cards','talents','effectiveness']);
  CARDS = Anidex.store.cards;
  CARD_BY_ID = Anidex.store.byId;
  CARD_BY_NAME = Anidex.store.byName;
  init();
}

let mode='card';
// selected card ids per slot. card mode: up to 3. team mode: A[0..2], B[0..2]
const sel = { card:[null,null,null], teamA:[null,null,null], teamB:[null,null,null] };

/* ---------- reusable card picker ---------- */
// Renders a search box + dropdown; onPick(cardId) when chosen. Shows current card.
function pickerHTML(slotKey, idx, currentId){
  const c = currentId?CARD_BY_ID[currentId]:null;
  const filled = c ? `
    <div class="picker-card" data-clear="${slotKey}:${idx}">
      <span class="pc-name">${c.name}</span>
      <span class="pc-el el-${c.element}">${c.element}</span>
      <span class="pc-x">×</span>
    </div>` : '';
  return `
    <div class="picker" data-slot="${slotKey}" data-idx="${idx}">
      ${filled || `<div class="picker-empty">
        <input class="picker-input" placeholder="Search card ${idx+1}…" autocomplete="off">
        <div class="picker-results"></div>
      </div>`}
    </div>`;
}

function bindPickers(root){
  root.querySelectorAll('.picker').forEach(p=>{
    const slotKey=p.dataset.slot, idx=+p.dataset.idx;
    const input=p.querySelector('.picker-input');
    if(input){
      const results=p.querySelector('.picker-results');
      input.oninput=()=>{
        const q=input.value.toLowerCase().trim();
        results.innerHTML='';
        if(q.length<2){results.classList.remove('show');return}
        const taken=new Set(sel[slotKey].filter(Boolean));
        const matches=CARDS.filter(c=>c.name.toLowerCase().includes(q)&&!taken.has(c.id)).slice(0,8);
        if(!matches.length){results.classList.remove('show');return}
        results.classList.add('show');
        matches.forEach(c=>{
          const d=document.createElement('div');d.className='picker-opt';
          d.innerHTML=`<span>${c.name}</span><span class="po-el el-${c.element}">${c.element.slice(0,3)}</span>`;
          d.onclick=()=>{sel[slotKey][idx]=c.id;renderMode()};
          results.appendChild(d);
        });
      };
    }
    const clear=p.querySelector('[data-clear]');
    if(clear){
      clear.onclick=()=>{sel[slotKey][idx]=null;renderMode()};
    }
  });
}

/* ---------- CARD COMPARE ---------- */
function renderCardCompare(){
  const m=document.getElementById('main');
  const ids=sel.card;
  const chosen=ids.map(id=>id?CARD_BY_ID[id]:null);
  let h='<div class="section-intro">Pick 2–3 cards to compare stats, element, and talent side by side. Best value in each stat row is highlighted.</div>';

  // pickers row
  h+='<div class="picker-row">';
  for(let i=0;i<3;i++) h+=`<div class="picker-slot">${pickerHTML('card',i,ids[i])}</div>`;
  h+='</div>';

  const active=chosen.filter(Boolean);
  if(active.length>=2){
    // compute per-stat max among chosen
    const maxOf={};
    [...STATS,'total'].forEach(k=>maxOf[k]=Math.max(...active.map(c=>c[k])));
    const cols=chosen.map(c=>c?`<th>${c.name}</th>`:'<th class="empty-col">—</th>').join('');
    const statRow=(label,key)=>{
      const cells=chosen.map(c=>{
        if(!c)return '<td class="empty-col">—</td>';
        const isMax=c[key]===maxOf[key]&&active.length>1;
        return `<td class="${isMax?'stat-max':''}">${c[key]}</td>`;
      }).join('');
      return `<tr><th class="rowlab">${label}</th>${cells}</tr>`;
    };
    const elRow=`<tr><th class="rowlab">Element</th>${chosen.map(c=>c?`<td><span class="el-tag el-${c.element}">${c.element}</span></td>`:'<td class="empty-col">—</td>').join('')}</tr>`;
    const talRow=`<tr><th class="rowlab">Talent</th>${chosen.map(c=>c?`<td class="tal">${c.talent}${c.variant&&c.variant!=='-'?' · '+c.variant:''}</td>`:'<td class="empty-col">—</td>').join('')}</tr>`;
    const serRow=`<tr><th class="rowlab">Series</th>${chosen.map(c=>c?`<td class="ser">${c.series||'—'}</td>`:'<td class="empty-col">—</td>').join('')}</tr>`;
    const descRow=`<tr><th class="rowlab">Talent Effect</th>${chosen.map(c=>{
      if(!c)return '<td class="empty-col">—</td>';
      const d=variantDesc(c.talent,c.variant)||'(no description)';
      return `<td class="desc">${d}</td>`;
    }).join('')}</tr>`;

    h+=`<div class="cmp-table-wrap"><table class="cmp-table">
      <thead><tr><th class="rowlab"></th>${cols}</tr></thead>
      <tbody>
        ${elRow}
        ${statRow('HP','hp')}
        ${statRow('ATK','atk')}
        ${statRow('DEF','def')}
        ${statRow('SPD','spd')}
        ${statRow('TOTAL','total')}
        ${talRow}
        ${serRow}
        ${descRow}
      </tbody></table></div>`;
  } else {
    h+='<div class="cmp-hint">Select at least 2 cards to compare.</div>';
  }
  m.innerHTML=h;
  bindPickers(m);
}

/* ---------- TEAM COMPARE ---------- */
function teamTotals(ids){
  const t={hp:0,atk:0,def:0,spd:0,total:0};
  ids.filter(Boolean).forEach(id=>{const c=CARD_BY_ID[id];STATS.forEach(k=>t[k]+=c[k]);t.total+=c.total});
  return t;
}
// average element multiplier of teamA attacking teamB
function teamEff(idsA, idsB){
  const A=idsA.filter(Boolean).map(id=>CARD_BY_ID[id]);
  const B=idsB.filter(Boolean).map(id=>CARD_BY_ID[id]);
  if(!A.length||!B.length)return null;
  let sum=0,n=0,fav=0,unfav=0,neu=0;
  A.forEach(a=>B.forEach(b=>{
    const m=Anidex.effMultiplier(a.element,b.element);
    sum+=m;n++;
    if(m>1.0001)fav++; else if(m<0.9999)unfav++; else neu++;
  }));
  return {avg:sum/n, fav, unfav, neu, n};
}

function renderTeamCompare(){
  const m=document.getElementById('main');
  let h='<div class="section-intro">Pick your 3 cards and your opponent\'s 3 cards. See stat totals, the difference on each stat, and an element-matchup estimate. The advantage figure is an average of element multipliers across all pairings — a guide, not an exact in-game value.</div>';

  h+='<div class="team-cols">';
  [['teamA','Your Team'],['teamB','Opponent']].forEach(([key,label])=>{
    h+=`<div class="team-col"><div class="team-title team-${key}">${label}</div>`;
    for(let i=0;i<3;i++) h+=pickerHTML(key,i,sel[key][i]);
    h+='</div>';
  });
  h+='</div>';

  const A=sel.teamA, B=sel.teamB;
  const aFilled=A.filter(Boolean).length, bFilled=B.filter(Boolean).length;
  if(aFilled>=1&&bFilled>=1){
    const tA=teamTotals(A), tB=teamTotals(B);
    const statRow=(label,key)=>{
      const a=tA[key], b=tB[key], diff=a-b;
      const aLead=diff>0, bLead=diff<0;
      const diffTxt=(diff>0?'+':'')+diff;
      return `<tr>
        <td class="t-a ${aLead?'lead':''}">${a}</td>
        <th class="t-lab">${label}</th>
        <td class="t-b ${bLead?'lead':''}">${b}</td>
        <td class="t-diff ${aLead?'a-diff':bLead?'b-diff':''}">${diff===0?'—':diffTxt}</td>
      </tr>`;
    };
    h+=`<div class="team-stats-wrap"><table class="team-stats">
      <thead><tr><th>Your Team</th><th class="t-lab">Stat</th><th>Opponent</th><th class="t-diff">Diff (You−Opp)</th></tr></thead>
      <tbody>
        ${statRow('HP','hp')}
        ${statRow('ATK','atk')}
        ${statRow('DEF','def')}
        ${statRow('SPD','spd')}
        ${statRow('TOTAL','total')}
      </tbody></table></div>`;

    // effectiveness
    const eA=teamEff(A,B), eB=teamEff(B,A);
    if(eA&&eB){
      const fmt=e=>{
        const label=e.avg>1.0001?'favorable':e.avg<0.9999?'unfavorable':'neutral';
        const cls=e.avg>1.0001?'fav':e.avg<0.9999?'unfav':'neu';
        return {label,cls,avg:e.avg.toFixed(2),fav:e.fav,unfav:e.unfav,neu:e.neu,n:e.n};
      };
      const a=fmt(eA), b=fmt(eB);
      h+=`<div class="eff-wrap">
        <div class="eff-title">Element Matchup (estimate)</div>
        <div class="eff-cards">
          <div class="eff-card eff-${a.cls}">
            <div class="eff-side">Your elements vs opponent</div>
            <div class="eff-num">${a.avg}×</div>
            <div class="eff-tag">${a.label}</div>
            <div class="eff-breakdown">${a.fav} favorable · ${a.unfav} weak · ${a.neu} neutral <span class="eff-n">(${a.n} pairings)</span></div>
          </div>
          <div class="eff-card eff-${b.cls}">
            <div class="eff-side">Opponent's elements vs you</div>
            <div class="eff-num">${b.avg}×</div>
            <div class="eff-tag">${b.label}</div>
            <div class="eff-breakdown">${b.fav} favorable · ${b.unfav} weak · ${b.neu} neutral <span class="eff-n">(${b.n} pairings)</span></div>
          </div>
        </div>
        <div class="eff-note">Average of element multipliers across every attacker→defender pairing. Above 1.00× means your elements tend to hit harder; below means softer. A rough guide — actual battles also depend on talents, stats, turn order, and luck.</div>
      </div>`;
    }
  } else {
    h+='<div class="cmp-hint">Add at least one card to each team to compare.</div>';
  }
  m.innerHTML=h;
  bindPickers(m);
}

function renderMode(){
  if(mode==='card')renderCardCompare();
  else renderTeamCompare();
}

function init(){
  document.querySelectorAll('.cmp-tab').forEach(t=>{
    t.onclick=()=>{
      mode=t.dataset.mode;
      document.querySelectorAll('.cmp-tab').forEach(x=>x.classList.toggle('active',x===t));
      renderMode();
    };
  });
  renderMode();
}
loadData();
