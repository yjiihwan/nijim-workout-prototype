'use strict';
/* v1.12 — v1.11(C안 1/4 고객 앱 기록 흐름 전부) + 결정 33: 아이템 경험치는 한도 없음(운동 경험치만 하루 600·주 1,800).
   경험치·레벨·표정·랭킹 계산은 engine.js 한 곳(CFG·sessionXP·capGain·applyXP·judgeIntensity·exprFor·forecastWeek). 이 파일은 화면만 */
const KEY = 'nijim_workout_proto_v111';
const VER = 'v1.44';
/* 확정 12종(결정 22~25) — design v13 정본 · 레벨 띠 11컷 · 표정 5종. 12종 모두 처음부터 선택 가능(결정 25) */
const CH = {
  mungchi:   { name: '뭉치', josa: '가', intro: '느긋하고 솔직한 땀방울 슬라임' },
  dot:       { name: '도트', josa: '가', intro: '꼼꼼한 기록광 픽셀 정령' },
  shadow:    { name: '섀도', josa: '가', intro: '말 없이 따라오는 노력의 그림자' },
  rilla:     { name: '릴라', josa: '가', intro: '말수 적은 쿨한 아기 고릴라' },
  ttukbi:    { name: '뚝비', josa: '가', intro: '호탕한 동네 코치 도깨비' },
  youngcha:  { name: '영차', josa: '가', intro: '쉬지 않는 성실한 일꾼 개미' },
  saetbyeol: { name: '샛별', josa: '이', intro: '새벽마다 응원하는 다정한 별' },
  imu:       { name: '이무', josa: '가', intro: '과묵하게 수련하는 이무기' },
  koa:       { name: '코아', josa: '가', intro: '느릿하지만 끝까지 가는 코알라' },
  ppiyak:    { name: '삐약', josa: '이', intro: '열정 과다 신입 오리' },
  capy:      { name: '카피', josa: '가', intro: '무던하고 평온한 카피바라' },
  bamtol:    { name: '밤톨', josa: '이', intro: '새침하지만 출석 1등 시바' },
};
const STAGE_KEYS = ['01','10','20','30','40','50','60','70','80','90'];
const cutOf = lv => lv >= 99 ? '99' : STAGE_KEYS[Math.min(9, Math.floor(lv / 10))];
const stageIdx = lv => lv >= 99 ? 10 : Math.min(9, Math.floor(lv / 10));
const stageName = (t, lv) => levelTitle(lv) || (lv >= 99 ? '완성' : `${stageIdx(lv) + 1}단계`);
const tierOf = lv => lv >= 99 ? 6 : lv >= 80 ? 5 : lv >= 60 ? 4 : lv >= 40 ? 3 : lv >= 20 ? 2 : 1;
const ro = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; if (c < 0 || c > 11171) return '로'; const j = c % 28; return j === 0 || j === 8 ? '로' : '으로'; };
const wa = t => CH[t].josa === '가' ? '와' : '과';
const TIER_NAME = ['', '기본', '하늘 링', '하늘 링+입자', '로즈 링', '로즈 2중 링', '골드 아우라'];
const isBigBoundary = lv => lv % 10 === 0 || lv === 99;

/* 효과형은 «사용»(소모) · 외형형은 «장착». 가격·상한 PLAN §2-10 */
const ITEMS = [
  { id:'boost1', img:'headband_gold', kind:'effect', use:1, name:'2배 부스터 · 운동 1번', desc:'다음 운동 1번 2배 · 한도 없음', price:300 },
  { id:'boost7', img:'shaker', kind:'effect', use:1, name:'2배 부스터 · 7일', desc:'7일 동안 운동 2배 · 한도 없음', price:1500 },
  { id:'potion', img:null, kind:'effect', use:1, name:'경험치 물약 +300', desc:'운동 없이 +300 · 한도 없음 · 💰', price:1000 },
  { id:'charm', img:'charm', kind:'effect', use:1, name:'연속 보호권', desc:'운동 못 간 주 1회 보호', price:500 },
  { id:'crown', img:'crown', kind:'effect', name:'리그 왕관', desc:'리그 표시 꾸미기 · 7일', price:800 },
  { id:'cap', img:'cap', kind:'look', name:'스포츠 캡', desc:'효과 없음', price:200 },
  { id:'sunglasses', img:'sunglasses', kind:'look', name:'선글라스', desc:'효과 없음', price:300 },
  { id:'towel', img:'towel', kind:'look', name:'스카이 타월', desc:'효과 없음', price:200 },
  { id:'wristband', img:'wristband', kind:'look', name:'손목밴드', desc:'효과 없음', price:100 },
];
patchItems();   // 본사(H2) 가격·판매 여부 — config_store.js
const FRIENDS = [
  { n:'운동하는곰', t:'koa', lv:27, week:2140, paid:0 },
  { n:'새벽러너', t:'saetbyeol', lv:41, week:980, paid:0 },
  { n:'벤치왕', t:'ttukbi', lv:33, week:1650, paid:2, pure:24 },
  { n:'필라테스러', t:'mungchi', lv:12, week:610, paid:0 },
  { n:'헬린이9일차', t:'bamtol', lv:4, week:420, paid:0 },
];
/* 장소(C3b) — 센터 탐색 지도의 장소 데이터 자리. linked = 니짐 입장 연동 센터 */
const PLACES = [
  { id:'sillim', name:'니짐 신림점', kind:'center', linked:true, dist:'0.2km' },
  { id:'bongcheon', name:'니짐 봉천점', kind:'center', linked:true, dist:'1.8km' },
  { id:'snu', name:'니짐 서울대입구점', kind:'center', linked:true, dist:'2.6km' },
  { id:'green', name:'그린피트니스 신림역점', kind:'center', linked:false, dist:'0.4km' },
  { id:'river', name:'리버짐 봉천점', kind:'center', linked:false, dist:'1.5km' },
  { id:'yoga', name:'소담 요가·필라테스', kind:'center', linked:false, dist:'0.9km' },
];
/* «이 센터에서 많이 하는 운동» — 실서비스는 center_exercise_stats(회원 기록 자동 집계) */
const CENTER_POP = { '니짐 신림점': ['leg_press','lat_pulldown','treadmill','smith_squat','hip_thrust','chest_press'] };
/* 말풍선 문구(PLAN §2-5 · §4-2 톤) — 템플릿 회전 */
const MOOD = {
  low:    { label:'아쉬운', lines:['오늘은 좀 아쉬웠지? 괜찮아, 나온 게 반이야. 다음엔 1세트만 더 같이 해보자','몸이 무거운 날이었나 봐. 그래도 왔잖아! 다음엔 같이 10분만 더 해보자','오늘은 살짝 아쉬웠어. 그래도 기록은 1칸 늘었어. 내일 컨디션 보고 다시 가자'] },
  normal: { label:'평소대로', lines:['오늘도 평소만큼 꾸준히! 이런 날이 쌓여 한 달이 돼'] },
  high:   { label:'신남', lines:['오늘 평소보다 훨씬 많이 했어! 나까지 땀 나 💧 내일은 꼭 쉬어줘','와, 지난주의 너를 넘었어! 1단계 더 단단해진 기분이야'] },
};
const QUIET_LINE = '요즘 컨디션 어때? 쉬어가도 괜찮아';
const VERIFY = [['auto','입점센터 입장 · 자동'],['lesson','레슨 확정(2배)'],['self','자가 기록']];
/* 결정 37·SPEC 단위 32: 등급은 V0·V1·V3 셋. 옛 저장본의 gps(V1b)·selfie(V2)는 둘 다 자가 기록(V0)으로 읽는다. 셀카는 등급이 아니라 따로(rec.selfieXP) */
const vk = k => k === 'gps' || k === 'selfie' ? 'self' : k;
const V2K = { V1:'auto', V3:'lesson', V0:'self' }, K2V = { auto:'V1', lesson:'V3', self:'V0', gps:'V0', selfie:'V0' };
const vLabel = k => VERIFY.find(v => v[0] === vk(k))[1].replace(' · 자동', '');
const SELFIE_SHOT = { src: 'camera' };   // 앱 카메라·앨범 모두 같은 셀카로 친다(11-10 형: 촬영 제한·사진 판정 없음)
const selfieClaims = (exceptId = null) => realRecs().filter(r => r.date === TODAY && r.id !== exceptId && r.selfieXP > 0).length;   // 그날 셀카 보너스 받은 기록 수(하루 1회)

/* 날짜 유틸 (시연 기록은 «오늘» 기준 상대 날짜) */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
let TODAY = ymd(new Date());
/* v1.40(QA 치5): «오늘»을 화면을 연 순간에 고정하지 않는다 — 그릴 때·저장할 때마다 다시 구한다.
   자정을 넘긴 운동은 «시작한 날» 기록으로 저장(sessDay) — 그날 기준으로 보너스·한도를 계산하려고 onDay 로 잠깐 날짜를 맞춘다 */
function syncToday() { const t = ymd(new Date()); if (t === TODAY) return false; TODAY = t; return true; }
const sessDay = s => ymd(new Date(s.startedAt));
function onDay(day, fn) { const keep = TODAY; TODAY = day; try { return fn(); } finally { TODAY = keep; } }
const NJ_SHARE_ICON_SVG = () => `<svg class="shico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${window.NJ_SHARE_ICON || ''}</svg>`;
const DOW = ['일','월','화','수','목','금','토'];
const md = s => `${+s.slice(5, 7)}/${+s.slice(8)}(${DOW[new Date(s).getDay()]})`;
const SR = (ex, ...sets) => ({ ex, sets: sets.map(([w, r]) => ({ w, r, done: true })) });
const SC = (ex, min, level = 'normal', km) => ({ ex, min, level, km });
const seedRecords = () => [
  { id: 1, date: daysAgo(2), place: '니짐 신림점', placeKind: 'center', summary: '벤치프레스 3세트 · 랫풀다운 3세트', xp: 180, v: 'auto', items: [SR('bench', [60, 10], [60, 10], [60, 8]), SR('lat_pulldown', [45, 12], [45, 12], [45, 10])] },
  { id: 2, date: daysAgo(4), place: '집', placeKind: 'home', summary: '홈트 20분', xp: 48, v: 'self', items: [SR('pushup', [0, 15], [0, 15], [0, 12]), SR('air_squat', [0, 20], [0, 20])] },
  { id: 3, date: daysAgo(6), place: '니짐 신림점 · PT', placeKind: 'center', summary: '하체 수업 50분', xp: 400, v: 'lesson', items: [{ ex: 'lesson_pt', min: 50 }] },
  { id: 4, date: daysAgo(9), place: '니짐 신림점', placeKind: 'center', summary: '러닝머신 25분', xp: 150, v: 'auto', items: [SC('treadmill', 25, 'normal', 3.4)] },
  { id: 5, date: daysAgo(12), place: '니짐 신림점', placeKind: 'center', summary: '벤치프레스 4세트 · 러닝 15분', xp: 210, v: 'auto', items: [SR('bench', [57.5, 10], [57.5, 10], [57.5, 9], [57.5, 8]), SC('treadmill', 15)] },
];
/* «내 평소» 기준용 지난 기록(2~8주 전) — 종목별 5회 이상이라 표정 판정이 돈다 */
const seedHist = () => {
  const H = {}, add = (ex, n0, mk) => { H[ex] = Array.from({ length: 8 }, (_, i) => ({ date: daysAgo(14 + i * 5 + n0), ...mk(i) })); };
  add('bench', 0, i => ({ sets: [[55 + (i % 3) * 2.5, 10], [55 + (i % 3) * 2.5, 10], [55, 8]].map(([w, r]) => ({ w, r, done: true })) }));
  add('lat_pulldown', 1, i => ({ sets: [[40 + (i % 2) * 5, 12], [40, 12], [40, 10]].map(([w, r]) => ({ w, r, done: true })) }));
  add('leg_press', 2, i => ({ sets: [[100, 12], [100 + (i % 2) * 10, 12], [100, 10]].map(([w, r]) => ({ w, r, done: true })) }));
  add('treadmill', 3, i => ({ min: 18 + (i % 3) * 2, level: 'normal' }));
  add('squat', 4, i => ({ sets: [[50, 8], [50, 8], [50 + (i % 2) * 5, 6]].map(([w, r]) => ({ w, r, done: true })) }));
  return H;
};

const fresh = () => ({ type:'mungchi', chosen:false, onboarded:false, perm:{ noti:false },
  noti:{ entry:true, nudge:true, report:true }, hideTips:false, bodyweight:null,
  level:18, xp:need(18) - 120, exLv:18, exXp:need(18) - 120, points:2450,
  events:[], pending:null, sound:true, placeholder:false, demo:'none', quitDemo:false,
  exprDemo:'auto', moodDemo:'auto', mood:null, lowRun:0,
  owned:{ cap:1 }, equipped:{ cap:true }, inv:{ boost1:0, boost7:0, potion:0, charm:0 }, boostNext:false, boost7Until:null, nextBoosts:[], timedBoosts:[], eatCat:'all', paidLog:[], shields:0,
  records: seedRecords(), hist: seedHist(), streakWeeks: 5, ticketLeft: 1, ticketAuto: true, custom: [],
  session:null, lastResult:null, entryDemo:true, verifyDemo:'auto', holdDemo:false, selfieSeen:false, selfieStep:'guide', selfieFor:null, bump:0,
  tab:'home', sub:null, wseg:'mine', fTab:'week', pureOnly:false, sTab:'effect', pick:null, cur:null, recId:null, editRec:null, part:'all', gear:'all', q:'', placeQ:'', cx:null,
  calc:null });
let S, RAW0 = null;
try { RAW0 = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { RAW0 = null; }
const plainObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
S = Object.assign(fresh(), plainObj(RAW0) ? RAW0 : {});
if (plainObj(RAW0) && RAW0.exLv == null && RAW0.level != null) { S.exLv = S.level; S.exXp = S.xp; }   // v1.18 이전 저장분: 운동 레벨 = 지금 레벨에서 시작
if (!Array.isArray(S.custom)) S.custom = [];
S.custom = S.custom.filter(c => plainObj(c) && typeof c.id === 'string' && typeof c.name === 'string');
S.custom.forEach(c => { if (c.cat === 'custom') c.cat = 'body'; EX[c.id] = c; });   // v1.22 이전 «직접 추가»(분류 없음) = 맨몸
/* v1.40 안전장치(QA 치6): 저장값이 깨졌거나 옛 형식이어도 흰 화면이 되지 않게, 모양을 점검해 못 쓰는 칸만 기본값으로 바꾼다.
   맨 아래 첫 render() 직전에 1번 부른다. 그래도 그리기가 실패하면 render() 의 안전망이 운동기록 첫 화면 → «처음 상태로 시작» 화면으로 보낸다 */
function sanitize() {
  const F = fresh(), num = v => typeof v === 'number' && isFinite(v);
  /* v1.41: 기록 칸이 글자·번호 붙은 묶음으로 저장돼 있으면 풀어서 살린다. 못 살린 게 있으면 fixNote 로 1번 알린다(옛 값은 따로 보관) */
  const asArr = v => { if (typeof v === 'string') { try { v = JSON.parse(v); } catch { return null; } }
    return Array.isArray(v) ? v : plainObj(v) && Object.keys(v).length && Object.keys(v).every(k => /^\d+$/.test(k)) ? Object.values(v) : null; };
  const rec0 = asArr(S.records), recAll = !rec0, recTotal = rec0 ? rec0.length : 0;
  S.records = rec0 || [];
  S.savedNote = null; S.setEdit = null;
  ['records', 'events', 'paidLog', 'nextBoosts', 'timedBoosts'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  ['hist', 'inv', 'owned', 'equipped', 'perm', 'noti'].forEach(k => { if (!plainObj(S[k])) S[k] = k === 'hist' ? {} : F[k]; });
  S.inv = { ...F.inv, ...S.inv }; S.perm = { ...F.perm, ...S.perm }; S.noti = { ...F.noti, ...S.noti };
  ['coach', 'fr', 'me', 'mood', 'calc', 'cmp', 'rest', 'prFx', 'cx'].forEach(k => { if (S[k] != null && !plainObj(S[k])) S[k] = null; });
  Object.keys(S.hist).forEach(k => { if (!Array.isArray(S.hist[k]) || !EX[k]) delete S.hist[k]; else S.hist[k] = S.hist[k].filter(h => plainObj(h) && typeof h.date === 'string' && (h.sets == null || Array.isArray(h.sets))); });
  if (!CH[S.type]) S.type = F.type;
  const lvOk = v => num(v) && v >= 1 && v <= 99;
  S.level = lvOk(Math.round(+S.level)) ? Math.round(+S.level) : F.level; S.exLv = lvOk(Math.round(+S.exLv)) ? Math.round(+S.exLv) : S.level;
  const xpOk = (lv, x) => !num(x) ? 0 : lv >= 99 ? 0 : x < 0 && lv > 1 ? 0 : Math.min(x, need(lv) - 1);   // 필요량을 넘는 값(«Lv.19까지 -99,486 XP») 방지
  S.xp = xpOk(S.level, S.xp); S.exXp = xpOk(S.exLv, S.exXp);
  ['points', 'streakWeeks', 'ticketLeft', 'shields', 'lowRun'].forEach(k => { if (!num(S[k]) || S[k] < 0) S[k] = F[k]; });
  delete S.goal; delete S.goalNext;   // v1.42: 주간 목표 삭제(옛 저장값 정리)
  const okItem = it => plainObj(it) && !!EX[it.ex] && (it.sets == null || Array.isArray(it.sets));
  const fixSets = it => { if (it.sets) it.sets = it.sets.filter(plainObj); return it; };
  const usedId = new Set();
  S.records = S.records.map((r, i) => { if (!plainObj(r)) return null;
    const big = num(r.id) && r.id > 1e12, m = typeof r.date === 'string' && r.date.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    r.date = m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : big ? ymd(new Date(r.id)) : null;   // 날짜가 깨졌어도 저장 시각이 있으면 그날로
    if (!r.date || isNaN(new Date(r.date).getTime())) return null;
    if (!num(r.id) || usedId.has(r.id)) { let k = 900001 + i; while (usedId.has(k)) k++; r.id = k; }   // 번호가 없거나 겹치면 새 번호
    usedId.add(r.id); return r; }).filter(Boolean).map(r => {
    r.items = (Array.isArray(r.items) ? r.items : []).filter(okItem).map(fixSets);
    if (!num(r.xp)) r.xp = 0; if (typeof r.place !== 'string') r.place = '운동'; if (typeof r.summary !== 'string') r.summary = summaryOf(r.items);
    if (!VERIFY.some(v => v[0] === vk(r.v))) r.v = 'self';
    if (r.br != null && !(plainObj(r.br) && (r.br.demoXP || Array.isArray(r.br.lines)))) delete r.br;
    return r; });
  const recLost = recTotal - S.records.length;
  if (recAll || recLost > 0) S.fixNote = { all: recAll, lost: recLost, total: recTotal, lvOk: plainObj(RAW0) && num(RAW0.level) && RAW0.level >= 1 && RAW0.level <= 99 };
  S.records = S.records.filter(r => !(r.edited && !r.items.length && !r.xp));   // 옛 판에서 세트를 다 지워 남은 «기록 없음 +0 XP» 줄 정리
  S.paidLog = S.paidLog.filter(p => plainObj(p) && typeof p.date === 'string' && num(p.xp));
  S.events = S.events.filter(ev => plainObj(ev) && num(ev.from) && num(ev.to) && CH[ev.type]);
  if (S.pending != null && !S.events.some(ev => ev.id === S.pending)) S.pending = null;
  const s = S.session;
  if (s != null) {
    if (!plainObj(s) || !plainObj(s.place) || typeof s.place.name !== 'string' || !Array.isArray(s.items) || !num(s.startedAt)) S.session = null;
    else { s.items = s.items.filter(it => okItem(it) && (EX[it.ex].mode === 'lesson' || plainObj(it.draft))).map(fixSets);
      if (!num(s.lastAt)) s.lastAt = s.startedAt; if (CFG.VERIFY[s.verify] == null) s.verify = 'V0'; if (!num(s.prCount)) s.prCount = 0; }
  }
  if (typeof S.tab !== 'string' || !MAIN[S.tab]) S.tab = 'workout';
  if (S.sub != null && typeof S.sub !== 'string') S.sub = null;
  if (!S.session && ['session', 'set', 'cardio', 'pick'].includes(S.sub)) S.sub = null;
  if (S.session && S.cur && !S.session.items.some(i => i.ex === S.cur)) { S.cur = null; if (S.sub === 'set' || S.sub === 'cardio') S.sub = 'session'; }
  S.editRec = null;
  /* QA 치10: 먹이기 «하나 더» 대기 줄에 서 있다가 앱이 닫힌 음식은 효과 없이 사라지지 않게 보유함으로 되돌린다 */
  if (Array.isArray(S.eatQ) && S.eatQ.length) { S.eatQ.forEach(id => { if (typeof id === 'string') S.inv[id] = (S.inv[id] || 0) + 1; }); S.eatBack = S.eatQ.length; }
  S.eatQ = [];
}
/* v1.40(QA 치3): 저장 성공 여부를 돌려준다. 실패하면 화면 위에 사라지지 않는 안내 띠(render) — 알림은 처음 실패했을 때 1번만 */
let SAVE_OK = true;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); SAVE_OK = true; return true; }
  catch { if (SAVE_OK) toast('저장이 안 되고 있어요 · 휴대폰 저장 공간을 확인해 주세요'); SAVE_OK = false; return false; } };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
const fmt = n => Math.round(n).toLocaleString();
const kg = w => `${+w.toFixed(1)}kg`;

const PH_H = [60,110,150,170,190,210,230,260,300,340,360];
function placeholderSrc(lv) {
  const h = PH_H[stageIdx(lv)], w = Math.round(h * 0.9);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="M${w*0.1} ${h} Q0 ${h*0.4} ${w/2} 0 Q${w} ${h*0.4} ${w*0.9} ${h} Z" fill="#9AA3B5"/><text x="50%" y="62%" font-size="${Math.max(12,h/7)}" text-anchor="middle" fill="#fff" font-family="sans-serif">${stageIdx(lv)+1}단계</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
/* 크기 규칙(README_for_dev 2절): 한 캐릭터의 11컷은 같은 배율 — scale = 칸 높이 ÷ 그 캐릭터 Lv.99 높이 (컷마다 fit 하면 성장이 사라짐).
   same=true 는 캐릭터끼리 나란히 둘 때(선택 화면, Lv.1만): 정본 배율 그대로, 기준 = 12종 중 가장 큰 Lv.1 원본 높이.
   v1.10(형 시정): 9종 모두 v1.8 크기 그대로 두고, 밤톨·뚝비·영차만 같은 컷에서 나머지 6종(릴라·샛별·이무·코아·삐약·카피)의 «몸 높이»(머리 윗면~발끝, 가는 장식 제외) 중앙값까지 줄인다(키우지 않음).
   BODY = scripts/measure_v19.py 로 잰 컷별 몸 높이(웹 px, 컷 순서 01·10…90·99). 납작한 3종(뭉치·도트·섀도)은 v1.8 그대로 */
const CUTS = ['01','10','20','30','40','50','60','70','80','90','99'];
/* v1.34: 크기 = 디자인 배율표 render_scale_160x128(ANIM.rs, 160×128 칸 기준 원본 px × render). 다른 높이의 칸은 boxH/128 비율로.
   v1.10 몸 높이 측정(BODY)·밤톨/뚝비/영차 축소(SHRINK)는 배율표가 캐릭터 간 크기를 정하므로 쓰지 않는다 */
const RS = (t, cut) => (window.ANIM && ANIM.rs[t] && ANIM.rs[t][cut]) || 0.1;
const scaleOf = (t, lv, boxH, same = false, boxW = boxH, ringW = 1.1) => RS(t, cutOf(lv)) * (boxH / 128) / CHARS[t].k;
function charImg(t, lv, boxH, same = false, boxW = boxH) {
  if (S.placeholder) { const h = PH_H[stageIdx(lv)]; return { src: placeholderSrc(lv), w: h * 0.9 * boxH / 360, h: h * boxH / 360, dx: 0, db: 0, cut: cutOf(lv), s: 1 }; }
  const cut = cutOf(lv), [w, h] = CHARS[t].dims[cut], k = scaleOf(t, lv, boxH, same, boxW), u = boxH / 128, p = clipPlace(t, cut);
  /* dx·db: 칸 가운데·바닥 기준 치우침(px) — 포즈 클립 첫 프레임과 같은 자리(발바닥 96.4%·가로 가운데) */
  return { src: `assets/c/${t}/lv${cut}.png?v=${VER}`, w: w * k, h: h * k, dx: (p.x + p.w / 2 - 80) * u, db: (128 - (p.y + p.h)) * u, cut, s: k };
}
/* Lv.99 골드 링(README_for_dev 1절): 타원 선 #E5B158 · 폭 ≈ 캐릭터 폭×1.1 · 높이 ≈ 폭×0.24 · 바닥선에 중심. 그 아래 단계는 기존 티어 링 */
function ringHTML(c, lv, boxH) {
  const tr = tierOf(lv);
  if (lv >= 99) { const w = c.w * 1.1, h = w * 0.24; return `<div class="ring gold" style="width:${w}px;height:${h}px;bottom:${-h / 2}px"></div>`; }
  return tr > 1 ? `<div class="ring t${tr}" style="width:${Math.max(c.w*1.05, boxH*0.6)}px;height:${boxH*0.13}px"></div>` : '';
}
function charHTML(t, lv, boxH, withRing = true, expr = null, same = false, boxW = boxH, opts = {}) {
  const c = charImg(t, lv, boxH, same, boxW), gold = withRing && lv >= 99 && !S.placeholder ? c.w * 1.1 * 0.12 : 0;   // 골드 링 아래 반쪽만큼 자리를 비워 아래 글자와 안 겹치게
  const r1 = n => Math.round(n * 10) / 10;
  const inner = (opts.rig && !S.placeholder && rigLayers(t, c.cut, c.s)) || `<img src="${c.src}" style="width:${c.w}px;height:${c.h}px" alt="">`;   // opts.rig: 4단계 부품 레이어(팔 ±5°)
  return `<div class="cbox" style="height:${boxH}px${gold ? `;margin-bottom:${Math.round(gold)}px` : ''}">${withRing ? ringHTML(c, lv, boxH) : ''}<span class="cimg${opts.rig ? ' rig' : ''}" style="width:${c.w}px;height:${c.h}px;left:${r1(c.dx)}px;bottom:${r1(c.db)}px">${inner}${faceLayer(t, lv, expr)}</span></div>`;
}
/* 작은 칸(홈 축소 카드·코치·랭킹): 같은 배율 규칙으로 Lv.99 가 box 높이에 맞게 → 레벨이 낮으면 작게 보인다 */
function charFit(t, lv, box, expr = null) {
  if (S.placeholder) return `<img src="${placeholderSrc(lv)}" style="max-width:${box}px;max-height:${box}px" alt="">`;
  const k = scaleOf(t, lv, box, false, box, 1), [w, h] = CHARS[t].dims[cutOf(lv)], dw = Math.round(w*k), dh = Math.round(h*k);
  return `<span class="cimg" style="width:${dw}px;height:${dh}px"><img src="assets/c/${t}/lv${cutOf(lv)}.png?v=${VER}" style="width:${dw}px;height:${dh}px" alt="">${faceLayer(t, lv, expr)}</span>`;
}
/* 랭킹 아바타(40px 아이콘): v1.8처럼 컷마다 칸에 꽉 맞추고, 밤톨·뚝비·영차만 다른 화면과 같은 비율로 줄인다 */
function charAvatar(t, lv, box) {
  const c = cutOf(lv), [w, h] = CHARS[t].dims[c], k = box / Math.max(w, h);
  return `<img src="assets/c/${t}/lv${c}.png?v=${VER}" style="width:${Math.round(w*k)}px;height:${Math.round(h*k)}px" alt="">`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2400); }

