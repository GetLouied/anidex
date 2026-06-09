/* ==========================================================================
   data.js — shared data layer
   Loads cards / talents / breach from /data and exposes lookups + helpers.
   Future files (rankings.json, effectiveness.json) plug in here.
   ========================================================================== */
window.Anidex = (function () {
  const ELEMENTS = ["Grass","Fire","Electric","Water","Ground","Neutral","Null","Light","Dark"];
  const STATS = ["hp","atk","def","spd"];

  const store = {
    cards: [], talents: {}, breach: null,
    byId: {}, byName: {}
  };

  async function getJSON(path) {
    try {
      const r = await fetch(path);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  // Load whatever this page needs. Pass a list, e.g. ['cards','talents'].
  async function load(which) {
    const jobs = [];
    if (which.includes('cards'))   jobs.push(getJSON('data/cards.json').then(d => { if (Array.isArray(d)) store.cards = d; }));
    if (which.includes('talents')) jobs.push(getJSON('data/talents.json').then(d => { if (d) store.talents = d; }));
    if (which.includes('breach'))  jobs.push(getJSON('data/breach.json').then(d => { if (d) store.breach = d; }));
    // Future: rankings.json, effectiveness.json
    await Promise.all(jobs);
    store.byId = {}; store.byName = {};
    store.cards.forEach(c => { store.byId[c.id] = c; store.byName[c.name] = c; });
    return store;
  }

  function variantDesc(talent, variant) {
    const vs = store.talents[talent];
    if (!vs) return null;
    if (vs.length === 1) return vs[0].desc;
    const m = vs.find(v => v.label === variant);
    return m ? m.desc : vs[0].desc;
  }

  // distinct real variants for a talent (or [] if single "-")
  function talentVariants(talent) {
    const set = new Set();
    store.cards.forEach(c => { if (c.talent === talent) set.add(c.variant); });
    const arr = [...set];
    if (arr.length > 1 || (arr.length === 1 && arr[0] !== "-")) return arr.sort();
    return [];
  }

  return { ELEMENTS, STATS, store, load, getJSON, variantDesc, talentVariants };
})();
