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

/* 가짜 회원 — sessions [센터 id | null(레슨 V3), 그 센터에서 이번 주에 번 경험치 합, 방문한 날 수(없으면 1)]. 친구 5명은 친구리그 주간 XP 와 합이 같게 */
const RK_MEMBERS = [
  ['운동하는곰', 'koa', 27, [['sillim', 900, 2], ['bongcheon', 840, 3], [null, 400]]],                // 2곳 · 방문은 봉천 3 > 신림 2(경험치는 신림이 많음)
  ['새벽러너', 'saetbyeol', 41, [['sillim', 300, 2], ['bongcheon', 380, 2], ['snu', 300]]],           // 3곳 · 방문 동률(신림 2·봉천 2) → 경험치 많은 봉천
  ['벤치왕', 'ttukbi', 33, [['sillim', 1650]]],
  ['필라테스러', 'mungchi', 12, [['snu', 610]]],
  ['헬린이9일차', 'bamtol', 4, [['sillim', 420]]],
  ['근손실방지위원장', 'imu', 58, [['bongcheon', 1500, 2], ['sillim', 900, 3], [null, 300]]],        // 2곳 · 방문은 신림 3 > 봉천 2(경험치는 봉천이 많음)
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
/* 시연 «센터 회원 많음» — 신림점 48명 추가(총 60명+), 나는 40위 언저리 → 내 순위 줄 하단 고정 확인용 */
const RK_TYPES = ['koa', 'saetbyeol', 'ttukbi', 'mungchi', 'bamtol', 'imu', 'capy', 'ppiyak', 'dot', 'shadow', 'youngcha', 'rilla'];
const RK_CROWD = Array.from({ length: 48 }, (_, i) => ({ member_id: 'c' + i, nickname: `신림헬린이${String(i + 1).padStart(2, '0')}`, t: RK_TYPES[i % RK_TYPES.length], lv: 5 + (i * 7) % 60,
  hide_in_center_ranking: false, ss: [['sillim', 2300 - i * 33]] }));
const rkMembers = () => (S.rkCrowd ? RK_MEMBERS.concat(RK_CROWD) : RK_MEMBERS);

const ensureRk = () => {
  S.rkTab = S.rkTab || 'friend';
  S.homeManual = S.homeManual || []; S.homeRemoved = S.homeRemoved || [];
  S.rkHome = S.rkHome || 'multi'; S.rkMeDemo = S.rkMeDemo ?? true;
  S.hideRank = !!S.hideRank; S.rkCrowd = !!S.rkCrowd;
};
const rkWeekStart = () => weekDays()[0];
const rkDay = i => weekDays()[Math.min(i, 6)];
function rkMySessions() {
  const wd = weekDays(), out = [];
  S.records.filter(r => wd.includes(r.date) && !r.demo && !r.paid && r.v !== 'self').forEach(r => {
    out.push({ member_id: 'me', center_id: r.v === 'auto' ? rkCenterIdOf(r.place) : null, date: r.date, verify: r.v === 'auto' ? 'V1' : 'V3', xp_league: Math.max(0, (r.xp || 0) - (r.xpBoost || 0)) });
  });
  if (S.rkMeDemo && S.rkHome !== 'none') [['sillim', 420, 0], ['sillim', 380, 1], ['bongcheon', 310, 2]].concat(S.rkHome === 'many' ? [['gangnam_long', 260, 3]] : [])
    .forEach(([c, xp, d]) => out.push({ member_id: 'me', center_id: c, date: rkDay(d), verify: 'V1', xp_league: xp }));
  return out;
}
function rkWorld() {
  const ws = rkWeekStart(), sessions = rkMySessions();
  /* 방문한 날 수만큼 날짜가 다른 행으로 나눈다(경험치 합은 그대로) */
  rkMembers().forEach(m => m.ss.forEach(([c, xp, n = 1]) => { const each = Math.floor(xp / n);
    for (let i = 0; i < n; i++) sessions.push({ member_id: m.member_id, center_id: c, date: rkDay(i), verify: c ? 'V1' : 'V3', xp_league: i ? each : xp - each * (n - 1) }); }));
  const me = { member_id: 'me', nickname: '나', t: S.type, lv: S.level, me: true, hide_in_center_ranking: S.hideRank };
  return { ws, sessions, members: [...rkMembers(), me], me };
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

const rkRow = (m, val, sub) => `<div class="rank ${m.me ? 'me' : ''}" data-mid="${m.member_id}"><div class="no">${m.rank}</div><div class="av">${S.placeholder ? `<img src="${placeholderSrc(m.lv)}" alt="">` : charAvatar(m.t, m.lv, 40, m.me)}</div>
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
  <div class="card" id="rkBoard"><div class="rkhd"><b>${esc(c.name)}</b><small>이번 주에 이 센터에 입장해서 모은 경험치 순위예요 · 월요일 0시에 새로 시작</small></div>
  ${board.length ? board.slice(0, 100).map(m => rkRow(m, m.weekly_xp, m.me ? `${esc(CH[m.t].name)} · 이번 주 전체 ${fmt(nat.me || 0)} XP` : `${esc(CH[m.t].name)} · Lv.${m.lv}`)).join('') : '<div class="muted" style="padding:14px 0">이번 주 이 센터 기록이 아직 없어요</div>'}</div>
  ${rkMeBar(board, '이번 주 이 센터 기록이 아직 없어요')}
  <div class="muted" style="margin-top:8px">닉네임·캐릭터만 보여요(실명 없음) · 여러 센터를 다니면 센터마다 거기서 번 경험치만 따로 계산해요 · 센터 TV 랭킹과 같아요</div>`;
}
function vNationTab(W) {
  const board = CenterRank.nationalBoard(W.sessions, W.members, W.ws), cw = CenterRank.centerWeeklyXP(W.sessions, W.ws);
  /* v1.44(형 11-12 확정): 이름 옆 센터 = 그 주에 가장 많이 다닌 센터 — 입장(V1)한 날 수 최다 → 같으면 그 주 그 센터에서 번 경험치 많은 곳 → 그래도 같으면 마지막 방문이 최근인 곳 → 센터 id 순.
     레슨(V3)은 센터가 없어 안 센다. 입장 기록이 없으면 센터를 안 적는다. (v1.43 까지: 그 주 경험치를 가장 많이 번 센터) */
  const visits = {};
  W.sessions.forEach(s => { if (s.verify !== 'V1' || !s.center_id || !rkCenter(s.center_id) || !weekDays().includes(s.date)) return;
    const v = (visits[s.member_id] = visits[s.member_id] || {})[s.center_id] = visits[s.member_id][s.center_id] || { days: new Set(), last: '' };
    v.days.add(s.date); if (s.date > v.last) v.last = s.date; });
  const mainCenter = id => { const v = visits[id]; if (!v) return '';
    const best = Object.keys(v).sort((a, b) => v[b].days.size - v[a].days.size || ((cw[b] || {})[id] || 0) - ((cw[a] || {})[id] || 0) || v[b].last.localeCompare(v[a].last) || a.localeCompare(b))[0];
    return rkCenter(best).name; };
  return `<div class="card" id="rkBoard"><div class="rkhd"><b>니짐내짐 전국</b><small>이번 주에 운동해서 모은 경험치 순위예요 · 입점 헬스장에서 '입장하기'로 들어가서 운동한 기록만 반영돼요 · <span style="white-space:nowrap">월요일 0시에 새로 시작</span></small></div>
  ${board.slice(0, 100).map(m => rkRow(m, m.weekly_xp, `${esc(CH[m.t].name)}${mainCenter(m.member_id) ? ' · ' + esc(mainCenter(m.member_id)) : ''}`)).join('')}</div>
  ${rkMeBar(board, '이번 주 랭킹에 들어갈 운동 기록이 아직 없어요')}
  <div class="muted" style="margin-top:8px">닉네임·캐릭터만 보여요(실명 없음) · 옆에 적힌 센터는 그 회원이 가장 많이 다닌 곳이에요 · 센터 TV 전국 순위와 같아요</div>`;
}
const rkTabs = () => { const none = !rkHomeList().length;
  return `<div class="rktabs" id="rkTabs">${[['friend', '친구리그'], ['center', none ? '근처 입점센터' : '내 센터'], ['nation', '전국']].map(([k, l]) => `<button class="${S.rkTab === k ? 'on' : ''}" data-act="rkTab" data-v="${k}">${l}</button>`).join('')}</div>`; };
const rkDemo = () => `${demoCard('내 센터', 'rkHome', S.rkHome, [['multi', '2곳 다님'], ['many', '많음·긴 이름'], ['none', '입점 이용 없음']])}
  <div class="card demo" style="margin-top:-4px"><div class="row"><span>이번 주 내 센터 기록 시연(신림 2회·봉천 1회)</span><button class="sw ${S.rkMeDemo ? 'on' : ''}" data-act="rkMeDemo"></button></div>
  <div class="row"><span>센터 회원 많음(신림점 60명+)</span><button class="sw ${S.rkCrowd ? 'on' : ''}" data-act="rkCrowd" id="rkCrowdDemo"></button></div>
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
  <div class="row"><div><span>센터 랭킹에 안 보이기</span><div class="muted">켜면 모든 센터의 TV 랭킹 화면과 앱 «내 센터»·«전국» 랭킹에서 내 닉네임·캐릭터가 빠져요 · 친구리그는 그대로</div></div><button class="sw ${S.hideRank ? 'on' : ''}" data-act="hideRank" id="hideRankSw"></button></div>
  <div class="row"><div><span>내 센터 관리</span><div class="muted">${rkHomeList().length}곳 · 자동 등록·직접 추가</div></div><button class="btn sm ghost" data-act="rkManage">관리</button></div></div>
  <div class="card" id="locCard">`); };
