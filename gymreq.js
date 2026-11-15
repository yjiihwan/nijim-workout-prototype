'use strict';
/* v1.55: 멤버십(없음·1장·여러 장·결제했지만 미발급)에 따라 장소 질문을 건너뛰거나 안내를 바꾼다(«v1.55 멤버십» 묶음)
   v1.54: 입점 안내·요청을 «내 헬스장 1곳»에서 떼어 «그날 고른 장소·기록 있는 헬스장마다(3곳)»로 · 내 헬스장 자동 판정 · 직접 적기(아래 «상태» 머리말)
   v1.51 (형 11-15 확정) — ① «우리 헬스장 입점 요청» 장치 ② 센터 기구 기반 코칭 ③ 관리자 시연 스위치
   app.js 보다 먼저 읽는다(함수·자료만 정의 — S·esc·toast 같은 app.js 것은 부를 때만 쓴다).
   경험치 계산(engine.js)은 건드리지 않는다. 여기는 «누구에게 무엇을 보여 줄지»만 정한다.
   실서비스 자리: GYM_DIR = 헬스장 검색(공공 인허가 자료·지도 검색) · 요청 수 = 서버 집계 · 센터 기구 = center_machines.js(기구 목록 + 센터별 보유 기구 id·수량) */

/* ===== 자료 ===== */
/* 헬스장 찾기 목록(가짜 — 실서비스는 지도 검색 결과). linked = 니짐 입점 · wait = 나 말고 입점을 요청한 사람 수(운동 1회 이상 기록한 계정만) */
const GYM_DIR = [
  { id: 'sillim', name: '니짐 신림점', area: '신림동', linked: true },
  { id: 'bongcheon', name: '니짐 봉천점', area: '봉천동', linked: true },
  { id: 'snu', name: '니짐 서울대입구점', area: '봉천동', linked: true },
  { id: 'green', name: '그린피트니스 신림역점', area: '신림동', wait: 2 },
  { id: 'river', name: '리버짐 봉천점', area: '봉천동', wait: 4 },
  { id: 'yoga', name: '소담 요가·필라테스', area: '신림동', wait: 0 },
  { id: 'long', name: '바디플랜 휘트니스 앤 필라테스 관악 신림사거리 본점', area: '신림동', wait: 7 },
  { id: 'tt', name: '튼튼헬스 서원점', area: '서원동', wait: 1 },
  { id: 'move', name: '24시 무브짐 난곡점', area: '난곡동', wait: 0 },
  { id: 'dan', name: '더단단 PT 스튜디오 낙성대점', area: '낙성대동', wait: 3 },
  { id: 'han', name: '한강스포츠센터', area: '대방동', wait: 11 },
];
const GYM_STEPS = [['요청', '접수'], ['5명', '모임'], ['사장님께', '전달'], ['답', '기다리는 중'], ['입점', '']];
const GYM_NEED = 5;            // 이 인원이 모이면(그리고 아래 최근 기록자 조건까지 맞으면) 사장님께 안내문 우편이 자동으로 나감
/* v1.56 사장님 자동 연락(형 11-15 결정 ⑤ · 설계 OWNER_AUTO_CONTACT.md 3장): 사람이 «전달함»을 누르지 않는다.
   칸 2 = 요청 5명 이상 + 그중 최근 2주에 그 헬스장에서 기록한 사람 3명 이상 · 칸 3 = 그 주 묶음 우편 접수됨 · 칸 4 = 접수 다음 날부터 영업일 6일 지남 · 칸 5 = 입점 절차 완료
   시험판은 관리자 시연 H8에서 «우편 접수됨 / 도착 예정일 지남»을 흉내 낸다. 실제 우편·문자·알림톡 발송은 어디에도 연결돼 있지 않다 */
const GYM_NEED_RECENT = 3;
const GYM_RECENT_DAYS = 14;
const GYM_MAIL_BIZ = 6;
const GYM_REQ_MAX = 3;         // 입점 요청은 한 번에 3곳까지(장난 요청 막기)
const GYM_AUTO_DAYS = 30, GYM_AUTO_MIN = 2;   // 내 헬스장 자동 판정 = 최근 30일 · 2번 이상 기록한 곳 중 최다
const GYM_QUIET_DAYS = 7, GYM_QUIET_RECS = 3;   // 가입 후 첫 7일·첫 3회 기록까지는 «입점 헬스장이었다면 +○○» 비교를 안 띄움
const GYM_ITEM = '개척자 배지';
const GYM_ITEM_IMG = 'pioneer_badge';   // assets/item_pioneer_badge.png — 별이 뭉개지지 않게 24px 이상으로만 씀
const gymItemImg = cls => `<img class="gyico ${cls || ''}" src="assets/item_${GYM_ITEM_IMG}.png" srcset="assets/item_${GYM_ITEM_IMG}.png 1x, assets/item_${GYM_ITEM_IMG}@2x.png 2x" alt="">`;   // 입점 성사 때 요청자 전원에게 주는 한정 꾸미기(경험치 보상 없음 — 형 확정)
const DAY_MS = 864e5;

/* 센터 기구 — 정해진 목록에서 고르는 방식(자유 입력·사진만으로는 코치가 못 읽는다). [id, 이름, 묶음] */
const EQUIP = [
  ['treadmill', '트레드밀', '유산소'], ['bike_up', '업라이트 사이클', '유산소'], ['bike_rec', '리컴번트 사이클', '유산소'], ['spin', '스핀 바이크', '유산소'], ['elliptical', '일립티컬', '유산소'],
  ['rower', '로잉머신', '유산소'], ['stepmill', '스텝밀(천국의 계단)', '유산소'], ['assault', '어썰트바이크', '유산소'], ['skierg', '스키에르그', '유산소'],
  ['m_chest_press', '체스트프레스 머신', '머신'], ['m_incline_cp', '인클라인 체스트프레스 머신', '머신'], ['m_pec_deck', '펙덱·리버스 플라이 머신', '머신'], ['m_shoulder', '숄더프레스 머신', '머신'], ['m_lateral', '사이드 레터럴 머신', '머신'],
  ['m_lat_pulldown', '랫풀다운 머신', '머신'], ['m_seated_row', '시티드로우 머신', '머신'], ['m_tbar', 'T바 로우', '머신'], ['m_plate_row', '플레이트 로드 로우 머신', '머신'], ['m_pullover', '풀오버 머신', '머신'],
  ['m_assist', '어시스트 풀업·딥스 머신', '머신'], ['m_back_ext', '백익스텐션(로만체어)', '머신'], ['m_leg_press', '레그프레스 머신', '머신'], ['m_leg_ext', '레그익스텐션 머신', '머신'], ['m_leg_curl', '레그컬 머신', '머신'],
  ['m_hip_abd', '힙 어브덕션 머신', '머신'], ['m_hip_add', '힙 어덕션 머신', '머신'], ['m_hack', '핵스쿼트 머신', '머신'], ['m_vsquat', '브이스쿼트·펜듈럼 스쿼트 머신', '머신'], ['m_glute', '글루트 킥백 머신', '머신'],
  ['m_calf', '카프레이즈 머신(서서)', '머신'], ['m_seated_calf', '시티드 카프레이즈 머신', '머신'], ['m_bicep', '이두 컬 머신', '머신'], ['m_tricep', '삼두 머신', '머신'], ['m_crunch', '크런치 머신', '머신'], ['m_torso', '복부 회전 머신', '머신'],
  ['smith', '스미스 머신', '머신'], ['cable', '케이블 머신', '머신'],
  ['barbell', '바벨·원판', '프리웨이트'], ['rack', '스쿼트 랙(파워 랙)', '프리웨이트'], ['bench_press', '벤치프레스대', '프리웨이트'], ['bench', '벤치(평·조절식)', '프리웨이트'], ['dumbbell', '덤벨', '프리웨이트'],
  ['kettlebell', '케틀벨', '프리웨이트'], ['ezbar', 'EZ바', '프리웨이트'], ['pullup_bar', '철봉(풀업 바)', '프리웨이트'], ['dip_bar', '딥스 바', '프리웨이트'],
];
const EQ_NAME = Object.fromEntries(EQUIP.map(e => [e[0], e[1]]));
/* 운동 사전(레슨 뺀 87종) ↔ 필요한 기구. 배열 = 모두 있어야 함 · 'a|b' = 둘 중 하나 · [] = 기구 없이 가능 · 'out' = 센터 밖 운동 */
const EX_EQUIP = {
  treadmill: ['treadmill'], bike_up: ['bike_up'], bike_rec: ['bike_rec'], spin: ['spin'], elliptical: ['elliptical'], rower: ['rower'], stepmill: ['stepmill'], assault: ['assault'], skierg: ['skierg'],
  chest_press: ['m_chest_press'], pec_deck: ['m_pec_deck'], m_shoulder: ['m_shoulder'], lat_pulldown: ['m_lat_pulldown'], seated_row: ['m_seated_row'], leg_press: ['m_leg_press'], leg_ext: ['m_leg_ext'], leg_curl: ['m_leg_curl'],
  hip_abd: ['m_hip_abd'], hip_add: ['m_hip_add'], hack_squat: ['m_hack'], calf_raise: ['m_calf|smith'], assist_pullup: ['m_assist'], back_ext: ['m_back_ext'], crunch_m: ['m_crunch'], incline_cp: ['m_incline_cp'],
  smith_bench: ['smith', 'bench'], rev_pec: ['m_pec_deck'], lateral_m: ['m_lateral'], cable_lateral: ['cable'], tbar_row: ['m_tbar'], plate_row: ['m_plate_row'], pullover_m: ['m_pullover'], vsquat: ['m_vsquat'], glute_kb: ['m_glute|cable'],
  seated_calf: ['m_seated_calf'], bicep_m: ['m_bicep'], cable_curl: ['cable'], tricep_m: ['m_tricep'], torso_rot: ['m_torso'], smith_squat: ['smith'], cable_cross: ['cable'], tricep_pd: ['cable'], face_pull: ['cable'],
  bench: ['barbell', 'bench_press'], squat: ['barbell', 'rack'], deadlift: ['barbell'], ohp: ['barbell'], barbell_row: ['barbell'], hip_thrust: ['barbell', 'bench'], db_press: ['dumbbell', 'bench'], incline_db: ['dumbbell', 'bench'],
  db_row: ['dumbbell'], db_shoulder: ['dumbbell'], db_lunge: ['dumbbell'], db_curl: ['dumbbell'], lateral: ['dumbbell'], kb_swing: ['kettlebell'], rdl: ['barbell'], incline_bench: ['barbell', 'bench', 'rack'], db_fly: ['dumbbell', 'bench'],
  barbell_curl: ['barbell|ezbar'], hammer_curl: ['dumbbell'], skull: ['ezbar|barbell', 'bench'], oh_ext: ['dumbbell'], front_raise: ['dumbbell'], rear_raise: ['dumbbell'], shrug: ['dumbbell|barbell'], goblet: ['dumbbell|kettlebell'], bulgarian: ['dumbbell', 'bench'],
  pushup: [], pullup: ['pullup_bar'], dips: ['dip_bar|m_assist'], plank: [], air_squat: [], lunge: [], burpee: [], crunch: [], leg_raise: [], jump_rope: [], band: [], stretch: [], glute_bridge: [], russian_twist: [], mountain: [],
  walk: 'out', run: 'out', cycle: 'out',
};
/* v1.52: 센터가 가진 기구는 center_machines.js(엔짐 «기구 찾기»와 같은 모양 — 기구 목록 MACHINES + 센터별 machine_ids·machine_counts)에서 읽는다.
   위 EQUIP 46종은 이제 «센터가 고르는 목록»이 아니라, 코치가 기구를 운동과 잇는 데 쓰는 안쪽 갈래 이름이다. */
