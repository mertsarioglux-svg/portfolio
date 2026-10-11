import * as THREE from 'three';

export interface CardContent {
  first: string;
  last: string;
  currentLabel: string;
  current: string;
  tagsLabel: string;
  tags: { label: string; color: string; text?: string }[];
  back: string;
  lang: string;
}

const FAMILY = '"Literata Variable", Georgia, serif';
const INK = '#0b0b0c';
const SOFT_INK = '#3d3c42';
const ACCENT = '#0b22f4';
const PAPER = '#f6f5f1';

/** Kart yazıları canvas'a çizilmeden önce fontun (Türkçe harfler dahil) yüklenmesini bekler. */
export async function loadCardFonts(card: CardContent) {
  const sample = [card.first, card.last, card.currentLabel, card.current, card.tagsLabel, card.back]
    .concat(card.tags.map((tag) => tag.label))
    .join(' ');
  await Promise.allSettled([
    document.fonts.load(`400 100px ${FAMILY}`, sample),
    document.fonts.load(`500 100px ${FAMILY}`, sample),
    document.fonts.load(`italic 400 100px ${FAMILY}`, sample),
  ]);
}

export function cardFront(card: CardContent, width: number, height: number, renderer: THREE.WebGLRenderer) {
  const { canvas, ctx } = createCanvas(width, height);
  paper(ctx, width, height, 7);

  const pad = width * 0.084;
  const inner = width - pad * 2;
  ctx.textBaseline = 'alphabetic';

  // İsim: iki satır, sıkı satır aralığı; ad siyah, soyad mavi, baskı mürekkebi gibi pürüzlü kenarlar
  let size = width * 0.24;
  setFont(ctx, `500 ${size}px ${FAMILY}`, -0.02 * size);
  const widest = Math.max(ctx.measureText(card.first).width, ctx.measureText(card.last).width);
  if (widest > inner) {
    size *= inner / widest;
    setFont(ctx, `500 ${size}px ${FAMILY}`, -0.02 * size);
  }
  const line1 = pad + size * 0.8;
  const line2 = line1 + size * 0.8;
  roughText(ctx, card.first, pad, line1, INK, 3);
  roughText(ctx, card.last, pad, line2, ACCENT, 5);

  // Alt blok: "Şu an" + okul, "Odak" + teknoloji etiketleri
  const tagFont = width * 0.03;
  const tagHeight = tagFont * 1.95;
  const tagsTop = height - pad - tagHeight;
  const labelFont = `italic 400 ${width * 0.031}px ${FAMILY}`;
  const bodySize = width * 0.033;
  const bodyFont = `450 ${bodySize}px ${FAMILY}`;

  ctx.fillStyle = SOFT_INK;
  setFont(ctx, labelFont, 0);
  ctx.fillText(card.tagsLabel, pad, tagsTop - width * 0.022);
  setFont(ctx, bodyFont, -0.01 * bodySize);
  const currentLines = wrap(ctx, card.current, inner);
  const lastBaseline = tagsTop - width * 0.1;
  const lineGap = bodySize * 1.32;
  currentLines.forEach((line, i) => {
    ctx.fillText(line, pad, lastBaseline - (currentLines.length - 1 - i) * lineGap, inner);
  });
  setFont(ctx, labelFont, 0);
  ctx.fillText(card.currentLabel, pad, lastBaseline - (currentLines.length - 1) * lineGap - width * 0.052);

  let x = pad;
  setFont(ctx, `500 ${tagFont}px ${FAMILY}`, 0);
  for (const tag of card.tags) {
    const pillWidth = ctx.measureText(tag.label).width + tagFont * 1.5;
    if (x + pillWidth > width - pad) break;
    ctx.fillStyle = tag.color;
    ctx.beginPath();
    ctx.roundRect(x, tagsTop, pillWidth, tagHeight, tagHeight / 2);
    ctx.fill();
    ctx.fillStyle = tag.text ?? '#ffffff';
    ctx.fillText(tag.label, x + tagFont * 0.75, tagsTop + tagHeight * 0.68);
    x += pillWidth + width * 0.012;
  }

  return toTexture(canvas, renderer);
}

export function cardBack(card: CardContent, width: number, height: number, renderer: THREE.WebGLRenderer) {
  const { canvas, ctx } = createCanvas(width, height);
  paper(ctx, width, height, 11);

  const radius = width * 0.2;
  const cx = width / 2;
  const cy = height * 0.45;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  setFont(ctx, `400 ${radius * 0.9}px ${FAMILY}`, -0.02 * radius);
  ctx.fillText(`${card.first[0]}${card.last[0]}`, cx, cy + radius * 0.3);

  ctx.fillStyle = SOFT_INK;
  setFont(ctx, `italic 400 ${width * 0.036}px ${FAMILY}`, 0);
  ctx.fillText(card.back, cx, height - width * 0.11);

  return toTexture(canvas, renderer);
}

