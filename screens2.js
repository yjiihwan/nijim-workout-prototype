'use strict';
/* C안 2/4 — 나머지 고객 화면: C9 코칭 대화 · C10 주간 리포트 · C11 기록 통계 · C12 업적 24 · C17 남이 보는 프로필 · C15b 친구 추가 · C15 친구 0명
   app.js 위에 얹는 파일. 계산(경험치·한도)은 engine.js 그대로, 여기는 «보여 주기»만. 실제 AI·서버 호출 없음. */

const ensure2 = () => {
  S.coach = S.coach || { agreed: false, used: 3, msgs: [] };
  S.fr = S.fr || { added: [], recv: ['오늘도출근', '근손실방지위원장'], sent: [], cheered: {} };
  S.dataDemo = S.dataDemo || 'normal';
  S.stTab = S.stTab || 'period'; S.stPer = S.stPer || 'week'; S.stEx = S.stEx || null;
  S.repWeek = S.repWeek ?? 1;
  S.friendZero = !!S.friendZero;
};
const COACH_MAX = 20;

/* ===== 공통 데이터: 통계·리포트·업적이 같이 쓰는 «세션 목록» ===== */
const DAY = 864e5;
const dOf = s => new Date(s + 'T00:00:00');
const addD = (s, n) => ymd(new Date(dOf(s).getTime() + n * DAY));
const weekStart = s => weekDaysOf(s)[0];
const doneSets = it => (it.sets || []).filter(x => x.done);
const exXPof = r => (r.xp || 0) - (r.xpBoost || 0);   // 운동 장부만(부스터로 늘어난 몫 = 아이템 장부 제외)

function histSessions() {   // S.hist(종목별 지난 기록) → 날짜별 세션
  const by = {};
  const snap = d => { const m = weekStart(d), k = (dOf(d) - dOf(m)) / DAY; return addD(m, k < 1.5 ? 0 : k < 3.5 ? 2 : 4); };   // 시연 기록을 주 3일(월·수·금)로 묶음
  Object.entries(S.hist || {}).forEach(([ex, arr]) => arr.forEach(h => { const d = snap(h.date); (by[d] = by[d] || []).push({ ex, sets: h.sets, min: h.min, level: h.level }); }));
  return Object.entries(by).map(([date, items], i) => ({ id: -1000 - i, date, place: '니짐 신림점', placeKind: 'center', v: 'auto', items, ro: true,
    summary: summaryOf(items), xp: Math.round(items.reduce((a, it) => a + itemBaseXP(it, itemVolume(it)), 0) + 70) }));
}
let MANY = null;
function manySessions() {   // 시연용 «데이터 많음» — 20주 · 주 3~5회 · 고정 시드라 매번 같은 그림
  if (MANY) return MANY;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const W = (ex, w, r, n) => ({ ex, sets: Array.from({ length: n }, () => ({ w, r, done: true })) });
  const out = []; let id = -5000;
  for (let wk = 19; wk >= 0; wk--) {
    const mon = addD(weekStart(TODAY), -7 * wk), g = 19 - wk, days = [0, 2, 4, 5, 6].filter(() => rnd() > .25).slice(0, 5);
    days.forEach((dd, k) => {
      const date = addD(mon, dd); if (date > TODAY) return;
      const kind = (g + k) % 4, items = [];
      if (kind === 0) items.push(W('bench', 50 + Math.min(g, 16) * 1.25 - (g % 5 === 4 ? 5 : 0), 10, 3), W('incline_db', 16 + Math.floor(g / 5) * 2, 10, 3), W('lateral', 6 + Math.floor(g / 8) * 2, 15, 3));
      if (kind === 1) items.push(W('lat_pulldown', 40 + Math.floor(g / 3) * 2.5, 12, 3), W('seated_row', 40 + Math.floor(g / 4) * 2.5, 12, 3), W('db_curl', 8 + Math.floor(g / 6) * 2, 12, 3));
      if (kind === 2) items.push(W('squat', 40 + Math.min(g, 18) * 2.5, 8, 4), W('leg_press', 90 + g * 5, 12, 3), W('plank', 0, 0, 0));
      if (kind === 3) items.push({ ex: 'treadmill', min: 20 + Math.round(rnd() * 15), level: 'normal', km: +(2.5 + rnd() * 2.5).toFixed(1) });
      if (kind === 2) items[2] = { ex: 'plank', sets: [{ s: 60, done: true }, { s: 60, done: true }] };
      const lesson = g % 3 === 0 && k === 0;
      if (lesson) items.unshift({ ex: 'lesson_pt', min: 50 });
      const xp = lesson ? 400 : Math.round(items.reduce((a, it) => a + itemBaseXP(it, itemVolume(it)), 0) + 70);
      out.push({ id: id--, date, place: rnd() > .85 ? '니짐 봉천점' : rnd() > .9 ? '집' : '니짐 신림점', placeKind: 'center', v: lesson ? 'lesson' : 'auto', selfieXP: !lesson && rnd() > .7 ? 20 : 0, items, ro: true,
        hour: rnd() > .85 ? 5 : rnd() > .85 ? 22 : 19, summary: summaryOf(items), xp, photo: k === 1 && g % 3 === 1 ? 'demo' : null });
    });
  }
  return (MANY = out);
}
const streakVal = () => S.dataDemo === 'empty' ? 0 : S.dataDemo === 'many' ? 20 : S.streakWeeks;
function statRecs() {
  ensure2();
  if (S.dataDemo === 'empty') return [];
  if (S.dataDemo === 'many') return manySessions();
  return [...S.records, ...histSessions()];
}
const byDate = rs => [...rs].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
const inRange = (rs, from, to) => rs.filter(r => r.date >= from && r.date <= to);
function partSets(rs) {   // 부위별 세트 수 — 유산소는 10분 = 1세트, 레슨은 1회 = 3세트(전신)
  const c = Object.fromEntries(PARTS.map(p => [p, 0]));
  rs.forEach(r => (r.items || []).forEach(it => { const e = EX[it.ex]; if (!e) return;
    const n = e.mode === 'cardio' ? Math.max(1, Math.round((it.min || 0) / 10)) : e.mode === 'lesson' ? 3 : doneSets(it).length; c[e.part] = (c[e.part] || 0) + n; }));
  return c;
}
function prEvents(rs) {   // 날짜순으로 훑으며 «그 종목 최고 기록을 넘은 세트» = PR
  const best = {}, ev = [];
  byDate(rs).forEach(r => (r.items || []).forEach(it => { const e = EX[it.ex]; if (!e || (e.mode !== 'wr' && e.mode !== 'r')) return;
    const top = doneSets(it).reduce((m, s) => setScore(e, s) > setScore(e, m || {}) ? s : m, null); if (!top) return;
    const sc = setScore(e, top);
    if (best[it.ex] != null && sc > best[it.ex]) ev.push({ date: r.date, ex: it.ex, set: top, score: sc });
    best[it.ex] = Math.max(best[it.ex] ?? 0, sc); }));
  return ev;
}
function streakDaysEnding(rs, end) { const ds = new Set(rs.map(r => r.date)); let n = 0, d = end; while (ds.has(d)) { n++; d = addD(d, -1); } return n; }

/* ===== 차트 조각 (dataviz 규칙: 얇은 막대·4px 둥근 끝·2px 선·보조선 흐리게·텍스트는 잉크색) ===== */
const C_ROSE = '#E8005C', C_SKY = '#1E8FE0', C_GOLD = '#B98417', C_VIO = '#7356F0', C_GRN = '#22A06B', C_ETC = '#C8C8D0';
const PART_COLOR = { 하체: C_ROSE, 가슴: C_SKY, 등: C_VIO, 유산소: C_GRN, 어깨: C_GOLD };   // 부위마다 고정 색(순위로 칠하지 않음) · 나머지는 «기타»
const HEAT = ['#F1F1F4', '#FFD1E2', '#FF8FB8', '#FF3D82', '#C2004D'];   // 한 색(로즈) 밝음→어두움
const emptyChart = (h, msg) => `<div class="cv-empty" style="height:${h}px">${msg}</div>`;