const EQ_WAIT_BASE = { '니짐 봉천점': 3 };   // 나 말고 기구 정보를 요청한 사람 수(가짜)

/* ===== 상태 ===== */
/* v1.54: «내 헬스장 1곳»에 묶여 있던 것을 푼다.
   · 결과 화면 입점 안내 = 그날 고른 장소 기준 · 입점 요청 = 기록이 있는 입점 전 헬스장마다(한 번에 3곳) · 내 헬스장 = 최근 기록으로 자동 판정 · 장소 찾기 = 지도 검색 + 직접 적기
   S.gym = 내 헬스장(처음엔 설문 답, 그 뒤엔 자동) · S.gymReqs = { 헬스장 id: { at } } · S.gymCustom = 직접 적은 헬스장 [{ id, name, area }] */
function ensureGym() {
  const ok = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const fill = (o, d) => { Object.keys(d).forEach(k => { if (o[k] === undefined) o[k] = d[k]; }); return o; };   // 같은 묶음을 그대로 채운다(새로 만들면 먼저 잡아 둔 참조가 옛것이 된다)
  S.gym = fill(ok(S.gym) ? S.gym : {}, { kind: null, id: null, name: '', area: '', by: 'survey', setAt: null, pickAt: undefined, moved: null, step: 'ask', q: '', manual: false, pm: false, flow: null, item: false, itemOn: false });
  S.gymSim = fill(ok(S.gymSim) ? S.gymSim : {}, { wait: {}, stage: {}, equip: {}, eqWait: {}, mail: {}, owner: {}, recent: {} });
  ['wait', 'stage', 'equip', 'eqWait', 'mail', 'owner', 'recent'].forEach(k => { if (!ok(S.gymSim[k])) S.gymSim[k] = {}; });
  Object.keys(S.gymSim.stage).forEach(id => { const s = S.gymSim.stage[id]; if (s === 'join') return;   // 앞 판(손으로 누르던 «전달함·답 기다리는 중·거절됨») 저장본 옮기기
    if (s === 'sent' && !S.gymSim.mail[id]) S.gymSim.mail[id] = { at: Date.now() };
    if (s === 'wait' || s === 'reject') S.gymSim.mail[id] = { at: Date.now() - 12 * DAY_MS };
    if (s === 'reject') S.gymSim.owner[id] = 'reject';
    delete S.gymSim.stage[id]; });
  if (!ok(S.eqReq)) S.eqReq = {};
  if (!Array.isArray(S.gymNotes)) S.gymNotes = [];
  S.gymCustom = (Array.isArray(S.gymCustom) ? S.gymCustom : []).filter(c => ok(c) && c.id && typeof c.name === 'string' && c.name);
  if (!ok(S.gymReqs)) S.gymReqs = {};
  if (typeof S.joinAt !== 'number') S.joinAt = Date.now() - 30 * DAY_MS;   // 이 판 전부터 쓰던 저장본 = 가입한 지 오래된 계정으로 본다
  if (typeof S.entryCenter !== 'string' || !GYM_DIR.some(g => g.name === S.entryCenter)) S.entryCenter = '니짐 신림점';
  const g = S.gym;
  if (_msUrl) { const m = _msUrl; _msUrl = null; msSet(m); }
  if (!MS_DEMO[S.msDemo]) S.msDemo = 'none';
  if (msPend()) S.entryDemo = false;   // 멤버십이 아직 없으면 입장 기록도 있을 수 없다
  if (g.kind !== 'gym' && g.kind !== 'home') g.kind = null;
  if (g.kind === 'gym' && (!g.id || typeof g.name !== 'string' || !g.name)) g.kind = null;
  /* 앞 판(v1.51~1.53) 저장본 옮기기: 직접 적은 내 헬스장 → 직접 적은 목록 · 내 헬스장 요청 1건 → 요청 목록 */
  if (g.custom && g.kind === 'gym' && !S.gymCustom.some(c => c.id === g.id)) S.gymCustom.push({ id: g.id, name: g.name, area: g.area || '' });
  if (g.req && g.kind === 'gym') S.gymReqs[g.id] = { at: +g.req.at || Date.now() };
  ['custom', 'req', 'prevId', 'changedAt'].forEach(k => { delete g[k]; });
  if (g.pickAt === undefined) g.pickAt = g.by !== 'auto' && g.setAt ? g.setAt : null;   // 설문·직접 고른 시각(자동 판정은 이 뒤 기록만 센다)
  Object.keys(S.gymReqs).forEach(id => { if (!ok(S.gymReqs[id]) || !gymById(id)) delete S.gymReqs[id]; });
  if (!g.kind && mships().length) { const x = GYM_DIR.find(q => q.name === mships()[0]);   // 멤버십 보유자는 설문 없이 멤버십 센터가 처음 값
    if (x) Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area, by: 'mship', setAt: Date.now(), pickAt: null, moved: null }); }
  return g;
}
const gjo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? (c % 28 ? a : b) : (/[013678]$/.test(String(w)) ? a : /[2459]$/.test(String(w)) ? b : a); };   // 받침 있으면 a · 숫자는 읽는 소리대로
const gnorm = s => String(s || '').replace(/\s/g, '').toLowerCase();
const gymDirAll = () => [...GYM_DIR, ...(S.gymCustom || []).map(c => ({ ...c, wait: 0, custom: true }))];
const gymById = id => gymDirAll().find(x => x.id === id) || null;
const gymByName = name => { const n = gnorm(name); return n ? gymDirAll().find(x => gnorm(x.name) === n) || null : null; };
const gymJoined = g => !!g && (!!g.linked || S.gymSim.stage[g.id] === 'join');
const myGym = () => { const g = ensureGym(); return g.kind === 'gym' ? (gymById(g.id) || { id: g.id, name: g.name, area: g.area, wait: 0 }) : null; };
const gymUser = () => ensureGym().kind;           // 'gym' · 'home'(집·야외 — 입점 이야기를 먼저 꺼내지 않는다) · null(아직 안 고름)
const gymQuiet = () => gymUser() === 'home';
const isGymRec = r => { const p = placeBase(r.place || ''); return !!p && p !== '집' && p !== '야외' && r.placeKind !== 'home' && r.placeKind !== 'out'; };
const recAt = r => (r.id > 1e12 ? r.id : Date.parse(`${r.date}T12:00:00`));
const gymRecN = g => (g ? realRecs().filter(r => isGymRec(r) && gnorm(placeBase(r.place)) === gnorm(g.name)).length : 0);   // 그 헬스장에서 남긴 운동 기록 수
const gymOthers = g => Math.max(0, S.gymSim.wait[g.id] ?? g.wait ?? 0);
const gymReqd = g => !!(g && S.gymReqs[g.id]);
const gymWait = g => gymOthers(g) + (gymReqd(g) ? 1 : 0);
const gymReqList = () => Object.keys(S.gymReqs).map(gymById).filter(g => g && !gymJoined(g)).sort((a, b) => S.gymReqs[a.id].at - S.gymReqs[b.id].at);   // 지금 살아 있는 요청(입점한 곳은 자리에서 빠진다)
/* 요청할 수 있나: ok · joined(이미 입점) · did(이미 요청) · norec(여기서 운동한 기록 없음) · full(3곳이 참) */
const gymCanReq = g => (!g ? 'none' : gymJoined(g) ? 'joined' : gymReqd(g) ? 'did' : !gymRecN(g) ? 'norec' : gymReqList().length >= GYM_REQ_MAX ? 'full' : 'ok');
/* 최근 2주 기록자 = 요청자 가운데 «그 헬스장에서» 최근 2주에 기록한 사람(다른 헬스장 기록은 안 센다). 다른 사람 몫은 시험판 가짜 값 */
const gymMeRecent = g => realRecs().some(r => isGymRec(r) && gnorm(placeBase(r.place)) === gnorm(g.name) && Date.now() - recAt(r) < GYM_RECENT_DAYS * DAY_MS);
const gymRecentOthers = g => Math.min(gymOthers(g), Math.max(0, S.gymSim.recent[g.id] ?? Math.round(gymOthers(g) * 0.7)));
const gymRecent = g => gymRecentOthers(g) + (gymReqd(g) && gymMeRecent(g) ? 1 : 0);
const gymReady = g => gymWait(g) >= GYM_NEED && gymRecent(g) >= GYM_NEED_RECENT;
function gymBizDays(at) {   // 접수 다음 날부터 어제까지 지난 영업일(토·일 제외 · 공휴일은 시험판에서 안 뺀다)
  const d = new Date(at), t = new Date(); d.setHours(0, 0, 0, 0); t.setHours(0, 0, 0, 0); let n = 0;
  for (d.setDate(d.getDate() + 1); d < t; d.setDate(d.getDate() + 1)) { const w = d.getDay(); if (w && w !== 6) n++; }
  return n;
}
const gymMailDue = g => { const m = S.gymSim.mail[g.id]; return !!m && gymBizDays(m.at) >= GYM_MAIL_BIZ; };
/* 진행 5칸(자동): 1 요청 접수 → 2 5명 모임 → 3 사장님께 전달(우편 접수) → 4 답 기다리는 중(도착 예정일 지남) → 5 입점.
   사장님 쪽 내부 기록(열람·거절·우편 그만 받기)은 회원 화면에 안 보인다. 거절·그만 받기여도 4에서 멈춘다 */
function gymStage(g) {
  if (gymJoined(g)) return 5; if (!gymReqd(g)) return 0;
  const mail = S.gymSim.mail[g.id], ow = S.gymSim.owner[g.id], no = ow === 'reject' || ow === 'optout';
  if (mail) return no || gymMailDue(g) ? 4 : 3;
  if (no && gymReady(g)) return 4;
  return gymReady(g) ? 2 : 1;
}
const gymStepName = g => ['', '요청 접수', `${GYM_NEED}명 모임`, '사장님께 전달', '답 기다리는 중', '입점'][gymStage(g)];
const gymFirstWeek = () => { ensureGym(); return Date.now() - S.joinAt < GYM_QUIET_DAYS * DAY_MS || realRecs().length <= GYM_QUIET_RECS; };

/* ===== v1.55 멤버십(형 11-15 시정) =====
   한 사람이 여러 센터 멤버십을 가질 수 있다. 처음 설문·운동 시작 때 장소 질문은 «멤버십이 없는 사람»에게만 묻는다.
   · 멤버십 보유(own) = 입점센터를 이용하는 걸 이미 안다 → 설문 2/3 건너뜀 · 운동 시작 때 그 센터로 자동(여러 장이면 오늘 입장한 센터 → 없으면 내 멤버십 센터만 먼저)
   · 결제했지만 미발급(pend) = 그 센터로 기록은 되지만 보너스는 멤버십 확인 뒤부터(형 확정 11-15: 소급 없음)
   실서비스 자리: 회원의 유효 멤버십 목록·결제 내역(멤버십 발급 전) API. 시험판은 관리자 시연 H8 또는 주소 ?ms=none|one|multi|pend 로 바꿔 본다 */
