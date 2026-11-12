/* 자랑하기 — 오운완 카드 2종(캐릭터·셀카, v1.45 정본 shared_inbox/results/nijim_ounwan_share_redesign_20261112)
   레벨업·업적 카드는 v2 정본(nijim_share_card_v2 cards.py) 그대로. 카드에 초대코드·주소·URL·볼륨 글자를 넣지 않는다. */
(() => {
const C2 = { rose:'#FF0065', rose2:'#FF3D72', tint:'#FFEDF3', ink:'#16161C', ink90:'#202024', slate:'#6B6B73', g5:'#8A8A95', line:'#ECECEF', tile:'#F5F5F7', white:'#FFFFFF', sky:'#39B4FF', mint:'#00C281', inklab:'#A9A9B4' };
const APP_LINK = 'https://ngym.onelink.me/U3B5/k4fu3ziz';
const INVITE_REWARD_EXAMPLE = '경험치 부스터(×1.5 · 1회) 1개';   // ⚠️ 예시값 — 형 확정 전
const LOGO_R = 5133 / 843;
const LAYOUT = {
  story: { W:1080, H:1920, M:64, logo:[64, 304, 44], date_base:340, date_s:30, head_base:470, head_s:92, sub_base:532, sub_s:34,
    char:[764, 364, 252, 204], hdr_bottom:568, gap:24, panel_bottom:1520, sf_photo:[748, 300, 268, 324], sf_char:[690, 520, 120, 112], sf_hdr_bottom:624,
    strip:[64, 592, 952, 148], strip_lab:[28, 56], strip_val:[60, 126], strip_unit:34, panel:[64, 764, 952, 756], pad:36, safe_bot:1536 },
  square: { W:1080, H:1080, M:48, logo:[48, 50, 34], date_base:null, date_s:0, head_base:164, head_s:64, sub_base:218, sub_s:28,
    char:[812, 34, 220, 214], hdr_bottom:236, gap:16, panel_bottom:1032, strip:[48, 252, 984, 128], strip_lab:[24, 46], strip_val:[50, 104], strip_unit:28,
    panel:[48, 400, 984, 632], pad:28, sf_photo:[840, 30, 192, 222], sf_char:[778, 160, 96, 92], sf_hdr_bottom:252, safe_bot:1080 },
};
const ICO = {
  up: '<path d="M12 20V5"/><path d="m5.5 11.5 6.5-6.5 6.5 6.5"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
};

/* ---------- 글자 ---------- */
const MC = document.createElement('canvas').getContext('2d');
const FONT = (w, s) => `${w} ${s}px Pretendard`;
const tw = (t, w, s) => { MC.font = FONT(w, s); return MC.measureText(t).width; };
function fit(text, w, sizes, maxw) {
  for (const s of sizes) if (tw(text, w, s) <= maxw) return [text, s];
  const s = sizes[sizes.length - 1]; let t = text;
  while (t.length > 1 && tw(t + '…', w, s) > maxw) t = t.slice(0, -1);
  return [t.trimEnd() + '…', s];
}
const T = (o, x, y, text, w, s, fill, anchor = 'start', alpha = 1) => o.push(c => { c.save(); c.font = FONT(w, s); c.fillStyle = fill; c.globalAlpha = alpha; c.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left'; c.fillText(text, x, y); c.restore(); });
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const RECT = (o, x, y, w, h, r, fill, stroke, sw) => o.push(c => { rr(c, x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); } });
const CIRCLE = (o, cx, cy, r, fill, stroke, sw) => o.push(c => { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = sw; c.stroke(); } });

/* ---------- 그림 ---------- */
const IMG = {};
function loadImg(src) {
  if (!IMG[src]) IMG[src] = new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  return IMG[src];
}
const TRIM = new Map();
function trimmed(img) {   // cards.py ex_art: 투명 여백 잘라 contain
  if (!img) return null; if (TRIM.has(img)) return TRIM.get(img);
  const w = img.naturalWidth, h = img.naturalHeight, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0);
  let d; try { d = c.getImageData(0, 0, w, h).data; } catch { TRIM.set(img, img); return img; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { TRIM.set(img, img); return img; }
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(cv, -x0, -y0);
  o.naturalWidth = o.width; o.naturalHeight = o.height; TRIM.set(img, o); return o;
}
const iw = i => i.naturalWidth || i.width, ih = i => i.naturalHeight || i.height;
function contain(img, bx, by, bw, bh, align = 'bottom', upscale = false) {
  let k = Math.min(bw / iw(img), bh / ih(img)); if (!upscale) k = Math.min(k, 1);
  const w = iw(img) * k, h = ih(img) * k;
  return [bx + (bw - w) / 2, align === 'bottom' ? by + bh - h : by + (bh - h) / 2, w, h];
}
const DRAW = (o, img, b) => o.push(c => { c.imageSmoothingQuality = 'high'; c.drawImage(img, b[0], b[1], b[2], b[3]); });
const svgIcon = (inner, color, sw) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240" fill="none" stroke="${color}" color="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`);
const cutKey = lv => lv >= 99 ? '99' : ['01', '10', '20', '30', '40', '50', '60', '70', '80', '90'][Math.min(9, Math.floor(lv / 10))];
const charSrc = (t, lv) => `assets/share/char/${t}/lv${cutKey(lv)}.webp?v=${VER}`;
/* v1.48 캐릭터 오운완 전용 고해상 원본 + 표시 크기 표(정본 nijim_ounwan_char_square_v148_20261112 SIZE_TABLE.json, 정사각=A안) */
const charHdSrc = (t, lv) => `assets/share/char_hd/${t}/lv${cutKey(lv)}.webp?v=${VER}`;
const CH_SIZE = {"story":{"bamtol":{"01":[484,719],"10":[521,725],"20":[531,732],"30":[561,733],"40":[595,732],"50":[622,728],"60":[645,732],"70":[703,707],"80":[716,698],"90":[755,683],"99":[760,679]},"capy":{"01":[517,689],"10":[439,748],"20":[490,735],"30":[503,753],"40":[564,735],"50":[633,743],"60":[601,748],"70":[659,722],"80":[654,738],"90":[678,714],"99":[713,701]},"dot":{"01":[603,687],"10":[570,714],"20":[575,735],"30":[601,737],"40":[626,749],"50":[669,761],"60":[667,748],"70":[725,678],"80":[733,667],"90":[770,654],"99":[771,637]},"imu":{"01":[522,711],"10":[496,722],"20":[492,744],"30":[498,753],"40":[535,754],"50":[616,728],"60":[660,713],"70":[684,711],"80":[678,732],"90":[710,720],"99":[745,701]},"koa":{"01":[590,652],"10":[560,681],"20":[517,689],"30":[536,693],"40":[619,674],"50":[626,715],"60":[673,700],"70":[673,710],"80":[703,701],"90":[696,708],"99":[789,654]},"mungchi":{"01":[853,408],"10":[600,565],"20":[627,585],"30":[609,618],"40":[633,639],"50":[753,585],"60":[709,625],"70":[710,649],"80":[712,658],"90":[747,647],"99":[698,700]},"ppiyak":{"01":[496,725],"10":[472,757],"20":[504,764],"30":[505,788],"40":[602,768],"50":[635,758],"60":[638,758],"70":[632,779],"80":[698,735],"90":[703,732],"99":[734,693]},"rilla":{"01":[534,735],"10":[480,764],"20":[478,770],"30":[497,779],"40":[551,771],"50":[656,753],"60":[634,769],"70":[679,757],"80":[711,739],"90":[714,733],"99":[771,691]},"saetbyeol":{"01":[515,752],"10":[467,789],"20":[452,821],"30":[507,795],"40":[517,810],"50":[622,777],"60":[657,734],"70":[662,757],"80":[677,755],"90":[667,776],"99":[725,739]},"shadow":{"01":[917,447],"10":[586,671],"20":[632,648],"30":[679,661],"40":[691,674],"50":[669,736],"60":[697,694],"70":[712,706],"80":[711,713],"90":[743,694],"99":[787,689]},"ttukbi":{"01":[516,756],"10":[484,776],"20":[456,807],"30":[536,778],"40":[567,778],"50":[631,776],"60":[621,799],"70":[653,778],"80":[692,755],"90":[703,746],"99":[747,719]},"youngcha":{"01":[474,787],"10":[447,823],"20":[499,813],"30":[501,826],"40":[547,825],"50":[649,781],"60":[719,764],"70":[715,771],"80":[698,794],"90":[733,780],"99":[793,720]}},"square":{"bamtol":{"01":[276,409],"10":[296,413],"20":[302,416],"30":[319,417],"40":[338,417],"50":[354,414],"60":[367,417],"70":[400,403],"80":[407,398],"90":[429,388],"99":[433,387]},"capy":{"01":[294,392],"10":[250,426],"20":[279,419],"30":[286,429],"40":[321,418],"50":[361,423],"60":[342,425],"70":[375,411],"80":[372,420],"90":[386,406],"99":[406,399]},"dot":{"01":[343,391],"10":[324,406],"20":[327,418],"30":[342,420],"40":[356,426],"50":[381,433],"60":[379,426],"70":[413,386],"80":[417,380],"90":[438,372],"99":[439,362]},"imu":{"01":[297,405],"10":[282,411],"20":[280,424],"30":[283,429],"40":[305,429],"50":[351,415],"60":[376,406],"70":[389,405],"80":[386,416],"90":[404,410],"99":[424,399]},"koa":{"01":[336,371],"10":[319,387],"20":[294,392],"30":[305,395],"40":[352,383],"50":[356,407],"60":[383,398],"70":[383,404],"80":[400,399],"90":[396,403],"99":[449,372]},"mungchi":{"01":[452,216],"10":[341,321],"20":[357,333],"30":[347,352],"40":[360,364],"50":[429,333],"60":[404,356],"70":[404,369],"80":[405,375],"90":[425,368],"99":[397,399]},"ppiyak":{"01":[282,413],"10":[269,431],"20":[287,435],"30":[287,449],"40":[343,437],"50":[361,432],"60":[363,432],"70":[359,443],"80":[397,418],"90":[400,417],"99":[418,394]},"rilla":{"01":[304,418],"10":[273,435],"20":[272,438],"30":[283,443],"40":[314,439],"50":[373,429],"60":[361,438],"70":[386,431],"80":[405,421],"90":[407,417],"99":[439,393]},"saetbyeol":{"01":[293,428],"10":[266,449],"20":[257,467],"30":[288,453],"40":[295,461],"50":[354,442],"60":[374,418],"70":[377,431],"80":[386,430],"90":[380,442],"99":[413,421]},"shadow":{"01":[452,220],"10":[334,382],"20":[359,369],"30":[386,376],"40":[393,384],"50":[381,419],"60":[397,395],"70":[405,402],"80":[405,406],"90":[423,395],"99":[448,392]},"ttukbi":{"01":[294,430],"10":[275,442],"20":[259,459],"30":[305,443],"40":[323,443],"50":[359,442],"60":[353,455],"70":[372,443],"80":[394,430],"90":[400,425],"99":[425,409]},"youngcha":{"01":[270,448],"10":[254,468],"20":[284,463],"30":[285,470],"40":[311,470],"50":[369,445],"60":[409,435],"70":[407,439],"80":[397,452],"90":[417,444],"99":[451,410]}}};
const exSrc = id => `assets/ex/z/${id}_a.png?v=${VER}`;

/* ---------- 운동 표기(lib.py chips_of) ---------- */
const exOf = it => EX[it.ex] || { name: it.name || '?', mode: it.mode || 'wr' };
const exName = it => it.name || exOf(it).name;
const gnum = n => String(+(+n).toFixed(2));
const secTxt = s => s < 60 ? `${s}초` : `${Math.floor(s / 60)}분${s % 60 ? ` ${s % 60}초` : ''}`;
const doneSets = it => (it.sets || []).filter(s => s.done !== false);
const setCount = it => doneSets(it).length;
const durTxt = m => m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간` + (m % 60 ? ` ${m % 60}분` : '');

/* ---------- 공통 조각 ---------- */
function strip(o, L, x, y, w, h, stats) {
  RECT(o, x, y, w, h, 32, C2.ink);
  const cw = w / stats.length, [ls, lb] = L.strip_lab, [vs, vb] = L.strip_val;
  stats.forEach(([lab, val, col], i) => {
    const cx = x + cw * i + cw / 2;
    if (i) RECT(o, x + cw * i - 1, y + 30, 2, h - 60, 0, '#2C2C35');
    T(o, cx, y + lb, lab, 500, ls, C2.inklab, 'middle');
    const parts = val.match(/\d[\d.,/]*|[^\d]+/g), us = L.strip_unit, isD = p => /\d/.test(p[0]);
    const tot = parts.reduce((a, p) => a + (isD(p) ? tw(p, 800, vs) : tw(p, 700, us)), 0);
    let vs2 = vs, us2 = us; if (tot > cw - 32) { const k = (cw - 32) / tot; vs2 = Math.floor(vs * k); us2 = Math.floor(us * k); }
    const tot2 = parts.reduce((a, p) => a + (isD(p) ? tw(p, 800, vs2) : tw(p, 700, us2)), 0);
    let px = cx - tot2 / 2;
    parts.forEach(p => { const d = isD(p), wt = d ? 800 : 700, s = d ? vs2 : us2, xx = px; T(o, xx, y + vb, p, wt, s, col); px += tw(p, wt, s); });
  });
}
function head(o, L, maxw, segs, sub) {
  const x = L.M, hs = L.head_s;
  const tot = segs.reduce((a, [t]) => a + tw(t, 800, hs), 0), s = tot <= maxw ? hs : Math.floor(hs * maxw / tot);
  o.push(c => { c.save(); c.font = FONT(800, s); if ('letterSpacing' in c) c.letterSpacing = `${-0.01 * s}px`; let px = x;
    for (const [t, col] of segs) { c.fillStyle = col; c.fillText(t, px, L.head_base); px += c.measureText(t).width; } c.restore(); });
  const [st, ss] = fit(sub, 600, [L.sub_s, L.sub_s - 2, L.sub_s - 4], maxw);
  T(o, x, L.sub_base, st, 600, ss, C2.white, 'start', 0.92);
}
const charAt = (o, A, box) => { const b = contain(A.char, ...box); DRAW(o, A.char, b); return b; };
function emblem(o, A, cx, cy, r, key) {
  CIRCLE(o, cx, cy, r, C2.rose);
  const s = r * 1.15;
  if (A.icon[key]) DRAW(o, A.icon[key], [cx - s / 2, cy - s / 2, s, s]);
  else T(o, cx, cy + r * 0.28, String(key), 800, Math.round(r * 0.8), C2.white, 'middle');
}

/* ---------- 카드 ---------- */
function build(c, d, A) {
  const L = LAYOUT[d.size], { W, H, M } = L, sq = d.size === 'square';
  c.canvas.width = W; c.canvas.height = H;
  c.fillStyle = C2.rose; c.fillRect(0, 0, W, H);
  const chk = [], info = {}, hdr = [], body = [];
  const [lx, ly, lh] = L.logo, lw = lh * LOGO_R;
  hdr.push(cc => cc.drawImage(A.logo, lx, ly, lw, lh));
  info.logo = { x: lx, y: ly, w: +lw.toFixed(1), h: lh };
  const topDate = !sq;
  if (topDate) T(hdr, W - M, L.date_base, d.date, 600, L.date_s, C2.white, 'end', 0.85);
  const cname = CH[d.t].name; let who = `${d.nick} · Lv.${d.lv} ${cname}`; if (!topDate) who += ` · ${d.date_s}`;
  {
    let segs, sub, stats;
    if (d.kind === 'levelup') {
      segs = [[`${cname} `, C2.white], [`Lv.${d.lv}`, C2.ink], [' 달성!', C2.white]];
      sub = `${d.nick}의 ${cname}` + (sq ? ` · ${d.date_s}` : '');
      stats = [['레벨', `Lv.${d.lv}`, C2.sky], ['연속', `${d.streak}주`, C2.rose2], ['오늘 운동', `${d.items.length}종목`, C2.mint]];
    } else {
      segs = [['업적 ', C2.white], ['달성!', C2.ink]]; sub = who;
      stats = [['모은 업적', `${d.ach_n}/${d.ach_total}`, C2.sky], ['연속', `${d.streak}주`, C2.rose2], ['레벨', `Lv.${d.lv}`, C2.mint]];
    }
    const o = [...hdr]; head(o, L, W - 2 * M, segs, sub);
    strip(o, L, ...L.strip, stats);
    const [px, py, pw, ph] = L.panel; RECT(o, px, py, pw, ph, 36, C2.white);
    if (d.kind === 'levelup') levelupBody(o, d, L, sq, A); else badgeBody(o, d, L, sq, A);
    o.forEach(f => f(c)); info.stats = stats.map(s => `${s[0]} ${s[1]}`);
  }
  info.overflow = chk.filter(x => x[1] > x[2] + 0.5);
  return info;
}
function tileArt(o, A, it, X, Y, size, pad) {
  const art = A.ex[it.ex];
  if (art) DRAW(o, art, contain(art, X + pad, Y + pad, size - 2 * pad, size - 2 * pad, 'center', true));
  else { const s = size * .46; DRAW(o, A.dumbbell, [X + (size - s) / 2, Y + (size - s) / 2, s, s]); }
}
function levelupBody(o, d, L, sq, A) {
  const [px, py, pw] = L.panel;
  if (!sq) {
    const cx = 540, cy = py + 212, r = 178;
    CIRCLE(o, cx, cy, r, C2.tint); CIRCLE(o, cx, cy, r, null, C2.rose, 8);
    charAt(o, A, [cx - 152, cy - 160, 304, 296]);
    emblem(o, A, cx + r * 0.72, cy - r * 0.72, 44, 'up');
    lvLine(o, 540, py + 456, d, 'middle', '  →  ');
    RECT(o, px + 36, py + 490, pw - 72, 2, 0, C2.line);
    T(o, px + 36, py + 536, '오늘 한 운동', 700, 28, C2.slate);
    const its = d.items, per = 5, size = 132, w = pw - 72, gap = (w - per * size) / (per - 1), y = py + 560;
    const show = its.length <= per ? its : its.slice(0, per - 1), cells = [...show, ...(its.length > per ? [null] : [])];
    const x = px + 36 + (w - (cells.length * size + (cells.length - 1) * gap)) / 2;
    cells.forEach((it, i) => { const X = x + i * (size + gap);
      RECT(o, X, y, size, size, 26, C2.tile);
      if (!it) return T(o, X + size / 2, y + size / 2 + 14, `외 ${its.length - per + 1}`, 800, 40, C2.slate, 'middle');
      tileArt(o, A, it, X, y, size, 6);
      const [t, s] = fit(exName(it), 600, [24, 22, 20], size + gap - 8); T(o, X + size / 2, y + size + 34, t, 600, s, C2.ink90, 'middle'); });
  } else {
    const cx = px + 236, cy = py + 300, r = 196;
    CIRCLE(o, cx, cy, r, C2.tint); CIRCLE(o, cx, cy, r, null, C2.rose, 7);
    charAt(o, A, [cx - 160, cy - 172, 320, 316]);
    emblem(o, A, cx + r * 0.72, cy - r * 0.72, 38, 'up');
    const rx = px + 472; lvLine(o, rx, py + 96, d, 'start', ' → ');
    T(o, rx, py + 168, '오늘 한 운동', 700, 24, C2.slate);
    const its = d.items, per = 3, size = 132, gap = (px + pw - 36 - rx - per * size) / (per - 1);
    const rows = its.length <= 6 ? [its.slice(0, 3), its.slice(3, 6)] : [its.slice(0, 3), [...its.slice(3, 5), null]];
    rows.forEach((row, ri) => row.forEach((it, i) => { const X = rx + i * (size + gap), Y = py + 192 + ri * (size + 52);
      RECT(o, X, Y, size, size, 24, C2.tile);
      if (!it) return T(o, X + size / 2, Y + size / 2 + 14, `외 ${its.length - 5}`, 800, 38, C2.slate, 'middle');
      tileArt(o, A, it, X, Y, size, 6);
      const [t, s] = fit(exName(it), 600, [22, 20], size + gap - 8); T(o, X + size / 2, Y + size + 32, t, 600, s, C2.ink90, 'middle'); }));
  }
}
function lvLine(o, x, y, d, anchor, arrow) {
  const a = `Lv.${d.lv_from}${arrow}`, b = `Lv.${d.lv}`, wa = tw(a, 800, 46), wb = tw(b, 800, 46), x0 = anchor === 'middle' ? x - (wa + wb) / 2 : x;
  T(o, x0, y, a, 800, 46, C2.g5); T(o, x0 + wa, y, b, 800, 46, C2.rose);
}
function rewardPill(o, x, y, h, fs, reward, centered) {
  const lab = '보상  ', rw = tw(`보상  ${reward}`, 700, fs) + (centered ? 64 : 56), X = centered ? x - rw / 2 : x;
  RECT(o, X, y, rw, h, h / 2, C2.tint);
  const w1 = tw(lab, 500, fs), w2 = tw(reward, 700, fs), tx = centered ? x - (w1 + w2) / 2 : x + 28, bl = y + h / 2 + fs * 0.36;
  T(o, tx, bl, lab, 500, fs, C2.slate); T(o, tx + w1, bl, reward, 700, fs, C2.rose);
}
function badgeBody(o, d, L, sq, A) {
  const [px, py, pw] = L.panel, b = d.badge;
  if (!sq) {
    const cx = 540; emblem(o, A, cx, py + 136, 92, b.icon);
    let [t, s] = fit(b.name, 800, [64, 56, 48], pw - 96); T(o, cx, py + 316, t, 800, s, C2.ink, 'middle');
    [t, s] = fit(b.cond, 500, [32, 30, 28], pw - 96); T(o, cx, py + 368, t, 500, s, C2.slate, 'middle');
    rewardPill(o, cx, py + 398, 60, 30, b.reward, true);
    charAt(o, A, [cx - 180, py + 492, 360, 236]);
  } else {
    const cx = px + 236, cy = py + 316;
    CIRCLE(o, cx, cy, 196, C2.tint); charAt(o, A, [cx - 160, cy - 172, 320, 316]); emblem(o, A, cx + 141, cy - 141, 52, b.icon);
    const rx = px + 472, mw = px + pw - 36 - rx;
    let [t, s] = fit(b.name, 800, [60, 52, 44], mw); T(o, rx, py + 230, t, 800, s, C2.ink);
    [t, s] = fit(b.cond, 500, [28, 26, 24], mw); T(o, rx, py + 284, t, 500, s, C2.slate);
    rewardPill(o, rx, py + 318, 56, 28, b.reward, false);
  }
}

/* ---------- 오운완 카드 2종(v1.45·v1.47 배치) — 정본 shared_inbox/results/nijim_ounwan_share_redesign_20261112 (SPEC.md · _src/render.py SELFIE·CHAR).
   좌표·크기는 render.py 를 그대로 옮겼다(SPEC 숫자와 다르면 render.py 가 맞다). ---------- */
const CO = { pink: '#FC2066', pinkD: '#FF5C8F', tint: '#FFF0F5', tint2: '#FFD9E5', ink: '#16161C', slate: '#6B6B73', row: '#F0F0F3', bell: '#B9B9C2', photoBg: '#0B0B0D' };
const CHN = t => (CH[t] && CH[t].name) || '';
const twl = (t, w, s, ls = 0) => tw(t, w, s) + ls * Math.max(0, [...t].length - 1);
/* anchor: 첫 글자 l·m·r(가로) + 둘째 s(기준선)·m(가운데) — render.py(PIL)와 같은 뜻. ls=자간(글자마다 찍음) */
function TX(c, x, y, t, w, s, col, a = 1, anchor = 'ls', ls = 0) {
  c.save(); c.font = FONT(w, s); c.fillStyle = col; c.globalAlpha = a; c.textBaseline = anchor[1] === 'm' ? 'middle' : 'alphabetic';
  if (!ls) { c.textAlign = anchor[0] === 'r' ? 'right' : anchor[0] === 'm' ? 'center' : 'left'; c.fillText(t, x, y); c.restore(); return tw(t, w, s); }
  const total = twl(t, w, s, ls); let x0 = x - (anchor[0] === 'r' ? total : anchor[0] === 'm' ? total / 2 : 0); c.textAlign = 'left';
  for (const ch of t) { c.fillText(ch, x0, y); x0 += tw(ch, w, s) + ls; }
  c.restore(); return total;
}
function ellip(t, w, s, maxw) { if (tw(t, w, s) <= maxw) return t; while (t && tw(t + '…', w, s) > maxw) t = t.slice(0, -1); return t.trimEnd() + '…'; }
function fitSize(t, w, sizes, maxw) { for (const s of sizes) if (tw(t, w, s) <= maxw) return [s, t]; const s = sizes[sizes.length - 1]; return [s, ellip(t, w, s, maxw)]; }
const fitBox = (img, bw, bh, up = false) => { let k = Math.min(bw / iw(img), bh / ih(img)); if (!up) k = Math.min(1, k); return [iw(img) * k, ih(img) * k, k]; };
const fillRR = (c, x, y, w, h, r, col, a = 1) => { c.save(); c.globalAlpha = a; rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); c.restore(); };
const hline = (c, x0, x1, y, col, wd, a = 1) => { c.save(); c.globalAlpha = a; c.fillStyle = col; c.fillRect(x0, y - wd / 2, x1 - x0, wd); c.restore(); };
const drawLogo = (c, img, x, y, h) => { const w = h * LOGO_R; c.drawImage(img, x, y, w, h); return w; };

/* 데이터 → 표기(render.py summary·stats·pick_rows) */
const exModeOf = it => it.mode || exOf(it).mode || 'wr';
const oneSet = (s, m) => m === 'wr' ? `${gnum(s.w || 0)}kg × ${s.r}회` : m === 't' ? secTxt(s.s || 0) : `${s.r}회`;
const nSets = it => (it.sets || []).length;
function summary(it) {
  const m = exModeOf(it);
  if (m === 'cardio') return [`${it.min || 0}분` + (it.km ? ` · ${gnum(it.km)}km` : ''), false];
  if (m === 'lesson') return [`${it.min || 0}분 수업`, false];
  const sets = it.sets || []; if (!sets.length) return ['', false];
  const key = m === 'wr' ? s => [s.w || 0, s.r || 0] : m === 't' ? s => [s.s || 0] : s => [s.r || 0];
  const gt = (a, b) => { const ka = key(a), kb = key(b); for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] > kb[i]; return false; };
  const pr = sets.some(s => s.pr), top = sets.find(s => s.pr) || sets.reduce((b, s) => gt(s, b) ? s : b);
  if (sets.length === 1) return [oneSet(top, m), pr];
  const same = new Set(sets.map(s => oneSet(s, m))).size === 1;
  return [`${sets.length}세트 · ${same ? '' : '최고 '}${oneSet(top, m)}`, pr];
}
function statsOf(d) {
  const out = [], m = d.dur_min;
  if (m) out.push(['운동 시간', m < 60 ? [[String(m), '분']] : m % 60 ? [[String(Math.floor(m / 60)), '시간 '], [String(m % 60), '분']] : [[String(m / 60), '시간']]]);
  out.push(['종목', [[String(d.items.length), '개']]]);
  const ns = d.items.reduce((a, i) => a + nSets(i), 0); if (ns) out.push(['세트', [[String(ns), '세트']]]);
  return out;
}
function pickRows(items, maxn) {
  if (items.length <= maxn) return [items.slice(), null];
  const hasPr = it => (it.sets || []).some(s => s.pr);
  const order = items.map((_, i) => i).sort((a, b) => (hasPr(items[a]) ? 0 : 1) - (hasPr(items[b]) ? 0 : 1) || nSets(items[b]) - nSets(items[a]) || a - b);
  const keep = new Set(order.slice(0, maxn - 1)), rest = items.filter((_, i) => !keep.has(i));
  return [items.filter((_, i) => keep.has(i)), [rest.length, rest.reduce((a, i) => a + nSets(i), 0)]];
}
const moreTxt = mo => `외 ${mo[0]}종목` + (mo[1] ? ` · ${mo[1]}세트` : '');
function numunit(c, x, y, parts, ns, us, col, o = {}) {
  const { a = 1, ua, anchor = 'l', nw = 800, uw = 700, measure = false } = o;
  const wsum = parts.reduce((s, [n, u]) => s + twl(n, nw, ns, -ns * 0.02) + tw(u, uw, us) + 4, 0) - 4;
  if (measure) return wsum;
  let x0 = anchor === 'r' ? x - wsum : anchor === 'm' ? x - wsum / 2 : x;
  for (const [n, u] of parts) {
    x0 += TX(c, x0, y, n, nw, ns, col, a, 'ls', -ns * 0.02) + 4;
    x0 += TX(c, x0, y, u.trim(), uw, us, col, ua ?? a) + (u.endsWith(' ') ? us * 0.35 : 0);
  }
  return wsum;
}

