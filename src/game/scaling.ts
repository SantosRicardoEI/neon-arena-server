import * as C from './constants';

/** Effective shoot cooldown in ms based on score */
export function getShootCooldown(score: number): number {
  return Math.max(
    C.SHOOT_COOLDOWN_MIN_MS,
    C.SHOOT_COOLDOWN_BASE_MS / (1 + score * C.SHOOT_COOLDOWN_SCORE_FACTOR)
  );
}

/** Effective reload time in ms based on score */
export function getReloadTime(score: number): number {
  return Math.max(
    C.RELOAD_TIME_MIN_MS,
    C.RELOAD_TIME_BASE_MS / (1 + score * C.RELOAD_TIME_SCORE_FACTOR)
  );
}

/** Effective player radius based on score */
export function getPlayerRadius(score: number): number {
  return Math.min(
    C.PLAYER_RADIUS_MAX,
    C.PLAYER_RADIUS_BASE + score * C.PLAYER_RADIUS_SCORE_FACTOR
  );
}

/** Effective player speed based on score */
export function getPlayerSpeed(score: number): number {
  return Math.max(
    C.PLAYER_SPEED_MIN,
    C.PLAYER_SPEED_BASE / (1 + score * C.PLAYER_SPEED_SCORE_FACTOR)
  );
}

/** Effective dash duration in ms based on score (longer dash = more distance) */
/** Effective magazine size based on score (base + bonus per interval) */
export function getMagazineSize(score: number): number {
  const bonus = Math.min(
    C.AMMO_BONUS_MAX_EXTRA,
    Math.floor(score / C.AMMO_BONUS_SCORE_INTERVAL)
  );
  return C.MAGAZINE_SIZE + bonus;
}

export function getDashDuration(score: number): number {
  return Math.min(
    C.DASH_DURATION_MAX_MS,
    C.DASH_DURATION_BASE_MS * (1 + score * C.DASH_DURATION_SCORE_FACTOR)
  );
}

/**
 * Returns a 0–1 speed multiplier for the dash based on progress (0→1).
 * Fast ramp-up, slow ease-out deceleration for a satisfying feel.
 */
export function getDashSpeedCurve(progress: number): number {
  const accel = C.DASH_ACCEL_RATIO;
  const decel = C.DASH_DECEL_RATIO;
  const cruiseEnd = 1 - decel;

  if (progress < accel) {
    // Acceleration phase: quick ramp from 0.3 → 1 (never starts from zero)
    const t = progress / accel;
    return 0.3 + 0.7 * t * t; // quadratic ease-in
  } else if (progress < cruiseEnd) {
    // Cruise phase: full speed
    return 1;
  } else {
    // Deceleration phase: smooth ease-out from 1 → 0
    const t = (progress - cruiseEnd) / decel;
    const ease = 1 - t * t; // quadratic ease-out
    return Math.max(0, ease);
  }
}