/* ===== 기록·장부 조회 (계산은 engine.js) ===== */
function weekDaysOf(dateStr) {   // 월요일 시작 7일
  const d = new Date(dateStr), dow = (d.getDay() + 6) % 7, out = [];
  for (let i = 0; i < 7; i++) { const x = new Date(d); x.setDate(d.getDate() - dow + i); out.push(ymd(x)); }
  return out;
}
const weekDays = () => weekDaysOf(TODAY);
const realRecs = () => S.records.filter(r => !r.demo);
const todayDone = () => S.records.some(r => r.date === TODAY);
const weekCount = () => weekDays().filter(x => S.records.some(r => r.date === x)).length;
const ledger = (excludeId = null) => ledgerOf([...S.records.filter(r => r.id !== excludeId), ...S.paidLog.map(p => ({ ...p, paid: true }))], TODAY, weekDays());
const weekXP = () => weekUsedOf(ledger());   // 운동 경험치만(주 1,800 한도 대상)
const itemWeek = () => ledger().weekItem;    // 아이템 경험치(한도 없음)
const centerWeek = () => ledger().weekCenter;   // 결정 36 입점 보너스(주 900 · 운동 1,800과 따로)
const leagueWeek = () => leagueWeekOf(S.records, weekDays());   // 결정 38 리그·랭킹 주간 = 운동 + 입점 보너스(검증 세션만)
const gainEx = g => { const e = applyXP({ level: S.exLv, xp: S.exXp }, g); S.exLv = e.level; S.exXp = e.xp; };   // 운동 레벨(아이템 장부 제외)
const CB_TXT = '입점센터에서 운동하면 경험치 1.5배';
const findCenterBtn = (id = '') => `<button class="linkbtn cfind" data-act="findCenter"${id ? ` id="${id}"` : ''}>센터 찾기 ›</button>`;
const lastWorkoutDays = () => { const ds = realRecs().map(r => r.date).sort(); if (!ds.length) return 99;
  return Math.round((new Date(TODAY) - new Date(ds[ds.length - 1])) / 864e5); };
const boostOn = () => boostMul() > 0;   // 배율 목록·겹침 규칙 = eat.js boostList
/* 지난 기록(오늘 세션 제외) — 종목별 [{date, sets|min}] 최신순 */
function histOf(ex) {
  const fromRec = realRecs().flatMap(r => (r.items || []).filter(it => it.ex === ex).map(it => ({ date: r.date, ...it, light: r.light })));
  return [...fromRec, ...(S.hist[ex] || [])].sort((a, b) => b.date.localeCompare(a.date));
}
const histVol = () => { const ids = new Set([...Object.keys(S.hist), ...realRecs().flatMap(r => (r.items || []).map(i => i.ex))]);
  return Object.fromEntries([...ids].map(ex => [ex, histOf(ex).map(h => ({ date: h.date, light: h.light, vol: itemVolume({ ex, ...h }) }))])); };
const bestOf = ex => { const e = EX[ex]; return Math.max(0, ...histOf(ex).flatMap(h => (h.sets || []).map(s => setScore(e, s)))); };
const bestW = ex => Math.max(0, ...histOf(ex).flatMap(h => (h.sets || []).map(s => s.w || 0)));
const freq = () => { const c = {}; [...realRecs().flatMap(r => (r.items || []).map(i => i.ex)), ...Object.entries(S.hist).flatMap(([k, v]) => v.map(() => k))].forEach(x => { c[x] = (c[x] || 0) + 1; });
  return Object.entries(c).filter(([k]) => EX[k] && EX[k].cat !== 'lesson').sort((a, b) => b[1] - a[1]).map(([k]) => k); };
/* v1.23 «최근 한 운동» = 최근 기록 순(같은 날은 기록 안 순서) · 중복 없이 · 레슨·숨김 제외 */
const recentEx = (n = 12) => { const rows = [...realRecs().flatMap(r => (r.items || []).map((i, k) => ({ d: r.date, k, ex: i.ex }))),
  ...Object.entries(S.hist).flatMap(([ex, v]) => v.map(h => ({ d: h.date, k: 99, ex })))].sort((a, b) => b.d.localeCompare(a.d) || a.k - b.k);
  return [...new Set(rows.map(r => r.ex))].filter(x => EX[x] && EX[x].cat !== 'lesson' && !EX[x].off).slice(0, n); };
const placeBase = p => p.replace(/ · .*$/, '');
const placeMem = place => [...new Set(realRecs().filter(r => placeBase(r.place) === place).flatMap(r => (r.items || []).map(i => i.ex)))].filter(x => EX[x] && EX[x].cat !== 'lesson');
/* 지난번 루틴 = 직전 «같은 요일·같은 장소» 세션, 없으면 같은 장소의 가장 최근 세션 */
function lastRoutine(place) {
  const same = realRecs().filter(r => placeBase(r.place) === place && (r.items || []).some(i => EX[i.ex] && EX[i.ex].cat !== 'lesson')).sort((a, b) => b.date.localeCompare(a.date));
  return same.find(r => new Date(r.date).getDay() === new Date(TODAY).getDay()) || same[0] || null;
}
const sumItem = it => { const e = EX[it.ex]; if (!e) return '';
  if (e.mode === 'cardio' || e.mode === 'lesson') return `${e.name} ${it.min || 0}분`;
  return `${e.name} ${(it.sets || []).filter(s => s.done).length}세트`; };
const summaryOf = items => items.filter(it => (it.sets || []).some(s => s.done) || it.min > 0).map(sumItem).join(' · ') || '기록 없음';
const setTxt = (e, s) => e.mode === 'wr' ? `${kg(s.w)} × ${s.r}` : e.mode === 't' ? `${s.s}초` : `${s.r}회`;
/* 세트 묶음 표기: 무게가 같으면 «60kg × 10 · 10 · 8» */
const setsTxt = (e, sets) => e.mode === 'wr' && sets.every(x => x.w === sets[0].w) ? `${kg(sets[0].w)} × ${sets.map(x => x.r).join(' · ')}` : sets.map(x => setTxt(e, x)).join(' · ');

/* 세션 경험치 입력값(ctx) — 오늘·이번 주 상황 */
function sessCtx() {
  const today = realRecs().filter(r => r.date === TODAY), wk = realRecs().filter(r => weekDays().includes(r.date) && r.date !== TODAY);
  return { firstToday: !today.length, weekParts: [...new Set([...wk, ...today].flatMap(r => (r.items || []).map(i => EX[i.ex] && EX[i.ex].part)).filter(Boolean))],
    streakWeeks: S.streakWeeks, lastDays: lastWorkoutDays(), prToday: today.reduce((a, r) => a + (r.prCount || 0), 0),
    boost: boostMul(), selfieToday: selfieClaims(), ...volCtx(today) };
}
/* 결정 35 입력값 — 종목별 경험치용 «내 평소»(대상 세트·분) + 오늘 앞 세션에서 이미 센 양·그 세션 배율(같은 날 재판정 차액용) */
function volCtx(today) {
  const ids = new Set([...Object.keys(S.hist), ...realRecs().flatMap(r => (r.items || []).map(i => i.ex))].filter(x => EX[x] && EX[x].xpk !== 'lesson'));
  const xpBase = Object.fromEntries([...ids].map(ex => [ex, xpBaselineOf({ [ex]: histOf(ex).map(h => ({ date: h.date, light: h.light, q: xpQty({ ex, ...h }) })) }, ex, TODAY)]));
  const todayQ = {}, todayPrev = [];
  today.forEach(r => (r.br && r.br.per || []).forEach(x => { todayQ[x.ex] = (todayQ[x.ex] || 0) + x.cnt; todayPrev.push({ ex: x.ex, cnt: x.cnt, bonus: x.bonus, mul: (r.br.vm || 1) * (r.br.sm || 1) }); }));
  return { xpBase, todayQ, todayPrev };
}
const sessCalc = (s = S.session) => { const r = sessionXP(effSess(s), sessCtx()); return { r, cap: capGain(r, ledger(), r.v === 'V0') }; };

/* ===== 표정 (판정은 engine.exprFor) ===== */
const EXPR = {
  happy:   { label:'쌩쌩',  line:'' },
  excited: { label:'신남',  line:'' },
  meh:     { label:'아쉬운', line:'' },
  sleepy:  { label:'졸림',  line:'같이 운동 갈래? 몸이 근질근질해…' },
  sad:     { label:'시무룩', line:'보고 싶었어… 돌아오면 첫 운동 경험치 1.5배!' },
};
const EXPR_KEYS = ['happy','excited','meh','sleepy','sad'];
const moodToday = () => (S.mood && S.mood.date === TODAY && S.mood.verdict !== 'normal' && S.mood.verdict !== 'na' && !S.mood.quiet) ? S.mood : null;   // 그날 자정까지만
const exprNow = () => exprFor({ demo: S.exprDemo, mood: moodToday(), lastDays: S.recoverDate === TODAY || !realRecs().length ? 0 : lastWorkoutDays() });   // v1.41: 기록이 아예 없으면(첫 사용·기록 비워짐) 평소 표정
const exprOfMood = m => !m ? 'happy' : m.verdict === 'high' ? 'excited' : m.verdict === 'low' ? 'meh' : 'happy';
/* 캐릭터 그림 위에 얹는 표정 패치 — 그 컷 좌상단 기준 [x,y,w,h](웹 px)를 컷 크기 대비 % 로 두면 어떤 표시 크기에서도 같은 자리.
   패치 = design 얼굴(Lv.50 기준)을 그 컷 얼굴 위치에 맞춘 것(scripts/build_v18_assets.py). null = 원본 얼굴(뭉치 쌩쌩) */
function faceLayer(t, lv, expr) {
  const e = expr && CHARS[t].expr[expr]; if (!e) return '';
  const cut = cutOf(lv), [x, y, w, h] = e[cut], [W, H] = CHARS[t].dims[cut], pc = n => (Math.round(n * 1000) / 10) + '%';
  return `<img class="face art ${expr}" src="assets/c/${t}/e_${expr}_${cut}.png?v=${VER}" style="left:${pc(x / W)};top:${pc(y / H)};width:${pc(w / W)};height:${pc(h / H)}" alt="">`;
}
const exprPill = (ex, small = false) => (ex === 'sleepy' || ex === 'sad') ? `<span class="pill moodpill ${ex} ${small ? 'sm' : ''}">${EXPR[ex].label}</span>` : '';
const moodPill = (m, small = false) => m ? `<span class="pill moodpill ${m.verdict} ${small ? 'sm' : ''}">${m.verdict === 'high'
  ? '<svg viewBox="0 0 12 12"><path d="M6 .8 7.3 4.7 11.2 6 7.3 7.3 6 11.2 4.7 7.3.8 6 4.7 4.7Z"/></svg>'
  : '<svg viewBox="0 0 10 12"><path d="M5 .8C5 .8 1.2 5.3 1.2 7.8a3.8 3.8 0 0 0 7.6 0C8.8 5.3 5 .8 5 .8Z"/></svg>'}오늘 ${MOOD[m.verdict].label}</span>` : '';
const coachLine = () => {
  const m = moodToday(); if (m) return m.line;   // 결정 21: 그날 표정이 있으면 말풍선은 그 문구
  if (S.mood && S.mood.date === TODAY && S.mood.quiet) return QUIET_LINE;
  const ex = exprNow(); if (EXPR[ex].line) return EXPR[ex].line;
  if (S.session) return '운동 중! 끝나면 [운동 끝]만 눌러 줘';
  if (todayDone()) return '오늘 기록 완료! 내일은 어깨 쪽 한번 가볼까?';
  if (!S.records.length) return '첫 운동을 기록해 볼까? 아래 [운동 시작]을 눌러 줘';
  return '오늘 같이 운동하면 내가 더 단단해질 거야 💧';
};
/* v1.42: «주 몇 회» 목표 삭제 — 이번 주 운동한 횟수만 보고 캐릭터가 한마디(칭찬·독려). 명령형 안 씀 */
const weekSay = n => n <= 0 ? '이번 주 한 번 가 볼까?' : n === 1 ? '이번 주 첫 운동 했네! 시작이 좋아' : n === 2 ? '벌써 두 번째야. 꾸준한데?' : n === 3 ? '세 번이나 갔어! 진짜 잘하고 있어'
  : n === 4 ? '네 번째라니, 이번 주 대단한데?' : n === 5 ? '다섯 번이나! 이번 주 완전 멋져' : `이번 주 ${n}번이나 갔어. 대단해! 쉬는 것도 운동인 거 알지?`;
/* 요즘 한 주에 몇 번 운동하는지(지난 4주 평균 · 기록 없으면 3) — 계산기 기본값용 */
const usualWeek = () => { const m0 = weekDays()[0], a = new Date(m0); a.setDate(a.getDate() - 28); const from = ymd(a);
  const n = new Set((typeof statRecs === 'function' ? statRecs() : realRecs()).filter(r => r.date >= from && r.date < m0).map(r => r.date)).size; return n ? Math.min(7, Math.max(1, Math.round(n / 4))) : 3; };

/* ===== 더미 탭(실제 앱 화면 자리) ===== */
function vDummy(title, lines) {
  return `<div class="dummy"><div class="h2">${title}</div>${lines.map(l => `<div class="ph">${l}</div>`).join('')}</div>`;
}
function vHome() {
  const t = S.type, lv = S.level, done = todayDone();
  const chev = '<svg class="chev" viewBox="0 0 6.5 12" aria-hidden="true"><path d="M.5.5 6 6 .5 11.5"/></svg>';
  const card = S.chosen
    ? `<button class="mini" data-tab="workout" id="homeMini"><div class="mbox">${charFit(t, lv, 38, exprNow())}</div><div class="mtxt"><b>${esc(CH[t].name)}</b><span class="pill lvpill">Lv.${lv}</span>${done
        ? (moodToday()
        ? `<span class="st ok ${moodToday().verdict}">${moodToday().verdict === 'high' ? '<svg viewBox="0 0 12 12"><path class="f" d="M6 .8 7.3 4.7 11.2 6 7.3 7.3 6 11.2 4.7 7.3.8 6 4.7 4.7Z"/></svg>기록 완료 · 오늘 신남!' : '<svg viewBox="0 0 11.4 9.4"><path d="M1 5.2 4.4 8.4 10.4 2"/></svg>기록 완료 · 살짝 아쉬운 날'}</span>`
        : '<span class="st ok"><svg viewBox="0 0 11.4 9.4"><path d="M1 5.2 4.4 8.4 10.4 2"/></svg>오늘 기록 완료</span>')
        : S.session ? '<span class="st"><i></i>운동 중이에요</span>' : '<span class="st"><i></i>오늘 기록 아직이에요</span>'}</div>${chev}</button>`
    : `<button class="mini" data-tab="workout" id="homeMini"><div class="mbox plus"><svg viewBox="0 0 22 22"><path d="M11 4V18M4 11H18"/></svg></div><div class="mtxt"><b>운동 친구 고르기</b><span class="st">운동할수록 자라는 캐릭터</span></div>${chev}</button>`;
  const pend = S.pending ? `<div class="notice"><span>⏳ 못 본 레벨업 장면이 있어요</span><button class="btn sm" data-act="playPending">보기</button></div>` : '';
  return `<div class="dummy">${pend}${card}
  <div class="ph tall">실제 앱 «홈» 화면 자리 (배너 · 추천 · 내주변 헬스장 …)</div><div class="ph">실제 앱 «홈» 콘텐츠 자리</div><div class="ph">실제 앱 «홈» 콘텐츠 자리 (맨 아래 블록 — 탭바에 가리면 안 됨)</div></div>`;
}
/* ===== N1 내 주변 센터 목록 (기존 앱 화면 — 결정 36 ⑥ «경험치 1.5배» 배지만 얹는 자리) =====
   배지는 태그 줄 맨 앞(이름 줄에 붙이면 긴 센터 이름이 잘림) · 목록이 전부 입점센터면 배지 대신 맨 위 1줄 */
function vNearby() {
  const list = PLACES.filter(p => !S.nbOnly || p.linked), allLinked = list.length > 0 && list.every(p => p.linked);
  const card = p => `<div class="nbc" id="nb_${p.id}"><div class="nbimg"></div><div class="nbt"><b>${esc(p.name)}</b><div class="nbtags">${p.linked && !allLinked ? '<span class="cbbadge">경험치 1.5배</span>' : ''}${p.linked ? '<span>니짐 입점</span><span>헬스</span><span>1일권</span>' : '<span>헬스</span><span>지도 정보</span>'}</div><small>${p.dist} · ${p.linked ? '니짐내짐에서 결제·입장' : '입점 안 된 센터'}</small></div></div>`;
  return `<div class="dummy nb"><div class="h2">내주변</div><div class="ph">실제 앱 «내주변» 지도 자리</div>
  <div class="nbfilter"><button class="chip ${S.nbOnly ? 'on' : ''}" data-act="nbOnly" id="nbOnly">입점센터만</button><span class="muted">${list.length}곳</span></div>
  ${allLinked ? `<div class="cbtop" id="cbTop">여기 센터는 모두 경험치 1.5배</div>` : ''}
  <div id="nbList">${list.map(card).join('')}</div>
  <div class="muted" style="margin-top:10px">카드 모양은 실제 앱 «내주변» 목록을 따르고, 이번에 더하는 건 «경험치 1.5배» 배지·위 1줄뿐이에요</div></div>`;
}
const vMembership = () => vDummy('멤버십', ['실제 앱 «멤버십» 화면 자리 (내 회원권 · 구독)', '실제 앱 «멤버십» 콘텐츠 자리']);
const vAll = () => vDummy('전체', ['실제 앱 «전체» 메뉴 자리 (마이페이지 · 설정 · 고객센터 …)', '실제 앱 «전체» 콘텐츠 자리']);

/* ===== 공통 조각 ===== */
function subHead(title, to = '', label = '운동기록') { return `<div class="subhead"><button data-act="back" data-v="${to}" id="backBtn"><i>‹</i>${label}</button><div class="h2">${title}</div></div>`; }
const vBadge = k => (k = vk(k)) === 'self' ? '<span class="vb v0">자가 기록</span>' : `<span class="vb ${k}">${VERIFY_LABEL[K2V[k]]}</span>`;
const sfBadge = on => on ? '<span class="vb selfie">📸 오운완</span>' : '';
const stepper = (act, val, label, unit = '', mid = null) => `<div class="ex"><div><b>${label}</b></div><div class="step"><button data-act="${act}" data-d="-1" aria-label="${label} 줄이기">−</button>${mid || `<span>${val}${unit}</span>`}<button data-act="${act}" data-d="1" aria-label="${label} 늘리기">+</button></div></div>`;
/* 무게 직접 입력(v1.22): 숫자를 누르면 숫자 키패드. data-act 를 달지 않는다 — 전역 click 이 render() 해서 포커스가 날아가므로 */
const W_MAX = 500;
const wWidth = v => { const t = String(v); return `${Math.max(1, t.length - (t.match(/[.,]/g) || []).length * 0.6) + 0.15}ch`; };
const wInput = (w, attrs) => { const v = +(+w).toFixed(1); return `<label class="wfield"><input class="win" type="text" inputmode="decimal" enterkeyhint="done" autocomplete="off" maxlength="6" value="${v}" style="width:${wWidth(v)}" ${attrs} aria-label="무게(kg) 직접 입력"><i>kg</i></label>`; };
/* v1.41(불편 개선 ④): 횟수·초·분도 숫자를 눌러 직접 적는다 — 무게 칸(.win)과 같은 틀, data-k 로 어느 값인지 구분 */
const N_RULE = { r: { min: 1, max: 100, unit: '회', name: '횟수', ask: '횟수를 적어 주세요' }, s: { min: 1, max: 1800, unit: '초', name: '시간', ask: '시간을 적어 주세요' }, min: { min: 1, max: CFG.LIM.cardioMaxMin, unit: '분', name: '시간', ask: '시간을 적어 주세요' } };
const nInput = (k, v, attrs) => `<label class="wfield nf"><input class="win" type="text" inputmode="numeric" enterkeyhint="done" autocomplete="off" maxlength="5" value="${v}" style="width:${wWidth(v)}" data-k="${k}" ${attrs} aria-label="${N_RULE[k].name}(${N_RULE[k].unit}) 직접 입력"><i>${N_RULE[k].unit}</i></label>`;
function parseN(raw, k) {
  const R = N_RULE[k], t = String(raw).trim().replace(/\s/g, '').replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/(회|초|분)$/, '');
  if (!t) return { ok: false, msg: `${R.ask} · 원래대로 돌려놨어요` };
  if (!/^\d+$/.test(t)) return { ok: false, msg: '숫자로만 적어 주세요' };
  const v = +t;
  if (v < R.min || v > R.max) return { ok: false, msg: `${R.min}${R.unit}부터 ${R.max.toLocaleString()}${R.unit}까지 적을 수 있어요` };
  return { ok: true, w: v, snapped: false };
}
/* «22,5»(쉼표 키패드) → 22.5 · 0.5kg 단위로 맞춤 · 빈칸·음수·문자·500 초과는 거절(이전 값 유지) */
function parseW(raw) {
  let t = String(raw).trim().replace(/\s/g, '').replace(/[０-９．，]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/kg$/i, '');
  t = /^\d{1,3}(,\d{3})+(\.\d*)?$/.test(t) ? t.replace(/,/g, '') : t.replace(',', '.');   // «1,000» = 천(1kg 아님) · «22,5» = 22.5
  if (!t) return { ok: false, msg: '무게를 적어 주세요 · 원래대로 돌려놨어요' };
  if (/^\d{4,}(\.\d*)?$/.test(t)) return { ok: false, msg: `${W_MAX}kg까지만 적을 수 있어요` };
  if (!/^\d{1,3}(\.\d*)?$|^\.\d+$/.test(t)) return { ok: false, msg: /^-/.test(t) ? '0kg보다 작은 무게는 적을 수 없어요' : '숫자로만 적어 주세요 (예: 22.5)' };
  const v = +t;
  if (v > W_MAX) return { ok: false, msg: `${W_MAX}kg까지만 적을 수 있어요` };
  const w = Math.round(v * 2) / 2;
  return { ok: true, w, snapped: Math.abs(w - v) > 1e-9 };
}
const sw = (act, on, id = '') => `<button class="sw ${on ? 'on' : ''}" data-act="${act}" ${id ? `id="${id}"` : ''}></button>`;
const obProg = n => `<div class="obprog" aria-label="2단계 중 ${n}단계">${[1, 2].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}<span>${n}/2</span></div>`;
const LOCK = '<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const BELL = '<svg class="ico" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
const CAM = '<svg class="ico" viewBox="0 0 24 24"><path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/></svg>';
const FLASK = '<svg viewBox="0 0 64 64" class="itemsvg"><path d="M25 8h14M27 8v14L14 46a6 6 0 0 0 5.3 9h25.4A6 6 0 0 0 50 46L37 22V8" fill="none" stroke="#16161C" stroke-width="3" stroke-linejoin="round"/><path d="M19 42h26l3.3 6a3 3 0 0 1-2.6 4.5H18.3A3 3 0 0 1 15.7 48z" fill="#FF0065" opacity=".85"/><circle cx="29" cy="35" r="2.2" fill="#39B4FF"/><circle cx="35" cy="30" r="1.6" fill="#39B4FF"/></svg>';

/* ===== C2 온보딩 — 1/2 캐릭터 선택(C2a) · v1.42: «주 몇 회» 질문 화면 삭제로 2단계 ===== */
function vChoose() {
  const pick = S.pick || S.type;
  return `<div class="sec">${S.onboarded ? '' : obProg(1)}<div class="h2">같이 운동할 친구를 골라 주세요</div><div class="muted" style="margin-bottom:12px">능력치는 모두 같고 생김새·말투만 달라요. Lv.10 전에 1번 바꿀 수 있어요.</div>
  <div class="choose" id="chooseGrid">${Object.keys(CH).map(k => `<button class="cc ${pick===k?'on':''}" data-act="pick" data-v="${k}">${charHTML(k, 1, 84, false, null, true)}<b>${CH[k].name}</b></button>`).join('')}</div>
  <div class="card" style="text-align:center"><div class="muted">진화 미리보기 · <b style="color:var(--ink)">${esc(CH[pick].name)}</b> — ${esc(CH[pick].intro)}</div><div style="display:flex;justify-content:space-around;align-items:flex-end;margin-top:8px">${[1,30,60,99].map(l => `<div style="text-align:center">${charHTML(pick, l, 76, l >= 99)}<div class="muted" style="font-size:11px;margin-top:4px">Lv.${l}</div></div>`).join('')}</div></div>
  <button class="btn" data-act="choose" id="chooseBtn">${esc(CH[pick].name)}${wa(pick)} 시작하기</button>
  <div class="muted demoonly" style="text-align:center;margin-top:8px">시연용: 고른 뒤에도 레벨·경험치는 예시값(Lv.18)을 유지해요</div></div>`;
}
/* 2/2 알림 허용 + 사진은 나만 봄 (v1.44: 위치 허용 줄 삭제 — 위치는 어디서도 안 씀) */
function vOnbPerm() {
  const row = (ico, title, desc, k) => `<div class="prow">${ico}<div><b>${title}</b><small>${desc}</small></div><button class="btn sm ${S.perm[k] ? 'ghost' : ''}" data-act="perm" data-v="${k}">${S.perm[k] ? '허용됨' : '허용'}</button></div>`;
  return `<div class="sec">${obProg(2)}<div class="h2">거의 다 됐어요</div><div class="muted" style="margin-bottom:12px">마지막으로 알림만 정하면 돼요.</div>
  <div class="card">${row(BELL, '알림', '센터에 들어가면 «입장 확인! 캐릭터가 기다려요» 하고 한 번 알려요. 설정에서 언제든 끌 수 있어요', 'noti')}</div>
  <div class="card privacy" id="photoNote">${LOCK}<div><b>사진은 나만 봐요</b><small>오운완 셀카는 나한테만 보여요. 친구나 다른 회원은 볼 수 없고, 언제든 지울 수 있어요. 안 찍어도 기록은 그대로 남아요.</small></div></div>
  <button class="btn" data-act="obDone" id="obDone">${esc(CH[S.type].name)}${wa(S.type)} 시작하기</button>
  <div class="muted demoonly" style="text-align:center;margin-top:8px">시연용: 실제 권한 요청 창은 띄우지 않아요</div></div>`;
}

