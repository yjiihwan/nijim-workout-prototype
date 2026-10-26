'use strict';
/* ===== 경험치·레벨·표정·포인트 계산 엔진 — 계산은 이 파일 한 곳에서만 =====
   화면(app.js)은 여기 함수를 부르고 결과만 그린다. DOM·저장소 접근 없음(순수 함수) → 4단계 인계 꾸러미의 기준 코드.
   실서비스: 서버 함수로 옮겨 같은 입력이면 같은 출력이 나와야 한다(PLAN §2-3·§2-5·§2-10·§2-11 · VERIFICATION §1·§4).
   의존: exercises.js 의 EX(운동 사전). */
const CFG = {
  DAY_CAP: 600, DAY_CAP_V0: 200,          // 하루 상한(그날 기록이 전부 V0면 200)
  WEEK_CAP: 1800,                          // 결정 32
  XP: { weight: 10, body: 8, cardio: 2, lesson: 150, firstSet: 20, complete: 50, newPart: 15, pr: 30, weekGoal: 200 },
  LIM: { weightSets: 30, bodySets: 30, cardioMin: 60, newPartsWeek: 6, prDay: 3, exPerSession: 25, cardioMaxMin: 180 },
  VERIFY: { V0: 0.4, V1: 0.8, V1b: 0.7, V2: 1.0, V3: 2.0 },
  STREAK: [1.0, 1.0, 1.05, 1.10, 1.20, 1.20, 1.30],   // 연속 주 0~6+ (6주 이상 1.30)
  COMEBACK_DAYS: 7, COMEBACK_MUL: 1.5,                // 7일+ 쉬고 첫 세션 — 연속 배율 대신
  MOOD: { low: 0.6, high: 1.3, baseN: 10, baseDays: 56, minBase: 5, newShare: 0.5, quietAfter: 3 },
  CARDIO_K: { light: 0.8, normal: 1.0, hard: 1.2 },
  POINT: { monthCap: 1000, v0Rate: 0.5 },
  BOOST: { mul: 2 },
  POTION: { xp: 300, paidDayCap: 600, paidWeekCapB: 900 },
  /* ⚠ 잠정 A안(PLAN §8 ①② — 형 답 전): 부스터로 늘어난 경험치·물약 경험치 모두 주 1,800 한도 안.
     값만 바꾸면 전 화면·계산기가 따라간다. booster: A 주 한도 안 / B 주 한도 밖(하루 600만) / C 부스터 쓴 주만 주 한도 +600
     potion: A 주 1,800에 합산 / B 유료만 주 900 별도 / C 유료 하루 600만 */
  POLICY: { booster: 'A', potion: 'A' },
  BOOSTER_C_EXTRA: 600,
  SET_GAP_SEC: 20, SET_GAP_RUN: 3,         // 같은 운동 세트 완료 간격 20초 미만 3회 연속 → 경험치 보류
  UNREAL_PR_MUL: 1.5, SAFETY_JUMP: 0.2, BODYWEIGHT_DEFAULT: 70,
  REST_SEC: 90, AUTO_END_MIN: 180,
};
const VERIFY_LABEL = { V0: '자가 기록', V1: '센터 확인 ✓', V1b: '센터 확인 ✓', V2: '오운완 📸', V3: '선생님 확인 ★ 2배' };

/* ----- 레벨 곡선·포인트 ----- */
const need = n => Math.round(200 + 12 * n + 0.3 * n * n);
const lvPoint = L => L <= 9 ? 50 : L <= 29 ? 100 : L <= 49 ? 200 : L <= 69 ? 300 : L <= 89 ? 500 : 1000;
const evoBonus = L => ({ 10: 300, 20: 300, 30: 500, 40: 500, 50: 500, 60: 500, 70: 1000, 80: 1000, 90: 1000, 99: 3000 })[L] || 0;
const streakMul = w => CFG.STREAK[Math.min(CFG.STREAK.length - 1, Math.max(0, w))];

/* 경험치 반영 → 레벨·포인트. 음수(기록 수정으로 줄어듦)면 레벨은 그대로, 이번 레벨 안에서만 줄어든다(0 아래로 안 감)
   포인트: 레벨업 1회 lvPoint + 10단위 진화 보너스 · 유료(물약)로 오른 레벨 0 · V0만으로 오른 레벨 50% · 월 상한 1,000P */
