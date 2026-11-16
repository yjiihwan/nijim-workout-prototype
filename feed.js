'use strict';
/* v1.76 오운완 피드(형 11-16 확정 구성) — 운동기록 탭 «내 운동 / 오운완 피드»의 피드 쪽.
   ① 둘러보기(우리 센터 / 전체) ② 내 피드(3칸 격자) ③ 게시물 상세(내 것이면 공개 전환·삭제) ④ 다른 사람 피드(공개 게시물만) ⑤ 올리기 = 셀카 인증의 «피드에 공개» 스위치.
   범위 밖: 댓글·팔로우. 응원(누르기/취소·수)만.
   내 게시물 = S.records 중 사진이 있는 기록(rec.photo) · 공개 여부 rec.pub(true 만 공개) · 기본값 S.feedPub(null = 아직 안 물어봄).
   다른 사람 게시물·사진·응원 수는 시험판 예시(FEED_USERS·FEED_POSTS, 사진은 tools/build_feed_samples.py 가 그린 그림). 실서비스는 서버 자료로 바꾼다. */

const FEED_EMPTY = /[?&]feed=empty\b/.test(location.search);   // 빈 화면 확인용: 주소 끝 ?feed=empty → 예시 게시물 없이
const FEED_USERS = {
  u1: ['운동하는곰', 'koa', 27, 'sillim'], u2: ['새벽러너', 'saetbyeol', 41, 'sillim'], u3: ['벤치왕', 'ttukbi', 33, 'sillim'], u4: ['헬린이9일차', 'bamtol', 4, 'sillim'],
  u5: ['근손실방지위원장', 'imu', 58, 'bongcheon'], u6: ['오늘도출근', 'capy', 22, 'sillim'], u7: ['스쿼트요정', 'ppiyak', 22, 'sillim'], u8: ['삼대오백목표', 'shadow', 63, 'sillim'],
  u9: ['요가하는밤', 'dot', 24, 'snu'], u10: ['런닝맨', 'youngcha', 52, 'bongcheon'], u11: ['닉네임이아주아주길어서두줄이될수도있는회원', 'rilla', 19, 'sillim'], u12: ['데드장인', 'imu', 88, 'sadang'],
  u13: ['필라테스러', 'mungchi', 12, 'snu'], u14: ['아침형인간', 'dot', 74, 'nakseong'],
};
const FW = (ex, ...sets) => ({ ex, sets: sets.map(([w, r]) => ({ w, r, done: true })) });
const FC = (ex, min, km) => ({ ex, min, km });
/* [게시물 id, 회원, 사진 번호, 며칠 전, 몇 시간 전, 운동 시간(분), 얻은 경험치, 받은 응원, 운동 목록] */
const FEED_POSTS = FEED_EMPTY ? [] : [
  ['p1', 'u1', 1, 0, 1, 62, 240, 14, [FW('bench', [60, 10], [65, 8], [65, 8], [60, 10]), FW('lat_pulldown', [50, 12], [50, 12], [55, 10]), FC('treadmill', 15, 2.1)]],
  ['p2', 'u7', 6, 0, 3, 48, 195, 23, [FW('squat', [40, 12], [45, 10], [45, 10], [50, 8]), FW('leg_press', [90, 12], [100, 12], [100, 10]), FW('hip_thrust', [50, 12], [50, 12])]],
  ['p3', 'u11', 12, 0, 5, 95, 310, 6, [FW('bench', [50, 10], [50, 10], [52.5, 8]), FW('lat_pulldown', [40, 12], [40, 12], [45, 10]), FW('leg_press', [80, 12], [80, 12]), FW('chest_press', [35, 12], [35, 12]), FC('treadmill', 25, 3.2)]],
  ['p4', 'u5', 5, 0, 8, 75, 280, 31, [FW('squat', [100, 8], [110, 6], [110, 6], [100, 8]), FW('leg_press', [180, 10], [180, 10], [200, 8])]],
  ['p5', 'u2', 2, 1, 2, 40, 150, 9, [FC('treadmill', 40, 6.2)]],
  ['p6', 'u8', 8, 1, 4, 88, 330, 42, [FW('squat', [140, 5], [150, 3], [150, 3]), FW('bench', [100, 5], [105, 3], [105, 3]), FW('lat_pulldown', [70, 10], [70, 10])]],
  ['p7', 'u3', 3, 1, 9, 55, 210, 17, [FW('bench', [80, 8], [85, 6], [85, 6], [80, 8], [70, 10]), FW('chest_press', [60, 10], [60, 10], [60, 8])]],
  ['p8', 'u4', 4, 2, 1, 30, 96, 28, [FW('chest_press', [20, 12], [20, 12]), FW('lat_pulldown', [25, 12], [25, 12]), FC('treadmill', 10, 1.1)]],
  ['p9', 'u9', 9, 2, 6, 50, 160, 11, [FW('air_squat', [0, 20], [0, 20], [0, 15]), FW('pushup', [0, 12], [0, 10])]],
  ['p10', 'u6', 11, 2, 9, 45, 170, 5, [FW('lat_pulldown', [45, 12], [45, 12], [50, 10]), FW('chest_press', [40, 12], [40, 10])]],
  ['p11', 'u10', 10, 3, 2, 60, 220, 19, [FC('treadmill', 50, 8.4), FW('air_squat', [0, 20], [0, 20])]],
  ['p12', 'u12', 13, 3, 7, 80, 300, 37, [FW('squat', [160, 5], [170, 3], [170, 3]), FW('leg_press', [220, 8], [220, 8])]],
  ['p13', 'u13', 7, 4, 3, 50, 140, 8, [FW('air_squat', [0, 15], [0, 15]), FW('pushup', [0, 8], [0, 8], [0, 6])]],
  ['p14', 'u14', 14, 4, 10, 65, 250, 13, [FW('bench', [70, 8], [70, 8], [72.5, 6]), FC('treadmill', 20, 3)]],
  /* 같은 사람의 지난 사진 — 다른 사람 피드 격자 4칸(운동하는곰)·2칸(벤치왕)·7칸(삼대오백목표) */
  ['p15', 'u1', 15, 3, 1, 58, 215, 10, [FW('lat_pulldown', [50, 12], [50, 12], [50, 10]), FW('leg_press', [110, 12], [110, 12])]],
  ['p16', 'u1', 16, 6, 2, 50, 190, 7, [FW('bench', [57.5, 10], [60, 8], [60, 8])]],
  ['p17', 'u1', 17, 9, 3, 35, 120, 12, [FC('treadmill', 35, 4.6)]],
  ['p18', 'u3', 18, 5, 4, 60, 230, 15, [FW('bench', [80, 8], [82.5, 6], [82.5, 6]), FW('lat_pulldown', [60, 10], [60, 10])]],
  ['p19', 'u8', 19, 3, 2, 90, 340, 33, [FW('squat', [140, 5], [145, 5], [145, 4])]],
  ['p20', 'u8', 20, 5, 2, 85, 320, 29, [FW('bench', [100, 5], [100, 5], [102.5, 4])]],
  ['p21', 'u8', 21, 7, 2, 70, 260, 21, [FW('lat_pulldown', [70, 10], [75, 8], [75, 8])]],
  ['p22', 'u8', 22, 9, 2, 92, 335, 40, [FW('squat', [135, 5], [140, 5], [140, 5])]],
  ['p23', 'u8', 23, 11, 2, 80, 300, 26, [FW('bench', [97.5, 5], [100, 4], [100, 4])]],
  ['p24', 'u8', 24, 13, 2, 75, 280, 18, [FW('leg_press', [200, 10], [220, 8], [220, 8])]],
];
const FD_CHEER = '👏';
const FD_GLOBE = '<svg class="ico sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>';
const fdLock = () => LOCK.replace('class="ico"', 'class="ico sm"');

