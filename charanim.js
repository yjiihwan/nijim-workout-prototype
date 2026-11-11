'use strict';
/* v1.34 — 캐릭터 애니(디자인봇 11-08~09 최종본): 3단계 시그니처 포즈(홈 8~12초 무작위·탭 즉시), 2단계 알통(Lv.1·50·99), 4단계 팔 흔들기 ±5°(rig 부품), 5단계 진화 클립.
   클립은 투명 WebP loop=1(전환 구간만) → 매번 새 blob URL 로 다시 재생(같은 URL 은 브라우저가 끝 프레임에 멈춘 채 다시 돌리지 않음). 데이터 = assets/anim/anim.js(window.ANIM) */
const SEGS = ['01', '01_big', '10', '10_big', '20', '30', '30_big', '40', '50', '50_big', '60', '70', '80', '80_big', '90', '99'];
const segLabel = s => 'Lv.' + (+s.slice(0, 2)) + (s.endsWith('_big') ? '+' : '');
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

/* ===== 3단계 홈 무대: 8~12초 무작위 간격·탭하면 즉시(디자인 README) ===== */
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

/* ===== 내 캐릭터 카드 — 시그니처 포즈 16구간 · 알통 Lv.1·50·99 ===== */
function sigCard(t, lv) {
  const cut = cutOf(lv), segs = ANIM.sig[t] || {};
  return `<div class="card" id="sigCard"><div class="h2" style="font-size:16px">시그니처 포즈</div><div class="muted" style="margin-bottom:8px">홈 화면에서 8~12초마다 한 번씩 해요 · 캐릭터를 탭하면 바로 해요 · 아래 단계를 누르면 그 단계 포즈가 나와요</div>
  <button class="sigview" id="sigView" data-act="sigSeg" data-v="${cut}" aria-label="포즈 다시 보기"><img id="sigViewClip" alt=""><span class="pill lvpill sigtag" id="sigViewTag">${segLabel(cut)}</span></button>
  <div class="sigstrip" id="sigStrip">${SEGS.filter(s => segs[s]).map(s => `<button class="sigthumb ${s === cut ? 'on' : ''}" data-act="sigSeg" data-v="${s}"><img src="assets/anim/sig/${t}/lv${s}_base.png?v=${VER}" alt=""><small>${segLabel(s)}</small></button>`).join('')}</div></div>`;
}
function flexCard(t) {
  const f = ANIM.flex[t] || {}, segs = ['01', '50', '99'].filter(s => f[s]); if (!segs.length) return '';
  return `<div class="card" id="flexCard"><div class="h2" style="font-size:16px">알통 자랑 · Lv.1 → 50 → 99</div><div class="muted" style="margin-bottom:8px">레벨이 오르면 같은 캐릭터가 얼마나 커지는지 보여요 · 탭하면 다시 봐요</div>
  <div class="flexrow">${segs.map(s => `<button class="flexcell" data-act="flexPlay" data-v="${s}"><img id="flex_${s}" alt=""><small>Lv.${+s}</small></button>`).join('')}</div></div>`;
}
async function sigSegPlay(seg) {
  const img = $('sigViewClip'); if (!img) return; const t = S.type;
  document.querySelectorAll('#sigStrip .sigthumb').forEach(b => b.classList.toggle('on', b.dataset.v === seg));
  $('sigView').dataset.v = seg; $('sigViewTag').textContent = segLabel(seg);
  await clipPlay(img, sigPath(t, seg));
}
async function flexPlay(seg) { const img = $('flex_' + seg); if (img) await clipPlay(img, `assets/anim/flex/${S.type}/lv${seg}.webp?v=${VER}`); }

/* render() 뒤 — 홈 무대 예약·내 캐릭터 카드 재생 */
function animMount() {
  if ($('sigClip')) { SIG.playing = false; sigSchedule(); } else clearTimeout(SIG.timer);
  if ($('sigViewClip')) { sigSegPlay(cutOf(S.level)); const on = document.querySelector('#sigStrip .sigthumb.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' }); }   // 띠는 현재 단계가 보이게
  if ($('flexCard')) ['01', '50', '99'].forEach((s, i) => setTimeout(() => flexPlay(s), i * 350));
}

/* ===== 5단계 진화 클립(다크 GIF 160×128·128×128 → 2배) — 큰 경계에 디자인 클립이 있으면 그걸 쓴다 ===== */
function evoClipFor(t, ev) {
  if (!window.ANIM || !ANIM.evo[t] || !ev.big) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;   // 동작 줄이기: 기존 천천히 교차 연출
  const to = ev.to >= 99 ? 99 : Math.floor(ev.to / 10) * 10, key = to === 99 ? '98to99' : `${String(to - 1).padStart(2, '0')}to${to}`;
  const c = ANIM.evo[t][key]; if (!c || to <= ev.from) return null;
  return { ...c, key, src: `assets/anim/evo/${t}/${key}.gif?v=${VER}`, last: `assets/anim/evo/${t}/${key}_last.png?v=${VER}` };
}
