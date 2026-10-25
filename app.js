'use strict';
const KEY = 'nijim_workout_proto_v18';
/* 확정 12종(결정 22~25) — design v13 정본 · 레벨 띠 11컷 · 표정 5종. 쉐키(결정 24)·옛 임시 캐릭터 없음. 12종 모두 처음부터 선택 가능(결정 25) */
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
/* 레벨 → 컷 (결정 27 레벨 띠): 1~9 lv01 · 10~19 lv10 · … · 90~98 lv90 · 99 lv99(+골드 링). README_for_dev 4절 3앵커 임시 매핑은 폐기 */
const cutOf = lv => lv >= 99 ? '99' : STAGE_KEYS[Math.min(9, Math.floor(lv / 10))];
const need = n => Math.round(200 + 12 * n + 0.3 * n * n);
const stageIdx = lv => lv >= 99 ? 10 : Math.min(9, Math.floor(lv / 10));
const stageName = (t, lv) => lv >= 99 ? '완성' : `${stageIdx(lv) + 1}단계`;
const tierOf = lv => lv >= 99 ? 6 : lv >= 80 ? 5 : lv >= 60 ? 4 : lv >= 40 ? 3 : lv >= 20 ? 2 : 1;
const ro = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; if (c < 0 || c > 11171) return '로'; const j = c % 28; return j === 0 || j === 8 ? '로' : '으로'; };
const TIER_NAME = ['', '기본', '하늘 링', '하늘 링+입자', '로즈 링', '로즈 2중 링', '골드 아우라'];
const isBigBoundary = lv => lv % 10 === 0 || lv === 99;
const lvPoint = L => L <= 9 ? 50 : L <= 29 ? 100 : L <= 49 ? 200 : L <= 69 ? 300 : L <= 89 ? 500 : 1000;
const evoBonus = L => ({10:300,20:300,30:500,40:500,50:500,60:500,70:1000,80:1000,90:1000,99:3000})[L] || 0;
const MONTH_CAP = 1000;
const WEEK_GOAL = 3;
const DAY_CAP = 600, WEEK_CAP = 1800;   // 결정 32: 주 상한 3,000 → 1,800 (하루 600 유지)
/* 하루·주 상한 중 더 많이 남은 쪽이 아니라 «더 적게 남은 쪽»까지만 준다 */
const capXP = (raw, dayUsed, weekUsed) => Math.max(0, Math.min(raw, DAY_CAP - dayUsed, WEEK_CAP - weekUsed));

const ITEMS = [
  { id:'headband_gold', kind:'effect', name:'골드 헤드밴드', desc:'경험치 2배 · 24시간', price:300 },
  { id:'charm', kind:'effect', name:'연속 보호 부적', desc:'못 채운 주 1회 보호 · 7일', price:500 },
  { id:'shaker', kind:'effect', name:'부스터 쉐이커', desc:'경험치 +50% · 3일', price:600 },
  { id:'crown', kind:'effect', name:'리그 왕관', desc:'리그 표시 꾸미기 · 7일', price:800 },
  { id:'cap', kind:'look', name:'스포츠 캡', desc:'효과 없음', price:200 },
  { id:'sunglasses', kind:'look', name:'선글라스', desc:'효과 없음', price:300 },
  { id:'towel', kind:'look', name:'스카이 타월', desc:'효과 없음', price:200 },
  { id:'wristband', kind:'look', name:'손목밴드', desc:'효과 없음', price:100 },
];
const FRIENDS = [
  { n:'운동하는곰', t:'koa', lv:27, week:1420, rate:100, paid:0 },
  { n:'새벽러너', t:'saetbyeol', lv:41, week:980, rate:75, paid:0 },
  { n:'벤치왕', t:'ttukbi', lv:33, week:1650, rate:100, paid:2, pure:24 },
  { n:'필라테스러', t:'mungchi', lv:12, week:610, rate:67, paid:0 },
  { n:'헬린이9일차', t:'bamtol', lv:4, week:420, rate:50, paid:0 },
];
const EXERCISES = [
  { id:'bench', name:'벤치프레스', unit:'세트', v:3, xp:30 },
  { id:'lat', name:'랫풀다운', unit:'세트', v:3, xp:30 },
  { id:'run', name:'러닝머신', unit:'분', v:20, xp:6, step:5 },
];
/* ===== 세션 강도 반응(결정 21) — 시연용 규칙. 실서비스는 서버 함수 judge_session_intensity 1곳에서 계산 =====
   기준값: 종목별 «본인 최근 10회 중앙값»을 시연에선 고정값으로 둔다(벤치 3세트 · 랫풀 3세트 · 러닝 20분). */
const BASE = { bench:3, lat:3, run:20 };
const MOOD_LOW = 0.6, MOOD_HIGH = 1.3;          // 1안: 60% 미만 → 아쉬운 · 130% 이상 → 신남 (대안 50%/120%)
const MOOD = {
  low:    { label:'아쉬운', cls:'low',  lines:['오늘은 좀 아쉬웠지? 괜찮아, 나온 게 반이야. 다음엔 1세트만 더 같이 해보자','몸이 무거운 날이었나 봐. 그래도 왔잖아! 다음엔 같이 10분만 더 해보자','오늘은 살짝 아쉬움. 그래도 기록은 1칸 늘었어. 내일 컨디션 보고 다시 가자'] },
  normal: { label:'평소대로', cls:'',   lines:['오늘도 평소만큼 꾸준히! 이런 날이 1주, 1달을 만들어'] },
  high:   { label:'신남', cls:'high', lines:['오늘 평소보다 훨씬 많이 했어! 나까지 땀 나 💧 내일은 꼭 쉬어줘','와, 지난주의 너를 넘었어! 1단계 더 단단해진 기분이야'] },
};
const VERIFY = [['auto','입장 확인됨 · 자동'],['selfie','+ 오운완 셀카(선택)'],['gps','위치 확인'],['lesson','레슨 확정(2배)']];

