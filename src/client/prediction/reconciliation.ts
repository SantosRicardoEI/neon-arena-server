/**
 * Server reconciliation placeholder.
 *
 * When an authoritative server confirms a player state at a given input
 * sequence number, the client:
 *   1. Snaps to the server-confirmed position
 *   2. Replays all unacknowledged inputs from the input buffer
 *   3. Arrives at a corrected predicted position
 *
 * This module provides the reconciliation loop structure.
 * Full integration requires wiring it into the game loop once the
 * authoritative server protocol is active.
 *
 * NO browser API dependencies.
 */
import type { Player, Vec2 } from '../../shared/types';
import type { InputSnapshot } from './input-buffer';
import type { InputBuffer } from './input-buffer';
import { predictMovement } from './movement-prediction';
import { predictDash } from './dash-prediction';

/** Authoritative state correction received from the server */
export interface ServerCorrection {
  /** The input sequence number the server has processed up to */
  lastProcessedSeq: number;
  /** Authoritative position */
  pos: Vec2;
  /** Authoritative health */
  health: number;
  /** Authoritative score */
  score: number;
}

/**
 * Reconcile local player state with an authoritative server correction.
 *
 * 1. Snap player to server-confirmed state
 * 2. Replay all inputs after `correction.lastProcessedSeq`
 * 3. Player ends up at the corrected predicted position
 *
 * Returns the number of inputs replayed.
 */
export function reconcile(
  player: Player,
  correction: ServerCorrection,
  inputBuffer: InputBuffer,
): number {
  // Step 1: Snap to server state
  player.pos.x = correction.pos.x;
  player.pos.y = correction.pos.y;
  player.health = correction.health;
  player.score = correction.score;

  // Step 2: Discard acknowledged inputs
  inputBuffer.discardUpTo(correction.lastProcessedSeq);

  // Step 3: Replay unacknowledged inputs
  const unacked = inputBuffer.getAfter(correction.lastProcessedSeq);
  for (let i = 0; i < unacked.length; i++) {
    const input = unacked[i];
    const nextTime = i + 1 < unacked.length ? unacked[i + 1].time : input.time;
    const dt = Math.max(0, (nextTime - input.time) / 1000);

    if (input.dash) {
      predictDash(player, input.aimAngle, input.moveDir, input.time);
    }
    predictMovement(player, input.moveDir, dt, input.time);
  }

  return unacked.length;
}