/* ===== ② 셀카 오운완 — 사진 전면 + 아래 기록 블록 ===== */
const SELFIE = {
  story: { W: 1080, H: 1920, M: 64, bottom: 1830, face_y: 0.30, kick: 30, num: [96, 88, 80], unit: 34, lab: 28, row_h: 58, name: 31, sum_: 28, maxrows: 3, logo_h: 36, char_h: 88, gap_stats: 26, gap_list: 26, gap_foot: 40, scrim: 300 },
  square: { W: 1080, H: 1080, M: 48, bottom: 1032, face_y: 0.30, kick: 26, num: [80, 72, 66], unit: 28, lab: 23, row_h: 50, name: 27, sum_: 24, maxrows: 3, logo_h: 30, char_h: 72, gap_stats: 26, gap_list: 22, gap_foot: 44, scrim: 240 },
};
const smooth = t => t * t * (3 - 2 * t);
function edgeColors(img) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, 32, 32); const p = x.getImageData(0, 0, 32, 32).data;
  const avg = (r0, r1) => { const s = [0, 0, 0]; for (let y = r0; y < r1; y++) for (let i = 0; i < 32; i++) { const k = (y * 32 + i) * 4; s[0] += p[k]; s[1] += p[k + 1]; s[2] += p[k + 2]; } return s.map(v => v / ((r1 - r0) * 32)); };
  return [avg(0, 3).map(v => v * 0.55), avg(29, 32).map(v => v * 0.45)];
}
/* 사진 배치(SPEC §8): 꽉 채움 → 얼굴이 기록 블록에 걸리거나 가로 사진이면 폭 맞춤 + 위·아래는 사진 끝 색 그라데이션 */
function placePhoto(c, img, fb, W, H, L, blockTop, topSafe, shift = 0) {
  const pw = iw(img), ph = ih(img), kc = Math.max(W / pw, H / ph), cw = pw * kc, chh = ph * kc;
  const [fx, fy] = fb ? [(fb.x + fb.w / 2) * kc, (fb.y + fb.h / 2) * kc] : [cw / 2, chh * 0.3];
  const ox = Math.min(0, Math.max(W - cw, W / 2 - fx)), oy = Math.min(0, Math.max(H - chh, H * L.face_y - fy));
  let face = fb ? [fb.x * kc + ox, fb.y * kc + oy, fb.w * kc, fb.h * kc] : null;
  const landscape = kc / (W / pw) > 1.5;
  // 끌어 옮기면(shift) 폭 맞춤으로 — 3:4 사진을 9:16에 꽉 채우면 세로로 움직일 여유가 0이라서
  if (!shift && !((face && face[1] + face[3] > blockTop - 48) || landscape)) {
    c.drawImage(img, ox, oy, cw, chh); return { mode: 'cover', face };
  }
  const f = fb || { x: pw * 0.4, y: ph * 0.2, w: pw * 0.2, h: ph * 0.2 }, k = W / pw, ph_ = ph * k;
  const lo = topSafe - f.y * k, hi = blockTop - 48 - (f.y + f.h) * k;
  const oy2 = Math.min(H - 240, Math.max(240 - ph_, Math.min(hi, Math.max(lo, Math.min(0, blockTop + L.scrim - ph_))) + shift));
  const [ct, cb] = edgeColors(img), g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgb(${ct.map(Math.round)})`); g.addColorStop(1, `rgb(${cb.map(Math.round)})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const o = document.createElement('canvas'); o.width = W; o.height = Math.max(1, Math.round(ph_)); const x = o.getContext('2d');
  x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, W, o.height);
  const fe = 180, fadeTop = oy2 > 0, fadeBot = oy2 + ph_ < H;
  if (fadeTop || fadeBot) {
    const m = x.createLinearGradient(0, 0, 0, o.height), N = 12;
    const al = y => { let v = 1; if (fadeTop && y < fe) v = y / fe; if (fadeBot && y > o.height - fe) v = Math.min(v, (o.height - y) / fe); return smooth(Math.max(0, Math.min(1, v))); };
    const ys = new Set([0, o.height]); for (let i = 0; i <= N; i++) { ys.add(fe * i / N); ys.add(o.height - fe * i / N); }
    [...ys].filter(y => y >= 0 && y <= o.height).sort((a, b) => a - b).forEach(y => m.addColorStop(y / o.height, `rgba(0,0,0,${al(y)})`));
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, W, o.height);
  }
  c.drawImage(o, 0, oy2);
  face = [f.x * k, f.y * k + oy2, f.w * k, f.h * k];
  return { mode: 'fitwidth', face: fb ? face : null };
}
function buildSelfie(c, d, A, size) {
  const L = SELFIE[size], { W, H, M } = L; c.canvas.width = W; c.canvas.height = H; c.fillStyle = CO.photoBg; c.fillRect(0, 0, W, H);
  const [rows, more] = pickRows(d.items, L.maxrows), nrows = rows.length + (more ? 1 : 0), st = statsOf(d), chk = [];
  const foot = L.bottom, listBot = foot - L.logo_h - L.gap_foot, listTop = listBot - nrows * L.row_h;
  const mw = s => st.reduce((a, [, p]) => a + numunit(c, 0, 0, p, s, L.unit, '#fff', { nw: 700, uw: 600, measure: true }), 0) + 64 * (st.length - 1);
  let num = L.num[0]; for (const s of L.num) { num = s; if (mw(s) <= W - 2 * M) break; }
  const statBase = listTop - L.gap_list, labBase = statBase - num * 0.92 - 18, kickBase = labBase - L.lab - L.gap_stats, blockTop = kickBase - L.kick;
  const ph = placePhoto(c, A.photo, A.face, W, H, L, blockTop, size === 'story' ? 290 : 24, d.shift || 0);
  // 가독용 어둠 깔기 1개: blockTop-scrim 0 → blockTop+120 0.64 → 바닥 0.72
  const y0 = blockTop - L.scrim, y1 = blockTop + 120, g = c.createLinearGradient(0, 0, 0, H);
  const al = y => y < y0 ? 0 : y <= y1 ? 0.64 * smooth((y - y0) / (y1 - y0)) : 0.64 + 0.08 * (y - y1) / (H - y1);
  const ys = [0, Math.max(0, y0)]; for (let i = 1; i <= 24; i++) ys.push(y0 + (y1 - y0) * i / 24); ys.push(H);
  ys.filter(y => y >= 0 && y <= H).sort((a, b) => a - b).forEach(y => g.addColorStop(y / H, `rgba(0,0,0,${al(y).toFixed(4)})`));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // 머리줄
  const kw = TX(c, M, kickBase, '오운완', 800, L.kick, CO.pinkD);
  TX(c, M + kw + 14, kickBase, d.date_long, 600, L.kick, '#FFFFFF', 0.92);
  // 숫자 칸(글자 폭대로 왼쪽부터)
  const ws = st.map(([, p]) => numunit(c, 0, 0, p, num, L.unit, '#fff', { nw: 700, uw: 600, measure: true }));
  const gapx = st.length > 1 ? Math.min(96, (W - 2 * M - ws.reduce((a, b) => a + b, 0)) / (st.length - 1)) : 0;
  let cx = M;
  st.forEach(([lab, parts], i) => {
    if (i) cx += ws[i - 1] + gapx;
    TX(c, cx, labBase, lab, 600, L.lab, '#FFFFFF', 0.72);
    numunit(c, cx, statBase, parts, num, L.unit, '#FFFFFF', { nw: 700, uw: 600, ua: 0.9 });
    chk.push(['stat:' + lab, cx + ws[i], W - M]);
  });
  // 종목 줄
  let y = listTop;
  for (const it of rows) {
    hline(c, M, W - M, y, '#FFFFFF', 1.5, 0.28);
    const [t, pr] = summary(it), sb = y + L.row_h / 2 + L.name * 0.36, sw = tw(t, 500, L.sum_), prw = pr ? tw('PR', 800, L.sum_ * 0.8) + 22 : 0;
    let xr = W - M;
    if (pr) { const h = L.sum_ * 1.25; fillRR(c, xr - prw, sb - h * 0.78, prw, h, h / 2, CO.pink); TX(c, xr - prw / 2, sb - h * 0.78 + h / 2, 'PR', 800, L.sum_ * 0.8, '#FFFFFF', 1, 'mm'); xr -= prw + 12; }
    TX(c, xr, sb, t, 500, L.sum_, '#FFFFFF', 0.9, 'rs');
    const nmMax = xr - sw - 28 - M, [ns, nm] = fitSize(exName(it), 600, [L.name, L.name - 2, L.name - 4], nmMax);
    const nw = TX(c, M, sb, nm, 600, ns, '#FFFFFF'); chk.push(['name:' + nm, M + nw, xr - sw - 28 + 0.5]);
    y += L.row_h;
  }
  if (more) { hline(c, M, W - M, y, '#FFFFFF', 1.5, 0.28); TX(c, M, y + L.row_h / 2 + L.sum_ * 0.36, moreTxt(more), 500, L.sum_, '#FFFFFF', 0.72); y += L.row_h; }
  hline(c, M, W - M, y, '#FFFFFF', 1.5, 0.28);
  // 바닥줄: 로고(왼) · 레벨+작은 캐릭터(오)
  const lgw = drawLogo(c, A.logoW, M, foot - L.logo_h, L.logo_h);
  const ch = trimmed(A.char), [cw, chh] = fitBox(ch, L.char_h * 1.2, L.char_h);
  c.imageSmoothingQuality = 'high'; c.drawImage(ch, W - M - cw, foot - chh + 2, cw, chh);
  const lvT = `Lv.${d.lv} ${CHN(d.t)}`, lvW = TX(c, W - M - cw - 14, foot - 4, lvT, 700, L.lab + 2, '#FFFFFF', 0.95, 'rs');
  chk.push(['foot', M + lgw + 16, W - M - cw - 14 - lvW]);
  const blk = [0, blockTop, W, foot + 8];
  return { style: 'selfie', size, photo_mode: ph.mode, shift: d.shift || 0, face: ph.face && ph.face.map(v => Math.round(v)), block: blk.map(Math.round),
    face_gap: ph.face ? Math.round(blockTop - (ph.face[1] + ph.face[3])) : null, rows: rows.map(exName), more, stats: st.map(([l, p]) => l + ' ' + p.map(x => x.join('')).join('')),
    overflow: chk.filter(x => x[1] > x[2] + 0.5).map(x => x[0]) };
}

