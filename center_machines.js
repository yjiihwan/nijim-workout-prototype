'use strict';
/* v1.52 — 센터 기구 자료를 엔짐 홈페이지 «기구 찾기»와 같은 모양으로 맞춤(형 11-15).
   · MACHINES = 기구 목록(machines): id · name · type(5종) · body(부위, 쉼표로 최대 3개) · brand · series · image
   · CENTER_GYMS = 센터(gyms): machine_ids(그 센터가 가진 기구 id) · machine_counts(2대 이상인 기구만 { id: 수량 })
   · 센터 관리자는 MACHINES에서 골라 배정한다(글로 적지 않는다). machine_ids가 비어 있으면 «기구 정보 없는 센터».
   여기 자료는 같은 모양의 시험용 샘플이다(실제 센터 자료 아님 · 사진 없음). 실서비스에서 서비스 사이 연결은 이번 범위 밖.
   gymreq.js 보다 먼저 읽는다. */
const MACHINE_TYPES = ['프리웨이트', '케이블 머신', '핀 머신', '플레이트 머신', '유산소 머신'];
const MACHINE_BODY = ['전신', '가슴', '등', '어깨', '팔', '하체', '복근', '유산소'];
const MACHINE_BODY_MAX = 3;
const MACHINES = [
  /* [id, name, type, body, brand, series] */
  [2001, 'T-9000X', '유산소 머신', '유산소', 'Lexco', 'treadmill'],
  [2002, 'Run Artis', '유산소 머신', '유산소', 'Technogym', 'Artis Series'],
  [2003, 'Endurance ClimbMill', '유산소 머신', '유산소', 'Matrix', 'Climbmill'],
  [2004, 'Upright Bike Cycle', '유산소 머신', '유산소', 'etc', ''],
  [2005, 'Recumbent Bike Cycle', '유산소 머신', '유산소', 'etc', ''],
  [2006, 'Indoor Cycle Spin Bike', '유산소 머신', '유산소', 'Matrix', ''],
  [2007, 'Arc Trainer', '유산소 머신', '유산소', 'Cybex', ''],
  [2008, 'AMT 835 Elliptical', '유산소 머신', '유산소', 'Precor', ''],
  [2009, 'Air Rower', '유산소 머신', '유산소, 전신', 'Concept2', 'Model D'],
  [2010, 'Air Bike', '유산소 머신', '유산소, 전신', 'Assault', ''],
  [2011, 'SkiErg', '유산소 머신', '유산소, 전신', 'Concept2', ''],
  [2101, 'Chest Press', '핀 머신', '가슴', 'Life Fitness', 'Optima Series'],
  [2102, 'Incline Chest Press', '핀 머신', '가슴', 'Technogym', 'Selection 700'],
  [2103, 'Pec Fly Rear Delt', '핀 머신', '가슴, 어깨', 'Life Fitness', 'Signature Series'],
  [2104, 'Shoulder Press', '핀 머신', '어깨', 'Life Fitness', 'Optima Series'],
  [2105, 'Lateral Raise', '핀 머신', '어깨', 'Cybex', 'Eagle NX'],
  [2106, 'Pulldown', '핀 머신', '등', 'Life Fitness', 'Optima Series'],
  [2107, 'Seated Row', '핀 머신', '등', 'Life Fitness', 'Optima Series'],
  [2108, 'Pullover', '핀 머신', '등', 'Nautilus', 'Inspiration'],
  [2109, 'Select Assist Dip Chin', '핀 머신', '등, 가슴, 팔', 'Hammer Strength', 'Select Series'],
  [2110, 'Leg Press', '핀 머신', '하체', 'Teca', 'TECA Advanced'],
  [2111, 'Leg Extension Curl Combo', '핀 머신', '하체', 'Life Fitness', 'Optima Series'],
  [2112, 'Leg Extension', '핀 머신', '하체', 'Life Fitness', 'Optima Series'],
  [2113, 'Prone Leg Curl', '핀 머신', '하체', 'Cybex', 'Eagle NX'],
  [2114, 'Hip Abductor Adductor', '핀 머신', '하체', 'Life Fitness', 'Optima Series'],
  [2115, 'Link Out Thigh', '핀 머신', '하체', 'Lexco', 'Master Pro'],
  [2116, 'Rear Kick', '핀 머신', '하체', 'Booty Builder', ''],
  [2117, 'Standing Calf', '핀 머신', '하체', 'Gymleco', '300 Series'],
  [2118, 'Biceps Curl', '핀 머신', '팔', 'Technogym', 'Selection 700'],
  [2119, 'Triceps Extension', '핀 머신', '팔', 'Life Fitness', 'Optima Series'],
  [2120, 'Abdominal Crunch', '핀 머신', '복근', 'Nautilus', 'Inspiration'],
  [2121, 'Torso Rotation', '핀 머신', '복근', 'Cybex', 'Eagle NX'],
  [2122, 'Eagle NX Row', '핀 머신', '등', 'Cybex', 'Eagle NX'],
  [2201, 'Plate-Loaded Iso-Lateral Horizontal Bench Press', '플레이트 머신', '가슴', 'Hammer Strength', 'Plate-Loaded'],
  [2202, 'Plate Incline Chest Press', '플레이트 머신', '가슴', 'Newtech', ''],
  [2203, 'Iso-Lateral Shoulder Press', '플레이트 머신', '어깨', 'Hammer Strength', 'Plate-Loaded'],
  [2204, 'Iso-Lateral High Row', '플레이트 머신', '등', 'Hammer Strength', 'Plate-Loaded'],
  [2205, 'T-Bar Row', '플레이트 머신', '등', 'Gymleco', '300 Series'],
  [2206, 'Linear Leg Press', '플레이트 머신', '하체', 'Hammer Strength', 'Plate-Loaded'],
  [2207, 'Hack Squat Advanced Plate Loaded', '플레이트 머신', '하체', 'Teca', 'TECA Free Weights'],
  [2208, 'Pendulum Squat', '플레이트 머신', '하체', 'Gymleco', '300 Series'],
  [2209, 'Hip Thrust', '플레이트 머신', '하체', 'etc', ''],
  [2210, 'Seated Calf Raise', '플레이트 머신', '하체', 'Hammer Strength', 'Plate-Loaded'],
  [2211, 'Smith Machine', '플레이트 머신', '전신', 'Nautilus', 'Nitro'],
  [2212, 'Power Rack', '플레이트 머신', '전신', 'Lexco', 'LF-204'],
  [2213, 'Belt Squat Machine', '플레이트 머신', '하체', 'Gymleco', '082'],
  [2301, 'Dual Adjustable Pulley', '케이블 머신', '전신', 'Life Fitness', 'Signature Series'],
  [2302, 'Free Standing Cable Crossover', '케이블 머신', '전신', 'Cybex', ''],
  [2303, 'Multi-Jungle Station MJ8', '케이블 머신', '전신', 'Life Fitness', ''],
  [2304, 'Cable Column', '케이블 머신', '전신', 'Technogym', ''],
  [2401, 'Half Rack', '프리웨이트', '전신', 'Hammer Strength', ''],
  [2402, 'Olympic Flat Bench', '프리웨이트', '가슴', 'etc', ''],
  [2403, 'Olympic Incline Bench', '프리웨이트', '가슴, 어깨', 'Nautilus', 'Instinct'],
  [2404, 'Flat Bench', '프리웨이트', '가슴', 'etc', ''],
  [2405, 'Adjustable Bench', '프리웨이트', '전신', 'Cybex', 'Ion Series'],
  [2406, '3-Tier Hex Dumbbell Rack', '프리웨이트', '전신', 'Life Fitness', ''],
  [2407, 'Barbell Rack', '프리웨이트', '전신', 'Life Fitness', ''],
  [2408, 'Kettlebell Rack', '프리웨이트', '전신', 'etc', ''],
  [2409, 'EZ Curl Bar Rack', '프리웨이트', '팔', 'etc', ''],
  [2410, 'Roman Chair', '프리웨이트', '등', 'Hammer Strength', ''],
  [2411, 'Abdominal Bench', '프리웨이트', '복근', 'Cybex', 'Ion Series'],
  [2412, 'Scott Curl', '프리웨이트', '팔', 'Gymleco', ''],
  [2413, 'Inversion Table', '프리웨이트', '전신', 'etc', ''],
  [2414, 'Vertical Medicine Ball Storage', '프리웨이트', '전신', 'Life Fitness', ''],
  [2415, 'Pull-Up Dip Station', '프리웨이트', '등, 가슴, 팔', 'etc', ''],
  [2416, 'Leg Raise Chair', '프리웨이트', '복근', 'Gymleco', ''],
].map(([id, name, type, body, brand, series]) => ({ id, name, type, body, brand, series, image: '' }));
const MACHINE_BY_ID = Object.fromEntries(MACHINES.map(m => [m.id, m]));

