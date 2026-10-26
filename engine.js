'use strict';
/* ===== 경험치·레벨·표정·랭킹 계산 엔진 — 계산은 이 파일 한 곳에서만 =====
   화면(app.js)은 여기 함수를 부르고 결과만 그린다. DOM·저장소 접근 없음(순수 함수) → 4단계 인계 꾸러미의 기준 코드.
   실서비스: 서버 함수로 옮겨 같은 입력이면 같은 출력이 나와야 한다(PLAN §2-3·§2-5·§2-10·§2-11 · VERIFICATION §1·§4).
   의존: exercises.js 의 EX(운동 사전). */
const CFG = {
  DAY_CAP: 600, DAY_CAP_V0: 200,          // 하루 상한(그날 기록이 전부 V0면 200)
  WEEK_CAP: 1800,                          // 결정 32
  XP: { weight: 10, body: 8, cardio: 2, lesson: 150, firstSet: 20, complete: 50, newPart: 15, pr: 30, weekGoal: 200 },
  LIM: { weightSets: 30, bodySets: 30, cardioMin: 60, newPartsWeek: 6, prDay: 3, exPerSession: 25, cardioMaxMin: 180 },
  VERIFY: { V0: 0.4, V1: 1.0, V3: 2.0 },   // 결정 36 ①: 입점센터 입장 V1 0.8 → 1.0 · 결정 37 ②: 비입점 위치 V1b(0.7)·셀카 V2(1.0) 폐지 → 입점 안 된 헬스장 = V0
  STREAK: [1.0, 1.0, 1.05, 1.10, 1.20, 1.20, 1.30],   // 연속 주 0~6+ (6주 이상 1.30)
  COMEBACK_DAYS: 7, COMEBACK_MUL: 1.5,                // 7일+ 쉬고 첫 세션 — 연속 배율 대신
  MOOD: { low: 0.6, high: 1.3, baseN: 10, baseDays: 56, minBase: 5, newShare: 0.5, quietAfter: 3 },
  CARDIO_K: { light: 0.8, normal: 1.0, hard: 1.2 },
  BOOST: { mul: 2 },
  POTION: { xp: 300 },
  /* 결정 33: 하루 600·주 1,800 은 «운동 경험치»에만. 아이템 경험치(부스터로 늘어난 몫·물약·앞으로 나올 먹는/마시는 아이템)는
     장부를 따로 세고 지금은 한도 없음(null). 나중에 걸더라도 이 칸에만 — 운동 한도와 합치거나 나눠 쓰지 않는다 */
  ITEM_CAP: { day: null, week: null },
  SET_GAP_SEC: 20, SET_GAP_RUN: 3,         // 같은 운동 세트 완료 간격 20초 미만 3회 연속 → 경험치 보류
  UNREAL_PR_MUL: 1.5, SAFETY_JUMP: 0.2, BODYWEIGHT_DEFAULT: 70,
  REST_SEC: 90, AUTO_END_MIN: 180,
  CURVE: { a: 200, b: 12, c: 0.3 },        // 레벨 n→n+1 필요 = a + b·n + c·n²
  ACH: {},                                 // 업적 덮어쓰기 { 이름: { goal, off } } — H2
  /* 결정 35(v1.10): 횟수형 웨이트·맨몸 세트는 5회 이상만 경험치 · 종목별 이번 양(대상 세트·유산소 분)이 «내 평소»의 130% 이상이면 그 운동 기본 ×1.2.
     «내 평소» 기간·횟수는 표정(MOOD.baseN·baseDays·minBase)과 같은 키를 읽고, 임계값은 표정(MOOD.high)과 따로 둔다 */
  MIN_REPS: 5,
  VOL_BONUS: { ratioPct: 130, mult: 1.2 },
  /* 결정 36(SPEC §3-2a): 입점센터 입장(V1) 세션 = 기본 경험치(운동량 ×1.2 전·첫 세트·완료·레슨 포함) × pct% 를 «입점 보너스 장부»에.
     이 장부는 주 weekCap 만 본다 — 하루 600·주 1,800 과 무관, 아이템 배율·부스터도 안 붙는다 */
  CENTER_BONUS: { pct: 50, weekCap: 900 },
  /* 결정 38: 운동·레벨업·진화·업적 포인트 지급 없음(POINT 키 삭제). 캐릭터 쪽 포인트는 구매적립(실결제)·상점 쓰기만.
     ⑦-1 B — 입점 보너스는 운동 레벨·[운동만 보기]·친구 리그·주간 리그(xp_week)·DID 랭킹판에 전부 들어간다. 빠지는 건 아이템 장부뿐 */
  /* 결정 37(SPEC §3-2b): 오운완 셀카 = round(기본 경험치 × pct%) 고정 가산 — 인증·연속·×1.2 안 곱함 · 장소 무관 · 하루 perDay회 ·
     앱 안 카메라만 · 운동 장부(하루 600·V0 200·주 1,800 안, 잘릴 땐 셀카 몫부터) · 입점 보너스와 서로 안 곱함 */
  SELFIE_BONUS: { pct: 20, perDay: 1 },
};
/* ----- 운영자 설정(H2·H1) — 본사가 바꾼 값은 전부 여기로만 들어온다. 화면은 CFG·need 를 통해서만 읽는다 ----- */
const CFG_DEFAULT = JSON.parse(JSON.stringify(CFG));
const LV_OVR = {};   // 레벨표 99행 중 바꾼 행 { n: { xp, title } }
const merge = (t, o) => { Object.keys(o || {}).forEach(k => { const v = o[k];
  if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object' && !Array.isArray(t[k])) merge(t[k], v); else t[k] = v; }); return t; };
function applyConfig({ cfg = {}, levels = {} } = {}) {
  Object.keys(CFG).forEach(k => delete CFG[k]); merge(CFG, JSON.parse(JSON.stringify(CFG_DEFAULT))); merge(CFG, cfg);
  Object.keys(LV_OVR).forEach(k => delete LV_OVR[k]); Object.assign(LV_OVR, levels);
}
const VERIFY_LABEL = { V0: '자가 기록', V1: '입점센터 입장 ✓', V3: '선생님 확인 ★ 2배' };

/* ----- 레벨 곡선 ----- */
const needBase = n => Math.round(CFG.CURVE.a + CFG.CURVE.b * n + CFG.CURVE.c * n * n);
const ovr = (n, k) => LV_OVR[n] && LV_OVR[n][k] != null && LV_OVR[n][k] !== '' ? LV_OVR[n][k] : null;
const need = n => ovr(n, 'xp') ?? needBase(n);
const levelTitle = L => ovr(L, 'title');   // null = 기본 칭호(단계명)
const streakMul = w => CFG.STREAK[Math.min(CFG.STREAK.length - 1, Math.max(0, w))];

/* 경험치 반영 → 레벨. 음수(기록 수정으로 줄어듦)면 레벨은 그대로, 이번 레벨 안에서만 줄어든다(0 아래로 안 감)
   결정 38: 레벨업·진화로 포인트를 주지 않는다 — 반환에 points 없음 */
function applyXP({ level, xp }, gained) {
  if (gained < 0) return { from: level, level, xp: Math.max(0, xp + gained) };
  let lv = level, x = xp + gained;
  while (lv < 99 && x >= need(lv)) { x -= need(lv); lv++; }
  if (lv >= 99) x = 0;
  return { from: level, level: lv, xp: x };
}

/* 화면 레벨(세 장부 합)과 운동 레벨(운동 + 입점 보너스, ⑦-1 B)을 같이 올린다. itemXP 는 화면 레벨에만 */
function applyGain(st, exXP, itemXP, cbXP = 0) {
  const a = applyXP(st, exXP + cbXP), b = itemXP ? applyXP({ level: a.level, xp: a.xp }, itemXP) : a;
  return { from: a.from, level: b.level, xp: b.xp };
}

/* ----- 장부 — 운동 경험치와 아이템 경험치를 따로 센다(결정 33) -----
   records: { date, xp(받은 합계), xpBoost(그중 부스터로 늘어난 몫), paid(물약 등 아이템 단독), v } */
function ledgerOf(records, today, weekDays) {
  const wk = records.filter(r => weekDays.includes(r.date) && !r.demo), td = wk.filter(r => r.date === today);
  const sum = (a, f) => a.reduce((s, r) => s + (f(r) || 0), 0);
  const exOnly = r => r.paid ? 0 : (r.xp || 0) - (r.xpBoost || 0) - (r.xpCenter || 0), itemOnly = r => r.paid ? r.xp : r.xpBoost;
  return {
    dayUsed: sum(td, exOnly), weekEx: sum(wk, exOnly),
    dayItem: sum(td, itemOnly), weekItem: sum(wk, itemOnly), weekPaid: sum(wk.filter(r => r.paid), r => r.xp),
    weekCenter: sum(wk, r => r.paid ? 0 : r.xpCenter),
    allV0Today: td.filter(r => !r.paid).every(r => r.v === 'self'),
  };
}
/* 이번 주 운동 경험치(주 1,800 한도에 세는 양) — 아이템분은 들어가지 않는다 */
const weekUsedOf = L => L.weekEx;
/* 결정 38(⑦-1 B) 리그·랭킹 주간 경험치 xp_week = 운동 장부 + 입점 보너스 장부, V1·V3 검증 세션만(V0·아이템 제외) → 최대 1,800 + 900 */
function leagueWeekOf(records, weekDays) {
  return records.filter(r => weekDays.includes(r.date) && !r.demo && !r.paid && r.v !== 'self')
    .reduce((s, r) => s + Math.max(0, (r.xp || 0) - (r.xpBoost || 0)), 0);
}
/* 아이템 경험치 남은 한도 — 지금은 Infinity(한도 없음) */
const itemLeftOf = L => Math.min(CFG.ITEM_CAP.day == null ? Infinity : CFG.ITEM_CAP.day - L.dayItem, CFG.ITEM_CAP.week == null ? Infinity : CFG.ITEM_CAP.week - L.weekItem);
const itemUncapped = () => CFG.ITEM_CAP.day == null && CFG.ITEM_CAP.week == null;

/* 한도 적용 — 운동분만 하루·주 상한(더 적게 남은 쪽까지), 부스터로 늘어난 몫은 아이템 장부(한도 없음)
   반환 { gained(합계), exGained, boostGained, cut(운동분에서 빠진 양), reason: 'day'|'week'|null } */
function capGain(r, L, isV0) {
  const dayCap = (L.allV0Today && isV0) ? CFG.DAY_CAP_V0 : CFG.DAY_CAP;
  const dayLeft = Math.max(0, dayCap - L.dayUsed), weekLeft = Math.max(0, CFG.WEEK_CAP - weekUsedOf(L));
  const exRaw = r.raw - (r.boostPart || 0), exGained = Math.max(0, Math.min(exRaw, dayLeft, weekLeft));
  const boostGained = Math.max(0, Math.min(r.boostPart || 0, itemLeftOf(L)));
  const cut = exRaw - exGained, selfieGained = Math.max(0, (r.selfieXP || 0) - cut);   // 결정 37: 잘린 양은 셀카 몫부터
  return { gained: exGained + boostGained, exGained, boostGained, selfieGained, cut, reason: cut > 0 ? (weekLeft <= dayLeft ? 'week' : 'day') : null, dayLeft, weekLeft };
}
/* 물약 1병 — 유료 경험치(💰) · 아이템 장부 · 하루 개수 제한 없음 */
function potionGain(L) {
  const gained = Math.max(0, Math.min(CFG.POTION.xp, itemLeftOf(L)));
  return { gained, cut: CFG.POTION.xp - gained, reason: gained >= CFG.POTION.xp ? null : 'item' };
}

/* ----- 세션 경험치 (PLAN §2-3 · 결정 35 = XP_ENGINE_SPEC v1.10 §3-1) -----
   세션 XP = (Σ 운동별 기본 × 평소 대비(1.0|1.2) + 첫 세트 20 + 완료 50) × 검증 × 연속(복귀면 ×1.5) [× 부스터] + 고정(새 부위·PR·주간 목표)
   s = { verify:'V0'|'V1'|'V3', selfie: null | { src:'camera'|'gallery', dup, ai:'ok'|'reject', past }, items:[{ ex, sets:[{w,r,s,done,pr}], min }], prCount }
   c = { firstToday, weekParts[], streakWeeks, lastDays, prToday, goal, weekCountBefore, todayCounted, boost, selfieToday(그날 셀카 보너스 이미 받음),
         xpBase:{ex: 평소 양|null}, todayQ:{ex: 오늘 앞 세션 대상 양}, todayPrev:[{ex, cnt, bonus, mul}] } */
/* 결정 37 ②·SPEC 단위 32: 옛 V1b·V2(또는 모르는 값)는 V0 로 — 0.7·1.0 배율은 어디서도 안 씀. 셀카는 등급을 바꾸지 않는다 */
const effVerify = s => CFG.VERIFY[s.verify] != null ? s.verify : 'V0';
/* 오운완 셀카 보너스 (SPEC §3-2b) — 반환 { sf, why } · why = 안 준 이유(화면 안내용) */
function selfieBonus(s, c, baseXP, any) {
  const p = s.selfie; if (!p) return { sf: 0, why: null };
  if (!any || !(baseXP > 0)) return { sf: 0, why: 'norecord' };   // 5회 미만 세트를 뺀 뒤 대상 기록 0 → 셀카만으론 0
  if (p.src !== 'camera') return { sf: 0, why: 'gallery' };
  if (p.ai && p.ai !== 'ok') return { sf: 0, why: 'ai' };
  if (p.dup) return { sf: 0, why: 'dup' };
  if (p.past) return { sf: 0, why: 'past' };
  if ((c.selfieToday || 0) >= CFG.SELFIE_BONUS.perDay) return { sf: 0, why: 'today' };
  return { sf: Math.round(baseXP * CFG.SELFIE_BONUS.pct / 100), why: null };
}
/* 경험치 대상 세트 = 완료 + (시간형이거나 MIN_REPS회 이상). 5회 미만도 기록·PR·표정·코칭엔 그대로 쓴다 */
const xpEligible = (e, st) => !!st.done && (e.mode !== 'wr' && e.mode !== 'r' ? true : (st.r || 0) >= CFG.MIN_REPS);
/* 운동 1개의 «경험치 양» — 웨이트·맨몸 = 대상 세트 수 · 유산소 = 분 · 레슨 = 1 */
function xpQty(it) {
  const e = EX[it.ex]; if (!e) return 0;
  if (e.xpk === 'cardio') return Math.min(CFG.LIM.cardioMaxMin, it.min || 0);
  if (e.xpk === 'lesson') return 1;
  return (it.sets || []).filter(x => xpEligible(e, x)).length;
}
const shortSets = it => { const e = EX[it.ex]; return e && (e.mode === 'wr' || e.mode === 'r') ? (it.sets || []).filter(x => x.done && !xpEligible(e, x)).length : 0; };
/* 경험치용 «내 평소» = 기준일 −56일 안 · «가볍게» 제외 · 같은 날은 합쳐 1회 · 최신 10회 중앙값 · 5회 미만이면 null (SPEC §3-1a)
   hist[ex] = [{ date, light, q }] (오늘 것 제외) */
function xpBaselineOf(hist, exId, today) {
  const from = new Date(today); from.setDate(from.getDate() - CFG.MOOD.baseDays);
  const lim = from.toISOString().slice(0, 10), byDay = {};
  (hist[exId] || []).filter(h => !h.light && h.date >= lim && h.date < today).forEach(h => { byDay[h.date] = (byDay[h.date] || 0) + (h.q || 0); });
  const v = Object.keys(byDay).sort().reverse().slice(0, CFG.MOOD.baseN).map(d => byDay[d]);
  return v.length >= CFG.MOOD.minBase ? median(v) : null;
}
/* 정수 %로 비교 — 언어·DB마다 경계값(정확히 130%) 판정이 같게 */
const volBonusOn = (qd, b) => b != null && b > 0 && qd * 100 >= b * CFG.VOL_BONUS.ratioPct;
function sessionXP(s, c) {
  const X = CFG.XP, UNIT = { weight: X.weight, body: X.body, cardio: X.cardio }, LEFT = { weight: CFG.LIM.weightSets, body: CFG.LIM.bodySets, cardio: CFG.LIM.cardioMin };
  const xb = c.xpBase || {}, tq = c.todayQ || {};
  const cnt = { weight: 0, body: 0, cardio: 0 }, xpOf = { weight: 0, body: 0, cardio: 0 };
  let l = 0, base = 0, plainSum = 0, bonusXP = 0, short = 0;
  const per = [], bonusRows = [], noBase = [];
  s.items.slice(0, CFG.LIM.exPerSession).forEach(it => {
    const e = EX[it.ex]; if (!e) return;
    short += shortSets(it);
    if (e.xpk === 'lesson') { l++; return; }
    const k = e.xpk, n = Math.min(xpQty(it), LEFT[k]); LEFT[k] -= n;   // 세션 상한은 개수에 먼저(SPEC ⑥-3)
    if (!n) return;
    const b = xb[it.ex] ?? null, qd = (tq[it.ex] || 0) + n, on = volBonusOn(qd, b);
    const plain = UNIT[k] * n, extra = on ? plain * (CFG.VOL_BONUS.mult - 1) : 0;
    cnt[k] += n; xpOf[k] += plain; plainSum += plain; base += plain + extra; bonusXP += extra;
    per.push({ ex: it.ex, cnt: n, bonus: on, base: b, qd });
    if (on) bonusRows.push([e.name, extra, b, qd]); else if (b == null) noBase.push(e.name);
  });
  const lines = [['웨이트·머신', cnt.weight, '세트', xpOf.weight], ['맨몸', cnt.body, '세트', xpOf.body], ['유산소', cnt.cardio, '분', xpOf.cardio], ['레슨', l, '회', l * X.lesson]].filter(x => x[1] > 0);
  base += l * X.lesson;
  const any = cnt.weight + cnt.body + cnt.cardio + l > 0;   // v1.10: «경험치 대상 기록 1개 이상»일 때만 첫 세트·완료
  const first = c.firstToday && any ? X.firstSet : 0, complete = c.firstToday && any ? X.complete : 0;
  const v = effVerify(s), vm = CFG.VERIFY[v];
  const comeback = c.lastDays >= CFG.COMEBACK_DAYS, sm = comeback ? CFG.COMEBACK_MUL : streakMul(c.streakWeeks);
  const baseXP = plainSum + l * X.lesson + first + complete;   // SPEC ④-b: 입점 보너스·셀카 기준 = 운동량 ×1.2 전 · 검증·연속·고정 전
  const { sf: selfieXP, why: selfieWhy } = selfieBonus(s, c, baseXP, any);
  const mult = Math.round((base + first + complete) * vm * sm), bm = c.boost === true ? CFG.BOOST.mul : (c.boost || 0), boostPart = bm && any ? Math.round((mult + selfieXP) * (bm - 1)) : 0;   // c.boost = 배율(숫자) · true 는 예전 2배 부스터 · 셀카 몫에도 배율(PLAN ⑧-2 A)
  /* 같은 날 나눠 저장: 앞 세션에서 ×1.0이던 종목이 그날 합계로 ×1.2가 되면 앞 세션 몫 차액을 이번 세션에 더한다(앞 원장은 안 고침) */
  const nowOn = new Set(per.filter(x => x.bonus).map(x => x.ex));
  const catchUp = Math.round((c.todayPrev || []).filter(p => !p.bonus && nowOn.has(p.ex)).reduce((a, p) => a + UNIT[EX[p.ex].xpk] * p.cnt * (CFG.VOL_BONUS.mult - 1) * p.mul, 0));
  const worked = it => (it.sets || []).some(x => x.done) || it.min > 0 || (EX[it.ex] && EX[it.ex].xpk === 'lesson');
  const parts = [...new Set(s.items.filter(worked).map(it => EX[it.ex] && EX[it.ex].part).filter(Boolean))];
  const fresh = parts.filter(p => !c.weekParts.includes(p));
  const newN = Math.min(fresh.length, Math.max(0, CFG.LIM.newPartsWeek - c.weekParts.length));
  const prN = Math.min(s.prCount || 0, Math.max(0, CFG.LIM.prDay - (c.prToday || 0)));
  const goal = any && !c.todayCounted && c.weekCountBefore + 1 === c.goal ? X.weekGoal : 0;
  const fixed = newN * X.newPart + prN * X.pr + goal;
  return { lines, base, baseXP, selfieXP, selfieWhy, bonusXP, bonusRows, noBase, short, per, catchUp, first, complete, v, vm, sm, comeback, mult, boostPart, bm, newParts: fresh.slice(0, newN), newXP: newN * X.newPart,
    prN, prXP: prN * X.pr, goal, fixed, raw: mult + catchUp + boostPart + fixed + selfieXP, any };
}

/* ----- 입점 보너스 (결정 36 · SPEC §3-2a) — 세 번째 장부. 운동 장부 반영(capGain) 결과와 무관하게 baseXP 에서 바로 -----
   r = sessionXP 결과 · L = ledgerOf · held = 보류 세션. 반환 { cb, cbRaw, cut, weekLeft } */
function centerBonus(r, L, held = false) {
  const weekLeft = Math.max(0, CFG.CENTER_BONUS.weekCap - (L.weekCenter || 0));
  if (r.v !== 'V1' || held || !(r.baseXP > 0)) return { cb: 0, cbRaw: 0, cut: 0, weekLeft };
  const cbRaw = Math.round(r.baseXP * CFG.CENTER_BONUS.pct / 100), cb = Math.min(cbRaw, weekLeft);
  return { cb, cbRaw, cut: cbRaw - cb, weekLeft };
}
/* «입점센터였다면 +○○» — 같은 운동을 입점센터 입장(V1)으로 했을 때와의 차이(한도·주 900 미적용 «이번 운동만» 값).
   V1·레슨(V3)이면 null, 0 이하면 화면에서 숨김. 부스터 몫은 양쪽에서 빼고 비교 · 셀카 몫은 양쪽에 같이 들어가 차이에 영향 없음 */
function centerIf(s, c, r = sessionXP(s, c)) {
  if (r.v === 'V1' || r.v === 'V3') return null;
  const r1 = sessionXP({ ...s, verify: 'V1' }, c);
  const d = (r1.raw - r1.boostPart) + Math.round(r1.baseXP * CFG.CENTER_BONUS.pct / 100) - (r.raw - r.boostPart);
  return d > 0 ? d : null;
}

/* ----- 세트 판정 ----- */
const e1rm = st => (st.w || 0) * (1 + (st.r || 0) / 30);
const setScore = (e, st) => e.mode === 'wr' ? e1rm(st) : e.mode === 't' ? (st.s || 0) : (st.r || 0);
/* PR = 그 운동의 지난 최고(무게×횟수 환산 1RM · 맨몸은 횟수 · 시간 운동은 초)를 넘을 때. 기록이 처음이면 PR 아님 */
const isPR = (e, st, best) => best > 0 && setScore(e, st) > best;
/* 무게 확인: unreal = 체중×종목 계수 초과 또는 지난 최고 무게의 1.5배 초과(«정말요?» 1회 확인) · jump = 지난번 최고보다 20% 이상 무거움(안전 안내) */
function checkWeight(e, w, { bodyweight, bestW, lastTopW }) {
  if (e.mode !== 'wr') return { unreal: false, jump: false };
  const bw = bodyweight || CFG.BODYWEIGHT_DEFAULT;
  return { unreal: w > bw * (e.bw || 2) || (bestW > 0 && w > bestW * CFG.UNREAL_PR_MUL), jump: lastTopW > 0 && w >= lastTopW * (1 + CFG.SAFETY_JUMP), jumpPct: lastTopW > 0 ? Math.round((w / lastTopW - 1) * 100) : 0 };
}
/* 같은 운동 세트 완료 간격 20초 미만이 3번 연속 → 경험치 보류(기록은 저장) */
function isHeld(times) {
  let run = 0; for (let i = 1; i < times.length; i++) { run = (times[i] - times[i - 1]) / 1000 < CFG.SET_GAP_SEC ? run + 1 : 0; if (run >= CFG.SET_GAP_RUN) return true; }
  return false;
}

/* ----- 세션 강도 → 표정 (결정 21 · PLAN §2-5) -----
   종목별 «내 평소» = 최근 10회 중앙값(8주 이내·가볍게 체크 제외), 5회 미만이면 그 종목은 비교에서 뺀다.
   근력 = Σ 횟수×무게(맨몸은 횟수, 시간 운동은 초) · 유산소 = 분 × 강도(가벼움 0.8·보통 1·힘듦 1.2)
   hist[ex] = [{ date, vol, light }] (오늘 것 제외) */
const median = a => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
function itemVolume(it) {
  const e = EX[it.ex]; if (!e) return 0;
  if (e.mode === 'cardio') return (it.min || 0) * (CFG.CARDIO_K[it.level || 'normal'] || 1);
  return (it.sets || []).filter(x => x.done).reduce((a, x) => a + (e.mode === 'wr' ? (x.r || 0) * (x.w || 0) : e.mode === 't' ? (x.s || 0) : (x.r || 0)), 0);
}
const itemBaseXP = (it, vol) => { const e = EX[it.ex]; return e.xpk === 'cardio' ? vol * CFG.XP.cardio : CFG.XP[e.xpk] * Math.max(1, (it.sets || []).filter(x => x.done).length); };
function baselineOf(hist, exId, today) {
  const from = new Date(today); from.setDate(from.getDate() - CFG.MOOD.baseDays);
  const lim = from.toISOString().slice(0, 10);
  const v = (hist[exId] || []).filter(h => !h.light && h.date >= lim).sort((a, b) => b.date.localeCompare(a.date)).slice(0, CFG.MOOD.baseN).map(h => h.vol);
  return v.length >= CFG.MOOD.minBase ? median(v) : null;
}
/* 반환 { verdict: 'low'|'normal'|'high'|'na', ratio, why, quiet } — quiet = 아쉬운 3회 연속이라 표정 대신 코치 한마디만 */
function judgeIntensity(items, { hist, today, light, comeback, lowRun = 0 }) {
  if (light) return { verdict: 'na', ratio: null, why: '«가볍게 한 날» 체크' };
  if (comeback) return { verdict: 'na', ratio: null, why: '복귀 첫 세션' };
  const rows = items.map(it => ({ it, vol: itemVolume(it) })).filter(x => x.vol > 0 && EX[x.it.ex].xpk !== 'lesson');
  if (!rows.length) return { verdict: 'na', ratio: null, why: '세트·시간 기록 없음' };
  let num = 0, den = 0, newXP = 0, allXP = 0;
  rows.forEach(({ it, vol }) => { const base = baselineOf(hist, it.ex, today), xp = itemBaseXP(it, vol); allXP += xp;
    if (base == null || base <= 0) { newXP += xp; return; }
    const usual = itemBaseXP(it, EX[it.ex].mode === 'cardio' ? base : vol); num += usual * (vol / base); den += usual; });
  if (!den || newXP / allXP > CFG.MOOD.newShare) return { verdict: 'na', ratio: null, why: '평소 기록 부족(종목별 5회 미만)' };
  const ratio = num / den, verdict = ratio < CFG.MOOD.low ? 'low' : ratio >= CFG.MOOD.high ? 'high' : 'normal';
  return { verdict, ratio, why: `평소 대비 ${Math.round(ratio * 100)}%`, quiet: verdict === 'low' && lowRun + 1 >= CFG.MOOD.quietAfter };
}
/* 지금 얼굴: 운동한 날 = 그날 판정(아쉬운·신남) · 그 밖 = 마지막 운동 후 0~3일 쌩쌩 · 4~6일 졸림 · 7일+ 시무룩 */
function exprFor({ demo, mood, lastDays }) {
  if (demo && demo !== 'auto') return demo;
  if (mood && !mood.quiet && mood.verdict === 'high') return 'excited';
  if (mood && !mood.quiet && mood.verdict === 'low') return 'meh';
  return lastDays >= 7 ? 'sad' : lastDays >= 4 ? 'sleepy' : 'happy';
}

/* ----- 부스터·물약 계산기 (상점·사용 확인 화면) — 위 capGain·potionGain 을 그대로 돌려 한 주를 흉내 낸다 -----
   { L: 현재 장부, sessions: 이번 주 남은 운동 횟수, per: 1회 운동 경험치(상한 전), booster: 'none'|'one'|'7d', potions } */
function forecastWeek({ L, sessions, per, booster = 'none', potions = 0 }) {
  const run = (bst, pots) => {
    const led = { ...L }; let total = 0, ex = 0, boost = 0, wasted = 0, pot = 0;
    for (let i = 0; i < sessions; i++) {
      const on = bst === '7d' || (bst === 'one' && i === 0);
      const g = capGain({ raw: per * (on ? CFG.BOOST.mul : 1), boostPart: on ? per * (CFG.BOOST.mul - 1) : 0 }, { ...led, dayUsed: 0, allV0Today: false }, false);
      total += g.gained; ex += g.exGained; boost += g.boostGained; wasted += g.cut;
      led.weekEx += g.exGained; led.weekItem += g.boostGained;
    }
    for (let i = 0; i < pots; i++) { const g = potionGain({ ...led, dayItem: 0 }); total += g.gained; pot += g.gained; wasted += g.cut; led.weekItem += g.gained; }
    return { total, ex, boost, pot, wasted };
  };
  const base = run('none', 0), w = run(booster, potions);
  return { base: base.total, with: w.total, extra: w.total - base.total, exWith: w.ex, wasted: w.wasted, boostEff: w.boost, potEff: w.pot,
    weekLeftNow: Math.max(0, CFG.WEEK_CAP - weekUsedOf(L)) };
}

/* ----- Lv.99 도달 기간 비교 — «운동만 했을 때 vs 아이템을 쓸 때» (결정 33 ③) -----
   한 주 = 운동 perWeek번(1번 per XP, 운동분은 하루·주 상한) + 매주 부스터(none|one|7d) + 물약 potionsWeek병.
   { level, xp } 에서 시작해 Lv.99까지 몇 주인지. 시연용 근사: 하루 1번 운동·연속 배율·PR·새 부위 보너스는 per 에 이미 들어 있다고 봄 */
function totalToLv99(level = 1, xp = 0) { let t = -xp; for (let n = level; n < 99; n++) t += need(n); return Math.max(0, t); }
function weeksToLv99({ level = 1, xp = 0, perWeek, per, booster = 'none', potionsWeek = 0 }) {
  const left = totalToLv99(level, xp), zero = { exWeek: 0, itemWeek: 0, ex: 0, boost: 0, pot: 0, wasted: 0 };
  const L0 = { dayUsed: 0, weekEx: 0, dayItem: 0, weekItem: 0, weekPaid: 0, allV0Today: false };
  const f = perWeek > 0 || potionsWeek > 0 ? forecastWeek({ L: L0, sessions: perWeek, per, booster, potions: potionsWeek }) : null;
  const wk = f ? f.with : 0, exWeek = f ? f.exWith : 0;
  return { left, weekXP: wk, exWeek, itemWeek: wk - exWeek, weeks: wk > 0 ? Math.ceil(left / wk) : Infinity, ...(f ? {} : zero) };
}