SUB.friends = vRanking;
/* 시연 기록을 켜면 친구리그의 «나» 주간 XP 도 같은 값(전국 xp_week)으로 — 탭마다 내 점수가 달라 보이지 않게 */
const rankList0 = rankList;
rankList = function () {
  ensureRk(); const l = rankList0(); if (!S.rkMeDemo || S.rkHome === 'none') return l;
  const me = l.find(f => f.me); me.week = CenterRank.nationalWeeklyXP(rkMySessions(), rkWeekStart()).me || me.week;
  if (S.fTab === 'week') { l.forEach(f => { f.key = f.week; }); l.sort((a, b) => b.key - a.key); }
  return l;
};

/* ===== v1.67 친구리그에 자가 기록 포함(형 11-15 결정 ① — 결정 38 «리그는 V1·V3만» 가운데 친구리그만 바뀜) =====
   센터·전국 랭킹(rkMySessions → CenterRank, DID 랭킹판)은 그대로 입장·레슨 기록만. 경험치 계산·배율·하루 한도(engine.js)는 손대지 않는다.
   여기서는 «친구리그에 얼마를 세느냐»만 정한다. 부정 기록 대책(친구리그 집계에만 적용, 받은 경험치는 그대로):
   ① 운동을 시작해 끝낼 때까지 FR_SELF.minDur분 이상 걸린 기록만 ② 한꺼번에 적은 기록(batch)·24시간 보류 중인 기록 제외
   ③ 자가 기록은 하루 FR_SELF.dayMax XP까지만 친구리그에 ④ 프로필에 «입장 확인된 운동 / 직접 적은 운동» 몫을 친구에게 공개 */
