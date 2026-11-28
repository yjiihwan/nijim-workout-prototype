'use strict';
/* v1.34 — 캐릭터 애니(디자인봇 11-08~09 최종본): 3단계 시그니처 포즈(홈 8~12초 무작위·탭 즉시), 2단계 알통(Lv.1·50·99), 4단계 팔 흔들기 ±5°(rig 부품), 5단계 진화 클립.
   클립은 투명 WebP loop=1(전환 구간만) → 매번 새 blob URL 로 다시 재생(같은 URL 은 브라우저가 끝 프레임에 멈춘 채 다시 돌리지 않음). 데이터 = assets/anim/anim.js(window.ANIM) */
const CLIP_BLOBS = {}, CLIP_URLS = new WeakMap();
async function clipURL(src) { if (!CLIP_BLOBS[src]) CLIP_BLOBS[src] = fetch(src).then(r => { if (!r.ok) throw new Error(src + ' ' + r.status); return r.blob(); }); return URL.createObjectURL(await CLIP_BLOBS[src]); }
/* img 에 클립을 처음부터 재생. 이전 blob URL 은 교체 뒤 해제 */
async function clipPlay(img, src) {
  const u = await clipURL(src); const prev = CLIP_URLS.get(img);
  await new Promise(res => { img.onload = res; img.onerror = res; img.src = u; });
  if (prev) URL.revokeObjectURL(prev); CLIP_URLS.set(img, u);
}
const sigPath = (t, seg) => `assets/anim/sig/${t}/lv${seg}.webp?v=${VER}`;
const sigInfo = (t, seg) => (window.ANIM && ANIM.sig[t] && ANIM.sig[t][seg]) || null;

/* ===== 정지 그림 놓기 — 클립 첫 프레임(160×128 칸 단위 내용 상자 b)과 같은 자리·같은 배율 ===== */
/* 반환: 칸(160×128) 단위의 그림 사각형 {x,y,w,h} 와 클립 보정 배율 r(배율표 render ÷ 클립이 쓴 배율 used) */
function clipPlace(t, cut) {
  const i = sigInfo(t, cut), C = CHARS[t], [W, H] = C.dims[cut], rs = ANIM.rs[t][cut], s = rs / C.k;   // s = 웹 px → 칸 단위
  if (!i || !i.b) return { x: 80 - W * s / 2, y: 128 * ANIM.floor - H * s, w: W * s, h: H * s, r: 1 };
  const r = rs / (i.u || rs), fy = i.b[3], cx = 80;   // 클립을 발바닥(fy)·가로 가운데 기준으로 r 배 보정한 뒤의 내용 상자
  const b = [cx + (i.b[0] - cx) * r, fy + (i.b[1] - fy) * r, cx + (i.b[2] - cx) * r, fy];
  const pb = ANIM.png[t][cut];   // 웹 PNG 의 불투명 내용 상자
  return { x: b[0] - pb[0] * s, y: b[1] - pb[1] * s, w: W * s, h: H * s, r };
}

/* ===== 4단계 팔 흔들기 — rig 부품 레이어(머리·몸통·다리 고정, 팔만 어깨 축 ±5°) ===== */
function rigLayers(t, cut, s) {
  const r = window.ANIM && ANIM.rig[t] && ANIM.rig[t][cut]; if (!r) return null;
  return r.o.map(p => { const [x, y, w, h] = r.p[p], arm = p === 'arm_L' ? 'L' : p === 'arm_R' ? 'R' : '', piv = arm === 'L' ? r.sL : arm === 'R' ? r.sR : null;
    return `<img class="part${arm ? ` arm arm${arm}` : ''}" src="assets/rig/${t}/lv${cut}/${p}.webp?v=${VER}" style="left:${x * s}px;top:${y * s}px;width:${w * s}px;height:${h * s}px${piv ? `;transform-origin:${(piv[0] - x) * s}px ${(piv[1] - y) * s}px` : ''}" alt="">`; }).join('');
}

/* ===== 포즈 갈림 자리 (v2.12 «아이템 입은 채 움직이기») =====
   포즈(동작) 하나를 틀 때마다 여기서 셋 중 하나로 갈라진다. 설명 = docs/WEAR_POSE_TRACK.md
   · 'clip'  착용 0개 → 미리 그려 둔 원래 포즈 클립 그대로
   · 'track' 착용 있음 + 그 포즈의 «아이템 따라붙이기 위치 자료»(window.WEAR_TRACK, assets/anim/wear_track.js)가 있음 → 원래 포즈를 틀고 아이템을 얹는다(B안)
   · 'aplan' 착용 있음 + 위치 자료 없음 → A안 공통 움직임(그림 칸 .cimg 을 통째로 숨쉬기·폴짝·깜빡임). 아이템·동작이 늘어도 이쪽은 손댈 게 없다
   pose = 'sig'(첫 화면 시그니처 포즈) · 'eat'(먹는 장면) … 새 동작은 이름만 새로 지어 부르면 된다 */
