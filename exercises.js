'use strict';
/* 공통 운동 사전 60종 (PLAN §2-1 · 니짐이 관리하는 사전 1개, 센터 등록 없음) — 실서비스 표 `exercises` 와 같은 열.
   mode: wr = 무게×횟수 · r = 횟수 · t = 시간(초) · cardio = 유산소(분) · lesson = 레슨(자동 생성)
   xpk : 경험치 단위(engine.js CFG.XP) — weight 1세트 · body 1세트 · cardio 1분 · lesson 1회
   bw  : 비현실 무게 판정용 «체중 대비 최대 배수»(VERIFICATION §4, 종목별 계수) · step = 무게 스테퍼 칸(kg) */
const PARTS = ['가슴', '등', '하체', '어깨', '팔', '코어', '전신', '유산소'];
const CAT_NAME = { cardio: '유산소 기구', machine: '웨이트 머신', free: '프리웨이트', body: '맨몸·소도구', lesson: '수업(레슨)', out: '집·야외' };
const EX_DICT = [
  // 유산소 기구 9
  { id: 'treadmill', name: '트레드밀', cat: 'cardio', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '러닝머신 런닝머신 걷기' },
  { id: 'bike_up', name: '업라이트 사이클', cat: 'cardio', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '자전거 실내자전거' },
  { id: 'bike_rec', name: '리컴번트 사이클', cat: 'cardio', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '자전거 등받이' },
  { id: 'spin', name: '스핀 바이크', cat: 'cardio', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '스피닝 자전거' },
  { id: 'elliptical', name: '일립티컬', cat: 'cardio', part: '유산소', sub: ['전신'], mode: 'cardio', xpk: 'cardio', al: '크로스트레이너 천국의계단X' },
  { id: 'rower', name: '로잉머신', cat: 'cardio', part: '유산소', sub: ['등'], mode: 'cardio', xpk: 'cardio', al: '조정 로잉' },
  { id: 'stepmill', name: '스텝밀', cat: 'cardio', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '천국의계단 계단' },
  { id: 'assault', name: '어썰트바이크', cat: 'cardio', part: '유산소', sub: ['전신'], mode: 'cardio', xpk: 'cardio', al: '에어바이크' },
  { id: 'skierg', name: '스키에르그', cat: 'cardio', part: '유산소', sub: ['등'], mode: 'cardio', xpk: 'cardio', al: '스키' },
  // 웨이트 머신 15
  { id: 'chest_press', name: '체스트프레스', cat: 'machine', part: '가슴', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 30, step: 5, bw: 2 },
  { id: 'pec_deck', name: '펙덱 플라이', cat: 'machine', part: '가슴', sub: [], mode: 'wr', xpk: 'weight', w: 25, step: 5, bw: 1.5, al: '버터플라이' },
  { id: 'm_shoulder', name: '머신 숄더프레스', cat: 'machine', part: '어깨', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 20, step: 5, bw: 1.5 },
  { id: 'lat_pulldown', name: '랫풀다운', cat: 'machine', part: '등', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 40, step: 5, bw: 1.8 },
  { id: 'seated_row', name: '시티드로우', cat: 'machine', part: '등', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 35, step: 5, bw: 1.8, al: '케이블로우' },
  { id: 'leg_press', name: '레그프레스', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 100, step: 10, bw: 5 },
  { id: 'leg_ext', name: '레그익스텐션', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 30, step: 5, bw: 1.5 },
  { id: 'leg_curl', name: '레그컬', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 25, step: 5, bw: 1.2 },
  { id: 'hip_abd', name: '힙 어브덕션', cat: 'machine', part: '하체', sub: ['코어'], mode: 'wr', xpk: 'weight', w: 30, step: 5, bw: 2, al: '아웃타이' },
  { id: 'hip_add', name: '힙 어덕션', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 30, step: 5, bw: 2, al: '이너타이' },
  { id: 'hack_squat', name: '핵스쿼트', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 40, step: 5, bw: 3 },
  { id: 'calf_raise', name: '카프레이즈', cat: 'machine', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 40, step: 5, bw: 3, al: '종아리' },
  { id: 'assist_pullup', name: '어시스트 풀업·딥스', cat: 'machine', part: '등', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 30, step: 5, bw: 1.2, al: '어시스티드' },
  { id: 'back_ext', name: '백익스텐션', cat: 'machine', part: '등', sub: ['코어'], mode: 'r', xpk: 'body', al: '허리' },
  { id: 'crunch_m', name: '크런치머신', cat: 'machine', part: '코어', sub: [], mode: 'wr', xpk: 'weight', w: 20, step: 5, bw: 1.5, al: '복근' },
  // 프리웨이트 18
  { id: 'bench', name: '벤치프레스', cat: 'free', part: '가슴', sub: ['팔', '어깨'], mode: 'wr', xpk: 'weight', w: 40, step: 2.5, bw: 2.2, al: '벤치 바벨' },
  { id: 'squat', name: '바벨 스쿼트', cat: 'free', part: '하체', sub: ['코어'], mode: 'wr', xpk: 'weight', w: 50, step: 2.5, bw: 3, al: '스쿼트 백스쿼트' },
  { id: 'deadlift', name: '데드리프트', cat: 'free', part: '등', sub: ['하체'], mode: 'wr', xpk: 'weight', w: 60, step: 2.5, bw: 3.2, al: '데드' },
  { id: 'ohp', name: '오버헤드프레스', cat: 'free', part: '어깨', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 30, step: 2.5, bw: 1.5, al: '밀리터리프레스 OHP' },
  { id: 'barbell_row', name: '바벨로우', cat: 'free', part: '등', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 40, step: 2.5, bw: 2 },
  { id: 'hip_thrust', name: '힙쓰러스트', cat: 'free', part: '하체', sub: ['코어'], mode: 'wr', xpk: 'weight', w: 40, step: 2.5, bw: 3.5, al: '힙업 엉덩이' },
  { id: 'db_press', name: '덤벨 프레스', cat: 'free', part: '가슴', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 14, step: 2, bw: 1, al: '덤벨벤치' },
  { id: 'incline_db', name: '인클라인 덤벨프레스', cat: 'free', part: '가슴', sub: ['어깨'], mode: 'wr', xpk: 'weight', w: 12, step: 2, bw: 1 },
  { id: 'db_row', name: '덤벨 로우', cat: 'free', part: '등', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 16, step: 2, bw: 1, al: '원암로우' },
  { id: 'db_shoulder', name: '덤벨 숄더프레스', cat: 'free', part: '어깨', sub: ['팔'], mode: 'wr', xpk: 'weight', w: 10, step: 2, bw: 0.8 },
  { id: 'db_lunge', name: '덤벨 런지', cat: 'free', part: '하체', sub: ['코어'], mode: 'wr', xpk: 'weight', w: 8, step: 2, bw: 1 },
  { id: 'db_curl', name: '덤벨 컬', cat: 'free', part: '팔', sub: [], mode: 'wr', xpk: 'weight', w: 8, step: 2, bw: 0.6, al: '이두 바이셉스' },
  { id: 'lateral', name: '레터럴레이즈', cat: 'free', part: '어깨', sub: [], mode: 'wr', xpk: 'weight', w: 5, step: 1, bw: 0.4, al: '사레레 사이드레터럴' },
  { id: 'kb_swing', name: '케틀벨 스윙', cat: 'free', part: '전신', sub: ['하체'], mode: 'wr', xpk: 'weight', w: 12, step: 4, bw: 0.8 },
  { id: 'smith_squat', name: '스미스머신 스쿼트', cat: 'free', part: '하체', sub: [], mode: 'wr', xpk: 'weight', w: 40, step: 5, bw: 3, al: '스미스' },
  { id: 'cable_cross', name: '케이블 크로스오버', cat: 'free', part: '가슴', sub: [], mode: 'wr', xpk: 'weight', w: 10, step: 2.5, bw: 1, al: '케이블플라이' },
  { id: 'tricep_pd', name: '케이블 트라이셉스', cat: 'free', part: '팔', sub: [], mode: 'wr', xpk: 'weight', w: 15, step: 2.5, bw: 1, al: '푸시다운 삼두' },
  { id: 'face_pull', name: '페이스풀', cat: 'free', part: '어깨', sub: ['등'], mode: 'wr', xpk: 'weight', w: 12.5, step: 2.5, bw: 1 },
  // 맨몸·소도구 12
  { id: 'pushup', name: '푸시업', cat: 'body', part: '가슴', sub: ['팔', '코어'], mode: 'r', xpk: 'body', al: '팔굽혀펴기', home: 1 },
  { id: 'pullup', name: '풀업', cat: 'body', part: '등', sub: ['팔'], mode: 'r', xpk: 'body', al: '턱걸이', home: 1 },
  { id: 'dips', name: '딥스', cat: 'body', part: '가슴', sub: ['팔'], mode: 'r', xpk: 'body', home: 1 },
  { id: 'plank', name: '플랭크', cat: 'body', part: '코어', sub: [], mode: 't', xpk: 'body', home: 1 },
  { id: 'air_squat', name: '맨몸 스쿼트', cat: 'body', part: '하체', sub: [], mode: 'r', xpk: 'body', al: '스쿼트', home: 1 },
  { id: 'lunge', name: '맨몸 런지', cat: 'body', part: '하체', sub: [], mode: 'r', xpk: 'body', al: '런지', home: 1 },
  { id: 'burpee', name: '버피', cat: 'body', part: '전신', sub: ['유산소'], mode: 'r', xpk: 'body', home: 1 },
  { id: 'crunch', name: '크런치', cat: 'body', part: '코어', sub: [], mode: 'r', xpk: 'body', al: '윗몸 복근', home: 1 },
  { id: 'leg_raise', name: '레그레이즈', cat: 'body', part: '코어', sub: [], mode: 'r', xpk: 'body', al: '복근', home: 1 },
  { id: 'jump_rope', name: '줄넘기', cat: 'body', part: '유산소', sub: ['하체'], mode: 't', xpk: 'body', home: 1 },
  { id: 'band', name: '밴드 운동', cat: 'body', part: '전신', sub: [], mode: 'r', xpk: 'body', al: '루프밴드 튜빙', home: 1 },
  { id: 'stretch', name: '폼롤러·스트레칭', cat: 'body', part: '전신', sub: [], mode: 't', xpk: 'body', al: '스트레칭 폼롤러 요가', home: 1 },
  // 수업(레슨) 3 — 선생님 진행 확정 시 자동 생성(직접 고르지 않음)
  { id: 'lesson_pt', name: 'PT 수업', cat: 'lesson', part: '전신', sub: [], mode: 'lesson', xpk: 'lesson' },
  { id: 'lesson_pilates', name: '필라테스 수업', cat: 'lesson', part: '코어', sub: [], mode: 'lesson', xpk: 'lesson' },
  { id: 'lesson_gx', name: 'GX 수업', cat: 'lesson', part: '전신', sub: [], mode: 'lesson', xpk: 'lesson', al: '요가 줌바 스피닝' },
  // 집·야외 3 (홈트는 맨몸 목록 공유)
  { id: 'walk', name: '걷기', cat: 'out', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '산책', home: 1 },
  { id: 'run', name: '달리기', cat: 'out', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '러닝 조깅', home: 1 },
  { id: 'cycle', name: '자전거(야외)', cat: 'out', part: '유산소', sub: ['하체'], mode: 'cardio', xpk: 'cardio', al: '라이딩', home: 1 },
];
const EX = Object.fromEntries(EX_DICT.map(e => [e.id, e]));
