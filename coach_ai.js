'use strict';
/* v1.78 첫 화면 캐릭터 말풍선 — AI가 운동기록을 보고 쓰는 «오늘의 한마디».
   · 이 화면은 중계 서버만 부른다(AI 키는 서버에만 있음). 서버 코드·지시문 = workout_coach_relay_20261116
   · 하루 한 번 받아 저장(S.ai) → 같은 날은 다시 안 부름. 그날 운동을 끝내면 한 번 더.
   · 운동 중엔 새로 부르지 않고, 같이 받아 둔 운동 중 문구(during·duringEx)를 쓴다.
   · 늦거나 실패하면 기존 문구(app.js coachLineBase) 그대로. 보내는 건 운동 요약뿐 — 이름·연락처·장소 이름 없음. */
const AI_COACH = {
  url: 'https://coach-relay-staging.up.railway.app/v1/coach-line',
  showWaitMs: 4000,    // 이 안에 오면 보고 있는 말풍선을 부드럽게 바꿈. 더 늦으면 저장만 하고 다음에 열 때 보여 줌
  hardMs: 12000,       // 이보다 늦으면 요청을 끊음
  maxLines: 2,
};
const AI_Q = (() => { const m = /[?&]ai=(off|local)\b/.exec(location.search); return m ? m[1] : ''; })();
if (AI_Q === 'local' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) AI_COACH.url = 'http://' + location.hostname + ':8799/v1/coach-line';
const AI_RT = { busy: null, tried: {} };   // 이 페이지를 연 동안의 요청 상태(저장 안 함)
addEventListener('pagehide', () => { AI_RT.leaving = true; });
addEventListener('pageshow', () => { AI_RT.leaving = false; });

/* 오늘 몇 번째 문구인지 — 날짜 + 오늘 끝낸 운동 수. 운동을 끝내면 키가 바뀌어 한 번 더 받는다 */
const aiKey = () => `${TODAY}|${realRecs().filter(r => r.date === TODAY).length}`;
const aiUsable = () => AI_Q !== 'off' && S.chosen !== false && (S.exprDemo || 'auto') === 'auto' && S.demo === 'none'
  && !(S.mood && S.mood.date === TODAY && S.mood.quiet);   // «요즘 컨디션 어때?»(아쉬운 날이 이어질 때)는 정해 둔 말 그대로
function aiUid() {
  if (!S.aiUid) { const a = new Uint8Array(12); crypto.getRandomValues(a); S.aiUid = [...a].map(x => x.toString(16).padStart(2, '0')).join(''); save(); }
  return S.aiUid;
}
const aiDays = d => Math.round((new Date(TODAY) - new Date(d)) / 864e5);

/* 서버로 보내는 운동 요약(개인 식별 정보 없음) */
function aiSummary(reason) {
  const recs = realRecs().slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const base = { uid: aiUid(), day: TODAY, dow: new Date(TODAY).getDay(), reason, mood: exprNow(),
    prev: (S.aiHist || []).map(h => h.line), prevTopics: (S.aiHist || []).map(h => h.topic).filter(Boolean),
    inSession: !!S.session, sessionEx: S.session ? S.session.items.map(i => EX[i.ex] && EX[i.ex].name).filter(Boolean).slice(-4) : [] };
  if (!recs.length) return { ...base, total: 0 };
  const top = it => Math.max(0, ...(it.sets || []).filter(s => s.done !== false).map(s => +s.w || 0));
  const itemOf = it => { const e = EX[it.ex]; if (!e) return null;
    if (it.min > 0) return { name: e.name, min: Math.round(it.min) };
    const n = (it.sets || []).filter(s => s.done !== false).length; return n ? { name: e.name, sets: n, topKg: top(it) || undefined } : null; };
  const recent = recs.slice(0, 4).map(r => ({ daysAgo: aiDays(r.date), items: (r.items || []).map(itemOf).filter(Boolean).slice(0, 4) })).filter(r => r.items.length);
  /* 종목별 지난 기록(최신순) */
  const ids = [...new Set([...recs.flatMap(r => (r.items || []).map(i => i.ex)), ...Object.keys(S.hist || {})])].filter(x => EX[x] && EX[x].cat !== 'lesson');
  const H = Object.fromEntries(ids.map(x => [x, histOf(x)]));
  /* 무게가 늘어난 종목 = 최근 7일 안 기록의 최고 무게가 그 전 모든 기록의 최고 무게보다 클 때만(확실한 것만 말하게) */
  const up = [];
  ids.forEach(x => { const h = H[x]; if (!h.length || !h[0].sets) return;
    const d0 = h[0].date, now = Math.max(0, ...h.filter(e => e.date === d0).map(top)), before = Math.max(0, ...h.filter(e => e.date < d0).map(top));
    if (aiDays(d0) <= 7 && before > 0 && now > before) up.push({ name: EX[x].name, from: before, to: now, daysAgo: aiDays(d0) }); });
  /* 한동안 안 한 종목 = 3번 넘게 해 본 종목인데 마지막이 21일 넘게 전 */
  const stale = ids.filter(x => H[x].length >= 3 && aiDays(H[x][0].date) >= 21).sort((a, b) => H[b].length - H[a].length).slice(0, 2).map(x => ({ name: EX[x].name, days: aiDays(H[x][0].date) }));
  /* 최근 2주 동안 안 한 부위(해 본 적 있는 부위만) */
  const lastPart = {};
  ids.forEach(x => { const p = EX[x].part; if (!p || p === '유산소' || p === '전신' || !H[x].length) return; const d = aiDays(H[x][0].date); if (lastPart[p] == null || d < lastPart[p]) lastPart[p] = d; });
  const restParts = Object.keys(lastPart).filter(p => lastPart[p] >= 14).sort((a, b) => lastPart[b] - lastPart[a]).slice(0, 2);
  /* 평소 = 최근 4주 운동한 날 수 ÷ 4 (0.5 단위) */
  const days28 = new Set([...recs.map(r => r.date), ...Object.values(S.hist || {}).flat().map(h => h.date)].filter(d => { const n = aiDays(d); return n >= 1 && n <= 28; }));
  const weekAvg = days28.size >= 3 ? Math.round(days28.size / 4 * 2) / 2 : null;
  const v = S.mood && S.mood.date === TODAY ? S.mood.verdict : null;
  return { ...base, total: recs.length, lastDays: aiDays(recs[0].date), weekCount: weekCount(), weekAvg, doneToday: todayDone(),
    todayVsUsual: ['high', 'low', 'normal'].includes(v) ? v : null, recent, up: up.slice(0, 2), stale, restParts };
}

