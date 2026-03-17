import type { GameState } from '../types';
import * as C from '../constants';

export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const c of state.collectibles) {
    const pulse = 1 + 0.15 * Math.sin(c.pulsePhase);

    ctx.save();
    ctx.translate(c.pos.x, c.pos.y);
    ctx.rotate(Math.PI / 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = C.COLORS.collectible;
    ctx.shadowColor = C.COLORS.collectible;
    ctx.shadowBlur = 12;

    const s = C.COLLECTIBLE_SIZE / 2;
    ctx.fillRect(-s, -s, C.COLLECTIBLE_SIZE, C.COLLECTIBLE_SIZE);

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawDroppedPoints(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const dp of state.droppedPoints) {
    const pulse = 1 + 0.2 * Math.sin(dp.pulsePhase);

    ctx.save();
    ctx.translate(dp.pos.x, dp.pos.y);
    ctx.rotate(Math.PI / 6);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = C.COLORS.droppedPoints;
    ctx.shadowColor = C.COLORS.droppedPoints;
    ctx.shadowBlur = 10;

    const s = C.DROPPED_POINTS_SIZE / 2;

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.font = '9px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = C.COLORS.droppedPoints;
    ctx.fillText(`${dp.value}`, dp.pos.x, dp.pos.y - C.DROPPED_POINTS_SIZE);
  }
}

export function drawHealthPickups(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const hp of state.healthPickups) {
    const pulse = 1 + 0.1 * Math.sin(hp.pulsePhase);

    ctx.save();
    ctx.translate(hp.pos.x, hp.pos.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = C.COLORS.healthPickup;
    ctx.shadowColor = C.COLORS.healthPickup;
    ctx.shadowBlur = 14;

    const s = C.HEALTH_PICKUP_SIZE / 2;
    const t = s * 0.35;

    ctx.fillRect(-t, -s, t * 2, s * 2);
    ctx.fillRect(-s, -t, s * 2, t * 2);

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

export function drawExplosions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  for (const exp of state.explosions) {
    const age = now - exp.createdAt;
    if (age < 0) continue;

    const progress = Math.min(
      Math.max(age / C.ENEMY_EXPLODER_EXPLOSION_DURATION_MS, 0),
      1,
    );
    const currentRadius = Math.max(exp.radius * progress, 0.01);
    const alpha = 0.6 * (1 - progress);

    ctx.save();
    ctx.translate(exp.pos.x, exp.pos.y);

    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(45, 100%, 60%, ${alpha})`;
    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.stroke();

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    grad.addColorStop(0, `hsla(40, 100%, 70%, ${alpha * 0.5})`);
    grad.addColorStop(0.5, `hsla(25, 100%, 55%, ${alpha * 0.3})`);
    grad.addColorStop(1, `hsla(10, 100%, 45%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress < 0.7) {
      ctx.beginPath();
      ctx.arc(0, 0, exp.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(0, 100%, 60%, ${0.25 * (1 - progress)})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}

export function drawDeathParticles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  for (const dp of state.deathParticles) {
    const age = now - dp.createdAt;
    if (age < 0) continue;

    const progress = Math.min(age / C.DEATH_PARTICLE_LIFETIME_MS, 1);
    const alpha = 1 - progress;
    const size = dp.size * (1 - progress * 0.5);
    const px = dp.pos.x + dp.vel.x * (age / 1000);
    const py = dp.pos.y + dp.vel.y * (age / 1000);

    ctx.save();
    ctx.globalAlpha = alpha;

    const grad = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
    grad.addColorStop(0, `hsl(${dp.hue}, 100%, 80%)`);
    grad.addColorStop(1, `hsla(${dp.hue}, 100%, 50%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `hsl(${dp.hue}, 100%, 90%)`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const proj of state.projectiles) {
    for (let i = 0; i < proj.trail.length; i++) {
      const alpha = (i / proj.trail.length) * 0.3;
      ctx.fillStyle = `hsla(60, 100%, 70%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(proj.trail[i].x, proj.trail[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const angle = Math.atan2(proj.vel.y, proj.vel.x);

    ctx.save();
    ctx.translate(proj.pos.x, proj.pos.y);
    ctx.rotate(angle);
    ctx.fillStyle = C.COLORS.projectile;
    ctx.shadowColor = C.COLORS.projectile;
    ctx.shadowBlur = 6;
    ctx.fillRect(
      -C.PROJECTILE_LENGTH / 2,
      -C.PROJECTILE_WIDTH / 2,
      C.PROJECTILE_LENGTH,
      C.PROJECTILE_WIDTH,
    );
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}