const FR_SELF = { minDur: 10, dayMax: 200 };
const FR_SELF_DEMO = { 새벽러너: 160, 필라테스러: 240, 헬린이9일차: 480, 오늘도출근: 120, 퇴근후스쿼트: 200 };   // 가짜 친구의 이번 주 자가 기록 몫(센터·전국 표에는 안 들어감)
const frSelfOk = r => !r.batch && !r.held && (r.dur == null || r.dur >= FR_SELF.minDur);
function frSelfWeek() {
  const wd = weekDays(), byDay = {}; let skipped = 0;
  S.records.forEach(r => { if (!wd.includes(r.date) || r.v !== 'self' || r.demo || r.paid || r.sim) return;
    if (!frSelfOk(r)) { skipped++; return; }
    byDay[r.date] = (byDay[r.date] || 0) + Math.max(0, (r.xp || 0) - (r.xpBoost || 0)); });
  return { self: Object.values(byDay).reduce((s, x) => s + Math.min(x, FR_SELF.dayMax), 0), skipped };
}
const rankList1 = rankList;
rankList = function () {
  const l = rankList1(), mine = frSelfWeek();
  l.forEach(f => { f.entered = f.week; f.self = f.me ? mine.self : (FR_SELF_DEMO[f.n] || 0); f.week = f.entered + f.self; });
  if (S.fTab === 'week') { l.forEach(f => { f.key = f.week; }); l.sort((a, b) => b.key - a.key); }
  return l;
};
function frFootHTML() {
  const m = frSelfWeek();
  return `<div class="muted" style="margin-top:8px" id="frFoot">친구리그는 집이든 야외든 어디서 운동해도 순위에 들어가요 · 이름을 누르면 프로필이 보여요</div>${m.skipped ? `<div class="muted" id="frSkip" style="margin-top:4px">이번 주 기록 ${m.skipped}건은 친구리그 순위에서 빠졌어요 · 시작하고 ${FR_SELF.minDur}분 이상 운동한 기록만 순위에 들어가요</div>` : ''}`;
}
/* 결과 화면 — 친구리그에서 빠지는 자가 기록에만 한 줄(보류 기록은 보류 안내가 따로 있어 안 띄움) */
function frResultNote(rec) {
  const inv = invResultNote(rec);
  if (!rec || rec.v !== 'self' || rec.demo || rec.held || frSelfOk(rec) || !friendsAll().length) return inv;
  return `${inv}<div class="muted capline" id="frSkipNote">${rec.batch ? '운동을 마치고 한꺼번에 적은 기록은 친구리그 순위에 안 들어가요' : `시작한 지 ${FR_SELF.minDur}분이 안 돼 끝낸 기록이라 친구리그 순위에는 안 들어가요`} · 경험치는 그대로 받았어요</div>`;
}
/* 프로필 — 이번 주 친구리그 경험치와 그 몫(친구·나만) */
const vProfile1 = SUB.profile;
SUB.profile = () => {
  const html = vProfile1(), key = S.prof || 'me', prev = S.fTab; S.fTab = 'week';
  const f = rankList().find(x => (key === 'me' ? x.me : x.n === key)); S.fTab = prev;
  if (!f) return html;
  /* 카드를 따로 두면 «응원» 버튼이 첫 화면 밖으로 밀려서, 캐릭터 카드 맨 아래 두 줄로 넣는다 */
  return html.replace(/<\/div>(\s*)<div class="card" id="profRatio">/, `<div id="profWeek" class="profwk"><b>이번 주 친구리그 ${fmt(f.week)} XP</b><span>입장하고 한 운동 ${fmt(f.entered)} XP · 그 밖의 운동 ${fmt(f.self)} XP</span></div></div>$1<div class="card" id="profRatio">`);
};

