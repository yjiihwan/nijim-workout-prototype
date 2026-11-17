/* v1.94(형 11-17) 업적 → 분야별 배지 + 대표배지. 칭호(진화 단계 번호)는 화면에서 모두 뺐다.
   난이도 5단계(브론즈~레전드) · 딴 배지=난이도 색+획득일 · 못 딴 배지=회색+진행도 · 대표배지=딴 것 중 가장 어려운 것(같으면 최근 것).
   screens2.js 의 achieveList·achieveCard·achSheet 를 이 파일이 덮어쓴다(index 순서: screens2.js 바로 다음 — feed.js 첫 다시 그리기 전에 있어야 함). 관리자 «배지» 표·공유 카드도 같은 목록을 쓴다. */
const BT = [['bronze', '브론즈'], ['silver', '실버'], ['gold', '골드'], ['plat', '플래티넘'], ['legend', '레전드']];
const BD_CATS = [
  ['첫걸음', '처음 해 본 것들'], ['꾸준함', '쌓인 횟수와 연속 주'], ['골고루', '여러 운동·부위'], ['부지런함', '시간·장소'],
  ['유산소', '달린 거리'], ['레슨', '선생님 확인 레슨'], ['명예', '월간 순위 · 받은 달 표시'], ['프로', '3대(스쿼트+벤치+데드) 최고 무게 합계'],
];
Object.assign(AI, {
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1.5A3 3 0 0 0 8 10.5M16 6h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
  medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="m8.5 9.8-3-6.3h4l2.5 5M15.5 9.8l3-6.3h-4L12 8.5"/><path d="m12 12 .9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
  bar: '<path d="M2.5 12h19"/><path d="M5.5 8v8M8.5 6.5v11M18.5 8v8M15.5 6.5v11"/>',
  card: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M7 10.5h5M7 13.5h8"/><circle cx="16.5" cy="10.5" r="1.2"/>',
  pct: '<path d="M18 6 6 18"/><circle cx="7.5" cy="7.5" r="2.3"/><circle cx="16.5" cy="16.5" r="2.3"/>',
});
/* [id, 분야, 아이콘, 이름, 난이도(0~4), 조건 글, 목표, 단위, 업적 전용 꾸미기(옛 업적 24개에 있던 것)] */
const BD_DEF = [
  ['first_rec', '첫걸음', 'flag', '첫 기록', 0, '운동을 처음 기록', 1, '회', '새싹 배지'],
  ['first_selfie', '첫걸음', 'cam', '첫 오운완', 0, '오운완 셀카 첫 인증', 1, '회', '반짝 필름 테두리'],
  ['first_pr', '첫걸음', 'bolt', '첫 PR', 0, '내 최고 기록 처음 넘기', 1, '회', '번개 머리핀'],
  ['first_lesson', '첫걸음', 'teach', '첫 레슨', 0, '선생님 확인 레슨 1회', 1, '회', '호루라기 목걸이'],
  ['first_friend', '첫걸음', 'people', '첫 친구', 0, '친구 1명 맺기', 1, '명', '우정 팔찌'],
  ['cnt10', '꾸준함', '10', '운동 10회', 0, '운동한 날 10일', 10, '회', '동메달'],
  ['cnt50', '꾸준함', '50', '운동 50회', 1, '운동한 날 50일', 50, '회', '은메달'],
  ['cnt100', '꾸준함', '100', '운동 100회', 2, '운동한 날 100일', 100, '회', '금메달'],
  ['cnt300', '꾸준함', '300', '운동 300회', 3, '운동한 날 300일', 300, '회', '무지개 메달'],
  ['wk4', '꾸준함', 'flame', '4주 연속', 1, '4주 연속 운동(주 1번 이상)', 4, '주', '불꽃 리본'],
  ['wk12', '꾸준함', 'flame', '12주 연속', 2, '12주 연속 운동(주 1번 이상)', 12, '주', '불꽃 망토'],
  ['wk26', '꾸준함', 'flame', '26주 연속', 3, '26주(반년) 연속 운동(주 1번 이상)', 26, '주', '불사조 깃털'],
  ['ex10', '골고루', 'compass', '운동 10종', 0, '서로 다른 운동 10종 기록', 10, '종', '탐험가 모자'],
  ['part5', '골고루', 'pie', '한 주 5부위', 1, '한 주에 5부위 운동', 5, '부위', '저울 배지'],
  ['allpart', '골고루', 'pie', '4주 전 부위', 2, '4주(28일) 안에 8부위 모두 운동', 8, '부위', '오색 손목밴드'],
  ['dawn', '부지런함', 'sun', '새벽 운동', 0, '새벽 6시 전 운동 5회', 5, '회', '새벽 별 배경'],
  ['night', '부지런함', 'moon', '밤 운동', 0, '밤 10시 후 운동 5회', 5, '회', '달빛 배경'],
  ['place3', '부지런함', 'pin', '장소 3곳', 0, '장소 3곳에서 기록(집·야외 포함)', 3, '곳', '여행 스티커'],
  ['branch2', '부지런함', 'bldg', '지점 2곳', 1, '니짐 지점 2곳 방문(통합 멤버십)', 2, '곳', '지점 도장 수첩'],
  ['km10', '유산소', 'shoe', '첫 10km', 0, '유산소 거리 누적 10km', 10, 'km', '러닝 양말'],
  ['km100', '유산소', 'shoe', '누적 100km', 2, '유산소 거리 누적 100km', 100, 'km', '날개 운동화'],
  ['lesson10', '레슨', 'star', '레슨 10회', 1, '선생님 확인 레슨 10회', 10, '회', '선생님 사인 배지'],
  ['lesson30', '레슨', 'star', '레슨 30회', 2, '선생님 확인 레슨 30회', 30, '회', '황금 호루라기'],
  ['top10', '명예', 'pct', '센터 상위 10%', 1, '한 달 동안 내 센터 랭킹 상위 10%', 1, '회', ''],
  ['top5', '명예', 'pct', '센터 상위 5%', 2, '한 달 동안 내 센터 랭킹 상위 5%', 1, '회', ''],
  ['top1', '명예', 'pct', '센터 상위 1%', 3, '한 달 동안 내 센터 랭킹 상위 1%', 1, '회', ''],
  ['league1', '명예', 'crown', '리그 1위', 2, '친구 주간 리그 1위(받은 달 표시)', 1, '회', '리그 왕관(영구)'],
  ['mr_seoul', '프로', 'medal', '미스터 서울', 1, '', 4, '', ''],
  ['national', '프로', 'medal', '전국체전 금메달', 2, '', 5, '', ''],
  ['mr_korea', '프로', 'trophy', '미스터 코리아', 3, '', 6, '', ''],
  ['ifbb', '프로', 'card', 'IFBB 프로카드', 3, '', 6.5, '', ''],
  ['arnold', '프로', 'trophy', '아놀드 클래식 우승', 4, '', 7, '', ''],
  ['olympia', '프로', 'trophy', '미스터 올림피아', 4, '', 7.5, '', ''],
].map(([id, cat, icon, name, tier, cond, goal, unit, item]) => ({ id, cat, icon, name, tier, cond, goal, unit, item }));
/* 프로: 3대 합계가 체중의 ×배(체중 없으면 kg 고정) + 함께 채울 조건 */
const BD_PRO = { mr_seoul: [400], national: [500], mr_korea: [600, 'wk', 12], ifbb: [650, 'wk', 26], arnold: [700, 'cnt', 300], olympia: [750, 'wk', 52] };
const BD_BY = Object.fromEntries(BD_DEF.map(b => [b.id, b]));
const LIFT3 = ['squat', 'bench', 'deadlift'];

