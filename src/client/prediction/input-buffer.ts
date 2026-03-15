/**
 * Client-side input buffer for prediction and server reconciliation.
 * Stores timestamped input snapshots so they can be replayed after
 * receiving authoritative corrections from the server.
 *
 * NO browser API dependencies (uses abstract timestamps).
 */
import type { Vec2 } from '../../shared/types';

/** A single input snapshot at a point in time */
export interface InputSnapshot {
  /** Monotonically increasing sequence number */
  seq: number;
  /** Timestamp when this input was captured */
  time: number;
  /** Normalised movement direction (not yet scaled by speed) */
  moveDir: Vec2;
  /** Aim angle in radians */
  aimAngle: number;
  /** Whether shoot was pressed this frame */
  shoot: boolean;
  /** Whether dash was pressed this frame */
  dash: boolean;
  /** Whether reload was pressed this frame */
  reload: boolean;
}

/**
 * Ring-buffer style input history.
 * Keeps the last N inputs for replay during reconciliation.
 */
export class InputBuffer {
  private buffer: InputSnapshot[] = [];
  private nextSeq = 0;
  private readonly maxSize: number;

  constructor(maxSize = 128) {
    this.maxSize = maxSize;
  }

  /** Record a new input snapshot and return its sequence number */
  push(input: Omit<InputSnapshot, 'seq'>): InputSnapshot {
    const snapshot: InputSnapshot = { ...input, seq: this.nextSeq++ };
    this.buffer.push(snapshot);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
    return snapshot;
  }

  /** Get all inputs after a given sequence number (for replay) */
  getAfter(seq: number): InputSnapshot[] {
    const idx = this.buffer.findIndex(s => s.seq > seq);
    return idx >= 0 ? this.buffer.slice(idx) : [];
  }

  /** Discard all inputs up to and including the given sequence number */
  discardUpTo(seq: number): void {
    const idx = this.buffer.findIndex(s => s.seq > seq);
    if (idx > 0) {
      this.buffer.splice(0, idx);
    } else if (idx === -1) {
      this.buffer.length = 0;
    }
  }

  /** Current sequence counter (next will be this value) */
  get currentSeq(): number {
    return this.nextSeq;
  }

  /** Number of buffered inputs */
  get size(): number {
    return this.buffer.length;
  }

  /** Clear the entire buffer */
  clear(): void {
    this.buffer.length = 0;
  }
}