/* 날짜 유틸 (시연용 기록은 «오늘» 기준 상대 날짜로 심는다) */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const TODAY = ymd(new Date());
const seedRecords = () => [
  { id: 1, date: daysAgo(2), place: '니짐 신림점', summary: '벤치프레스 3세트 · 랫풀다운 3세트', xp: 180, v: 'auto' },
  { id: 2, date: daysAgo(4), place: '집', summary: '홈트 20분', xp: 48, v: 'gps' },
  { id: 3, date: daysAgo(6), place: '니짐 신림점 · PT', summary: '하체 수업 50분', xp: 400, v: 'lesson' },
  { id: 4, date: daysAgo(9), place: '니짐 신림점', summary: '러닝머신 25분', xp: 150, v: 'auto' },
  { id: 5, date: daysAgo(12), place: '니짐 신림점', summary: '벤치프레스 4세트 · 러닝 15분', xp: 210, v: 'selfie' },
];

const fresh = () => ({ type:'mungchi', chosen:false, level:18, xp:need(18) - 120, points:2450, month:0, monthKey:'2026-10',
  events:[], pending:null, sound:true, placeholder:false, demo:'none', quitDemo:false, verify:'auto',
  sets:{ bench:3, lat:3, run:20 }, exprDemo:'auto', lightDay:false, moodDemo:'auto', mood:null, owned:{ cap:1 }, equipped:{ cap:true }, records: seedRecords(), streakWeeks: 5,
  tab:'home', sub:null, wseg:'mine', fTab:'week', pureOnly:false, sTab:'effect', pick:null });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);

const PH_H = [60,110,150,170,190,210,230,260,300,340,360];
function placeholderSrc(lv) {
  const h = PH_H[stageIdx(lv)], w = Math.round(h * 0.9);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="M${w*0.1} ${h} Q0 ${h*0.4} ${w/2} 0 Q${w} ${h*0.4} ${w*0.9} ${h} Z" fill="#9AA3B5"/><text x="50%" y="62%" font-size="${Math.max(12,h/7)}" text-anchor="middle" fill="#fff" font-family="sans-serif">${stageIdx(lv)+1}단계</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
/* 크기 규칙(README_for_dev 2절): 한 캐릭터 안에서 레벨이 오를수록 커진다(성장).
   v1.9 크기 통일: 치이카와풍 9종은 같은 레벨 컷이면 «몸 높이»(머리 윗면~발끝, 안테나·머리털·귀 끝 같은 가는 장식 제외)가 같게 그린다.
   정본은 컷마다 여백 없이 잘려 있어 그림 높이로 맞추면 장식이 작고 몸이 큰 밤톨·뚝비·영차가 커 보였다(v1.8 선택 화면).
   BODY = scripts/measure_v19.py 로 잰 컷별 몸 높이(웹 px, 컷 순서 01·10…90·99) · BODY_G = 레벨별 몸 높이/칸 높이(9종 중앙값 → 성장 곡선).
   납작한 3종(뭉치·도트·섀도)은 v1.8 규칙 그대로 */
const CUTS = ['01','10','20','30','40','50','60','70','80','90','99'];
const BODY = {"rilla":[282,298,313,326,331,334,388,396,402,415,417],"ttukbi":[293,313,342,346,359,349,393,394,397,403,402],"youngcha":[278,283,299,314,323,328,350,356,368,391,384],"saetbyeol":[307,333,350,357,366,353,381,398,402,408,408],"imu":[305,321,360,359,373,370,382,384,396,405,405],"koa":[283,299,306,317,329,348,382,390,403,410,396],"ppiyak":[279,315,342,362,370,355,402,404,409,414,395],"capy":[301,332,338,369,379,372,403,405,413,422,407],"bamtol":[319,338,355,371,372,376,416,415,417,426,403]};
const BODY_G = [0.6976, 0.75, 0.8143, 0.85, 0.8714, 0.8405, 0.9238, 0.9429, 0.9571, 0.9762, 0.9595];
const MAX01 = Math.max(...Object.values(CHARS).map(c => c.dims['01'][1] / c.k));
const SEL_BODY = 615 / MAX01;   // 선택 화면 Lv.1 몸 높이 = 칸 높이 × 이 비율 (v1.8 9종 표시 크기 중앙값)
/* 칸 비율마다 한 번: 9종×11컷이 전부 칸(높이, 폭×골드 링 1.1배) 안에 들도록 성장 곡선 전체를 같은 비율로 줄인다 */
const fitMemo = {};
function bodyFit(boxH, boxW, ringW) {
  const key = `${boxW / boxH}|${ringW}`;
  return fitMemo[key] ??= Math.min(1, ...Object.entries(BODY).flatMap(([t, b]) => CUTS.map((c, i) => { const [w, h] = CHARS[t].dims[c]; return Math.min(b[i] / (BODY_G[i] * h), b[i] * boxW / (BODY_G[i] * boxH * ringW * w)); })));
}
function scaleOf(t, lv, boxH, same, boxW, ringW = 1.1) {
  const C = CHARS[t], b = BODY[t], i = CUTS.indexOf(cutOf(lv));
  if (same) return b ? boxH * SEL_BODY / b[0] : boxH / (MAX01 * C.k);
  return b ? boxH * bodyFit(boxH, boxW, ringW) * BODY_G[i] / b[i] : Math.min(boxH / C.dims['99'][1], boxW / (ringW * C.dims['99'][0]));
}
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
/* 랭킹 아바타(40px 아이콘): 레벨마다 칸을 채우되(v1.8과 같음) 치이카와풍 9종은 같은 컷끼리 몸 높이를 맞춘다 */
function charAvatar(t, lv, box) {
  const c = cutOf(lv), i = CUTS.indexOf(c), [w, h] = CHARS[t].dims[c], b = BODY[t];
  const k = b ? box * Math.min(...Object.entries(BODY).map(([u, bb]) => { const [ww, hh] = CHARS[u].dims[c]; return bb[i] / Math.max(ww, hh); })) / b[i] : box / Math.max(w, h);
  return `<img src="assets/c/${t}/lv${c}.png" style="width:${Math.round(w*k)}px;height:${Math.round(h*k)}px" alt="">`;
}
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2400); }