/* ===== ① 캐릭터 오운완 — 연분홍 바탕 + 큰 캐릭터 + 흰 목록 패널 1장 ===== */
const CHAR = {
  // v1.47: 머리줄=맨 위(top), 숫자+목록=맨 아래(bot), 가운데 전부 캐릭터. ch_max=공유 원본 최대 높이(720) — 배율 ≤ 1(확대 금지)
  story: { W: 1080, H: 1920, M: 64, top: 90, bot: 1830, logo_h: 40, head: [104, 96, 88], sub: 32, date: 28, ch_max: 720, ch_min: 300, lab: 26, num: 64, unit: 30, stat_h: 124, row_h: 100, art: 80, name: 34, sum_: 28, pad: 26, maxrows: 4, gap: 30, lw: 0 },
  square: { W: 1080, H: 1080, M: 48, top: 48, bot: 1032, logo_h: 32, head: [72, 66, 60], sub: 26, date: 24, ch_max: 720, ch_min: 230, lab: 22, num: 50, unit: 24, stat_h: 100, row_h: 88, art: 66, name: 29, sum_: 24, pad: 24, maxrows: 6, gap: 22, lw: 380, lw_max: 470 },
};
function stamp(c, cx, cy, r, weeks) {
  c.save(); c.translate(cx, cy); c.rotate(-8 * Math.PI / 180);
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fillStyle = CO.pink; c.fill();
  c.beginPath(); c.arc(0, 0, r - 8, 0, Math.PI * 2); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.stroke();
  TX(c, 0, -r * 0.10, `${weeks}주`, 800, r * 0.62, '#FFFFFF', 1, 'ms');
  TX(c, 0, r * 0.44, '연속', 700, r * 0.34, '#FFFFFF', 1, 'ms');
  c.restore();
}
function statrow(c, x, y, w, st, L) {
  const colw = w / st.length; let ns = L.num;
  while (st.some(([, p]) => numunit(c, 0, 0, p, ns, L.unit, '#000', { measure: true }) > colw - 20) && ns > 30) ns -= 2;
  st.forEach(([lab, parts], i) => {
    const cx = x + colw * i + colw / 2;
    if (i) { c.fillStyle = CO.tint2; c.fillRect(x + colw * i - 1, y + 18, 2, L.stat_h - 36); }
    TX(c, cx, y + 18 + L.lab, lab, 600, L.lab, CO.slate, 1, 'ms');
    numunit(c, cx, y + 18 + L.lab + 14 + ns * 0.9, parts, ns, L.unit, CO.ink, { anchor: 'm' });
  });
}
function dumbbell(c, cx, cy, w, col) {
  const t = w / 14; fillRR(c, cx - w / 2 + t * 3.2, cy - t * 0.6, w - t * 6.4, t * 1.2, t * 0.6, col);
  for (const sx of [-1, 1]) {
    fillRR(c, cx + sx * (w / 2 - t * 3.2) - t * 1.3, cy - t * 3.6, t * 2.6, t * 7.2, t * 1.0, col);
    fillRR(c, cx + sx * (w / 2 - t * 1.0) - t * 1.0, cy - t * 2.2, t * 2.0, t * 4.4, t * 0.9, col);
  }
}
function listpanel(c, x, y, w, rows, more, L, A, chk) {
  const n = rows.length + (more ? 1 : 0), h = n * L.row_h + 2 * L.pad, a = L.art, ix = x + L.pad;
  fillRR(c, x, y, w, h, L.H > 1080 ? 32 : 26, '#FFFFFF');
  let yy = y + L.pad;
  rows.forEach((it, i) => {
    if (i) { c.fillStyle = CO.row; c.fillRect(ix + a + 22, yy - 1, x + w - L.pad - (ix + a + 22), 2); }
    const art = A.ex[it.ex];
    if (art) { const [aw, ah] = fitBox(art, a, a, true); c.imageSmoothingQuality = 'high'; c.drawImage(art, ix + (a - aw) / 2, yy + (L.row_h - ah) / 2, aw, ah); }
    else dumbbell(c, ix + a / 2, yy + L.row_h / 2, a * 0.62, CO.bell);
    const tx = ix + a + 22, maxw = x + w - L.pad - tx, [t, pr] = summary(it), nb = yy + L.row_h / 2 - 4;
    const prw = pr ? tw('PR', 800, L.sum_ * 0.78) + 20 : 0;
    const [ns, nm] = fitSize(exName(it), 700, [L.name, L.name - 2, L.name - 4], maxw - (pr ? prw + 10 : 0));
    const nw = TX(c, tx, nb, nm, 700, ns, CO.ink);
    if (pr) { const hh = L.sum_ * 1.15; fillRR(c, tx + nw + 10, nb - hh * 0.82, prw, hh, hh / 2, CO.pink); TX(c, tx + nw + 10 + prw / 2, nb - hh * 0.82 + hh / 2, 'PR', 800, L.sum_ * 0.78, '#FFFFFF', 1, 'mm'); }
    chk.push(['name:' + nm, tx + nw + (pr ? prw + 10 : 0), x + w - L.pad]);
    TX(c, tx, nb + L.sum_ + 12, ellip(t, 500, L.sum_, maxw), 500, L.sum_, CO.slate);
    yy += L.row_h;
  });
  if (more) { c.fillStyle = CO.row; c.fillRect(ix + a + 22, yy - 1, x + w - L.pad - (ix + a + 22), 2); TX(c, ix + a + 22, yy + L.row_h / 2 + L.sum_ * 0.36, moreTxt(more), 600, L.sum_, CO.slate); }
  return h;
}
/* 캐릭터 + 발밑 그림자(render148 floor_and_char) — 이미지 (cx−w/2, foot−h+2), 그림자 중심 (cx, foot) */
function floorChar(c, img, cx, foot, w, h) {
  const fl = Math.min(w * 0.92, 420);
  c.fillStyle = CO.tint2; c.beginPath(); c.ellipse(cx, foot, fl / 2, 20, 0, 0, Math.PI * 2); c.fill();
  c.imageSmoothingQuality = 'high'; c.drawImage(img, cx - w / 2, foot - h + 2, w, h);
}
/* 정사각 A안 목록 한 줄(render148 row·more_row) */
function rowA(c, x, y, w, it, rh, a, name, sm, sep, A, chk) {
  if (sep) hline(c, x + a + 18, x + w, y, CO.row, 2);
  const art = A.ex[it.ex];
  if (art) { const [aw, ah] = fitBox(art, a, a, true); c.imageSmoothingQuality = 'high'; c.drawImage(art, x + (a - aw) / 2, y + (rh - ah) / 2, aw, ah); }
  else dumbbell(c, x + a / 2, y + rh / 2, a * 0.62, CO.bell);
  const tx = x + a + 18, maxw = x + w - tx, [t, pr] = summary(it), nb = y + rh / 2 - 3;
  const prw = pr ? tw('PR', 800, sm * 0.78) + 18 : 0;
  const [ns, nm] = fitSize(exName(it), 700, [name, name - 2, name - 4], maxw - (pr ? prw + 10 : 0));
  const nw = TX(c, tx, nb, nm, 700, ns, CO.ink);
  if (pr) { const hh = sm * 1.15; fillRR(c, tx + nw + 10, nb - hh * 0.82, prw, hh, hh / 2, CO.pink); TX(c, tx + nw + 10 + prw / 2, nb - hh * 0.82 + hh / 2, 'PR', 800, sm * 0.78, '#FFFFFF', 1, 'mm'); }
  chk.push(['name:' + nm, tx + nw + (pr ? prw + 10 : 0), x + w]);
  TX(c, tx, nb + sm + 10, ellip(t, 500, sm, maxw), 500, sm, CO.slate);
}
const SQA = { FOOT0: 1000, GAP: 24, SUB_DESC: 6 };
/* 캐릭터+그림자 묶음(위 foot−h+2 ~ 아래 foot+20)의 세로 가운데 = (부제 바닥 + 1080)/2. 위 글자와 ≥24, 원래 바닥(1000)보다 아래로 안 감 */
function sqAFoot(h, subBottom, H = 1080) {
  let f = (subBottom + H) / 2 - 11 + h / 2;
  f = Math.max(f, subBottom + SQA.GAP + h - 2);
  return Math.min(f, SQA.FOOT0);
}
function buildChar(c, d, A, size) {
  let L = CHAR[size]; const { W, H } = L, sq = size === 'square', st = statsOf(d), chk = [];
  c.canvas.width = W; c.canvas.height = H; c.fillStyle = CO.tint; c.fillRect(0, 0, W, H);
  const ch = A.charHd || trimmed(A.char), sub0 = `${d.nick} · Lv.${d.lv} ${CHN(d.t)}`;
  const tb = (CH_SIZE[sq ? 'square' : 'story'][d.t] || {})[cutKey(d.lv)];
  const [cw, chh] = tb || fitBox(ch, sq ? 452 : 952, sq ? 600 : 826, true);
  c.imageSmoothingQuality = 'high';
  let info;
  if (!sq) {
    const M = L.M, [rows, more] = pickRows(d.items, L.maxrows), panelH = (rows.length + (more ? 1 : 0)) * L.row_h + 2 * L.pad, headH = 224;
    const y0 = L.top, py = L.bot - panelH, sy = py - L.gap - L.stat_h;
    const zTop = y0 + headH + L.gap, zBot = sy - 24 - L.gap;
    drawLogo(c, A.logoB, M, y0, L.logo_h);
    TX(c, W - M, y0 + L.logo_h - 6, d.date_long, 600, L.date, CO.slate, 1, 'rs');
    const hb = y0 + L.logo_h + 34 + L.head[0] * 0.95, [hs] = fitSize('오늘도 오운완!', 800, L.head, W - 2 * M);
    const x = TX(c, M, hb, '오늘도 ', 800, hs, CO.ink, 1, 'ls', -hs * 0.02); TX(c, M + x + 4, hb, '오운완!', 800, hs, CO.pink, 1, 'ls', -hs * 0.02);
    const [ss, sub] = fitSize(sub0, 500, [L.sub, L.sub - 2, L.sub - 4], W - 2 * M - 230); TX(c, M, hb + 54, sub, 500, ss, CO.slate);
    const foot = Math.min(zBot, zTop + (zBot - zTop + chh) / 2);
    floorChar(c, ch, W / 2, foot, cw, chh);
    const sp = d.streak ? [W - M - 92, hb - 8, 92] : null;   // 도장 고정 자리(v1.48 SPEC §4) — 자동 자리 찾기 없앰
    if (sp) stamp(c, sp[0], sp[1], sp[2], d.streak);
    statrow(c, M, sy, W - 2 * M, st, L);
    listpanel(c, M, py, W - 2 * M, rows, more, L, A, chk);
    chk.push(['panel_bottom', py + panelH, L.bot]);
    info = { rows: rows.map(exName), more, char: [W / 2 - cw / 2, foot - chh + 2, cw, chh].map(Math.round), foot: Math.round(foot), stamp: sp && sp.map(Math.round), zone: [zTop, zBot].map(Math.round), head_y: Math.round(hb + 54), bottom: Math.round(py + panelH) };
  } else {
    // 정사각 A안(11-12 형 확정) — 왼쪽 머리글+캐릭터 / 오른쪽 전체 높이 흰 기록 패널. 좌표 = render148.py sq_A()
    const M = 56;
    drawLogo(c, A.logoB, M, M, 34);
    const hs = 92, b1 = M + 34 + 30 + hs * 0.9, b2 = b1 + hs * 1.06;
    TX(c, M, b1, '오늘도', 800, hs, CO.ink, 1, 'ls', -hs * 0.02);
    TX(c, M, b2, '오운완!', 800, hs, CO.pink, 1, 'ls', -hs * 0.02);
    const [ss, sub] = fitSize(sub0, 500, [26, 24, 22], 452); TX(c, M, b2 + 46, sub, 500, ss, CO.slate);
    const sp = d.streak ? [446, b1 + 4, 60] : null;
    if (sp) stamp(c, sp[0], sp[1], sp[2], d.streak);
    const subBottom = b2 + 46 + SQA.SUB_DESC, foot = sqAFoot(chh, subBottom);
    floorChar(c, ch, M + 226, foot, cw, chh);
    const px = 548, py = M, pw = W - M - 548, ph = H - 2 * M, P = 30;
    fillRR(c, px, py, pw, ph, 32, '#FFFFFF');
    TX(c, px + P, py + P + 22, d.date_long, 600, 24, CO.slate);
    let y = py + P + 50;
    const avail = py + ph - P - (y + st.length * 92 + 14);
    const nfit = Math.max(1, Math.min(6, Math.floor(avail / 86))), [rows, more] = pickRows(d.items, nfit), nr = rows.length + (more ? 1 : 0);
    const rh = Math.min(132, avail / nr), f = rh / 86;
    const srh = Math.min(150, 92 + Math.max(0, avail - nr * rh) / st.length * 0.9);
    st.forEach(([lab, parts], i) => {
      if (i) hline(c, px + P, px + pw - P, y, CO.row, 2);
      TX(c, px + P, y + srh / 2 + 9, lab, 600, 24, CO.slate);
      let ns = 56; while (numunit(c, 0, 0, parts, ns, 26, '#000', { measure: true }) > pw - 2 * P - 120 && ns > 36) ns -= 2;
      numunit(c, px + pw - P, y + srh / 2 + ns * 0.36, parts, ns, 26, CO.ink, { anchor: 'r' });
      y += srh;
    });
    hline(c, px + P, px + pw - P, y, CO.tint2, 3); y += 14;
    const art = Math.min(100, 64 * f), nm = Math.min(34, 28 * Math.sqrt(f)), sm = Math.min(28, 23 * Math.sqrt(f));
    rows.forEach((it, i) => { rowA(c, px + P, y, pw - 2 * P, it, rh, art, nm, sm, i > 0, A, chk); y += rh; });
    if (more) { hline(c, px + P + art + 18, px + pw - P, y, CO.row, 2); TX(c, px + P + art + 18, y + rh / 2 + sm * 0.36, moreTxt(more), 600, sm, CO.slate); y += rh; }
    chk.push(['list_bottom', y, py + ph - P + 0.5]);
    info = { rows: rows.map(exName), more, char: [M + 226 - cw / 2, foot - chh + 2, cw, chh].map(Math.round), foot: +foot.toFixed(2), sub_bottom: +subBottom.toFixed(2), stamp: sp && sp.map(Math.round), panel_x: px, bottom: Math.round(y) };
  }
  return { style: 'char', size, ...info, stats: st.map(([l, p]) => l + ' ' + p.map(x => x.join('')).join('')), overflow: chk.filter(x => x[1] > x[2] + 0.5).map(x => x[0]) };
}