/* ===== C0 운동기록 탭 메인 ===== */
function vWorkout() {
  if (!S.chosen) return vChoose();
  const t = S.type, lv = S.level, tr = tierOf(lv);
  const toNext = lv >= 99 ? 0 : Math.max(0, need(lv) - S.xp);
  const nextEvo = lv >= 99 ? '만렙 달성!' : lv >= 90 ? 'Lv.99에 골드 아우라' : `Lv.${(Math.floor(lv/10)+1)*10}에 진화해요`;
  const pend = S.pending ? `<div class="notice"><span>⏳ 못 본 레벨업 장면이 있어요</span><button class="btn sm" data-act="playPending">보기</button></div>` : '';
  const eqNames = ITEMS.filter(i => S.equipped[i.id]).map(i => `<span class="pill">${i.name}</span>`).join('');
  const seg = `<div class="seg wseg"><button class="${S.wseg==='mine'?'on':''}" data-act="wseg" data-v="mine">내 운동</button><button class="${S.wseg==='feed'?'on':''}" data-act="wseg" data-v="feed">오운완 피드</button></div>`;
  if (S.wseg === 'feed') return `${seg}<div class="sec"><div class="ph tall">오운완 피드는 준비 중이에요<br>곧 친구들의 오운완을 여기서 볼 수 있어요</div></div>`;
  const wd = weekDays(), wk = weekCount();
  const labels = ['월','화','수','목','금','토','일'];
  const week = wd.map((d, i) => `<div>${labels[i]}<div class="dot ${S.records.some(r => r.date === d) ? 'on' : ''} ${d === TODAY ? 'today' : ''}">${S.records.some(r => r.date === d) ? '✓' : ''}</div></div>`).join('');
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let cal = labels.map(l => `<div class="wd">${l}</div>`).join('') + '<div></div>'.repeat(first);
  for (let d = 1; d <= days; d++) { const k = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cal += `<div class="d ${S.records.some(r => r.date === k) ? 'on' : ''} ${k === TODAY ? 'today' : ''} ${k > TODAY ? 'fut' : ''}">${d}</div>`; }
  const recent = [...S.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 3);
  const ico = {
    rank: '<svg viewBox="0 0 24 24"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4"/><path d="M17 6h3a3 3 0 0 1-3 4"/></svg>',
    shop: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    stats: '<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
    set: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  };
  const ex = exprNow();
  return `${seg}<div class="sec" style="padding-top:8px">${pend}
  <div class="card" id="stageCard"><div class="stage"><div class="cwrap stagewrap ${ex}" data-act="pose" id="stageWrap">${charHTML(t, lv, 128, true, ex, false, 160, { rig: true })}${sigClipHTML(t, lv)}</div>
    <div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span><span class="pill tier${tr}">${TIER_NAME[tr]}</span>${moodPill(moodToday(), true)}${exprPill(ex, true)}</div>
    <div class="bar"><i style="width:${lv>=99?100:Math.max(0, Math.round(S.xp/need(lv)*100))}%"></i></div>
    <div class="muted">${lv>=99?'최고 레벨':`Lv.${lv+1}까지 ${toNext.toLocaleString()} XP`} · ${nextEvo}</div>
    <div class="eqs">${eqNames || '<span class="pill none">장착 아이템 없음</span>'}</div>
    <button class="linkbtn" data-act="sub" data-v="me" id="goMe">내 캐릭터 자세히 ›</button></div></div>${moodToday() ? `<div class="say moodsay ${moodToday().verdict}" id="stageSay">${esc(moodToday().line)}</div>` : EXPR[ex].line ? `<div class="say moodsay ${ex}" id="stageSay">${esc(EXPR[ex].line)}</div>` : ''}</div>
  <button class="btn" data-act="start" id="goRecord" style="margin-top:0">${S.session ? '운동 이어서 하기' : '오늘 운동 기록하기'}</button>
  <div class="muted" style="text-align:center;margin:6px 0 12px">${S.session ? `${esc(S.session.place.name)}에서 운동 중 · <span data-clock="sess">${clock(Date.now() - S.session.startedAt)}</span>` : `센터에 입장하면 바로 시작돼요 · ${CB_TXT}`}</div>
  <div class="card" id="streakCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px" id="weekCnt">이번 주 ${wk}회 운동</div><span class="pill ${wk>=1?'tier4':'tier1'}">🔥 ${S.streakWeeks}주 연속</span></div>
    <div class="wsay" id="weekSay"><span class="cbox">${charFit(t, lv, 26, ex)}</span><span>${weekSay(wk)}</span></div>
    <div class="week">${week}</div>
    <div class="wxp" id="weekXP"><span>이번 주 운동 경험치</span><b>${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()}</b></div><div class="bar thin"><i style="width:${Math.min(100, Math.round(weekXP() / CFG.WEEK_CAP * 100))}%"></i></div>${centerWeek() ? `<div class="wxp itm" id="weekCenterXP"><span>+ 입점센터 보너스</span><b>${centerWeek().toLocaleString()} · 따로 계산</b></div>` : ''}${itemWeek() ? `<div class="wxp itm" id="weekItemXP"><span>+ 아이템 경험치</span><b>${itemWeek().toLocaleString()} · 한도 없음</b></div>` : ''}
    <div class="muted" style="margin-top:8px;font-weight:700;color:var(--ink)">${now.getMonth()+1}월</div><div class="cal">${cal}</div></div>
  <div class="card coach" id="coachCard"><div class="cbox">${charFit(t, lv, 52, ex)}</div><div><div class="say">${coachLine()}</div><button class="linkbtn" data-act="coach">코치에게 물어보기 › <span class="muted" style="font-weight:500">월 20회</span></button></div></div>
  <div class="card" id="recentCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px">최근 기록</div><button class="linkbtn" data-act="sub" data-v="stats" style="margin:0">전체 보기 ›</button></div>
    ${recent.map(r => `<div class="rec tap" data-act="rec" data-id="${r.id}"><div><b>${esc(r.summary)}</b><small>${r.date.slice(5).replace('-', '/')} · ${esc(r.place)} · ${vLabel(r.v)}</small></div>${recXP(r)}</div>`).join('')}</div>
  <div class="entries" id="entries">
    <button class="entry" data-act="sub" data-v="friends">${ico.rank}<b>랭킹</b><small>친구리그 ${rankMe()}위 · 내 센터 · 전국</small></button>
    <button class="entry" data-act="sub" data-v="shop">${ico.shop}<b>아이템 상점</b><small>${S.points.toLocaleString()}P 보유</small></button>
    <button class="entry" data-act="sub" data-v="stats">${ico.stats}<b>통계</b><small>이번 달 ${S.records.filter(r => r.date.startsWith(TODAY.slice(0,7))).length}회</small></button>
    <button class="entry" data-act="sub" data-v="settings" id="goSettings">${ico.set}<b>설정</b><small>알림 · 사진 · 소리</small></button></div><div id="lastBlock"></div></div>`;
}
const clock = ms => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; };

