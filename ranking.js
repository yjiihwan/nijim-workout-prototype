'use strict';
/* 결정 40 — C15 랭킹 탭 3개 «친구리그 / 내 센터 / 전국» · 내 센터 여러 개 · «센터 랭킹에 안 보이기» 1개로 통합.
   순위 계산은 center_rank.js(CenterRank) — DID 랭킹판과 같은 파일. 여기는 가짜 데이터 + 화면만. */

/* 입점센터(전국) — «직접 추가» 검색 대상. 이름 긴 센터는 칩 잘림 시험용 */
const RK_CENTERS = [
  { id: 'sillim', name: '니짐 신림점', dist: '0.2km' },
  { id: 'bongcheon', name: '니짐 봉천점', dist: '1.8km' },
  { id: 'snu', name: '니짐 서울대입구점', dist: '2.6km' },
  { id: 'nakseong', name: '니짐 낙성대점', dist: '3.4km' },
  { id: 'sadang', name: '니짐 사당역점', dist: '5.1km' },
  { id: 'gangnam_long', name: '니짐 강남역 2번 출구 프리미엄 24시 피트니스 & 필라테스 스튜디오점', dist: '9.8km' },
  { id: 'sindaebang', name: '니짐 신대방삼거리역 퍼스널트레이닝 센터점', dist: '2.9km' },
];
const rkCenter = id => RK_CENTERS.find(c => c.id === id);
const rkCenterIdOf = place => { const c = RK_CENTERS.find(c => place && place.startsWith(c.name)); return c ? c.id : null; };

/* 가짜 회원 — sessions [센터 id | null(레슨 V3), 이 세션이 주간 경험치에 들어간 몫]. 친구 5명은 친구리그 주간 XP 와 합이 같게 */
const RK_MEMBERS = [
  ['운동하는곰', 'koa', 27, [['sillim', 900], ['bongcheon', 840], [null, 400]]],                      // 2곳
  ['새벽러너', 'saetbyeol', 41, [['sillim', 300], ['bongcheon', 380], ['snu', 300]]],                 // 3곳
  ['벤치왕', 'ttukbi', 33, [['sillim', 1650]]],
  ['필라테스러', 'mungchi', 12, [['snu', 610]]],
  ['헬린이9일차', 'bamtol', 4, [['sillim', 420]]],
  ['근손실방지위원장', 'imu', 58, [['bongcheon', 1500], ['sillim', 900], [null, 300]]],              // 2곳
  ['오늘도출근', 'capy', 22, [['sillim', 760]]],
  ['퇴근후스쿼트', 'ppiyak', 15, [['bongcheon', 540]]],
  ['숨김설정회원', 'dot', 70, [['sillim', 1200], ['bongcheon', 600], ['snu', 400]], true],           // 3곳 + 숨김 켬
  ['스쿼트요정', 'ppiyak', 22, [['sillim', 1100]]],
  ['삼대오백목표', 'shadow', 63, [['sillim', 1300], ['gangnam_long', 500]]],                         // 2곳
  ['요가하는밤', 'dot', 24, [['snu', 880]]],
  ['런닝맨', 'youngcha', 52, [['bongcheon', 1240]]],
  ['오운완직장인', 'capy', 9, [['sillim', 350], ['snu', 200], ['nakseong', 150]]],                   // 3곳
  ['닉네임이아주아주길어서두줄이될수도있는회원', 'rilla', 19, [['sillim', 980]]],
  ['퇴근후하체', 'rilla', 15, [['gangnam_long', 700]]],
  ['데드장인', 'imu', 88, [['sadang', 1800], [null, 600]]],
  ['아침형인간', 'dot', 74, [['nakseong', 1795]]],
  ['핏린이탈출', 'koa', 30, [['sindaebang', 1400]]],
].map(([nickname, t, lv, ss, hide], i) => ({ member_id: 'm' + i, nickname, t, lv, hide_in_center_ranking: !!hide, ss }));

