import {
  GameState,
  Player,
  PlayerSkin,
  Enemy,
  EnemyType,
  Boss,
  PowerUpType,
  Vec2,
  ChatMessage,
  ChatMessageType,
} from "./types";
import * as C from "./constants";
import { getEnemyConfig, playerHasPowerUp } from "./entities";
import { getPlayerRadius, getShootCooldown, getReloadTime, getPlayerSpeed, getMagazineSize } from "./scaling";

// ---- Starfield ----
interface Star {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  phase: number;
  hue: number;
  layer: "small" | "medium" | "large";
}

let starsGenerated = false;
let stars: Star[] = [];

// ---- Player smoke trail ----
interface TrailPoint {
  x: number;
  y: number;
  time: number;
  // drift offsets for organic dispersion
  dx: number;
  dy: number;
}
const playerTrails = new Map<string, TrailPoint[]>();
let lastTrailSample = 0;

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
      layer: "small",
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
      layer: "medium",
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
      layer: "large",
    });
  }
}

function getParallax(layer: Star["layer"]): number {
  switch (layer) {
    case "small":
      return C.STARS_PARALLAX_SMALL;
    case "medium":
      return C.STARS_PARALLAX_MEDIUM;
    case "large":
      return C.STARS_PARALLAX_LARGE;
  }
}