const MS_DEMO = { none: { own: [], pend: null }, one: { own: ['니짐 신림점'], pend: null }, multi: { own: ['니짐 신림점', '니짐 봉천점'], pend: null }, pend: { own: [], pend: '니짐 서울대입구점' } };
let _msUrl = (location.search.match(/[?&]ms=(none|one|multi|pend)\b/) || [])[1] || null;
const msMode = () => (MS_DEMO[S.msDemo] ? S.msDemo : 'none');
const mships = () => MS_DEMO[msMode()].own;
const msPend = () => MS_DEMO[msMode()].pend;
const isMs = name => mships().includes(placeBase(String(name || '')));
const isPend = name => !!msPend() && placeBase(String(name || '')) === msPend();
function msSet(mode) {   // 시연 전환 — 입장 기록이 멤버십과 어긋나지 않게 같이 맞춘다
  S.msDemo = MS_DEMO[mode] ? mode : 'none'; const ms = mships();
  if (ms.length && S.entryDemo && !ms.includes(S.entryCenter)) S.entryCenter = ms[0];
  if (msPend()) S.entryDemo = false;   // 멤버십이 아직 없으니 입장 기록도 없다
  S.placeAll = false;
}
/* 운동 중 화면 머리 줄 — 미발급 센터 / 멤버십 센터인데 아직 입장 전 */
function msSessLine(s) {
  if (!s || s.verify !== 'V0' || !s.place || s.place.kind !== 'center') return '';
  if (isPend(s.place.name)) return `<div class="cbline" id="cbLine" data-ms="pend"><span>멤버십이 확인되면 그때부터 경험치를 1.5배로 받아요</span></div>`;
  if (isMs(s.place.name)) return `<div class="cbline" id="cbLine" data-ms="noentry"><span>아직 입장 전이에요 · 입장하면 경험치 1.5배</span><button class="linkbtn" data-act="msEnter" id="msEnter">입장하기</button></div>`;
  return '';
}
/* 자동으로 고른 장소를 바꾸는 길(아직 아무것도 안 적었을 때만) */
const msChangeLink = s => (s && s.auto && !s.items.length ? `<button class="linkbtn mschg" data-act="msChange" id="msChange">다른 곳에서 운동해요 ›</button>` : '');
/* 장소 화면 — 멤버십이 여러 장이고 오늘 입장 기록이 없을 때: 내 멤버십 센터만 먼저, 한 번 눌러 고른다 */
function msPlaceTop() {
  ensureGym(); const ms = mships(); if (ms.length < 2 || S.placeAll) return '';
  return `${subHead('어디서 운동해요?')}<div class="sec" id="msPlace">
  <div class="muted" style="margin-bottom:10px">오늘은 어느 센터에서 운동하세요?</div>
  <div class="card"><div class="h3" style="margin-top:0">내 멤버십 센터</div><div id="msList">${ms.map(n => `<button class="prow tap plc" data-act="msPick" data-v="${esc(n)}"><div><b>${esc(n)}</b><small><span class="cbtag">1.5배</span>입장하면 경험치 1.5배</small></div><span class="muted">선택</span></button>`).join('')}</div></div>
  <button class="btn ghost" data-act="msOther" id="msOther" style="margin-top:10px">다른 곳에서 운동해요</button></div>`;
}
/* 장소 목록 줄 — 결제했지만 멤버십이 아직 안 나온 센터: 한 번 눌러 그 센터로 기록(입장하기·입점 요청 없음) */
function msPlaceRow(p) {
  if (!isPend(p.name)) return '';
  return `<button class="prow tap plc" data-act="msPick" data-v="${esc(p.name)}" id="msPendRow"><div><b>${esc(p.name)}</b><small><span class="cbtag wait">멤버십 확인 중</span>${esc(p.dist)} · 결제한 센터</small></div><span class="muted">선택</span></button>`;
}
/* 운동기록 탭 카드 맨 위 — 내 멤버십 센터(여러 곳) · 결제한 센터 */
function msBlock() {
  const ms = mships(), pd = msPend();
  if (pd) return `<div class="msbox" id="msBox" data-ms="pend"><small>결제한 센터</small><div class="msrow"><b>${esc(pd)}</b><span class="cbtag wait">멤버십 확인 중</span></div><div class="muted">멤버십이 확인되면 그때부터 여기서 운동할 때 경험치를 1.5배로 받아요</div></div>`;
  if (!ms.length) return '';
  return `<div class="msbox" id="msBox" data-ms="${ms.length}"><small>내 멤버십 센터${ms.length > 1 ? ` ${ms.length}곳` : ''}</small>${ms.map(n => `<div class="msrow"><b>${esc(n)}</b><span class="cbtag">1.5배</span></div>`).join('')}<div class="muted">'입장하기'를 누르고 운동하면 경험치를 1.5배로 받아요</div></div>`;
}
/* 처음 설정 마지막 단계 — 장소 질문을 건너뛴 까닭을 한 줄로 */
function msOnbNote() {
  const ms = mships(); if (S.onboarded || !ms.length) return '';
  return `<div class="card msonb" id="msOnbNote"><b>${esc(ms[0])}${ms.length > 1 ? ` 외 ${ms.length - 1}곳` : ''} 멤버십이 있네요</b><small>운동을 시작하면 멤버십 센터로 바로 기록돼요. 집·야외나 다른 헬스장에서 하는 날은 그때 바꾸면 돼요.</small></div>`;
}

/* ===== 내 헬스장 자동 판정 =====
   최근 30일 헬스장 기록(집·야외 빼고, 입점·입점 전 모두) 가운데 2번 이상 기록한 곳 중 횟수가 가장 많은 곳. 횟수가 같으면 가장 최근에 기록한 곳.
   설문에서 고르거나 직접 바꾼 뒤 30일 동안은 «그 뒤에 쌓인 기록»만 센다(방금 고른 값이 옛 기록에 덮이지 않게 — 30일이 지나면 저절로 «최근 30일 전체»가 된다). 조건에 맞는 곳이 없으면 지금 값 그대로. */
function gymAutoPick() {
  const g = ensureGym(), from = Math.max(Date.now() - GYM_AUTO_DAYS * DAY_MS, g.pickAt || 0), by = {};
  realRecs().forEach(r => { const t = recAt(r); if (!isGymRec(r) || !(t >= from)) return;
    const nm = placeBase(r.place), o = by[gnorm(nm)] || (by[gnorm(nm)] = { name: nm, n: 0, last: 0 }); o.n++; o.last = Math.max(o.last, t); });
  return Object.values(by).filter(o => o.n >= GYM_AUTO_MIN).sort((a, b) => b.n - a.n || b.last - a.last)[0] || null;
}
function gymAuto() {   // 운동 기록을 저장할 때마다 부른다 → 바뀌었으면 true
  const g = ensureGym(), top = gymAutoPick(); if (!top) return false;
  const x = gymByName(top.name) || gymCustomAdd(top.name, ''); if (!x || (g.kind === 'gym' && g.id === x.id)) return false;
  Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area || '', by: 'auto', setAt: Date.now(), moved: { from: g.kind === 'gym' ? g.name : null, at: Date.now() } });
  return true;
}
/* 직접 적은 헬스장 — 같은 이름(띄어쓰기·대소문자 무시)이 목록에 있으면 그것을 쓴다. 이름이 너무 짧으면 null */
function gymCustomAdd(nmRaw, arRaw) {
  ensureGym();
  const nm = String(nmRaw || '').trim().replace(/\s+/g, ' ').replace(/\s*·\s*/g, '·').slice(0, 30).trim(), ar = String(arRaw || '').trim().replace(/\s+/g, ' ').slice(0, 12);
  if (nm.length < 2 || nm === '집' || nm === '야외') return null;
  const hit = gymByName(nm); if (hit) return hit;
  const x = { id: 'my_' + Date.now().toString(36) + S.gymCustom.length, name: nm, area: ar }; S.gymCustom.push(x);
  return { ...x, wait: 0, custom: true };
}
/* 장소 목록 = 가까운 곳(PLACES) + 내 헬스장(맨 위) + 요청한 곳 + 직접 적은 곳. 검색하면 지도 검색 결과(GYM_DIR)까지 */
function placesNow() {
  ensureGym();
  const list = PLACES.map(p => ({ ...p, linked: p.linked || S.gymSim.stage[p.id] === 'join' }));
  const add = (x, dist, top) => { if (x && !list.some(p => p.id === x.id)) list[top ? 'unshift' : 'push']({ id: x.id, name: x.name, kind: 'center', linked: gymJoined(x), dist }); };
  gymReqList().forEach(x => add(x, x.area || '직접 적은 곳'));
  S.gymCustom.forEach(x => add(x, x.area || '직접 적은 곳'));
  add(myGym(), '내 헬스장', true);
  const pin = p => (isMs(p.name) || isPend(p.name) ? 0 : 1);
  return list.map((p, i) => [p, i]).sort((a, b) => pin(a[0]) - pin(b[0]) || a[1] - b[1]).map(x => x[0]);
}
function placeFind(q) {
  q = gnorm(q); const base = placesNow(); if (!q) return base;
  const more = gymDirAll().filter(g => !base.some(p => p.id === g.id)).map(g => ({ id: g.id, name: g.name, kind: 'center', linked: gymJoined(g), dist: g.area || '직접 적은 곳' }));
  return [...base, ...more].filter(p => gnorm(p.name + ((gymById(p.id) || {}).area || '')).includes(q));
}

