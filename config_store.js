'use strict';
/* 운영자 설정 불러오기 — 시연에선 브라우저 저장소가 «본사 설정 서버» 역할. app.js 보다 먼저 실행돼야
   고객 앱이 처음 그릴 때부터 본사 값(H1 운동 사전 · H2 경험치·한도·표정·레벨표·업적·상점)으로 계산한다. */
const ADMIN_KEY = 'nijim_workout_admin_v114';
const adminLoad = () => { try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}'); } catch { return {}; } };
const ADM = Object.assign({ cfg: {}, levels: {}, ex: {}, exAdd: [], shop: {}, shop82: {}, rewards: {}, rollout: 10, fraud: {}, log: [] }, adminLoad());
applyConfig(ADM);

/* H1 — 이름·부위·별칭 수정은 사전에 덮어쓰고, 비활성은 «고르는 목록»(EX_DICT)에서 빼고 off 표시(칩에서도 숨김).
   EX 에는 남겨서 지난 기록은 계속 이름이 보인다 */
const EX_SEED = EX_DICT.map(e => ({ ...e }));
(() => {
  ADM.exAdd.forEach(e => { if (!EX[e.id]) { EX_DICT.push({ ...e }); EX[e.id] = EX_DICT[EX_DICT.length - 1]; } });
  Object.entries(ADM.ex).forEach(([id, o]) => { if (EX[id]) Object.assign(EX[id], o.edit || {}); });
  for (let i = EX_DICT.length - 1; i >= 0; i--) if ((ADM.ex[EX_DICT[i].id] || {}).off) { EX_DICT[i].off = true; EX_DICT.splice(i, 1); }
})();

/* H2 상점 — 회원 앱 상점(9개)에 본사 가격·판매 여부·부스터/물약 값 입히기 */
let ITEM_SEED = null;
function patchItems() {   // app.js 가 ITEMS 를 만든 바로 다음, 첫 화면을 그리기 전에 부른다
  ITEM_SEED = ITEM_SEED || ITEMS.map(i => ({ ...i }));
  const m = CFG.BOOST.mul, px = CFG.POTION.xp, cap = itemUncapped() ? '한도 없음' : `아이템 한도 하루 ${CFG.ITEM_CAP.day ?? '없음'}·주 ${CFG.ITEM_CAP.week ?? '없음'}`;
  ITEMS.forEach((it, k) => {
    const b = ITEM_SEED[k], o = ADM.shop[it.id] || {};
    it.price = o.price ?? b.price; it.off = !!o.off;
    if (it.id === 'boost1') Object.assign(it, { name: `${m}배 부스터 · 1세션`, desc: `다음 운동 1번 ${m}배 · ${cap}` });
    if (it.id === 'boost7') Object.assign(it, { name: `${m}배 부스터 · 7일`, desc: `7일 동안 운동 ${m}배 · ${cap}` });
    if (it.id === 'potion') Object.assign(it, { name: `경험치 물약 +${px}`, desc: `운동 없이 +${px} · ${cap} · 💰` });
  });
}