function ensureFeed() {
  if (S.feedTab !== 'mine') S.feedTab = 'browse';
  if (S.feedScope !== 'all') S.feedScope = 'center';
  if (S.feedPub !== true && S.feedPub !== false) S.feedPub = null;
  if (!plainObj(S.fdCheer)) S.fdCheer = {};
  if (!Array.isArray(S.fdNav)) S.fdNav = [];
}
const fdMyCenters = () => { try { const l = rkHomeList().map(h => h.center_id); return l.length ? l : ['sillim']; } catch { return ['sillim']; } };
const fdCenterName = id => { const c = typeof rkCenter === 'function' && rkCenter(id); return c ? c.name : ''; };
const fdMyRecs = () => S.records.filter(r => !r.demo && typeof r.photo === 'string' && r.photo.startsWith('data:'));
const fdPubCount = () => fdMyRecs().filter(r => r.pub === true).length;
/* 기록에 붙는 말(결과·기록 상세·설정): 공개했으면 «피드에 공개 중», 아니면 «나만 봐요» */
const photoWho = rec => rec && rec.pub === true && rec.photo ? '피드에 공개 중' : '나만 봐요';
/* 시험판: 내 게시물에 달리는 예시 응원 — 공개한 뒤 20초마다 1명씩, 게시물마다 3~8명까지 */
const fdMyCheers = r => r.pub === true && r.pubAt ? Math.min(3 + r.id % 6, Math.floor((Date.now() - r.pubAt) / 20000)) : (r.cheerKeep || 0);
const fdParts = items => { const out = []; (items || []).forEach(it => { const e = EX[it.ex]; const p = !e ? null : e.mode === 'lesson' ? '레슨' : e.mode === 'cardio' ? '유산소' : e.part; if (p && !out.includes(p)) out.push(p); }); return out; };
const fdDur = r => r.dur || Math.max(5, (r.items || []).reduce((a, it) => a + (it.min || ((it.sets || []).length * 3)), 0));
const fdWhen = ts => { const m = Math.floor((Date.now() - ts) / 60000), d0 = new Date(); d0.setHours(0, 0, 0, 0); const days = Math.ceil((d0 - ts) / 86400000);
  return ts >= +d0 ? (m < 1 ? '방금' : m < 60 ? `${m}분 전` : `${Math.floor(m / 60)}시간 전`) : days <= 1 ? '어제' : days < 7 ? `${days}일 전` : `${new Date(ts).getMonth() + 1}월 ${new Date(ts).getDate()}일`; };
