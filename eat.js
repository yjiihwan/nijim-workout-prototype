/* 먹고 마시는 아이템 21종 + 사용 연출 (design nijim_workout_eat_anim_20261026 DEV_SPEC §1~§6·§9 그대로)
   레이어·기준점 = assets/eat/<id>/lvNN · data.js(웹 px) · 음식 = assets/food/*.png(512 = 256 좌표 ×2) · 가격·이름·등급 = SHOP82(관리자 표) */
const FOOD_ASSET = { food_1:'food_chicken_bite', food_2:'food_egg_white', food_3:'food_preworkout_banana', food_4:'food_muscle_jelly', food_5:'food_protein_bar',
  food_6:'food_bulkup_kimbap', food_7:'food_anti_catabolic_mochi', food_8:'food_triple_chicken_burger', food_9:'food_dragon_steak', food_10:'food_legend_ginseng_baeksuk',
  drink_1:'drink_gym_water', drink_2:'drink_ion_drink', drink_3:'drink_preworkout_iced_americano', drink_4:'drink_choco_protein_shake', drink_5:'drink_red_potion',
  drink_6:'drink_blue_potion', drink_7:'drink_muscle_juice', drink_8:'drink_bulkup_mega_shake', drink_9:'drink_green_pump_potion', drink_10:'drink_rainbow_muscle_juice',
  drink_11:'drink_legend_pump_elixir' };
const RARITY = {   // DEV_SPEC §4 (eatlib.RARITY)
  '일반': { key:'common', col:'#6E768A', k:.06, shake:.010, spark:0, ring:0, aura:0, pillar:0 },
  '희귀': { key:'rare', col:'#0B7BEA', k:.10, shake:.014, spark:4, ring:1, aura:0, pillar:0 },
  '영웅': { key:'hero', col:'#6236F0', k:.14, shake:.018, spark:8, ring:2, aura:.80, pillar:0 },
  '전설': { key:'legend', col:'#E8123F', k:.18, shake:.022, spark:12, ring:2, aura:.85, pillar:1 },
};
/* effect_text → 효과. 배율 겹침 = 가장 큰 것 1개만, 나머지는 소모 없이 대기(기획 item_expansion «배율 겹침») */
function foodEffect(text) {
  const n = s => +s.replace(/,/g, ''), xp = text.match(/즉시 \+([\d,]+)/), nx = text.match(/다음 운동 (\d+)번 ×([\d.]+)/), dy = text.match(/(\d+)일간 모든 운동 ×([\d.]+)/);
  return { xp: xp ? n(xp[1]) : 0, next: nx ? { n: +nx[1], mul: +nx[2] } : null, days: dy ? { d: +dy[1], mul: +dy[2] } : null, cond: /컨디션/.test(text) };
}
const FOODS = () => SHOP82.filter(x => FOOD_ASSET[x.id]).map(x => ({ id: x.id, fid: FOOD_ASSET[x.id], cat: x.cat, name: x.name, desc: x.effect_text,
  price: x.price_points, rarity: x.rarity, rule: x.use_rule, eff: foodEffect(x.effect_text) }));
const foodById = id => FOODS().find(f => f.id === id);

/* ===== 부스터(배율) — 기존 2배 부스터 + 먹는 아이템 배율을 한 함수로 ===== */
function boostList() {
  const L = [];
  if (S.boost7Until && S.boost7Until >= TODAY) L.push({ src: 'b7', mul: CFG.BOOST.mul, timed: 1 });
  (S.timedBoosts || []).forEach((b, i) => { if (b.until >= TODAY) L.push({ src: 't' + i, mul: b.mul, timed: 1 }); });
  if (S.boostNext) L.push({ src: 'b1', mul: CFG.BOOST.mul });
  (S.nextBoosts || []).forEach((b, i) => { if (b.left > 0) L.push({ src: 'n' + i, mul: b.mul }); });
  return L;
}
/* 같은 배율이면 기간형을 먼저 쓴다 → 다음 운동권은 아껴 둠 */
const boostPick = () => boostList().sort((a, b) => b.mul - a.mul || (b.timed || 0) - (a.timed || 0))[0] || null;
const boostMul = () => { const p = boostPick(); return p ? p.mul : 0; };
function boostConsume() {
  const p = boostPick(); if (!p || p.timed) return;
  if (p.src === 'b1') S.boostNext = false;
  else { const b = S.nextBoosts[+p.src.slice(1)]; b.left--; S.nextBoosts = S.nextBoosts.filter(x => x.left > 0); }
}
const boostLabel = () => { const m = boostMul(); return m ? `×${String(m)}` : ''; };

