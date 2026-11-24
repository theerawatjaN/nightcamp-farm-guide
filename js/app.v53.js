/* แคมป์ไกด์ — Night Camp farm guide (data: js/data.js, built from the official wiki) */
'use strict';
const D = window.NC_DATA;

/* ---------- real game icons (sprite atlas from the wiki) ---------- */
const AI_IDX = {};
for (const k of ['items', 'skills', 'mats', 'mons', 'jobs']) AI_IDX[k] = Object.fromEntries(D.atlas[k].map((id, i) => [id, i]));
function aiHtml(kind, id, size = 40, cls = '') {
  const i = AI_IDX[kind] && AI_IDX[kind][id];
  if (i == null) return '';
  const m = D.atlas.meta[kind], k2 = size / m.cell;
  const x = (i % m.cols) * m.cell * k2, y = Math.floor(i / m.cols) * m.cell * k2;
  const rows = Math.ceil(m.n / m.cols);
  return `<i class="ai ${cls}" style="width:${size}px;height:${size}px;background:url(assets/data/wiki_${kind}.webp) -${x}px -${y}px/${m.cols * m.cell * k2}px ${rows * m.cell * k2}px no-repeat"></i>`;
}

/* ---------- tiny helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (c) => c == null ? '–' : (c < 0.01 ? (c * 100).toFixed(3) : (c * 100).toFixed(c * 100 < 10 ? 2 : 1)) + '%';
const JOB = Object.fromEntries(D.jobs.map((j) => [j.id, j]));
const MON = Object.fromEntries(D.monsters.map((m) => [m.id, m]));
const MAP = Object.fromEntries(D.maps.map((m) => [m.id, m]));
const WT = (id) => (D.wtypes[id] ? D.wtypes[id].th : id);
const EL = { th: (id) => (D.elements[id] ? D.elements[id].th : id), col: (id) => getComputedStyle(document.documentElement).getPropertyValue('--el-' + id) || '#90a4ae' };
const ELICON = { fire: '🔥', water: '💧', earth: '🪨', wind: '🍃', holy: '✨', shadow: '🌑', ghost: '👻', undead: '💀', poison: '☠️', neutral: '⚔️' };
const elTag = (el) => `<span class="tag el" style="background:${EL.col(el)}">${ELICON[el] || ''} ${esc(EL.th(el))}</span>`;
const rTag = (r) => `<span class="tag r-${r}">${D.rarities[r] || r}</span>`;
const kTag = (k) => k ? `<span class="tag k-${k}">${k}</span>` : '';
const WTICON = { sword: '🗡️', gsword: '⚔️', spear: '🔱', lance: '🔱', axe: '🪓', gaxe: '🪓', hammer: '🔨', mace: '🔨', dagger: '🔪', katar: '🥊', bow: '🏹', xbow: '🎯', staff: '🪄', orb: '🔮', lantern: '🏮', book: '📖', knuckle: '🥊', qstaff: '🥍', huuma: '✳️', dsword: '⚔️', bell: '🔔', instrument: '🎻', whip: '🪢', pistol: '🔫', shotgun: '🔫', scythe: '🌾', sickle: '🌾', puppet: '🎎', wire: '🧵', torch: '🔥' };

/* element advantage (มาตรฐานแนว RO — ใช้เป็นแนวทาง) */
const EFF = { water: { fire: 1.5 }, fire: { earth: 1.5 }, earth: { wind: 1.5 }, wind: { water: 1.5 }, holy: { undead: 1.5, shadow: 1.25 }, shadow: { holy: 1.25 }, ghost: { ghost: 1.5 }, undead: { holy: 0.75, fire: 0.75 } };
function eff(atk, def) { return (EFF[atk] && EFF[atk][def]) || (EFF[def] && EFF[def][atk] ? (EFF[def][atk] > 1 ? 0.75 : 1) : 1); }
function effBadge(atk, def) {
  const e = eff(atk, def);
  if (e > 1.2) return ['ok', 'ได้เปรียบ ×' + e];
  if (e < 0.85) return ['bad', 'เสียเปรียบ ×' + e];
  return ['mid', 'ปกติ'];
}

/* job lineage */
function pathOf(j) { const p = []; for (let x = j; x; x = JOB[x.from]) p.unshift(x); return p; }
function wtsOf(j) { for (let x = j; x; x = JOB[x.from]) if (x.wt && x.wt.length) return x.wt; return []; }
const jobLine = { hv: ['knight', 'paladin', 'dragonknight', 'dawnwarden', 'dragonbound', 'swordmaster', 'starblade', 'berserker', 'bloodmoon'], mg: ['mage', 'archmage', 'warlock', 'firemage', 'icemage', 'astral', 'starcore', 'winterlord', 'hexlord', 'priest', 'bishop', 'starsaint', 'lightkeeper', 'beacon'], lt: ['rogue', 'assassin', 'shinobi', 'reaper', 'puppeteer', 'eclipse', 'shadowlord', 'harvester', 'showmaster', 'monk', 'meteorfist', 'wisp', 'starshepherd'], rg: ['archer', 'ranger', 'wolfhunter', 'bard', 'gunslinger', 'moonsniper', 'packalpha', 'maestro', 'outlaw'] };
function setLineOf(jobId) { for (const [l, ids] of Object.entries(jobLine)) if (ids.includes(jobId)) return l; return ''; }
const LINE_TH = { hv: 'เกราะหนัก', lt: 'เกราะหนัง (แสง)', mg: 'เกราะผ้า (เวท)', rg: 'เรนเจอร์' };

/* drop source text for an item src {kind,mon,chance} */
function srcHtml(src) {
  if (!src) return '<span class="drop"><small>แหล่งดรอป: ยังไม่ระบุ</small></span>';
  if (src.kind === 'g') return '<span class="drop"><small>🎁 กาชา / ร้าน</small></span>';
  const mon = MON[src.mon]; if (!mon) return '<span class="drop"><small>ยังไม่ระบุ</small></span>';
  const maps = mon.maps.map((mid) => MAP[mid]).filter(Boolean);
  return `<span class="drop">🎮 <b>${esc(mon.n)}</b>${mon.boss ? ' 👑บอส' : ''} (Lv ${mon.lv}) · ${pct(src.chance)}<br><span class="dropmap">📍 ${maps.map((m) => esc(m.n) + ' · ' + esc(m.regionN)).join(' / ')}</span></span>`;
}

/* ---------- router ---------- */
const pages = ['build', 'guide', 'db', 'forge', 'plan'];
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; showPage(b.dataset.page); });
function showPage(p) {
  pages.forEach((x) => { $('#page-' + x).classList.toggle('on', x === p); });
  $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.page === p));
  location.hash = p;
}
$('#topMeta').textContent = 'ข้อมูล: SS2 · v0.4';

/* ════════════════════════ PAGE 1 · คู่มืออาชีพ ════════════════════════ */
const gJob = $('#gJob'), gLv = $('#gLv'), gLvN = $('#gLvN');
(function buildJobPicker() {
  const groups = D.jobs.filter((j) => j.tier === 1);
  gJob.innerHTML = D.jobs.filter((j) => j.tier === 0).map((j) => `<option value="${j.id}">${esc(j.n)}</option>`).join('') +
    groups.map((root) => {
      const opts = [root];
      D.jobs.filter((x) => x.from === root.id).forEach((k) => { opts.push(k); D.jobs.filter((x) => x.from === k.id).forEach((g) => opts.push(g)); });
      return `<optgroup label="${esc(root.n)}">${opts.map((x) => `<option value="${x.id}">${'　'.repeat(Math.max(0, x.tier - 1))}${esc(x.n)}${x.tier === 3 ? ' ★' : ''}</option>`).join('')}</optgroup>`;
    }).join('');
})();
gJob.addEventListener('change', (e) => openJob(e.target.value));
const gWt = $('#gWt'), gEl = $('#gEl');
gWt.innerHTML = '<option value="">ทั้งหมด</option>' + Object.entries(D.wtypes).map(([k, v]) => `<option value="${k}">${v.th}</option>`).join('');
gEl.innerHTML = '<option value="">ทั้งหมด</option>' + Object.entries(D.elements).map(([k, v]) => `<option value="${k}">${v.th}</option>`).join('');

let cur = { job: null, wts: [], path: [], skillIds: new Set() };
function openJob(id) {
  const j = JOB[id] || JOB.firemage;
  cur.job = j; cur.path = pathOf(j); cur.wts = wtsOf(j);
  cur.skillIds = new Set(cur.path.flatMap((x) => x.sk.map((s) => s.id)));
  gWt.value = ''; gEl.value = ''; $('#gOnlyWsk').checked = false;
  drawJobHead(); drawLines(); drawBuilds(); drawWeapons(); drawMaps(); drawMonCards(); drawSets(); drawSimSelectors(); drawSim();
}

function drawJobHead() {
  const j = cur.job;
  const els = {}; j.sk.forEach((s) => { if (s.el) els[s.el] = (els[s.el] || 0) + 1; });
  const mainEl = Object.keys(els).sort((a, b) => els[b] - els[a])[0] || 'neutral';
  const style = j.sk.filter((s) => s.type === 'magic').length > j.sk.filter((s) => s.type === 'phys').length ? 'เวทมนตร์' : j.sk.some((s) => s.type === 'phys') ? 'ประชิด' : 'ซัพพอร์ต';
  $('#gHead').innerHTML = `<div class="jobhead" style="--c:${EL.col(mainEl)}">
    <div class="jobhead__pic" style="padding:6px">${aiHtml('jobs', j.id, 108) || ELICON[mainEl] || '🏕️'}</div>
    <div><h2 style="margin:0">${esc(j.n)}</h2>
      <div class="tags"><span class="pill">${D.jobsT[j.tier]}</span><span class="pill">${style}</span>${cur.wts.map((w) => `<span class="pill">${WT(w)}</span>`).join('')}${elTag(mainEl)}</div>
      <p>${esc(j.d)}</p>
      <div class="path">เส้นทาง: ${cur.path.map((x, i) => `<span class="${x.id === j.id ? 'cur' : ''}">${esc(x.n)}</span>${i < cur.path.length - 1 ? '<span class="arrow">›</span>' : ''}`).join(' ')}</div>
      <div class="stats"><span>HP โต/เลเวล <b>${j.hp}</b></span><span>SP โต/เลเวล <b>${j.sp}</b></span><span>สกิล <b>${j.sk.length}</b></span><span>เลเวลอาชีพสูงสุด <b>${j.maxJob}</b></span></div>
    </div></div>`;
}

/* --- ไกด์แนะนำสาย: ฟาร์ม · PvP · ล่าบอส (จัดอันดับจากข้อความสกิลจริง) --- */
function rateLines(j) {
  const AOE = /รัศมี|เป็นวง|วงกว้าง|รอบตัว|ทั้งแนว|ฝูง|กระจาย|พัด|ฝน|ศัตรูในวง|ทุก (ตัว|ศัตรู)|ลูกเล็ก|ตัวข้าง ๆ|เป้าเอง|แตกเป็น|หลาย (ตัว|เล่ม|ดอก)/;
  const CTRL = /ผลัก|มึน|แช่แข็ง|ตรึง|ช้าลง|ดึง|กับดัก|เงียบ|ตาบอด|หลับ|เย็นเฉียบ|ช็อต|ติดเผา|ติดพิษ|เลือดออก|เผาศัตรู|สะสม|รุม/;
  const MOB = /ก้าว|พุ่ง|กระโดด|เดินเร็ว|หลบ|เงาที่ฟัน|ดาช/;
  const SELF = /ATK \+\d+%|MATK \+\d+%|คริติคอล \+|ความเร็วโจมตี \+|ทุกสเตตัส/;
  const HEALSHIELD = /ฟื้น HP|ฮีล|โล่|ดูดซับ|รับดาเมจลดลง/;
  const out = {};
  for (const l of (j.lines || [])) {
    const sks = j.sk.filter((s) => s.line === l.id);
    let farm = 0, boss = 0, pvp = 0, maxPct = 0;
    for (const s of sks) {
      if (AOE.test(s.d)) farm += s.active ? 2 : 1;
      if (CTRL.test(s.d)) pvp += s.active ? 2 : 1;
      if (MOB.test(s.d)) { farm += 0.5; pvp += 0.5; }
      if (SELF.test(s.d)) { boss += 1; pvp += 0.5; }
      if (HEALSHIELD.test(s.d)) farm += 0.3;
      const m = [...s.d.matchAll(/([\d,]+)% ของ (ATK|MATK)/g)].map((x) => +x[1].replace(/,/g, ''));
      if (m.length) {
        const mx = Math.max(...m);
        maxPct = Math.max(maxPct, mx);
        if (AOE.test(s.d)) farm += Math.min(3, mx / 300);
        else boss += Math.min(3, mx / 300);
      }
      if (s.active && s.cd && s.cd <= 3) { farm += 0.3; boss += 0.3; pvp += 0.3; }
    }
    out[l.id] = { id: l.id, n: l.n, el: l.el, farm, boss, pvp, maxPct, skills: sks };
  }
  return Object.values(out);
}
function topLines(rated, key) { return [...rated].sort((a, b) => b[key] - a[key]); }
function lineWeaponPick(lineSkillIds) {
  const ws = D.weapons.filter((w) => w.wsk && w.wsk.some((b) => b[1] === cur.job.id && lineSkillIds.has(b[0])));
  return ws.sort((a, b) => b.lv - a.lv)[0] || null;
}
function drawBuilds() {
  const j = cur.job;
  const rated = rateLines(j);
  const box = $('#gBuildsBox');
  if (!rated.length) { box.innerHTML = '<div class="card hint">อาชีพนี้ยังไม่มีสายสกิลแยก — เลือกอาชีพลูกเพื่อดูไกด์สาย</div>'; return; }
  const mk = (cat, icon, title) => {
    const rank = topLines(rated, cat);
    const best = rank[0], alt = rank[1];
    const w = lineWeaponPick(new Set(best.skills.map((s) => s.id)));
    const tips = {
      farm: `วนร่าย <b>${esc(best.n)}</b> รื้อฝูง — จับคู่ธาตุอาวุธให้ตรงมอนในแมพ (ดูแมพแนะนำด้านล่าง) และใช้<a href="#plan">แผนฟาร์ม Lv1–99</a> วางเส้นทางทั้งตี้ บัพฮีลจากบิชอปช่วยลดเวลาพัก`,
      boss: `โฟกัสสกิลดาเมจสูงสุด (สูงสุดในสาย ~<b>${Math.round(best.maxPct)}% ATK/MATK</b>) ก่อนใช้ตัวรอง · บอสดรอปอาวุธเด่นของตัวเอง — ดูรายชื่อบอสในคลังไอเทม แท็บมอน (กรอง ☑ บอส) · บัพทะลุเกราะ (พรทะลวงเกราะ) ช่วยได้มาก`,
      pvp: `ใช้สกิลควบคุม (${best.skills.filter((s) => CTRL_DOC.test(s.d)).slice(0, 2).map((s) => s.n).join(' / ') || 'ควบคุมเป้า'}) ปิดทางก่อนระเบิดดาเมจ · ในซีซัน 2 ดวลกันดาเมจถูกลดและไม่สึกอุปกรณ์ การ์ด/เกราะ/ฮีลทำงานปกติ — ตี้ที่มีฮีลได้เปรียบ`,
    };
    return `<div class="card"><h3>${icon} ${title}</h3>
      <div class="line-name">⭐ แนะนำ: ${ELICON[best.el] || ''} ${esc(best.n)}</div>
      ${alt ? `<div class="hint">สายรอง: ${esc(alt.n)}</div>` : ''}
      <div class="skl"><b>อาวุธที่ควรใช้:</b> ${w ? `<span class="lk" data-item="${w.id}" style="cursor:pointer">${WTICON[w.wt]} ${esc(w.n)} 🔍</span> <small>(Lv ${w.lv} · ATK ${w.atk} · ${ELICON[w.el]}${EL.th(w.el)})</small>` : 'อาวุธอาชีพประจำ'}</div>
      <div class="skl"><b>สกิลหลักของสาย:</b> ${best.skills.filter((s) => s.active || /ATK \+|คริ|ความเร็ว/.test(s.d)).slice(0, 4).map((s) => `<span class="lk" data-item="sk:${s.id}" style="cursor:pointer">${esc(s.n)}</span>`).join(' · ')}</div>
      <div class="skl"><b>🧿 รูนแนะนำสายนี้:</b> ${(() => { const seen = new Set(); const out = []; for (const s of best.skills.slice(0, 3)) for (const r2 of recommendRunes(s)) { if (!seen.has(r2.n)) { seen.add(r2.n); out.push(runeChipHtml(r2)); } } return out.slice(0, 4).join(' ') || '–'; })()}</div>
      <div class="bonus">${tips[cat]}</div></div>`;
  };
  box.innerHTML = mk('farm', '🌿', 'สายฟาร์ม (เก็บเลเวล/ไอเทม)') + mk('boss', '👑', 'สายล่าบอส') + mk('pvp', '⚔️', 'สาย PvP / ดวล') +
    `<p class="note" style="grid-column:1/-1">การจัดอันดับใช้ข้อความสกิลจริงจากวิกิ (Aoe/ควบคุม/ดาเมจสูงสุด/บัฟตัวเอง) เป็นแนวทาง — ควรปรับตามไอเทมและสไตล์ที่ชอบ</p>`;
}
const CTRL_DOC = /ผลัก|มึน|แช่แข็ง|ตรึง|ช้าลง|ดึง|กับดัก|เงียบ|ตาบอด|หลับ|เย็นเฉียบ|ช็อต/;