/* 셀카 얼굴 찾기 — 브라우저 FaceDetector 가 있으면 쓰고, 없으면 «얼굴 없음»(SPEC §8-1). 앱은 기기 얼굴 인식으로 대체 */
const FACE = new Map();
async function faceOf(img, src) {
  if (!img) return null; if (FACE.has(src)) return FACE.get(src);
  let f = null;
  if (window.__njFace && window.__njFace[src]) f = window.__njFace[src];   // 검증용 주입(얼굴 상자 고정)
  else if ('FaceDetector' in window) {
    try { const r = await new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 }).detect(img);
      const b = r.map(x => x.boundingBox).sort((a, b) => b.width * b.height - a.width * a.height)[0]; if (b) f = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch {}
  }
  FACE.set(src, f); return f;
}

/* ---------- 데이터(앱 기록 → 카드) ---------- */
const fmtDate = s => { const dw = DOW[new Date(s + 'T00:00:00').getDay()]; return [`${s.slice(0, 4)}.${s.slice(5, 7)}.${s.slice(8, 10)} (${dw})`, `${s.slice(5, 7)}.${s.slice(8, 10)} (${dw})`, `${+s.slice(5, 7)}월 ${+s.slice(8, 10)}일 ${dw}요일`]; };
const nickOf = () => S.nick || '나';
const shareItems = r => (r && r.items || []).filter(it => setCount(it) > 0 || it.min > 0).map(it => ({ ...it, sets: it.sets ? doneSets(it) : undefined }));
function cardData(st) {
  const r = S.records.find(x => x.id === st.recId), date = r ? r.date : TODAY, [dl, ds, dlong] = fmtDate(date), items = shareItems(r);
  const base = { size: st.size, t: S.type, nick: nickOf(), date: dl, date_s: ds, date_long: dlong, streak: S.streakWeeks, items };
  if (st.kind === 'workout') return { ...base, kind: 'workout', lv: S.level, dur_min: r && r.dur || 0, shift: st.shift || 0 };
  if (st.kind === 'levelup') return { ...base, kind: 'levelup', lv: r.lvUp.to, lv_from: r.lvUp.from };
  const L = achieveList(), a = L[st.ach];
  return { ...base, kind: 'badge', lv: S.level, ach_n: L.filter(x => x.done).length, ach_total: L.length, badge: { name: a.name, cond: a.cond, reward: a.item, icon: a.icon } };
}
const todayPhoto = r => (r && r.photo) || (r && r.date === TODAY && (S.records.filter(x => x.date === TODAY && x.photo).pop() || {}).photo) || null;
let FONTS_OK = null;
const fontsReady = () => FONTS_OK || (FONTS_OK = document.fonts ? Promise.all([500, 600, 700, 800].map(w => document.fonts.load(FONT(w, 40), '오운완가Lv1'))).catch(() => {}) : Promise.resolve());
async function assets(d, photo) {
  await fontsReady();
  const icons = d.kind === 'badge' ? { [d.badge.icon]: AI[d.badge.icon] } : d.kind === 'levelup' ? { up: ICO.up } : {};
  const [logo, logoB, ch, dumbbell, ph] = await Promise.all([loadImg(`assets/share/logo_white.svg?v=${VER}`), loadImg(`assets/share/logo_black.svg?v=${VER}`), loadImg(charSrc(d.t, d.lv)), loadImg(svgIcon(ICO.dumbbell, '#B9B9C2', 2.0)), photo ? loadImg(photo) : null]);
  const charHd = d.kind === 'workout' ? await loadImg(charHdSrc(d.t, d.lv)).catch(() => null) : null;
  const ids = [...new Set(d.items.map(i => i.ex))], exImgs = await Promise.all(ids.map(id => EX[id] && !EX[id].custom ? loadImg(exSrc(id)) : null));
  const icon = {}; for (const [k, v] of Object.entries(icons)) if (v) icon[k] = await loadImg(svgIcon(v, '#FFFFFF', 2.4));
  const ex = {}; ids.forEach((id, i) => { ex[id] = trimmed(exImgs[i]); });
  return { logo, logoW: logo, logoB, char: ch, charHd, dumbbell, ex, icon, photo: ph, face: ph ? await faceOf(ph, photo) : null };
}
async function renderCard(st) {
  const d = cardData(st), sf = st.kind === 'workout' && st.style === 'selfie' && st.photo;
  const A = await assets(d, sf ? st.photo : null), cv = document.createElement('canvas'), c = cv.getContext('2d');
  const info = d.kind !== 'workout' ? build(c, d, A) : sf && A.photo ? buildSelfie(c, d, A, d.size) : buildChar(c, d, A, d.size);
  return { cv, info, d };
}
window.NJShare = { renderCard, cardData, summary, pickRows, statsOf, SELFIE, CHAR, APP_LINK };

