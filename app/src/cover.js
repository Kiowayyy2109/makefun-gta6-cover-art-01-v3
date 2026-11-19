// ViceFrame cover renderer.
// Everything in this file is drawn with plain canvas calls: the panel
// layouts, the colour grades, the retro sun, the palm silhouettes, the
// sparkles and the starburst badge are all original vector work done in
// code. No artwork, logos or lettering are copied from anywhere.

export const LAYOUTS = [
  { id: 'classic', name: 'Classic Spread' },
  { id: 'strip', name: 'Hero + Strip' },
  { id: 'duo', name: 'Duo Split' },
  { id: 'mosaic', name: 'Mosaic Four' },
];

export const GRADES = [
  { id: 'vice', name: 'Vice Sunset' },
  { id: 'neon', name: 'Neon Nights' },
  { id: 'golden', name: 'Golden Hour' },
  { id: 'noir', name: 'Noir' },
  { id: 'none', name: 'Clean' },
];

const INK = '#12071f';
const PAPER = '#fff6e9';

// Panel rectangles for each layout, expressed as fractions of the canvas
// so the same composition reflows cleanly across 1:1, 4:5 and 16:9.
export function panelRects(layout, w, h) {
  const F = (x, y, pw, ph) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h });
  switch (layout) {
    case 'strip':
      return [F(0, 0, 1, 0.7), F(0, 0.7, 0.34, 0.3), F(0.34, 0.7, 0.33, 0.3), F(0.67, 0.7, 0.33, 0.3)];
    case 'duo':
      return [F(0, 0, 0.52, 1), F(0.52, 0, 0.48, 1)];
    case 'mosaic':
      return [F(0, 0, 0.62, 0.58), F(0.62, 0, 0.38, 0.58), F(0, 0.58, 0.38, 0.42), F(0.38, 0.58, 0.62, 0.42)];
    case 'classic':
    default:
      return [F(0, 0, 0.58, 1), F(0.58, 0, 0.42, 0.54), F(0.58, 0.54, 0.42, 0.46)];
  }
}

// CSS filter chain for a grade. `punch` (0..100) adds extra saturation and
// contrast on top of whichever grade is active.
function filterFor(grade, punch) {
  const extraSat = 1 + punch / 130;
  const extraCon = 1 + punch / 220;
  const base = {
    vice: 'saturate(1.38) contrast(1.07) brightness(1.02)',
    neon: 'saturate(1.55) contrast(1.16) hue-rotate(-14deg) brightness(1.0)',
    golden: 'sepia(0.34) saturate(1.28) contrast(1.04) brightness(1.06)',
    noir: 'grayscale(1) contrast(1.38) brightness(1.03)',
    none: 'saturate(1.02) contrast(1.01)',
  }[grade] || 'none';
  return `${base} saturate(${extraSat.toFixed(3)}) contrast(${extraCon.toFixed(3)})`;
}

