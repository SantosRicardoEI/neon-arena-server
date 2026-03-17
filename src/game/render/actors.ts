import type { GameState } from '../types';
import { drawPowerUpItem } from '../../gameplay/powerups/renderers';
import { getBossDefinition } from '../../gameplay/bosses/registry';
import { drawEnemy } from '../../gameplay/enemies/renderers';
import { drawBoss } from '../../gameplay/bosses/renderers';
import {
  updatePlayerTrails,
  drawPlayerTrails,
  drawPowerUpAura,
  drawPlayer,
  drawPlayerName,
} from '../../gameplay/players/renderers';

export function drawPowerUpItems(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  for (const pu of state.powerUpItems) {
    drawPowerUpItem(ctx, pu.pos.x, pu.pos.y, pu.type, pu.pulsePhase);
  }
}

export function drawEnemies(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  for (const enemy of state.enemies) {
    drawEnemy(ctx, enemy, now);
  }
}

export function drawBosses(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  for (const boss of state.bosses) {
    const def = getBossDefinition(boss.definitionId);
    drawBoss(ctx, boss, def, now);
  }
}

export function drawPlayers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
): void {
  updatePlayerTrails(state, now);
  drawPlayerTrails(ctx, state, now);

  for (const [, player] of state.players) {
    if (player.health <= 0) continue;

    const color = player.color;

    drawPowerUpAura(ctx, player, now);

    if (now < player.invincibleUntil) {
      const flash = Math.sin(now * 0.03) > 0;
      if (!flash) {
        drawPlayer(ctx, player, 'hsla(0, 0%, 100%, 0.8)');
        drawPlayerName(ctx, player, color);
        continue;
      }
    }

    drawPlayer(ctx, player, color);
    drawPlayerName(ctx, player, color);
  }
}