/* 센터(gyms) — 이름은 장소 목록(PLACES)·헬스장 찾기(GYM_DIR)와 같은 글자 */
const CENTER_GYMS = [
  { id: 1, name: '니짐 신림점',
    machine_ids: [2001, 2003, 2004, 2008, 2101, 2103, 2106, 2107, 2109, 2110, 2111, 2112, 2113, 2114, 2116, 2120, 2122, 2201, 2206, 2209, 2211, 2212, 2301, 2302, 2401, 2402, 2404, 2405, 2406, 2407, 2408, 2410, 2411, 2413, 2415],
    machine_counts: { 2001: 8, 2003: 2, 2004: 3, 2404: 3, 2405: 4, 2301: 2 } },
  { id: 2, name: '니짐 봉천점', machine_ids: [], machine_counts: {} },
  { id: 3, name: '니짐 서울대입구점', machine_ids: [], machine_counts: {} },
];
/* 관리자 시연 스위치용 — «아직 없음» 센터를 «등록됨»으로 바꿨을 때 넣어 볼 배정 */
const CENTER_FILL = { machine_ids: [2002, 2005, 2006, 2009, 2101, 2104, 2106, 2110, 2112, 2113, 2211, 2301, 2405, 2406, 2415], machine_counts: { 2002: 6, 2006: 4 } };

