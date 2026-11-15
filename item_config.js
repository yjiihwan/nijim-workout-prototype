'use strict';
/* v1.70 — 장착 아이템 27종 «설정 한 곳» (기획안 v5 · 형 확정 2026-11-15).
   값·효과·유효기간 숫자는 전부 예시값 — 바꿀 때는 이 파일만 고친다(가격은 관리자 화면 상점 표에서도 덮어쓸 수 있다).
   slot  : head 머리 · face 얼굴 · neck 목 · wrist 손목·손 · body 몸·등 · leg 다리·발 · bg 배경·둘레 — 같은 자리엔 1개만 착용
   grade : n 일반 · g 고급 · r 희귀(달성 보상·못 삼) · p 프리미엄 · s 시즌
   fx    : { pct, parts:[운동 사전의 부위] , ex:[부위와 상관없이 넣을 운동 id], all:true(모든 운동) , label:화면에 쓰는 말 }
   days  : 유효기간(산 날부터 날짜로) — 없으면 기간 없음
   ach   : { kind:'count'(운동 횟수)|'streak'(연속 주), n } — 달성하면 자동 지급, 상점에서 못 삼
   season: 'winter' — GEAR_CFG.season 의 달에만 판매
   gift  : 1 = 친구 초대 선물로 고를 수 있음(일반 등급만) */
