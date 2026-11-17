'use strict';
/* v1.70 — 장착 아이템 27종: 유효기간(날짜) · 달성 보상 자동 지급 · 시즌 판매 · 알림 · 착용 효과 목록 · 상점/내 아이템 화면.
   숫자·목록은 item_config.js(GEAR·GEAR_CFG) 한 곳. 그림은 equip.js. 경험치 계산은 engine.js sessionXP(c.gear).
   저장 값: S.owned[id] · S.equipped[id](기존 그대로) + S.gearUntil[id]='YYYY-MM-DD'(이 날이 되면 사라짐) · S.gearWarn[id](3일 전 알림을 보낸 만료일) · S.gearNotes[](아직 안 본 알림)
            S.charmUsed={ m:'YYYY-MM', n }(부적 목걸이가 그 달에 지켜 준 횟수) · S.gearPaid(효과 용품을 포인트로 산 적 있음 → 💰)
   시험판 전용: S.gearShift(날짜를 며칠 앞당겨 보기) · S.gearDemo{ cnt, streak }(달성 조건 흉내) — 실서비스에는 없다(서버 날짜·실제 기록 수를 쓴다) */
const gearAddDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const gearToday = () => gearAddDays(TODAY, (S && S.gearShift) || 0);
const gearDiff = (a, b) => Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 864e5);
function ensureGear() {
  const ok = o => o && typeof o === 'object' && !Array.isArray(o);
  if (!ok(S.gearUntil)) S.gearUntil = {}; if (!ok(S.gearWarn)) S.gearWarn = {}; if (!Array.isArray(S.gearNotes)) S.gearNotes = [];
  if (!ok(S.gearDemo)) S.gearDemo = { cnt: 0, streak: null }; if (!ok(S.charmUsed)) S.charmUsed = { m: '', n: 0 };
  if (!Number.isFinite(S.gearShift)) S.gearShift = 0; if (!S.gSlot) S.gSlot = 'all';
  const seen = {};   // 같은 자리에 2개가 장착돼 있으면 앞의 것만 남긴다
  GEAR.forEach(g => { if (S.equipped[g.id] && S.owned[g.id]) { if (seen[g.slot]) S.equipped[g.id] = false; else seen[g.slot] = 1; } else if (S.equipped[g.id]) S.equipped[g.id] = false; });
  return S;
}
const gearLeft = id => { const u = S.gearUntil && S.gearUntil[id]; return u ? gearDiff(u, gearToday()) : null; };   // 남은 날(만료일 − 오늘)
const gearCount = () => (typeof statRecs === 'function' ? new Set(statRecs().map(r => r.date)).size : S.records.filter(r => !r.demo).length) + ((S.gearDemo && S.gearDemo.cnt) || 0);   // 업적 «운동 100회»와 같은 셈(운동한 날 수)
const gearStreak = () => (S.gearDemo && S.gearDemo.streak != null) ? S.gearDemo.streak : S.streakWeeks;
const gearAchCur = g => g.ach.kind === 'count' ? gearCount() : gearStreak();
const gearOnSale = g => !g.season || GEAR_CFG.season[g.season].months.includes(+gearToday().slice(5, 7));
const gearDate = s => `${+s.slice(5, 7)}월 ${+s.slice(8, 10)}일`;
/* 만료·3일 전 알림·달성 보상 지급 — 화면을 그리기 전·운동을 저장하기 전에 부른다. 바뀐 게 있으면 true */
function gearTick() {
  ensureGear(); let ch = false; const today = gearToday();
  GEAR.forEach(g => {
    if (g.days && S.owned[g.id]) { const u = S.gearUntil[g.id];
      if (!u) { S.gearUntil[g.id] = gearAddDays(today, g.days); ch = true; }
      else if (today >= u) { delete S.owned[g.id]; delete S.equipped[g.id]; delete S.gearUntil[g.id]; delete S.gearWarn[g.id]; S.gearNotes = S.gearNotes.filter(n => n.id !== g.id); S.gearNotes.push({ t: 'end', id: g.id }); ch = true; }
      else if (gearLeft(g.id) <= GEAR_CFG.warnDays && S.gearWarn[g.id] !== u) { S.gearWarn[g.id] = u; S.gearNotes.push({ t: 'soon', id: g.id, left: gearLeft(g.id), until: u }); ch = true; } }
    if (g.ach && !S.owned[g.id] && gearAchCur(g) >= g.ach.n) { S.owned[g.id] = 1; S.gearNotes.push({ t: 'ach', id: g.id }); ch = true; }
  });
  return ch;
}
/* 지금 차고 있는 효과 아이템 → 세션 경험치 입력값(ctx.gear). 기록에 같이 저장돼 나중에 고쳐도 그때 효과 그대로 */
const gearWorn = () => GEAR.filter(g => g.fx && S.equipped[g.id] && S.owned[g.id]).map(g => ({ id: g.id, name: g.name, pct: g.fx.pct, parts: g.fx.parts, ex: g.fx.ex, all: g.fx.all }));
const gearPaid = () => (S.paidLog.length || S.gearPaid) ? 1 : 0;   // 💰 = 충전한 포인트를 상점에서 써서 경험치를 더 받는 사람(기존 규칙 + 효과 용품 구매)
/* 쓰고 벗기 — 같은 자리엔 1개만 */
function gearToggle(id) {
  const g = GEAR_BY[id]; if (!g || !S.owned[id]) return;
  const prev = on0(g.slot), on = !S.equipped[id]; if (on) GEAR.forEach(o => { if (o.slot === g.slot) S.equipped[o.id] = false; });
  S.equipped[id] = on;
  MI_FX = { id, on, slot: g.slot, swap: on && prev && prev !== id ? prev : null, at: Date.now() };
}
/* v1.96 착용/해제 직후 한 번만 도는 짧은 반응(튀어오름·반짝임) — 1.2초 지나면 무시 */
let MI_FX = null;
const on0 = slot => (GEAR.find(o => o.slot === slot && S.equipped[o.id] && S.owned[o.id]) || {}).id || null;
const miFx = () => MI_FX && Date.now() - MI_FX.at < 1200 ? MI_FX : null;
/* 구매(포인트 차감·보유 처리는 기존 buy 그대로) 뒤에 붙는 일: 유효기간 시작·연장, 안내 말 */
function gearBought(g, had) {
  ensureGear(); if (g.fx || g.protect) S.gearPaid = 1;
  if (!g.days) return `${g.name} 구매 완료 · -${g.price.toLocaleString()}P`;
  const today = gearToday(), base = had && S.gearUntil[g.id] && S.gearUntil[g.id] > today ? S.gearUntil[g.id] : today;
  S.gearUntil[g.id] = gearAddDays(base, g.days); delete S.gearWarn[g.id]; S.gearNotes = S.gearNotes.filter(n => n.id !== g.id);
  return had ? `${g.name} 기간을 ${g.days}일 늘렸어요 · ${gearLeft(g.id)}일 남음` : `${g.name} 구매 완료 · -${g.price.toLocaleString()}P · 오늘부터 ${g.days}일 동안 써요`;
}
const gearBlock = g => g.ach ? `${gearAchText(g)} 달성 보상이라 상점에서는 살 수 없어요` : !gearOnSale(g) ? `${GEAR_CFG.season[g.season].label}에만 팔아요` : null;

