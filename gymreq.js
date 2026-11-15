'use strict';
/* v1.51 (형 11-15 확정) — ① «우리 헬스장 입점 요청» 장치 ② 센터 기구 기반 코칭 ③ 관리자 시연 스위치
   app.js 보다 먼저 읽는다(함수·자료만 정의 — S·esc·toast 같은 app.js 것은 부를 때만 쓴다).
   경험치 계산(engine.js)은 건드리지 않는다. 여기는 «누구에게 무엇을 보여 줄지»만 정한다.
   실서비스 자리: GYM_DIR = 헬스장 검색(공공 인허가 자료·지도 검색) · 요청 수 = 서버 집계 · CENTER_EQUIP = 센터 기구 표시 기능의 자료 */

/* ===== 자료 ===== */
/* 헬스장 찾기 목록(가짜). linked = 니짐 입점 · wait = 나 말고 입점을 요청한 사람 수(운동 1회 이상 기록한 계정만) */
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
const GYM_NEED = 5;            // 이 인원이 모이면 니짐이 사장님께 연락
const GYM_CHANGE_DAYS = 30;    // 내 헬스장 바꾸기 = 30일에 1번
const GYM_QUIET_DAYS = 7, GYM_QUIET_RECS = 3;   // 가입 후 첫 7일·첫 3회 기록까지는 «입점 헬스장이었다면 +○○» 비교를 안 띄움
const GYM_ITEM = '개척자 배지';   // 입점 성사 때 요청자 전원에게 주는 한정 꾸미기(경험치 보상 없음 — 형 확정)
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
/* 시험판 가짜 센터 2곳 — 신림점 = 기구 정보 있음 · 봉천점 = 없음(관리자 스위치로 «등록됨»으로 바꾸면 아래 목록을 쓴다) */
const CENTER_EQUIP = {
  '니짐 신림점': ['treadmill', 'bike_up', 'elliptical', 'stepmill', 'm_chest_press', 'm_pec_deck', 'm_lat_pulldown', 'm_seated_row', 'm_assist', 'm_back_ext', 'm_leg_press', 'm_leg_ext', 'm_leg_curl', 'm_hip_abd', 'm_hip_add', 'm_crunch',
    'smith', 'cable', 'barbell', 'rack', 'bench_press', 'bench', 'dumbbell', 'kettlebell', 'pullup_bar', 'dip_bar'],
  '니짐 봉천점': ['treadmill', 'bike_up', 'spin', 'rower', 'm_chest_press', 'm_shoulder', 'm_lat_pulldown', 'm_leg_press', 'm_leg_ext', 'm_leg_curl', 'smith', 'cable', 'bench', 'dumbbell', 'pullup_bar'],
};
const CENTER_EQUIP_ON = { '니짐 신림점': true, '니짐 봉천점': false, '니짐 서울대입구점': false };
const EQ_WAIT_BASE = { '니짐 봉천점': 3 };   // 나 말고 기구 정보를 요청한 사람 수(가짜)