function drawStarfield(ctx: CanvasRenderingContext2D, camX: number, camY: number, vw: number, vh: number, now: number) {
  generateStars();

  if (
  !Number.isFinite(camX) ||
  !Number.isFinite(camY) ||
  !Number.isFinite(vw) ||
  !Number.isFinite(vh) ||
  !Number.isFinite(now)
) {
  console.log("[renderer] invalid drawStarfield inputs", {
    camX,
    camY,
    vw,
    vh,
    now,
  });
  return;
}

  // Background gradient
  const cx = vw / 2;
  const cy = vh / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(maxR)) {
    console.log("[renderer] invalid bg gradient", { cx, cy, maxR, vw, vh });
    return;
  }
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  bgGrad.addColorStop(0, C.BG_GRADIENT_CENTER);
  bgGrad.addColorStop(1, C.BG_GRADIENT_EDGE);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, vw, vh);

  // Subtle nebula patches (2 fixed positions, parallax-shifted)
  const nebulaPositions = [
    { x: C.WORLD_WIDTH * 0.3, y: C.WORLD_HEIGHT * 0.25, r: 400 },
    { x: C.WORLD_WIDTH * 0.7, y: C.WORLD_HEIGHT * 0.7, r: 350 },
  ];
  for (const nb of nebulaPositions) {
    const sx = nb.x - camX * 0.1;
    const sy = nb.y - camY * 0.1;
    if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(nb.r)) {
      console.log("[renderer] invalid nebula gradient", {
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

  // Stars
  const timeSec = now / 1000;
  for (const star of stars) {
    const p = getParallax(star.layer);
    const sx = star.x - camX * p;
    const sy = star.y - camY * p;

    // Cull off-screen
    if (sx < -20 || sx > vw + 20 || sy < -20 || sy > vh + 20) continue;

    const pulse = 0.7 + 0.3 * Math.sin(timeSec * C.STARS_GLOW_PULSE_SPEED + star.phase);
    const alpha = star.brightness * pulse;

    if (star.layer === "large") {
      // Glow
      const glowR = C.STARS_GLOW_RADIUS * pulse;
      if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(glowR)) {
        console.log("[renderer] invalid star glow gradient", {
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

export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
  now: number,
  chatting: boolean = false,
  chatInput: string = "",
) {
  const localPlayer = state.players.get(localPlayerId);
  if (!localPlayer) return;

  const camX = localPlayer.pos.x - canvasWidth / 2;
  const camY = localPlayer.pos.y - canvasHeight / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw starfield background (screen-space, parallax applied internally)
  drawStarfield(ctx, camX, camY, canvasWidth, canvasHeight, now);

  ctx.save();
  ctx.translate(-camX, -camY);

  drawGrid(ctx, camX, camY, canvasWidth, canvasHeight);

  drawWorldBorder(ctx, state.worldWidth, state.worldHeight, camX, camY, canvasWidth, canvasHeight);

  // Collectibles
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

  // Dropped points
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
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Value label
    ctx.font = '9px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = C.COLORS.droppedPoints;
    ctx.fillText(`${dp.value}`, dp.pos.x, dp.pos.y - C.DROPPED_POINTS_SIZE);
  }

  // Health pickups
  for (const hp of state.healthPickups) {
    const pulse = 1 + 0.1 * Math.sin(hp.pulsePhase);
    ctx.save();
    ctx.translate(hp.pos.x, hp.pos.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = C.COLORS.healthPickup;
    ctx.shadowColor = C.COLORS.healthPickup;
    ctx.shadowBlur = 14;
    const s = C.HEALTH_PICKUP_SIZE / 2;
    // Cross shape
    const t = s * 0.35;
    ctx.fillRect(-t, -s, t * 2, s * 2);
    ctx.fillRect(-s, -t, s * 2, t * 2);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Power-up items
  for (const pu of state.powerUpItems) {
    drawPowerUpItem(ctx, pu.pos.x, pu.pos.y, pu.type, pu.pulsePhase, now);
  }

  // Enemies
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy, now);
  }

  // Bosses
  for (const boss of state.bosses) {
    drawBoss(ctx, boss, now);
  }

  // Explosions
  for (const exp of state.explosions) {
    const age = now - exp.createdAt;
    if (age < 0) continue; // Skip if timestamp is in the future (clock mismatch)
    const progress = Math.min(Math.max(age / C.ENEMY_EXPLODER_EXPLOSION_DURATION_MS, 0), 1);
    const currentRadius = Math.max(exp.radius * progress, 0.01);
    const alpha = 0.6 * (1 - progress);

    ctx.save();
    ctx.translate(exp.pos.x, exp.pos.y);

    // Outer expanding ring
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(45, 100%, 60%, ${alpha})`;
    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.stroke();

    // Inner filled glow
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
    grad.addColorStop(0, `hsla(40, 100%, 70%, ${alpha * 0.5})`);
    grad.addColorStop(0.5, `hsla(25, 100%, 55%, ${alpha * 0.3})`);
    grad.addColorStop(1, `hsla(10, 100%, 45%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Danger zone border (shows exact AoE radius at full expansion)
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

  // Death particles
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
    ctx.fillRect(-C.PROJECTILE_LENGTH / 2, -C.PROJECTILE_WIDTH / 2, C.PROJECTILE_LENGTH, C.PROJECTILE_WIDTH);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Sample & draw player smoke trails
  if (now - lastTrailSample > C.TRAIL_SAMPLE_INTERVAL_MS) {
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
      // Random drift direction for organic dispersion
      const da = Math.random() * Math.PI * 2;
      trail.push({
        x: player.pos.x,
        y: player.pos.y,
        time: now,
        dx: Math.cos(da),
        dy: Math.sin(da),
      });
      // Remove old points by lifetime
      while (trail.length > 0 && now - trail[0].time > C.TRAIL_LIFETIME_MS) trail.shift();
      if (trail.length > C.TRAIL_MAX_POINTS) trail.shift();
    }
    for (const id of playerTrails.keys()) {
      if (!state.players.has(id)) playerTrails.delete(id);
    }
  }

  // Draw smoke trails (age-based dispersion)
  for (const [id, trail] of playerTrails) {
    const player = state.players.get(id);
    if (!player || player.health <= 0 || trail.length < 2) continue;
    const hslMatch = player.color.match(/hsl\(([^)]+)\)/);
    const hslInner = hslMatch ? hslMatch[1] : "210, 100%, 70%";
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = (now - p.time) / C.TRAIL_LIFETIME_MS; // 0 = fresh, 1 = expired
      if (age >= 1) continue;
      const alpha = C.TRAIL_MAX_OPACITY * (1 - age) * (1 - age); // quadratic fade
      const radius = C.TRAIL_PARTICLE_RADIUS + age * C.TRAIL_PARTICLE_RADIUS * C.TRAIL_RADIUS_GROWTH;
      // Drift outward over time
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

  // Players
  for (const [id, player] of state.players) {
    if (player.health <= 0) continue;
    const isLocal = id === localPlayerId;
    const color = player.color;

    // Draw power-up aura rings
    drawPowerUpAura(ctx, player, now);

    if (now < player.invincibleUntil) {
      const flash = Math.sin(now * 0.03) > 0;
      if (!flash) {
        drawPlayer(ctx, player, "hsla(0, 0%, 100%, 0.8)");
        drawPlayerName(ctx, player, color);
        continue;
      }
    }
    drawPlayer(ctx, player, color);
    drawPlayerName(ctx, player, color);
  }

  ctx.restore();

  // HUD
  drawHUD(ctx, localPlayer, canvasWidth, canvasHeight, now, state.enemies.length);
  drawTimer(ctx, state, canvasWidth, now);
  drawScoreboard(ctx, state, localPlayerId, canvasWidth, canvasHeight);
  drawMinimap(ctx, state, localPlayerId, canvasWidth, canvasHeight);
  drawChat(ctx, state.chatMessages, canvasWidth, canvasHeight, now, chatting, chatInput);
  drawControlsHelp(ctx);
  drawBossHUD(ctx, state, canvasWidth, canvasHeight, now);

  // Damage vignette
  if (now < localPlayer.invincibleUntil && now - (localPlayer.invincibleUntil - C.PLAYER_INVINCIBLE_MS) < 50) {
    ctx.fillStyle = "hsla(0, 100%, 50%, 0.15)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Death overlay (only during active round)
  if (localPlayer.health <= 0 && !state.roundOver) {
    ctx.fillStyle = "hsla(0, 0%, 0%, 0.7)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = C.COLORS.hudText;
    ctx.font = '48px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvasWidth / 2, canvasHeight / 2 - 30);
    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillText(`SCORE: ${localPlayer.score}`, canvasWidth / 2, canvasHeight / 2 + 20);
    ctx.fillText("Press F to respawn", canvasWidth / 2, canvasHeight / 2 + 60);
  }

  // Round over overlay
  if (state.roundOver) {
    drawRoundOverScreen(ctx, state, localPlayerId, canvasWidth, canvasHeight, now);
  }
}

function getPowerUpColor(type: PowerUpType): string {
  switch (type) {
    case "speed":
      return C.POWERUP_SPEED_COLOR;
    case "rapid_fire":
      return C.POWERUP_RAPID_FIRE_COLOR;
    case "shield":
      return C.POWERUP_SHIELD_COLOR;
  }
}

function getPowerUpLabel(type: PowerUpType): string {
  switch (type) {
    case "speed":
      return "⚡";
    case "rapid_fire":
      return "🔥";
    case "shield":
      return "🛡";
  }
}

function drawPowerUpItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: PowerUpType,
  pulsePhase: number,
  now: number,
) {
  const color = getPowerUpColor(type);
  const pulse = 1 + 0.2 * Math.sin(pulsePhase);
  const s = C.POWERUP_SIZE / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);

  // Outer glow
  const grad = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 2);
  grad.addColorStop(0, color.replace(")", ", 0.3)").replace("hsl(", "hsla("));
  grad.addColorStop(1, color.replace(")", ", 0)").replace("hsl(", "hsla("));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, s * 2, 0, Math.PI * 2);
  ctx.fill();

  // Main shape — hexagonal
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = Math.cos(a) * s;
    const py = Math.sin(a) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Icon
  ctx.font = `${Math.round(s)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getPowerUpLabel(type), 0, 1);

  ctx.restore();

  // Label below
  ctx.font = '9px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(type.replace("_", " ").toUpperCase(), x, y + s + 14);
}

function drawPowerUpAura(ctx: CanvasRenderingContext2D, player: Player, now: number) {
  if (player.activePowerUps.length === 0) return;
  const r = getPlayerRadius(player.score);

  for (let i = 0; i < player.activePowerUps.length; i++) {
    const pu = player.activePowerUps[i];
    if (now >= pu.expiresAt) continue;
    const color = getPowerUpColor(pu.type as PowerUpType);
    const remaining = pu.expiresAt - now;
    const blinkRate = remaining < 2000 ? 0.015 : 0.005;
    const alpha = remaining < 2000 ? 0.2 + 0.15 * Math.sin(now * blinkRate * Math.PI * 2) : 0.3;
    const auraR = r + 8 + i * 6;

    // Rotating dashed ring
    ctx.save();
    ctx.translate(player.pos.x, player.pos.y);
    ctx.rotate(now * 0.001 * (i % 2 === 0 ? 1 : -1));
    ctx.beginPath();
    ctx.arc(0, 0, auraR, 0, Math.PI * 2);
    ctx.strokeStyle = color.replace(")", `, ${alpha})`).replace("hsl(", "hsla(");
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Subtle radial glow
    const grad = ctx.createRadialGradient(player.pos.x, player.pos.y, r, player.pos.x, player.pos.y, auraR + 4);
    grad.addColorStop(0, color.replace(")", `, ${alpha * 0.3})`).replace("hsl(", "hsla("));
    grad.addColorStop(1, color.replace(")", ", 0)").replace("hsl(", "hsla("));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.pos.x, player.pos.y, auraR + 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, color: string) {
  const { pos, aimAngle, skin } = player;
  const r = getPlayerRadius(player.score);

  ctx.save();
  ctx.translate(pos.x, pos.y);

  // Draw body based on skin
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  switch (skin) {
    case "diamond":
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r, 0);
      ctx.closePath();
      ctx.stroke();
      break;
    case "hexagon":
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
    case "star":
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
    default: // circle
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }

  ctx.shadowBlur = 0;

  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();

  // Aim indicator (triangle)
  const tipX = pos.x + Math.cos(aimAngle) * (r + 8);
  const tipY = pos.y + Math.sin(aimAngle) * (r + 8);
  const baseL_X = pos.x + Math.cos(aimAngle + 0.4) * r;
  const baseL_Y = pos.y + Math.sin(aimAngle + 0.4) * r;
  const baseR_X = pos.x + Math.cos(aimAngle - 0.4) * r;
  const baseR_Y = pos.y + Math.sin(aimAngle - 0.4) * r;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseL_X, baseL_Y);
  ctx.lineTo(baseR_X, baseR_Y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPlayerName(ctx: CanvasRenderingContext2D, player: Player, color: string) {
  const r = getPlayerRadius(player.score);
  const name = player.name || player.id;
  const nameY = player.pos.y - r - 18;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.7)";
  ctx.lineWidth = 3;
  ctx.strokeText(name, player.pos.x, nameY);
  ctx.fillText(name, player.pos.x, nameY);
  const barW = 32;
  const barH = 4;
  const barX = player.pos.x - barW / 2;
  const barY = nameY + 3;
  const healthFrac = player.health / player.maxHealth;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = healthFrac > 0.3 ? color : C.COLORS.playerDamage;
  ctx.fillRect(barX, barY, barW * healthFrac, barH);
}

function getEnemyColors(type: EnemyType, isAggressive: boolean): { fill: string; glow: string } {
  switch (type) {
    case "fast":
      return {
        fill: isAggressive ? C.ENEMY_FAST_COLOR_AGGRESSIVE : C.ENEMY_FAST_COLOR_PASSIVE,
        glow: C.ENEMY_FAST_COLOR_AGGRESSIVE,
      };
    case "tank":
      return {
        fill: isAggressive ? C.ENEMY_TANK_COLOR_AGGRESSIVE : C.ENEMY_TANK_COLOR_PASSIVE,
        glow: C.ENEMY_TANK_COLOR_AGGRESSIVE,
      };
    case "exploder":
      return {
        fill: isAggressive ? C.ENEMY_EXPLODER_COLOR_AGGRESSIVE : C.ENEMY_EXPLODER_COLOR_PASSIVE,
        glow: C.ENEMY_EXPLODER_COLOR_AGGRESSIVE,
      };
    default:
      return {
        fill: isAggressive ? C.ENEMY_NORMAL_COLOR_AGGRESSIVE : C.ENEMY_NORMAL_COLOR_PASSIVE,
        glow: C.ENEMY_NORMAL_COLOR_AGGRESSIVE,
      };
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, now: number) {
  const cfg = getEnemyConfig(enemy.type);
  const isAggressive = enemy.state === "aggressive";
  const glitching = false;
  const colors = getEnemyColors(enemy.type, isAggressive);
  const hs = cfg.size / 2;

  ctx.save();
  ctx.translate(enemy.pos.x, enemy.pos.y);
  if (glitching) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);

  ctx.fillStyle = colors.fill;
  if (isAggressive) {
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 8;
  }

  switch (enemy.type) {
    case "fast":
      // Triangle shape
      ctx.beginPath();
      ctx.moveTo(0, -hs);
      ctx.lineTo(hs, hs);
      ctx.lineTo(-hs, hs);
      ctx.closePath();
      ctx.fill();
      break;
    case "tank":
      // Rounded square (big)
      ctx.beginPath();
      const r = 6;
      ctx.moveTo(-hs + r, -hs);
      ctx.lineTo(hs - r, -hs);
      ctx.quadraticCurveTo(hs, -hs, hs, -hs + r);
      ctx.lineTo(hs, hs - r);
      ctx.quadraticCurveTo(hs, hs, hs - r, hs);
      ctx.lineTo(-hs + r, hs);
      ctx.quadraticCurveTo(-hs, hs, -hs, hs - r);
      ctx.lineTo(-hs, -hs + r);
      ctx.quadraticCurveTo(-hs, -hs, -hs + r, -hs);
      ctx.closePath();
      ctx.fill();
      // Inner cross for tank look
      ctx.strokeStyle = `hsla(0, 0%, 0%, 0.3)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hs * 0.4, 0);
      ctx.lineTo(hs * 0.4, 0);
      ctx.moveTo(0, -hs * 0.4);
      ctx.lineTo(0, hs * 0.4);
      ctx.stroke();
      break;
    case "exploder":
      // Spiky circle
      const spikes = 6;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? hs : hs * 0.55;
        const px = Math.cos(angle) * rad;
        const py = Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    default: // normal — square
      ctx.fillRect(-hs, -hs, cfg.size, cfg.size);
      break;
  }
  ctx.shadowBlur = 0;

  // Health bar for multi-hit enemies
  if (enemy.maxHealth > 1 && enemy.health > 0) {
    const barW = cfg.size;
    const barH = 3;
    const barX = -barW / 2;
    const barY = -hs - 8;
    ctx.fillStyle = "hsla(0, 0%, 0%, 0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = colors.fill;
    ctx.fillRect(barX, barY, barW * (enemy.health / enemy.maxHealth), barH);
  }

  ctx.restore();
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, now: number) {
  // Dispatch to specific boss renderers
  if (boss.definitionId === "leviathan") {
    drawLeviathan(ctx, boss, now);
    return;
  }
  // Default boss render (Sentinel etc.)
  drawDefaultBoss(ctx, boss, now);
}

