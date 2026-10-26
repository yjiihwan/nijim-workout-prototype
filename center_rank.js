/* ===== 결정 40 센터 랭킹 공용 계산 — 앱 «내 센터»·«전국» 탭과 DID 랭킹판이 이 파일 하나를 같이 쓴다 =====
   (앱 프로토와 DID 시험판 repo 에 같은 파일을 복사해 둔다 — 고치면 둘 다 바꾸고 sha 를 맞춘다)
   세션 행 { member_id, center_id, date, verify, xp_league }
     xp_league = 그 세션이 주간 경험치(xp_week)에 실제로 들어간 몫(운동 장부 한도 적용 뒤 + 입점 보너스 주 900 적용 뒤, 아이템 제외) — PLAN §8 ⑨-1 A
   센터 점수 center_weekly_xp = 그 센터 V1(입장) 세션의 xp_league 합 → 센터별 합 ≤ xp_week, 여러 센터 다녀도 겹쳐 세지 않음 */
(function (root) {
  'use strict';
  const HOME_WINDOW_DAYS = 30;

  /* «센터 랭킹에 안 보이기»(계정 1개) — 켜면 모든 센터 DID·앱 내 센터·전국에서 빠진다(⑨-2 A). 옛 필드 hide_on_did 도 같은 뜻으로 읽는다 */
  const hiddenOf = m => !!(m && (m.hide_in_center_ranking === true || m.hide_on_did === true));
  const visible = list => (Array.isArray(list) ? list : []).filter(m => m && !hiddenOf(m) && m.nickname);

  const inWeek = (date, weekStart) => {
    if (!weekStart) return true;
    const d = new Date(date + 'T00:00:00') - new Date(weekStart + 'T00:00:00');
    return d >= 0 && d < 7 * 864e5;
  };

  /* center_weekly_xp: { center_id: { member_id: xp } } — V1 세션만(레슨 V3·자가 V0 는 센터 점수에 안 들어감) */
  function centerWeeklyXP(sessions, weekStart) {
    const out = {};
    (sessions || []).forEach(s => {
      if (!s || s.verify !== 'V1' || !s.center_id || !inWeek(s.date, weekStart)) return;
      const c = out[s.center_id] = out[s.center_id] || {};
      c[s.member_id] = (c[s.member_id] || 0) + Math.max(0, s.xp_league || 0);
    });
    return out;
  }
  /* 전국 xp_week = 검증 세션(V1·V3) 전부 */
  function nationalWeeklyXP(sessions, weekStart) {
    const out = {};
    (sessions || []).forEach(s => {
      if (!s || (s.verify !== 'V1' && s.verify !== 'V3') || !inWeek(s.date, weekStart)) return;
      out[s.member_id] = (out[s.member_id] || 0) + Math.max(0, s.xp_league || 0);
    });
    return out;
  }

  /* 순위표 — 점수 0 은 빼고, 동점은 닉네임순(화면마다 같은 순서). rank 는 숨김 회원을 뺀 뒤 매긴다 */
  function board(xpByMember, members) {
    const byId = {}; (members || []).forEach(m => { byId[m.member_id] = m; });
    return visible(Object.keys(xpByMember).map(id => byId[id] && { ...byId[id], weekly_xp: xpByMember[id] }))
      .filter(m => m.weekly_xp > 0)
      .sort((a, b) => b.weekly_xp - a.weekly_xp || String(a.nickname).localeCompare(String(b.nickname), 'ko'))
      .map((m, i) => ({ ...m, rank: i + 1 }));
  }
  const centerBoard = (sessions, members, centerId, weekStart) => board(centerWeeklyXP(sessions, weekStart)[centerId] || {}, members);
  const nationalBoard = (sessions, members, weekStart) => board(nationalWeeklyXP(sessions, weekStart), members);
  /* 서버가 xp_week 를 이미 계산해 준 행([{ member_id, weekly_xp, ... }]) — DID 전국 화면 */
  const rankRows = rows => board(Object.fromEntries((rows || []).filter(r => r && r.member_id).map(r => [r.member_id, r.weekly_xp || 0])), rows);

  /* 내 센터 목록 — 최근 30일 입장(V1)한 입점센터 자동 + 직접 추가(manual). 직접 뺀 센터(removed)는 다시 입장해도 자동으로 안 들어옴.
     entries = [{ center_id, date }] · 반환 [{ center_id, source:'auto'|'manual', entries_30d, last_entry_at }] 기본 선택 순서로 */
  function homeCenters(entries, today, manual, removed) {
    const t0 = new Date(today + 'T00:00:00').getTime(), st = {};
    (entries || []).forEach(e => {
      const age = (t0 - new Date(e.date + 'T00:00:00').getTime()) / 864e5;
      const s = st[e.center_id] = st[e.center_id] || { entries_30d: 0, last_entry_at: null };
      if (age >= 0 && age < HOME_WINDOW_DAYS) s.entries_30d++;
      if (!s.last_entry_at || e.date > s.last_entry_at) s.last_entry_at = e.date;
    });
    const rm = new Set(removed || []), man = new Set(manual || []), out = [];
    Object.keys(st).forEach(id => { if (st[id].entries_30d > 0 && !rm.has(id) && !man.has(id)) out.push({ center_id: id, source: 'auto', ...st[id] }); });
    man.forEach(id => out.push({ center_id: id, source: 'manual', entries_30d: st[id] ? st[id].entries_30d : 0, last_entry_at: st[id] ? st[id].last_entry_at : null }));
    return out.sort(cmpDefault);
  }
  /* 기본 선택 = 최근 30일 입장 최다 → 동점이면 마지막 입장이 최근 */
  const cmpDefault = (a, b) => b.entries_30d - a.entries_30d || String(b.last_entry_at || '').localeCompare(String(a.last_entry_at || ''));
  const defaultCenter = list => (list && list.length ? list.slice().sort(cmpDefault)[0].center_id : null);

  root.CenterRank = { HOME_WINDOW_DAYS, hiddenOf, visible, centerWeeklyXP, nationalWeeklyXP, centerBoard, nationalBoard, rankRows, homeCenters, defaultCenter };
})(typeof window !== 'undefined' ? window : globalThis);
