import {
  GameState,
  Player,
  PowerUpType,
  ChatMessage,
  ChatMessageType,
} from '../../shared/types';

import { getControlDisplayValue, getMovementDisplayValue } from '../../game/controls';
import * as C from '../../game/constants';
import { getEventColor, getEventIcon } from './chat-utils';

import {
  getPlayerRadius,
  getShootCooldown,
  getReloadTime,
  getPlayerSpeed,
  getMagazineSize,
} from '../../shared/scaling';
import { getPowerUpColor, getPowerUpLabel } from '../../gameplay/powerups/render-utils';


export function drawBossHUD(
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

export function drawHUD(ctx: CanvasRenderingContext2D, player: Player, w: number, h: number, now: number, enemyCount: number) {
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
  const currentTime = now;
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

export function drawStatsPanel(ctx: CanvasRenderingContext2D, player: Player, canvasHeight: number) {
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

export function drawControlsHelp(ctx: CanvasRenderingContext2D) {
  const x = C.UI_CONTROLS_X;
  let y = C.UI_CONTROLS_Y;
  const lineH = C.UI_CONTROLS_LINE_HEIGHT;
  const w = C.UI_CONTROLS_WIDTH;

  const controls = [
    { label: 'MOVE', value: getMovementDisplayValue() },
    { label: 'DASH', value: getControlDisplayValue('dash') },
    { label: 'AIM', value: 'MOUSE' },
    { label: 'SHOOT', value: getControlDisplayValue('shoot') },
    { label: 'RELOAD', value: getControlDisplayValue('reload') },
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

export function drawScoreboard(
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

export function drawMinimap(
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

export function drawChat(
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


export function drawTimer(ctx: CanvasRenderingContext2D, state: GameState, canvasWidth: number, now: number) {
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

export function drawRoundOverScreen(
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
