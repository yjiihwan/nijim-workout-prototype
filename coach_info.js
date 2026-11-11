'use strict';
/* v1.24 코치 «내 정보»: 첫 대화로 성별·나이·키·몸무게 받기 · 내 정보 화면 · 그 정보로 계산(기준표는 coach_config.js)
   몸무게는 기존 S.bodyweight(무게 확인)와 같은 칸. 모르는 값은 null — 계산에 지어 넣지 않는다 */
const CC = COACH_CFG;
const ensureMe = () => { S.me = Object.assign({ sex: null, age: null, height: null, asked: false, ob: null }, S.me || {}); };
const me = () => { ensureMe(); return { sex: S.me.sex, age: S.me.age, height: S.me.height, w: S.bodyweight || null }; };
const SEX_LABEL = { m: '남', f: '여', n: '선택 안 함' };
const ageBand = age => age == null ? 'unknown' : (CC.AGE_BANDS.find(([a, b]) => age >= a && age < b) || [0, 0, 'f60'])[2];
const meSummary = (p = me()) => [p.sex ? SEX_LABEL[p.sex] : null, p.age ? `${p.age}살` : null, p.height ? `${+p.height.toFixed(1)}cm` : null, p.w ? kg(p.w) : null].filter(Boolean).join(' · ');
const kg2 = w => `${+w.toFixed(2)}kg`;   // 1.25kg 처럼 둘째 자리까지
const roundTo = (v, st, how = Math.round) => +(how(v / st + 1e-9) * st).toFixed(2);

/* ⑥ 처음 무게 범위 — 몸무게 없거나 기준표에 없는 운동이면 null(기존 «편한 무게로» 유지) */
function startRange(exId, p = me()) {
  const t = CC.BEGIN_1RM[exId], e = EX[exId]; if (!t || !e || !p.w) return null;
  const r1 = p.w * (p.sex === 'm' ? t.m : t.f) * CC.START_AGE_K[ageBand(p.age)], st = e.step || 2.5, mn = CC.MIN_W[exId] || st;
  let lo = Math.max(mn, roundTo(r1 * CC.START_PCT[0], st)), hi = Math.max(mn, roundTo(r1 * CC.START_PCT[1], st));
  if (hi < lo) hi = lo;
  return { lo, hi, bar: CC.BAR_IDS.includes(exId) && lo === mn && hi === mn };
}
const rangeTxt = r => r.lo === r.hi ? kg(r.lo) : `${+r.lo.toFixed(1)}~${kg(r.hi)}`;

/* ⑦ 올리는 폭 — 성별·몸무게 둘 다 모르면 null(기존 «10% 안쪽» 유지) */
function incOf(exId, p = me()) {
  if (!p.sex && !p.w) return null;
  const e = EX[exId], low = e && CC.LOWER_PARTS.includes(e.part);
  const big = p.sex === 'm' && p.w >= CC.INC_BIG.minW && (p.age == null || p.age < CC.INC_BIG.maxAge);
  return CC.INC[low ? 'lower' : 'upper'][big ? 'big' : 'small'];
}
const incPair = (p = me()) => { if (!p.sex && !p.w) return null; const big = p.sex === 'm' && p.w >= CC.INC_BIG.minW && (p.age == null || p.age < CC.INC_BIG.maxAge); return { up: CC.INC.upper[big ? 'big' : 'small'], low: CC.INC.lower[big ? 'big' : 'small'] }; };
/* 기구 최소 단위보다 작으면 «횟수 먼저» */
function nextStepLine(exId, lastW, p = me()) {
  const inc = incOf(exId, p), e = EX[exId], st = e.step || 2.5; if (inc == null) return null;
  if (inc < st) return `${jo(e.name, '은', '는')} ${kg(st)}씩 올라가니까, 지난번 ${kg(lastW)} 그대로 2회 더 한 다음 ${kg(lastW + st)}로 올리자.`;
  return `${e.name} 지난번 ${kg(lastW)}이면 다음엔 ${kg(lastW + roundTo(inc, st))}로 8회부터 해 보자.`;
}