const wearTrack = (t, cut, pose) => (window.WEAR_TRACK && WEAR_TRACK[t] && WEAR_TRACK[t][cut] && WEAR_TRACK[t][cut][pose]) || null;
const WEAR_TRACK_PLAYERS = {};   // B안 재생기 등록 자리: pose 이름 → (wrap, track, 정보) => true(재생함). 등록된 게 없거나 false 를 돌려주면 A안으로 떨어진다
function poseMode(t, lv, pose = 'sig') {
  if (typeof wearOn !== 'function' || !wearOn().length) return 'clip';
  return wearTrack(t, cutOf(lv), pose) && WEAR_TRACK_PLAYERS[pose] ? 'track' : 'aplan';
}

/* ===== A안 공통 움직임 — 값 = design nijim_workout_wear_motion_sample_20261122 motion_spec.json 그대로(5.2초 한 바퀴: 깜빡 0.52초 → 폴짝 1.3초(1.1초 동안) → 깜빡 3.9·4.16초) =====
   움직임 자체는 style.css(.aplan/.ahop/.ablink). 여기는 «언제»만 정한다. 어떤 .cwrap 에든 붙일 수 있다(첫 화면 무대·먹는 무대) */
const APLAN = { loop: 5200, hopAt: 1300, hopMs: 1100, blinks: [520, 3900, 4160], blinkMs: 120 };
const APLAN_RUN = new Map();   // wrap → { timers:[], hopEnd }
function aplanStop(wrap) {
  const list = wrap ? [wrap] : [...APLAN_RUN.keys()];
  list.forEach(w => { const r = APLAN_RUN.get(w); if (!r) return; r.timers.forEach(clearTimeout); clearTimeout(r.hopEnd); APLAN_RUN.delete(w); w.classList.remove('ahop', 'ablink'); });
}
function aplanHop(wrap) {   // 폴짝 한 번(이미 뛰는 중이면 그대로 둔다 → 중간에 튀지 않게)
  const r = APLAN_RUN.get(wrap); if (!r || !wrap.isConnected || wrap.classList.contains('ahop')) return false;
  wrap.classList.add('ahop'); clearTimeout(r.hopEnd);
  r.hopEnd = setTimeout(() => wrap.classList.remove('ahop'), APLAN.hopMs + 40);
  return true;
}
function aplanBlink(wrap) { wrap.classList.add('ablink'); setTimeout(() => wrap.classList.remove('ablink'), APLAN.blinkMs); }
function aplanCycle(wrap, from = 0) {   // from(ms) 지점부터 한 바퀴를 예약하고, 끝나면 다음 바퀴
  const r = APLAN_RUN.get(wrap); if (!r) return;
  r.timers.forEach(clearTimeout); r.timers = [];
  const at = (ms, fn) => { if (ms >= from) r.timers.push(setTimeout(() => { if (!wrap.isConnected) return aplanStop(wrap); fn(); }, ms - from)); };
  APLAN.blinks.forEach(b => at(b, () => aplanBlink(wrap)));
  at(APLAN.hopAt, () => aplanHop(wrap));
  at(APLAN.loop, () => aplanCycle(wrap, 0));
}
function aplanStart(wrap, { auto = true } = {}) {   // auto=false: 숨쉬기만(폴짝·깜빡임은 부르는 쪽이 직접)
  aplanStop(wrap); wrap.classList.add('aplan'); APLAN_RUN.set(wrap, { timers: [], hopEnd: 0 });
  if (auto) aplanCycle(wrap, 0);
}
function aplanTap(wrap) {   // 탭 → 바로 폴짝, 다음 바퀴는 폴짝 뒤부터 이어서(연달아 두 번 뛰지 않게)
  if (!APLAN_RUN.has(wrap)) return;
  if (aplanHop(wrap)) aplanCycle(wrap, APLAN.hopAt + 1);
}
/* 깜빡임 덮개: 이미 있는 «졸림» 표정을 0.12초만 보였다 숨긴다(새 그림 0장). 지금 표정이 졸림이면 필요 없다 */
function blinkLayer(t, lv, expr) {
  if (expr === 'sleepy' || typeof faceLayer !== 'function') return '';
  return faceLayer(t, lv, 'sleepy').replace('class="face art sleepy"', 'class="face art sleepy blink"');
}