const fdRecTs = r => r.id > 1e12 ? r.id : +new Date(r.date + 'T12:00:00');
const fdMe = () => ({ id: 'me', nick: S.nick || '나', t: S.type, lv: S.level, center: fdMyCenters()[0], me: true });
const fdUser = id => { if (id === 'me') return fdMe(); const u = FEED_USERS[id]; return u ? { id, nick: u[0], t: u[1], lv: u[2], center: u[3] } : null; };
function fdPosts() {
  const now = Date.now();
  const ex = FEED_POSTS.map(([id, uid, img, ago, h, dur, xp, cheers, items]) => {
    const d = new Date(now - ago * 86400000 - h * 3600000); if (ago === 0 && d.getDate() !== new Date(now).getDate()) d.setTime(now - 60000 * 20);   // 자정 직후에도 «오늘» 게시물은 오늘로
    return { id, uid, img: `assets/feed/f${String(img).padStart(2, '0')}.jpg?v=${VER}`, ts: +d, dur, xp, items, parts: fdParts(items), base: cheers, pub: true, center: FEED_USERS[uid][3], place: fdCenterName(FEED_USERS[uid][3]) };
  });
  const mine = fdMyRecs().map(r => ({ id: 'r' + r.id, uid: 'me', rec: r, img: r.photo, ts: fdRecTs(r), dur: fdDur(r), xp: r.xp, items: r.items || [], parts: fdParts(r.items), base: fdMyCheers(r), pub: r.pub === true, mine: true,
    center: r.placeKind === 'center' && typeof rkCenterIdOf === 'function' ? rkCenterIdOf(r.place) : null, place: r.place }));
  return ex.concat(mine).sort((a, b) => b.ts - a.ts);
}
const fdCheered = p => !p.mine && !!S.fdCheer[p.id];
const fdCheerN = p => p.base + (fdCheered(p) ? 1 : 0);
const fdAvatar = (u, box = 40) => `<span class="fdav" style="width:${box}px;height:${box}px">${u.me ? charAvatar(u.t, u.lv, box - 8, true) : charAvatar(u.t, u.lv, box - 8)}</span>`;
const fdSum = p => `<div class="fdsum">${p.parts.length ? `<span class="fdchip"><i>부위</i>${p.parts.slice(0, 3).join('·')}${p.parts.length > 3 ? ` 외 ${p.parts.length - 3}` : ''}</span>` : ''}<span class="fdchip"><i>운동</i>${p.dur}분</span><span class="fdchip xp"><i>경험치</i>+${fmt(p.xp)}</span></div>`;
function fdCheerRow(p) {
  const n = fdCheerN(p);
  if (p.mine) return `<div class="fdcheer mine" id="fdCheerMine">${FD_CHEER} ${n ? `<b>${fmt(n)}명</b>이 응원했어요` : p.pub ? '아직 받은 응원이 없어요' : '공개하면 응원을 받을 수 있어요'}</div>`;
  const on = fdCheered(p);
  return `<div class="fdcheer"><button class="fdcbtn ${on ? 'on' : ''}" data-act="fdCheer" data-id="${p.id}" aria-pressed="${on}">${FD_CHEER} ${on ? '응원했어요' : '응원하기'}</button><span class="fdcn">${n ? `<b>${fmt(n)}명</b>이 응원했어요` : '첫 응원을 보내 보세요'}</span></div>`;
}
function fdCard(p) {
  const u = fdUser(p.uid);
  return `<article class="card fdcard" data-post="${p.id}">
    <div class="fdhead"><button class="fdwho" data-act="fdUser" data-id="${p.uid}">${fdAvatar(u)}<span class="fdname"><b>${esc(u.nick)}${u.me && u.nick !== '나' ? ' <em>나</em>' : ''}</b><small>Lv.${u.lv}${p.place ? ` · ${esc(p.place)}` : ''}</small></span><i class="fdgo">›</i></button><span class="fdtime">${fdWhen(p.ts)}</span></div>
    <button class="fdphoto" data-act="fdPost" data-id="${p.id}" aria-label="게시물 자세히 보기"><img src="${p.img}" alt="${esc(u.nick)} 님의 오운완 셀카" loading="lazy"></button>
    ${fdSum(p)}${fdCheerRow(p)}</article>`;
}
function fdEmpty(title, desc, btn = '') {
  return `<div class="card fdempty" id="fdEmpty"><div class="fdemc">${charFit(S.type, S.level, 96)}</div><b>${title}</b><p>${desc}</p>${btn}</div>`;
}
function fdBrowse() {
  const mine = fdMyCenters(), all = fdPosts().filter(p => p.pub);
  const list = S.feedScope === 'center' ? all.filter(p => p.center && mine.includes(p.center)) : all;
  const scope = `<div class="chips fdscope" id="fdScope"><button class="${S.feedScope === 'center' ? 'on' : ''}" data-act="fdScope" data-v="center">우리 센터</button><button class="${S.feedScope === 'all' ? 'on' : ''}" data-act="fdScope" data-v="all">전체</button></div>`;
  const empty = S.feedScope === 'center' && all.length
    ? fdEmpty('우리 센터엔 아직 올라온 오운완이 없어요', '운동 끝나고 오운완 셀카를 올리면<br>우리 센터 첫 게시물이 돼요', '<button class="btn ghost" data-act="fdScope" data-v="all" id="fdGoAll">전체 피드 보기</button>')
    : fdEmpty('아직 올라온 오운완이 없어요', '운동 끝나고 오운완 셀카를 찍을 때<br>«피드에 공개»를 켜면 여기에 올라와요');
  return `${scope}<div id="fdList">${list.length ? list.map(fdCard).join('') + '<div class="muted fdend">여기까지 다 봤어요</div>' : empty}</div>`;
}
/* 내 피드·다른 사람 피드 공용 — 위에 캐릭터·레벨·오운완 횟수·받은 응원, 아래 3칸 격자 */
function fdProfile(u, posts, mineView) {
  const cheers = posts.reduce((a, p) => a + fdCheerN(p), 0);
  const grid = posts.length ? `<div class="fdgrid" id="fdGrid">${posts.map(p => `<button class="fdcell" data-act="fdPost" data-id="${p.id}" aria-label="${fdWhen(p.ts)} 게시물 보기"><img src="${p.img}" alt="" loading="lazy">${mineView && !p.pub ? `<span class="fdpriv">${fdLock()}</span>` : ''}</button>`).join('')}</div>`
    : mineView ? fdEmpty('아직 찍은 오운완 셀카가 없어요', '운동 끝나고 오운완 셀카를 찍으면<br>여기에 차곡차곡 쌓여요')
    : `<div class="card fdempty" id="fdEmpty"><b>아직 공개한 오운완이 없어요</b><p>${u.me ? '«피드에 공개»를 켠 사진만 다른 회원에게 보여요' : '새 게시물이 올라오면 여기에 보여요'}</p></div>`;
  return `<div class="card fdprof" id="fdProf"><div class="fdpchar">${charFit(u.t, u.lv, 84)}</div><div class="fdpinfo"><b class="fdpnick">${esc(u.nick)}</b><small>Lv.${u.lv}${u.center && !u.me ? ` · ${esc(fdCenterName(u.center))}` : ` · ${esc(CH[u.t].name)}`}</small>
    <div class="fdstat"><span><b id="fdStatN">${fmt(posts.length)}</b>오운완</span><span><b id="fdStatC">${fmt(cheers)}</b>받은 응원</span></div></div></div>${grid}`;
}
function fdMine() {
  const posts = fdPosts().filter(p => p.mine), priv = posts.filter(p => !p.pub).length;
  return `${fdProfile(fdMe(), posts, true)}${posts.length ? `<div class="muted fdnote">${priv ? `${fdLock()} 자물쇠 표시는 나만 보는 사진이에요 · ` : ''}사진을 누르면 공개 여부를 바꾸거나 지울 수 있어요</div><button class="linkbtn quiet fdasother" data-act="fdAsOther" id="fdAsOther">다른 회원에게 보이는 내 피드 보기 ›</button>` : ''}`;
}
function vFeed() {
  ensureFeed();
  return `<div class="sec fd" id="feed"><div class="rktabs fdtabs" id="fdTabs"><button class="${S.feedTab === 'browse' ? 'on' : ''}" data-act="fdTab" data-v="browse">둘러보기</button><button class="${S.feedTab === 'mine' ? 'on' : ''}" data-act="fdTab" data-v="mine">내 피드</button></div>
  ${S.feedTab === 'mine' ? fdMine() : fdBrowse()}</div>`;
}
/* ----- 안쪽 화면(2뎁스): 하단 메뉴바 없이 위 뒤로가기 ----- */
const fdTop = () => S.fdNav[S.fdNav.length - 1] || null;
const fdHead = title => `<div class="subhead"><button data-act="fdBack" id="backBtn"><i>‹</i>${S.fdNav.length > 1 ? '뒤로' : '피드'}</button><div class="h2">${title}</div></div>`;
const fdItemTxt = it => { const e = EX[it.ex]; if (!e) return null; const sets = (it.sets || []).filter(s => s.done !== false);
  if (it.min) return [e.name, `${it.min}분${it.km ? ` · ${it.km}km` : ''}`];
  if (!sets.length) return null;
  const best = e.mode === 'wr' ? sets.reduce((a, s) => (s.w > a.w || (s.w === a.w && s.r > a.r) ? s : a), sets[0]) : null;
  return [e.name, `${sets.length}세트 · ${best ? (best.w ? `최고 ${kg(best.w)} × ${best.r}회` : `${sets.reduce((a, s) => a + (s.r || 0), 0)}회`) : e.mode === 't' ? `${sets.reduce((a, s) => a + (s.s || 0), 0)}초` : `${sets.reduce((a, s) => a + (s.r || 0), 0)}회`}`]; };