/* ----- 내 기록에서 값 계산 ----- */
function bdStats(rs) {
  const dates = new Set(rs.map(r => r.date));
  const exN = new Set(rs.flatMap(r => (r.items || []).map(i => i.ex)).filter(x => EX[x] && EX[x].mode !== 'lesson')).size;
  const places = new Set(rs.map(r => placeBase(r.place))).size, branches = new Set(rs.map(r => placeBase(r.place)).filter(p => p.startsWith('니짐 '))).size;
  const lessons = rs.filter(r => r.v === 'lesson').length;
  const prs = prEvents(rs).length + rs.reduce((a, r) => a + (r.items || []).reduce((b, i) => b + doneSets(i).filter(s => s.pr).length, 0), 0);
  const km = rs.reduce((a, r) => a + (r.items || []).reduce((b, i) => b + (i.km || 0), 0), 0);
  const weeks = {}; rs.forEach(r => { const k = weekStart(r.date); (weeks[k] = weeks[k] || []).push(r); });
  const parts5 = Math.max(0, ...Object.values(weeks).map(w => { const p = partSets(w); return PARTS.filter(x => x !== '유산소' && p[x]).length; }));
  // 4주 전 부위: 지금 28일만 보던 것을 «어느 28일이든»으로 — 한번 딴 배지가 시간이 지나 사라지지 않게
  const allPart = Math.max(0, ...[...dates].map(d => { const p = partSets(inRange(rs, addD(d, -27), d)); return PARTS.filter(x => p[x]).length; }));
  const best = ex => Math.max(0, ...rs.flatMap(r => (r.items || []).filter(i => i.ex === ex).flatMap(i => doneSets(i).map(s => s.w || 0))));
  const lift = S.bdLift ? +S.bdLift : LIFT3.reduce((a, ex) => a + best(ex), 0);
  return { n: dates.size, exN, places, branches, lessons, prs, km: Math.floor(km), parts5, allPart, lift,
    dawn: rs.filter(r => r.hour != null && r.hour < 6).length, night: rs.filter(r => r.hour != null && r.hour >= 22).length,
    photo: rs.some(r => r.photo || r.selfieXP > 0 || r.v === 'selfie') ? 1 : 0 };
}
const BD_REC = { first_rec: 'n', first_selfie: 'photo', first_pr: 'prs', first_lesson: 'lessons', cnt10: 'n', cnt50: 'n', cnt100: 'n', cnt300: 'n',
  ex10: 'exN', part5: 'parts5', allpart: 'allPart', dawn: 'dawn', night: 'night', place3: 'places', branch2: 'branches', km10: 'km', km100: 'km', lesson10: 'lessons', lesson30: 'lessons' };