function barChart(vals, labels, { goal = null, unit = '회', h = 150 } = {}) {
  const W = 326, H = h, pl = 22, pb = 20, pt = 18, n = vals.length, max = Math.max(goal || 0, ...vals, 1);
  const bw = Math.min(16, (W - pl) / n * .55), x = i => pl + (W - pl) / n * (i + .5), y = v => pt + (H - pt - pb) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  const lastI = n - 1, maxI = vals.indexOf(Math.max(...vals));
  return `<svg class="cv" viewBox="0 0 ${W} ${H}" role="img" aria-label="막대 그래프">
    ${ticks.map(t => `<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}" class="gl2"/><text x="${pl - 6}" y="${y(t) + 3.5}" class="ax" text-anchor="end">${t}</text>`).join('')}
    ${goal ? `<line x1="${pl}" x2="${W}" y1="${y(goal)}" y2="${y(goal)}" class="goal"/>` : ''}
    ${vals.map((v, i) => { const top = y(v), bh = H - pb - top;
      return `<g class="bar-g"><rect x="${x(i) - 11}" y="${pt}" width="22" height="${H - pt - pb}" fill="transparent"><title>${labels[i]} · ${v}${unit}</title></rect>
      ${v > 0 ? `<path d="M${x(i) - bw / 2} ${H - pb}V${top + 4}q0 -4 4 -4h${bw - 8}q4 0 4 4V${H - pb}z" fill="${i === lastI ? C_ROSE : '#FF8FB8'}"/>` : ''}
      ${(i === lastI || (i === maxI && v > 0)) ? `<text x="${x(i)}" y="${top - 5}" class="lbl" text-anchor="middle">${v}</text>` : ''}</g>`; }).join('')}
    <line x1="${pl}" x2="${W}" y1="${H - pb}" y2="${H - pb}" class="base"/>
    ${labels.map((l, i) => (n <= 8 || i % Math.ceil(n / 6) === (n - 1) % Math.ceil(n / 6)) ? `<text x="${x(i)}" y="${H - 5}" class="ax" text-anchor="middle">${l}</text>` : '').join('')}
  </svg>`;
}
function lineChart(pts, { unit = 'kg', h = 160 } = {}) {   // pts: [{label, v, pr}]
  const W = 326, H = h, pl = 30, pr = 10, pb = 20, pt = 20, n = pts.length;
  const vs = pts.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), pad = Math.max(1, (hi - lo) * .15), a = Math.max(0, lo - pad), b = hi + pad;
  const x = i => n === 1 ? (pl + W - pr) / 2 : pl + (W - pl - pr) * i / (n - 1), y = v => pt + (H - pt - pb) * (1 - (v - a) / (b - a));
  const ticks = [a, (a + b) / 2, b].map(t => Math.round(t));
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join('');
  const bestI = vs.lastIndexOf(hi);
  return `<svg class="cv" viewBox="0 0 ${W} ${H}" role="img" aria-label="꺾은선 그래프">
    ${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}" class="gl2"/><text x="${pl - 6}" y="${y(t) + 3.5}" class="ax" text-anchor="end">${t}</text>`).join('')}
    <path d="${path}" fill="none" stroke="${C_ROSE}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => `<g><circle cx="${x(i)}" cy="${y(p.v)}" r="11" fill="transparent"><title>${p.label} · ${+p.v.toFixed(1)}${unit}${p.pr ? ' · PR' : ''}</title></circle>
      ${p.pr ? `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="${C_GOLD}" stroke="#fff" stroke-width="2"/>` : i === n - 1 ? `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="${C_ROSE}" stroke="#fff" stroke-width="2"/>` : ''}</g>`).join('')}
    <text x="${Math.min(W - pr - 2, Math.max(pl + 14, x(bestI)))}" y="${y(hi) - 8}" class="lbl" text-anchor="middle">최고 ${+hi.toFixed(1)}${unit}</text>
    <text x="${pl}" y="${H - 5}" class="ax">${pts[0].label}</text><text x="${W - pr}" y="${H - 5}" class="ax" text-anchor="end">${pts[n - 1].label}</text>
  </svg>`;
}
function donut(c) {   // 부위 5색 고정 + 기타(회색)
  const keys = Object.keys(PART_COLOR), etc = PARTS.filter(p => !PART_COLOR[p]).reduce((a, p) => a + (c[p] || 0), 0);
  const segs = [...keys.map(k => [k, c[k] || 0, PART_COLOR[k]]), ['기타', etc, C_ETC]].filter(s => s[1] > 0), tot = segs.reduce((a, s) => a + s[1], 0);
  if (!tot) return emptyChart(130, '이 주엔 부위 기록이 없어요');
  const R = 46, r = 30, cx = 60, cy = 60; let ang = -Math.PI / 2;
  const arcs = segs.map(([k, v, col]) => { const a0 = ang, a1 = ang + 2 * Math.PI * v / tot; ang = a1; const gap = segs.length > 1 ? .035 : 0;
    const p = (rad, t) => `${(cx + rad * Math.cos(t)).toFixed(2)} ${(cy + rad * Math.sin(t)).toFixed(2)}`, big = a1 - a0 - gap > Math.PI ? 1 : 0;
    if (segs.length === 1) return `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${col}" stroke-width="${R - r}"><title>${k} 100%</title></circle>`;
    return `<path d="M${p(R, a0 + gap / 2)}A${R} ${R} 0 ${big} 1 ${p(R, a1 - gap / 2)}L${p(r, a1 - gap / 2)}A${r} ${r} 0 ${big} 0 ${p(r, a0 + gap / 2)}Z" fill="${col}"><title>${k} ${v}세트 · ${Math.round(v / tot * 100)}%</title></path>`; }).join('');
  return `<div class="donutw"><svg viewBox="0 0 120 120" class="donut" role="img" aria-label="부위 비율">${arcs}<text x="60" y="58" text-anchor="middle" class="dn1">${tot}</text><text x="60" y="73" text-anchor="middle" class="dn2">세트</text></svg>
    <div class="legend">${segs.sort((p, q) => q[1] - p[1]).map(([k, v, col]) => `<div><i style="background:${col}"></i><span>${k}</span><b>${Math.round(v / tot * 100)}%</b><small>${v}세트</small></div>`).join('')}</div></div>`;
}
function hbars(c) {   // 부위 밸런스 — 한 색 막대 + 숫자
  const max = Math.max(1, ...PARTS.map(p => c[p] || 0));
  return `<div class="hbars">${PARTS.map(p => `<div class="hb"><span>${p}</span><div><i style="width:${(c[p] || 0) / max * 100}%"></i></div><b>${c[p] || 0}</b></div>`).join('')}</div>`;
}
function heatmap(rs, weeks) {
  const start = addD(weekStart(TODAY), -7 * (weeks - 1)), xpBy = {};
  rs.forEach(r => { xpBy[r.date] = (xpBy[r.date] || 0) + (r.xp || 0); });
  const lv = v => !v ? 0 : v < 120 ? 1 : v < 220 ? 2 : v < 350 ? 3 : 4;
  const gap = weeks > 16 ? 2 : 4, cell = Math.min(20, Math.floor((290 - gap * (weeks - 1)) / weeks));
  let cols = '', months = '';
  for (let w = 0; w < weeks; w++) { const mon = addD(start, 7 * w); let col = '';
    for (let d = 0; d < 7; d++) { const k = addD(mon, d), v = xpBy[k] || 0;
      col += `<i class="${k > TODAY ? 'fut' : ''} ${k === TODAY ? 'today' : ''}" style="width:${cell}px;height:${cell}px;background:${k > TODAY ? 'transparent' : HEAT[lv(v)]}" title="${md(k)} · ${v ? fmt(v) + ' XP' : '쉰 날'}"></i>`; }
    cols += `<div class="hcol" style="gap:${gap}px">${col}</div>`;
    months += `<span style="width:${cell}px">${+mon.slice(8) <= 7 ? `${+mon.slice(5, 7)}월` : ''}</span>`; }
  return `<div class="heat"><div class="hdow" style="gap:${gap}px">${['월', '', '수', '', '금', '', '일'].map(l => `<span style="height:${cell}px">${l}</span>`).join('')}</div><div><div class="hgrid" style="gap:${gap}px">${cols}</div><div class="hmon" style="gap:${gap}px">${months}</div></div></div>
  <div class="hleg">쉰 날 ${HEAT.map(c => `<i style="background:${c}"></i>`).join('')} 많이 한 날</div>`;
}
const demoCard = (title, act, cur, opts) => `<div class="card demo"><div class="h3">🧪 시연 도구 · ${title}</div><div class="chips white">${opts.map(([k, l]) => `<button class="chip ${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</button>`).join('')}</div></div>`;
const dataDemoCard = () => demoCard('그래프 데이터', 'dataDemo', S.dataDemo, [['normal', '보통(지금 기록)'], ['empty', '비어 있음'], ['many', '많음(20주)']]);
const PHOTO_SIM = (i = 0) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 120"><rect width="90" height="120" fill="${['#DDEBF7', '#F7E3EC', '#E8E6F7'][i % 3]}"/><circle cx="45" cy="44" r="16" fill="#9AA3B5"/><path d="M15 120c2-28 14-42 30-42s28 14 30 42z" fill="#9AA3B5"/><text x="45" y="16" font-size="9" text-anchor="middle" fill="#5A6275" font-family="sans-serif">시연 사진</text></svg>`)}`;

