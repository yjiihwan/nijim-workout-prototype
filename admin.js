'use strict';
/* C안 3/4 — 관리자 시연(PC 폭): 센터 관리자 A4·A5 · 니짐 본사 운영자 H1~H7 (PLAN §6-2·§6-3·§5-2).
   고객 앱과 분리된 화면(#admin). H1·H2 저장 → config_store.js 저장소 → engine.js applyConfig → 고객 앱 계산.
   여기 숫자(통계·비용·부정 감지·포인트)는 전부 시연용 가짜 데이터. 실제 관리자 웹·회원 정보와 연결 없음. */


/* ===== 시연용 가짜 데이터 — 고정 시드라 매번 같은 숫자 ===== */
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const CENTERS = [
  { id: 'sillim', name: '니짐 신림점', members: 820, seed: 11 }, { id: 'bongcheon', name: '니짐 봉천점', members: 610, seed: 23 },
  { id: 'snu', name: '니짐 서울대입구점', members: 540, seed: 37 }, { id: 'sadang', name: '니짐 사당점', members: 455, seed: 41 },
  { id: 'nakseong', name: '니짐 낙성대점', members: 372, seed: 53 },
];
const HOUR_W = [.2, .1, 0, 0, 0, .3, 2.2, 4.6, 3.4, 2.1, 1.8, 2.2, 3.1, 2.4, 1.5, 1.4, 1.9, 3.2, 5.6, 7.1, 6.4, 4.4, 2.3, .8];
function centerStats(c, weeks = 12) {
  const r = rng(c.seed), adopt = .34 + r() * .08;
  const wk = Array.from({ length: weeks }, (_, i) => { const grow = .55 + .45 * (i + 1) / weeks, act = Math.round(c.members * adopt * grow * (.92 + r() * .14));
    return { start: addD(weekStart(TODAY), -7 * (weeks - 1 - i)), active: act, sessions: Math.round(act * (2.1 + r() * .5)), lesson: Math.round(act * (.18 + r() * .06)) }; });
  const last4 = wk.slice(-4), sess4 = last4.reduce((a, w) => a + w.sessions, 0);
  const hours = HOUR_W.map(w => Math.round(sess4 * w / 55.1 * (.85 + r() * .3)));
  const pop = (CENTER_POP[c.name] || ['leg_press', 'treadmill', 'lat_pulldown', 'bench', 'chest_press', 'smith_squat']).filter(x => EX[x]);
  const pool = [...new Set([...pop, ...EX_SEED.filter(e => e.cat !== 'lesson' && e.cat !== 'out').map(e => e.id)])];
  const top = pool.map((id, k) => ({ id, n: Math.round(sess4 * (k < pop.length ? .42 - k * .045 : .2 * Math.pow(.86, k - pop.length)) * (.85 + r() * .3)) }))
    .sort((a, b) => b.n - a.n).slice(0, 10).map(x => ({ ...x, users: Math.round(x.n * (.55 + r() * .15)) }));
  return { wk, last4, sess4, act4: Math.round(last4.reduce((a, w) => a + w.active, 0) / 4 * 1.18), lesson4: last4.reduce((a, w) => a + w.lesson, 0), hours, top };
}
const NICK = ['김*현', '이*아', '박*준', '최*린', '정*우', '강*희', '조*호', '윤*서', '장*민', '임*연', '한*수', '오*진', '서*은', '신*훈', '권*지', '황*율'];
function fraudQueue() {
  const r = rng(7), RULES = [
    ['share', '계정 공유 의심', '같은 날 신림점 07:12 입장 → 사당점 07:31 입장(이동 불가 19분)'],
    ['gap', '세트 간격 20초 미만 3연속', '레그프레스 6세트를 1분 40초에 완료'],
    ['unreal', '비현실 무게', '데드리프트 260kg × 8 (체중 64kg · 직전 최고 120kg)'],
    ['selfie_reuse', '셀카 재사용', '같은 이미지 해시 3회 · 갤러리 불러오기'],
    ['lesson_sets', '레슨 세션 세트 과다', '50분 PT 세션에 세트 41개 덧붙임'],
    ['league_rush', '친구 리그 몰아치기', '일요일 V0 세션 6개(리그 집계 제외됨)'],
    ['alt_accounts', '부계정 레벨 양산', '같은 기기 3계정 · V0 비율 92%'],
    ['time', '과거 입력 반복', '지난 7일치 세션 11건 한 번에 입력(V0 고정)'],
  ];
  return Array.from({ length: 16 }, (_, i) => { const [k, rule, ev] = RULES[Math.floor(r() * RULES.length)], d = addD(TODAY, -Math.floor(r() * 9));
    return { id: 'F' + (1040 + i), date: d, hh: String(5 + Math.floor(r() * 18)).padStart(2, '0') + ':' + String(Math.floor(r() * 60)).padStart(2, '0'), who: NICK[i], center: CENTERS[Math.floor(r() * 5)].name, k, rule, ev, xp: Math.round(120 + r() * 480) }; })
    .sort((a, b) => (b.date + b.hh).localeCompare(a.date + a.hh));
}