/* 내 입장 기록(시연 보충) — 봉천점 2회(최근 30일) · 서울대입구점은 35일 전 1회뿐이라 자동 등록에서 빠진 상태 */
const RK_ME_EXTRA = [{ center_id: 'bongcheon', ago: 5 }, { center_id: 'bongcheon', ago: 16 }, { center_id: 'snu', ago: 35 }];
const RK_MANY = ['snu', 'nakseong', 'gangnam_long', 'sindaebang', 'sadang'];

const ensureRk = () => {
  S.rkTab = S.rkTab || 'friend';
  S.homeManual = S.homeManual || []; S.homeRemoved = S.homeRemoved || [];
  S.rkHome = S.rkHome || 'multi'; S.rkMeDemo = S.rkMeDemo ?? true;
  S.hideRank = !!S.hideRank;
};
const rkWeekStart = () => weekDays()[0];
function rkMySessions() {
  const wd = weekDays(), out = [];
  S.records.filter(r => wd.includes(r.date) && !r.demo && !r.paid && r.v !== 'self').forEach(r => {
    out.push({ member_id: 'me', center_id: r.v === 'auto' ? rkCenterIdOf(r.place) : null, date: r.date, verify: r.v === 'auto' ? 'V1' : 'V3', xp_league: Math.max(0, (r.xp || 0) - (r.xpBoost || 0)) });
  });
  if (S.rkMeDemo && S.rkHome !== 'none') [['sillim', 420], ['sillim', 380], ['bongcheon', 310]].concat(S.rkHome === 'many' ? [['gangnam_long', 260]] : [])
    .forEach(([c, xp]) => out.push({ member_id: 'me', center_id: c, date: rkWeekStart(), verify: 'V1', xp_league: xp }));
  return out;
}
function rkWorld() {
  const ws = rkWeekStart(), sessions = rkMySessions();
  RK_MEMBERS.forEach(m => m.ss.forEach(([c, xp]) => sessions.push({ member_id: m.member_id, center_id: c, date: ws, verify: c ? 'V1' : 'V3', xp_league: xp })));
  const me = { member_id: 'me', nickname: '나', t: S.type, lv: S.level, me: true, hide_in_center_ranking: S.hideRank };
  return { ws, sessions, members: [...RK_MEMBERS, me], me };
}
/* 내 센터 = CenterRank.homeCenters(입장 기록·직접 추가·직접 뺀 센터) */
function rkHomes() {
  if (S.rkHome === 'none') return [];
  const entries = S.records.filter(r => r.v === 'auto' && rkCenterIdOf(r.place)).map(r => ({ center_id: rkCenterIdOf(r.place), date: r.date }))
    .concat(RK_ME_EXTRA.map(e => ({ center_id: e.center_id, date: daysAgo(e.ago) })));
  const manual = S.rkHome === 'many' ? [...new Set([...S.homeManual, ...RK_MANY.filter(x => !S.homeRemoved.includes(x))])] : S.homeManual;
  return { list: CenterRank.homeCenters(entries, TODAY, manual, S.homeRemoved), entries };
}
const rkHomeList = () => { const h = rkHomes(); return Array.isArray(h) ? h : h.list; };
const rkSel = homes => (homes.some(h => h.center_id === S.rkSel) ? S.rkSel : CenterRank.defaultCenter(homes));

const rkRow = (m, val, sub) => `<div class="rank ${m.me ? 'me' : ''}" data-mid="${m.member_id}"><div class="no">${m.rank}</div><div class="av">${S.placeholder ? `<img src="${placeholderSrc(m.lv)}" alt="">` : charAvatar(m.t, m.lv, 40)}</div>
  <div class="rkn"><b>${esc(m.nickname)}</b><div class="muted">${sub}</div></div><div class="val">${fmt(val)}<small>XP</small></div></div>`;
