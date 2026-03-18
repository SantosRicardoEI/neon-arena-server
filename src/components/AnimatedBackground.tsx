import { useEffect, useRef } from "react";

/* ─── tunables ─── */
const GRID_SPACING = 80;
const GRID_COLOR = "hsla(240, 80%, 55%, 0.07)";
const GRID_GLOW_COLOR = "hsla(260, 90%, 60%, 0.04)";
const GRID_SCROLL_SPEED = 6; // px/s
const GRID_PULSE_PERIOD = 8; // seconds

const PARTICLE_COUNT = 140;
const PARTICLE_MIN_R = 0.4;
const PARTICLE_MAX_R = 1.6;
const PARTICLE_MIN_SPEED = 4;
const PARTICLE_MAX_SPEED = 14;
const PARTICLE_MIN_ALPHA = 0.22;
const PARTICLE_MAX_ALPHA = 0.75;
const PARTICLE_PARALLAX = 0.35;

const BG_CENTER = "hsl(250, 69%, 5%)";
const BG_EDGE = "hsl(230, 45%, 3%)";

/* ─── types ─── */
interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: number;
  phase: number;
}

/* ─── helpers ─── */
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createParticle(w: number, h: number): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = rand(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED);
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: rand(PARTICLE_MIN_R, PARTICLE_MAX_R),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    alpha: rand(PARTICLE_MIN_ALPHA, PARTICLE_MAX_ALPHA),
    hue: rand(200, 280),
    phase: Math.random() * Math.PI * 2,
  };
}

/* ─── component ─── */
const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let prev = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // regenerate particles on resize
      particles = Array.from({ length: PARTICLE_COUNT }, () =>
        createParticle(w, h),
      );
    };

    const draw = (now: number) => {
      if (!prev) prev = now;
      const dt = Math.min((now - prev) / 1000, 0.1);
      prev = now;
      const t = now / 1000;

      /* — background — */
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      bg.addColorStop(0, BG_CENTER);
      bg.addColorStop(1, BG_EDGE);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* — grid — */
      const pulse =
        0.8 + 0.2 * Math.sin((t * Math.PI * 2) / GRID_PULSE_PERIOD);
      const offsetY = (t * GRID_SCROLL_SPEED) % GRID_SPACING;

      ctx.save();
      ctx.globalAlpha = pulse;

      // glow layer
      ctx.lineWidth = 3;
      ctx.strokeStyle = GRID_GLOW_COLOR;
      drawGrid(ctx, w, h, offsetY);

      // crisp layer
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = GRID_COLOR;
      drawGrid(ctx, w, h, offsetY);

      ctx.restore();

      /* — particles — */
      for (const p of particles) {
        // move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // wrap
        if (p.x < -10) p.x += w + 20;
        if (p.x > w + 10) p.x -= w + 20;
        if (p.y < -10) p.y += h + 20;
        if (p.y > h + 10) p.y -= h + 20;

        // parallax offset relative to center
        const px = p.x + (p.x - cx) * PARTICLE_PARALLAX * (p.r / PARTICLE_MAX_R) * 0.1;
        const py = p.y + (p.y - cy) * PARTICLE_PARALLAX * (p.r / PARTICLE_MAX_R) * 0.1;

        const flicker =
          0.7 + 0.3 * Math.sin(t * 1.2 + p.phase);
        const a = p.alpha * flicker;

        // glow
        if (p.r > 1) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, p.r * 6);

          /*
          g.addColorStop(0, `hsla(${p.hue}, 70%, 65%, ${a * 0.12})`);
          g.addColorStop(1, `hsla(${p.hue}, 70%, 65%, 0)`);
          */ // NOVO
            g.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${a * 0.22})`);
            g.addColorStop(1, `hsla(${p.hue}, 90%, 70%, 0)`);


          ctx.fillStyle = g;
          ctx.fillRect(px - p.r * 6, py - p.r * 6, p.r * 12, p.r * 12);
        }

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);

        // ctx.fillStyle = `hsla(${p.hue}, 60%, 75%, ${a})`;
        // NOVO
        ctx.fillStyle = `hsla(${p.hue}, 95%, 78%, ${a})`;

        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
};

/* ─── grid drawing helper ─── */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offsetY: number,
) {
  ctx.beginPath();
  // vertical lines
  for (let x = 0; x <= w; x += GRID_SPACING) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  // horizontal lines (scrolling)
  const startY = -GRID_SPACING + offsetY;
  for (let y = startY; y <= h + GRID_SPACING; y += GRID_SPACING) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();
}

export default AnimatedBackground;