const BD_HONOR = { none: [], some: [['top10', '2026-10']], all: [['top10', '2026-08'], ['top5', '2026-09'], ['top1', '2026-10'], ['league1', '2026-11']] };
const bdBw = () => S.bodyweight || null;
const proGoal = (b, goal) => bdBw() ? Math.round(bdBw() * goal) : (CFG.ACH[b.name] || {}).goal || BD_PRO[b.id][0];
const proCond = b => { const [kg, k, n] = BD_PRO[b.id], req = k === 'wk' ? ` + ${n}주 연속 운동` : k === 'cnt' ? ` + 운동 ${n}회` : '';
  return `3대 합계 ${bdBw() ? `체중의 ${b.goal}배(${proGoal(b, b.goal)}kg)` : `${proGoal(b, b.goal)}kg`}${req}`; };
const ymEnd = ym => { const [y, m] = ym.split('-').map(Number); return ymd(new Date(y, m, 0)); };

let BD_CACHE = { key: null, list: null };
function achieveList(all = false) {
  ensure2(); S.badgeAt = plainObj(S.badgeAt) ? S.badgeAt : {};
  const rs = byDate(statRecs()), streak = streakVal(), friends = friendsAll().length, honor = BD_HONOR[S.bdHonor || 'some'] || [];
  const key = [S.dataDemo, rs.length, rs.length && rs[rs.length - 1].id, rs.length && rs[rs.length - 1].date, streak, friends, S.bdHonor, S.bdLift, S.bodyweight, JSON.stringify(CFG.ACH)].join('|');
  if (BD_CACHE.key !== key) {
    const st = bdStats(rs), dl = [...new Set(rs.map(r => r.date))], memo = new Map();
    const at = d => memo.get(d) || (memo.set(d, bdStats(rs.filter(r => r.date <= d))), memo.get(d));
    const firstDate = ok => { if (!dl.length || !ok(st)) return null; let lo = 0, hi = dl.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (ok(at(dl[m]))) hi = m; else lo = m + 1; } return dl[lo]; };
    const mk = S.dataDemo || 'normal';
    BD_CACHE = { key, list: BD_DEF.map(b0 => {
      const o = CFG.ACH[b0.name] || {}, b = { ...b0, goal0: b0.goal, goal: b0.cat === '프로' ? b0.goal : o.goal || b0.goal, off: !!o.off };
      let cur, goal = b.goal, unit = b.unit, cond = b.goal === b.goal0 ? b.cond : b.cond.replace(String(b.goal0), String(b.goal)), date = null, ym = null, req = null;
      if (BD_REC[b.id]) { cur = st[BD_REC[b.id]]; date = firstDate(s => s[BD_REC[b.id]] >= goal); }
      else if (b.cat === '프로') { goal = proGoal(b, b.goal); unit = 'kg'; cur = st.lift; cond = proCond(b);
        const [, k, n] = BD_PRO[b.id]; if (k) req = { label: k === 'wk' ? '연속 운동' : '운동한 날', cur: k === 'wk' ? streak : st.n, goal: n, unit: k === 'wk' ? '주' : '회' }; }
      else if (b.cat === '명예') { const h = honor.filter(([id]) => id === b.id).pop(); cur = h ? 1 : 0; ym = h ? h[1] : null; date = ym ? ymEnd(ym) : null; }
      else cur = b.id === 'first_friend' ? friends : streak;
      let done = cur >= goal && (!req || req.cur >= req.goal);
      if (!BD_REC[b.id] && b.cat !== '명예') {   // 연속 주·친구·프로는 기록만으로 날짜를 못 짚어서, 처음 달성을 본 날을 적어 둔다(달성 뒤 끊겨도 배지는 남음)
        const mkey = `${mk}:${b.id}`; if (done && !S.badgeAt[mkey]) S.badgeAt[mkey] = b.cat === '꾸준함' ? addD(TODAY, -7 * Math.max(0, cur - goal)) : TODAY;   // 연속 주는 «지금 연속 − 목표» 주 전에 채운 것으로 본다
        if (S.badgeAt[mkey]) { done = true; date = S.badgeAt[mkey]; }
      }
      return { ...b, cond, cur: Math.min(cur, goal), goal, unit, done: done && !!(date || ym), date, ym, req };
    }) };
  }
  return BD_CACHE.list.filter(a => all || !a.off);
}
/* 대표배지: 가장 어려운 것 → 같으면 최근에 딴 것 → 그래도 같으면 목록 뒤쪽(더 어려운 조건) */
const bdPick = L => L.filter(a => a.done).reduce((m, a) => !m || a.tier > m.tier || (a.tier === m.tier && (a.date || '') >= (m.date || '')) ? a : m, null);

