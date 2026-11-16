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
  const on = !S.equipped[id]; if (on) GEAR.forEach(o => { if (o.slot === g.slot) S.equipped[o.id] = false; });
  S.equipped[id] = on;
}
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
function myItemsHTML(t) {
  ensureGear();
  const own = GEAR.filter(g => S.owned[g.id]), g0 = wearGeo(t, cutOf(S.level)), sl = wearSlots();
  const hid = g0 ? [!g0.wr && sl.wrist, (!g0.B.ft) && sl.leg, (!g0.B.ws) && sl.body && sl.body !== 'cape' ? sl.body : (!g0.B.ft && sl.body === 'cape' ? 'cape' : null)].filter(Boolean).map(id => GEAR_BY[id].name) : [];
  const cell = g => { const on = !!S.equipped[g.id], left = g.days ? gearLeftText(g.id) : '';
    return `<button class="mi ${on ? 'on' : ''}" data-act="wear" data-id="${g.id}" aria-pressed="${on}" aria-label="${g.name} ${on ? '벗기' : '착용'}">${gearIcon(g.id)}<b>${g.name}</b><small>${on ? '착용 중 · 벗기' : '착용'}</small>${g.fx || g.protect ? `<span class="mifx">${g.fx ? `${g.fx.label} +${g.fx.pct}%` : g.id === 'amulet' ? `연속 보호 · ${on ? charmLeft() : 0}번 남음` : '연속 기록 보호'}</span>` : ''}${left ? `<span class="mileft">${left}</span>` : ''}</button>`; };
  const groups = GEAR_SLOTS.map(([k, l]) => [l, own.filter(g => g.slot === k)]).filter(x => x[1].length);
  return `<div class="myitems" id="myItems"><div class="mihd"><b>내 아이템 <span class="micnt">${own.length}</span></b><span>${own.length ? '눌러서 착용하고 벗어요 · 자리마다 1개' : ''}</span></div>
  ${own.length ? groups.map(([l, gs]) => `<div class="mislot">${l}</div><div class="migrid">${gs.map(cell).join('')}</div>`).join('') : '<div class="miempty">아직 가진 아이템이 없어요 · 아래 상점에서 구할 수 있어요</div>'}
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
  if (a === 'gearShop') { shClose(); S.sTab = 'look'; go('workout', 'shop'); return 'done'; }
  if (a === 'gearLock') { const g = GEAR_BY[id]; toast(gearBlock(g) || ''); return 'done'; }
  if (a === 'gearDay') { ensureGear(); S.gearShift = +v ? S.gearShift + +v : 0; gearTick(); return true; }
  if (a === 'gearDemo') { ensureGear();
    if (v === 'cnt') S.gearDemo.cnt += 100; else if (v === 'streak') S.gearDemo.streak = gearStreak() + 4; else if (v === 'pt') S.points += 5000; else if (v === 'reset') S.gearDemo = { cnt: 0, streak: null };
    else if (v === 'miss') { S.missSim = missWeek()[0]; S.missDone = null; save(); go('workout'); return 'done'; }   // v1.82: 지난주를 못 간 주로 치고 첫 화면에서 묻는 창을 띄운다
    gearTick(); return true; }
  return false;
}