function applyXP({ level, xp }, gained, { paid = false, v0 = false, monthUsed = 0 } = {}) {
  if (gained < 0) return { from: level, level, xp: Math.max(0, xp + gained), points: 0, pointsCut: 0, raw: 0 };
  let lv = level, x = xp + gained, pts = 0;
  while (lv < 99 && x >= need(lv)) {
    x -= need(lv); lv++;
    const p = lvPoint(lv) + evoBonus(lv);
    pts += paid ? 0 : v0 ? Math.round(p * CFG.POINT.v0Rate) : p;
  }
  if (lv >= 99) x = 0;
  const grant = Math.max(0, Math.min(pts, CFG.POINT.monthCap - monthUsed));
  return { from: level, level: lv, xp: x, points: grant, pointsCut: pts - grant, raw: pts };
}

/* ----- 장부(이번 주·오늘 이미 받은 경험치) — records: { date, xp, xpBoost, paid, v } ----- */
function ledgerOf(records, today, weekDays) {
  const wk = records.filter(r => weekDays.includes(r.date) && !r.demo), td = wk.filter(r => r.date === today);
  const sum = (a, f) => a.reduce((s, r) => s + (f(r) || 0), 0);
  const exW = wk.filter(r => !r.paid), exD = td.filter(r => !r.paid);
  return {
    dayUsed: sum(exD, r => r.xp), dayPaid: sum(td.filter(r => r.paid), r => r.xp),
    weekEx: sum(exW, r => r.xp), weekBoost: sum(exW, r => r.xpBoost), weekPaid: sum(wk.filter(r => r.paid), r => r.xp),
    boostWeek: exW.some(r => r.boosted), allV0Today: exD.every(r => r.v === 'self'),
  };
}
const weekCapOf = (L, boostNow) => CFG.WEEK_CAP + (CFG.POLICY.booster === 'C' && (L.boostWeek || boostNow) ? CFG.BOOSTER_C_EXTRA : 0);
/* 운동 경험치가 주 한도 계산에서 차지하는 양 — 정책에 따라 부스터분·물약분을 넣고 뺀다 */
const weekUsedOf = L => L.weekEx - (CFG.POLICY.booster === 'B' ? L.weekBoost : 0) + (CFG.POLICY.potion === 'A' ? L.weekPaid : 0);

/* 하루·주 상한 적용 — 더 적게 남은 쪽까지만. 반환 { gained, boostGained, cut, reason: 'day'|'week'|null } */
function capGain(r, L, isV0) {
  const dayCap = (L.allV0Today && isV0) ? CFG.DAY_CAP_V0 : CFG.DAY_CAP, boostNow = r.boostPart > 0;
  const dayLeft = Math.max(0, dayCap - L.dayUsed), weekLeft = Math.max(0, weekCapOf(L, boostNow) - weekUsedOf(L));
  let gained, boostGained = 0;
  if (CFG.POLICY.booster === 'B') {   // 부스터분은 주 한도 밖(하루 한도 안)
    const a = Math.min(r.raw - r.boostPart, dayLeft, weekLeft); boostGained = Math.min(r.boostPart, dayLeft - a); gained = a + boostGained;
  } else { gained = Math.min(r.raw, dayLeft, weekLeft); boostGained = Math.max(0, Math.min(r.boostPart, gained - (r.raw - r.boostPart))); }
  const cut = r.raw - gained;
  return { gained, boostGained, cut, reason: cut > 0 ? (weekLeft <= dayLeft ? 'week' : 'day') : null, dayLeft, weekLeft };
}
/* 물약 1병 — 유료 경험치(💰). 정책 A면 주 1,800에 합산 */
function potionGain(L) {
  const P = CFG.POLICY.potion, dayLeft = CFG.POTION.paidDayCap - L.dayPaid;
  const wk = P === 'A' ? weekCapOf(L, false) - weekUsedOf(L) : P === 'B' ? CFG.POTION.paidWeekCapB - L.weekPaid : Infinity;
  const gained = Math.max(0, Math.min(CFG.POTION.xp, dayLeft, wk));
  return { gained, cut: CFG.POTION.xp - gained, reason: gained >= CFG.POTION.xp ? null : wk <= dayLeft ? 'week' : 'day' };
}

/* ----- 세션 경험치 (PLAN §2-3) -----
   세션 XP = (Σ 운동별 기본 + 첫 세트 20 + 완료 50) × 검증 × 연속(복귀면 ×1.5) [× 부스터 2] + 고정(새 부위·PR·주간 목표)
   s = { verify:'V0'|'V1'|'V1b'|'V3', selfie, items:[{ ex, sets:[{w,r,s,done,pr}], min }], prCount }
   c = { firstToday, weekParts[], streakWeeks, lastDays, prToday, goal, weekCountBefore, todayCounted, boost } */