/* ---------- 자랑하기 시트 — 종류 2개(캐릭터 오운완·셀카 오운완) 고르기 (SPEC §9) ---------- */
const SVGI = (inner, sw = 2, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const I_SHARE = '<path d="M12 15V3.5"/><path d="m7.5 8 4.5-4.5L16.5 8"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/>';
const I_LINK = '<rect x="0" y="7" width="14" height="10" rx="5"/><rect x="10" y="7" width="14" height="10" rx="5"/>';
const I_SAVE = '<path d="M12 1v15"/><path d="m6 10 6 6 6-6"/><path d="M1 22h22"/>';
const I_INSTA = '<rect x="1" y="1" width="22" height="22" rx="7"/><circle cx="12" cy="12" r="5"/><circle cx="18.3" cy="4.8" r="1.3" fill="currentColor" stroke="none"/>';
const I_COPY = '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>';
const I_KAKAO = '<svg viewBox="-1 -1 26 26"><ellipse cx="12" cy="11.5" rx="12" ry="9.5" fill="currentColor"/><path d="M6 17 4 24l8-5z" fill="currentColor"/><text x="12" y="15.1" text-anchor="middle" font-family="Pretendard,sans-serif" font-size="6.4" font-weight="800" fill="#FFFFFF">TALK</text></svg>';
const I_CHECK = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';
const I_CAM = '<rect x="3" y="5.5" width="18" height="14" rx="3"/><circle cx="12" cy="12.5" r="3.6"/>';
window.NJ_SHARE_ICON = I_SHARE;
const STYLE_KEY = 'nijim_share_style';
const STYLES = [['char', '캐릭터 오운완', '내 캐릭터랑 귀엽게'], ['selfie', '셀카 오운완', '내 사진 위에 기록']];
const PICKED = new Map();   // 시트에서 고른·찍은 사진(기록별, 이 화면을 연 동안만 — 저장하지 않음)
let ST = null, SEQ = 0, TSEQ = 0;
const kindsFor = r => r ? ['workout', ...(r.lvUp ? ['levelup'] : [])] : [];
const photoFor = recId => PICKED.get(recId) || todayPhoto(S.records.find(x => x.id === recId));
const needPhoto = () => ST.kind === 'workout' && ST.style === 'selfie' && !ST.photo;
function openShare(opt) {
  const photo = opt.recId != null ? photoFor(opt.recId) : null;
  let style = null; try { style = localStorage.getItem(STYLE_KEY); } catch {}
  if (style !== 'char' && style !== 'selfie') style = photo ? 'selfie' : 'char';
  ST = { kind: 'workout', size: 'story', style, photo, shift: 0, ...opt, blob: null, url: null, thumbs: {} };
  const el = document.getElementById('shareSheet') || Object.assign(document.createElement('div'), { id: 'shareSheet', className: 'shr' });
  document.getElementById('app').appendChild(el); paintSheet(); refreshCard(); refreshThumbs();
}
function paintSheet() {
  const el = $('shareSheet'), r = S.records.find(x => x.id === ST.recId), kinds = ST.kind === 'badge' ? [] : kindsFor(r), wk = ST.kind === 'workout', np = needPhoto();
  el.className = 'shr on';
  const tile = ([k, t, s]) => `<button class="shr-style ${ST.style === k ? 'on' : ''}" data-act="shrStyle" data-v="${k}" id="shrStyle_${k}" aria-pressed="${ST.style === k}">
    <span class="shr-th ${k}">${ST.thumbs[k] ? `<img src="${ST.thumbs[k]}" alt="">` : k === 'selfie' && !ST.photo ? SVGI(I_CAM, 1.8) : ''}</span><span class="shr-stt"><b>${t}</b><small>${s}</small></span>${ST.style === k ? `<i class="shr-ck">${SVGI(I_CHECK, 3.2)}</i>` : ''}</button>`;
  const prev = np
    ? `<div class="shr-prev ${ST.size}"><div class="shr-pick" id="shrPick"><i>${SVGI(I_CAM, 1.6)}</i><b>오늘 운동 사진을 골라 주세요</b><small>사진 위에 오늘 기록이 올라가요</small>
        <div class="shr-pkb"><button class="dark" data-act="shrAlbum" id="shrAlbum">앨범에서 고르기</button><button data-act="shrCam" id="shrCam">바로 찍기</button></div></div></div>`
    : `<div class="shr-prev ${ST.size}${wk && ST.style === 'selfie' ? ' drag' : ''}"><img id="shrImg" draggable="false" alt="자랑 카드 미리보기" ${ST.url ? `src="${ST.url}"` : ''}><span class="shr-load" id="shrLoad">${ST.url ? '' : '카드 만드는 중…'}</span></div>`;
  const off = np ? 'disabled' : '';
  el.innerHTML = `<div class="shr-bg" data-act="shrClose"></div><div class="shr-sh" role="dialog" aria-label="자랑하기"><div class="shr-grab"></div>
  <div class="shr-hd"><b>자랑하기</b><button class="shr-x" data-act="shrClose" aria-label="닫기">${SVGI('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
  ${kinds.length > 1 ? `<div class="shr-kinds">${kinds.map(k => `<button class="chip ${ST.kind === k ? 'on' : ''}" data-act="shrKind" data-v="${k}">${k === 'workout' ? '오운완 카드' : '레벨업 카드'}</button>`).join('')}</div>` : ''}
  ${wk ? `<div class="shr-styles">${STYLES.map(tile).join('')}</div>` : ''}
  ${prev}
  <div class="shr-row ${wk && ST.style === 'selfie' && ST.photo ? 'two' : ''}"><div class="shr-size"><button class="${ST.size === 'story' ? 'on' : ''}" data-act="shrSize" data-v="story" id="shrStory">스토리</button><button class="${ST.size === 'square' ? 'on' : ''}" data-act="shrSize" data-v="square" id="shrSquare">정사각</button></div>
    ${wk && ST.style === 'selfie' && ST.photo ? '<button class="shr-chg" data-act="shrAlbum" id="shrChange">사진 바꾸기</button>' : ''}</div>
  <div class="shr-to">
    <button data-act="shrInsta" id="shrInsta" ${off}><i>${SVGI(I_INSTA, 2.2, '-1 -1 26 26')}</i><span>인스타 스토리</span></button>
    <button data-act="shrKakao" id="shrKakao" ${off}><i class="kk">${I_KAKAO}</i><span>카카오톡</span></button>
    <button data-act="shrSave" id="shrSave" ${off}><i>${SVGI(I_SAVE, 2.2, '-1 -1 26 26')}</i><span>이미지 저장</span></button>
    <button data-act="shrLink" id="shrLink"><i>${SVGI(I_LINK, 2.2, '-1 -1 26 26')}</i><span>링크 복사</span></button>
  </div><div class="shr-toast" id="shrToast"></div>
  <input type="file" accept="image/*" id="shrFileAlbum" hidden><input type="file" accept="image/*" capture="user" id="shrFileCam" hidden></div>`;
}
async function refreshCard() {
  const my = ++SEQ, st = { ...ST };
  if (needPhoto()) { if (ST.url) URL.revokeObjectURL(ST.url); ST.url = null; ST.blob = null; return; }
  try {
    const { cv, info } = await renderCard(st); if (my !== SEQ || !ST) return;
    const blob = await new Promise(res => cv.toBlob(res, 'image/png')); if (my !== SEQ || !ST) return;
    if (ST.url) URL.revokeObjectURL(ST.url);
    ST.blob = blob; ST.url = URL.createObjectURL(blob); window.__shareInfo = info;
    const img = $('shrImg'); if (img) img.src = ST.url; const ld = $('shrLoad'); if (ld) ld.textContent = '';
  } catch (e) { console.error(e); const ld = $('shrLoad'); if (ld) ld.textContent = '카드를 만들지 못했어요'; }
}
/* 종류 타일 썸네일 = 실제 스토리 카드 축소본 */
async function refreshThumbs() {
  if (!ST || ST.kind !== 'workout') return; const my = ++TSEQ;
  for (const [k] of STYLES) {
    if (ST.thumbs[k] || (k === 'selfie' && !ST.photo)) continue;
    try {
      const { cv } = await renderCard({ ...ST, size: 'story', style: k }); if (my !== TSEQ || !ST) return;
      const t = document.createElement('canvas'); t.width = 102; t.height = 180; const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cv, 0, 0, 102, 180);
      ST.thumbs[k] = t.toDataURL('image/jpeg', 0.85);
      const th = document.querySelector(`#shrStyle_${k} .shr-th`); if (th) th.innerHTML = `<img src="${ST.thumbs[k]}" alt="">`;
    } catch (e) { console.error(e); }
  }
}
/* 셀카 미리보기를 위아래로 끌어 사진 위치 옮기기(SPEC §8-4) — 얼굴 인식이 없는 폰 브라우저에서 얼굴·글자 겹침을 사용자가 피할 수 있게 */
let DRAG = null;
document.addEventListener('pointerdown', e => {
  const img = e.target && e.target.id === 'shrImg' ? e.target : null; if (!img || !ST || ST.kind !== 'workout' || ST.style !== 'selfie' || !ST.photo) return;
  DRAG = { y: e.clientY, base: ST.shift || 0, k: (ST.size === 'story' ? 1920 : 1080) / img.clientHeight, busy: false, next: null }; img.setPointerCapture && img.setPointerCapture(e.pointerId); e.preventDefault();
});
async function dragPaint(shift) {
  if (!DRAG) return; if (DRAG.busy) { DRAG.next = shift; return; } DRAG.busy = true;
  try { const { cv } = await renderCard({ ...ST, shift }); const img = $('shrImg'); if (img && DRAG) img.src = cv.toDataURL('image/jpeg', 0.7); } catch {}
  if (!DRAG) return; DRAG.busy = false; if (DRAG.next != null) { const n = DRAG.next; DRAG.next = null; dragPaint(n); }
}
document.addEventListener('pointermove', e => { if (!DRAG) return; dragPaint(Math.round(DRAG.base + (e.clientY - DRAG.y) * DRAG.k)); });
const dragEnd = e => { if (!DRAG) return; const sh = Math.max(-1200, Math.min(1200, Math.round(DRAG.base + (e.clientY - DRAG.y) * DRAG.k))), moved = Math.abs(e.clientY - DRAG.y) > 2; DRAG = null; if (moved && ST) { ST.shift = sh; refreshCard(); } };
document.addEventListener('pointerup', dragEnd); document.addEventListener('pointercancel', dragEnd);
function setPhoto(file) {
  if (!ST || !file || !/^image\//.test(file.type || 'image/')) return;
  const url = URL.createObjectURL(file); PICKED.set(ST.recId, url);
  ST.photo = url; ST.style = 'selfie'; ST.url = null; ST.thumbs.selfie = null; ST.shift = 0;
  try { localStorage.setItem(STYLE_KEY, 'selfie'); } catch {}
  paintSheet(); refreshCard(); refreshThumbs();
}
document.addEventListener('change', e => { if (e.target && (e.target.id === 'shrFileAlbum' || e.target.id === 'shrFileCam')) { setPhoto(e.target.files && e.target.files[0]); e.target.value = ''; } });
function shrToast(msg) { const t = $('shrToast'); if (!t) return toast(msg); t.innerHTML = `<i>${SVGI(I_CHECK, 3)}</i>${msg}`; t.classList.add('show'); clearTimeout(shrToast.h); shrToast.h = setTimeout(() => t.classList.remove('show'), 2000); }
const fileName = () => `nijim_${ST.kind === 'workout' ? ST.style : ST.kind}_${ST.size}_${(cardData(ST).date_s || '').replace(/[^\d]/g, '')}.png`;
function download() { const a = document.createElement('a'); a.href = ST.url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove(); }
async function blobFor(size) {
  if (ST.size === size && ST.blob) return ST.blob;
  const { cv } = await renderCard({ ...ST, size }); return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function shareFile(size, fallbackMsg) {
  const blob = await blobFor(size), file = new File([blob], fileName().replace(ST.size, size), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch {} return; }
  const a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
  shrToast(fallbackMsg);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); return ok; }
}
window.NJ_copyText = copyText; window.NJ_inviteLink = () => inviteLink();   // 랭킹 › 친구 추가(screens2.js)에서도 같은 복사·초대 링크를 쓴다
function closeShare() { SEQ++; TSEQ++; if (ST && ST.url) URL.revokeObjectURL(ST.url); ST = null; const el = $('shareSheet'); if (el) { el.className = 'shr'; el.innerHTML = ''; } }