/* ===== 내 헬스장 고르기 · 입점 요청 ===== */
function gymRegister(x) {   // 설문·설정에서 직접 고름(횟수 제한 없음). 그 뒤 기록이 쌓이면 gymAuto 가 바꾼다
  const g = ensureGym();
  Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area || '', by: S.onboarded ? 'pick' : 'survey', setAt: Date.now(), pickAt: Date.now(), moved: null });
  return true;
}
function gymRequest(id) { ensureGym(); if (gymCanReq(gymById(id)) !== 'ok') return false; S.gymReqs[id] = { at: Date.now() }; return true; }
const gyOkBtn = (id = 'gySheetOk') => `<button class="btn" data-act="shClose" id="${id}" style="margin-top:8px">확인</button>`;
const gymShareBtn = (id, cls = 'btn ghost') => `<button class="${cls}" data-act="gyShare" data-v="${esc(id)}" id="gyShare">같은 헬스장 다니는 친구에게 보내기</button>`;
function gymSentHTML(m) {
  const n = gymWait(m), st = gymStage(m);
  const line = st >= 4 ? '사장님 답을 기다리고 있어요.' : st === 3 ? '사장님께 안내문을 보냈어요.' : st === 2 ? `${GYM_NEED}명이 모여서 사장님께 보낼 안내문을 준비하고 있어요.` : `${GYM_NEED}명이 모이면 저희가 사장님께 우편으로 안내문을 보내요.`;
  return `<div class="gydone" id="gySent"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2">요청을 남겼어요</div>
  <div class="gyline"><b>${esc(m.name)}</b><span>지금 ${n}명이 기다리고 있어요</span></div>
  <div class="muted gysub" id="gySentSub">${line} ${esc(m.name)}${gjo(m.name, '이', '가')} 입점하면 바로 알려 드릴게요.</div>${gymShareBtn(m.id)}</div>`;
}
/* 요청 버튼 공통(카드·장소 목록·결과 화면) — 되면 요청, 안 되면 까닭을 알려 준다 */
function gymReqTry(id) {
  const x = gymById(id), why = gymCanReq(x);
  if (why === 'ok') { gymRequest(id); save(); render(); return sheet(gymSentHTML(x) + gyOkBtn()); }
  if (why === 'did') return gymReqsSheet();
  if (why === 'full') return gymReqsSheet(id);
  if (why === 'norec') return sheet(`<div class="h2 gyname" id="gyNoRecT">여기서 운동한 기록이 있어야 요청할 수 있어요</div><div class="muted gysub"><b>${esc(x.name)}</b>에서 운동을 한 번 기록하면 바로 요청할 수 있어요. 실제로 다니는 분들의 요청만 모으고 있어요.</div>${gyOkBtn('gyNoRecOk')}`);
}
/* 내 입점 요청 목록(취소하는 곳). pend = 3곳이 차서 못 넣은 헬스장 id → 맨 위에 «하나를 취소하면 여기에 요청할 수 있어요» */
function gymReqsSheet(pend) {
  ensureGym(); const list = gymReqList(), x = pend ? gymById(pend) : null, p = x ? ` data-p="${esc(x.id)}"` : '';
  const rows = list.map(g => `<div class="gyrq" data-gym="${esc(g.id)}"><div><b>${esc(g.name)}</b><small>${gymWait(g)}명이 기다리는 중 · ${gymStepName(g)}</small><button class="linkbtn gyrqqr" data-act="gyQr" data-v="${esc(g.id)}">사장님께 QR 보여 드리기 ›</button></div><button class="btn sm ghost" data-act="gyCancelAsk" data-v="${esc(g.id)}"${p}>요청 취소</button></div>`).join('');
  sheet(`${x ? `<div class="h2 gyname" id="gyFullT">입점 요청은 한 번에 ${GYM_REQ_MAX}곳까지 할 수 있어요</div><div class="muted gysub">아래 요청 중 하나를 취소하면 <b>${esc(x.name)}</b>에 요청할 수 있어요.</div>`
    : `<div class="h2" id="gyReqsT">내 입점 요청 <span class="gycnt">${list.length}/${GYM_REQ_MAX}곳</span></div><div class="muted gysub">한 번에 ${GYM_REQ_MAX}곳까지 요청할 수 있어요. 요청한 곳이 입점하면 자리가 다시 비어요.</div>`}
    <div class="gyrqs" id="gyReqList">${rows || '<div class="muted gyrqnone">아직 요청한 곳이 없어요</div>'}</div><button class="btn${x ? ' ghost' : ''}" data-act="shClose" id="gyReqsClose" style="margin-top:12px">닫기</button>`);
}
function gymCancelAsk(id, pend) {
  const x = gymById(id); if (!x) return;
  sheet(`<div class="h2 gyname" id="gyCancelT">${esc(x.name)} 입점 요청을 취소할까요?</div><div class="muted gysub">기다리는 사람 수에서 내 요청이 빠져요. 나중에 다시 요청할 수 있어요.</div>
    <button class="btn" data-act="gyCancel" data-v="${esc(id)}"${pend ? ` data-p="${esc(pend)}"` : ''} id="gyCancelOk">요청 취소</button><button class="btn ghost" data-act="gyReqs"${pend ? ` data-p="${esc(pend)}"` : ''} id="gyCancelNo" style="margin-top:8px">그대로 둘게요</button>`);
}
function gymCancel(id, pend) {
  const x = gymById(id), nx = pend ? gymById(pend) : null; delete S.gymReqs[id]; save(); render();
  if (nx && gymCanReq(nx) === 'ok') return sheet(`<div class="gydone" id="gyFreed"><div class="h2 gyname">${esc(x ? x.name : '')} 요청을 취소했어요</div><div class="muted gysub">이제 <b>${esc(nx.name)}</b>에 요청할 수 있어요.</div></div>
    <button class="btn" data-act="gyReq" data-v="${esc(nx.id)}" id="gyFreedReq">입점 요청하기</button><button class="btn ghost" data-act="shClose" style="margin-top:8px">다음에</button>`);
  toast('요청을 취소했어요'); if (gymReqList().length) gymReqsSheet(); else shClose();
}
/* v1.56 «사장님께 QR 보여 드리기» — 요청한 사람이 원할 때 데스크에서 보여 주는 화면. 알림·팝업으로 권하지 않는다. 요청 수는 화면을 열 때 값 */
const gymOwnerUrl = (g, more = '') => `${location.origin}${location.pathname.replace(/[^/]*$/, '')}owner.html?g=${encodeURIComponent(g.id)}&n=${gymWait(g)}&r=${gymRecent(g)}&name=${encodeURIComponent(g.name)}${more}`;
const gymQrBtn = id => `<button class="btn ghost sm gyshare gyqrbtn" data-act="gyQr" data-v="${esc(id)}" id="gyQrBtn">사장님께 QR 보여 드리기</button>`;
function gymQrSheet(id) {
  const m = gymById(id); if (!m || !gymReqd(m) || gymJoined(m)) return;
  const n = gymWait(m), nm = esc(m.name);
  sheet(`<div class="gyqr" id="gyQr"><div class="h2 gyname" id="gyQrT">${n}명이 ${nm}의 '니짐내짐' 입점을 기다리고 있어요</div>
    <div class="muted gysub" id="gyQrSub">니짐내짐은 운동기록 앱이에요. ${n}명은 앱에 '${nm}에서 운동했다'고 기록한 분들이에요.</div>
    <div class="gyqrbox" id="gyQrBox">${typeof NJ_qrSvg === 'function' ? NJ_qrSvg(gymOwnerUrl(m), 208) : ''}</div>
    <div class="gyqrcap" id="gyQrCap">사장님 휴대폰으로 이 QR을 찍으시면 입점 안내를 보실 수 있어요</div>
    <div class="gyqrhelp" id="gyQrHelp">데스크에서 이 화면만 보여 드리면 돼요. 사장님이 안 계시면 직원분께 보여 드려도 괜찮아요.</div></div>
    <button class="btn ghost" data-act="shClose" id="gyQrClose">닫기</button>`);
}
function gymShare(id) {
  const m = gymById(id) || myGym(); if (!m) return;
  const url = `${location.origin}${location.pathname}?gym=${encodeURIComponent(m.id)}`, text = `나 니짐내짐 앱에 ${m.name} 입점 요청했어. 너도 같이 눌러 줘!`;
  const copy = () => (typeof NJ_copyText === 'function' ? NJ_copyText(`${text} ${url}`) : Promise.resolve(false)).then(ok => toast(ok ? '보낼 글과 링크를 복사했어요 · 친구에게 붙여 넣어 보내 주세요' : '복사하지 못했어요 · 친구에게 헬스장 이름을 직접 알려 주세요'));
  if (navigator.share) navigator.share({ title: '니짐내짐', text, url }).catch(() => {}); else copy();
}

/* ===== 처음 설정 2/3 · 내 헬스장 고르기(같은 화면을 설정에서도 쓴다) ===== */
const GY_ICO = { gym: '<svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>', home: '<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/></svg>' };
const GY_SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const GY_NOREC = '여기서 운동을 한 번 기록하면 입점을 요청할 수 있어요';
const gymFind = q => { q = gnorm(q); return gymDirAll().filter(g => !q || gnorm(g.name + g.area).includes(q)).map((g, i) => [g, i]).sort((a, b) => (isPend(b[0].name) - isPend(a[0].name)) || a[1] - b[1]).map(x => x[0]); };
const gymFindHTML = list => list.length ? list.map(g => `<button class="prow tap" data-act="gyPick" data-v="${esc(g.id)}"><div><b>${esc(g.name)}</b><small>${isPend(g.name) ? '<span class="cbtag wait">멤버십 확인 중</span>' : gymJoined(g) ? '<span class="cbtag">1.5배</span>' : ''}${esc(g.area || '직접 적은 곳')}${isPend(g.name) ? ' · 결제한 센터' : ''}</small></div><span class="muted">선택</span></button>`).join('')
  : `<div class="muted" style="padding:12px 0" id="gyNone">검색 결과가 없어요. 아래에서 헬스장 이름을 직접 적어 주세요.</div>`;
function vGymFlow() {
  const g = ensureGym(), onb = !S.onboarded, top = onb ? obProg(2) : '';
  const wrap = body => `${onb ? '' : subHead('내 헬스장', g.flow === 'settings' ? 'settings' : '')}<div class="sec gyflow">${top}${body}</div>`;
  if (g.step === 'ask') return wrap(`<div class="h2">주로 어디서 운동하세요?</div><div class="muted" style="margin-bottom:12px">나중에 설정에서 바꿀 수 있어요.</div>
    <div class="grid2 placekind" id="gyAsk"><button class="pk" data-act="gyKind" data-v="gym" id="gyKindGym">${GY_ICO.gym}<b>헬스장</b><small>헬스·PT·필라테스</small></button>
    <button class="pk" data-act="gyKind" data-v="home" id="gyKindHome">${GY_ICO.home}<b>집·야외</b><small>홈트·걷기·달리기</small></button></div>`);
  if (g.step === 'find') return wrap(`<div class="h2">다니는 헬스장을 찾아 주세요</div><div class="muted" style="margin-bottom:12px" id="gyFindSub">여러 곳을 다니면 가장 자주 가는 곳을 골라 주세요. 나중에 자주 기록하는 곳으로 알아서 바뀌어요.</div>
    <div class="card"><div class="search">${GY_SEARCH}<input id="gymQ" placeholder="헬스장 이름이나 동네" value="${esc(g.q || '')}" autocomplete="off"></div>
    <div id="gymList">${gymFindHTML(gymFind(g.q))}</div></div>
    ${g.manual ? `<div class="card" id="gyManual"><div class="h3" style="margin-top:0">직접 적기</div><input class="gyin" id="gyName" placeholder="헬스장 이름" maxlength="30" autocomplete="off"><input class="gyin" id="gyArea" placeholder="동네 (예: 신림동)" maxlength="12" autocomplete="off"><button class="btn" data-act="gyManualOk" id="gyManualOk">이 헬스장으로 등록</button></div>`
      : `<button class="btn ghost" data-act="gyManual" id="gyManualBtn">찾는 헬스장이 없어요 · 직접 적기</button>`}
    <button class="linkbtn gyback" data-act="gyStep" data-v="ask">‹ 이전</button>`);
  const m = myGym(), nextL = onb ? '다음' : '확인';
  if (!m) { g.step = 'ask'; return vGymFlow(); }
  if (g.step === 'sent' && gymReqd(m)) return wrap(`${gymSentHTML(m)}<button class="btn" data-act="gyNext" id="gyNext">${nextL}</button>`);
  if (isPend(m.name)) return wrap(`<div class="gydone" id="gyRes" data-ms="pend"><div class="h2 gyname">${esc(m.name)} 멤버십을 확인하고 있어요</div>
    <div class="muted gysub">멤버십이 확인되면 그때부터 여기서 운동할 때 경험치를 1.5배로 받아요.<br>그 전에도 운동 기록은 그대로 쌓여요.</div></div><button class="btn" data-act="gyNext" id="gyNext">${nextL}</button>`);
  if (gymJoined(m)) return wrap(`<div class="gydone" id="gyRes"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2">여기는 경험치 1.5배 헬스장이에요</div>
    <div class="gyline"><b>${esc(m.name)}</b></div><div class="muted gysub">앱에서 '입장하기'를 누르고 운동하면 경험치를 1.5배로 받아요.</div></div><button class="btn" data-act="gyNext" id="gyNext">${nextL}</button>`);
  const n = gymWait(m), why = gymCanReq(m);
  return wrap(`<div class="gydone" id="gyRes"><div class="h2 gyname">${esc(m.name)}${gjo(m.name, '은', '는')} 아직 입점 전이에요</div>
    <div class="muted gysub">니짐내짐에 입점하면 여기서 운동할 때 경험치를 더 받아요.${n ? `<br>지금 ${n}명이 입점을 기다리고 있어요.` : ''}${why === 'norec' ? `<br><span id="gyNoRec">${GY_NOREC}.</span>` : why === 'did' ? '<br>입점 요청은 이미 남겨 두셨어요.' : ''}</div></div>
    ${why === 'ok' || why === 'full' ? `<button class="btn" data-act="gyReq" data-v="${esc(m.id)}" data-f="flow" id="gyReqBtn">입점 요청하기</button><button class="btn ghost" data-act="gyNext" id="gyLater" style="margin-top:8px">다음에</button>` : `<button class="btn" data-act="gyNext" id="gyNext">${nextL}</button>`}`);
}

