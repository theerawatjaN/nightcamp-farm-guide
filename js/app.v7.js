/* แคมป์ไกด์ — Night Camp farm guide (data: js/data.js, built from the official wiki) */
'use strict';
const D = window.NC_DATA;

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
const pages = ['guide', 'db', 'forge', 'plan'];
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; showPage(b.dataset.page); });
function showPage(p) {
  pages.forEach((x) => { $('#page-' + x).classList.toggle('on', x === p); });
  $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.page === p));
  location.hash = p;
}
$('#topMeta').textContent = 'ข้อมูล: ' + D.meta.season;

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
  drawJobHead(); drawLines(); drawWeapons(); drawMaps(); drawSets(); drawSimSelectors(); drawSim();
}

function drawJobHead() {
  const j = cur.job;
  const els = {}; j.sk.forEach((s) => { if (s.el) els[s.el] = (els[s.el] || 0) + 1; });
  const mainEl = Object.keys(els).sort((a, b) => els[b] - els[a])[0] || 'neutral';
  const style = j.sk.filter((s) => s.type === 'magic').length > j.sk.filter((s) => s.type === 'phys').length ? 'เวทมนตร์' : j.sk.some((s) => s.type === 'phys') ? 'ประชิด' : 'ซัพพอร์ต';
  $('#gHead').innerHTML = `<div class="jobhead" style="--c:${EL.col(mainEl)}">
    <div class="jobhead__pic">${ELICON[mainEl] || '🏕️'}</div>
    <div><h2 style="margin:0">${esc(j.n)}</h2>
      <div class="tags"><span class="pill">${D.jobsT[j.tier]}</span><span class="pill">${style}</span>${cur.wts.map((w) => `<span class="pill">${WT(w)}</span>`).join('')}${elTag(mainEl)}</div>
      <p>${esc(j.d)}</p>
      <div class="path">เส้นทาง: ${cur.path.map((x, i) => `<span class="${x.id === j.id ? 'cur' : ''}">${esc(x.n)}</span>${i < cur.path.length - 1 ? '<span class="arrow">›</span>' : ''}`).join(' ')}</div>
      <div class="stats"><span>HP โต/เลเวล <b>${j.hp}</b></span><span>SP โต/เลเวล <b>${j.sp}</b></span><span>สกิล <b>${j.sk.length}</b></span><span>เลเวลอาชีพสูงสุด <b>${j.maxJob}</b></span></div>
    </div></div>`;
}

/* --- skill lines + weapons per line --- */
function lineWeapons(lineSkillIds) {
  return D.weapons
    .filter((w) => w.wsk && w.wsk.some((b) => b[1] === cur.job.id && lineSkillIds.has(b[0])))
    .sort((a, b) => b.lv - a.lv);
}
function wepCard(w, wskBonus) {
  return `<div class="wep" data-item="${w.id}"><div class="ic" style="--el:${EL.col(w.el)}">${WTICON[w.wt] || '🗡️'}</div>
    <div class="nm" style="flex:1"><b>${esc(w.n)}</b>${kTag(w.k)}${rTag(w.r)}
      <small>${WT(w.wt)} · Lv ${w.lv} · ATK ${w.atk} · ${elTag(w.el)}</small>
      ${wskBonus ? `<small style="color:var(--pur)">${esc(D.skillNames[wskBonus[0]]?.n || wskBonus[0])} +${wskBonus[2]}%</small>` : ''}
      ${w.ab ? `<small>${esc(w.ab)}</small>` : ''}
      ${srcHtml(w.src)}</div></div>`;
}
function drawLines() {
  const j = cur.job;
  const lines = j.lines || [];
  $('#gLinesBox').innerHTML = lines.length ? lines.map((l) => {
    const skIds = new Set(j.sk.filter((s) => s.line === l.id).map((s) => s.id));
    const ws = lineWeapons(skIds);
    return `<div class="card"><div class="line-name">${ELICON[l.el] || ''} ${esc(l.n)} ${elTag(l.el)}</div>
      ${j.sk.filter((s) => s.line === l.id).map((s) => `<div class="skl"><b>${esc(s.n)}</b> <span class="pill">${s.active ? 'ใช้งาน' : 'พาสซีฟ'} · Lv${s.max}${s.cd ? ' · CD ' + s.cd + 's' : ''}</span><small>${esc(s.d)}</small></div>`).join('')}
      <h3 style="margin:10px 0 4px">อาวุธที่เสริมสายนี้</h3>
      ${ws.length ? ws.slice(0, 6).map((w) => wepCard(w, w.wsk.find((b) => b[1] === j.id && skIds.has(b[0])))).join('') : '<span class="hint">ยังไม่มีอาวุธที่เสริมสายนี้ในข้อมูล</span>'}
    </div>`;
  }).join('') : `<div class="card"><span class="hint">อาชีพนี้เป็นอาชีพเริ่มต้น/ฐาน — เลือกอาชีพลูกเพื่อดูสายการเล่น</span></div>`;
}