/* ===== C3b 장소 선택 (입장 기록 없을 때만) ===== */
function vPlace() {
  const recent = [...new Set([...S.records].sort((a, b) => b.date.localeCompare(a.date)).map(r => placeBase(r.place)))].filter(p => p !== '집' && p !== '야외').slice(0, 4);
  const q = S.placeQ.trim(), list = PLACES.filter(p => !q || p.name.includes(q));
  return `${subHead('어디서 운동해요?')}<div class="sec">
  <div class="muted" style="margin-bottom:10px">오늘은 센터 입장 기록이 없어요. 장소만 골라 주세요.</div>
  <div class="h3">최근 장소</div><div class="chips white" id="recentPlaces">${recent.map(p => `<button class="chip" data-act="place" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>
  <div class="grid2 placekind"><button class="pk" data-act="place" data-v="집" id="pkHome"><svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/></svg><b>집</b><small>홈트·맨몸 운동</small></button>
  <button class="pk" data-act="place" data-v="야외" id="pkOut"><svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="3"/><path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6"/></svg><b>야외</b><small>걷기·달리기·자전거</small></button></div>
  <div class="card" style="margin-top:12px"><div class="search">${'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>'}<input id="placeQ" placeholder="센터 이름 검색" value="${esc(S.placeQ)}" autocomplete="off"></div>
  <div id="placeList">${placeListHTML(list)}</div></div>
  <div class="muted" id="placeNote">입점 안 된 헬스장은 집·야외와 같은 «자가 기록»(경험치 40%)이에요 · 어디서든 오운완 셀카를 찍으면 +20%</div></div>`;
}
const placeListHTML = list => list.length ? list.map(p => p.linked ? `<button class="prow tap plc" data-act="placeLinked" data-v="${esc(p.name)}"><div><b>${esc(p.name)}</b><small><span class="cbtag">1.5배</span>${p.dist} · 니짐 입점센터</small></div><span class="muted">선택</span></button>${S.placeOpen === p.name ? `<div class="cbopen" id="cbOpen"><div>입장하기로 들어오면 경험치 1.5배예요</div><div class="grid2"><button class="btn sm" data-act="placeEnter" data-v="${esc(p.name)}">입장하기</button><button class="btn sm ghost" data-act="place" data-v="${esc(p.name)}">입장 없이 기록</button></div></div>` : ''}`
  : `<button class="prow tap plc" data-act="place" data-v="${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.dist} · 입점 안 된 센터</small></div><span class="muted">선택</span></button>`).join('')
  : `<div class="muted" style="padding:12px 0">찾는 센터가 없어요. 지도에서 찾은 센터만 고를 수 있어요.</div>`;

/* ===== C3 세션 화면 ===== */
function vSession() {
  const s = S.session; if (!s) return vWorkout();
  const { r, cap } = sessCalc(), done = s.items.filter(it => (it.sets || []).some(x => x.done) || it.min > 0);
  const lr = lastRoutine(s.place.name);
  const recs = recommend(s);
  const held = sessHeld(s), est = S.demo === 'none' ? cap.gained + centerBonus(r, ledger()).cb : demoXP();
  const head = `<div class="card sesshead" id="sessHead"><div class="sh1"><div><b>${esc(s.place.name)}</b>${vBadge(V2K[effVerify(effSess(s))])}${sfBadge(s.selfie)}</div><span class="clockbig" data-clock="sess">${clock(Date.now() - s.startedAt)}</span></div>
    <div class="est" style="margin-top:10px"><span>예상 경험치</span><em id="sessEst">+${fmt(est)} XP</em></div>
    ${s.rapid === 'batch' ? `<div class="cbline" id="batchLine"><span>한꺼번에 적는 기록 · <b>자가 기록</b>으로 저장돼요</span></div>` : centerLine(s)}
    ${boostOn() ? `<div class="muted boostline">${boostLabel()} 부스터 적용 중</div>` : ''}
    ${held ? holdWarnHTML(s, true) : ''}
    <div class="muted autoend" id="autoEnd">마지막 기록 뒤 3시간 동안 아무것도 안 적으면 자동으로 끝나요 · 마지막 기록 ${new Date(s.lastAt).toTimeString().slice(0, 5)}</div></div>`;
  const empty = !s.items.length ? `
  ${lr ? `<button class="card routine" data-act="routine" id="routineCard"><div class="h3">지난번 루틴 그대로</div><b>${md(lr.date)} · ${esc(placeBase(lr.place))}</b><div class="rchips">${lr.items.filter(i => EX[i.ex]).map(i => `<span>${EX[i.ex].name}</span>`).join('')}</div><span class="rgo">한 번에 불러오기 ›</span></button>` : ''}
  <div class="card" id="recoCard"><div class="h3">오늘 추천</div>${recs.map(([id, why]) => `<button class="prow tap" data-act="addEx" data-v="${id}"><div><b>${EX[id].name}</b><small>${why}</small></div><span class="plus">+</span></button>`).join('')}</div>`
  : `<div class="card" id="sessList">${s.items.map(it => { const e = EX[it.ex], ds = (it.sets || []).filter(x => x.done);
      const sub = e.mode === 'cardio' ? ((it.min ? `${it.min}분 · ${({ light: '가벼움', normal: '보통', hard: '힘듦' })[it.level || 'normal']}${it.km ? ` · ${it.km}km` : ''}` : '') + (it.run ? `${it.min ? ' · ' : ''}타이머 도는 중 ${clock(Date.now() - it.run.startAt + (it.run.offset || 0))}` : it.min ? '' : '아직 기록 전'))
        : e.mode === 'lesson' ? `${it.min}분 · 선생님 확인` : ds.length ? setsTxt(e, ds) : (it.plan ? `지난번 ${it.plan}` : '아직 0세트');
      return `<button class="prow tap" data-act="openEx" data-v="${it.ex}"><div><b>${e.name}${ds.some(x => x.pr) ? ' <span class="prtag">PR</span>' : ''}</b><small>${esc(sub)}</small></div><span class="cnt">${e.mode === 'cardio' || e.mode === 'lesson' ? (it.min ? '✓' : it.run ? '⏱' : '') : `${ds.length}세트`}</span></button>`; }).join('')}</div>`;
  const sfPct = CFG.SELFIE_BONUS.pct, selfieBtn = s.selfie ? sfCard('sfSess', s.photo, '오운완 셀카 찍음', `저장하면 경험치 +${sfPct}%${r.selfieXP ? ` (+${fmt(r.selfieXP)})` : ''}가 들어가요`, 'session')
    : selfieClaims() ? `<div class="muted sfnote" id="sfSess">오늘 오운완 인증 완료 ✓ · 셀카 보너스는 하루 1번이에요</div>`
    : `<button class="btn ghost camb" data-act="selfie" data-v="session" id="sfSessBtn">${CAM}오운완 셀카 <span class="muted">찍으면 경험치 +${sfPct}% · 하루 1번 · 나만 봐요</span></button>`;
  const demos = [['none','실제 기록대로'],['next','다음 레벨까지 (짧은 연출)'],['boundary','10레벨 경계 넘기 (큰 연출)'],['multi','+5레벨 한꺼번에 (묶음)']];
  return `${subHead('오늘 운동')}<div class="sec"><div class="honest" id="honestTop"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg><span>한 만큼만 솔직하게 기록해 주세요. 기록이 정확해야 AI 코칭이 내 몸에 맞게 나와요.</span></div>${head}${empty}
  ${selfieBtn}
  <div class="card" style="margin-top:12px"><label class="lightrow" style="margin:0;padding:0;border:0"><input type="checkbox" data-act="light" ${s.light ? 'checked' : ''}><span><b>오늘은 살살 한 날</b><small>재활·컨디션 조절로 일부러 가볍게 했다면 체크해요. 경험치는 그대로 받아요.</small></span></label></div>
  <div class="card demo"><div class="h3">🧪 시연 도구 — 저장 시 얻는 경험치</div><div class="chips">${demos.map(([k, l]) => `<button class="chip ${S.demo===k?'on':''}" data-act="demo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">현재 Lv.${S.level}${S.demo === 'none' ? '' : ' · 연출 시연은 상한 미적용'}</div>
  <div class="h3" style="margin-top:12px">저장 후 표정 (결정 21)</div><div class="chips">${[['auto','기록대로 판정'],['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${S.moodDemo===k?'on':''}" data-act="mdemo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px" id="moodPreview">${moodPreviewText()}</div>
  <div class="h3" style="margin-top:12px">상태 흉내</div><div class="chips"><button class="chip" data-act="autoEndDemo" id="autoEndDemo">3시간 무입력 → 자동 종료</button><button class="chip ${S.holdDemo ? 'on' : ''}" data-act="holdDemo">세트 간격 20초 미만 3회(보류)</button></div>
  <div class="h3" style="margin-top:12px">검증 등급 바꿔 보기</div><div class="chips">${[['V1',`입점센터 입장(×${CFG.VERIFY.V1})`],['V0',`비입점·집·야외(×${CFG.VERIFY.V0})`],['V3',`레슨 확정(×${CFG.VERIFY.V3})`]].map(([k, l]) => `<button class="chip ${s.verify===k?'on':''}" data-act="vdemo" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="honest end" id="honestEnd">적은 그대로 AI 코칭에 쓰여요. 오늘도 수고했어요!</div></div>
  <div class="endzone"><div class="endbar" id="endBar"><button class="btn ghost" data-act="sub" data-v="pick" id="addExBtn">+ 운동 추가</button><button class="btn" data-act="endAsk" id="endBtn">${!done.length && !s.items.some(i => i.run) && S.demo === 'none' ? '운동 끝' : held ? '운동 끝 · 기록 저장' : `운동 끝 · +${fmt(est)} XP 저장`}</button></div></div>`;
}
/* 결정 36 ⑥ C3 위치별 보너스 줄 — 입점센터 적용 중 / 이번 주 900 다 참 / 그 밖 장소 안내 / 레슨은 줄 없음 */
function centerLine(s) {
  if (s.verify === 'V3') return '';
  if (s.verify === 'V1') return centerWeek() >= CFG.CENTER_BONUS.weekCap ? `<div class="cbline full" id="cbLine"><span>이번 주 입점센터 보너스 다 모았어요</span></div>` : `<div class="cbline on" id="cbLine"><span><b>입점센터</b> · 경험치 1.5배 적용 중</span></div>`;
  return `<div class="cbline" id="cbLine"><span>입점센터에서 하면 경험치 1.5배</span>${findCenterBtn('cbFind')}</div>`;
}
function recommend(s) {
  const wkParts = sessCtx().weekParts, f = freq(), have = new Set(s.items.map(i => i.ex)), out = [];
  const home = s.place.kind !== 'center', ok = id => EX[id] && !have.has(id) && EX[id].cat !== 'lesson' && (!home || EX[id].home) && !out.some(o => o[0] === id);
  const miss = PARTS.filter(p => p !== '유산소' && !wkParts.includes(p));
  for (const p of miss) { const id = [...f, ...EX_DICT.map(e => e.id)].find(x => ok(x) && EX[x].part === p); if (id) { out.push([id, `이번 주 아직 안 한 부위 · ${p}`]); break; } }
  f.filter(ok).slice(0, 3 - out.length - (CENTER_POP[s.place.name] ? 1 : 0)).forEach(id => out.push([id, '자주 해요']));
  (CENTER_POP[s.place.name] || []).filter(ok).slice(0, 3 - out.length).forEach(id => out.push([id, '이 센터에서 많이 해요']));
  EX_DICT.map(e => e.id).filter(ok).slice(0, 3 - out.length).forEach(id => out.push([id, EX[id].part]));
  return out.slice(0, 3);
}
function moodPreviewText() {
  const s = S.session; if (!s) return '';
  const r = judgeIntensity(s.items, { hist: histVol(), today: TODAY, light: s.light, comeback: lastWorkoutDays() >= CFG.COMEBACK_DAYS, lowRun: S.lowRun });
  const why = r.verdict === 'na' ? `${r.why} → 판정 없음` : `${r.why} → ${MOOD[r.verdict].label}`;
  return `기록대로면: ${why} (60% 미만 아쉬운 · 130% 이상 신남) · 레벨·경험치·연속엔 영향 없음`;
}

/* ===== C4 운동 선택 (v1.23 C안: 최근 한 운동 → 기구 종류 탭 → 부위 → 목록) ===== */
function vPick() {
  const s = S.session; if (!s) return vWorkout();
  const lr = lastRoutine(s.place.name), rec = recentEx(), pop = (CENTER_POP[s.place.name] || []).filter(id => EX[id] && !EX[id].off);
  const chip = id => `<button class="chip ${s.items.some(i => i.ex === id) ? 'on' : ''}" data-act="addEx" data-v="${id}">${esc(EX[id].name)}</button>`;
  const routine = lr && !s.items.length ? `<button class="chip rtchip" data-act="routine" id="routineChip">↻ 지난번 루틴 ${lr.items.filter(i => EX[i.ex] && EX[i.ex].cat !== 'lesson').length}개</button>` : '';
  return `${subHead('운동 추가', 'session', '오늘 운동')}<div class="sec">
  <div class="card" style="padding:12px 16px"><div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="exQ" placeholder="운동 이름 검색 (예: 벤치, 사레레)" value="${esc(S.q)}" autocomplete="off"></div></div>
  ${rec.length || routine ? `<div class="card recent" id="recentRow"><div class="h3">최근 한 운동</div><div class="chips hscroll gchips" id="recentChips">${routine}${rec.map(chip).join('')}</div></div>` : ''}
  <div class="seg gear" id="gearTabs">${GEAR_TABS.map(([k, l]) => `<button class="${S.gear === k ? 'on' : ''}" data-act="gear" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="chips parts" id="partChips">${['all', ...PARTS].map(p => `<button class="chip ${S.part === p ? 'on' : ''}" data-act="part" data-v="${p}">${p === 'all' ? '모든 부위' : p}</button>`).join('')}</div>
  <div class="card" id="exList">${exListHTML()}</div>
  ${pop.length ? `<div class="card"><div class="h3">이 센터에서 많이 하는 운동</div><div class="chips gchips">${pop.map(chip).join('')}</div></div>` : ''}
  <div class="muted">레슨(PT·필라테스·GX)은 선생님이 확정하면 자동으로 기록돼요</div></div>`;
}
/* 검색어가 있으면 탭·부위와 상관없이 전체에서 찾는다(집·야외 장소 제한만 유지) */
function exListHTML() {
  const s = S.session, q = S.q.trim().replace(/\s/g, ''), home = s && s.place.kind !== 'center', place = s ? s.place.name : '';
  const list = EX_DICT.concat(S.custom).filter(e => e.cat !== 'lesson' && !e.off && (!home || e.home || e.custom) && machineOk(e, place)
    && (q ? (e.name + (e.al || '')).replace(/\s/g, '').toLowerCase().includes(q.toLowerCase())
          : (S.gear === 'all' || e.cat === S.gear) && (S.part === 'all' || e.part === S.part)));
  const kind = e => (e.custom ? '내가 추가 · ' : '') + (CAT_NAME[e.cat] || '맨몸·소도구');
  const rows = list.map(e => `<button class="prow tap" data-act="addEx" data-v="${e.id}">${exThumb(e)}<div><b>${esc(e.name)}</b><small>${kind(e)} · ${e.part}${e.mode === 'cardio' ? ' · 시간' : e.mode === 'wr' ? ' · 무게×횟수' : e.mode === 't' ? ' · 시간' : ' · 횟수'}</small></div><span class="plus">${s && s.items.some(i => i.ex === e.id) ? '✓' : '+'}</span></button>`).join('');
  const same = q && EX_DICT.concat(S.custom).some(e => e.name.replace(/\s/g, '') === q);
  const addCustom = q && !same ? `<button class="prow tap" data-act="customEx" id="customEx"><div><b>«${esc(S.q.trim())}» 직접 추가</b><small>기구 종류를 고르면 무게·횟수로 기록할 수 있어요</small></div><span class="plus">+</span></button>` : '';
  const empty = !q && S.gear === 'machine' && home ? `${s.place.name === '집' ? '집' : '야외'}에서는 머신 운동이 없어요` : '찾는 운동이 없어요.';
  const head = q ? `<div class="muted qall">${list.length ? `전체 운동에서 찾았어요 · ${list.length}개` : '전체 운동에서 찾아봤는데 없어요'}</div>` : '';
  return head + (rows || (q ? '' : `<div class="muted" style="padding:10px 0">${empty}</div>`)) + addCustom
    + (home ? `<div class="muted" style="padding-top:10px">${s.place.name === '집' ? '집' : '야외'}에서 할 수 있는 운동만 보여요</div>` : '');
}
/* 직접 추가(v1.23): 기구 종류에 따라 기록 방식이 정해진다 — 머신·프리웨이트 = 무게×횟수(웨이트 1세트 경험치), 맨몸 = 횟수, 유산소·집·야외 = 시간 */
const CX_CATS = [['machine', '머신', 'wr'], ['free', '프리웨이트', 'wr'], ['body', '맨몸', 'r'], ['cardio', '유산소', 'cardio'], ['out', '집·야외', 'cardio']];
const CX_HOW = { wr: '무게(kg)×횟수로 기록 · 세트마다 경험치', r: '횟수로 기록 · 세트마다 경험치', cardio: '시간(분)으로 기록 · 1분마다 경험치' };
function cxSheet() {
  const c = S.cx; if (!c) return shClose();
  const mode = CX_CATS.find(x => x[0] === c.cat)[2];
  sheet(`<div class="h2" style="margin-bottom:4px">«${esc(c.name)}» 직접 추가</div><div class="muted">나만 보는 운동이에요 · 다음부터 «최근 한 운동»에 나와요</div>
  <div class="h3" style="margin-top:14px">기구 종류</div><div class="chips gchips" id="cxCat">${CX_CATS.map(([k, l]) => `<button class="chip ${c.cat === k ? 'on' : ''}" data-act="cxCat" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="h3" style="margin-top:12px">주로 쓰는 부위</div><div class="chips gchips" id="cxPart">${PARTS.map(p => `<button class="chip ${c.part === p ? 'on' : ''}" data-act="cxPart" data-v="${p}">${p}</button>`).join('')}</div>
  <div class="muted" id="cxHow" style="margin-top:12px">${CX_HOW[mode]}</div>
  <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="cxOk" id="cxOk">추가하고 기록</button></div>`);
}
function cxCreate() {
  const c = S.cx; if (!c) return;
  const mode = CX_CATS.find(x => x[0] === c.cat)[2], cid = 'custom_' + Date.now().toString(36);
  const e = { id: cid, name: c.name, cat: c.cat, part: c.part, sub: [], mode, xpk: mode === 'wr' ? 'weight' : mode === 'cardio' ? 'cardio' : 'body', custom: 1,
    home: c.cat === 'machine' ? undefined : 1, ...(mode === 'wr' ? { w: 10, step: 2.5, bw: 3 } : {}) };
  S.custom.push(e); EX[cid] = e; S.cx = null; S.q = ''; shClose();
  toast(`«${e.name}» 추가 · ${CAT_NAME[e.cat]} · ${e.part}`); return addEx(cid);
}

/* ===== C6 세트 기록 ===== */
function curItem() { return S.session && S.session.items.find(i => i.ex === S.cur); }
function vSet() {
  const it = curItem(); if (!it) return vSession();
  const e = EX[it.ex], d = it.draft, ds = it.sets.filter(x => x.done), prev = histOf(it.ex).find(h => h.sets && h.sets.length);
  const lastTop = prev ? Math.max(...prev.sets.map(x => x.w || 0)) : 0, chk = checkWeight(e, d.w, { bodyweight: S.bodyweight, bestW: bestW(it.ex), lastTopW: lastTop });
  const best = histOf(it.ex).flatMap(h => h.sets || []).sort((a, b) => setScore(e, b) - setScore(e, a))[0];
  const restLeft = S.rest && S.rest.ex === it.ex ? Math.max(0, Math.ceil((S.rest.until - Date.now()) / 1000)) : 0;
  return `${subHead(e.name, 'session', '오늘 운동')}<div class="sec">
  ${S.prFx && S.prFx.ex === it.ex && Date.now() - S.prFx.at < 6000 ? `<div class="card prburst ${Date.now() - S.prFx.at < 700 ? 'anim' : ''}" id="prBurst"><div class="cwrap excited">${charFit(S.type, S.level, 64, 'excited')}<i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i></div><div><b>개인 기록 갱신!</b><small>${esc(e.name)} ${esc(S.prFx.txt)}${S.prFx.xp ? ` · 저장하면 +${CFG.XP.pr} XP` : ' · 오늘 PR 보너스는 3번까지예요'}</small></div></div>` : ''}
  <div class="card"><div class="muted">${e.part}${e.sub.length ? ` · ${e.sub.join('·')}` : ''} · ${CAT_NAME[e.cat] || '내가 추가'}</div>
  <div class="prevrec" id="prevRec">${prev ? `지난번 ${md(prev.date)} · ${setsTxt(e, prev.sets)}` : '이 운동은 처음이에요 · 편한 무게로 시작해요'}</div>
  ${best ? `<div class="muted">최고 기록 ${setTxt(e, best)}</div>` : ''}
  <div class="setsteps">${e.mode === 'wr' ? stepper('stw', kg(d.w).replace('kg', ''), '무게', 'kg', wInput(d.w, 'id="wIn" data-w="draft"')) + `<div class="qrow" id="qW">${lastTop ? `<button class="chip" data-act="qw" data-v="=${lastTop}">지난번 ${+lastTop.toFixed(1)}kg</button>` : ''}<button class="chip" data-act="qw" data-v="5">+5kg</button><button class="chip" data-act="qw" data-v="10">+10kg</button></div>` : ''}${e.mode === 't' ? stepper('sts', d.s, '시간', '초', nInput('s', d.s, 'id="sIn" data-w="draft"')) + `<div class="qrow" id="qS"><button class="chip" data-act="qs" data-v="30">+30초</button><button class="chip" data-act="qs" data-v="60">+60초</button></div>` : stepper('str', d.r, '횟수', '회', nInput('r', d.r, 'id="rIn" data-w="draft"'))}</div>
  ${chk.jump && !chk.unreal ? `<div class="warn" id="safetyWarn">지난번보다 ${chk.jumpPct}% 무거워요. 처음 1~2회는 가볍게 몸을 풀고, 무리하지 말고 보조를 받으세요</div>` : ''}
  ${(e.mode === 'wr' || e.mode === 'r') && d.r < CFG.MIN_REPS ? `<div class="minreps" id="minReps">${CFG.MIN_REPS}회 이상부터 경험치</div>` : ''}
  ${sessHeld(S.session) ? holdWarnHTML(S.session, false) : ''}
  <button class="btn big ${Date.now() - (S.setAt || 0) < SET_LOCK_MS ? 'wait' : ''}" data-act="setDone" id="setDone">${ds.length + 1}세트 완료</button>
  <div class="muted" style="text-align:center;margin-top:6px;word-break:keep-all" id="setHint">숫자를 누르면 직접 적을 수 있어요 · +/−를 길게 누르면 빨리 바뀌어요</div></div>
  <div class="card rest ${restLeft ? '' : 'idle'}" id="restBox">${restHTML(restLeft)}</div>
  ${ds.length ? `<div class="card" id="doneSets"><div class="h3">오늘 한 세트 <span class="h3sub">· 줄을 누르면 고치거나 지울 수 있어요</span></div>${ds.map((x, i) => `<button class="setrow tapset" data-act="setEdit" data-i="${i}" id="setRow${i}" aria-label="${i + 1}세트 고치기"><span>${i + 1}세트</span><b>${setTxt(e, x)}</b><span class="srtags">${xpEligible(e, x) ? '' : '<small class="noxp">경험치 제외</small>'}${x.pr ? '<span class="prtag">PR</span>' : ''}<i class="sredit">수정 ›</i></span></button>`).join('')}</div>` : ''}
  <div class="grid2"><button class="btn ghost" data-act="sub" data-v="pick" style="margin-top:0">다음 운동 고르기</button><button class="btn ghost" data-act="sub" data-v="session" style="margin-top:0">오늘 운동 보기</button></div></div>`;
}
function restHTML(left) {
  if (!left) return `<div class="rrow"><span class="muted">휴식 타이머</span><b>${clock(CFG.REST_SEC * 1000)}</b></div><div class="muted">세트를 완료하면 ${CFG.REST_SEC}초 휴식이 자동으로 시작돼요</div>`;
  const tot = S.rest.total;
  return `<div class="rrow"><span>휴식 중</span><b data-clock="rest">${clock(left * 1000)}</b></div><div class="bar thin"><i data-restbar style="width:${Math.round(left / tot * 100)}%"></i></div>
  <div class="chips" style="margin-top:8px"><button class="chip" data-act="rest" data-v="-15">−15초</button><button class="chip" data-act="rest" data-v="15">+15초</button><button class="chip" data-act="rest" data-v="0">건너뛰기</button></div>`;
}

/* ===== C6b 유산소 ===== */
function vCardio() {
  const it = curItem(); if (!it) return vSession();
  const e = EX[it.ex], c = it.draft, run = it.run, el = run ? (Date.now() - run.startAt + (run.offset || 0)) : 0, prev = histOf(it.ex).find(h => h.min);
  const lv = [['light', '가벼움'], ['normal', '보통'], ['hard', '힘듦']];
  return `${subHead(e.name, 'session', '오늘 운동')}<div class="sec">
  <div class="seg"><button class="${c.mode === 'timer' ? 'on' : ''}" data-act="cmode" data-v="timer">타이머</button><button class="${c.mode === 'input' ? 'on' : ''}" data-act="cmode" data-v="input">직접 입력</button></div>
  <div class="card"><div class="prevrec">${prev ? `지난번 ${md(prev.date)} · ${prev.min}분${prev.km ? ` · ${prev.km}km` : ''}` : '이 운동은 처음이에요'}</div>
  ${c.mode === 'timer' ? `<div class="clockxl" data-clock="cardio" id="cardioClock">${clock(el)}</div>
    ${run ? `<button class="btn big" data-act="cStop" id="cStop">종료 · 시간 저장</button><button class="chip demochip" data-act="cFwd">🧪 10분 빨리 감기</button>` : `<button class="btn big" data-act="cStart" id="cStart">${it.min ? '다시 시작' : '시작'}</button>`}
    ${it.min ? `<div class="muted" style="text-align:center;margin-top:8px">저장된 시간 ${it.min}분</div>` : ''}`
  : `<div class="setsteps">${stepper('cmin', c.min, '시간', '분', nInput('min', c.min, 'id="minIn" data-w="draft"'))}<div class="qrow" id="qMin">${[10, 20, 30, 45, 60].map(n => `<button class="chip ${c.min === n ? 'on' : ''}" data-act="qmin" data-v="${n}">${n}분</button>`).join('')}</div></div>${run ? `<div class="warn" id="runNote">타이머가 돌고 있어요. 여기서 저장하면 타이머 시간(<span data-clock="cardio">${clock(el)}</span>) 대신 <b>${c.min}분</b>으로 저장돼요</div>` : ''}<div class="muted" style="margin-top:8px;word-break:keep-all">숫자를 누르면 직접 적을 수 있어요 · 한 번에 최대 ${CFG.LIM.cardioMaxMin}분까지 기록돼요</div>`}
  </div>
  <div class="card"><div class="h3">얼마나 힘들었어요?</div><div class="chips" id="cLevel">${lv.map(([k, l]) => `<button class="chip ${c.level === k ? 'on' : ''}" data-act="clevel" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">캐릭터 표정에만 써요 · 경험치는 시간으로만 계산해요</div>
  <details class="more" ${c.open ? 'open' : ''} data-act="cmore"><summary>거리·속도·경사 <span class="muted">(선택)</span></summary>
    ${stepper('ckm', c.km.toFixed(1), '거리', 'km')}${stepper('ckmh', c.kmh.toFixed(1), '속도', 'km/h')}${e.id === 'treadmill' ? stepper('cinc', c.inc, '경사', '%') : ''}
    ${c.kmh > 25 ? '<div class="warn">25km/h 넘는 속도는 25로 계산해요</div>' : ''}</details></div>
  <button class="btn" data-act="cSave" id="cSave">${c.mode === 'input' ? `${c.min}분 저장` : '저장'}</button></div>`;
}

/* ===== C7 오늘 요약 · 경험치 ===== */
/* v1.40(QA 중2): 줄을 다 더하면 합계가 되게 — 곱하기 줄(자가 기록 ×0.4·연속 ×1.20)도 «그래서 얼마»를 금액으로 보여 준다.
   ×1 인 줄은 숨긴다(QA 중3: «1.5배 적용 중»인데 «×1»로 보여 헷갈림) */
function xpRows(rec) {
  const b = rec.br; if (!b) return '';
  if (b.demoXP) return `<div class="xrow"><span>연출 미리보기용 경험치</span><b>+${fmt(b.demoXP)}</b></div>`;
  const R = [], add = (l, n, cls = '', k = '') => R.push({ l, n, cls, k }), note = l => R.push({ l, n: null, cls: 'note' });
  const volPct = Math.round((CFG.VOL_BONUS.mult - 1) * 100);
  b.lines.forEach(([l, n, u, x]) => add(`${l} ${n}${u}`, Math.round(x)));
  (b.bonusRows || []).forEach(([name, x]) => add(`평소보다 많이 함 · ${esc(name)} +${volPct}%`, Math.round(x), 'vol', 'vol'));
  if (b.short) note(`5회 미만 ${b.short}세트는 기록만 남았어요`);
  if (b.noBase && b.noBase.length && b.lines.length) note(`기록 5번 쌓이면 «평소보다 많이 한 날 +${volPct}%»가 열려요`);
  if (b.first) add('오늘 첫 세트', b.first); if (b.complete || b.dayDone) add('운동 완료', (b.complete || 0) + (b.dayDone || 0));   // v1.42: 50(배율 적용) + 고정 67 을 한 줄로
  const s0 = (b.base || 0) + (b.first || 0) + (b.complete || 0), afterV = Math.round(s0 * b.vm), vAmt = afterV - Math.round(s0), sAmt = (b.mult ?? afterV) - afterV;
  if (b.vm !== 1) add(`${VERIFY_LABEL[b.v].replace(/ ✓| ★ 2배/, '')} ×${b.vm}`, vAmt, 'mul', 'v');
  if (b.sm !== 1) add(b.comeback ? `오랜만에 한 운동 ×${b.sm.toFixed(2)}` : `연속 ${b.streakW ?? S.streakWeeks}주 ×${b.sm.toFixed(2)}`, sAmt, 'mul', 's');
  if (b.catchUp) add('오늘 먼저 한 운동과 합쳐 평소보다 많이 함', b.catchUp, 'vol');
  if (b.boostPart) add(`×${b.bm || CFG.BOOST.mul} 부스터 · 한도 없음`, b.boostPart, 'gold');
  if (b.newXP) add(`새 부위 (${b.newParts.join('·')})`, b.newXP); if (b.prXP) add(`개인 기록 ${b.prN}번`, b.prXP);
  if (b.goal) add('주간 보너스(예전 규칙)', b.goal);   // v1.41 이전 기록에만 남아 있음
  if (b.selfieXP) add(`📸 오운완 셀카 · 기본 ${fmt(b.baseXP)}의 ${CFG.SELFIE_BONUS.pct}%`, b.selfieXP, 'gold sf');
  /* 반올림 차이(맨몸 +20% 같은 소수)는 곱하기 줄 → 평소보다 많이 함 줄 순으로 흡수해 줄 합 = 받기 전 합계(raw) */
  const fix = Math.round(rec.raw ?? b.raw ?? 0) - R.reduce((t, x) => t + (x.n || 0), 0), tgt = fix ? (R.find(x => x.k === 's') || R.find(x => x.k === 'v') || [...R].reverse().find(x => x.k === 'vol')) : null;
  if (tgt) tgt.n += fix;
  if (rec.xpCenter || rec.cbCut) { add('입점센터 보너스', rec.xpCenter || 0, 'center');
    note(rec.cbCut ? `이번 주 보너스 ${CFG.CENTER_BONUS.weekCap.toLocaleString()} 다 모았어요 · ${fmt(rec.cbCut)} 빠짐` : `기본 경험치 ${fmt(rec.centerBase)}의 ${CFG.CENTER_BONUS.pct}%를 더 받았어요`); }
  if (rec.cut) add(rec.cutReason === 'week' ? '운동 경험치 이번 주 한도' : '운동 경험치 오늘 한도', -rec.cut, 'cut');
  if (rec.held) { add('24시간 뒤에 받을 경험치', -rec.held, 'cut'); if (rec.heldCb) note(`입점센터 보너스 ${fmt(rec.heldCb)}도 그때 함께 들어와요`); }
  if (b.selfieXP && rec.cut) note(rec.selfieIn ? `한도에 걸려 셀카 몫은 ${fmt(rec.selfieIn)}만 들어갔어요` : '한도에 걸려 셀카 몫은 안 들어갔어요(오늘 인증은 완료)');
  return R.map(x => `<div class="xrow ${x.cls}"><span>${x.l}</span><b>${x.n == null ? '' : (x.n < 0 ? '−' : '+') + fmt(Math.abs(x.n))}</b></div>`).join('');
}
function vResult() {
  const rec = S.records.find(r => r.id === S.lastResult) || S.records[S.records.length - 1];
  const past = rec && rec.id === S.lastResult && typeof rec.id === 'number' && ymd(new Date(rec.id)) !== rec.date;   // 저장한 날 ≠ 기록 날짜   // 자정을 넘겨 끝낸 운동 = 시작한 날 기록
  const m = S.mood && S.mood.date === (past ? rec.date : TODAY) ? S.mood : null, v = m ? (m.quiet ? 'na' : m.verdict) : 'na', t = S.type, lv = S.level;
  const note = { low: '평소보다 가볍게 한 날이라 <b>오늘 하루만</b> 표정이 살짝 아쉬워요. 레벨·경험치·연속은 <b>그대로</b>예요.',
    normal: '평소만큼 했어요. 캐릭터는 평소 표정(쌩쌩) 그대로예요.',
    high: '평소보다 훨씬 많이 했어요! <b>오늘 하루</b> 캐릭터가 신나요. 내일은 회복도 챙겨요.',
    na: m && m.quiet ? '요즘 아쉬운 날이 이어져서 표정 대신 한마디만 남겨요. 레벨·경험치는 그대로예요.' : `${esc(m ? m.why || '기록이 없어서' : '기록이 없어서')} 오늘은 평소 표정 그대로예요.` }[v];
  const show = (m && v !== 'normal' && v !== 'na') ? m : null;
  const ev = rec && rec.lvUp, canSelfie = rec && !rec.held && !rec.demo && !rec.photo && !rec.selfieXP, sfDone = rec && !rec.demo && rec.selfieXP > 0;
  return `${subHead(past ? `${md(rec.date)} 운동 요약` : '오늘 운동 요약')}<div class="sec">
  ${past ? `<div class="notice" id="pastNote"><span>자정을 넘겨 끝냈어요 · 운동을 시작한 날(${md(rec.date)}) 기록으로 저장했어요</span></div>` : ''}
  ${S.savedNote ? `<div class="notice ok" id="savedNote"><span>✓ ${esc(S.savedNote)}</span></div>` : ''}
  ${rec && rec.batch ? `<div class="notice" id="batchNote"><span>운동을 마치고 한꺼번에 적은 기록이라 <b>자가 기록</b>으로 저장했어요</span></div>` : ''}
  ${rec && rec.auto ? `<div class="notice" id="autoNote"><span>3시간 동안 적은 게 없어서 자동으로 끝냈어요 · 마지막으로 적은 시각에 끝난 걸로 저장했어요</span></div>` : ''}
  <div class="card result ${v}" id="resultCard"><div class="cwrap big ${v}">${charHTML(t, lv, 170, true, exprOfMood(show))}</div>
    <div class="rname"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span>${show ? moodPill(show) : '<span class="pill tier1">평소 표정</span>'}</div>
    <div class="say moodsay ${v}" id="resultSay">${esc(m && m.line ? m.line : coachLine())}</div>
    <div class="est"><span>오늘 얻은 경험치</span><em class="${S.bump ? 'bump' : ''}" id="resultXP">+${(rec ? rec.xp : 0).toLocaleString()} XP</em></div>
    <div class="rmeta">${rec ? vBadge(rec.v) + sfBadge(rec.selfieXP > 0) : ''}<span class="muted">${rec ? esc(rec.summary) : ''}</span></div>
    ${rec && rec.held ? `<div class="notice hold" id="holdNote"><span>세트 사이가 ${CFG.SET_GAP_SEC}초보다 짧아서 경험치 ${fmt(heldAll(rec))} XP는 24시간 뒤에 들어와요. 기록은 그대로 저장됐어요.</span><button class="btn sm ghost demoonly" data-act="release" data-id="${rec.id}">🧪 24시간 뒤</button></div>` : ''}
    ${rec && rec.cut ? `<div class="muted capline" id="resultCap">${rec.cutReason === 'week' ? `이번 주에 받을 수 있는 운동 경험치 ${CFG.WEEK_CAP.toLocaleString()} XP를 다 채웠어요` : `오늘 받을 수 있는 운동 경험치 ${(rec.v === 'self' ? CFG.DAY_CAP_V0 : CFG.DAY_CAP).toLocaleString()} XP를 다 채웠어요`} · 넘친 ${fmt(rec.cut)} XP는 안 들어갔어요. 기록·연속은 그대로 쌓여요</div>` : ''}
    ${rec && rec.xpBoost ? `<div class="muted capline" id="resultBoost">×${(rec.br && rec.br.bm) || CFG.BOOST.mul} 부스터로 늘어난 +${fmt(rec.xpBoost)} XP는 한도 없이 다 들어갔어요 💰</div>` : ''}
    ${rec && !rec.demo && rec.centerIf > 0 ? `<div class="cbif" id="cbIf"><span>입점센터였다면 <b>+${fmt(rec.centerIf)}</b> 경험치</span>${findCenterBtn('cbIfFind')}</div>` : ''}
    <div class="bar"><i style="width:${lv >= 99 ? 100 : Math.max(0, Math.round(S.xp / need(lv) * 100))}%"></i></div><div class="muted">${lv >= 99 ? '최고 레벨이라 레벨은 더 오르지 않아요 · 받은 경험치는 이번 주 랭킹에 그대로 들어가요' : `Lv.${lv + 1}까지 ${Math.max(0, need(lv) - S.xp).toLocaleString()} XP`}</div>
    ${ev ? `<div class="ptline" id="ptLine">Lv.${ev.from} → ${ev.to} 레벨업</div>` : ''}
    <div class="muted" style="margin-top:6px" id="resultNote">${note}</div>
    ${m && m.ratio != null && S.moodDemo === 'auto' ? `<div class="muted" style="margin-top:4px">평소의 ${Math.round(m.ratio * 100)}%만큼 했어요 · 오늘 한 운동끼리만 지난 10번 기록과 비교했어요</div>` : ''}</div>
  ${rec && !rec.demo ? `<button class="btn sharebtn" data-act="share" data-id="${rec.id}" id="shareBtn">${NJ_SHARE_ICON_SVG()}자랑하기</button><div class="muted sharecap">오늘 한 운동을 카드로 만들어 자랑해요</div>` : ''}
  ${canSelfie ? selfieCta(rec) : sfDone ? sfCard('sfDone', rec.photo, `오운완 인증 완료 · +${fmt(rec.selfieIn ?? rec.selfieXP)} XP`, rec.photo ? '사진은 나한테만 보여요 · 셀카 보너스는 하루 1번' : '사진은 지웠어요 · 받은 보너스는 그대로예요', 'result')
    : rec && !rec.demo && rec.photo ? sfCard('sfDone', rec.photo, '오운완 사진 저장됨', '사진은 나한테만 보여요 · 이번엔 보너스 경험치가 붙지 않았어요', 'result') : ''}
  ${rec && rec.br ? `<div class="card" id="xpCard"><div class="h3">경험치 내역</div>${xpRows(rec)}<div class="xrow total"><span>다 더하면</span><b>+${fmt(rec.xp)} XP</b></div></div>` : ''}
  <div class="card demo"><div class="h3">🧪 시연 — 다른 결과로 보기</div><div class="chips">${[['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${v===k?'on':''}" data-act="mset" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">표정은 얼굴(눈·입·볼)만 바뀌어요 · 레벨·경험치와는 상관없어요</div></div>
  <button class="btn ghost" data-act="back" id="resultOk">확인 · 운동기록 탭으로</button>
  <button class="btn ghost" data-tab="home" style="margin-top:8px">홈에서 카드 보기</button></div>`;
}
/* 결과 화면에서 셀카를 찍으면 더 받는 경험치(결정 37) — 같은 기록을 셀카 붙여 다시 계산 → 차이를 지금 남은 한도 안에서 */
function selfieCalc(rec) {
  if (!rec || !rec.br || !rec.ctx || rec.br.demoXP) return null;
  const r2 = sessionXP({ verify: K2V[rec.v], selfie: SELFIE_SHOT, items: rec.items, prCount: rec.prCount }, { ...rec.ctx, selfieToday: selfieClaims(rec.id) });
  const delta = Math.max(0, r2.raw - rec.raw), bp = Math.max(0, r2.boostPart - (rec.br.boostPart || 0));
  const g = capGain({ raw: delta, boostPart: bp, selfieXP: delta - bp }, ledger(), vk(rec.v) === 'self');
  return { r2, delta, g: g.gained, cut: g.cut, reason: g.reason };
}
const selfieGain = rec => { const c = selfieCalc(rec); return c ? c.g : 0; };
function selfieCta(rec) {
  const c = selfieCalc(rec), why = c && c.r2.selfieWhy;
  const sub = !c ? '사진은 나만 보는 기록으로 남아요'
    : why === 'today' ? '오늘은 이미 오운완 보너스를 받았어요 · 사진은 나만 보는 기록으로 남아요'
    : why === 'norecord' ? '5회 이상 세트나 유산소 기록이 있어야 보너스가 붙어요 · 사진은 나만 봐요'
    : c.g ? `찍으면 경험치 +${CFG.SELFIE_BONUS.pct}%! 예상 +${fmt(c.g)} XP · 하루 1번 · 나만 봐요`
    : '오늘·이번 주 운동 경험치를 다 모아서 찍어도 더 붙지 않아요 · 사진은 나만 봐요';
  return `<button class="card selfiecta" data-act="selfie" data-v="result" id="selfieCta">${CAM}<div><b>오운완 셀카 찍기</b><small>${sub}</small></div><span class="rgo">›</span></button>`;
}

/* 찍은 셀카 카드 — 저장 전(세션)·저장 후(요약) 공통. 사진이 없으면(지운 뒤) 썸네일 없이 «다시 찍기»만 */
function sfCard(id, photo, title, sub, from) {
  return `<div class="card sfcard${from === 'result' ? ' done' : ''}" id="${id}">${photo ? `<img class="sfthumb" src="${esc(photo)}" alt="찍은 오운완 셀카">` : `<span class="sfthumb none">${CAM}</span>`}
    <div class="sfbody"><b>${title}</b><small>${sub}</small><div class="sfbtns"><button class="btn sm ghost" data-act="reshoot" data-v="${from}" id="${id}Retake">다시 찍기</button>${photo ? `<button class="btn sm ghost" data-act="sfDel" data-v="${from}" id="${id}Del">사진 지우기</button>` : ''}</div></div></div>`;
}

/* ===== C7b 오운완 셀카 ===== */
const ALBUM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="1.8"/><path d="M21 15l-5-5L5 21"/></svg>';
function vSelfie() {
  const st = S.selfieStep === 'guide' || S.selfieStep === 'done' ? S.selfieStep : 'cam';   // 옛 저장본의 judge·reject → 카메라로
  const back = subHead('오운완 셀카', S.selfieFor === 'session' ? 'session' : 'result', S.selfieFor === 'session' ? '오늘 운동' : '요약');
  if (st === 'guide') return `${back}<div class="sec"><div class="card selfieguide" id="selfieGuide">${CAM}<div class="h2" style="margin:8px 0 4px">촬영 가이드</div>
    <div class="gl"><b>1</b><span>얼굴 셀카나 거울 셀카로 찍어 주세요</span></div><div class="gl"><b>2</b><span>다른 회원이 나오지 않게 찍어 주세요</span></div><div class="gl"><b>3</b><span>사진은 나한테만 보여요</span></div></div>
    <button class="btn" data-act="selfieGo" id="selfieGo">찍으러 가기</button></div>`;
  if (st === 'cam') return `${back}<div class="sec"><div class="cam" id="camBox"><video id="camV" autoplay playsinline muted></video><div class="camoff" id="camOff" hidden>${CAM}<b>카메라를 열 수 없어요</b><span>아래 앨범에서 골라 주세요<br>«카메라 앱»으로 찍어도 돼요</span></div></div>
    <div class="shutterrow"><label class="albumb" id="albumBtn"><i>${ALBUM}</i>앨범<input type="file" accept="image/*" id="camFile" hidden></label><button class="shutter" data-act="shoot" id="shutter" aria-label="촬영" disabled></button><label class="albumb" id="camAppBtn"><i>${CAM}</i>카메라 앱<input type="file" accept="image/*" capture="user" id="camApp" hidden></label></div>
    <div class="muted" style="text-align:center" id="camState">카메라를 여는 중…</div></div>`;
  return `${back}<div class="sec"><div class="shot"><img src="${S.shot || ''}" alt="찍은 사진"></div><div class="card donec" id="selfieDone">${LOCK}<div><b>오운완! 나한테만 보여요</b><small>${S.selfieFor === 'session' ? `운동을 끝내고 저장하면 경험치 +${CFG.SELFIE_BONUS.pct}%가 들어가요` : S.selfieGot ? `오운완 보너스 +${fmt(S.selfieGot)} XP` : S.selfieSwap ? '사진만 바꿨어요 · 오운완 보너스는 그대로예요' : '사진은 기록에 저장했어요 · 이번엔 보너스 경험치가 붙지 않아요'}</small></div></div>
    <div class="sfdonebtns"><button class="btn ghost" data-act="reshoot" data-v="${S.selfieFor}" id="selfieRetake">다시 찍기</button><button class="btn" data-act="selfieOk" id="selfieOk">확인</button></div></div>`;
}

/* ===== 랭킹·내 캐릭터 (v1.10 그대로) ===== */
function rankList() {
  const me = { n:'나', t:S.type, lv:S.level, week:leagueWeek(), paid:S.paidLog.length ? 1 : 0, pure:S.exLv, me:true };
  let arr = [...FRIENDS, me].map(f => ({ ...f, key: S.fTab === 'week' ? f.week : (S.pureOnly ? (f.pure ?? f.lv) : f.lv) }));
  return arr.sort((a, b) => b.key - a.key);
}
function rankMe() { const prev = S.fTab; S.fTab = 'level'; const r = rankList().findIndex(f => f.me) + 1; S.fTab = prev; return r; }
function vFriends() {
  const list = rankList();
  return `${subHead('랭킹 · 친구')}<div class="sec"><div class="seg"><button class="${S.fTab==='week'?'on':''}" data-act="ftab" data-v="week">이번 주</button><button class="${S.fTab==='level'?'on':''}" data-act="ftab" data-v="level">레벨</button></div>
  ${S.fTab==='level'?`<div class="row" style="padding-top:0"><span class="muted">운동만 보기 (💰 유료 경험치 빼고)</span><button class="sw ${S.pureOnly?'on':''}" data-act="pure"></button></div>`:''}
  <div class="card">${list.map((f, i) => `<div class="rank ${f.me?'me':''}"><div class="no">${i+1}</div><div class="av">${S.placeholder ? `<img src="${placeholderSrc(f.lv)}" alt="">` : charAvatar(f.t, f.lv, 40)}</div>
  <div><b>${esc(f.n)}</b> ${f.paid?'<span title="유료 사용">💰</span>':''}<div class="muted">${esc(CH[f.t].name)} · ${stageName(f.t, f.lv)}</div></div>
  <div class="val">${S.fTab==='week'?`${f.week.toLocaleString()}<small>XP</small>`:`Lv.${S.pureOnly?(f.pure??f.lv):f.lv}<small>${f.paid&&!S.pureOnly&&f.pure!==f.lv?`운동만 Lv.${f.pure}`:TIER_NAME[tierOf(f.lv)]}</small>`}</div></div>`).join('')}</div>
  <button class="btn ghost" data-act="invite">친구 초대</button>
  <div class="muted" style="margin-top:8px">이번 주에 얻은 경험치 순위예요 · 자가 기록은 안 들어가고, 입점센터 보너스는 들어가요</div></div>`;
}
function vMe() {
  const t = S.type, looks = ITEMS.filter(i => i.kind === 'look');
  return `${subHead('내 캐릭터')}<div class="sec">
  <div class="card" style="text-align:center">${charHTML(t, S.level, 170, true, exprNow(), false, 212, { rig: true })}<div style="margin-top:14px"><span class="name">${esc(CH[t].name)}</span> <span class="pill lvpill">Lv.${S.level}</span> <span class="pill tier${tierOf(S.level)}">${TIER_NAME[tierOf(S.level)]}</span></div>
  <div class="muted" style="margin-top:4px">칭호 «${stageName(t, S.level)}» · 운동 레벨 Lv.${S.exLv} · 포인트 ${S.points.toLocaleString()}P</div>
  <div class="slots">${looks.map(i => `<div class="slot ${S.equipped[i.id]?'on':''}">${S.equipped[i.id] ? i.name : '빈 슬롯'}</div>`).slice(0, 3).join('')}${ITEMS.filter(i => i.kind === 'effect' && S.equipped[i.id]).map(i => `<div class="slot on">${i.name}</div>`).join('')}</div>
  <button class="btn" data-act="sub" data-v="shop" id="shopBtn">🛍️ 아이템 상점</button>
  <button class="btn ghost" data-act="rechoose" style="margin-top:8px">캐릭터 바꾸기 <span class="muted">(Lv.10 전 1회 무료)</span></button></div>
  ${centerCard()}
  <div class="card" id="exprCard"><div class="h2" style="font-size:16px">컨디션 표정 5종</div><div class="muted" style="margin-bottom:8px">얼굴만 바뀌어요 · 레벨·경험치와는 상관없어요 · 지금: <b style="color:var(--ink)">${EXPR[exprNow()].label}</b></div>
  <div class="exprs">${EXPR_KEYS.map(ex => `<div class="ex5 ${exprNow()===ex?'on':''}">${charHTML(t, S.level, 64, false, ex)}<small>${EXPR[ex].label}</small></div>`).join('')}</div></div>
  ${sigCard(t, S.level)}${flexCard(t)}
  <div class="card"><div class="h2" style="font-size:16px">업적</div><div class="muted">업적 24개 잠김/달성 목록 자리 (프로토타입 범위 밖)</div></div></div>`;
}

/* 결정 36 ⑥ C12 «이번 주 입점 보너스» — 0 / 쌓는 중 / 다 참 */
function centerCard() {
  const w = centerWeek(), cap = CFG.CENTER_BONUS.weekCap, full = w >= cap;
  const body = !w ? `<div class="cbzero"><span>${CB_TXT}</span>${findCenterBtn('cbMeFind')}</div>`
    : `<div class="wxp" style="margin-top:4px"><span>${full ? '다 모았어요' : '쌓는 중'}</span><b>${w.toLocaleString()} / ${cap.toLocaleString()}${full ? ' ✓' : ''}</b></div><div class="bar thin cb"><i style="width:${Math.min(100, Math.round(w / cap * 100))}%"></i></div>`;
  return `<div class="card" id="cbCard"><div class="h2" style="font-size:16px">이번 주 입점 보너스</div>${body}
  <div class="muted" style="margin-top:6px">월요일 0시에 새로 채워져요 · ⓘ 1.5배는 기본 경험치 기준이에요</div></div>`;
}

/* ===== C13 설정 (v1.42: 주간 목표 카드 삭제) ===== */
function vSettings() {
  const evs = [...S.events].reverse(), photos = S.records.filter(r => r.photo);
  return `${subHead('설정')}<div class="sec">
  <div class="card" id="ticketCard"><div class="h2" style="font-size:16px">쉬어가기 티켓</div>
    <div class="row"><div><b>이번 달 ${S.ticketLeft}장 남음</b><div class="muted">한 번도 운동 못 간 주를 1번 지켜 줘요 · 매달 1일에 1장</div></div></div>
    <div class="row"><div><b>연속 보호권 ${S.shields}장</b><div class="muted">상점에서 산 보호권 · 티켓 다음에 써요</div></div><button class="btn sm ghost" data-act="sub" data-v="shop">상점</button></div>
    <div class="row"><span>운동 못 간 주에 자동으로 쓰기</span>${sw('ticketAuto', S.ticketAuto)}</div>
    <div class="muted">티켓·보호권이 없으면 연속은 절반으로 줄어요(0이 되지 않아요)</div></div>
  <div class="card" id="notiCard"><div class="h2" style="font-size:16px">알림</div>
    <div class="row"><div><span>입장 확인 알림</span><div class="muted">«입장 확인! 캐릭터가 기다려요»</div></div>${sw('noti', S.noti.entry, 'notiEntry').replace('data-act="noti"', 'data-act="noti" data-v="entry"')}</div>
    <div class="row"><div><span>캐릭터가 보고 싶어할 때</span><div class="muted">7일 넘게 쉬면 주 1번까지</div></div>${sw('noti', S.noti.nudge).replace('data-act="noti"', 'data-act="noti" data-v="nudge"')}</div>
    <div class="row"><div><span>주간 리포트</span><div class="muted">월요일 아침 지난주 돌아보기</div></div>${sw('noti', S.noti.report).replace('data-act="noti"', 'data-act="noti" data-v="report"')}</div>
    <div class="muted demoonly">시연용 스위치 — 실제 알림은 보내지 않아요</div></div>
  <div class="card" id="locCard"><div class="h2" style="font-size:16px">센터 확인</div>
    <div class="muted">센터 확인은 «입장하기» 기록으로만 해요 · 입장 기록이 없으면 집·야외와 같은 자가 기록(40%)이에요</div>
    <div class="row"><span>센터 확인 안내 그만 보기</span>${sw('hideTips', S.hideTips)}</div>
    <div class="row"><div><span>체중 <span class="muted">(선택)</span></span><div class="muted">무게 오타 확인에만 써요 · 비우면 70kg으로 봐요</div></div><div class="step"><button data-act="bw" data-d="-1">−</button><span>${S.bodyweight ? S.bodyweight + 'kg' : '—'}</span><button data-act="bw" data-d="1">+</button></div></div></div>
  <div class="card" id="photoCard"><div class="h2" style="font-size:16px">내 사진</div><div class="muted" style="margin-bottom:8px">${LOCK.replace('class="ico"', 'class="ico sm"')} 나한테만 보여요 · ${photos.length}장</div>
    ${photos.length ? `<div class="thumbs">${photos.map(r => `<button data-act="rec" data-id="${r.id}"><img src="${r.photo}" alt=""><small>${r.date.slice(5).replace('-', '/')}</small></button>`).join('')}</div>` : '<div class="muted">아직 찍은 오운완 셀카가 없어요</div>'}
    <button class="btn ghost" data-act="delAllPhotos" id="delAll" ${photos.length ? '' : 'disabled'}>내 사진 전체 삭제</button></div>
  <div class="card"><div class="h2" style="font-size:16px">레벨업 장면</div>
  <div class="row"><span>레벨업 소리</span><button class="sw ${S.sound?'on':''}" data-act="sound" id="soundSw"></button></div>
  <div class="row"><span class="muted">레벨업 장면은 화면 아무 데나 누르면 건너뛸 수 있어요</span></div></div>
  <div class="card" id="replayCard"><div class="h2" style="font-size:16px">레벨업 다시 보기</div>
  ${evs.length ? evs.map(e => `<div class="row"><div><b>Lv.${e.from} → ${e.to}</b> ${e.big?'<span class="pill tier4">진화</span>':''}<div class="muted">${e.at} · ${e.watched?(e.skipped?'건너뜀':'봤음'):'아직 못 봄'}${e.replays?` · 다시 본 횟수 ${e.replays}`:''}</div></div><button class="btn sm ghost" data-act="replay" data-id="${e.id}">다시 보기</button></div>`).join('') : '<div class="muted">아직 레벨업 기록이 없어요</div>'}</div>
  <div class="card demo"><div class="h3">🧪 시연 도구</div>
  <div class="row"><span>오늘 센터 입장 기록 있음</span>${sw('entryDemo', S.entryDemo)}</div>
  <div class="row"><div><span>아이템 경험치 한도</span><div class="muted">결정 33 · 운동 경험치만 하루 ${CFG.DAY_CAP}·주 ${CFG.WEEK_CAP.toLocaleString()}</div></div><b>없음</b></div>
  <div class="row"><span>이번 주 경험치 채우기</span><button class="btn sm ghost" data-act="fillWeek">1,800 채우기</button></div>
  <div class="row"><span>캐릭터</span><select data-act="type">${Object.keys(CH).map(k => `<option value="${k}" ${S.type===k?'selected':''}>${CH[k].name}</option>`).join('')}</select></div>
  <div class="row"><span>표정 강제 보기</span><select data-act="exprDemo">${[['auto','자동(기록대로)'],...EXPR_KEYS.map(k => [k, EXPR[k].label])].map(([k, l]) => `<option value="${k}" ${(S.exprDemo||'auto')===k?'selected':''}>${l}</option>`).join('')}</select></div>
  <div class="row"><span>레벨 바로 설정</span><select data-act="setlv">${Array.from({length:99},(_,i)=>i+1).map(l=>`<option ${l===S.level?'selected':''}>${l}</option>`).join('')}</select></div>
  <div class="row"><span>실루엣 플레이스홀더로 보기</span><button class="sw ${S.placeholder?'on':''}" data-act="ph"></button></div>
  <div class="row"><span>다음 연출 도중 앱 종료(새로고침) 흉내</span><button class="sw ${S.quitDemo?'on':''}" data-act="quit"></button></div>
  <div class="row"><span>처음 상태로 (캐릭터 선택부터)</span><button class="btn sm ghost" data-act="reset">초기화</button></div></div></div>`;
}

/* ===== 상점 · 부스터·물약 계산기 ===== */
const itemImg = i => i.img ? `<img src="assets/item_${i.img}.png" alt="">` : FLASK;
function vShop() {
  if (S.sTab === 'food') return `${subHead('아이템 상점')}<div class="sec"><div style="display:flex;justify-content:flex-end;margin-bottom:8px"><b>${S.points.toLocaleString()}P</b></div>
  <div class="seg"><button data-act="stab" data-v="effect">효과</button><button data-act="stab" data-v="look">꾸미기</button><button class="on" data-act="stab" data-v="food" id="stabFood">먹고 마시는</button></div>${vEatTab()}</div>`;
  const list = ITEMS.filter(i => i.kind === S.sTab && !i.off);
  return `${subHead('아이템 상점')}<div class="sec"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><button class="linkbtn" data-act="sub" data-v="calc" id="goCalc" style="margin:0">부스터·물약 계산기 ›</button><b>${S.points.toLocaleString()}P</b></div>
  <div class="seg"><button class="${S.sTab==='effect'?'on':''}" data-act="stab" data-v="effect">효과</button><button class="${S.sTab==='look'?'on':''}" data-act="stab" data-v="look">꾸미기</button><button class="${S.sTab==='food'?'on':''}" data-act="stab" data-v="food" id="stabFood">먹고 마시는</button></div>
  ${S.sTab === 'effect' ? `<div class="muted wkleft" id="wkLeft">이번 주 운동 경험치 ${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()} · <b>아이템 경험치는 한도 없어요</b>${boostOn() ? ` · <b>${boostLabel()} 부스터 적용 중</b>` : ''}</div>` : ''}
  <div class="grid2">${list.map(i => { const n = i.use ? (S.inv[i.id] || 0) : 0, own = i.use ? n > 0 : S.owned[i.id], eq = S.equipped[i.id];
    return `<div class="item">${i.use ? (n ? `<span class="tag">${n}개</span>` : '') : eq?'<span class="tag">장착중</span>':own?'<span class="tag">보유</span>':''}${itemImg(i)}<b>${i.name}</b><small>${i.desc}</small>
    ${i.use ? (n ? `<div class="grid2 ib"><button class="btn ghost" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button><button class="btn" data-act="use" data-id="${i.id}">사용</button></div>` : `<button class="btn" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button>`)
      : own ? `<button class="btn ${eq?'ghost':''}" data-act="equip" data-id="${i.id}">${eq?'해제':'장착'}</button>` : `<button class="btn" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button>`}</div>`; }).join('')}</div>
  <div class="muted" style="margin-top:10px">니짐 포인트로 사요 · 가격은 예시예요 · 효과 아이템은 쓰고 나면 환불이 안 돼요</div></div>`;
}
const avgSession = () => { const rs = realRecs().filter(r => r.v !== 'lesson' && !r.edited).slice(-10).map(r => r.raw || r.xp); return rs.length ? Math.round(median(rs) / 10) * 10 : 260; };
function calcDefaults() { return { sessions: Math.max(1, usualWeek() - weekCount()), per: avgSession(), booster: 'one', potions: 0 }; }
function cmpDefaults() { return { perWeek: usualWeek(), per: avgSession(), booster: '7d', potions: 7 }; }
const dur = w => !isFinite(w) ? '도달 못 함' : w < 9 ? `${w}주` : w < 104 ? `약 ${Math.round(w / 4.345)}개월` : `약 ${(w / 52.18).toFixed(1)}년`;
function vCalc() {
  const c = S.calc || (S.calc = calcDefaults()), f = forecastWeek({ L: ledger(), ...c });
  const step = (k, v, l, u, act = 'calc') => `<div class="ex"><div><b>${l}</b></div><div class="step"><button data-act="${act}" data-k="${k}" data-d="-1">−</button><span>${v}${u}</span><button data-act="${act}" data-k="${k}" data-d="1">+</button></div></div>`;
  const bchips = (cur, act) => `<div class="chips">${[['none', '없음'], ['one', '1번'], ['7d', '7일']].map(([k, l]) => `<button class="chip ${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;
  const m = S.cmp || (S.cmp = cmpDefaults());
  const exOnly = weeksToLv99({ level: S.level, xp: S.xp, perWeek: m.perWeek, per: m.per }), withIt = weeksToLv99({ level: S.level, xp: S.xp, perWeek: m.perWeek, per: m.per, booster: m.booster, potionsWeek: m.potions });
  const maxW = Math.max(...[exOnly.weeks, withIt.weeks].filter(isFinite), 1), barW = w => isFinite(w) ? Math.max(4, Math.round(w / maxW * 100)) : 100;
  return `${subHead('부스터·물약 계산기', 'shop', '상점')}<div class="sec">
  <div class="card"><div class="wxp" style="margin-top:0"><span>이번 주 운동 경험치 지금</span><b>${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()}</b></div><div class="bar thin"><i style="width:${Math.min(100, Math.round(weekXP() / CFG.WEEK_CAP * 100))}%"></i></div>
  ${step('sessions', c.sessions, '이번 주 남은 운동', '번')}${step('per', c.per, '운동 1번 경험치(한도 전)', ' XP')}
  <div class="ex"><div><b>부스터</b></div>${bchips(c.booster, 'calcB')}</div>
  ${step('potions', c.potions, '물약', '병')}</div>
  <div class="card" id="calcOut"><div class="xrow"><span>아이템 없이</span><b>+${fmt(f.base)} XP</b></div><div class="xrow"><span>아이템 쓰면</span><b>+${fmt(f.with)} XP</b></div>
  <div class="xrow total"><span>아이템으로 늘어나는 경험치</span><b class="${f.extra ? '' : 'zero'}">+${fmt(f.extra)} XP</b></div>
  ${f.wasted ? `<div class="xrow cut"><span>운동 한도 때문에 안 들어가는 경험치</span><b>${fmt(f.wasted)} XP</b></div>` : ''}
  <div class="notice nolimit" id="calcNoLimit">💰 아이템 경험치는 <b>한도 없음</b> · 이번 주 운동 한도를 다 채워도 그대로 들어가요</div></div>
  <div class="card" id="lv99Card"><div class="h2" style="font-size:16px">Lv.${S.level} → Lv.99 얼마나 걸릴까</div>
  ${step('perWeek', m.perWeek, '주 운동', '번', 'cmp')}${step('per', m.per, '1번 운동 경험치', ' XP', 'cmp')}
  <div class="ex"><div><b>매주 부스터</b></div>${bchips(m.booster, 'cmpB')}</div>
  ${step('potions', m.potions, '매주 물약', '병', 'cmp')}
  <div class="cmp"><div class="cmprow"><span>운동만</span><div class="cbar"><i style="width:${barW(exOnly.weeks)}%"></i></div><b>${dur(exOnly.weeks)}</b></div>
  <div class="cmprow it"><span>아이템 쓰면</span><div class="cbar"><i style="width:${barW(withIt.weeks)}%"></i></div><b>${dur(withIt.weeks)}</b></div></div>
  <div class="muted">남은 경험치는 ${fmt(exOnly.left)} XP예요 · 운동으로 한 주에 ${fmt(exOnly.exWeek)} XP씩(한 주 최대 ${CFG.WEEK_CAP.toLocaleString()}) 모은다고 보고 대략 계산했어요 · 아이템을 쓰면 한 주에 ${fmt(withIt.itemWeek)} XP를 더 모은다고 봤어요(한도 없음)</div>
  <div class="muted">주간 랭킹·«운동만 보기»엔 운동 경험치(입점센터 보너스 포함)만 들어가고, 아이템 경험치는 빠져요</div></div>
  <div class="muted">운동 경험치만 하루 ${CFG.DAY_CAP} · 주 ${CFG.WEEK_CAP.toLocaleString()} XP 한도 · 하루에 운동 1번으로 계산했어요</div></div>`;
}

/* ===== 통계(C11 자리) · C14 기록 상세·수정 ===== */
function vStats() {
  const all = [...S.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const mon = all.filter(r => r.date.startsWith(TODAY.slice(0, 7)));
  return `${subHead('통계')}<div class="sec">
  <div class="card"><div class="tiles" style="margin-top:0"><div class="tile"><small>이번 달</small><b>${mon.length}회</b></div><div class="tile"><small>이번 달 XP</small><b>${mon.reduce((a, r) => a + r.xp, 0).toLocaleString()}</b></div><div class="tile"><small>연속</small><b>${S.streakWeeks}주</b></div></div></div>
  <div class="ph">주/월 그래프 · 부위 밸런스 · PR 자리 (C11 — 프로토타입 범위 밖)</div>
  <div class="card"><div class="h2" style="font-size:16px">전체 기록</div>${all.map(r => `<div class="rec tap" data-act="rec" data-id="${r.id}"><div><b>${esc(r.summary)}</b><small>${r.date} · ${esc(r.place)}</small></div><span class="xp">+${r.xp} XP</span></div>`).join('')}</div></div>`;
}
function vRec() {
  const r = S.records.find(x => x.id === S.recId); if (!r) return vStats();
  const E = S.editRec, items = E ? E.items : (r.items || []), lesson = r.v === 'lesson';
  const itemHTML = (it, ii) => { const e = EX[it.ex]; if (!e) return '';
    if (e.mode === 'cardio' || e.mode === 'lesson') return `<div class="ritem"><b>${e.name}</b>${E && e.mode === 'cardio' ? `<div class="step"><button data-act="eMin" data-i="${ii}" data-d="-1">−</button><span>${it.min}분</span><button data-act="eMin" data-i="${ii}" data-d="1">+</button></div>` : `<small>${it.min}분${it.km ? ` · ${it.km}km` : ''}${it.level ? ` · ${({ light: '가벼움', normal: '보통', hard: '힘듦' })[it.level]}` : ''}</small>`}</div>`;
    return `<div class="ritem"><b>${e.name}</b>${(it.sets || []).filter(s => s.done).map((s, si) => E ? `<div class="setrow edit"><span>${si + 1}세트</span>${e.mode === 'wr' ? `<div class="step"><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="w" data-d="-1">−</button>${wInput(s.w, `data-w="edit" data-i="${ii}" data-s="${si}"`)}<button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="w" data-d="1">+</button></div>` : ''}<div class="step"><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="${e.mode === 't' ? 's' : 'r'}" data-d="-1">−</button><span>${e.mode === 't' ? s.s + '초' : s.r + '회'}</span><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="${e.mode === 't' ? 's' : 'r'}" data-d="1">+</button></div><button class="del" data-act="eDel" data-i="${ii}" data-s="${si}" aria-label="세트 지우기">×</button></div>`
      : `<div class="setrow"><span>${si + 1}세트</span><b>${setTxt(e, s)}</b>${s.pr ? '<span class="prtag">PR</span>' : '<span></span>'}</div>`).join('')}</div>`; };
  const ed = E ? editCalc(r, E.items) : null, keepNow = editKeeps(r), isSelf = vk(r.v) === 'self';
  return `${subHead(md(r.date) + ' 기록', S.recFrom || '', S.recFrom === 'stats' ? '통계' : S.recFrom === 'settings' ? '설정' : '운동기록')}<div class="sec">
  <div class="card" id="recHead"><div class="sh1"><div><b>${esc(r.place)}</b>${vBadge(r.v)}</div><em class="xpbig">+${fmt(r.xp)} XP</em></div><div class="muted" style="margin-top:4px">${esc(r.summary)}${r.light ? ' · 가볍게 한 날' : ''}${r.batch ? ' · 한꺼번에 적은 기록' : ''}</div>${r.held ? `<div class="warn" id="recHold" style="margin-top:8px">세트 사이가 ${CFG.SET_GAP_SEC}초보다 짧아서 경험치 ${fmt(heldAll(r))} XP는 24시간 뒤에 들어와요. 기록은 그대로 저장됐어요.</div>` : ''}</div>
  <div class="card" id="recItems">${items.map(itemHTML).join('') || '<div class="muted">자세한 기록이 없어요</div>'}</div>
  ${E ? editNoteHTML(r, ed, E.items) : ''}
  ${E ? `
<div class="grid2"><button class="btn ghost" data-act="editCancel">취소</button><button class="btn" data-act="editSave" id="editSave">수정 저장</button></div>`
  : ''}
  ${!E && !r.demo ? `<button class="btn sharebtn" data-act="share" data-id="${r.id}" id="recShare">${NJ_SHARE_ICON_SVG()}자랑하기</button>` : ''}
  ${E ? '' : lesson ? `<div class="muted">레슨 기록은 선생님이 확정한 기록이라 고치거나 지울 수 없어요</div>` : `<button class="btn ghost" data-act="editStart" id="editStart">기록 수정</button>${isSelf ? '' : `<div class="muted edithint" id="editHint">${keepNow ? `${keepUntil(r)}까지는 고쳐도 자가 기록으로 바뀌지 않아요` : '저장한 지 24시간이 지나서, 고치면 자가 기록으로 다시 계산돼요'}</div>`}`}
  ${!E && r.br ? `<div class="card" style="margin-top:12px"><div class="h3">경험치 내역</div>${xpRows(r)}<div class="xrow total"><span>다 더하면</span><b>+${fmt(r.xp)} XP</b></div></div>` : ''}
  ${!E && r.photo ? `<div class="card" id="recPhoto"><div class="h3">오운완 셀카 <span class="muted" style="font-weight:500">${LOCK.replace('class="ico"', 'class="ico sm"')} 나만 봐요</span></div><img class="recphoto" src="${r.photo}" alt=""><button class="btn ghost" data-act="delPhoto" data-id="${r.id}" id="delPhoto">사진 삭제</button></div>` : ''}
  ${!E && !lesson ? `<button class="btn ghost delrec" data-act="delRec" id="delRec">이 기록 지우기</button>` : ''}</div>`;
}
/* v1.41(형 11-11 승인): 저장하고 24시간 안에 고치면 원래 등급 그대로(입점 보너스·셀카 보너스도 다시 계산해 유지), 24시간이 지나서 고치면
   예전처럼 자가 기록(V0)으로 다시 계산(VERIFICATION §4 «과거 입력은 V0 고정»). 어느 쪽이든 그 기록을 통째로 다시 계산 — 그날 다른 기록과 합쳐 한도 안에서.
   저장 시각 = 기록 번호(id, 저장한 순간의 시각). 시연용 옛 기록(번호 1~5)은 24시간이 지난 기록으로 본다 */
const EDIT_KEEP_MS = 864e5;
const editKeeps = r => typeof r.id === 'number' && r.id > 1e12 && Date.now() - r.id >= 0 && Date.now() - r.id < EDIT_KEEP_MS;
const keepUntil = r => { const d = new Date(r.id + EDIT_KEEP_MS); return `${md(ymd(d))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function editCalc(r, items) {
  const keep = editKeeps(r), ctx = r.ctx ? { ...r.ctx } : { firstToday: true, weekParts: [], streakWeeks: S.streakWeeks, lastDays: 1, prToday: 0, boost: false };
  if (!(r.br && r.br.dayDone != null)) ctx.oldRule = { goal: (r.br && r.br.goal) || 0 };   // v1.41 이전 기록 = 옛 규칙 그대로(주간 보너스 유지·완료 고정분 없음)
  const L = ledgerOf([...S.records.filter(q => q.id !== r.id), ...S.paidLog.map(p => ({ ...p, paid: true }))], r.date, weekDaysOf(r.date));
  if (!keep) {
    const x = sessionXP({ verify: 'V0', selfie: false, items, prCount: 0 }, { ...ctx, boost: !!r.boosted });   // 이미 쓴 부스터는 수정해도 유지
    const cap = capGain(x, L, true);
    return { keep, xp: cap.gained, br: x, cap, cbr: { cb: 0, cut: 0 }, prCount: 0 };
  }
  const prCount = Math.min(r.prCount || 0, items.reduce((a, it) => a + (it.sets || []).filter(q => q.done && q.pr).length, 0));   // 값을 고친 세트는 PR 표시가 빠진다(eSet)
  const hadSelfie = r.selfieXP > 0;
  const x = sessionXP({ verify: K2V[vk(r.v)] || 'V0', selfie: hadSelfie ? SELFIE_SHOT : false, items, prCount },
    { ...ctx, boost: r.boosted ? (ctx.boost || true) : false, selfieToday: hadSelfie ? 0 : ctx.selfieToday });
  const cap = capGain(x, L, x.v === 'V0'), cbr = centerBonus(x, L, false);
  return { keep, xp: cap.gained + cbr.cb, br: x, cap, cbr, prCount };
}
/* 수정 화면 안내 — 규칙 한 줄 + «지금 → 수정 후» 한 줄 + 달라지는 양 한 줄 */
function editNoteHTML(r, ed, items) {
  const same = sameItems(items.filter(x => (x.sets || []).some(q => q.done) || x.min > 0), r.items || []), isSelf = vk(r.v) === 'self';
  const rule = ed.keep ? (isSelf ? '고친 내용대로 경험치를 다시 계산해요' : `저장하고 24시간이 안 지나서 고쳐도 <b>등급은 그대로</b>예요 <span class="nowrap">(${keepUntil(r)}까지)</span>`)
    : isSelf ? '고친 내용대로 경험치를 다시 계산해요' : '저장한 지 24시간이 지나서, 고치면 <b>자가 기록(×0.4)</b>으로 다시 계산돼요. 입점센터·개인 기록 보너스는 빠져요';
  const lostPR = ed.keep && !same && (r.prCount || 0) > ed.prCount ? '<div class="enline sub">값을 고친 세트의 개인 기록 보너스는 빠져요</div>' : '';
  if (r.held) { const was = heldAll(r), now = ed.xp;
    return `<div class="warn editnote" id="v0Warn"><div class="enline">${rule}</div>${ed.keep && same ? `<div class="enline num">24시간 뒤에 받을 경험치 <b>${fmt(was)} XP</b></div>` : `<div class="enline num">24시간 뒤에 받을 경험치 ${fmt(was)} XP → 수정 후 <b>${fmt(now)} XP</b></div>`}${lostPR}</div>`; }
  if (ed.keep && same) return `<div class="warn editnote" id="v0Warn"><div class="enline">${rule}</div><div class="enline num">지금 <b>+${fmt(r.xp)} XP</b> · 숫자를 바꾸면 달라지는 경험치를 여기서 보여 드려요</div></div>`;
  const diff = ed.xp - (r.xp || 0), lvTo = applyXP({ level: S.level, xp: S.xp }, diff).level;
  const delta = diff < 0 ? `<b>${fmt(-diff)} XP가 빠져요</b>${lvTo < S.level ? ` · 레벨이 Lv.${S.level} → ${lvTo}로 내려가요` : ''}` : diff > 0 ? `${fmt(diff)} XP를 더 받아요${lvTo > S.level ? ` · 레벨이 Lv.${S.level} → ${lvTo}로 올라가요` : ''}` : '경험치는 그대로예요';
  return `<div class="warn editnote" id="v0Warn"><div class="enline">${rule}</div><div class="enline num">지금 +${fmt(r.xp)} XP → 수정 후 <b>+${fmt(ed.xp)} XP</b></div><div class="enline">${delta}</div>${lostPR}</div>`;
}

const MAIN = { home:vHome, nearby:vNearby, membership:vMembership, workout:vWorkout, all:vAll };
const SUB = { session:vSession, place:vPlace, pick:vPick, set:vSet, cardio:vCardio, result:vResult, selfie:vSelfie, rec:vRec, calc:vCalc,
  onbPerm:vOnbPerm, friends:vFriends, me:vMe, shop:vShop, stats:vStats, settings:vSettings };
/* v1.40 안전망(QA 치6·치8): 화면 그리기가 실패해도 빈 화면으로 두지 않는다 — ① 운동기록 첫 화면으로 ② 그것도 안 되면 «처음 상태로 시작» 화면 */
const SESS_SUBS = ['session', 'set', 'cardio', 'pick'];
function viewHTML() {
  const v = (S.tab === 'workout' && S.sub && (S.chosen || S.sub.startsWith('onb'))) ? (SUB[S.sub] || vWorkout) : (MAIN[S.tab] || vHome);
  return S.session && S.tab === 'workout' && SESS_SUBS.includes(S.sub) ? onDay(sessDay(S.session), v) : v();
}
function vBroken() {
  return `<div class="sec"><div class="card" id="brokenCard" style="text-align:center;padding:28px 18px"><div class="h2" style="margin-top:0">저장된 기록을 열 수 없어요</div>
  <div class="muted" style="line-height:1.6;word-break:keep-all">기록에 문제가 생겨 화면을 열 수 없어요.<br>처음부터 다시 시작하면 쓸 수 있어요.<br>지금까지의 기록과 레벨은 지워져요.</div>
  <button class="btn" data-act="hardResetAsk" id="hardResetAsk">처음 상태로 시작</button></div></div>`;
}
/* v1.41: 수정·삭제 결과는 아래 검은 알림 대신 화면 맨 위 띠로 — 달력·버튼을 덮지 않고, 다른 화면으로 가면 사라진다 */
let FLASH = null;
const flash = (msg, cls = 'ok') => { FLASH = { msg, cls, fresh: true }; };
function render() {
  syncToday(); autoEndCheck();
  let html;
  try { html = viewHTML(); }
  catch (err) { console.error('[render]', err);
    const was = S.sub; S.sub = null; S.tab = 'workout'; S.editRec = null;
    try { html = vWorkout(); if (was) setTimeout(() => toast('화면을 여는 중 문제가 생겨 운동기록 첫 화면으로 돌아왔어요'), 0); save(); }
    catch (err2) { console.error('[render:fallback]', err2); html = vBroken(); } }
  const nPhoto = S.records.filter(r => r.photo).length;
  $('view').innerHTML = (SAVE_OK ? '' : `<div class="notice savefail" id="saveFail"><span>지금은 기록 저장이 안 돼요. ${nPhoto ? '오운완 사진을 몇 장 지워 주세요.' : '휴대폰 저장 공간을 비워 주세요.'}</span>${nPhoto && S.sub !== 'settings' ? '<button class="btn sm" data-act="goPhotos">사진 정리</button>' : ''}</div>`)
    + (FLASH ? `<div class="notice flashn ${FLASH.cls}" id="flashNote"><span>${FLASH.cls === 'ok' ? '✓ ' : ''}${esc(FLASH.msg)}</span></div>` : '') + html;
  if (FLASH) FLASH.fresh = false;
  document.body.classList.toggle('wk', S.tab === 'workout');
  document.body.classList.toggle('hasbar', !!$('endBar'));
  eatMount(); animMount();
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  if (S.tab === 'workout' && S.sub === 'selfie' && S.selfieStep === 'cam') camStart();
  S.bump = 0;
}
function go(tab, sub = null) { if (FLASH && !FLASH.fresh) FLASH = null; if (sub !== 'selfie') camStop(); if (sub !== 'result') S.savedNote = null; S.tab = tab; S.sub = tab === 'workout' ? sub : null; save(); render(); window.scrollTo(0, 0); }
const backToTab = () => go('workout');   // 연출 종료 후 복귀 위치 = 운동기록 탭 메인 (결정 20)

/* ===== 세션 시작·운동 추가·세트 ===== */
function startSession() {
  if (S.session) return go('workout', 'session');
  if (!S.entryDemo) { S.placeQ = ''; return go('workout', 'place'); }
  openSession({ name: '니짐 신림점', kind: 'center' }, 'V1');
  toast('입장 확인! 니짐 신림점에서 운동 시작');
}
function openSession(place, verify) {
  const now = Date.now();
  S.session = { id: now, startedAt: now, lastAt: now, place, verify, items: [], light: false, selfie: null, photo: null, prCount: 0, times: {} };
  S.demo = 'none'; S.holdDemo = false; S.q = ''; S.part = 'all';
  go('workout', 'session');
}
function pickPlace(name) {
  if (name === '집' || name === '야외') return openSession({ name, kind: name === '집' ? 'home' : 'out' }, 'V0');
  openSession({ name, kind: 'center' }, 'V0');   // 결정 37 ②: 입점 안 된 헬스장·입장 기록 없는 입점센터 = 집·야외와 같은 V0
}
function newItem(ex) {
  const e = EX[ex], prev = histOf(ex).find(h => (h.sets && h.sets.length) || h.min);
  if (e.mode === 'cardio') return { ex, min: 0, level: 'normal', draft: { mode: 'timer', min: prev && prev.min ? prev.min : 20, level: 'normal', km: 0, kmh: 0, inc: 0, open: false } };   // v1.40(QA 중1): 거리는 0에서 시작 — 지난번 거리는 «지난번» 줄에만
  const p = prev && prev.sets ? prev.sets[0] : null;
  return { ex, sets: [], plan: prev && prev.sets ? setsTxt(e, prev.sets) : '', draft: { w: p ? p.w : (e.w || 0), r: p ? p.r : 10, s: p && p.s ? p.s : 60 } };
}
function addEx(ex, open = true) {
  const s = S.session; if (!s) return;
  if (!s.items.some(i => i.ex === ex)) s.items.push(newItem(ex));
  s.lastAt = Date.now(); S.cur = ex;
  if (open) go('workout', EX[ex].mode === 'cardio' ? 'cardio' : 'set'); else { save(); render(); }
}
function loadRoutine() {
  const lr = lastRoutine(S.session.place.name); if (!lr) return;
  lr.items.filter(i => EX[i.ex] && EX[i.ex].cat !== 'lesson').forEach(i => addEx(i.ex, false));
  toast(`지난번 루틴 ${lr.items.length}개를 불러왔어요`); go('workout', 'session');
}
/* v1.40(형 11-11 승인 · QA 치1): «세트 완료»는 누른 뒤 1초 동안 다시 눌러도 무시 · 보류 규칙은 실제 세트 완료 시각(sets[].at)으로 판정 */
const SET_LOCK_MS = 1000;
const heldAll = r => (r.held || 0) + (r.held ? r.heldCb || 0 : 0);   // 보류 중인 양(입점 보너스 포함 — 풀릴 때 들어오는 양과 같게)
const recXP = r => r.held ? `<span class="xp hold">24시간 뒤 +${fmt(heldAll(r))}</span>` : `<span class="xp">+${fmt(r.xp)} XP</span>`;
/* v1.41(형 11-11 승인): 20초 안 되는 간격이 3번 이어지면 바로 보류하지 않고 «한꺼번에 적는 중인가요?»를 1번 묻는다.
   s.rapid = 'batch'(한꺼번에 적는 기록 → 자가 기록 ×0.4 로 바로 반영, 입점·개인 기록 보너스 없음, 하루 1번) | 'hold'(지금 운동 중 → 등급 그대로·24시간 뒤 반영)
   답을 안 하고 닫으면 보류로 두되 안내 줄에서 다시 고를 수 있다. 한 번 고른 답은 그 운동이 끝날 때까지 못 바꾼다(세트를 지워도 그대로) */
const rawHeld = s => s.items.some(it => isHeld((it.sets || []).filter(x => x.done && x.at).map(x => x.at)));
const sessHeld = s => !!s && s.rapid !== 'batch' && (s.rapid === 'hold' || rawHeld(s));
const batchLeft = s => S.batchDay !== sessDay(s) || S.batchSess === s.id;   // 하루 1번(운동 시작한 날 기준)
const effSess = s => s && s.rapid === 'batch' ? { ...s, verify: 'V0', prCount: 0 } : s;
const holdWarnHTML = (s, long) => `<div class="warn" id="holdWarn">세트 사이가 ${CFG.SET_GAP_SEC}초보다 짧았어요. 이번 운동 경험치는 24시간 뒤에 들어와요${long ? ' · 기록은 그대로 저장돼요' : ''}${!s.rapid && !S.holdDemo && batchLeft(s) ? `<button class="linkbtn warnlink" data-act="rapidAsk" id="rapidAgain">운동을 마치고 한꺼번에 적는 중이에요 ›</button>` : ''}</div>`;
function rapidAsk() {
  const s = S.session; if (!s || s.rapid) return;
  if (!batchLeft(s)) { s.rapid = 'hold'; save(); render();
    return sheet(`<div class="h2">세트 사이가 너무 짧았어요</div><div class="muted" style="line-height:1.6;word-break:keep-all">이번 운동 경험치는 24시간 뒤에 들어와요. 기록은 그대로 저장돼요.<br>한꺼번에 적기는 하루에 한 번만 쓸 수 있어요.</div><button class="btn" data-act="shClose" style="margin-top:14px" id="rapidOk">확인</button>`); }
  sheet(`<div class="h2" id="rapidTitle">운동을 마치고 한꺼번에 적는 중인가요?</div><div class="muted" style="line-height:1.6;word-break:keep-all">세트를 ${CFG.SET_GAP_SEC}초도 안 쉬고 연달아 완료했어요.</div>
    <button class="optbtn" data-act="rapidBatch" id="rapidBatch"><b>네, 한꺼번에 적고 있어요</b><small>자가 기록(×${CFG.VERIFY.V0})으로 바로 받아요 · 하루 한 번</small></button>
    <button class="optbtn" data-act="rapidHold" id="rapidHold"><b>아니요, 지금 운동 중이에요</b><small>등급은 그대로 · 경험치는 24시간 뒤에 들어와요</small></button>
    <div class="muted" style="margin-top:10px;text-align:center;font-size:12px">한 번 고르면 이 운동이 끝날 때까지 바꿀 수 없어요</div>`);
}
/* 세트를 고치거나 지운 뒤 그 운동의 PR 표시를 처음부터 다시 매긴다 */
function rePR(it) {
  const e = EX[it.ex], s = S.session, before = it.sets.filter(x => x.pr).length; let best = bestOf(it.ex);
  it.sets.forEach(st => { if (!st.done) return; if (!st.unreal && isPR(e, st, best)) st.pr = true; else delete st.pr; best = Math.max(best, setScore(e, st)); });
  s.prCount = Math.max(0, (s.prCount || 0) + it.sets.filter(x => x.pr).length - before);
  if (S.prFx && S.prFx.ex === it.ex) S.prFx = null;
}
function setEditSheet(keep = false) {
  const E = S.setEdit, it = E && S.session && S.session.items.find(i => i.ex === E.ex); if (!it || !it.sets[E.i]) { S.setEdit = null; return shClose(); }
  const e = EX[it.ex];
  sheet(`<div class="h2" id="seTitle">${E.i + 1}세트 고치기</div><div class="muted">${esc(e.name)}</div>
    <div class="setsteps" id="seSteps">${e.mode === 'wr' ? stepper('sew', '', '무게', 'kg', wInput(E.w, 'id="seW" data-w="setedit"')) : ''}${e.mode === 't' ? stepper('ses', E.s, '시간', '초', nInput('s', E.s, 'id="seS" data-w="setedit"')) : stepper('ser', E.r, '횟수', '회', nInput('r', E.r, 'id="seR" data-w="setedit"'))}</div>
    ${(e.mode === 'wr' || e.mode === 'r') && E.r < CFG.MIN_REPS ? `<div class="minreps" style="margin-top:8px">${CFG.MIN_REPS}회 이상부터 경험치</div>` : ''}
    <div class="grid2" style="margin-top:14px"><button class="btn ghost redtxt" data-act="seDel" id="seDel">이 세트 지우기</button><button class="btn" data-act="seSave" id="seSave">고친 대로 저장</button></div>`, keep);
}
function setDone(force = false) { return onDay(sessDay(S.session), () => setDone0(force)); }
function setDone0(force) {
  if (!commitWeightField()) return;
  if (Date.now() - (S.setAt || 0) < SET_LOCK_MS) return;
  const wasRaw = rawHeld(S.session);
  const it = curItem(), e = EX[it.ex], d = it.draft, prev = histOf(it.ex).find(h => h.sets && h.sets.length);
  const chk = checkWeight(e, d.w, { bodyweight: S.bodyweight, bestW: bestW(it.ex), lastTopW: prev ? Math.max(...prev.sets.map(x => x.w || 0)) : 0 });
  if (chk.unreal && !force) return sheet(`<div class="h2">정말 ${kg(d.w)} 맞아요? 🙂</div><div class="muted">${bestW(it.ex) ? `지난 최고 무게(${kg(bestW(it.ex))})의 1.5배가 넘어요.` : '체중에 비해 아주 무거운 무게예요.'} 숫자가 맞으면 그대로 저장돼요.</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">고칠게요</button><button class="btn" data-act="setForce">맞아요, 저장</button></div>`);
  const st = { w: d.w, r: d.r, s: d.s, done: true, at: Date.now() };
  const best = Math.max(bestOf(it.ex), ...it.sets.filter(x => x.done).map(x => setScore(e, x)));
  if (!chk.unreal && isPR(e, st, best)) { st.pr = true; S.session.prCount++; const today = realRecs().filter(r => r.date === TODAY).reduce((a, r) => a + (r.prCount || 0), 0);
    S.prFx = { ex: it.ex, at: Date.now(), txt: setTxt(e, st), xp: S.session.rapid !== 'batch' && today + S.session.prCount <= CFG.LIM.prDay }; }
  if (chk.unreal) st.unreal = true;
  it.sets.push(st); it.dirty = false; S.session.lastAt = Date.now(); S.setAt = Date.now();
  S.rest = { ex: it.ex, until: Date.now() + CFG.REST_SEC * 1000, total: CFG.REST_SEC };
  shClose(); save(); render();
  setTimeout(() => { const b = $('setDone'); if (b) b.classList.remove('wait'); }, SET_LOCK_MS);
  if (st.pr) { tone(880, 0, .2); tone(1175, .1, .35); }
  if (!S.session.rapid && !S.holdDemo && !wasRaw && rawHeld(S.session)) rapidAsk();
}

/* ===== 운동 끝 → 저장 → (레벨업 연출) → 요약 ===== */
function xpToReach(target) { let total = need(S.level) - S.xp; for (let l = S.level + 1; l < target; l++) total += need(l); return total; }
function demoXP() {
  if (S.demo === 'next') return xpToReach(Math.min(99, S.level + 1));
  if (S.demo === 'boundary') { const t = Math.min(99, S.level >= 90 ? 99 : (Math.floor(S.level / 10) + 1) * 10); return xpToReach(t); }
  if (S.demo === 'multi') return xpToReach(Math.min(99, S.level + 5)) + 50;
  return 0;
}
/* 돌고 있는 유산소 타이머를 «종료 · 시간 저장»과 같은 방식으로 기록에 넣는다(QA 치2: 타이머 켠 채 «운동 끝»이면 시간이 사라짐) */
function foldTimers(s) {
  const out = [];
  s.items.forEach(it => { if (!it.run) return; const ms = Date.now() - it.run.startAt + (it.run.offset || 0);
    it.min = Math.min(CFG.LIM.cardioMaxMin, (it.min || 0) + Math.max(1, Math.round(ms / 60000))); it.run = null; if (it.draft) { it.draft.min = it.min; it.level = it.draft.level; } out.push(`${EX[it.ex].name} ${it.min}분`); });
  return out;
}
function saveFailSheet() {
  const nPhoto = S.records.filter(r => r.photo).length;
  sheet(`<div class="h2" id="saveFailTitle">기록을 저장하지 못했어요</div><div class="muted" style="line-height:1.6;word-break:keep-all" id="saveFailBody">휴대폰 저장 공간이 꽉 찼어요.<br>${nPhoto ? '오운완 사진을 몇 장 지우고' : '안 쓰는 사진이나 앱을 지우고'} <b style="color:var(--ink)">«운동 끝»</b>을 다시 눌러 주세요.</div>
    <div class="warn" id="saveFailWarn">지금 앱을 닫으면 오늘 기록이 사라져요</div>
    ${nPhoto ? `<div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">닫기</button><button class="btn" data-act="goPhotos" id="saveFailGo">사진 정리</button></div>` : `<button class="btn" data-act="shClose" style="margin-top:14px" id="saveFailOk">확인</button>`}`);
}
/* v1.41(불편 개선 ②): «운동 끝»을 누르면 바로 끝내지 않고 요약을 보여 준 뒤 확인. 자동 종료(3시간)는 묻지 않는다 */
function endAsk() {
  const s = S.session; if (!s) return;
  if (!commitWeightField()) return;
  const worked = it => (it.sets || []).some(x => x.done) || it.min > 0 || !!it.run;
  if (!s.items.some(worked) && S.demo === 'none') return endSession();   // «기록한 운동이 없어요» 창(기존)
  onDay(sessDay(s), () => {
    const c = JSON.parse(JSON.stringify(s)); foldTimers(c);   // 돌고 있는 타이머까지 넣은 «지금 끝내면» 값
    const { r, cap } = sessCalc(c), est = S.demo === 'none' ? cap.gained + centerBonus(r, ledger()).cb : demoXP(), held = sessHeld(s) || S.holdDemo;
    const w = c.items.filter(worked), nSets = w.reduce((a, it) => a + (it.sets || []).filter(x => x.done).length, 0), cMin = w.reduce((a, it) => a + (EX[it.ex].mode === 'cardio' ? it.min || 0 : 0), 0);
    const sum = [`${w.length}종목`, nSets ? `${nSets}세트` : '', cMin ? `유산소 ${cMin}분` : ''].filter(Boolean).join(' · ');
    const notes = [];
    s.items.forEach(it => { const e = EX[it.ex]; if (e.mode === 'lesson') return;
      if (it.run) notes.push(`${esc(e.name)} 타이머가 돌고 있어요 · 지금까지 잰 시간으로 저장해요`);
      else if (!worked(it)) notes.push(`${esc(e.name)} · 적은 게 없어서 저장 안 해요`);
      else if (it.dirty && e.mode !== 'cardio') notes.push(`${esc(e.name)}에 «완료» 안 누른 세트가 있어요 (${setTxt(e, it.draft)})`); });
    sheet(`<div class="h2" id="endTitle">오늘 운동을 끝낼까요?</div>
      <div class="endsum" id="endSum"><div><span>기록</span><b>${sum}</b></div><div><span>경험치</span><em>${held ? `24시간 뒤 +${fmt(est)} XP` : `+${fmt(est)} XP`}</em></div></div>
      ${notes.slice(0, 3).map(n => `<div class="warn endwarn">${n}</div>`).join('')}${notes.length > 3 ? `<div class="muted" style="margin-top:6px;font-size:12px">그 밖에 확인할 운동 ${notes.length - 3}개</div>` : ''}
      <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose" id="endMore">더 할게요</button><button class="btn" data-act="endOk" id="endOk">끝내고 저장</button></div>
      <button class="linkbtn quiet" data-act="discardAsk" id="endDiscard">저장하지 않고 그만두기</button>`);
  });
}
function endSession(auto = false) {
  const s = S.session; if (!s) return;
  syncToday();
  const snap = JSON.stringify(S), folded = foldTimers(s);
  const out = onDay(sessDay(s), () => endSession0(s, auto));
  if (!out) return;
  if (!save()) { S = JSON.parse(snap); shClose(); render(); return saveFailSheet(); }   // QA 치3: 저장이 안 됐으면 «저장 완료»·레벨업 연출 없이 운동 화면으로 되돌린다
  S.savedNote = `기록을 저장했어요 · ${out.held ? `${fmt(out.held)} XP는 24시간 뒤에 들어와요` : `+${out.got.toLocaleString()} XP`}${folded.length ? ` · 돌고 있던 타이머(${folded.join(', ')})도 함께 저장했어요` : ''}`;
  afterGain(out.res, {});
}
function endSession0(s, auto) {
  const hasWork = s.items.some(it => (it.sets || []).some(x => x.done) || it.min > 0);
  if (!hasWork && S.demo === 'none' && !auto) return sheet(`<div class="h2">기록한 운동이 없어요</div><div class="muted">세트를 1개 이상 완료하거나 유산소 시간을 기록하면 경험치가 쌓여요.</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="discard">기록 없이 끝내기</button><button class="btn" data-act="shClose">계속 운동하기</button></div>`);
  if (!hasWork && auto) { S.session = null; save(); toast('3시간 동안 적은 게 없어서 운동을 끝냈어요'); go('workout'); return null; }
  const batch = s.rapid === 'batch', ctx = sessCtx(), r = sessionXP(effSess(s), ctx), L = ledger(), isDemo = S.demo !== 'none';
  const cap = capGain(r, L, r.v === 'V0');
  let gained = isDemo ? demoXP() : cap.gained, held = 0;
  if (!isDemo && (S.holdDemo || sessHeld(s))) { held = gained; gained = 0; }
  const boosted = !isDemo && boostOn() && r.any; if (boosted) boostConsume();
  const cbr = centerBonus(r, L, isDemo || held > 0), cb = cbr.cb;   // 결정 36: 운동 장부 잘림과 무관 · 주 900만
  const itemPart = isDemo || held ? 0 : cap.boostGained;   // 부스터로 늘어난 몫 = 아이템 경험치 → 운동 레벨엔 안 들어감
  const res = applyGain({ level: S.level, xp: S.xp }, gained - itemPart, itemPart, cb);
  gainEx(gained - itemPart + cb);   // 결정 38 ⑦-1 B: 입점 보너스도 운동 레벨에
  S.level = res.level; S.xp = res.xp;
  const items = s.items.filter(it => (it.sets || []).some(x => x.done) || it.min > 0).map(({ draft, run, plan, dirty, ...it }) => ({ ...it, sets: it.sets ? it.sets.filter(x => x.done).map(({ at, ...x }) => x) : undefined }));
  const rec = { id: Date.now(), date: TODAY, place: s.place.name, placeKind: s.place.kind, summary: summaryOf(items), items, xp: gained + cb, xpCenter: cb, cbCut: cbr.cut, centerBase: r.baseXP, centerIf: isDemo || batch ? null : centerIf(s, ctx, r), raw: r.raw, held, cut: isDemo ? 0 : cap.cut, cutReason: cap.reason,
    heldCb: held ? centerBonus(r, L, false).cb : 0, xpBoost: isDemo ? 0 : cap.boostGained, selfieXP: isDemo || held ? 0 : r.selfieXP, selfieIn: isDemo || held ? 0 : cap.selfieGained, boosted, v: V2K[r.v], light: s.light, prCount: batch ? 0 : s.prCount, photo: s.photo, ctx, br: isDemo ? { demoXP: gained } : r, demo: isDemo, auto: auto || undefined, batch: batch || undefined };
  rec.dur = Math.max(1, Math.round((s.lastAt - s.startedAt) / 60000));   // 공유 카드 «운동 시간»(v2 SPEC §2)
  if (res.level > res.from) rec.lvUp = { from: res.from, to: res.level };
  S.records.push(rec);
  /* 결정 21: 표정만 바뀜 — 위 레벨·경험치 계산에 관여하지 않음 */
  const j = judgeIntensity(items, { hist: histVol(), today: TODAY, light: s.light, comeback: ctx.lastDays >= CFG.COMEBACK_DAYS, lowRun: S.lowRun });
  const verdict = S.moodDemo !== 'auto' ? S.moodDemo : j.verdict;
  S.lowRun = verdict === 'low' ? S.lowRun + 1 : verdict === 'na' ? S.lowRun : 0;
  S.mood = { verdict, ratio: S.moodDemo === 'auto' ? j.ratio : null, why: j.why, date: TODAY, quiet: S.moodDemo === 'auto' && j.quiet, line: verdict === 'na' ? '' : MOOD[verdict].lines[Math.floor(Math.random() * MOOD[verdict].lines.length)] };
  if (S.mood.quiet) S.mood.line = QUIET_LINE;
  S.session = null; S.demo = 'none'; S.rest = null; S.lastResult = rec.id;
  return { res, got: gained + cb, held: heldAll(rec) };
}
/* 보류 해제 — 24시간이 지나면 자동(앱을 열 때 releaseDue), 시연 버튼(🧪 24시간 뒤)도 같은 함수 */
function releaseHeld(r) {
  const cbr = r.br && r.br.v === 'V1' ? centerBonus(r.br, ledger(r.id)) : { cb: 0, cut: 0 }, g = r.held + cbr.cb; r.xp += g; r.held = 0; r.heldCb = 0; r.xpCenter = cbr.cb; r.cbCut = cbr.cut; S.savedNote = null;
  const res = applyXP({ level: S.level, xp: S.xp }, g); gainEx(g); S.level = res.level; S.xp = res.xp;
  if (res.level > res.from) r.lvUp = { from: res.from, to: res.level };
  return { res, g };
}
function releaseDue() {
  const due = S.records.filter(r => r.held > 0 && typeof r.id === 'number' && Date.now() - r.id >= 864e5); if (!due.length) return;
  let from = S.level, sum = 0; due.forEach(r => { sum += releaseHeld(r).g; });
  save(); setTimeout(() => afterGain({ from, level: S.level, xp: S.xp }, { toast: `기다리던 ${fmt(sum)} XP가 들어왔어요`, to: null }), 400);
}
/* v1.40(형 11-11 승인 · QA 치7): 기록 수정·삭제 = 그 기록의 경험치를 통째로 다시 계산해 «차이»만 화면 레벨·운동 레벨에 반영(내려가는 것 포함).
   입점 보너스·부스터 몫도 같이 다시 센다. 수정으로 레벨이 올라도 레벨업 연출은 다시 틀지 않는다(연출 반복 방지) */
function shiftXP(diff, exDiff) {
  const from = S.level, a = applyXP({ level: S.level, xp: S.xp }, diff); S.level = a.level; S.xp = a.xp; gainEx(exDiff);
  if (S.level < from) { S.events = S.events.filter(ev => ev.to <= S.level); if (!S.events.some(ev => ev.id === S.pending)) S.pending = null; }   // 내려간 레벨의 «레벨업 다시 보기»는 같이 정리
  return { from, to: S.level };
}
const lvNote = m => m.to !== m.from ? ` · Lv.${m.from} → ${m.to}` : '';
const exPart = r => (r.xp || 0) - (r.xpBoost || 0);
function deleteRec(id) {
  const r = S.records.find(x => x.id === id); if (!r) return;
  const m = shiftXP(-(r.xp || 0), -exPart(r));
  S.records = S.records.filter(x => x.id !== id);
  if (S.lastResult === id) S.lastResult = null;
  if (S.mood && S.mood.date === r.date && !S.records.some(x => x.date === r.date)) S.mood = null;
  S.editRec = null; S.recId = null; shClose();
  const back = S.recFrom === 'stats' || S.recFrom === 'settings' ? S.recFrom : null;
  if (r.xp) flash(`기록을 지웠어요 · ${fmt(r.xp)} XP가 빠졌어요${lvNote(m)}`, 'minus'); else flash('기록을 지웠어요');
  go('workout', back);
}
const delRecSheet = (r, emptied = false) => sheet(`<div class="h2">${emptied ? '세트를 모두 지웠어요. 이 기록을 지울까요?' : '이 기록을 지울까요?'}</div>
  <div class="muted" style="line-height:1.6"><b style="color:var(--ink)">${md(r.date)} · ${esc(r.summary)}</b><br>${r.xp ? `받았던 ${fmt(r.xp)} XP가 빠지고, 그만큼 레벨이 내려갈 수 있어요. ` : ''}운동한 날 표시에서도 빠져요. 지운 기록은 되돌릴 수 없어요.</div>
  <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose" id="delRecNo">취소</button><button class="btn danger" data-act="delRecOk" data-id="${r.id}" id="delRecOk">지우기</button></div>`);
const sameItems = (x, y) => JSON.stringify(x.map(({ ex, sets, min }) => [ex, (sets || []).filter(q => q.done).map(q => [q.w, q.r, q.s]), min])) === JSON.stringify(y.map(({ ex, sets, min }) => [ex, (sets || []).filter(q => q.done).map(q => [q.w, q.r, q.s]), min]));
function editSave() {
  if (!commitWeightField()) return;
  const r = S.records.find(x => x.id === S.recId), items = S.editRec.items.filter(x => (x.sets || []).some(q => q.done) || x.min > 0);
  if (sameItems(items, r.items || [])) { S.editRec = null; save(); render(); return toast('바뀐 내용이 없어 그대로 뒀어요'); }   // QA 중26: 안 바꿨는데 경험치가 바뀌던 것
  if (!items.length) return delRecSheet(r, true);   // QA 중34: 세트를 다 지우면 «기록 없음 +0 XP» 줄 대신 기록 삭제로
  /* v1.41: 24시간 안(ed.keep) = 등급·입점 보너스·셀카 보너스 유지 / 24시간 뒤 = 자가 기록으로(예전 규칙) */
  const ed = editCalc(r, items), was = r.xp || 0;
  const common = ed.keep ? { items, summary: summaryOf(items), raw: ed.br.raw, br: ed.br, centerBase: ed.br.baseXP, prCount: ed.prCount, centerIf: null, editedAt: Date.now() }
    : { items, summary: summaryOf(items), raw: ed.br.raw, v: 'self', br: ed.br, selfieXP: 0, selfieIn: 0, xpCenter: 0, cbCut: 0, centerIf: null, edited: true };
  const done = () => { S.editRec = null; save(); render(); window.scrollTo(0, 0); };
  if (r.held) {   // QA 중19: 보류 중인 기록은 지금 주지 않고 «24시간 뒤 반영될 양»만 새 값으로
    Object.assign(r, common, ed.keep ? { held: ed.cap.gained, heldCb: ed.cbr.cb, cut: ed.cap.cut, cutReason: ed.cap.reason, xpBoost: ed.cap.boostGained } : { held: ed.xp, heldCb: 0, cut: ed.cap.cut, cutReason: ed.cap.reason, xpBoost: 0 });
    flash(`수정했어요 · 24시간 뒤에 ${fmt(heldAll(r))} XP가 들어와요`); return done(); }
  const diff = ed.xp - was, exDiff = (ed.xp - ed.cap.boostGained) - exPart(r);
  Object.assign(r, common, { xp: ed.xp, xpBoost: ed.cap.boostGained, cut: ed.cap.cut, cutReason: ed.cap.reason },
    ed.keep ? { xpCenter: ed.cbr.cb, cbCut: ed.cbr.cut, selfieXP: ed.br.selfieXP, selfieIn: ed.cap.selfieGained } : {});
  const m = shiftXP(diff, exDiff);
  /* 부호가 헷갈리지 않게 «이 기록이 얼마에서 얼마가 됐는지»와 «빠졌다/더 받았다»를 말로 적는다 */
  if (diff < 0) flash(`수정했어요 · 이 기록 +${fmt(was)} → +${fmt(ed.xp)} XP · ${fmt(-diff)} XP가 빠졌어요${lvNote(m)}`, 'minus');
  else if (diff > 0) flash(`수정했어요 · 이 기록 +${fmt(was)} → +${fmt(ed.xp)} XP · ${fmt(diff)} XP를 더 받았어요${lvNote(m)}`);
  else flash('수정했어요 · 경험치는 그대로예요');
  done();
}
/* 레벨업이면 연출(C8) 뒤 요약(C7), 아니면 바로 요약 */
function afterGain(res, { toast: msg, to = 'result' } = {}) {
  const done = () => { if (to === null) render(); else go('workout', to); if (msg) toast(msg); };
  if (res.level > res.from) {
    let big = false; for (let l = res.from + 1; l <= res.level; l++) if (isBigBoundary(l)) big = true;
    const d = new Date(), at = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const ev = { id: Date.now(), from: res.from, to: res.level, big, type: S.type, at, watched: false, skipped: false, replays: 0 };
    S.events.push(ev); S.pending = ev.id; save();   // 연출 전에 먼저 기록 → 끊겨도 다음 진입 때 재생
    play(ev, { onDone: done });
  } else { save(); done(); }
}
function autoEndCheck() {
  const s = S.session; if (!s || P) return;
  if (Date.now() - s.lastAt > CFG.AUTO_END_MIN * 60000 && !autoEndCheck.busy) { autoEndCheck.busy = true; setTimeout(() => { autoEndCheck.busy = false; endSession(true); }, 0); }
}

/* ===== 셀카 (C7b) — 웹 카메라. 못 열면 흉내 그림 없이 안내만(형 11-10: 흉내 그림이 카메라 화면처럼 보여 헷갈림) → 앨범·카메라 앱 ===== */
let STREAM = null, CAM_P = null;
const camMsg = e => e && e.name === 'NotAllowedError' ? '카메라 권한이 꺼져 있어요 · 설정에서 켜 주세요'
  : e && e.name === 'NotFoundError' ? '이 기기에서 쓸 수 있는 카메라가 없어요'
  : '브라우저에서 카메라를 열 수 없어요';
function camUI(on, msg) {
  const v = $('camV'); if (!v) return;
  v.classList.toggle('on', on); $('camOff').hidden = on; $('shutter').disabled = !on;
  $('camState').textContent = on ? '얼굴이나 거울 셀카로 · 다른 회원이 안 나오게' : msg;
}
async function camStart() {
  if (CAM_P) return CAM_P;   // render 가 겹쳐 불러도 getUserMedia 는 한 번만
  CAM_P = (async () => {
    let v = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('getUserMedia 미지원'), { name: 'NotSupportedError' });
      if (!STREAM) STREAM = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      v = $('camV'); if (!v) return camStop();
      if (v.srcObject !== STREAM) v.srcObject = STREAM;
      await v.play();
      if (v.isConnected) camUI(true); else if ($('camV')) { CAM_P = null; return camStart(); }   // 기다리는 사이 화면이 다시 그려짐 → 새 video 에 붙임
    } catch (e) {
      if (STREAM && v && !v.isConnected && $('camV')) { CAM_P = null; return camStart(); }   // 옛 video 의 play 가 끊긴 것뿐
      console.warn('[selfie] camera', e && e.name, e && e.message);
      camStop(); camUI(false, camMsg(e));
    } finally { CAM_P = null; }
  })();
  return CAM_P;
}
function camStop() { if (STREAM) { STREAM.getTracks().forEach(t => t.stop()); STREAM = null; } }
function shoot() {
  const v = $('camV');
  if (!(STREAM && v && v.videoWidth)) { toast('카메라가 안 열렸어요 · 앨범에서 고르거나 카메라 앱으로 찍어 주세요'); return; }
  const c = document.createElement('canvas'); c.width = 240; c.height = 320; const g = c.getContext('2d');
  const r = Math.min(v.videoWidth / 3, v.videoHeight / 4), w = r * 3, h = r * 4; g.translate(240, 0); g.scale(-1, 1); g.drawImage(v, (v.videoWidth - w) / 2, (v.videoHeight - h) / 2, w, h, 0, 0, 240, 320);
  saveShot(c.toDataURL('image/jpeg', .72));
}
function saveShot(url) {
  S.shot = url; S.selfieStep = 'done'; camStop(); tone(1400, 0, .06, 'square', .05); applySelfie(); save(); render();
}
function applySelfie() {
  S.selfieSwap = false;
  if (S.selfieFor === 'session' && S.session) { S.selfieGot = 0; S.session.selfie = { ...SELFIE_SHOT }; S.session.photo = S.shot; S.session.lastAt = Date.now(); return; }
  const rec = S.records.find(r => r.id === S.lastResult); if (!rec) return;
  rec.photo = S.shot;
  // 이미 보너스 받은 기록 → 다시 찍기는 사진만 교체(경험치 재부여 없음). 방금 이 흐름에서 받은 보너스(selfieRes)는 확인 전까지 안내 유지
  if (rec.selfieXP > 0) { if (!S.selfieRes) { S.selfieGot = 0; S.selfieSwap = true; } return; }
  S.selfieGot = 0;
  const c = selfieCalc(rec); if (!c || !c.r2.selfieXP) return;   // 하루 1회·대상 기록 없음 → 사진만 저장
  const g = c.g; rec.br = c.r2; rec.raw = c.r2.raw; rec.selfieXP = c.r2.selfieXP; rec.selfieIn = Math.max(0, c.r2.selfieXP - c.cut); rec.xp += g; S.selfieGot = g;
  if (c.cut) { rec.cut = (rec.cut || 0) + c.cut; rec.cutReason = rec.cutReason || c.reason; }
  const res = applyXP({ level: S.level, xp: S.xp }, g); gainEx(g);
  S.level = res.level; S.xp = res.xp;
  if (res.level > res.from) rec.lvUp = { from: rec.lvUp ? rec.lvUp.from : res.from, to: res.level };
  S.selfieRes = res;
}

/* ===== 바텀시트 (기존 화면은 밀지 않고 덮는다) ===== */
function sheet(html, keep = false) { const el = $('sheet'); el.innerHTML = `<div class="sh-bg" data-act="shClose"></div><div class="sh${keep ? ' still' : ''}" role="dialog">${html}</div>`; el.classList.add('on'); }
function shClose() { const el = $('sheet'); el.classList.remove('on'); el.innerHTML = ''; }

/* ===== 효과형 아이템 사용 — 계산기와 같은 함수로 효과 미리 보여 주기(결정 33: 아이템 경험치는 한도 없음) ===== */
function useItem(id) {
  const it = ITEMS.find(i => i.id === id), L = ledger();
  if (id === 'charm') { S.inv.charm--; S.shields++; save(); render(); return toast('연속 보호권 1장을 넣어 뒀어요 · 설정에서 확인할 수 있어요'); }
  const nolimit = `<div class="notice nolimit" id="useNoLimit">💰 아이템 경험치는 <b>한도 없음</b><br>이번 주 운동 한도(${fmt(weekXP())}/${CFG.WEEK_CAP.toLocaleString()})와는 따로 계산해요</div>`;
  if (id === 'potion' && S.level >= 99) return toast('최고 레벨이라 경험치는 더 오르지 않아요 · 물약은 그대로 있어요');
  if (id === 'potion') {
    const g = potionGain(L);
    return sheet(`<div class="h2">경험치 물약을 쓸까요?</div><div class="xrow"><span>지금 바로</span><b>+${fmt(g.gained)} XP</b></div>${nolimit}
      <div class="muted">유료 경험치라 랭킹에 💰가 붙고, «운동만 보기»·주간 리그엔 안 들어가요 · 하루 몇 병이든 쓸 수 있어요</div>
      <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="usePotion">사용</button></div>`);
  }
  const f = forecastWeek({ L, sessions: Math.max(1, usualWeek() - weekCount()), per: avgSession(), booster: id === 'boost1' ? 'one' : '7d', potions: 0 });
  sheet(`<div class="h2">${it.name}을 쓸까요?</div>
    <div class="xrow"><span>더 받을 경험치(예상)</span><b>+${fmt(f.extra)} XP</b></div>${nolimit}
    <div class="muted">이번 주 운동 ${Math.max(1, usualWeek() - weekCount())}번 더 · 1번 ${fmt(avgSession())} XP 기준 · 2배로 늘어난 몫은 운동 한도를 다 채운 주에도 그대로 들어가요</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="useBoost" data-id="${id}">사용</button></div>`);
}
/* ===== 사운드 (WebAudio 합성, 에셋 없음) ===== */
let AC;
function tone(freq, start, dur, type = 'sine', vol = .12) {
  if (!S.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + start;
    o.type = type; o.frequency.setValueAtTime(freq, t0); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + dur + .05);
  } catch {}
}
const sfxShort = () => { tone(784, 0, .25); tone(1047, .12, .4); };
const sfxRise = () => { for (let i = 0; i < 14; i++) tone(300 + i * 45, i * .18, .2, 'triangle', .06); };
const sfxReveal = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .06, 1.0, 'sine', .09)); };

/* ===== 진화 연출 플레이어 ===== */
let P = null;
function setImg(el, t, lv, boxH) { const c = charImg(t, lv, boxH); el.src = c.src; el.style.width = c.w + 'px'; el.style.height = c.h + 'px'; return c; }
function burst(color) {
  const box = $('evoParts'); box.innerHTML = '';
  for (let i = 0; i < 22; i++) { const a = Math.PI * 2 * i / 22, r = 110 + Math.random() * 70;
    box.insertAdjacentHTML('beforeend', `<i style="--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r}px;--d:${Math.random()*.15}s;background:${color}"></i>`); }
}
function play(ev, { replay = false, onDone } = {}) {
  const el = $('evo'), old = $('evoOld'), nw = $('evoNew'), ring = $('evoRing');
  const t = ev.type || S.type, tr = tierOf(ev.to);
  const boxH = $('evoStage').clientHeight || 300;
  const evolved = ev.big && stageIdx(ev.from) !== stageIdx(ev.to);
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  P = { ev, replay, onDone, timers, done: false, phase: 'run' };
  el.className = `evo on ${ev.big ? 'big' : 'short'} tier${tr}`; el.setAttribute('aria-hidden', 'false');
  [old, nw].forEach(i => { i.className = i.id === 'evoOld' ? 'evo-old' : 'evo-new'; i.style.opacity = 0; i.style.transform = ''; });
  ring.className = 'evo-ring'; $('evoFlash').className = 'evo-flash'; $('evoParts').innerHTML = ''; $('evoClip').style.display = 'none';
  $('evoOk').classList.remove('show');
  $('evoSound').textContent = S.sound ? '🔊' : '🔇';
  $('evoTag').textContent = replay ? '다시 보기' : (ev.to - ev.from > 1 ? `${ev.to - ev.from}레벨 한꺼번에` : '');
  const name = CH[t].name;
  const oc = setImg(old, t, ev.from, boxH); const nc = setImg(nw, t, ev.to, boxH);
  const ringStyle = c => { ring.className = `evo-ring ring t${tr}`; ring.style.width = Math.max(c.w * 1.1, boxH * .7) + 'px'; ring.style.height = boxH * .14 + 'px'; };
  const lvNum = $('evoLvNum'); lvNum.textContent = `Lv.${ev.from}`;
  $('evoTitle').textContent = ''; $('evoSub').textContent = '';
  const rollTo = (from, to, dur) => { const steps = to - from; if (steps <= 0) return; const each = Math.max(60, dur / steps);
    for (let k = 1; k <= steps; k++) at(each * k, () => { lvNum.textContent = `Lv.${from + k}`; lvNum.classList.remove('roll'); void lvNum.offsetWidth; lvNum.classList.add('roll'); }); };
  P.finish = () => {   // 결과 상태(건너뛰기도 여기로)
    timers.forEach(clearTimeout); timers.length = 0;
    old.style.opacity = 0; lvNum.textContent = `Lv.${ev.to}`;
    if (P.clip) { $('evoClipImg').src = P.clip.last; nw.style.opacity = 0; }   // v1.34 디자인 클립: 끝 프레임(링·빛 포함) 그대로 둔다
    else { nw.className = 'evo-new' + (evolved ? '' : ' glow'); nw.style.opacity = 1; ringStyle(nc); ring.classList.add('show'); }
    $('evoTitle').textContent = ev.to === 99 ? `${name}${CH[t].josa} 최고 레벨에 도달했다!` : evolved ? `${name}${CH[t].josa} «${stageName(t, ev.to)}»${ro(stageName(t, ev.to))} 진화했다!` : '레벨 업!';
    $('evoSub').textContent = ev.to === 99 ? '최고 레벨 달성 · 골드 아우라' : `칭호 «${stageName(t, ev.to)}» · ${TIER_NAME[tr]}`;
    el.classList.remove('p1', 'p2'); el.classList.add('p3');
    P.phase = 'result';
    if (ev.big) $('evoOk').classList.add('show'); else at(900, close);
  };
  if (!replay && S.quitDemo) { S.quitDemo = false; save(); at(1500, () => location.reload()); }

  if (!ev.big) {   // 짧은 연출 1~2초
    nw.className = 'evo-new glow'; nw.style.opacity = 1; ringStyle(nc); at(50, () => ring.classList.add('show'));
    at(80, () => { nw.classList.add('grow'); burst('#9FDBFF'); sfxShort(); });
    $('evoTitle').textContent = '레벨 업!';
    rollTo(ev.from, ev.to, 700);
    at(800, () => { $('evoSub').textContent = `칭호 «${stageName(t, ev.to)}»`; });
    at(1900, close);
    return;
  }
  const clip = evoClipFor(t, ev), me = P;
  if (clip) {   // v1.34 5단계 디자인 진화 클립(다크 GIF, 캐릭터 뒤 효과·링·반짝이 포함) → 앱 광선·링·실루엣 교차는 끄고 배경을 클립 바탕색으로
    P.clip = clip; el.classList.add('clip', 'p1'); el.style.setProperty('--clipbg', clip.bg);
    const box = $('evoClip'), img = $('evoClipImg'); box.style.cssText = `display:block;width:${clip.w * 2}px;height:${clip.h * 2}px;background:${clip.bg}`; img.removeAttribute('src');
    $('evoTitle').textContent = evolved ? `어? ${name}의 몸이…!` : ev.to === 99 ? `${name}에게서 빛이…!` : '레벨 업!';
    sfxRise();
    clipPlay(img, clip.src).then(() => { if (P !== me || me.done) return; rollTo(ev.from, ev.to, Math.max(600, clip.ms - 900)); at(clip.ms, () => { if (P === me && !me.done) { sfxReveal(); me.finish(); } }); })
      .catch(e => { console.error(e); if (P !== me || me.done) return; me.clip = null; box.style.display = 'none'; me.finish(); });
    return;
  }
  // 큰 연출: 이전 모습 → 실루엣 깜빡임(크기 보간) → 번쩍 → 새 모습
  old.style.opacity = 1; el.classList.add('p1');
  $('evoTitle').textContent = evolved ? `어? ${name}의 몸이…!` : ev.to === 99 ? `${name}에게서 빛이…!` : '레벨 업!';
  at(1000, () => {
    old.classList.add('sil'); nw.classList.add('sil'); sfxRise();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;   // 광과민·동작 줄이기: 깜빡임 대신 천천히 교차
    if (reduce) [old, nw].forEach(i => i.style.transition = 'opacity .9s');
    const seq = reduce ? [200, 1400] : [380, 330, 290, 250, 210, 180, 150, 120, 110, 100, 100, 100, 100, 100];
    let tt = 0; seq.forEach((d, i) => { tt += d; at(tt, () => { const showNew = i % 2 === 0; old.style.opacity = showNew ? 0 : 1; nw.style.opacity = showNew ? 1 : 0; }); });
    rollTo(ev.from, ev.to, tt);
    at(tt + 40, () => { if (!reduce) $('evoFlash').classList.add('go'); [old, nw].forEach(i => i.style.transition = ''); });
    at(tt + 260, () => {
      old.style.opacity = 0; nw.classList.remove('sil'); nw.style.opacity = 1; nw.classList.add('pop');
      burst(tr === 6 ? '#E5B158' : tr >= 4 ? '#FF4D8F' : '#9FDBFF'); sfxReveal(); P.finish();
    });
  });
}
function close() {
  if (!P || P.done) return; P.done = true; P.timers.forEach(clearTimeout);
  const el = $('evo'); el.className = 'evo'; el.setAttribute('aria-hidden', 'true'); $('evoClip').style.display = 'none';
  const ev = S.events.find(e => e.id === P.ev.id);
  if (ev) { if (P.replay) ev.replays = (ev.replays || 0) + 1; else { ev.watched = true; ev.skipped = !!P.skipped; } }
  if (!P.replay && S.pending === P.ev.id) S.pending = null;
  save(); const cb = P.onDone; P = null; cb ? cb() : render();
}
function skip() {
  if (!P || P.done) return;
  if (P.phase === 'result') return close();
  P.skipped = true;
  if (P.ev.big) P.finish(); else close();
}
$('evo').addEventListener('click', e => { if (e.target.closest('#evoSound')) return; if (e.target.closest('#evoOk')) return close(); skip(); });
$('evoSound').addEventListener('click', () => { S.sound = !S.sound; save(); $('evoSound').textContent = S.sound ? '🔊' : '🔇'; });

/* ===== 이벤트 ===== */
const clampStep = (v, d, step, min, max) => Math.min(max, Math.max(min, Math.round((v + d * step) * 10) / 10));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tab],[data-act]'); if (!b || b.closest('#evo')) return;
  if (b.tagName === 'DETAILS' || b.tagName === 'INPUT' && b.type === 'checkbox') return;
  if (b.dataset.tab) return go(b.dataset.tab);
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v, dd = +b.dataset.d || 0;
  const s = S.session, it = curItem();
  if (a === 'pose') { sigPlayHome(); return; }
  if (a === 'sigSeg') { sigSegPlay(v); return; }
  if (a === 'flexPlay') { flexPlay(v); return; }
  if (a === 'shClose') return shClose();
  if (a === 'sub') { if (v === 'calc') S.calc = null; shClose(); return go('workout', v); }
  if (a === 'goPhotos') { shClose(); go('workout', 'settings'); const pc = $('photoCard'); if (pc) pc.scrollIntoView({ block: 'center' }); return; }
  if (a === 'hardResetAsk') return sheet(`<div class="h2">처음 상태로 돌아갈까요?</div><div class="muted" style="line-height:1.6">지금까지의 기록과 레벨이 모두 지워지고, 되돌릴 수 없어요.</div><div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn danger" data-act="hardReset" id="hardReset">처음으로</button></div>`);
  if (a === 'hardReset') { shClose(); try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(KEY + '_broken_backup', raw.slice(0, 200000)); } catch {} S = fresh(); S.tab = 'workout'; save(); return render(); }
  if (a === 'delRec') { const r = S.records.find(x => x.id === S.recId); return r && delRecSheet(r); }
  if (a === 'delRecOk') return deleteRec(+id);
  if (a === 'editSave') return editSave();
  if (a === 'back') { S.editRec = null; return go('workout', v || null); }
  if (a === 'start') return startSession();
  if (a === 'place') { S.placeOpen = null; return pickPlace(v); }
  if (a === 'placeLinked') { S.placeOpen = S.placeOpen === v ? null : v; save(); return render(); }
  if (a === 'placeEnter') { S.placeOpen = null; openSession({ name: v, kind: 'center' }, 'V1'); return toast(`입장 확인! ${v}에서 운동 시작`); }
  if (a === 'findCenter') { S.nbOnly = true; S.nbFrom = S.tab === 'workout' ? S.sub || 'main' : null; return go('nearby'); }
  if (a === 'nbOnly') { S.nbOnly = !S.nbOnly; save(); return render(); }
  if (a === 'exImg') return exImgSheet(v);
  if (a === 'exImgAdd') { shClose(); return addEx(v); }
  if (a === 'addEx') return addEx(v);
  if (a === 'openEx') { S.cur = v; return go('workout', EX[v].mode === 'cardio' ? 'cardio' : EX[v].mode === 'lesson' ? 'session' : 'set'); }
  if (a === 'routine') return loadRoutine();
  if (a === 'customEx') { const name = S.q.trim().replace(/[<>"&]/g, '').slice(0, 20); if (!name) return;
    const home = S.session && S.session.place.kind !== 'center';
    S.cx = { name, cat: S.gear !== 'all' && !(home && S.gear === 'machine') ? S.gear : home ? 'body' : 'machine', part: S.part !== 'all' ? S.part : '전신' }; return cxSheet(); }
  if (a === 'cxCat') { S.cx.cat = v; return cxSheet(); }
  if (a === 'cxPart') { S.cx.part = v; return cxSheet(); }
  if (a === 'cxOk') return cxCreate();
  if (a === 'endSession' || a === 'endOk') { shClose(); return endSession(); }
  if (a === 'endAsk') return endAsk();
  if (a === 'discardAsk') { const n = s ? s.items.filter(i => (i.sets || []).some(x => x.done) || i.min > 0 || i.run).length : 0;
    return sheet(`<div class="h2" id="discTitle">저장하지 않고 끝낼까요?</div><div class="muted" style="line-height:1.6;word-break:keep-all">오늘 적은 운동 ${n}종목이 사라지고, 되돌릴 수 없어요. 경험치도 못 받아요.</div>
      <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose" id="discNo">계속 운동하기</button><button class="btn danger" data-act="discard" id="discOk">그만두기</button></div>`); }
  if (a === 'rapidAsk') return rapidAsk();
  if (a === 'rapidBatch' || a === 'rapidHold') { if (!s || s.rapid) return shClose();
    if (a === 'rapidBatch' && batchLeft(s)) { s.rapid = 'batch'; S.batchDay = sessDay(s); S.batchSess = s.id; } else s.rapid = 'hold';
    shClose(); save(); render();
    return toast(s.rapid === 'batch' ? '한꺼번에 적는 기록으로 바꿨어요 · 자가 기록으로 바로 받아요' : '이번 운동 경험치는 24시간 뒤에 들어와요'); }
  if (a === 'setEdit') { if (!it) return; const st = it.sets[+b.dataset.i]; if (!st) return; S.setEdit = { ex: it.ex, i: +b.dataset.i, w: st.w, r: st.r, s: st.s }; return setEditSheet(); }
  if (a === 'sew' || a === 'ser' || a === 'ses') { const E = S.setEdit; if (!E || !commitWeightField()) return;
    if (a === 'sew') E.w = clampStep(E.w, dd, EX[E.ex].step || 2.5, 0, 500); else if (a === 'ser') E.r = clampStep(E.r, dd, 1, 1, 100); else E.s = clampStep(E.s, dd, 10, 10, 1800);
    return setEditSheet(true); }
  if (a === 'seSave' || a === 'seDel') { const E = S.setEdit, x = E && s && s.items.find(i => i.ex === E.ex); if (!x || !x.sets[E.i]) { S.setEdit = null; return shClose(); }
    if (a === 'seSave') { if (!commitWeightField()) return; const st = x.sets[E.i], e2 = EX[x.ex], prev = histOf(x.ex).find(h => h.sets && h.sets.length);
      st.w = E.w; st.r = E.r; st.s = E.s;
      if (checkWeight(e2, st.w, { bodyweight: S.bodyweight, bestW: bestW(x.ex), lastTopW: prev ? Math.max(...prev.sets.map(q => q.w || 0)) : 0 }).unreal) st.unreal = true; else delete st.unreal; }
    else { x.sets.splice(E.i, 1); if (S.rest && S.rest.ex === x.ex) S.rest = null; }
    rePR(x); s.lastAt = Date.now(); S.setEdit = null; shClose(); save(); render();
    return toast(a === 'seSave' ? `${E.i + 1}세트를 고쳤어요` : `${E.i + 1}세트를 지웠어요`); }
  if (a === 'discard') { shClose(); S.session = null; save(); toast('기록 없이 운동을 끝냈어요'); return go('workout'); }
  if (a === 'setDone') return setDone();
  if (a === 'setForce') return setDone(true);
  if (a === 'selfie') { S.selfieFor = v; S.selfieStep = S.selfieSeen ? 'cam' : 'guide'; S.shot = null; S.selfieRes = null; return go('workout', 'selfie'); }
  if (a === 'reshoot') { if (S.sub !== 'selfie') S.selfieRes = null; S.selfieFor = v; S.selfieSeen = true; S.selfieStep = 'cam'; S.shot = null; return go('workout', 'selfie'); }
  if (a === 'sfDel') {
    if (v === 'session') { if (S.session) { S.session.selfie = null; S.session.photo = null; } }
    else { const rec = S.records.find(r => r.id === S.lastResult); if (rec) rec.photo = null; }   // 그날 보너스는 유지(하루 1번 규칙 혼선 방지)
    save(); render(); return toast('사진을 지웠어요'); }
  if (a === 'selfieGo') { S.selfieSeen = true; S.selfieStep = 'cam'; }
  else if (a === 'shoot') return shoot();
  else if (a === 'selfieOk') { const res = S.selfieRes; S.selfieRes = null; S.shot = null; S.bump = 1;
    if (S.selfieFor === 'session') return go('workout', 'session');
    if (res && res.level > res.from) return afterGain(res, { toast: `오운완 보너스 +${fmt(S.selfieGot)} XP` });
    go('workout', 'result'); S.bump = 0; if (S.selfieGot) toast(`오운완 보너스 +${fmt(S.selfieGot)} XP`); return; }
  else if (a === 'stw') { if (!commitWeightField()) return; it.draft.w = clampStep(it.draft.w, dd, EX[it.ex].step || 2.5, 0, 500); it.dirty = true; }
  else if (a === 'str') { if (!commitWeightField()) return; it.draft.r = clampStep(it.draft.r, dd, 1, 1, 100); it.dirty = true; }
  else if (a === 'sts') { if (!commitWeightField()) return; it.draft.s = clampStep(it.draft.s, dd, 10, 10, 1800); it.dirty = true; }
  else if (a === 'qw') { if (!commitWeightField()) return; it.draft.w = v[0] === '=' ? +v.slice(1) : Math.min(W_MAX, Math.round((it.draft.w + +v) * 2) / 2); it.dirty = true; }
  else if (a === 'qs') { if (!commitWeightField()) return; it.draft.s = Math.min(1800, it.draft.s + +v); it.dirty = true; }
  else if (a === 'qmin') { if (!commitWeightField()) return; it.draft.min = +v; }
  else if (a === 'rest') { if (+v === 0) S.rest = null; else { S.rest.until += +v * 1000; S.rest.total = Math.max(S.rest.total, Math.ceil((S.rest.until - Date.now()) / 1000)); } }
  else if (a === 'cmode') it.draft.mode = v;
  else if (a === 'cStart') { it.run = { startAt: Date.now(), offset: 0 }; s.lastAt = Date.now(); }
  else if (a === 'cFwd') { it.run.offset += 600000; }
  else if (a === 'cStop') { const ms = Date.now() - it.run.startAt + it.run.offset; it.min = Math.min(CFG.LIM.cardioMaxMin, (it.min || 0) + Math.max(1, Math.round(ms / 60000))); it.run = null; it.draft.min = it.min; it.level = it.draft.level; s.lastAt = Date.now(); toast(`${EX[it.ex].name} ${it.min}분 기록`); }
  else if (a === 'cmin') { if (!commitWeightField()) return; it.draft.min = clampStep(Math.round(it.draft.min / 5) * 5 === it.draft.min ? it.draft.min : (dd > 0 ? Math.floor(it.draft.min / 5) * 5 : Math.ceil(it.draft.min / 5) * 5), dd, 5, 5, CFG.LIM.cardioMaxMin); }
  else if (a === 'clevel') { it.draft.level = v; if (it.min) it.level = v; }
  else if (a === 'ckm') { it.draft.km = clampStep(it.draft.km, dd, 0.5, 0, 60); it.draft.open = true; }
  else if (a === 'ckmh') { it.draft.kmh = clampStep(it.draft.kmh, dd, 0.5, 0, 30); it.draft.open = true; }
  else if (a === 'cinc') { it.draft.inc = clampStep(it.draft.inc, dd, 1, 0, 15); it.draft.open = true; }
  else if (a === 'cSave') { if (!commitWeightField()) return; if (it.draft.mode === 'input') { it.min = it.draft.min; it.run = null; }   // QA 중13: 직접 입력으로 저장하면 버튼에 적힌 시간 그대로(돌던 타이머는 버림)
    if (it.run) { const ms = Date.now() - it.run.startAt + it.run.offset; it.min = Math.min(CFG.LIM.cardioMaxMin, (it.min || 0) + Math.max(1, Math.round(ms / 60000))); it.run = null; }
    if (!it.min) return toast('시간을 적어 주세요 — 시작을 누르거나 직접 적으면 돼요');
    it.level = it.draft.level; it.km = it.draft.km || undefined; it.kmh = it.draft.kmh ? Math.min(25, it.draft.kmh) : undefined; it.inc = it.draft.inc || undefined; it.draft.min = it.min; s.lastAt = Date.now();
    toast(`${EX[it.ex].name} ${it.min}분 저장`); return go('workout', 'session'); }
  else if (a === 'demo') S.demo = v;
  else if (a === 'mdemo') S.moodDemo = v;
  else if (a === 'vdemo') { s.verify = v; if (v === 'V3' && !s.items.some(i => i.ex === 'lesson_pt')) s.items.unshift({ ex: 'lesson_pt', min: 50 }); if (v !== 'V3') s.items = s.items.filter(i => i.ex !== 'lesson_pt'); }
  else if (a === 'autoEndDemo') { s.lastAt = Date.now() - (CFG.AUTO_END_MIN + 1) * 60000; save(); return render(); }
  else if (a === 'holdDemo') S.holdDemo = !S.holdDemo;
  else if (a === 'release') { const r = S.records.find(x => x.id === +id); if (!r || !r.held) return; const { res, g } = releaseHeld(r);
    return afterGain(res, { toast: `기다리던 ${fmt(g)} XP가 들어왔어요` }); }
  else if (a === 'mset') { const mm = MOOD[v]; S.mood = { verdict: v, ratio: null, date: TODAY, line: mm.lines[0] }; }
  else if (a === 'wseg') S.wseg = v;
  else if (a === 'pick') S.pick = v;
  else if (a === 'choose') { S.type = S.pick || S.type; S.chosen = true; S.pick = null;
    if (!S.onboarded) return go('workout', 'onbPerm');
    S.sub = null; toast(`${CH[S.type].name}${wa(S.type)} 운동 시작!`); }
  else if (a === 'perm') { S.perm[v] = !S.perm[v]; }
  else if (a === 'obDone') { S.onboarded = true; toast(`${CH[S.type].name}${wa(S.type)} 운동 시작!`); return go('workout'); }
  else if (a === 'rechoose') { if (S.level >= 10) return toast('Lv.10부터는 캐릭터 변경권이 있어야 바꿀 수 있어요'); S.chosen = false; S.sub = null; }
  else if (a === 'saveWorkout') return endAsk();
  else if (a === 'coach') return toast('코칭 대화(C9)는 프로토타입 범위 밖 · 월 20회');
  else if (a === 'invite') return toast('친구 초대(C15b)는 프로토타입 범위 밖');
  else if (a === 'ftab') S.fTab = v;
  else if (a === 'pure') S.pureOnly = !S.pureOnly;
  else if (a === 'stab') S.sTab = v;
  else if (a === 'part') { S.part = v; }
  else if (a === 'gear') { S.gear = v; }
  else if (a === 'buy') { const x = ITEMS.find(i => i.id === id); if (id === 'potion' && S.level >= 99) return toast('최고 레벨이라 경험치 물약은 효과가 없어요 · 포인트는 그대로예요'); if (S.points < x.price) return toast('포인트가 부족해요 — 니짐 포인트 충전 화면으로 넘어가요');
    S.points -= x.price; if (x.use) S.inv[id] = (S.inv[id] || 0) + 1; else S.owned[id] = 1; toast(`${x.name} 구매 완료 · -${x.price}P`); }
  else if (a === 'use') return useItem(id);
  else if (a === 'eatUse') return eatUse(id);
  else if (a === 'buyFood') return buyFood(id);
  else if (a === 'eatCat') S.eatCat = v;
  else if (a === 'useBoost') { S.inv[id]--; if (id === 'boost1') S.boostNext = true; else { const d = new Date(); d.setDate(d.getDate() + 6); S.boost7Until = ymd(d); } shClose(); toast(id === 'boost1' ? '다음 운동 1번 경험치 2배!' : '7일 동안 경험치 2배!'); }
  else if (a === 'usePotion') { if (S.level >= 99) { shClose(); return toast('최고 레벨이라 경험치는 더 오르지 않아요 · 물약은 그대로 있어요'); } const g = potionGain(ledger()); S.inv.potion--; S.paidLog.push({ id: Date.now(), date: TODAY, xp: g.gained, v: 'paid' }); shClose();
    const res = applyXP({ level: S.level, xp: S.xp }, g.gained); S.level = res.level; S.xp = res.xp;
    return afterGain(res, { toast: `물약 +${fmt(g.gained)} XP · 💰 유료 경험치`, to: 'shop' }); }
  else if (a === 'calc') { const c = S.calc, lim = { sessions: [0, 7, 1], per: [0, 1200, 20], potions: [0, 7, 1] }[b.dataset.k]; c[b.dataset.k] = clampStep(c[b.dataset.k], dd, lim[2], lim[0], lim[1]); }
  else if (a === 'calcB') S.calc.booster = v;
  else if (a === 'cmp') { const m = S.cmp, lim = { perWeek: [0, 7, 1], per: [0, 1200, 20], potions: [0, 21, 1] }[b.dataset.k]; m[b.dataset.k] = clampStep(m[b.dataset.k], dd, lim[2], lim[0], lim[1]); }
  else if (a === 'cmpB') S.cmp.booster = v;
  else if (a === 'equip') { S.equipped[id] = !S.equipped[id]; }
  else if (a === 'ticketAuto') S.ticketAuto = !S.ticketAuto;
  else if (a === 'noti') S.noti[v] = !S.noti[v];
  else if (a === 'hideTips') S.hideTips = !S.hideTips;
  else if (a === 'bw') S.bodyweight = S.bodyweight ? (S.bodyweight + dd < 30 ? null : Math.min(200, S.bodyweight + dd)) : 70;
  else if (a === 'entryDemo') S.entryDemo = !S.entryDemo;
  else if (a === 'fillWeek') { const left = Math.max(0, CFG.WEEK_CAP - weekXP()); if (left) S.records.push({ id: Date.now(), date: weekDays().find(d => d <= TODAY && !S.records.some(r => r.date === d)) || TODAY, place: '니짐 신림점', placeKind: 'center', summary: '시연용 · 이번 주 경험치 채우기', items: [], xp: left, v: 'auto' }); toast('이번 주 경험치를 1,800까지 채웠어요(시연)'); }
  else if (a === 'rec') { S.recId = +id; S.recFrom = S.sub; S.editRec = null; return go('workout', 'rec'); }
  else if (a === 'editStart') { const r = S.records.find(x => x.id === S.recId); S.editRec = { items: JSON.parse(JSON.stringify(r.items || [])) }; FLASH = null; }
  else if (a === 'editCancel') S.editRec = null;
  else if (a === 'eSet') { const st = S.editRec.items[+b.dataset.i].sets.filter(x => x.done)[+b.dataset.s], k = b.dataset.k, e2 = EX[S.editRec.items[+b.dataset.i].ex];
    if (!commitWeightField()) return;
    st[k] = k === 'w' ? clampStep(st.w, dd, e2.step || 2.5, 0, 500) : k === 'r' ? clampStep(st.r, dd, 1, 1, 100) : clampStep(st.s, dd, 10, 10, 1800); delete st.pr; }
  else if (a === 'eDel') { const x = S.editRec.items[+b.dataset.i]; const done = x.sets.filter(q => q.done); x.sets.splice(x.sets.indexOf(done[+b.dataset.s]), 1); }
  else if (a === 'eMin') { const x = S.editRec.items[+b.dataset.i]; x.min = clampStep(x.min, dd, 5, 5, CFG.LIM.cardioMaxMin); }
  else if (a === 'delPhoto') return sheet(`<div class="h2">이 사진을 지울까요?</div><div class="muted">지운 사진은 되돌릴 수 없어요. 기록·경험치는 그대로예요.</div><div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="delPhotoOk" data-id="${id}">지우기</button></div>`);
  else if (a === 'delPhotoOk') { const r = S.records.find(x => x.id === +id); if (r) r.photo = null; shClose(); toast('사진을 지웠어요'); }
  else if (a === 'delAllPhotos') { const n = S.records.filter(r => r.photo).length; if (!n) return; return sheet(`<div class="h2">정말 사진 ${n}장을 모두 지울까요?</div><div class="muted">지운 사진은 되돌릴 수 없어요. 운동 기록·경험치·레벨은 그대로예요.</div><div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="delAllOk">전체 삭제</button></div>`); }
  else if (a === 'delAllOk') { S.records.forEach(r => { r.photo = null; }); shClose(); toast('내 사진을 모두 지웠어요'); }
  else if (a === 'sound') S.sound = !S.sound;
  else if (a === 'ph') S.placeholder = !S.placeholder;
  else if (a === 'quit') S.quitDemo = !S.quitDemo;
  else if (a === 'reset') { camStop(); S = fresh(); S.tab = 'workout'; }
  else if (a === 'replay') { const ev = S.events.find(x => x.id === +id); if (ev) play(ev, { replay: true }); return; }
  else if (a === 'playPending') return playPending();
  else if (a === 'light') return;
  save(); render();
});
document.addEventListener('change', e => {
  const a = e.target.dataset.act; if (!a) return;
  if (a === 'type') S.type = e.target.value;
  if (a === 'exprDemo') S.exprDemo = e.target.value;
  if (a === 'setlv') { S.level = +e.target.value; S.xp = 0; }
  if (a === 'light' && S.session) S.session.light = e.target.checked;
  save(); render();
});
document.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.act === 'cmore') { const it = curItem(); if (it && it.draft) { it.draft.open = e.target.open; save(); } } }, true);
document.addEventListener('input', e => {
  if (e.target.id === 'exQ') { S.q = e.target.value; $('exList').innerHTML = exListHTML(); }
  if (e.target.id === 'placeQ') { S.placeQ = e.target.value; const q = S.placeQ.trim(); $('placeList').innerHTML = placeListHTML(PLACES.filter(p => !q || p.name.includes(q))); }
});
document.addEventListener('change', e => {
  if ((e.target.id !== 'camFile' && e.target.id !== 'camApp') || !e.target.files[0]) return;
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 320; const g = c.getContext('2d'), r = Math.min(img.width / 3, img.height / 4);
    g.drawImage(img, (img.width - r * 3) / 2, (img.height - r * 4) / 2, r * 3, r * 4, 0, 0, 240, 320); URL.revokeObjectURL(img.src); saveShot(c.toDataURL('image/jpeg', .72)); };
  img.src = URL.createObjectURL(e.target.files[0]);
});
/* 무게 칸 → 상태. 입력 중(input)엔 맞는 숫자만 조용히 반영, 확정(change·완료 키)에 정리·경고 다시 그림 */
function wTarget(el) {
  if (el.dataset.w === 'draft') { const it = curItem(); return it && it.draft; }
  if (el.dataset.w === 'setedit') return S.setEdit;
  if (el.dataset.w === 'edit' && S.editRec) { const x = S.editRec.items[+el.dataset.i]; return x && x.sets.filter(q => q.done)[+el.dataset.s]; }
  return null;
}
function applyWeight(el, final) {
  const o = wTarget(el); if (!o) return true;
  const k = el.dataset.k || 'w', r = k === 'w' ? parseW(el.value) : parseN(el.value, k);
  if (!r.ok) { if (final) { const back = el.dataset.prev != null ? +el.dataset.prev : o[k]; o[k] = back; toast(r.msg); el.value = +(+back).toFixed(1); el.style.width = wWidth(el.value); } return false; }
  if (o[k] !== r.w) { if (el.dataset.w === 'draft') { const it = curItem(); if (it && k !== 'min') it.dirty = true; } if (el.dataset.w === 'edit') delete o.pr; }
  o[k] = r.w;
  if (final) { if (r.snapped) toast(`0.5kg 단위로 맞췄어요 · ${kg(r.w)}`); el.value = +r.w.toFixed(1); el.style.width = wWidth(el.value); }
  return true;
}
/* 버튼을 누르기 직전까지 칸에 포커스가 있었으면(iOS 는 버튼 탭에 blur 가 안 남) 그 값을 먼저 확정. 잘못된 값이면 동작 멈춤 */
let wRejectAt = 0;   // QA 중10: 잘못된 무게를 적고 곧바로 버튼을 누르면(칸이 먼저 닫히며 옛 값으로 되돌아감) 그 탭은 실행하지 않는다
function commitWeightField() {
  if (Date.now() - wRejectAt < 700) { wRejectAt = 0; const w = document.querySelector('.sheet.on .win') || document.querySelector('.win'); if (w) setTimeout(() => w.focus(), 0); return false; }
  const el = document.activeElement; if (!el || !el.classList || !el.classList.contains('win')) return true;
  const ok = applyWeight(el, true); el.dataset.done = '1'; el.blur(); save(); return ok;
}
let ptrDown = false;
document.addEventListener('pointerdown', () => { ptrDown = true; }, true);
document.addEventListener('pointerup', () => { setTimeout(() => { ptrDown = false; }, 80); }, true);
document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('win')) { delete e.target.dataset.done; const o = wTarget(e.target); if (o) e.target.dataset.prev = o[e.target.dataset.k || 'w']; setTimeout(() => e.target.select(), 0); } });
document.addEventListener('input', e => { if (e.target.classList && e.target.classList.contains('win')) { e.target.style.width = wWidth(e.target.value); applyWeight(e.target, false); save(); } });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('win')) { e.preventDefault(); e.target.blur(); } });
document.addEventListener('change', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('win') || el.dataset.done) return;
  if (!applyWeight(el, true) && ptrDown) wRejectAt = Date.now();
  save();
  /* 다른 버튼을 누르다 blur 된 경우 지금 다시 그리면 그 버튼이 사라져 탭이 씹힘 → 손 뗀 뒤 그림 */
  const redraw = () => { if (document.activeElement && document.activeElement.classList.contains('win')) return; if (el.dataset.w === 'setedit') { if (S.setEdit && $('seSteps')) setEditSheet(true); } else render(); };
  if (ptrDown) setTimeout(redraw, 160); else redraw();
});
/* v1.41(불편 개선 ④): +/− 를 0.45초 넘게 누르고 있으면 손을 뗄 때까지 빠르게 반복. 화면을 다시 그려도 이어지게 버튼을 매번 다시 찾는다 */
let HOLD = null;
const holdStop = () => { if (HOLD) { clearTimeout(HOLD.t); clearInterval(HOLD.iv); if (HOLD.n) HOLD_END = Date.now(); HOLD = null; } };
let HOLD_END = 0;
document.addEventListener('pointerdown', e => {
  const b = e.target.closest && e.target.closest('.step button[data-act][data-d]'); holdStop(); if (!b) return;
  const sel = `.step button[data-act="${b.dataset.act}"][data-d="${b.dataset.d}"]` + ['i', 's', 'k'].map(k => b.dataset[k] != null ? `[data-${k}="${b.dataset[k]}"]` : '').join('');
  HOLD = { n: 0, t: setTimeout(() => { if (!HOLD) return; HOLD.iv = setInterval(() => { const x = document.querySelector(sel); if (!x || !HOLD) return holdStop(); HOLD.n++; HOLD.busy = true; x.click(); if (HOLD) HOLD.busy = false; }, 70); }, 450) };
}, true);
['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, holdStop, true));
document.addEventListener('visibilitychange', holdStop);
document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.step button')) e.preventDefault(); });
/* 길게 누른 뒤 손을 뗄 때 따라오는 탭 1번은 버린다(한 칸 더 가는 것 방지) */
document.addEventListener('click', e => { if ((!HOLD || !HOLD.busy) && Date.now() - HOLD_END < 350 && e.target.closest && e.target.closest('.step button[data-act][data-d]')) { e.stopPropagation(); e.preventDefault(); HOLD_END = 0; } }, true);
function playPending() { const ev = S.events.find(x => x.id === S.pending); if (!ev) { S.pending = null; save(); return render(); } play(ev, { onDone: backToTab }); }

/* 1초 시계: 세션 시간·휴식·유산소 — 해당 글자만 바꾼다(화면 전체 다시 그리지 않음) */
setInterval(() => {
  const s = S.session;
  document.querySelectorAll('[data-clock="sess"]').forEach(el => { if (s) el.textContent = clock(Date.now() - s.startedAt); });
  const rc = document.querySelector('[data-clock="rest"]');
  if (rc && S.rest) { const left = Math.ceil((S.rest.until - Date.now()) / 1000);
    if (left <= 0) { S.rest = null; save(); toast('휴식 끝! 다음 세트 가볼까?'); tone(660, 0, .15); tone(880, .15, .2); if (navigator.vibrate) navigator.vibrate(200); const box = $('restBox'); if (box) { box.innerHTML = restHTML(0); box.classList.add('idle'); } }
    else { rc.textContent = clock(left * 1000); const bar = document.querySelector('[data-restbar]'); if (bar) bar.style.width = Math.round(left / S.rest.total * 100) + '%'; } }
  const cc = document.querySelector('[data-clock="cardio"]'), it = curItem();
  if (cc && it && it.run) cc.textContent = clock(Date.now() - it.run.startAt + (it.run.offset || 0));
  if (s && S.tab === 'workout' && (S.sub === 'session' || !S.sub) && Date.now() - s.lastAt > CFG.AUTO_END_MIN * 60000) render();
  /* QA 치5: 화면을 켜 둔 채 날짜가 바뀌면 다시 그린다(글자를 적는 중이면 다음 기회에) */
  if (ymd(new Date()) !== TODAY && !P && !EAT.cur && !$('sheet').classList.contains('on') && !(document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName))) render();
}, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && ymd(new Date()) !== TODAY && !P) render(); });