function vFeedPost() {
  ensureFeed(); const top = fdTop(), p = top && fdPosts().find(x => x.id === top.id), asOther = !!(top && top.as);
  if (!p || (!p.pub && (!p.mine || asOther))) return `${fdHead('오운완')}<div class="sec"><div class="card fdempty" id="fdGone"><b>볼 수 없는 게시물이에요</b><p>지워졌거나 비공개로 바뀌었어요</p></div></div>`;
  const u = fdUser(p.uid), manage = p.mine && !asOther;
  const rows = p.items.map(fdItemTxt).filter(Boolean).map(([n, t]) => `<div class="fdex"><b>${esc(n)}</b><span>${t}</span></div>`).join('') || '<div class="muted">자세한 기록이 없어요</div>';
  return `${fdHead('오운완')}<div class="sec fd fdpost" id="fdPost">
    <div class="card fdcard detail"><div class="fdhead"><button class="fdwho" data-act="fdUser" data-id="${p.uid}">${fdAvatar(u)}<span class="fdname"><b>${esc(u.nick)}${u.me && u.nick !== '나' ? ' <em>나</em>' : ''}</b><small>Lv.${u.lv}${p.place ? ` · ${esc(p.place)}` : ''}</small></span><i class="fdgo">›</i></button><span class="fdtime">${fdWhen(p.ts)}</span></div>
      <div class="fdphoto big"><img src="${p.img}" alt="${esc(u.nick)} 님의 오운완 셀카">${manage && !p.pub ? `<span class="fdprivtag" id="fdPrivTag">${fdLock()} 나만 보는 사진</span>` : ''}</div>
      ${fdSum(p)}${fdCheerRow(p)}</div>
    <div class="card" id="fdExList"><div class="h3">이날 한 운동</div>${rows}</div>
    ${manage ? `<div class="card" id="fdManage"><div class="row"><div><span><b>피드에 공개</b></span><div class="muted" id="fdPubDesc">${p.pub ? '다른 회원이 보고 응원할 수 있어요' : '지금은 나만 볼 수 있어요'}</div></div><button class="sw ${p.pub ? 'on' : ''}" data-act="fdPub" data-id="${p.id}" id="fdPubSw" role="switch" aria-checked="${p.pub}" aria-label="피드에 공개"></button></div></div>
    <button class="btn ghost delrec" data-act="fdDel" data-id="${p.id}" id="fdDel">게시물 삭제</button>` : ''}</div>`;
}
function vFeedUser() {
  ensureFeed(); const top = fdTop(), u = top && fdUser(top.id);
  if (!u) return `${fdHead('오운완 피드')}<div class="sec"><div class="card fdempty"><b>찾을 수 없는 회원이에요</b></div></div>`;
  const posts = fdPosts().filter(p => p.uid === u.id && p.pub);
  return `${fdHead(u.me ? '다른 회원이 보는 내 피드' : '오운완 피드')}<div class="sec fd" id="fdUser">${u.me ? '<div class="notice fdasnote" id="fdAsNote"><span>공개한 사진만 보여요. 나만 보는 사진은 여기에 안 나와요.</span></div>' : ''}${fdProfile(u, posts, false)}</div>`;
}
SUB.fpost = vFeedPost; SUB.fuser = vFeedUser;