/* ── รูนสกิล (จากตารางรูนซีซัน 2 ของวิกิ) ── */
const RUNE_INFO = {
  'สายฟ้าแตก': { el: 'ลม', d: 'ร่ายแล้ว 35% สายฟ้าแตกไปตัวข้างๆ · ตีฝูงแรงขึ้น 10/16/25%' },
  'ไฟลาม': { el: 'ไฟ', d: 'ตัวที่ตายจากสกิลนี้ ไฟลามไปตัวข้างๆ · ตีฝูงแรงขึ้น 12/20/30%' },
  'ฟรอสต์': { el: 'น้ำ', d: 'ร่ายแล้ว 30% ความเย็นแตกรอบเป้า ช้าลง · ตีฝูงแรงขึ้น 8/12/18%' },
  'พิษซ้อน': { el: 'พิษ', d: 'ร่ายแล้วพิษซ้อนบนเป้า สูงสุด 5 ชั้น · ตีเป้าเดียวแรงขึ้น 6/10/15%' },
  'เงาตีซ้ำ': { el: 'เงา', d: 'ร่ายแล้ว 30% เงาตีเป้าซ้ำ · ตีเป้าเดียวแรงขึ้น 6/10/15%' },
  'กับดัก': { el: 'ดิน', d: 'ร่ายแล้ววางกับดักที่จุดเล็ง (ทุก 5 วิ) · ตีฝูงแรงขึ้น 8/13/20%' },
  'อุกกาบาตถล่ม': { el: 'ไฟ', d: 'ร่ายแล้ว 10% อุกกาบาตถล่มตกใส่เป้า · ตีฝูงแรงขึ้น 12/20/30%' },
  'สายฟ้าฟาด': { el: 'ลม', d: 'ร่ายแล้ว 10% สายฟ้าฟาดเป้าและตัวข้างๆ · ตีฝูงแรงขึ้น 12/20/30%' },
  'วงน้ำแข็ง': { el: 'น้ำ', d: 'ร่ายแล้ว 10% วงน้ำแข็งแตกรอบตัว มอนช้าลง · ตีฝูงแรงขึ้น 12/20/30%' },
  'หินแหลมพสุธา': { el: 'ดิน', d: 'ร่ายแล้ว 10% หินแหลมพุ่งใต้เป้า · ตีฝูงแรงขึ้น 12/20/30%' },
  'วงเวทแสงขับมาร': { el: 'ศักดิ์สิทธิ์', d: 'ร่ายแล้ว 10% วงเวทแสงขับมารใต้เป้า · ตีฝูงแรงขึ้น 12/20/30%' },
  'ดาบพายุหมุน': { el: '', d: 'ร่ายแล้ว 10% ดาบพายุหมุนรอบตัว (ธาตุอาวุธ) · ตีฝูงแรงขึ้น 12/20/30%' },
  'เจ้าแห่งอสนี': { el: 'ลม', d: 'ร่ายแล้ว 10% ฟ้าผ่าหลายลูกรอบเป้า · ตีฝูงแรงขึ้น 12/20/30%' },
  'อุกกาบาตเงา': { el: 'เงา', d: 'ร่ายแล้ว 10% อุกกาบาตเงาตกรอบตัว · ตีฝูงแรงขึ้น 12/20/30%' },
  'เจาะเกราะ': { el: '', d: 'เจาะเกราะ +15/25/35%' },
  'เจาะเวท': { el: '', d: 'เจาะเวท +15/25/35%' },
  'ขยาย': { el: '', d: 'พื้นที่ +30/45/60% ดาเมจ −10% (เทพ −5%)' },
  'จดจ่อ': { el: '', d: 'พื้นที่ −40% ดาเมจ +25/35/50%' },
  'เสียงสะท้อน': { el: '', d: 'ร่ายซ้ำเองหลังจากนั้น 0.6 วิ ที่ 30/40/55%' },
  'เร่ง': { el: '', d: 'คูลดาวน์และดีเลย์ −15% ดาเมจ −10%' },
  'ค้างอยู่': { el: '', d: 'ทิ้งเขตไว้ 2–4 วิ วิละ 15–25%' },
  'ระเบิดศพ': { el: '', d: 'ฆ่าแล้วระเบิด 50/75/100% ATK' },
};
const RUNE_BY_EL = { fire: 'ไฟลาม', water: 'ฟรอสต์', wind: 'สายฟ้าฟาด', poison: 'พิษซ้อน', shadow: 'เงาตีซ้ำ', holy: 'วงเวทแสงขับมาร', earth: 'หินแหลมพสุธา', undead: 'วงเวทแสงขับมาร', ghost: 'อุกกาบาตเงา', neutral: 'ดาบพายุหมุน' };
const AOE_RE2 = /รัศมี|เป็นวง|วงกว้าง|รอบตัว|ทั้งแนว|ฝูง|กระจาย|พัด|ฝน|ศัตรูในวง|ทุก (ตัว|ศัตรู)/;
const RUNE_ALIAS = { 'แยก': 'split', 'ขยาย': 'wide', 'จดจ่อ': 'focus', 'เสียงสะท้อน': 'echo', 'เร่ง': 'haste', 'ค้างอยู่': 'linger', 'ระเบิดศพ': 'corpse', 'เจาะเกราะ': 'apierce', 'เจาะเวท': 'wpierce', 'ดึง': 'pull', 'เด้ง': 'bounce', 'ดาบพายุหมุน': null, 'สายฟ้าฟาด': 'skyfall', 'วงเวทแสงขับมาร': null, 'หินแหลมพสุธา': null, 'อุกกาบาตถล่ม': null, 'เจ้าแห่งอสนี': null, 'อุกกาบาตเงา': null, 'ฟรอสต์': 'frostbite', 'ไฟลาม': 'wildfire', 'พิษซ้อน': 'venom', 'เงาตีซ้ำ': 'shade', 'สายฟ้าแตก': 'arc', 'กับดัก': 'trap' };
function runeChipHtml(r2) {
  const info = RUNE_INFO[r2.n];
  const tip = info ? esc(info.el ? 'ธาตุ ' + info.el + ' · ' + info.d : info.d) : '';
  const rid = RUNE_ALIAS[r2.n];
  if (rid && D.runes.find((x) => x.id === rid)) return `<span class="pill runechip ${r2.star ? 'star' : ''}" data-item="rune:${rid}" title="${tip} — กดดูแหล่งดรอป">${r2.star ? '⭐ ' : ''}รูน${r2.n} 🔍</span>`;
  return `<span class="pill runechip craft ${r2.star ? 'star' : ''}" data-item="runeS2:${r2.n}" title="${tip} — กดดูรายละเอียด">${r2.star ? '⭐ ' : ''}รูน${r2.n} 🔍</span>`;
}
let gModeVal = 'farm';
function recommendRunes(s, mode) {
  mode = mode || gModeVal;
  const rec = [];
  const mainRune = RUNE_BY_EL[s.el] || 'ดาบพายุหมุน';
  const aoe = AOE_RE2.test(s.d);
  if (mode === 'pvp') {
    rec.push({ n: 'จดจ่อ', star: true });
    rec.push({ n: mainRune });
    if (s.active) rec.push({ n: 'เร่ง' });
  } else if (mode === 'boss') {
    rec.push({ n: 'จดจ่อ', star: true });
    rec.push({ n: 'เจาะเกราะ', star: true });
    if (s.active) rec.push({ n: 'เสียงสะท้อน' });
  } else {
    rec.push({ n: mainRune, star: true });
    rec.push({ n: aoe ? 'ขยาย' : 'แยก', star: !!aoe });
    if (s.active) rec.push({ n: 'เสียงสะท้อน' });
  }
  return rec.slice(0, 4);
}
function bestWeaponFor(ws, lv, mode) {
  const usable = ws.filter((w) => w.lv <= lv);
  const pool = (usable.length ? usable : ws).slice();
  if (!pool.length) return null;
  const KR = { L: 0, B: 1, C: 2, D: 3 };
  const jobEl = (cur.job.sk.find((s) => s.el) || {}).el || 'neutral';
  const wscore = (w, m) => {
    const wsk = (w.wsk || []).some((x) => x[1] === cur.job.id) ? 1 : 0;
    let s = wsk * 2 - (KR[w.k ?? 9] ?? 9) * 0.3 + w.atk / 100;
    if (m === 'farm') s += (w.el === jobEl ? 1.5 : 0);
    if (m === 'boss') s += w.atk / 80 + (w.g || 1) * 0.3;
    if (m === 'pvp') s += (w.el === 'shadow' || w.el === 'poison' || w.el === 'holy' ? 0.8 : 0) + wsk * 0.5;
    return s;
  };
  pool.sort((a, b) => wscore(b, mode) - wscore(a, mode));
  return pool[0];
}

/* --- skill lines + weapons per line --- */
function lineWeapons(lineSkillIds) {
  return D.weapons
    .filter((w) => w.wsk && w.wsk.some((b) => b[1] === cur.job.id && lineSkillIds.has(b[0])))
    .sort((a, b) => b.lv - a.lv);
}
function wepCard(w, wskBonus) {
  const ic = aiHtml('items', w.id, 44) || `<span style="font-size:1.5rem">${WTICON[w.wt] || '🗡️'}</span>`;
  return `<div class="wep" data-item="${w.id}"><div class="ic" style="--el:${EL.col(w.el)}">${ic}</div>
    <div class="nm" style="flex:1"><b>${esc(w.n)}</b>${kTag(w.k)}${rTag(w.r)}
      <small>${WT(w.wt)} · Lv ${w.lv} · ATK ${w.atk} · ${elTag(w.el)}</small>
      ${wskBonus ? `<small style="color:var(--pur)">${esc(D.skillNames[wskBonus[0]]?.n || wskBonus[0])} +${wskBonus[2]}%</small>` : ''}
      ${w.ab ? `<small>${esc(w.ab)}</small>` : ''}
      ${srcHtml(w.src)}</div>${cmpBtn(w)}</div>`;
}
function drawLines() {
  const j = cur.job;
  const lines = j.lines || [];
  const rated = rateLines(j);
  const rankOf = (key) => topLines(rated, key);
  const bestFarm = rankOf('farm')[0]?.id, bestBoss = rankOf('boss')[0]?.id, bestPvp = rankOf('pvp')[0]?.id;
  const badge = (id) => [
    id === bestFarm ? '<span class="tag r-legend">⭐ ฟาร์มเก่ง</span>' : '',
    id === bestBoss ? '<span class="tag r-legend">👑 ล่าบอส</span>' : '',
    id === bestPvp ? '<span class="tag r-legend">⚔️ PvP</span>' : '',
  ].join(' ');
  const lv = +gLv.value;
  $('#gLinesBox').innerHTML = lines.length ? lines.map((l) => {
    const skIds = new Set(j.sk.filter((s) => s.line === l.id).map((s) => s.id));
    const ws = lineWeapons(skIds);
    let lineStar = bestWeaponFor(ws, lv, gModeVal);
    if (lineStar) lineStar = lineStar.id;
    return `<div class="card"><div class="line-name">${ELICON[l.el] || ''} ${esc(l.n)}</div><div style="margin-bottom:4px">${badge(l.id)}</div>
      ${j.sk.filter((s) => s.line === l.id).map((s) => {
        const rec = recommendRunes(s);
        const slot1 = Math.ceil(s.max / 2), slot2 = s.max;
        return `<div class="skl sklclick" data-item="sk:${s.id}" title="กดดูรายละเอียดสกิล"><span style="vertical-align:middle;margin-right:4px">${aiHtml('skills', s.icon, 28)}</span><b>${esc(s.n)}</b> <span class="pill">${s.active ? 'ใช้งาน' : 'พาสซีฟ'} · Lv${s.max}${s.cd ? ' · CD ' + s.cd + 's' : ''}</span><small>${esc(s.d)}</small>
          <small style="display:block;margin-top:4px">🧿 รูนแนะนำ: ${rec.map(runeChipHtml).join(' ')} <span class="hint">(ช่อง 1 เปิด Lv${slot1} · ช่อง 2 เปิด Lv${slot2})</span></small></div>`;
      }).join('')}
      <h3 style="margin:10px 0 4px">อาวุธที่เสริมสายนี้ ${lv ? `<small class="hint">(⭐ = ดีที่สุดที่ Lv ${lv})</small>` : ''}</h3>
      ${ws.length ? ws.slice(0, 6).map((w) => { const c = wepCard(w, w.wsk.find((b) => b[1] === j.id && skIds.has(b[0]))); return w.id === lineStar ? c.replace('<div class="nm"', '<span class="tag r-legend" style="margin-left:6px">⭐ แนะนำ Lv ' + lv + '</span><div class="nm"') : c; }).join('') : '<span class="hint">ยังไม่มีอาวุธที่เสริมสายนี้ในข้อมูล</span>'}
    </div>`;
  }).join('') : `<div class="card"><span class="hint">อาชีพนี้เป็นอาชีพเริ่มต้น/ฐาน — เลือกอาชีพลูกเพื่อดูสายการเล่น</span></div>`;
}

/* --- all weapons sorted by level (การ์ดทุกใบ ไฮไลต์เฉพาะอาชีพ) --- */
function drawWeapons() {
  const onlyWsk = $('#gOnlyWsk').checked, ft = gWt.value, fe = gEl.value;
  let ws = D.weapons.filter((w) => cur.wts.includes(w.wt)); // เฉพาะอาวุธของอาชีพที่เลือก
  if (ft) ws = ws.filter((w) => w.wt === ft);
  if (fe) ws = ws.filter((w) => w.el === fe);
  if (onlyWsk) ws = ws.filter((w) => w.wsk && w.wsk.some((b) => b[1] === cur.job.id));
  ws.sort((a, b) => a.lv - b.lv || (b.atk - a.atk));
  const lv = +gLv.value;
  const stars = new Set();
  for (const wt of cur.wts) {
    const pool = ws.filter((w) => w.wt === wt);
    const pick = bestWeaponFor(pool, lv, gModeVal);
    if (pick) stars.add(pick.id);
  }
  $('#gWeaponsBox').innerHTML = `<p class="hint">⭐ = อาวุธแนะนำโหมด${({ farm: 'ฟาร์ม', pvp: 'PvP', boss: 'ล่าบอส' })[gModeVal]}ที่ Lv ${lv} · กดการ์ดเพื่อดูแหล่งดรอป</p>` + ws.map((w) => {
    const wsk = w.wsk && w.wsk.find((b) => b[1] === cur.job.id);
    let c = wepCard(w, wsk);
    if (stars.has(w.id)) c = c.replace('<div class="nm"', `<span class="tag r-legend" style="margin-left:6px">⭐ แนะนำ Lv ${lv}</span><div class="nm"`);
    return c;
  }).join('') || '<p class="hint">ไม่พบอาวุธตามเงื่อนไข</p>';
}
[gWt, gEl].forEach((x) => x.addEventListener('change', drawWeapons));
$('#gOnlyWsk').addEventListener('change', drawWeapons);
gLv.addEventListener('input', () => { gLvN.textContent = gLv.value; drawMaps(); drawWeapons(); drawLines(); drawMonCards(); drawSim(); });
const gMode = $('#gMode');
if (gMode) gMode.addEventListener('change', () => { gModeVal = gMode.value; drawWeapons(); drawLines(); drawBuilds(); drawMaps(); drawMonCards(); drawSim(); });
$('#simWeapon').addEventListener('change', () => { drawMonCards(); });

/* --- farm maps per bracket --- */
function bestMaps(charLv, weaponEl, count) {
  const scored = D.maps.filter((m) => m.mons.length && m.kind !== 'camp' && m.kind !== 'safe' && !m.secret).map((m) => {
    let fit = 0, best = [];
    for (const mn of m.mons) {
      const mid = (mn.lv + mn.lvMax) / 2;
      let s = 1;
      const diff = mid - charLv;
      if (diff > 5) s = 0.35; else if (diff > 2) s = 0.7; else if (diff < -12) s = 0.3; else if (diff < -7) s = 0.6;
      let e = weaponEl && mn.el ? eff(weaponEl, mn.el) : 1;
      s *= e;
      fit += s;
      best.push({ ...mn, eff: e });
    }
    fit /= m.mons.length;
    return { m, fit, best: best.sort((a, b) => b.eff - a.eff) };
  });
  scored.sort((a, b) => b.fit - a.fit || (a.m.min || 0) - (b.m.min || 0));
  return scored.slice(0, count || 3);
}
function drawMaps() {
  const lv = +gLv.value, wEl = $('#simWeapon').value ? D.weapons.find((w) => w.id === $('#simWeapon').value)?.el : null;
  const brks = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70], [71, 80], [81, 90], [91, 99]];
  $('#gMapsHint').textContent = `แนะนำจากมอนในแมพที่เลเวลใกล้เคียงตัวละคร (Lv ${lv})${wEl ? ' + คู่ธาตุกับอาวุธที่เลือก (' + EL.th(wEl) + ')' : ''} — คำนวณจากข้อมูลมอน/แมพของวิกิ`;
  $('#gMapsBox').innerHTML = brks.map(([a, b]) => {
    const picks = bestMaps((a + b) / 2, wEl, 3);
    return `<div class="brk"><h3><span class="lv">Lv ${a}–${b}</span></h3><div class="maps">${picks.map(({ m, best }) => `
      <div class="mapc"><b>📍 ${esc(m.n)}</b> <small>${esc(m.regionN)} · ${esc(m.lvText)}</small>
        <div class="mons">${best.slice(0, 5).map((mn) => { const [cls, txt] = wEl && mn.el ? effBadge(wEl, mn.el) : ['', '']; return `<span class="mtag ${cls}" style="--el:${EL.col(mn.el)}">${ELICON[mn.el]}${esc(mn.n)} <small>Lv${mn.lv}–${mn.lvMax}${cls ? ' · ' + txt : ''}</small></span>`; }).join('')}</div>
      </div>`).join('')}</div></div>`;
  }).join('');
}

/* --- recommended sets --- */
function drawSets() {
  const line = setLineOf(cur.job.id);
  const list = (line ? D.sets.filter((s) => s.line === line) : D.sets).sort((a, b) => a.lv - b.lv);
  $('#gSetsBox').innerHTML = `<p class="hint">${line ? `เกราะสาย “${LINE_TH[line]}” ที่ตรงกับอาชีพ ${esc(cur.job.n)} — เรียงตามเลเวล พร้อมมอน+แมพที่ดรอปแต่ละชิ้น` : 'อาชีพเริ่มต้น: แสดงทุกสายเกราะ'}</p>` +
    list.map((s) => `<div class="card setc">
      <h3>${esc(s.n)} <span class="pill">Lv ${s.lv}</span><span class="pill">${LINE_TH[s.line] || s.line}</span></h3>
      <div class="pcs">${s.pcs.map((p) => `<span class="pill">${esc(p.n)}</span>`).join('')}</div>
      <div class="bonus">2 ชิ้น: <b>${esc(s.b2)}</b><br>3 ชิ้น: <b>${esc(s.b3)}</b>${s.pas ? `<br>พาสซีฟเซ็ตเต็ม: <b>${esc(s.pas)}</b>` : ''}</div>
      ${setSrcTable(s)}
    </div>`).join('');
}
function setSrcTable(s) {
  const rows = s.sources.slice(0, 12);
  if (!rows.length) return '<p class="hint">ยังไม่พบแหล่งดรอปในข้อมูลมอน</p>';
  return `<table class="src"><tr><th>ชิ้น</th><th>มอน</th><th>โอกาส</th><th>แมพ · เขต</th></tr>${rows.map((r) => `<tr><td>${esc((s.pcs.find((p) => p.id === r.item) || {}).n || r.item)}</td><td>${esc(r.monN)}${r.boss ? ' 👑' : ''}</td><td>${pct(r.chance)}</td><td>${esc(r.mapN)} · ${esc(r.region)}</td></tr>`).join('')}${s.sources.length > 12 ? `<tr><td colspan="4" class="hint">…และอีก ${s.sources.length - 12} แหล่ง</td></tr>` : ''}</table>`;
}

/* --- farm simulator --- */
function drawSimSelectors() {
  const j = cur.job, lines = j.lines || [];
  $('#simLine').innerHTML = (lines.length ? lines.map((l) => `<option value="${l.id}">${esc(l.n)}</option>`).join('') : '<option value="">สกิลหลักของอาชีพ</option>');
  const inLine = (wid) => { const w = D.weapons.find((x) => x.id === wid); if (!w || !w.wsk) return false; const l = lines.find((x) => x.id === $('#simLine').value); const ids = l ? new Set(j.sk.filter((s) => s.line === l.id).map((s) => s.id)) : cur.skillIds; return w.wsk.some((b) => b[1] === j.id && ids.has(b[0])); };
  const pool = D.weapons.filter((w) => w.wsk && w.wsk.some((b) => b[1] === j.id) && cur.wts.includes(w.wt)).sort((a, b) => b.lv - a.lv);
  const sel = $('#simWeapon');
  const prev = sel.value;
  sel.innerHTML = pool.map((w) => `<option value="${w.id}">${esc(w.n)} (Lv ${w.lv})</option>`).join('') || '<option value="">— ไม่มีอาวุธที่เสริมสกิล —</option>';
  if (prev && pool.some((w) => w.id === prev)) sel.value = prev;
}
$('#simLine').addEventListener('change', () => { drawSimSelectors(); drawMaps(); drawSim(); });
$('#simWeapon').addEventListener('change', drawSim);

function drawSim() {
  const j = cur.job, lv = +gLv.value;
  const w = D.weapons.find((x) => x.id === $('#simWeapon').value) || null;
  const wEl = w ? w.el : (j.sk.find((s) => s.el) || {}).el || 'neutral';
  const picks = bestMaps(lv, wEl, 1);
  const pick = picks[0];
  const c = $('#simCanvas'), ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1a2340'); sky.addColorStop(.55, '#2c3560'); sky.addColorStop(1, '#0d1a2b');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // stars
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 40; i++) { ctx.fillRect((i * 97.3) % W, (i * 53.7) % (H * .45), 2, 2); }
  // ground
  ctx.fillStyle = '#182430'; ctx.beginPath(); ctx.moveTo(0, H * .72);
  for (let x = 0; x <= W; x += 60) ctx.lineTo(x, H * .72 + Math.sin(x / 80) * 14);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  // moon
  ctx.fillStyle = '#f5e9c8'; ctx.beginPath(); ctx.arc(W - 90, 70, 26, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a2340'; ctx.beginPath(); ctx.arc(W - 80, 62, 22, 0, 7); ctx.fill();

  const mons = (pick.m.mons || []).slice(0, 6);
  const n = Math.min(mons.length, 5);
  // monsters
  mons.slice(0, 5).forEach((mn, i) => {
    const span = W - 280;
    const x = 140 + (n > 1 ? i * (span / (n - 1)) : i * 150);
    const y = H * .68 + (i % 2 ? 16 : -6);
    drawMon(ctx, Math.min(x, W - 60), y, mn, wEl);
  });
  // hero
  drawHero(ctx, 80, H * .70, j, wEl, w);
  // labels
  ctx.font = '600 15px "Noto Sans Thai", sans-serif';
  ctx.fillStyle = '#e8ecf7';
  ctx.fillText('🏕️ ' + pick.m.n + ' · ' + pick.m.regionN, 16, 28);
  ctx.fillStyle = '#9aa6c4'; ctx.font = '12px "Noto Sans Thai", sans-serif';
  ctx.fillText('จำลอง Lv ' + lv + ' · อาวุธ: ' + (w ? w.n + ' (' + EL.th(wEl) + ')' : 'ไม่มี'), 16, 48);

  // info panel
  const effList = pick.best.slice(0, 5).map((mn) => { const [cls, txt] = effBadge(wEl, mn.el); return `<div class="eff"><span class="${cls}">${cls === 'ok' ? '▲' : cls === 'bad' ? '▼' : '•'} ${esc(mn.n)} (Lv ${mn.lv}–${mn.lvMax})</span> — ${txt}</div>`; }).join('');
  const best = pick.best[0] || {};
  $('#simInfo').innerHTML = `<h3>📍 ${esc(pick.m.n)}</h3>
    <div>เขต: <b>${esc(pick.m.regionN)}</b> · ${esc(pick.m.lvText)}</div>
    <div>ธาตุอาวุธ: ${elTag(wEl)} ${w ? '· ATK ' + w.atk : ''}</div>
    <div class="eff">${effList}</div>
    <div style="margin-top:8px">🎯 เป้าเด่น: <b>${esc(best.n || '')}</b> — ใช้สกิลธาตุ${EL.th(wEl)}ใส่มอนธาตุที่ได้เปรียบ แล้ววนฟาร์มโซนนี้จนเลเวลเกินช่วงของแมพ</div>
    <div class="note">* ภาพจำลองสร้างจากข้อมูลมอน/แมพ/ธาตุของวิกิ (สัญลักษณ์แทนตัวมอนจริง)</div>`;
}
function drawMon(ctx, x, y, mn, wEl) {
  const col = EL.col(mn.el).trim() || '#999';
  const [cls] = effBadge(wEl, mn.el);
  ctx.beginPath(); ctx.ellipse(x, y, 22, 24, 0, 0, 7);
  ctx.fillStyle = col + 'cc'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = cls === 'ok' ? '#7ee08a' : cls === 'bad' ? '#ff6b6b' : 'rgba(255,255,255,.35)';
  ctx.stroke();
  ctx.font = '16px serif'; ctx.textAlign = 'center';
  ctx.fillText(ELICON[mn.el] || '👾', x, y + 6);
  ctx.font = '600 11px "Noto Sans Thai", sans-serif'; ctx.fillStyle = '#e8ecf7';
  ctx.fillText(mn.n, x, y + 40);
  ctx.textAlign = 'left';
}
function drawHero(ctx, x, y, j, el, w) {
  const col = EL.col(el).trim() || '#ffb454';
  ctx.beginPath(); ctx.arc(x, y - 26, 15, 0, 7); ctx.fillStyle = '#ffe0b2'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 18, y + 20); ctx.quadraticCurveTo(x, y - 18, x + 18, y + 20); ctx.closePath();
  ctx.fillStyle = col + 'dd'; ctx.fill();
  if (w) { ctx.beginPath(); ctx.moveTo(x + 16, y - 4); ctx.lineTo(x + 40, y - 34); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.stroke(); }
  ctx.font = '600 11px "Noto Sans Thai", sans-serif'; ctx.fillStyle = '#e8ecf7'; ctx.textAlign = 'center';
  ctx.fillText(j.n, x, y + 36); ctx.textAlign = 'left';
}