/* ===== v1.67 친구 초대 보상(형 11-15 결정 ⑥) — 초대한 사람·받은 사람 모두 꾸미기 아이템 1개 =====
   주는 때: 초대받은 사람이 가입한 뒤 «첫 운동 기록»(보류·한꺼번에 적기 제외, 자가 기록이면 10분 이상)을 저장했을 때 두 사람에게 1개씩.
   같은 헬스장 사람을 데려와도(입점 요청 화면의 «친구에게 보내기» 링크) 같은 규칙 — 더 주지 않는다. 경험치 부스터는 주지 않는다. */
const ensureInv = () => (S.invr = S.invr || { tickets: 0, by: null, byDone: false, at: 0, just: 0 });
const invLooks = () => ITEMS.filter(i => i.kind === 'look' && !S.owned[i.id]);
function invCheck() {
  const v = ensureInv(); if (!v.by || v.byDone) return;
  const r = S.records.find(r => r.id > v.at && !r.demo && !r.sim && !r.held && !r.paid && (r.v !== 'self' || frSelfOk(r)));
  if (r) { v.byDone = true; v.tickets++; v.just = r.id; save(); }
}
function invResultNote(rec) {
  invCheck(); const v = ensureInv();
  return rec && v.just === rec.id && v.tickets ? `<button class="notice tap" data-act="invPick" id="invJust" style="width:100%"><span>🎁 첫 운동 기록 완료! 초대 선물을 받아 가세요</span><b style="color:var(--rose)">고르기 ›</b></button>` : '';
}
function invTopHTML() {
  invCheck(); const v = ensureInv();
  return `${v.tickets ? `<button class="notice tap" data-act="invPick" id="invGift" style="width:100%"><span>🎁 초대 선물이 ${v.tickets}개 있어요</span><b style="color:var(--rose)">고르기 ›</b></button>` : ''}${v.by && !v.byDone ? `<div class="notice" id="invBy"><span><b>${esc(v.by)}</b>님 초대로 가입했어요 · 첫 운동을 기록하면 둘 다 꾸미기 아이템을 1개씩 받아요</span></div>` : ''}`;
}
const invDemoHTML = () => { const v = ensureInv();
  return `<div class="card demo" id="invDemo"><div class="h3">🧪 시연 도구 · 친구 초대 보상</div><div class="chips white"><button class="chip" data-act="invSimJoin">내 링크로 온 친구가 첫 운동 기록</button><button class="chip ${v.by && !v.byDone ? 'on' : ''}" data-act="invSimBy">초대받고 가입한 사람으로 보기</button><button class="chip" data-act="invSimFirst">(초대받은 쪽) 첫 운동 기록함</button><button class="chip" data-act="invSimReset">처음으로</button></div></div>`; };