function rkMeBar(board, label) {
  const m = board.find(x => x.me);
  const body = S.hideRank ? `<span>센터 랭킹에 안 보이는 중</span><button class="linkbtn" data-act="sub" data-v="settings">설정 ›</button>`
    : m ? `<span>내 순위 <b>${m.rank}위</b> <small>/ ${board.length}명</small></span><b>${fmt(m.weekly_xp)} XP</b>`
    : `<span>${label}</span><b>0 XP</b>`;
  return `<div class="rkme" id="rkMe">${body}</div>`;
}
function vCenterTab(W) {
  const homes = rkHomeList();
  if (!homes.length) {
    const near = RK_CENTERS.slice(0, 4);
    return `<div class="card" id="rkNear"><div class="h2" style="font-size:16px;margin:0 0 4px">근처 입점센터 보기</div>
      <div class="muted">입점센터에 입장하면 그 센터가 «내 센터»가 되고, 센터 회원끼리 이번 주 순위를 겨뤄요 · <b style="color:var(--rose)">경험치 1.5배</b></div>
      ${near.map(c => `<div class="row"><div><b>${esc(c.name)}</b><div class="muted">${c.dist} · 니짐 입점</div></div><span class="rkbadge">1.5배</span></div>`).join('')}
      <button class="btn" data-act="findCenter" id="rkFind">내주변 입점센터 보기</button>
      <button class="btn ghost" data-act="rkManage" id="rkAddFirst">다니는 센터 직접 추가</button></div>`;
  }
  const sel = rkSel(homes), c = rkCenter(sel), board = CenterRank.centerBoard(W.sessions, W.members, sel, W.ws);
  const nat = CenterRank.nationalWeeklyXP(W.sessions, W.ws);
  const chips = homes.map(h => `<button class="chip rkchip ${h.center_id === sel ? 'on' : ''}" data-act="rkCenter" data-v="${h.center_id}">${esc(rkCenter(h.center_id).name)}</button>`).join('');
  return `<div class="chips rkchips" id="rkChips">${chips}<button class="chip rkchip add" data-act="rkManage" id="rkManage">＋ 관리</button></div>
  <div class="card" id="rkBoard"><div class="rkhd"><b>${esc(c.name)}</b><small>이번 주 · 이 센터 입장으로 번 경험치만 · 월요일 0시 초기화</small></div>
  ${board.length ? board.slice(0, 20).map(m => rkRow(m, m.weekly_xp, m.me ? `${esc(CH[m.t].name)} · 이번 주 전체 ${fmt(nat.me || 0)} XP` : `${esc(CH[m.t].name)} · Lv.${m.lv}`)).join('') : '<div class="muted" style="padding:14px 0">이번 주 이 센터 기록이 아직 없어요</div>'}</div>
  ${rkMeBar(board, '이번 주 이 센터 기록이 아직 없어요')}
  <div class="muted" style="margin-top:8px">닉네임·캐릭터만 보여요(실명 없음) · 여러 센터를 다니면 센터마다 그 센터에서 번 경험치로만 세요 · 센터 TV 랭킹과 같은 순위</div>`;
}
function vNationTab(W) {
  const board = CenterRank.nationalBoard(W.sessions, W.members, W.ws), cw = CenterRank.centerWeeklyXP(W.sessions, W.ws);
  const mainCenter = id => { if (id === 'me') { const s = rkSel(rkHomeList()); return s ? rkCenter(s).name : ''; }
    let best = null, bx = 0; Object.keys(cw).forEach(c => { if ((cw[c][id] || 0) > bx) { bx = cw[c][id]; best = c; } }); return best ? rkCenter(best).name : ''; };
  return `<div class="card" id="rkBoard"><div class="rkhd"><b>니짐내짐 전국</b><small>이번 주 · 검증된 운동 경험치(입점 보너스 포함) · 월요일 0시 초기화</small></div>
  ${board.slice(0, 20).map(m => rkRow(m, m.weekly_xp, `${esc(CH[m.t].name)}${mainCenter(m.member_id) ? ' · ' + esc(mainCenter(m.member_id)) : ''}`)).join('')}</div>
  ${rkMeBar(board, '이번 주 검증된 운동 기록이 아직 없어요')}
  <div class="muted" style="margin-top:8px">닉네임·캐릭터만 보여요(실명 없음) · 센터 이름 = 그 회원이 가장 많이 다닌 센터 · 센터 TV 전국 순위와 같아요</div>`;
}
const rkTabs = () => { const none = !rkHomeList().length;
  return `<div class="rktabs" id="rkTabs">${[['friend', '친구리그'], ['center', none ? '근처 입점센터' : '내 센터'], ['nation', '전국']].map(([k, l]) => `<button class="${S.rkTab === k ? 'on' : ''}" data-act="rkTab" data-v="${k}">${l}</button>`).join('')}</div>`; };