const effVerify = s => s.selfie && (s.verify === 'V1' || s.verify === 'V1b') ? 'V2' : s.verify;   // 셀카는 센터 확인이 있을 때만 100%
function sessionXP(s, c) {
  let w = 0, b = 0, m = 0, l = 0;
  s.items.slice(0, CFG.LIM.exPerSession).forEach(it => {
    const e = EX[it.ex]; if (!e) return;
    if (e.xpk === 'cardio') m += Math.min(CFG.LIM.cardioMaxMin, it.min || 0);
    else if (e.xpk === 'lesson') l++;
    else { const n = (it.sets || []).filter(x => x.done).length; if (e.xpk === 'weight') w += n; else b += n; }
  });
  w = Math.min(w, CFG.LIM.weightSets); b = Math.min(b, CFG.LIM.bodySets); m = Math.min(m, CFG.LIM.cardioMin);
  const X = CFG.XP, any = w + b + m + l > 0;
  const lines = [['웨이트·머신', w, '세트', w * X.weight], ['맨몸', b, '세트', b * X.body], ['유산소', m, '분', m * X.cardio], ['레슨', l, '회', l * X.lesson]].filter(x => x[1] > 0);
  const base = w * X.weight + b * X.body + m * X.cardio + l * X.lesson;
  const first = c.firstToday && any ? X.firstSet : 0, complete = c.firstToday && any ? X.complete : 0;
  const v = effVerify(s), vm = CFG.VERIFY[v];
  const comeback = c.lastDays >= CFG.COMEBACK_DAYS, sm = comeback ? CFG.COMEBACK_MUL : streakMul(c.streakWeeks);
  const mult = Math.round((base + first + complete) * vm * sm), boostPart = c.boost && any ? mult * (CFG.BOOST.mul - 1) : 0;
  const worked = it => (it.sets || []).some(x => x.done) || it.min > 0 || (EX[it.ex] && EX[it.ex].xpk === 'lesson');
  const parts = [...new Set(s.items.filter(worked).map(it => EX[it.ex] && EX[it.ex].part).filter(Boolean))];
  const fresh = parts.filter(p => !c.weekParts.includes(p));
  const newN = Math.min(fresh.length, Math.max(0, CFG.LIM.newPartsWeek - c.weekParts.length));
  const prN = Math.min(s.prCount || 0, Math.max(0, CFG.LIM.prDay - (c.prToday || 0)));
  const goal = any && !c.todayCounted && c.weekCountBefore + 1 === c.goal ? X.weekGoal : 0;
  const fixed = newN * X.newPart + prN * X.pr + goal;
  return { lines, base, first, complete, v, vm, sm, comeback, mult, boostPart, newParts: fresh.slice(0, newN), newXP: newN * X.newPart,
    prN, prXP: prN * X.pr, goal, fixed, raw: mult + boostPart + fixed, any };
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
   { L: 현재 장부, sessions: 이번 주 남은 운동 횟수, per: 1회 경험치(상한 전), booster: 'none'|'one'|'7d', potions } */
function forecastWeek({ L, sessions, per, booster = 'none', potions = 0 }) {
  const run = (bst, pots) => {
    const led = { ...L }; let total = 0, boost = 0, wasted = 0, pot = 0;
    for (let i = 0; i < sessions; i++) {
      const on = bst === '7d' || (bst === 'one' && i === 0), raw = per * (on ? CFG.BOOST.mul : 1);
      const g = capGain({ raw, boostPart: on ? raw - per : 0 }, { ...led, dayUsed: 0, allV0Today: false }, false);
      total += g.gained; boost += g.boostGained; wasted += g.cut;
      led.weekEx += g.gained; led.weekBoost += g.boostGained; if (on) led.boostWeek = true;
    }
    for (let i = 0; i < pots; i++) { const g = potionGain({ ...led, dayPaid: 0 }); total += g.gained; pot += g.gained; wasted += g.cut; led.weekPaid += g.gained; }
    return { total, boost, pot, wasted };
  };
  const base = run('none', 0), withIt = run(booster, potions);
  return { base: base.total, with: withIt.total, extra: withIt.total - base.total, wasted: withIt.wasted - base.wasted, boostEff: withIt.boost, potEff: withIt.pot,
    weekLeftNow: Math.max(0, weekCapOf(L, booster !== 'none') - weekUsedOf(L)) };
}
