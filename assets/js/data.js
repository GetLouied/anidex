/* ==========================================================================
   data.js — shared data layer
   Loads cards / talents / breach from /data and exposes lookups + helpers.
   Future files (rankings.json, effectiveness.json) plug in here.
   ========================================================================== */
window.Anidex = (function () {
  const ELEMENTS = ["Grass","Fire","Electric","Water","Ground","Neutral","Null","Light","Dark"];
  const STATS = ["hp","atk","def","spd"];

  const store = {
    cards: [], talents: {}, breach: null, pvp: null,
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
    if (which.includes('pvp'))     jobs.push(getJSON('data/pvp.json').then(d => { if (d) store.pvp = d; }));
    // NOTE: breach is no longer loaded here in plaintext. Use loadBreachEncrypted(passphrase).
    // Future: rankings.json, effectiveness.json
    await Promise.all(jobs);
    store.byId = {}; store.byName = {};
    store.cards.forEach(c => { store.byId[c.id] = c; store.byName[c.name] = c; });
    return store;
  }

  // --- encrypted breach support ---
  const b64dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function decryptBlob(blob, passphrase) {
    const salt = b64dec(blob.salt), iv = b64dec(blob.iv), data = b64dec(blob.data);
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), {name:'PBKDF2'}, false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      {name:'PBKDF2', salt, iterations:250000, hash:'SHA-256'},
      base, {name:'AES-GCM', length:256}, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, data);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  // Returns true on success (store.breach populated), false on wrong passphrase.
  async function loadBreachEncrypted(passphrase) {
    const blob = await getJSON('data/breach.enc.json');
    if (!blob) throw new Error('encrypted breach file not found');
    try {
      store.breach = await decryptBlob(blob, passphrase);
      return true;
    } catch (e) {
      return false; // wrong passphrase (AES-GCM auth fails) or corrupt data
    }
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

  return { ELEMENTS, STATS, store, load, getJSON, variantDesc, talentVariants, loadBreachEncrypted };
})();
