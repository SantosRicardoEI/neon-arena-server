import { GameState } from "./types";
import { drawStarfield } from './render/background';
import { drawGrid, drawWorldBorder } from './render/world';
import {
  drawCollectibles,
  drawDroppedPoints,
  drawHealthPickups,
  drawExplosions,
  drawDeathParticles,
  drawProjectiles,
} from './render/entities';
import {
  drawPowerUpItems,
  drawEnemies,
  drawBosses,
  drawPlayers,
} from './render/actors';
import {
  drawDamageVignette,
  drawDeathOverlay,
} from './render/overlays';
import {
  drawHUD,
  drawScoreboard,
  drawMinimap,
  drawChat,
  drawTimer,
  drawControlsHelp,
  drawRoundOverScreen,
  drawBossHUD,
} from '../game/ui/renderers';
import { drawUI } from './render/ui';

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

  drawStarfield(ctx, camX, camY, canvasWidth, canvasHeight, now);

  ctx.save();
  ctx.translate(-camX, -camY);

  drawGrid(ctx, camX, camY, canvasWidth, canvasHeight);
  drawWorldBorder(
    ctx,
    state.worldWidth,
    state.worldHeight,
    camX,
    camY,
    canvasWidth,
    canvasHeight,
  );

  drawCollectibles(ctx, state);
  drawDroppedPoints(ctx, state);
  drawHealthPickups(ctx, state);
  drawPowerUpItems(ctx, state);
  drawEnemies(ctx, state, now);
  drawBosses(ctx, state, now);
  drawExplosions(ctx, state, now);
  drawDeathParticles(ctx, state, now);
  drawProjectiles(ctx, state);
  drawPlayers(ctx, state, now);

  ctx.restore();

drawUI(
  ctx,
  state,
  localPlayerId,
  canvasWidth,
  canvasHeight,
  now,
  chatting,
  chatInput,
);

  drawDamageVignette(ctx, state, localPlayerId, canvasWidth, canvasHeight, now);
  drawDeathOverlay(ctx, state, localPlayerId, canvasWidth, canvasHeight);

  if (state.roundOver) {
    drawRoundOverScreen(ctx, state, localPlayerId, canvasWidth, canvasHeight, now);
  }
}