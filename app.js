'use strict';
/* v1.12 — v1.11(C안 1/4 고객 앱 기록 흐름 전부) + 결정 33: 아이템 경험치는 한도 없음(운동 경험치만 하루 600·주 1,800).
   경험치·레벨·표정·포인트 계산은 engine.js 한 곳(CFG·sessionXP·capGain·applyXP·judgeIntensity·exprFor·forecastWeek). 이 파일은 화면만 */
const KEY = 'nijim_workout_proto_v111';
const VER = 'v1.17';
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
const MONTH_CAP = CFG.POINT.monthCap;

/* 효과형은 «사용»(소모) · 외형형은 «장착». 가격·상한 PLAN §2-10 */
const ITEMS = [
  { id:'boost1', img:'headband_gold', kind:'effect', use:1, name:'2배 부스터 · 1세션', desc:'다음 운동 1번 2배 · 한도 없음', price:300 },
  { id:'boost7', img:'shaker', kind:'effect', use:1, name:'2배 부스터 · 7일', desc:'7일 동안 운동 2배 · 한도 없음', price:1500 },
  { id:'potion', img:null, kind:'effect', use:1, name:'경험치 물약 +300', desc:'운동 없이 +300 · 한도 없음 · 💰', price:1000 },
  { id:'charm', img:'charm', kind:'effect', use:1, name:'연속 보호권', desc:'못 채운 주 1회 보호', price:500 },
  { id:'crown', img:'crown', kind:'effect', name:'리그 왕관', desc:'리그 표시 꾸미기 · 7일', price:800 },
  { id:'cap', img:'cap', kind:'look', name:'스포츠 캡', desc:'효과 없음', price:200 },
  { id:'sunglasses', img:'sunglasses', kind:'look', name:'선글라스', desc:'효과 없음', price:300 },
  { id:'towel', img:'towel', kind:'look', name:'스카이 타월', desc:'효과 없음', price:200 },
  { id:'wristband', img:'wristband', kind:'look', name:'손목밴드', desc:'효과 없음', price:100 },
];
patchItems();   // 본사(H2) 가격·판매 여부 — config_store.js
const FRIENDS = [
  { n:'운동하는곰', t:'koa', lv:27, week:1420, rate:100, paid:0 },
  { n:'새벽러너', t:'saetbyeol', lv:41, week:980, rate:75, paid:0 },
  { n:'벤치왕', t:'ttukbi', lv:33, week:1650, rate:100, paid:2, pure:24 },
  { n:'필라테스러', t:'mungchi', lv:12, week:610, rate:67, paid:0 },
  { n:'헬린이9일차', t:'bamtol', lv:4, week:420, rate:50, paid:0 },
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
  low:    { label:'아쉬운', lines:['오늘은 좀 아쉬웠지? 괜찮아, 나온 게 반이야. 다음엔 1세트만 더 같이 해보자','몸이 무거운 날이었나 봐. 그래도 왔잖아! 다음엔 같이 10분만 더 해보자','오늘은 살짝 아쉬움. 그래도 기록은 1칸 늘었어. 내일 컨디션 보고 다시 가자'] },
  normal: { label:'평소대로', lines:['오늘도 평소만큼 꾸준히! 이런 날이 1주, 1달을 만들어'] },
  high:   { label:'신남', lines:['오늘 평소보다 훨씬 많이 했어! 나까지 땀 나 💧 내일은 꼭 쉬어줘','와, 지난주의 너를 넘었어! 1단계 더 단단해진 기분이야'] },
};
const QUIET_LINE = '요즘 컨디션 어때? 쉬어가도 괜찮아';
const VERIFY = [['auto','입장 확인됨 · 자동'],['selfie','+ 오운완 셀카(선택)'],['gps','위치 확인'],['lesson','레슨 확정(2배)'],['self','자가 기록']];
const V2K = { V1:'auto', V1b:'gps', V2:'selfie', V3:'lesson', V0:'self' }, K2V = { auto:'V1', gps:'V1b', selfie:'V2', lesson:'V3', self:'V0' };
const vLabel = k => VERIFY.find(v => v[0] === k)[1].replace('+ ', '').replace(' · 자동', '');

/* 날짜 유틸 (시연 기록은 «오늘» 기준 상대 날짜) */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const TODAY = ymd(new Date());
const DOW = ['일','월','화','수','목','금','토'];
const md = s => `${+s.slice(5, 7)}/${+s.slice(8)}(${DOW[new Date(s).getDay()]})`;
const SR = (ex, ...sets) => ({ ex, sets: sets.map(([w, r]) => ({ w, r, done: true })) });
const SC = (ex, min, level = 'normal', km) => ({ ex, min, level, km });
const seedRecords = () => [
  { id: 1, date: daysAgo(2), place: '니짐 신림점', placeKind: 'center', summary: '벤치프레스 3세트 · 랫풀다운 3세트', xp: 180, v: 'auto', items: [SR('bench', [60, 10], [60, 10], [60, 8]), SR('lat_pulldown', [45, 12], [45, 12], [45, 10])] },
  { id: 2, date: daysAgo(4), place: '집', placeKind: 'home', summary: '홈트 20분', xp: 48, v: 'self', items: [SR('pushup', [0, 15], [0, 15], [0, 12]), SR('air_squat', [0, 20], [0, 20])] },
  { id: 3, date: daysAgo(6), place: '니짐 신림점 · PT', placeKind: 'center', summary: '하체 수업 50분', xp: 400, v: 'lesson', items: [{ ex: 'lesson_pt', min: 50 }] },
  { id: 4, date: daysAgo(9), place: '니짐 신림점', placeKind: 'center', summary: '러닝머신 25분', xp: 150, v: 'auto', items: [SC('treadmill', 25, 'normal', 3.4)] },
  { id: 5, date: daysAgo(12), place: '니짐 신림점', placeKind: 'center', summary: '벤치프레스 4세트 · 러닝 15분', xp: 210, v: 'selfie', items: [SR('bench', [57.5, 10], [57.5, 10], [57.5, 9], [57.5, 8]), SC('treadmill', 15)] },
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

const fresh = () => ({ type:'mungchi', chosen:false, onboarded:false, goal:3, goalNext:null, perm:{ noti:false, loc:false },
  noti:{ entry:true, nudge:true, report:true }, locCheck:true, hideTips:false, bodyweight:null,
  level:18, xp:need(18) - 120, points:2450, month:0, monthKey:'2026-10',
  events:[], pending:null, sound:true, placeholder:false, demo:'none', quitDemo:false,
  exprDemo:'auto', moodDemo:'auto', mood:null, lowRun:0,
  owned:{ cap:1 }, equipped:{ cap:true }, inv:{ boost1:0, boost7:0, potion:0, charm:0 }, boostNext:false, boost7Until:null, nextBoosts:[], timedBoosts:[], eatCat:'all', paidLog:[], shields:0,
  records: seedRecords(), hist: seedHist(), streakWeeks: 5, ticketLeft: 1, ticketAuto: true, custom: [],
  session:null, lastResult:null, entryDemo:true, verifyDemo:'auto', holdDemo:false, selfieDemo:'pass', selfieSeen:false, selfieStep:'guide', selfieFor:null, bump:0,
  tab:'home', sub:null, wseg:'mine', fTab:'week', pureOnly:false, sTab:'effect', pick:null, cur:null, recId:null, editRec:null, part:'all', q:'', placeQ:'',
  calc:null });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
(S.custom || []).forEach(c => { EX[c.id] = c; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast('저장 공간이 부족해요 — 사진을 몇 장 지워 주세요'); } };
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
const BODY = {"rilla":[282,298,313,326,331,334,388,396,402,415,417],"ttukbi":[293,313,342,346,359,349,393,394,397,403,402],"youngcha":[278,283,299,314,323,328,350,356,368,391,384],"saetbyeol":[307,333,350,357,366,353,381,398,402,408,408],"imu":[305,321,360,359,373,370,382,384,396,405,405],"koa":[283,299,306,317,329,348,382,390,403,410,396],"ppiyak":[279,315,342,362,370,355,402,404,409,414,395],"capy":[301,332,338,369,379,372,403,405,413,422,407],"bamtol":[319,338,355,371,372,376,416,415,417,426,403]};
const SHRINK = ['bamtol','ttukbi','youngcha'], REF = ['rilla','saetbyeol','imu','koa','ppiyak','capy'];
const MAX01 = Math.max(...Object.values(CHARS).map(c => c.dims['01'][1] / c.k));
/* 줄임 비율은 원본 배율(선택 화면과 같은 기준)에서 컷마다 한 번 구해 모든 화면에 똑같이 곱한다 → 화면마다 따로 줄지 않고, 3종 성장은 6종 성장 곡선을 따른다 */
const SHRINK_F = Object.fromEntries(SHRINK.map(t => [t, CUTS.map((c, i) => { const n = u => BODY[u][i] / CHARS[u].k; return Math.min(1, median(REF.map(n)) / n(t)); })]));
const shrinkF = (t, cut) => SHRINK_F[t]?.[CUTS.indexOf(cut)] ?? 1;
const k18 = (t, boxH, same, boxW, ringW) => { const C = CHARS[t]; return same ? boxH / (MAX01 * C.k) : Math.min(boxH / C.dims['99'][1], boxW / (ringW * C.dims['99'][0])); };
const scaleOf = (t, lv, boxH, same, boxW, ringW = 1.1) => k18(t, boxH, same, boxW, ringW) * shrinkF(t, cutOf(lv));
function charImg(t, lv, boxH, same = false, boxW = boxH) {
  if (S.placeholder) { const h = PH_H[stageIdx(lv)]; return { src: placeholderSrc(lv), w: h * 0.9 * boxH / 360, h: h * boxH / 360 }; }
  const [w, h] = CHARS[t].dims[cutOf(lv)], k = scaleOf(t, lv, boxH, same, boxW);   // 폭도 칸 안(골드 링 폭 1.1배 포함)
  return { src: `assets/c/${t}/lv${cutOf(lv)}.png`, w: w * k, h: h * k };
}
/* Lv.99 골드 링(README_for_dev 1절): 타원 선 #E5B158 · 폭 ≈ 캐릭터 폭×1.1 · 높이 ≈ 폭×0.24 · 바닥선에 중심. 그 아래 단계는 기존 티어 링 */
function ringHTML(c, lv, boxH) {
  const tr = tierOf(lv);
  if (lv >= 99) { const w = c.w * 1.1, h = w * 0.24; return `<div class="ring gold" style="width:${w}px;height:${h}px;bottom:${-h / 2}px"></div>`; }
  return tr > 1 ? `<div class="ring t${tr}" style="width:${Math.max(c.w*1.05, boxH*0.6)}px;height:${boxH*0.13}px"></div>` : '';
}
function charHTML(t, lv, boxH, withRing = true, expr = null, same = false, boxW = boxH) {
  const c = charImg(t, lv, boxH, same, boxW), gold = withRing && lv >= 99 && !S.placeholder ? c.w * 1.1 * 0.12 : 0;   // 골드 링 아래 반쪽만큼 자리를 비워 아래 글자와 안 겹치게
  return `<div class="cbox" style="height:${boxH}px${gold ? `;margin-bottom:${Math.round(gold)}px` : ''}">${withRing ? ringHTML(c, lv, boxH) : ''}<span class="cimg" style="width:${c.w}px;height:${c.h}px"><img src="${c.src}" style="width:${c.w}px;height:${c.h}px" alt="${esc(CH[t].name)} Lv.${lv}">${S.placeholder ? '' : faceLayer(t, lv, expr)}</span></div>`;
}
/* 작은 칸(홈 축소 카드·코치·랭킹): 같은 배율 규칙으로 Lv.99 가 box 높이에 맞게 → 레벨이 낮으면 작게 보인다 */
function charFit(t, lv, box, expr = null) {
  if (S.placeholder) return `<img src="${placeholderSrc(lv)}" style="max-width:${box}px;max-height:${box}px" alt="">`;
  const k = scaleOf(t, lv, box, false, box, 1), [w, h] = CHARS[t].dims[cutOf(lv)], dw = Math.round(w*k), dh = Math.round(h*k);
  return `<span class="cimg" style="width:${dw}px;height:${dh}px"><img src="assets/c/${t}/lv${cutOf(lv)}.png" style="width:${dw}px;height:${dh}px" alt="">${faceLayer(t, lv, expr)}</span>`;
}
/* 랭킹 아바타(40px 아이콘): v1.8처럼 컷마다 칸에 꽉 맞추고, 밤톨·뚝비·영차만 다른 화면과 같은 비율로 줄인다 */
function charAvatar(t, lv, box) {
  const c = cutOf(lv), [w, h] = CHARS[t].dims[c], k = box / Math.max(w, h) * shrinkF(t, c);
  return `<img src="assets/c/${t}/lv${c}.png" style="width:${Math.round(w*k)}px;height:${Math.round(h*k)}px" alt="">`;
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
const CB_TXT = '입점센터 운동 시 경험치 1.5배';
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
    goal: S.goal, weekCountBefore: weekCount(), todayCounted: todayDone(), boost: boostMul(), ...volCtx(today) };
}
/* 결정 35 입력값 — 종목별 경험치용 «내 평소»(대상 세트·분) + 오늘 앞 세션에서 이미 센 양·그 세션 배율(같은 날 재판정 차액용) */
function volCtx(today) {
  const ids = new Set([...Object.keys(S.hist), ...realRecs().flatMap(r => (r.items || []).map(i => i.ex))].filter(x => EX[x] && EX[x].xpk !== 'lesson'));
  const xpBase = Object.fromEntries([...ids].map(ex => [ex, xpBaselineOf({ [ex]: histOf(ex).map(h => ({ date: h.date, light: h.light, q: xpQty({ ex, ...h }) })) }, ex, TODAY)]));
  const todayQ = {}, todayPrev = [];
  today.forEach(r => (r.br && r.br.per || []).forEach(x => { todayQ[x.ex] = (todayQ[x.ex] || 0) + x.cnt; todayPrev.push({ ex: x.ex, cnt: x.cnt, bonus: x.bonus, mul: (r.br.vm || 1) * (r.br.sm || 1) }); }));
  return { xpBase, todayQ, todayPrev };
}
const sessCalc = (s = S.session) => { const r = sessionXP(s, sessCtx()); return { r, cap: capGain(r, ledger(), r.v === 'V0') }; };

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
const exprNow = () => exprFor({ demo: S.exprDemo, mood: moodToday(), lastDays: S.recoverDate === TODAY ? 0 : lastWorkoutDays() });
const exprOfMood = m => !m ? 'happy' : m.verdict === 'high' ? 'excited' : m.verdict === 'low' ? 'meh' : 'happy';
/* 캐릭터 그림 위에 얹는 표정 패치 — 그 컷 좌상단 기준 [x,y,w,h](웹 px)를 컷 크기 대비 % 로 두면 어떤 표시 크기에서도 같은 자리.
   패치 = design 얼굴(Lv.50 기준)을 그 컷 얼굴 위치에 맞춘 것(scripts/build_v18_assets.py). null = 원본 얼굴(뭉치 쌩쌩) */