/* ---------- 친구 초대(S3) ---------- */
const inviteLink = () => `${APP_LINK}?ref=${encodeURIComponent(myCode())}`;   // 초대 링크 형식 = 개발 결정(공식 링크 + 코드)
function vInvite() {
  return `<div class="subhead"><button data-act="invBack" id="backBtn"><i>‹</i>전체</button><div class="h2">친구 초대</div></div><div class="sec" id="inviteScreen">
  <div class="card inv-hero"><div class="inv-char">${charFit(S.type, S.level, 150)}</div><div class="inv-t">같이 운동할 친구를 초대해요</div>
    <div class="muted inv-d">친구가 내 코드를 넣으면 바로 친구가 돼요<br>친구 리그에서 이번 주 운동을 같이 겨뤄요</div></div>
  <div class="card inv-code"><div><small>내 코드</small><b id="invCode">${myCode()}</b></div><button data-act="invCopyCode" id="invCopyCode">${SVGI(I_COPY)}복사</button></div>
  <div class="card inv-reward" id="invReward"><div class="inv-rw-hd"><b>초대 보상</b></div>
    <div class="muted">초대 보상은 준비 중이에요 · 정해지면 여기에서 알려 드릴게요</div></div>
  <button class="btn inv-send" data-act="invSend" id="invSend">${SVGI(I_SHARE)}초대 링크 보내기</button>
  <button class="btn ghost inv-link" data-act="invLink" id="invLink">${SVGI(I_LINK)}링크 복사</button>
  <div class="muted inv-foot">연락처는 보지 않아요 · 링크와 코드로만 초대해요</div></div>`;
}
const vAll0 = MAIN.all;
MAIN.all = () => S.allSub === 'invite' ? vInvite() : vAll0().replace('<div class="h2">전체</div>', `<div class="h2">전체</div><button class="card allrow tap" data-act="invOpen" id="allInvite"><span class="allico">${SVGI('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M17.5 14.6c2.3.3 3.7 2 4 4.9"/>')}</span><div><b>친구 초대</b><small>같이 운동할 친구를 불러요</small></div><span class="muted">›</span></button>`);