function estXP() { return EXERCISES.reduce((a, e) => a + S.sets[e.id] * e.xp, 0); }
function xpToReach(target) {
  let total = need(S.level) - S.xp;
  for (let l = S.level + 1; l < target; l++) total += need(l);
  return total;
}
function demoXP() {
  const base = estXP();
  if (S.demo === 'next') return Math.max(base, xpToReach(Math.min(99, S.level + 1)));
  if (S.demo === 'boundary') { const t = Math.min(99, S.level >= 90 ? 99 : (Math.floor(S.level / 10) + 1) * 10); return xpToReach(t); }
  if (S.demo === 'multi') return xpToReach(Math.min(99, S.level + 5)) + 50;
  return base;
}
const todayDone = () => S.records.some(r => r.date === TODAY);
const dayXP = () => S.records.filter(r => r.date === TODAY && !r.demo).reduce((a, r) => a + r.xp, 0);
const weekXP = () => { const wd = weekDays(); return S.records.filter(r => wd.includes(r.date) && !r.demo).reduce((a, r) => a + r.xp, 0); };
const cappedEst = () => capXP(estXP(), dayXP(), weekXP());
/* 종목별 상대 비율(오늘 한 종목만 · 경험치 가중) → 아쉬운/평소/신남. 세트 0·가볍게 체크·기준 부족이면 판정 없음(na) */
function calcIntensity() {
  const done = EXERCISES.filter(e => S.sets[e.id] > 0);
  if (!done.length || S.lightDay) return { ratio: null, verdict: 'na' };
  const today = done.reduce((a, e) => a + S.sets[e.id] * e.xp, 0), base = done.reduce((a, e) => a + BASE[e.id] * e.xp, 0);
  const ratio = today / base;
  return { ratio, verdict: ratio < MOOD_LOW ? 'low' : ratio >= MOOD_HIGH ? 'high' : 'normal' };
}
function judgeMood() {
  const r = calcIntensity();
  const verdict = S.moodDemo !== 'auto' ? S.moodDemo : r.verdict;
  if (verdict === 'na') return null;
  const m = MOOD[verdict];
  return { verdict, ratio: r.ratio, date: TODAY, line: m.lines[Math.floor(Math.random() * m.lines.length)] };
}
const moodToday = () => (S.mood && S.mood.date === TODAY && S.mood.verdict !== 'normal') ? S.mood : null;   // 그날 자정까지만 · 평소는 표시 없음
/* ===== 컨디션 표정 5종(결정 21·26·30) — design 표정 레이어(얼굴만 변화). 판정은 PLAN 수치 그대로 =====
   운동한 날: 세션 강도 60% 미만 → 아쉬운(meh) · 130% 이상 → 신남(excited) · 그 사이 → 쌩쌩(happy)
   그 밖: 마지막 운동 후 0~3일 쌩쌩 · 4~6일 졸림(sleepy) · 7일+ 시무룩(sad, 30일+ 겨울잠도 이 얼굴) */
const EXPR = {
  happy:   { label:'쌩쌩',  line:'' },
  excited: { label:'신남',  line:'' },
  meh:     { label:'아쉬운', line:'' },
  sleepy:  { label:'졸림',  line:'같이 운동 갈래? 몸이 근질근질해…' },
  sad:     { label:'시무룩', line:'보고 싶었어… 돌아오면 첫 운동 경험치 1.5배!' },
};
const EXPR_KEYS = ['happy','excited','meh','sleepy','sad'];
const lastWorkoutDays = () => { const ds = S.records.filter(r => !r.demo).map(r => r.date).sort(); if (!ds.length) return 99;
  return Math.round((new Date(TODAY) - new Date(ds[ds.length - 1])) / 864e5); };