/* ===== C10 주간 리포트 ===== */
function weekReport(rs, mon) {
  const days = weekDaysOf(mon), sun = days[6], wr = inRange(rs, mon, sun), prev4 = inRange(rs, addD(mon, -28), addD(mon, -1));
  const sessions = new Set(wr.map(r => r.date)).size, ps = partSets(wr), prs = prEvents(rs).filter(e => e.date >= mon && e.date <= sun);
  const lessons = wr.filter(r => r.v === 'lesson'), exXP = wr.reduce((a, r) => a + exXPof(r), 0);
  const big4 = ['가슴', '등', '하체', '어깨'], missing = big4.filter(p => !ps[p]);
  let maxRun = 0; days.forEach(d => { maxRun = Math.max(maxRun, streakDaysEnding(wr, d)); });
  const sameLeg = days.slice(1).some((d, i) => { const a = partSets(wr.filter(r => r.date === days[i])), b = partSets(wr.filter(r => r.date === d)); return big4.some(p => a[p] && b[p]); });
  const avg4 = Math.round(new Set(prev4.map(r => r.date)).size / 4 * 10) / 10;
  return { days, mon, sun, wr, sessions, ps, prs, lessons, exXP, missing, maxRun, sameLeg, avg4 };
}
function vReport() {
  ensure2();
  const rs = statRecs(), mon = addD(weekStart(TODAY), -7 * S.repWeek), R = weekReport(rs, mon), goal = S.goal, t = S.type;
  const label = S.repWeek === 0 ? '이번 주(진행 중)' : S.repWeek === 1 ? '지난주' : `${S.repWeek}주 전`;
  const nav = `<div class="wnav"><button data-act="repWeek" data-d="1" ${S.repWeek >= 8 ? 'disabled' : ''} aria-label="이전 주">‹</button><div><b>${label}</b><small>${md(R.mon)} ~ ${md(R.sun)}</small></div><button data-act="repWeek" data-d="-1" ${S.repWeek <= 0 ? 'disabled' : ''} aria-label="다음 주">›</button></div>`;
  const thin = R.sessions < 2;
  const say = thin ? (R.sessions ? `이 주엔 ${R.sessions}번 기록했어. 2번 넘으면 부위·제안까지 정리해 줄게` : '이 주엔 기록이 없어. 1번만 해도 여기 채워져')
    : R.sessions >= goal ? `${R.sessions}번 운동해서 주 ${goal}회 목표 채웠어! 그만큼 한 칸 더 단단해졌어`
    : `${R.sessions}번 했어. 목표까지 ${goal - R.sessions}번 남았지만 나온 날이 쌓이고 있어`;
  const head = `<div class="card coach" id="repSay"><div class="cbox">${charFit(t, S.level, 52)}</div><div><div class="say">${esc(say)}</div></div></div>`;
  const tiles = `<div class="card" id="repTiles"><div class="tiles" style="margin-top:0"><div class="tile"><small>운동</small><b>${R.sessions}회</b><small>목표 ${goal}회</small></div><div class="tile"><small>운동 경험치</small><b>${fmt(R.exXP)}</b><small>XP</small></div><div class="tile"><small>연속</small><b>${streakVal()}주</b><small>${R.sessions >= goal ? '이번 주 +1' : '유지 중'}</small></div></div>
    <div class="muted" style="margin-top:8px">지난 4주 평균 주 ${R.avg4}회${R.sessions > R.avg4 ? ' · 평소보다 많이 했어요' : ''}</div></div>`;
  if (thin) return `${subHead('주간 리포트', S.repFrom || 'stats', S.repFrom === 'coach' ? '코치' : '통계')}<div class="sec">${nav}${head}${tiles}
    <div class="card zero-card" id="repThin"><div class="h3">데이터가 아직 적어요</div><div class="muted">한 주에 2번 이상 기록하면 부위 비율·PR·다음 주 제안·휴식 권고까지 보여 드려요.</div><button class="btn" data-act="start" style="margin-top:12px">오늘 운동 기록하기</button></div>
    ${dataDemoCard()}</div>`;
  const prHTML = R.prs.length ? R.prs.map(e => `<div class="rec"><div><b>${EX[e.ex].name} <span class="prtag">PR</span></b><small>${md(e.date)} · ${setTxt(EX[e.ex], e.set)}</small></div></div>`).join('') : '<div class="muted">이 주엔 PR이 없어요 · 무게보다 꾸준함이 먼저예요</div>';
  const lessonHTML = R.lessons.length ? R.lessons.map(r => `<div class="rec"><div><b>${esc(summaryOf(r.items || []) || 'PT 수업')}</b><small>${md(r.date)} · ${esc(r.place)}</small></div><span class="lesson2x">★ 2배 +${fmt(r.xp)} XP</span></div>`).join('') : '';
  const sugg = R.missing.length ? `다음 주엔 <b>${R.missing.join('·')}</b> 한 번 넣어 볼까요? 이번 주엔 비어 있었어요` : '큰 부위(가슴·등·하체·어깨)를 다 챙겼어요. 이대로 가요';
  const plateau = (() => { const ev = prEvents(rs).filter(e => e.ex === 'bench'); const last = ev.length ? ev[ev.length - 1].date : null; const wks = last ? Math.floor((dOf(R.sun) - dOf(last)) / (7 * DAY)) : 0;
    return wks >= 4 && rs.some(r => r.date >= mon && r.date <= R.sun && (r.items || []).some(i => i.ex === 'bench')) ? `벤치프레스가 ${wks}주째 제자리예요. 다음엔 2.5kg만 올려 볼까요?` : ''; })();
  const rest = R.maxRun >= 3 ? `${R.maxRun}일 연속 운동한 날이 있었어요. 다음 주엔 사이사이 하루씩 쉬어 가요` : R.sameLeg ? '같은 부위를 이틀 연달아 한 날이 있었어요. 부위를 번갈아 가면 회복이 빨라요' : '쉬는 날을 잘 섞었어요. 지금 리듬 좋아요';
  return `${subHead('주간 리포트', S.repFrom || 'stats', S.repFrom === 'coach' ? '코치' : '통계')}<div class="sec">${nav}${head}${tiles}
  <div class="card" id="repDonut"><div class="h3">부위 비율</div>${donut(R.ps)}</div>
  ${lessonHTML ? `<div class="card" id="repLesson"><div class="h3">레슨 · 선생님 확인 2배</div>${lessonHTML}</div>` : ''}
  <div class="card" id="repPR"><div class="h3">이 주의 PR</div>${prHTML}</div>
  <div class="card" id="repSugg"><div class="h3">다음 주 제안</div><div class="rline">💡 ${sugg}</div>${plateau ? `<div class="rline">📈 ${plateau}</div>` : ''}<div class="rline ${R.maxRun >= 3 || R.sameLeg ? 'restw' : ''}">🛌 ${rest}</div></div>
  <div class="muted" style="text-align:center;margin:4px 0 12px">리포트는 매주 월요일 아침에 만들어져요 · 표정·사진은 리포트에 나오지 않아요</div>
  ${dataDemoCard()}</div>`;
}