const rkDemo = () => `${demoCard('내 센터', 'rkHome', S.rkHome, [['multi', '2곳 다님'], ['many', '많음·긴 이름'], ['none', '입점 이용 없음']])}
  <div class="card demo" style="margin-top:-4px"><div class="row"><span>이번 주 내 센터 기록 시연(신림 2회·봉천 1회)</span><button class="sw ${S.rkMeDemo ? 'on' : ''}" data-act="rkMeDemo"></button></div>
  <div class="row"><span>센터 랭킹에 안 보이기</span><button class="sw ${S.hideRank ? 'on' : ''}" data-act="hideRank" id="rkHideDemo"></button></div></div>`;
function vRanking() {
  ensureRk();
  if (S.rkTab === 'friend') return vFriends2().replace(subHead('랭킹 · 친구'), subHead('랭킹')).replace('<div class="sec">', `<div class="sec">${rkTabs()}`).replace(/(<\/div>)$/, `${rkDemo()}$1`);
  const W = rkWorld();
  return `${subHead('랭킹')}<div class="sec">${rkTabs()}${S.rkTab === 'center' ? vCenterTab(W) : vNationTab(W)}${rkDemo()}</div>`;
}

/* 내 센터 관리 시트 — 자동(최근 30일 입장)·직접 추가 표시, 빼기/추가, 30일 넘어 빠진 센터 안내 */
function rkManageSheet() {
  const h = rkHomes(), homes = Array.isArray(h) ? h : h.list, have = new Set(homes.map(x => x.center_id));
  const dropped = Array.isArray(h) ? [] : [...new Set(h.entries.map(e => e.center_id))].filter(id => !have.has(id) && !S.homeRemoved.includes(id));
  const src = x => x.source === 'manual' ? '직접 추가' : `자동 · 최근 30일 ${x.entries_30d}회 입장`;
  sheet(`<div class="h2" style="margin:0 0 4px">내 센터 관리</div><div class="muted">최근 30일에 입장한 입점센터는 자동으로 들어와요 · 30일 동안 입장이 없으면 자동 등록 센터만 빠지고, 직접 추가한 센터는 남아요</div>
  <div class="h3" style="margin-top:12px">내 센터 ${homes.length}곳</div>
  ${homes.map(x => `<div class="row rkmrow"><div><b>${esc(rkCenter(x.center_id).name)}</b><div class="muted">${src(x)}</div></div><button class="btn sm ghost" data-act="rkRemove" data-v="${x.center_id}">빼기</button></div>`).join('') || '<div class="muted">아직 없어요</div>'}
  ${dropped.map(id => `<div class="muted" style="margin-top:6px">${esc(rkCenter(id).name)} — 30일 넘게 입장이 없어 자동 등록에서 빠졌어요</div>`).join('')}
  <div class="h3" style="margin-top:14px">입점센터 추가</div>
  ${RK_CENTERS.filter(c => !have.has(c.id)).map(c => `<div class="row rkmrow"><div><b>${esc(c.name)}</b><div class="muted">${c.dist}${S.homeRemoved.includes(c.id) ? ' · 내가 뺀 센터(다시 입장해도 자동으로 안 들어와요)' : ''}</div></div><button class="btn sm" data-act="rkAdd" data-v="${c.id}">추가</button></div>`).join('')}
  <button class="btn ghost" data-act="shClose" style="margin-top:14px">닫기</button>`);
}