/* ===== 운동기록 탭 «내 헬스장» 카드 ===== */
function gymStepsHTML(st) {
  return `<div class="gysteps" id="gySteps" aria-label="5단계 중 ${st}단계">${GYM_STEPS.map(([a, b], i) => `<div class="${i < st ? 'on' : ''}${i === st - 1 ? ' cur' : ''}"><i>${i < st ? '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg>' : i + 1}</i><span>${a}${b ? `<br>${b}` : ''}</span></div>`).join('')}</div>`;
}
/* 카드 맨 아래 «내 입점 요청 2/3곳 ›» — 다른 헬스장에 남긴 요청을 보고 취소하는 곳 */
const gymReqsRow = () => { const n = gymReqList().length; return n ? `<button class="gyreqs tap" data-act="gyReqs" id="gyReqsBtn"><span>내 입점 요청</span><b>${n}/${GYM_REQ_MAX}곳</b><i>›</i></button>` : ''; };
function gymCard() {   // v1.55: 멤버십·결제한 센터 줄을 맨 위에 두고, 그 밖에 자주 가는 헬스장이 있으면 아래에 이어 붙인다
  const g = ensureGym(), mb = msBlock(); if (!mb) return gymCard0('내 헬스장');
  const m = myGym(), only = `<div class="card gycard" id="gymCard" data-st="ms">${mb}${gymReqsRow()}</div>`;
  if (g.kind === 'home' || (m && (isMs(m.name) || isPend(m.name))) || (!m && mships().length)) return only;
  const c0 = gymCard0(mships().length ? '자주 가는 다른 헬스장' : '내 헬스장');
  return c0 ? c0.replace(/^(<div class="card gycard"[^>]*>)/, `$1${mb}<div class="mssep"></div>`) : only;
}
function gymCard0(label) {
  const g = ensureGym();
  if (g.kind === 'home') { const r = gymReqsRow(); return r ? `<div class="card gycard gyonly" id="gymCard" data-st="home">${r}</div>` : ''; }
  if (!g.kind) return `<div class="card gycard" id="gymCard"><div class="gyq">주로 어디서 운동하세요?</div><div class="muted">한 번만 알려 주세요. 나중에 설정에서 바꿀 수 있어요.</div>
    <div class="grid2 gyask"><button class="btn sm ghost" data-act="gyKind" data-v="gym" id="gyCardGym">헬스장</button><button class="btn sm ghost" data-act="gyKind" data-v="home" id="gyCardHome">집·야외</button></div>${gymReqsRow()}</div>`;
  const m = myGym(), st = gymStage(m), n = gymWait(m), nm = esc(m.name), mv = !mships().length && g.moved && Date.now() - g.moved.at < 7 * DAY_MS ? g.moved : null;   // 멤버십 보유자에겐 «내 헬스장을 바꿨어요»를 안 띄운다(멤버십 센터가 따로 보이므로)
  const head = `<div class="gyh"><div><small>${label}</small><b id="gyName1">${nm}</b></div><button class="linkbtn" data-act="gyChange" id="gyChange">바꾸기</button></div>
    ${mv ? `<div class="gymoved" id="gyMoved"><span>요즘 여기서 가장 자주 운동해서 내 헬스장${mv.from ? `을 바꿨어요 · 전에는 ${esc(mv.from)}` : '으로 정했어요'}</span><button class="linkbtn" data-act="gyMovedOk" id="gyMovedOk">확인</button></div>` : ''}`;
  const tail = gymReqsRow();
  if (st === 5 && !gymReqd(m)) return `<div class="card gycard" id="gymCard" data-st="in">${head}<div class="gymsg on">경험치 1.5배 헬스장이에요</div><div class="muted">앱에서 '입장하기'를 누르고 운동하면 돼요</div>${tail}</div>`;
  if (st === 0) { const can = gymRecN(m) > 0;
    return `<div class="card gycard" id="gymCard" data-st="0">${head}<div class="gymsg">아직 입점 전이에요</div><div class="muted">니짐내짐에 입점하면 여기서 운동할 때 경험치를 더 받아요${n ? ` · 지금 ${n}명이 기다리고 있어요` : ''}</div>
    ${can ? `<button class="btn" data-act="gyReq" data-v="${esc(m.id)}" id="gyReqBtn">입점 요청하기</button>` : `<div class="gyhint" id="gyNoRec">${GY_NOREC}</div>`}${tail}</div>`; }
  const msg = [null,
    [`지금 ${n}명이 기다리고 있어요`, `${GYM_NEED}명이 모이면 저희가 사장님께 안내문을 보내요`],
    [`${n}명이 모였어요`, '사장님께 보낼 안내문을 준비하고 있어요'],
    ['사장님께 안내문을 보냈어요', '우편이라 도착까지 일주일쯤 걸려요'],
    ['사장님 답을 기다리고 있어요', '소식이 오면 바로 알려 드릴게요'],
    [`${nm}${gjo(m.name, '이', '가')} 입점했어요!`, g.item ? `<span class="gygift" id="gyGift">${gymItemImg()}<span>오늘부터 경험치 1.5배예요 · 요청해 주셔서 «${GYM_ITEM}»를 드렸어요</span></span>` : '오늘부터 경험치 1.5배예요']][st];
  return `<div class="card gycard" id="gymCard" data-st="${st}">${head}${gymStepsHTML(st)}<div class="gymsg ${st === 5 ? 'on' : ''}" id="gyMsg">${msg[0]}</div><div class="muted" id="gyMsg2">${msg[1]}</div>${st < 5 ? gymShareBtn(m.id, 'btn ghost sm gyshare') + gymQrBtn(m.id) : ''}${tail}</div>`;
}
const gymPill = () => { const g = ensureGym(); return g.item && g.itemOn ? `<span class="pill gypill">${gymItemImg()}${GYM_ITEM}</span>` : ''; };

/* ===== 장소 고르는 화면 — «아직 입점 전» 줄 · 직접 적기 ===== */
function gymPlaceRow(p) {
  const g = gymById(p.id) || { id: p.id, name: p.name, wait: 0 }, mine = gymReqd(g), can = gymRecN(g) > 0;
  if (!mine && !can) return `<button class="prow tap plc" data-act="place" data-v="${esc(p.name)}" data-gym="${esc(p.id)}"><div><b>${esc(p.name)}</b><small>${esc(p.dist)}${gymQuiet() ? '' : ' · 아직 입점 전'}</small></div><span class="muted">선택</span></button>`;
  return `<div class="prow plc gyrow" data-gym="${esc(p.id)}"><button class="tap gymain" data-act="place" data-v="${esc(p.name)}"><b>${esc(p.name)}</b><small>${esc(p.dist)} · 아직 입점 전${mine ? ` · ${gymWait(g)}명이 기다리는 중` : ''}</small></button>
    ${mine ? '<button class="gydid" data-act="gyReqs">요청함</button>' : `<button class="btn sm ghost gyreq" data-act="gyReq" data-v="${esc(p.id)}">입점 요청하기</button>`}</div>`;
}
/* 검색 카드 아래 — 지도 검색에 없는 헬스장을 직접 적어 그 장소로 운동 시작 */
function gymPlaceManual() {
  const g = ensureGym();
  return g.pm ? `<div class="card gyflow" id="gyPlManual"><div class="h3" style="margin-top:0">헬스장 이름 직접 적기</div><input class="gyin" id="gyPlName" placeholder="헬스장 이름" maxlength="30" autocomplete="off" value="${esc((S.placeQ || '').trim().slice(0, 30))}"><input class="gyin" id="gyPlArea" placeholder="동네 (예: 신림동)" maxlength="12" autocomplete="off">
    <button class="btn" data-act="gyPlOk" id="gyPlOk">여기서 운동 시작</button><div class="muted gyplnote">직접 적은 헬스장도 기록이 쌓이면 입점을 요청할 수 있어요</div></div>`
    : `<button class="btn ghost" data-act="gyPlManual" id="gyPlManualBtn" style="margin-top:10px">찾는 헬스장이 없어요 · 직접 적기</button>`;
}

/* ===== 운동 결과 화면 — 그날 고른 장소 기준 =====
   집·야외 = 아무것도 안 띄움 · 입점 전 헬스장 = 그 헬스장 이름으로 입점 안내·요청 · 입점센터(입장 안 누름) = «다음엔 입장하기» */
function gymResultCard(rec) {
  if (!rec || rec.demo || vk(rec.v) !== 'self' || !isGymRec(rec)) return '';
  const m = gymByName(placeBase(rec.place)), first = gymFirstWeek();
  if (isPend(rec.place)) return `<div class="cbif gyres" id="msPendRes"><span><b class="gynm">${esc(placeBase(rec.place))}</b> 멤버십이 확인되면 그때부터 경험치를 1.5배로 받아요<small>오늘 기록은 그대로 저장됐어요</small></span></div>`;   // v1.55: 결제했지만 미발급 — 보너스·입점 요청·«입장하기» 안내 없음
  if (m && !gymJoined(m)) {
    const n = gymWait(m), nm = esc(m.name);
    if (gymReqd(m)) return `<div class="cbif gyres" id="gymResCard" data-gym="${esc(m.id)}"><span><b class="gynm">${nm}</b> · 지금 ${n}명이 입점을 기다리고 있어요</span><button class="linkbtn" data-act="gyShare" data-v="${esc(m.id)}">친구에게 보내기 ›</button></div>`;
    if (first) return '';
    return `<div class="cbif gyres" id="gymResCard" data-gym="${esc(m.id)}"><span><b class="gynm">${nm}</b>${gjo(m.name, '이', '가')} 입점하면 운동할 때마다 경험치를 더 받아요${n ? `<small>지금 ${n}명이 기다리고 있어요</small>` : ''}</span><button class="btn sm" data-act="gyReq" data-v="${esc(m.id)}" id="gyResReq">입점 요청하기</button></div>`;
  }
  if (!m || first || !(rec.centerIf > 0)) return '';
  const num = fmt(rec.centerIf);
  return `<div class="cbif" id="cbIf"><span>다음엔 '입장하기'를 누르고 운동해 보세요 · 오늘이었다면 경험치 <b>${num}</b>${gjo(num, '을', '를')} 더 받았어요</span></div>`;
}
/* 설정 › 센터 확인 카드 안 «주로 운동하는 곳» 줄 */
function msSetDesc(g) {
  const ms = mships(), pd = msPend(), own = g.kind === 'gym' && (isMs(g.name) || isPend(g.name));
  const base = g.kind === 'gym' ? `${ms.length ? '자주 가는 다른 헬스장' : '헬스장'} · ${esc(g.name)}<br>자주 기록하는 곳으로 알아서 바뀌어요` : g.kind === 'home' ? '집·야외' : '아직 안 골랐어요';
  const top = ms.length ? `멤버십 센터 · ${ms.map(esc).join(', ')}` : pd ? `결제한 센터 · ${esc(pd)}(멤버십 확인 중)` : '';
  return top ? (own ? top : `${top}<br>${base}`) : base;
}
function gymSettingsRow() {
  const g = ensureGym();
  return `<div class="row" id="gySetRow"><div><span>주로 운동하는 곳</span><div class="muted" id="gySetDesc">${msSetDesc(g)}</div></div><button class="btn sm ghost" data-act="gyChange" data-v="settings" id="gySetBtn">${g.kind ? '바꾸기' : '고르기'}</button></div>`;
}