const GEAR_CFG = {
  capPct: 50,          // 한 운동에 붙는 착용 효과 합계 상한(%)
  warnDays: 3,         // 끝나기 며칠 전에 알릴지
  charmPerMonth: 1,    // 행운 부적 목걸이: 한 달 자동 보호 횟수
  season: { winter: { months: [12, 1, 2], label: '겨울(12~2월)' } },
};
const GEAR_SLOTS = [['head', '머리'], ['face', '얼굴'], ['neck', '목'], ['wrist', '손목·손'], ['body', '몸·등'], ['leg', '다리·발'], ['bg', '배경·둘레']];
const GEAR_GRADE = { n: '일반', g: '고급', r: '희귀', p: '프리미엄', s: '시즌' };
const GEAR = [
  // 머리
  { id: 'cap', slot: 'head', grade: 'n', name: '스포츠 캡', price: 200, img: 'cap', gift: 1 },
  { id: 'headband', slot: 'head', grade: 'n', name: '헤드밴드', price: 150, gift: 1 },
  { id: 'beanie', slot: 'head', grade: 's', name: '비니', price: 500, season: 'winter' },
  { id: 'goldcrown', slot: 'head', grade: 'r', name: '골드 왕관', ach: { kind: 'count', n: 300 }, fx: { all: true, pct: 10, label: '모든 운동' } },
  // 얼굴
  { id: 'sunglasses', slot: 'face', grade: 'n', name: '선글라스', price: 300, img: 'sunglasses', gift: 1 },
  { id: 'goggles', slot: 'face', grade: 'n', name: '스포츠 고글', price: 300, gift: 1 },
  // 목
  { id: 'towel', slot: 'neck', grade: 'n', name: '스카이 타월', price: 200, img: 'towel', gift: 1 },
  { id: 'headphones', slot: 'neck', grade: 'g', name: '헤드폰', price: 1200, days: 120, fx: { parts: ['유산소'], pct: 20, label: '유산소' } },
  { id: 'medal', slot: 'neck', grade: 'r', name: '금메달', ach: { kind: 'count', n: 100 }, fx: { all: true, pct: 5, label: '모든 운동' } },
  { id: 'amulet', slot: 'neck', grade: 'p', name: '행운 부적 목걸이', price: 3000, days: 180, protect: 1 },
  // 손목·손
  { id: 'wristband', slot: 'wrist', grade: 'n', name: '손목밴드', price: 100, img: 'wristband', gift: 1 },
  { id: 'watch', slot: 'wrist', grade: 'g', name: '스마트워치', price: 1500, days: 120, fx: { parts: ['유산소'], pct: 15, label: '유산소' } },
  { id: 'straps', slot: 'wrist', grade: 'g', name: '리프팅 스트랩', price: 1000, days: 60, fx: { parts: ['등'], pct: 20, label: '등 운동' } },
  { id: 'wraps', slot: 'wrist', grade: 'g', name: '손목 보호대', price: 1000, days: 60, fx: { parts: ['가슴', '어깨'], pct: 20, label: '가슴·어깨 운동' } },
  { id: 'dumbbell', slot: 'wrist', grade: 'n', name: '미니 덤벨', price: 300, gift: 1 },
  // 몸·등
  { id: 'belt', slot: 'body', grade: 'g', name: '리프팅 벨트', price: 1000, days: 90, fx: { parts: ['하체'], pct: 20, label: '하체 운동' } },
  { id: 'yogamat', slot: 'body', grade: 'g', name: '요가 매트', price: 800, days: 90, fx: { parts: ['코어'], ex: ['stretch'], pct: 20, label: '코어·스트레칭' } },
  { id: 'gymbag', slot: 'body', grade: 'n', name: '짐백', price: 300, gift: 1 },
  { id: 'cape', slot: 'body', grade: 'r', name: '챔피언 망토', ach: { kind: 'streak', n: 12 }, fx: { all: true, pct: 10, label: '모든 운동' } },
  // 다리·발
  { id: 'kneesleeve', slot: 'leg', grade: 'g', name: '무릎 보호대', price: 1000, days: 60, fx: { parts: ['하체'], pct: 20, label: '하체 운동' } },
  { id: 'liftshoes', slot: 'leg', grade: 'p', name: '역도화', price: 3000, days: 180, fx: { parts: ['하체'], pct: 30, label: '하체 운동' } },
  { id: 'runshoes', slot: 'leg', grade: 'g', name: '러닝화', price: 1200, days: 90, fx: { parts: ['유산소'], pct: 20, label: '유산소' } },
  // 배경·둘레
  { id: 'aura_fire', slot: 'bg', grade: 'r', name: '불꽃 아우라', ach: { kind: 'streak', n: 4 } },
  { id: 'aura_spark', slot: 'bg', grade: 'p', name: '반짝이 아우라', price: 5000 },
  { id: 'bg_gym', slot: 'bg', grade: 'n', name: '헬스장 배경', price: 300, gift: 1 },
  { id: 'bg_river', slot: 'bg', grade: 'n', name: '한강 러닝 배경', price: 300, gift: 1 },
  { id: 'bg_snow', slot: 'bg', grade: 's', name: '눈 내리는 배경', price: 800, season: 'winter' },
];
const GEAR_BY = Object.fromEntries(GEAR.map(g => [g.id, g]));
const gearSlotName = s => (GEAR_SLOTS.find(x => x[0] === s) || [])[1] || '';
/* 화면에 쓰는 효과 한 줄 */
const gearFxText = g => g.fx ? `${g.fx.label} 경험치 +${g.fx.pct}%` : g.protect ? `한 달에 ${GEAR_CFG.charmPerMonth}번 연속 기록 자동 보호` : '효과 없음';
const gearAchText = g => g.ach ? (g.ach.kind === 'count' ? `운동 ${g.ach.n}번` : `연속 ${g.ach.n}주`) : '';

/* ----- 착용 효과 계산(순수 함수 · engine.js sessionXP 가 부른다) -----
   worn = [{ id, name, pct, parts, ex, all }] · e = 운동 사전 한 줄. 그 운동에 붙는 효과 목록과 합계(상한 capPct) */
function gearPctFor(worn, e) {
  const hit = (worn || []).filter(g => g.all || (g.parts || []).includes(e.part) || (g.ex || []).includes(e.id));
  const sum = hit.reduce((a, g) => a + g.pct, 0), pct = Math.min(GEAR_CFG.capPct, sum);
  return { hit, sum, pct, capped: sum > pct };
}