/* ===== 상태 ===== */
function ensureGym() {
  const ok = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const fill = (o, d) => { Object.keys(d).forEach(k => { if (o[k] === undefined) o[k] = d[k]; }); return o; };   // 같은 묶음을 그대로 채운다(새로 만들면 먼저 잡아 둔 참조가 옛것이 된다)
  S.gym = fill(ok(S.gym) ? S.gym : {}, { kind: null, id: null, name: '', area: '', custom: false, setAt: null, prevId: null, changedAt: null, req: null, step: 'ask', q: '', manual: false, flow: null, item: false, itemOn: false });
  S.gymSim = fill(ok(S.gymSim) ? S.gymSim : {}, { wait: {}, stage: {}, equip: {}, eqWait: {}, noRec: false });
  ['wait', 'stage', 'equip', 'eqWait'].forEach(k => { if (!ok(S.gymSim[k])) S.gymSim[k] = {}; });
  if (!ok(S.eqReq)) S.eqReq = {};
  if (!Array.isArray(S.gymNotes)) S.gymNotes = [];
  if (typeof S.joinAt !== 'number') S.joinAt = Date.now() - 30 * DAY_MS;   // 이 판 전부터 쓰던 저장본 = 가입한 지 오래된 계정으로 본다
  if (typeof S.entryCenter !== 'string' || !GYM_DIR.some(g => g.name === S.entryCenter)) S.entryCenter = '니짐 신림점';
  if (S.gym.kind !== 'gym' && S.gym.kind !== 'home') S.gym.kind = null;
  if (S.gym.kind === 'gym' && (!S.gym.id || typeof S.gym.name !== 'string' || !S.gym.name)) { S.gym.kind = null; S.gym.req = null; }
  if (S.gym.kind !== 'gym') S.gym.req = null;
  return S.gym;
}
const gjo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return c >= 0 && c <= 11171 ? (c % 28 ? a : b) : (/[013678]$/.test(String(w)) ? a : /[2459]$/.test(String(w)) ? b : a); };   // 받침 있으면 a · 숫자는 읽는 소리대로
const gymDirAll = () => { const g = S.gym; return g && g.custom && g.id && g.kind === 'gym' ? [...GYM_DIR, { id: g.id, name: g.name, area: g.area, wait: 0, custom: true }] : GYM_DIR; };
const gymById = id => gymDirAll().find(x => x.id === id) || null;
const gymJoined = g => !!g && (!!g.linked || S.gymSim.stage[g.id] === 'join');
const myGym = () => { const g = ensureGym(); return g.kind === 'gym' ? (gymById(g.id) || { id: g.id, name: g.name, area: g.area, wait: 0 }) : null; };
const gymUser = () => ensureGym().kind;           // 'gym' · 'home'(집·야외 — 입점 이야기를 아예 안 한다) · null(아직 안 고름)
const gymQuiet = () => gymUser() === 'home';
const gymCounted = () => !S.gymSim.noRec && realRecs().length >= 1;   // 요청 수에는 «운동을 1번 이상 기록한 계정»만
const gymOthers = g => Math.max(0, S.gymSim.wait[g.id] ?? g.wait ?? 0);
const gymReqd = g => !!(g && S.gym.kind === 'gym' && S.gym.req && S.gym.id === g.id);
const gymWait = g => gymOthers(g) + (gymReqd(g) && gymCounted() ? 1 : 0);
/* 진행 5칸: 1 요청 접수 → 2 5명 모임 → 3 사장님께 전달 → 4 답 기다리는 중 → 5 입점. 거절돼도 회원 화면은 4에서 멈춘다 */
function gymStage(g) {
  if (gymJoined(g)) return 5; if (!gymReqd(g)) return 0;
  const s = S.gymSim.stage[g.id]; if (s === 'wait' || s === 'reject') return 4; if (s === 'sent') return 3;
  return gymWait(g) >= GYM_NEED ? 2 : 1;
}
const gymFirstWeek = () => { ensureGym(); return Date.now() - S.joinAt < GYM_QUIET_DAYS * DAY_MS || realRecs().length <= GYM_QUIET_RECS; };
const gymChangeLeft = () => { const g = S.gym; return g.changedAt ? Math.max(0, Math.ceil((g.changedAt + GYM_CHANGE_DAYS * DAY_MS - Date.now()) / DAY_MS)) : 0; };
/* 장소 목록 = 기존 PLACES + (입점 성사 반영) + 내 헬스장(목록에 없으면 맨 위) */
function placesNow() {
  ensureGym();
  const list = PLACES.map(p => ({ ...p, linked: p.linked || S.gymSim.stage[p.id] === 'join' })), m = myGym();
  if (m && !list.some(p => p.id === m.id)) list.unshift({ id: m.id, name: m.name, kind: 'center', linked: gymJoined(m), dist: '내 헬스장' });
  return list;
}
const placeFind = q => { q = q.trim(); return placesNow().filter(p => !q || p.name.includes(q)); };

/* ===== 내 헬스장 등록·요청 ===== */
function gymRegister(x) {   // x = { id, name, area, custom } · 30일 제한에 걸리면 false
  const g = ensureGym();
  if (g.kind === 'gym' && g.id === x.id) return true;
  if (g.prevId && g.prevId !== x.id) { const left = gymChangeLeft(); if (left > 0) { gymBlockSheet(left); return false; } g.changedAt = Date.now(); }
  Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area || '', custom: !!x.custom, setAt: Date.now(), prevId: x.id, req: null });
  return true;
}
function gymBlockSheet(left) {
  const d = new Date(S.gym.changedAt + GYM_CHANGE_DAYS * DAY_MS);
  sheet(`<div class="h2" id="gyBlockT">내 헬스장은 30일에 한 번 바꿀 수 있어요</div><div class="muted gysub">${d.getMonth() + 1}월 ${d.getDate()}일부터 다시 바꿀 수 있어요 (${left}일 남음)</div><button class="btn" data-act="shClose" id="gyBlockOk">확인</button>`);
}
function gymRequest() { const g = ensureGym(), m = myGym(); if (!m || gymJoined(m)) return false; if (!g.req) g.req = { at: Date.now() }; return true; }
const gymShareBtn = (cls = 'btn ghost') => `<button class="${cls}" data-act="gyShare" id="gyShare">같은 헬스장 다니는 친구에게 보내기</button>`;
function gymSentHTML() {
  const m = myGym(), n = gymWait(m);
  return `<div class="gydone" id="gySent"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2">요청을 남겼어요</div>
  <div class="gyline"><b>${esc(m.name)}</b><span>지금 ${n}명이 기다리고 있어요</span></div>
  <div class="muted gysub">${GYM_NEED}명이 요청하면 저희가 사장님께 연락드려요. 입점하면 바로 알려 드릴게요.${gymCounted() ? '' : '<br>아직 내 요청은 이 숫자에 안 들어갔어요. 운동을 한 번 기록하면 바로 들어가요.'}</div>${gymShareBtn()}</div>`;
}
function gymShare() {
  const m = myGym(); if (!m) return;
  const url = `${location.origin}${location.pathname}?gym=${encodeURIComponent(m.id)}`, text = `나 니짐내짐 앱에 ${m.name} 입점 요청했어. 너도 같이 눌러 줘!`;
  const copy = () => (typeof NJ_copyText === 'function' ? NJ_copyText(`${text} ${url}`) : Promise.resolve(false)).then(ok => toast(ok ? '보낼 글과 링크를 복사했어요 · 친구에게 붙여 넣어 보내 주세요' : '복사하지 못했어요 · 친구에게 헬스장 이름을 직접 알려 주세요'));
  if (navigator.share) navigator.share({ title: '니짐내짐', text, url }).catch(() => {}); else copy();
}

