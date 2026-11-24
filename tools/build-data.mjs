/* Build js/data.js from data-src/wiki_en.json + data-src/i18n_th.json.
   Run: node tools/build-data.mjs  (from the project root) */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const root = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const W = JSON.parse(fs.readFileSync(path.join(root, 'data-src/wiki_en.json'), 'utf8'));
const TH = JSON.parse(fs.readFileSync(path.join(root, 'data-src/i18n_th.json'), 'utf8')).data;
const t = (s) => (s == null ? '' : (TH[s] ?? s));

// ---------- helpers ----------
const title = (s) => s.replace(/(^|\s|-)(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

const MON = Object.fromEntries(W.monsters.map((m) => [m.id, m]));
const ITEM = Object.fromEntries(W.items.map((i) => [i.id, i]));
const MAP = Object.fromEntries(W.maps.map((m) => [m.id, m]));
const REGION = Object.fromEntries(W.regions.map((r) => [r.id, r]));
const MAT = Object.fromEntries(W.materials.map((m) => [m.id, m]));
const MAPSRC = Object.fromEntries(W.maps.map((m) => [m.id, m]));
const A = W.atlas;
const JOB = Object.fromEntries(W.jobs.map((j) => [j.id, j]));

// parse "Lv 1–10", "Lv 25–40 · boss Lv 50", "Lv 16–22 · Secret dungeon", "Safe Zone"
function parseLv(txt) {
  if (!txt || txt === 'Safe Zone') return { min: null, max: null, bossLv: null, note: txt || '' };
  const m = txt.match(/Lv\s*(\d+)\s*[–-]\s*(\d+)/);
  const b = txt.match(/boss\s*Lv\s*(\d+)/i);
  return { min: m ? +m[1] : null, max: m ? +m[2] : null, bossLv: b ? +b[1] : null, note: txt };
}

// ---------- weapons ----------
const weapons = W.items
  .filter((i) => i.s === 'weapon' && i.wt)
  .map((i) => ({
    id: i.id, n: t(i.n), wt: i.wt, atk: i.atk ?? 0, el: i.el || 'neutral',
    lv: i.lv ?? 0, r: i.r || 'common', g: i.g ?? null, k: i.k || null,
    d: t(i.d), ab: t(i.ab), wsk: i.wsk || null,
    src: i.src ? { kind: i.src[0], mon: i.src[1] || null, chance: i.src[2] ?? null } : null,
    set: i.set || null,
  }));

// ---------- armor & other items ----------
const armors = W.items
  .filter((i) => i.s && i.s !== 'weapon')
  .map((i) => ({
    id: i.id, n: t(i.n), s: i.s, lv: i.lv ?? 0, r: i.r || 'common', g: i.g ?? null,
    d: t(i.d), ab: t(i.ab), st: i.st || {},
    src: i.src ? { kind: i.src[0], mon: i.src[1] || null, chance: i.src[2] ?? null } : null,
    set: i.set || null,
  }));

// ---------- monsters ----------
const monsters = W.monsters.map((m) => ({
  id: m.id, n: t(m.n), lv: m.lv ?? 0, el: m.el || 'neutral', atkEl: m.atkEl || m.el || 'neutral',
  race: m.race || 'formless', boss: !!m.boss, story: !!m.story,
  maps: m.maps || [], drops: m.drops || [], mats: m.mats || [],
  rune: m.rune || null, hp: m.hp ?? 0, atk: m.atk || [0, 0],
  def: m.def ?? 0, mdef: m.mdef ?? 0, hit: m.hit ?? 0, flee: m.flee ?? 0,
  exp: m.exp ?? 0, jexp: m.jexp ?? 0, st: t(m.st || ''),
}));

// ---------- maps ----------
const maps = W.maps.map((mp) => {
  const p = parseLv(mp.lv);
  const mons = (mp.mons || []).map((id) => {
    const r = mp.mlv && mp.mlv[id];
    const mon = MON[id];
    return { id, n: mon ? t(mon.n) : id, lv: r ? r[0] : (mon ? mon.lv : 0), lvMax: r ? r[1] : (mon ? mon.lv : 0), el: mon ? mon.el : 'neutral' };
  });
  // region: own pin, else inherit from parent map
  let region = (mp.pin && mp.pin[0]) || '';
  if (!region && mp.parent && MAPSRC[mp.parent]) region = (MAPSRC[mp.parent].pin && MAPSRC[mp.parent].pin[0]) || '';
  return {
    id: mp.id, n: t(mp.n), lvText: t(mp.lv || ''), min: p.min, max: p.max, bossLv: p.bossLv,
    kind: mp.kind || 'field', parent: mp.parent || '', secret: !!mp.secret,
    region, regionN: REGION[region] ? t(REGION[region].n) : '',
    zones: (mp.zones || []).map(t), mons,
  };
});

// ---------- sets + where each piece drops ----------
function sourcesOfItem(itemId) {
  const out = [];
  for (const m of W.monsters) {
    const d = (m.drops || []).find((x) => x[0] === itemId);
    if (d) {
      for (const mid of m.maps) {
        const mp = MAP[mid];
        out.push({ item: itemId, mon: m.id, monN: t(m.n), boss: !!m.boss, chance: d[1], map: mid, mapN: mp ? t(mp.n) : mid, region: mp && mp.pin ? t(REGION[mp.pin[0]]?.n || '') : '' });
      }
    }
  }
  return out;
}
const sets = W.sets.map((s) => ({
  id: s.id, n: t(s.n), line: s.line, lv: s.lv ?? 0, g: s.g ?? null,
  b2: t(s.b2), b3: t(s.b3), pas: t(s.pas),
  pcs: s.pcs.map((p) => ({ id: p, n: ITEM[p] ? t(ITEM[p].n) : p })),
  sources: s.pcs.flatMap(sourcesOfItem),
}));

// ---------- jobs ----------
const jobs = W.jobs.map((j) => ({
  id: j.id, n: t(j.n), d: t(j.d), tier: j.tier ?? 0, from: j.from || '',
  maxJob: j.maxJob ?? 10, hp: j.hp ?? 0, sp: j.sp ?? 0,
  wt: j.wt || [],
  lines: (j.lines || []).map((l) => ({ id: l.id, n: t(l.n), el: l.el || '' })),
  sk: (j.sk || []).map((s) => ({ id: s.id, n: t(s.n), max: s.max ?? 10, line: s.line || '', el: s.el || '', type: s.type || '', d: t(s.d), sp: s.sp || '', cd: s.cd || 0, active: !!s.active, icon: s.icon || '' })),
}));

/* real EXP curve (Lv1→2 … Lv98→99) and HP level multiplier from the game data */
const xp = W.s2.xp || null;
const buildHp = (W.s2.build || {}).buildHp || null;

// skill name lookup (across all jobs) for weapon skill bonuses
const skillNames = {};
for (const [id, n] of Object.entries(W.skillNames)) skillNames[id] = { n: t(n) };

// ---------- runes (cards) from monster drops ----------
const runeIds = [...new Set(W.monsters.filter((m) => m.rune).map((m) => m.rune[0]))];
const runes = runeIds.map((id) => {
  const name = t(title(id) + ' Rune') === title(id) + ' Rune' ? (TH[title(id)] ? t(title(id)) + ' รูน' : title(id) + ' Rune') : t(title(id) + ' Rune');
  const droppers = W.monsters.filter((m) => m.rune && m.rune[0] === id).map((m) => ({ mon: m.id, monN: t(m.n), chance: m.rune[1], lv: m.lv, maps: m.maps.map((mid) => ({ id: mid, n: MAP[mid] ? t(MAP[mid].n) : mid, region: MAP[mid] && MAP[mid].pin ? t(REGION[MAP[mid].pin[0]]?.n || '') : '' })) }));
  return { id, n: name, droppers };
});

// ---------- materials ----------
const materials = W.materials.map((m) => ({ id: m.id, n: t(m.n), p: m.p ?? 0, d: t(m.d), rare: !!m.rare, from: m.from ? t(m.from) : '' }));

// ---------- misc ----------
const wtypes = Object.fromEntries(Object.entries(W.wtypes).map(([k, v]) => [k, { n: v, th: t(v) }]));
const elements = Object.fromEntries(Object.entries(W.elements).map(([k, v]) => [k, { n: v, th: t(v) }]));
const regions = W.regions.map((r) => ({ id: r.id, n: t(r.n) }));
const races = Object.fromEntries(Object.entries(W.races || {}).map(([k, v]) => [k, t(v)]));
const rarities = { common: 'ธรรมดา', rare: 'แรร์', epic: 'อีพิค', legend: 'เลเจนด์', fashion: 'แฟชั่น' };
const jobsT = { 0: 'อาชีพเริ่มต้น', 1: 'อาชีพที่ 1', 2: 'อาชีพที่ 2', 3: 'ไฮคลาส' };

// ---------- systems: refine / options / taint / craft ----------
const thOptLabel = (label) => TH[label] || label;
const SUBMAP = {
  str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK',
  ...(Object.fromEntries(Object.entries(W.races || {}).map(([k, v]) => [k, t(v)]))),
  ...(Object.fromEntries(Object.entries(W.elements || {}).map(([k, v]) => [k, t(v)]))),
  ...(Object.fromEntries(Object.entries((W.sys.en2 || {}).inflict || {}).map(([k, v]) => [k, t(v)]))),
  ...(Object.fromEntries(Object.entries((W.sys.en2 || {}).spell || {}).map(([k, v]) => [k, t(v)]))),
  ...(Object.fromEntries(Object.entries((W.sys.en2 || {}).st || {}).map(([k, v]) => [k, t(v[0])]))),
};
const POOL_TH = { W: 'อาวุธ', D: 'ชุดบน-ล่าง', H: 'หมวก', A: 'เครื่องประดับ' };
const smeltGoods = W.s2.smelt ? W.s2.smelt.goods : {};
const opts = Object.entries(W.sys.opts).map(([id, o]) => ({
  id, g: o.g || 'atk',
  label: thOptLabel((W.sys.en2.opt[id] || [id, ''])[0]),
  unit: (W.sys.en2.opt[id] || [id, ''])[1] || '',
  on: (o.on || '').split('').map((c) => POOL_TH[c] || c),
  tiers: o.tiers, cap: o.cap || 0, special: !!o.special, fixed: !!o.fixed,
  subs: (o.subs || []).map((s) => SUBMAP[s] || s),
}));
const traits = Object.entries((W.sys.en2 || {}).trait || {}).map(([id, [n, up, dn]]) => ({ id, n: t(n), up: t(up), dn: t(dn) }));
const REFINE_KIND = {
  metal: { n: 'อาวุธโลหะ · โล่ · เกราะหนัก', item: 'แท่งโลหะ' },
  wood: { n: 'อาวุธไม้ (ดาบไม้/ธนู ฯลฯ)', item: 'แผ่นไม้' },
  crystal: { n: 'ออร์บ · ตะเกียง · เครื่องประดับ', item: 'ผลึกเจียระไน' },
  cloth: { n: 'เกราะผ้า · เกราะหนัง · หมวก', item: 'ผ้า' },
  armour: { n: 'เกราะหนัก (ชุดเซ็ต)', item: 'แผ่นเกราะ' },
};
const refine = {
  rates: W.sys.refine.tab,
  cost: W.sys.refine.cost,
  brk: W.sys.refine.brk,
  kinds: Object.fromEntries(Object.entries(W.s2.refineNeeds).map(([kind, e]) => {
    const rep = REFINE_KIND[kind] || { n: kind, item: kind };
    const steps = (e.steps || []).map((grade) => grade.map((step) => step.map(([mid, q]) => ({ id: mid, mat: MAT[mid] ? t(MAT[mid].n) : (smeltGoods[mid] ? t(smeltGoods[mid].n) : mid), q }))));
    return [kind, { n: rep.n, item: rep.item, grades: steps }];
  })),
};
const smeltList = Object.entries(smeltGoods).map(([id, g]) => ({ id, n: t(g.n), price: g.price, d: t(g.d), from: g.from || '' }));
const craft = W.sys.craft.map((c) => ({
  t: c.t, n: t(c.n),
  list: c.list.filter((x) => x.mats).map((x) => ({
    id: x.id, n: t(x.n), g: x.g ?? null, coins: x.coins ?? 0,
    mats: Object.entries(x.mats).map(([mid, q]) => ({ id: mid, n: MAT[mid] ? t(MAT[mid].n) : (smeltGoods[mid] ? t(smeltGoods[mid].n) : mid), q })),
  })),
}));

const data = {
  meta: { season: W.season, at: W.at, built: new Date().toISOString() },
  wtypes, elements, regions, races, rarities, jobsT,
  jobs, skillNames, weapons, armors, monsters, maps, sets, runes, materials,
  refine, opts, traits, craft, smelt: smeltList,
  prices: { drill: W.sys.drill, stone: W.sys.stone },
  atlas: { items: A.items, skills: A.skills, mats: A.mats, mons: A.mons, jobs: A.jobs, meta: A.meta, hats128: W.hats128 },
  xp, buildHp,
};

const out = 'window.NC_DATA = ' + JSON.stringify(data) + ';';
fs.mkdirSync(path.join(root, 'js'), { recursive: true });
fs.writeFileSync(path.join(root, 'js/data.v48.js'), out);
console.log('written js/data.js', (out.length / 1e6).toFixed(2), 'MB ·', weapons.length, 'weapons ·', monsters.length, 'monsters ·', maps.length, 'maps ·', sets.length, 'sets ·', runes.length, 'runes');