function faceLayer(t, lv, expr) {
  const e = expr && CHARS[t].expr[expr]; if (!e) return '';
  const cut = cutOf(lv), [x, y, w, h] = e[cut], [W, H] = CHARS[t].dims[cut], pc = n => (Math.round(n * 1000) / 10) + '%';
  return `<img class="face art ${expr}" src="assets/c/${t}/e_${expr}_${cut}.png" style="left:${pc(x / W)};top:${pc(y / H)};width:${pc(w / W)};height:${pc(h / H)}" alt="">`;
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
  const left = S.goal - weekCount();
  return left <= 0 ? '이번 주 목표 달성! 오늘은 가볍게 스트레칭 어때?' : `이번 주 ${left}회 남았어. 오늘 한 번 가면 캐릭터가 더 단단해져 💧`;
};

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
  const pend = S.pending ? `<div class="notice"><span>⏳ 못 본 레벨업 연출이 있어요</span><button class="btn sm" data-act="playPending">보기</button></div>` : '';
  return `<div class="dummy">${pend}${card}
  <div class="ph tall">실제 앱 «홈» 화면 자리 (배너 · 추천 · 내주변 헬스장 …)</div><div class="ph">실제 앱 «홈» 콘텐츠 자리</div><div class="ph">실제 앱 «홈» 콘텐츠 자리 (맨 아래 블록 — 탭바에 가리면 안 됨)</div></div>`;
}
/* ===== N1 내 주변 센터 목록 (기존 앱 화면 — 결정 36 ⑥ «경험치 1.5배» 배지만 얹는 자리) =====
   배지는 태그 줄 맨 앞(이름 줄에 붙이면 긴 센터 이름이 잘림) · 목록이 전부 입점센터면 배지 대신 맨 위 1줄 */