/** Boyun ipi: koyu dokuma bant, üstünde tekrar eden isim. Yatayda tekrar eder. */
export function strapTexture(card: CardContent, renderer: THREE.WebGLRenderer) {
  const width = 1024;
  const height = 64;
  const { canvas, ctx } = createCanvas(width, height);

  ctx.fillStyle = '#151517';
  ctx.fillRect(0, 0, width, height);
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = `rgb(255 255 255 / ${y % 6 === 0 ? 0.03 : 0.015})`;
    ctx.fillRect(0, y, width, 1);
  }
  ctx.strokeStyle = 'rgb(255 255 255 / 0.14)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 5]);
  for (const y of [6, height - 6]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const label = `${card.first} ${card.last}`.toLocaleUpperCase(card.lang);
  setFont(ctx, `500 24px ${FAMILY}`, 5);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgb(255 255 255 / 0.72)';
  const unit = ctx.measureText(label).width + 72;
  const count = Math.max(1, Math.floor(width / unit));
  const step = width / count;
  for (let i = 0; i < count; i++) ctx.fillText(label, i * step + 36, height / 2 + 1);

  const texture = toTexture(canvas, renderer);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Plastik kılıfın üstündeki fermuar çizgisi ve kullanım izleri (çizik, toz). Arka planı şeffaf. */
export function sleeveDetails(
  width: number,
  height: number,
  layout: { sealY: number; radius: number; holes: { x: number; y: number; r: number }[]; slot: { x: number; y: number; w: number; h: number } },
  renderer: THREE.WebGLRenderer,
) {
  const { canvas, ctx } = createCanvas(width, height);
  const rand = random(19);

  // Çizikler yalnızca kılıfın üstüne düşsün: köşeler ve delikler maskelenir.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(4, 4, width - 8, height - 8, layout.radius);
  for (const hole of layout.holes) {
    ctx.moveTo(hole.x + hole.r + 3, hole.y);
    ctx.arc(hole.x, hole.y, hole.r + 3, 0, Math.PI * 2, true);
  }
  ctx.roundRect(layout.slot.x - 3, layout.slot.y - 3, layout.slot.w + 6, layout.slot.h + 6, layout.slot.h);
  ctx.clip('evenodd');

  const sealY = layout.sealY;
  ctx.fillStyle = 'rgb(40 48 56 / 0.16)';
  ctx.fillRect(0, sealY, width, 2.5);
  ctx.fillStyle = 'rgb(255 255 255 / 0.7)';
  ctx.fillRect(0, sealY + 3, width, 2);
  ctx.fillStyle = 'rgb(40 48 56 / 0.08)';
  ctx.fillRect(0, sealY + 9, width, 1.5);

  for (let i = 0; i < 140; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const length = 4 + rand() * 26;
    const angle = (rand() - 0.5) * 0.8 + (rand() > 0.5 ? 0 : Math.PI / 2);
    ctx.strokeStyle = `rgb(255 255 255 / ${0.06 + rand() * 0.16})`;
    ctx.lineWidth = 0.6 + rand() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  for (let i = 0; i < 420; i++) {
    // Toz, üst kısımda (deliklerin çevresinde) daha yoğun
    const y = Math.pow(rand(), 1.8) * height;
    ctx.fillStyle = `rgb(255 255 255 / ${0.12 + rand() * 0.3})`;
    ctx.fillRect(rand() * width, y, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
  ctx.restore();

  return toTexture(canvas, renderer);
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function setFont(ctx: CanvasRenderingContext2D, font: string, letterSpacing: number) {
  ctx.font = font;
  ctx.letterSpacing = `${letterSpacing}px`;
}

/** Kağıt rengi + çok hafif gren. */
function paper(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const rand = random(seed);
  for (let i = 0; i < data.length; i += 4) {
    const grain = (rand() - 0.5) * 9;
    data[i] += grain;
    data[i + 1] += grain;
    data[i + 2] += grain;
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * Yazıyı baskı mürekkebi gibi çizer: önce bulanık bir maske çizilir, sonra gürültüyle eşiklenir.
 * Sonuç, kenarları hafif pürüzlü ve dağılmış, kağıda basılmış gibi bir yazı.
 */
function roughText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, seed: number) {
  const metrics = ctx.measureText(text);
  const pad = 12;
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const width = Math.ceil(metrics.width + pad * 2);
  const height = Math.ceil(ascent + metrics.actualBoundingBoxDescent + pad * 2);
  const { canvas: mask, ctx: m } = createCanvas(width, height);
  m.font = ctx.font;
  m.letterSpacing = ctx.letterSpacing;
  m.textBaseline = 'alphabetic';
  m.filter = 'blur(1.8px)';
  m.fillStyle = '#000';
  m.fillText(text, pad, pad + ascent);

  const rand = random(seed);
  const cell = 4;
  const columns = Math.ceil(width / cell) + 2;
  const grid = Float32Array.from({ length: columns * (Math.ceil(height / cell) + 2) }, rand);
  const coarse = (px: number, py: number) => {
    const gx = px / cell;
    const gy = py / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const at = (cx: number, cy: number) => grid[cy * columns + cx];
    const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
    const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };

  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  const image = m.getImageData(0, 0, width, height);
  const data = image.data;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const i = (py * width + px) * 4;
      const coverage = data[i + 3] / 255;
      const noise = coarse(px, py) * 0.6 + rand() * 0.4 - 0.5;
      const value = coverage + noise * 0.5;
      const alpha = Math.min(1, Math.max(0, (value - 0.42) / 0.16));
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = alpha * (0.9 + rand() * 0.1) * 255;
    }
  }
  m.putImageData(image, 0, 0);
  ctx.drawImage(mask, x - pad, y - ascent - pad);
}

/** Satıra sığmayan metni " @ " noktasından (yoksa son boşluktan) ikiye böler. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const at = text.indexOf(' @ ');
  if (at > 0) return [text.slice(0, at), text.slice(at + 1)];
  const space = text.lastIndexOf(' ', Math.floor(text.length / 2) + 8);
  return space > 0 ? [text.slice(0, space), text.slice(space + 1)] : [text];
}

/** Her seferinde aynı sonucu veren basit rastgele sayı üreteci (mulberry32). */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
