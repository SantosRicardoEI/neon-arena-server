import type { GameState } from '../types';
import {
  drawHUD,
  drawScoreboard,
  drawMinimap,
  drawChat,
  drawTimer,
  drawControlsHelp,
  drawBossHUD,
} from '../../game/ui/renderers';

export function drawUI(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  localPlayerId: string,
  canvasWidth: number,
  canvasHeight: number,
  now: number,
  chatting: boolean,
  chatInput: string,
): void {
  const localPlayer = state.players.get(localPlayerId);
  if (!localPlayer) return;

  drawHUD(ctx, localPlayer, canvasWidth, canvasHeight, now, state.enemies.length);
  drawTimer(ctx, state, canvasWidth, now);
  drawScoreboard(ctx, state, localPlayerId, canvasWidth, canvasHeight);
  drawMinimap(ctx, state, localPlayerId, canvasWidth, canvasHeight);
  drawChat(ctx, state.chatMessages, canvasWidth, canvasHeight, now, chatting, chatInput);
  drawControlsHelp(ctx);
  drawBossHUD(ctx, state, canvasWidth, canvasHeight, now);
}