/* ----- 셀카 인증의 «피드에 공개» ----- */
const fdTarget = () => S.selfieFor === 'session' ? S.session : S.records.find(r => r.id === S.lastResult);
const fdSetPub = (r, on) => { if (!r) return; if (on) { r.pub = true; if (!r.pubAt) r.pubAt = Date.now(); } else { if (r.pub === true && r.id) r.cheerKeep = fdMyCheers(r); r.pub = false; r.pubAt = null; } };
/* 사진을 찍은 직후(app.js saveShot) — 처음이면 한 번 묻고, 그다음부터는 지난번 고른 대로 */
function feedAfterShot() {
  ensureFeed(); const t = fdTarget(); if (!t) return;
  if (t.pub == null) fdSetPub(t, S.feedPub === true);
  if (S.feedPub === null) setTimeout(() => { if (S.sub === 'selfie' && S.selfieStep === 'done' && S.feedPub === null) sheet(`<div class="h2">이 사진, 오운완 피드에 올릴까요?</div>
    <div class="muted" style="line-height:1.6;word-break:keep-all">피드에 올리면 다른 회원들이 보고 응원할 수 있어요.<br>다음부터는 지금 고른 대로 맞춰 둘게요.<br>찍을 때마다 바꿀 수 있어요.</div>
    <div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="fdAsk" data-v="0" id="fdAskNo">나만 볼게요</button><button class="btn" data-act="fdAsk" data-v="1" id="fdAskYes">피드에 올릴게요</button></div>`); }, 0);
}
/* 셀카 «찍은 뒤» 화면(app.js vSelfie)에 끼우는 스위치 줄 */
function feedShotRow() {
  ensureFeed(); const t = fdTarget(), on = !!(t && t.pub === true);
  return `<div class="card fdshot" id="fdShotCard"><div class="row"><div><span><b>피드에 공개</b></span><div class="muted" id="fdShotDesc">${on ? (S.selfieFor === 'session' ? '운동을 끝내고 저장하면 오운완 피드에 올라가요' : '오운완 피드에 올라갔어요 · 끄면 바로 내려가요') : '꺼 두면 사진은 나만 봐요'}</div></div><button class="sw ${on ? 'on' : ''}" data-act="fdShotPub" id="fdShotSw" role="switch" aria-checked="${on}" aria-label="피드에 공개"></button></div></div>`;
}
const feedShotTitle = () => { const t = fdTarget(); return t && t.pub === true ? (S.selfieFor === 'session' ? '오운완! 피드에 올릴 사진이에요' : '오운완! 피드에 올렸어요') : '오운완! 나한테만 보여요'; };
const feedShotIcon = () => { const t = fdTarget(); return t && t.pub === true ? FD_GLOBE.replace('class="ico sm"', 'class="ico"') : LOCK; };

