/**
 * Client-side movement prediction.
 * Uses the shared simulation helpers so movement physics are never duplicated.
 *
 * NO browser API dependencies — consumes abstract player state and timestamps.
 */
import type { Player, Vec2 } from '../../shared/types';
import { applyPlayerMovement } from '../../game/simulation';
import * as C from '../../game/constants';
import { getEffectiveMoveSpeed } from '../../shared/effective-stats';

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
const speed = getEffectiveMoveSpeed(player, now);

const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);

const vel =
  len > 0
    ? {
        x: (moveDir.x / len) * speed,
        y: (moveDir.y / len) * speed,
      }
    : { x: 0, y: 0 };
  player.vel.x = vel.x;
  player.vel.y = vel.y;
  applyPlayerMovement(player, dt, now, C.WORLD_WIDTH, C.WORLD_HEIGHT);
}
