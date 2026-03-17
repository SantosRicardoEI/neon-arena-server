import type { GameState, Player, PowerUpType } from '../../shared/types';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';
import { getPowerUpColor } from '../powerups/render-utils';

interface TrailPoint {
  x: number;
  y: number;
  time: number;
  dx: number;
  dy: number;
}

const playerTrails = new Map<string, TrailPoint[]>();
let lastTrailSample = 0;

export function updatePlayerTrails(state: GameState, now: number): void {
  if (now - lastTrailSample <= C.TRAIL_SAMPLE_INTERVAL_MS) return;

  lastTrailSample = now;

  for (const [id, player] of state.players) {
    if (player.health <= 0) {
      playerTrails.delete(id);
      continue;
    }

    let trail = playerTrails.get(id);
    if (!trail) {
      trail = [];
      playerTrails.set(id, trail);
    }

    const da = Math.random() * Math.PI * 2;
    trail.push({
      x: player.pos.x,
      y: player.pos.y,
      time: now,
      dx: Math.cos(da),
      dy: Math.sin(da),
    });

    while (trail.length > 0 && now - trail[0].time > C.TRAIL_LIFETIME_MS) {
      trail.shift();
    }

    if (trail.length > C.TRAIL_MAX_POINTS) {
      trail.shift();
    }
  }

  for (const id of playerTrails.keys()) {
    if (!state.players.has(id)) {
      playerTrails.delete(id);
    }
  }
}

export function drawPlayerTrails(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  for (const [id, trail] of playerTrails) {
    const player = state.players.get(id);
    if (!player || player.health <= 0 || trail.length < 2) continue;

    const hslMatch = player.color.match(/hsl\(([^)]+)\)/);
    const hslInner = hslMatch ? hslMatch[1] : '210, 100%, 70%';

    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = (now - p.time) / C.TRAIL_LIFETIME_MS;
      if (age >= 1) continue;

      const alpha = C.TRAIL_MAX_OPACITY * (1 - age) * (1 - age);
      const radius =
        C.TRAIL_PARTICLE_RADIUS +
        age * C.TRAIL_PARTICLE_RADIUS * C.TRAIL_RADIUS_GROWTH;

      const drift = age * C.TRAIL_DRIFT_SPEED * (C.TRAIL_LIFETIME_MS / 1000);
      const px = p.x + p.dx * drift;
      const py = p.y + p.dy * drift;

      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      grad.addColorStop(0, `hsla(${hslInner}, ${alpha})`);
      grad.addColorStop(1, `hsla(${hslInner}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawPowerUpAura(
  ctx: CanvasRenderingContext2D,
  player: Player,
  now: number,
): void {
  if (player.activePowerUps.length === 0) return;

  const r = getPlayerRadius(player.score);

  for (let i = 0; i < player.activePowerUps.length; i++) {
    const pu = player.activePowerUps[i];
    if (now >= pu.expiresAt) continue;

    const color = getPowerUpColor(pu.type as PowerUpType);
    const remaining = pu.expiresAt - now;
    const blinkRate = remaining < 2000 ? 0.015 : 0.005;
    const alpha =
      remaining < 2000
        ? 0.2 + 0.15 * Math.sin(now * blinkRate * Math.PI * 2)
        : 0.3;

    const auraR = r + 8 + i * 6;

    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(now * 0.001 * (i % 2 === 0 ? 1 : -1));
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.strokeStyle = color.replace(')', `, ${alpha})`).replace('hsl(', 'hsla(');
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const grad = ctx.createRadialGradient(
      player.pos.x,
      player.pos.y,
      r,
      player.pos.x,
      player.pos.y,
      auraR + 4,
    );
    grad.addColorStop(0, color.replace(')', `, ${alpha * 0.3})`).replace('hsl(', 'hsla('));
    grad.addColorStop(1, color.replace(')', ', 0)').replace('hsl(', 'hsla('));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, auraR + 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  color: string,
): void {
  const { pos, aimAngle, skin } = player;
  const r = getPlayerRadius(player.score);

  ctx.save();
  ctx.translate(pos.x, pos.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  switch (skin) {
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.stroke();
      break;

    case 'hexagon':
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      break;

    case 'star':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const sr = i % 2 === 0 ? r : r * 0.5;
        const px = Math.cos(a) * sr;
        const py = Math.sin(a) * sr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      break;

    default:
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }

  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();

  const tipX = pos.x + Math.cos(aimAngle) * (r + 8);
  const tipY = pos.y + Math.sin(aimAngle) * (r + 8);
  const baseLX = pos.x + Math.cos(aimAngle + 0.4) * r;
  const baseLY = pos.y + Math.sin(aimAngle + 0.4) * r;
  const baseRX = pos.x + Math.cos(aimAngle - 0.4) * r;
  const baseRY = pos.y + Math.sin(aimAngle - 0.4) * r;

  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseLX, baseLY);
  ctx.lineTo(baseRX, baseRY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawPlayerName(
  ctx: CanvasRenderingContext2D,
  player: Player,
  color: string,
): void {
  const r = getPlayerRadius(player.score);
  const name = player.name || player.id;
  const nameY = player.pos.y - r - 18;

  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(name, player.pos.x, nameY);
  ctx.fillText(name, player.pos.x, nameY);

  const barW = 32;
  const barH = 4;
  const barX = player.pos.x - barW / 2;
  const barY = nameY + 3;
  const healthFrac = player.health / player.maxHealth;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = healthFrac > 0.3 ? color : C.COLORS.playerDamage;
  ctx.fillRect(barX, barY, barW * healthFrac, barH);
}