function fdOpen(entry) { const top = fdTop(); if (!top) S.fdY = window.scrollY; else top.y = window.scrollY; S.fdNav.push(entry); S.tab = 'workout'; S.sub = entry.k === 'post' ? 'fpost' : 'fuser'; save(); render(); window.scrollTo(0, 0); }
function fdBack() {
  S.fdNav.pop(); const top = fdTop();
  if (top) { S.sub = top.k === 'post' ? 'fpost' : 'fuser'; save(); render(); window.scrollTo(0, top.y || 0); return; }
  S.sub = null; S.wseg = 'feed'; save(); render(); window.scrollTo(0, S.fdY || 0);
}
document.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]'); if (tb) { if (Array.isArray(S.fdNav)) S.fdNav = []; return; }
  const b = e.target.closest('[data-act]'); if (!b || b.closest('#evo')) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  if (!/^fd[A-Z]/.test(a)) { if (a === 'back' || a === 'sub') S.fdNav = []; return; }
  ensureFeed();
  if (a === 'fdTab') { S.feedTab = v === 'mine' ? 'mine' : 'browse'; save(); render(); return; }
  if (a === 'fdScope') { S.feedScope = v === 'all' ? 'all' : 'center'; save(); render(); return; }
  if (a === 'fdBack') return fdBack();
  if (a === 'fdHome') { S.fdNav = []; S.wseg = 'mine'; return go('workout'); }   // v1.89 떠 있는 뒤로가기 → 운동기록 첫 화면(맨 위)
  if (a === 'fdAsOther') return fdOpen({ k: 'user', id: 'me', as: 1 });
  if (a === 'fdUser') {
    const top = fdTop(), prev = S.fdNav[S.fdNav.length - 2];
    if (top && top.k === 'post' && prev && prev.k === 'user' && prev.id === id) return fdBack();   // 그 사람 피드에서 들어온 게시물이면 되돌아가기
    if (id === 'me') { if (top && top.as) return; S.fdNav = []; S.sub = null; S.wseg = 'feed'; S.feedTab = 'mine'; save(); render(); window.scrollTo(0, 0); return; }
    return fdOpen({ k: 'user', id });
  }
  if (a === 'fdPost') { const top = fdTop(); return fdOpen({ k: 'post', id, as: top && top.as ? 1 : undefined }); }
  if (a === 'fdCheer') {
    const y = window.scrollY; if (S.fdCheer[id]) delete S.fdCheer[id]; else S.fdCheer[id] = 1;
    save(); render(); window.scrollTo(0, y); return;
  }
  if (a === 'fdShotPub') { const t = fdTarget(); if (!t) return; fdSetPub(t, t.pub !== true); S.feedPub = t.pub === true; save(); render(); return; }
  if (a === 'fdAsk') { const t = fdTarget(); S.feedPub = v === '1'; fdSetPub(t, S.feedPub); shClose(); save(); render(); return toast(S.feedPub ? '다음에도 피드에 올리는 걸로 맞춰 둘게요' : '다음에도 나만 보는 걸로 맞춰 둘게요'); }
  const rec = id && S.records.find(r => 'r' + r.id === id);
  if (a === 'fdPub') { if (!rec) return; const y = window.scrollY; fdSetPub(rec, rec.pub !== true); save(); render(); window.scrollTo(0, y); return toast(rec.pub ? '피드에 공개했어요' : '나만 보는 사진으로 바꿨어요'); }
  if (a === 'fdDel') return rec && sheet(`<div class="h2">이 게시물을 지울까요?</div><div class="muted" style="line-height:1.6;word-break:keep-all">사진이 지워지고 피드에서도 사라져요.<br>지운 사진은 되돌릴 수 없어요.<br>운동 기록과 경험치는 그대로 남아요.</div><div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn danger" data-act="fdDelOk" data-id="${id}" id="fdDelOk">지우기</button></div>`);
  if (a === 'fdDelOk') { if (!rec) return shClose(); rec.photo = null; rec.pub = false; rec.pubAt = null; shClose(); S.fdNav.pop(); const top = fdTop(); S.sub = top ? (top.k === 'post' ? 'fpost' : 'fuser') : null; if (!top) { S.wseg = 'feed'; S.feedTab = 'mine'; } save(); render(); window.scrollTo(0, 0); return toast('게시물을 지웠어요'); }
});



