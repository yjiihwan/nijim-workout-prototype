'use strict';
/* v1.76 오운완 피드(형 11-16 확정 구성) — 운동기록 탭 «내 운동 / 오운완 피드»의 피드 쪽.
   ① 둘러보기(우리 센터 / 전체) ② 내 피드(3칸 격자) ③ 게시물 상세(내 것이면 공개 전환·삭제) ④ 다른 사람 피드(공개 게시물만) ⑤ 올리기 = 셀카 인증의 «피드에 공개» 스위치.
   범위 밖: 댓글·팔로우. 응원(누르기/취소·수)만.
   내 게시물 = S.records 중 사진이 있는 기록(rec.photo) · 공개 여부 rec.pub(true 만 공개) · 기본값 S.feedPub(null = 아직 안 물어봄).
   다른 사람 게시물·사진·응원 수는 시험판 예시(FEED_USERS·FEED_POSTS, 사진은 tools/build_feed_samples.py 가 그린 그림). 실서비스는 서버 자료로 바꾼다. */

const FEED_EMPTY = /[?&]feed=empty\b/.test(location.search);   // 빈 화면 확인용: 주소 끝 ?feed=empty → 예시 게시물 없이
const FEED_USERS = {
  u2: ['새벽러너', 'saetbyeol', 41, 'sillim'], u3: ['벤치왕', 'ttukbi', 33, 'sillim'], u4: ['헬린이9일차', 'bamtol', 4, 'sillim'],
  u5: ['근손실방지위원장', 'imu', 58, 'bongcheon'], u6: ['오늘도출근', 'capy', 22, 'sillim'], u7: ['스쿼트요정', 'ppiyak', 22, 'sillim'], u8: ['삼대오백목표', 'shadow', 63, 'sillim'],
  u9: ['요가하는밤', 'dot', 24, 'snu'], u10: ['런닝맨', 'youngcha', 52, 'bongcheon'], u11: ['닉네임이아주아주길어서두줄이될수도있는회원', 'rilla', 19, 'sillim'], u12: ['데드장인', 'imu', 88, 'sadang'],
  u13: ['필라테스러', 'mungchi', 12, 'snu'], u14: ['아침형인간', 'dot', 74, 'nakseong'],
};
const FW = (ex, ...sets) => ({ ex, sets: sets.map(([w, r]) => ({ w, r, done: true })) });
const FC = (ex, min, km) => ({ ex, min, km });
/* [게시물 id, 회원, 사진 번호, 며칠 전, 몇 시간 전, 운동 시간(분), 얻은 경험치, 받은 응원, 운동 목록] */
const FEED_POSTS = FEED_EMPTY ? [] : [
  ['m1', 'me', 1, 0, 1, 62, 240, 14, [FW('bench', [60, 10], [65, 8], [65, 8], [60, 10]), FW('lat_pulldown', [50, 12], [50, 12], [55, 10]), FC('treadmill', 15, 2.1)]],
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
  /* 같은 사람의 지난 사진 — 내 피드 격자 4칸(m1~m4)·다른 회원 격자 2칸(벤치왕)·7칸(삼대오백목표) */
  ['m2', 'me', 15, 3, 1, 58, 215, 10, [FW('lat_pulldown', [50, 12], [50, 12], [50, 10]), FW('leg_press', [110, 12], [110, 12])]],
  ['m3', 'me', 16, 6, 2, 50, 190, 7, [FW('bench', [57.5, 10], [60, 8], [60, 8])]],
  ['m4', 'me', 17, 9, 3, 35, 120, 12, [FC('treadmill', 35, 4.6)]],
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
  if (!plainObj(S.fdDemo)) S.fdDemo = {};
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
/* v1.91(형 11-17): «나» 정보는 여기 한 곳에서만 — 내 피드 탭·둘러보기 내 게시물·게시물 상세가 모두 이 값을 쓴다(닉네임은 랭킹과 같은 규칙 S.nick || '나') */
const fdMe = () => ({ id: 'me', nick: S.nick || '나', t: S.type, lv: S.level, center: fdMyCenters()[0], me: true });
const fdUser = id => { if (id === 'me') return fdMe(); const u = FEED_USERS[id]; return u ? { id, nick: u[0], t: u[1], lv: u[2], center: u[3] } : null; };
/* 시험판: 내 예시 셀카(FEED_POSTS 의 'me' 줄)의 공개 전환·삭제는 S.fdDemo[id] 에 적어 둔다 — 운동 기록(S.records)은 건드리지 않는다 */
const fdDemoOf = id => S.fdDemo[id] || {};
function fdPosts() {
  const now = Date.now();
  const myC = fdMyCenters()[0];
  const ex = FEED_POSTS.filter(([id, uid]) => uid !== 'me' || !fdDemoOf(id).del).map(([id, uid, img, ago, h, dur, xp, cheers, items]) => {
    const d = new Date(now - ago * 86400000 - h * 3600000); if (ago === 0 && d.getDate() !== new Date(now).getDate()) d.setTime(now - 60000 * 20);   // 자정 직후에도 «오늘» 게시물은 오늘로
    const me = uid === 'me', center = me ? myC : FEED_USERS[uid][3];
    return { id, uid, img: `assets/feed/f${String(img).padStart(2, '0')}.jpg?v=${VER}`, ts: +d, dur, xp, items, parts: fdParts(items), base: cheers, pub: me ? fdDemoOf(id).pub !== false : true, mine: me, demo: me, center, place: fdCenterName(center) };
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
    <div class="fdhead"><button class="fdwho" data-act="fdUser" data-id="${p.uid}">${fdAvatar(u)}<span class="fdname"><span class="fdnm"><b>${esc(u.nick)}${u.me && u.nick !== '나' ? ' <em>나</em>' : ''}</b>${bTagOf(u.me ? { me: true } : { n: u.nick, lv: u.lv })}</span><small>Lv.${u.lv}${p.place ? ` · ${esc(p.place)}` : ''}</small></span><i class="fdgo">›</i></button><span class="fdtime">${fdWhen(p.ts)}</span></div>
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
const fdMine = () => pfBody(pfPerson('me'), 'mine');

/* v1.92(형 11-17): 프로필 한 틀 — 내 캐릭터 «내 프로필», 오운완 피드 «내 피드», 다른 회원 프로필(랭킹·피드)을 모두 pfBody 하나로 그린다.
   랭킹 사람(이름)과 피드 사람(u2…)은 닉네임으로 이어 붙인다. 랭킹에 없는 피드 회원은 연속·업적을 레벨로 만든 시연 값. */
const fdUidByNick = n => Object.keys(FEED_USERS).find(k => FEED_USERS[k][0] === n) || null;
function pfPerson(key) {
  if (key === 'me') { const u = fdMe(); return { ...profileData('me'), n: u.nick, center: u.center, uid: 'me' }; }
  const uid = FEED_USERS[key] ? key : fdUidByNick(key), nick = uid ? FEED_USERS[uid][0] : key, d = profileData(nick);
  if (d) return { ...d, uid, center: uid ? FEED_USERS[uid][3] : null, known: true };
  if (!uid) return null;
  const [n, t, lv, center] = FEED_USERS[uid];
  return { n, t, lv, center, uid, ratio: 100, paid: 0, streak: 1 + lv % 9, ach: Math.min(achieveList().length - 1, 2 + Math.floor(lv / 5)), friend: false };
}
/* v1.95(형 11-17 «인스타 프로필처럼»): 맨 위 한 줄(작은 원형 캐릭터 + 오운완·받은 응원·연속) → 이름·Lv·대표배지 → 캐릭터·센터 → 버튼 하나 → 셀카 격자(좌우 끝까지).
   리그 XP·경험치 비율·배지판은 이 화면에서 뺐다(랭킹·첫 화면·내 캐릭터에 있음). ⛔큰 캐릭터·리그/경험치/배지 카드 되살리기 금지.
   view: 'mine' = 내가 보는 나 · 'other' = 남이 보는 화면(내 피드를 남 눈으로 볼 때 포함) — 💰 금액대·나만 보는 사진은 'mine'에서만 */
function pfAv(p, box = 80) {
  if (S.placeholder) return `<span class="pfav" style="width:${box}px;height:${box}px">${charAvatar(p.t, p.lv, box - 12)}</span>`;
  const c = cutOf(p.lv), [w, h] = CHARS[p.t].dims[c], me = !!p.me, tall = me && wearTall();
  const k = Math.min(box * (tall ? 0.94 : 1.18) / h, box * (tall ? 0.8 : 0.86) / w), dw = Math.round(w * k), dh = Math.round(h * k);   // 얼굴·상반신이 원을 채우게 키우고 다리 쪽은 원 밖으로
  const img = `<img src="assets/c/${p.t}/lv${c}.png?v=${VER}" style="width:${dw}px;height:${dh}px" alt="">`;
  return `<span class="pfav" style="width:${box}px;height:${box}px"><span class="cimg" style="width:${dw}px;height:${dh}px;margin-top:${Math.round(box * (tall ? 0.13 : 0.08))}px">${img}${me ? wearUnder(p.t, p.lv, false, k) + wearLayer(p.t, p.lv, false, k) : ''}</span></span>`;
}
function pfBody(p, view) {
  const own = !!p.me && view === 'mine';
  const posts = p.uid ? fdPosts().filter(x => x.uid === p.uid && (own || x.pub)) : [];
  const cheers = posts.reduce((a, x) => a + fdCheerN(x), 0);
  const cn = p.center && fdCenterName(p.center);
  const paid = !p.paid ? '' : own ? `<span class="pill paidpill" id="paidBadge">💰 ${PAID_TIER[p.paid]}</span>` : '<span class="pill paidpill" id="paidBadge">💰</span>';
  const top = `<div class="pftop" id="profCard">${pfAv(p)}<div class="pfnums" id="pfStat"><span><b id="fdStatN">${fmt(posts.length)}</b>오운완</span><span><b id="fdStatC">${fmt(cheers)}</b>받은 응원</span><span><b id="pfStreak">${fmt(p.streak)}주</b>연속</span></div></div>
    <div class="pfbio"><div class="pfname"><span class="name">${esc(p.n)}</span><span class="pill lvpill">Lv.${p.lv}</span>${bTagOf(p, 'profTag')}${paid}</div>
    <div class="pfsub">${esc(CH[p.t].name)}${cn ? ` · ${esc(cn)}` : ''}</div></div>`;
  const acts = own ? '<button class="pfbtn" data-act="fdAsOther" id="fdAsOther">다른 회원에게 보이는 내 프로필 보기</button>'
    : p.me || !p.known ? ''
    : p.friend ? `<button class="pfbtn" data-act="cheer" data-v="${esc(p.n)}" id="cheerBtn" ${S.fr.cheered[p.n] === TODAY ? 'disabled' : ''}>${S.fr.cheered[p.n] === TODAY ? '오늘 응원했어요 👏' : '친구 응원 👏'}</button>`
    : S.fr.sent.includes(p.n) ? '<button class="pfbtn" disabled>친구 요청 보냄</button>'
    : S.fr.recv.includes(p.n) ? `<button class="pfbtn pri" data-act="frAccept" data-v="${esc(p.n)}">친구 요청 수락</button>`
    : `<button class="pfbtn pri" data-act="frRequest" data-v="${esc(p.n)}" id="frReqBtn">친구 요청</button>`;
  const tab = '<div class="pfgtab" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/></svg></div>';
  const grid = posts.length ? `<div class="fdgrid pfgrid" id="fdGrid">${posts.map(x => `<button class="fdcell" data-act="fdPost" data-id="${x.id}" aria-label="${fdWhen(x.ts)} 게시물 보기"><img src="${x.img}" alt="" loading="lazy">${own && !x.pub ? `<span class="fdpriv">${fdLock()}</span>` : ''}</button>`).join('')}</div>`
    : `<div class="pfempty" id="fdEmpty"><b>${own ? '아직 찍은 오운완 셀카가 없어요' : '아직 공개한 오운완이 없어요'}</b><p>${own ? '운동 끝나고 오운완 셀카를 찍으면 여기에 쌓여요' : p.me ? '«피드에 공개»를 켠 사진만 다른 회원에게 보여요' : '새 게시물이 올라오면 여기에 보여요'}</p></div>`;
  return `<div class="pf ig" id="pf" data-view="${own ? 'mine' : 'other'}">${top}${acts ? `<div class="pfacts">${acts}</div>` : ''}${tab}${grid}</div>`;
}
/* 내 캐릭터 «내 프로필»·랭킹에서 누른 프로필 — 내용은 pfBody, 뒤로가기만 들어온 곳에 맞춘다 */
SUB.profile = () => {
  ensure2(); ensureFeed();
  const key = S.prof || 'me', p = pfPerson(key); if (!p) return SUB.friends();
  const back = S.profFrom || 'friends', label = { friends: '랭킹', me: '내 캐릭터', addFriend: '친구 추가' }[back] || '운동기록';
  return `${subHead(p.me ? '내 프로필' : '프로필', back, label)}<div class="sec fd">${pfBody(p, 'mine')}</div>`;
};
function vFeed() {
  ensureFeed();
  return `<div class="sec fd" id="feed"><div class="rktabs fdtabs" id="fdTabs"><button class="${S.feedTab === 'browse' ? 'on' : ''}" data-act="fdTab" data-v="browse">둘러보기</button><button class="${S.feedTab === 'mine' ? 'on' : ''}" data-act="fdTab" data-v="mine">내 피드</button></div>
  ${S.feedTab === 'mine' ? fdMine() : fdBrowse()}</div>`;
}
/* ----- 안쪽 화면(2뎁스): 하단 메뉴바 없이 위 뒤로가기 ----- */
const fdTop = () => S.fdNav[S.fdNav.length - 1] || null;
const fdHead = title => `<div class="subhead"><button data-act="fdBack" id="backBtn"><i>‹</i>${S.fdNav.length > 1 ? '뒤로' : S.fdRet ? '프로필' : '피드'}</button><div class="h2">${title}</div></div>`;
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
    <div class="card fdcard detail"><div class="fdhead"><button class="fdwho" data-act="fdUser" data-id="${p.uid}">${fdAvatar(u)}<span class="fdname"><span class="fdnm"><b>${esc(u.nick)}${u.me && u.nick !== '나' ? ' <em>나</em>' : ''}</b>${bTagOf(u.me ? { me: true } : { n: u.nick, lv: u.lv })}</span><small>Lv.${u.lv}${p.place ? ` · ${esc(p.place)}` : ''}</small></span><i class="fdgo">›</i></button><span class="fdtime">${fdWhen(p.ts)}</span></div>
      <div class="fdphoto big"><img src="${p.img}" alt="${esc(u.nick)} 님의 오운완 셀카">${manage && !p.pub ? `<span class="fdprivtag" id="fdPrivTag">${fdLock()} 나만 보는 사진</span>` : ''}</div>
      ${fdSum(p)}${fdCheerRow(p)}</div>
    <div class="card" id="fdExList"><div class="h3">이날 한 운동</div>${rows}</div>
    ${manage ? `<div class="card" id="fdManage"><div class="row"><div><span><b>피드에 공개</b></span><div class="muted" id="fdPubDesc">${p.pub ? '다른 회원이 보고 응원할 수 있어요' : '지금은 나만 볼 수 있어요'}</div></div><button class="sw ${p.pub ? 'on' : ''}" data-act="fdPub" data-id="${p.id}" id="fdPubSw" role="switch" aria-checked="${p.pub}" aria-label="피드에 공개"></button></div></div>
    <button class="btn ghost delrec" data-act="fdDel" data-id="${p.id}" id="fdDel">게시물 삭제</button><div class="muted fdnote" id="fdManageNote">공개를 끄면 나만 봐요 · 표정·자세한 기록·💰 금액대는 다른 회원에게 안 보여요</div>` : ''}</div>`;
}
function vFeedUser() {
  ensureFeed(); const top = fdTop(), u = top && fdUser(top.id);
  if (!u) return `${fdHead('오운완 피드')}<div class="sec"><div class="card fdempty"><b>찾을 수 없는 회원이에요</b></div></div>`;
  ensure2(); const p = pfPerson(u.id);
  return `${fdHead(u.me ? '다른 회원이 보는 내 프로필' : '프로필')}<div class="sec fd" id="fdUser">${u.me ? '<div class="notice fdasnote" id="fdAsNote"><span>공개한 사진만 보여요. 나만 보는 사진·💰 금액대는 안 나와요.</span></div>' : ''}${pfBody(p, 'other')}</div>`;
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

function fdOpen(entry) { const top = fdTop(); if (!top) { S.fdY = window.scrollY; S.fdRet = S.sub === 'profile' ? 'profile' : null; } else top.y = window.scrollY; S.fdNav.push(entry); S.tab = 'workout'; S.sub = entry.k === 'post' ? 'fpost' : 'fuser'; save(); render(); window.scrollTo(0, 0); }
function fdBack() {
  S.fdNav.pop(); const top = fdTop();
  if (top) { S.sub = top.k === 'post' ? 'fpost' : 'fuser'; save(); render(); window.scrollTo(0, top.y || 0); return; }
  if (S.fdRet) { S.sub = S.fdRet; S.fdRet = null; save(); render(); window.scrollTo(0, S.fdY || 0); return; }
  S.sub = null; S.wseg = 'feed'; save(); render(); window.scrollTo(0, S.fdY || 0);
}
/* 게시물을 지운 뒤 돌아갈 곳 — 들어온 곳이 프로필이면 거기로, 아니면 내 피드 */
function fdAfterDel() { S.fdNav.pop(); const top = fdTop(); S.sub = top ? (top.k === 'post' ? 'fpost' : 'fuser') : S.fdRet || null; if (!top) { if (!S.fdRet) { S.wseg = 'feed'; S.feedTab = 'mine'; } S.fdRet = null; } }
document.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]'); if (tb) { if (Array.isArray(S.fdNav)) S.fdNav = []; S.fdRet = null; return; }
  const b = e.target.closest('[data-act]'); if (!b || b.closest('#evo')) return;
  const a = b.dataset.act, id = b.dataset.id, v = b.dataset.v;
  if (!/^fd[A-Z]/.test(a)) { if (a === 'back' || a === 'sub') { S.fdNav = []; S.fdRet = null; } return; }
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
  const demo = id && FEED_POSTS.some(r => r[0] === id && r[1] === 'me');
  if (demo && a === 'fdPub') { const y = window.scrollY, on = fdDemoOf(id).pub === false; S.fdDemo[id] = { pub: on }; save(); render(); window.scrollTo(0, y); return toast(on ? '피드에 공개했어요' : '나만 보는 사진으로 바꿨어요'); }
  if (demo && a === 'fdDelOk') { S.fdDemo[id] = { del: 1 }; shClose(); fdAfterDel(); save(); render(); window.scrollTo(0, 0); return toast('게시물을 지웠어요'); }
  const rec = id && S.records.find(r => 'r' + r.id === id);
  if (a === 'fdPub') { if (!rec) return; const y = window.scrollY; fdSetPub(rec, rec.pub !== true); save(); render(); window.scrollTo(0, y); return toast(rec.pub ? '피드에 공개했어요' : '나만 보는 사진으로 바꿨어요'); }
  if (a === 'fdDel') return (rec || demo) && sheet(`<div class="h2">이 게시물을 지울까요?</div><div class="muted" style="line-height:1.6;word-break:keep-all">사진이 지워지고 피드에서도 사라져요.<br>지운 사진은 되돌릴 수 없어요.<br>운동 기록과 경험치는 그대로 남아요.</div><div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="shClose">취소</button><button class="btn danger" data-act="fdDelOk" data-id="${id}" id="fdDelOk">지우기</button></div>`);
  if (a === 'fdDelOk') { if (!rec) return shClose(); rec.photo = null; rec.pub = false; rec.pubAt = null; shClose(); fdAfterDel(); save(); render(); window.scrollTo(0, 0); return toast('게시물을 지웠어요'); }
});



/* v1.89(형 11-17): 피드를 내려 위 «내 운동 / 오운완 피드» 전환 버튼이 화면 밖으로 나가면 왼쪽 위에 동그란 유리 뒤로가기를 띄운다 — 누르면 운동기록 첫 화면.
   둘러보기·내 피드 = 전환 버튼 기준, 다른 회원 피드 = 위 «‹ 피드» 줄 기준. 게시물 상세는 띄우지 않는다(위에 한 단계 뒤로가기가 있고 화면이 짧아 둘이 헷갈림). */
const fdFab = (() => {
  const b = document.createElement('button'); b.id = 'fdFab'; b.className = 'fdfab'; b.type = 'button'; b.dataset.act = 'fdHome'; b.setAttribute('aria-label', '운동기록 첫 화면으로'); b.tabIndex = -1;
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  $('app').appendChild(b); return b;
})();
const fdFabAnchor = () => S.tab !== 'workout' || !S.chosen ? null : !S.sub && S.wseg === 'feed' ? document.getElementById('fdTabs') :   /* v1.92: 피드 탭 줄이 다 지나간 뒤에만 — 반쯤 보이는 탭 위에 겹치던 것 */
   S.sub === 'fuser' ? document.querySelector('#view .subhead') : null;
/* v1.90: 사진이 좌우 꽉 차면서 버튼이 프로필 줄·응원하기 위에 자주 겹쳐 — 내리는 동안은 숨기고, 조금이라도 올리면 띄운다 */
let fdLastY = window.scrollY, fdUp = false;
function fdFabSync() {
  const y = window.scrollY; if (Math.abs(y - fdLastY) > 6) { fdUp = y < fdLastY; fdLastY = y; }
  const a = fdFabAnchor(), safe = (parseFloat(getComputedStyle(fdFab).top) || 10) - 10;   // 상태바 안전 여백 — 그 밑으로 들어가면 가려진 것으로 본다
  const on = !!a && fdUp && a.getBoundingClientRect().bottom <= safe;
  if (on !== fdFab.classList.contains('on')) { fdFab.classList.toggle('on', on); fdFab.tabIndex = on ? 0 : -1; }
}
{ let q = 0; const later = () => { if (!q) q = requestAnimationFrame(() => { q = 0; fdFabSync(); }); };
  window.addEventListener('scroll', later, { passive: true }); window.addEventListener('resize', later);
  new MutationObserver(fdFabSync).observe($('view'), { childList: true }); }

/* v1.88: 피드를 보던 채로 새로 고치면 이 파일이 app.js 첫 그리기보다 늦게 읽혀 «기록을 열 수 없어요» 화면이 떴다 — 읽힌 뒤 한 번 다시 그린다 */
if (S.tab === 'workout' && S.chosen && ((!S.sub && S.wseg === 'feed') || ['profile', 'fuser', 'fpost'].includes(S.sub))) render();
fdFabSync();