/* ===== 센터 기구 기반 코칭 ===== */
/* 센터의 보유 기구(machine_ids). 관리자 시연 스위치: 0 = 비움(기구 정보 없는 센터) · 1 = 등록됨 · 2 = 기구 목록 전부(많은 센터 보기) */
function centerRow(name) {
  ensureGym(); const row = CENTER_GYMS.find(g => g.name === name) || { name, machine_ids: [], machine_counts: {} };
  let sim = S.gymSim.equip[name]; if (sim === true) sim = 1; if (sim === false) sim = 0;
  if (sim === 0) return { ...row, machine_ids: [], machine_counts: {} };
  if (sim === 2) return { ...row, machine_ids: MACHINES.map(m => m.id), machine_counts: { ...CENTER_FILL.machine_counts, ...row.machine_counts } };
  if (sim === 1 && !row.machine_ids.length) return { ...row, ...CENTER_FILL };
  return row;
}
function centerInfo(name) { const r = centerRow(name); return r.machine_ids.length ? centerMachineInfo(r.machine_ids, r.machine_counts) : null; }
function centerEquip(name) { const i = centerInfo(name); return i ? i.kinds : null; }
/* 지금 «입장»해 있는 입점센터 기준. 운동 중이면 그 운동의 센터(입장·레슨일 때만), 아니면 오늘 입장 기록 */
function eqCtx(sess) {
  ensureGym();
  const s = sess === undefined ? S.session : sess;
  const name = s ? ((s.verify === 'V1' || s.verify === 'V3') && s.place && s.place.kind === 'center' ? placeBase(s.place.name) : null) : (S.entryDemo ? S.entryCenter : null);
  const p = name && placesNow().find(x => x.name === name);
  if (!p || !p.linked) return { mode: 'none' };
  const has = centerEquip(name);
  return has ? { mode: 'equip', center: name, has, info: centerInfo(name) } : { mode: 'noequip', center: name };
}
function exOkAt(id, has) {
  const e = EX[id]; if (!e || e.cat === 'lesson') return false;
  const req = EX_EQUIP[id]; if (req === 'out') return false;
  if (!req) return e.cat === 'body' || e.cat === 'out' ? e.cat === 'body' : true;   // 사전에 없는 것(직접 추가·본사 추가 운동)은 막지 않는다
  return req.every(r => r.split('|').some(x => has.has(x)));
}
const exAvail = (id, ctx = eqCtx()) => ctx.mode !== 'equip' || exOkAt(id, ctx.has);
const EQ_ALT = {
  leg_press: ['hack_squat', 'smith_squat', 'squat', 'goblet'], squat: ['smith_squat', 'leg_press', 'hack_squat', 'goblet'], hack_squat: ['leg_press', 'smith_squat', 'squat'], smith_squat: ['squat', 'leg_press', 'goblet'],
  bench: ['smith_bench', 'chest_press', 'db_press'], chest_press: ['bench', 'db_press', 'smith_bench'], smith_bench: ['bench', 'chest_press', 'db_press'], db_press: ['bench', 'chest_press'],
  lat_pulldown: ['assist_pullup', 'seated_row', 'db_row'], seated_row: ['db_row', 'barbell_row', 'plate_row', 'lat_pulldown'], barbell_row: ['seated_row', 'db_row'], deadlift: ['rdl', 'back_ext'],
  m_shoulder: ['db_shoulder', 'ohp'], ohp: ['db_shoulder', 'm_shoulder'], db_shoulder: ['m_shoulder', 'ohp'], lateral: ['lateral_m', 'cable_lateral'], lateral_m: ['lateral', 'cable_lateral'],
};
/* 대체 운동: 같은 부위 · (센터 기구 정보가 있으면 그 센터에서 할 수 있는 것만) · 이름이 닮은 것 → 기준 무게표 있는 것 → 머신 순 */
function eqAlt(id, ctx = eqCtx(), n = 2, skip = []) {
  const e = EX[id]; if (!e) return [];
  const tok = s => s.split(/[\s·()]+/).filter(w => w.length >= 2), mine = tok(e.name);
  const score = x => tok(x.name).filter(w => mine.some(m => m.includes(w) || w.includes(m))).length * 10 + (COACH_CFG.BEGIN_1RM[x.id] ? 2 : 0) + (x.cat === 'machine' ? 1 : 0);
  const pref = (EQ_ALT[id] || []).filter(x => EX[x] && !EX[x].off && !skip.includes(x) && exAvail(x, ctx));   // 동작이 닮은 짝을 먼저(프로토 표 — 실서비스 전 트레이너 검수)
  if (pref.length >= n) return pref.slice(0, n);
  skip = [...skip, ...pref];
  return [...pref, ...EX_DICT.filter(x => x.id !== id && !skip.includes(x.id) && !x.off && x.part === e.part && x.mode === e.mode && x.cat !== 'lesson' && x.cat !== 'out' && exAvail(x.id, ctx))
    .map((x, i) => [x, score(x), i]).sort((a, b) => b[1] - a[1] || a[2] - b[2]).map(x => x[0].id)].slice(0, n);
}
/* 추천 운동 2개를 그 센터 기구로 좁힌다. 없는 운동은 가장 닮은 운동으로 바꿔 끼운다 → { ids, swaps:[[없는 것, 바꾼 것]] } */
function eqPickFor(defIds, ctx) {
  const ids = [], swaps = [];
  defIds.forEach(id => { if (exOkAt(id, ctx.has)) return ids.push(id);
    const a = eqAlt(id, ctx, 1, [...defIds, ...ids])[0]; if (a) { ids.push(a); swaps.push([id, a]); } });
  return { ids: ids.length ? ids : defIds, swaps };
}
/* 그 운동을 이 센터의 어느 기구로 하는지 — 운동 부위와 기구 부위(body)가 맞는 것을 먼저 고른다 */
const _PART_BODY = { 코어: '복근' }, _EQ_SMALL = ['dumbbell', 'barbell', 'kettlebell', 'ezbar', 'bench'];   // 거치대·벤치는 «이 기구에서 해» 하고 짚어 줄 대상이 아니다
function eqMachineFor(id, ctx) {
  const req = EX_EQUIP[id], e = EX[id]; if (!ctx.info || !Array.isArray(req) || !e) return null;
  const want = _PART_BODY[e.part] || e.part;
  for (const r of req) for (const k of r.split('|')) { if (_EQ_SMALL.includes(k)) continue; const ms = ctx.info.byKind[k]; if (ms && ms.length) return ms.find(m => machineBody(m).includes(want)) || ms[0]; }
  return null;
}
const eqMName = m => `'${m.name}'${m.brand && m.brand !== 'etc' ? `(${m.brand})` : ''}`;
function eqMachineLine(ids, ctx) {
  const hit = ids.slice(0, 2).map(id => [id, eqMachineFor(id, ctx)]).filter(x => x[1]); if (!hit.length) return null;
  return `이 센터에선 ${hit.map(([id, m]) => `${jo(EX[id].name, '은', '는')} ${eqMName(m)}`).join(', ')}에서 하면 돼.`;
}
/* 이 센터 기구 목록(종류·부위로 좁혀 보기) */
let EQV = { type: '', body: '' };
function eqListHTML(center) {
  const info = centerInfo(center); if (!info) return '';
  const types = MACHINE_TYPES.filter(t => info.machines.some(m => m.type === t)), bodies = MACHINE_BODY.filter(b => info.machines.some(m => machineBody(m).includes(b)));
  const list = info.machines.filter(m => (!EQV.type || m.type === EQV.type) && (!EQV.body || machineBody(m).includes(EQV.body)));
  const chip = (k, v, l) => `<button class="chip ${EQV[k] === v ? 'on' : ''}" data-act="eqF" data-k="${k}" data-v="${esc(v)}" data-c="${esc(center)}">${l}</button>`;
  return `<div class="h2 gyname" id="eqListT">${esc(center)} 기구 ${info.machines.length}종</div>
    <div class="muted eqlsub">센터가 등록한 기구예요. 코치는 여기 있는 기구로 할 수 있는 운동만 알려드려요.</div>
    <div class="eqfl"><small>종류</small><div class="hscroll">${chip('type', '', '전체')}${types.map(t => chip('type', t, t)).join('')}</div></div>
    <div class="eqfl"><small>부위</small><div class="hscroll">${chip('body', '', '전체')}${bodies.map(b => chip('body', b, b)).join('')}</div></div>
    <div class="eqlist" id="eqList">${list.length ? list.map(m => { const n = +info.counts[m.id] || 1;
      return `<div class="eqm"><div class="eqth">${m.image ? `<img src="${esc(m.image)}" alt="" loading="lazy">` : '<svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>'}</div>
        <div class="eqmb"><b>${esc(m.name)}</b><div class="eqtags"><span class="ty">${esc(m.type)}</span>${machineBody(m).map(b => `<span>${esc(b)}</span>`).join('')}</div>
        ${[m.brand !== 'etc' ? m.brand : '', m.series].filter(Boolean).length ? `<small>${esc([m.brand !== 'etc' ? m.brand : '', m.series].filter(Boolean).join(' · '))}</small>` : ''}</div>
        ${n > 1 ? `<span class="eqcnt">${n}대</span>` : ''}</div>`; }).join('') : '<div class="muted eqnone">여기에 맞는 기구가 없어요</div>'}</div>
    <button class="btn" data-act="shClose" id="eqListOk" style="margin-top:12px">닫기</button>`;
}
const eqOthers = c => Math.max(0, S.gymSim.eqWait[c] ?? EQ_WAIT_BASE[c] ?? 0);
const eqWaitN = c => eqOthers(c) + (S.eqReq[c] ? 1 : 0);
function eqCoachCard() {
  const c = eqCtx();
  if (c.mode === 'equip') return `<div class="eqline" id="eqLine"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg><span><b>${esc(c.center)}</b> 기구 기준으로 알려드려요</span><button class="eqmore" data-act="eqList" data-v="${esc(c.center)}" id="eqListBtn">기구 ${c.info.machines.length}종 보기</button></div>`;
  if (c.mode !== 'noequip') return '';
  const did = !!S.eqReq[c.center];
  return `<div class="card gycard eqcard" id="eqCard" data-st="${did ? 1 : 0}"><div class="gyh"><div><small>지금 운동하는 센터</small><b>${esc(c.center)}</b></div></div>
    <div class="muted">이 센터는 아직 기구 정보가 등록되지 않아 기구에 맞춘 코칭은 못 해요. 지금은 내 운동 기록을 보고 알려드려요.</div>
    ${did ? `<div class="gymsg" id="eqMsg">요청을 남겼어요 · 지금 ${eqWaitN(c.center)}명이 요청했어요</div><div class="muted">센터가 기구 정보를 올리면 바로 알려 드릴게요</div>` : `<button class="btn" data-act="eqReq" data-v="${esc(c.center)}" id="eqReqBtn">기구 정보 요청하기</button>`}</div>`;
}
/* 대체 운동 답(규칙이 고른다 — 말투만 캐릭터) */
function eqAltReply(q, lastEx) {
  const c = eqCtx(), ex = exHit(q) || lastEx; if (!ex) return ['바꾸고 싶은 운동 이름을 말해 줘.', '예: «레그프레스 대신 뭐 해?»'];
  const e = EX[ex], alt = eqAlt(ex, c);
  if (!alt.length) return [`${e.name} 대신 할 만한 ${e.part} 운동을 아직 못 찾았어.`, '센터 선생님에게 한번 물어봐 줘.'];
  return [`${e.name} 대신 ${alt.map(id => EX[id].name).join('나 ').replace(/([가-힣A-Za-z)])나 /g, (m0, c) => c + (((c.charCodeAt(0) - 0xAC00) % 28 > 0 && c >= '가') ? '이나 ' : '나 '))} 어때?`, `둘 다 같은 ${e.part} 운동이야.`.replace('둘 다', alt.length > 1 ? '둘 다' : '이것도'), c.mode === 'equip' ? (eqMachineLine(alt, c) || `${c.center}에 있는 기구로 할 수 있어.`) : null];
}