/* v1.89(형 11-17): 피드를 내려 위 «내 운동 / 오운완 피드» 전환 버튼이 화면 밖으로 나가면 왼쪽 위에 동그란 유리 뒤로가기를 띄운다 — 누르면 운동기록 첫 화면.
   둘러보기·내 피드 = 전환 버튼 기준, 다른 회원 피드 = 위 «‹ 피드» 줄 기준. 게시물 상세는 띄우지 않는다(위에 한 단계 뒤로가기가 있고 화면이 짧아 둘이 헷갈림). */
const fdFab = (() => {
  const b = document.createElement('button'); b.id = 'fdFab'; b.className = 'fdfab'; b.type = 'button'; b.dataset.act = 'fdHome'; b.setAttribute('aria-label', '운동기록 첫 화면으로'); b.tabIndex = -1;
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  $('app').appendChild(b); return b;
})();
const fdFabAnchor = () => S.tab !== 'workout' || !S.chosen ? null : !S.sub && S.wseg === 'feed' ? document.querySelector('#view .wseg') : S.sub === 'fuser' ? document.querySelector('#view .subhead') : null;
function fdFabSync() {
  const a = fdFabAnchor(), safe = (parseFloat(getComputedStyle(fdFab).top) || 10) - 10;   // 상태바 안전 여백 — 그 밑으로 들어가면 가려진 것으로 본다
  const on = !!a && a.getBoundingClientRect().bottom <= safe;
  if (on !== fdFab.classList.contains('on')) { fdFab.classList.toggle('on', on); fdFab.tabIndex = on ? 0 : -1; }
}
{ let q = 0; const later = () => { if (!q) q = requestAnimationFrame(() => { q = 0; fdFabSync(); }); };
  window.addEventListener('scroll', later, { passive: true }); window.addEventListener('resize', later);
  new MutationObserver(fdFabSync).observe($('view'), { childList: true }); }

/* v1.88: 피드를 보던 채로 새로 고치면 이 파일이 app.js 첫 그리기보다 늦게 읽혀 «기록을 열 수 없어요» 화면이 떴다 — 읽힌 뒤 한 번 다시 그린다 */
if (S.tab === 'workout' && !S.sub && S.chosen && S.wseg === 'feed') render();
fdFabSync();