function invPickSheet() {
  const v = ensureInv(), list = invLooks();
  if (!list.length) return sheet(`<div class="h2" id="invPickT">꾸미기 아이템을 이미 다 갖고 있어요</div><div class="muted" style="line-height:1.6">선물은 사라지지 않아요. 새 꾸미기 아이템이 나오면 그때 골라 주세요.</div><button class="btn" data-act="shClose" style="margin-top:14px">확인</button>`);
  sheet(`<div class="h2" id="invPickT" style="margin:0 0 4px">초대 선물 고르기</div><div class="muted">꾸미기 아이템 1개를 골라 주세요 · 받을 수 있는 선물 ${v.tickets}개</div>
  <div class="grid2 invgrid" id="invGrid" style="margin-top:12px">${list.map(i => `<div class="item">${itemImg(i)}<b>${i.name}</b><button class="btn" data-act="invTake" data-v="${i.id}">이걸로 받기</button></div>`).join('')}</div>
  <button class="btn ghost" data-act="shClose" style="margin-top:12px">나중에 고르기</button>`);
}
const vAddFriend1 = SUB.addFriend;
SUB.addFriend = () => vAddFriend1()
  .replace('<div class="card" id="myCode"', `${invTopHTML()}<div class="card" id="myCode"`)
  .replace('<div class="muted" style="margin-top:8px">링크를 받은 친구가 열면', `<div class="invrw" id="invRw">🎁 초대한 친구가 가입해서 첫 운동을 기록하면<br>나도 친구도 <b>꾸미기 아이템을 1개씩</b> 받아요</div><div class="muted" style="margin-top:8px">링크를 받은 친구가 열면`)
  .replace(/(<\/div>)$/, `${invDemoHTML()}$1`);
const vRanking1 = SUB.friends;
SUB.friends = () => { const h = vRanking1(); return S.rkTab === 'friend' ? h.replace('<div class="rktabs" id="rkTabs">', `${invTopHTML()}<div class="rktabs" id="rkTabs">`) : h; };
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v, I = ensureInv();
  const H = {
    invPick: () => { invPickSheet(); return true; },
    invTake: () => { const it = ITEMS.find(i => i.id === v); if (!it || !I.tickets || S.owned[v]) return true; S.owned[v] = 1; I.tickets--; I.just = 0; shClose(); toast(`${it.name}${typeof gjo === 'function' ? gjo(it.name, '을', '를') : ''} 받았어요 · 아이템 상점에서 장착할 수 있어요`); },
    invSimJoin: () => { I.tickets++; toast('내가 초대한 주말등산러님이 첫 운동을 기록했어요 · 초대 선물이 도착했어요'); },
    invSimBy: () => { I.by = '운동하는곰'; I.byDone = false; I.at = Date.now(); },
    invSimFirst: () => { if (!I.by || I.byDone) return toast('먼저 «초대받고 가입한 사람으로 보기»를 눌러 주세요'), true; I.byDone = true; I.tickets++; toast('첫 운동 기록 완료 · 초대 선물이 도착했어요'); },
    invSimReset: () => { S.invr = null; ensureInv(); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation();
  if (H[a]() !== undefined) return;
  save(); render();
}, true);

let rkScrollX = 0;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  const H = {
    rkTab: () => { S.rkTab = v; },
    rkCenter: () => { S.rkSel = v; },
    rkHome: () => { S.rkHome = v; S.rkSel = null; },
    rkMeDemo: () => { S.rkMeDemo = !S.rkMeDemo; },
    rkCrowd: () => { S.rkCrowd = !S.rkCrowd; },
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