/* ===== 알림(실제 앱에서는 푸시) — 입점 성사 · 5명 모임 · 센터가 기구 정보를 올림 ===== */
function gymNoteSheet() {
  ensureGym(); const n = S.gymNotes.shift(); if (!n) return; save();
  const ok = `<button class="btn" data-act="shClose" id="gyNoteOk" style="margin-top:14px">확인</button>`, push = `<div class="muted demoonly" style="margin-top:8px">실제 앱에서는 푸시 알림으로도 가요</div>`;
  if (n.t === 'join') sheet(`<div class="gydone" id="gyJoinNote">${n.item ? `<div class="gybadge">${gymItemImg('lg')}</div>` : `<div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div>`}<div class="h2 gyname">${esc(n.name)}${gjo(n.name, '이', '가')} 입점했어요!</div><div class="muted gysub">오늘부터 경험치 1.5배예요.${n.item ? `<br>입점을 요청해 주셔서 한정 꾸미기 아이템 «${GYM_ITEM}»를 드렸어요.` : ''}</div></div>${ok}${push}`);
  else if (n.t === 'five') sheet(`<div class="gydone" id="gyFiveNote"><div class="h2 gyname">${esc(n.name)} 입점 요청, ${GYM_NEED}명이 모였어요!</div><div class="muted gysub">이제 사장님께 안내문을 보낼게요</div></div>${ok}${push}`);
  else if (n.t === 'eq') sheet(`<div class="gydone" id="gyEqNote"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2 gyname">${esc(n.name)}${gjo(n.name, '이', '가')} 기구 정보를 올렸어요</div><div class="muted gysub">이제 코치가 이 센터에 있는 기구에 맞춰 알려드려요.</div></div>${ok}${push}`);
}
function gymBoot() { try { ensureGym(); if (S.gymNotes.length && S.chosen && S.onboarded && !/^#admin/.test(location.hash)) setTimeout(gymNoteSheet, 500); } catch (e) { console.error('[gymBoot]', e); } }


/* ===== 버튼 ===== */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled || (b.closest && b.closest('#evo'))) return;
  const a = b.dataset.act, v = b.dataset.v;
  const flowGo = step => { S.gym.step = step; return go('workout', S.onboarded ? 'gym' : 'onbGym'); };
  const H = {
    gyKind: () => { const g = ensureGym();
      if (v === 'home') { Object.assign(g, { kind: 'home', id: null, name: '', area: '', by: S.onboarded ? 'pick' : 'survey', setAt: Date.now(), pickAt: Date.now(), moved: null, step: 'ask' });
        if (!S.onboarded) return go('workout', 'onbPerm'); toast('집·야외로 정했어요'); return go('workout', g.flow === 'settings' ? 'settings' : null); }
      g.q = ''; g.manual = false; if (S.sub !== 'gym' && S.sub !== 'onbGym') g.flow = 'card'; return flowGo('find'); },
    gyStep: () => { S.gym.step = v; },
    gyPick: () => { const x = gymById(v); if (!x) return true; gymRegister(x); S.gym.step = 'res'; },
    gyManual: () => { S.gym.manual = true; },
    gyManualOk: () => { const x = gymCustomAdd($('gyName').value, $('gyArea').value);
      if (!x) return toast('헬스장 이름을 적어 주세요'), true;
      gymRegister(x); S.gym.step = 'res'; S.gym.manual = false; },
    gyReq: () => { if (b.dataset.f === 'flow' && gymCanReq(gymById(v)) === 'ok') { gymRequest(v); S.gym.step = 'sent'; return; } gymReqTry(v); return true; },
    gyReqs: () => (gymReqsSheet(b.dataset.p), true),
    gyCancelAsk: () => (gymCancelAsk(v, b.dataset.p), true),
    gyCancel: () => (gymCancel(v, b.dataset.p), true),
    gyNext: () => { const g = S.gym; g.step = 'ask'; if (!S.onboarded) return go('workout', 'onbPerm'); return go('workout', g.flow === 'settings' ? 'settings' : null); },
    gyChange: () => { const g = ensureGym(); g.flow = v === 'settings' ? 'settings' : 'card'; g.q = ''; g.manual = false; return flowGo('ask'); },
    gyShare: () => (gymShare(v), true),
    gyQr: () => (gymQrSheet(v), true),
    gyItem: () => { S.gym.itemOn = !S.gym.itemOn; },
    gyMovedOk: () => { S.gym.moved = null; },
    gyPlManual: () => { S.gym.pm = true; },
    msPick: () => { S.placeOpen = null; openSession({ name: v, kind: 'center' }, 'V0', isMs(v) ? { auto: true } : null); toast(`${v}에서 운동 시작`); return true; },
    msOther: () => { S.placeAll = true; S.placeQ = ''; },
    msChange: () => { const s = S.session; if (s && s.items.length) return true; S.session = null; S.placeAll = true; S.placeQ = ''; S.gym.pm = false; return go('workout', 'place'), true; },
    msEnter: () => { const s = S.session; if (!s || !isMs(s.place.name)) return true; s.verify = 'V1'; S.entryDemo = true; S.entryCenter = placeBase(s.place.name); toast(`입장 확인! ${s.place.name}에서 운동 중`); },
    gyPlOk: () => { const raw = ($('gyPlName').value || '').trim();
      if (raw === '집' || raw === '야외') return toast('집·야외는 위에 있는 버튼으로 골라 주세요'), true;
      const x = gymCustomAdd(raw, $('gyPlArea').value);
      if (!x) return toast('헬스장 이름을 두 글자 이상 적어 주세요'), true;
      S.gym.pm = false; S.placeQ = ''; S.placeOpen = null; save(); pickPlace(x.name); return true; },
    eqList: () => { EQV = { type: '', body: '' }; sheet(eqListHTML(v)); return true; },
    eqF: () => { EQV[b.dataset.k] = v; const sc = document.querySelector('#sheet .hscroll'), keep = [...document.querySelectorAll('#sheet .hscroll')].map(x => x.scrollLeft); sheet(eqListHTML(b.dataset.c), true); document.querySelectorAll('#sheet .hscroll').forEach((x, i) => { x.scrollLeft = keep[i] || 0; }); return true; },
    eqReq: () => { ensureGym(); if (!S.eqReq[v]) S.eqReq[v] = { at: Date.now() }; toast(`요청을 남겼어요 · 지금 ${eqWaitN(v)}명이 요청했어요`); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); ensureGym();
  if (H[a]() !== undefined) return;
  save(); render();
}, true);
document.addEventListener('input', e => {
  if (e.target.id === 'gymQ') { ensureGym(); S.gym.q = e.target.value; const el = document.getElementById('gymList'); if (el) el.innerHTML = gymFindHTML(gymFind(S.gym.q)); }
});

/* ===== 관리자 시연 화면 H8 — 요청 수·진행 단계·입점 성사·센터 기구 바꿔 보기 ===== */
const GYM_SIM_GYMS = [['green', '그린피트니스'], ['river', '리버짐'], ['tt', '튼튼헬스'], ['long', '이름 긴 헬스장'], ['dan', '더단단 PT']];
function gymSimRec(id) {   // 시연용: 그 헬스장에서 자가 기록 1건(오늘) — 경험치·레벨은 안 건드리고 기록 줄만 넣는다
  const x = gymById(id); if (!x) return;
  S.records.push({ id: Date.now() + S.records.length, date: TODAY, place: x.name, placeKind: 'center', summary: '맨몸 스쿼트 2세트', xp: 0, v: 'self', items: [SR('air_squat', [0, 20], [0, 20])], sim: true });
  gymAuto();
}
function vH8() {
  ensureGym();
  const g = S.gym, m = myGym(), sim = S.gymSim, reqs = gymReqList();
  const gs = (key, cur, opts) => `<div class="aseg">${opts.map(([k, l]) => `<button class="${String(cur) === String(k) ? 'on' : ''}" data-gadm="${key}" data-v="${k}">${l}</button>`).join('')}</div>`;
  const row = (l, body, hint = '') => `<div class="afr gyafr"><span>${l}</span><div>${body}${hint ? `<em>${hint}</em>` : ''}</div></div>`;
  const who = !g.kind ? 'none' : g.kind === 'home' ? 'home' : g.id;
  const mailCur = !m || !sim.mail[m.id] ? 'none' : gymMailDue(m) ? 'due' : 'sent', ready = !!m && gymReady(m);
  const qs = m ? `?g=${encodeURIComponent(m.id)}&name=${encodeURIComponent(m.name)}&area=${encodeURIComponent(m.area || '')}&n=${gymWait(m)}&r=${gymRecent(m)}` : '';
  const days = Math.floor((Date.now() - S.joinAt) / DAY_MS);
  const st = m ? gymStage(m) : 0;
  const now = !g.kind ? '아직 안 고름' : g.kind === 'home' ? '집·야외' : `${esc(g.name)}(${g.by === 'auto' ? '기록으로 자동 판정' : '직접 고름'}) · ${gymJoined(m) ? '입점' : '입점 전'} · 여기 기록 ${gymRecN(m)}건 · ${gymReqd(m) ? `요청함 · 진행 ${st}/5칸 · 요청 ${gymWait(m)}명` : '요청 안 함'}`;
  const ownerUrl = 'owner.html' + qs, letterUrl = 'letter.html' + qs;
  const centers = ['니짐 신림점', '니짐 봉천점'];
  const entry = S.entryDemo ? S.entryCenter : 'none';
  return `${sec('우리 헬스장 입점 요청 — 회원 앱 상태 바꿔 보기', `
    ${note(`지금 회원 앱 «내 헬스장»: <b>${now}</b><br>입점 요청 ${reqs.length}/${GYM_REQ_MAX}곳${reqs.length ? ` — ${reqs.map(x => `${esc(x.name)}(${gymWait(x)}명)`).join(' · ')}` : ''} · 여기서 바꾼 값은 바로 저장돼요. 왼쪽 아래 «회원 앱 시연으로»를 누르면 반영된 화면이 보여요.`)}
    ${row('멤버십', gs('ms', msMode(), [['none', '없음'], ['one', '1장(니짐 신림점)'], ['multi', '여러 장(신림점·봉천점)'], ['pend', '결제했지만 미발급(서울대입구점)']]), '멤버십이 있으면 처음 설문·운동 시작 때 장소를 안 물어요 · 여러 장이면 오늘 입장한 센터 → 없으면 내 멤버십 센터만 먼저 · «미발급»은 그 센터로 기록되지만 보너스는 멤버십 확인 뒤부터 · 주소에 ?ms=none|one|multi|pend 로도 바꿀 수 있어요')}
    ${row('내 헬스장(설문 답)', gs('who', who, [['none', '아직 안 고름'], ['home', '집·야외'], ['green', '그린피트니스 신림역점(입점 전)'], ['long', '이름 긴 헬스장(입점 전)'], ['sillim', '니짐 신림점(입점)']]), `여기서 고른 값은 «방금 직접 고른 것»으로 쳐요 · 그 뒤 다른 헬스장 기록이 ${GYM_AUTO_MIN}번 쌓이면 자동으로 바뀌어요(최근 ${GYM_AUTO_DAYS}일 최다 · 같으면 최근 기록)`)}
    ${row('운동 기록 넣기(오늘 · 자가 기록)', GYM_SIM_GYMS.map(([id, l]) => `<button class="abtn ghost sm" data-gadm="rec" data-v="${id}" style="margin:0 4px 4px 0">${l} +1</button>`).join(''), `입점 요청은 기록이 있는 헬스장에만 할 수 있어요 · 지금 ${GYM_SIM_GYMS.map(([id, l]) => `${l} ${gymRecN(gymById(id))}건`).join(' · ')}`)}
    ${row('입점 요청(내 헬스장)', gs('req', m && gymReqd(m) ? 1 : 0, [[0, '아직 안 함'], [1, '요청함']]) + ` <button class="abtn ghost sm" data-gadm="reqClear" data-v="1" style="margin-left:6px">내 요청 모두 지우기</button>`, m && !gymJoined(m) ? '기록이 없으면 «요청함»으로 안 바뀌어요(위에서 기록 먼저) · 3곳이 차 있어도 안 바뀌어요' : '입점 전 헬스장이 내 헬스장일 때만')}
    ${row('다른 사람 요청 수(내 헬스장)', gs('wait', m ? gymOthers(m) : '', [[0, '0명'], [2, '2명'], [4, '4명'], [11, '11명']]), '내 요청은 따로 +1')}
    ${row('그중 최근 2주 기록자(다른 사람)', gs('recent', m ? gymRecentOthers(m) : '', [[0, '0명'], [2, '2명'], [3, '3명'], [8, '8명']]), m ? `자동 판정 «5명 모임» = 요청 ${GYM_NEED}명 이상 + 그중 최근 2주에 이 헬스장에서 기록한 사람 ${GYM_NEED_RECENT}명 이상 · 지금 요청 ${gymWait(m)}명 · 최근 2주 ${gymRecent(m)}명(내 기록 ${gymReqd(m) && gymMeRecent(m) ? '+1' : '0'}) → ${ready ? '기준 넘음(발송 대기 목록)' : '기준 미달(칸 1에 머묾)'} · 다른 사람 요청 수보다 크게는 안 들어가요` : '')}
    ${row('안내문 우편(흉내 · 실제 발송 없음)', gs('mail', mailCur, [['none', '접수 전'], ['sent', '이번 주 묶음 우편 접수됨'], ['due', `도착 예정일 지남(영업일 ${GYM_MAIL_BIZ}일)`]]), `사람이 누르는 «전달함»은 없어졌어요 · 실서비스는 주 1회 묶음 접수 때 자동으로 칸 3, 접수 다음 날부터 영업일 ${GYM_MAIL_BIZ}일 뒤 자동으로 칸 4${m && !sim.mail[m.id] && !ready ? ' · <b>아직 기준 미달이라 눌러도 접수되지 않아요</b>' : ''}`)}
    ${row('사장님 쪽 내부 기록', gs('owner', m ? (sim.owner[m.id] || 'none') : 'none', [['none', '없음'], ['open', '열람(QR·주소 접속)'], ['reject', '거절'], ['optout', '우편 그만 받기']]), '회원 화면에는 보이지 않아요 · 열람해도 «사장님이 확인했어요»를 띄우지 않고, 거절·그만 받기여도 «답 기다리는 중»까지만')}
    ${row('입점(내 헬스장)', gs('stage', m && sim.stage[m.id] === 'join' ? 'join' : 'auto', [['auto', '입점 전'], ['join', '입점 성사']]), '«입점 성사»는 알림 + 요청자에게 한정 꾸미기 1개 · 입점하면 요청 3곳 중 한 자리가 비어요')}
    ${row('가입 시점', gs('join', days < GYM_QUIET_DAYS ? 0 : 1, [[0, '오늘 가입(첫 7일)'], [1, '가입 8일째']]), '첫 7일·첫 3회 기록까지는 결과 화면에 입점 안내·요청 버튼을 안 띄워요')}
    ${row('사장님용 안내 페이지', `<a class="abtn ghost sm" href="${ownerUrl}" target="_blank" rel="noopener" id="ownerLink" style="text-decoration:none">시안 열기 (새 창)</a>`, '헬스장마다 주소 1개 · 이름 없이 숫자만 · 비용·조건 칸은 [형 입력] · 입점 신청(확인 코드·동의 2개)·채팅·우편 그만 받기는 시안(실제 접수·발송 없음)')}
    ${row('사장님 안내문(우편 A4 한 장)', `<a class="abtn ghost sm" href="${letterUrl}" target="_blank" rel="noopener" id="letterLink" style="text-decoration:none">시안 열기 (새 창)</a>`, 'QR·짧은 주소·확인 코드 자리 포함 · 문의 창구는 [형 입력] · 실제 우편 발송 없음')}`)}
  ${sec('센터 기구 기반 코칭 — 시험용 센터 2곳 (기구 목록에서 골라 배정하는 방식)', `
    ${row('오늘 입장한 센터', gs('entry', entry, [['니짐 신림점', '니짐 신림점'], ['니짐 봉천점', '니짐 봉천점'], ['none', '입장 기록 없음']]), '코치는 «입장»한 입점센터의 기구만 봐요 · 입점 안 된 헬스장·집·야외는 내 기록만')}
    ${centers.map(c => { const r = centerRow(c), n = r.machine_ids.length, cur = !n ? 0 : n === MACHINES.length ? 2 : 1;
      return row(`${c} 보유 기구`, gs('equip:' + c, cur, [[1, '배정됨'], [2, `기구 많은 센터(${MACHINES.length}종)`], [0, '비어 있음']]), c === '니짐 봉천점' ? '«비어 있음 → 배정됨»으로 바꾸면 기구 정보를 요청한 회원에게 알림이 가요' : '보유 기구가 비어 있으면 «기구 정보 없는 센터»로 보여요'); }).join('')}
    ${row('다른 사람 기구 정보 요청 수', gs('eqWait', eqOthers('니짐 봉천점'), [[0, '0명'], [3, '3명'], [8, '8명']]), `니짐 봉천점 · 내 요청 ${S.eqReq['니짐 봉천점'] ? '있음(+1)' : '없음'} <button class="abtn ghost sm" data-gadm="eqClear" data-v="1" style="margin-left:6px">내 요청 지우기</button>`)}
    ${centers.map(c => { const i = centerInfo(c), r = centerRow(c); if (!i) return `<div class="gyeq"><b>${c}</b> <span class="amut">보유 기구 0종 (machine_ids 비어 있음)</span><div class="gyeqask">센터 관리자 화면에 보일 자리(시안): <b>회원 ${eqWaitN(c)}명이 기구 정보를 요청했어요</b> · [기구 배정하기]</div></div>`;
      const total = i.machines.reduce((a, m) => a + (+i.counts[m.id] || 1), 0);
      return `<div class="gyeq"><b>${c}</b> <span class="amut">기구 ${i.machines.length}종 · 모두 ${total}대 · ${MACHINE_TYPES.map(t => `${t} ${i.machines.filter(m => m.type === t).length}`).join(' · ')} · 이 센터에서 할 수 있는 운동 ${EX_DICT.filter(e => e.cat !== 'lesson' && exOkAt(e.id, i.kinds)).length}/87종</span>
        <div class="gyeqchips">${i.machines.map(m => `<span${i.unread.includes(m) ? ' class="un"' : ''}>${esc(m.name)}${i.counts[m.id] > 1 ? ` ×${i.counts[m.id]}` : ''}</span>`).join('')}</div>
        <div class="amut" style="margin-top:6px">회색 줄 그은 ${i.unread.length}종은 이름만으로 어떤 운동 기구인지 가려내지 못해 코치가 쓰지 않아요${i.implied.length ? ` · 벤치·랙이 있어 ${i.implied.map(k => EQ_NAME[k]).join('·')}${i.implied.length ? '은(는)' : ''} 있는 것으로 봤어요` : ''}</div></div>`; }).join('')}`)}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gadm]'); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation(); ensureGym();
  const k = b.dataset.gadm, v = b.dataset.v, g = S.gym, sim = S.gymSim, m0 = myGym();
  const pushNote = n => { S.gymNotes = S.gymNotes.filter(x => x.t !== n.t); S.gymNotes.push(n); };
  const wasReady = !!m0 && gymReqd(m0) && gymReady(m0), wasId = m0 && m0.id;
  if (k === 'who') {
    if (v === 'none') Object.assign(g, { kind: null, id: null, name: '', area: '' });
    else if (v === 'home') Object.assign(g, { kind: 'home', id: null, name: '', area: '' });
    else { const x = GYM_DIR.find(q => q.id === v); Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area }); }
    Object.assign(g, { by: 'pick', setAt: Date.now(), pickAt: Date.now(), moved: null, item: false, itemOn: false }); S.gymNotes = [];
  } else if (k === 'ms') msSet(v);
  else if (k === 'rec') gymSimRec(v);
  else if (k === 'req') { if (m0 && !gymJoined(m0)) { if (+v) gymRequest(m0.id); else delete S.gymReqs[m0.id]; } }
  else if (k === 'reqClear') S.gymReqs = {};
  else if (k === 'wait') { if (m0) sim.wait[m0.id] = +v; }
  else if (k === 'recent') { if (m0) sim.recent[m0.id] = +v; }
  else if (k === 'mail') { if (m0 && !m0.linked) {   // 우편 접수는 기준(5명 + 최근 2주 3명)을 넘은 헬스장만
    if (v === 'none') delete sim.mail[m0.id];
    else if (sim.mail[m0.id] || gymReady(m0)) sim.mail[m0.id] = { at: Date.now() - (v === 'due' ? 12 : 0) * DAY_MS }; } }
  else if (k === 'owner') { if (m0) { if (v === 'none') delete sim.owner[m0.id]; else sim.owner[m0.id] = v; } }
  else if (k === 'stage') { if (m0 && !m0.linked) {
    const item = gymReqd(m0);
    if (v === 'join') { sim.stage[m0.id] = 'join'; if (item) { g.item = true; g.itemOn = true; } pushNote({ t: 'join', name: m0.name, item }); }
    else { delete sim.stage[m0.id]; g.item = false; g.itemOn = false; S.gymNotes = S.gymNotes.filter(x => x.t !== 'join');
      if (v !== 'auto') { if (gymOthers(m0) < GYM_NEED) sim.wait[m0.id] = GYM_NEED;   // 앞 판 검증 스크립트용(sent·wait·reject) — 화면 버튼은 없다
        sim.mail[m0.id] = { at: Date.now() - (v === 'sent' ? 0 : 12) * DAY_MS }; if (v === 'reject') sim.owner[m0.id] = 'reject'; else delete sim.owner[m0.id]; } } } }
  else if (k === 'join') S.joinAt = Date.now() - (+v ? 8 : 0) * DAY_MS;
  else if (k === 'entry') { if (v === 'none') S.entryDemo = false; else { S.entryDemo = true; S.entryCenter = v; } }
  else if (k.startsWith('equip:')) { const c = k.slice(6), was = !!centerEquip(c); sim.equip[c] = +v; if (!was && +v && S.eqReq[c]) pushNote({ t: 'eq', name: c }); }
  else if (k === 'eqWait') sim.eqWait['니짐 봉천점'] = +v;
  else if (k === 'eqClear') S.eqReq = {};
  { const m1 = myGym();   // «5명 모임» 알림: 기준(요청 5명 + 최근 2주 3명)을 막 넘었을 때 요청자에게 한 번
    if (m1 && m1.id === wasId && !wasReady && gymReqd(m1) && gymReady(m1) && !sim.mail[m1.id] && !gymJoined(m1)) pushNote({ t: 'five', name: m1.name });
    else if (m1 && !(gymReqd(m1) && gymReady(m1))) S.gymNotes = S.gymNotes.filter(x => x.t !== 'five'); }
  save();
  if (typeof rerender === 'function') rerender();
}, true);