/* ⑧ 몸무게 대비 — 최근 30일 최고 / 그 전 30일 최고. 성장 방향으로만 말한다 */
function bwRatioLine(rs, exId, p = me()) {
  if (!p.w || !CC.BEGIN_1RM[exId]) return null;
  const top = (from, to) => Math.max(0, ...inRange(rs, from, to).flatMap(r => (r.items || []).filter(it => it.ex === exId).flatMap(it => doneSets(it).map(x => x.w || 0))));
  const now = top(addD(TODAY, -29), TODAY), prev = top(addD(TODAY, -59), addD(TODAY, -30)); if (!now) return null;
  const f = v => `${+(v / p.w).toFixed(2)}배`, nm = EX[exId].name;
  if (prev && now > prev) return `몸무게 대비 ${nm} ${f(now)} — 지난달 ${f(prev)}에서 늘었어!`;
  if (prev && now === prev) return `몸무게 대비 ${nm} ${f(now)} — 지난달 수준 잘 지키고 있어.`;
  return `지금 ${nm}는 몸무게 대비 ${f(now)}야. 이 숫자 같이 키워 보자!`;
}

/* ⑨ 같은 부위 쉬는 시간 — 나이 모르면 null */
const restHours = (p = me()) => p.age == null ? null : CC.REST_H[ageBand(p.age)];
const needWarmup = (p = me()) => p.age != null && p.age >= CC.WARMUP_FROM;
const WARMUP_LINE = '시작 전에 가벼운 무게로 워밍업 1~2세트(12~15회) 꼭 하고 가자.';

/* ⑩ 유산소 kcal 대략치 — 몸무게 없으면 null */
function kcalOf(it, p = me()) {
  if (!p.w || !it.min) return null;
  let met = CC.MET[it.ex]; if (met == null) return null;
  if (it.km && ['treadmill', 'run'].includes(it.ex)) { const kmh = it.km / (it.min / 60); met = [...CC.MET_BY_KMH].reverse().find(([v]) => kmh >= v)[1]; }
  else met *= CC.MET_K[it.level || 'normal'] || 1;
  return Math.round(met * p.w * it.min / 60 / 10) * 10;
}

/* ③ «알려 주면 더 정확히» 안내 — 항목마다 대화 1번만(대화 지우기 전까지) */
const HINT = { w: '몸무게 알려 주면 더 정확히 말해 줄게 · 위 «내 정보»', age: '나이 알려 주면 쉬는 시간을 더 정확히 말해 줄게 · 위 «내 정보»', sex: '성별 알려 주면 처음 무게를 더 정확히 잡아 줄게 · 위 «내 정보»' };
function hintOnce(key) { const c = S.coach; c.hinted = c.hinted || {}; if (c.hinted[key]) return null; c.hinted[key] = 1; return HINT[key]; }