/* 설정(C13) — «센터 랭킹에 안 보이기» 1개(종전 «센터 화면에 안 보이기» 통합) + 내 센터 관리 */
const vSettingsRk0 = SUB.settings;
SUB.settings = () => { ensureRk(); return vSettingsRk0().replace('<div class="card" id="locCard">', `<div class="card" id="rankSetCard"><div class="h2" style="font-size:16px">센터 랭킹</div>
  <div class="row"><div><span>센터 랭킹에 안 보이기</span><div class="muted">켜면 모든 센터 TV(DID)와 앱 «내 센터»·«전국» 랭킹에서 내 닉네임·캐릭터가 빠져요 · 친구리그는 그대로</div></div><button class="sw ${S.hideRank ? 'on' : ''}" data-act="hideRank" id="hideRankSw"></button></div>
  <div class="row"><div><span>내 센터 관리</span><div class="muted">${rkHomeList().length}곳 · 자동 등록·직접 추가</div></div><button class="btn sm ghost" data-act="rkManage">관리</button></div></div>
  <div class="card" id="locCard">`); };
SUB.friends = vRanking;
/* 시연 기록을 켜면 친구리그의 «나» 주간 XP 도 같은 값(전국 xp_week)으로 — 탭마다 내 점수가 달라 보이지 않게 */
const rankList0 = rankList;
rankList = function () {
  ensureRk(); const l = rankList0(); if (!S.rkMeDemo || S.rkHome === 'none') return l;
  const me = l.find(f => f.me); me.week = CenterRank.nationalWeeklyXP(rkMySessions(), rkWeekStart()).me || me.week;
  if (S.fTab === 'week') { l.forEach(f => { f.key = f.rate * 10000 + f.week; }); l.sort((a, b) => b.key - a.key); }
  return l;
};

let rkScrollX = 0;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  const H = {
    rkTab: () => { S.rkTab = v; },
    rkCenter: () => { S.rkSel = v; },
    rkHome: () => { S.rkHome = v; S.rkSel = null; },
    rkMeDemo: () => { S.rkMeDemo = !S.rkMeDemo; },
    hideRank: () => { S.hideRank = !S.hideRank; toast(S.hideRank ? '센터 랭킹에서 숨겼어요 · 모든 센터 TV와 앱 랭킹에서 빠져요' : '센터 랭킹에 다시 보여요'); },
    rkManage: () => { rkManageSheet(); return true; },
    rkRemove: () => { if (S.homeManual.includes(v)) S.homeManual = S.homeManual.filter(x => x !== v); else if (!S.homeRemoved.includes(v)) S.homeRemoved.push(v); },
    rkAdd: () => { S.homeRemoved = S.homeRemoved.filter(x => x !== v); if (!S.homeManual.includes(v)) S.homeManual.push(v); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); ensureRk();
  const ch = $('rkChips'); rkScrollX = ch ? ch.scrollLeft : 0;
  if (H[a]() !== undefined) return;
  save(); render();
  if (a === 'rkRemove' || a === 'rkAdd') rkManageSheet();
  const ch2 = $('rkChips'); if (ch2) { ch2.scrollLeft = rkScrollX; const on = ch2.querySelector('.chip.on');
    if (on && (on.offsetLeft < ch2.scrollLeft || on.offsetLeft + on.offsetWidth > ch2.scrollLeft + ch2.clientWidth)) ch2.scrollLeft = on.offsetLeft - 16; }
}, true);

ensureRk();
if (S.tab === 'workout' && ['friends', 'settings'].includes(S.sub)) render();
