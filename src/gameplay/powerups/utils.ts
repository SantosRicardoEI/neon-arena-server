import type { Player, PowerUpType } from '../../shared/types';
import * as C from '../../game/constants';

export function getPowerUpDuration(type: PowerUpType): number {
  switch (type) {
    case 'speed':
      return C.POWERUP_SPEED_DURATION_MS;
    case 'rapid_fire':
      return C.POWERUP_RAPID_FIRE_DURATION_MS;
    case 'shield':
      return C.POWERUP_SHIELD_DURATION_MS;
  }
}

export function playerHasPowerUp(
  player: Player,
  type: PowerUpType,
  now: number,
): boolean {
  return player.activePowerUps.some(
    (powerUp) => powerUp.type === type && now < powerUp.expiresAt,
  );
}