/* ===== C11 기록 통계 ===== */
function vStats2() {
  ensure2();
  const rs = statRecs(), all = byDate(rs).reverse();
  const seg = `<div class="seg"><button class="${S.stTab === 'period' ? 'on' : ''}" data-act="stTab" data-v="period">주/월</button><button class="${S.stTab === 'ex' ? 'on' : ''}" data-act="stTab" data-v="ex">운동별</button></div>`;
  const repBtn = `<button class="card replink tap" data-act="report" id="goReport"><div><b>주간 리포트</b><small>지난주 돌아보기 · 부위·PR·다음 주 제안</small></div><span class="muted">›</span></button>`;
  const body = S.stTab === 'ex' ? statsEx(rs) : statsPeriod(rs);
  const photos = rs.filter(r => r.photo);
  const photoCard = `<div class="card" id="stPhotos"><div class="h3">내 사진 모아보기 <span class="muted" style="font-weight:500">${LOCK.replace('class="ico"', 'class="ico sm"')} 나만 봐요</span></div>
    ${photos.length ? `<div class="pgrid">${photos.slice(-9).reverse().map((r, i) => `<div class="pcell"><img src="${r.photo === 'demo' ? PHOTO_SIM(i) : r.photo}" alt=""><small>${md(r.date)}</small></div>`).join('')}</div><div class="muted" style="margin-top:8px">친구·프로필·리포트엔 보이지 않아요 · 지우기는 기록 상세나 설정에서</div>`
      : '<div class="muted">아직 사진이 없어요 · 운동 끝나고 [오운완 셀카]를 찍으면 여기 모여요(나만 봐요)</div>'}</div>`;
  const list = `<div class="card" id="stList"><div class="h2" style="font-size:16px">전체 기록 <span class="muted" style="font-weight:500">${all.length}건</span></div>${all.length ? all.slice(0, S.stMore ? 60 : 10).map(r => `<div class="rec ${r.ro ? '' : 'tap'}" ${r.ro ? '' : `data-act="rec" data-id="${r.id}"`}><div><b>${esc(r.summary)}</b><small>${r.date} · ${esc(r.place)}</small></div><span class="xp">+${fmt(r.xp)} XP</span></div>`).join('') + (all.length > (S.stMore ? 60 : 10) ? (S.stMore ? `<div class="muted" style="padding-top:8px">외 ${all.length - 60}건</div>` : `<button class="btn ghost" data-act="stMore" style="margin-top:10px">${all.length - 10}건 더 보기</button>`) : '') : '<div class="muted">기록이 없어요</div>'}</div>`;
  return `${subHead('통계')}<div class="sec">${seg}${body}${repBtn}${photoCard}${list}${dataDemoCard()}</div>`;
}
function statsPeriod(rs) {
  const wk = S.stPer === 'week', mon0 = weekStart(TODAY);
  const per = `<div class="chips" style="margin-bottom:12px">${[['week', '주'], ['month', '월']].map(([k, l]) => `<button class="chip ${S.stPer === k ? 'on' : ''}" data-act="stPer" data-v="${k}">${l}</button>`).join('')}</div>`;
  const curFrom = wk ? mon0 : TODAY.slice(0, 8) + '01', cur = inRange(rs, curFrom, TODAY);
  const tiles = `<div class="card" id="stTiles"><div class="tiles" style="margin-top:0"><div class="tile"><small>${wk ? '이번 주' : '이번 달'}</small><b>${new Set(cur.map(r => r.date)).size}회</b></div><div class="tile"><small>운동 경험치</small><b>${fmt(cur.reduce((a, r) => a + exXPof(r), 0))}</b></div><div class="tile"><small>연속</small><b>${streakVal()}주</b></div></div></div>`;
  let vals, labels;
  if (wk) { vals = []; labels = []; for (let i = 11; i >= 0; i--) { const m = addD(mon0, -7 * i); vals.push(new Set(inRange(rs, m, addD(m, 6)).map(r => r.date)).size); labels.push(i === 0 ? '이번 주' : `${+m.slice(5, 7)}/${+m.slice(8)}`); } }
  else { vals = []; labels = []; const d = dOf(TODAY); for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1), k = ymd(x).slice(0, 7); vals.push(new Set(rs.filter(r => r.date.startsWith(k)).map(r => r.date)).size); labels.push(`${x.getMonth() + 1}월`); } }
  const empty = !vals.some(v => v);
  const graph = `<div class="card" id="stGraph"><div class="h3">${wk ? `최근 12주 운동 횟수 <span class="muted" style="font-weight:500">· 점선 = 목표 주 ${S.goal}회</span>` : '최근 6개월 운동 횟수'}</div>${empty ? emptyChart(150, '기록이 쌓이면 여기 그래프가 생겨요') : barChart(vals, labels, { goal: wk ? S.goal : null })}</div>`;
  const heat = `<div class="card" id="stHeat"><div class="h3">운동 달력 · ${wk ? '최근 12주' : '최근 6개월'}</div>${heatmap(rs, wk ? 12 : 26)}${empty ? '<div class="muted" style="margin-top:6px">아직 칠해진 칸이 없어요</div>' : ''}</div>`;
  const pFrom = wk ? addD(mon0, -21) : addD(TODAY, -89), ps = partSets(inRange(rs, pFrom, TODAY)), tot = PARTS.reduce((a, p) => a + ps[p], 0);
  const up = ps['가슴'] + ps['등'] + ps['어깨'] + ps['팔'], low = ps['하체'];
  const avgUp = up / 4, bal = !tot ? '' : avgUp < low * .5 ? '하체에 비해 위쪽(가슴·등·어깨·팔)이 적어요' : low < avgUp * .5 ? '위쪽에 비해 하체가 적어요' : '위아래 균형이 괜찮아요';   // 위쪽은 4부위 평균과 하체 1부위를 비교
  const balance = `<div class="card" id="stBalance"><div class="h3">부위 밸런스 · ${wk ? '최근 4주' : '최근 3개월'} 세트 수</div>${tot ? hbars(ps) + `<div class="muted" style="margin-top:8px">${bal}</div>` : emptyChart(90, '부위 기록이 없어요')}</div>`;
  const best = {}; prEvents(rs).forEach(e => { best[e.ex] = e; });
  rs.forEach(r => (r.items || []).forEach(it => { const e = EX[it.ex]; if (!e || e.mode !== 'wr' || best[it.ex]) return; const top = doneSets(it)[0]; if (top) best[it.ex] = { ex: it.ex, set: top, date: r.date, score: setScore(e, top), first: true }; }));
  const prList = Object.values(best).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const pr = `<div class="card" id="stPR"><div class="h3">PR · 종목별 최고 기록</div>${prList.length ? prList.map(e => `<div class="rec tap" data-act="stExGo" data-v="${e.ex}"><div><b>${EX[e.ex].name}</b><small>${md(e.date)}${e.first ? ' · 첫 기록' : ' · PR'}</small></div><span class="xp">${setTxt(EX[e.ex], e.set)}</span></div>`).join('') : '<div class="muted">아직 PR이 없어요</div>'}</div>`;
  return per + tiles + graph + heat + balance + pr;
}
function statsEx(rs) {
  const cnt = {}; rs.forEach(r => (r.items || []).forEach(it => { const e = EX[it.ex]; if (e && e.mode !== 'lesson') cnt[it.ex] = (cnt[it.ex] || 0) + 1; }));
  const exs = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 8);
  if (!exs.length) return `<div class="card" id="stExEmpty">${emptyChart(150, '운동을 기록하면 종목별 그래프가 생겨요')}</div>`;
  const cur = exs.includes(S.stEx) ? S.stEx : exs[0], e = EX[cur];
  const chips = `<div class="chips" style="margin-bottom:12px" id="stExChips">${exs.map(x => `<button class="chip ${x === cur ? 'on' : ''}" data-act="stEx" data-v="${x}">${EX[x].name}</button>`).join('')}</div>`;
  const prDates = new Set(prEvents(rs).filter(p => p.ex === cur).map(p => p.date));
  const ss = byDate(rs).flatMap(r => (r.items || []).filter(it => it.ex === cur).map(it => ({ r, it })));
  const val = ({ it }) => e.mode === 'cardio' ? (it.min || 0) : e.mode === 'wr' ? Math.max(...doneSets(it).map(s => e1rm(s))) : Math.max(...doneSets(it).map(s => setScore(e, s)));
  const unit = e.mode === 'cardio' ? '분' : e.mode === 'wr' ? 'kg' : e.mode === 't' ? '초' : '회';
  const pts = ss.filter(x => e.mode === 'cardio' || doneSets(x.it).length).map(x => ({ label: `${+x.r.date.slice(5, 7)}/${+x.r.date.slice(8)}`, v: val(x), pr: prDates.has(x.r.date) }));
  const what = e.mode === 'wr' ? '환산 1RM(무게×횟수)' : e.mode === 'cardio' ? '운동 시간' : e.mode === 't' ? '최고 버틴 시간' : '최고 횟수';
  const graph = pts.length >= 3 ? lineChart(pts, { unit }) : emptyChart(150, `${e.name} 기록이 3번 이상이면 그래프가 생겨요 (지금 ${pts.length}번)`);
  const hi = pts.length ? Math.max(...pts.map(p => p.v)) : 0;
  const tiles = `<div class="tiles" style="margin-top:12px"><div class="tile"><small>최고</small><b>${+hi.toFixed(1)}${unit}</b></div><div class="tile"><small>기록</small><b>${pts.length}번</b></div><div class="tile"><small>PR</small><b>${prDates.size}번</b></div></div>`;
  const recent = ss.slice(-5).reverse().map(({ r, it }) => `<div class="rec"><div><b>${md(r.date)}</b><small>${esc(r.place)}</small></div><span class="xp" style="color:var(--ink)">${e.mode === 'cardio' ? `${it.min}분${it.km ? ` · ${it.km}km` : ''}` : setsTxt(e, doneSets(it))}${prDates.has(r.date) ? ' <span class="prtag">PR</span>' : ''}</span></div>`).join('');
  return `${chips}<div class="card" id="stExGraph"><div class="h3">${e.name} · ${what}</div>${graph}${pts.some(p => p.pr) ? `<div class="hleg"><i style="background:${C_GOLD};border-radius:50%"></i> PR 찍은 날</div>` : ''}${tiles}</div>
  <div class="card" id="stExRecent"><div class="h3">최근 기록</div>${recent}</div>`;
}