// Colour wash laid over a graded photo. Drawn inside the panel clip so it
// never bleeds across a gutter.
function washFor(ctx, grade, x, y, w, h) {
  let g;
  if (grade === 'vice') {
    g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(64, 16, 110, 0.20)');
    g.addColorStop(0.55, 'rgba(255, 110, 64, 0.10)');
    g.addColorStop(1, 'rgba(236, 42, 122, 0.34)');
  } else if (grade === 'neon') {
    g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(0, 229, 255, 0.20)');
    g.addColorStop(0.5, 'rgba(30, 0, 60, 0.06)');
    g.addColorStop(1, 'rgba(255, 0, 160, 0.30)');
  } else if (grade === 'golden') {
    g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255, 196, 64, 0.10)');
    g.addColorStop(1, 'rgba(214, 96, 20, 0.30)');
  } else if (grade === 'noir') {
    g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.28)');
  } else {
    return;
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

// Draws one photo into a box. In fill mode the photo covers the box; in
// fit mode it sits whole inside it. zoom multiplies the base scale and
// ox / oy slide the photo within the overflow (-1..1).
function paintPhoto(ctx, img, box, view) {
  if (!img) {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#3a1454');
    g.addColorStop(1, '#0e2a4a');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    return;
  }
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const coverScale = Math.max(box.w / iw, box.h / ih);
  const fitScale = Math.min(box.w / iw, box.h / ih);
  const scale = (view.fit === 'fit' ? fitScale : coverScale) * (view.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const spareX = box.w - dw;
  const spareY = box.h - dh;
  const dx = box.x + spareX / 2 + (view.ox || 0) * Math.abs(spareX) / 2;
  const dy = box.y + spareY / 2 + (view.oy || 0) * Math.abs(spareY) / 2;
  if (view.fit === 'fit') {
    ctx.fillStyle = '#0a0514';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Retro sun: a warm disc sliced by horizontal gaps that widen downwards.
function drawSun(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(0.55, '#ffa751');
  g.addColorStop(1, '#ff2e7e');
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = INK;
  let y = cy + r * 0.08;
  let gap = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.17;
    gap *= 1.45;
  }
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(255, 226, 89, 0.85)';
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// A palm silhouette: one curved trunk and a fan of drooping fronds.
function drawPalm(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * s, s);
  ctx.fillStyle = '#0d0418';
  ctx.strokeStyle = '#0d0418';
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.quadraticCurveTo(-2, -62, 16, -104);
  ctx.lineTo(26, -102);
  ctx.quadraticCurveTo(8, -58, 9, 0);
  ctx.closePath();
  ctx.fill();
  const crownX = 21;
  const crownY = -103;
  const fronds = [
    [-58, -34, -96, 6],
    [-38, -52, -62, -18],
    [-8, -62, -18, -34],
    [26, -60, 34, -40],
    [52, -44, 84, -22],
    [60, -18, 98, 14],
  ];
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const [cx1, cy1, ex, ey] of fronds) {
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + cx1, crownY + cy1, crownX + ex, crownY + ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(crownX - 6, crownY + 6, 6, 0, Math.PI * 2);
  ctx.arc(crownX + 8, crownY + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Four-point sparkle star.
function drawSparkle(ctx, x, y, r, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

// Spiky starburst badge with up to two short lines of text.
function drawBadge(ctx, cx, cy, r, text) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.16);
  const spikes = 18;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.8;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -r, 0, r);
  g.addColorStop(0, '#ffe259');
  g.addColorStop(1, '#ff7b39');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.strokeStyle = INK;
  ctx.stroke();
  const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  if (words.length <= 2) {
    lines.push(words.join(' '));
  } else {
    const mid = Math.ceil(words.length / 2);
    lines.push(words.slice(0, mid).join(' '));
    lines.push(words.slice(mid).join(' '));
  }
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = r * 0.34;
  const setFont = () => { ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`; };
  setFont();
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  if (widest > r * 1.25) {
    size *= (r * 1.25) / widest;
    setFont();
  }
  const lh = size * 1.04;
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lh);
  });
  ctx.restore();
}

// Splits a title into lines that fit `maxWidth`, preferring few lines.
function wrapTitle(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  // Too many lines: rebalance into maxLines chunks of words.
  const out = [];
  const per = Math.ceil(words.length / maxLines);
  for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(' '));
  return out;
}

// The big poster lettering plus its tagline.
function drawLettering(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (!title && !sub) return;
  const atTop = state.titlePos !== 'bottom';

  // Legibility scrim behind the words.
  const scrimH = h * 0.34;
  const scrim = atTop
    ? ctx.createLinearGradient(0, 0, 0, scrimH)
    : ctx.createLinearGradient(0, h, 0, h - scrimH);
  scrim.addColorStop(0, 'rgba(8, 2, 18, 0.62)');
  scrim.addColorStop(1, 'rgba(8, 2, 18, 0)');
  ctx.fillStyle = scrim;
  if (atTop) ctx.fillRect(0, 0, w, scrimH); else ctx.fillRect(0, h - scrimH, w, scrimH);

  let size = h * 0.105 * (state.titleSize || 1);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = () => { ctx.font = `${size}px Anton, 'Arial Narrow', Impact, sans-serif`; };
  setFont();
  let lines = wrapTitle(ctx, title, w * 0.9, 3);
  const widest = () => Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
  let guard = 0;
  while (lines.length && widest() > w * 0.9 && size > 14 && guard < 60) {
    size *= 0.94;
    setFont();
    lines = wrapTitle(ctx, title, w * 0.9, 3);
    guard++;
  }
  const lineH = size * 0.96;
  const blockH = lines.length * lineH;
  const edge = h * 0.055;
  const firstBaseline = atTop ? edge + size * 0.86 : h - edge - blockH + size * 0.86;

  lines.forEach((line, i) => {
    const y = firstBaseline + i * lineH;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    // Hard offset shadow, then a dark outline, then the face.
    ctx.fillStyle = 'rgba(10, 2, 20, 0.55)';
    ctx.fillText(line, w / 2 + size * 0.045, y + size * 0.055);
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(line, w / 2, y);
    if (state.titleStyle === 'outline') {
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = size * 0.055;
      ctx.strokeText(line, w / 2, y);
    } else if (state.titleStyle === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, w / 2, y);
    } else {
      const g = ctx.createLinearGradient(0, y - size, 0, y);
      g.addColorStop(0, '#fffbe6');
      g.addColorStop(0.45, '#ffd23f');
      g.addColorStop(0.78, '#ff7b39');
      g.addColorStop(1, '#ff2e7e');
      ctx.fillStyle = g;
      ctx.fillText(line, w / 2, y);
    }
    ctx.restore();
  });

  if (sub) {
    const subSize = Math.max(13, h * 0.026 * (state.titleSize || 1));
    ctx.save();
    ctx.font = `600 ${subSize}px 'Segoe UI', Arial, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.32)}px`; } catch { /* older engines */ }
    const tw = ctx.measureText(sub).width;
    const padX = subSize * 0.9;
    const pillW = tw + padX * 2;
    const pillH = subSize * 1.9;
    const pillY = atTop ? edge + blockH + subSize * 0.55 : h - edge - blockH - pillH - subSize * 0.55;
    ctx.fillStyle = 'rgba(10, 3, 22, 0.78)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - pillW / 2, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 210, 63, 0.9)';
    ctx.lineWidth = Math.max(1.5, subSize * 0.07);
    ctx.stroke();
    ctx.fillStyle = '#ffe9b0';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub, w / 2, pillY + pillH / 2 + subSize * 0.04);
    ctx.restore();
  }
}

// Renders the whole cover described by `state` onto ctx at w x h.
// state.images is an array of loaded images; state.panels holds one view
// ({ img, zoom, ox, oy, fit }) per panel of the active layout.
export function drawCover(ctx, w, h, state) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);

  const rects = panelRects(state.layout, w, h);
  const gutter = Math.max(6, Math.round(Math.min(w, h) * 0.014));

  rects.forEach((rect, i) => {
    const view = state.panels[i] || { img: 0, zoom: 1, ox: 0, oy: 0, fit: 'fill' };
    const box = {
      x: rect.x + gutter / 2,
      y: rect.y + gutter / 2,
      w: rect.w - gutter,
      h: rect.h - gutter,
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    try { ctx.filter = filterFor(state.grade, state.punch || 0); } catch { /* filter unsupported */ }
    if (state.spanMode && state.images.length) {
      // One photo stretched across the full canvas; each panel shows its
      // own slice of that single composition.
      const img = state.images[Math.min(view.img || 0, state.images.length - 1)];
      paintPhoto(ctx, img, { x: 0, y: 0, w, h }, view);
    } else {
      const img = state.images.length
        ? state.images[Math.min(view.img || 0, state.images.length - 1)]
        : null;
      paintPhoto(ctx, img, box, view);
    }
    try { ctx.filter = 'none'; } catch { /* ignore */ }
    washFor(ctx, state.grade, box.x, box.y, box.w, box.h);
    ctx.restore();

    // Poster frame around every panel.
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = gutter;
    ctx.strokeRect(rect.x + gutter / 2, rect.y + gutter / 2, rect.w - gutter, rect.h - gutter);
    ctx.strokeStyle = 'rgba(255, 246, 233, 0.9)';
    ctx.lineWidth = Math.max(1.5, gutter * 0.14);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  });

  // Decorations sit above the photos but below the lettering.
  const u = Math.min(w, h);
  // The sun keeps the corner opposite the badge so the two never collide:
  // badge sits top-right when the title is at the bottom, and vice versa.
  if (state.showSun) {
    if (state.titlePos === 'bottom') drawSun(ctx, w * 0.125, h * 0.145, u * 0.105);
    else drawSun(ctx, w * 0.125, h * 0.85, u * 0.105);
  }
  if (state.showStars) {
    drawSparkle(ctx, w * 0.07, h * 0.1, u * 0.02, '#ffffff');
    drawSparkle(ctx, w * 0.16, h * 0.2, u * 0.013, '#ffd23f');
    drawSparkle(ctx, w * 0.93, h * 0.34, u * 0.015, '#7df9ff');
    drawSparkle(ctx, w * 0.06, h * 0.62, u * 0.012, '#ff9de2');
  }
  if (state.showPalms) {
    drawPalm(ctx, w * 0.015, h * 0.99, u * 0.0016, 1);
    drawPalm(ctx, w * 0.995, h * 0.995, u * 0.00125, -1);
  }
  if (state.showBadge && state.badgeText) {
    const bx = state.titlePos === 'bottom' ? w * 0.875 : w * 0.875;
    const by = state.titlePos === 'bottom' ? h * 0.13 : h * 0.885;
    drawBadge(ctx, bx, by, u * 0.095, state.badgeText);
  }

  drawLettering(ctx, w, h, state);

  if (state.showFrame) {
    const v = ctx.createRadialGradient(w / 2, h / 2, u * 0.42, w / 2, h / 2, u * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5, 0, 12, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(8, u * 0.018);
    ctx.strokeRect(0, 0, w, h);
  }
  ctx.restore();
}
