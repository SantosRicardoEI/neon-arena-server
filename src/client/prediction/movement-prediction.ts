/**
 * Client-side movement prediction.
 * Uses the shared simulation helpers so movement physics are never duplicated.
 *
 * NO browser API dependencies — consumes abstract player state and timestamps.
 */
import type { Player, Vec2 } from '../../shared/types';
import { applyPlayerMovement, computeMovementVelocity } from '../../game/simulation';
import { playerHasPowerUp } from '../../gameplay/powerups/utils';
import * as C from '../../game/constants';

/**
 * Predict one tick of local player movement.
 * Sets the player's velocity from the given moveDir, then advances position
 * using the shared `applyPlayerMovement` helper.
 *
 * Mutates `player` in place — caller should operate on the local player reference.
 */
export function predictMovement(
  player: Player,
  moveDir: Vec2,
  dt: number,
  now: number,
): void {
  const hasSpeed = playerHasPowerUp(player, 'speed', now);
  const vel = computeMovementVelocity(moveDir, player.score, hasSpeed);
  player.vel.x = vel.x;
  player.vel.y = vel.y;
  applyPlayerMovement(player, dt, now, C.WORLD_WIDTH, C.WORLD_HEIGHT);
}