/* ----- 다른 회원(시연): 이름별로 딴 배지 [id, 날짜] — 없으면 레벨로 만든다 ----- */
const BD_PEOPLE = {
  근손실방지위원장: [['first_rec', '2025-11-03'], ['wk26', '2026-06-11'], ['mr_korea', '2026-05-20'], ['arnold', '2026-09-02']],
  데드장인: [['arnold', '2026-08-10'], ['olympia', '2026-10-21'], ['cnt300', '2026-11-01'], ['wk26', '2026-04-02']],
  새벽러너: [['wk26', '2026-07-01'], ['cnt300', '2026-10-05'], ['km100', '2026-11-10'], ['dawn', '2026-03-03']],
  벤치왕: [['first_pr', '2026-02-11'], ['national', '2026-09-14'], ['cnt50', '2026-10-30']],
  삼대오백목표: [['mr_seoul', '2026-07-07'], ['national', '2026-11-02'], ['wk12', '2026-08-01']],
  헬린이9일차: [['first_rec', '2026-11-08']],
  필라테스러: [['first_rec', '2026-08-02'], ['cnt10', '2026-09-01'], ['part5', '2026-10-02']],
  오늘도출근: [],
  닉네임이아주아주길어서두줄이될수도있는회원: [['first_rec', '2026-01-05'], ['arnold', '2026-10-01']],
};
const bdHash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
function bdOfPerson(name, lv = 1) {
  if (BD_PEOPLE[name]) return BD_PEOPLE[name].map(([id, d]) => ({ ...BD_BY[id], done: true, date: d, ym: BD_BY[id].cat === '명예' ? d.slice(0, 7) : null }));
  const h = bdHash(name), ids = ['first_rec', lv >= 6 && 'first_selfie', lv >= 10 && 'cnt10', lv >= 20 && 'wk4', lv >= 25 && 'cnt50', lv >= 40 && (h % 2 ? 'wk12' : 'cnt100'), lv >= 60 && (h % 3 ? 'national' : 'km100'), lv >= 75 && 'cnt300'].filter(Boolean);
  return ids.map((id, i) => ({ ...BD_BY[id], done: true, date: addD(TODAY, -((h >> i) % 40) - (ids.length - i) * 30) }));
}
const bdOf = p => !p ? [] : p.me ? achieveList().filter(a => a.done) : bdOfPerson(p.n || p.nickname, p.lv);
const repOf = p => bdPick(bdOf(p));
const bdIco = (a, sz = 0) => /^\d+$/.test(a.icon) ? `<b class="bnum${a.icon.length > 2 ? ' n3' : ''}">${a.icon}</b>` : `<svg viewBox="0 0 24 24">${AI[a.icon]}</svg>`;
const bdMark = (a, cls = '') => `<span class="bdg t-${BT[a.tier][0]} ${a.done ? 'on' : ''} ${cls}">${bdIco(a)}${a.done ? '' : `<span class="blk">${LOCK}</span>`}</span>`;
/* 닉네임 옆 이름표 — 대표배지 없으면 아무것도 안 붙인다 */
const bTag = (a, id = '') => a ? `<span class="btag t-${BT[a.tier][0]}"${id ? ` id="${id}"` : ''} title="대표 배지 · ${BT[a.tier][1]}"><i></i>${esc(a.name)}</span>` : '';
const bTagOf = (p, id) => bTag(repOf(p), id);
const bdWhen = a => a.ym ? `${a.ym.slice(0, 4)}년 ${+a.ym.slice(5)}월` : a.date ? a.date.replace(/-/g, '.') : '';
const bdProg = a => a.req && a.cur >= a.goal ? `${a.req.cur}/${a.req.goal}${a.req.unit}` : `${a.unit === 'kg' || a.unit === 'km' ? fmt(a.cur) : a.cur}/${fmt(a.goal)}${a.unit === 'kg' || a.unit === 'km' ? a.unit : ''}`;

