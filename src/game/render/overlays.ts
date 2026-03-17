import type { GameState } from '../types';
import * as C from '../constants';

export function drawDamageVignette(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
  now: number,
): void {
  const localPlayer = state.players.get(localPlayerId);
  if (!localPlayer) return;

  if (
    now < localPlayer.invincibleUntil &&
    now - (localPlayer.invincibleUntil - C.PLAYER_INVINCIBLE_MS) < 50
  ) {
    ctx.fillStyle = 'hsla(0, 100%, 50%, 0.15)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}

export function drawDeathOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const localPlayer = state.players.get(localPlayerId);
  if (!localPlayer) return;

  if (localPlayer.health <= 0 && !state.roundOver) {
    ctx.fillStyle = 'hsla(0, 0%, 0%, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = C.COLORS.hudText;
    ctx.font = '48px "Roboto Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 30);

    ctx.font = '20px "Roboto Mono", monospace';
    ctx.fillText(`SCORE: ${localPlayer.score}`, canvasWidth / 2, canvasHeight / 2 + 20);
    ctx.fillText('Press F to respawn', canvasWidth / 2, canvasHeight / 2 + 60);
  }
}