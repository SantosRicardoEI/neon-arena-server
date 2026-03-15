/**
 * Client-side dash prediction.
 * Delegates to the shared `initiateDash` helper so dash physics
 * (cooldown, duration, angle selection) are never duplicated.
 *
 * NO browser API dependencies.
 */
import type { Player, Vec2 } from '../../shared/types';
import { initiateDash } from '../../game/simulation';

/**
 * Attempt to start a dash for the local player using shared logic.
 * Returns true if the dash was initiated (caller can play SFX).
 */
export function predictDash(
  player: Player,
  aimAngle: number,
  moveDir: Vec2,
  now: number,
): boolean {
  return initiateDash(player, aimAngle, moveDir, now);
}