/* ===== 첫 대화(coachAgree 바로 뒤) ===== */
const OB_Q = [
  { k: 'sex', q: ['먼저 성별은? 처음 무게 잡을 때 써.'] },
  { k: 'age', q: ['나이는 몇 살이야? 쉬는 시간이랑 워밍업 정할 때 써.'], unit: '살', ph: '예: 32', mode: 'numeric' },
  { k: 'height', q: ['키는 몇 cm야? 소수점도 괜찮아.'], unit: 'cm', ph: '예: 168.5', mode: 'decimal' },
  { k: 'weight', q: ['마지막으로 몸무게는 몇 kg이야? 소수점도 돼.', '처음 무게·올리는 폭·유산소 칼로리 계산에 써.'], unit: 'kg', ph: '예: 62.5', mode: 'decimal' },
];
const LATER = '나중에 바꿀 수 있어';
function obStart() {
  ensureMe();
  S.me.ob = { step: 0, log: [
    { who: 'bot', lines: ['시작하기 전에 4가지만 물어볼게!', '성별·나이·키·몸무게를 알아야 너한테 맞는 무게랑 운동량을 정확히 짜 줄 수 있어.'] },
    { who: 'bot', lines: ['말하기 싫은 건 «나중에 할게»를 눌러도 코칭은 그대로 돼. 다른 회원에겐 안 보여.'] },
    { who: 'bot', lines: OB_Q[0].q, small: LATER },
  ] };
}
/* 값 검사 — 맞으면 {v}, 아니면 캐릭터 말 */
function checkVal(k, raw) {
  const t = String(raw).trim().replace(/\s/g, '').replace(',', '.').replace(/(kg|cm|살|세)$/i, '');
  const [lo, hi] = CC.RANGE[k], nm = { age: '나이', height: '키', weight: '몸무게' }[k], u = { age: '살', height: 'cm', weight: 'kg' }[k];
  if (!t) return { msg: `${nm}를 적어 줄래? 아니면 «나중에 할게»를 눌러도 돼.` };
  if (k === 'age' ? !/^\d{1,3}$/.test(t) : !/^\d{1,3}(\.\d)?$/.test(t)) return { msg: k === 'age' ? '나이는 숫자로만 적어 줄래? (예: 32)' : `숫자로 적어 줄래? 소수점은 한 자리까지 돼 (예: ${k === 'height' ? '168.5' : '62.5'})` };
  const v = +t;
  if (v < lo || v > hi) return { msg: `음, ${nm} ${v}${u}는 조금 이상한데? 🙂 한 번만 다시 알려 줄래? (${lo}~${hi}${u})` };
  return { v };
}
const setVal = (k, v) => { ensureMe(); if (k === 'weight') S.bodyweight = v; else S.me[k] = v; };
function obAnswer(val, skip) {
  ensureMe(); const ob = S.me.ob; if (!ob) return;
  const Q = OB_Q[ob.step];
  if (skip) ob.log.push({ who: 'me', text: '나중에 할게' });
  else if (Q.k === 'sex') { setVal('sex', val); ob.log.push({ who: 'me', text: { m: '남자', f: '여자', n: '선택 안 할래' }[val] }); }
  else {
    ob.log.push({ who: 'me', text: String(val).trim() || '(빈칸)' });
    const r = checkVal(Q.k, val); if (r.msg) { ob.log.push({ who: 'bot', lines: [r.msg] }); return; }
    setVal(Q.k, r.v); ob.log[ob.log.length - 1].text = `${+r.v.toFixed(1)}${Q.unit}`;
  }
  ob.step++;
  if (ob.step < OB_Q.length) { ob.log.push({ who: 'bot', lines: OB_Q[ob.step].q, small: LATER }); return; }
  const sum = meSummary();
  S.coach.msgs.push({ who: 'bot', kind: 'info', lines: sum ? ['고마워! 이제 이 정보로 맞춰서 말해 줄게 💪', `${sum} · 위 «내 정보»에서 언제든 바꿀 수 있어.`] : ['알겠어! 지금은 기록만 보고 도와줄게.', '알려 주고 싶어지면 위 «내 정보»에서 적어 줘.'] });
  S.me.asked = true; S.me.ob = null;
}
function coachObHTML(head, t) {
  const ob = S.me.ob, Q = OB_Q[ob.step], bot = m => `<div class="msg bot"><div class="cbox">${charFit(t, S.level, 30)}</div><div><div class="bub">${m.lines.map(esc).join('<br>')}${m.small ? `<small class="later">${esc(m.small)}</small>` : ''}</div></div></div>`;
  const log = ob.log.map(m => m.who === 'me' ? `<div class="msg me"><div class="bub">${esc(m.text)}</div></div>` : bot(m)).join('');
  const dock = Q.k === 'sex'
    ? `<div class="obbtns">${[['m', '남자'], ['f', '여자'], ['n', '선택 안 할래']].map(([v, l]) => `<button class="chip" data-act="obSex" data-v="${v}">${l}</button>`).join('')}</div>`
    : `<div class="cin obin"><label class="obfield"><input id="obIn" type="text" inputmode="${Q.mode}" enterkeyhint="done" autocomplete="off" maxlength="6" placeholder="${Q.ph}" aria-label="${Q.k}"><i>${Q.unit}</i></label><button class="btn sm" data-act="obOk" id="obOk">확인</button></div>`;
  return `${subHead('코치에게 물어보기')}<div class="sec">${head}
  <div class="chat" id="obChat">${log}</div>
  <div class="obdock" id="obDock"><div class="obprog2">${ob.step + 1}/${OB_Q.length}</div>${dock}<button class="btn ghost sm oblater" data-act="obSkip" id="obSkip">나중에 할게</button></div></div>`;
}