/* ===== 처음 설정 2/3 · 내 헬스장 고르기(같은 화면을 설정에서도 쓴다) ===== */
const GY_ICO = { gym: '<svg viewBox="0 0 24 24"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>', home: '<svg viewBox="0 0 24 24"><path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/></svg>' };
const gymFind = q => { q = String(q || '').replace(/\s/g, ''); return GYM_DIR.filter(g => !q || (g.name + g.area).replace(/\s/g, '').includes(q)); };
const gymFindHTML = list => list.length ? list.map(g => `<button class="prow tap" data-act="gyPick" data-v="${g.id}"><div><b>${esc(g.name)}</b><small>${gymJoined(g) ? '<span class="cbtag">1.5배</span>' : ''}${esc(g.area)}</small></div><span class="muted">선택</span></button>`).join('')
  : `<div class="muted" style="padding:12px 0" id="gyNone">검색 결과가 없어요. 아래에서 헬스장 이름을 직접 적어 주세요.</div>`;
function vGymFlow() {
  const g = ensureGym(), onb = !S.onboarded, top = onb ? obProg(2) : '';
  const wrap = body => `${onb ? '' : subHead('내 헬스장', g.flow === 'settings' ? 'settings' : '')}<div class="sec gyflow">${top}${body}</div>`;
  const reqNote = g.kind === 'gym' && g.req ? `<div class="notice" id="gyLoseNote"><span>헬스장을 바꾸면 ${esc(g.name)}에 남긴 입점 요청은 취소돼요</span></div>` : '';
  if (g.step === 'ask') return wrap(`<div class="h2">주로 어디서 운동하세요?</div><div class="muted" style="margin-bottom:12px">나중에 설정에서 바꿀 수 있어요.</div>${reqNote}
    <div class="grid2 placekind" id="gyAsk"><button class="pk" data-act="gyKind" data-v="gym" id="gyKindGym">${GY_ICO.gym}<b>헬스장</b><small>헬스·PT·필라테스</small></button>
    <button class="pk" data-act="gyKind" data-v="home" id="gyKindHome">${GY_ICO.home}<b>집·야외</b><small>홈트·걷기·달리기</small></button></div>`);
  if (g.step === 'find') return wrap(`<div class="h2">다니는 헬스장을 찾아 주세요</div><div class="muted" style="margin-bottom:12px">헬스장은 한 곳만 등록할 수 있어요.</div>${reqNote}
    <div class="card"><div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input id="gymQ" placeholder="헬스장 이름이나 동네" value="${esc(g.q || '')}" autocomplete="off"></div>
    <div id="gymList">${gymFindHTML(gymFind(g.q))}</div></div>
    ${g.manual ? `<div class="card" id="gyManual"><div class="h3" style="margin-top:0">직접 적기</div><input class="gyin" id="gyName" placeholder="헬스장 이름" maxlength="30" autocomplete="off"><input class="gyin" id="gyArea" placeholder="동네 (예: 신림동)" maxlength="12" autocomplete="off"><button class="btn" data-act="gyManualOk" id="gyManualOk">이 헬스장으로 등록</button></div>`
      : `<button class="btn ghost" data-act="gyManual" id="gyManualBtn">찾는 헬스장이 없어요 · 직접 적기</button>`}
    <button class="linkbtn gyback" data-act="gyStep" data-v="ask">‹ 이전</button>`);
  const m = myGym(), next = `<button class="btn ${g.step === 'sent' ? '' : 'ghost'}" data-act="gyNext" id="gyNext">${onb ? '다음' : '확인'}</button>`;
  if (!m) { g.step = 'ask'; return vGymFlow(); }
  if (g.step === 'sent') return wrap(`${gymSentHTML()}${next}`);
  if (gymJoined(m)) return wrap(`<div class="gydone" id="gyRes"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2">여기는 경험치 1.5배 헬스장이에요</div>
    <div class="gyline"><b>${esc(m.name)}</b></div><div class="muted gysub">앱에서 '입장하기'를 누르고 운동하면 경험치를 1.5배로 받아요.</div></div><button class="btn" data-act="gyNext" id="gyNext">${onb ? '다음' : '확인'}</button>`);
  const n = gymWait(m);
  return wrap(`<div class="gydone" id="gyRes"><div class="h2 gyname">${esc(m.name)}${gjo(m.name, '은', '는')} 아직 입점 전이에요</div>
    <div class="muted gysub">니짐내짐에 입점하면 여기서 운동할 때 경험치를 더 받아요.${n ? `<br>지금 ${n}명이 입점을 기다리고 있어요.` : ''}</div></div>
    <button class="btn" data-act="gyReq" data-v="flow" id="gyReqBtn">입점 요청하기</button><button class="btn ghost" data-act="gyNext" id="gyLater" style="margin-top:8px">다음에</button>`);
}