function exprNow() {
  if (S.exprDemo && S.exprDemo !== 'auto') return S.exprDemo;
  const m = moodToday(); if (m) return m.verdict === 'high' ? 'excited' : 'meh';
  const d = lastWorkoutDays(); return d >= 7 ? 'sad' : d >= 4 ? 'sleepy' : 'happy';
}
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
function weekDays() {   // 월요일 시작 7일
  const d = new Date(), dow = (d.getDay() + 6) % 7; const out = [];
  for (let i = 0; i < 7; i++) { const x = new Date(d); x.setDate(d.getDate() - dow + i); out.push(ymd(x)); }
  return out;
}
const weekCount = () => weekDays().filter(x => S.records.some(r => r.date === x)).length;
const coachLine = () => {
  const m = moodToday(); if (m) return m.line;   // 결정 21: 그날 표정이 있으면 말풍선은 그 문구
  const ex = exprNow(); if (EXPR[ex].line) return EXPR[ex].line;
  if (todayDone()) return '오늘 기록 완료! 내일은 어깨 쪽 한번 가볼까?';
  const left = WEEK_GOAL - weekCount();
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
        : '<span class="st"><i></i>오늘 기록 아직이에요</span>'}</div>${chev}</button>`
    : `<button class="mini" data-tab="workout" id="homeMini"><div class="mbox plus"><svg viewBox="0 0 22 22"><path d="M11 4V18M4 11H18"/></svg></div><div class="mtxt"><b>운동 친구 고르기</b><span class="st">운동할수록 자라는 캐릭터</span></div>${chev}</button>`;
  const pend = S.pending ? `<div class="notice"><span>⏳ 못 본 레벨업 연출이 있어요</span><button class="btn sm" data-act="playPending">보기</button></div>` : '';
  return `<div class="dummy">${pend}${card}
  <div class="ph tall">실제 앱 «홈» 화면 자리 (배너 · 추천 · 내주변 헬스장 …)</div><div class="ph">실제 앱 «홈» 콘텐츠 자리</div><div class="ph">실제 앱 «홈» 콘텐츠 자리 (맨 아래 블록 — 탭바에 가리면 안 됨)</div></div>`;
}
const vNearby = () => vDummy('내주변', ['실제 앱 «내주변» 화면 자리 (지도 · 센터 목록)', '실제 앱 «내주변» 콘텐츠 자리']);
const vMembership = () => vDummy('멤버십', ['실제 앱 «멤버십» 화면 자리 (내 회원권 · 구독)', '실제 앱 «멤버십» 콘텐츠 자리']);
const vAll = () => vDummy('전체', ['실제 앱 «전체» 메뉴 자리 (마이페이지 · 설정 · 고객센터 …)', '실제 앱 «전체» 콘텐츠 자리']);

/* ===== 운동기록 탭 — 메인 ===== */
function subHead(title) { return `<div class="subhead"><button data-act="back" id="backBtn"><i>‹</i>운동기록</button><div class="h2">${title}</div></div>`; }
function vChoose() {
  const pick = S.pick || S.type;
  return `<div class="sec"><div class="h2">같이 운동할 친구를 골라 주세요</div><div class="muted" style="margin-bottom:12px">능력치는 모두 같고 생김새·말투만 달라요. Lv.10 전에 1번 바꿀 수 있어요.</div>
  <div class="choose" id="chooseGrid">${Object.keys(CH).map(k => `<button class="cc ${pick===k?'on':''}" data-act="pick" data-v="${k}">${charHTML(k, 1, 84, false, null, true)}<b>${CH[k].name}</b></button>`).join('')}</div>
  <div class="card" style="text-align:center"><div class="muted">진화 미리보기 · <b style="color:var(--ink)">${esc(CH[pick].name)}</b> — ${esc(CH[pick].intro)}</div><div style="display:flex;justify-content:space-around;align-items:flex-end;margin-top:8px">${[1,30,60,99].map(l => `<div style="text-align:center">${charHTML(pick, l, 76, l >= 99)}<div class="muted" style="font-size:11px;margin-top:4px">Lv.${l}</div></div>`).join('')}</div></div>
  <button class="btn" data-act="choose" id="chooseBtn">${esc(CH[pick].name)}${CH[pick].josa === '가' ? '와' : '과'} 시작하기</button>
  <div class="muted" style="text-align:center;margin-top:8px">시연용: 고른 뒤에도 레벨·경험치는 예시값(Lv.18)을 유지해요</div></div>`;
}
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
  // 이번 달 캘린더
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
  return `${seg}<div class="sec" style="padding-top:8px">${pend}
  <div class="card" id="stageCard"><div class="stage"><div class="cwrap ${exprNow()}">${charHTML(t, lv, 150, true, exprNow(), false, 140)}</div>
    <div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span><span class="pill tier${tr}">${TIER_NAME[tr]}</span>${moodPill(moodToday(), true)}${exprPill(exprNow(), true)}</div>
    <div class="bar"><i style="width:${lv>=99?100:Math.round(S.xp/need(lv)*100)}%"></i></div>
    <div class="muted">${lv>=99?'최고 레벨':`Lv.${lv+1}까지 ${toNext.toLocaleString()} XP`} · ${nextEvo}</div>
    <div class="eqs">${eqNames || '<span class="pill none">장착 아이템 없음</span>'}</div>
    <button class="linkbtn" data-act="sub" data-v="me" id="goMe">내 캐릭터 자세히 ›</button></div></div>${moodToday() ? `<div class="say moodsay ${moodToday().verdict}" id="stageSay">${esc(moodToday().line)}</div>` : EXPR[exprNow()].line ? `<div class="say moodsay ${exprNow()}" id="stageSay">${esc(EXPR[exprNow()].line)}</div>` : ''}</div>
  <button class="btn" data-act="sub" data-v="record" id="goRecord" style="margin-top:0">오늘 운동 기록하기</button>
  <div class="muted" style="text-align:center;margin:6px 0 12px">인증 수단은 다음 화면에서 골라요 (자동 · 셀카 · 위치 · 레슨)</div>
  <div class="card" id="streakCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px">이번 주 ${wk}/${WEEK_GOAL}회</div><span class="pill ${wk>=WEEK_GOAL?'tier4':'tier1'}">🔥 ${S.streakWeeks}주 연속</span></div>
    <div class="week">${week}</div>
    <div class="wxp" id="weekXP"><span>이번 주 경험치</span><b>${weekXP().toLocaleString()}/${WEEK_CAP.toLocaleString()}</b></div><div class="bar thin"><i style="width:${Math.min(100, Math.round(weekXP() / WEEK_CAP * 100))}%"></i></div>
    <div class="muted" style="margin-top:8px;font-weight:700;color:var(--ink)">${now.getMonth()+1}월</div><div class="cal">${cal}</div></div>
  <div class="card coach" id="coachCard"><div class="cbox">${charFit(t, lv, 52, exprNow())}</div><div><div class="say">${coachLine()}</div><button class="linkbtn" data-act="coach">코치에게 물어보기 › <span class="muted" style="font-weight:500">월 20회</span></button></div></div>
  <div class="card" id="recentCard"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h2" style="margin:0;font-size:16px">최근 기록</div><button class="linkbtn" data-act="sub" data-v="stats" style="margin:0">전체 보기 ›</button></div>
    ${recent.map(r => `<div class="rec"><div><b>${esc(r.summary)}</b><small>${r.date.slice(5).replace('-', '/')} · ${esc(r.place)} · ${VERIFY.find(v => v[0] === r.v)[1].replace('+ ', '').replace(' · 자동', '')}</small></div><span class="xp">+${r.xp} XP</span></div>`).join('')}</div>
  <div class="entries" id="entries">
    <button class="entry" data-act="sub" data-v="friends">${ico.rank}<b>랭킹 · 친구</b><small>친구 리그 ${rankMe()}위</small></button>
    <button class="entry" data-act="sub" data-v="shop">${ico.shop}<b>아이템 상점</b><small>${S.points.toLocaleString()}P 보유</small></button>
    <button class="entry" data-act="sub" data-v="stats">${ico.stats}<b>통계</b><small>이번 달 ${S.records.filter(r => r.date.startsWith(TODAY.slice(0,7))).length}회</small></button>
    <button class="entry" data-act="sub" data-v="settings" id="goSettings">${ico.set}<b>설정</b><small>소리 · 연출 다시보기</small></button></div>
  <div class="muted" style="text-align:center;margin-top:14px" id="lastBlock">— 운동기록 탭 끝 —</div></div>`;
}

/* ===== 운동기록 탭 — 하위 화면 ===== */
function vRecord() {
  const demos = [['none','실제 기록대로'],['next','다음 레벨까지 (짧은 연출)'],['boundary','10레벨 경계 넘기 (큰 연출)'],['multi','+5레벨 한꺼번에 (묶음)']];
  return `${subHead('오늘 운동 기록')}<div class="sec">
  <div class="card"><div class="muted" style="margin-bottom:6px">인증 수단</div><div class="chips">${VERIFY.map(([k, l]) => `<button class="chip ${S.verify===k?'on':''}" data-act="verify" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">📍 니짐 신림점 · 입장 기록이 있어 자동 인증돼요. 셀카는 원하면 추가(강제 아님)</div></div>
  <div class="card">${EXERCISES.map(e => `<div class="ex"><div><b>${e.name}</b><small>${e.xp} XP / ${e.unit}</small></div><div class="step"><button data-act="dec" data-id="${e.id}">−</button><span>${S.sets[e.id]}${e.unit}</span><button data-act="inc" data-id="${e.id}">+</button></div></div>`).join('')}
  <div class="est" style="margin-top:12px"><span>예상 경험치</span><em>+${cappedEst().toLocaleString()} XP</em></div>
  <div class="muted capline" id="capLine">오늘 ${dayXP().toLocaleString()}/${DAY_CAP.toLocaleString()} · 이번 주 ${weekXP().toLocaleString()}/${WEEK_CAP.toLocaleString()} XP${cappedEst() < estXP() ? ` · <b>상한 때문에 ${(estXP() - cappedEst()).toLocaleString()} XP는 안 들어가요</b>` : ''}</div>
  <label class="lightrow"><input type="checkbox" data-act="light" ${S.lightDay ? 'checked' : ''}><span><b>오늘은 가볍게 한 날</b><small>재활·컨디션 조절 날 체크 — 표정 판정에서 빼고, «평소» 계산에도 안 들어가요</small></span></label></div>
  <div class="card demo"><div class="h3">🧪 시연 도구 — 저장 시 얻는 경험치</div><div class="chips">${demos.map(([k, l]) => `<button class="chip ${S.demo===k?'on':''}" data-act="demo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">이번 저장 시 +${(S.demo === 'none' ? cappedEst() : demoXP()).toLocaleString()} XP · 현재 Lv.${S.level}${S.demo === 'none' ? '' : ' · 연출 시연은 상한 미적용'}</div></div>
  <div class="card demo"><div class="h3">🧪 시연 도구 — 저장 후 캐릭터 표정 (결정 21)</div><div class="chips">${[['auto','기록대로 판정'],['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${S.moodDemo===k?'on':''}" data-act="mdemo" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px" id="moodPreview">${moodPreviewText()}</div></div>
  <button class="btn" data-act="saveWorkout" id="saveBtn">운동 끝 · 기록 저장</button></div>`;
}
function moodPreviewText() {
  const r = calcIntensity();
  const pct = r.ratio == null ? '—' : Math.round(r.ratio * 100) + '%';
  const why = r.verdict === 'na' ? (S.lightDay ? '«가볍게» 체크 → 판정 없음' : '세트 기록 없음 → 판정 없음') : `평소 대비 ${pct} → ${MOOD[r.verdict].label}`;
  return `기록대로면: ${why} (60% 미만 아쉬운 · 130% 이상 신남) · 레벨·경험치·연속엔 영향 없음`;
}
/* 저장 결과 화면(C7 확장) — 표정 3종을 바로 눌러 비교 */
function vResult() {
  const m = S.mood, v = m ? m.verdict : 'na', t = S.type, lv = S.level, last = S.records[S.records.length - 1];
  const note = { low: '평소보다 가볍게 한 날이라 <b>오늘 하루만</b> 표정이 살짝 아쉬워요. 레벨·경험치·연속·주간 목표는 <b>그대로</b>예요.',
    normal: '평소만큼 했어요. 캐릭터는 평소 표정(쌩쌩) 그대로예요.',
    high: '평소보다 훨씬 많이 했어요! <b>오늘 하루</b> 캐릭터가 신나요. 내일은 회복도 챙겨요.',
    na: '오늘은 표정 판정을 하지 않았어요(기록 없음 · 가볍게 체크 · 기준 부족). 캐릭터는 평소 표정이에요.' }[v];
  const show = (m && v !== 'normal') ? m : null;
  return `${subHead('기록 저장 완료')}<div class="sec">
  <div class="card result ${v}" id="resultCard"><div class="cwrap big ${v}">${charHTML(t, lv, 170, true, exprOfMood(show))}</div>
    <div class="rname"><span class="name">${esc(CH[t].name)}</span><span class="pill lvpill">Lv.${lv}</span>${show ? moodPill(show) : '<span class="pill tier1">평소 표정</span>'}</div>
    <div class="say moodsay ${v}" id="resultSay">${esc(m ? m.line : coachLine())}</div>
    <div class="est"><span>오늘 얻은 경험치</span><em>+${(last ? last.xp : 0).toLocaleString()} XP</em></div>
    ${last && last.raw > last.xp ? `<div class="muted capline" id="resultCap">${weekXP() >= WEEK_CAP ? `이번 주 경험치 ${WEEK_CAP.toLocaleString()} 다 모았어요` : `오늘 경험치 ${DAY_CAP.toLocaleString()} 다 모았어요`} · ${(last.raw - last.xp).toLocaleString()} XP는 안 들어갔어요. 기록·연속·주간 목표는 그대로 쌓여요</div>` : ''}
    <div class="muted" style="margin-top:6px" id="resultNote">${note}</div>
    ${m && m.ratio != null && S.moodDemo === 'auto' ? `<div class="muted" style="margin-top:4px">평소 대비 ${Math.round(m.ratio * 100)}% (오늘 한 종목만 · 지난 10회 기준)</div>` : ''}</div>
  <div class="card demo"><div class="h3">🧪 시연 — 다른 결과로 보기</div><div class="chips">${[['low','아쉬운'],['normal','평소대로'],['high','신남']].map(([k, l]) => `<button class="chip ${v===k?'on':''}" data-act="mset" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="muted" style="margin-top:8px">표정은 캐릭터 얼굴(눈·입·볼) 자체가 바뀜 · 레벨·경험치와 무관</div></div>
  <button class="btn" data-act="back" id="resultOk">확인 · 운동기록 탭으로</button>
  <button class="btn ghost" data-tab="home" style="margin-top:8px">홈에서 카드 보기</button></div>`;
}
function rankList() {
  const me = { n:'나', t:S.type, lv:S.level, week:Math.min(WEEK_CAP, estXP()*3), rate:Math.min(100, Math.round(weekCount()/WEEK_GOAL*100)), paid:0, me:true };
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
  <div class="val">${S.fTab==='week'?`${f.rate}%<small>${f.week.toLocaleString()} XP</small>`:`Lv.${S.pureOnly?(f.pure??f.lv):f.lv}<small>${f.paid&&!S.pureOnly?`운동만 Lv.${f.pure}`:TIER_NAME[tierOf(f.lv)]}</small>`}</div></div>`).join('')}</div>
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
  <div class="card" id="exprCard"><div class="h2" style="font-size:16px">컨디션 표정 5종</div><div class="muted" style="margin-bottom:8px">얼굴만 바뀌어요 · 레벨·경험치와 무관 · 지금: <b style="color:var(--ink)">${EXPR[exprNow()].label}</b></div>
  <div class="exprs">${EXPR_KEYS.map(ex => `<div class="ex5 ${exprNow()===ex?'on':''}">${charHTML(t, S.level, 64, false, ex)}<small>${EXPR[ex].label}</small></div>`).join('')}</div></div>
  <div class="card"><div class="h2" style="font-size:16px">업적</div><div class="muted">업적 24개 잠김/달성 목록 자리 (프로토타입 범위 밖)</div></div></div>`;
}
function vSettings() {
  const evs = [...S.events].reverse();
  return `${subHead('설정')}<div class="sec">
  <div class="card"><div class="h2" style="font-size:16px">레벨업 연출</div>
  <div class="row"><span>연출 소리</span><button class="sw ${S.sound?'on':''}" data-act="sound" id="soundSw"></button></div>
  <div class="row"><span class="muted">건너뛰기: 연출 중 화면 아무 곳이나 탭</span></div></div>
  <div class="card" id="replayCard"><div class="h2" style="font-size:16px">레벨업 다시 보기</div>
  ${evs.length ? evs.map(e => `<div class="row"><div><b>Lv.${e.from} → ${e.to}</b> ${e.big?'<span class="pill tier4">진화</span>':''}<div class="muted">${e.at} · ${e.watched?(e.skipped?'건너뜀':'봤음'):'아직 못 봄'}${e.replays?` · 다시 본 횟수 ${e.replays}`:''}</div></div><button class="btn sm ghost" data-act="replay" data-id="${e.id}">다시 보기</button></div>`).join('') : '<div class="muted">아직 레벨업 기록이 없어요</div>'}</div>
  <div class="card"><div class="h2" style="font-size:16px">주간 목표</div><div class="row"><span>주 ${WEEK_GOAL}회</span><span class="muted">변경은 프로토타입 범위 밖</span></div></div>
  <div class="card demo"><div class="h3">🧪 시연 도구</div>
  <div class="row"><span>캐릭터</span><select data-act="type">${Object.keys(CH).map(k => `<option value="${k}" ${S.type===k?'selected':''}>${CH[k].name}</option>`).join('')}</select></div>
  <div class="row"><span>표정 강제 보기</span><select data-act="exprDemo">${[['auto','자동(기록대로)'],...EXPR_KEYS.map(k => [k, EXPR[k].label])].map(([k, l]) => `<option value="${k}" ${(S.exprDemo||'auto')===k?'selected':''}>${l}</option>`).join('')}</select></div>
  <div class="row"><span>레벨 바로 설정</span><select data-act="setlv">${Array.from({length:99},(_,i)=>i+1).map(l=>`<option ${l===S.level?'selected':''}>${l}</option>`).join('')}</select></div>
  <div class="row"><span>실루엣 플레이스홀더로 보기</span><button class="sw ${S.placeholder?'on':''}" data-act="ph"></button></div>
  <div class="row"><span>다음 연출 도중 앱 종료(새로고침) 흉내</span><button class="sw ${S.quitDemo?'on':''}" data-act="quit"></button></div>
  <div class="row"><span>처음 상태로 (캐릭터 선택부터)</span><button class="btn sm ghost" data-act="reset">초기화</button></div></div></div>`;
}
function vShop() {
  const list = ITEMS.filter(i => i.kind === S.sTab);
  return `${subHead('아이템 상점')}<div class="sec"><div style="display:flex;justify-content:flex-end;align-items:center;margin-bottom:8px"><b>${S.points.toLocaleString()}P</b></div>
  <div class="seg"><button class="${S.sTab==='effect'?'on':''}" data-act="stab" data-v="effect">효과형</button><button class="${S.sTab==='look'?'on':''}" data-act="stab" data-v="look">외형형</button></div>
  <div class="grid2">${list.map(i => { const own = S.owned[i.id], eq = S.equipped[i.id];
    return `<div class="item">${eq?'<span class="tag">장착중</span>':own?'<span class="tag">보유</span>':''}<img src="assets/item_${i.id}.png" alt=""><b>${i.name}</b><small>${i.desc}</small>
    ${own ? `<button class="btn ${eq?'ghost':''}" data-act="equip" data-id="${i.id}">${eq?'해제':'장착'}</button>` : `<button class="btn" data-act="buy" data-id="${i.id}">${i.price.toLocaleString()}P</button>`}</div>`; }).join('')}</div>
  <div class="muted" style="margin-top:10px">니짐 포인트로 구매 · 적립분 먼저 사용 · 가격은 예시값</div></div>`;
}
function vStats() {
  const all = [...S.records].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const mon = all.filter(r => r.date.startsWith(TODAY.slice(0, 7)));
  return `${subHead('통계')}<div class="sec">
  <div class="card"><div class="tiles" style="margin-top:0"><div class="tile"><small>이번 달</small><b>${mon.length}회</b></div><div class="tile"><small>이번 달 XP</small><b>${mon.reduce((a, r) => a + r.xp, 0).toLocaleString()}</b></div><div class="tile"><small>연속</small><b>${S.streakWeeks}주</b></div></div></div>
  <div class="ph">주/월 그래프 · 부위 밸런스 · PR 자리 (C11 — 프로토타입 범위 밖)</div>
  <div class="card"><div class="h2" style="font-size:16px">전체 기록</div>${all.map(r => `<div class="rec"><div><b>${esc(r.summary)}</b><small>${r.date} · ${esc(r.place)}</small></div><span class="xp">+${r.xp} XP</span></div>`).join('')}</div></div>`;
}

const MAIN = { home:vHome, nearby:vNearby, membership:vMembership, workout:vWorkout, all:vAll };
const SUB = { record:vRecord, result:vResult, friends:vFriends, me:vMe, shop:vShop, stats:vStats, settings:vSettings };
function render() {
  const v = (S.tab === 'workout' && S.sub && S.chosen) ? SUB[S.sub] : (MAIN[S.tab] || vHome);
  $('view').innerHTML = v();
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
}
function go(tab, sub = null) { S.tab = tab; S.sub = tab === 'workout' ? sub : null; save(); render(); window.scrollTo(0, 0); }
const backToTab = () => go('workout');   // 연출 종료 후 복귀 위치 = 운동기록 탭 메인 (결정 20)

/* ===== 운동 저장 → 레벨업 ===== */
function saveWorkout() {
  const raw = demoXP(), from = S.level, isDemo = S.demo !== 'none';
  const gained = !isDemo ? capXP(raw, dayXP(), weekXP()) : raw;   // 연출 시연(다음 레벨·경계·묶음)은 상한 밖
  let xp = S.xp + gained, lv = S.level, pts = 0;
  while (lv < 99 && xp >= need(lv)) { xp -= need(lv); lv++; pts += lvPoint(lv) + evoBonus(lv); }
  if (lv >= 99) xp = 0;
  S.level = lv; S.xp = xp;
  const grant = Math.max(0, Math.min(pts, MONTH_CAP - S.month));
  S.month += grant; S.points += grant;
  S.demo = 'none';
  const summary = EXERCISES.filter(e => S.sets[e.id] > 0).map(e => `${e.name} ${S.sets[e.id]}${e.unit}`).join(' · ') || '기록 없음';
  S.records.push({ id: Date.now(), date: TODAY, place: S.verify === 'gps' ? '집' : S.verify === 'lesson' ? '니짐 신림점 · PT' : '니짐 신림점', summary, xp: gained, raw, v: S.verify, demo: isDemo });
  S.mood = judgeMood();   // 결정 21: 표정만 바뀜 — 위 레벨·경험치·포인트 계산에 전혀 관여하지 않음
  const toResult = () => go('workout', 'result');
  if (lv > from) {
    let big = false; for (let l = from + 1; l <= lv; l++) if (isBigBoundary(l)) big = true;
    const d = new Date(), at = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const ev = { id: Date.now(), from, to: lv, big, type: S.type, points: grant, pointsCut: pts - grant, at, watched: false, skipped: false, replays: 0 };
    S.events.push(ev); S.pending = ev.id; save();   // 연출 전에 먼저 기록 → 끊겨도 다음 진입 때 재생
    play(ev, { onDone: () => { toResult(); toast(`+${gained.toLocaleString()} XP 저장 완료`); } });
  } else { save(); toResult(); toast(`+${gained.toLocaleString()} XP 저장 완료 · Lv.${lv+1}까지 ${(need(lv)-xp).toLocaleString()} XP`); }
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
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tab],[data-act]'); if (!b || b.closest('#evo')) return;
  if (b.dataset.tab) return go(b.dataset.tab);
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  const ex = EXERCISES.find(x => x.id === id);
  if (a === 'sub') return go('workout', v);
  if (a === 'back') return go('workout');
  if (a === 'inc') { S.sets[id] += ex.step || 1; }
  else if (a === 'dec') { S.sets[id] = Math.max(0, S.sets[id] - (ex.step || 1)); }
  else if (a === 'demo') S.demo = v;
  else if (a === 'mdemo') S.moodDemo = v;
  else if (a === 'mset') { const mm = MOOD[v]; S.mood = { verdict: v, ratio: null, date: TODAY, line: mm.lines[0] }; }
  else if (a === 'light') return;   // change 이벤트에서 처리
  else if (a === 'verify') S.verify = v;
  else if (a === 'wseg') S.wseg = v;
  else if (a === 'pick') S.pick = v;
  else if (a === 'choose') { S.type = S.pick || S.type; S.chosen = true; S.pick = null; S.sub = null; toast(`${CH[S.type].name}${CH[S.type].josa === '가' ? '와' : '과'} 운동 시작!`); }
  else if (a === 'rechoose') { if (S.level >= 10) return toast('Lv.10 이후엔 변경권 아이템이 필요해요 (시연: 설정 › 시연 도구에서 바꾸기)'); S.chosen = false; S.sub = null; }
  else if (a === 'saveWorkout') return saveWorkout();
  else if (a === 'coach') return toast('코칭 대화(C9)는 프로토타입 범위 밖 · 월 20회');
  else if (a === 'invite') return toast('친구 초대(C15b)는 프로토타입 범위 밖');
  else if (a === 'ftab') S.fTab = v;
  else if (a === 'pure') S.pureOnly = !S.pureOnly;
  else if (a === 'stab') S.sTab = v;
  else if (a === 'buy') { const it = ITEMS.find(i => i.id === id); if (S.points < it.price) return toast('포인트가 부족해요'); S.points -= it.price; S.owned[id] = 1; toast(`${it.name} 구매 완료 · -${it.price}P`); }
  else if (a === 'equip') { S.equipped[id] = !S.equipped[id]; }
  else if (a === 'sound') S.sound = !S.sound;
  else if (a === 'ph') S.placeholder = !S.placeholder;
  else if (a === 'quit') S.quitDemo = !S.quitDemo;
  else if (a === 'reset') { S = fresh(); S.tab = 'workout'; }
  else if (a === 'replay') { const ev = S.events.find(x => x.id === +id); if (ev) play(ev, { replay: true }); return; }
  else if (a === 'playPending') return playPending();
  save(); render();
});
document.addEventListener('change', e => {
  const a = e.target.dataset.act; if (!a) return;
  if (a === 'type') S.type = e.target.value;
  if (a === 'exprDemo') S.exprDemo = e.target.value;
  if (a === 'setlv') { S.level = +e.target.value; S.xp = 0; }
  if (a === 'light') S.lightDay = e.target.checked;
  save(); render();
});
function playPending() { const ev = S.events.find(x => x.id === S.pending); if (!ev) { S.pending = null; save(); return render(); } play(ev, { onDone: backToTab }); }

render();
if (S.pending) setTimeout(() => { toast('지난번에 못 본 레벨업 연출을 재생해요'); playPending(); }, 700);
