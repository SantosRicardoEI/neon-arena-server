/**
 * Remote entity interpolation helpers.
 * Smoothly blends remote player positions between network updates
 * so they don't teleport on each snapshot.
 *
 * NO browser API dependencies.
 */
import type { Player, Vec2 } from '../../shared/types';

/** Default interpolation speed (higher = snappier, 0–1 per-frame blend factor base) */
const DEFAULT_LERP_RATE = 12;

/**
 * Linearly interpolate between two numbers.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Shortest-path angular interpolation (handles wraparound).
 */
function lerpAngle(a: number, b: number, t: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

/**
 * Interpolate a remote player toward its target position and aim angle.
 * Call once per frame for each remote player.
 *
 * Uses `player.targetPos` and `player.targetAimAngle` as the destination
 * (set when a network update arrives).
 */
export function interpolateRemotePlayer(
  player: Player,
  dt: number,
  lerpRate: number = DEFAULT_LERP_RATE,
): void {
  // Exponential smoothing: frame-rate independent, matches original engine behaviour
  const t = 1 - Math.exp(-lerpRate * dt);
  if (player.targetPos) {
    player.pos.x = lerp(player.pos.x, player.targetPos.x, t);
    player.pos.y = lerp(player.pos.y, player.targetPos.y, t);
  }
  if (player.targetAimAngle !== null) {
    player.aimAngle = lerpAngle(player.aimAngle, player.targetAimAngle, t);
  }
}

/**
 * Set the interpolation target for a remote player when a network update arrives.
 */
export function setRemotePlayerTarget(
  player: Player,
  targetPos: Vec2,
  targetAimAngle: number,
  now: number,
): void {
  player.targetPos = { x: targetPos.x, y: targetPos.y };
  player.targetAimAngle = targetAimAngle;
  player.lastNetworkUpdate = now;
}