/* ===== 운동기록 탭 «내 헬스장» 카드 ===== */
function gymStepsHTML(st) {
  return `<div class="gysteps" id="gySteps" aria-label="5단계 중 ${st}단계">${GYM_STEPS.map(([a, b], i) => `<div class="${i < st ? 'on' : ''}${i === st - 1 ? ' cur' : ''}"><i>${i < st ? '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg>' : i + 1}</i><span>${a}${b ? `<br>${b}` : ''}</span></div>`).join('')}</div>`;
}
function gymCard() {
  const g = ensureGym();
  if (g.kind === 'home') return '';
  if (!g.kind) return `<div class="card gycard" id="gymCard"><div class="gyq">주로 어디서 운동하세요?</div><div class="muted">한 번만 알려 주세요. 나중에 설정에서 바꿀 수 있어요.</div>
    <div class="grid2 gyask"><button class="btn sm ghost" data-act="gyKind" data-v="gym" id="gyCardGym">헬스장</button><button class="btn sm ghost" data-act="gyKind" data-v="home" id="gyCardHome">집·야외</button></div></div>`;
  const m = myGym(), st = gymStage(m), n = gymWait(m), nm = esc(m.name);
  const head = `<div class="gyh"><div><small>내 헬스장</small><b id="gyName1">${nm}</b></div><button class="linkbtn" data-act="gyChange" id="gyChange">바꾸기</button></div>`;
  if (st === 5 && !g.req) return `<div class="card gycard" id="gymCard" data-st="in">${head}<div class="gymsg on">경험치 1.5배 헬스장이에요</div><div class="muted">앱에서 '입장하기'를 누르고 운동하면 돼요</div></div>`;
  if (st === 0) return `<div class="card gycard" id="gymCard" data-st="0">${head}<div class="gymsg">아직 입점 전이에요</div><div class="muted">니짐내짐에 입점하면 여기서 운동할 때 경험치를 더 받아요${n ? ` · 지금 ${n}명이 기다리고 있어요` : ''}</div>
    <button class="btn" data-act="gyReq" data-v="card" id="gyReqBtn">입점 요청하기</button></div>`;
  const msg = [null,
    [`지금 ${n}명이 기다리고 있어요`, gymCounted() ? `${GYM_NEED}명이 요청하면 저희가 사장님께 연락드려요` : '내 요청은 운동을 한 번 기록하면 이 숫자에 들어가요'],
    [`${n}명이 모였어요`, '저희가 곧 사장님께 연락드릴게요'],
    ['사장님께 요청을 전달했어요', '답변 오면 바로 알려 드릴게요'],
    ['사장님 답을 기다리고 있어요', '소식이 오면 바로 알려 드릴게요'],
    [`${nm}${gjo(m.name, '이', '가')} 입점했어요!`, `오늘부터 경험치 1.5배예요${g.item ? ` · 요청해 주셔서 «${GYM_ITEM}»를 드렸어요` : ''}`]][st];
  return `<div class="card gycard" id="gymCard" data-st="${st}">${head}${gymStepsHTML(st)}<div class="gymsg ${st === 5 ? 'on' : ''}" id="gyMsg">${msg[0]}</div><div class="muted" id="gyMsg2">${msg[1]}</div>${st < 5 ? gymShareBtn('btn ghost sm gyshare') : ''}</div>`;
}
const gymPill = () => { const g = ensureGym(); return g.item && g.itemOn ? `<span class="pill gypill">${GYM_ITEM}</span>` : ''; };