document.querySelector('.ver').textContent = `프로토타입 ${VER}`;
/* 시연 도구(🧪 상자·관리자 화면 입구)는 주소에 ?demo=1 을 붙였을 때만 보인다 — 일반 화면엔 내부 말이 안 나오게(QA 중37) */
const DEMO_UI = /[?&]demo=1\b/.test(location.search);
document.body.classList.toggle('demoui', DEMO_UI);
try { sanitize(); } catch (err) { console.error('[sanitize]', err); S = fresh(); S.tab = 'workout'; }
releaseDue();
render();
if (S.fixNote) { const f = S.fixNote; S.fixNote = 0;
  try { const raw = localStorage.getItem(KEY); if (raw) localStorage.setItem(KEY + '_broken_backup', raw.slice(0, 200000)); } catch {}   // 옛 값은 따로 보관(복구 문의용)
  save();
  const kept = (f.total || 0) - (f.lost || 0), lvLine = f.lvOk ? `<br>레벨(Lv.${S.level})과 포인트는 그대로예요.` : '';
  setTimeout(() => sheet(plainObj(f) && !f.all ? `<div class="h2" id="fixTitle">운동 기록 ${f.lost}건을 불러오지 못했어요</div><div class="muted" style="line-height:1.6;word-break:keep-all" id="fixBody">저장된 기록 ${f.total}건 중 ${f.lost}건에 문제가 있어 그 기록만 뺐어요. 나머지 ${kept}건은 그대로 있어요.${lvLine}</div><button class="btn" data-act="shClose" style="margin-top:14px" id="fixOk">확인</button>`
    : `<div class="h2" id="fixTitle">운동 기록을 불러오지 못했어요</div><div class="muted" style="line-height:1.6;word-break:keep-all" id="fixBody">저장된 기록에 문제가 있어 운동 기록을 비우고 시작했어요.${lvLine}<br>오늘부터 다시 기록하면 돼요.</div><button class="btn" data-act="shClose" style="margin-top:14px" id="fixOk">확인</button>`), 300); }
if (S.eatBack) { const n = S.eatBack; S.eatBack = 0; save(); setTimeout(() => toast(`캐릭터한테 주려던 음식 ${n}개는 다시 넣어 뒀어요`), 900); }
if (S.pending) setTimeout(() => { toast('지난번에 못 본 레벨업 장면을 보여 드릴게요'); playPending(); }, 700);
