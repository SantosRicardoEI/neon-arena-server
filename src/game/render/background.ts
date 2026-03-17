import * as C from '../constants';

interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  phase: number;
  hue: number;
  layer: 'small' | 'medium' | 'large';
}

let starsGenerated = false;
let stars: Star[] = [];

function generateStars() {
  if (starsGenerated) return;

  starsGenerated = true;
  stars = [];

  const ww = C.WORLD_WIDTH * 2;
  const wh = C.WORLD_HEIGHT * 2;

  for (let i = 0; i < C.STARS_SMALL_COUNT; i++) {
    stars.push({
      x: Math.random() * ww - ww * 0.25,
      y: Math.random() * wh - wh * 0.25,
      radius: 0.5 + Math.random() * 0.8,
      brightness: 0.2 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      hue: 200 + Math.random() * 60,
      layer: 'small',
    });
  }

  for (let i = 0; i < C.STARS_MEDIUM_COUNT; i++) {
    stars.push({
      x: Math.random() * ww - ww * 0.25,
      y: Math.random() * wh - wh * 0.25,
      radius: 1 + Math.random() * 1.2,
      brightness: 0.4 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      hue: 190 + Math.random() * 80,
      layer: 'medium',
    });
  }

  for (let i = 0; i < C.STARS_LARGE_COUNT; i++) {
    stars.push({
      x: Math.random() * ww - ww * 0.25,
      y: Math.random() * wh - wh * 0.25,
      radius: 1.5 + Math.random() * 1.5,
      brightness: 0.6 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      hue: 180 + Math.random() * 100,
      layer: 'large',
    });
  }
}

function getParallax(layer: Star['layer']): number {
  switch (layer) {
    case 'small':
      return C.STARS_PARALLAX_SMALL;
    case 'medium':
      return C.STARS_PARALLAX_MEDIUM;
    case 'large':
      return C.STARS_PARALLAX_LARGE;
  }
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
  now: number,
): void {
  generateStars();

  if (
    !Number.isFinite(camX) ||
    !Number.isFinite(camY) ||
    !Number.isFinite(vw) ||
    !Number.isFinite(vh) ||
    !Number.isFinite(now)
  ) {
    console.log('[renderer] invalid drawStarfield inputs', {
      camX,
      camY,
      vw,
      vh,
      now,
    });
    return;
  }

  const cx = vw / 2;
  const cy = vh / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);

  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(maxR)) {
    console.log('[renderer] invalid bg gradient', { cx, cy, maxR, vw, vh });
    return;
  }

  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  bgGrad.addColorStop(0, C.BG_GRADIENT_CENTER);
  bgGrad.addColorStop(1, C.BG_GRADIENT_EDGE);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vw, vh);

  const nebulaPositions = [
    { x: C.WORLD_WIDTH * 0.3, y: C.WORLD_HEIGHT * 0.25, r: 400 },
    { x: C.WORLD_WIDTH * 0.7, y: C.WORLD_HEIGHT * 0.7, r: 350 },
  ];

  for (const nb of nebulaPositions) {
    const sx = nb.x - camX * 0.1;
    const sy = nb.y - camY * 0.1;

    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(nb.r)) {
      console.log('[renderer] invalid nebula gradient', {
        sx,
        sy,
        r: nb.r,
        camX,
        camY,
        nb,
      });
      continue;
    }

    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, nb.r);
    grad.addColorStop(0, `hsla(${C.BG_NEBULA_COLOR}, ${C.BG_NEBULA_OPACITY})`);
    grad.addColorStop(1, `hsla(${C.BG_NEBULA_COLOR}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(sx - nb.r, sy - nb.r, nb.r * 2, nb.r * 2);
  }

  const timeSec = now / 1000;

  for (const star of stars) {
    const p = getParallax(star.layer);
    const sx = star.x - camX * p;
    const sy = star.y - camY * p;

    if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;

    const pulse = 0.7 + 0.3 * Math.sin(timeSec * C.STARS_GLOW_PULSE_SPEED + star.phase);
    const alpha = star.brightness * pulse;

    if (star.layer === 'large') {
      const glowR = C.STARS_GLOW_RADIUS * pulse;

      if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(glowR)) {
        console.log('[renderer] invalid star glow gradient', {
          sx,
          sy,
          glowR,
          star,
          camX,
          camY,
          p,
        });
        continue;
      }

      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
      grad.addColorStop(0, `hsla(${star.hue}, 60%, 80%, ${alpha * 0.15})`);
      grad.addColorStop(1, `hsla(${star.hue}, 60%, 80%, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
    }

    ctx.beginPath();
    ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${star.hue}, 50%, 85%, ${alpha})`;
    ctx.fill();
  }
}