/* ===== 장소 고르는 화면 — «아직 입점 전» 줄 ===== */
function gymPlaceRow(p) {
  const pick = `<span class="muted">선택</span>`;
  if (gymQuiet()) return `<button class="prow tap plc" data-act="place" data-v="${esc(p.name)}"><div><b>${esc(p.name)}</b><small>${p.dist}</small></div>${pick}</button>`;
  const g = gymById(p.id) || { id: p.id, name: p.name, wait: 0 }, mine = gymReqd(g);
  return `<div class="prow plc gyrow" data-gym="${esc(p.id)}"><button class="tap gymain" data-act="place" data-v="${esc(p.name)}"><b>${esc(p.name)}</b><small>${p.dist} · 아직 입점 전${mine ? ` · ${gymWait(g)}명이 기다리는 중` : ''}</small></button>
    ${mine ? '<span class="gydid">요청함</span>' : `<button class="btn sm ghost gyreq" data-act="gyReqAsk" data-v="${esc(p.id)}">입점 요청하기</button>`}</div>`;
}
function gymReqAsk(id) {
  const g = ensureGym(), x = gymById(id) || (() => { const p = PLACES.find(q => q.id === id); return p ? { id: p.id, name: p.name, area: '', wait: 0 } : null; })(); if (!x) return;
  if (g.kind === 'gym' && g.id === id) { gymRequest(); save(); render(); return sheet(`${gymSentHTML()}<button class="btn" data-act="shClose" id="gySheetOk" style="margin-top:8px">확인</button>`); }
  if (g.kind === 'gym') return sheet(`<div class="h2" id="gyOneT">입점 요청은 내 헬스장 한 곳에만 남길 수 있어요</div><div class="muted gysub">지금 내 헬스장은 <b>${esc(g.name)}</b>${gjo(g.name, '이에요', '예요')}. 내 헬스장을 바꾸면 여기에 요청할 수 있어요.</div>
    <button class="btn" data-act="gyRegReq" data-v="${esc(id)}" id="gyOneChange">${esc(x.name)}${gjo(x.name, '으로', '로')} 바꾸고 요청하기</button><button class="btn ghost" data-act="shClose" style="margin-top:8px">닫기</button>`);
  sheet(`<div class="h2 gyname" id="gyRegT">${esc(x.name)}${gjo(x.name, '을', '를')} 내 헬스장으로 등록하고 입점을 요청할까요?</div><div class="muted gysub">헬스장은 한 곳만 등록할 수 있어요. 등록한 헬스장은 30일에 한 번 바꿀 수 있어요.</div>
    <button class="btn" data-act="gyRegReq" data-v="${esc(id)}" id="gyRegOk">입점 요청하기</button><button class="btn ghost" data-act="shClose" style="margin-top:8px">다음에</button>`);
}

/* ===== 운동 결과 화면 — 못 받은 숫자 자리 ===== */
function gymResultCard(rec) {
  if (!rec || rec.demo || vk(rec.v) !== 'self' || gymQuiet()) return '';
  const m = myGym(), first = gymFirstWeek();
  if (m && !gymJoined(m)) {   // 입점 전 헬스장에 다니는 사람 — 숫자 대신 요청·기다리는 사람 수
    const n = gymWait(m), nm = esc(m.name);
    if (gymReqd(m)) return `<div class="cbif gyres" id="gymResCard"><span><b class="gynm">${nm}</b> · 지금 ${n}명이 입점을 기다리고 있어요</span><button class="linkbtn" data-act="gyShare">친구에게 보내기 ›</button></div>`;
    if (first) return '';
    return `<div class="cbif gyres" id="gymResCard"><span><b class="gynm">${nm}</b>${gjo(m.name, '이', '가')} 입점하면 운동할 때마다 경험치를 더 받아요${n ? `<small>지금 ${n}명이 기다리고 있어요</small>` : ''}</span><button class="btn sm" data-act="gyReq" data-v="result" id="gyResReq">입점 요청하기</button></div>`;
  }
  if (first || !(rec.centerIf > 0)) return '';
  const p = placesNow().find(x => x.name === placeBase(rec.place)), num = fmt(rec.centerIf);
  if (p && p.linked) return `<div class="cbif" id="cbIf"><span>다음엔 '입장하기'를 누르고 운동해 보세요 · 오늘이었다면 경험치 <b>${num}</b>${gjo(num, '을', '를')} 더 받았어요</span></div>`;
  return `<div class="cbif" id="cbIf"><span>입점 헬스장에서 운동했다면 경험치 <b>${num}</b>${gjo(num, '을', '를')} 더 받았을 거예요</span><button class="linkbtn cfind" data-act="findCenter" id="cbIfFind">가까운 입점 헬스장 보기 ›</button></div>`;
}
/* 설정 › 센터 확인 카드 안 «주로 운동하는 곳» 줄 */
function gymSettingsRow() {
  const g = ensureGym();
  return `<div class="row" id="gySetRow"><div><span>주로 운동하는 곳</span><div class="muted">${g.kind === 'gym' ? `헬스장 · ${esc(g.name)}` : g.kind === 'home' ? '집·야외' : '아직 안 골랐어요'}</div></div><button class="btn sm ghost" data-act="gyChange" data-v="settings" id="gySetBtn">${g.kind ? '바꾸기' : '고르기'}</button></div>`;
}