/* ===== C12 업적 24개 (PLAN §2-5 · 각 업적 = 업적으로만 얻는 꾸미기 1개) ===== */
const AI = {   // 단순 선 아이콘 — 기존 .ico 와 같은 굵기·둥근 끝
  flag: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>', cam: '<path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.6 3-5.4 3.5-9 2.3 1.4 3.4 3.4 3.5 5.2 1-.8 1.6-2 1.7-3.2 2.4 1.9 4.3 4.3 4.3 7 0 3.4-2.6 6-6.5 6z"/>',
  compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>', pin: '<path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  bldg: '<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/>', pie: '<path d="M12 3v9h9"/><circle cx="12" cy="12" r="8.5"/>',
  sun: '<path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 6v3M5.6 9.6l1.8 1.8M18.4 9.6l-1.8 1.8"/>', moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z"/>',
  shoe: '<path d="M3 16.5V11l4-1 3 3 5-1 6 2.5v2z"/><path d="M3 19.5h18"/>', people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
  crown: '<path d="M4 18h16l1-10-5 4-4-6-4 6-5-4z"/>', teach: '<circle cx="9" cy="7" r="3"/><path d="M4 20a5 5 0 0 1 10 0"/><path d="M15 5h6v6h-4"/>',
};
function achieveList(all = false) {
  const rs = statRecs(), dates = new Set(rs.map(r => r.date)), n = dates.size;
  const exN = new Set(rs.flatMap(r => (r.items || []).map(i => i.ex)).filter(x => EX[x] && EX[x].mode !== 'lesson')).size;
  const places = new Set(rs.map(r => placeBase(r.place))).size, branches = new Set(rs.map(r => placeBase(r.place)).filter(p => p.startsWith('니짐 '))).size;
  const lessons = rs.filter(r => r.v === 'lesson').length, prs = prEvents(rs).length + rs.reduce((a, r) => a + (r.items || []).reduce((b, i) => b + doneSets(i).filter(s => s.pr).length, 0), 0);
  const km = rs.reduce((a, r) => a + (r.items || []).reduce((b, i) => b + (i.km || 0), 0), 0);
  const dawn = rs.filter(r => r.hour != null && r.hour < 6).length, night = rs.filter(r => r.hour != null && r.hour >= 22).length;
  const weeks = {}; rs.forEach(r => { const k = weekStart(r.date); weeks[k] = weeks[k] || []; weeks[k].push(r); });
  const parts5 = Math.max(0, ...Object.values(weeks).map(w => { const p = partSets(w); return PARTS.filter(x => x !== '유산소' && p[x]).length; }));
  const allParts4w = (() => { const p = partSets(inRange(rs, addD(TODAY, -27), TODAY)); return PARTS.filter(x => p[x]).length; })();
  const streak = streakVal(), friends = friendsAll().length;
  const photo = rs.some(r => r.photo || r.selfieXP > 0 || r.v === 'selfie');
  const A = (cat, icon, name, cond, cur, goal0, item, extra) => { const o = CFG.ACH[name] || {}, goal = o.goal || goal0;
    return { cat, icon, name, cond: goal === goal0 ? cond : cond.replace(String(goal0), String(goal)), cur: Math.min(cur, goal), goal, goal0, done: cur >= goal, item, extra, off: !!o.off }; };
  return [
    A('시작', 'flag', '첫 기록', '운동을 처음 기록', n, 1, '새싹 배지'),
    A('시작', 'cam', '첫 오운완', '오운완 셀카 첫 인증', photo ? 1 : 0, 1, '반짝 필름 테두리'),
    A('시작', 'bolt', '첫 PR', '내 최고 기록 처음 넘기', prs ? 1 : 0, 1, '번개 머리핀'),
    A('시작', 'teach', '첫 레슨', '선생님 확인 레슨 1회', lessons ? 1 : 0, 1, '호루라기 목걸이'),
    A('누적', '10', '운동 10회', '운동한 날 10일', n, 10, '동메달'),
    A('누적', '50', '운동 50회', '운동한 날 50일', n, 50, '은메달'),
    A('누적', '100', '운동 100회', '운동한 날 100일', n, 100, '금메달'),
    A('누적', '300', '운동 300회', '운동한 날 300일', n, 300, '무지개 메달'),
    A('습관', 'flame', '4주 연속', '주간 목표 4주 연속 달성', streak, 4, '불꽃 리본'),
    A('습관', 'flame', '12주 연속', '주간 목표 12주 연속 달성', streak, 12, '불꽃 망토'),
    A('습관', 'flame', '26주 연속', '주간 목표 26주(반년) 연속 달성', streak, 26, '불사조 깃털', '보충'),
    A('탐험', 'compass', '운동 10종', '서로 다른 운동 10종 기록', exN, 10, '탐험가 모자'),
    A('탐험', 'pin', '장소 3곳', '장소 3곳에서 기록(집·야외 포함)', places, 3, '여행 스티커'),
    A('탐험', 'bldg', '지점 2곳', '니짐 지점 2곳 방문(통합 멤버십)', branches, 2, '지점 도장 수첩'),
    A('균형', 'pie', '한 주 5부위', '한 주에 5부위 운동', parts5, 5, '저울 배지'),
    A('균형', 'pie', '4주 전 부위', '4주 안에 8부위 모두 운동', allParts4w, 8, '오색 손목밴드', '보충'),
    A('시간', 'sun', '새벽 운동', '새벽 6시 전 운동 5회', dawn, 5, '새벽 별 배경'),
    A('시간', 'moon', '밤 운동', '밤 10시 후 운동 5회', night, 5, '달빛 배경'),
    A('유산소', 'shoe', '첫 10km', '유산소 거리 누적 10km', Math.floor(km), 10, '러닝 양말', '보충'),
    A('유산소', 'shoe', '누적 100km', '유산소 거리 누적 100km', Math.floor(km), 100, '날개 운동화'),
    A('레슨', 'star', '레슨 10회', '선생님 확인 레슨 10회', lessons, 10, '선생님 사인 배지'),
    A('레슨', 'star', '레슨 30회', '선생님 확인 레슨 30회', lessons, 30, '황금 호루라기'),
    A('친구', 'people', '첫 친구', '친구 1명 맺기', friends, 1, '우정 팔찌'),
    A('친구', 'crown', '리그 1위', '친구 주간 리그 1위 1회', 0, 1, '리그 왕관(영구)'),
  ].filter(a => all || !a.off);
}
const badge = a => `<div class="bdg ${a.done ? 'on' : ''}">${/^\d+$/.test(a.icon) ? `<b class="bnum">${a.icon}</b>` : `<svg viewBox="0 0 24 24">${AI[a.icon]}</svg>`}${a.done ? '' : `<span class="blk">${LOCK.replace('class="ico"', 'class="ico"')}</span>`}</div>`;
function achieveCard() {
  const L = achieveList(), done = L.filter(a => a.done).length;
  return `<div class="card" id="achCard"><div style="display:flex;justify-content:space-between;align-items:baseline"><div class="h2" style="font-size:16px;margin:0">업적</div><span class="muted"><b style="color:var(--ink)">${done}</b>/${L.length} 달성</span></div>
  <div class="muted" style="margin:4px 0 10px">업적 보상은 꾸미기 아이템 · 상점에서 못 사요</div>
  <div class="achs">${L.map((a, i) => `<button class="ach tap" data-act="ach" data-v="${i}">${badge(a)}<small>${a.name}</small>${a.done ? '' : `<em>${a.cur}/${a.goal}</em>`}</button>`).join('')}</div></div>
  <button class="card replink tap" data-act="prof" data-v="me" id="goMyProfile"><div><b>남이 보는 내 프로필</b><small>레벨·칭호·운동으로 쌓은 경험치 비율이 공개돼요</small></div><span class="muted">›</span></button>`;
}
function achSheet(i) {
  const a = achieveList()[i];
  sheet(`<div style="display:flex;gap:14px;align-items:center">${badge(a)}<div><div class="h2" style="margin:0">${a.name}</div><div class="muted">${a.cat} · ${a.done ? '달성!' : '아직 잠겨 있어요'}</div></div></div>
  <div class="xrow" style="margin-top:12px"><span>조건</span><b>${a.cond}</b></div>
  <div class="xrow"><span>진행</span><b>${a.cur}/${a.goal}</b></div><div class="bar thin"><i style="width:${Math.round(a.cur / a.goal * 100)}%"></i></div>
  <div class="xrow"><span>보상(업적 전용)</span><b>${a.item}</b></div>
  <div class="muted" style="margin-top:6px">업적 아이템은 업적으로만 얻어요 · 돈으로 살 수 없는 자랑거리${a.extra ? ' · <b>개발봇 보충안(형 확인 대기)</b>' : ''}</div>
  <button class="btn" data-act="shClose" style="margin-top:14px">닫기</button>`);
}

/* ===== 친구 데이터 · C17 프로필 ===== */
const cumXP = lv => { let t = 0; for (let n = 1; n < lv; n++) t += need(n); return t; };
const exRatio = (lv, pureLv) => Math.round(cumXP(Math.max(1, pureLv ?? lv)) / Math.max(1, cumXP(lv)) * 100);
const PAID_TIER = ['', '1만P 미만', '1~5만P', '5만P 이상'];
const FRIEND_EXTRA = { 운동하는곰: { streak: 9, ach: 12 }, 새벽러너: { streak: 14, ach: 15 }, 벤치왕: { streak: 3, ach: 8 }, 필라테스러: { streak: 2, ach: 6 }, 헬린이9일차: { streak: 1, ach: 2 } };
const STRANGERS = [
  { n: '오늘도출근', t: 'capy', lv: 22, week: 760, rate: 67, paid: 0, streak: 4, ach: 7, code: 'NJ-CAPY2' },
  { n: '근손실방지위원장', t: 'imu', lv: 58, week: 1800, rate: 100, paid: 3, pure: 31, streak: 6, ach: 11, code: 'NJ-IMU58' },
  { n: '퇴근후스쿼트', t: 'ppiyak', lv: 15, week: 540, rate: 50, paid: 1, pure: 13, streak: 2, ach: 5, code: 'NJ-PPI15' },
];
const personOf = name => { const f = FRIENDS.find(x => x.n === name) || STRANGERS.find(x => x.n === name); return f ? { ...f, ...(FRIEND_EXTRA[f.n] || {}) } : null; };
function friendsAll() { ensure2(); return S.friendZero ? [] : [...FRIENDS, ...S.fr.added.map(personOf).filter(Boolean)]; }
const myCode = () => 'NJ-' + (CH[S.type].name.charCodeAt(0) % 900 + 100) + 'K' + String(S.level).padStart(2, '0').slice(-1);
const myItemXP = () => S.paidLog.reduce((a, p) => a + (p.xp || 0), 0) + S.records.reduce((a, r) => a + (r.xpBoost || 0), 0);
function profileData(key) {
  if (key === 'me') { const tot = cumXP(S.level) + S.xp, item = Math.min(tot, myItemXP());
    return { n: '나', t: S.type, lv: S.level, ratio: Math.round((tot - item) / Math.max(1, tot) * 100), paid: S.paidLog.length ? 1 : 0, streak: S.streakWeeks, ach: achieveList().filter(a => a.done).length, me: true, friend: true }; }
  const p = personOf(key); if (!p) return null;
  return { ...p, ratio: exRatio(p.lv, p.pure), friend: friendsAll().some(f => f.n === key) };
}
function vProfile() {
  ensure2();
  const p = profileData(S.prof || 'me'); if (!p) return vFriends2();
  const back = S.profFrom || 'friends', backLabel = { friends: '랭킹 · 친구', me: '내 캐릭터', addFriend: '친구 추가' }[back] || '운동기록';
  const pureLv = p.me ? S.level : (p.pure ?? p.lv);
  const actions = p.me ? '<div class="muted" style="text-align:center;margin-top:12px">다른 사람에게는 이렇게 보여요 · 표정·사진·기록 상세는 나만 봐요</div>'
    : p.friend ? `<button class="btn" data-act="cheer" data-v="${esc(p.n)}" id="cheerBtn" ${S.fr.cheered[p.n] === TODAY ? 'disabled' : ''}>${S.fr.cheered[p.n] === TODAY ? '오늘 응원했어요 👏' : '응원 👏'}</button><div class="muted" style="text-align:center;margin-top:8px">친구 · 하루 1번 응원할 수 있어요</div>`
    : `${S.fr.sent.includes(p.n) ? '<button class="btn" disabled>요청 보냄 · 수락 기다리는 중</button>' : S.fr.recv.includes(p.n) ? `<button class="btn" data-act="frAccept" data-v="${esc(p.n)}">친구 요청 수락</button>` : `<button class="btn" data-act="frRequest" data-v="${esc(p.n)}" id="frReqBtn">친구 요청 보내기</button>`}<div class="muted" style="text-align:center;margin-top:8px">친구가 아니어도 레벨·칭호·운동 비율은 누구나 볼 수 있어요<br>친구가 되면 이번 주 리그에서 같이 겨뤄요</div>`;
  return `${subHead(p.me ? '내 프로필 미리보기' : '프로필', back, backLabel)}<div class="sec">
  <div class="card" style="text-align:center" id="profCard">${charHTML(p.t, p.lv, 150, true, null)}
    <div style="margin-top:12px;display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap"><span class="name">${esc(p.n)}</span>${p.paid ? `<span class="pill paidpill" id="paidBadge">💰 ${PAID_TIER[p.paid]}</span>` : ''}${!p.friend ? '<span class="pill tier1">친구 아님</span>' : ''}</div>
    <div style="margin-top:6px;display:flex;gap:6px;justify-content:center"><span class="pill lvpill">Lv.${p.lv}</span><span class="pill tier${tierOf(p.lv)}">${TIER_NAME[tierOf(p.lv)]}</span></div>
    <div class="muted" style="margin-top:6px">${esc(CH[p.t].name)} · 칭호 «${stageName(p.t, p.lv)}»</div></div>
  <div class="card" id="profRatio"><div class="xrow" style="padding-top:0"><span>운동으로 쌓은 경험치</span><b style="font-size:20px;color:var(--ink)">${p.ratio}%</b></div>
    <div class="ratiobar"><i style="width:${p.ratio}%"></i><s style="width:${100 - p.ratio}%"></s></div>
    <div class="rleg"><span><i class="lgx"></i>운동 ${p.ratio}%</span><span><i class="lgi"></i>아이템 ${100 - p.ratio}%</span></div>
    <div class="muted" style="margin-top:8px">${p.paid ? `💰 = 충전한 포인트를 상점에 쓴 적 있음 · 누적 사용 ${PAID_TIER[p.paid]}` : '💰 표시 없음 = 충전한 포인트를 상점에 쓴 적 없음'} · 금액·결제 내역은 공개하지 않아요</div></div>
  <div class="card"><div class="tiles" style="margin-top:0"><div class="tile"><small>운동 레벨</small><b>Lv.${pureLv}</b></div><div class="tile"><small>연속</small><b>${p.streak}주</b></div><div class="tile"><small>업적</small><b>${p.ach}/${achieveList().length}</b></div></div></div>
  ${actions}</div>`;
}

