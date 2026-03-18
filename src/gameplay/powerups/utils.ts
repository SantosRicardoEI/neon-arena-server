import type { Player, PowerUpType } from '../../shared/types';
import { POWERUP_REGISTRY } from './registry';

export function getPowerUpDuration(type: PowerUpType): number {
  return POWERUP_REGISTRY[type].durationMs;
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