/* ===== ⑤ 내 정보 화면 ===== */
function vMyInfo() {
  const p = me(), field = (k, label, v, unit, mode, ph) => `<div class="row mirow" id="mi_${k}"><span>${label}</span><div class="mival"><label class="obfield"><input class="pin" data-k="${k}" type="text" inputmode="${mode}" enterkeyhint="done" autocomplete="off" maxlength="6" placeholder="${ph}" value="${v == null ? '' : +(+v).toFixed(1)}" aria-label="${label}"><i>${unit}</i></label>${v == null ? '' : `<button class="mix" data-act="meClear" data-v="${k}" aria-label="${label} 지우기">×</button>`}</div></div>`;
  return `${subHead('내 정보', S.infoFrom || 'settings', S.infoFrom === 'coach' ? '코치' : '설정')}<div class="sec">
  <div class="card" id="miCard"><div class="h2" style="font-size:16px;margin-top:0">코치가 쓰는 내 정보</div>
  <div class="muted" style="margin-bottom:6px">처음 무게·올리는 폭·쉬는 시간·유산소 칼로리 계산에만 써요 · 다른 회원에겐 안 보여요 · 비워 두면 그 항목은 계산하지 않아요</div>
  <div class="row mirow" id="mi_sex"><span>성별</span><div class="chips">${[['m', '남'], ['f', '여'], ['n', '선택 안 함']].map(([v, l]) => `<button class="chip ${p.sex === v ? 'on' : ''}" data-act="meSex" data-v="${v}">${l}</button>`).join('')}</div></div>
  ${field('age', '나이', p.age, '살', 'numeric', '비어 있음')}${field('height', '키', p.height, 'cm', 'decimal', '비어 있음')}${field('weight', '몸무게', p.w, 'kg', 'decimal', '비어 있음')}
  <div class="muted" style="margin-top:8px">몸무게는 너무 무거운 숫자 확인(«정말 맞아요?»)에도 써요 · 비우면 70kg 기준</div></div>
  <button class="btn ghost" data-act="coach" id="miToCoach">코치에게 물어보기</button></div>`;
}
SUB.myinfo = vMyInfo;

/* 설정: 기존 «체중» 칸 → «내 정보» 카드로 옮김 */
const vSettingsCoach = SUB.settings;
SUB.settings = () => vSettingsCoach()
  .replace(/<div class="row"><div><span>체중 <span class="muted">\(선택\)<\/span><\/span>.*?<\/button><\/div><\/div>/, '')
  .replace('<div class="card" id="ticketCard">', `<button class="card replink tap" data-act="myinfo" data-v="settings" id="myInfoCard"><div><b>내 정보</b><small>${esc(meSummary() || '아직 안 적었어요 · 코치가 무게를 정확히 짜는 데 써요')}</small></div><span class="muted">›</span></button><div class="card" id="ticketCard">`);

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.closest('#evo') || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  const H = {
    obSex: () => obAnswer(v),
    obOk: () => { const el = $('obIn'); obAnswer(el ? el.value : ''); },
    obSkip: () => obAnswer(null, true),
    myinfo: () => { S.infoFrom = v || S.sub; return go('workout', 'myinfo'); },
    meSex: () => { ensureMe(); S.me.sex = S.me.sex === v ? null : v; toast('저장했어요 · 코치 답변에 바로 반영돼요'); },
    meClear: () => { setVal(v, null); toast('지웠어요 · 이 항목은 계산에서 빼요'); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); ensureMe();
  if (H[a]() !== undefined) return;
  save(); render();
  if (a.startsWith('ob')) { const ch = $('obDock'); if (ch) ch.scrollIntoView({ block: 'end' }); const i = $('obIn'); if (i && a !== 'obSkip' && S.me.ob) i.focus({ preventScroll: true }); }
}, true);
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'obIn') { e.preventDefault(); $('obOk').click(); }
  if (e.target.classList && e.target.classList.contains('pin')) { e.preventDefault(); e.target.blur(); }
});
/* 내 정보 숫자 칸: 확정(change)에 검사·저장. 틀리면 이전 값으로 돌리고 안내 */
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('pin')) setTimeout(() => e.target.select(), 0); });
document.addEventListener('change', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('pin')) return;
  const k = el.dataset.k;
  if (!el.value.trim()) { setVal(k, null); toast('지웠어요 · 이 항목은 계산에서 빼요'); }
  else { const r = checkVal(k, el.value); if (r.msg) toast(r.msg.replace(/ ?🙂/, '').replace('줄래?', '주세요')); else { setVal(k, r.v); toast('저장했어요 · 코치 답변에 바로 반영돼요'); } }
  save();
  const redraw = () => { if (!document.activeElement || !document.activeElement.classList.contains('pin')) render(); };
  if (typeof ptrDown !== 'undefined' && ptrDown) setTimeout(redraw, 160); else redraw();
});

ensureMe();
if (S.tab === 'workout' && ['myinfo', 'coach', 'settings'].includes(S.sub)) render();