/* ===== C15 친구·리그 (친구 0명 상태 + 행 눌러 프로필) ===== */
rankList = function () {
  const me = { n: '나', t: S.type, lv: S.level, week: Math.min(CFG.WEEK_CAP, weekXP()), rate: Math.min(100, Math.round(weekCount() / S.goal * 100)), paid: S.paidLog.length ? 1 : 0, pure: S.level, me: true };
  return [...friendsAll(), me].map(f => ({ ...f, key: S.fTab === 'week' ? f.rate * 10000 + f.week : (S.pureOnly ? (f.pure ?? f.lv) : f.lv) })).sort((a, b) => b.key - a.key);
};
function lastVsThis() {
  const rs = S.records, m0 = weekStart(TODAY), m1 = addD(m0, -7);
  const W = (a, b) => { const w = inRange(rs, a, b); return { n: new Set(w.map(r => r.date)).size, xp: w.reduce((s, r) => s + exXPof(r), 0) }; };
  const last = W(m1, addD(m1, 6)), cur = W(m0, TODAY), g = S.goal;
  const row = (label, a, b, unit, max) => `<div class="cmp2"><span>${label}</span><div><div class="cb"><i class="l" style="width:${a / max * 100}%"></i></div><div class="cb"><i class="c" style="width:${b / max * 100}%"></i></div></div><b>${fmt(a)}${unit}<br><em>${fmt(b)}${unit}</em></b></div>`;
  const say = cur.n > last.n ? `지난주의 너보다 벌써 ${cur.n - last.n}번 더 했어!` : cur.n === last.n && cur.n ? `지난주랑 같은 ${cur.n}번! 1번만 더 가 볼까?` : `이번 주는 지금부터! 지난주 ${last.n}번을 따라잡아 보자`;
  return `<div class="card" id="cmpCard"><div class="h3">내 지난주 vs 이번 주</div>
  ${row('운동', last.n, cur.n, '회', Math.max(g, last.n, cur.n, 1))}${row('운동 경험치', last.xp, cur.xp, '', Math.max(last.xp, cur.xp, 1))}${row('목표 달성', Math.min(150, Math.round(last.n / g * 100)), Math.min(150, Math.round(cur.n / g * 100)), '%', 150)}
  <div class="rleg" style="margin-top:6px"><span><i class="lgw"></i>지난주</span><span><i class="lgx"></i>이번 주</span></div>
  <div class="say" style="margin-top:10px">${esc(say)}</div></div>`;
}
function vFriends2() {
  ensure2();
  const zeroDemo = demoCard('친구 수', 'friendZero', S.friendZero ? 'zero' : 'some', [['some', '친구 있음'], ['zero', '친구 0명']]);
  const req = S.fr.recv.length ? `<button class="notice tap" data-act="sub" data-v="addFriend" id="reqNotice" style="width:100%"><span>👋 친구 요청 ${S.fr.recv.length}개가 왔어요</span><b style="color:var(--rose)">보기 ›</b></button>` : '';
  if (!friendsAll().length) return `${subHead('랭킹 · 친구')}<div class="sec">${req}
    <div class="card zero-card" id="zeroCard" style="text-align:center"><div class="cbox" style="height:110px">${charFit(S.type, S.level, 100)}</div>
      <div class="h2" style="margin:10px 0 4px">친구를 초대해 보세요</div><div class="muted">친구끼리만 보는 주간 리그예요. 무게가 아니라 <b>각자 목표 달성률</b>로 겨뤄서 주 2회 목표여도 1등 할 수 있어요.</div>
      <button class="btn" data-act="sub" data-v="addFriend" id="goAddFriend">친구 추가하기</button><div class="muted" style="margin-top:8px">초대 링크·내 코드로만 · 연락처는 보지 않아요</div></div>
    ${lastVsThis()}${zeroDemo}</div>`;
  const list = rankList();
  return `${subHead('랭킹 · 친구')}<div class="sec">${req}<div class="seg"><button class="${S.fTab === 'week' ? 'on' : ''}" data-act="ftab" data-v="week">이번 주</button><button class="${S.fTab === 'level' ? 'on' : ''}" data-act="ftab" data-v="level">레벨</button></div>
  ${S.fTab === 'level' ? `<div class="row" style="padding-top:0"><span class="muted">운동만 보기 (💰 유료 경험치 빼고)</span><button class="sw ${S.pureOnly ? 'on' : ''}" data-act="pure"></button></div>` : ''}
  <div class="card">${list.map((f, i) => `<div class="rank tap ${f.me ? 'me' : ''}" data-act="prof" data-v="${f.me ? 'me' : esc(f.n)}"><div class="no">${i + 1}</div><div class="av">${S.placeholder ? `<img src="${placeholderSrc(f.lv)}" alt="">` : charAvatar(f.t, f.lv, 40)}</div>
  <div><b>${esc(f.n)}</b> ${f.paid ? '<span title="유료 사용">💰</span>' : ''}<div class="muted">${esc(CH[f.t].name)} · ${stageName(f.t, f.lv)}</div></div>
  <div class="val">${S.fTab === 'week' ? `${f.rate}%<small>${f.week.toLocaleString()} XP</small>` : `Lv.${S.pureOnly ? (f.pure ?? f.lv) : f.lv}<small>${f.paid && !S.pureOnly && f.pure !== f.lv ? `운동만 Lv.${f.pure}` : TIER_NAME[tierOf(f.lv)]}</small>`}</div></div>`).join('')}</div>
  <button class="btn ghost" data-act="sub" data-v="addFriend" id="goAddFriend">친구 추가</button>
  <div class="muted" style="margin-top:8px">이번 주 = 주간 목표 달성률 기준 · 검증된 운동만 집계 · 이름을 누르면 프로필</div>${zeroDemo}</div>`;
}