/* ===== 센터 기구 기반 코칭 ===== */
function centerEquip(name) { ensureGym(); const on = S.gymSim.equip[name] ?? CENTER_EQUIP_ON[name] ?? false; return on ? new Set(CENTER_EQUIP[name] || CENTER_EQUIP['니짐 봉천점']) : null; }
/* 지금 «입장»해 있는 입점센터 기준. 운동 중이면 그 운동의 센터(입장·레슨일 때만), 아니면 오늘 입장 기록 */
function eqCtx(sess) {
  ensureGym();
  const s = sess === undefined ? S.session : sess;
  const name = s ? ((s.verify === 'V1' || s.verify === 'V3') && s.place && s.place.kind === 'center' ? placeBase(s.place.name) : null) : (S.entryDemo ? S.entryCenter : null);
  const p = name && placesNow().find(x => x.name === name);
  if (!p || !p.linked) return { mode: 'none' };
  const has = centerEquip(name);
  return has ? { mode: 'equip', center: name, has } : { mode: 'noequip', center: name };
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
const eqOthers = c => Math.max(0, S.gymSim.eqWait[c] ?? EQ_WAIT_BASE[c] ?? 0);
const eqWaitN = c => eqOthers(c) + (S.eqReq[c] ? 1 : 0);
function eqCoachCard() {
  const c = eqCtx();
  if (c.mode === 'equip') return `<div class="eqline" id="eqLine"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg><span><b>${esc(c.center)}</b> 기구 기준으로 알려드려요</span></div>`;
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
  return [`${e.name} 대신 ${alt.map(id => EX[id].name).join('나 ').replace(/([가-힣A-Za-z)])나 /g, (m0, c) => c + (((c.charCodeAt(0) - 0xAC00) % 28 > 0 && c >= '가') ? '이나 ' : '나 '))} 어때?`, `둘 다 같은 ${e.part} 운동이야.`.replace('둘 다', alt.length > 1 ? '둘 다' : '이것도'), c.mode === 'equip' ? `${c.center}에 있는 기구로 할 수 있어.` : null];
}

/* ===== 알림(실제 앱에서는 푸시) — 입점 성사 · 5명 모임 · 센터가 기구 정보를 올림 ===== */
function gymNoteSheet() {
  ensureGym(); const n = S.gymNotes.shift(); if (!n) return; save();
  const ok = `<button class="btn" data-act="shClose" id="gyNoteOk" style="margin-top:14px">확인</button>`, push = `<div class="muted demoonly" style="margin-top:8px">실제 앱에서는 푸시 알림으로도 가요</div>`;
  if (n.t === 'join') sheet(`<div class="gydone" id="gyJoinNote"><div class="gychk"><svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7.5"/></svg></div><div class="h2 gyname">${esc(n.name)}${gjo(n.name, '이', '가')} 입점했어요!</div><div class="muted gysub">오늘부터 경험치 1.5배예요.${n.item ? `<br>입점을 요청해 주셔서 한정 꾸미기 아이템 «${GYM_ITEM}»를 드렸어요.` : ''}</div></div>${ok}${push}`);
  else if (n.t === 'five') sheet(`<div class="gydone" id="gyFiveNote"><div class="h2 gyname">${esc(n.name)} 입점 요청에 ${GYM_NEED}명이 모였어요</div><div class="muted gysub">저희가 사장님께 연락드릴게요. 답변 오면 바로 알려 드릴게요.</div></div>${ok}${push}`);
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
      if (v === 'home') { if (g.kind === 'gym') { g.req = null; g.id = null; g.name = ''; g.custom = false; } g.kind = 'home'; g.step = 'ask';
        if (!S.onboarded) return go('workout', 'onbPerm'); toast('집·야외로 정했어요'); return go('workout', g.flow === 'settings' ? 'settings' : null); }
      g.q = ''; g.manual = false; if (S.sub !== 'gym' && S.sub !== 'onbGym') g.flow = 'card'; return flowGo('find'); },
    gyStep: () => { S.gym.step = v; },
    gyPick: () => { const x = GYM_DIR.find(q => q.id === v); if (!x || !gymRegister(x)) return true; S.gym.step = 'res'; },
    gyManual: () => { S.gym.manual = true; },
    gyManualOk: () => { const nm = ($('gyName').value || '').trim().replace(/\s+/g, ' ').slice(0, 30), ar = ($('gyArea').value || '').trim().slice(0, 12);
      if (nm.length < 2) return toast('헬스장 이름을 적어 주세요'), true;
      const hit = GYM_DIR.find(q => q.name.replace(/\s/g, '') === nm.replace(/\s/g, ''));
      if (!gymRegister(hit || { id: 'my_' + Date.now().toString(36), name: nm, area: ar, custom: true })) return true; S.gym.step = 'res'; S.gym.manual = false; },
    gyReq: () => { if (!gymRequest()) return true;
      if (v === 'flow') { S.gym.step = 'sent'; return; }
      save(); render(); sheet(`${gymSentHTML()}<button class="btn" data-act="shClose" id="gySheetOk" style="margin-top:8px">확인</button>`); return true; },
    gyReqAsk: () => (gymReqAsk(v), true),
    gyRegReq: () => { const x = gymById(v) || PLACES.filter(p => p.id === v).map(p => ({ id: p.id, name: p.name, area: '' }))[0]; shClose(); if (!x || !gymRegister(x)) return true;
      gymRequest(); save(); render(); sheet(`${gymSentHTML()}<button class="btn" data-act="shClose" id="gySheetOk" style="margin-top:8px">확인</button>`); return true; },
    gyNext: () => { const g = S.gym; g.step = 'ask'; if (!S.onboarded) return go('workout', 'onbPerm'); return go('workout', g.flow === 'settings' ? 'settings' : null); },
    gyChange: () => { const g = ensureGym(); g.flow = v === 'settings' ? 'settings' : 'card'; g.q = ''; g.manual = false; return flowGo('ask'); },
    gyShare: () => (gymShare(), true),
    gyItem: () => { S.gym.itemOn = !S.gym.itemOn; },
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
function vH8() {
  ensureGym();
  const g = S.gym, m = myGym(), sim = S.gymSim;
  const gs = (key, cur, opts) => `<div class="aseg">${opts.map(([k, l]) => `<button class="${String(cur) === String(k) ? 'on' : ''}" data-gadm="${key}" data-v="${k}">${l}</button>`).join('')}</div>`;
  const row = (l, body, hint = '') => `<div class="afr gyafr"><span>${l}</span><div>${body}${hint ? `<em>${hint}</em>` : ''}</div></div>`;
  const who = !g.kind ? 'none' : g.kind === 'home' ? 'home' : g.id;
  const stageCur = m ? (sim.stage[m.id] || 'auto') : 'auto';
  const days = Math.floor((Date.now() - S.joinAt) / DAY_MS);
  const st = m ? gymStage(m) : 0;
  const now = !g.kind ? '아직 안 고름' : g.kind === 'home' ? '집·야외 (입점·기구 문구를 안 보여 줌)' : `${esc(g.name)} · ${gymJoined(m) ? '입점' : '입점 전'} · ${g.req ? `요청함 · 진행 ${st}/5칸 · 요청 ${gymWait(m)}명` : '요청 안 함'}`;
  const ownerUrl = m ? `owner.html?g=${encodeURIComponent(m.id)}&name=${encodeURIComponent(m.name)}&area=${encodeURIComponent(m.area || '')}&n=${gymWait(m)}` : 'owner.html';
  const centers = ['니짐 신림점', '니짐 봉천점'];
  const entry = S.entryDemo ? S.entryCenter : 'none';
  return `${sec('우리 헬스장 입점 요청 — 회원 앱 상태 바꿔 보기', `
    ${note(`지금 회원 앱: <b>${now}</b> · 여기서 바꾼 값은 바로 저장돼요. 왼쪽 아래 «회원 앱 시연으로»를 누르면 반영된 화면이 보여요.`)}
    ${row('회원이 고른 곳', gs('who', who, [['none', '아직 안 고름'], ['home', '집·야외'], ['green', '그린피트니스 신림역점(입점 전)'], ['long', '이름 긴 헬스장(입점 전)'], ['sillim', '니짐 신림점(입점)']]))}
    ${row('입점 요청', gs('req', g.req ? 1 : 0, [[0, '아직 안 함'], [1, '요청함']]), m && !gymJoined(m) ? '' : '입점 전 헬스장을 골랐을 때만')}
    ${row('다른 사람 요청 수', gs('wait', m ? gymOthers(m) : '', [[0, '0명'], [2, '2명'], [4, '4명'], [11, '11명']]), '내 요청은 따로 +1 (운동 기록 1번 이상일 때만)')}
    ${row('진행 단계', gs('stage', stageCur, [['auto', '인원대로'], ['sent', '사장님께 전달'], ['wait', '답 기다리는 중'], ['reject', '거절됨'], ['join', '입점 성사']]), '«거절됨»이어도 회원 화면엔 «답 기다리는 중»까지만 보여요 · «입점 성사»는 알림 + 요청자에게 한정 꾸미기 1개')}
    ${row('운동 기록 없는 계정', gs('noRec', sim.noRec ? 1 : 0, [[0, '기록 있음'], [1, '기록 0건으로 보기']]), '기록이 없으면 내 요청은 숫자에 안 들어가요')}
    ${row('가입 시점', gs('join', days < GYM_QUIET_DAYS ? 0 : 1, [[0, '오늘 가입(첫 7일)'], [1, '가입 8일째']]), '첫 7일·첫 3회 기록까지는 «입점 헬스장에서 운동했다면 +○○» 비교를 안 띄워요')}
    ${row('헬스장 바꾸기 제한', `<button class="abtn ghost sm" data-gadm="chg" data-v="1">30일 지난 걸로</button>`, g.changedAt ? `지금은 ${gymChangeLeft()}일 남음` : '지금은 바꿀 수 있는 상태')}
    ${row('사장님용 안내 페이지', `<a class="abtn ghost sm" href="${ownerUrl}" target="_blank" rel="noopener" id="ownerLink" style="text-decoration:none">시안 열기 (새 창)</a>`, '헬스장마다 주소 1개 · 이름 없이 숫자만 · 비용·조건 칸은 [형 입력]')}`)}
  ${sec('센터 기구 기반 코칭 — 가짜 센터 2곳', `
    ${row('오늘 입장한 센터', gs('entry', entry, [['니짐 신림점', '니짐 신림점'], ['니짐 봉천점', '니짐 봉천점'], ['none', '입장 기록 없음']]), '코치는 «입장»한 입점센터의 기구만 봐요 · 입점 안 된 헬스장·집·야외는 내 기록만')}
    ${centers.map(c => row(`${c} 기구 정보`, gs('equip:' + c, centerEquip(c) ? 1 : 0, [[1, '등록됨'], [0, '아직 없음']]), c === '니짐 봉천점' ? '«아직 없음 → 등록됨»으로 바꾸면 기구 정보를 요청한 회원에게 알림이 가요' : '')).join('')}
    ${row('다른 사람 기구 정보 요청 수', gs('eqWait', eqOthers('니짐 봉천점'), [[0, '0명'], [3, '3명'], [8, '8명']]), `니짐 봉천점 · 내 요청 ${S.eqReq['니짐 봉천점'] ? '있음(+1)' : '없음'} <button class="abtn ghost sm" data-gadm="eqClear" data-v="1" style="margin-left:6px">내 요청 지우기</button>`)}
    ${centers.map(c => { const has = centerEquip(c); return `<div class="gyeq"><b>${c}</b> ${has ? `<span class="amut">기구 ${has.size}종 · 이 센터에서 할 수 있는 운동 ${EX_DICT.filter(e => e.cat !== 'lesson' && exOkAt(e.id, has)).length}/87종</span><div class="gyeqchips">${EQUIP.filter(q => has.has(q[0])).map(q => `<span>${q[1]}</span>`).join('')}</div>` : `<span class="amut">기구 정보 없음</span><div class="gyeqask">센터 관리자 화면에 보일 자리(시안): <b>회원 ${eqWaitN(c)}명이 기구 정보를 요청했어요</b> · [기구 정보 등록하기]</div>`}</div>`; }).join('')}`)}`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gadm]'); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation(); ensureGym();
  const k = b.dataset.gadm, v = b.dataset.v, g = S.gym, sim = S.gymSim, m0 = myGym();
  const pushNote = n => { S.gymNotes = S.gymNotes.filter(x => x.t !== n.t); S.gymNotes.push(n); };
  if (k === 'who') {
    if (v === 'none') Object.assign(g, { kind: null, id: null, name: '', req: null, custom: false });
    else if (v === 'home') Object.assign(g, { kind: 'home', id: null, name: '', req: null, custom: false });
    else { const x = GYM_DIR.find(q => q.id === v); Object.assign(g, { kind: 'gym', id: x.id, name: x.name, area: x.area, custom: false, req: null, setAt: Date.now(), prevId: x.id, changedAt: null }); }
    g.item = false; g.itemOn = false; S.gymNotes = [];
  } else if (k === 'req') { if (m0 && !gymJoined(m0)) g.req = +v ? { at: Date.now() } : null; }
  else if (k === 'wait') { if (m0) { const was = gymWait(m0); sim.wait[m0.id] = +v; if (gymReqd(m0) && was < GYM_NEED && gymWait(m0) >= GYM_NEED) pushNote({ t: 'five', name: m0.name }); } }
  else if (k === 'stage') { if (m0 && !m0.linked) {
    if (v === 'auto') delete sim.stage[m0.id]; else { sim.stage[m0.id] = v; if (gymOthers(m0) < GYM_NEED) sim.wait[m0.id] = GYM_NEED; }
    if (v === 'join') { const item = !!g.req; if (item) { g.item = true; g.itemOn = true; } pushNote({ t: 'join', name: m0.name, item }); }
    else { g.item = false; g.itemOn = false; S.gymNotes = S.gymNotes.filter(x => x.t !== 'join'); } } }
  else if (k === 'noRec') sim.noRec = !!+v;
  else if (k === 'join') S.joinAt = Date.now() - (+v ? 8 : 0) * DAY_MS;
  else if (k === 'chg') g.changedAt = null;
  else if (k === 'entry') { if (v === 'none') S.entryDemo = false; else { S.entryDemo = true; S.entryCenter = v; } }
  else if (k.startsWith('equip:')) { const c = k.slice(6), was = !!centerEquip(c); sim.equip[c] = !!+v; if (!was && +v && S.eqReq[c]) pushNote({ t: 'eq', name: c }); }
  else if (k === 'eqWait') sim.eqWait['니짐 봉천점'] = +v;
  else if (k === 'eqClear') S.eqReq = {};
  save();
  if (typeof rerender === 'function') rerender();
}, true);