/* ---------- 동작 ---------- */
window.addEventListener('click', e => {
  const tb = e.target.closest('[data-tab]'); if (tb && tb.dataset.tab === 'all') S.allSub = null;
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v;
  const H = {
    share: () => openShare({ recId: +b.dataset.id || S.lastResult, kind: v || 'workout' }),
    shareAch: () => { shClose(); openShare({ recId: null, kind: 'badge', ach: +v }); },
    shrClose: () => closeShare(),
    shrSize: () => { if (ST.size === v) return; ST.size = v; ST.url = null; paintSheet(); refreshCard(); },
    shrKind: () => { if (ST.kind === v) return; ST.kind = v; ST.url = null; paintSheet(); refreshCard(); refreshThumbs(); },
    shrStyle: () => { if (ST.style === v) return; ST.style = v; ST.url = null; try { localStorage.setItem(STYLE_KEY, v); } catch {} paintSheet(); refreshCard(); refreshThumbs(); },
    shrAlbum: () => { const f = $('shrFileAlbum'); if (f) f.click(); },
    shrCam: () => { const f = $('shrFileCam'); if (f) f.click(); },
    shrSave: () => { if (!ST.url) return shrToast('카드를 만드는 중이에요'); download(); shrToast('이미지를 저장했어요'); },
    shrInsta: () => shareFile('story', '이미지를 저장했어요 · 인스타 스토리에 올려 주세요'),
    shrKakao: () => shareFile('square', '이미지를 저장했어요 · 카카오톡에서 보내 주세요'),
    shrLink: async () => { await copyText(APP_LINK); shrToast('링크를 복사했어요'); },
    invOpen: () => { S.allSub = 'invite'; save(); render(); window.scrollTo(0, 0); },
    invBack: () => { S.allSub = null; save(); render(); window.scrollTo(0, 0); },
    invCopyCode: async () => { await copyText(myCode()); toast(`내 코드 ${myCode()} 복사했어요`); },
    invLink: async () => { await copyText(inviteLink()); toast('링크를 복사했어요'); },
    invSend: async () => { const data = { title: '니짐내짐', text: `니짐내짐에서 같이 운동해요! 내 코드 ${myCode()}`, url: inviteLink() };
      if (navigator.share) { try { await navigator.share(data); } catch {} } else { await copyText(inviteLink()); toast('공유 창이 안 열려서 링크를 복사했어요'); } },
    invite: () => { S.tab = 'all'; S.sub = null; S.allSub = 'invite'; save(); render(); window.scrollTo(0, 0); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); e.preventDefault(); H[a]();
}, true);
})();