/* ----- 행운 부적 목걸이: 차고 있는 동안 한 달에 N번 연속 기록 자동 보호(쉬어가기 티켓·보호권보다 먼저) ----- */
const charmOn = () => !!(S.owned.amulet && S.equipped.amulet);
const charmLeft = () => { ensureGear(); const m = gearToday().slice(0, 7); return Math.max(0, GEAR_CFG.charmPerMonth - (S.charmUsed.m === m ? S.charmUsed.n : 0)); };
function charmUse() {   // 운동 못 간 주가 생겼을 때 서버가 부를 자리. 지켰으면 true
  if (!charmOn() || charmLeft() <= 0) return false;
  const m = gearToday().slice(0, 7); S.charmUsed = { m, n: (S.charmUsed.m === m ? S.charmUsed.n : 0) + 1 }; return true;
}

/* ----- 알림(실제 앱에서는 푸시) — 끝나기 3일 전 1번 · 사라진 날 1번 · 달성 보상 ----- */
function gearNoteSheet() {
  ensureGear(); const ns = S.gearNotes.splice(0); if (!ns.length) return; save();
  const row = n => { const g = GEAR_BY[n.id]; if (!g) return '';
    const [h, sub] = n.t === 'end' ? [`${g.name} 유효기간이 끝났어요`, '내 아이템에서 빠졌어요. 다시 쓰려면 상점에서 새로 사 주세요.']
      : n.t === 'soon' ? [`${g.name} 유효기간이 ${n.left}일 남았어요`, `${gearDate(gearAddDays(n.until, -1))}까지 쓸 수 있어요. 더 쓰려면 상점에서 기간을 늘려 주세요.`]
      : [`${gearAchText(g)} 달성! ${g.name}${gjo(g.name, '을', '를')} 받았어요`, `내 캐릭터 › 내 아이템에서 바로 쓸 수 있어요${g.fx ? ` · ${gearFxText(g)}` : ''}`];
    return `<div class="gnote gn-${n.t}" data-id="${g.id}"><span class="gnico">${n.t === 'end' ? `<span class="gone">${gearIcon(g.id)}</span>` : gearIcon(g.id)}</span><div><b>${h}</b><small>${sub}</small></div></div>`; };
  const shop = ns.some(n => n.t !== 'ach');
  sheet(`<div id="gearNote">${ns.map(row).join('')}</div><div class="grid2" style="margin-top:14px">${shop ? '<button class="btn ghost" data-act="gearShop" id="gearNoteShop">상점 가기</button>' : '<button class="btn ghost" data-act="myItems" id="gearNoteMine">내 아이템 보기</button>'}<button class="btn" data-act="shClose" id="gearNoteOk">확인</button></div><div class="muted demoonly" style="margin-top:8px">실제 앱에서는 푸시 알림으로도 가요</div>`);
}
const gearNoteDue = () => { try { if (S.gearNotes && S.gearNotes.length && S.chosen && S.onboarded && !$('sheet').classList.contains('on') && !/^#admin/.test(location.hash) && !['result', 'selfie'].includes(S.sub) && !S.session) setTimeout(() => { if (!$('sheet').classList.contains('on')) gearNoteSheet(); }, 450); } catch (e) { console.error('[gearNote]', e); } };

/* ===== 화면: 상점 «장착 아이템» 칸 · 내 캐릭터 «내 아이템» 칸 ===== */
const gearLeftText = id => { const n = gearLeft(id); return n == null ? '' : n <= GEAR_CFG.warnDays ? `<em class="gsoon">${n}일 남음</em>` : `${n}일 남음`; };
function gearShopHTML() {
  ensureGear();
  const list = ITEMS.filter(i => i.gear && !i.off && (S.gSlot === 'all' || i.gear.slot === S.gSlot));
  const chips = `<div class="chips gslot" id="gSlots">${[['all', '전체'], ...GEAR_SLOTS].map(([k, l]) => `<button class="chip ${S.gSlot === k ? 'on' : ''}" data-act="gslot" data-v="${k}">${l}</button>`).join('')}</div>`;
  const card = i => { const g = i.gear, own = !!S.owned[g.id], eq = !!S.equipped[g.id], blk = own ? null : gearBlock(g), P = `${i.price.toLocaleString()}P`;
    const l2 = g.ach ? (own ? `${gearAchText(g)} 달성 보상` : `${gearAchText(g)} 달성하면 받아요 · ${Math.min(gearAchCur(g), g.ach.n)}/${g.ach.n}`)
      : g.days ? (own ? gearLeftText(g.id) : `산 날부터 ${g.days}일 동안`) : g.season ? `${GEAR_CFG.season[g.season].label} 한정` : '기간 없이 계속 써요';
    const btn = own ? (g.days ? `<div class="grid2 ib"><button class="btn ${eq ? 'ghost' : ''}" data-act="wear" data-id="${g.id}">${eq ? '벗기' : '착용'}</button><button class="btn ghost gmore" data-act="buy" data-id="${g.id}" aria-label="${g.name} ${g.days}일 늘리기 ${P}">+${g.days}일<i>${P}</i></button></div>` : `<button class="btn ${eq ? 'ghost' : ''}" data-act="wear" data-id="${g.id}">${eq ? '벗기' : '착용'}</button>`)
      : blk ? `<button class="btn ghost glock" data-act="gearLock" data-id="${g.id}">${g.ach ? '못 사요 · 달성 보상' : '겨울에 팔아요'}</button>` : `<button class="btn" data-act="buy" data-id="${g.id}">${P}</button>`;
    return `<div class="item gitem g-${g.grade}" data-id="${g.id}">${eq ? '<span class="tag">착용 중</span>' : own ? '<span class="tag">보유</span>' : ''}<span class="ggrade g-${g.grade}">${GEAR_GRADE[g.grade]}</span>${itemImg(i)}<b>${i.name}</b><small><span class="gfx ${g.fx || g.protect ? 'on' : ''}">${gearFxText(g)}</span><span class="gterm">${l2}</span></small>${btn}</div>`; };
  return `${chips}<div class="muted gshopnote" id="gShopNote">같은 자리에는 1개만 착용할 수 있어요 · 효과는 착용하는 동안, 그 운동을 기록한 만큼만 붙어요(한 운동에 합쳐서 최대 +${GEAR_CFG.capPct}%)</div>
  <div class="grid2" id="gearGrid">${list.map(card).join('')}</div>
  <div class="muted" style="margin-top:10px">니짐 포인트로 사요 · 가격·효과·유효기간은 예시예요 · 유효기간이 있는 아이템은 기간이 끝나면 사라져요 · 효과로 더 받은 경험치는 캐릭터 레벨과 랭킹 «종합 순위»에 들어가요 · «순수 운동량 순위»와 운동 레벨에는 안 들어가요</div>${gearDemoCard()}`;
}
/* v1.96 «내 아이템» 게임식: 위 장비창(자리 7칸 고정) + 아래 가방(4열 격자). 등급 테두리 = 금액 3단계 */
const GEAR_TIER = ['', '일반', '고급', '최고급'];
const gearTier = g => g.ach || (g.price || 0) >= 3000 ? 3 : (g.price || 0) >= 800 ? 2 : 1;   // 달성 보상(못 삼)은 최고급
const SLOT_SHORT = { head: '머리', face: '얼굴', neck: '목', wrist: '손목', body: '몸·등', leg: '다리', bg: '배경' };
const SLOT_GLYPH = {   // 빈 칸에 흐리게 그리는 자리 모양(24×24)
  head: '<path d="M4 15c0-5 3.6-9 8-9s8 4 8 9z"/><path d="M12 15h9"/>',
  face: '<circle cx="7.5" cy="13" r="3.5"/><circle cx="16.5" cy="13" r="3.5"/><path d="M11 13h2"/>',
  neck: '<path d="M5 5c0 7 3 10 7 10s7-3 7-10"/><circle cx="12" cy="18" r="2.5"/>',
  wrist: '<rect x="8" y="8" width="8" height="8" rx="2"/><path d="M9.5 8V4h5v4M9.5 16v4h5v-4"/>',
  body: '<path d="M8 4 3.5 7.5 6 11l2-1.2V20h8v-10.2L18 11l2.5-3.5L16 4c-.8 1.6-2.2 2.5-4 2.5S8.8 5.6 8 4z"/>',
  leg: '<path d="M4 17V9h5l2 4 8.5 2c.9.3 1.5 1 1.5 2v0H4z"/>',
  bg: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="m4.5 17 5-5.5 3.5 3.5 2-2 4.5 4"/><circle cx="16" cy="9" r="1.4"/>',
};
function myItemsHTML(t) {
  ensureGear();
  const own = GEAR.filter(g => S.owned[g.id]), g0 = wearGeo(t, cutOf(S.level)), sl = wearSlots(), fx = miFx();
  const hid = g0 ? [!g0.wr && sl.wrist, (!g0.B.ft) && sl.leg, (!g0.B.ws) && sl.body && sl.body !== 'cape' ? sl.body : (!g0.B.ft && sl.body === 'cape' ? 'cape' : null)].filter(Boolean).map(id => GEAR_BY[id].name) : [];
  const nOn = Object.keys(sl).length;
  const slot = ([k]) => { const id = sl[k], g = id && GEAR_BY[id], hit = fx && fx.slot === k ? (fx.hl ? ' mihl' : fx.on ? ' mipop' : ' mipoof') : '';
    return g ? `<button class="eqs t${gearTier(g)}${hit}" data-act="eqSlot" data-v="${k}" data-id="${id}" aria-label="${SLOT_SHORT[k]} 칸 · ${g.name} 착용 중 · 눌러서 벗기"><span class="eqbox">${gearIcon(id)}</span><small>${SLOT_SHORT[k]}</small></button>`
      : `<button class="eqs empty${hit}" data-act="eqSlot" data-v="${k}" aria-label="${SLOT_SHORT[k]} 칸 · 비어 있음"><span class="eqbox"><svg viewBox="0 0 24 24" aria-hidden="true">${SLOT_GLYPH[k]}</svg></span><small>${SLOT_SHORT[k]}</small></button>`; };
  const cell = g => { const on = !!S.equipped[g.id], left = g.days ? gearLeft(g.id) : null, tr = gearTier(g);
    const hit = fx ? (fx.id === g.id ? (fx.on ? ' mipop' : ' mipoof') : fx.swap === g.id ? ' mipoof' : fx.hl === 1 && fx.slot === g.slot ? ' mihl' : '') : '';
    const tag = g.fx ? `+${g.fx.pct}%` : g.protect ? '보호' : '';
    return `<button class="bi t${tr}${on ? ' on' : ''}${hit}" data-act="wear" data-id="${g.id}" aria-pressed="${on}" aria-label="${g.name} · ${GEAR_TIER[tr]} · ${gearSlotName(g.slot)} · ${on ? '착용 중 · 눌러서 벗기' : '눌러서 착용'}"><span class="bibox">${gearIcon(g.id)}${on ? '<i class="bie">E</i>' : ''}${tag ? `<i class="bitag">${tag}</i>` : ''}${left != null ? `<i class="bid${left <= GEAR_CFG.warnDays ? ' soon' : ''}">${left}일</i>` : ''}</span><b>${g.name}</b></button>`; };
  return `<div class="myitems v196" id="myItems">
  <div class="mihd"><b>장비 <span class="micnt">${nOn}/${GEAR_SLOTS.length}</span></b><span>${nOn ? '칸을 누르면 벗어요' : '가방에서 골라 착용해요'}</span></div>
  <div class="eqbar" id="eqBar">${GEAR_SLOTS.map(slot).join('')}</div>
  <div class="mihd bagh"><b>가방 <span class="micnt">${own.length}</span></b><span class="tierkey">${[1, 2, 3].map(n => `<i class="tk t${n}"></i>${GEAR_TIER[n]}`).join('')}</span></div>
  ${own.length ? `<div class="bag" id="bagGrid">${own.map(cell).join('')}</div><div class="bagnote">눌러서 착용 · 다시 누르면 벗기 · 자리마다 1개(같은 자리는 바꿔 껴요)</div>` : '<div class="miempty" id="bagEmpty">가방이 비어 있어요 · 아래 상점에서 구해 보세요</div>'}
  ${hid.length ? `<div class="minote">지금 단계는 팔다리가 없어서 ${hid.join('·')}${gjo(hid[hid.length - 1], '이', '가')} 그림에 안 보여요 · Lv.10부터 보여요(효과는 그대로 받아요)</div>` : ''}</div>`;
}
/* 운동기록 첫 화면 알약: 3개까지는 이름, 넘으면 한 줄로 */
function gearPills() {
  const on = GEAR.filter(g => S.equipped[g.id] && S.owned[g.id]);
  if (on.length > 3) return `<button class="pill eqpill" data-act="myItems" aria-label="장착 아이템 ${on.length}개 · 내 아이템에서 착용하고 벗기">장착 ${on.length}개<i>›</i></button>`;
  return on.map(g => `<button class="pill eqpill" data-act="myItems" data-id="${g.id}" aria-label="${g.name} · 내 아이템에서 착용하고 벗기">${g.name}<i>›</i></button>`).join('');
}
/* 🧪 시연 도구(주소에 ?demo=1 일 때만) — 날짜 앞당기기·달성 조건 흉내 */
function gearDemoCard() {
  const b = (act, v, l) => `<button class="chip" data-act="${act}" data-v="${v}">${l}</button>`;
  return `<div class="card demo" id="gearDemo" style="margin-top:12px"><div class="h3">🧪 시연 도구 · 장착 아이템</div><div class="muted">아이템 날짜: <b id="gearDemoDay">${gearToday()}</b>${S.gearShift ? ` (오늘 +${S.gearShift}일)` : ''} · 운동 ${gearCount()}번 · 연속 ${gearStreak()}주</div>
  <div class="chips white" style="margin-top:6px">${b('gearDay', 1, '+1일')}${b('gearDay', 7, '+7일')}${b('gearDay', 30, '+30일')}${b('gearDay', 0, '오늘로')}${b('gearDemo', 'cnt', '운동 +100번')}${b('gearDemo', 'streak', '연속 +4주')}${b('gearDemo', 'pt', '포인트 +5,000')}${b('gearDemo', 'miss', '운동 못 간 주 흉내')}${b('gearDemo', 'reset', '달성 흉내 지우기')}</div></div>`;
}
/* 버튼 — app.js 의 클릭 처리에서 부른다. 처리했으면 true */
function gearAct(a, v, id) {
  if (a === 'gslot') { S.gSlot = v; return true; }
  if (a === 'eqSlot') { ensureGear(); const cur = wearSlots()[v];
    if (cur) { gearToggle(cur); return true; }
    const has = GEAR.some(g => g.slot === v && S.owned[g.id]); MI_FX = { slot: v, hl: has ? 1 : 2, at: Date.now() };
    toast(has ? `가방에서 ${SLOT_SHORT[v]} 아이템을 눌러 착용해요` : `${SLOT_SHORT[v]} 아이템이 아직 없어요 · 아이템 상점에서 구할 수 있어요`); return true; }
  if (a === 'gearShop') { shClose(); S.sTab = 'look'; go('workout', 'shop'); return 'done'; }
  if (a === 'gearLock') { const g = GEAR_BY[id]; toast(gearBlock(g) || ''); return 'done'; }
  if (a === 'gearDay') { ensureGear(); S.gearShift = +v ? S.gearShift + +v : 0; gearTick(); return true; }
  if (a === 'gearDemo') { ensureGear();
    if (v === 'cnt') S.gearDemo.cnt += 100; else if (v === 'streak') S.gearDemo.streak = gearStreak() + 4; else if (v === 'pt') S.points += 5000; else if (v === 'reset') S.gearDemo = { cnt: 0, streak: null };
    else if (v === 'miss') { S.missSim = missWeek()[0]; S.missDone = null; save(); go('workout'); return 'done'; }   // v1.82: 지난주를 못 간 주로 치고 첫 화면에서 묻는 창을 띄운다
    gearTick(); return true; }
  return false;
}