/* ===== C15b 친구 추가 ===== */
function vAddFriend() {
  ensure2();
  const row = (name, btns, sub) => { const p = personOf(name); if (!p) return '';
    return `<div class="frow"><button class="av tap" data-act="prof" data-v="${esc(name)}" aria-label="${esc(name)} 프로필">${charAvatar(p.t, p.lv, 40)}</button><div class="tap" data-act="prof" data-v="${esc(name)}"><b>${esc(name)}</b> ${p.paid ? '💰' : ''}<small>Lv.${p.lv} · ${esc(CH[p.t].name)}${sub ? ' · ' + sub : ''}</small></div><div class="fbtns">${btns}</div></div>`; };
  const recv = S.fr.recv.map(n => row(n, `<button class="btn sm ghost" data-act="frReject" data-v="${esc(n)}">거절</button><button class="btn sm" data-act="frAccept" data-v="${esc(n)}">수락</button>`)).join('');
  const sent = S.fr.sent.map(n => row(n, `<button class="btn sm ghost" data-act="frCancel" data-v="${esc(n)}">취소</button>`, '수락 기다리는 중')).join('');
  return `${subHead('친구 추가', 'friends', '랭킹 · 친구')}<div class="sec">
  <div class="card" id="myCode" style="text-align:center"><div class="h3">내 코드</div><div class="code">${myCode()}</div>
    <div class="grid2" style="margin-top:12px"><button class="btn ghost" data-act="copyCode" style="margin:0">코드 복사</button><button class="btn" data-act="shareLink" style="margin:0">초대 링크 보내기</button></div>
    <div class="muted" style="margin-top:8px">링크를 받은 친구가 열면 바로 요청이 와요 · 연락처는 보지 않아요</div></div>
  <div class="card" id="codeIn"><div class="h3">친구 코드 입력</div><div class="cin"><input id="frCode" placeholder="예: NJ-CAPY2" maxlength="10" autocomplete="off" value="${esc(S.frCodeQ || '')}"><button class="btn sm" data-act="frCode">요청</button></div>
    ${S.frErr ? `<div class="ferr" id="frErr">${esc(S.frErr)}</div>` : '<div class="muted" style="margin-top:6px">시연 코드: NJ-CAPY2 · NJ-PPI15</div>'}</div>
  <div class="card" id="recvCard"><div class="h3">받은 요청 ${S.fr.recv.length}</div>${recv || '<div class="muted">받은 요청이 없어요</div>'}</div>
  <div class="card" id="sentCard"><div class="h3">대기 목록 · 보낸 요청 ${S.fr.sent.length}</div>${sent || '<div class="muted">보낸 요청이 없어요</div>'}${S.fr.sent.length ? '<button class="btn sm ghost demochip" data-act="frDemoAccept">🧪 상대가 수락함(시연)</button>' : ''}</div>
  <div class="muted" style="text-align:center">친구 ${friendsAll().length}/50명 · 서로 수락해야 친구가 돼요</div></div>`;
}

/* ===== C9 코칭 대화 (실제 AI 호출 없음 — §4-1 발화 8종별 예시 응답 · §4-2 톤 · §4-3 의료 경계는 규칙이 가로챔) ===== */
const KINDS = {
  session: { label: '세션 한마디', q: '오늘 운동 어땠어?' }, week: { label: '주간 리포트', q: '이번 주 정리해 줘' },
  next: { label: '다음 운동 추천', q: '오늘 뭐 하면 좋아?' }, plateau: { label: '정체 구간 알림', q: '벤치가 안 늘어' },
  balance: { label: '부위 밸런스', q: '부위 밸런스 괜찮아?' }, rest: { label: '휴식 권고', q: '오늘 쉬어야 할까?' },
  safety: { label: '안전 경고', q: '무게 확 올려도 돼?' }, lesson: { label: '레슨 연계 한마디', q: 'PT 받은 거 들어갔어?' },
};
const MED_FIXED = {
  pain: ['아프면 오늘 운동은 바로 멈추자.', '통증·어지러움이 1번이라도 이어지면 의사·물리치료사와 상담해 줘.', '센터 선생님에게도 꼭 말해 줘.'],
  disease: ['질환이나 임신에 대해선 내가 답하면 안 돼.', '운동 전에 의사와 먼저 상담해 줘. 센터 선생님에게도 알려 주면 맞춰서 도와줄 거야.'],
  diet: ['식단·보충제 양은 내가 정해 줄 수 없어.', '영양사나 의사와 상담해 줘. 운동 루틴은 1개씩 같이 짜 보자.'],
};
const jo = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c <= 11171 && c % 28 ? a : b); };   // 받침 있으면 a(을·이·은)
function coachReply(kind) {
  const rs = byDate([...S.records, ...histSessions()]), last = [...S.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0];
  const p4 = partSets(inRange(rs, addD(TODAY, -27), TODAY)), big = ['가슴', '등', '하체', '어깨'], lo = big.sort((a, b) => p4[a] - p4[b])[0], hi = [...big].sort((a, b) => p4[b] - p4[a])[0];
  const wk7 = partSets(inRange(rs, addD(TODAY, -6), TODAY)), notYet = ['등', '가슴', '하체', '어깨'].find(p => !wk7[p]) || '어깨';
  const pick = { 등: '랫풀다운·시티드 로우', 가슴: '벤치프레스·체스트 프레스', 하체: '레그 프레스·스쿼트', 어깨: '숄더 프레스·사이드 레터럴' }[notYet];
  const lastWeek = weekReport(rs, addD(weekStart(TODAY), -7)), run = streakDaysEnding(rs, todayDone() ? TODAY : addD(TODAY, -1));
  const bench = prEvents(rs).filter(e => e.ex === 'bench').pop(), bw = bestW('bench') || 60, bwks = bench ? Math.max(1, Math.floor((dOf(TODAY) - dOf(bench.date)) / (7 * DAY))) : 4;
  const lesson = [...S.records].filter(r => r.v === 'lesson').sort((a, b) => b.date.localeCompare(a.date))[0];
  return {
    session: last ? [`${md(last.date)} ${last.summary.split(' · ')[0]} 해냈네!`, `${placeBase(last.place)}에서 ${fmt(last.xp)} XP 쌓였어.`, '다음엔 같은 무게로 1세트만 더 가 보자.'] : ['아직 기록이 없어. 1번만 기록해도 내가 봐 줄게!'],
    week: [`지난주 ${lastWeek.sessions}번 운동했어${lastWeek.sessions >= S.goal ? ', 목표 딱 채웠어!' : '.'}`, lastWeek.missing.length ? `${jo(lastWeek.missing.join('·'), '은', '는')} 비어 있었어.` : '큰 부위 4곳 다 챙겼어.', '자세한 건 주간 리포트에 정리해 뒀어 📋'],
    next: [`이번 주 아직 ${jo(notYet, '을', '를')} 안 했어.`, `오늘은 ${pick} 3세트씩 어때?`],
    plateau: [`벤치 ${kg(bw)}에서 ${bwks}주째야.`, '다음엔 2.5kg만 올려서 8회부터 해 볼까?', '안 되면 지금 무게로 1세트 더해도 좋아.'],
    balance: [`4주 동안 ${jo(hi, '이', '가')} ${p4[hi]}세트로 제일 많았어.`, p4[lo] ? `${jo(lo, '은', '는')} ${p4[lo]}세트뿐이라 이번 주 1번 넣어 보자.` : `${jo(lo, '은', '는')} 한 번도 없어서 이번 주 1번 넣어 보자.`],
    rest: run >= 3 ? [`${run}일 연속 운동했어. 진짜 대단해!`, '오늘은 쉬거나 스트레칭 10분만 하자.'] : [run ? `최근 ${run}일 연속 운동했어.` : `마지막 운동이 ${Math.min(lastWorkoutDays(), 99)}일 전이야.`, '몸이 괜찮으면 오늘 해도 좋아. 같은 부위만 이틀 연속은 피하자.'],
    safety: ['무게는 지난번보다 10% 안쪽으로 올려 줘.', '한 번에 20% 넘게 올리면 내가 알려 줄게. 천천히 가자!'],
    lesson: lesson ? [`${md(lesson.date)} PT 확인됐어!`, `선생님 확인이라 경험치 2배, ${fmt(lesson.xp)} XP 들어왔어 ⭐`] : ['아직 확인된 레슨이 없어. 수업 끝나면 선생님 확인 1번이면 돼.'],
  }[kind];
}
function classify(q) {
  if (/아프|아파|통증|어지|답답|부상|다쳤|삐었|저려|저린|쑤셔|붓/.test(q)) return 'pain';
  if (/임신|심장|혈압|당뇨|질환|수술|천식|디스크/.test(q)) return 'disease';
  if (/다이어트|살 ?빼|칼로리|식단|보충제|단백질|약 /.test(q)) return 'diet';
  const map = [['plateau', /정체|안 ?늘|제자리|그대로/], ['week', /이번 ?주|지난 ?주|정리|리포트/], ['balance', /밸런스|균형|부위/], ['rest', /쉬|휴식|피곤|연속/],
    ['safety', /무게|올려|증량|무거/], ['lesson', /PT|피티|레슨|수업|선생님/i], ['next', /뭐 ?하|추천|루틴|오늘/], ['session', /어땠|잘했|기록/]];
  const hit = map.find(([, re]) => re.test(q)); return hit ? hit[0] : 'unknown';
}
function ask(q, kind = classify(q)) {
  const c = S.coach; q = q.trim().slice(0, 80); if (!q) return;
  const fixed = !!MED_FIXED[kind];
  if (!fixed && c.used >= COACH_MAX) return toast('이번 달 질문 20번을 다 썼어요');
  c.msgs.push({ who: 'me', text: q });
  if (fixed) c.msgs.push({ who: 'bot', lines: MED_FIXED[kind], fixed: true, kind });
  else { c.used++; c.msgs.push({ who: 'bot', lines: kind === 'unknown' ? ['그건 내가 잘 모르는 질문이야.', '루틴·휴식·운동 방법이라면 1개씩 물어봐 줘!'] : coachReply(kind), kind }); }
  c.msgs = c.msgs.slice(-30);
}
function vCoach() {
  ensure2();
  const c = S.coach, t = S.type, left = Math.max(0, COACH_MAX - c.used), nm = CH[t].name;
  const head = `<div class="card coachhead" id="coachHead"><div class="cbox">${charFit(t, S.level, 44)}</div><div><b>${esc(nm)} 코치</b><small>루틴·휴식·운동 방법을 물어봐요</small></div><span class="pill ${left ? 'tier2' : 'tier4'}" id="coachLeft">남은 질문 ${left}/${COACH_MAX}</span></div>`;
  if (!c.agreed) return `${subHead('코치에게 물어보기')}<div class="sec">${head}
    <div class="card" id="medNotice"><div class="h2" style="margin-top:0">시작하기 전에</div>
    <div class="medbox">캐릭터 코치의 말은 <b>운동 습관 참고용</b>이며 <b>의학적 조언이 아닙니다.</b></div>
    <div class="rline">🩺 아프거나 어지러우면 운동을 멈추고 의사·물리치료사와 상담하세요.</div>
    <div class="rline">💊 진단·치료·약·보충제 양·식단 칼로리는 답하지 않아요.</div>
    <div class="rline">💬 질문은 한 달에 ${COACH_MAX}번까지 무료예요.</div>
    <button class="btn" data-act="coachAgree" id="coachAgree">알겠어요, 시작할게요</button><div class="muted" style="text-align:center;margin-top:8px">이 안내는 처음 1번만 · 설정에서 다시 볼 수 있어요</div></div></div>`;
  const greet = `<div class="msg bot"><div class="cbox">${charFit(t, S.level, 30)}</div><div><div class="bub">안녕! 운동 습관은 내가 같이 볼게. 궁금한 거 1개씩 물어봐 💬</div></div></div>`;
  const msgs = c.msgs.map(m => m.who === 'me' ? `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>`
    : `<div class="msg bot"><div class="cbox">${charFit(t, S.level, 30)}</div><div><div class="bub ${m.fixed ? 'fixed' : ''}">${m.lines.map(esc).join('<br>')}</div><small class="mtag">${m.fixed ? '🛡 고정 안내 · AI 호출 안 함 · 횟수 안 씀' : m.kind === 'unknown' ? '예시 응답 · 분류 못 함' : `예시 응답 · ${KINDS[m.kind].label}`}</small></div></div>`).join('');
  const full = left <= 0;
  const chips = `<div class="qchips" id="coachChips">${Object.entries(KINDS).map(([k, v]) => `<button class="chip" data-act="coachQ" data-v="${k}" ${full ? 'disabled' : ''}>${v.q}</button>`).join('')}<button class="chip med" data-act="coachQ" data-v="pain">무릎이 아파 (의료 시연)</button><button class="chip med" data-act="coachQ" data-v="disease">고혈압 있는데 괜찮아? (의료 시연)</button></div>`;
  return `${subHead('코치에게 물어보기')}<div class="sec">${head}
  <div class="chat" id="chat">${greet}${msgs}</div>
  ${full ? `<div class="notice limit" id="coachFull"><span>이번 달 질문 ${COACH_MAX}번을 다 썼어요. <b>다음 달 1일</b>에 다시 ${COACH_MAX}번 생겨요.<br>아프거나 불편하면 운동을 멈추고 센터 선생님에게 말해 주세요.</span></div>` : ''}
  <div class="h3" style="margin-top:4px">이렇게 물어봐요</div>${chips}
  <div class="cin" id="coachIn"><input id="coachQ" placeholder="${full ? '다음 달에 다시 물어볼 수 있어요' : '코치에게 물어보기'}" maxlength="80" autocomplete="off" ${full ? 'disabled' : ''}><button class="btn sm" data-act="coachSend" ${full ? 'disabled' : ''}>보내기</button></div>
  <div class="muted" style="margin-top:8px">의학적 조언이 아니에요 · 통증·질환 질문은 규칙이 가로채서 고정 안내로 답해요(AI 호출 안 함)</div>
  <button class="card replink tap" data-act="report" data-v="coach" style="margin-top:12px"><div><b>주간 리포트 보기</b><small>지난주 부위·PR·다음 주 제안</small></div><span class="muted">›</span></button>
  ${demoCard('남은 횟수', 'coachUsed', String(c.used), [['3', '17번 남음'], ['19', '1번 남음'], ['20', '20번 도달']])}
  <div style="display:flex;gap:8px;margin-top:-4px"><button class="btn sm ghost demochip" data-act="coachClear" style="margin:0">🧪 대화 지우기</button><button class="btn sm ghost demochip" data-act="coachReset" style="margin:0">🧪 첫 진입 고지 다시</button></div></div>`;
}