function drawDefaultBoss(ctx: CanvasRenderingContext2D, boss: Boss, now: number) {
  const hs = boss.size / 2;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  const pulse = 1 + 0.1 * Math.sin(now * 0.003);

  const glowGrad = ctx.createRadialGradient(0, 0, hs * 0.5, 0, 0, hs * 2);
  glowGrad.addColorStop(0, boss.glowColor.replace("hsl(", "hsla(").replace(")", ", 0.3)"));
  glowGrad.addColorStop(1, boss.glowColor.replace("hsl(", "hsla(").replace(")", ", 0)"));
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, hs * 2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = boss.color;
  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    const px = Math.cos(a) * hs;
    const py = Math.sin(a) * hs;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = `hsla(0, 0%, 0%, 0.4)`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-hs * 0.35, 0);
  ctx.lineTo(hs * 0.35, 0);
  ctx.moveTo(0, -hs * 0.35);
  ctx.lineTo(0, hs * 0.35);
  ctx.stroke();

  ctx.strokeStyle = "hsla(0, 0%, 100%, 0.4)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    const px = Math.cos(a) * hs;
    const py = Math.sin(a) * hs;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
  drawBossOverhead(ctx, boss);
}

function drawLeviathan(ctx: CanvasRenderingContext2D, boss: Boss, now: number) {
  const hs = boss.size / 2;
  const timeSec = now / 1000;
  const rotation = timeSec * C.LEVIATHAN_ROTATION_SPEED;
  const breathe = 1 + 0.06 * Math.sin(timeSec * 1.5);
  const healthFrac = boss.health / boss.maxHealth;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  // === Shockwave charge indicator ===
  const def = C.BOSS_REGISTRY.find(d => d.id === "leviathan");
  if (def && def.shockwaveRadius > 0) {
    const sinceLast = now - boss.lastShockwave;
    const cooldownFrac = Math.min(sinceLast / def.shockwaveCooldownMs, 1);
    if (cooldownFrac > 0.7 && cooldownFrac < 1) {
      // Charging warning ring
      const chargeAlpha = 0.15 + 0.2 * Math.sin(now * 0.015);
      ctx.beginPath();
      ctx.arc(0, 0, def.shockwaveTriggerRange, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(0, 100%, 60%, ${chargeAlpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Shockwave flash
    if (sinceLast < C.BOSS_SHOCKWAVE_DURATION_MS) {
      const progress = sinceLast / C.BOSS_SHOCKWAVE_DURATION_MS;
      const waveRadius = def.shockwaveRadius * progress;
      const waveAlpha = 0.6 * (1 - progress);
      const waveGrad = ctx.createRadialGradient(0, 0, waveRadius * 0.5, 0, 0, waveRadius);
      waveGrad.addColorStop(0, `hsla(175, 100%, 70%, ${waveAlpha * 0.3})`);
      waveGrad.addColorStop(0.7, `hsla(195, 100%, 50%, ${waveAlpha * 0.5})`);
      waveGrad.addColorStop(1, `hsla(220, 100%, 40%, 0)`);
      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.fill();
      // Ring edge
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(175, 100%, 80%, ${waveAlpha})`;
      ctx.lineWidth = 3 * (1 - progress) + 1;
      ctx.stroke();
    }
  }

  // === Deep outer aura ===
  const auraSize = hs * 2.5 * breathe;
  const auraGrad = ctx.createRadialGradient(0, 0, hs * 0.3, 0, 0, auraSize);
  auraGrad.addColorStop(0, `hsla(195, 100%, 40%, 0.15)`);
  auraGrad.addColorStop(0.5, `hsla(210, 80%, 25%, 0.08)`);
  auraGrad.addColorStop(1, `hsla(220, 60%, 15%, 0)`);
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
  ctx.fill();

  // === Tentacles ===
  const tentacleCount = C.LEVIATHAN_TENTACLE_COUNT;
  const tentacleLen = hs * C.LEVIATHAN_TENTACLE_LENGTH;
  for (let i = 0; i < tentacleCount; i++) {
    const baseAngle = rotation + (i / tentacleCount) * Math.PI * 2;
    const wave1 = Math.sin(timeSec * 2.5 + i * 1.3) * 0.25;
    const wave2 = Math.sin(timeSec * 1.8 + i * 0.9) * 0.15;
    const angle = baseAngle + wave1;

    const startX = Math.cos(angle) * hs * 0.6;
    const startY = Math.sin(angle) * hs * 0.6;
    const midAngle = angle + wave2;
    const midX = Math.cos(midAngle) * (hs * 0.6 + tentacleLen * 0.5);
    const midY = Math.sin(midAngle) * (hs * 0.6 + tentacleLen * 0.5);
    const endAngle = angle + wave1 * 1.5 + wave2;
    const endX = Math.cos(endAngle) * (hs * 0.6 + tentacleLen);
    const endY = Math.sin(endAngle) * (hs * 0.6 + tentacleLen);

    // Tentacle glow
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.strokeStyle = `hsla(175, 100%, 55%, 0.15)`;
    ctx.lineWidth = 10;
    ctx.stroke();

    // Tentacle body
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    const tentGrad = ctx.createLinearGradient(startX, startY, endX, endY);
    tentGrad.addColorStop(0, `hsla(195, 85%, 30%, 0.9)`);
    tentGrad.addColorStop(1, `hsla(175, 100%, 45%, 0.3)`);
    ctx.strokeStyle = tentGrad;
    ctx.lineWidth = 5 - (i % 2);
    ctx.lineCap = "round";
    ctx.stroke();

    // Tip glow dot
    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(175, 100%, 70%, ${0.5 + 0.3 * Math.sin(timeSec * 4 + i)})`;
    ctx.fill();
  }

  // === Main body — organic blob ===
  ctx.save();
  ctx.scale(breathe, breathe);

  // Body glow
  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 30;

  // Draw body as morphing circle
  ctx.beginPath();
  const bodyPoints = 32;
  for (let i = 0; i < bodyPoints; i++) {
    const a = (i / bodyPoints) * Math.PI * 2;
    const warp = 1 + 0.08 * Math.sin(a * 3 + timeSec * 2) + 0.05 * Math.sin(a * 5 - timeSec * 3);
    const r = hs * 0.55 * warp;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Body gradient — deep sea colors
  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.55);
  bodyGrad.addColorStop(0, `hsl(200, 60%, 20%)`);
  bodyGrad.addColorStop(0.6, boss.color);
  bodyGrad.addColorStop(1, `hsl(210, 70%, 15%)`);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Body edge highlight
  ctx.strokeStyle = `hsla(175, 100%, 50%, 0.5)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // === Central eye ===
  const eyeSize = hs * 0.2;
  // Eye white
  const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize);
  eyeGrad.addColorStop(0, `hsl(175, 100%, 90%)`);
  eyeGrad.addColorStop(0.5, `hsl(175, 80%, 70%)`);
  eyeGrad.addColorStop(1, `hsl(195, 60%, 40%)`);
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupil — tracks closest player direction
  const pupilSize = eyeSize * 0.5;
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  if (boss.targetPlayerId) {
    const lookAngle = Math.atan2(boss.vel.y, boss.vel.x);
    pupilOffsetX = Math.cos(lookAngle) * eyeSize * 0.3;
    pupilOffsetY = Math.sin(lookAngle) * eyeSize * 0.3;
  }
  ctx.fillStyle = `hsl(220, 90%, 10%)`;
  ctx.beginPath();
  ctx.arc(pupilOffsetX, pupilOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.fill();
  // Pupil highlight
  ctx.fillStyle = `hsla(175, 100%, 90%, 0.8)`;
  ctx.beginPath();
  ctx.arc(pupilOffsetX - pupilSize * 0.3, pupilOffsetY - pupilSize * 0.3, pupilSize * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Health-based rage effect — pulsing red veins when low HP
  if (healthFrac < 0.4) {
    const rageAlpha = 0.3 + 0.2 * Math.sin(now * 0.01);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + timeSec * 0.5;
      const veinLen = hs * 0.4;
      ctx.beginPath();
      ctx.moveTo(eyeSize * 0.8 * Math.cos(a), eyeSize * 0.8 * Math.sin(a));
      const midA = a + Math.sin(timeSec * 3 + i) * 0.3;
      ctx.quadraticCurveTo(
        Math.cos(midA) * veinLen * 0.6, Math.sin(midA) * veinLen * 0.6,
        Math.cos(a) * veinLen, Math.sin(a) * veinLen
      );
      ctx.strokeStyle = `hsla(0, 100%, 50%, ${rageAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore(); // scale

  ctx.restore(); // translate

  drawBossOverhead(ctx, boss);
}

function drawBossOverhead(ctx: CanvasRenderingContext2D, boss: Boss) {
  const hs = boss.size / 2;
  // Name above boss
  ctx.font = 'bold 14px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
  ctx.lineWidth = 4;
  ctx.strokeText(boss.name, boss.pos.x, boss.pos.y - hs - 18);
  ctx.fillStyle = boss.glowColor;
  ctx.fillText(boss.name, boss.pos.x, boss.pos.y - hs - 18);

  // Health bar above boss
  const barW = boss.size * 1.5;
  const barH = 6;
  const barX = boss.pos.x - barW / 2;
  const barY = boss.pos.y - hs - 14;
  const healthFrac = boss.health / boss.maxHealth;
  ctx.fillStyle = "hsla(0, 0%, 0%, 0.6)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = healthFrac > 0.3 ? boss.color : "hsl(0, 100%, 60%)";
  ctx.fillRect(barX, barY, barW * healthFrac, barH);
  ctx.strokeStyle = "hsla(0, 0%, 100%, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.textBaseline = "alphabetic";
}

function drawBossHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  now: number,
) {
  const cx = canvasWidth / 2;

  // Boss health bars at top of screen
  for (let i = 0; i < state.bosses.length; i++) {
    const boss = state.bosses[i];
    const barW = C.BOSS_HUD_BAR_WIDTH;
    const barH = C.BOSS_HUD_BAR_HEIGHT;
    const barX = cx - barW / 2;
    const barY = C.BOSS_HUD_BAR_Y + i * (barH + 28);
    const healthFrac = boss.health / boss.maxHealth;

    // Boss name
    ctx.font = 'bold 13px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = boss.glowColor;
    ctx.shadowColor = boss.glowColor;
    ctx.shadowBlur = 6;
    ctx.fillText(`👹 ${boss.name}`, cx, barY - 4);
    ctx.shadowBlur = 0;

    // Bar background
    ctx.fillStyle = "hsla(0, 0%, 10%, 0.8)";
    ctx.fillRect(barX, barY, barW, barH);

    // Health fill
    const healthColor = healthFrac > 0.3 ? boss.color : "hsl(0, 100%, 55%)";
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barW * healthFrac, barH);

    // Border
    ctx.strokeStyle = boss.glowColor.replace("hsl(", "hsla(").replace(")", ", 0.6)");
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);

    // HP text
    ctx.font = '10px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = "hsla(0, 0%, 95%, 0.9)";
    ctx.fillText(`${boss.health} / ${boss.maxHealth}`, cx, barY + barH - 3);
  }

  // Boss spawn warning banner
  for (const evt of state.bossSpawnEvents) {
    if (evt.spawned) continue;
    const elapsed = now - evt.warningStartedAt;
    const remaining = Math.max(0, C.BOSS_SPAWN_WARNING_MS - elapsed);
    if (remaining <= 0) continue;

    const alpha = 0.6 + 0.3 * Math.sin(now * 0.008);
    ctx.font = 'bold 22px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = `hsla(0, 100%, 65%, ${alpha})`;
    ctx.shadowColor = "hsla(0, 100%, 50%, 0.5)";
    ctx.shadowBlur = 12;
    const warnY = canvasHeight * 0.25;
    ctx.fillText(`⚠ ${evt.bossName} INCOMING ⚠`, cx, warnY);
    ctx.font = 'bold 18px "Roboto Mono", monospace';
    ctx.fillText(`${(remaining / 1000).toFixed(1)}s`, cx, warnY + 30);
    ctx.shadowBlur = 0;
  }

  // Boss defeat banner
  for (const evt of state.bossDefeatEvents) {
    const age = now - evt.timestamp;
    if (age > C.BOSS_DEFEAT_BANNER_MS) continue;
    const alpha =
      age < C.BOSS_DEFEAT_BANNER_MS - 1500 ? 1 : Math.max(0, 1 - (age - (C.BOSS_DEFEAT_BANNER_MS - 1500)) / 1500);

    ctx.font = 'bold 24px "Roboto Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillStyle = `hsla(45, 100%, 65%, ${alpha})`;
    ctx.shadowColor = `hsla(45, 100%, 50%, ${alpha * 0.5})`;
    ctx.shadowBlur = 10;
    const defeatY = canvasHeight * 0.3;
    ctx.fillText(`🏆 ${evt.bossName} DEFEATED`, cx, defeatY);
    ctx.font = '16px "Roboto Mono", monospace';
    ctx.fillStyle = `hsla(45, 100%, 80%, ${alpha * 0.9})`;
    ctx.fillText(`by ${evt.killerName}`, cx, defeatY + 28);
    ctx.shadowBlur = 0;
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, camX: number, camY: number, w: number, h: number) {
  ctx.strokeStyle = C.COLORS.grid;
  ctx.lineWidth = C.GRID_LINE_WIDTH;
  const startX = Math.floor(camX / C.GRID_SIZE) * C.GRID_SIZE;
  const startY = Math.floor(camY / C.GRID_SIZE) * C.GRID_SIZE;
  ctx.beginPath();
  for (let x = startX; x < camX + w + C.GRID_SIZE; x += C.GRID_SIZE) {
    ctx.moveTo(x, camY);
    ctx.lineTo(x, camY + h);
  }
  for (let y = startY; y < camY + h + C.GRID_SIZE; y += C.GRID_SIZE) {
    ctx.moveTo(camX, y);
    ctx.lineTo(camX + w, y);
  }
  ctx.stroke();
}

function drawWorldBorder(
  ctx: CanvasRenderingContext2D,
  ww: number,
  wh: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
) {
  // Solid border line
  ctx.strokeStyle = C.BORDER_COLOR;
  ctx.lineWidth = C.BORDER_LINE_WIDTH;
  ctx.strokeRect(0, 0, ww, wh);

  // Inner glow gradients on each visible edge
  const gw = C.BORDER_GLOW_WIDTH;
  const maxA = C.BORDER_GLOW_OPACITY;
  const hsl = C.BORDER_GLOW_COLOR;

  // Left edge
  if (camX < gw) {
    const grad = ctx.createLinearGradient(0, 0, gw, 0);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.max(0, camY), gw, Math.min(wh, camY + vh) - Math.max(0, camY));
  }
  // Right edge
  if (camX + vw > ww - gw) {
    const grad = ctx.createLinearGradient(ww, 0, ww - gw, 0);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(ww - gw, Math.max(0, camY), gw, Math.min(wh, camY + vh) - Math.max(0, camY));
  }
  // Top edge
  if (camY < gw) {
    const grad = ctx.createLinearGradient(0, 0, 0, gw);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.max(0, camX), 0, Math.min(ww, camX + vw) - Math.max(0, camX), gw);
  }
  // Bottom edge
  if (camY + vh > wh - gw) {
    const grad = ctx.createLinearGradient(0, wh, 0, wh - gw);
    grad.addColorStop(0, `hsla(${hsl}, ${maxA})`);
    grad.addColorStop(1, `hsla(${hsl}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.max(0, camX), wh - gw, Math.min(ww, camX + vw) - Math.max(0, camX), gw);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, player: Player, w: number, h: number, now: number, enemyCount: number) {
  // Health bar
  const hbX = C.UI_HEALTH_X;
  const hbY = h - C.UI_HEALTH_BOTTOM;
  const hbW = 160;
  const hbH = 20;
  ctx.strokeStyle = C.COLORS.grid;
  ctx.lineWidth = 2;
  ctx.strokeRect(hbX, hbY, hbW, hbH);
  const healthFrac = player.health / player.maxHealth;
  ctx.fillStyle = healthFrac > 0.3 ? player.color : C.COLORS.playerDamage;
  ctx.fillRect(hbX, hbY, hbW * healthFrac, hbH);
  ctx.fillStyle = C.COLORS.hudText;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillText("HEALTH", hbX, hbY - 6);

  // Score
  ctx.font = '24px "Roboto Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = C.COLORS.hudText;
  ctx.shadowColor = "hsla(210, 100%, 70%, 0.5)";
  ctx.shadowBlur = 8;
  ctx.fillText(`SCORE: ${player.score}`, w - C.UI_SCORE_RIGHT, C.UI_SCORE_TOP);
  ctx.shadowBlur = 0;

  // Enemy count
  ctx.font = '13px "Roboto Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = "hsla(240, 10%, 65%, 0.8)";
  ctx.fillText(`☠ ENEMIES: ${enemyCount}`, w - C.UI_SCORE_RIGHT, C.UI_SCORE_TOP + 22);

  // Ammo indicator
  const ammoY = hbY - C.UI_AMMO_OFFSET_ABOVE_HEALTH;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillStyle = C.COLORS.hudText;

  
  const reloadTime = getReloadTime(player.score);
  const currentTime = Date.now();
  const isReloading = player.reloadingUntil > currentTime;

  if (isReloading) {
    const reloadProgress = 1 - (player.reloadingUntil - currentTime) / reloadTime;

    ctx.fillText("RELOADING", hbX, ammoY);
    ctx.strokeStyle = C.COLORS.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(hbX + 80, ammoY - 10, 60, 10);
    ctx.fillStyle = C.COLORS.projectile;
    ctx.fillRect(hbX + 80, ammoY - 10, 60 * Math.max(0, Math.min(1, reloadProgress)), 10);
  } else {
    const magSize = getMagazineSize(player.score);
    ctx.fillText("AMMO", hbX, ammoY);
    for (let i = 0; i < magSize; i++) {
      const pipX = hbX + 50 + i * 14;
      const pipY = ammoY - 10;
      if (i < player.ammo) {
        ctx.fillStyle = C.COLORS.projectile;
        ctx.fillRect(pipX, pipY, 10, 10);
      } else {
        ctx.strokeStyle = "hsla(240, 10%, 30%, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(pipX, pipY, 10, 10);
      }
    }
  }

  // Dash cooldown
  const dashY = ammoY - C.UI_DASH_OFFSET_ABOVE_AMMO;
  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "left";
  const dashCooldownLeft = Math.max(0, player.lastDash + C.DASH_COOLDOWN_MS - now);
  if (dashCooldownLeft > 0) {
    ctx.fillStyle = "hsla(240, 10%, 50%, 0.6)";
    ctx.fillText(`DASH  ${(dashCooldownLeft / 1000).toFixed(1)}s`, hbX, dashY);
  } else {
    ctx.fillStyle = player.color;
    ctx.fillText("DASH  READY", hbX, dashY);
  }

  // Active power-ups indicator
  const activePUs = player.activePowerUps.filter((pu) => now < pu.expiresAt);
  if (activePUs.length > 0) {
    const puY = dashY - 28;
    ctx.font = '11px "Roboto Mono", monospace';
    ctx.textAlign = "left";
    for (let i = 0; i < activePUs.length; i++) {
      const pu = activePUs[i];
      const color = getPowerUpColor(pu.type as PowerUpType);
      const remaining = Math.max(0, (pu.expiresAt - now) / 1000);
      const label = pu.type.replace("_", " ").toUpperCase();
      const icon = getPowerUpLabel(pu.type as PowerUpType);
      const blink = remaining < 2 ? (Math.sin(now * 0.01) > 0 ? 1 : 0.3) : 1;
      ctx.globalAlpha = blink;
      ctx.fillStyle = color;
      ctx.fillText(`${icon} ${label}  ${remaining.toFixed(1)}s`, hbX, puY - i * 18);
      ctx.globalAlpha = 1;
    }
  }

  // Stats panel
  drawStatsPanel(ctx, player, h);
}

function drawStatsPanel(ctx: CanvasRenderingContext2D, player: Player, canvasHeight: number) {
  const score = player.score;
  const atkSpeed = getShootCooldown(score);
  const reload = getReloadTime(score);
  const radius = getPlayerRadius(score);
  const speed = getPlayerSpeed(score);
  const dashCd = (C.DASH_COOLDOWN_MS / 1000).toFixed(1);
  const magSize = getMagazineSize(score);

  const x = C.UI_STATS_X;
  const lineH = 20;
  const panelH = lineH * 7 + 12;

  let y = canvasHeight - C.UI_HEALTH_BOTTOM - C.UI_STATS_GAP_ABOVE_BOTTOM_UI - panelH + 16;

  ctx.fillStyle = "hsla(233, 47%, 4%, 0.75)";
  ctx.fillRect(x - 8, y - 16, 170, panelH);
  ctx.strokeStyle = "hsla(240, 10%, 40%, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 8, y - 16, 170, panelH);

  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillStyle = "hsla(210, 100%, 70%, 0.9)";
  ctx.fillText("⚡ STATS", x, y);
  y += lineH;

  ctx.strokeStyle = "hsla(240, 10%, 50%, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + 150, y - 8);
  ctx.stroke();

  const stats = [
    { label: "ATK SPD", value: `${Math.round(atkSpeed)}ms` },
    { label: "RELOAD", value: `${(reload / 1000).toFixed(2)}s` },
    { label: "AMMO", value: `${magSize}` },
    { label: "DASH CD", value: `${dashCd}s` },
    { label: "SIZE", value: `${radius.toFixed(1)}` },
    { label: "SPEED", value: `${Math.round(speed)}` },
  ];

  for (const stat of stats) {
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.fillStyle = "hsla(240, 10%, 70%, 0.85)";
    ctx.fillText(stat.label, x, y);
    ctx.fillStyle = C.COLORS.hudText;
    ctx.fillText(stat.value, x + 85, y);
    y += lineH;
  }
}

function drawControlsHelp(ctx: CanvasRenderingContext2D) {
  const x = C.UI_CONTROLS_X;
  let y = C.UI_CONTROLS_Y;
  const lineH = C.UI_CONTROLS_LINE_HEIGHT;
  const w = C.UI_CONTROLS_WIDTH;

  const controls = [
    { label: C.UI_CONTROL_MOVE_LABEL, value: C.UI_CONTROL_MOVE_VALUE },
    { label: C.UI_CONTROL_DASH_LABEL, value: C.UI_CONTROL_DASH_VALUE },
    { label: C.UI_CONTROL_AIM_LABEL, value: C.UI_CONTROL_AIM_VALUE },
    { label: C.UI_CONTROL_SHOOT_LABEL, value: C.UI_CONTROL_SHOOT_VALUE },
    { label: C.UI_CONTROL_RELOAD_LABEL, value: C.UI_CONTROL_RELOAD_VALUE },
  ];

  const panelH = lineH * (controls.length + 1) + 20;

  ctx.fillStyle = C.UI_CONTROLS_PANEL_BG;
  ctx.fillRect(x - 8, y - 16, w, panelH);

  ctx.strokeStyle = C.UI_CONTROLS_PANEL_BORDER;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 8, y - 16, w, panelH);

  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "left";
  ctx.fillStyle = C.UI_CONTROLS_TITLE_COLOR;
  ctx.fillText(C.UI_CONTROLS_TITLE, x, y);

  y += lineH;

  ctx.strokeStyle = C.UI_CONTROLS_SEPARATOR_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x + w - 20, y - 8);
  ctx.stroke();

  for (const control of controls) {
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillStyle = C.UI_CONTROLS_LABEL_COLOR;
    ctx.fillText(control.label, x, y);

    ctx.textAlign = "right";
    ctx.fillStyle = C.UI_CONTROLS_VALUE_COLOR;
    ctx.fillText(control.value, x + w - 20, y);

    y += lineH;
  }
}

function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  const players: {
    id: string;
    name: string;
    score: number;
    health: number;
    isLocal: boolean;
    isHost: boolean;
    color: string;
  }[] = [];
  for (const [id, p] of state.players) {
    players.push({
      id,
      name: p.name || p.id,
      score: p.score,
      health: p.health,
      isLocal: id === localPlayerId,
      isHost: id === state.hostId,
      color: p.color,
    });
  }
  players.sort((a, b) => b.score - a.score);

  const x = canvasWidth - C.UI_SCOREBOARD_RIGHT;
  const lineH = 22;
  const panelH = lineH * (players.length + 2) + 20; // +2 for header + room name
  let y = Math.round((canvasHeight - panelH) / 2);

  // Background panel
  ctx.fillStyle = "hsla(233, 47%, 4%, 0.75)";
  ctx.fillRect(x - 180, y - 16, 188, panelH);
  ctx.strokeStyle = "hsla(240, 10%, 40%, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 180, y - 16, 188, panelH);

  // Room name
  ctx.font = '10px "Roboto Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = "hsla(240, 10%, 55%, 0.7)";
  const roomDisplay = state.roomName.length > 20 ? state.roomName.slice(0, 19) + "…" : state.roomName;
  ctx.fillText(`Session: ${roomDisplay}`, x, y);
  y += lineH;

  ctx.font = '12px "Roboto Mono", monospace';
  ctx.textAlign = "right";
  ctx.fillStyle = "hsla(210, 100%, 70%, 0.9)";
  ctx.fillText(`👥 PLAYERS (${players.length})`, x, y);
  y += lineH;

  ctx.strokeStyle = "hsla(240, 10%, 50%, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 170, y - 8);
  ctx.lineTo(x, y - 8);
  ctx.stroke();

  for (const p of players) {
    const alive = p.health > 0;
    ctx.font = '13px "Roboto Mono", monospace';
    ctx.textAlign = "right";
    ctx.fillStyle = alive ? p.color : "hsla(240, 10%, 50%, 0.4)";
    const hostBadge = p.isHost ? "★ " : "";
    const safeName = p.name || "Unknown";
    const displayName = safeName.length > 10 ? safeName.slice(0, 9) + "…" : safeName;
    ctx.fillText(`${hostBadge}${displayName}`, x - 55, y);
    ctx.fillStyle = alive ? p.color : "hsla(240, 10%, 50%, 0.4)";
    ctx.font = 'bold 13px "Roboto Mono", monospace';
    ctx.fillText(`${p.score}`, x, y);
    if (!alive) {
      ctx.fillStyle = "hsla(0, 80%, 60%, 0.6)";
      ctx.font = '11px "Roboto Mono", monospace';
      ctx.fillText("☠", x - 48, y);
    }
    y += lineH;
  }
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
) {
  const mmW = C.UI_MINIMAP_WIDTH;
  const mmH = mmW * (C.WORLD_HEIGHT / C.WORLD_WIDTH);
  const headerH = C.UI_MINIMAP_HEADER_HEIGHT;
  const totalH = mmH + headerH;
  const mmX = canvasWidth - mmW - C.UI_MINIMAP_RIGHT;
  const mmY = canvasHeight - totalH - C.UI_MINIMAP_BOTTOM;
  const mapY = mmY + headerH;
  const scaleX = mmW / C.WORLD_WIDTH;
  const scaleY = mmH / C.WORLD_HEIGHT;
  const r = C.UI_MINIMAP_BORDER_RADIUS;

  // --- Rounded background ---
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(mmX, mmY, mmW, totalH, r);
  ctx.fillStyle = `hsla(${C.UI_MINIMAP_BG_COLOR}, ${C.UI_MINIMAP_BG_OPACITY})`;
  ctx.fill();
  ctx.strokeStyle = C.UI_MINIMAP_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.clip();

  // --- Header bar ---
  ctx.fillStyle = "hsla(210, 30%, 12%, 0.6)";
  ctx.fillRect(mmX, mmY, mmW, headerH);
  // Separator line
  ctx.strokeStyle = C.UI_MINIMAP_BORDER_COLOR;
  ctx.beginPath();
  ctx.moveTo(mmX, mmY + headerH);
  ctx.lineTo(mmX + mmW, mmY + headerH);
  ctx.stroke();

  // Header text: enemy count + player count
  const alivePlayerCount = Array.from(state.players.values()).filter((p) => p.health > 0).length;
  const enemyCount = state.enemies.length;
  ctx.font = C.UI_MINIMAP_HEADER_FONT;
  ctx.textAlign = "left";
  ctx.fillStyle = C.UI_MINIMAP_HEADER_COLOR;
  ctx.fillText(`👥 ${alivePlayerCount}`, mmX + 8, mmY + headerH - 6);
  ctx.fillStyle = "hsla(340, 80%, 70%, 0.9)";
  ctx.fillText(`☠ ${enemyCount}`, mmX + 50, mmY + headerH - 6);
  // Power-up count
  if (state.powerUpItems.length > 0) {
    ctx.fillStyle = "hsla(270, 80%, 75%, 0.9)";
    ctx.fillText(`⬡ ${state.powerUpItems.length}`, mmX + 95, mmY + headerH - 6);
  }
  // "MAP" label right-aligned
  ctx.textAlign = "right";
  ctx.fillStyle = "hsla(210, 40%, 55%, 0.6)";
  ctx.fillText("MAP", mmX + mmW - 6, mmY + headerH - 6);

  // --- Viewport rect ---
  if (C.UI_MINIMAP_SHOW_VIEWPORT) {
    const localPlayer = state.players.get(localPlayerId);
    if (localPlayer && localPlayer.health > 0) {
      const vpW = canvasWidth * scaleX;
      const vpH = canvasHeight * scaleY;
      const vpX = mmX + localPlayer.pos.x * scaleX - vpW / 2;
      const vpY = mapY + localPlayer.pos.y * scaleY - vpH / 2;
      ctx.strokeStyle = C.UI_MINIMAP_VIEWPORT_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(vpX, vpY, vpW, vpH);
    }
  }

  // --- Collectibles (optional, off by default) ---
  if (C.UI_MINIMAP_SHOW_COLLECTIBLES) {
    ctx.fillStyle = `hsla(180, 100%, 50%, ${C.UI_MINIMAP_COLLECTIBLE_OPACITY})`;
    const cs = C.UI_MINIMAP_COLLECTIBLE_SIZE;
    for (const c of state.collectibles) {
      ctx.fillRect(mmX + c.pos.x * scaleX - cs / 2, mapY + c.pos.y * scaleY - cs / 2, cs, cs);
    }
  }

  // --- Health pickups (green cross) ---
  ctx.fillStyle = "hsla(120, 80%, 55%, 0.95)";
  const hs = C.UI_MINIMAP_HEALTH_SIZE;
  for (const hp of state.healthPickups) {
    const hx = mmX + hp.pos.x * scaleX;
    const hy = mapY + hp.pos.y * scaleY;
    // Small plus sign
    ctx.fillRect(hx - hs / 2, hy - 0.5, hs, 1);
    ctx.fillRect(hx - 0.5, hy - hs / 2, 1, hs);
  }

  // --- Power-ups (colored diamonds with glow) ---
  const ps = C.UI_MINIMAP_POWERUP_SIZE;
  for (const pu of state.powerUpItems) {
    const puColor = getPowerUpColor(pu.type);
    const px = mmX + pu.pos.x * scaleX;
    const py = mapY + pu.pos.y * scaleY;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = puColor;
    ctx.shadowBlur = 6;
    ctx.fillStyle = puColor;
    ctx.fillRect(-ps / 2, -ps / 2, ps, ps);
    ctx.restore();
  }
  ctx.shadowBlur = 0;

  // --- Enemies (small dim dots, only aggressive ones are brighter) ---
  const es = C.UI_MINIMAP_ENEMY_SIZE;
  for (const e of state.enemies) {
    const aggressive = e.state === "aggressive";
    ctx.fillStyle = aggressive ? "hsla(340, 70%, 60%, 0.7)" : "hsla(280, 40%, 50%, 0.25)";
    ctx.fillRect(mmX + e.pos.x * scaleX - es / 2, mapY + e.pos.y * scaleY - es / 2, es, es);
  }

  // --- Bosses (large pulsating dots) ---
  const bs = C.UI_MINIMAP_BOSS_SIZE;
  for (const boss of state.bosses) {
    const bx = mmX + boss.pos.x * scaleX;
    const by = mapY + boss.pos.y * scaleY;
    // Glow
    ctx.save();
    const bGlow = ctx.createRadialGradient(bx, by, 0, bx, by, bs * 3);
    bGlow.addColorStop(0, boss.glowColor.replace("hsl(", "hsla(").replace(")", ", 0.5)"));
    bGlow.addColorStop(1, "transparent");
    ctx.fillStyle = bGlow;
    ctx.beginPath();
    ctx.arc(bx, by, bs * 3, 0, Math.PI * 2);
    ctx.fill();
    // Dot
    ctx.fillStyle = boss.color;
    ctx.beginPath();
    ctx.arc(bx, by, bs, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "hsla(0, 0%, 100%, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // --- Players (bright, with glow for local) ---
  for (const [id, p] of state.players) {
    if (p.health <= 0) continue;
    const px = mmX + p.pos.x * scaleX;
    const py = mapY + p.pos.y * scaleY;
    const isLocal = id === localPlayerId;
    const dotR = isLocal ? C.UI_MINIMAP_LOCAL_PLAYER_SIZE : C.UI_MINIMAP_OTHER_PLAYER_SIZE;

    // Glow for local player
    if (isLocal && C.UI_MINIMAP_LOCAL_GLOW) {
      const glow = ctx.createRadialGradient(px, py, 0, px, py, C.UI_MINIMAP_LOCAL_GLOW_RADIUS);
      glow.addColorStop(0, p.color.replace("hsl(", "hsla(").replace(")", ", 0.35)"));
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, C.UI_MINIMAP_LOCAL_GLOW_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player dot
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(px, py, dotR, 0, Math.PI * 2);
    ctx.fill();

    // White outline for players to stand out
    ctx.strokeStyle = isLocal ? "hsla(0, 0%, 100%, 0.8)" : "hsla(0, 0%, 100%, 0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Direction indicator for local player
    if (isLocal && C.UI_MINIMAP_SHOW_DIRECTION) {
      ctx.strokeStyle = "hsla(0, 0%, 100%, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(
        px + Math.cos(p.aimAngle) * C.UI_MINIMAP_DIRECTION_LENGTH,
        py + Math.sin(p.aimAngle) * C.UI_MINIMAP_DIRECTION_LENGTH,
      );
      ctx.stroke();
    }

    // Player name label (short, only for other players)
    if (!isLocal) {
      ctx.font = '8px "Roboto Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillStyle = "hsla(0, 0%, 90%, 0.6)";
      const shortName = p.name.length > 6 ? p.name.slice(0, 5) + "…" : p.name;
      ctx.fillText(shortName, px, py - dotR - 3);
    }
  }

  ctx.restore(); // clip
}

function drawChat(
  ctx: CanvasRenderingContext2D,
  messages: ChatMessage[],
  canvasWidth: number,
  canvasHeight: number,
  now: number,
  chatting: boolean,
  chatInput: string,
) {
  const chatX = C.UI_CHAT_X;
  const chatBottomY = Math.round(canvasHeight / 2 + C.UI_CHAT_CENTER_OFFSET_Y);
  const lineH = 20;

  // Show visible messages (most recent, up to max)
  const visible = messages.slice(-C.CHAT_MAX_VISIBLE);

  for (let i = 0; i < visible.length; i++) {
    const msg = visible[i];
    const age = now - msg.timestamp;
    // Fade out in the last 1.5s
    const fadeStart = C.CHAT_MESSAGE_VISIBLE_MS - 1500;
    const alpha = age > fadeStart ? Math.max(0, 1 - (age - fadeStart) / 1500) : 1;
    if (alpha <= 0) continue;

    const y = chatBottomY - (visible.length - 1 - i) * lineH;

    if (msg.type && msg.type !== "chat") {
      // System event — single colored line with icon
      const eventColor = getEventColor(msg.type, alpha);
      const icon = getEventIcon(msg.type);
      ctx.font = '11px "Roboto Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillStyle = eventColor;
      ctx.fillText(`${icon} ${msg.text}`, chatX, y);
    } else {
      // Normal chat message
      ctx.font = 'bold 12px "Roboto Mono", monospace';
      ctx.textAlign = "left";
      ctx.fillStyle = `hsla(210, 100%, 70%, ${alpha * 0.9})`;
      const nameText = `${msg.senderName}: `;
      ctx.fillText(nameText, chatX, y);

      const nameWidth = ctx.measureText(nameText).width;
      ctx.font = '12px "Roboto Mono", monospace';
      ctx.fillStyle = `hsla(240, 10%, 90%, ${alpha * 0.85})`;
      ctx.fillText(msg.text, chatX + nameWidth, y);
    }
  }

  // Chat input bar
  if (chatting) {
    const inputY = chatBottomY + 8;
    // Background
    ctx.fillStyle = "hsla(233, 47%, 8%, 0.85)";
    ctx.fillRect(chatX - 4, inputY - 14, 350, 22);
    ctx.strokeStyle = "hsla(210, 100%, 70%, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(chatX - 4, inputY - 14, 350, 22);

    ctx.font = '12px "Roboto Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillStyle = "hsla(240, 10%, 50%, 0.7)";
    ctx.fillText("💬 ", chatX, inputY);
    ctx.fillStyle = C.COLORS.hudText;
    const cursor = Math.sin(now * 0.006) > 0 ? "│" : "";
    ctx.fillText(chatInput + cursor, chatX + 22, inputY);
  } else if (messages.length === 0) {
    // Hint when no messages
    ctx.font = '12px "Roboto Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillStyle = "hsla(210, 100%, 70%, 0.75)";
    ctx.fillText("Press ENTER to chat", chatX, chatBottomY + 8);
  }
}

function getEventColor(type: ChatMessageType, alpha: number): string {
  const a = alpha * 0.85;
  switch (type) {
    case "event_join":
      return C.EVENT_COLOR_JOIN.replace("ALPHA", `${a}`);
    case "event_leave":
      return C.EVENT_COLOR_LEAVE.replace("ALPHA", `${a}`);
    case "event_host":
      return C.EVENT_COLOR_HOST.replace("ALPHA", `${a}`);
    case "event_kill":
      return C.EVENT_COLOR_KILL.replace("ALPHA", `${a}`);
    case "event_points":
      return C.EVENT_COLOR_POINTS.replace("ALPHA", `${a}`);
    case "event_respawn":
      return C.EVENT_COLOR_RESPAWN.replace("ALPHA", `${a}`);
    case "event_health":
      return C.EVENT_COLOR_HEALTH.replace("ALPHA", `${a}`);
    case "event_boss":
      return C.EVENT_COLOR_BOSS.replace("ALPHA", `${a}`);
    default:
      return `hsla(240, 10%, 70%, ${a})`;
  }
}

function getEventIcon(type: ChatMessageType): string {
  switch (type) {
    case "event_join":
      return "→";
    case "event_leave":
      return "←";
    case "event_host":
      return "★";
    case "event_kill":
      return "⚔";
    case "event_points":
      return "💰";
    case "event_respawn":
      return "↺";
    case "event_health":
      return "♥";
    case "event_boss":
      return "👹";
    default:
      return "•";
  }
}

function drawTimer(ctx: CanvasRenderingContext2D, state: GameState, canvasWidth: number, now: number) {
  const elapsed = now - state.roundStartTime;
  const remaining = Math.max(0, C.ROUND_DURATION_MS - elapsed);
  const totalSecs = Math.ceil(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const x = canvasWidth / 2;
  const y = 15;

  // Urgent color when < 30s
  const urgent = remaining < 30000;
  const color = urgent ? `hsla(0, 100%, 65%, ${0.8 + 0.2 * Math.sin(now * 0.01)})` : "hsla(240, 10%, 90%, 0.85)";

  ctx.font = urgent ? 'bold 28px "Roboto Mono", monospace' : '24px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  if (urgent) {
    ctx.shadowColor = "hsla(0, 100%, 50%, 0.5)";
    ctx.shadowBlur = 10;
  }
  ctx.fillText(timeStr, x, y);
  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";
}

function drawRoundOverScreen(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
  now: number,
) {
  // Dark overlay
  ctx.fillStyle = "hsla(0, 0%, 0%, 0.8)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const cx = canvasWidth / 2;
  let y = canvasHeight * 0.15;

  // Title
  ctx.font = 'bold 48px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(45, 100%, 65%, 0.95)";
  ctx.shadowColor = "hsla(45, 100%, 50%, 0.4)";
  ctx.shadowBlur = 15;
  ctx.fillText("ROUND OVER", cx, y);
  ctx.shadowBlur = 0;
  y += 60;

  // Build ranking
  const players: { name: string; score: number; isLocal: boolean }[] = [];
  for (const [id, p] of state.players) {
    players.push({ name: p.name || id, score: p.score, isLocal: id === localPlayerId });
  }
  players.sort((a, b) => b.score - a.score);

  // Ranking header
  ctx.font = '16px "Roboto Mono", monospace';
  ctx.fillStyle = "hsla(240, 10%, 70%, 0.8)";
  ctx.fillText("FINAL RANKING", cx, y);
  y += 12;

  // Separator
  ctx.strokeStyle = "hsla(240, 10%, 40%, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 140, y);
  ctx.lineTo(cx + 140, y);
  ctx.stroke();
  y += 20;

  // Player rows
  const medals = ["🥇", "🥈", "🥉"];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const medal = i < 3 ? medals[i] : `#${i + 1}`;
    const nameDisplay = p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name;

    ctx.font = p.isLocal ? 'bold 20px "Roboto Mono", monospace' : '18px "Roboto Mono", monospace';
    ctx.textAlign = "center";

    if (i === 0) {
      ctx.fillStyle = "hsla(45, 100%, 65%, 0.95)";
    } else if (p.isLocal) {
      ctx.fillStyle = "hsla(210, 100%, 70%, 0.95)";
    } else {
      ctx.fillStyle = "hsla(240, 10%, 85%, 0.8)";
    }

    ctx.fillText(`${medal}  ${nameDisplay}  —  ${p.score}`, cx, y);
    y += 32;
  }

  // Restart countdown
  y = canvasHeight * 0.82;
  const countdownElapsed = now - state.restartCountdownStart;
  const countdownRemaining = Math.max(0, Math.ceil((C.ROUND_RESTART_COUNTDOWN_MS - countdownElapsed) / 1000));

  ctx.font = '20px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = "hsla(210, 100%, 70%, 0.8)";
  ctx.fillText(`Next round in ${countdownRemaining}s`, cx, y);

  // Progress bar
  const barW = 260;
  const barH = 6;
  const barX = cx - barW / 2;
  const barY = y + 14;
  const progress = Math.min(1, countdownElapsed / C.ROUND_RESTART_COUNTDOWN_MS);
  ctx.fillStyle = "hsla(240, 10%, 20%, 0.6)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "hsla(210, 100%, 70%, 0.7)";
  ctx.fillRect(barX, barY, barW * progress, barH);
}