/* 말풍선 칸에 넣었을 때 몇 줄인지(지금 화면 폭 그대로) — 2줄 넘으면 쓰지 않는다 */
function aiFits(text) {
  const el = $('coachSay'); if (!el) return true;
  const c = el.cloneNode(false); c.removeAttribute('id'); c.textContent = text;
  c.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;min-height:0;display:block;word-break:keep-all;overflow-wrap:anywhere;width:${el.getBoundingClientRect().width}px`;
  el.parentNode.appendChild(c);
  const cs = getComputedStyle(c), lh = parseFloat(cs.lineHeight) || 18, pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const lines = Math.round((c.getBoundingClientRect().height - pad) / lh);
  c.remove();
  return lines <= AI_COACH.maxLines;
}

/* 지금 보여 줄 AI 문구. 없으면 null → app.js 가 기존 문구를 쓴다 */
function aiLine() {
  if (!aiUsable()) return null;
  const a = S.ai;
  if (S.session) {   // 운동 중엔 새로 부르지 않는다
    if (!a || a.day !== TODAY) return null;
    const cur = S.session.items.length ? EX[S.session.items[S.session.items.length - 1].ex] : null;
    return cur && a.duringEx ? a.duringEx.replace('{종목}', cur.name) : a.during || null;
  }
  const key = aiKey();
  if (a && a.key === key) return a.line;
  aiRequest(key);
  return null;
}
function aiWarm() { if (aiUsable() && !S.session) { const key = aiKey(); if (!(S.ai && S.ai.key === key)) aiRequest(key); } }

function aiRequest(key) {
  if (AI_RT.busy || AI_RT.tried[key] || !window.fetch || !window.AbortController) return;
  const f = S.aiFail && S.aiFail.key === key ? S.aiFail.n : 0;
  if (f >= 2) return;   // 같은 날 같은 상황에서 두 번 실패하면 그날은 기존 문구로 둔다
  AI_RT.tried[key] = true; AI_RT.busy = key;
  const t0 = Date.now(), ctl = new AbortController(), kill = setTimeout(() => ctl.abort(), AI_COACH.hardMs);
  const body = aiSummary(key.endsWith('|0') ? 'daily' : 'after_workout');
  fetch(AI_COACH.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctl.signal, credentials: 'omit' })
    .then(r => r.json())
    .then(j => {
      const okStr = v => typeof v === 'string' && v.trim() && v.length <= 60;
      if (j && j.why === 'no_key') { AI_RT.leaving = true; throw new Error('no_key'); }   // 서버에 AI 키가 아직 없음 → 실패 횟수로 세지 않는다(키를 넣으면 다음에 열 때 바로 됨)
      if (!j || !j.ok || !okStr(j.line) || !okStr(j.during) || !okStr(j.duringEx)) throw new Error((j && j.why) || 'bad');
      if (key !== aiKey()) return;   // 그사이 날짜·기록이 바뀜 → 버림
      S.ai = { key, day: TODAY, line: j.line, during: j.during, duringEx: j.duringEx, topic: j.topic || '', at: Date.now() };
      S.aiHist = [{ day: TODAY, line: j.line, topic: j.topic || '' }, ...(S.aiHist || [])].slice(0, 3);
      S.aiFail = null; save();
      if (Date.now() - t0 <= AI_COACH.showWaitMs) aiSwapIn();   // 늦게 온 건 저장만 — 보고 있는 글이 갑자기 바뀌지 않게
    })
    .catch(() => { if (AI_RT.leaving) return; S.aiFail = { key, n: f + 1 }; save(); })   // 페이지를 떠나며 끊긴 건 실패로 세지 않는다
    .finally(() => { clearTimeout(kill); AI_RT.busy = null; });
}

/* 보고 있는 말풍선을 한 번만 부드럽게 바꾼다(칸 높이는 처음부터 두 줄로 잡혀 있어 아래 카드가 밀리지 않는다) */
function aiSwapIn() {
  const el = $('coachSay'); if (!el || S.session) return;
  const line = aiLine(); if (!line || el.textContent === line) return;
  if (!aiFits(line)) return;
  el.classList.add('swap');
  setTimeout(() => { const now = $('coachSay'); if (now) { const span = now.firstElementChild || now; span.textContent = line; now.classList.remove('swap'); } }, 190);
}
