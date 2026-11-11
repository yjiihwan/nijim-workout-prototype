/* 자랑하기(공유 카드 v2) — 정본 shared_inbox/results/nijim_share_card_v2 (SPEC.md · _src/cards.py LAYOUT/MODES).
   좌표·크기는 cards.py 를 그대로 옮겼다(숫자가 다르면 cards.py 가 맞다). 카드에 초대코드·주소·URL·볼륨 글자를 넣지 않는다. */
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
const MODES = {
  story: [{ tile:136, name:40, chip:30, ch:54, lines:3, gap:26 }, { tile:116, name:36, chip:28, ch:50, lines:2, gap:22 }],
  square: [{ tile:112, name:34, chip:26, ch:46, lines:2, gap:22 }, { tile:96, name:30, chip:24, ch:42, lines:1, gap:16 }],
};
const MORE_H = 60;
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
const exSrc = id => `assets/ex/z/${id}_a.png?v=${VER}`;

/* ---------- 운동 표기(lib.py chips_of) ---------- */
const exOf = it => EX[it.ex] || { name: it.name || '?', mode: it.mode || 'wr' };
const exName = it => it.name || exOf(it).name;
const gnum = n => String(+(+n).toFixed(2));
const secTxt = s => s < 60 ? `${s}초` : `${Math.floor(s / 60)}분${s % 60 ? ` ${s % 60}초` : ''}`;
const doneSets = it => (it.sets || []).filter(s => s.done !== false);
function chipsOf(it) {
  const mode = it.mode || exOf(it).mode;
  if (mode === 'cardio' || mode === 'lesson') {
    const t = `${it.min || 0}분` + (it.km ? ` · ${gnum(it.km)}km` : '');
    return [[mode === 'cardio' ? t : `${it.min || 0}분 수업`, false]];
  }
  const one = s => mode === 'wr' ? `${gnum(s.w)}kg × ${s.r}회` : mode === 't' ? secTxt(s.s) : `${s.r}회`;
  const out = [], sets = doneSets(it); let i = 0;
  while (i < sets.length) {
    let j = i;
    while (j + 1 < sets.length && one(sets[j + 1]) === one(sets[i]) && !sets[j + 1].pr && !sets[i].pr) j++;
    const n = j - i + 1; out.push([one(sets[i]) + (n > 1 ? ` × ${n}세트` : ''), !!sets[i].pr]); i = j + 1;
  }
  return out;
}
const setCount = it => doneSets(it).length;
function chipSets(it) {
  const mode = it.mode || exOf(it).mode; if (mode === 'cardio' || mode === 'lesson') return [0];
  return chipsOf(it).map(([t]) => { const m = t.match(/× (\d+)세트$/); return m ? +m[1] : 1; });
}
const durTxt = m => m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간` + (m % 60 ? ` ${m % 60}분` : '');

/* ---------- 목록(cards.py draw_list) ---------- */
const chipW = (t, pr, m) => tw(t, 600, m.chip) + 2 * Math.round(m.ch * 0.36) + (pr ? tw('PR', 800, m.chip) + 10 : 0);
function layoutChips(chips, spc, maxw, m) {
  const place = lst => { const out = []; let x = 0, ln = 0;
    for (const [t, pr] of lst) { const w = chipW(t, pr, m); if (x > 0 && x + w > maxw) { ln++; x = 0; } out.push([ln, x, w, t, pr]); x += w + 10; }
    return [out, ln + 1]; };
  const ok = ([pl, n]) => n <= m.lines && pl.every(p => p[1] + p[2] <= maxw);
  let r = place(chips); if (ok(r)) return r;
  /* 뒤에서부터 빼되 PR 칩은 남긴다(자랑거리라서 — SPEC §5-3 보완, REPORT 명시) */
  const drop = new Set(), cand = chips.map((x, i) => i).filter(i => !chips[i][1]).reverse();
  for (const i of cand) { drop.add(i); const rest = [...drop].reduce((a, j) => a + spc[j], 0);
    r = place([...chips.filter((_, j) => !drop.has(j)), [`+${rest}세트`, null]]); if (ok(r)) return r; }
  return place([[`+${spc.reduce((a, b) => a + b, 0)}세트`, null]]);
}
function rowH(it, m, w) {
  const [pl, n] = layoutChips(chipsOf(it), chipSets(it), w, m);
  return [Math.max(m.tile, Math.round(m.name * 1.3) + 10 + n * m.ch + (n - 1) * 8), pl, n];
}
function planList(items, size, H, W_) {
  let m, rows;
  for (let mi = 0; mi < MODES[size].length; mi++) {
    m = MODES[size][mi]; const w = W_ - m.tile - 28; rows = items.map(it => rowH(it, m, w));
    const tot = rows.reduce((a, r) => a + r[0], 0) + m.gap * (rows.length - 1);
    if (tot <= H) return { m, rows: items.map((it, i) => [it, rows[i]]), more: 0, mi };
  }
  const hasPr = it => doneSets(it).some(s => s.pr) ? 1 : 0;
  const order = items.map((_, i) => i).sort((a, b) => (hasPr(items[b]) - hasPr(items[a])) || (Math.max(1, setCount(items[b])) - Math.max(1, setCount(items[a]))) || a - b);
  let k = items.length, pick = [0];
  while (k > 1) { k--; pick = order.slice(0, k).sort((a, b) => a - b);
    const tot = pick.reduce((a, i) => a + rows[i][0], 0) + m.gap * k + MORE_H; if (tot <= H) break; }
  return { m, rows: pick.map(i => [items[i], rows[i]]), more: items.length - pick.length, mi: MODES[size].length - 1, pick };
}
function drawList(o, items, x0, y0, W_, H, size, chk, A) {
  const P = planList(items, size, H, W_), { m, rows, more } = P, tile = m.tile, tx = x0 + tile + 28;
  let y = y0;
  rows.forEach(([it, [h, pl, n]], idx) => {
    const name = exName(it), textH = Math.round(m.name * 1.3) + 10 + n * m.ch + (n - 1) * 8, ty = textH < tile ? y + (h - textH) / 2 : y;
    RECT(o, x0, y, tile, tile, tile * 0.18, C2.tile);
    const art = A.ex[it.ex];
    if (art) DRAW(o, art, contain(art, x0 + 6, y + 6, tile - 12, tile - 12, 'center', true));
    else { const s = tile * 0.46; DRAW(o, A.dumbbell, [x0 + (tile - s) / 2, y + (tile - s) / 2, s, s]); }
    const [nt, ns] = fit(name, 700, [m.name, m.name - 2, m.name - 4], W_ - tile - 28);
    T(o, tx, ty + m.name * 0.98, nt, 700, ns, C2.ink);
    chk.push(['name:' + name, tx + tw(nt, 700, ns), x0 + W_]);
    const cy0 = ty + Math.round(m.name * 1.3) + 10;
    for (const [ln, cx, cw, t, pr] of pl) {
      const X = tx + cx, Y = cy0 + ln * (m.ch + 8), padx = Math.round(m.ch * 0.36), bl = Y + m.ch / 2 + m.chip * 0.36;
      RECT(o, X, Y, cw, m.ch, m.ch / 2, pr ? C2.rose : pr === null ? '#FFFFFF' : C2.tile, pr === null ? C2.line : null, 2);
      if (pr) { T(o, X + padx, bl, 'PR', 800, m.chip, C2.white); T(o, X + padx + tw('PR', 800, m.chip) + 10, bl, t, 600, m.chip, C2.white); }
      else T(o, X + padx, bl, t, 600, m.chip, pr === null ? C2.slate : C2.ink90);
      chk.push(['chip:' + t, X + cw, x0 + W_]);
    }
    y += h;
    if (idx < rows.length - 1 || more) { RECT(o, x0, y + m.gap / 2 - 1, W_, 2, 0, C2.line); y += m.gap; }
  });
  let moreTxt = '';
  if (more) {
    const shown = new Set(rows.map(r => r[0])), ns = items.filter(i => !shown.has(i)).reduce((a, i) => a + setCount(i), 0);
    moreTxt = `외 ${more}종목` + (ns ? ` · ${ns}세트` : '');
    T(o, x0 + W_ / 2, y + MORE_H / 2 + 10, moreTxt, 700, size === 'story' ? 28 : 24, C2.slate, 'middle'); y += MORE_H;
  }
  return { bottom: y, mode: P.mi, shown: rows.map(r => exName(r[0])), more, moreTxt };
}

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
  const L = LAYOUT[d.size], { W, H, M } = L, sq = d.size === 'square', sf = !!A.selfie && d.kind === 'workout';
  c.canvas.width = W; c.canvas.height = H;
  c.fillStyle = C2.rose; c.fillRect(0, 0, W, H);
  const chk = [], info = {}, hdr = [], body = [];
  const [lx, ly, lh] = L.logo, lw = lh * LOGO_R;
  hdr.push(cc => cc.drawImage(A.logo, lx, ly, lw, lh));
  info.logo = { x: lx, y: ly, w: +lw.toFixed(1), h: lh };
  const topDate = !sq && !sf;
  if (topDate) T(hdr, W - M, L.date_base, d.date, 600, L.date_s, C2.white, 'end', 0.85);
  const cname = CH[d.t].name; let who = `${d.nick} · Lv.${d.lv} ${cname}`; if (!topDate) who += ` · ${d.date_s}`;
  if (d.kind === 'workout') {
    const segs = [['오늘도 ', C2.white], ['오운완!', C2.ink]], stats = statsWorkout(d);
    let cx, hb;
    if (sf) {
      const [px, py, pw, ph] = L.sf_photo, r_ = sq ? 24 : 28, im = A.selfie;
      body.push(cc => { cc.save(); rr(cc, px, py, pw, ph, r_); cc.clip();
        const k = Math.max(pw / iw(im), ph / ih(im)), sw = pw / k, sh = ph / k, sx = (iw(im) - sw) / 2, sy = Math.max(0, Math.min(ih(im) - sh, (ih(im) - sh) * 0.15));
        cc.drawImage(im, sx, sy, sw, sh, px, py, pw, ph); cc.restore(); });
      RECT(body, px, py, pw, ph, r_, null, '#FFFFFF', 6);
      charAt(body, A, L.sf_char); cx = px; hb = L.sf_hdr_bottom;
    } else { cx = L.char[0]; hb = L.hdr_bottom; }
    let hero = false;
    if (!sf && !sq) {
      const P = planList(d.items, 'story', L.panel_bottom - (hb + 2 * L.gap + L.strip[3]) - 2 * L.pad, L.panel[2] - 2 * L.pad);
      const used = P.rows.reduce((a, r) => a + r[1][0], 0) + P.m.gap * (P.rows.length - 1) + (P.more ? MORE_H + P.m.gap : 0);
      const free = L.panel_bottom - (hb + 2 * L.gap + L.strip[3] + 2 * L.pad + used);
      hero = free >= 400 && !P.more;
      if (hero) {
        cx = W - M + 24; const hh = Math.min(420, free - 40), hb2 = hb + hh;
        body.push(cc => { cc.save(); cc.globalAlpha = 0.12; cc.fillStyle = '#16161C'; cc.beginPath(); cc.ellipse(W / 2, hb2 - 6, hh * 0.36, 14, 0, 0, Math.PI * 2); cc.fill(); cc.restore(); });
        charAt(body, A, [W / 2 - hh * 0.6, hb + 12, hh * 1.2, hh - 18]); hb = hb2; info.hero = true;
      }
    }
    if (!hero && !sf) charAt(body, A, L.char);
    head(body, L, cx - M - 24, segs, who);
    const sx = L.strip[0], sw = L.strip[2], sh = L.strip[3], sy = hb + L.gap;
    strip(body, L, sx, sy, sw, sh, stats);
    const px_ = L.panel[0], pw_ = L.panel[2], py_ = sy + sh + L.gap, p = L.pad, avail = L.panel_bottom - py_ - 2 * p;
    const lst = []; info.list = drawList(lst, d.items, px_ + p, py_ + p, pw_ - 2 * p, avail, d.size, chk, A);
    const ph_ = info.list.bottom - py_ + p;
    RECT(body, px_, py_, pw_, ph_, 36, C2.white); body.push(...lst);
    const bottom = py_ + ph_, dy = Math.max(0, (L.panel_bottom - bottom) / 2);
    c.save(); c.translate(0, dy); [...hdr, ...body].forEach(f => f(c)); c.restore();
    info.logo.y = +(ly + dy).toFixed(1); info.block = { top: +(ly + dy).toFixed(1), bottom: +(bottom + dy).toFixed(1), dy: +dy.toFixed(1) };
    chk.push(['block_bottom', bottom + dy, L.safe_bot - 16]);
    info.stats = stats.map(s => `${s[0]} ${s[1]}`);
  } else {
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
function statsWorkout(d) {
  const nSet = d.items.reduce((a, i) => a + setCount(i), 0), st = [];
  if (d.dur_min) st.push(['운동 시간', durTxt(d.dur_min), C2.sky]);
  st.push(['종목', `${d.items.length}개`, C2.rose2]);
  if (nSet) st.push(['총 세트', `${nSet}세트`, C2.mint]);
  return st;
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

/* ---------- 데이터(앱 기록 → 카드) ---------- */
const fmtDate = s => { const dw = DOW[new Date(s + 'T00:00:00').getDay()]; return [`${s.slice(0, 4)}.${s.slice(5, 7)}.${s.slice(8, 10)} (${dw})`, `${s.slice(5, 7)}.${s.slice(8, 10)} (${dw})`]; };
const nickOf = () => S.nick || '나';
const shareItems = r => (r && r.items || []).filter(it => setCount(it) > 0 || it.min > 0).map(it => ({ ...it, sets: it.sets ? doneSets(it) : undefined }));
function cardData(st) {
  const r = S.records.find(x => x.id === st.recId), date = r ? r.date : TODAY, [dl, ds] = fmtDate(date), items = shareItems(r);
  const base = { size: st.size, t: S.type, nick: nickOf(), date: dl, date_s: ds, streak: S.streakWeeks, items };
  if (st.kind === 'workout') return { ...base, kind: 'workout', lv: S.level, dur_min: r && r.dur || 0 };
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
  const [logo, ch, dumbbell, selfie] = await Promise.all([loadImg(`assets/share/logo_white.svg?v=${VER}`), loadImg(charSrc(d.t, d.lv)), loadImg(svgIcon(ICO.dumbbell, '#B9B9C2', 2.0)), photo ? loadImg(photo) : null]);
  const ids = [...new Set(d.items.map(i => i.ex))], exImgs = await Promise.all(ids.map(id => EX[id] && !EX[id].custom ? loadImg(exSrc(id)) : null));
  const icon = {}; for (const [k, v] of Object.entries(icons)) if (v) icon[k] = await loadImg(svgIcon(v, '#FFFFFF', 2.4));
  const ex = {}; ids.forEach((id, i) => { ex[id] = trimmed(exImgs[i]); });
  return { logo, char: ch, dumbbell, selfie, ex, icon };
}
async function renderCard(st) {
  const d = cardData(st), photo = st.kind === 'workout' && st.selfie ? todayPhoto(S.records.find(x => x.id === st.recId)) : null;
  const A = await assets(d, photo), cv = document.createElement('canvas'), info = build(cv.getContext('2d'), d, A);
  return { cv, info, d };
}
window.NJShare = { renderCard, cardData, chipsOf, planList, LAYOUT, MODES, APP_LINK };

/* ---------- 자랑하기 시트(S1·S2) ---------- */
const SVGI = (inner, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const I_SHARE = '<path d="M12 15V3.5"/><path d="m7.5 8 4.5-4.5L16.5 8"/><path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16"/>';
const I_LINK = '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/>';
const I_SAVE = '<path d="M12 4v11"/><path d="m7 10.5 5 5 5-5"/><path d="M5 19.5h14"/>';
const I_INSTA = '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/>';
const I_COPY = '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>';
const I_KAKAO = '<svg viewBox="0 0 24 24"><path d="M12 4C6.8 4 3 7.1 3 11c0 2.5 1.6 4.6 4.1 5.8l-.9 3.4c-.1.3.3.6.6.4l4-2.7c.4 0 .8.1 1.2.1 5.2 0 9-3.1 9-7S17.2 4 12 4z" fill="#191600"/></svg>';
const I_CHECK = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';
window.NJ_SHARE_ICON = I_SHARE;
let ST = null, SEQ = 0;
const kindsFor = r => r ? ['workout', ...(r.lvUp ? ['levelup'] : [])] : [];
function openShare(opt) {
  ST = { kind: 'workout', size: 'story', selfie: false, ...opt, blob: null, url: null };
  const el = document.getElementById('shareSheet') || Object.assign(document.createElement('div'), { id: 'shareSheet', className: 'shr' });
  document.getElementById('app').appendChild(el); paintSheet(); refreshCard();
}
function paintSheet() {
  const el = $('shareSheet'), r = S.records.find(x => x.id === ST.recId), kinds = ST.kind === 'badge' ? [] : kindsFor(r), photo = todayPhoto(r);
  el.className = 'shr on';
  el.innerHTML = `<div class="shr-bg" data-act="shrClose"></div><div class="shr-sh" role="dialog" aria-label="자랑하기"><div class="shr-grab"></div>
  <div class="shr-hd"><b>자랑하기</b><button class="shr-x" data-act="shrClose" aria-label="닫기">${SVGI('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
  ${kinds.length > 1 ? `<div class="shr-kinds">${kinds.map(k => `<button class="chip ${ST.kind === k ? 'on' : ''}" data-act="shrKind" data-v="${k}">${k === 'workout' ? '오운완 카드' : '레벨업 카드'}</button>`).join('')}</div>` : ''}
  <div class="seg shr-seg"><button class="${ST.size === 'story' ? 'on' : ''}" data-act="shrSize" data-v="story" id="shrStory">인스타 스토리</button><button class="${ST.size === 'square' ? 'on' : ''}" data-act="shrSize" data-v="square" id="shrSquare">정사각</button></div>
  <div class="shr-prev ${ST.size}"><img id="shrImg" alt="자랑 카드 미리보기" ${ST.url ? `src="${ST.url}"` : ''}><span class="shr-load" id="shrLoad">${ST.url ? '' : '카드 만드는 중…'}</span></div>
  ${ST.kind === 'workout' ? `<div class="shr-sf"><div><b>오운완 셀카 넣기</b><small>${photo ? '켜면 오늘 찍은 셀카가 캐릭터 자리에 들어가요' : '오늘 찍은 셀카가 있을 때만 켤 수 있어요'}</small></div><button class="sw ${ST.selfie ? 'on' : ''}" data-act="shrSelfie" id="shrSelfie" aria-label="오운완 셀카 넣기" ${photo ? '' : 'disabled'}></button></div>` : ''}
  <div class="shr-to">
    <button data-act="shrInsta" id="shrInsta"><i class="ig">${SVGI(I_INSTA)}</i><span>인스타 스토리</span></button>
    <button data-act="shrKakao" id="shrKakao"><i class="kk">${I_KAKAO}</i><span>카카오톡</span></button>
    <button data-act="shrSave" id="shrSave"><i>${SVGI(I_SAVE)}</i><span>이미지 저장</span></button>
    <button data-act="shrLink" id="shrLink"><i>${SVGI(I_LINK)}</i><span>링크 복사</span></button>
  </div><div class="shr-toast" id="shrToast"></div></div>`;
}
async function refreshCard() {
  const my = ++SEQ, st = { ...ST };
  try {
    const { cv, info } = await renderCard(st); if (my !== SEQ || !ST) return;
    const blob = await new Promise(res => cv.toBlob(res, 'image/png')); if (my !== SEQ || !ST) return;
    if (ST.url) URL.revokeObjectURL(ST.url);
    ST.blob = blob; ST.url = URL.createObjectURL(blob); window.__shareInfo = info;
    const img = $('shrImg'); if (img) img.src = ST.url; const ld = $('shrLoad'); if (ld) ld.textContent = '';
  } catch (e) { console.error(e); const ld = $('shrLoad'); if (ld) ld.textContent = '카드를 만들지 못했어요'; }
}
function shrToast(msg) { const t = $('shrToast'); if (!t) return toast(msg); t.innerHTML = `<i>${SVGI(I_CHECK, 3)}</i>${msg}`; t.classList.add('show'); clearTimeout(shrToast.h); shrToast.h = setTimeout(() => t.classList.remove('show'), 2000); }
const fileName = () => `nijim_${ST.kind}_${ST.size}_${(cardData(ST).date_s || '').replace(/[^\d]/g, '')}.png`;
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
function closeShare() { SEQ++; if (ST && ST.url) URL.revokeObjectURL(ST.url); ST = null; const el = $('shareSheet'); if (el) { el.className = 'shr'; el.innerHTML = ''; } }

/* ---------- 친구 초대(S3) ---------- */
const inviteLink = () => `${APP_LINK}?ref=${encodeURIComponent(myCode())}`;   // 초대 링크 형식 = 개발 결정(공식 링크 + 코드)
function vInvite() {
  return `<div class="subhead"><button data-act="invBack" id="backBtn"><i>‹</i>전체</button><div class="h2">친구 초대</div></div><div class="sec" id="inviteScreen">
  <div class="card inv-hero"><div class="inv-char">${charFit(S.type, S.level, 150)}</div><div class="inv-t">같이 운동할 친구를 초대해요</div>
    <div class="muted inv-d">친구가 내 코드를 넣으면 바로 친구가 돼요<br>친구 리그에서 이번 주 운동을 같이 겨뤄요</div></div>
  <div class="card inv-code"><div><small>내 코드</small><b id="invCode">${myCode()}</b></div><button data-act="invCopyCode" id="invCopyCode">${SVGI(I_COPY)}복사</button></div>
  <div class="card inv-reward" id="invReward"><div class="inv-rw-hd"><b>초대 보상</b><span class="pill inv-ex">예시 · 확정 전</span></div>
    <div class="muted">친구가 내 코드로 가입하고 첫 운동을 기록하면 <b>나와 친구 모두 ${INVITE_REWARD_EXAMPLE}</b></div></div>
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
    shrKind: () => { if (ST.kind === v) return; ST.kind = v; ST.url = null; paintSheet(); refreshCard(); },
    shrSelfie: () => { ST.selfie = !ST.selfie; ST.url = null; paintSheet(); refreshCard(); },
    shrSave: () => { if (!ST.url) return shrToast('카드를 만드는 중이에요'); download(); shrToast('이미지를 저장했어요'); },
    shrInsta: () => shareFile('story', '이미지를 저장했어요 · 인스타 스토리에서 올려 주세요'),
    shrKakao: () => shareFile('square', '이미지를 저장했어요 · 카카오톡에서 보내 주세요'),
    shrLink: async () => { await copyText(APP_LINK); shrToast('링크가 복사됐어요'); },
    invOpen: () => { S.allSub = 'invite'; save(); render(); window.scrollTo(0, 0); },
    invBack: () => { S.allSub = null; save(); render(); window.scrollTo(0, 0); },
    invCopyCode: async () => { await copyText(myCode()); toast(`내 코드 ${myCode()} 복사했어요`); },
    invLink: async () => { await copyText(inviteLink()); toast('링크가 복사됐어요'); },
    invSend: async () => { const data = { title: '니짐내짐', text: `니짐내짐에서 같이 운동해요! 내 코드 ${myCode()}`, url: inviteLink() };
      if (navigator.share) { try { await navigator.share(data); } catch {} } else { await copyText(inviteLink()); toast('공유 창이 없어 링크를 복사했어요'); } },
    invite: () => { S.tab = 'all'; S.sub = null; S.allSub = 'invite'; save(); render(); window.scrollTo(0, 0); },
  };
  if (!H[a]) return;
  e.stopImmediatePropagation(); e.preventDefault(); H[a]();
}, true);
})();