/* --- all weapons sorted by level --- */
function drawWeapons() {
  const onlyWsk = $('#gOnlyWsk').checked, ft = gWt.value, fe = gEl.value;
  let ws = D.weapons.filter((w) => cur.wts.includes(w.wt));
  if (ft) ws = ws.filter((w) => w.wt === ft);
  if (fe) ws = ws.filter((w) => w.el === fe);
  if (onlyWsk) ws = ws.filter((w) => w.wsk && w.wsk.some((b) => b[1] === cur.job.id));
  ws.sort((a, b) => a.lv - b.lv || (b.atk - a.atk));
  $('#gWeaponsBox').innerHTML = ws.map((w) => {
    const wsk = w.wsk && w.wsk.find((b) => b[1] === cur.job.id);
    return wepCard(w, wsk);
  }).join('') || '<p class="hint">ไม่พบอาวุธตามเงื่อนไข</p>';
}
[gWt, gEl].forEach((x) => x.addEventListener('change', drawWeapons));
$('#gOnlyWsk').addEventListener('change', drawWeapons);

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
gLv.addEventListener('input', () => { gLvN.textContent = gLv.value; drawMaps(); drawSim(); });

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
      <div class="pcs">${s.pcs.map((p) => `<span class="pill">${esc(p.n)}</span>`).join('')}</div>
      <div class="bonus">2 ชิ้น: <b>${esc(s.b2)}</b> · 3 ชิ้น: <b>${esc(s.b3)}</b>${s.pas ? ' · เซ็ตเต็ม: <b>' + esc(s.pas) + '</b>' : ''}</div>
      ${setSrcTable(s)}</div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' เซ็ต';
    bindDbFilters();
  } else if (dbTab === 'armors') {
    dbFilters.innerHTML = `<label class="sel"><span>ช่อง</span><select id="fKind">${['top', 'pants', 'robe', 'cape', 'hat', 'glasses', 'shield', 'acc'].map((s) => `<option value="${s}" ${dbState.kind === s ? 'selected' : ''}>${slotTh(s)}</option>`).join('')}</select></label>`;
    const list = D.armors.filter((a) => (!dbState.kind || a.s === dbState.kind) && matches(q, a.n, a.id, a.d, a.ab));
    list.sort((a, b) => a.lv - b.lv);
    dbBox.innerHTML = list.map((a) => `<div class="wep" data-item="${a.id}"><div class="ic">${slotIcon(a.s)}</div>
      <div class="nm" style="flex:1"><b>${esc(a.n)}</b>${rTag(a.r)}<small>${slotTh(a.s)} · Lv ${a.lv}${a.set ? ' · ชุด: ' + esc((D.sets.find((s) => s.id === a.set) || {}).n || '') : ''}</small>
      ${statHtml(a.st)} ${a.ab ? `<small>${esc(a.ab)}</small>` : ''} ${srcHtml(a.src)}</div></div>`).join('') || empty();
    dbCount.textContent = 'พบ ' + list.length + ' ชิ้น';
    bindDbFilters();
  } else if (dbTab === 'monsters') {
    dbFilters.innerHTML = `<label class="sel"><span>ธาตุ</span><select id="fEl">${selOpts(D.elements, dbState.el)}</select></label>
      <label class="check"><input type="checkbox" id="fBoss" ${dbState.kind === 'boss' ? 'checked' : ''}><span>เฉพาะบอส</span></label>`;
    let list = D.monsters.filter((m) => (!dbState.el || m.el === dbState.el) && (dbState.kind !== 'boss' || m.boss) && matches(q, m.n, m.id, m.st));
    list.sort((a, b) => a.lv - b.lv);
    dbBox.innerHTML = list.map((m) => `<div class="wep" data-item="${m.id}"><div class="ic" style="--el:${EL.col(m.el)}">${m.boss ? '👑' : ELICON[m.el]}</div>
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

/* ---------- item detail modal ---------- */
function closeModal() { $('#modal').hidden = true; }
$('#modalX').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (e) => { if (e.target === $('#modal')) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('click', (e) => {
  const c = e.target.closest('[data-item]');
  if (c) openModal(c.dataset.item);
});
function openModal(id) {
  const B = $('#modalBody');
  if (id.startsWith('rune:')) {
    const r = D.runes.find((x) => x.id === id.slice(5));
    B.innerHTML = `<h2>🃏 รูน ${esc(r.n.replace(/^รูน /, ''))}</h2><table class="src"><tr><th>มอนที่ดรอป</th><th>เลเวล</th><th>โอกาส</th><th>แมพ · เขต</th></tr>${r.droppers.map((d) => d.maps.map((m, i) => `<tr>${i === 0 ? `<td rowspan="${d.maps.length}">${esc(d.monN)}</td><td rowspan="${d.maps.length}">${d.lv}</td><td rowspan="${d.maps.length}">${pct(d.chance)}</td>` : ''}<td>${esc(m.n)} · ${esc(m.region)}</td></tr>`).join('')).join('')}</table>`;
  } else if (id.startsWith('set:')) {
    const s = D.sets.find((x) => x.id === id.slice(4));
    B.innerHTML = `<h2>${esc(s.n)}</h2><div class="kv"><dt>สาย</dt><dd>${LINE_TH[s.line] || s.line} · Lv ${s.lv}</dd><dt>ชิ้นส่วน</dt><dd>${s.pcs.map((p) => esc(p.n)).join(' + ')}</dd><dt>โบนัส 2 ชิ้น</dt><dd>${esc(s.b2)}</dd><dt>โบนัส 3 ชิ้น</dt><dd>${esc(s.b3)}</dd><dt>พาสซีฟเซ็ตเต็ม</dt><dd>${esc(s.pas) || '–'}</dd></div>${setSrcTable(s)}`;
  } else {
    const w = D.weapons.find((x) => x.id === id), a = w ? null : D.armors.find((x) => x.id === id), m = MON[id], mp = MAP[id];
    if (w) {
      const wsk = (w.wsk || []).map((b) => `<div>${esc(D.skillNames[b[0]]?.n || b[0])} (อาชีพ ${esc((JOB[b[1]] || {}).n || b[1])}) <b style="color:var(--pur)">+${b[2]}%</b></div>`).join('');
      B.innerHTML = `<h2>${WTICON[w.wt] || ''} ${esc(w.n)}</h2><div class="kv">
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
      B.innerHTML = `<h2>${slotIcon(a.s)} ${esc(a.n)}</h2><div class="kv">
        <dt>ช่องสวมใส่</dt><dd>${slotTh(a.s)} · Lv ${a.lv}</dd>
        <dt>ความหายาก</dt><dd>${rTag(a.r)}</dd>
        ${a.d ? `<dt>รายละเอียด</dt><dd>${esc(a.d)}</dd>` : ''}
        <dt>สเตตัส</dt><dd>${Object.keys(a.st).length ? statHtml(a.st) : '–'}</dd>
        ${a.ab ? `<dt>คุณสมบัติพิเศษ</dt><dd>${esc(a.ab)}</dd>` : ''}
        <dt>ชุด</dt><dd>${a.set ? esc((D.sets.find((s) => s.id === a.set) || {}).n || a.set) : 'ไม่อยู่ในชุด'}</dd>
        <dt>แหล่งดรอป</dt><dd>${a.src ? (a.src.kind === 'g' ? '🎁 กาชา/ร้าน' : `${esc(MON[a.src.mon]?.n || '')} · ${pct(a.src.chance)}`) : 'ยังไม่ระบุ'}</dd>
      </div>`;
    } else if (m) {
      B.innerHTML = `<h2>${m.boss ? '👑' : ELICON[m.el]} ${esc(m.n)}</h2><div class="kv">
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
let forgeTab = 'refine';
const forgeQ = $('#forgeQ'), forgeFilters = $('#forgeFilters'), forgeBox = $('#forgeBox');
$('#forgeTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; forgeTab = b.dataset.tab; $$('#forgeTabs button').forEach((x) => x.classList.toggle('on', x === b)); renderForge(); });
forgeQ.addEventListener('input', renderForge);

const GRADE_TH = ['เกรด 1', 'เกรด 2', 'เกรด 3', 'เกรด 4'];
function renderForge() {
  const q = forgeQ.value.trim();
  if (forgeTab === 'refine') {
    forgeFilters.innerHTML = '';
    const rates = D.refine.rates, cost = D.refine.cost;
    let html = `<div class="card" style="margin-bottom:12px"><b>กฎการตีบวก</b> (ซีซัน 2)
      <div class="bonus" style="margin-top:6px">ป๋าหมูหริ่งตีบวกอาวุธ/เกราะ/หมวก/เครื่องประดับจาก +1 ถึง +10 · อาวุธแต่ละเลเวล ATK +4% (+40% ที่ +10) · เกราะ/หมวกได้ DEF +1 ทุกสองเลเวล และ HP +0.5% ต่อเลเวล · ไม่มีขั้นการันตีแล้ว พลาดเสียแค่ค่าตี · <b>+9/+10</b> พลาดแล้วขั้นลดลง 1 และมีโอกาส <b>${D.refine.brk['9']}% / ${D.refine.brk['10']}%</b> ที่ชิ้นจะแตก (เปิดใช้<b>หินกันแตก</b> — หลอมจากแกนดาว ×1 + แท่งดาว ×2 — เพื่อกันแตก) · อาวุธเรืองแสง: +5 ประกาย, +7 น้ำเงิน, +8 ม่วง, +9 ส้มทอง, +10 สายรุ้ง</div></div>`;
    html += `<h3>โอกาสสำเร็จ (%)</h3><table class="src"><tr><th>ขั้น</th><th>${GRADE_TH.join('</th><th>')}</th></tr>`;
    for (let s = 1; s <= 10; s++) html += `<tr><td><b>+${s}</b></td>${[1, 2, 3, 4].map((g) => `<td>${rates[g][s]}%</td>`).join('')}</tr>`;
    html += '</table>';
    html += `<h3 style="margin-top:14px">ค่าเหรียญต่อการตี (เหรียญ, ต่อครั้ง)</h3><table class="src"><tr><th>ขั้น</th><th>${GRADE_TH.join('</th><th>')}</th></tr>`;
    for (let s = 0; s < 10; s++) html += `<tr><td><b>+${s + 1}</b></td>${[1, 2, 3, 4].map((g) => `<td>${cost[g][s].toLocaleString()}</td>`).join('')}</tr>`;
    html += '</table>';
    html += `<h3 style="margin-top:14px">วัสดุที่ใช้ตี (ต่อครั้ง)</h3>`;
    for (const [kind, k] of Object.entries(D.refine.kinds)) {
      html += `<div class="card setc" style="margin-bottom:10px"><h3>${esc(k.n)}</h3><table class="src"><tr><th>เกรด</th><th>ขั้น +1 → +10 (วัสดุต่อครั้ง)</th></tr>`;
      k.grades.forEach((grade, gi2) => {
        const brief = grade.map((step, i2) => '+(' + (i2 + 1) + '): ' + step.map((m) => m.mat + '×' + m.q).join(' + ')).join(' · ');
        html += `<tr><td>${GRADE_TH[gi2]}</td><td>${esc(brief)}</td></tr>`;
      });
      html += `</table></div>`;
    }
    forgeBox.innerHTML = html;
  } else if (forgeTab === 'opts') {
    forgeFilters.innerHTML = `<label class="sel"><span>สวมได้ที่</span><select id="foPool"><option value="">ทั้งหมด</option><option>อาวุธ</option><option>ชุดบน-ล่าง</option><option>หมวก</option><option>เครื่องประดับ</option></select></label>`;
    $('#foPool').onchange = renderForge;
    const pool = $('#foPool').value;
    const list = D.opts.filter((o) => (!pool || o.on.includes(pool)) && matches(q, o.label, o.id, o.subs.join(' ')));
    const GROUP_TH = { atk: 'โจมตี', skill: 'สกิล', def: 'ป้องกัน', special: 'พิเศษ (ดรอปเท่านั้น)' };
    const byGroup = {};
    list.forEach((o) => { (byGroup[o.g || 'atk'] = byGroup[o.g || 'atk'] || []).push(o); });
    forgeBox.innerHTML = `<div class="card" style="margin-bottom:12px"><b>กฎแถวออฟ</b>
      <div class="bonus" style="margin-top:6px">อุปกรณ์ทุกชิ้นดรอปพร้อมแถวออฟ: อาวุธ <b>1/2/2/3</b> แถวตามเกรด · เสื้อกับกางเกง <b>1/1/2/2</b> · หมวกกับเครื่องประดับ <b>1</b> (ชิ้นจากบอสเพิ่มอีก 1) · แต่ละแถวสุ่มขั้น: <b>ธรรมดา 60% · ดี 30% · เทพ 10%</b> · ซีซัน 2 ลดค่าทุกแถวลงครึ่งหนึ่ง และจำกัดแถวสเตตัสไว้ที่ +10 ต่อแถว (FLEE 50, ร่าย 30%, ดาเมจคริ 100%) · ชิ้นหนึ่งมีได้สูงสุด <b>4 แถว</b> และชนิดเดียวกันได้ไม่เกิน <b>2</b></div></div>
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
    forgeBox.innerHTML = `<p class="card hint" style="margin-bottom:12px">ไอเทมที่ดรอปมีโอกาส <b>1 ใน 50</b> เป็น<b>ของแปดเปื้อน</b>: มีคุณสมบัติเด่น (ข้อดีแรง) พร้อมข้อเสียจริง แสดงบนชิ้นสีม่วงพร้อมเครื่องหมาย ☾ — แปดเปื้อนติดไปกับชิ้นนั้นตลอด (ในกระเป๋าและร้านค้า)</p>
      <table class="src"><tr><th>คุณสมบัติ</th><th>ข้อดี</th><th>ข้อเสีย</th></tr>
      ${list.map((t2) => `<tr><td><b>☾ ${esc(t2.n)}</b></td><td>${esc(t2.up)}</td><td style="color:var(--red)">${esc(t2.dn)}</td></tr>`).join('')}</table>`;
  } else if (forgeTab === 'craft') {
    forgeFilters.innerHTML = `<label class="sel"><span>ประเภทอาวุธ</span><select id="fcType"><option value="">ทั้งหมด</option>${D.craft.map((c) => `<option value="${c.t}">${esc(c.n)}</option>`).join('')}</select></label>`;
    $('#fcType').onchange = renderForge;
    const tsel = $('#fcType').value;
    const list = D.craft.filter((c) => (!tsel || c.t === tsel) && matches(q, c.n, c.list.map((x) => x.n).join(' ')));
    forgeBox.innerHTML = `<p class="card hint" style="margin-bottom:12px">คราฟต์ที่<b>เตาหลอม</b>ด้วยใบสั่งงาน — ใช้วัสดุจากการฟาร์ม/เหมือง/สกิลชีวิต · แสดงเฉพาะสูตรที่ตีได้เอง (ของดรอป/กาชาไม่แสดง)</p>` +
      list.map((c) => `<div class="card setc"><h3>${esc(c.n)}</h3><table class="src"><tr><th>ไอเทม</th><th>เกรด</th><th>เหรียญ</th><th>วัสดุ</th></tr>
        ${c.list.map((x) => `<tr><td><b>${esc(x.n)}</b></td><td>${x.g ? GRADE_TH[x.g - 1] : '–'}</td><td>${x.coins.toLocaleString()}</td><td>${x.mats.map((m) => esc(m.n) + '×' + m.q).join(' + ')}</td></tr>`).join('')}</table></div>`).join('') || '<p class="hint">ไม่พบสูตร</p>';
  }
}

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

/* exp curve — ประมาณการ (เกมยังไม่เปิดเผยตารางจริง) */
const expToNext = (lv) => Math.round(35 * Math.pow(lv, 1.65));
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
    <p class="note" style="margin-top:14px">สมมติฐาน: อัตราฆ่าพื้นฐาน 7 ตัว/นาที/ปาร์ตี้, สมาชิกเพิ่ม 1 คน +15% อัตราฆ่า, สกิลบัพดาเมจ/ฮีล/ยูทิลิตี้คิดเป็นปัจจัยคูณตามตารางด้านบน (ประมาณการจากผลสกิลจริงในวิกิ), EXP ต่อเลเวลเป็นเส้นโค้งประมาณการ (เกมยังไม่เปิดเผยตารางจริง), EXP มอนจากวิกิ ค่าจริงขึ้นกับการเล่นจริง</p>`;

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
  const h = location.hash.replace('#', '');
  showPage(pages.includes(h) ? h : 'guide');
  openJob('firemage');
  renderDb();
  renderForge();
  refreshMembers();
}
boot();