/* ===== 연결: 화면 등록 · 기존 화면 보강 · 버튼 ===== */
const vMe0 = vMe, vSettings0 = vSettings;
SUB.coach = vCoach; SUB.report = vReport; SUB.stats = vStats2; SUB.profile = vProfile; SUB.addFriend = vAddFriend; SUB.friends = vFriends2;
SUB.me = () => vMe0().replace(/<div class="card"><div class="h2" style="font-size:16px">업적<\/div>.*?<\/div><\/div>/, achieveCard());
SUB.settings = () => vSettings0().replace('<div class="card demo"><div class="h3">🧪 시연 도구</div>',
  `<div class="card" id="coachNoteCard"><div class="h2" style="font-size:16px">코치 안내</div><div class="muted">캐릭터 코치의 말은 운동 습관 참고용이며 의학적 조언이 아닙니다.</div><button class="btn ghost" data-act="coachReset" style="margin-top:10px">코치 첫 안내 다시 보기</button></div><div class="card demo"><div class="h3">🧪 시연 도구</div>`);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.closest('#evo') || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v, dd = +b.dataset.d || 0;
  const H = {
    coach: () => go('workout', 'coach'),
    invite: () => go('workout', 'addFriend'),
    coachAgree: () => { S.coach.agreed = true; },
    coachQ: () => ask(KINDS[v] ? KINDS[v].q : v === 'pain' ? '무릎이 아파' : '고혈압 있는데 운동해도 괜찮아?', v),
    coachSend: () => { const el = $('coachQ'); ask(el ? el.value : ''); },
    coachUsed: () => { S.coach.used = +v; },
    coachClear: () => { S.coach.msgs = []; },
    coachReset: () => { S.coach.agreed = false; S.coach.msgs = []; if (S.sub !== 'coach') return go('workout', 'coach'); },
    report: () => { S.repFrom = v === 'coach' ? 'coach' : 'stats'; S.repWeek = 1; return go('workout', 'report'); },
    repWeek: () => { S.repWeek = Math.max(0, Math.min(8, S.repWeek + dd)); },
    dataDemo: () => { S.dataDemo = v; },
    stTab: () => { S.stTab = v; }, stMore: () => { S.stMore = true; }, stPer: () => { S.stPer = v; }, stEx: () => { S.stEx = v; },
    stExGo: () => { S.stTab = 'ex'; S.stEx = v; window.scrollTo(0, 0); },
    ach: () => achSheet(+v),
    prof: () => { S.profFrom = S.sub; S.prof = v; return go('workout', 'profile'); },
    friendZero: () => { S.friendZero = v === 'zero'; },
    cheer: () => { S.fr.cheered[v] = TODAY; toast(`${v}님에게 응원 👏 보냈어요 (시연 · 실제 알림 없음)`); },
    frAccept: () => { S.fr.recv = S.fr.recv.filter(x => x !== v); if (!S.fr.added.includes(v)) S.fr.added.push(v); S.friendZero = false; toast(`${v}님과 친구가 됐어요`); },
    frReject: () => { S.fr.recv = S.fr.recv.filter(x => x !== v); toast('요청을 거절했어요 · 상대에게 알리지 않아요'); },
    frCancel: () => { S.fr.sent = S.fr.sent.filter(x => x !== v); toast('요청을 취소했어요'); },
    frRequest: () => { if (!S.fr.sent.includes(v)) S.fr.sent.push(v); toast('요청 보냈어요 · 상대가 수락하면 친구가 돼요'); },
    frDemoAccept: () => { const n = S.fr.sent.shift(); if (n) { S.fr.added.push(n); S.friendZero = false; toast(`${n}님이 수락했어요 · 이제 친구예요`); } },
    copyCode: () => toast(`내 코드 ${myCode()} 복사(시연)`),
    shareLink: () => toast('초대 링크 공유 창 자리 (시연 · 실제로 보내지 않아요)'),
    frCode: () => { const el = $('frCode'), q = (el ? el.value : '').trim().toUpperCase(); S.frCodeQ = q; S.frErr = '';
      const p = STRANGERS.find(x => x.code === q);
      if (!/^NJ-[A-Z0-9]{4,6}$/.test(q)) S.frErr = '코드를 다시 확인해 주세요 (예: NJ-CAPY2)';
      else if (q === myCode()) S.frErr = '내 코드예요 · 친구 코드를 넣어 주세요';
      else if (!p) S.frErr = '그 코드의 회원을 찾을 수 없어요';
      else if (friendsAll().some(f => f.n === p.n)) S.frErr = `${p.n}님은 이미 친구예요`;
      else if (S.fr.recv.includes(p.n)) S.frErr = `${p.n}님이 이미 요청을 보냈어요 · 받은 요청에서 수락해 주세요`;
      else if (friendsAll().length >= 50) S.frErr = '친구는 50명까지예요';
      else { if (!S.fr.sent.includes(p.n)) S.fr.sent.push(p.n); S.frCodeQ = ''; toast(`${p.n}님에게 요청 보냈어요`); } },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); ensure2();
  if (H[a]() !== undefined) return;
  save(); render();
  if (a.startsWith('coach') && S.sub === 'coach') { const ch = $('chat'); if (ch && ch.lastElementChild) ch.lastElementChild.scrollIntoView({ block: 'center' }); }
}, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'coachQ') { e.preventDefault(); document.querySelector('[data-act="coachSend"]').click(); }
  if (e.target.id === 'frCode') { e.preventDefault(); document.querySelector('[data-act="frCode"]').click(); }
});

ensure2();
if (S.tab === 'workout' && ['coach', 'report', 'profile', 'addFriend'].includes(S.sub)) render();
else if (S.tab === 'workout' && ['stats', 'friends', 'me', 'settings'].includes(S.sub)) render();