const machineBody = m => String(m.body || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, MACHINE_BODY_MAX);

/* 기구(machines 한 줄) → 코치가 쓰는 «기구 갈래»(gymreq.js EQUIP 번호).
   기구 목록에는 «무슨 운동을 하는 기구인지» 칸이 없어서, 이름·시리즈 글자와 종류(type)로 가려낸다.
   한 기구가 여러 갈래일 수 있다(레그 익스텐션·컬 겸용 등). 못 가려낸 기구는 코치가 쓰지 않는다(없는 것으로 본다).
   ⚠️ 시험판용 추정 규칙 — 실서비스에서는 니짐 쪽에 «기구 id ↔ 갈래» 짝 표를 두고 사람이 검수해야 한다. */
const MACHINE_RULES = [
  /* [갈래, 맞는 글자, 되는 종류(없으면 전부), 빼는 글자] */
  ['treadmill', /tread|\brun\b|런닝|러닝/, 'C'], ['stepmill', /stair|cl?imb ?mill|crimbmill|step ?mill|천국/, 'C'], ['bike_up', /upright/, 'C'], ['bike_rec', /recumbent/, 'C'],
  ['spin', /spin|indoor cycle/, 'C'], ['elliptical', /ellipt|arc trainer|cross ?trainer|synchro/, 'C'], ['rower', /rower|rowing|로잉/, 'C'], ['assault', /air ?bike|assault/, 'C'], ['skierg', /ski/, 'C'],
  ['m_incline_cp', /incline.*press/, 'M'], ['m_chest_press', /chest press|bench press|flat press|vertical press|wide chest|decline press/, 'M', /incline/],
  ['m_pec_deck', /\bpec|\bfly\b|butterfly|rear delt/, 'M'], ['m_shoulder', /shoulder press|overhead press|deltoid press/, 'M'], ['m_lateral', /lateral raise|side lateral|deltoid raise|delts machine/, 'M'],
  ['m_lat_pulldown', /pull ?down|lat pull|front pull|lat machine|vertical traction/, 'MK'], ['m_tbar', /t.?bar/, 'MF'], ['m_plate_row', /\brow\b/, 'P', /t.?bar/], ['m_seated_row', /\brow\b/, 'NK', /t.?bar/],
  ['m_pullover', /pull ?over/, 'M'], ['m_assist', /assist.*(dip|chin|pull)|chins?\W*dips?|dip\W*chin/, 'M'], ['m_back_ext', /back ext|roman chair|hyper ?ext|low(er)? back/],
  ['m_leg_press', /leg press/, 'M'], ['m_leg_ext', /leg ext/, 'M'], ['m_leg_curl', /leg curl|leg ext.*curl|hamstring|kneeling curl/, 'M'],
  ['m_hip_abd', /abduct|out(er)? ?thigh/, 'M'], ['m_hip_add', /adduct|in(ner)? ?thigh/, 'M'], ['m_hack', /hack/, 'M'], ['m_vsquat', /v.?squat|pendulum/, 'M'],
  ['m_glute', /glute.*(kick|press)|kick ?back|rear kick/, 'M'], ['m_seated_calf', /seated calf/, 'M'], ['m_calf', /calf/, 'M', /seated/],
  ['m_bicep', /bicep|arm curl|preacher/, 'M'], ['m_tricep', /tricep|arm ext/, 'M'], ['m_crunch', /crunch|abdominal|\babs?\b/, 'M'], ['m_torso', /torso|rotary|rotation/, 'M'],
  ['smith', /smith/], ['cable', /pulley|pully|cross ?over|cable|jungle|multi.?station|functional trainer/, null, /\brow\b|pull ?down/], ['cable', /./, 'K', /^(row|pull ?down)$/],
  ['rack', /(power|half|squat|full) ?rack|squat stand/], ['bench_press', /olympic.*bench|bench press/, 'F', /incline|decline/], ['bench', /(flat|adjustable|utility) .*bench|(flat|adjustable|utility) bench/, 'F', /olympic|abdominal|\bab\b/],
  ['dumbbell', /dumbbell|덤벨/], ['barbell', /barbell|weight tree|plate tree|olympic|바벨/], ['kettlebell', /kettle|케틀/], ['ezbar', /\bez\b|curl bar/], ['pullup_bar', /pull.?up|chin.?up|chinning/, 'FP', /assist/], ['dip_bar', /dip (station|bar|stand)|power tower/, 'FP', /assist/],
];
const _TYPE_KEY = { '유산소 머신': 'C', '핀 머신': 'N', '플레이트 머신': 'P', '케이블 머신': 'K', '프리웨이트': 'F' };
function machineKinds(m) {
  const t = _TYPE_KEY[m.type] || '', s = `${m.name} ${m.series || ''}`.toLowerCase(), out = [];
  MACHINE_RULES.forEach(([kind, re, types, not]) => {
    const okType = !types ? t !== 'C' : [...types].some(c => c === 'M' ? (t === 'N' || t === 'P') : c === t);
    if (okType && re.test(s) && !(not && not.test(s)) && !out.includes(kind)) out.push(kind);
  });
  return out;
}
/* 센터가 가진 기구 id 목록 → { machines, counts, kinds(갈래 Set), byKind{갈래:[기구]}, unread[코치가 못 읽은 기구] }
   목록에 따로 안 올라오는 작은 도구: 벤치·랙이 있으면 덤벨·바벨은 있는 것으로 본다. 케틀벨·EZ바·철봉·딥스 바는 목록에 있을 때만. */
const _centerCache = {};
function centerMachineInfo(ids, counts) {
  const key = ids.join(','); if (_centerCache[key]) return _centerCache[key];
  const machines = ids.map(id => MACHINE_BY_ID[id]).filter(Boolean), kinds = new Set(), byKind = {}, unread = [];
  machines.forEach(m => { const ks = machineKinds(m); if (!ks.length) unread.push(m); ks.forEach(k => { kinds.add(k); (byKind[k] = byKind[k] || []).push(m); }); });
  const implied = [];
  if (!kinds.has('dumbbell') && kinds.has('bench')) { kinds.add('dumbbell'); implied.push('dumbbell'); }
  if (!kinds.has('barbell') && (kinds.has('rack') || kinds.has('bench_press'))) { kinds.add('barbell'); implied.push('barbell'); }
  return (_centerCache[key] = { ids, machines, counts: counts || {}, kinds, byKind, unread, implied });
}
if (typeof module !== 'undefined') module.exports = { MACHINES, MACHINE_TYPES, MACHINE_BODY, CENTER_GYMS, CENTER_FILL, machineKinds, machineBody, centerMachineInfo, MACHINE_RULES };
