'use strict';
/* v1.24 코칭 계산 기준표 — 숫자는 전부 여기서만 고친다(screens2.js·coach_info.js 는 읽기만).
   ⚠️ 프로토타입 기준값: 공개 자료를 근사한 값이라 실서비스 전 트레이너·전문가 검수 필요. 체형·BMI 판단에는 쓰지 않는다. */
const COACH_CFG = {
  /* 입력 허용 범위 — 밖이면 캐릭터가 다시 묻는다 */
  RANGE: { age: [14, 100], height: [100, 230], weight: [25, 250] },

  /* 나이 구간 — [이상, 미만, 키]. 나이 모르면 'unknown' */
  AGE_BANDS: [[14, 18, 'teen'], [18, 40, 'young'], [40, 50, 'f40'], [50, 60, 'f50'], [60, 101, 'f60']],

  /* ⑥ 처음 무게: 초보 1RM(한 번 들 수 있는 최대 무게)의 체중 비율.
     출처: StrengthLevel.com 종목별 Strength Standards «Beginner» 체중 비율(남/여)을 0.05 단위로 근사.
     선택 안 함·성별 모름은 보수적으로 여(f) 표를 쓴다. 덤벨은 한 손 무게. */
  BEGIN_1RM: {
    bench: { m: 0.5, f: 0.25 }, squat: { m: 0.75, f: 0.5 }, deadlift: { m: 1.0, f: 0.6 }, ohp: { m: 0.35, f: 0.2 },
    barbell_row: { m: 0.5, f: 0.3 }, incline_bench: { m: 0.45, f: 0.2 }, rdl: { m: 0.75, f: 0.5 }, hip_thrust: { m: 0.75, f: 0.5 },
    leg_press: { m: 1.25, f: 0.75 }, chest_press: { m: 0.5, f: 0.25 }, smith_bench: { m: 0.45, f: 0.2 }, incline_cp: { m: 0.45, f: 0.2 },
    lat_pulldown: { m: 0.5, f: 0.3 }, seated_row: { m: 0.5, f: 0.3 }, m_shoulder: { m: 0.35, f: 0.2 },
    leg_ext: { m: 0.5, f: 0.35 }, leg_curl: { m: 0.4, f: 0.25 }, hack_squat: { m: 0.75, f: 0.45 },
    db_press: { m: 0.2, f: 0.1 }, db_shoulder: { m: 0.15, f: 0.07 }, db_row: { m: 0.2, f: 0.1 }, db_curl: { m: 0.1, f: 0.05 },
    lateral: { m: 0.05, f: 0.03 }, goblet: { m: 0.2, f: 0.15 },
  },
  /* 처음 세트 무게 = 1RM × 이 범위. 출처: NSCA «Essentials of Strength Training and Conditioning» %1RM–반복 표(10회 ≈ 75%)에서
     자세 익히기용으로 낮춘 값(10~12회가 넉넉한 무게) */
  START_PCT: [0.5, 0.7],
  /* 나이 보정(곱) — 50대 이상·나이 모름은 보수적으로. 프로토 기준값(전문가 검수 필요) */
  START_AGE_K: { teen: 0.8, young: 1.0, f40: 0.9, f50: 0.8, f60: 0.7, unknown: 0.9 },
  /* 기구 최소 무게(빈 봉 등). 반올림 단위는 운동 사전(exercises.js)의 step */
  MIN_W: { bench: 20, squat: 20, deadlift: 20, ohp: 20, barbell_row: 20, incline_bench: 20, rdl: 20, hip_thrust: 20 },
  BAR_IDS: ['bench', 'squat', 'deadlift', 'ohp', 'barbell_row', 'incline_bench', 'rdl', 'hip_thrust'],

  /* ⑦ 한 번에 올리는 폭(kg). 출처: NSCA «Essentials…» 부하 증가 권장
     (상체: 작고 덜 훈련된 사람 1.25~2.5kg / 크고 훈련된 사람 2.5~5kg · 하체: 2.5~5kg / 5~7kg)의 아래쪽 값.
     'big' = 남·체중 70kg 이상·50세 미만, 나머지(여·선택 안 함·50대+·정보 모름)는 'small' */
  INC: { upper: { small: 1.25, big: 2.5 }, lower: { small: 2.5, big: 5 } },
  INC_BIG: { minW: 70, maxAge: 50 },
  LOWER_PARTS: ['하체'],

  /* ⑨ 같은 부위 쉬는 시간(시간). 출처: ACSM «Guidelines for Exercise Testing and Prescription» 같은 근육군 48시간 권고,
     ACSM Position Stand «Exercise and Physical Activity for Older Adults»(2009, 비연속일 권고) → 50대+ 72시간은 프로토 보수값 */
  REST_H: { teen: 48, young: 48, f40: 48, f50: 72, f60: 72 },
  WARMUP_FROM: 50,   // 이 나이부터 워밍업 세트 한 줄 추가

  /* ⑩ 유산소 MET(보통 강도). 출처: 2024 Adult Compendium of Physical Activities(Herrmann 외).
     kcal ≈ MET × 체중(kg) × 시간(h). 강도 보정은 engine.js CARDIO_K 와 같은 비율 */
  MET: { treadmill: 5.0, bike_up: 6.8, bike_rec: 5.5, spin: 8.5, elliptical: 5.0, rower: 7.0, stepmill: 9.0, assault: 8.8, skierg: 6.8, walk: 3.5, run: 9.8, cycle: 7.5 },
  MET_K: { light: 0.8, normal: 1.0, hard: 1.2 },
  /* 트레드밀·달리기에 거리가 있으면 속도로 MET(같은 Compendium 걷기·달리기 항목 근사) */
  MET_BY_KMH: [[0, 3.5], [5, 4.3], [6.5, 6.0], [8, 8.3], [9.5, 9.8], [11, 11.0], [13, 12.3]],
};