function achieveCard() {
  const L = achieveList(), done = L.filter(a => a.done).length, rep = bdPick(L);
  const repBox = rep ? `<button class="bdrep tap" data-act="ach" data-v="${L.indexOf(rep)}" id="bdRep">${bdMark(rep, 'lg')}<div><small>대표 배지 · 닉네임 옆에 붙어요</small><b>${esc(rep.name)}</b><span class="btier t-${BT[rep.tier][0]}">${BT[rep.tier][1]}</span> <em>${bdWhen(rep)}</em></div></button>`
    : '<div class="bdrep none" id="bdRep"><div><small>대표 배지</small><b>아직 딴 배지가 없어요</b><em>첫 운동을 기록하면 «첫 기록» 배지를 받아요</em></div></div>';
  const legend = `<div class="bdleg" id="bdLegend">${BT.map(([k, l]) => `<span class="t-${k}"><i></i>${l}</span>`).join('')}</div>`;
  const secs = BD_CATS.map(([c, d]) => { const xs = L.filter(a => a.cat === c); if (!xs.length) return '';
    return `<section class="bdsec" id="bdSec${BD_CATS.findIndex(x => x[0] === c)}"><div class="bdh"><b>${c}</b><small>${d}</small><span>${xs.filter(a => a.done).length}/${xs.length}</span></div>
    <div class="achs">${xs.map(a => `<button class="ach tap ${a.done ? 'got' : ''}" data-act="ach" data-v="${L.indexOf(a)}" data-bid="${a.id}">${bdMark(a)}<small>${esc(a.name)}</small><em>${a.done ? bdWhen(a) : bdProg(a)}</em></button>`).join('')}</div></section>`; }).join('');
  return `<div class="card" id="achCard"><div class="bdtop"><div class="h2" style="font-size:16px;margin:0">배지</div><span class="muted"><b style="color:var(--ink)">${done}</b>/${L.length} 획득</span></div>
  ${repBox}${legend}${secs}</div>
  ${demoCard('배지', 'bdHonor', S.bdHonor || 'some', [['none', '명예 없음'], ['some', '명예 1개(10월)'], ['all', '명예 전부']])}
  <div class="card demo" style="margin-top:-4px"><div class="h3">🧪 시연 도구 · 3대 합계</div><div class="chips white">${[['', '내 기록대로'], ['520', '520kg'], ['760', '760kg']].map(([k, l]) => `<button class="chip ${String(S.bdLift || '') === k ? 'on' : ''}" data-act="bdLift" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="chips white" style="margin-top:6px">${[['normal', '기록 지금대로'], ['empty', '기록 0'], ['many', '20주치']].map(([k, l]) => `<button class="chip ${(S.dataDemo || 'normal') === k ? 'on' : ''}" data-act="dataDemo" data-v="${k}">${l}</button>`).join('')}</div></div>
  <button class="card replink tap" data-act="prof" data-v="me" id="goMyProfile"><div><b>내 프로필 미리보기</b><small>레벨·대표 배지·오운완 셀카 · 오운완 피드 «내 피드»와 같은 화면이에요</small></div><span class="muted">›</span></button>`;
}
function achSheet(i) {
  const a = achieveList()[i]; if (!a) return;
  const rep = bdPick(achieveList()), pct = Math.round(a.cur / Math.max(1, a.goal) * 100);
  sheet(`<div class="bdsh" id="bdSheet">${bdMark(a, 'xl')}<div class="h2" style="margin:10px 0 4px">${esc(a.name)}</div>
    <div><span class="btier t-${BT[a.tier][0]}" id="bdShTier">${BT[a.tier][1]}</span> <span class="muted">${a.cat}${a.done && rep && rep.id === a.id ? ' · 지금 대표 배지' : ''}</span></div></div>
  <div class="xrow" style="margin-top:12px"><span>조건</span><b id="bdShCond">${esc(a.cond)}</b></div>
  ${a.done ? `<div class="xrow"><span>획득</span><b id="bdShAt">${bdWhen(a)}</b></div>`
    : `<div class="xrow"><span>진행</span><b id="bdShProg">${bdProg(a)}</b></div><div class="bar thin"><i style="width:${pct}%"></i></div>`}
  ${a.req && !a.done ? `<div class="xrow"><span>${a.req.label}</span><b>${a.req.cur}/${a.req.goal}${a.req.unit}</b></div><div class="bar thin"><i style="width:${Math.round(Math.min(a.req.cur, a.req.goal) / a.req.goal * 100)}%"></i></div>` : ''}
  ${a.cat === '프로' ? `<div class="muted" style="margin-top:6px">3대 = 스쿼트·벤치프레스·데드리프트에서 든 가장 무거운 무게의 합이에요${bdBw() ? '' : ' · 설정에 체중을 넣으면 체중 대비 배수로 바뀌어요'} · 실제 대회 수상이 아니라 그 이름을 딴 운동기록 배지예요</div>` : ''}
  ${a.cat === '명예' ? '<div class="muted" style="margin-top:6px">한 달이 끝나면 정해지고, 받은 달이 함께 남아요</div>' : ''}
  ${a.item ? `<div class="xrow"><span>함께 받는 꾸미기</span><b>${a.item}</b></div>` : ''}
  <div class="muted" style="margin-top:6px">딴 배지 중 가장 어려운 배지가 대표 배지로 닉네임 옆에 붙어요</div>
  ${a.done ? `<button class="btn" data-act="shareAch" data-v="${i}" id="achShare" style="margin-top:14px">${NJ_SHARE_ICON_SVG()}자랑하기</button>` : ''}
  <button class="btn ${a.done ? 'ghost' : ''}" data-act="shClose" style="margin-top:${a.done ? 8 : 14}px">닫기</button>`);
}
/* 프로필 «배지» 줄 — 딴 배지를 어려운 순으로 */
function bdStrip(p) {
  const L = bdOf(p).sort((a, b) => b.tier - a.tier || (b.date || '').localeCompare(a.date || '')), total = BD_DEF.length;
  return `<div class="card" id="profBadges"><div class="bdtop"><div class="h3" style="margin:0">배지</div><span class="muted"><b style="color:var(--ink)">${L.length}</b>/${total}</span></div>
  ${L.length ? `<div class="bdstrip">${L.slice(0, 5).map(a => `<span class="bdsi">${bdMark(a)}<small>${esc(a.name)}</small></span>`).join('')}</div>` : '<div class="muted" style="padding:6px 0">아직 딴 배지가 없어요</div>'}
  ${p.me ? '<button class="linkbtn quiet" data-act="sub" data-v="me" id="profBdAll">배지판 전체 보기 ›</button>' : ''}</div>`;
}
SUB.me = () => vMe0().replace(/<div class="card"><div class="h2" style="font-size:16px">업적<\/div>.*?<\/div><\/div>/, achieveCard());

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  if (a === 'bdHonor') S.bdHonor = v; else if (a === 'bdLift') S.bdLift = v ? +v : null; else return;
  save(); render();
});
/* 첫 그리기(app.js 끝)는 이 파일보다 먼저라 «내 캐릭터»면 배지판으로 한 번 다시 그린다(피드·프로필은 feed.js 끝에서 다시 그림) */
if (S.tab === 'workout' && S.chosen && S.sub === 'me') render();