/* ===== 그리기 도구 — 한 계열은 한 색(로즈) · 막대마다 마우스를 올리면 값(title) ===== */
const A_ROSE = '#E8005C', A_GRID = '#ECECF0';
const nf = n => Math.round(n).toLocaleString();
const kpi = (label, val, sub = '') => `<div class="ak"><small>${label}</small><b>${val}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
function vbars(vals, labels, { h = 180, unit = '', mark = [], every = 1, fmt = nf } = {}) {
  const W = 100 / vals.length, max = Math.max(1, ...vals), gap = Math.min(1.2, W * .18);
  const marks = new Set([...mark, vals.indexOf(max), vals.length - 1]);
  return `<div class="avb" style="height:${h}px">${vals.map((v, i) => `<div class="avc" style="width:${W}%" title="${labels[i]} · ${fmt(v)}${unit}">
    ${marks.has(i) ? `<em style="bottom:${v / max * (h - 60) + 24}px">${fmt(v)}</em>` : ''}<i style="height:${Math.max(v ? 2 : 0, v / max * (h - 60))}px;margin:0 ${gap}px"></i>
    <s>${i % every === 0 ? labels[i] : ''}</s></div>`).join('')}</div>`;
}
const hshare = (v, max, label = '') => `<div class="ahs"><i style="width:${(v / Math.max(1, max) * 100).toFixed(1)}%"></i><span>${label}</span></div>`;
const V_SEQ = { V0: '#D5D5DC', V1: '#FF9EC2', V2: '#F0367F', V3: '#A80043' };   // 검증 등급은 순서가 있는 값 → 로즈 한 색 밝음→어두움
function stack(parts) { const t = parts.reduce((a, p) => a + p[1], 0);
  return `<div class="ast">${parts.map(([k, v, c]) => `<i style="width:${(v / t * 100).toFixed(1)}%;background:${c}" title="${k} ${(v / t * 100).toFixed(1)}%"></i>`).join('')}</div>
  <div class="astl">${parts.map(([k, v, c]) => `<span><i style="background:${c}"></i>${k} <b>${(v / t * 100).toFixed(0)}%</b></span>`).join('')}</div>`; }
const tbl = (head, rows, cls = '') => { const first = (rows[0] || '').match(/<td[^>]*>/g) || [];   // 숫자 칸(td.num)이면 머리줄도 오른쪽 정렬
  return `<div class="atw"><table class="at ${cls}"><thead><tr>${head.map((h, i) => `<th class="${/class="num/.test(first[i] || '') ? 'num' : ''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; };
const note = t => `<div class="anote">${t}</div>`;
const sec = (title, body, right = '') => `<section class="acard"><div class="acardh"><h3>${title}</h3>${right}</div>${body}</section>`;
const seg = (act, cur, opts) => `<div class="aseg">${opts.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-aact="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

/* ===== 상태 — 저장 전 변경은 D(초안), 저장하면 ADM → 저장소 → 새로 고침(고객 앱이 새 값으로 다시 계산) ===== */
const clone = o => JSON.parse(JSON.stringify(o));
let D = clone(ADM);
const AV = { center: 'sillim', range: 4, h2: 'xp', exCat: 'all', exQ: '', shopCat: 'all', lvFrom: 1, a5: { L1: true }, fraudF: 'all' };
const getPath = (o, p) => p.split('.').reduce((a, k) => a == null ? undefined : a[k], o);
function setCfg(path, val) {   // path = 'XP.weight' · 배열 칸('STREAK.3')은 배열 통째로 덮어쓴다
  const ks = path.split('.'), def = getPath(CFG_DEFAULT, path);
  const arrAt = ks.findIndex((k, i) => Array.isArray(getPath(CFG_DEFAULT, ks.slice(0, i + 1).join('.'))));
  if (arrAt >= 0 && arrAt < ks.length - 1) { const ap = ks.slice(0, arrAt + 1).join('.'), arr = clone(getPath(D.cfg, ap) || getPath(CFG_DEFAULT, ap));
    arr[+ks[arrAt + 1]] = val; return setCfg(ap, JSON.stringify(arr) === JSON.stringify(getPath(CFG_DEFAULT, ap)) ? undefined : arr); }
  let t = D.cfg; ks.slice(0, -1).forEach(k => { t[k] = t[k] || {}; t = t[k]; });
  if (val === undefined || JSON.stringify(val) === JSON.stringify(def)) delete t[ks[ks.length - 1]]; else t[ks[ks.length - 1]] = val;
  const prune = o => { Object.keys(o).forEach(k => { if (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) { prune(o[k]); if (!Object.keys(o[k]).length) delete o[k]; } }); };
  prune(D.cfg);
}
const effCfg = path => { const v = getPath(D.cfg, path); return v !== undefined ? v : getPath(CFG_DEFAULT, path); };
const flat = (o, p = '') => Object.entries(o || {}).flatMap(([k, v]) => v && typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [[p + k, JSON.stringify(v)]]);
function diffs() {   // 저장된 값(ADM)과 초안(D)의 차이 목록
  const cmp = (a, b, name) => { const A = new Map(flat(a)), B = new Map(flat(b)), out = [];
    new Set([...A.keys(), ...B.keys()]).forEach(k => { if (A.get(k) !== B.get(k)) out.push(`${name} ${k}`); }); return out; };
  return [...cmp(ADM.cfg, D.cfg, '설정'), ...cmp(ADM.levels, D.levels, '레벨표'), ...cmp(ADM.ex, D.ex, '운동'), ...cmp({ a: ADM.exAdd }, { a: D.exAdd }, '운동 추가'),
    ...cmp(ADM.shop, D.shop, '상점'), ...cmp(ADM.shop82, D.shop82, '상점82'), ...cmp(ADM.rewards, D.rewards, '보상')];
}
const persist = o => localStorage.setItem(ADMIN_KEY, JSON.stringify(o));
function admSave() {
  const ch = diffs(); if (!ch.length) return admToast('바뀐 값이 없어요');
  D.log = [{ at: new Date().toLocaleString('ko-KR'), what: ch.slice(0, 6).join(', ') + (ch.length > 6 ? ` 외 ${ch.length - 6}건` : '') }, ...(D.log || [])].slice(0, 20);
  persist(D); sessionStorage.setItem('adm_toast', `저장했어요 · ${ch.length}건 · 고객 앱 계산에 반영됨`); location.reload();
}
function admReset(scope) {
  if (scope === 'all') { D = { ...clone(D), cfg: {}, levels: {}, ex: {}, exAdd: [], shop: {}, shop82: {}, rewards: {} }; }
  else if (scope === 'levels') { D.levels = {}; delete D.cfg.CURVE; }
  admRender(); admToast('기본값으로 되돌렸어요 · [저장]을 눌러야 반영돼요');
}
/* 초안 값으로 잠깐 계산해 보고 저장된 값으로 되돌린다 — 미리보기도 고객 앱과 같은 엔진 함수 */
function withCfg(src, fn) { applyConfig(src); try { return fn(); } finally { applyConfig(ADM); } }

/* ===== 메뉴 ===== */
const MENU = [
  ['센터 관리자 웹 (ngym.co.kr:21080 안)', [['a4', 'A4 운동기록 통계'], ['a5', 'A5 레슨 출석 확정']]],
  ['니짐 본사 운영자', [['h1', 'H1 운동 사전'], ['h2', 'H2 업적·보상·레벨표·상점'], ['h3', 'H3 부정 검토(V5)'], ['h4', 'H4 코칭 비용·품질'], ['h5', 'H5 지표 대시보드'], ['h6', 'H6 공개 비율'], ['h7', 'H7 포인트·유료 모니터']]],
];
const route = () => (location.hash.match(/^#admin\/?(\w*)/) || [])[1] || 'a4';
const isAdmin = () => /^#admin/.test(location.hash);

/* ===== A4 센터 운동기록 통계 (읽기 전용 · 자동) ===== */
function vA4() {
  const c = CENTERS.find(x => x.id === AV.center), st = centerStats(c), n = AV.range, wk = st.wk.slice(-n);
  const sess = wk.reduce((a, w) => a + w.sessions, 0), les = wk.reduce((a, w) => a + w.lesson, 0), act = Math.round(wk.reduce((a, w) => a + w.active, 0) / n * (n === 4 ? 1.18 : 1.35));
  const prev = st.wk.slice(-2 * n, -n), prevS = prev.reduce((a, w) => a + w.sessions, 0);
  const chg = prev.length === n ? Math.round((sess / prevS - 1) * 100) : null, maxTop = st.top[0].n;
  const peak = st.hours.indexOf(Math.max(...st.hours));
  return `<div class="ahead"><div><h2>운동기록 통계 <span class="atag">읽기 전용 · 자동 집계</span></h2><p>회원이 우리 센터에서 남긴 운동기록을 자동으로 모은 숫자예요. 센터가 켜거나 입력할 것은 없어요.</p></div>
    <div class="aflt"><label>센터 <select data-aset="center">${CENTERS.map(x => `<option value="${x.id}" ${x.id === AV.center ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>${seg('range', String(n), [['4', '최근 4주'], ['12', '최근 12주']])}</div></div>
  <div class="akrow">${kpi('운동 세션', nf(sess) + '회', chg == null ? '' : `직전 ${n}주 대비 ${chg >= 0 ? '+' : ''}${chg}%`)}${kpi('활성 회원', nf(act) + '명', `기록 1회 이상 · 회원 ${nf(c.members)}명 중 ${pct(act, c.members)}%`)}
    ${kpi('회원당 주 평균', (sess / n / (act || 1)).toFixed(1) + '회')}${kpi('레슨 연계 세션', nf(les) + '회', `전체의 ${pct(les, sess)}% · 선생님 확정 = 경험치 2배`)}</div>
  <div class="agrid2">
    ${sec('주별 세션 수', vbars(st.wk.map(w => w.sessions), st.wk.map(w => md(w.start).replace(/\(.\)/, '')), { unit: '회', h: 200, every: 2 }), '<span class="amut">최근 12주 · 막대에 마우스를 올리면 값</span>')}
    ${sec('시간대별 세션 (최근 4주)', vbars(st.hours, st.hours.map((_, i) => i + '시'), { unit: '회', h: 200, every: 3 }), `<span class="amut">가장 붐비는 시간 ${peak}시</span>`)}
  </div>
  ${sec('많이 하는 운동 TOP 10 (최근 4주)', tbl(['순위', '운동', '부위', '세션', '회원', '비중'], st.top.map((x, i) => `<tr><td class="num">${i + 1}</td><td><b>${esc(EX[x.id].name)}</b></td><td>${EX[x.id].part}</td><td class="num">${nf(x.n)}</td><td class="num">${nf(x.users)}명</td><td class="wbar">${hshare(x.n, maxTop)}</td></tr>`), 'top10'),
    '<span class="amut">회원 기록에서 자동 집계 · 센터 기구 등록 없음(A1~A3 폐기)</span>')}
  ${note('PLAN §6-2: A4는 2차로 미뤄도 되는 화면(1차 필수 아님). 실서비스 원천 = <code>center_exercise_stats</code>(center_id · exercise_id · week · session_count · active_users). 회원 개인 기록·이름은 센터에 보이지 않아요(집계만).')}`;
}

/* ===== A5 기존 레슨 출석 확정 화면 + 한 줄 ===== */
function vA5() {
  const L = [['L1', '10:00', '김*현', 'PT 50분', '박선생'], ['L2', '11:00', '이*아', '필라테스 1:1', '최선생'], ['L3', '14:00', '정*우', 'PT 50분', '박선생'], ['L4', '19:00', '윤*서', 'PT 30분', '김선생'], ['L5', '20:00', '장*민', '그룹 필라테스(4명)', '최선생']];
  return `<div class="ahead"><div><h2>레슨 진행·출석 확정 <span class="atag gray">기존 화면 · 변경 없음</span></h2><p>기존 업무 그대로예요. 출석을 확정하면 그 줄에 <b>«회원 캐릭터에 경험치 2배 지급됨»</b> 한 줄만 붙어요.</p></div><div class="aflt"><span class="amut">${md(TODAY)} · 니짐 신림점</span></div></div>
  ${sec('오늘 레슨', tbl(['시간', '회원', '수업', '선생님', '출석', ''], L.map(([id, t, who, kind, tch]) => { const ok = AV.a5[id];
    return `<tr class="${ok ? 'aok' : ''}"><td class="num">${t}</td><td>${who}</td><td>${kind}</td><td>${tch}</td><td>${ok ? '<b class="agood">✓ 출석 확정</b>' : '<span class="amut">대기</span>'}</td>
      <td>${ok ? `<div class="a5line" id="a5line_${id}">⭐ 회원 캐릭터에 경험치 ${CFG.VERIFY.V3}배 지급됨</div>` : `<button class="abtn sm" data-aact="a5ok" data-v="${id}">출석 확정</button>`}</td></tr>`; })), '<span class="amut">시연 · 버튼을 누르면 한 줄이 붙어요</span>')}
  ${note(`회원 앱에서는 이 레슨이 «선생님 확인 ★ ${CFG.VERIFY.V3}배»(V3) 세션으로 자동 생성돼요. 배수는 H2 «경험치·한도 › 검증 배율 V3» 값을 그대로 씁니다. 센터가 따로 할 일 없음. 금액·결제 정보는 이 줄에 나오지 않아요.`)}`;
}

/* ===== H1 운동 사전 ===== */
const MODE_KO = { wr: '무게×횟수', r: '횟수', t: '시간(초)', cardio: '유산소(분)', lesson: '레슨' };
const XPK_KO = k => ({ weight: `세트당 ${effCfg('XP.weight')}`, body: `세트당 ${effCfg('XP.body')}`, cardio: `분당 ${effCfg('XP.cardio')}`, lesson: `회당 ${effCfg('XP.lesson')}` })[k];
function vH1() {
  const all = [...EX_SEED, ...D.exAdd], q = AV.exQ.trim();
  const rows = all.filter(e => (AV.exCat === 'all' || e.cat === AV.exCat) && (!q || (e.name + (e.al || '') + e.id).includes(q)));
  const offN = all.filter(e => (D.ex[e.id] || {}).off).length;
  return `<div class="ahead"><div><h2>운동 사전 관리 <span class="atag">니짐 공통 사전 1개</span></h2><p>여기서 바꾼 이름·부위·별칭은 회원 앱 «운동 고르기»에 바로 쓰여요. 비활성은 고르는 목록에서만 빠지고, 지난 기록엔 이름이 남아요.</p></div>
    <div class="aflt"><input class="ain" placeholder="이름·별칭 검색" data-aset="exQ" value="${esc(AV.exQ)}">${seg('exCat', AV.exCat, [['all', '전체'], ...Object.entries(CAT_NAME)])}</div></div>
  <div class="akrow">${kpi('전체', all.length + '종', `기본 ${EX_SEED.length} · 추가 ${D.exAdd.length}`)}${kpi('사용 중', (all.length - offN) + '종')}${kpi('비활성', offN + '종')}${kpi('표시 중', rows.length + '종')}</div>
  ${sec('운동 목록', tbl(['사용', '이름', '분류', '주 부위', '기록 방식', '경험치', '별칭(검색어)', 'id'], rows.map(e => { const o = D.ex[e.id] || {}, ed = o.edit || {}, added = !EX_SEED.some(s => s.id === e.id);
    return `<tr class="${o.off ? 'aoff' : ''}"><td><button class="asw ${o.off ? '' : 'on'}" data-aact="exOff" data-v="${e.id}" aria-label="사용"></button></td>
      <td><input class="ain cell" data-exf="name" data-id="${e.id}" value="${esc(ed.name ?? e.name)}">${added ? ' <span class="atag sm">추가</span>' : ''}</td><td>${CAT_NAME[e.cat]}</td>
      <td><select class="ain cell" data-exf="part" data-id="${e.id}">${PARTS.map(p => `<option ${p === (ed.part ?? e.part) ? 'selected' : ''}>${p}</option>`).join('')}</select></td>
      <td>${MODE_KO[e.mode]}</td><td class="num">${XPK_KO(e.xpk)}</td><td><input class="ain cell wide" data-exf="al" data-id="${e.id}" value="${esc(ed.al ?? e.al ?? '')}"></td><td class="amut mono">${e.id}</td></tr>`; }), 'h1t'),
    `<span class="amut">경험치 단위 값은 H2 «경험치·한도»에서 바꿔요</span>`)}
  ${sec('운동 추가', `<div class="aform"><label>이름<input class="ain" id="nxName" placeholder="예: 힙 어브덕션 머신"></label>
    <label>분류<select class="ain" id="nxCat">${Object.entries(CAT_NAME).filter(([k]) => k !== 'lesson').map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label>주 부위<select class="ain" id="nxPart">${PARTS.map(p => `<option>${p}</option>`).join('')}</select></label>
    <label>기록 방식<select class="ain" id="nxMode"><option value="wr">무게×횟수</option><option value="r">횟수</option><option value="t">시간(초)</option><option value="cardio">유산소(분)</option></select></label>
    <button class="abtn" data-aact="exAdd">목록에 추가</button></div>`)}`;
}

/* ===== H2 업적·보상·레벨표·상점 ===== */
const numIn = (path, { mul = 1, step = 'any', w = 80, nullable = false } = {}) => { const v = effCfg(path), def = getPath(CFG_DEFAULT, path), changed = JSON.stringify(v) !== JSON.stringify(def);
  const show = x => x == null ? '' : +(x * mul).toFixed(4);
  return `<input class="ain num ${changed ? 'chg' : ''}" style="width:${w}px" type="number" step="${step}" data-cfg="${path}" data-mul="${mul}" ${nullable ? 'data-null="1" placeholder="없음"' : ''} value="${show(v)}" title="기본 ${def == null ? '없음' : show(def)}">`; };
const fr = (label, input, hint = '') => `<div class="afr"><span>${label}</span>${input}${hint ? `<em>${hint}</em>` : ''}</div>`;
function h2Preview() {   // 바꾼 값(초안)과 지금 값(저장됨)을 같은 엔진 함수로 계산해 나란히
  const s = { verify: 'V1', selfie: false, prCount: 1, items: [{ ex: 'bench', sets: [1, 2, 3, 4].map(() => ({ w: 40, r: 10, done: true })) }, { ex: 'lat_pulldown', sets: [1, 2, 3, 4].map(() => ({ w: 35, r: 12, done: true })) }, { ex: 'treadmill', min: 20 }] };
  const c = { firstToday: true, weekParts: [], streakWeeks: 2, lastDays: 2, prToday: 0, goal: 3, weekCountBefore: 2, todayCounted: false, boost: false };
  const calc = () => { const r = sessionXP(s, c), L0 = { dayUsed: 0, weekEx: 0, dayItem: 0, weekItem: 0, weekPaid: 0, allV0Today: false }, g = capGain(r, L0, false);
    const per = Math.round(sessionXP(s, { ...c, goal: 9, prToday: 9 }).raw);
    const lv = n => { let t = 0; for (let k = 1; k < n; k++) t += need(k); return t; };
    const w99 = weeksToLv99({ level: 1, xp: 0, perWeek: 3, per: r.raw }), pts = Array.from({ length: 98 }, (_, i) => lvPoint(i + 2) + evoBonus(i + 2)).reduce((a, b) => a + b, 0);
    return { sess: g.gained, raw: r.raw, day: CFG.DAY_CAP, week: CFG.WEEK_CAP, per, lv10: lv(10), lv99: lv(99), w99: w99.weeks, pts, low: Math.round(CFG.MOOD.low * 100), high: Math.round(CFG.MOOD.high * 100), boost: CFG.BOOST.mul, pot: CFG.POTION.xp }; };
  const a = withCfg(ADM, calc), b = withCfg(D, calc);
  const row = (k, l, f = nf) => `<tr class="${a[k] !== b[k] ? 'chg' : ''}"><td>${l}</td><td class="num">${f(a[k])}</td><td class="num"><b>${f(b[k])}</b></td></tr>`;
  return `<div class="aprev" id="h2prev"><h4>바꾼 값으로 미리 계산 <span class="amut">engine.js 같은 함수</span></h4>${tbl(['예시', '지금', '바꾸면'], [
    row('raw', '예시 세션 경험치 ①'),
    row('sess', '① 한도 적용 뒤'), row('day', '하루 운동 한도'), row('week', '주 운동 한도'),
    row('lv10', 'Lv.10 누적 경험치'), row('lv99', 'Lv.99 누적 경험치'), row('w99', 'Lv.99까지(① 주 3회)', v => v === Infinity ? '—' : `${nf(v)}주 ≈ ${(v / 52).toFixed(1)}년`),
    row('pts', 'Lv.1→99 포인트 합계', v => nf(v) + 'P'), row('low', '표정 «아쉬운» 미만', v => v + '%'), row('high', '표정 «신남» 이상', v => v + '%'),
    row('boost', '부스터 배수', v => '×' + v), row('pot', '물약 1병', v => '+' + v)], 'prev')}<div class="amut" style="margin-top:8px;line-height:1.5">① 벤치·랫풀다운 4세트씩 + 트레드밀 20분 · 센터 입장 확인 · 연속 2주 · 오늘 첫 운동 · PR 1 · 주간 목표 달성 · 새 부위 3</div></div>`;
}
const H2TABS = [['xp', '경험치·한도'], ['mood', '표정'], ['lv', '레벨표 99행'], ['ach', '업적 24'], ['reward', '보상 종류'], ['shop', '상점'], ['item', '부스터·물약']];
function vH2() {
  const t = AV.h2;
  const body = {
    xp: () => `<div class="agrid3">
      ${sec('경험치 단위 (PLAN §2-3)', [['XP.weight', '웨이트·머신 1세트'], ['XP.body', '맨몸 1세트'], ['XP.cardio', '유산소 1분'], ['XP.lesson', '레슨 1회'], ['XP.firstSet', '첫 세트 보너스'], ['XP.complete', '세션 완료 보너스'], ['XP.newPart', '이번 주 새 부위'], ['XP.pr', 'PR 1개'], ['XP.weekGoal', '주간 목표 달성']].map(([p, l]) => fr(l, numIn(p), 'XP')).join(''))}
      ${sec('한도 (결정 32·33)', fr('하루 운동 경험치', numIn('DAY_CAP'), 'XP') + fr('하루 · 전부 자가 기록이면', numIn('DAY_CAP_V0'), 'XP') + fr('주 운동 경험치', numIn('WEEK_CAP', { w: 90 }), 'XP')
        + fr('월 포인트 적립 상한', numIn('POINT.monthCap', { w: 90 }), 'P') + fr('자가 기록 레벨업 포인트', numIn('POINT.v0Rate', { mul: 100 }), '%') + note('하루·주 한도는 <b>운동 경험치에만</b> 걸려요. 아이템 경험치 한도는 «부스터·물약» 탭.'))}
      ${sec('검증 배율·연속 배율', [['VERIFY.V0', '자가 기록 V0 (집·야외·입점 안 된 헬스장)'], ['VERIFY.V1', '입점센터 입장 V1'], ['VERIFY.V3', '레슨 확정 V3']].map(([p, l]) => fr(l, numIn(p, { step: '0.05' }), '×')).join('')
        + `<div class="afr"><span>연속 주 0·1·2·3·4·5·6+</span></div><div class="astreak">${CFG_DEFAULT.STREAK.map((_, i) => numIn('STREAK.' + i, { step: '0.05', w: 66 })).join('')}</div>`
        + fr('복귀 기준(쉰 날)', numIn('COMEBACK_DAYS'), '일') + fr('복귀 첫 세션 배율', numIn('COMEBACK_MUL', { step: '0.05' }), '×')
        + fr('입점센터 보너스(기본 경험치의)', numIn('CENTER_BONUS.pct'), '%') + fr('입점 보너스 주 한도', numIn('CENTER_BONUS.weekCap', { w: 90 }), 'XP') + note('결정 36 · 입점 보너스는 운동 하루·주 한도와 <b>따로</b> 세요. 운동량 ×1.2 전 기본 경험치 기준 · 아이템 배율 안 붙음.')
        + fr('오운완 셀카 보너스(기본 경험치의)', numIn('SELFIE_BONUS.pct'), '%') + fr('셀카 보너스 하루 횟수', numIn('SELFIE_BONUS.perDay'), '회') + note('결정 37 · 장소 무관 · 인증·연속·×1.2 안 곱한 고정값 · 운동 하루·주 한도 <b>안</b>(잘릴 땐 셀카 몫부터) · 앱 안 카메라만.'))}</div>`,
    mood: () => `<div class="agrid3">${sec('표정 판정 (결정 21 · 경험치와 무관)', fr('«아쉬운» — 평소 대비 미만', numIn('MOOD.low', { mul: 100 }), '%') + fr('«신남» — 평소 대비 이상', numIn('MOOD.high', { mul: 100 }), '%')
        + fr('«평소» = 최근 몇 회 중앙값', numIn('MOOD.baseN'), '회') + fr('«평소» 기간', numIn('MOOD.baseDays', { mul: 1 / 7 }), '주') + fr('판정에 필요한 최소 기록', numIn('MOOD.minBase'), '회')
        + fr('«아쉬운» 몇 번 연속이면 표정 대신 한마디', numIn('MOOD.quietAfter'), '번'))}
      ${sec('어떻게 쓰이나', note('세션을 저장할 때 종목별 «평소»와 비교해 그날 얼굴만 바뀌어요. 경험치·포인트·랭킹 계산에는 들어가지 않아요(PLAN §5-2 강도 4열 = 표정 전용).') + note('«가볍게 한 날» 체크 · 복귀 첫 세션 · 평소 기록 부족 종목이 절반 넘음 → 판정 안 함.'))}</div>`,
    lv: () => vLevels(),
    ach: () => { const L = achieveList(true);
      return sec('업적 24개 (PLAN §2-5 · 보상 = 업적 전용 꾸미기)', tbl(['사용', '분류', '업적', '조건', '목표', '보상'], L.map(a => { const o = (D.cfg.ACH || {})[a.name] || {};
        return `<tr class="${o.off ? 'aoff' : ''}"><td><button class="asw ${o.off ? '' : 'on'}" data-aact="achOff" data-v="${esc(a.name)}"></button></td><td>${a.cat}</td><td><b>${a.name}</b>${a.extra ? ' <span class="atag sm gray">보충안</span>' : ''}</td><td>${esc(a.cond)}</td>
        <td><input class="ain num ${o.goal ? 'chg' : ''}" style="width:70px" type="number" min="1" data-ach="${esc(a.name)}" value="${o.goal || a.goal0}" title="기본 ${a.goal0}"></td><td>${a.item}</td></tr>`; })),
        '<span class="amut">목표를 바꾸면 회원 앱 업적 진행 막대·달성 여부가 바뀌어요 · 끄면 목록에서 빠져요</span>'); },
    reward: () => { const T = [['cosmetic', '꾸미기(외형)', 1, true], ['title', '칭호', 1, true], ['effect', '효과(이펙트)', 1, true], ['point', '니짐 포인트', 1, true], ['coupon_norder', 'N오더 쿠폰', 2, false], ['center_benefit', '센터 혜택', 2, false], ['membership_discount', '멤버십 할인', 2, false], ['external', '외부 제휴', 2, false]];
      return sec('보상 종류 (rewards.type · reward_rules)', tbl(['켜기', '종류', '단계', '설명'], T.map(([k, l, ph, def]) => { const on = D.rewards[k] ?? def;
        return `<tr class="${on ? '' : 'aoff'}"><td><button class="asw ${on ? 'on' : ''}" data-aact="rwOn" data-v="${k}"></button></td><td><b>${l}</b> <span class="amut mono">${k}</span></td><td>${ph}차</td><td>${ph === 1 ? '앱 안에서 끝나는 보상' : '조건(센터·금액·월 상한)이 붙는 보상 — 2차에 켜기'}</td></tr>`; })))
        + note('보상은 «조건(reward_rules)»과 «보상(rewards)»이 따로라서 쿠폰 추가 = 행 1개. 이 스위치는 시연용 저장만 되고 회원 앱 화면엔 아직 연결 안 함(1차 4종 그대로).'); },
    shop: () => vShopAdm(),
    item: () => `<div class="agrid3">${sec('부스터·물약 (결정 33)', fr('부스터 배수', numIn('BOOST.mul', { step: '0.5' }), '배') + fr('물약 1병 경험치', numIn('POTION.xp'), 'XP')
        + fr('아이템 경험치 하루 한도', numIn('ITEM_CAP.day', { nullable: true }), '빈칸 = 없음') + fr('아이템 경험치 주 한도', numIn('ITEM_CAP.week', { nullable: true }), '빈칸 = 없음'))}
      ${sec('가격', ['boost1', 'boost7', 'potion'].map(id => { const b = ITEM_SEED.find(i => i.id === id), o = D.shop[id] || {};
        return fr(b.name.replace(/^2배/, CFG.BOOST.mul + '배').replace('+300', '+' + CFG.POTION.xp), `<input class="ain num ${o.price != null ? 'chg' : ''}" style="width:90px" type="number" data-shop="${id}" value="${o.price ?? b.price}" title="기본 ${b.price}">`, 'P'); }).join(''))}
      ${sec('메모', note('결정 33으로 «잠정 A안»(부스터·물약 하루 개수·경험치 상한)은 폐기됐어요. 지금 값 = 부스터 ×2 · 물약 +300 · 아이템 한도 없음. 한도를 다시 걸 일이 생기면 위 두 칸에만 넣어요 — 운동 한도(600·1,800)와 합치거나 나눠 쓰지 않아요.'))}</div>`,
  }[t]();
  return `<div class="ahead"><div><h2>업적·보상·레벨표·상점 관리 <span class="atag">회원 앱 계산에 반영</span></h2><p>여기 값은 회원 앱 계산 함수(engine.js) 한 곳으로 들어가요. 바꾼 칸은 노란색 · [저장]을 눌러야 회원 앱에 반영돼요.</p></div></div>
  <div class="atabs">${H2TABS.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-aact="h2" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="ah2 ${t === 'reward' || t === 'shop' ? 'full' : ''}"><div class="ah2main">${body}</div>${t === 'reward' || t === 'shop' ? '' : h2Preview()}</div>`;
}
function vLevels() {
  const from = AV.lvFrom, rows = [], C0 = CFG.CURVE;
  const base = withCfg(D, () => { const out = []; let cum = 0; for (let n = 1; n <= 99; n++) { out.push({ n, need: n < 99 ? need(n) : null, cum, pt: n > 1 ? lvPoint(n) : 0, evo: evoBonus(n), title: stageName(null, n), tier: TIER_NAME[tierOf(n)] }); if (n < 99) cum += need(n); } return out; });
  base.forEach(r => { const o = D.levels[r.n] || {}, inp = (f, v, w, ph = '') => `<input class="ain ${f === 'title' ? '' : 'num'} ${o[f] != null && o[f] !== '' ? 'chg' : ''}" style="width:${w}px" ${f === 'title' ? 'type="text"' : 'type="number"'} data-lv="${r.n}" data-f="${f}" value="${esc(o[f] ?? v ?? '')}" placeholder="${ph}">`;
    rows.push(`<tr class="${r.n % 10 === 0 || r.n === 99 ? 'aevo' : ''}"><td class="num"><b>Lv.${r.n}</b></td><td class="num">${r.n < 99 ? inp('xp', r.need, 76) : '<span class="amut">만렙</span>'}</td><td class="num">${nf(r.cum)}</td>
      <td>${inp('title', o.title ?? '', 104, r.title)}</td><td>${r.tier}</td><td>${r.n > 1 ? inp('pt', r.pt, 68) : '—'}</td><td>${inp('evo', r.evo || '', 68, '0')}</td></tr>`); });
  return `<div class="agrid3 lvtop">${sec('곡선 계수 (레벨 n→n+1 = a + b·n + c·n²)', fr('a', numIn('CURVE.a')) + fr('b', numIn('CURVE.b', { step: '0.5' })) + fr('c', numIn('CURVE.c', { step: '0.05' })) + `<button class="abtn ghost sm" data-aact="lvReset">레벨표 기본값으로</button>`)}
    ${sec('읽는 법', note('계수를 바꾸면 99행이 한꺼번에 다시 계산돼요. 특정 행만 바꾸려면 그 행 칸에 직접 넣어요(그 행이 계수보다 우선). 칭호를 비워 두면 기본(«n단계»)이 쓰여요. 굵은 줄 = 10레벨 진화.') + `<div class="amut">지금 a ${C0.a} · b ${C0.b} · c ${C0.c}</div>`)}</div>
  ${sec('레벨표 99행 (level_curve)', `<div class="atw tall">${tbl(['레벨', '다음 레벨까지 XP', '누적 XP', '칭호', '아우라', '레벨업 포인트', '진화 보너스'], rows, 'lvt').replace(/^<div class="atw">|<\/div>$/g, '')}</div>`, '<span class="amut">표 안에서 스크롤 · 머리줄 고정</span>')}`;
}
const RAR = { 일반: 'r0', 희귀: 'r1', 영웅: 'r2', 전설: 'r3' };
function vShopAdm() {
  const cats = [...new Set(SHOP82.map(x => x.cat))], ko = Object.fromEntries(SHOP82.map(x => [x.cat, x.cat_ko]));
  const list = SHOP82.filter(x => AV.shopCat === 'all' || x.cat === AV.shopCat);
  return sec('지금 회원 앱 상점 (9개 · 바로 반영)', tbl(['판매', '아이템', '설명(자동)', '가격'], ITEM_SEED.map(b => { const o = D.shop[b.id] || {}, cur = ITEMS.find(i => i.id === b.id);
      return `<tr class="${o.off ? 'aoff' : ''}"><td><button class="asw ${o.off ? '' : 'on'}" data-aact="shopOff" data-v="${b.id}"></button></td><td><b>${esc(cur.name)}</b></td><td>${esc(cur.desc)}</td><td><input class="ain num ${o.price != null ? 'chg' : ''}" style="width:90px" type="number" data-shop="${b.id}" value="${o.price ?? b.price}" title="기본 ${b.price}"> P</td></tr>`; })),
      '<span class="amut">v1.12 회원 앱에 실제로 있는 상점</span>')
    + sec(`상점 82개 (PLAN v1.8 §2-10 · shop_items) — ${list.length}개 표시`, `<div class="aflt" style="margin-bottom:10px">${seg('shopCat', AV.shopCat, [['all', '전체'], ...cats.map(c => [c, ko[c]])])}</div>`
      + `<div class="atw tall">${tbl(['판매', '분류', '#', '이름', '희귀도', '효과', '착용 Lv', '얻는 곳', '가격(P)'], list.map(x => { const o = D.shop82[x.id] || {};
        return `<tr class="${o.off ? 'aoff' : ''}"><td><button class="asw ${o.off ? '' : 'on'}" data-aact="s82Off" data-v="${x.id}"></button></td><td>${x.cat_ko}</td><td class="num">${x.no}</td><td><b>${esc(x.name)}</b></td><td><span class="arar ${RAR[x.rarity] || ''}">${x.rarity}</span></td><td>${esc(x.effect_text)}</td><td class="num">${x.level_req || '—'}</td>
          <td>${x.source === 'achievement_only' ? '업적 전용' : '상점'}</td><td>${x.price_points == null ? '<span class="amut">판매 안 함</span>' : `<input class="ain num ${o.price != null ? 'chg' : ''}" style="width:80px" type="number" data-s82="${x.id}" value="${o.price ?? x.price_points}">`}</td></tr>`; }), 's82').replace(/^<div class="atw">|<\/div>$/g, '')}</div>`,
      '<span class="atag gray">회원 앱 연결 = C안 4/4</span>');
}

/* ===== H3 부정 검토(V5) ===== */
function vH3() {
  const Q = fraudQueue(), dec = D.fraud = ADM.fraud, list = Q.filter(f => AV.fraudF === 'all' || (AV.fraudF === 'open' ? !dec[f.id] : !!dec[f.id]));
  const byRule = {}; Q.forEach(f => { byRule[f.rule] = (byRule[f.rule] || 0) + 1; });
  const SR = [['사람 2명 이상 찍힘', 212], ['헬스장·운동 장면 아님', 148], ['같은 사진 재사용(해시)', 61], ['갤러리 불러오기', 97], ['촬영 시각 ≠ 세션 시간', 38]], srT = SR.reduce((a, x) => a + x[1], 0), shots = 9840;
  const wkRate = [6.8, 6.1, 5.9, 5.4, 5.6, 5.0, 4.7, 4.9];
  return `<div class="ahead"><div><h2>부정 검토 목록 (V5) <span class="atag">자동 감지 · 조용히</span></h2><p>감지돼도 계정 정지·레벨 하락·경고문은 하지 않아요(VERIFICATION §4). 운영자가 보고 경험치 인정 여부만 정해요.</p></div>
    <div class="aflt">${seg('fraudF', AV.fraudF, [['all', '전체'], ['open', '검토 대기'], ['done', '처리함']])}</div></div>
  <div class="akrow">${kpi('최근 9일 감지', Q.length + '건')}${kpi('검토 대기', Q.filter(f => !dec[f.id]).length + '건')}${kpi('셀카 반려율(이번 주)', wkRate[7] + '%', `셀카 ${nf(shots)}장 중 반려 ${nf(srT)}장(누적 8주)`)}${kpi('보류 경험치', nf(Q.filter(f => !dec[f.id]).reduce((a, f) => a + f.xp, 0)) + ' XP')}</div>
  ${sec('검토 목록', tbl(['감지 시각', '회원', '센터', '규칙', '근거', '보류 XP', '결정'], list.map(f => { const d = dec[f.id];
    return `<tr><td class="num">${md(f.date)} ${f.hh}</td><td>${f.who}</td><td>${f.center.replace('니짐 ', '')}</td><td><b>${f.rule}</b></td><td>${esc(f.ev)}</td><td class="num">${f.xp}</td>
      <td>${d ? `<span class="${d === 'ok' ? 'agood' : 'abad'}">${d === 'ok' ? '✓ 인정(지급)' : '✕ 불인정'}</span> <button class="alink" data-aact="fraudUndo" data-v="${f.id}">되돌리기</button>`
        : `<button class="abtn sm" data-aact="fraudOk" data-v="${f.id}">인정</button> <button class="abtn sm ghost" data-aact="fraudNo" data-v="${f.id}">불인정</button>`}</td></tr>`; }), 'h3t'), '<span class="amut">회원 이름은 가려서 보여요 · 시연 결정은 이 브라우저에만 저장</span>')}
  <div class="agrid2">${sec('셀카 반려 사유 (최근 8주)', tbl(['사유', '건수', '비중'], SR.map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td><td class="wbar">${hshare(v, SR[0][1], pct(v, srT) + '%')}</td></tr>`)))}
    ${sec('셀카 반려율 추이', vbars(wkRate, wkRate.map((_, i) => i === 7 ? '이번 주' : `${7 - i}주 전`), { unit: '%', h: 190, fmt: v => v.toFixed(1) }))}</div>
  ${sec('규칙별 감지 (최근 9일)', tbl(['규칙', '건수'], Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${k}</td><td class="num">${v}</td></tr>`)))}`;
}

/* ===== H4 코칭 비용·품질 (개발사 서버 제공 데이터 자리) ===== */
function vH4() {
  const users = 4210, K = [['세션 한마디', 'Haiku 5.5', 16840, 2000, 120, .10, .50], ['주간 리포트', 'Sonnet 5.5', 16840, 5000, 600, 2, 10], ['코칭 대화', 'Sonnet 5.5', 21050, 4000, 300, 2, 10], ['정체·밸런스 문구', 'Sonnet 5.5', 8420, 2500, 150, 2, 10], ['셀카 판정', 'Haiku 5.5', 33680, 1700, 10, .10, .50]];
  const cost = K.map(([k, m, n, i, o, pi, po]) => ({ k, m, n, usd: n * (i * .5 * pi + o * po) / 1e6 })), tot = cost.reduce((a, x) => a + x.usd, 0);
  const daily = Array.from({ length: 26 }, (_, i) => +(tot / 26 * (.75 + .5 * Math.abs(Math.sin(i * 1.7)) + (i % 7 === 0 ? .25 : 0))).toFixed(2));
  return `<div class="ahead"><div><h2>코칭 비용·품질 <span class="atag gray">개발사 서버 제공 데이터 자리</span></h2><p>AI 코치 서버는 외부 개발사가 운영해요(PLAN §4-5). 이 화면은 그 서버가 주는 숫자를 보여 주는 자리 — 지금은 시연용 가짜 숫자예요.</p></div><div class="aflt"><span class="amut">이번 달 1일~오늘 · 환율 1,450원/$</span></div></div>
  <div class="akrow">${kpi('이번 달 비용', '$' + tot.toFixed(0), `≈ ${nf(tot * 1450 / 10000)}만원 · 예산 $800의 ${pct(tot, 800)}%`)}${kpi('활성 유저당', '$' + (tot / users).toFixed(3), `≈ ${nf(tot / users * 1450)}원 (기획 추정 ≈200원)`)}${kpi('필터 걸린 응답', '0.6%', '584건 중 의료·금지어')}${kpi('월 20회 다 쓴 유저', '3.1%', '131명')}</div>
  <div class="agrid2">${sec('종류별 호출·비용', tbl(['종류', '모델', '호출', '비용($)', '비중'], cost.map(x => `<tr><td>${x.k}</td><td>${x.m}</td><td class="num">${nf(x.n)}</td><td class="num">${x.usd.toFixed(1)}</td><td class="wbar">${hshare(x.usd, Math.max(...cost.map(c => c.usd)), pct(x.usd, tot) + '%')}</td></tr>`)))}
    ${sec('일별 비용($)', vbars(daily, daily.map((_, i) => (i + 1) + '일'), { unit: '$', h: 190, every: 5, fmt: v => v.toFixed(1) }))}</div>
  <div class="agrid2">${sec('필터 걸린 응답 샘플', tbl(['시각', '종류', '걸린 이유', '대신 나간 문구'], [
      ['10/25 21:14', '코칭 대화', '의료 질문(무릎 통증)', '고정 안내 · 운동 멈추고 의사·물리치료사·센터 선생님'],
      ['10/24 08:02', '세션 한마디', '금지어 «다이어트»', '템플릿 «오늘 하체 4세트, 지난주보다 1세트 더!»'],
      ['10/23 19:40', '주간 리포트', '다른 회원과 비교 문장', '템플릿(비교 대상 = 지난주의 너)'],
      ['10/22 22:31', '코칭 대화', '보충제 추천 요청', '고정 안내 · 처방 안 함']].map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`)))}
    ${sec('프롬프트 버전', tbl(['버전', '적용', '대상', '필터율', '👍 비율'], [['coach-v3', '10/21~', '대화·리포트', '0.5%', '82%'], ['coach-v2', '10/07~10/20', '대화·리포트', '1.1%', '76%'], ['oneliner-v4', '10/14~', '세션 한마디', '0.2%', '—']].map(r => `<tr>${r.map((x, i) => `<td class="${i > 2 ? 'num' : ''}">${x}</td>`).join('')}</tr>`))
      + note('예산 150% 넘으면 LLM 비율 자동 축소 → 템플릿 100%(개발사 구현 항목).'))}</div>`;
}

/* ===== H5 지표 대시보드 ===== */
function vH5() {
  const r = rng(99), lvDist = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((l, i) => Math.round(1800 * Math.pow(.52, i) * (.9 + r() * .2)));
  const ret = Array.from({ length: 8 }, (_, i) => ({ d7: 58 + i * 1.2 + r() * 3, d30: 34 + i * .9 + r() * 2 }));
  return `<div class="ahead"><div><h2>지표 대시보드</h2><p>운동기록 기능을 켠 계정 기준 · 최근 8주. 센터별은 읽기만.</p></div></div>
  <div class="akrow">${kpi('기록률', '41%', '앱 활성 중 주 1회 이상 기록')}${kpi('주간 목표 달성률', '57%', '목표 주 3회가 가장 많음')}${kpi('D7 재방문', ret[7].d7.toFixed(0) + '%')}${kpi('D30 재방문', ret[7].d30.toFixed(0) + '%')}${kpi('셀카 사용률', '18%', '세션 중 셀카 첨부')}${kpi('친구 보유율', '27%', '친구 1명 이상')}</div>
  <div class="agrid2">${sec('레벨 분포 (진화 단계별 계정 수)', vbars(lvDist, ['Lv1~9', '10~19', '20~29', '30~39', '40~49', '50~59', '60~69', '70~79', '80~89', '90~99'], { unit: '명', h: 200 }))}
    ${sec('검증 등급 비율 (세션)', stack([['V0 자가(집·야외·비입점)', 30, V_SEQ.V0], ['V1 입점센터 입장', 62, V_SEQ.V1], ['V3 레슨', 8, V_SEQ.V3]]) + note('검증 등급은 순서가 있는 값이라 한 색의 진하기로 구분(진할수록 확인이 강함).'))}</div>
  <div class="agrid2">${sec('D7 재방문 (가입 주별)', vbars(ret.map(x => x.d7), ret.map((_, i) => i === 7 ? '이번 주' : `${7 - i}주 전`), { unit: '%', h: 170, fmt: v => v.toFixed(0) }))}
    ${sec('D30 재방문 (가입 주별)', vbars(ret.map(x => x.d30), ret.map((_, i) => i === 7 ? '이번 주' : `${7 - i}주 전`), { unit: '%', h: 170, fmt: v => v.toFixed(0) }))}</div>
  ${sec('센터별 (읽기 전용)', tbl(['센터', '회원', '활성(4주)', '기록률', '세션(4주)', '레슨 연계', 'V1 이상 비율'], CENTERS.map(c => { const s = centerStats(c);
    return `<tr><td><b>${c.name}</b></td><td class="num">${nf(c.members)}</td><td class="num">${nf(s.act4)}</td><td class="num">${pct(s.act4, c.members)}%</td><td class="num">${nf(s.sess4)}</td><td class="num">${nf(s.lesson4)}</td><td class="num">${70 + (c.seed % 9)}%</td></tr>`; })))}`;
}

/* ===== H6 공개 비율 스위치 ===== */
const bucketOf = id => { let h = 2166136261; for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100; };
function vH6() {
  const p = D.rollout ?? 10, total = 28640, steps = [10, 50, 100];
  const demo = ['user_14384', 'user_15617', 'user_10548', 'user_10411', 'user_10274', 'user_11233', 'user_10000', 'user_10137', 'me_demo'];
  const rows = demo.map(id => { const b = bucketOf(id); return `<tr><td>${id === 'me_demo' ? '시연 계정(나)' : `<span class="mono">${id}</span>`}</td><td class="num">${b}</td><td>${b < p ? '<b class="agood">보임</b>' : '<span class="amut">안 보임</span>'}</td></tr>`; });
  return `<div class="ahead"><div><h2>공개 비율 스위치 <span class="atag">계정 기준 · 시범 센터 대신</span></h2><p>운동기록 탭을 앱 사용자 몇 %에게 보여 줄지 정해요. 계정 번호로 0~99 칸을 정해 두고 «칸 &lt; 비율»이면 보여요 → 비율을 올려도 이미 보던 사람은 계속 보여요.</p></div></div>
  <div class="agrid2">${sec('지금 단계', `<div class="aroll">${steps.map(s => `<button class="${p === s ? 'on' : ''} ${s < p ? 'past' : ''}" data-aact="roll" data-v="${s}"><b>${s}%</b><span>${nf(total * s / 100)}명</span></button>`).join('<i>→</i>')}</div>`
      + `<div class="akrow" style="margin-top:14px">${kpi('지금 보이는 계정', nf(total * p / 100) + '명', `앱 사용자 ${nf(total)}명 중`)}${kpi('예상 코칭 비용', '$' + nf(total * p / 100 * .41 * .14) + '/월', '기록률 41% × 유저당 $0.14')}</div>`
      + note('시연: 단계 버튼은 이 화면의 저장값만 바꿔요. 회원 앱 시연 화면에서 운동기록 탭을 숨기진 않아요(시연이 막히지 않게).'))}
    ${sec('다음 단계로 올리기 전 확인', `<ul class="achk"><li>H3 부정 감지율 2% 미만 · 보류 경험치 처리 밀림 없음</li><li>H4 유저당 코칭 비용 ≤ 기획 추정(≈200원)</li><li>H5 D7 재방문이 꺼진 그룹보다 낮지 않음</li><li>H7 월 포인트 적립 예측이 예산 안</li><li>앱 오류율·서버 응답 시간 정상(개발사)</li></ul>`)}</div>
  <div class="agrid2">${sec('계정별 칸 예시', tbl(['계정', '칸(0~99)', `${p}%일 때`], rows))}
    ${sec('바꾼 기록', tbl(['시각', '내용'], (D.rollLog || [{ at: '10/20 10:00', what: '0% → 10% (첫 공개)' }]).map(x => `<tr><td class="num">${x.at}</td><td>${x.what}</td></tr>`)))}</div>`;
}

/* ===== H7 포인트·유료 모니터 ===== */
function vH7() {
  const r = rng(5), months = ['5월', '6월', '7월', '8월', '9월', '10월'], earn = months.map((_, i) => Math.round(820000 * (1 + i * .28) * (.95 + r() * .1)));
  const cats = SHOP82.reduce((a, x) => { a[x.cat_ko] = (a[x.cat_ko] || 0) + 1; return a; }, {}), use = Object.keys(cats).map((k, i) => [k, Math.round([5120, 4380, 1980, 1210, 1460, 1720, 640, 410][i] * (.9 + r() * .2))]);
  const fc = [1, 2, 3].map(i => Math.round(earn[5] * Math.pow(1.17, i)));
  return `<div class="ahead"><div><h2>포인트·유료 모니터</h2><p>레벨업 포인트 적립과 현금 충전·아이템 사용을 같이 봐요. 1P = 1원 가정.</p></div><div class="aflt"><span class="amut">이번 달 = 10월 1일~오늘</span></div></div>
  <div class="akrow">${kpi('이번 달 적립', (earn[5] / 10000).toFixed(1) + '만P', `계정당 상한 ${nf(CFG.POINT.monthCap)}P`)}${kpi('상한 도달 계정', '214명', '적립 계정의 6.3%')}${kpi('유료 충전', '1,842만원', '1,912건')}${kpi('아이템 장부 비중', '17%', '전체 경험치 중 아이템분')}${kpi('💰 표시 계정', '11%', '현금 충전 포인트로 아이템 산 계정')}${kpi('«최근 7일 운동» 조건에 막힘', '1,284회', '사용 시도의 4.1% · 아이템 차감 안 함')}</div>
  <div class="agrid2">${sec('월 적립 총액 (P)', vbars(earn, months, { unit: 'P', h: 190 }))}
    ${sec('카테고리별 아이템 사용 (이번 달)', tbl(['카테고리', '사용', '비중'], use.map(([k, v]) => `<tr><td>${k}</td><td class="num">${nf(v)}</td><td class="wbar">${hshare(v, Math.max(...use.map(u => u[1])), pct(v, use.reduce((a, u) => a + u[1], 0)) + '%')}</td></tr>`)))}</div>
  ${sec('적립 비용 예측 (월 17% 증가 가정)', tbl(['', '11월', '12월', '1월'], [`<tr><td>예상 적립</td>${fc.map(v => `<td class="num">${nf(v)}P</td>`).join('')}</tr>`, `<tr><td>원화 환산</td>${fc.map(v => `<td class="num">₩${nf(v)}</td>`).join('')}</tr>`]) + note(`상한(${nf(CFG.POINT.monthCap)}P)·자가 기록 ${Math.round(CFG.POINT.v0Rate * 100)}%·아이템으로 오른 레벨 0P는 H2 값과 같은 엔진 규칙. 비용이 예산을 넘으면 H2 «월 포인트 적립 상한»을 먼저 조정.`))}`;
}

/* ===== 틀·이벤트 ===== */
function admToast(m) { const t = document.getElementById('admToast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(admToast.h); admToast.h = setTimeout(() => t.classList.remove('show'), 2600); }
const VIEWS = { a4: vA4, a5: vA5, h1: vH1, h2: vH2, h3: vH3, h4: vH4, h5: vH5, h6: vH6, h7: vH7 };
function admBar() { const ch = diffs();
  return `<div class="abar ${ch.length ? 'dirty' : ''}" id="admBar">${ch.length ? `<b>저장 안 한 변경 ${ch.length}건</b><span class="amut">${esc(ch.slice(0, 3).join(' · '))}${ch.length > 3 ? ' …' : ''}</span><button class="abtn ghost sm" data-aact="undo">취소</button><button class="abtn sm" data-aact="save">저장하고 회원 앱에 반영</button>`
    : `<span class="amut">저장된 본사 설정 ${(ADM.log || []).length ? `· 마지막 저장 ${ADM.log[0].at}` : '· 전부 기본값'}</span>${Object.keys(ADM.cfg).length || Object.keys(ADM.levels).length || Object.keys(ADM.ex).length || ADM.exAdd.length || Object.keys(ADM.shop).length ? '<button class="abtn ghost sm" data-aact="resetAll">전부 기본값으로</button>' : ''}`}</div>`; }
function admRender() {
  const on = isAdmin(); document.body.classList.toggle('admin-on', on);
  let el = document.getElementById('admin');
  if (!on) { if (el) el.innerHTML = ''; return; }
  if (!el) { el = document.createElement('div'); el.id = 'admin'; document.body.appendChild(el); }
  const r = VIEWS[route()] ? route() : 'a4', y = window.scrollY, inner = [...el.querySelectorAll('.atw.tall')].map(x => x.scrollTop);
  el.innerHTML = `<div class="adm"><aside class="aside"><div class="alogo">N 니짐내짐 <small>운동기록 관리자 시연</small></div>
    ${MENU.map(([g, items]) => `<div class="agrp">${g}</div>${items.map(([k, l]) => `<a href="#admin/${k}" class="${k === r ? 'on' : ''}">${l}</a>`).join('')}`).join('')}
    <a href="#" class="aback" data-aact="toApp">‹ 회원 앱 시연으로</a><div class="aver">프로토타입 ${VER}</div></aside>
    <main class="amain"><div class="awarn">🧪 관리자 <b>시연</b> 화면 · 숫자는 전부 시연용 가짜 데이터 · 실제 관리자 웹(ngym.co.kr)·회원 정보와 연결 없음</div>${admBar()}<div class="abody" id="admBody">${VIEWS[r]()}</div></main></div><div class="atoast" id="admToast"></div>`;
  if (admRender.keep) { window.scrollTo(0, y); el.querySelectorAll('.atw.tall').forEach((x, i) => { x.scrollTop = inner[i] || 0; }); } admRender.keep = false;
}
const rerender = () => { admRender.keep = true; admRender(); };
document.addEventListener('click', e => {
  if (!isAdmin()) return;
  const b = e.target.closest('[data-aact]'); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const a = b.dataset.aact, v = b.dataset.v, togg = (o, k, f = 'off') => { o[k] = { ...(o[k] || {}) }; o[k][f] = !o[k][f]; if (!o[k][f]) delete o[k][f]; if (!Object.keys(o[k]).length) delete o[k]; };
  const H = {
    toApp: () => { location.hash = ''; location.reload(); return 1; },
    range: () => { AV.range = +v; }, exCat: () => { AV.exCat = v; }, shopCat: () => { AV.shopCat = v; }, fraudF: () => { AV.fraudF = v; },
    h2: () => { AV.h2 = v; },
    a5ok: () => { AV.a5[v] = true; admToast('출석 확정 · 회원 캐릭터에 경험치 지급(시연)'); },
    exOff: () => togg(D.ex, v), achOff: () => { D.cfg.ACH = D.cfg.ACH || {}; togg(D.cfg.ACH, v); if (!Object.keys(D.cfg.ACH).length) delete D.cfg.ACH; },
    shopOff: () => togg(D.shop, v), s82Off: () => togg(D.shop82, v),
    rwOn: () => { const def = !['coupon_norder', 'center_benefit', 'membership_discount', 'external'].includes(v), cur = D.rewards[v] ?? def; if (!cur === def) delete D.rewards[v]; else D.rewards[v] = !cur; },
    exAdd: () => { const name = document.getElementById('nxName').value.trim(); if (!name) return admToast('이름을 넣어 주세요'), 1;
      if ([...EX_SEED, ...D.exAdd].some(x => x.name === name)) return admToast('같은 이름이 이미 있어요'), 1;
      const cat = document.getElementById('nxCat').value, mode = document.getElementById('nxMode').value, part = document.getElementById('nxPart').value;
      D.exAdd.push({ id: 'add_' + Date.now().toString(36), name, cat, part, sub: [], mode, xpk: mode === 'cardio' ? 'cardio' : mode === 'wr' ? 'weight' : 'body', w: mode === 'wr' ? 20 : undefined, step: mode === 'wr' ? 5 : undefined, bw: mode === 'wr' ? 2 : undefined, home: cat === 'out' || cat === 'body' ? 1 : undefined, al: '' });
      admToast(`«${name}» 추가 · [저장]을 누르면 회원 앱에 나와요`); },
    lvReset: () => admReset('levels'), resetAll: () => admReset('all'),
    undo: () => { D = clone(ADM); },
    save: () => (admSave(), 1),
    fraudOk: () => { ADM.fraud[v] = 'ok'; persist({ ...adminLoad(), fraud: ADM.fraud }); }, fraudNo: () => { ADM.fraud[v] = 'no'; persist({ ...adminLoad(), fraud: ADM.fraud }); },
    fraudUndo: () => { delete ADM.fraud[v]; persist({ ...adminLoad(), fraud: ADM.fraud }); },
    roll: () => { const from = D.rollout ?? 10, to = +v; if (from === to) return 1;
      const log = [{ at: new Date().toLocaleString('ko-KR'), what: `${from}% → ${to}%` }, ...(ADM.rollLog || [{ at: '10/20 10:00', what: '0% → 10% (첫 공개)' }])].slice(0, 10);
      ADM.rollout = D.rollout = to; ADM.rollLog = D.rollLog = log; persist({ ...adminLoad(), rollout: to, rollLog: log }); admToast(`공개 비율 ${to}% (시연)`); },
  };
  if (!H[a]) return;
  if (H[a]() === undefined) rerender();
}, true);
document.addEventListener('change', e => {
  if (!isAdmin()) return;
  const t = e.target, d = t.dataset;
  if (d.aset) { AV[d.aset] = t.value; return rerender(); }
  const num = t.value === '' ? null : +t.value;
  if (d.cfg) { if (num == null && !d.null) return rerender(); setCfg(d.cfg, num == null ? null : +(num / +d.mul).toFixed(6)); }
  else if (d.lv) { const n = +d.lv, o = D.levels[n] = { ...(D.levels[n] || {}) };
    const def = withCfg({ cfg: D.cfg, levels: {} }, () => ({ xp: need(n), pt: lvPoint(n), evo: evoBonus(n), title: '' }))[d.f];
    const val = d.f === 'title' ? t.value.trim() : num;
    if (val == null || val === '' || val === def) delete o[d.f]; else o[d.f] = val;
    if (!Object.keys(o).length) delete D.levels[n]; }
  else if (d.ach) { D.cfg.ACH = D.cfg.ACH || {}; const o = D.cfg.ACH[d.ach] = { ...(D.cfg.ACH[d.ach] || {}) }, def = achieveList(true).find(a => a.name === d.ach).goal0;
    if (!num || num === def) delete o.goal; else o.goal = Math.max(1, Math.round(num)); if (!Object.keys(o).length) delete D.cfg.ACH[d.ach]; if (!Object.keys(D.cfg.ACH).length) delete D.cfg.ACH; }
  else if (d.shop) { const o = D.shop[d.shop] = { ...(D.shop[d.shop] || {}) }, def = ITEM_SEED.find(i => i.id === d.shop).price; if (num == null || num === def) delete o.price; else o.price = num; if (!Object.keys(o).length) delete D.shop[d.shop]; }
  else if (d.s82) { const o = D.shop82[d.s82] = { ...(D.shop82[d.s82] || {}) }, def = SHOP82.find(i => i.id === d.s82).price_points; if (num == null || num === def) delete o.price; else o.price = num; if (!Object.keys(o).length) delete D.shop82[d.s82]; }
  else if (d.exf) { const id = d.id, base = [...EX_SEED, ...D.exAdd].find(x => x.id === id), o = D.ex[id] = { ...(D.ex[id] || {}) }, ed = o.edit = { ...(o.edit || {}) };
    if (t.value === (base[d.exf] ?? '')) delete ed[d.exf]; else ed[d.exf] = t.value;
    if (!Object.keys(ed).length) delete o.edit; if (!Object.keys(o).length) delete D.ex[id]; }
  else return;
  rerender();
}, true);
window.addEventListener('hashchange', () => { if (isAdmin()) { admRender(); window.scrollTo(0, 0); } else location.reload(); });

/* 들어가는 길: PC 폭에선 화면 오른쪽 위 버튼(회원 앱 기둥 밖) · 어느 폭이든 운동기록 › 설정 › 시연 도구 */
(() => {
  const a = document.createElement('a'); a.href = '#admin/a4'; a.className = 'adm-entry'; a.textContent = '🛠 관리자 시연'; document.body.appendChild(a);
  const vSet0 = SUB.settings;
  SUB.settings = () => vSet0().replace('<div class="card demo"><div class="h3">🧪 시연 도구</div>', '<div class="card demo"><div class="h3">🧪 시연 도구</div><a class="btn ghost" href="#admin/a4" id="admLink" style="display:block;text-align:center;margin-bottom:10px;text-decoration:none">관리자 시연 화면 열기 (PC 폭)</a>');
  const m = sessionStorage.getItem('adm_toast');
  if (isAdmin()) { admRender(); if (m) { admToast(m); sessionStorage.removeItem('adm_toast'); } }
})();