function vNearby() {
  const list = PLACES.filter(p => !S.nbOnly || p.linked), allLinked = list.length > 0 && list.every(p => p.linked);
  const card = p => `<div class="nbc" id="nb_${p.id}"><div class="nbimg"></div><div class="nbt"><b>${esc(p.name)}</b><div class="nbtags">${p.linked && !allLinked ? '<span class="cbbadge">경험치 1.5배</span>' : ''}${p.linked ? '<span>니짐 입점</span><span>헬스</span><span>1일권</span>' : '<span>헬스</span><span>지도 정보</span>'}</div><small>${p.dist} · ${p.linked ? '니짐내짐에서 결제·입장' : '니짐내짐 미입점'}</small></div></div>`;
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
const vBadge = k => k === 'self' ? '<span class="vb v0">자가 기록</span>' : `<span class="vb ${k}">${VERIFY_LABEL[K2V[k]]}</span>`;
const stepper = (act, val, label, unit = '') => `<div class="ex"><div><b>${label}</b></div><div class="step"><button data-act="${act}" data-d="-1" aria-label="${label} 줄이기">−</button><span>${val}${unit}</span><button data-act="${act}" data-d="1" aria-label="${label} 늘리기">+</button></div></div>`;
const sw = (act, on, id = '') => `<button class="sw ${on ? 'on' : ''}" data-act="${act}" ${id ? `id="${id}"` : ''}></button>`;
const obProg = n => `<div class="obprog" aria-label="3단계 중 ${n}단계">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}<span>${n}/3</span></div>`;
const LOCK = '<svg class="ico" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
const BELL = '<svg class="ico" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
const PIN = '<svg class="ico" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>';
const CAM = '<svg class="ico" viewBox="0 0 24 24"><path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/></svg>';
const FLASK = '<svg viewBox="0 0 64 64" class="itemsvg"><path d="M25 8h14M27 8v14L14 46a6 6 0 0 0 5.3 9h25.4A6 6 0 0 0 50 46L37 22V8" fill="none" stroke="#16161C" stroke-width="3" stroke-linejoin="round"/><path d="M19 42h26l3.3 6a3 3 0 0 1-2.6 4.5H18.3A3 3 0 0 1 15.7 48z" fill="#FF0065" opacity=".85"/><circle cx="29" cy="35" r="2.2" fill="#39B4FF"/><circle cx="35" cy="30" r="1.6" fill="#39B4FF"/></svg>';

/* ===== C2 온보딩 — 1/3 캐릭터 선택(C2a) ===== */
function vChoose() {
  const pick = S.pick || S.type;
  return `<div class="sec">${S.onboarded ? '' : obProg(1)}<div class="h2">같이 운동할 친구를 골라 주세요</div><div class="muted" style="margin-bottom:12px">능력치는 모두 같고 생김새·말투만 달라요. Lv.10 전에 1번 바꿀 수 있어요.</div>
  <div class="choose" id="chooseGrid">${Object.keys(CH).map(k => `<button class="cc ${pick===k?'on':''}" data-act="pick" data-v="${k}">${charHTML(k, 1, 84, false, null, true)}<b>${CH[k].name}</b></button>`).join('')}</div>
  <div class="card" style="text-align:center"><div class="muted">진화 미리보기 · <b style="color:var(--ink)">${esc(CH[pick].name)}</b> — ${esc(CH[pick].intro)}</div><div style="display:flex;justify-content:space-around;align-items:flex-end;margin-top:8px">${[1,30,60,99].map(l => `<div style="text-align:center">${charHTML(pick, l, 76, l >= 99)}<div class="muted" style="font-size:11px;margin-top:4px">Lv.${l}</div></div>`).join('')}</div></div>
  <button class="btn" data-act="choose" id="chooseBtn">${esc(CH[pick].name)}${wa(pick)} 시작하기</button>
  <div class="muted" style="text-align:center;margin-top:8px">시연용: 고른 뒤에도 레벨·경험치는 예시값(Lv.18)을 유지해요</div></div>`;
}
/* 2/3 주간 목표 */
function vOnbGoal() {
  const opts = [[2, '가볍게 시작해요'], [3, '기본 · 이틀에 한 번꼴'], [4, '꾸준히 늘려 가요'], [5, '운동이 일상이에요']];
  return `<div class="sec">${obProg(2)}<div class="h2">일주일에 몇 번 운동할까요?</div><div class="muted" style="margin-bottom:12px">목표를 채운 주마다 «연속 n주»가 쌓여요. 레슨도 1번으로 세요.</div>
  <div class="card opts" id="goalOpts">${opts.map(([n, d]) => `<button class="opt ${S.goal === n ? 'on' : ''}" data-act="goal" data-v="${n}"><b>주 ${n}회</b><small>${d}</small><i></i></button>`).join('')}</div>
  <div class="muted">못 채운 주는 «쉬어가기 티켓»(한 달 1장)으로 지켜요. 티켓이 없어도 연속은 절반만 줄어요. 목표는 설정에서 언제든 바꿀 수 있어요.</div>
  <button class="btn" data-act="obNext" id="goalNext">다음</button></div>`;
}
/* 3/3 알림·위치 허용 + 사진은 나만 봄 */
function vOnbPerm() {
  const row = (ico, title, desc, k) => `<div class="prow">${ico}<div><b>${title}</b><small>${desc}</small></div><button class="btn sm ${S.perm[k] ? 'ghost' : ''}" data-act="perm" data-v="${k}">${S.perm[k] ? '허용됨' : '허용'}</button></div>`;
  return `<div class="sec">${obProg(3)}<div class="h2">거의 다 됐어요</div><div class="muted" style="margin-bottom:12px">둘 다 나중에 설정에서 바꿀 수 있어요.</div>
  <div class="card">${row(BELL, '알림', '센터에 들어가면 «입장 확인! 캐릭터가 기다려요» 한 번 · 언제든 끌 수 있어요', 'noti')}
  ${row(PIN, '위치', '입장 기록이 없는 센터에서 기록할 때 저장 순간 1번만 확인해요. 위치 좌표는 저장하지 않아요', 'loc')}</div>
  <div class="card privacy" id="photoNote">${LOCK}<div><b>사진은 나만 봐요</b><small>오운완 셀카는 나한테만 보여요. 친구·다른 회원에게 공개되지 않고, 언제든 지울 수 있어요. 찍지 않아도 기록은 그대로 돼요.</small></div></div>
  <button class="btn" data-act="obDone" id="obDone">${esc(CH[S.type].name)}${wa(S.type)} 시작하기</button>
  <div class="muted" style="text-align:center;margin-top:8px">시연용: 실제 권한 요청 창은 띄우지 않아요</div></div>`;
}

/* ===== C0 운동기록 탭 메인 ===== */
function vWorkout() {
  if (!S.chosen) return vChoose();
  const t = S.type, lv = S.level, tr = tierOf(lv);
  const toNext = lv >= 99 ? 0 : need(lv) - S.xp;
  const nextEvo = lv >= 99 ? '만렙 달성!' : lv >= 90 ? 'Lv.99에 골드 아우라' : `Lv.${(Math.floor(lv/10)+1)*10}에 진화해요`;
  const pend = S.pending ? `<div class="notice"><span>⏳ 못 본 레벨업 연출이 있어요</span><button class="btn sm" data-act="playPending">보기</button></div>` : '';
  const eqNames = ITEMS.filter(i => S.equipped[i.id]).map(i => `<span class="pill">${i.name}</span>`).join('');
  const seg = `<div class="seg wseg"><button class="${S.wseg==='mine'?'on':''}" data-act="wseg" data-v="mine">내 운동</button><button class="${S.wseg==='feed'?'on':''}" data-act="wseg" data-v="feed">오운완 피드 <span class="muted" style="font-size:11px">(2차)</span></button></div>`;
  if (S.wseg === 'feed') return `${seg}<div class="sec"><div class="ph tall">오운완 피드 자리 — 2차(결정 16)<br>지금은 세그먼트 자리만 비워 둠</div></div>`;
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
  <div class="card" id="stageCard"><div class="stage"><div class="cwrap ${ex}">${charHTML(t, lv, 150, true, ex, false, 140)}</div>
    <div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span><span class="pill tier${tr}">${TIER_NAME[tr]}</span>${moodPill(moodToday(), true)}${exprPill(ex, true)}</div>
    <div class="bar"><i style="width:${lv>=99?100:Math.round(S.xp/need(lv)*100)}%"></i></div>
    <div class="muted">${lv>=99?'최고 레벨':`Lv.${lv+1}까지 ${toNext.toLocaleString()} XP`} · ${nextEvo}</div>
    <div class="eqs">${eqNames || '<span class="pill none">장착 아이템 없음</span>'}</div>
    <button class="linkbtn" data-act="sub" data-v="me" id="goMe">내 캐릭터 자세히 ›</button></div></div>${moodToday() ? `<div class="say moodsay ${moodToday().verdict}" id="stageSay">${esc(moodToday().line)}</div>` : EXPR[ex].line ? `<div class="say moodsay ${ex}" id="stageSay">${esc(EXPR[ex].line)}</div>` : ''}</div>
  <button class="btn" data-act="start" id="goRecord" style="margin-top:0">${S.session ? '운동 이어서 하기' : '오늘 운동 기록하기'}</button>
  <div class="muted" style="text-align:center;margin:6px 0 12px">${S.session ? `${esc(S.session.place.name)}에서 운동 중 · <span data-clock="sess">${clock(Date.now() - S.session.startedAt)}</span>` : `센터 입장이 확인되면 바로 시작돼요 · ${CB_TXT}`}</div>
  <div class="card" id="streakCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px">이번 주 ${wk}/${S.goal}회</div><span class="pill ${wk>=S.goal?'tier4':'tier1'}">🔥 ${S.streakWeeks}주 연속</span></div>
    <div class="week">${week}</div>
    <div class="wxp" id="weekXP"><span>이번 주 운동 경험치</span><b>${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()}</b></div><div class="bar thin"><i style="width:${Math.min(100, Math.round(weekXP() / CFG.WEEK_CAP * 100))}%"></i></div>${itemWeek() ? `<div class="wxp itm" id="weekItemXP"><span>+ 아이템 경험치</span><b>${itemWeek().toLocaleString()} · 한도 없음</b></div>` : ''}
    <div class="muted" style="margin-top:8px;font-weight:700;color:var(--ink)">${now.getMonth()+1}월</div><div class="cal">${cal}</div></div>
  <div class="card coach" id="coachCard"><div class="cbox">${charFit(t, lv, 52, ex)}</div><div><div class="say">${coachLine()}</div><button class="linkbtn" data-act="coach">코치에게 물어보기 › <span class="muted" style="font-weight:500">월 20회</span></button></div></div>
  <div class="card" id="recentCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px">최근 기록</div><button class="linkbtn" data-act="sub" data-v="stats" style="margin:0">전체 보기 ›</button></div>
    ${recent.map(r => `<div class="rec tap" data-act="rec" data-id="${r.id}"><div><b>${esc(r.summary)}</b><small>${r.date.slice(5).replace('-', '/')} · ${esc(r.place)} · ${vLabel(r.v)}</small></div><span class="xp">+${r.xp} XP</span></div>`).join('')}</div>
  <div class="entries" id="entries">
    <button class="entry" data-act="sub" data-v="friends">${ico.rank}<b>랭킹 · 친구</b><small>친구 리그 ${rankMe()}위</small></button>
    <button class="entry" data-act="sub" data-v="shop">${ico.shop}<b>아이템 상점</b><small>${S.points.toLocaleString()}P 보유</small></button>
    <button class="entry" data-act="sub" data-v="stats">${ico.stats}<b>통계</b><small>이번 달 ${S.records.filter(r => r.date.startsWith(TODAY.slice(0,7))).length}회</small></button>
    <button class="entry" data-act="sub" data-v="settings" id="goSettings">${ico.set}<b>설정</b><small>목표 · 알림 · 사진 · 연출</small></button></div>
  <div class="muted" style="text-align:center;margin-top:14px" id="lastBlock">— 운동기록 탭 끝 —</div></div>`;
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
  <div class="muted">${S.perm.loc && S.locCheck ? '기록 저장 순간 위치를 1번만 확인해 «센터 확인»으로 올려요(좌표는 저장 안 함)' : '위치 확인이 꺼져 있어 센터에서 해도 «자가 기록»으로 쌓여요 · 설정에서 켤 수 있어요'}</div></div>`;
}
const placeListHTML = list => list.length ? list.map(p => p.linked ? `<button class="prow tap plc" data-act="placeLinked" data-v="${esc(p.name)}"><div><b>${esc(p.name)}</b><small><span class="cbtag">1.5배</span>${p.dist} · 니짐 입점센터</small></div><span class="muted">선택</span></button>${S.placeOpen === p.name ? `<div class="cbopen" id="cbOpen"><div>입장하기로 들어오면 경험치 1.5배예요</div><div class="grid2"><button class="btn sm" data-act="placeEnter" data-v="${esc(p.name)}">입장하기</button><button class="btn sm ghost" data-act="place" data-v="${esc(p.name)}">입장 없이 기록</button></div></div>` : ''}`
  : `<button class="prow tap plc" data-act="place" data-v="${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.dist} · 니짐 미연동 센터</small></div><span class="muted">선택</span></button>`).join('')
  : `<div class="muted" style="padding:12px 0">찾는 센터가 없어요. 지도에서 찾은 센터만 고를 수 있어요.</div>`;

/* ===== C3 세션 화면 ===== */
function vSession() {
  const s = S.session; if (!s) return vWorkout();
  const { r, cap } = sessCalc(), done = s.items.filter(it => (it.sets || []).some(x => x.done) || it.min > 0);
  const lr = lastRoutine(s.place.name);
  const recs = recommend(s);
  const head = `<div class="card sesshead" id="sessHead"><div class="sh1"><div><b>${esc(s.place.name)}</b>${vBadge(s.selfie && s.verify === 'V1b' ? 'selfie' : V2K[s.verify])}</div><span class="clockbig" data-clock="sess">${clock(Date.now() - s.startedAt)}</span></div>
    <div class="est" style="margin-top:10px"><span>예상 경험치</span><em id="sessEst">+${fmt(S.demo === 'none' ? cap.gained + centerBonus(r, ledger()).cb : demoXP())} XP</em></div>
    ${centerLine(s)}
    ${boostOn() ? `<div class="muted boostline">${boostLabel()} 부스터 적용 중</div>` : ''}
    <div class="muted autoend" id="autoEnd">마지막 기록 후 3시간 동안 입력이 없으면 자동으로 끝나요 · 마지막 기록 ${new Date(s.lastAt).toTimeString().slice(0, 5)}</div></div>`;
  const empty = !s.items.length ? `
  ${lr ? `<button class="card routine" data-act="routine" id="routineCard"><div class="h3">지난번 루틴 그대로</div><b>${md(lr.date)} · ${esc(placeBase(lr.place))}</b><div class="rchips">${lr.items.filter(i => EX[i.ex]).map(i => `<span>${EX[i.ex].name}</span>`).join('')}</div><span class="rgo">한 번에 불러오기 ›</span></button>` : ''}
  <div class="card" id="recoCard"><div class="h3">오늘 추천</div>${recs.map(([id, why]) => `<button class="prow tap" data-act="addEx" data-v="${id}"><div><b>${EX[id].name}</b><small>${why}</small></div><span class="plus">+</span></button>`).join('')}</div>`
  : `<div class="card" id="sessList">${s.items.map(it => { const e = EX[it.ex], ds = (it.sets || []).filter(x => x.done);
      const sub = e.mode === 'cardio' ? (it.min ? `${it.min}분 · ${({ light: '가벼움', normal: '보통', hard: '힘듦' })[it.level || 'normal']}${it.km ? ` · ${it.km}km` : ''}` : '아직 기록 전')
        : e.mode === 'lesson' ? `${it.min}분 · 선생님 확인` : ds.length ? setsTxt(e, ds) : (it.plan ? `지난번 ${it.plan}` : '아직 0세트');
      return `<button class="prow tap" data-act="openEx" data-v="${it.ex}"><div><b>${e.name}${ds.some(x => x.pr) ? ' <span class="prtag">PR</span>' : ''}</b><small>${esc(sub)}</small></div><span class="cnt">${e.mode === 'cardio' || e.mode === 'lesson' ? (it.min ? '✓' : '') : `${ds.length}세트`}</span></button>`; }).join('')}</div>`;
  const selfieBtn = s.verify === 'V1b' && !s.selfie ? `<button class="btn ghost camb" data-act="selfie" data-v="session">${CAM}오운완 셀카 <span class="muted">찍으면 경험치 100% · 나만 봐요</span></button>` : s.selfie ? `<div class="muted" style="text-align:center;margin-top:8px">오운완 셀카 찍음 · 저장하면 경험치 100%로 반영돼요</div>` : '';
  const demos = [['none','실제 기록대로'],['next','다음 레벨까지 (짧은 연출)'],['boundary','10레벨 경계 넘기 (큰 연출)'],['multi','+5레벨 한꺼번에 (묶음)']];
  return `${subHead('오늘 운동')}<div class="sec"><div class="honest" id="honestTop">한 만큼만 솔직하게 기록해 주세요. 기록이 정확해야 AI 코칭이 내 몸에 맞게 나와요.</div>${head}${empty}
  <button class="btn ghost" data-act="sub" data-v="pick" id="addExBtn" style="margin-top:0">+ 운동 추가</button>
  ${selfieBtn}
  <div class="card" style="margin-top:12px"><label class="lightrow" style="margin:0;padding:0;border:0"><input type="checkbox" data-act="light" ${s.light ? 'checked' : ''}><span><b>오늘은 가볍게 한 날</b><small>재활·컨디션 조절 날 체크 — 표정 판정에서 빼고, «평소» 계산에도 안 들어가요. 경험치는 그대로예요</small></span></label></div>
  <div class="card demo"><div class="h3">🧪 시연 도구 — 저장 시 얻는 경험치</div><div class="chips">${demos.map(([k, l]) => `<button class="chip ${S.demo===k?'on':''}" data-act="demo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">현재 Lv.${S.level}${S.demo === 'none' ? '' : ' · 연출 시연은 상한 미적용'}</div>
  <div class="h3" style="margin-top:12px">저장 후 표정 (결정 21)</div><div class="chips">${[['auto','기록대로 판정'],['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${S.moodDemo===k?'on':''}" data-act="mdemo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px" id="moodPreview">${moodPreviewText()}</div>
  <div class="h3" style="margin-top:12px">상태 흉내</div><div class="chips"><button class="chip" data-act="autoEndDemo" id="autoEndDemo">3시간 무입력 → 자동 종료</button><button class="chip ${S.holdDemo ? 'on' : ''}" data-act="holdDemo">세트 간격 20초 미만 3회(보류)</button></div>
  <div class="h3" style="margin-top:12px">검증 등급 바꿔 보기</div><div class="chips">${[['V1',`입장(×${CFG.VERIFY.V1})`],['V1b',`위치(×${CFG.VERIFY.V1b})`],['V0',`자가(×${CFG.VERIFY.V0})`],['V3',`레슨 확정(×${CFG.VERIFY.V3})`]].map(([k, l]) => `<button class="chip ${s.verify===k?'on':''}" data-act="vdemo" data-v="${k}">${l}</button>`).join('')}</div></div>
  <div class="honest end" id="honestEnd">적은 그대로 AI 코칭에 쓰여요. 오늘도 수고했어요!</div>
  <button class="btn" data-act="endSession" id="endBtn" style="margin-top:6px">운동 끝 · 기록 저장</button></div>`;
}
/* 결정 36 ⑥ C3 위치별 보너스 줄 — 입점센터 적용 중 / 이번 주 900 다 참 / 그 밖 장소 안내 / 레슨은 줄 없음 */
function centerLine(s) {
  if (s.verify === 'V3') return '';
  if (s.verify === 'V1') return centerWeek() >= CFG.CENTER_BONUS.weekCap ? `<div class="cbline full" id="cbLine"><span>이번 주 입점 보너스 다 모았어요</span></div>` : `<div class="cbline on" id="cbLine"><span><b>입점센터</b> · 경험치 1.5배 적용 중</span></div>`;
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

/* ===== C4 운동 선택 ===== */
function vPick() {
  const s = S.session; if (!s) return vWorkout();
  const lr = lastRoutine(s.place.name), f = freq().slice(0, 8), mem = placeMem(s.place.name), pop = CENTER_POP[s.place.name] || [];
  const chip = id => EX[id].off ? '' : `<button class="chip ${s.items.some(i => i.ex === id) ? 'on' : ''}" data-act="addEx" data-v="${id}">${EX[id].name}</button>`;
  return `${subHead('운동 추가', 'session', '오늘 운동')}<div class="sec">
  <div class="card" style="padding:12px 16px"><div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="exQ" placeholder="운동 이름 검색 (예: 벤치, 러닝머신)" value="${esc(S.q)}" autocomplete="off"></div></div>
  ${lr && !s.items.length ? `<button class="card routine" data-act="routine"><div class="h3">지난번 루틴 그대로</div><b>${md(lr.date)} · ${esc(placeBase(lr.place))}</b><div class="rchips">${lr.items.filter(i => EX[i.ex]).map(i => `<span>${EX[i.ex].name}</span>`).join('')}</div><span class="rgo">한 번에 불러오기 ›</span></button>` : ''}
  <div class="card"><div class="h3">최근·자주 한 운동</div><div class="chips hscroll" id="freqChips">${f.map(chip).join('')}</div>
  ${mem.length ? `<div class="h3" style="margin-top:12px">${esc(s.place.name)}에서 내가 했던 운동</div><div class="chips">${mem.map(chip).join('')}</div>` : ''}
  ${pop.length ? `<div class="h3" style="margin-top:12px">이 센터에서 많이 하는 운동</div><div class="chips">${pop.map(chip).join('')}</div>` : ''}</div>
  <div class="chips parts" id="partChips">${['all', ...PARTS].map(p => `<button class="chip ${S.part === p ? 'on' : ''}" data-act="part" data-v="${p}">${p === 'all' ? '전체' : p}</button>`).join('')}</div>
  <div class="card" id="exList">${exListHTML()}</div>
  <div class="muted">레슨(PT·필라테스·GX)은 선생님이 진행 확정하면 자동으로 기록돼요</div></div>`;
}
function exListHTML() {
  const s = S.session, q = S.q.trim().replace(/\s/g, ''), home = s && s.place.kind !== 'center';
  const list = EX_DICT.concat(S.custom).filter(e => e.cat !== 'lesson' && (S.part === 'all' || e.part === S.part) && (!home || e.home || e.custom)
    && (!q || (e.name + (e.al || '')).replace(/\s/g, '').includes(q)));
  const rows = list.map(e => `<button class="prow tap" data-act="addEx" data-v="${e.id}"><div><b>${e.name}</b><small>${CAT_NAME[e.cat] || '내가 추가'} · ${e.part}${e.mode === 'cardio' ? ' · 시간' : e.mode === 'wr' ? ' · 무게×횟수' : e.mode === 't' ? ' · 시간' : ' · 횟수'}</small></div><span class="plus">${s && s.items.some(i => i.ex === e.id) ? '✓' : '+'}</span></button>`).join('');
  const addCustom = q ? `<button class="prow tap" data-act="customEx" id="customEx"><div><b>«${esc(S.q.trim())}» 직접 추가</b><small>이름만 저장 · 경험치는 맨몸 1세트 기준</small></div><span class="plus">+</span></button>` : '';
  return (rows || `<div class="muted" style="padding:10px 0">찾는 운동이 없어요.</div>`) + addCustom + (home ? `<div class="muted" style="padding-top:10px">${s.place.name === '집' ? '집' : '야외'}에서 할 수 있는 운동만 보여요</div>` : '');
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
  <div class="setsteps">${e.mode === 'wr' ? stepper('stw', kg(d.w).replace('kg', ''), '무게', 'kg') : ''}${e.mode === 't' ? stepper('sts', d.s, '시간', '초') : stepper('str', d.r, '횟수', '회')}</div>
  ${chk.jump && !chk.unreal ? `<div class="warn" id="safetyWarn">지난번보다 ${chk.jumpPct}% 무거워요. 처음 1~2회는 가볍게 몸을 풀고, 보조자와 함께 무리하지 마세요</div>` : ''}
  ${(e.mode === 'wr' || e.mode === 'r') && d.r < CFG.MIN_REPS ? `<div class="minreps" id="minReps">${CFG.MIN_REPS}회 이상부터 경험치</div>` : ''}
  <button class="btn big" data-act="setDone" id="setDone">${ds.length + 1}세트 완료</button>
  <div class="muted" style="text-align:center;margin-top:6px">다음 세트는 같은 무게·횟수로 미리 채워져요</div></div>
  <div class="card rest ${restLeft ? '' : 'idle'}" id="restBox">${restHTML(restLeft)}</div>
  ${ds.length ? `<div class="card" id="doneSets"><div class="h3">오늘 한 세트</div>${ds.map((x, i) => `<div class="setrow"><span>${i + 1}세트</span><b>${setTxt(e, x)}</b><span class="srtags">${xpEligible(e, x) ? '' : '<small class="noxp">경험치 제외</small>'}${x.pr ? '<span class="prtag">PR</span>' : ''}</span></div>`).join('')}
    <button class="linkbtn" data-act="undoSet" style="margin-top:8px">마지막 세트 지우기</button></div>` : ''}
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
  : `<div class="setsteps">${stepper('cmin', c.min, '시간', '분')}</div><div class="muted">1번 탭에 5분씩 · 한 번에 최대 ${CFG.LIM.cardioMaxMin}분까지 기록돼요</div>`}
  </div>
  <div class="card"><div class="h3">얼마나 힘들었어요?</div><div class="chips" id="cLevel">${lv.map(([k, l]) => `<button class="chip ${c.level === k ? 'on' : ''}" data-act="clevel" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">표정 판정에만 써요 · 경험치는 시간으로만 계산해요</div>
  <details class="more" ${c.open ? 'open' : ''} data-act="cmore"><summary>거리·속도·경사 <span class="muted">(선택)</span></summary>
    ${stepper('ckm', c.km.toFixed(1), '거리', 'km')}${stepper('ckmh', c.kmh.toFixed(1), '속도', 'km/h')}${e.id === 'treadmill' ? stepper('cinc', c.inc, '경사', '%') : ''}
    ${c.kmh > 25 ? '<div class="warn">25km/h 넘는 속도는 25로 계산해요</div>' : ''}</details></div>
  <button class="btn" data-act="cSave" id="cSave">${c.mode === 'input' ? `${c.min}분 저장` : '저장'}</button></div>`;
}

/* ===== C7 오늘 요약 · 경험치 ===== */
function xpRows(rec) {
  const b = rec.br; if (!b) return '';
  if (b.demoXP) return `<div class="xrow"><span>시연 경험치(연출 확인용 · 상한 미적용)</span><b>+${fmt(b.demoXP)}</b></div>`;
  const row = (l, v, cls = '') => `<div class="xrow ${cls}"><span>${l}</span><b>${v}</b></div>`;
  return [...b.lines.map(([l, n, u, x]) => row(`${l} ${n}${u}`, `+${fmt(x)}`)),
    ...(b.bonusRows || []).map(([name, x]) => row(`평소보다 많이 함 · ${esc(name)} +${Math.round((CFG.VOL_BONUS.mult - 1) * 100)}%`, `+${fmt(x)}`, 'vol')),
    b.catchUp ? row('앞 세션 차액(오늘 합계로 평소보다 많이 함)', `+${fmt(b.catchUp)}`, 'vol') : '',
    b.short ? row(`5회 미만 ${b.short}세트는 기록만 남았어요`, '0', 'note') : '',
    b.noBase && b.noBase.length && b.lines.length ? row(`기록 5번 쌓이면 «평소보다 많이 한 날 +${Math.round((CFG.VOL_BONUS.mult - 1) * 100)}%»가 열려요`, '', 'note') : '',
    b.first ? row('오늘 첫 세트', `+${b.first}`) : '', b.complete ? row('운동 완료', `+${b.complete}`) : '',
    row(`검증 · ${VERIFY_LABEL[b.v]}`, `×${b.vm}`, 'mul'), row(b.comeback ? '복귀 첫 운동' : `연속 ${S.streakWeeks}주`, `×${b.sm.toFixed(2)}`, 'mul'),
    b.boostPart ? row(`×${b.bm || CFG.BOOST.mul} 부스터 · 한도 없음`, `+${fmt(b.boostPart)}`, 'gold') : '',
    b.newXP ? row(`새 부위 (${b.newParts.join('·')})`, `+${b.newXP}`) : '', b.prXP ? row(`개인 기록 ${b.prN}번`, `+${b.prXP}`) : '',
    b.goal ? row(`주간 목표 ${S.goal}회 달성`, `+${b.goal}`) : '',
    rec.xpCenter || rec.cbCut ? row('입점센터 보너스', `+${fmt(rec.xpCenter || 0)}`, 'center') : '',
    rec.xpCenter || rec.cbCut ? row(rec.cbCut ? `이번 주 보너스 ${CFG.CENTER_BONUS.weekCap.toLocaleString()} 다 모았어요 · ${fmt(rec.cbCut)} 빠짐` : `기본 경험치 ${fmt(rec.centerBase)}의 ${CFG.CENTER_BONUS.pct}%`, '', 'note') : '',
    rec.cut ? row(rec.cutReason === 'week' ? '운동 경험치 이번 주 상한' : '운동 경험치 오늘 상한', `−${fmt(rec.cut)}`, 'cut') : '',
    rec.held ? row('곧 반영(보류)', `−${fmt(rec.held)}`, 'cut') : '',
    rec.selfieXP ? row('오운완 셀카 100% 반영', `+${fmt(rec.selfieXP)}`, 'gold') : ''].join('');
}
function vResult() {
  const rec = S.records.find(r => r.id === S.lastResult) || S.records[S.records.length - 1];
  const m = S.mood && S.mood.date === TODAY ? S.mood : null, v = m ? (m.quiet ? 'na' : m.verdict) : 'na', t = S.type, lv = S.level;
  const note = { low: '평소보다 가볍게 한 날이라 <b>오늘 하루만</b> 표정이 살짝 아쉬워요. 레벨·경험치·연속·주간 목표는 <b>그대로</b>예요.',
    normal: '평소만큼 했어요. 캐릭터는 평소 표정(쌩쌩) 그대로예요.',
    high: '평소보다 훨씬 많이 했어요! <b>오늘 하루</b> 캐릭터가 신나요. 내일은 회복도 챙겨요.',
    na: m && m.quiet ? '요즘 아쉬운 날이 이어져서 표정 대신 한마디만 남겨요. 레벨·경험치는 그대로예요.' : `오늘은 표정 판정을 하지 않았어요(${esc(m ? m.why || '기록 없음' : '기록 없음')}). 캐릭터는 평소 표정이에요.` }[v];
  const show = (m && v !== 'normal' && v !== 'na') ? m : null;
  const ev = rec && rec.lvUp, canSelfie = rec && rec.v === 'gps' && !rec.held && !rec.demo;
  return `${subHead('오늘 운동 요약')}<div class="sec">
  ${rec && rec.auto ? `<div class="notice" id="autoNote"><span>3시간 동안 입력이 없어 자동으로 끝냈어요 · 마지막 기록 시각으로 저장했어요</span></div>` : ''}
  <div class="card result ${v}" id="resultCard"><div class="cwrap big ${v}">${charHTML(t, lv, 170, true, exprOfMood(show))}</div>
    <div class="rname"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span>${show ? moodPill(show) : '<span class="pill tier1">평소 표정</span>'}</div>
    <div class="say moodsay ${v}" id="resultSay">${esc(m && m.line ? m.line : coachLine())}</div>
    <div class="est"><span>오늘 얻은 경험치</span><em class="${S.bump ? 'bump' : ''}" id="resultXP">+${(rec ? rec.xp : 0).toLocaleString()} XP</em></div>
    <div class="rmeta">${rec ? vBadge(rec.v) : ''}<span class="muted">${rec ? esc(rec.summary) : ''}</span></div>
    ${rec && rec.held ? `<div class="notice hold" id="holdNote"><span>${fmt(rec.held)} XP는 곧 반영돼요 · 기록은 저장됐어요</span><button class="btn sm ghost" data-act="release" data-id="${rec.id}">🧪 24시간 뒤</button></div>` : ''}
    ${rec && rec.cut ? `<div class="muted capline" id="resultCap">${rec.cutReason === 'week' ? `이번 주 운동 경험치 ${CFG.WEEK_CAP.toLocaleString()} 다 모았어요` : `오늘 운동 경험치 ${(rec.v === 'self' ? CFG.DAY_CAP_V0 : CFG.DAY_CAP).toLocaleString()} 다 모았어요`} · ${fmt(rec.cut)} XP는 안 들어갔어요. 기록·연속·주간 목표는 그대로 쌓여요</div>` : ''}
    ${rec && rec.xpBoost ? `<div class="muted capline" id="resultBoost">×${(rec.br && rec.br.bm) || CFG.BOOST.mul} 부스터로 늘어난 +${fmt(rec.xpBoost)} XP는 한도 없이 다 들어갔어요 💰</div>` : ''}
    ${rec && !rec.demo && rec.centerIf > 0 ? `<div class="cbif" id="cbIf"><span>입점센터였다면 <b>+${fmt(rec.centerIf)}</b> 경험치</span>${findCenterBtn('cbIfFind')}</div>` : ''}
    <div class="bar"><i style="width:${lv >= 99 ? 100 : Math.round(S.xp / need(lv) * 100)}%"></i></div><div class="muted">${lv >= 99 ? '최고 레벨' : `Lv.${lv + 1}까지 ${(need(lv) - S.xp).toLocaleString()} XP`}</div>
    ${ev ? `<div class="ptline" id="ptLine">Lv.${ev.from} → ${ev.to} 레벨업 · ${ev.points ? `+${ev.points.toLocaleString()}P 적립` : '적립 0P'} <span class="muted">이번 달 ${S.month.toLocaleString()}/${MONTH_CAP.toLocaleString()}P${ev.pointsCut ? ` · 한도 때문에 ${ev.pointsCut.toLocaleString()}P 빠짐` : ''}${rec.v === 'self' ? ' · 자가 기록 레벨업은 50%' : ''}</span></div>` : ''}
    <div class="muted" style="margin-top:6px" id="resultNote">${note}</div>
    ${m && m.ratio != null && S.moodDemo === 'auto' ? `<div class="muted" style="margin-top:4px">평소 대비 ${Math.round(m.ratio * 100)}% (오늘 한 종목만 · 지난 10회 기준)</div>` : ''}</div>
  ${canSelfie ? `<button class="card selfiecta" data-act="selfie" data-v="result" id="selfieCta">${CAM}<div><b>오운완 셀카 찍기</b><small>${selfieGain(rec) ? `찍으면 경험치 100%! 사진은 나한테만 보여요 · 예상 +${fmt(selfieGain(rec))} XP` : '오늘·이번 주 경험치를 다 모아서 경험치는 그대로예요 · 사진은 나만 보는 기록으로 남아요'}</small></div><span class="rgo">›</span></button>` : ''}
  ${rec && rec.br ? `<div class="card" id="xpCard"><div class="h3">경험치 내역</div>${xpRows(rec)}<div class="xrow total"><span>합계</span><b>+${fmt(rec.xp)} XP</b></div></div>` : ''}
  <div class="card demo"><div class="h3">🧪 시연 — 다른 결과로 보기</div><div class="chips">${[['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${v===k?'on':''}" data-act="mset" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">표정은 캐릭터 얼굴(눈·입·볼) 자체가 바뀜 · 레벨·경험치와 무관</div></div>
  <button class="btn" data-act="back" id="resultOk">확인 · 운동기록 탭으로</button>
  <button class="btn ghost" data-tab="home" style="margin-top:8px">홈에서 카드 보기</button></div>`;
}
/* 셀카로 V1b → V2 가 될 때 더 받는 경험치(상한 안) */
function selfieGain(rec) {
  if (!rec || !rec.br || !rec.ctx) return 0;
  const r2 = sessionXP({ verify: K2V[rec.v], selfie: true, items: rec.items, prCount: rec.prCount }, rec.ctx);
  const delta = Math.max(0, r2.raw - rec.raw);
  return capGain({ raw: delta, boostPart: 0 }, ledger(), false).gained;
}

/* ===== C7b 오운완 셀카 ===== */
function vSelfie() {
  const st = S.selfieStep, guide = '얼굴 셀카나 거울 셀카로 찍어 주세요. 다른 회원이 나오지 않게요.';
  const back = subHead('오운완 셀카', S.selfieFor === 'session' ? 'session' : 'result', S.selfieFor === 'session' ? '오늘 운동' : '요약');
  if (st === 'guide') return `${back}<div class="sec"><div class="card selfieguide" id="selfieGuide">${CAM}<div class="h2" style="margin:8px 0">찍기 전에 1가지만</div>
    <div class="gl"><b>1</b><span>얼굴 셀카나 거울 셀카로 찍어 주세요</span></div><div class="gl"><b>2</b><span><b>다른 회원이 나오지 않게</b> 찍어 주세요. 다른 분이 보이면 저장하지 않아요</span></div><div class="gl"><b>3</b><span>사진은 나한테만 보여요. 앱은 «사람 1명 + 운동하는 곳»인지만 보고, 얼굴·몸매는 판단하지 않아요</span></div>
    <div class="muted" style="margin-top:8px">센터 촬영 규칙이 있으면 그 규칙을 따라 주세요 · 앱 안에서 바로 찍은 사진만 쓸 수 있어요</div></div>
    <button class="btn" data-act="selfieGo" id="selfieGo">알겠어요, 찍을게요</button></div>`;
  if (st === 'cam') return `${back}<div class="sec"><div class="cam" id="camBox"><video id="camV" autoplay playsinline muted></video><canvas id="camSim" width="300" height="400"></canvas><div class="camguide">${guide}</div></div>
    <div class="shutterrow"><button class="shutter" data-act="shoot" id="shutter" aria-label="촬영"></button></div>
    <div class="muted" style="text-align:center" id="camState">카메라를 여는 중…</div>
    <div class="card demo" style="margin-top:12px"><div class="h3">🧪 시연 — 판정 결과</div><div class="chips">${[['pass','통과 (사람 1명)'],['reject','다른 분이 찍힘']].map(([k, l]) => `<button class="chip ${S.selfieDemo === k ? 'on' : ''}" data-act="sdemo" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="filesim">카메라가 안 열리면 · 파일로 흉내(시연용)<input type="file" accept="image/*" capture="user" id="camFile"></label></div></div>`;
  const ph = `<div class="shot ${st}"><img src="${S.shot || ''}" alt="찍은 사진">${st === 'judge' ? '<div class="judging"><i></i><span>확인 중…</span></div>' : ''}</div>`;
  if (st === 'judge') return `${back}<div class="sec">${ph}<div class="muted" style="text-align:center;margin-top:10px">사람 1명 + 운동하는 곳인지만 확인해요</div></div>`;
  if (st === 'reject') return `${back}<div class="sec">${ph}<div class="card rejectc" id="rejectCard"><b>다른 분이 찍힌 것 같아요. 다시 찍어 주세요</b><small>사진은 저장하지 않았어요. 혼자 나오는 셀카나 거울 셀카면 돼요.</small></div>
    <button class="btn" data-act="selfieRetry" id="selfieRetry">다시 찍기</button><button class="btn ghost" data-act="selfieQuit" style="margin-top:8px">이번엔 안 찍을래요</button></div>`;
  return `${back}<div class="sec">${ph}<div class="card donec" id="selfieDone">${LOCK}<div><b>오운완! 나한테만 보여요</b><small>${S.selfieFor === 'session' ? '운동을 끝내고 저장하면 경험치가 100%로 반영돼요' : S.selfieGot ? `경험치 100%로 반영 · +${fmt(S.selfieGot)} XP` : '사진은 기록에 저장했어요 · 센터 확인이 없는 기록이라 경험치는 그대로예요'}</small></div></div>
    <button class="btn" data-act="selfieOk" id="selfieOk">확인</button></div>`;
}

/* ===== 랭킹·내 캐릭터 (v1.10 그대로) ===== */
function rankList() {
  const me = { n:'나', t:S.type, lv:S.level, week:Math.min(CFG.WEEK_CAP, weekXP()), rate:Math.min(100, Math.round(weekCount()/S.goal*100)), paid:S.paidLog.length ? 1 : 0, pure:S.level, me:true };
  let arr = [...FRIENDS, me].map(f => ({ ...f, key: S.fTab === 'week' ? f.rate * 10000 + f.week : (S.pureOnly ? (f.pure ?? f.lv) : f.lv) }));
  return arr.sort((a, b) => b.key - a.key);
}
function rankMe() { const prev = S.fTab; S.fTab = 'level'; const r = rankList().findIndex(f => f.me) + 1; S.fTab = prev; return r; }
function vFriends() {
  const list = rankList();
  return `${subHead('랭킹 · 친구')}<div class="sec"><div class="seg"><button class="${S.fTab==='week'?'on':''}" data-act="ftab" data-v="week">이번 주</button><button class="${S.fTab==='level'?'on':''}" data-act="ftab" data-v="level">레벨</button></div>
  ${S.fTab==='level'?`<div class="row" style="padding-top:0"><span class="muted">운동만 보기 (💰 유료 경험치 빼고)</span><button class="sw ${S.pureOnly?'on':''}" data-act="pure"></button></div>`:''}
  <div class="card">${list.map((f, i) => `<div class="rank ${f.me?'me':''}"><div class="no">${i+1}</div><div class="av">${S.placeholder ? `<img src="${placeholderSrc(f.lv)}" alt="">` : charAvatar(f.t, f.lv, 40)}</div>
  <div><b>${esc(f.n)}</b> ${f.paid?'<span title="유료 사용">💰</span>':''}<div class="muted">${esc(CH[f.t].name)} · ${stageName(f.t, f.lv)}</div></div>
  <div class="val">${S.fTab==='week'?`${f.rate}%<small>${f.week.toLocaleString()} XP</small>`:`Lv.${S.pureOnly?(f.pure??f.lv):f.lv}<small>${f.paid&&!S.pureOnly&&f.pure!==f.lv?`운동만 Lv.${f.pure}`:TIER_NAME[tierOf(f.lv)]}</small>`}</div></div>`).join('')}</div>
  <button class="btn ghost" data-act="invite">친구 초대</button>
  <div class="muted" style="margin-top:8px">이번 주 = 주간 목표 달성률 기준 · 검증된 운동만 집계</div></div>`;
}
function vMe() {
  const t = S.type, looks = ITEMS.filter(i => i.kind === 'look');
  return `${subHead('내 캐릭터')}<div class="sec">
  <div class="card" style="text-align:center">${charHTML(t, S.level, 170, true, exprNow())}<div style="margin-top:14px"><span class="name">${esc(CH[t].name)}</span> <span class="pill lvpill">Lv.${S.level}</span> <span class="pill tier${tierOf(S.level)}">${TIER_NAME[tierOf(S.level)]}</span></div>
  <div class="muted" style="margin-top:4px">칭호 «${stageName(t, S.level)}» · 포인트 ${S.points.toLocaleString()}P · 이번 달 적립 ${S.month}/${MONTH_CAP.toLocaleString()}P</div>
  <div class="slots">${looks.map(i => `<div class="slot ${S.equipped[i.id]?'on':''}">${S.equipped[i.id] ? i.name : '빈 슬롯'}</div>`).slice(0, 3).join('')}${ITEMS.filter(i => i.kind === 'effect' && S.equipped[i.id]).map(i => `<div class="slot on">${i.name}</div>`).join('')}</div>
  <button class="btn" data-act="sub" data-v="shop" id="shopBtn">🛍️ 아이템 상점</button>
  <button class="btn ghost" data-act="rechoose" style="margin-top:8px">캐릭터 바꾸기 <span class="muted">(Lv.10 전 1회 무료)</span></button></div>
  ${centerCard()}
  <div class="card" id="exprCard"><div class="h2" style="font-size:16px">컨디션 표정 5종</div><div class="muted" style="margin-bottom:8px">얼굴만 바뀌어요 · 레벨·경험치와 무관 · 지금: <b style="color:var(--ink)">${EXPR[exprNow()].label}</b></div>
  <div class="exprs">${EXPR_KEYS.map(ex => `<div class="ex5 ${exprNow()===ex?'on':''}">${charHTML(t, S.level, 64, false, ex)}<small>${EXPR[ex].label}</small></div>`).join('')}</div></div>
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

/* ===== C13 주간 목표 · 설정 ===== */
function vSettings() {
  const evs = [...S.events].reverse(), photos = S.records.filter(r => r.photo);
  return `${subHead('설정')}<div class="sec">
  <div class="card" id="goalCard"><div class="h2" style="font-size:16px">주간 목표</div><div class="chips">${[2, 3, 4, 5].map(n => `<button class="chip ${(S.goalNext || S.goal) === n ? 'on' : ''}" data-act="goalSet" data-v="${n}">주 ${n}회</button>`).join('')}</div>
    <div class="muted" style="margin-top:8px">${S.goalNext && S.goalNext !== S.goal ? `이번 주는 주 ${S.goal}회 그대로 · <b style="color:var(--ink)">다음 주 월요일부터 주 ${S.goalNext}회</b>` : `지금 주 ${S.goal}회 · 바꾸면 다음 주 월요일부터 적용돼요`}</div></div>
  <div class="card" id="ticketCard"><div class="h2" style="font-size:16px">쉬어가기 티켓</div>
    <div class="row"><div><b>이번 달 ${S.ticketLeft}장 남음</b><div class="muted">목표 못 채운 주를 1번 지켜 줘요 · 매달 1일에 1장</div></div></div>
    <div class="row"><div><b>연속 보호권 ${S.shields}장</b><div class="muted">상점에서 산 보호권 · 티켓 다음에 써요</div></div><button class="btn sm ghost" data-act="sub" data-v="shop">상점</button></div>
    <div class="row"><span>못 채운 주에 자동으로 쓰기</span>${sw('ticketAuto', S.ticketAuto)}</div>
    <div class="muted">티켓·보호권이 없으면 연속은 절반으로 줄어요(0이 되지 않아요)</div></div>
  <div class="card" id="notiCard"><div class="h2" style="font-size:16px">알림</div>
    <div class="row"><div><span>입장 확인 알림</span><div class="muted">«입장 확인! 캐릭터가 기다려요»</div></div>${sw('noti', S.noti.entry, 'notiEntry').replace('data-act="noti"', 'data-act="noti" data-v="entry"')}</div>
    <div class="row"><div><span>캐릭터가 보고 싶어할 때</span><div class="muted">7일 넘게 쉬면 주 1번까지</div></div>${sw('noti', S.noti.nudge).replace('data-act="noti"', 'data-act="noti" data-v="nudge"')}</div>
    <div class="row"><div><span>주간 리포트</span><div class="muted">월요일 아침 지난주 돌아보기</div></div>${sw('noti', S.noti.report).replace('data-act="noti"', 'data-act="noti" data-v="report"')}</div>
    <div class="muted">시연용 스위치 — 실제 알림은 보내지 않아요</div></div>
  <div class="card" id="locCard"><div class="h2" style="font-size:16px">센터 확인</div>
    <div class="row"><div><span>위치로 센터 확인</span><div class="muted">입장 기록이 없을 때만 · 저장 순간 1번 · 좌표는 저장 안 해요</div></div>${sw('locCheck', S.locCheck && S.perm.loc)}</div>
    ${S.perm.loc ? '' : '<div class="muted">위치 권한이 꺼져 있어요 — 켜면 권한부터 물어봐요</div>'}
    <div class="row"><span>검증 안내 문구 보지 않기</span>${sw('hideTips', S.hideTips)}</div>
    <div class="row"><div><span>체중 <span class="muted">(선택)</span></span><div class="muted">무게 확인에만 써요 · 비우면 70kg 기준</div></div><div class="step"><button data-act="bw" data-d="-1">−</button><span>${S.bodyweight ? S.bodyweight + 'kg' : '—'}</span><button data-act="bw" data-d="1">+</button></div></div></div>
  <div class="card" id="photoCard"><div class="h2" style="font-size:16px">내 사진</div><div class="muted" style="margin-bottom:8px">${LOCK.replace('class="ico"', 'class="ico sm"')} 나한테만 보여요 · ${photos.length}장</div>
    ${photos.length ? `<div class="thumbs">${photos.map(r => `<button data-act="rec" data-id="${r.id}"><img src="${r.photo}" alt=""><small>${r.date.slice(5).replace('-', '/')}</small></button>`).join('')}</div>` : '<div class="muted">아직 찍은 오운완 셀카가 없어요</div>'}
    <button class="btn ghost" data-act="delAllPhotos" id="delAll" ${photos.length ? '' : 'disabled'}>내 사진 전체 삭제</button></div>
  <div class="card"><div class="h2" style="font-size:16px">레벨업 연출</div>
  <div class="row"><span>연출 소리</span><button class="sw ${S.sound?'on':''}" data-act="sound" id="soundSw"></button></div>
  <div class="row"><span class="muted">건너뛰기: 연출 중 화면 아무 곳이나 탭</span></div></div>
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
  <div class="seg"><button data-act="stab" data-v="effect">효과형</button><button data-act="stab" data-v="look">외형형</button><button class="on" data-act="stab" data-v="food" id="stabFood">먹고 마시는</button></div>${vEatTab()}</div>`;
  const list = ITEMS.filter(i => i.kind === S.sTab && !i.off);
  return `${subHead('아이템 상점')}<div class="sec"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><button class="linkbtn" data-act="sub" data-v="calc" id="goCalc" style="margin:0">부스터·물약 계산기 ›</button><b>${S.points.toLocaleString()}P</b></div>
  <div class="seg"><button class="${S.sTab==='effect'?'on':''}" data-act="stab" data-v="effect">효과형</button><button class="${S.sTab==='look'?'on':''}" data-act="stab" data-v="look">외형형</button><button class="${S.sTab==='food'?'on':''}" data-act="stab" data-v="food" id="stabFood">먹고 마시는</button></div>
  ${S.sTab === 'effect' ? `<div class="muted wkleft" id="wkLeft">이번 주 운동 경험치 ${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()} · <b>아이템 경험치는 한도 없어요</b>${boostOn() ? ` · <b>${boostLabel()} 부스터 적용 중</b>` : ''}</div>` : ''}
  <div class="grid2">${list.map(i => { const n = i.use ? (S.inv[i.id] || 0) : 0, own = i.use ? n > 0 : S.owned[i.id], eq = S.equipped[i.id];
    return `<div class="item">${i.use ? (n ? `<span class="tag">${n}개</span>` : '') : eq?'<span class="tag">장착중</span>':own?'<span class="tag">보유</span>':''}${itemImg(i)}<b>${i.name}</b><small>${i.desc}</small>
    ${i.use ? (n ? `<div class="grid2 ib"><button class="btn ghost" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button><button class="btn" data-act="use" data-id="${i.id}">사용</button></div>` : `<button class="btn" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button>`)
      : own ? `<button class="btn ${eq?'ghost':''}" data-act="equip" data-id="${i.id}">${eq?'해제':'장착'}</button>` : `<button class="btn" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button>`}</div>`; }).join('')}</div>
  <div class="muted" style="margin-top:10px">니짐 포인트로 구매 · 적립분 먼저 사용 · 가격은 예시값 · 효과형은 사용 후 환불되지 않아요</div></div>`;
}
const avgSession = () => { const rs = realRecs().filter(r => r.v !== 'lesson' && !r.edited).slice(-10).map(r => r.raw || r.xp); return rs.length ? Math.round(median(rs) / 10) * 10 : 260; };
function calcDefaults() { return { sessions: Math.max(1, S.goal - weekCount()), per: avgSession(), booster: 'one', potions: 0 }; }
function cmpDefaults() { return { perWeek: S.goal, per: avgSession(), booster: '7d', potions: 7 }; }
const dur = w => !isFinite(w) ? '도달 못 함' : w < 9 ? `${w}주` : w < 104 ? `약 ${Math.round(w / 4.345)}개월` : `약 ${(w / 52.18).toFixed(1)}년`;
function vCalc() {
  const c = S.calc || (S.calc = calcDefaults()), f = forecastWeek({ L: ledger(), ...c });
  const step = (k, v, l, u, act = 'calc') => `<div class="ex"><div><b>${l}</b></div><div class="step"><button data-act="${act}" data-k="${k}" data-d="-1">−</button><span>${v}${u}</span><button data-act="${act}" data-k="${k}" data-d="1">+</button></div></div>`;
  const bchips = (cur, act) => `<div class="chips">${[['none', '없음'], ['one', '1세션'], ['7d', '7일']].map(([k, l]) => `<button class="chip ${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</button>`).join('')}</div>`;
  const m = S.cmp || (S.cmp = cmpDefaults());
  const exOnly = weeksToLv99({ level: S.level, xp: S.xp, perWeek: m.perWeek, per: m.per }), withIt = weeksToLv99({ level: S.level, xp: S.xp, perWeek: m.perWeek, per: m.per, booster: m.booster, potionsWeek: m.potions });
  const maxW = Math.max(...[exOnly.weeks, withIt.weeks].filter(isFinite), 1), barW = w => isFinite(w) ? Math.max(4, Math.round(w / maxW * 100)) : 100;
  return `${subHead('부스터·물약 계산기', 'shop', '상점')}<div class="sec">
  <div class="card"><div class="wxp" style="margin-top:0"><span>이번 주 운동 경험치 지금</span><b>${weekXP().toLocaleString()}/${CFG.WEEK_CAP.toLocaleString()}</b></div><div class="bar thin"><i style="width:${Math.min(100, Math.round(weekXP() / CFG.WEEK_CAP * 100))}%"></i></div>
  ${step('sessions', c.sessions, '이번 주 남은 운동', '번')}${step('per', c.per, '1번 운동 경험치(상한 전)', ' XP')}
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
  <div class="muted">한 주 운동 ${fmt(exOnly.exWeek)} XP(주 ${CFG.WEEK_CAP.toLocaleString()} 한도) · 아이템 쓰면 + 아이템 ${fmt(withIt.itemWeek)} XP(한도 없음) · 남은 ${fmt(exOnly.left)} XP 기준 어림값</div>
  <div class="muted">아이템으로 오른 레벨엔 포인트가 쌓이지 않고, 주간 랭킹·«운동만 보기»엔 운동 경험치만 들어가요</div></div>
  <div class="muted">운동 경험치만 하루 ${CFG.DAY_CAP} · 주 ${CFG.WEEK_CAP.toLocaleString()} XP 한도 · 운동 1번 = 하루 1번으로 셈</div></div>`;
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
    return `<div class="ritem"><b>${e.name}</b>${(it.sets || []).filter(s => s.done).map((s, si) => E ? `<div class="setrow edit"><span>${si + 1}세트</span>${e.mode === 'wr' ? `<div class="step"><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="w" data-d="-1">−</button><span>${kg(s.w)}</span><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="w" data-d="1">+</button></div>` : ''}<div class="step"><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="${e.mode === 't' ? 's' : 'r'}" data-d="-1">−</button><span>${e.mode === 't' ? s.s + '초' : s.r + '회'}</span><button data-act="eSet" data-i="${ii}" data-s="${si}" data-k="${e.mode === 't' ? 's' : 'r'}" data-d="1">+</button></div><button class="del" data-act="eDel" data-i="${ii}" data-s="${si}" aria-label="세트 지우기">×</button></div>`
      : `<div class="setrow"><span>${si + 1}세트</span><b>${setTxt(e, s)}</b>${s.pr ? '<span class="prtag">PR</span>' : '<span></span>'}</div>`).join('')}</div>`; };
  const ed = E ? editCalc(r, E.items) : null;
  return `${subHead(md(r.date) + ' 기록', S.recFrom || '', S.recFrom === 'stats' ? '통계' : S.recFrom === 'settings' ? '설정' : '운동기록')}<div class="sec">
  <div class="card" id="recHead"><div class="sh1"><div><b>${esc(r.place)}</b>${vBadge(r.v)}</div><em class="xpbig">+${fmt(r.xp)} XP</em></div><div class="muted" style="margin-top:4px">${esc(r.summary)}${r.light ? ' · 가볍게 한 날' : ''}</div></div>
  <div class="card" id="recItems">${items.map(itemHTML).join('') || '<div class="muted">세부 기록이 없어요</div>'}</div>
  ${E ? `<div class="warn" id="v0Warn">수정하면 이 기록은 <b>자가 기록(×0.4)</b>으로 다시 계산돼요 · 지금 +${fmt(r.xp)} XP → 수정 후 <b>+${fmt(ed.xp)} XP</b>${ed.xp < r.xp ? ' · 레벨은 그대로고 다음 레벨까지 거리만 늘어나요' : ''}</div>
    <div class="grid2"><button class="btn ghost" data-act="editCancel">취소</button><button class="btn" data-act="editSave" id="editSave">수정 저장</button></div>`
  : lesson ? `<div class="muted">레슨 기록은 선생님 확정 기록이라 수정할 수 없어요</div>` : `<button class="btn ghost" data-act="editStart" id="editStart">기록 수정</button>`}
  ${!E && r.br ? `<div class="card" style="margin-top:12px"><div class="h3">경험치 내역</div>${xpRows(r)}<div class="xrow total"><span>합계</span><b>+${fmt(r.xp)} XP</b></div></div>` : ''}
  ${!E && r.photo ? `<div class="card" id="recPhoto"><div class="h3">오운완 셀카 <span class="muted" style="font-weight:500">${LOCK.replace('class="ico"', 'class="ico sm"')} 나만 봐요</span></div><img class="recphoto" src="${r.photo}" alt=""><button class="btn ghost" data-act="delPhoto" data-id="${r.id}" id="delPhoto">사진 삭제</button></div>` : ''}</div>`;
}
/* 수정 = 자가 기록(V0)으로 다시 계산(VERIFICATION §4 «과거 입력은 V0 고정») — 그날 다른 기록과 합쳐 하루 한도 안에서 */
function editCalc(r, items) {
  const ctx = r.ctx || { firstToday: true, weekParts: [], streakWeeks: S.streakWeeks, lastDays: 1, prToday: 0, goal: S.goal, weekCountBefore: 0, todayCounted: true, boost: false };
  const x = sessionXP({ verify: 'V0', selfie: false, items, prCount: 0 }, { ...ctx, boost: !!r.boosted });   // 이미 쓴 부스터는 수정해도 유지
  const L = ledgerOf([...S.records.filter(q => q.id !== r.id), ...S.paidLog.map(p => ({ ...p, paid: true }))], r.date, weekDaysOf(r.date));
  const cap = capGain(x, L, true);
  return { xp: cap.gained, br: x, cap };
}

const MAIN = { home:vHome, nearby:vNearby, membership:vMembership, workout:vWorkout, all:vAll };
const SUB = { session:vSession, place:vPlace, pick:vPick, set:vSet, cardio:vCardio, result:vResult, selfie:vSelfie, rec:vRec, calc:vCalc,
  onbGoal:vOnbGoal, onbPerm:vOnbPerm, friends:vFriends, me:vMe, shop:vShop, stats:vStats, settings:vSettings };
function render() {
  autoEndCheck();
  const v = (S.tab === 'workout' && S.sub && (S.chosen || S.sub.startsWith('onb'))) ? (SUB[S.sub] || vWorkout) : (MAIN[S.tab] || vHome);
  $('view').innerHTML = v();
  eatMount();
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  if (S.tab === 'workout' && S.sub === 'selfie' && S.selfieStep === 'cam') camStart();
  S.bump = 0;
}
function go(tab, sub = null) { if (sub !== 'selfie') camStop(); S.tab = tab; S.sub = tab === 'workout' ? sub : null; save(); render(); window.scrollTo(0, 0); }
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
  S.session = { id: now, startedAt: now, lastAt: now, place, verify, items: [], light: false, selfie: false, photo: null, prCount: 0, times: {} };
  S.demo = 'none'; S.holdDemo = false; S.q = ''; S.part = 'all';
  go('workout', 'session');
}
function pickPlace(name) {
  if (name === '집' || name === '야외') return openSession({ name, kind: name === '집' ? 'home' : 'out' }, 'V0');
  openSession({ name, kind: 'center' }, S.perm.loc && S.locCheck ? 'V1b' : 'V0');
}
function newItem(ex) {
  const e = EX[ex], prev = histOf(ex).find(h => (h.sets && h.sets.length) || h.min);
  if (e.mode === 'cardio') return { ex, min: 0, level: 'normal', draft: { mode: 'timer', min: prev && prev.min ? prev.min : 20, level: 'normal', km: prev && prev.km ? prev.km : 0, kmh: 0, inc: 0, open: false } };
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
function setDone(force = false) {
  const it = curItem(), e = EX[it.ex], d = it.draft, prev = histOf(it.ex).find(h => h.sets && h.sets.length);
  const chk = checkWeight(e, d.w, { bodyweight: S.bodyweight, bestW: bestW(it.ex), lastTopW: prev ? Math.max(...prev.sets.map(x => x.w || 0)) : 0 });
  if (chk.unreal && !force) return sheet(`<div class="h2">정말 ${kg(d.w)} 맞아요? 🙂</div><div class="muted">${bestW(it.ex) ? `지난 최고 무게(${kg(bestW(it.ex))})의 1.5배가 넘어요.` : '체중에 비해 아주 무거운 무게예요.'} 숫자가 맞으면 그대로 저장돼요.</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">고칠게요</button><button class="btn" data-act="setForce">맞아요, 저장</button></div>`);
  const st = { w: d.w, r: d.r, s: d.s, done: true, at: Date.now() };
  const best = Math.max(bestOf(it.ex), ...it.sets.filter(x => x.done).map(x => setScore(e, x)));
  if (!chk.unreal && isPR(e, st, best)) { st.pr = true; S.session.prCount++; const today = realRecs().filter(r => r.date === TODAY).reduce((a, r) => a + (r.prCount || 0), 0);
    S.prFx = { ex: it.ex, at: Date.now(), txt: setTxt(e, st), xp: today + S.session.prCount <= CFG.LIM.prDay }; }
  if (chk.unreal) st.unreal = true;
  it.sets.push(st); S.session.lastAt = Date.now();
  S.rest = { ex: it.ex, until: Date.now() + CFG.REST_SEC * 1000, total: CFG.REST_SEC };
  shClose(); save(); render();
  if (st.pr) { tone(880, 0, .2); tone(1175, .1, .35); }
}

/* ===== 운동 끝 → 저장 → (레벨업 연출) → 요약 ===== */
function xpToReach(target) { let total = need(S.level) - S.xp; for (let l = S.level + 1; l < target; l++) total += need(l); return total; }
function demoXP() {
  if (S.demo === 'next') return xpToReach(Math.min(99, S.level + 1));
  if (S.demo === 'boundary') { const t = Math.min(99, S.level >= 90 ? 99 : (Math.floor(S.level / 10) + 1) * 10); return xpToReach(t); }
  if (S.demo === 'multi') return xpToReach(Math.min(99, S.level + 5)) + 50;
  return 0;
}
function endSession(auto = false) {
  const s = S.session; if (!s) return;
  const hasWork = s.items.some(it => (it.sets || []).some(x => x.done) || it.min > 0);
  if (!hasWork && S.demo === 'none' && !auto) return sheet(`<div class="h2">기록한 운동이 없어요</div><div class="muted">세트를 1개 이상 완료하면 경험치가 쌓여요.</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="discard">기록 없이 끝내기</button><button class="btn" data-act="shClose">계속 운동하기</button></div>`);
  if (!hasWork && auto) { S.session = null; save(); toast('3시간 동안 입력이 없어 운동을 닫았어요'); return go('workout'); }
  const ctx = sessCtx(), r = sessionXP(s, ctx), L = ledger(), isDemo = S.demo !== 'none';
  const cap = capGain(r, L, r.v === 'V0');
  let gained = isDemo ? demoXP() : cap.gained, held = 0;
  const times = Object.values(s.times || {});
  if (!isDemo && (S.holdDemo || times.some(isHeld))) { held = gained; gained = 0; }
  const boosted = !isDemo && boostOn() && r.any; if (boosted) boostConsume();
  const cbr = centerBonus(r, L, isDemo || held > 0), cb = cbr.cb;   // 결정 36: 운동 장부 잘림과 무관 · 주 900만
  const itemPart = isDemo || held ? 0 : cap.boostGained;   // 부스터로 늘어난 몫 = 아이템 경험치 → 그 몫으로 오른 레벨은 포인트 0
  const res = applyGain({ level: S.level, xp: S.xp }, gained - itemPart, itemPart + cb, { v0: r.v === 'V0', monthUsed: S.month });   // 입점 보너스는 화면 레벨에만 · 포인트 0(⑦-1 A)
  S.level = res.level; S.xp = res.xp; S.month += res.points; S.points += res.points;
  const items = s.items.filter(it => (it.sets || []).some(x => x.done) || it.min > 0).map(({ draft, run, plan, ...it }) => ({ ...it, sets: it.sets ? it.sets.filter(x => x.done).map(({ at, ...x }) => x) : undefined }));
  const rec = { id: Date.now(), date: TODAY, place: s.place.name, placeKind: s.place.kind, summary: summaryOf(items), items, xp: gained + cb, xpCenter: cb, cbCut: cbr.cut, centerBase: r.baseXP, centerIf: isDemo ? null : centerIf(s, ctx, r), raw: r.raw, held, cut: isDemo ? 0 : cap.cut, cutReason: cap.reason,
    xpBoost: isDemo ? 0 : cap.boostGained, boosted, v: V2K[r.v], light: s.light, prCount: s.prCount, photo: s.photo, ctx, br: isDemo ? { demoXP: gained } : r, demo: isDemo, auto: auto || undefined };
  if (res.level > res.from) rec.lvUp = { from: res.from, to: res.level, points: res.points, pointsCut: res.pointsCut };
  S.records.push(rec);
  /* 결정 21: 표정만 바뀜 — 위 레벨·경험치·포인트 계산에 관여하지 않음 */
  const j = judgeIntensity(items, { hist: histVol(), today: TODAY, light: s.light, comeback: ctx.lastDays >= CFG.COMEBACK_DAYS, lowRun: S.lowRun });
  const verdict = S.moodDemo !== 'auto' ? S.moodDemo : j.verdict;
  S.lowRun = verdict === 'low' ? S.lowRun + 1 : verdict === 'na' ? S.lowRun : 0;
  S.mood = { verdict, ratio: S.moodDemo === 'auto' ? j.ratio : null, why: j.why, date: TODAY, quiet: S.moodDemo === 'auto' && j.quiet, line: verdict === 'na' ? '' : MOOD[verdict].lines[Math.floor(Math.random() * MOOD[verdict].lines.length)] };
  if (S.mood.quiet) S.mood.line = QUIET_LINE;
  S.session = null; S.demo = 'none'; S.rest = null; S.lastResult = rec.id;
  afterGain(res, { toast: `+${(gained + cb).toLocaleString()} XP 저장 완료${held ? ` · ${fmt(held)} XP는 곧 반영` : ''}` });
}
/* 레벨업이면 연출(C8) 뒤 요약(C7), 아니면 바로 요약 */
function afterGain(res, { toast: msg, to = 'result' } = {}) {
  const done = () => { go('workout', to); if (msg) toast(msg); };
  if (res.level > res.from) {
    let big = false; for (let l = res.from + 1; l <= res.level; l++) if (isBigBoundary(l)) big = true;
    const d = new Date(), at = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const ev = { id: Date.now(), from: res.from, to: res.level, big, type: S.type, points: res.points, pointsCut: res.pointsCut, at, watched: false, skipped: false, replays: 0 };
    S.events.push(ev); S.pending = ev.id; save();   // 연출 전에 먼저 기록 → 끊겨도 다음 진입 때 재생
    play(ev, { onDone: done });
  } else { save(); done(); }
}
function autoEndCheck() {
  const s = S.session; if (!s || P) return;
  if (Date.now() - s.lastAt > CFG.AUTO_END_MIN * 60000 && !autoEndCheck.busy) { autoEndCheck.busy = true; setTimeout(() => { autoEndCheck.busy = false; endSession(true); }, 0); }
}

/* ===== 셀카 (C7b) — 웹 카메라, 안 되면 그림으로 흉내 ===== */
let STREAM = null;
async function camStart() {
  const v = $('camV'), st = $('camState'); drawSim();
  if (STREAM) { v.srcObject = STREAM; v.classList.add('on'); st.textContent = '얼굴이나 거울 셀카로 · 다른 회원이 안 나오게'; return; }
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw 0;
    STREAM = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    if (!$('camV')) return camStop();
    $('camV').srcObject = STREAM; $('camV').classList.add('on'); $('camState').textContent = '얼굴이나 거울 셀카로 · 다른 회원이 안 나오게';
  } catch { if ($('camState')) $('camState').textContent = '카메라를 열 수 없어 시연 화면으로 보여요 · 셔터를 누르면 찍은 걸로 쳐요'; }
}
function camStop() { if (STREAM) { STREAM.getTracks().forEach(t => t.stop()); STREAM = null; } }
function drawSim(two = S.selfieDemo === 'reject') {
  const c = $('camSim'); if (!c) return; const g = c.getContext('2d'), W = c.width, H = c.height;
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3A4152'); bg.addColorStop(.62, '#596276'); bg.addColorStop(.63, '#2B2F38'); bg.addColorStop(1, '#22252C'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 4; i++) g.fillRect(20 + i * 72, 40, 52, 190);   // 거울 패널
  g.strokeStyle = '#9AA3B5'; g.lineWidth = 7; g.beginPath(); g.moveTo(30, 300); g.lineTo(110, 300); g.stroke(); g.fillStyle = '#9AA3B5'; g.fillRect(22, 284, 12, 32); g.fillRect(106, 284, 12, 32);   // 덤벨
  const person = (x, s, a) => { g.fillStyle = `rgba(236,238,244,${a})`; g.beginPath(); g.arc(x, 150 * s + (1 - s) * 120, 34 * s, 0, 7); g.fill(); g.beginPath(); g.moveTo(x - 62 * s, H); g.quadraticCurveTo(x - 60 * s, 205 * s + (1 - s) * 160, x, 200 * s + (1 - s) * 160); g.quadraticCurveTo(x + 60 * s, 205 * s + (1 - s) * 160, x + 62 * s, H); g.fill(); };
  if (two) person(232, .78, .75); person(two ? 120 : 150, 1, .95);
  g.fillStyle = '#fff'; g.font = 'bold 15px Pretendard, sans-serif'; g.fillText(`${md(TODAY)} 오운완`, 14, H - 14);
}
function shoot() {
  const c = document.createElement('canvas'); c.width = 240; c.height = 320; const g = c.getContext('2d'), v = $('camV');
  if (STREAM && v && v.videoWidth) { const r = Math.min(v.videoWidth / 3, v.videoHeight / 4), w = r * 3, h = r * 4; g.translate(240, 0); g.scale(-1, 1); g.drawImage(v, (v.videoWidth - w) / 2, (v.videoHeight - h) / 2, w, h, 0, 0, 240, 320); }
  else { drawSim(); g.drawImage($('camSim'), 0, 0, 240, 320); }
  judgeShot(c.toDataURL('image/jpeg', .72));
}
function judgeShot(url) {
  S.shot = url; S.selfieStep = 'judge'; camStop(); render(); tone(1400, 0, .06, 'square', .05);
  setTimeout(() => { if (S.sub !== 'selfie') return; S.selfieStep = S.selfieDemo === 'reject' ? 'reject' : 'done'; if (S.selfieStep === 'done') applySelfie(); save(); render(); }, 1400);
}
function applySelfie() {
  S.selfieGot = 0;
  if (S.selfieFor === 'session' && S.session) { S.session.selfie = true; S.session.photo = S.shot; S.session.lastAt = Date.now(); return; }
  const rec = S.records.find(r => r.id === S.lastResult); if (!rec) return;
  rec.photo = S.shot;
  if (rec.v !== 'gps') return;   // 비입점 위치 확인(V1b)만 셀카로 100% · 입점센터는 입장만으로 100%(결정 36 ①)
  const g = selfieGain(rec); rec.v = 'selfie'; rec.selfieXP = g; rec.xp += g; S.selfieGot = g;
  if (rec.ctx) rec.centerIf = centerIf({ verify: 'V1b', selfie: true, items: rec.items, prCount: rec.prCount }, rec.ctx);
  const res = applyXP({ level: S.level, xp: S.xp }, g, { monthUsed: S.month });
  S.level = res.level; S.xp = res.xp; S.month += res.points; S.points += res.points;
  if (res.level > res.from) rec.lvUp = { from: rec.lvUp ? rec.lvUp.from : res.from, to: res.level, points: (rec.lvUp ? rec.lvUp.points : 0) + res.points, pointsCut: res.pointsCut };
  S.selfieRes = res;
}

/* ===== 바텀시트 (기존 화면은 밀지 않고 덮는다) ===== */
function sheet(html) { const el = $('sheet'); el.innerHTML = `<div class="sh-bg" data-act="shClose"></div><div class="sh" role="dialog">${html}</div>`; el.classList.add('on'); }
function shClose() { const el = $('sheet'); el.classList.remove('on'); el.innerHTML = ''; }

/* ===== 효과형 아이템 사용 — 계산기와 같은 함수로 효과 미리 보여 주기(결정 33: 아이템 경험치는 한도 없음) ===== */
function useItem(id) {
  const it = ITEMS.find(i => i.id === id), L = ledger();
  if (id === 'charm') { S.inv.charm--; S.shields++; save(); render(); return toast('연속 보호권 1장 보관 · 설정 › 쉬어가기 티켓에서 확인'); }
  const nolimit = `<div class="notice nolimit" id="useNoLimit">💰 아이템 경험치는 <b>한도 없음</b><br>이번 주 운동 한도(${fmt(weekXP())}/${CFG.WEEK_CAP.toLocaleString()})와 따로 세요</div>`;
  if (id === 'potion') {
    const g = potionGain(L);
    return sheet(`<div class="h2">경험치 물약을 쓸까요?</div><div class="xrow"><span>지금 바로</span><b>+${fmt(g.gained)} XP</b></div>${nolimit}
      <div class="muted">유료 경험치라 랭킹에 💰가 붙고, 물약으로 오른 레벨엔 포인트가 적립되지 않아요 · 하루 몇 병이든 쓸 수 있어요</div>
      <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn" data-act="usePotion">사용</button></div>`);
  }
  const f = forecastWeek({ L, sessions: Math.max(1, S.goal - weekCount()), per: avgSession(), booster: id === 'boost1' ? 'one' : '7d', potions: 0 });
  sheet(`<div class="h2">${it.name}을 쓸까요?</div>
    <div class="xrow"><span>예상으로 더 받는 경험치</span><b>+${fmt(f.extra)} XP</b></div>${nolimit}
    <div class="muted">남은 운동 ${Math.max(1, S.goal - weekCount())}번 · 1번 ${fmt(avgSession())} XP 기준 · 2배로 늘어난 몫은 운동 한도를 다 채운 주에도 그대로 들어가요</div>
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
  ring.className = 'evo-ring'; $('evoFlash').className = 'evo-flash'; $('evoParts').innerHTML = '';
  $('evoOk').classList.remove('show'); $('evoPt').classList.remove('show');
  $('evoSound').textContent = S.sound ? '🔊' : '🔇';
  $('evoTag').textContent = replay ? '다시 보기' : (ev.to - ev.from > 1 ? `${ev.to - ev.from}레벨 한꺼번에` : '');
  const name = CH[t].name;
  const oc = setImg(old, t, ev.from, boxH); const nc = setImg(nw, t, ev.to, boxH);
  const ringStyle = c => { ring.className = `evo-ring ring t${tr}`; ring.style.width = Math.max(c.w * 1.1, boxH * .7) + 'px'; ring.style.height = boxH * .14 + 'px'; };
  const lvNum = $('evoLvNum'); lvNum.textContent = `Lv.${ev.from}`;
  $('evoTitle').textContent = ''; $('evoSub').textContent = '';
  const ptText = replay ? '' : ev.points ? `+${ev.points.toLocaleString()}P 적립 · 이번 달 ${S.month.toLocaleString()}/${MONTH_CAP.toLocaleString()}P` : (ev.pointsCut ? '이번 달 적립 한도 도달' : '');
  const rollTo = (from, to, dur) => { const steps = to - from; if (steps <= 0) return; const each = Math.max(60, dur / steps);
    for (let k = 1; k <= steps; k++) at(each * k, () => { lvNum.textContent = `Lv.${from + k}`; lvNum.classList.remove('roll'); void lvNum.offsetWidth; lvNum.classList.add('roll'); }); };
  P.finish = () => {   // 결과 상태(건너뛰기도 여기로)
    timers.forEach(clearTimeout); timers.length = 0;
    old.style.opacity = 0; nw.className = 'evo-new' + (evolved ? '' : ' glow'); nw.style.opacity = 1;
    ringStyle(nc); ring.classList.add('show'); lvNum.textContent = `Lv.${ev.to}`;
    $('evoTitle').textContent = ev.to === 99 ? `${name}${CH[t].josa} 최고 레벨에 도달했다!` : evolved ? `${name}${CH[t].josa} «${stageName(t, ev.to)}»${ro(stageName(t, ev.to))} 진화했다!` : '레벨 업!';
    $('evoSub').textContent = ev.to === 99 ? '최고 레벨 달성 · 골드 아우라' : `칭호 «${stageName(t, ev.to)}» · ${TIER_NAME[tr]}`;
    if (ptText) { $('evoPt').textContent = ptText; $('evoPt').classList.add('show'); }
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
    at(800, () => { $('evoSub').textContent = `칭호 «${stageName(t, ev.to)}»`; if (ptText) { $('evoPt').textContent = ptText; $('evoPt').classList.add('show'); } });
    at(1900, close);
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
  const el = $('evo'); el.className = 'evo'; el.setAttribute('aria-hidden', 'true');
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
  if (a === 'shClose') return shClose();
  if (a === 'sub') { if (v === 'calc') S.calc = null; return go('workout', v); }
  if (a === 'back') { S.editRec = null; return go('workout', v || null); }
  if (a === 'start') return startSession();
  if (a === 'place') { S.placeOpen = null; return pickPlace(v); }
  if (a === 'placeLinked') { S.placeOpen = S.placeOpen === v ? null : v; save(); return render(); }
  if (a === 'placeEnter') { S.placeOpen = null; openSession({ name: v, kind: 'center' }, 'V1'); return toast(`입장 확인! ${v}에서 운동 시작`); }
  if (a === 'findCenter') { S.nbOnly = true; S.nbFrom = S.tab === 'workout' ? S.sub || 'main' : null; return go('nearby'); }
  if (a === 'nbOnly') { S.nbOnly = !S.nbOnly; save(); return render(); }
  if (a === 'addEx') return addEx(v);
  if (a === 'openEx') { S.cur = v; return go('workout', EX[v].mode === 'cardio' ? 'cardio' : EX[v].mode === 'lesson' ? 'session' : 'set'); }
  if (a === 'routine') return loadRoutine();
  if (a === 'customEx') { const name = S.q.trim().slice(0, 20), cid = 'custom_' + Date.now();
    const c = { id: cid, name, cat: 'custom', part: '전신', sub: [], mode: 'r', xpk: 'body', custom: 1, home: 1 }; S.custom.push(c); EX[cid] = c; S.q = ''; toast(`«${name}» 추가 · 부위는 전신으로 시작`); return addEx(cid); }
  if (a === 'endSession') return endSession();
  if (a === 'discard') { shClose(); S.session = null; save(); toast('기록 없이 운동을 닫았어요'); return go('workout'); }
  if (a === 'setDone') return setDone();
  if (a === 'setForce') return setDone(true);
  if (a === 'selfie') { S.selfieFor = v; S.selfieStep = S.selfieSeen ? 'cam' : 'guide'; S.shot = null; return go('workout', 'selfie'); }
  if (a === 'selfieGo') { S.selfieSeen = true; S.selfieStep = 'cam'; }
  else if (a === 'shoot') return shoot();
  else if (a === 'selfieRetry') { S.selfieStep = 'cam'; S.shot = null; }
  else if (a === 'selfieQuit') return go('workout', S.selfieFor === 'session' ? 'session' : 'result');
  else if (a === 'selfieOk') { const res = S.selfieRes; S.selfieRes = null; S.shot = null; S.bump = 1;
    if (S.selfieFor === 'session') return go('workout', 'session');
    if (res && res.level > res.from) return afterGain(res, { toast: `셀카 반영 +${fmt(S.selfieGot)} XP` });
    go('workout', 'result'); S.bump = 0; if (S.selfieGot) toast(`셀카 반영 +${fmt(S.selfieGot)} XP`); return; }
  else if (a === 'sdemo') { S.selfieDemo = v; drawSim(); document.querySelectorAll('[data-act="sdemo"]').forEach(x => x.classList.toggle('on', x.dataset.v === v)); save(); return; }
  else if (a === 'stw') { it.draft.w = clampStep(it.draft.w, dd, EX[it.ex].step || 2.5, 0, 500); }
  else if (a === 'str') { it.draft.r = clampStep(it.draft.r, dd, 1, 1, 100); }
  else if (a === 'sts') { it.draft.s = clampStep(it.draft.s, dd, 10, 10, 1800); }
  else if (a === 'undoSet') { const x = it.sets.pop(); if (x && x.pr) s.prCount--; S.rest = null; }
  else if (a === 'rest') { if (+v === 0) S.rest = null; else { S.rest.until += +v * 1000; S.rest.total = Math.max(S.rest.total, Math.ceil((S.rest.until - Date.now()) / 1000)); } }
  else if (a === 'cmode') it.draft.mode = v;
  else if (a === 'cStart') { it.run = { startAt: Date.now(), offset: 0 }; s.lastAt = Date.now(); }
  else if (a === 'cFwd') { it.run.offset += 600000; }
  else if (a === 'cStop') { const ms = Date.now() - it.run.startAt + it.run.offset; it.min = Math.min(CFG.LIM.cardioMaxMin, (it.min || 0) + Math.max(1, Math.round(ms / 60000))); it.run = null; it.draft.min = it.min; it.level = it.draft.level; s.lastAt = Date.now(); toast(`${EX[it.ex].name} ${it.min}분 기록`); }
  else if (a === 'cmin') it.draft.min = clampStep(it.draft.min, dd, 5, 5, CFG.LIM.cardioMaxMin);
  else if (a === 'clevel') { it.draft.level = v; if (it.min) it.level = v; }
  else if (a === 'ckm') { it.draft.km = clampStep(it.draft.km, dd, 0.5, 0, 60); it.draft.open = true; }
  else if (a === 'ckmh') { it.draft.kmh = clampStep(it.draft.kmh, dd, 0.5, 0, 30); it.draft.open = true; }
  else if (a === 'cinc') { it.draft.inc = clampStep(it.draft.inc, dd, 1, 0, 15); it.draft.open = true; }
  else if (a === 'cSave') { if (it.draft.mode === 'input') it.min = it.draft.min; if (it.run) { const ms = Date.now() - it.run.startAt + it.run.offset; it.min = Math.min(CFG.LIM.cardioMaxMin, (it.min || 0) + Math.max(1, Math.round(ms / 60000))); it.run = null; }
    if (!it.min) return toast('시간을 기록해 주세요 — 시작을 누르거나 직접 입력해요');
    it.level = it.draft.level; if (it.draft.km) it.km = it.draft.km; if (it.draft.kmh) it.kmh = Math.min(25, it.draft.kmh); if (it.draft.inc) it.inc = it.draft.inc; s.lastAt = Date.now();
    toast(`${EX[it.ex].name} ${it.min}분 저장`); return go('workout', 'session'); }
  else if (a === 'demo') S.demo = v;
  else if (a === 'mdemo') S.moodDemo = v;
  else if (a === 'vdemo') { s.verify = v; if (v === 'V3' && !s.items.some(i => i.ex === 'lesson_pt')) s.items.unshift({ ex: 'lesson_pt', min: 50 }); if (v !== 'V3') s.items = s.items.filter(i => i.ex !== 'lesson_pt'); }
  else if (a === 'autoEndDemo') { s.lastAt = Date.now() - (CFG.AUTO_END_MIN + 1) * 60000; save(); return render(); }
  else if (a === 'holdDemo') S.holdDemo = !S.holdDemo;
  else if (a === 'release') { const r = S.records.find(x => x.id === +id); if (!r || !r.held) return; const cbr = r.br && r.br.v === 'V1' ? centerBonus(r.br, ledger(r.id)) : { cb: 0, cut: 0 }, g = r.held + cbr.cb; r.xp += g; r.held = 0; r.xpCenter = cbr.cb; r.cbCut = cbr.cut;
    const res = applyXP({ level: S.level, xp: S.xp }, g, { v0: r.v === 'self', monthUsed: S.month }); S.level = res.level; S.xp = res.xp; S.month += res.points; S.points += res.points;
    if (res.level > res.from) r.lvUp = { from: res.from, to: res.level, points: res.points, pointsCut: res.pointsCut };
    return afterGain(res, { toast: `보류됐던 ${fmt(g)} XP가 반영됐어요` }); }
  else if (a === 'mset') { const mm = MOOD[v]; S.mood = { verdict: v, ratio: null, date: TODAY, line: mm.lines[0] }; }
  else if (a === 'wseg') S.wseg = v;
  else if (a === 'pick') S.pick = v;
  else if (a === 'choose') { S.type = S.pick || S.type; S.chosen = true; S.pick = null;
    if (!S.onboarded) return go('workout', 'onbGoal');
    S.sub = null; toast(`${CH[S.type].name}${wa(S.type)} 운동 시작!`); }
  else if (a === 'goal') S.goal = +v;
  else if (a === 'obNext') return go('workout', 'onbPerm');
  else if (a === 'perm') { S.perm[v] = !S.perm[v]; if (v === 'loc' && S.perm.loc) S.locCheck = true; }
  else if (a === 'obDone') { S.onboarded = true; toast(`${CH[S.type].name}${wa(S.type)} 운동 시작!`); return go('workout'); }
  else if (a === 'rechoose') { if (S.level >= 10) return toast('Lv.10 이후엔 변경권 아이템이 필요해요 (시연: 설정 › 시연 도구에서 바꾸기)'); S.chosen = false; S.sub = null; }
  else if (a === 'saveWorkout') return endSession();
  else if (a === 'coach') return toast('코칭 대화(C9)는 프로토타입 범위 밖 · 월 20회');
  else if (a === 'invite') return toast('친구 초대(C15b)는 프로토타입 범위 밖');
  else if (a === 'ftab') S.fTab = v;
  else if (a === 'pure') S.pureOnly = !S.pureOnly;
  else if (a === 'stab') S.sTab = v;
  else if (a === 'part') { S.part = v; }
  else if (a === 'buy') { const x = ITEMS.find(i => i.id === id); if (S.points < x.price) return toast('포인트가 부족해요 — 니짐 포인트 충전 화면으로 이어져요');
    S.points -= x.price; if (x.use) S.inv[id] = (S.inv[id] || 0) + 1; else S.owned[id] = 1; toast(`${x.name} 구매 완료 · -${x.price}P`); }
  else if (a === 'use') return useItem(id);
  else if (a === 'eatUse') return eatUse(id);
  else if (a === 'buyFood') return buyFood(id);
  else if (a === 'eatCat') S.eatCat = v;
  else if (a === 'useBoost') { S.inv[id]--; if (id === 'boost1') S.boostNext = true; else { const d = new Date(); d.setDate(d.getDate() + 6); S.boost7Until = ymd(d); } shClose(); toast(id === 'boost1' ? '다음 운동 1번 경험치 2배!' : '7일 동안 경험치 2배!'); }
  else if (a === 'usePotion') { const g = potionGain(ledger()); S.inv.potion--; S.paidLog.push({ id: Date.now(), date: TODAY, xp: g.gained, v: 'paid' }); shClose();
    const res = applyXP({ level: S.level, xp: S.xp }, g.gained, { paid: true, monthUsed: S.month }); S.level = res.level; S.xp = res.xp;
    return afterGain(res, { toast: `물약 +${fmt(g.gained)} XP · 💰 유료 경험치`, to: 'shop' }); }
  else if (a === 'calc') { const c = S.calc, lim = { sessions: [0, 7, 1], per: [0, 1200, 20], potions: [0, 7, 1] }[b.dataset.k]; c[b.dataset.k] = clampStep(c[b.dataset.k], dd, lim[2], lim[0], lim[1]); }
  else if (a === 'calcB') S.calc.booster = v;
  else if (a === 'cmp') { const m = S.cmp, lim = { perWeek: [0, 7, 1], per: [0, 1200, 20], potions: [0, 21, 1] }[b.dataset.k]; m[b.dataset.k] = clampStep(m[b.dataset.k], dd, lim[2], lim[0], lim[1]); }
  else if (a === 'cmpB') S.cmp.booster = v;
  else if (a === 'equip') { S.equipped[id] = !S.equipped[id]; }
  else if (a === 'goalSet') { S.goalNext = +v === S.goal ? null : +v; toast(+v === S.goal ? `주 ${S.goal}회 그대로` : `다음 주 월요일부터 주 ${v}회`); }
  else if (a === 'ticketAuto') S.ticketAuto = !S.ticketAuto;
  else if (a === 'noti') S.noti[v] = !S.noti[v];
  else if (a === 'locCheck') { if (!S.perm.loc) { S.perm.loc = true; S.locCheck = true; toast('위치 권한 허용(시연)'); } else S.locCheck = !S.locCheck; }
  else if (a === 'hideTips') S.hideTips = !S.hideTips;
  else if (a === 'bw') S.bodyweight = S.bodyweight ? (S.bodyweight + dd < 30 ? null : Math.min(200, S.bodyweight + dd)) : 70;
  else if (a === 'entryDemo') S.entryDemo = !S.entryDemo;
  else if (a === 'fillWeek') { const left = Math.max(0, CFG.WEEK_CAP - weekXP()); if (left) S.records.push({ id: Date.now(), date: weekDays().find(d => d <= TODAY && !S.records.some(r => r.date === d)) || TODAY, place: '니짐 신림점', placeKind: 'center', summary: '시연용 · 이번 주 경험치 채우기', items: [], xp: left, v: 'auto' }); toast('이번 주 경험치를 1,800까지 채웠어요(시연)'); }
  else if (a === 'rec') { S.recId = +id; S.recFrom = S.sub; S.editRec = null; return go('workout', 'rec'); }
  else if (a === 'editStart') { const r = S.records.find(x => x.id === S.recId); S.editRec = { items: JSON.parse(JSON.stringify(r.items || [])) }; }
  else if (a === 'editCancel') S.editRec = null;
  else if (a === 'eSet') { const st = S.editRec.items[+b.dataset.i].sets.filter(x => x.done)[+b.dataset.s], k = b.dataset.k, e2 = EX[S.editRec.items[+b.dataset.i].ex];
    st[k] = k === 'w' ? clampStep(st.w, dd, e2.step || 2.5, 0, 500) : k === 'r' ? clampStep(st.r, dd, 1, 1, 100) : clampStep(st.s, dd, 10, 10, 1800); }
  else if (a === 'eDel') { const x = S.editRec.items[+b.dataset.i]; const done = x.sets.filter(q => q.done); x.sets.splice(x.sets.indexOf(done[+b.dataset.s]), 1); }
  else if (a === 'eMin') { const x = S.editRec.items[+b.dataset.i]; x.min = clampStep(x.min, dd, 5, 5, CFG.LIM.cardioMaxMin); }
  else if (a === 'editSave') { const r = S.records.find(x => x.id === S.recId), items = S.editRec.items.filter(x => (x.sets || []).some(q => q.done) || x.min > 0), ed = editCalc(r, items), diff = ed.xp + (r.xpCenter || 0) - r.xp;
    Object.assign(r, { items, summary: summaryOf(items), xp: ed.xp + (r.xpCenter || 0), raw: ed.br.raw, v: 'self', br: ed.br, cut: ed.cap.cut, cutReason: ed.cap.reason, selfieXP: 0, edited: true });
    const res = applyXP({ level: S.level, xp: S.xp }, diff, { v0: true, monthUsed: S.month }); S.level = res.level; S.xp = res.xp; S.month += res.points; S.points += res.points; S.editRec = null;
    toast(diff < 0 ? `수정 저장 · ${fmt(-diff)} XP 줄었어요(레벨은 그대로)` : `수정 저장 · ${diff ? '+' + fmt(diff) + ' XP' : '경험치 변화 없음'}`);
    if (res.level > res.from) return afterGain(res, { to: 'rec' }); }
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
  if (e.target.id !== 'camFile' || !e.target.files[0]) return;
  const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = 240; c.height = 320; const g = c.getContext('2d'), r = Math.min(img.width / 3, img.height / 4);
    g.drawImage(img, (img.width - r * 3) / 2, (img.height - r * 4) / 2, r * 3, r * 4, 0, 0, 240, 320); URL.revokeObjectURL(img.src); judgeShot(c.toDataURL('image/jpeg', .72)); };
  img.src = URL.createObjectURL(e.target.files[0]);
});
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
}, 1000);

document.querySelector('.ver').textContent = `프로토타입 ${VER}`;
render();
if (S.pending) setTimeout(() => { toast('지난번에 못 본 레벨업 연출을 재생해요'); playPending(); }, 700);