/* ===== 레이어 로딩 (캐릭터·띠 컷 1칸씩, 필요할 때만) ===== */
const EATC = {};
function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; });
async function eatCell(t, cut) {
  const key = t + cut; if (EATC[key]) return EATC[key];
  if (!window.EAT_DATA || !EAT_DATA[t]) await loadScript(`assets/eat/${t}/data.js`);
  const d = EAT_DATA[t][cut], base = `assets/eat/${t}/lv${cut}/`;
  const [rest, eat, mo, cl, cr, arm, w] = await Promise.all(['rest.webp', 'eat.webp', 'mo.webp', 'cl.webp', 'cr.webp', 'arm.webp', 'w.png'].map(f => loadImg(base + f)));
  const cv = (W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const rc = cv(d.W, d.H), rg = rc.getContext('2d'); rg.drawImage(rest, d.crop.rest[0], d.crop.rest[1]);
  const wc = cv(d.W, d.H), wg = wc.getContext('2d'); wg.drawImage(w, d.crop.w[0], d.crop.w[1]);
  const wd = wg.getImageData(0, 0, d.W, d.H).data, Wt = new Float32Array(d.W * d.H); let y0 = d.H, y1 = 0;
  for (let i = 0; i < Wt.length; i++) { const v = wd[i * 4] / 255; Wt[i] = v; if (v > 0) { const y = (i / d.W) | 0; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  return (EATC[key] = { d, rest, eat, mo, cl, cr, arm, restData: rg.getImageData(0, 0, d.W, d.H), Wt, y0, y1, work: cv(d.W, d.H) });
}
const FOODIMG = {};
async function foodImg(fid) { return FOODIMG[fid] || (FOODIMG[fid] = await loadImg(`assets/food/${fid}.png`)); }
/* 한 입 자국(eatlib.food_layer): 먹는 점 근처를 동그랗게 지움 · 최대 2개 · 마시는 것은 없음 */
const BITTEN = {};
function bittenIcon(fid, img, bites, mirror) {
  const key = `${fid}_${bites}_${mirror}`; if (BITTEN[key]) return BITTEN[key];
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  if (mirror) { g.translate(512, 0); g.scale(-1, 1); } g.drawImage(img, 0, 0, 512, 512); g.setTransform(1, 0, 0, 1, 0, 0);
  const p = FOOD_PTS[fid], b = [mirror ? 256 - p.b[0] : p.b[0], p.b[1]], r = 0.10 * 256;
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < bites; i++) {
    const off = i === 0 ? [0, 0] : i === 1 ? [(mirror ? 1 : -1) * r * .9, .8 * r * .9] : [(mirror ? -1 : 1) * r * .8, .9 * r * .8];
    g.beginPath(); g.arc((b[0] + off[0]) * 2, (b[1] + off[1]) * 2, r * (1 - .12 * i) * 2, 0, 7); g.fill();
  }
  return (BITTEN[key] = c);
}

/* ===== 타임라인 (DEV_SPEC §2 · anim.py) ===== */
const ET = { raise1: 140, eat0: 140, eat1: 2540, poof0: 2540, poof1: 2740, swapIn: 70, swapOut: 2670, shiver0: 2760, shiver1: 3060, inflate1: 3420, hold1: 3660, deflate1: 4120, end: 4600, BITE: 800 };
const eob = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const eio = t => .5 - .5 * Math.cos(Math.PI * Math.max(0, Math.min(1, t)));
const c01 = x => Math.max(0, Math.min(1, x));
function pumpK(t, km) {
  if (t < ET.shiver0) return 0;
  if (t < ET.shiver1) return .25 * km * eio((t - ET.shiver0) / (ET.shiver1 - ET.shiver0));
  if (t < ET.inflate1) return km * (.25 + .75 * eob((t - ET.shiver1) / (ET.inflate1 - ET.shiver1)));
  if (t < ET.hold1) return km;
  if (t < ET.deflate1) return km * (1 - eio((t - ET.hold1) / (ET.deflate1 - ET.hold1)));
  return 0;
}
function shakeAt(t, amp) {
  const e = t >= ET.shiver0 && t < ET.shiver1 ? 1 : t >= ET.inflate1 && t < ET.hold1 ? .45 : 0;
  return amp * e * Math.sin(2 * Math.PI * 18 * t / 1000);
}
/* 펌핑 변형식(§3): src_x = cx + (x−cx)/(1+k·W) − dx·W · W=0 은 정본 픽셀 그대로 */
function pumpInto(C, k, dx) {
  const { d, restData, Wt, y0, y1 } = C, W = d.W, src = restData.data, out = new ImageData(new Uint8ClampedArray(src), W, d.H), o = out.data, cx = d.cx;
  for (let y = y0; y <= y1; y++) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const w = Wt[row + x]; if (w === 0) continue;
      const sx = cx + (x - cx) / (1 + k * w) - dx * w, x0 = Math.floor(sx), f = sx - x0, di = (row + x) * 4;
      for (let ch = 0; ch < 4; ch++) {
        const a = x0 >= 0 && x0 < W ? src[(row + x0) * 4 + ch] : 0, b = x0 + 1 >= 0 && x0 + 1 < W ? src[(row + x0 + 1) * 4 + ch] : 0;
        o[di + ch] = a + (b - a) * f;
      }
    }
  }
  return out;
}
function star(g, x, y, r, col) {
  if (r <= .5) return;
  const p = (R, k) => { g.beginPath(); [[0, -R], [k, -k], [R, 0], [k, k], [0, R], [-k, k], [-R, 0], [-k, -k]].forEach(([a, b], i) => i ? g.lineTo(x + a, y + b) : g.moveTo(x + a, y + b)); g.closePath(); g.fill(); };
  g.fillStyle = col; p(r, r * .22); g.fillStyle = '#fff'; p(r * .45, r * .45 * .25);
}
const hexA = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
function eatRng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ===== 무대(상점 «먹고 마시는» 탭 맨 위 카드) — 다시 그려도(render) 같은 canvas 를 옮겨 붙여 연출이 끊기지 않게 ===== */
const EAT = { cv: null, q: [], cur: null, raf: 0, view: null };
const STAGE_H = 236, BASE_Y = 206, BOX_H = 170;
function stageCanvas() {
  if (!EAT.cv) { EAT.cv = document.createElement('canvas'); EAT.cv.className = 'eatcv'; EAT.cv.addEventListener('click', () => { if (EAT.cur && !EAT.cur.skip) EAT.cur.skip = true; }); }
  return EAT.cv;
}
/* render() 뒤마다 부름: 탭이 보이면 canvas 를 붙이고 정지 화면 그리기 */
function eatMount() {
  const host = document.getElementById('eatStage');
  if (!host) { if (EAT.cur) eatAbort(); return; }
  const c = stageCanvas(); if (c.parentNode !== host) host.appendChild(c);
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = host.clientWidth || 340;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(STAGE_H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(STAGE_H * dpr); c.style.width = W + 'px'; c.style.height = STAGE_H + 'px'; EAT.pillar = null; }
  if (!EAT.cur) drawIdle();
}
async function drawIdle() {
  const t = S.type, lv = S.level, cut = cutOf(lv);
  try { const C = await eatCell(t, cut); if (EAT.cur || S.level !== lv || S.type !== t) return; frame({ C, t: ET.end, R: RARITY['일반'], idle: true }); } catch (e) { console.error(e); }
}
function geom(C) {
  const c = EAT.cv, dpr = c.width / parseFloat(c.style.width || c.width), Wc = c.width / dpr, d = C.d;
  const t = S.type, disp = scaleOf(t, EAT.cur ? EAT.cur.from : S.level, BOX_H, false, Wc / 1.3) / 1;   // 전설 최대 부풂(+18%)도 칸 안
  const cx = Wc / 2, px = cx - (d.off[0] + d.sz[0] / 2) * disp, py = BASE_Y - (d.off[1] + d.sz[1]) * disp;
  return { dpr, Wc, disp, cx, px, py, d };
}
function frame(F) {
  const { C, t, R } = F, c = EAT.cv, g = c.getContext('2d'), G = geom(C), { dpr, Wc, disp, cx, px, py, d } = G;
  const w13 = d.sz[0] * disp, h13 = d.sz[1] * disp, S_ = d.S * disp, col = R.col;
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, STAGE_H);
  if (R.pillar && t >= 2900 && t < 4200) {   // 빛기둥(전설): 가운데 흰 심 + 등급색 바깥
    const a = c01((t - 2900) / 250) * (1 - c01((t - 3900) / 300));
    if (!EAT.pillar || EAT.pillar.col !== col || EAT.pillar.w !== w13) EAT.pillar = pillarImg(Wc, w13, col);
    g.globalAlpha = a; g.drawImage(EAT.pillar.c, 0, 0, Wc, STAGE_H); g.globalAlpha = 1;
  }
  if (R.aura > 0 && t >= 3000 && t < 4100) {   // 오라(영웅·전설)
    const a = R.aura * c01((t - 3000) / 200) * (1 - c01((t - 3800) / 300)) * (.85 + .15 * Math.sin(t / 60));
    g.save(); g.translate(cx, BASE_Y - h13 * .5); g.scale(w13 * .62, h13 * .55);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, 1); [0, .3, .5, .7, .85, 1].forEach(f => rg.addColorStop(f, hexA(col, a * (1 - f * f) ** .7)));
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
  }
  for (let j = 0; j < R.ring; j++) {   // 바닥 링(캐릭터 뒤)
    const u = (t - 3080 - j * 180) / 560; if (u < 0 || u >= 1) continue;
    const rr = w13 * (.30 + .55 * u); g.strokeStyle = hexA(col, 1 - u); g.lineWidth = Math.max(1.5, S_ * .09 * (1 - u) + 1);
    g.beginPath(); g.ellipse(cx, BASE_Y - 1, rr, rr * .24, 0, 0, 7); g.stroke();
  }
  /* 캐릭터: 레이어 캔버스(웹 px)에 합성 → 표시 배율로 */
  const wk = C.work, wg = wk.getContext('2d'); wg.setTransform(1, 0, 0, 1, 0, 0); wg.clearRect(0, 0, d.W, d.H);
  const eating = !F.idle && t >= ET.swapIn && t < ET.swapOut;
  if (!eating) {
    const k = F.idle ? 0 : pumpK(t, R.k), dx = F.idle ? 0 : shakeAt(t, R.shake * d.sz[0]);
    if (Math.abs(k) < 1e-6 && Math.abs(dx) < 1e-6) wg.drawImage(C.rest, d.crop.rest[0], d.crop.rest[1]); else wg.putImageData(pumpInto(C, k, dx), 0, 0);
  } else {
    const te = t - ET.eat0; let kind = 'mo', bites = 0, squash = 1;
    if (te >= 0) { const i = Math.min(2, Math.floor(te / ET.BITE)), ph = te % ET.BITE; kind = ph < 200 ? 'mo' : (ph < 400 || ph >= 600) ? 'cl' : 'cr'; bites = i + (ph >= 200 ? 1 : 0);
      if (t >= ET.eat1) { kind = 'cl'; bites = 3; } else if (ph < 200) squash = 1 - .04 * Math.sin(Math.PI * ph / 200); }
    const pop = t < ET.raise1 + 120 ? .6 + .4 * eob(c01(t / (ET.raise1 + 120))) : 1, fade = t >= ET.poof0 ? 1 - c01((t - ET.poof0) / (ET.poof1 - ET.poof0 - 60)) : 1;
    wg.drawImage(C.eat, d.crop.eat[0], d.crop.eat[1]); wg.drawImage(C[kind], d.crop[kind][0], d.crop[kind][1]);
    if (fade > 0 && F.food) {
      const ft = d.food[F.food.fid], p = FOOD_PTS[F.food.fid], m = !!ft.m, ic = bittenIcon(F.food.fid, F.food.img, p.kind === '먹는 거' ? Math.min(bites, 2) : 0, m);
      const s = ft.s * squash * pop * (.85 + .15 * fade), gx = m ? 256 - p.g[0] : p.g[0];
      wg.save(); wg.globalAlpha = fade; wg.translate(ft.g[0], ft.g[1]); wg.rotate(ft.a * Math.PI / 180); wg.scale(s, s); wg.drawImage(ic, -gx, -p.g[1], 256, 256); wg.restore();
    }
    wg.drawImage(C.arm, d.crop.arm[0], d.crop.arm[1]);
  }
  g.imageSmoothingQuality = 'high'; g.drawImage(wk, px, py, d.W * disp, d.H * disp);
  if (F.food && t >= ET.poof0 && t < ET.poof1 + 120) {   // 음식 사라짐 반짝(흰 3개)
    const u = (t - ET.poof0) / 320, ft = d.food[F.food.fid], bx = px + ft.b[0] * disp, by = py + ft.b[1] * disp;
    for (let i = 0; i < 3; i++) { const an = i * 2.1 + .5, rr = S_ * (.2 + .5 * u); star(g, bx + rr * Math.cos(an), by + rr * Math.sin(an), S_ * .16 * (1 - u * .6), '#FFFFFF'); }
  }
  (F.sparks || []).forEach(([an, rad, sz, dl]) => {   // 반짝이(등급색)
    const u = (t - 3100 - dl) / 560; if (u < 0 || u >= 1) return;
    const rr = w13 * (.35 + .25 * u) * rad, yy = BASE_Y - h13 * .55;
    star(g, cx + rr * Math.cos(an) * 1.15, yy + rr * Math.sin(an) * .9 - u * S_ * .3, Math.max(1, S_ * .30 * sz * Math.sin(Math.PI * u)), col);
  });
  if (F.label && t >= 3150 && t < 4350) {   // XP 숫자(또는 배율 문구): 흰 글자 + 등급색 테두리 + 잉크 바깥 테두리
    const u = (t - 3150) / 1200, sc = u < .12 ? .6 + .55 * c01(u / .12) : 1.15 - .15 * c01((u - .12) / .1), fs = Math.max(13, S_ * .5 * sc);
    const y = py + d.off[1] * disp + h13 * .02 - S_ * .55 - u * S_ * .55;
    g.save(); g.globalAlpha = 1 - c01((u - .8) / .2); g.font = `900 ${fs}px Pretendard, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
    g.strokeStyle = '#16161C'; g.lineWidth = fs * .32; g.strokeText(F.label, cx, Math.max(2, y));
    g.strokeStyle = col; g.lineWidth = fs * .18; g.strokeText(F.label, cx, Math.max(2, y)); g.fillStyle = '#fff'; g.fillText(F.label, cx, Math.max(2, y)); g.restore();
  }
}
function pillarImg(Wc, w13, col) {
  const c = document.createElement('canvas'); c.width = Math.round(Wc); c.height = STAGE_H; const g = c.getContext('2d'), im = g.createImageData(c.width, c.height);
  const sig = w13 * .24, r = parseInt(col.slice(1, 3), 16), gg = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
  for (let y = 0; y < c.height; y++) { const vf = c01(y / (BASE_Y * .25)) * c01((BASE_Y + 30 - y) / 30);
    for (let x = 0; x < c.width; x++) { const xs = x - c.width / 2, core = Math.exp(-((xs / (sig * .35)) ** 2)), outer = Math.exp(-((xs / sig) ** 2)), i = (y * c.width + x) * 4;
      im.data[i] = r * (1 - core) + 255 * core; im.data[i + 1] = gg * (1 - core) + 255 * core; im.data[i + 2] = b * (1 - core) + 255 * core; im.data[i + 3] = c01(outer * 1.25) * .95 * vf * 255; } }
  g.putImageData(im, 0, 0); return { c, col, w: w13 };
}

/* ===== 사용 → 줄 세워 하나씩 ===== */
function eatUse(id) {
  const f = foodById(id); if (!f || !(S.inv[id] > 0)) return;
  if (f.rule === 'recent7d_workout' && lastWorkoutDays() >= 7) return toast('최근 7일 안에 운동 기록이 1번 있어야 쓸 수 있어요');
  S.inv[id]--; EAT.q.push(id); save();
  if (EAT.cur) { toast(`${f.name} — 앞 연출이 끝나면 이어서 먹어요 (대기 ${EAT.q.length})`); return render(); }
  eatNext();
}
async function eatNext() {
  const id = EAT.q.shift(); if (!id) { EAT.cur = null; render(); return; }
  const f = foodById(id), from = S.level, fromXP = S.xp, R = RARITY[f.rarity] || RARITY['일반'];
  /* 상태는 시작할 때 확정(끊겨도 잃지 않게) — 아이템 경험치 = 유료 장부·한도 없음·운동 레벨엔 안 들어감(결정 33·38) */
  let res = null, label = '';
  if (f.eff.xp) { S.paidLog.push({ id: Date.now(), date: TODAY, xp: f.eff.xp, v: 'paid', item: id }); res = applyXP({ level: S.level, xp: S.xp }, f.eff.xp); S.level = res.level; S.xp = res.xp; label = `+${f.eff.xp.toLocaleString()} XP`; }
  if (f.eff.next) { (S.nextBoosts = S.nextBoosts || []).push({ id, mul: f.eff.next.mul, left: f.eff.next.n }); label = `다음 운동${f.eff.next.n > 1 ? ` ${f.eff.next.n}번` : ''} ×${f.eff.next.mul}`; }
  if (f.eff.days) { const dd = new Date(TODAY); dd.setDate(dd.getDate() + f.eff.days.d - 1); (S.timedBoosts = S.timedBoosts || []).push({ id, mul: f.eff.days.mul, until: ymd(dd) }); label = `${f.eff.days.d}일 ×${f.eff.days.mul}`; }
  if (f.eff.cond) S.recoverDate = TODAY;
  let ev = null;
  if (res && res.level > from) {
    let big = false; for (let l = from + 1; l <= res.level; l++) if (isBigBoundary(l)) big = true;
    const d = new Date(), at = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    ev = { id: Date.now(), from, to: res.level, big, type: S.type, at, watched: false, skipped: false, replays: 0, item: id };
    S.events.push(ev); S.pending = ev.id;   // 연출 전에 먼저 기록 → 끊겨도 다음 진입 때 재생
  }
  save();
  const r = eatRng(id.length * 97 + R.spark), sparks = Array.from({ length: R.spark }, () => [r() * 2 * Math.PI, .55 + r() * .5, .6 + r() * .4, r() * 160]);
  const cut = cutOf(from);
  EAT.cur = { id, f, R, from, fromXP, res, ev, label, sparks, t0: 0, skip: false, toLv: res ? res.level : from, toXP: res ? res.xp : fromXP };
  render();
  try {
    const [C, img] = await Promise.all([eatCell(S.type, cut), foodImg(f.fid)]);
    EAT.cur.C = C; EAT.cur.food = { fid: f.fid, img };
  } catch (e) { console.error(e); EAT.cur = null; return eatFinish(ev); }
  const card = document.querySelector('.eatcard'), cr = card && card.getBoundingClientRect();   // 카드 머리(이름·Lv)까지 보이게 · 이미 다 보이면 그대로
  if (cr && (cr.top < 60 || cr.bottom > innerHeight - 90)) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
  if (S.sound) { tone(520, 0, .08, 'triangle', .06); tone(660, .8, .08, 'triangle', .05); tone(780, 1.6, .08, 'triangle', .05); }
  EAT.cur.t0 = performance.now(); tick();
}
function tick() {
  const E = EAT.cur; if (!E) return;
  if (!EAT.cv || !EAT.cv.isConnected) return eatAbort();
  let t = performance.now() - E.t0; if (E.skip) { t = ET.end; }
  const lvCross = E.ev && E.ev.big && t >= ET.deflate1;   // 큰 진화만 끝 정지 생략 · 사이 레벨은 끝까지 본 뒤 짧은 레벨업(결정 19)
  frame({ C: E.C, t: lvCross ? ET.deflate1 : Math.min(t, ET.end), R: E.R, food: E.food, sparks: E.sparks, label: E.label });
  eatBar(E, t);
  if (E.sfx !== 1 && t >= ET.shiver0 && t < ET.end) { E.sfx = 1; if (S.sound) { tone(330, 0, .25, 'sawtooth', .03); tone(880, .4, .18, 'sine', .07); } }
  if (lvCross) return eatFinish(E.ev);   // §6: 끝 정지 생략 → 기존 큰 진화 바로
  if (t >= ET.end) return eatFinish(E.ev);
  EAT.raf = requestAnimationFrame(tick);
}
/* XP 띠: 3250–3950ms 현재값 → +획득 (배율형은 안 참). 레벨을 넘으면 100%까지 */
function eatBar(E, t) {
  const fill = document.getElementById('eatFill'), txt = document.getElementById('eatXpTxt'); if (!fill) return;
  const n0 = need(E.from), p0 = E.from >= 99 ? 1 : E.fromXP / n0, p1 = !E.res ? p0 : E.toLv > E.from ? 1 : E.toXP / n0, u = eio(c01((t - 3250) / 700)), p = p0 + (p1 - p0) * u;
  fill.style.width = (Math.min(1, p) * 100).toFixed(1) + '%';
  if (txt) txt.textContent = E.from >= 99 ? 'MAX' : `${Math.round(p * n0).toLocaleString()} / ${n0.toLocaleString()} XP`;
}
function eatFinish(ev) {
  cancelAnimationFrame(EAT.raf); const E = EAT.cur;
  if (E && E.f.eff.cond) toast(`${E.f.name} — 오늘 컨디션 쌩쌩 유지!`);
  else if (E && !E.f.eff.xp) toast(`${E.f.name} — ${E.label} 적용 · 다음 운동 기록 때 들어가요`);
  EAT.cur = null;
  if (ev) return play(ev, { onDone: () => { go('workout', 'shop'); setTimeout(eatNext, 60); } });
  if (EAT.q.length) { render(); return eatNext(); }
  render();
}
/* 화면을 떠나면 연출만 멈춤 — 경험치·레벨은 이미 저장, 못 본 진화는 S.pending 으로 다음 진입 때 */
function eatAbort() { cancelAnimationFrame(EAT.raf); EAT.cur = null; EAT.q.forEach(id => { S.inv[id] = (S.inv[id] || 0) + 1; }); EAT.q = []; save(); }

/* ===== 상점 «먹고 마시는» 탭 ===== */
function vEatTab() {
  const E = EAT.cur, lv = E ? E.from : S.level, xp = E ? E.fromXP : S.xp, n0 = need(lv), pct = lv >= 99 ? 100 : Math.min(100, xp / n0 * 100);
  const cat = S.eatCat || 'all', list = FOODS().filter(f => cat === 'all' || f.cat === cat), bm = boostMul();
  const card = f => { const n = S.inv[f.id] || 0, using = E && E.id === f.id, wait = EAT.q.filter(x => x === f.id).length, R = RARITY[f.rarity] || RARITY['일반'];
    return `<div class="fitem ${using ? 'using' : ''}" data-r="${R.key}">${using ? '<span class="ftag use">사용 중</span>' : wait ? `<span class="ftag">대기 ${wait}</span>` : n ? `<span class="ftag own">${n}개</span>` : ''}
      <img src="assets/food/card/${f.fid}.png" alt=""><b>${esc(f.name)}</b><small>${esc(f.desc)}</small><em style="color:${R.col}">${f.rarity}${f.rule === 'recent7d_workout' ? ' · 최근 7일 운동' : ''}</em>
      <div class="fp">${f.price.toLocaleString()}P</div>
      ${n ? `<div class="fbtn"><button class="btn ghost" data-act="buyFood" data-id="${f.id}">구매</button><button class="btn" data-act="eatUse" data-id="${f.id}">사용</button></div>` : `<button class="btn" data-act="buyFood" data-id="${f.id}">구매</button>`}</div>`; };
  return `<div class="eatcard"><div class="eathead"><b>${esc(CH[S.type].name)}</b><span class="pill lvpill">Lv.${lv}</span>${bm ? `<span class="pill bmpill">다음 운동 ${boostLabel()}</span>` : ''}</div>
    <div class="eatstage" id="eatStage"></div>
    <div class="eatbar"><span id="eatXpTxt">${lv >= 99 ? 'MAX' : `${xp.toLocaleString()} / ${n0.toLocaleString()} XP`}</span><div class="trk"><i id="eatFill" style="width:${pct.toFixed(1)}%"></i></div></div></div>
  <div class="chips">${[['all', '전체'], ['food', '먹는 거'], ['drink', '마시는 거']].map(([k, l]) => `<button class="${cat === k ? 'on' : ''}" data-act="eatCat" data-v="${k}">${l}</button>`).join('')}</div>
  <div class="fhead"><b>먹고 마시는 아이템</b><span>쓰면 바로 효과</span></div>
  <div class="fgrid">${list.map(card).join('')}</div>
  <div class="muted" style="margin-top:10px">즉시 경험치는 유료 경험치(랭킹 💰·«운동만 보기»·주간 리그 제외) · 배율은 가장 큰 것 1개만 적용, 나머지는 다음 운동으로 대기 · 화면 탭하면 연출 건너뛰기</div>`;
}
function buyFood(id) {
  const f = foodById(id); if (!f) return;
  if (S.points < f.price) return toast('포인트가 부족해요 — 니짐 포인트 충전 화면으로 이어져요');
  S.points -= f.price; S.inv[id] = (S.inv[id] || 0) + 1; save(); render(); toast(`${f.name} 구매 완료 · -${f.price.toLocaleString()}P`);
}