/* ════════════════════════ PAGE 2 · คลังไอเทม ════════════════════════ */
let dbTab = 'weapons';
const dbQ = $('#dbQ'), dbFilters = $('#dbFilters'), dbBox = $('#dbBox'), dbCount = $('#dbCount');
$('#dbTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; dbTab = b.dataset.tab; $$('#dbTabs button').forEach((x) => x.classList.toggle('on', x === b)); renderDb(); });
dbQ.addEventListener('input', renderDb);

const dbState = { wt: '', el: '', kind: '', reg: '', sort: 'lv' };
function norm(s) { return String(s || '').toLowerCase().normalize('NFKC'); }
function matches(q, ...fields) { if (!q) return true; const s = norm(q); return fields.some((f) => norm(f).includes(s)); }

function renderDb() {
  const q = dbQ.value.trim();
  if (dbTab === 'weapons') {
    dbFilters.innerHTML = `<label class="sel"><span>ชนิด</span><select id="fWt">${selOpts(D.wtypes, dbState.wt)}</select></label>
      <label class="sel"><span>ธาตุ</span><select id="fEl">${selOpts(D.elements, dbState.el)}</select></label>
      <label class="sel"><span>เรียง</span><select id="fSort"><option value="lv">เลเวล</option><option value="atk">ATK</option><option value="n">ชื่อ</option></select></label>`;
    let list = D.weapons.filter((w) => (!dbState.wt || w.wt === dbState.wt) && (!dbState.el || w.el === dbState.el) && matches(q, w.n, w.id, w.d, w.ab));
    list.sort((a, b) => dbState.sort === 'n' ? a.n.localeCompare(b.n, 'th') : dbState.sort === 'atk' ? b.atk - a.atk : a.lv - b.lv || b.atk - a.atk);
    dbBox.innerHTML = list.map(wepCard).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' ชิ้น';
    bindDbFilters();
  } else if (dbTab === 'runes') {
    dbFilters.innerHTML = '';
    const list = D.runes.filter((r) => matches(q, r.n, r.id, r.droppers.map((d) => d.monN).join(' ')));
    dbBox.innerHTML = list.map((r) => `<div class="wep" data-item="rune:${r.id}"><div class="ic">🃏</div>
      <div class="nm" style="flex:1"><b>รูน ${esc(r.n.replace(/^รูน /, ''))}</b><small>ดรอปจาก ${r.droppers.length} มอน</small>
      ${r.droppers.map((d) => `<span class="drop">🎮 <b>${esc(d.monN)}</b> (Lv ${d.lv}) · ${pct(d.chance)}<br><span class="dropmap">📍 ${d.maps.map((m) => esc(m.n) + ' · ' + esc(m.region)).join(' / ')}</span></span>`).join('')}</div></div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' รูน';
  } else if (dbTab === 'sets') {
    dbFilters.innerHTML = `<label class="sel"><span>สายเกราะ</span><select id="fKind"><option value="">ทั้งหมด</option>${['hv', 'lt', 'mg', 'rg'].map((l) => `<option value="${l}" ${dbState.kind === l ? 'selected' : ''}>${LINE_TH[l]}</option>`).join('')}</select></label>`;
    const list = D.sets.filter((s) => (!dbState.kind || s.line === dbState.kind) && matches(q, s.n, s.id, s.pcs.map((p) => p.n).join(' '), s.b2, s.b3, s.pas)).sort((a, b) => a.lv - b.lv);
    dbBox.innerHTML = list.map((s) => `<div class="card setc" data-item="set:${s.id}"><h3>${esc(s.n)} <span class="pill">Lv ${s.lv}</span><span class="pill">${LINE_TH[s.line] || s.line}</span></h3>
      <div class="pcs-icons">${s.pcs.map((p) => `<span class="pcic" title="${esc(p.n)}">${pieceIcon(p.id, 36)}</span>`).join('')}</div>
      <div class="pcs">${s.pcs.map((p) => `<span class="pill">${esc(p.n)}</span>`).join('')}</div>
      <div class="bonus">2 ชิ้น: <b>${esc(s.b2)}</b> · 3 ชิ้น: <b>${esc(s.b3)}</b>${s.pas ? ' · เซ็ตเต็ม: <b>' + esc(s.pas) + '</b>' : ''}</div>
      ${setSrcTable(s)}</div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' เซ็ต';
    bindDbFilters();
  } else if (dbTab === 'armors') {
    dbFilters.innerHTML = `<label class="sel"><span>ช่อง</span><select id="fKind">${['top', 'pants', 'robe', 'cape', 'hat', 'glasses', 'shield', 'acc'].map((s) => `<option value="${s}" ${dbState.kind === s ? 'selected' : ''}>${slotTh(s)}</option>`).join('')}</select></label>`;
    const list = D.armors.filter((a) => (!dbState.kind || a.s === dbState.kind) && matches(q, a.n, a.id, a.d, a.ab));
    list.sort((a, b) => a.lv - b.lv);
    dbBox.innerHTML = list.map((a) => `<div class="wep" data-item="${a.id}"><div class="ic">${a.s === 'hat' ? (aiHat(a.id, 40) || aiHtml('items', a.id, 40) || slotIcon(a.s)) : (aiHtml('items', a.id, 40) || slotIcon(a.s))}</div>
      <div class="nm" style="flex:1"><b>${esc(a.n)}</b>${rTag(a.r)}<small>${slotTh(a.s)} · Lv ${a.lv}${a.set ? ' · ชุด: ' + esc((D.sets.find((s) => s.id === a.set) || {}).n || '') : ''}</small>
      ${statHtml(a.st)} ${a.ab ? `<small>${esc(a.ab)}</small>` : ''} ${srcHtml(a.src)}</div></div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' ชิ้น';
    bindDbFilters();
  } else if (dbTab === 'monsters') {
    dbFilters.innerHTML = `<label class="sel"><span>ธาตุ</span><select id="fEl">${selOpts(D.elements, dbState.el)}</select></label>
      <label class="check"><input type="checkbox" id="fBoss" ${dbState.kind === 'boss' ? 'checked' : ''}><span>เฉพาะบอส</span></label>`;
    let list = D.monsters.filter((m) => (!dbState.el || m.el === dbState.el) && (dbState.kind !== 'boss' || m.boss) && matches(q, m.n, m.id, m.st));
    list.sort((a, b) => a.lv - b.lv);
    dbBox.innerHTML = list.map((m) => `<div class="wep" data-item="${m.id}"><div class="ic">${aiHtml('mons', m.id, 44) || (m.boss ? '👑' : ELICON[m.el])}</div>
      <div class="nm" style="flex:1"><b>${esc(m.n)}</b>${m.boss ? ' <span class="tag r-legend">บอส</span>' : ''}<small>Lv ${m.lv} · ${elTag(m.el)} · เผ่า ${(D.races && D.races[m.race]) || m.race}</small>
      <small>HP ${m.hp} · EXP ${m.exp} · JEXP ${m.jexp}</small> ${m.rune ? `<small>🃏 รูน ${esc((D.runes.find((r) => r.id === m.rune[0]) || {}).n || '')} ${pct(m.rune[1])}</small>` : ''}
      ${dropLine(m)} </div></div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' ตัว';
    bindDbFilters();
  } else if (dbTab === 'maps') {
    dbFilters.innerHTML = `<label class="sel"><span>เขต</span><select id="fReg">${D.regions.map((r) => `<option value="${r.id}" ${dbState.reg === r.id ? 'selected' : ''}>${r.n}</option>`).join('')}</select></label>`;
    const list = D.maps.filter((m) => (!dbState.reg || m.region === dbState.reg) && matches(q, m.n, m.id, m.zones.join(' ')));
    list.sort((a, b) => (a.min ?? 999) - (b.min ?? 999));
    dbBox.innerHTML = list.map((m) => `<div class="wep" data-item="${m.id}"><div class="ic">${m.kind === 'dungeon' ? '🕳️' : m.kind === 'camp' ? '🏕️' : '🗺️'}</div>
      <div class="nm" style="flex:1"><b>${esc(m.n)}</b>${m.secret ? ' <span class="tag r-epic">ลับ</span>' : ''}<small>${esc(m.regionN)} · ${esc(m.lvText)} · ${m.kind === 'dungeon' ? 'ดันเจี้ยน' : 'สนาม'}</small>
      <div class="mons" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">${m.mons.map((mn) => `<span class="mtag" style="--el:${EL.col(mn.el)}">${ELICON[mn.el]} ${esc(mn.n)} <small>Lv${mn.lv}–${mn.lvMax}</small></span>`).join('')}</div></div></div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' แมพ';
    bindDbFilters();
  }
}
function empty() { return '<p class="hint">ไม่พบผลลัพธ์</p>'; }
function selOpts(obj, curV) { return '<option value="">ทั้งหมด</option>' + Object.entries(obj).map(([k, v]) => `<option value="${k}" ${curV === k ? 'selected' : ''}>${v.th || v.n || v}</option>`).join(''); }
function slotTh(s) { return ({ top: 'เสื้อ', pants: 'กางเกง+รองเท้า', robe: 'เสื้อคลุม', cape: 'ผ้าคลุม', hat: 'หมวก', glasses: 'แว่น', shield: 'โล่', acc: 'เครื่องประดับ' })[s] || s; }
function slotIcon(s) { return ({ top: '👕', pants: '👖', robe: '🧥', cape: '🧣', hat: '🎩', glasses: '🕶️', shield: '🛡️', acc: '💍' })[s] || '📦'; }
function statHtml(st) { const th = { def: 'DEF', atk: 'ATK', matk: 'MATK', mdef: 'MDEF', hp: 'HP', sp: 'SP', hpPct: 'HP%', spPct: 'SP%', crit: 'คริ', flee: 'FLEE', hit: 'HIT', aspd: 'ASPD', str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' }; return '<small>' + Object.entries(st).map(([k, v]) => `${th[k] || k} +${v}`).join(' · ') + '</small>'; }
function dropLine(m) {
  const eq = (m.drops || []).slice(0, 4).map(([id, c]) => { const it = D.weapons.find((w) => w.id === id) || D.armors.find((a) => a.id === id); return it ? `${esc(it.n)} ${pct(c)}` : null; }).filter(Boolean);
  const mats = (m.mats || []).slice(0, 3).map(([id, c]) => { const mt = D.materials.find((x) => x.id === id); return mt ? `${esc(mt.n)} ${pct(c)}` : null; }).filter(Boolean);
  return (eq.length || mats.length) ? `<small style="color:var(--tx2)">🎁 ${eq.concat(mats).join(' · ')}${(m.drops || []).length > 4 ? ' …' : ''}</small>` : '';
}
function bindDbFilters() {
  const fWt = $('#fWt'), fEl = $('#fEl'), fSort = $('#fSort'), fKind = $('#fKind'), fBoss = $('#fBoss'), fReg = $('#fReg');
  if (fWt) fWt.onchange = () => { dbState.wt = fWt.value; renderDb(); };
  if (fEl) fEl.onchange = () => { dbState.el = fEl.value; renderDb(); };
  if (fSort) fSort.onchange = () => { dbState.sort = fSort.value; renderDb(); };
  if (fKind) fKind.onchange = () => { dbState.kind = fKind.value; renderDb(); };
  if (fBoss) fBoss.onchange = () => { dbState.kind = fBoss.checked ? 'boss' : ''; renderDb(); };
  if (fReg) fReg.onchange = () => { dbState.reg = fReg.value; renderDb(); };
}

/* ---------- เปรียบเทียบอาวุธ (⚖️) ---------- */
const cmpSet = new Set();
function wskLine(w) {
  return (w.wsk || []).map((b) => `<br><small style="color:var(--pur)">⭐ ${esc(D.skillNames[b[0]]?.n || b[0])}${(JOB[b[1]]) ? ' (' + esc(JOB[b[1]].n) + ')' : ''} +${b[2]}%</small>`).join('');
}
function cmpBtn(w) { return `<button class="cmpbtn ${cmpSet.has(w.id) ? 'on' : ''}" data-cmp="${w.id}" title="ใส่ตะกร้าเปรียบเทียบ">⚖️</button>`; }
function renderCmpBar() {
  const bar = $('#cmpbar');
  if (!cmpSet.size) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.innerHTML = `<span class="cmpt">⚖️ เปรียบเทียบ (${cmpSet.size}/4):</span>` +
    [...cmpSet].map((id) => { const w = D.weapons.find((x) => x.id === id); return `<span class="chip">${WTICON[w.wt] || ''} ${esc(w.n)} <button class="cmpx" data-cmpx="${id}">✕</button></span>`; }).join('') +
    `<button class="btn btn--sm" id="cmpOpen">เปรียบเทียบเลย</button><button class="btn btn--sm btn--ghost" id="cmpClear">ล้าง</button>`;
  $('#cmpOpen').onclick = () => showCompare();
  $('#cmpClear').onclick = () => { cmpSet.clear(); renderCmpBar(); $$('[data-cmp]').forEach((b) => b.classList.remove('on')); };
  $$('.cmpx', bar).forEach((b) => b.onclick = () => { cmpSet.delete(b.dataset.cmpx); renderCmpBar(); $$(`[data-cmp="${b.dataset.cmpx}"]`).forEach((x) => x.classList.remove('on')); });
}
function srcText(w) {
  if (!w.src) return 'ยังไม่ระบุ (คราฟต์ที่เตาหลอม — ดูแท็บตีเหล็ก/คราฟต์)';
  if (w.src.kind === 'g') return '🎁 กาชา / ร้าน';
  const m = MON[w.src.mon]; if (!m) return 'ยังไม่ระบุ';
  return `${m.boss ? '👑 บอส' : '🎮 มอน'} ${m.n} · ${pct(w.src.chance)} · ${m.maps.map((mid) => MAP[mid]?.n || mid).join(' / ')}`;
}
function showCompare() {
  const ws = [...cmpSet].map((id) => D.weapons.find((x) => x.id === id)).filter(Boolean);
  if (!ws.length) return;
  const bestAtk = Math.max(...ws.map((w) => w.atk));
  const row = (label, cells, cls) => `<tr${cls ? ' class="' + cls + '"' : ''}><th>${label}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  const wskCell = (w) => (w.wsk || []).map((b) => `${esc(D.skillNames[b[0]]?.n || b[0])} (${esc((JOB[b[1]] || {}).n || '')}) +${b[2]}%`).join('<br>') || '–';
  const warn = ws.length > 1 && new Set(ws.map((w) => w.wt)).size > 1 ? '<p class="hint" style="margin:8px 0">⚠️ คุณเลือกอาวุธต่างประเภท — เปรียบเทียบเทียบเท่าควรใช้ประเภทเดียวกัน (เช่น ดาบคราฟ vs ดาบบอส)</p>' : '';
  $('#modalBody').innerHTML = `<h2>⚖️ เปรียบเทียบอาวุธ</h2>${warn}
    <table class="src cmptbl"><tbody>
    ${row('ชื่อ', ws.map((w) => `<b>${WTICON[w.wt] || ''} ${esc(w.n)}</b>`))}
    ${row('ประเภท', ws.map((w) => esc(WT(w.wt))))}
    ${row('เลเวลที่ใช้', ws.map((w) => 'Lv ' + w.lv))}
    ${row('เกรด / คลาส', ws.map((w) => (w.g ? 'เกรด ' + w.g : '–') + ' / ' + (w.k || '–')))}
    ${row('ความหายาก', ws.map((w) => rTag(w.r)))}
    ${row('ATK', ws.map((w) => w.atk === bestAtk ? `<b style="color:var(--grn)">${w.atk} ◀ สูงสุด</b>` : w.atk))}
    ${row('ธาตุ', ws.map((w) => elTag(w.el)))}
    ${row('คุณสมบัติพิเศษ', ws.map((w) => w.ab ? esc(w.ab) : '–'))}
    ${row('เสริมสกิล', ws.map(wskCell))}
    ${row('แหล่งที่ได้', ws.map((w) => esc(srcText(w))))}
    </tbody></table>
    <p class="note">ทริค: ดาบคราฟมักตีได้เองและ ATK ดีกว่าเกรดเดียวกัน, ดาบบอส/ดรอปมักมีคุณสมบัติพิเศษ+เสริมสกิลเด่น — เลือกตามงบและเป้าหมาย</p>`;
  $('#modal').hidden = false;
}

/* ---------- item detail modal ---------- */
function closeModal() { $('#modal').hidden = true; }
$('#modalX').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('click', (e) => {
  const cb = e.target.closest('[data-cmp]');
  if (cb) {
    e.stopPropagation();
    const id = cb.dataset.cmp;
    if (cmpSet.has(id)) cmpSet.delete(id); else if (cmpSet.size < 4) cmpSet.add(id);
    cb.classList.toggle('on', cmpSet.has(id));
    renderCmpBar();
    return;
  }
  const c = e.target.closest('[data-item]');
  if (c) openModal(c.dataset.item);
});
function openModal(id) {
  const B = $('#modalBody');
  if (id.startsWith('mat:')) {
    const mid = id.slice(4);
    const mt = D.materials.find((x) => x.id === mid);
    if (mt) {
      const droppers = [];
      for (const m of D.monsters) {
        const d = (m.mats || []).find((x) => x[0] === mid);
        if (d) droppers.push({ m, chance: d[1] });
      }
      droppers.sort((a, b) => b.chance - a.chance);
      const usedIn = [];
      D.craft.forEach((c) => c.list.forEach((x) => { if ((x.mats || []).some((m2) => m2.id === mid)) usedIn.push(x.n); }));
      const best = droppers.length ? droppers[0].chance : 0;
      $('#modalBody').innerHTML = `<h2>${aiHtml('mats', mid, 40) || ''} ${esc(mt.n)}</h2>
        <div class="kv">
          <dt>รายละเอียด</dt><dd>${esc(mt.d) || '–'}</dd>
          <dt>ราคาขาย</dt><dd>${mt.p ? mt.p.toLocaleString() + ' เหรียญ' : '–'}${mt.rare ? ' · หายาก' : ''}</dd>
          <dt>วิธีหา</dt><dd>${esc(mt.from) || '–'}</dd>
          <dt>มอนที่ดรอป</dt><dd>${droppers.map((d) => `${d.chance === best && best > 0 ? '⭐ ' : ''}${esc(d.m.n)} (Lv${d.m.lv}) · ${pct(d.chance)} · 📍 ${d.m.maps.map((m2) => esc(MAP[m2]?.n || m2) + ' (' + esc(MAP[m2]?.regionN || '') + ')').join(' / ')}`).join('<br>') || '– (ได้จากสกิลชีวิต/เหมืองตาม "วิธีหา")'}</dd>
          <dt>ใช้ทำ</dt><dd>${usedIn.map(esc).join(' · ') || '–'}</dd>
        </div>`;
    }
  } else if (id.startsWith('sk:')) {
    const sid = id.slice(3);
    let sk = null, fromJob = null;
    for (const j2 of D.jobs) { const f = (j2.sk || []).find((x) => x.id === sid); if (f) { sk = f; fromJob = j2; break; } }
    if (sk) {
      const rec = recommendRunes(sk);
      const wskW = D.weapons.filter((x) => x.wsk && x.wsk.some((b) => b[0] === sid && b[1] === cur.job.id)).sort((a, b) => b.lv - a.lv);
      $('#modalBody').innerHTML = `<h2>${aiHtml('skills', sk.icon, 44) || ''} ${esc(sk.n)}</h2>
        <div class="kv">
          <dt>อาชีพ</dt><dd>${esc(fromJob.n)} · ${sk.active ? 'ใช้งาน' : 'พาสซีฟ'} · เลเวลสูงสุด ${sk.max}${sk.cd ? ' · CD ' + sk.cd + 's' : ''}${sk.sp ? ' · SP ' + sk.sp : ''}</dd>
          ${sk.el ? `<dt>ธาตุ</dt><dd>${elTag(sk.el)}</dd>` : ''}
          <dt>รายละเอียด</dt><dd>${esc(sk.d)}</dd>
          <dt>รูนแนะนำ</dt><dd>${rec.map(runeChipHtml).join(' ')}</dd>
        </div>
        <h3 style="margin-top:12px">อาวุธที่เสริมสกิลนี้${wskW.length ? ` (${wskW.length} ชิ้น — กดดูแหล่งดรอป)` : ''}</h3>
        ${wskW.slice(0, 8).map((x) => wepCard(x, x.wsk.find((b) => b[0] === sid && b[1] === cur.job.id))).join('') || '<p class="hint">ยังไม่มีอาวุธที่เสริมสกิลนี้โดยตรง</p>'}`;
    }
  } else if (id.startsWith('runeS2:')) {
    const name = id.slice(7);
    const info = RUNE_INFO[name];
    $('#modalBody').innerHTML = `<h2>🧿 รูน${esc(name)}</h2>
      <div class="kv">
        <dt>ประเภท</dt><dd>รูนซีซัน 2${info && info.el ? ' · ธาตุ ' + esc(info.el) : ''}</dd>
        <dt>ผล (I/II/III)</dt><dd>${info ? esc(info.d) : '–'}</dd>
        <dt>ใส่ได้กับ</dt><dd>สกิลทุกชนิดที่มีช่องรูน (ช่อง 1 เปิดที่ครึ่งหนึ่งของเลเวลสูงสุดของสกิล, ช่อง 2 ที่เลเวลสูงสุด · ตีปกติเปิดที่ Lv 40 และ 70)</dd>
        <dt>แหล่งที่ได้</dt><dd>รูนซีซัน 2 นี้ไม่มีข้อมูลมอนที่ดรอปโดยตรงในวิกิ — ได้จากการหลอมวัสดุรูน (bl_rune_*) จากบอส/เหมืองตามระบบสกิลชีวิตและดันเจี้ยนลึก · ดูรายละเอียดในแท็บ "ตีบวก & ออฟ"</dd>
      </div>
      <p class="note">กติกา: ทุกอย่างที่รูนเพิ่มรวมกันได้สูงสุด +50% ต่อการโจมตี · ถอดรูนออกฟรี</p>`;
  } else if (id.startsWith('rune:')) {
    const r = D.runes.find((x) => x.id === id.slice(5));
    B.innerHTML = `<h2>🃏 รูน${esc(r.n.replace(/^รูน/, ''))}</h2><table class="src"><tr><th>มอนที่ดรอป</th><th>เลเวล</th><th>โอกาส</th><th>แมพ · เขต</th></tr>${r.droppers.map((d) => d.maps.map((m, i) => `<tr>${i === 0 ? `<td rowspan="${d.maps.length}">${esc(d.monN)}</td><td rowspan="${d.maps.length}">${d.lv}</td><td rowspan="${d.maps.length}">${pct(d.chance)}</td>` : ''}<td>${esc(m.n)} · ${esc(m.region)}</td></tr>`).join('')).join('')}</table>`;
  } else if (id.startsWith('set:')) {
    const s = D.sets.find((x) => x.id === id.slice(4));
    B.innerHTML = `<h2>${esc(s.n)}</h2><div class="pcs-icons">${s.pcs.map((p) => `<span class="pcic" title="${esc(p.n)}">${pieceIcon(p.id, 40)}</span>`).join('')}</div><div class="kv"><dt>สาย</dt><dd>${LINE_TH[s.line] || s.line} · Lv ${s.lv}</dd><dt>ชิ้นส่วน</dt><dd>${s.pcs.map((p) => esc(p.n)).join(' + ')}</dd><dt>โบนัส 2 ชิ้น</dt><dd>${esc(s.b2)}</dd><dt>โบนัส 3 ชิ้น</dt><dd>${esc(s.b3)}</dd><dt>พาสซีฟเซ็ตเต็ม</dt><dd>${esc(s.pas) || '–'}</dd></div>${setSrcTable(s)}`;
  } else {
    const w = D.weapons.find((x) => x.id === id), a = w ? null : D.armors.find((x) => x.id === id), m = MON[id], mp = MAP[id];
    if (w) {
      const wsk = (w.wsk || []).map((b) => `<div>${esc(D.skillNames[b[0]]?.n || b[0])} (อาชีพ ${esc((JOB[b[1]] || {}).n || b[1])}) <b style="color:var(--pur)">+${b[2]}%</b></div>`).join('');
      B.innerHTML = `<h2>${aiHtml('items', w.id, 48) || ''} ${esc(w.n)}</h2><div class="kv">
        <dt>ประเภท</dt><dd>${WT(w.wt)} · ${w.d ? esc(w.d) : ''}</dd>
        <dt>เลเวล</dt><dd>Lv ${w.lv}${w.g ? ' · เกรด ' + w.g : ''}${w.k ? ' · คลาส ' + kTag(w.k) : ''}</dd>
        <dt>ความหายาก</dt><dd>${rTag(w.r)}</dd>
        <dt>ATK</dt><dd>${w.atk}</dd>
        <dt>ธาตุ</dt><dd>${elTag(w.el)}</dd>
        ${w.ab ? `<dt>คุณสมบัติพิเศษ</dt><dd>${esc(w.ab)}</dd>` : ''}
        ${wsk ? `<dt>เสริมสกิล</dt><dd>${wsk}</dd>` : ''}
        <dt>แหล่งดรอป</dt><dd>${w.src ? (w.src.kind === 'g' ? '🎁 กาชา/ร้าน' : `${esc(MON[w.src.mon]?.n || w.src.mon)}${MON[w.src.mon]?.boss ? ' 👑' : ''} · โอกาส ${pct(w.src.chance)}<br>📍 ${MON[w.src.mon].maps.map((mid) => `${esc(MAP[mid]?.n || mid)} (${esc(MAP[mid]?.regionN || '')})`).join(' / ')}`) : 'ยังไม่ระบุ'}</dd>
      </div>`;
    } else if (a) {
      B.innerHTML = `<h2>${slotIcon(a.s)} ${aiHtml('items', a.id, 44) || ''} ${esc(a.n)}</h2><div class="kv">
        <dt>ช่องสวมใส่</dt><dd>${slotTh(a.s)} · Lv ${a.lv}</dd>
        <dt>ความหายาก</dt><dd>${rTag(a.r)}</dd>
        ${a.d ? `<dt>รายละเอียด</dt><dd>${esc(a.d)}</dd>` : ''}
        <dt>สเตตัส</dt><dd>${Object.keys(a.st).length ? statHtml(a.st) : '–'}</dd>
        ${a.ab ? `<dt>คุณสมบัติพิเศษ</dt><dd>${esc(a.ab)}</dd>` : ''}
        <dt>ชุด</dt><dd>${a.set ? esc((D.sets.find((s) => s.id === a.set) || {}).n || a.set) : 'ไม่อยู่ในชุด'}</dd>
        <dt>แหล่งดรอป</dt><dd>${a.src ? (a.src.kind === 'g' ? '🎁 กาชา/ร้าน' : `${esc(MON[a.src.mon]?.n || '')} · ${pct(a.src.chance)}`) : 'ยังไม่ระบุ'}</dd>
      </div>`;
    } else if (m) {
      B.innerHTML = `<h2>${aiHtml('mons', m.id, 48) || (m.boss ? '👑' : ELICON[m.el])} ${esc(m.n)}</h2><div class="kv">
        <dt>เลเวล</dt><dd>${m.lv}</dd><dt>ธาตุ</dt><dd>${elTag(m.el)} (โจมตี ${EL.th(m.atkEl)})</dd>
        <dt>เผ่า</dt><dd>${(D.races && D.races[m.race]) || m.race}${m.boss ? ' · บอส' : ''}</dd>
        <dt>สถานะ</dt><dd>HP ${m.hp} · ATK ${m.atk[0]}–${m.atk[1]} · DEF ${m.def} · MDEF ${m.mdef} · HIT ${m.hit} · FLEE ${m.flee}</dd>
        <dt>รางวัล</dt><dd>EXP ${m.exp} · JEXP ${m.jexp}</dd>
        <dt>แมพ</dt><dd>${m.maps.map((mid) => `${esc(MAP[mid]?.n || mid)} (${esc(MAP[mid]?.regionN || '')})`).join(' / ')}</dd>
        <dt>ไอเทมดรอป</dt><dd>${(m.drops || []).map(([iid, c]) => { const it = D.weapons.find((x) => x.id === iid) || D.armors.find((x) => x.id === iid); return it ? esc(it.n) + ' ' + pct(c) : ''; }).filter(Boolean).join('<br>') || '–'}</dd>
        <dt>วัสดุ</dt><dd>${(m.mats || []).map(([mid2, c]) => { const mt = D.materials.find((x) => x.id === mid2); return mt ? esc(mt.n) + ' ' + pct(c) : ''; }).filter(Boolean).join('<br>') || '–'}</dd>
        ${m.rune ? `<dt>รูน</dt><dd>${esc((D.runes.find((r) => r.id === m.rune[0]) || {}).n || '')} ${pct(m.rune[1])}</dd>` : ''}
      </div>`;
    } else if (mp) {
      B.innerHTML = `<h2>🗺️ ${esc(mp.n)}</h2><div class="kv">
        <dt>เขต</dt><dd>${esc(mp.regionN)}</dd><dt>ช่วงเลเวล</dt><dd>${esc(mp.lvText)}</dd>
        <dt>ประเภท</dt><dd>${mp.kind === 'dungeon' ? 'ดันเจี้ยน' : mp.kind === 'camp' ? 'แคมป์ (ปลอดภัย)' : 'สนาม'}${mp.secret ? ' · ดันเจี้ยนลับ' : ''}</dd>
        ${mp.zones.length ? `<dt>โซนย่อย</dt><dd>${mp.zones.map(esc).join(' · ')}</dd>` : ''}
        <dt>มอน</dt><dd>${mp.mons.map((mn) => `${ELICON[mn.el]} ${esc(mn.n)} <small>Lv${mn.lv}–${mn.lvMax}</small>`).join('<br>')}</dd>
      </div>`;
    }
  }
  $('#modal').hidden = false;
}

/* ════════════════════════ PAGE 2.5 · ตีบวก & ออฟ ════════════════════════ */
let forgeTab = 'howto';
let forgeOptPool = '', forgeCraftType = '';
const forgeQ = $('#forgeQ'), forgeFilters = $('#forgeFilters'), forgeBox = $('#forgeBox');
$('#forgeTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; forgeTab = b.dataset.tab; $$('#forgeTabs button').forEach((x) => x.classList.toggle('on', x === b)); renderForge(); });
forgeQ.addEventListener('input', renderForge);

const GRADE_TH = ['เกรด 1', 'เกรด 2', 'เกรด 3', 'เกรด 4'];
function matChip(mid, label) {
  const mt = D.materials.find((x) => x.id === mid);
  if (!mt && !label) return '';
  return `<span class="pill matlink" data-item="mat:${mid}" style="cursor:pointer" title="กดดูแหล่งที่ได้">${aiHtml('mats', mid, 20) || '🧪'} ${esc(label || (mt ? mt.n : mid))}</span>`;
}
function matDroppers(mid, topN) {
  const out = [];
  for (const m of D.monsters) {
    const d = (m.mats || []).find((x) => x[0] === mid);
    if (d) out.push({ m, chance: d[1] });
  }
  return out.sort((a, b) => b.chance - a.chance).slice(0, topN || 5);
}
const pieceIcon = (pid, size = 34) => (pid.startsWith('hat') ? (aiHat(pid, size) || aiHtml('items', pid, size)) : (aiHtml('items', pid, size) || '📦'));
function renderForge() {
  const q = forgeQ.value.trim();
  if (forgeTab === 'howto') {
    forgeFilters.innerHTML = '';
    /* ขั้นที่ 1: วัสดุจากมอนช่วงต้น — ดึงจากสูตรคราฟเกรด 1 */
    const starterMats = new Set();
    D.craft.forEach((c) => c.list.filter((x) => x.g === 1).forEach((x) => Object.keys((D.weapons.find((w) => w.id === x.id) || {}).mats || {})));
    D.craft.forEach((c) => c.list.forEach((x) => { if (x.g === 1) Object.entries(x.mats || {}).forEach(([mid]) => starterMats.add(mid)); }));
    const matDroppers = (mid) => {
      const out = [];
      for (const m of D.monsters) {
        const d = (m.mats || []).find((x) => x[0] === mid);
        if (d) out.push({ m, chance: d[1] });
      }
      return out.sort((a, b) => a.m.lv - b.m.lv).slice(0, 3);
    };
    const matRows = [...starterMats].slice(0, 10).map((mid) => {
      const mt = D.materials.find((x) => x.id === mid); if (!mt) return '';
      const dr = matDroppers(mid);
      return `<tr><td><span class="lk matlink" data-item="mat:${mid}" style="cursor:pointer" title="กดดูแหล่งที่ได้">${aiHtml('mats', mid, 20) || '🧪'} ${esc(mt.n)} 🔍</span></td><td><small>${esc(mt.from || '–')}</small></td><td>${dr.map((d) => `🎮 ${esc(d.m.n)} (Lv${d.m.lv}) · ${pct(d.chance)} · <small>${d.m.maps.map((mid2) => esc(MAP[mid2]?.n || mid2)).join('/')}</small>`).join('<br>')}</td></tr>`;
    }).join('');
    /* ขั้นที่ 2: แร่/ไม้จากสกิลชีวิต */
    const ores = D.smelt.filter((s2) => s2.from).map((s2) => {
      const oreMat = D.materials.find((x) => x.id === s2.from);
      return { good: s2, oreN: oreMat ? oreMat.n : s2.from, fromText: oreMat ? (oreMat.from || '') : '' };
    }).filter((x) => x.fromText);
    /* ขั้นที่ 4: หินออฟ — แหล่ง */
    forgeBox.innerHTML = `
      <div class="card" style="margin-bottom:12px"><b>🧭 ภาพรวม: เส้นทางทำอุปกรณ์ตั้งแต่เริ่มเกม</b>
      <div class="bonus" style="margin-top:6px">① ฟาร์มมอนตามเลเวล → ได้ <b>เหรียญ + วัสดุมอน + อุปกรณ์ดรอป</b> · ② เปิด<b>สกิลชีวิต</b> (H) ขุดแร่/ตัดไม้ → แร่/ไม้ · ③ เอาแร่/ไม้ไป<b>หลอม</b>ที่เตาหลอมเป็นแท่ง/แผ่น · ④ ใช้ใบสั่งงาน<b>คราฟอาวุธ</b>ที่เตาตีเหล็ก (Y) · ⑤ เอาของไหนก็ได้ไป<b>ตีบวก</b>กับป๋าหมูหริ่ง · ⑥ สุ่ม<b>แถวออฟ</b>ด้วยหินออฟชั่น · ⑦ ของดรอปอาจเป็น<b>ของแปดเปื้อน</b> (1 ใน 50)</div></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 1 · วัสดุจากมอน (ช่วงต้นเกม)</h3>
      <p class="hint">มอนทุกตัวดรอปวัสดุของตัวเอง — ตารางนี้คือวัสดุที่สูตรคราฟเกรด 1 ใช้ (กดชื่อดูแหล่งเต็ม)</p>
      <table class="src"><tr><th>วัสดุ</th><th>วิธีหา</th><th>มอนที่ดรอป (เรียงตามเลเวล)</th></tr>${matRows}</table></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 2 · แร่ & ไม้จากสกิลชีวิต (ขุดเหมือง / ตัดไม้)</h3>
      <table class="src"><tr><th>หลอมเป็น</th><th>แร่/ไม้ดิบ</th><th>แหล่งเก็บ</th></tr>
      ${ores.map((o) => `<tr><td><b>${esc(o.good.n)}</b></td><td>${esc(o.oreN)}</td><td>${esc(o.fromText)}</td></tr>`).join('')}</table>
      <p class="note">แมพเหมือง: เหมืองริมทุ่ง F1–3 (แร่เหล็ก) · เหมือนเงินลึก B4–B5 (แร่เงิน/เงินจันทร์) · เหมืองอุกกาบาต F1–7 (แร่ดาวตก — ใช้ตีบวกเกรด 4) · แร่อื่น ๆ อยู่ในดันเจี้ยนตามข้อความข้างบน</p></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 3 · หลอม & คราฟ</h3>
      <div class="bonus">เอาแร่/ไม้ไป<b>เตาหลอม</b> (แท็บตีเหล็ก/คราฟด้านบน — แต่ละแท่งมีสูตรระบุในคำอธิบาย) แล้วใช้<b>ใบสั่งงาน</b>สั่งตีอาวุธที่ต้องการ — ดูสูตรครบทุกประเภทในแท็บ "ตีเหล็ก / คราฟต์"</div></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 4 · ตีบวก +10</h3>
      <div class="bonus">ไปหา<b>ป๋าหมูหริ่ง</b> ใช้เหรียญตามตาราง + วัสดุแท่งตามชนิดของชิ้น (ดูแท็บ "ตีบวก +10") · อาวุธแต่ละเลเวล ATK +4% · ที่ <b>+9/+10</b> พลาดมีโอกาสแตก — เปิด<b>หินกันแตก</b> (หลอมจาก<b>แกนดาว ×1 + แท่งดาว ×2</b>) ก่อนตี</div></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 5 · สุ่มแถวออฟ</h3>
      <div class="bonus">อุปกรณ์ดรอปมาพร้อมแถวออฟอยู่แล้ว · จะ<b>เจาะสุ่มใหม่</b>ที่ป๋าหมูหริ่ง: 6,000,000 เหรียญ + หินเจาะออฟ · <b>หินออฟ</b>ดรอปจากมอน 0.01% (เฉพาะมอนห่างเลเวลไม่เกิน 10) · บอส <b>8%</b> · หีบ <b>1.5%</b> · แบบผูกตัวได้จากภารกิจมือใหม่/เช็กอินรายวัน/หีบรายสัปดาห์ · หินเจาะจากมอน Lv50+ 0.0001% · บอส 0.2% · หีบทอง 0.5%</div></div>
      <div class="card setc" style="margin-bottom:10px"><h3>ขั้นที่ 6 · ของแปดเปื้อน & รูน</h3>
      <div class="bonus">ของที่ดรอปมีโอกาส <b>2% (1 ใน 50)</b> เป็นของแปดเปื้อน (☾) — เด่นแต่มีข้อเสีย ดูรายการในแท็บ "ของแปดเปื้อน" · ส่วน<b>รูนสกิล</b>ดรอปจากมอน (กดรูนในหน้าคู่มืออาชีพเพื่อดูว่ามอนไหนดรอป)</div></div>`;
  } else if (forgeTab === 'refine') {
    forgeFilters.innerHTML = '';
    const rates = D.refine.rates, cost = D.refine.cost;
    let html = `<div class="card" style="margin-bottom:12px"><b>กฎการตีบวก</b> (ซีซัน 2)
      <div class="bonus" style="margin-top:6px">ป๋าหมูหริ่งตีบวกอาวุธ/เกราะ/หมวก/เครื่องประดับจาก +1 ถึง +10 · อาวุธแต่ละเลเวล ATK +4% (+40% ที่ +10) · เกราะ/หมวกได้ DEF +1 ทุกสองเลเวล และ HP +0.5% ต่อเลเวล · ไม่มีขั้นการันตีแล้ว พลาดเสียแค่ค่าตี · <b>+9/+10</b> พลาดแล้วขั้นลดลง 1 และมีโอกาส <b>${D.refine.brk['9']}% / ${D.refine.brk['10']}%</b> ที่ชิ้นจะแตก (เปิดใช้<b>หินกันแตก</b> — หลอมจากแกนดาว ×1 + แท่งดาว ×2 — เพื่อกันแตก) · อาวุธเรืองแสง: +5 ประกาย, +7 น้ำเงิน, +8 ม่วง, +9 ส้มทอง, +10 สายรุ้ง</div></div>`;
    if (q) html += `<p class="hint">ค้นหา "${esc(q)}" — แสดงเฉพาะวัสดุที่ตรง</p>`;
    html += `<div class="card" style="margin-bottom:10px"><b>🧪 วัสดุที่ใช้ (กดดูแหล่งดรอป — มอนที่ดรอปได้จะติด ⭐ ที่โอกาสสูงสุด)</b><div style="margin-top:6px">
      ${matChip('lc_quench_oil')}${matChip('mat_safety')}${matChip('lc_starcore')}${matChip('lc_ingot_star')}${matChip('mat_aurelion_core')}</div></div>`;
    html += `<h3>โอกาสสำเร็จ (%)</h3><table class="src"><tr><th>ขั้น</th><th>${GRADE_TH.join('</th><th>')}</th></tr>`;
    for (let s = 1; s <= 10; s++) html += `<tr><td><b>+${s}</b></td>${[1, 2, 3, 4].map((g) => `<td>${rates[g][s]}%</td>`).join('')}</tr>`;
    html += '</table>';
    html += `<h3 style="margin-top:14px">ค่าเหรียญต่อการตี (เหรียญ, ต่อครั้ง)</h3><table class="src"><tr><th>ขั้น</th><th>${GRADE_TH.join('</th><th>')}</th></tr>`;
    for (let s = 0; s < 10; s++) html += `<tr><td><b>+${s + 1}</b></td>${[1, 2, 3, 4].map((g) => `<td>${cost[g][s].toLocaleString()}</td>`).join('')}</tr>`;
    html += '</table>';
    html += `<h3 style="margin-top:14px">วัสดุที่ใช้ตี (ต่อครั้ง)</h3>`;
    for (const [kind, k] of Object.entries(D.refine.kinds)) {
      const mats = [...new Set(k.grades.flat(2).map((m) => m.mat))];
      if (q && !matches(q, k.n, k.item, mats.join(' '))) continue;
      html += `<div class="card setc" style="margin-bottom:10px"><h3>${esc(k.n)}</h3><table class="src"><tr><th>เกรด</th><th>ขั้น +1 → +10 (วัสดุต่อครั้ง)</th></tr>`;
      k.grades.forEach((grade, gi2) => {
        const brief = grade.map((step, i2) => '+(' + (i2 + 1) + '): ' + step.map((m) => matChip(m.id, m.mat) + '×' + m.q).join(' + ')).join(' · ');
        html += `<tr><td>${GRADE_TH[gi2]}</td><td>${brief}</td></tr>`;
      });
      html += `</table></div>`;
    }
    // แหล่งที่ได้ของแร่/วัสดุตีบวก (ขุดเหมือง · ตัดไม้ · มอน)
    const srcs = D.smelt.filter((s2) => s2.from && matches(q, s2.n, s2.from)).map((s2) => {
      const oreMat = D.materials.find((x) => x.id === s2.from);
      const fromText = oreMat ? (oreMat.from || '') : '';
      const droppers = [];
      for (const m of D.monsters) {
        const d = (m.mats || []).find((x) => x[0] === s2.from);
        if (d) droppers.push({ m, chance: d[1] });
      }
      return { good: s2, oreN: oreMat ? oreMat.n : s2.from, fromText, droppers: droppers.sort((a, b) => a.m.lv - b.m.lv).slice(0, 4) };
    });
    if (srcs.length) {
      html += `<h3 style="margin-top:14px">📍 แหล่งที่ได้แร่/วัสดุตีบวก (ขุดเหมือง · ตัดไม้ · มอน — มอนที่ดรอปเยอะสุดติด ⭐)</h3>
        <table class="src"><tr><th>วัสดุหลอม</th><th>แร่ดิบ</th><th>แหล่งที่ได้</th></tr>`;
      for (const { good, oreN, fromText, droppers } of srcs) {
        const best = droppers.length ? Math.max(...droppers.map((d) => d.chance)) : 0;
        const monHtml = droppers.length ? '<br>' + droppers.map((d) => `${(d.chance === best ? '⭐ ' : '')}🎮 ${esc(d.m.n)} (Lv${d.m.lv}) · ${pct(d.chance)} · <small>${d.m.maps.map((mid) => esc(MAP[mid]?.n || mid)).join('/')}</small>`).join('<br>') : '';
        html += `<tr><td>${matChip(good.from, good.n)}</td><td>${matChip(good.from, oreN)}</td><td>${fromText ? esc(fromText) : '–'}${monHtml}</td></tr>`;
      }
      html += `</table>
      <p class="note">หมายเหตุ: แท่งดาว = หลอมจาก "แร่ดาวตก" ที่ขุดได้จากเหมืองอุกกาบาต (Meteor Shaft F1–7) และดันเจี้ยน Lv85+ · แกนดาว (ทำหินกันแตก) ได้จากดันเจี้ยนลึก/บอสตามข้อมูลวิกิ</p>`;
    }
    forgeBox.innerHTML = html;
  } else if (forgeTab === 'opts') {
    forgeFilters.innerHTML = `<label class="sel"><span>สวมได้ที่</span><select id="foPool"><option value="">ทั้งหมด</option>${['อาวุธ', 'ชุดบน-ล่าง', 'หมวก', 'เครื่องประดับ'].map((p) => `<option value="${p}" ${forgeOptPool === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>`;
    $('#foPool').onchange = (e) => { forgeOptPool = e.target.value; renderForge(); };
    const pool = forgeOptPool;
    const list = D.opts.filter((o) => (!pool || o.on.includes(pool)) && matches(q, o.label, o.id, o.subs.join(' ')));
    const GROUP_TH = { atk: 'โจมตี', skill: 'สกิล', def: 'ป้องกัน', special: 'พิเศษ (ดรอปเท่านั้น)' };
    const byGroup = {};
    list.forEach((o) => { (byGroup[o.g || 'atk'] = byGroup[o.g || 'atk'] || []).push(o); });
    forgeBox.innerHTML = `<div class="card" style="margin-bottom:12px"><b>กฎแถวออฟ</b>
      <div class="bonus" style="margin-top:6px">อุปกรณ์ทุกชิ้นดรอปพร้อมแถวออฟ: อาวุธ <b>1/2/2/3</b> แถวตามเกรด · เสื้อกับกางเกง <b>1/1/2/2</b> · หมวกกับเครื่องประดับ <b>1</b> (ชิ้นจากบอสเพิ่มอีก 1) · แต่ละแถวสุ่มขั้น: <b>ธรรมดา 60% · ดี 30% · เทพ 10%</b> · ซีซัน 2 ลดค่าทุกแถวลงครึ่งหนึ่ง และจำกัดแถวสเตตัสไว้ที่ +10 ต่อแถว (FLEE 50, ร่าย 30%, ดาเมจคริ 100%) · ชิ้นหนึ่งมีได้สูงสุด <b>4 แถว</b> และชนิดเดียวกันได้ไม่เกิน <b>2</b></div>
      <div class="bonus" style="margin-top:6px"><b>🧪 วัสดุที่ใช้ (กดดูแหล่งดรอป — ⭐ = มอนที่โอกาสดรอปสูงสุด):</b> ${matChip('mat_opt_stone')}${matChip('mat_drill_stone')}${matChip('mat_opt_stone_b')}</div></div>
      <table class="src"><tr><th>แถวออฟ</th><th>ธรรมดา (60%)</th><th>ดี (30%)</th><th>เทพ (10%)</th><th>เพดาน</th><th>เปิดที่</th></tr>
      ${Object.entries(byGroup).map(([g, arr]) => `<tr><td colspan="6" style="color:var(--acc);font-weight:700">${GROUP_TH[g] || g}</td></tr>` + arr.map((o) =>
        `<tr><td><b>${esc(o.label)}</b>${o.unit === '%' ? ' <small>%</small>' : ''}${o.subs.length ? `<br><small>${esc(o.subs.join(' / '))}</small>` : ''}</td>${o.tiers.map((tv) => `<td>${tv[0] === tv[1] ? tv[0] : tv[0] + '–' + tv[1]}${o.unit}</td>`).join('')}<td>${o.cap ? (o.cap > 1 ? o.cap + o.unit : (o.cap * 100) + '%') : '–'}</td><td>${o.on.map(esc).join(', ')}</td></tr>`).join('')).join('')}</table>
      <div class="card" style="margin-top:14px"><b>เจาะและสุ่มใหม่</b>
        <div class="bonus" style="margin-top:6px">ป๋าหมูหริ่งเจาะแถวใหม่ให้ทุกชิ้น ราคา <b>6,000,000</b> เหรียญ + หินเจาะออฟ · ล็อกแถว 0/1/2/3 ใช้หิน <b>2/4/6/8</b> ก้อน + เหรียญ <b>30,000/45,000/75,000/120,000</b> · หินแต่ละครั้งมีโอกาสล้มเหลว <b>20%</b> (เสียทั้งหินและเหรียญ) และไม่มีแถวไหนเปลี่ยน</div>
        <div class="bonus" style="margin-top:6px"><b>หินมาจากไหน:</b> หินออฟดรอปจากมอน <b>0.01%</b> (เฉพาะมอนที่เลเวลห่างไม่เกิน 10) · จากบอส <b>8%</b> · หีบ <b>1.5%</b> · หินเจาะจากมอน Lv50+ <b>0.0001%</b> · บอส <b>0.2%</b> · หีบทอง <b>0.5%</b> · หินออฟ (ผูกตัว) ได้จากภารกิจมือใหม่/เช็กอิน/หีบรายสัปดาห์</div>
        <div class="bonus" style="margin-top:6px"><b>ขัดเกรด:</b> 10,000 / 30,000 / 80,000 / 160,000 เหรียญ ตามเกรดของชิ้น · ร้านผู้เล่นขายชิ้นนั้นทั้งชิ้น (แถวออฟ ตีบวก ประกายแสงจันทร์ รอยแปดเปื้อน ชื่อผู้สร้าง ไปด้วย)</div>
      </div>`;
  } else if (forgeTab === 'taint') {
    forgeFilters.innerHTML = '';
    const list = D.traits.filter((t2) => matches(q, t2.n, t2.up, t2.dn));
    forgeBox.innerHTML = `<p class="card hint" style="margin-bottom:12px">ไอเทมที่ดรอปมีโอกาส <b>2% (1 ใน 50)</b> เป็น<b>ของแปดเปื้อน</b>: มีคุณสมบัติเด่น (ข้อดีแรง) พร้อมข้อเสียจริง แสดงบนชิ้นสีม่วงพร้อมเครื่องหมาย ☾ — แปดเปื้อนติดไปกับชิ้นนั้นตลอด (ในกระเป๋าและร้านค้า)<br><span style="color:var(--acc)">โอกาสรวม 2% ต่อชิ้นที่ดรอป · วิกิไม่ได้เปิดเผย % รายชนิดของคุณสมบัติ — ตารางด้านล่างจึงไม่มี % ต่อคุณสมบัติ</span><br><b style="color:var(--tx)">🧪 วัสดุที่ใช้: ไม่มี</b> — ของแปดเปื้อนได้จากการดรอปโดยตรงของมอนทุกตัว (ไม่ต้องคราฟ) · ขัดเกรดใหม่: 10,000 / 30,000 / 80,000 / 160,000 เหรียญตามเกรด</p>
      <table class="src"><tr><th>คุณสมบัติ</th><th>ข้อดี</th><th>ข้อเสีย</th></tr>
      ${list.map((t2) => `<tr><td><b>☾ ${esc(t2.n)}</b></td><td>${esc(t2.up)}</td><td style="color:var(--red)">${esc(t2.dn)}</td></tr>`).join('')}</table>`;
  } else if (forgeTab === 'craft') {
    forgeFilters.innerHTML = `<label class="sel"><span>ประเภทอาวุธ</span><select id="fcType"><option value="">ทั้งหมด</option>${D.craft.map((c) => `<option value="${c.t}" ${forgeCraftType === c.t ? 'selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>`;
    $('#fcType').onchange = (e) => { forgeCraftType = e.target.value; renderForge(); };
    const tsel = forgeCraftType;
    const list = D.craft.filter((c) => (!tsel || c.t === tsel) && matches(q, c.n, c.list.map((x) => x.n).join(' ')));
    forgeBox.innerHTML = `<p class="card hint" style="margin-bottom:12px">คราฟต์ที่<b>เตาหลอม</b>ด้วยใบสั่งงาน — ใช้วัสดุจากการฟาร์ม/เหมือง/สกิลชีวิต · แสดงคุณสมบัติครบของไอเทมที่คราฟได้ · กด ⚖️ ที่รายการเพื่อเปรียบเทียบกับดาบบอส/ดาบดรอปตัวอื่น</p>` +
      list.map((c) => `<div class="card setc"><h3>${esc(c.n)}</h3><table class="src"><tr><th>ไอเทม</th><th>เกรด</th><th>เหรียญ</th><th>วัสดุ</th><th>ATK</th><th>ธาตุ</th><th>คุณสมบัติ</th></tr>
        ${c.list.map((x) => { const w = D.weapons.find((z) => z.id === x.id); return `<tr><td><b>${esc(x.n)}</b>${w && w.wsk ? wskLine(w) : ''}</td><td>${x.g ? GRADE_TH[x.g - 1] : '–'}</td><td>${x.coins.toLocaleString()}</td><td>${x.mats.map((m) => matChip(m.id, m.n) + '×' + m.q).join(' + ')}</td><td>${w ? w.atk : '–'}</td><td>${w ? elTag(w.el) : '–'}</td><td>${w && w.ab ? esc(w.ab) : '–'} ${w ? cmpBtn(w) : ''}</td></tr>`; }).join('')}</table></div>`).join('') || '<p class="hint">ไม่พบสูตร</p>';
  }
}

/* ════════════════════════ PAGE 3.5 · จำลอง build ตัวละคร ════════════════════════ */
const B = {
  job: 'firemage', lv: 50, jlv: 50, spPerLv: 5, gender: 'f', gradeFilter: '',
  stats: { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 },
  skills: {},
  eq: { weapon: '', top: '', pants: '', hat: '', acc: '', robe: '', glasses: '', shield: '' },
  ref: { weapon: 0, top: 0, pants: 0, hat: 0, acc: 0, robe: 0, glasses: 0, shield: 0 },
  slotGrade: {},
  optSub: {},
  opt: { weapon: [], top: [], pants: [], hat: [], acc: [], robe: [], glasses: [], shield: [] },
  otier: {},
  taint: {},
};
const STAT_TH = { str: 'STR พลังโจมตีประชิด', agi: 'AGI ความเร็ว/หลบ', vit: 'VIT พลังชีวิต', int: 'INT พลังเวท', dex: 'DEX ความแม่น/ธนู', luk: 'LUK โชค/คริ' };
const RANGED_WT = new Set(['bow', 'xbow', 'pistol', 'shotgun', 'instrument', 'whip']);
const MAGIC_WT = new Set(['staff', 'orb', 'lantern', 'book', 'bell', 'torch']);
const OPT_EFFECT = { atk: 'atkPct', matk: 'matkPct', hpPct: 'hpPct', spPct: 'spPct', crit: 'crit', critDmg: 'critDmg', flee: 'fleeFlat', hit: 'hitFlat', pen: 'pen', mpen: 'mpen', aspd: 'aspd', aspdAcc: 'aspd', def: null, hp: null };
const SLOT_TH = { weapon: 'อาวุธ', top: 'เสื้อ', pants: 'กางเกง+รองเท้า', hat: 'หมวก', acc: 'เครื่องประดับ' };
function bPath() { return pathOf(JOB[B.job]); }
function bPathJobs() { return bPath().filter((x) => x.tier > 0 || x.id === 'traveler'); }
function bTotalSP() { return Math.max(0, B.jlv - 10); } // จากจอจริง: Job Lv24 → แต้มสกิล 14
function bStatBudget() { return B.statBudget ?? (B.lv * 6 + Math.floor(B.lv / 10)); } // สมมติจากจอจริง: 6/เลเวล + โบนัส 1 ต่อ 10 เลเวล → Lv50 = 305 (STR62+AGI30+VIT15+เหลือ1 พอดี) — ปรับเองได้
function bStatSpent() { return B.statSpent ?? 0; }
function costForNext(v) { return Math.ceil(v / 10) + 1; } // ต้นทุนขั้นบันได: ค่า 5→2, 15→3, 30→4, 62→8 (ตรงจอจริง)
function bCap() { return Math.min(80, Math.floor(30 + 0.55 * B.lv)); }
function bEff(p) { const c = bCap(); return Math.min(p, c) + Math.max(0, p - c) * 0.4; }
function bHPmul() { const t = D.buildHp || {}; let best = 1; for (const lv of Object.keys(t)) if (B.lv >= +lv) best = t[lv]; return best; }
function bSkillsList() { return bPathJobs().flatMap((x) => x.sk.map((s) => ({ ...s, fromJob: x }))); }
function bEqStat(k) {
  let s = 0;
  for (const slot of ['top', 'pants', 'hat', 'acc', 'robe', 'glasses', 'shield']) {
    const it = D.armors.find((a) => a.id === B.eq[slot]);
    if (it && it.st && it.st[k]) s += it.st[k];
  }
  // แถวออฟชนิด "ค่าสเตตัส" เพิ่มสเตตัสตรง ๆ
  for (const slot of ['weapon', 'top', 'pants', 'hat', 'acc', 'robe', 'glasses', 'shield']) {
    for (const o of bOptVals(slot)) {
      if (o.id === 'stat' && (o.sub || '').toLowerCase() === k) s += o.val;
    }
  }
  return s;
}
function bRenderStats() {
  const box = $('#bStats');
  const budget = bStatBudget(), spent = bStatSpent(), left = Math.max(0, budget - spent);
  const cap = bCap();
  box.innerHTML = `<h3>สถานะ</h3><div class="hint">ต้นทุนอัปสถานะแบบขั้นบันได (จากจอจริง: +1 ที่ค่า 5 ใช้ 2 · ที่ 15 ใช้ 3 · ที่ 30 ใช้ 4 · ที่ 62 ใช้ 8 = ceil(ค่า÷10)+1) · ตัวเลข "ถัดไปใช้ N" คือต้นทุนของการอัป +1 ถัดไป (ไม่ใช่แต้มที่ใช้ไปแล้ว) · งบทั้งชีวิตสมมติ ≈ Lv × 6.6 (จาก STR 62 + AGI 30 + VIT 15 ≈ 330) — <b>ปรับเองได้</b> · ซอฟต์แคป ${cap} (เกินทำงาน 40%)</div>
    <div class="strow" style="margin-bottom:6px"><span class="stn"><b>งบแต้มทั้งหมด</b> <small>(ปรับเอง)</small></span><button class="stbtn" data-budget="-25">−25</button><button class="stbtn" data-budget="-1">−1</button><b class="stv">${budget}</b><button class="stbtn" data-budget="1">+1</button><button class="stbtn" data-budget="25">+25</button><small class="hint">ใช้ไป ${spent} · คงเหลือ <b style="color:var(--acc)">${left}</b></small></div>
    ${Object.keys(STAT_TH).map((k) => {
      const alloc = B.stats[k], eqB = Math.round(bEqStat(k) * 100) / 100;
      const totalK = 5 + alloc;
      const nextCost = costForNext(totalK);
      return `<div class="strow"><span class="stn">${k.toUpperCase()} <small>${esc(STAT_TH[k].split(' ')[0])}</small></span>
        <button class="stbtn" data-st="${k}" data-d="-5">−5</button><button class="stbtn" data-st="${k}" data-d="-1">−1</button>
        <b class="stv ${totalK > cap ? 'over' : ''}">${totalK}${eqB ? ' <span style="color:var(--grn)">+' + eqB + '</span>' : ''}</b>
        <button class="stbtn" data-st="${k}" data-d="1">+1</button><button class="stbtn" data-st="${k}" data-d="5">+5</button>
        <small class="hint">ถัดไปใช้ ${nextCost}</small></div>`;
    }).join('')}
    <button class="btn btn--sm btn--ghost" id="bResetStats" style="margin-top:6px">รีเซ็ตสถานะ</button>`;
  $$('#bStats [data-budget]').forEach((b) => b.onclick = () => {
    B.statBudget = Math.max(22, bStatBudget() + (+b.dataset.budget));
    bRenderStats(); bCompute();
  });
  $$('.stbtn[data-st]', box).forEach((b) => b.onclick = () => {
    const k = b.dataset.st, d = +b.dataset.d;
    const totalK = 5 + B.stats[k];
    if (d > 0) {
      const cost = costForNext(totalK) * d;
      if (bStatSpent() + cost > bStatBudget()) return;
      B.stats[k] += d; B.statSpent = bStatSpent() + cost;
    } else {
      const refund = Math.ceil((5 + B.stats[k] + d) / 10) + 1;
      B.stats[k] = Math.max(0, B.stats[k] + d);
      B.statSpent = Math.max(0, bStatSpent() - costForNext(5 + B.stats[k]) * Math.abs(d));
    }
    bRenderStats(); bCompute();
  });
  $('#bResetStats').onclick = () => { B.stats = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 }; B.statSpent = 0; bRenderStats(); bCompute(); };
}
function bRenderSkills() {
  const box = $('#bSkills');
  const total = bTotalSP(), used = Object.values(B.skills).reduce((a, b) => a + b, 0);
  box.innerHTML = `<h3>แต้มสกิล</h3><div class="hint">รวม <b>${total}</b> แต้ม (เลเวลอาชีพสะสมตามเส้นทาง) · ใช้ไป <b>${used}</b> · คงเหลือ <b style="color:var(--acc)">${total - used}</b></div>` +
    bPathJobs().map((x) => `<div class="skgrp"><b>${esc(x.n)}</b> <small>(Job Lv สูงสุด ${x.maxJob})</small></div>` + x.sk.map((s) => {
      const lv = B.skills[s.id] || 0;
      return `<div class="strow"><span style="margin-right:4px">${aiHtml('skills', s.icon, 26)}</span><span class="stn"><b>${esc(s.n)}</b> <small>${s.active ? 'ใช้งาน' : 'พาสซีฟ'} · max ${s.max}</small></span>
        <button class="stbtn" data-sk="${s.id}" data-d="-1">−</button><b class="stv">${lv}</b><button class="stbtn" data-sk="${s.id}" data-d="1">+</button></div>`;
    }).join('')).join('');
  $$('.stbtn', box).forEach((b) => b.onclick = () => {
    const id = b.dataset.sk, d = +b.dataset.d;
    const s = bSkillsList().find((x) => x.id === id);
    const cur = B.skills[id] || 0;
    const used = Object.values(B.skills).reduce((a, b2) => a + b2, 0);
    if (d > 0 && used >= bTotalSP()) return;
    B.skills[id] = Math.max(0, Math.min(s.max, cur + d));
    bRenderSkills(); bCompute();
  });
}
function bOptVals(slot) {
  return (B.opt[slot] || []).map((id, idx) => {
    const o = D.opts.find((x) => x.id === id); if (!o) return null;
    const tier = (B.otier[slot + '_' + idx]) ?? 2;
    const [mn, mx] = o.tiers[Math.min(2, tier)];
    const sub = ((B.optSub || {})[slot + '_' + idx]) || (o.subs && o.subs.length ? o.subs[0] : '');
    return { id, effect: OPT_EFFECT[id] || null, val: mx, unit: o.unit, sub };
  }).filter(Boolean);
}
function bOptOptions(slot) {
  const poolMap = { weapon: 'อาวุธ', top: 'ชุดบน-ล่าง', pants: 'ชุดบน-ล่าง', hat: 'หมวก', acc: 'เครื่องประดับ', robe: 'ชุดบน-ล่าง', glasses: 'เครื่องประดับ', shield: 'อาวุธ' };
  return D.opts.filter((o) => o.on.some((p) => poolMap[slot] === p || (slot === 'weapon' && p === 'อาวุธ')));
}
const GEAR_LEFT = ['hat', 'acc', 'pants', 'weapon'];
const GEAR_RIGHT = ['glasses', 'top', 'robe', 'shield'];
const GEAR_TH = { hat: 'หมวก', acc: 'ต่างหู/เครื่องประดับ', pants: 'กางเกง+รองเท้า', weapon: 'อาวุธ', glasses: 'แว่น', top: 'ชุดบน', robe: 'เสื้อคลุม', shield: 'โล่' };
const ST_TH = { def: 'DEF', mdef: 'MDEF', hp: 'HP', sp: 'SP', hpPct: 'HP %', spPct: 'SP %', crit: 'CRIT', atk: 'ATK %', skill: 'SKILL', cdr: 'CD ลด', spd: 'SPD', hit: 'HIT', flee: 'FLEE', aspd: 'ASPD', str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK' };
function stLine(k, v) {
  const th = ST_TH[k] || k.toUpperCase();
  if (['crit', 'atk', 'skill', 'cdr', 'spd', 'hpPct', 'spPct'].includes(k)) return `${th} +${Math.round(v * 100)}%`;
  return `${th} +${v}`;
}
function gItemOf(slot) {
  if (slot === 'weapon') return D.weapons.find((w) => w.id === B.eq[slot]) || null;
  return D.armors.find((a) => a.id === B.eq[slot]) || null;
}
function gStatsHtml(slot) {
  const it = gItemOf(slot);
  if (!it) return '<div class="gempty">— ว่าง —</div>';
  const lines = [];
  for (const [k, v] of Object.entries(it.st || {})) lines.push(stLine(k, v));
  const refN = B.ref[slot] || 0;
  if (refN) {
    if (slot === 'weapon') lines.push(`ตีบวก +${refN}: ATK +${refN * 4}%`);
    else lines.push(`ตีบวก +${refN}: DEF +${Math.floor(refN / 2)} · HP +${(refN * 0.5).toFixed(1)}%`);
  }
  const rows = B.opt[slot] || [];
  rows.forEach((id, idx) => {
    const o = D.opts.find((x) => x.id === id); if (!o) return;
    const tier = (B.otier[slot + '_' + idx]) ?? 2;
    const [mn, mx] = o.tiers[Math.min(2, tier)];
    const sub = ((B.optSub || {})[slot + '_' + idx]) || (o.subs && o.subs.length ? o.subs[0] : '');
    lines.push(`${esc(o.label)}${sub ? ' (' + esc(sub) + ')' : ''} +${mx}${o.unit} <small>(${mn}–${mx}${o.unit})</small>`);
  });
  const tid = B.taint[slot];
  if (tid) {
    const tr = D.traits.find((x) => x.id === tid);
    if (tr) lines.push(`☾ <span style="color:var(--pur)">${esc(tr.n)}</span>: <span style="color:var(--grn)">${esc(tr.up)}</span> / <span style="color:var(--red)">${esc(tr.dn)}</span>`);
  }
  return `<div class="gstats">${lines.map((l) => `<div>${l}</div>`).join('')}</div>`;
}
function armorGrade(a) {
  if (a.g) return a.g;
  const s = D.sets.find((x) => x.id === a.set);
  return s ? (s.g || null) : null;
}
function gFilterItems(slot, items) {
  let out = items.filter((x) => (x.lv || 0) <= B.lv);                       // เลเวลอุปกรณ์ ≤ เลเวลตัวละคร
  const grade = B.slotGrade[slot];
  if (grade) out = out.filter((x) => (slot === 'weapon' ? (x.g ?? 1) : armorGrade(x)) === grade);
  const curSel = B.eq[slot];
  if (curSel && !out.some((x) => x.id === curSel)) {
    const cur = items.find((x) => x.id === curSel);
    if (cur) out = out.concat(cur); // คงของที่เลือกไว้แม้ถูกกรองออก
  }
  return out;
}
function gradeDots(g) { return g ? '●'.repeat(g) + '<span style="opacity:.25">' + '●'.repeat(4 - g) + '</span>' : ''; }
function naturalRows(slot, g) {
  if (!g) return null;
  if (slot === 'weapon') return [1, 2, 2, 3][g - 1];
  if (slot === 'top' || slot === 'pants') return [1, 1, 2, 2][g - 1];
  if (slot === 'hat' || slot === 'acc') return 1;
  return null;
}
function bRenderEquip() {
  const wts = wtsOf(JOB[B.job]);
  const build = (slot) => {
    let items;
    if (slot === 'weapon') items = D.weapons.filter((w) => wts.includes(w.wt));
    else items = D.armors.filter((a) => a.s === slot);
    items = gFilterItems(slot, items.slice().sort((a, b) => a.lv - b.lv));
    const it = gItemOf(slot);
    const over = it && it.lv > B.lv ? `<small style="color:var(--red)">⚠ Lv${it.lv} &gt; Lv${B.lv}</small>` : '';
    const gSel = B.slotGrade[slot] || '';
    const gradeSel = `<label class="sel"><span>เกรด</span><select data-grad="${slot}"><option value="">ทั้งหมด</option>${[1, 2, 3, 4].map((g) => `<option value="${g}" ${+gSel === g ? 'selected' : ''}>เกรด ${g}</option>`).join('')}</select></label>`;
    const itGrade = it ? (slot === 'weapon' ? (it.g ?? 1) : armorGrade(it)) : null;
    const dots = itGrade ? `<span class="gdots" title="เกรด ${itGrade}">${gradeDots(itGrade)}</span>` : '';
    const nat = naturalRows(slot, itGrade);
    const rowsHint = nat ? `<small class="hint">แถวออฟตามเกรด: ${nat} (+เจาะเพิ่มได้ สูงสุด 4)</small>` : '';
    const gBadge = it && it.g ? `<span class="pill">เกรด ${it.g}</span>` : '';
    const rows = B.opt[slot] || [];
    const opts = bOptOptions(slot);
    const optRows = rows.map((id, idx) => {
      const avail = opts.filter((o) => rows.filter((r) => r === o.id).length < 2 || o.id === id);
      const o = D.opts.find((x) => x.id === id);
      const osub = (B.optSub && (B.optSub || {})[slot + '_' + idx]) || (o && o.subs && o.subs.length ? o.subs[0] : '');
      return `<div class="eqoptrow">
        <select data-optrow="${slot}" data-idx="${idx}"><option value="">— เลือกออฟ —</option>${avail.map((o2) => `<option value="${o2.id}" ${id === o2.id ? 'selected' : ''}>${esc(o2.label)}</option>`).join('')}</select>
        ${id && o && o.subs.length ? `<select data-optsub="${slot}" data-idx="${idx}">${o.subs.map((s2) => `<option value="${esc(s2)}" ${osub === s2 ? 'selected' : ''}>${esc(s2)}</option>`).join('')}</select>` : ''}
        ${id && o ? `<select data-otier="${slot}" data-idx="${idx}">${['ธรรมดา', 'ดี', 'เทพ'].map((t2, i2) => `<option value="${i2}" ${(B.otier[slot + '_' + idx]) === i2 ? 'selected' : ''}>${t2}</option>`).join('')}</select>` : ''}
        <button class="stbtn" data-optdel="${slot}" data-idx="${idx}">✕</button>
      </div>`;
    }).join('') + (rows.length < 4 ? `<button class="stbtn optadd" data-optadd="${slot}">+ ออฟ (${rows.length}/4)</button>` : '<small class="hint">ครบ 4 แถว</small>');
    const tsel = B.taint[slot] || '';
    const taintSel = `<label class="sel"><span>แปดเปื้อน ☾</span><select data-taint="${slot}"><option value="">ไม่มี</option>${D.traits.map((t2) => `<option value="${t2.id}" ${tsel === t2.id ? 'selected' : ''}>☾ ${esc(t2.n)}</option>`).join('')}</select></label>`;
    return `<div class="gslot">
      <div class="gselrow">
        <span class="gicon">${it ? (slot === 'hat' ? (aiHat(it.id, 30) || aiHtml('items', it.id, 30)) : (aiHtml('items', it.id, 30) || slotIcon(slot === 'weapon' ? 'weapon' : slot))) : '<span class="gemptyic">＋</span>'}</span>
        <div style="flex:1">
          <label class="sel"><span>${GEAR_TH[slot]} ${gBadge} ${over}</span><select data-eq="${slot}"><option value="">— ว่าง —</option>${items.map((x) => `<option value="${x.id}" ${(B.eq[slot]) === x.id ? 'selected' : ''}>${esc(x.n)} (Lv${x.lv}${x.g ? ', ก' + x.g : ''})</option>`).join('')}</select></label>
        </div>
      </div>
      ${gStatsHtml(slot)}
      <div class="eqopts">
        ${gradeSel}
        <label class="sel"><span>ตีบวก</span><select data-ref="${slot}"><option value="" ${!B.ref[slot] ? 'selected' : ''}>+0</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${B.ref[slot] === n ? 'selected' : ''}>+${n}</option>`).join('')}</select></label>
        ${taintSel}
      </div>
      <div>${dots} ${rowsHint}</div>
      <div class="eqoptrows">${optRows}</div>
    </div>`;
  };
  $('#gearLeft').innerHTML = GEAR_LEFT.map(build).join('');
  $('#gearRight').innerHTML = GEAR_RIGHT.map(build).join('');
  $$('[data-eq]').forEach((s) => s.onchange = () => { B.eq[s.dataset.eq] = s.value; bRenderEquip(); bCompute(); });
  $$('[data-grad]').forEach((s) => s.onchange = () => { B.slotGrade[s.dataset.grad] = +s.value || ''; bRenderEquip(); bCompute(); });
  $$('[data-ref]').forEach((s) => s.onchange = () => { B.ref[s.dataset.ref] = +s.value; bCompute(); gStatsRefresh(); });
  $$('[data-optrow]').forEach((s) => s.onchange = () => { B.opt[s.dataset.optrow][+s.dataset.idx] = s.value; delete (B.optSub || {})[s.dataset.optrow + '_' + s.dataset.idx]; bRenderEquip(); bCompute(); });
  $$('[data-optsub]').forEach((s) => s.onchange = () => { B.optSub = B.optSub || {}; B.optSub[s.dataset.optsub + '_' + s.dataset.idx] = s.value; bCompute(); gStatsRefresh(); });
  $$('[data-otier]').forEach((s) => s.onchange = () => { B.otier[s.dataset.otier + '_' + s.dataset.idx] = +s.value; bCompute(); gStatsRefresh(); });
  $$('[data-taint]').forEach((s) => s.onchange = () => { B.taint[s.dataset.taint] = s.value; bCompute(); gStatsRefresh(); });
  $$('[data-optdel]').forEach((b) => b.onclick = () => { const slot = b.dataset.optdel; B.opt[slot].splice(+b.dataset.idx, 1); bRenderEquip(); bCompute(); });
  $$('[data-optadd]').forEach((b) => b.onclick = () => { if (B.opt[b.dataset.optadd].length < 4) { B.opt[b.dataset.optadd].push(''); bRenderEquip(); } });
}
function gStatsRefresh() {
  GEAR_LEFT.concat(GEAR_RIGHT).forEach((slot) => {
    const card = $$('#gearLeft .gslot, #gearRight .gslot').find((c) => c.querySelector(`[data-eq="${slot}"]`));
    if (card) { const st = card.querySelector('.gstats'); if (st) st.outerHTML = gStatsHtml(slot); }
  });
}
function bOptVal(slot) {
  const id = B.opt[slot]; if (!id) return null;
  const o = D.opts.find((x) => x.id === id); if (!o) return null;
  const tier = (B.otier && B.otier[slot]) ?? 2;
  const [mn, mx] = o.tiers[Math.min(2, tier)];
  return { id, effect: OPT_EFFECT[id], val: mx, unit: o.unit };
}
/* character preview: chibi drawn on canvas + real item sprites */
let ATLAS_IMG = null;
const atlasImg = new Image();
atlasImg.onload = () => { ATLAS_IMG = atlasImg; bCompute(); };
atlasImg.src = 'assets/data/wiki_items.webp';
const HATS = D.atlas.hats128 || { ids: [], cols: 16, cell: 128 };
const HI_IDX = Object.fromEntries(HATS.ids.map((id, i) => [id, i]));
let HATS_IMG = null;
const hatsImg = new Image();
hatsImg.onload = () => { HATS_IMG = hatsImg; bCompute(); };
hatsImg.src = 'assets/data/wiki_hats128.webp';
let JOBS_IMG = null;
const jobsImg = new Image();
jobsImg.onload = () => { JOBS_IMG = jobsImg; bCompute(); };
jobsImg.src = 'assets/data/wiki_jobs.webp';
function aiHat(id, size = 40) {
  const i = HI_IDX[id]; if (i == null) return '';
  const k = size / HATS.cell;
  const x = (i % HATS.cols) * HATS.cell * k, y = Math.floor(i / HATS.cols) * HATS.cell * k;
  const rows = Math.ceil(HATS.ids.length / HATS.cols);
  return `<i class="ai" style="width:${size}px;height:${size}px;background:url(assets/data/wiki_hats128.webp) -${x}px -${y}px/${HATS.cols * HATS.cell * k}px ${rows * HATS.cell * k}px no-repeat"></i>`;
}
function drawHatSprite(ctx, id, x, y, size) {
  const i = HI_IDX[id]; if (i == null || !HATS_IMG) return;
  const sx = (i % HATS.cols) * HATS.cell, sy = Math.floor(i / HATS.cols) * HATS.cell;
  ctx.drawImage(HATS_IMG, sx, sy, HATS.cell, HATS.cell, x, y, size, size);
}
function drawItemSprite(ctx, id, x, y, size) {
  const i = AI_IDX.items[id];
  if (i == null || !ATLAS_IMG) return;
  const m = D.atlas.meta.items;
  const sx = (i % m.cols) * m.cell, sy = Math.floor(i / m.cols) * m.cell;
  ctx.drawImage(ATLAS_IMG, sx, sy, m.cell, m.cell, x, y, size, size);
}
function bRenderPreview() {
  const c = $('#bCanvas'); if (!c) return;
  const ctx = c.getContext('2d'), W = c.width, H = c.height;
  const j = JOB[B.job];
  const els = {}; j.sk.forEach((s) => { if (s.el) els[s.el] = (els[s.el] || 0) + 1; });
  const mainEl = Object.keys(els).sort((a, b) => els[b] - els[a])[0] || 'neutral';
  const elc = (EL.col(mainEl) || '#ffb454').trim();
  /* ── ตัวละครจริงจากเกม (portrait) ── */
  const cx = W / 2;
  const bg = ctx.createRadialGradient(W / 2, H * .45, 20, W / 2, H * .5, H * .8);
  bg.addColorStop(0, '#1d2639'); bg.addColorStop(1, '#0d1017');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const pi = AI_IDX.jobs[j.id];
  if (pi != null && JOBS_IMG) {
    const m = D.atlas.meta.jobs;
    const sx = (pi % m.cols) * m.cell, sy = Math.floor(pi / m.cols) * m.cell;
    const ps = Math.min(H - 46, W - 24);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(JOBS_IMG, sx, sy, m.cell, m.cell, cx - ps / 2, 26, ps, ps);
  }
  ctx.font = '700 14px "Noto Sans Thai", sans-serif'; ctx.fillStyle = '#e8ecf7'; ctx.textAlign = 'center';
  ctx.fillText(j.n + ' Lv' + B.lv + ' · Job ' + B.jlv, W / 2, 22);
  ctx.textAlign = 'left';
}

function bCompute() {
  const j = JOB[B.job], lv = B.lv;
  const w = D.weapons.find((x) => x.id === B.eq.weapon) || null;
  const eqSlots = ['top', 'pants', 'hat', 'acc', 'robe', 'glasses', 'shield'].map((s) => ({ slot: s, it: D.armors.find((a) => a.id === B.eq[s]) }));
  // sums from equipment
  let eqAtk = 0, eqDef = 0, eqMdef = 0, eqHp = 0, eqSp = 0, eqAtkPct = 0, eqMatkPct = 0, eqHpPct = 0, eqSpPct = 0, eqCrit = 0, eqFlee = 0, eqHit = 0, eqAspd = 0, eqPen = 0;
  eqSlots.forEach(({ slot, it }) => {
    if (!it) return;
    const st = it.st || {};
    eqDef += st.def || 0; eqMdef += st.mdef || 0; eqHp += st.hp || 0; eqSp += st.sp || 0;
    eqAtk += st.atk || 0; eqCrit += st.crit ? Math.round(st.crit * 100) : 0; eqFlee += st.flee || 0; eqHit += st.hit || 0;
    eqHpPct += st.hpPct || 0; eqSpPct += st.spPct || 0; eqAspd += st.aspd ? st.aspd * 100 : 0;
    const refN = B.ref[slot];
    eqDef += Math.floor(refN / 2);
    eqHpPct += refN * 0.5;
    for (const o of bOptVals(slot)) {
      if (o.effect === 'atkPct') eqAtkPct += o.val;
      if (o.effect === 'matkPct') eqMatkPct += o.val;
      if (o.effect === 'hpPct') eqHpPct += o.val;
      if (o.effect === 'spPct') eqSpPct += o.val;
      if (o.effect === 'crit') eqCrit += o.val;
      if (o.effect === 'fleeFlat') eqFlee += o.val;
      if (o.effect === 'hitFlat') eqHit += o.val;
      if (o.effect === 'aspd') eqAspd += o.val;
      if (o.effect === 'pen') eqPen += o.val;
    }
  });
  const wRef = B.ref.weapon;
  for (const o of bOptVals('weapon')) {
    if (o.effect === 'atkPct') eqAtkPct += o.val;
    if (o.effect === 'matkPct') eqMatkPct += o.val;
    if (o.effect === 'crit') eqCrit += o.val;
    if (o.effect === 'aspd') eqAspd += o.val;
  }
  const Bt = { ...B.taint };
  const strE = bEff(5 + B.stats.str + bEqStat('str')), agiE = bEff(5 + B.stats.agi + bEqStat('agi')), vitE = bEff(5 + B.stats.vit + bEqStat('vit')), intE = bEff(5 + B.stats.int + bEqStat('int')), dexE = bEff(5 + B.stats.dex + bEqStat('dex')), lukE = bEff(5 + B.stats.luk + bEqStat('luk'));
  const magic = w && MAGIC_WT.has(w.wt), ranged = w && RANGED_WT.has(w.wt);
  const wAtk = w ? w.atk * (1 + 0.04 * wRef) : 0;
  const refMul = (1 + 0.04 * wRef).toFixed(2);
  const statPart = magic ? intE * 1.6 : ranged ? dexE * 1.6 : strE * 1.6;
  const baseAtk = Math.round(statPart + 0.6 * lv + eqAtk);
  const atkPct = 1 + eqAtkPct / 100;
  const atkTotal = Math.round((baseAtk + wAtk) * atkPct);
  const matkBase = Math.round(intE * 1.6 + 0.6 * lv + eqAtk);
  const matk = magic ? Math.round((baseAtk + wAtk) * (1 + eqMatkPct / 100)) : Math.round((matkBase) * (1 + eqMatkPct / 100));
  const hpBase = 150 + (j.hp || 5) * lv + eqHp;
  const maxHp = Math.round(hpBase * (1 + 0.01 * vitE) * (1 + eqHpPct / 100) * bHPmul());
  const maxSp = Math.round((60 + (j.sp || 2) * lv + eqSp) * (1 + 0.01 * intE) * (1 + eqSpPct / 100));
  const aspd = Math.min(150, 100 + 0.5 * agiE + eqAspd);
  const crit = Math.min(100, 0.3 * lukE + eqCrit);
  const critDmg = (1.4 + 0.004 * lukE).toFixed(2);
  const acc = Math.min(100, 88 + 0.15 * dexE + eqHit);
  const hitShow = Math.round(lv * 1.1 + dexE * 0.5 + eqHit);
  const fleeShow = Math.round(lv * 1.5 + agiE * 1.6 + eqFlee);
  const dmgRed = Math.min(30, 0.2 * vitE).toFixed(1);
  const castSpd = Math.min(50, 0.6 * dexE).toFixed(1);
  const hpReg = (2 + vitE * 0.02).toFixed(1), spReg = (2 + intE * 0.02).toFixed(1);
  const dodgeSoft = Math.min(50, 0.3 * agiE).toFixed(1);
  const dodgeFull = Math.min(20, 0.15 * agiE).toFixed(1);
  const dmgType = w ? ({ melee: 'ฟัน', pierce: 'เจาะ', bash: 'ทุบ', magic: 'เวท' }[magic ? 'magic' : RANGED_WT.has(w.wt) ? 'pierce' : ['gsword', 'gaxe', 'hammer', 'lance', 'huuma', 'scythe', 'qstaff'].includes(w.wt) ? 'bash' : 'melee']) : '–';
  // รวมค่าแถวออฟทุกชิ้นสำหรับแผงสถานะละเอียด
  const optAgg = {};
  for (const slot of ['weapon', 'top', 'pants', 'hat', 'acc', 'robe', 'glasses', 'shield']) {
    for (const o of bOptVals(slot)) optAgg[o.id] = (optAgg[o.id] || 0) + o.val;
  }
  const optRow = (id, label) => {
    const o = D.opts.find((x) => x.id === id); if (!o) return '';
    const v = optAgg[id] || 0;
    const capS = o.cap ? (o.cap > 1 ? 'จำกัด ' + o.cap + (o.unit || '') : 'จำกัด ' + Math.round(o.cap * 100) + '%') : 'ไม่มีเพดาน';
    return `<tr><td>${esc(label || o.label)}</td><td>${v ? (o.cap && o.cap <= 1 && o.unit === '%' ? '+' + Math.round(v * 100) + '%' : '+' + v + (o.unit || '')) : '–'}</td><td><small>${capS}</small></td></tr>`;
  };
  const atkLine = magic
    ? `MATK ${matkBase.toLocaleString()} + ${Math.round(wAtk).toLocaleString()}${wRef ? ' ×' + refMul : ''}`
    : `ATK ${baseAtk.toLocaleString()} + ${Math.round(wAtk).toLocaleString()}${wRef ? ' ×' + refMul : ''}${atkPct > 1 ? ' (+' + Math.round((atkPct - 1) * 100) + '% ออฟ)' : ''}`;
  $('#bOut').innerHTML = `<h3>สถานะ (แบบหน้า C)</h3>
    <div class="outgrid">
      <div class="out"><b>${atkLine}</b><small>${dmgType} · ธาตุ ${EL.th(w ? w.el : 'neutral')}</small></div>
      <div class="out"><b>${magic ? Math.round(baseAtk + eqAtk) : matk.toLocaleString()}</b><small>${magic ? 'ATK (ประชิด)' : 'MATK'}</small></div>
      <div class="out"><b>${hitShow}</b><small>HIT</small></div>
      <div class="out"><b>${crit.toFixed(0)}%</b><small>CRI (LUK 0.3%/แต้ม + ออฟ)</small></div>
      <div class="out"><b>${aspd.toFixed(0)} ×${(aspd / 100).toFixed(2)}</b><small>ASPD (AGI 0.5%/แต้ม)</small></div>
      <div class="out"><b>${castSpd}%</b><small>เวทเร็ว (DEX 0.6%/แต้ม)</small></div>
      <div class="out"><b>${5 + eqDef + Math.floor(wRef / 2)}</b><small>DEF (ฐาน 5 + เกราะ + ตีบวก)</small></div>
      <div class="out"><b>${eqMdef}</b><small>MDEF</small></div>
      <div class="out"><b>${fleeShow} <span style="color:var(--grn)">+${(0.15 * agiE).toFixed(0)}%</span></b><small>FLEE (หลบเฉียด ${dodgeSoft}% / ทั้งดอก ${dodgeFull}%)</small></div>
      <div class="out"><b>${maxHp.toLocaleString()}</b><small>HP${bHPmul() > 1 ? ' (×' + bHPmul() + ' เลเวลสูง)' : ''} · ลดดาเมจโดน ${dmgRed}%</small></div>
      <div class="out"><b>${maxSp.toLocaleString()}</b><small>SP</small></div>
      <div class="out"><b>HP ${hpReg} · SP ${spReg}</b><small>ฟื้นอัตโนมัติ/วิ (ประมาณ)</small></div>
      <div class="out"><b>+${acc.toFixed(0)}%</b><small>ความแม่นยำ (88% + 0.15%/DEX)</small></div>
      <div class="out"><b>ดาเมจคริ ×${critDmg}</b><small>LUK 0.4%/แต้ม</small></div>
      <div class="out"><b>${dmgType}</b><small>ชนิดดาเมจอาวุธ</small></div>
    </div>
    <h3 style="margin-top:14px">สถานะละเอียด</h3>
    <div class="outgrid2">
      <div><b>โจมตี</b><table class="src">${optRow('pen', 'เจาะเกราะ')}${optRow('mpen', 'เจาะเวท')}${optRow('critDmg', 'ดาเมจคริติคอล')}${optRow('leech', 'ดูดเลือด')}${optRow('spLeech', 'ดูด SP')}${optRow('race', 'ดาเมจต่อเผ่าหนึ่ง')}${optRow('el', 'ดาเมจต่อธาตุหนึ่ง')}${optRow('boss', 'ดาเมจต่อบอส')}${optRow('hit', 'HIT เพิ่ม')}${optRow('aspd', 'ความเร็วโจมตี')}</table></div>
      <div><b>ป้องกัน & ร่าย</b><table class="src">${optRow('resEl', 'ต้านธาตุ (ธาตุเดียว)')}${optRow('resSt', 'ต้านสถานะ (สถานะเดียว)')}${optRow('resRace', 'ต้านเผ่า (เผ่าเดียว)')}${optRow('resBoss', 'ต้านบอส')}${optRow('resMelee', 'กันระยะประชิด')}${optRow('resRange', 'กันยิงไกล')}${optRow('cast', 'ร่ายเร็วขึ้น')}${optRow('acd', 'ดีเลย์หลังร่ายสั้นลง')}${optRow('cdr', 'คูลดาวน์สั้นลง')}${optRow('spCost', 'สกิลใช้ SP น้อยลง')}</table></div>
      <div><b>โจมตีเวท & อื่น ๆ</b><table class="src">${optRow('matk', 'MATK เพิ่ม')}${optRow('atk', 'ATK เพิ่ม')}${optRow('hpPct', 'HP สูงสุด')}${optRow('spPct', 'SP สูงสุด')}${optRow('spKill', 'ได้ SP เมื่อฆ่า')}${optRow('stat', 'ค่าสเตตัสเพิ่ม')}${optRow('inflict', 'ทำให้ติดสถานะ')}${optRow('proc', 'ตีโดนแล้วร่ายเวท')}${optRow('spd', 'ความเร็วเคลื่อนที่')}${optRow('flee', 'FLEE เพิ่ม')}</table></div>
    </div>
    <div class="note" style="margin-top:8px">เพดาน (จำกัด) มาจากข้อมูลออฟของวิกิ · แถวที่ยังไม่มีออฟจะขึ้น – · สูตรสเตตัสจากวิกิ (สเตตัส&อาวุธ) ส่วนค่าฐาน HP/SP/HIT/FLEE/ฟื้นอัตโนมัติ เป็นการประมาณ · ATK รูปแบบ "ฐาน + อาวุธ ×คูณตีบวก" ตามหน้าจอเกม</div>`;
  B.last = { atkTotal, matk, magic, ranged, aspd };
  bRenderDps({ atkTotal, matk, aspd }, magic);
  bRenderPreview();
}
/* ── บล็อคคำนวณ DPS ── */
function skillTotalPct(d) {
  const ms = [...d.matchAll(/([\d,]+)%\s*ของ\s*(ATK|MATK)/g)].map((x) => ({ pct: +x[1].replace(/,/g, ''), type: x[2] }));
  if (!ms.length) return null;
  const hits = Math.max(1, ...[...d.matchAll(/(\d+)\s*(?:ครั้ง|ลูก|ดอก|เล่ม|นัด)/g)].map((x) => +x[1]).filter((n) => n > 1 && n <= 16));
  const pct = ms.reduce((a, m) => a + m.pct, 0) * hits;
  return { pct, type: ms[0].type, hits };
}
function buffEffectsBuild() {
  const out = { dmg: 0, list: [] };
  // บัฟตัวเองจากสกิลที่อัปแต้มแล้วเท่านั้น — ดึง % ดาเมจจากข้อความสกิลจริง
  for (const id of (B.dpsSelfOn || new Set())) {
    const s = bPathJobs().flatMap((x) => x.sk).find((x2) => x2.id === id);
    if (!s) continue;
    const ms = [...s.d.matchAll(/(?:ATK|MATK|ดาเมจ)[^%\n]*?\+(\d+)%/g)].map((x) => +x[1]);
    const pct = ms.length ? Math.max(...ms) : 0;
    out.dmg += pct / 100;
    out.list.push({ id, n: s.n, pct, d: s.d });
  }
  out.dmg = Math.min(0.8, out.dmg);
  return out;
}
function bRenderDps(st, magic) {
  const box = $('#bDps'); if (!box) return;
  const atkStat = magic ? st.matk : st.atkTotal;
  const be = buffEffectsBuild();
  const dmgMul = 1 + be.dmg;
  const off = B.dpsOff || new Set();
  const skills = bPathJobs().flatMap((x) => x.sk).filter((s) => s.active && (B.skills[s.id] || 0) > 0 && !off.has(s.id)); // เฉพาะสกิลที่อัปแต้มแล้ว
  const rows = [];
  let rotDmg = 0, rotTime = 0;
  for (const s of skills) {
    const t = skillTotalPct(s.d); if (!t) continue;
    const base = t.type === 'MATK' ? st.matk : st.atkTotal;
    const dmgPerCast = t.pct / 100 * base * dmgMul;
    const period = Math.max(s.cd || 0, 0.4);
    const dps = dmgPerCast / period;
    rotDmg += dmgPerCast; rotTime += period;
    rows.push({ s, t, dmgPerCast, period, dps });
  }
  rows.sort((a, b) => b.dps - a.dps);
  const rotDps = rotTime > 0 ? rotDmg / rotTime : 0;
  const basicDps = Math.round((magic ? st.matk : st.atkTotal) * (st.aspd / 100));
  const elNote = be.el ? ` 🪽 ธาตุดาเมจเป็น<b>${EL.th(be.el)}</b> (จากบัฟ) — โบนัสต่อมอนที่แพ้ธาตุนี้ไม่รวมในตัวเลขดิบ` : '';
  box.innerHTML = `<h3>⚔️ คำนวณ DPS</h3>
    <div class="outgrid">
      <div class="out"><b>${Math.round(rotDps).toLocaleString()}</b><small>DPS วงจรสกิล (สูงสุดโดยประมาณ)</small></div>
      <div class="out"><b>${basicDps.toLocaleString()}</b><small>DPS ตีปกติ (จาก ASPD)</small></div>
      <div class="out"><b>${dmgMul > 1 ? '+' + Math.round((dmgMul - 1) * 100) + '%' : '–'}</b><small>บัฟดาเมจที่เลือก</small></div>
    </div>
    ${be.el ? `<div class="bonus" style="margin-top:8px">🪽 บัฟทำให้ดาเมจเป็นธาตุ${EL.th(be.el)} — โบนัสต่อมอนที่แพ้ธาตุนี้จะเพิ่มในการฟาร์มจริง (ไม่รวมใน DPS ดิบ)</div>` : ''}
    <h4 style="margin:12px 0 4px">🧿 บัฟตัวเองที่อัปแต้มแล้ว (ติ๊ก = ใช้ในการคำนวณ)</h4>
    <div class="chips">${(() => {
      const self = bPathJobs().flatMap((x) => x.sk).filter((s) => s.active && (B.skills[s.id] || 0) > 0 && !skillTotalPct(s.d) && /ATK \+\d+|MATK \+\d+|ความเร็วโจมตี \+\d+|คริติคอล \+\d+|ทุกสเตตัส \+\d+|เดินเร็วขึ้น|ร่ายลด/.test(s.d));
      if (!self.length) return '<span class="hint">อาชีพนี้ไม่มีสกิลบัฟตัวเองที่อัปไว้ (บัฟปาร์ตี้จากอาชีพอื่นอยู่ในหน้า "วางแผนฟาร์ม")</span>';
      return self.map((s) => {
        const on = (B.dpsSelfOn || new Set()).has(s.id);
        return `<label class="chip ${on ? 'on' : ''}"><input type="checkbox" data-dpsself="${s.id}" ${on ? 'checked' : ''}>${esc(s.n)} <small>${esc((s.d.match(/[^·\\n]{0,40}(?:\+|เพิ่ม)[^·\\n]{0,20}%?/) || [''])[0].trim())}</small></label>`;
      }).join('');
    })()}</div>
    <h4 style="margin:12px 0 4px">✨ สกิลที่อัปมาแล้ว (ติ๊ก = ใส่วงจร)</h4>
    <div class="chips">${(() => {
      const learnable = bPathJobs().flatMap((x) => x.sk).filter((s) => s.active && skillTotalPct(s.d) && (B.skills[s.id] || 0) > 0);
      if (!learnable.length) return '<span class="hint">ยังไม่ได้อัปสกิล — จัดแต้มสกิลในการ์ด "สกิล" ด้านบนก่อน แล้วจะมาโชว์ที่นี่</span>';
      return learnable.map((s) => {
        const on = !off.has(s.id);
        return `<label class="chip ${on ? 'on' : ''}"><input type="checkbox" data-dpssk="${s.id}" ${on ? 'checked' : ''}>${esc(s.n)} <small>Lv${B.skills[s.id]}</small></label>`;
      }).join('');
    })()}</div>
    <table class="src" style="margin-top:10px"><tr><th>สกิล</th><th>ดาเมจรวม/คาสต์</th><th>CD</th><th>DPS</th></tr>
    ${rows.map((r) => `<tr><td>${esc(r.s.n)}</td><td>${Math.round(r.dmgPerCast).toLocaleString()} <small>(${r.t.pct}% ${r.t.type === 'MATK' ? 'MATK' : 'ATK'}${r.t.hits > 1 ? ' ×' + r.t.hits + ' ครั้ง' : ''})</small></td><td>${r.period.toFixed(1)}s</td><td><b>${Math.round(r.dps).toLocaleString()}</b></td></tr>`).join('')}
    <tr><th>รวมวงจร (ทุกสกิลใช้ครบ 1 รอบ)</th><td colspan="2">${rotTime.toFixed(1)} วินาที</td><td><b>${Math.round(rotDps).toLocaleString()}</b></td></tr>
    </table>
    <p class="note">คำนวณที่เลเวลสกิลสูงสุดจากข้อความวิกิ (สกิลบางอันมี DoT/ดาเมจระลอกที่อ่านอัตโนมัติไม่ได้ ตัวเลขอาจต่ำกว่าจริง) · ยังไม่รวม: ค่าเจาะเกราะ ธาตุต่อมอน คริติคอล · สูตร: ดาเมจ/คาสต์ ÷ (CD + 0.4s GCD)</p>`;
  $$('[data-dpsbuff]', box).forEach((c) => c.onchange = () => { B.dpsBuffOn = B.dpsBuffOn || new Set(); c.checked ? B.dpsBuffOn.add(c.dataset.dpsbuff) : B.dpsBuffOn.delete(c.dataset.dpsbuff); bRenderDps(B.last, B.last.magic); });
  $$('[data-dpsself]', box).forEach((c) => c.onchange = () => { B.dpsSelfOn = B.dpsSelfOn || new Set(); c.checked ? B.dpsSelfOn.add(c.dataset.dpsself) : B.dpsSelfOn.delete(c.dataset.dpsself); bRenderDps(B.last, B.last.magic); });
  $$('[data-dpssk]', box).forEach((c) => c.onchange = () => { B.dpsOff = B.dpsOff || new Set(); c.checked ? B.dpsOff.delete(c.dataset.dpssk) : B.dpsOff.add(c.dataset.dpssk); bRenderDps(B.last, B.last.magic); });
}

/* --- การ์ดมอนเตอร์ (กริดแบบเกม) --- */
function drawMonCards() {
  const lv = +gLv.value;
  const w = D.weapons.find((x) => x.id === $('#simWeapon').value) || null;
  const wEl = w ? w.el : ((cur.job.sk.find((s) => s.el) || {}).el || 'neutral');
  const picks = bestMaps(lv, wEl, 6);
  const okMonIds = new Set();
  picks.forEach((p) => p.m.mons.forEach((mn) => okMonIds.add(mn.id)));
  const starIds = new Set(((picks[0] || {}).best || []).slice(0, 3).map((mn) => mn.id));
  const list = D.monsters.slice().sort((a, b) => (okMonIds.has(b.id) - okMonIds.has(a.id)) || a.lv - b.lv);
  $('#gMonBox').innerHTML = `<p class="hint">🎨 การ์ดสี = มอนในแมพแนะนำของ ${esc(cur.job.n)} ที่ Lv ${lv}${wEl ? ' (ธาตุ ' + EL.th(wEl) + ')' : ''} · ⭐ = เป้าหมายแนะนำ 3 ตัวแรกของแมพเด่น · เทา = มอนอื่น ๆ · กดการ์ดเพื่อดูดรอป</p><div class="cardgrid">` +
    list.map((m) => {
      const ok = okMonIds.has(m.id), star = starIds.has(m.id);
      return `<div class="wcard ${ok ? 'ok' : 'dim'} ${star ? 'star' : ''}" data-item="${m.id}" title="${esc(m.n)} — กดดูดรอป">
        <span class="wlv">Lv ${m.lv}</span>${star ? '<span class="wstar">⭐</span>' : ''}
        <span class="wic">${aiHtml('mons', m.id, 46) || (m.boss ? '👑' : ELICON[m.el])}</span>
        <span class="wnm">${esc(m.n)}</span>
        <span class="wsub">${ELICON[m.el] || ''}${m.boss ? ' 👑' : ''}</span>
      </div>`;
    }).join('') + '</div>';
}

/* render build page */
const bJob = $('#bJob'), bLv = $('#bLv'), bJobLv = $('#bJobLv');
function bRenderAll() {
  const j = JOB[B.job];
  B.jlv = Math.min(B.jlv, j.maxJob);
  $('#bJobLvN').textContent = B.jlv; $('#bLvN').textContent = B.lv;
  bRenderStats(); bRenderSkills(); bRenderEquip(); bCompute();
}
function bInit() {
  bJob.innerHTML = D.jobs.filter((j) => j.tier === 0).map((j) => `<option value="${j.id}" ${j.id === B.job ? 'selected' : ''}>${esc(j.n)}</option>`).join('') +
    D.jobs.filter((j) => j.tier === 1).map((root) => {
      const opts = [root];
      D.jobs.filter((x) => x.from === root.id).forEach((k) => { opts.push(k); D.jobs.filter((x) => x.from === k.id).forEach((g) => opts.push(g)); });
      return `<optgroup label="${esc(root.n)}">${opts.map((x) => `<option value="${x.id}" ${x.id === B.job ? 'selected' : ''}>${'　'.repeat(Math.max(0, x.tier - 1))}${x.tier === 3 ? '⭐ ' : ''}${esc(x.n)}</option>`).join('')}</optgroup>`;
    }).join('');
  bJob.onchange = () => { B.job = bJob.value; B.skills = {}; B.eq = { weapon: '', top: '', pants: '', hat: '', acc: '', robe: '', glasses: '', shield: '' }; B.ref = { weapon: 0, top: 0, pants: 0, hat: 0, acc: 0, robe: 0, glasses: 0, shield: 0 }; B.opt = { weapon: [], top: [], pants: [], hat: [], acc: [], robe: [], glasses: [], shield: [] }; B.otier = {}; bRenderAll(); };
  bLv.oninput = () => { B.lv = +bLv.value; bRenderAll(); };
  bJobLv.oninput = () => { B.jlv = +bJobLv.value; bRenderAll(); };
  cur.wts = wtsOf(JOB[B.job]);
  bRenderAll();
}

/* ---------- searchable dropdowns (combo) สำหรับ select ทุกตัว ---------- */
/* dropdown native — เบราว์เซอร์จัดการเอง 100% (เชื่อถือได้) */
function unnatifyAll() {
  document.querySelectorAll('.scombo').forEach((wrap) => {
    try {
      const sel = wrap.querySelector('select');
      if (sel) { sel.style.display = ''; wrap.parentNode.insertBefore(sel, wrap); }
      wrap.remove();
    } catch (err) {}
  });
  document.querySelectorAll('select[data-sf]').forEach((sel) => { sel.removeAttribute('data-sf'); sel._sf = false; });
}
function searchifySelect(sel) { /* native mode */ }
function searchifyAll(root) { /* native mode */ }

const searchObserver = new MutationObserver(() => searchifyAll());
searchObserver.observe(document.body, { childList: true, subtree: true });


/* ════════════════════════ PAGE 3 · วางแผนฟาร์ม ════════════════════════ */
const pJob = $('#pJob'), pLv = $('#pLv'), pLvN = $('#pLvN'), pSize = $('#pSize'), pGoal = $('#pGoal'), pMembers = $('#pMembers'), pBuffs = $('#pBuffs'), pOut = $('#pOut');
pJob.innerHTML = D.jobs.map((j) => `<option value="${j.id}" ${j.id === 'firemage' ? 'selected' : ''}>${esc(j.n)}</option>`).join('');

/* buff skills — ดึงจากสกิลจริงของอาชีพซัพพอร์ตในปาร์ตี้ (ผลลัพธ์เป็นการประมาณการ)
   dmg = ดาเมจทั้งตี้ · heal = ลดเวลาพักฟื้น (ฮีล/ลดดาเมจที่ได้รับ/ฟื้น SP) · speed = ยูทิลิตี้อื่น (ร่ายเร็ว, เดินเร็ว)
   el = เปลี่ยนธาตุอาวุธทั้งตี้ */
const SUPPORT_JOBS = new Set(['priest', 'bishop', 'bard', 'lightkeeper', 'wisp', 'beacon', 'starsaint', 'maestro', 'starshepherd']);
const BUFF_SKILLS = {
  /* นักบวช */
  pr_heal:        { dmg: 0, heal: 0.12, speed: 0, tag: 'ฮีลทีม 20% HP' },
  pr_resurrect:   { dmg: 0, heal: 0.03, speed: 0, tag: 'ชุบชีวิตเพื่อน' },
  blessing:       { dmg: 0.15, heal: 0, speed: 0.02, tag: 'STR/INT/DEX +10 ทั้งตี้' },
  pr_agi:         { dmg: 0, heal: 0, speed: 0.15, tag: 'AGI +10 · โจมตีเร็วขึ้น' },
  pr_angelus:     { dmg: 0.02, heal: 0.06, speed: 0, tag: 'VIT/DEF · รับดาเมจลดลง' },
  pr_gloria:      { dmg: 0.06, heal: 0, speed: 0.04, tag: 'LUK +25 · คริแรงขึ้น' },
  pr_suffragium:  { dmg: 0, heal: 0, speed: 0.10, tag: 'ร่ายเร็วขึ้น 30%' },
  pr_aspersio:    { dmg: 0.05, heal: 0, speed: 0, el: 'holy', tag: 'อาวุธทั้งตี้เป็นธาตุแสง — ฟาร์มธาตุมืด/อมตะได้เปรียบ' },
  /* บิชอป */
  bi_heal:        { dmg: 0.02, heal: 0.14, speed: 0, tag: 'ฮีลวงกว้าง 10% HP + แสงเผาศัตรู' },
  bi_sanctuary:   { dmg: 0.06, heal: 0.25, speed: 0, tag: 'เขตศักดิ์สิทธิ์ ฟื้น 6% ทุกครึ่งวิ' },
  bi_miracle:     { dmg: 0.08, heal: 0.10, speed: 0, tag: 'ฟื้น HP ทุกคน 60% + ชุบเพื่อน + อวยพร ATK/MATK' },
  bi_clementia:   { dmg: 0.22, heal: 0, speed: 0.02, tag: 'STR/INT/DEX +10 + ต่อ Job Lv' },
  bi_canto:       { dmg: 0, heal: 0, speed: 0.18, tag: 'AGI +10 · เดินเร็ว 15%' },
  bi_sacrament:   { dmg: 0, heal: 0, speed: 0.14, tag: 'ร่ายลด 40% · CD ลด 20%' },
  bi_expiatio:    { dmg: 0.18, heal: 0, speed: 0, tag: 'ทะลุ DEF/MDEF 25%' },
  bi_barrier:     { dmg: 0.02, heal: 0.08, speed: 0, tag: 'บาเรียทอง · รับดาเมจ −15%' },
  bi_assumptio:   { dmg: 0.02, heal: 0.08, speed: 0, tag: 'ปีกแสง · รับดาเมจ −15%' },
  bi_magnificat:  { dmg: 0, heal: 0.08, speed: 0, tag: 'ฟื้น SP เร็ว 2 เท่า — ลดเวลาพัก SP' },
  bi_impositio:   { dmg: 0.08, heal: 0, speed: 0, tag: 'ATK +25' },
  bi_battlehymn:  { dmg: 0.12, heal: 0.06, speed: 0.20, el: 'holy', tag: 'อาวุธทั้งตี้เป็นธาตุแสง + ATK +10% + โจมตีเร็ว 30% — ฟาร์มธาตุมืด/อมตะได้เปรียบ' },
  /* นักกวี */
  bd_tempo:       { dmg: 0.12, heal: 0, speed: 0.06, tag: 'เพื่อนตีแรงขึ้นตามท่อนเพลง' },
  bd_warm:        { dmg: 0, heal: 0.09, speed: 0, tag: 'ทั้งทีมฟื้น HP 6% ทุก 5 วิ' },
  bd_stars:       { dmg: 0, heal: 0, speed: 0.08, tag: 'ร่ายลด 20% · CD ลด 10%' },
  bd_festival:    { dmg: 0.25, heal: 0.04, speed: 0.05, tag: 'เพื่อนใกล้กองไฟตีแรงขึ้น 25%' },
  /* ผู้จุดตะเกียง */
  lk_faith:       { dmg: 0.12, heal: 0, speed: 0, el: 'holy', tag: 'อาวุธทั้งตี้เป็นธาตุแสง + ตีอมตะ/ธาตุมืดแรงขึ้นอีก 20%' },
  lk_lamp:        { dmg: 0, heal: 0.15, speed: 0, tag: 'โคมแก้ว 4 ดวง ฮีลในแสงตลอดเวลา' },
  lk_flare:       { dmg: 0, heal: 0.08, speed: 0, tag: 'ฮีลใหญ่ 350% MATK จากโคม' },
  /* ผู้เลี้ยงดวงไฟ */
  ws_latch:       { dmg: 0, heal: 0.10, speed: 0, tag: 'ดวงไฟเกาะฮีลเพื่อนที่เลือดน้อยสุด' },
  ws_burst:       { dmg: 0, heal: 0.10, speed: 0, tag: 'ดวงไฟทุกดวงแตกฮีลทันที' },
};
function buffsOfJob(jobId) {
  const j = JOB[jobId]; if (!j) return [];
  return j.sk.filter((s) => BUFF_SKILLS[s.id]).map((s) => ({ id: s.id, n: s.n, d: s.d, ...BUFF_SKILLS[s.id] }));
}
const party = { members: ['traveler', 'traveler', 'traveler', 'traveler'], buffs: new Set() };
function refreshMembers() {
  const n = +pSize.value - 1;
  pMembers.innerHTML = Array.from({ length: n }, (_, i) => `<label class="sel"><span>สมาชิกคนที่ ${i + 2}</span><select data-mem="${i}">${D.jobs.map((j) => `<option value="${j.id}" ${party.members[i] === j.id ? 'selected' : ''}>${esc(j.n)}</option>`).join('')}</select></label>`).join('');
  $$('[data-mem]', pMembers).forEach((sel) => sel.onchange = () => { party.members[+sel.dataset.mem] = sel.value; refreshBuffs(); });
  refreshBuffs();
}
function partyJobIds() {
  const ids = [pJob.value];
  for (let i = 0; i < +pSize.value - 1; i++) ids.push(party.members[i]);
  return ids;
}
function refreshBuffs() {
  const ids = partyJobIds();
  const groups = ids.filter((x) => SUPPORT_JOBS.has(x)).map((x) => ({ job: JOB[x], buffs: buffsOfJob(x) })).filter((g) => g.buffs.length);
  const avail = groups.flatMap((g) => g.buffs);
  party.buffs = new Set([...party.buffs].filter((b) => avail.some((x) => x.id === b)));
  pBuffs.innerHTML = groups.length
    ? `<div style="width:100%;color:var(--tx2);font-size:.8rem">สกิลบัพจริงของอาชีพซัพพอร์ตในปาร์ตี้ — ติ๊กสกิลที่อัพมาแล้ว (ผลลัพธ์ประมาณการ):</div>` +
      groups.map((g) => `<div class="buffgrp"><b>${esc(g.job.n)}</b>` + g.buffs.map((b) =>
        `<label class="chip ${party.buffs.has(b.id) ? 'on' : ''}" title="${esc(b.d)}"><input type="checkbox" data-buff="${b.id}" ${party.buffs.has(b.id) ? 'checked' : ''}>${esc(b.n)} <small>${esc(b.tag)}</small></label>`).join('') + `</div>`).join('') +
      `<div id="buffSum" style="width:100%;color:var(--acc2);font-size:.8rem"></div>`
    : '<div class="hint" style="width:100%">ไม่มีอาชีพซัพพอร์ตในปาร์ตี้ — ไม่มีสกิลบัพให้เลือก (เพิ่มนักบวช/บิชอป/นักกวี/ผู้จุดตะเกียง เป็นต้น เพื่อปลดล็อก)</div>';
  $$('[data-buff]', pBuffs).forEach((c) => c.onchange = () => { c.checked ? party.buffs.add(c.dataset.buff) : party.buffs.delete(c.dataset.buff); c.closest('.chip').classList.toggle('on', c.checked); updateBuffSum(); });
}
function updateBuffSum() {
  const el = $('#buffSum'); if (!el) return;
  const be = buffEffects();
  const parts = [];
  if (be.dmg) parts.push('ดาเมจ +' + Math.round(be.dmg * 100) + '%');
  if (be.heal) parts.push('ฮีล/ลดพักฟื้น +' + Math.round(be.heal * 100) + '%');
  if (be.speed) parts.push('ยูทิลิตี้ +' + Math.round(be.speed * 100) + '%');
  if (be.el) parts.push('อาวุธธาตุ' + EL.th(be.el));
  el.textContent = parts.length ? 'รวมบัพที่ติ๊ก: ' + parts.join(' · ') : '';
}
/* รวมผลบัฟที่ติ๊กไว้ */
function buffEffects() {
  const out = { dmg: 0, heal: 0, speed: 0, el: null, list: [] };
  for (const id of party.buffs) {
    const b = BUFF_SKILLS[id]; if (!b) continue;
    out.dmg += b.dmg; out.heal += b.heal; out.speed += b.speed;
    if (b.el) out.el = b.el;
    out.list.push({ id, n: (D.skillNames[id] || {}).n || id, ...b });
  }
  out.dmg = Math.min(0.6, out.dmg); out.heal = Math.min(0.5, out.heal); out.speed = Math.min(0.6, out.speed);
  return out;
}
/* อัตราฆ่าต่อนาทีพร้อมตารางแยกปัจจัย */
function killRateFactors(size, be) {
  const base = 7;
  const partyMul = 1 + 0.15 * (size - 1);
  const dmgMul = 1 + be.dmg * 0.5;          // ดาเมจบัฟ → ฆ่าเร็วขึ้น
  const healMul = 1 + be.heal * 0.6;        // ฮีล/ลดดาเมจที่ได้รับ/ฟื้น SP → ลดเวลาพักฟื้น
  const utilMul = 1 + be.speed * 0.6;       // ร่ายเร็ว/CD ลด/เดินเร็ว
  const rate = base * partyMul * dmgMul * healMul * utilMul;
  return { base, partyMul, dmgMul, healMul, utilMul, rate };
}
pLv.addEventListener('input', () => pLvN.textContent = pLv.value);
pSize.addEventListener('change', refreshMembers);
pJob.addEventListener('change', refreshBuffs);
refreshMembers();

/* exp curve — ตาราง EXP จริงจากข้อมูลเกม (Lv1→2 … Lv98→99) */
const expToNext = (lv) => (D.xp && D.xp[lv - 1]) ?? Math.round(35 * Math.pow(lv, 1.65));
$('#pGo').addEventListener('click', buildPlan);

function buildPlan() {
  const jobId = pJob.value, charLv = +pLv.value, size = +pSize.value, goal = pGoal.value;
  const j = JOB[jobId], wts = wtsOf(j), line = setLineOf(jobId);
  const be = buffEffects();
  const dmgB = be.dmg, spd = be.speed, elBless = be.el;
  const kr = killRateFactors(size, be);
  const killRate = kr.rate;
  const mainEl = (j.sk.find((s) => s.el) || {}).el || 'neutral';
  const effEl = elBless || mainEl;
  buildPlan._effEl = effEl;
  const brks = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 50], [51, 60], [61, 70], [71, 80], [81, 90], [91, 99]];

  // target items for item mode
  const targets = [];
  if (goal !== 'lv') {
    const pool = D.weapons
      .filter((w) => wts.includes(w.wt) && w.src && w.src.kind === 'm' && w.lv >= charLv - 5 && w.lv <= charLv + 15)
      .sort((a, b) => {
        const wA = (a.wsk || []).some((x) => x[1] === jobId) ? 1 : 0, wB = (b.wsk || []).some((x) => x[1] === jobId) ? 1 : 0;
        return wB - wA || b.lv - a.lv;
      }).slice(0, 3);
    pool.forEach((w) => targets.push({ type: 'อาวุธ', n: w.n, mon: MON[w.src.mon], chance: w.src.chance }));
    const sets = D.sets.filter((s) => s.line === line && s.lv >= charLv - 5 && s.lv <= charLv + 15).slice(0, 2);
    sets.forEach((s) => s.sources.filter((r) => !r.boss).slice(0, 2).forEach((r) => targets.push({ type: 'ชุด ' + s.n, n: (s.pcs.find((p) => p.id === r.item) || {}).n || r.item, mon: MON[r.mon], chance: r.chance })));
  }

  const rows = brks.map(([a, b]) => {
    const mid = (a + b) / 2;
    const pick = bestMaps(mid, effEl, 1)[0];
    const monsAvgExp = pick.best.reduce((s, mn) => s + ((MON[mn.id] || {}).exp || 0), 0) / Math.max(1, pick.best.length);
    let gapPen = 1;
    if (mid < a || charLv > b) gapPen = charLv > b ? 0.5 : 1;
    const expPerMin = monsAvgExp * killRate * gapPen;
    const expNeed = Array.from({ length: b - a + 1 }, (_, i) => expToNext(a + i)).reduce((x, y) => x + y, 0);
    const hours = expNeed / (expPerMin * 60);
    const done = charLv >= b;
    const isCur = charLv >= a && charLv <= b;
    const itemCells = targets.slice(0, 4).map((t) => t ? `<small>${esc(t.n)} ← ${esc(t.mon?.n || '?')} (${pct(t.chance)}) ≈ ${Math.ceil(1 / t.chance / killRate / 60)} ชม.</small>` : '').join('<br>');
    return { a, b, pick, expNeed, expPerMin, hours, done, isCur, itemCells, monsAvgExp };
  });

  const totalHours = rows.reduce((s, r) => s + (r.done ? 0 : r.hours), 0);
  const totalExp = rows.reduce((s, r) => s + r.expNeed, 0);
  const remaining = rows.filter((r) => !r.done).reduce((s, r) => s + r.expNeed, 0);

  pOut.innerHTML = `
    <div class="sumgrid">
      <div class="sum"><b>${esc(j.n)}</b><small>อาชีพหลัก · ปาร์ตี้ ${size} คน</small></div>
      <div class="sum"><b>${Math.round(totalHours - rows.reduce((s, r) => s + (r.done ? r.hours : 0), 0))}</b><small>ชม. โดยประมาณ เหลือจาก Lv ${charLv} → 99</small></div>
      <div class="sum"><b>${killRate.toFixed(1)}</b><small>ตัว/นาที (ทั้งปาร์ตี้)</small></div>
      <div class="sum"><b>${be.list.length ? be.list.map((b) => b.n).join(' + ') : 'ไม่มีบัพ'}</b><small>สกิลบัพที่เปิด${dmgB ? ' · ดาเมจ +' + Math.round(dmgB * 100) + '%' : ''}${be.heal ? ' · ฮีล/พักฟื้น +' + Math.round(be.heal * 100) + '%' : ''}${spd ? ' · ยูทิลิตี้ +' + Math.round(spd * 100) + '%' : ''}</small></div>
    </div>
    ${elBless ? `<div class="card" style="border-color:var(--el-holy);margin-bottom:12px">🪽 <b>อาวุธทั้งตี้เป็นธาตุแสง</b> (จาก ${be.list.filter((b) => b.el).map((b) => b.n).join(' + ')}) — ปาร์ตี้ฟาร์มแมพ/มอน<b>ธาตุมืดและอมตะ</b>ได้เปรียบ (แสง ▲ เงา ×1.25 / อมตะ ×1.5) แผนด้านล่างจัดอันดับแมพใหม่ตามธาตุแสงแล้ว</div>` : ''}
    <div class="card" style="margin-bottom:12px"><b>🧮 ปัจจัยประสิทธิภาพการฟาร์มของปาร์ตี้</b>
      <table class="src"><tr><th>ปัจจัย</th><th>ค่า</th><th>ผลต่ออัตราฆ่า</th><th>ที่มา</th></tr>
        <tr><td>อัตราฆ่าพื้นฐาน (1 คน)</td><td>${kr.base} ตัว/นาที</td><td>—</td><td>สมมติฐานของเครื่องมือ</td></tr>
        <tr><td>จำนวนสมาชิก ${size} คน</td><td>×${kr.partyMul.toFixed(2)}</td><td>+${Math.round((kr.partyMul - 1) * 100)}%</td><td>แชร์เป้า ล่าพร้อมกัน</td></tr>
        ${be.dmg ? `<tr><td>สกิลบัพเดเมจ</td><td>ดาเมจ +${Math.round(be.dmg * 100)}%</td><td>×${kr.dmgMul.toFixed(2)}</td><td>${be.list.filter((b) => b.dmg).map((b) => b.n).join(' + ')}</td></tr>` : ''}
        ${be.heal ? `<tr><td>สกิลฮีล / ลดดาเมจที่ได้รับ / ฟื้น SP</td><td>พักฟื้นลดลง +${Math.round(be.heal * 100)}%</td><td>×${kr.healMul.toFixed(2)}</td><td>${be.list.filter((b) => b.heal).map((b) => b.n).join(' + ')}</td></tr>` : ''}
        ${be.speed ? `<tr><td>ยูทิลิตี้ (ร่ายเร็ว / CD ลด / เดินเร็ว)</td><td>×${be.speed.toFixed(2)}</td><td>×${kr.utilMul.toFixed(2)}</td><td>${be.list.filter((b) => b.speed).map((b) => b.n).join(' + ')}</td></tr>` : ''}
        <tr><td><b>รวมอัตราฆ่าปาร์ตี้</b></td><td colspan="3"><b>${killRate.toFixed(1)} ตัว/นาที</b></td></tr>
      </table>
    </div>
    ${drawSimCanvasPlan(j, charLv, rows.find((r) => r.isCur) || rows[0], wts, effEl)}
    <table class="brktbl"><tr><th>เลเวล</th><th>แมพที่แนะนำ</th><th>เป้ามอนหลัก</th><th>EXP/นาที ประมาณ</th><th>เวลา ประมาณ</th>${goal !== 'lv' ? '<th>ไอเทมที่ควรเก็บช่วงนี้</th>' : ''}</tr>
    ${rows.map((r) => `<tr class="${r.done ? 'done' : ''} ${r.isCur ? 'cur' : ''}">
      <td><b>Lv ${r.a}–${r.b}</b>${r.done ? ' ✓' : ''}${r.isCur ? ' ◀ ตอนนี้' : ''}</td>
      <td>📍 ${esc(r.pick.m.n)}<br><small>${esc(r.pick.m.regionN)} · ${esc(r.pick.m.lvText)}</small></td>
      <td>${r.pick.best.slice(0, 3).map((mn) => `${ELICON[mn.el]} ${esc(mn.n)} <small>Lv${mn.lv}</small>`).join('<br>')}</td>
      <td>${Math.round(r.expPerMin).toLocaleString()}<br><small>ต่อเลเวล ${Math.round(r.expNeed).toLocaleString()}</small></td>
      <td>${r.hours < 1 ? Math.ceil(r.hours * 60) + ' นาที' : r.hours.toFixed(1) + ' ชม.'}</td>
      ${goal !== 'lv' ? `<td>${r.itemCells}</td>` : ''}
    </tr>`).join('')}</table>
    ${goal !== 'lv' ? `<h2 style="margin-top:20px">รายการไอเทมเป้าหมาย (จากเลเวลตอนนี้)</h2>
      <table class="brktbl"><tr><th>ประเภท</th><th>ไอเทม</th><th>มอนที่ดรอป</th><th>โอกาส</th><th>ฆ่าต้องการ</th><th>เวลา ประมาณ</th></tr>
      ${targets.map((t) => `<tr><td>${esc(t.type)}</td><td>${esc(t.n)}</td><td>${t.mon ? esc(t.mon.n) : '?'}${t.mon?.boss ? ' 👑' : ''}<br><small>📍 ${t.mon ? t.mon.maps.map((mid) => esc(MAP[mid]?.n || mid)).join(' / ') : ''}</small></td><td>${pct(t.chance)}</td><td>${Math.ceil(1 / t.chance).toLocaleString()} ตัว</td><td>${Math.ceil(1 / t.chance / killRate / 60)} ชม.</td></tr>`).join('')}</table>` : ''}
    <p class="note" style="margin-top:14px">อัตราฆ่า: พื้นฐาน 7 ตัว/นาที/ปาร์ตี้, สมาชิกเพิ่ม 1 คน +15%, สกิลบัพดาเมจ/ฮีล/ยูทิลิตี้คิดเป็นปัจจัยคูณตามตารางด้านบน (ประมาณการจากผลสกิลจริงในวิกิ) · <b>EXP ต่อเลเวลใช้ตารางจริงของซีซัน 2</b> (Lv2 = 331 … Lv99 = 7,900,869) · EXP มอนจากวิกิ ค่าจริงขึ้นกับการเล่นจริง</p>`;

  // wire the plan canvas reveal
}
/* plan mini sim canvas */
function drawSimCanvasPlan(j, lv, row, wts, effEl) {
  const pick = row.pick;
  return `<div class="simwrap" style="margin:12px 0"><canvas id="planCanvas" width="900" height="300"></canvas>
    <div class="siminfo"><h3>ตอนนี้ (Lv ${lv}) → ฟาร์มที่ 📍 ${esc(pick.m.n)}</h3>
    <div>เขต <b>${esc(pick.m.regionN)}</b> · ${esc(pick.m.lvText)}</div>
    ${pick.best.slice(0, 5).map((mn) => { const [cls, txt] = effBadge(effEl, mn.el); return `<div class="eff"><span class="${cls}">${cls === 'ok' ? '▲' : cls === 'bad' ? '▼' : '•'} ${esc(mn.n)}</span> — ${txt}</div>`; }).join('')}
    <div class="note">ภาพจำลองจากธาตุที่ปาร์ตี้ตีได้จริง (${EL.th(effEl)}${effEl !== ((j.sk.find((s) => s.el) || {}).el || 'neutral') ? ' — จากสกิลบัพธาตุ' : ' (ธาตุสกิลหลักของ ' + esc(j.n) + ')'}) และมอนในแมพที่แนะนำ</div></div></div>`;
}
/* draw plan canvas after inject */
new MutationObserver(() => { const c = $('#planCanvas'); if (c && !c._done) { c._done = 1; drawPlanScene(c); } }).observe($('#pOut'), { childList: true });
function drawPlanScene(c) {
  const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  const j = JOB[pJob.value], lv = +pLv.value;
  const effEl = buildPlan._effEl || (j.sk.find((s) => s.el) || {}).el || 'neutral';
  const pick = bestMaps(lv, effEl, 1)[0];
  ctx.clearRect(0, 0, W, H);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1a2340'); sky.addColorStop(1, '#0d1a2b');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 83.1) % W, (i * 47.9) % (H * .5), 2, 2);
  ctx.fillStyle = '#16232e'; ctx.beginPath(); ctx.moveTo(0, H * .7); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, H * .7 + Math.sin(x / 90) * 10); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.fillStyle = '#f5e9c8'; ctx.beginPath(); ctx.arc(W - 90, 60, 22, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a2340'; ctx.beginPath(); ctx.arc(W - 82, 54, 18, 0, 7); ctx.fill();
  const wEl = effEl;
  pick.m.mons.slice(0, 5).forEach((mn, i) => drawMon(ctx, 130 + i * 150, H * .66 + (i % 2 ? 12 : -4), mn, wEl));
  drawHero(ctx, 70, H * .68, j, wEl);
  ctx.font = '600 15px "Noto Sans Thai"'; ctx.fillStyle = '#e8ecf7';
  ctx.fillText('🏕️ ' + pick.m.n + ' · ' + pick.m.regionN + ' — แผนปาร์ตี้ของคุณ', 16, 26);
  const size = +pSize.value;
  for (let i = 1; i < size; i++) drawHero(ctx, 40 + i * 46, H * .74, j, wEl);
}

/* ---------- boot ---------- */
function boot() {
  unnatifyAll();
  const h = location.hash.replace('#', '');
  showPage(pages.includes(h) ? h : 'build');
  openJob('firemage');
  renderDb();
  renderForge();
  bInit();
  refreshMembers();
}
boot();