/* ===== 3단계 홈 무대: 8~12초 무작위 간격·탭하면 즉시(디자인 README) — 착용 0개일 때만 클립, 입고 있으면 poseMode 가 가른다 ===== */
const SIG = { timer: null, playing: false, end: null };
function sigSchedule() { clearTimeout(SIG.timer); SIG.timer = setTimeout(sigPlayHome, 8000 + Math.random() * 4000); }
async function sigPlayHome() {
  const img = $('sigClip'); if (!img) { clearTimeout(SIG.timer); return; }
  const t = S.type, cut = cutOf(S.level), i = sigInfo(t, cut); if (!i || SIG.playing) return;
  SIG.playing = true;
  try { await clipPlay(img, sigPath(t, cut)); } catch (e) { console.error(e); SIG.playing = false; return; }
  const wrap = img.closest('.cwrap'); if (!wrap) { SIG.playing = false; return; }
  wrap.classList.add('posing');
  clearTimeout(SIG.end);
  SIG.end = setTimeout(() => { const w = img.closest('.cwrap'); if (w) w.classList.remove('posing'); SIG.playing = false; sigSchedule(); }, i.ms + 120);
}
/* 무대 위 클립 겹칠 자리(160×128 칸). used≠render 인 구간(릴라 Lv.99 등)은 발바닥 기준으로 r 배 보정 */
function sigClipHTML(t, lv) {
  const cut = cutOf(lv), i = sigInfo(t, cut); if (!i) return '';
  const r = ANIM.rs[t][cut] / (i.u || ANIM.rs[t][cut]), fy = i.b ? i.b[3] / 128 * 100 : ANIM.floor * 100;
  return `<img class="sigclip" id="sigClip" alt="" style="transform-origin:50% ${fy.toFixed(2)}%${Math.abs(r - 1) > 1e-3 ? `;transform:scale(${r.toFixed(4)})` : ''}">`;
}
/* 첫 화면 무대 조립에 쓰는 값: 무대 클래스 · 클립 자리 · 깜빡임 덮개 여부 */
function stagePose(t, lv) {
  const mode = S.placeholder ? 'clip' : poseMode(t, lv, 'sig');
  return { mode, cls: mode === 'aplan' ? 'aplan' : '', clip: mode === 'aplan' ? '' : sigClipHTML(t, lv), blink: mode === 'aplan' };
}
/* 무대를 탭했을 때 */
function posePlayHome() {
  const wrap = $('stageWrap'); if (!wrap) return;
  const mode = S.placeholder ? 'clip' : poseMode(S.type, S.level, 'sig');
  if (mode === 'track' && WEAR_TRACK_PLAYERS.sig(wrap, wearTrack(S.type, cutOf(S.level), 'sig'), { t: S.type, lv: S.level })) return;
  if (mode === 'clip') return sigPlayHome();
  aplanTap(wrap);
}

/* render() 뒤 — 홈 무대 예약 (v1.87: 내 캐릭터 화면의 «시그니처 포즈»·«알통 자랑» 칸은 없앰 — 홈 무대 포즈는 그대로) */
function animMount() {
  aplanStop();
  const wrap = $('stageWrap'); if (!wrap) { clearTimeout(SIG.timer); return; }
  if (wrap.classList.contains('aplan')) { clearTimeout(SIG.timer); SIG.playing = false; aplanStart(wrap); return; }
  if ($('sigClip')) { SIG.playing = false; sigSchedule(); } else clearTimeout(SIG.timer);
}

/* ===== 5단계 진화 클립(다크 GIF 160×128·128×128 → 2배) — 큰 경계에 디자인 클립이 있으면 그걸 쓴다 ===== */
function evoClipFor(t, ev) {
  if (!window.ANIM || !ANIM.evo[t] || !ev.big) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;   // 동작 줄이기: 기존 천천히 교차 연출
  const to = ev.to >= 99 ? 99 : Math.floor(ev.to / 10) * 10, key = to === 99 ? '98to99' : `${String(to - 1).padStart(2, '0')}to${to}`;
  const c = ANIM.evo[t][key]; if (!c || to <= ev.from) return null;
  return { ...c, key, src: `assets/anim/evo/${t}/${key}.gif?v=${VER}`, last: `assets/anim/evo/${t}/${key}_last.png?v=${VER}` };
}
