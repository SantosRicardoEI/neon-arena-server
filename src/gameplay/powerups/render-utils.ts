import type { PowerUpType } from '../../shared/types';
import * as C from '../../game/constants';

export function getPowerUpColor(type: PowerUpType): string {
  switch (type) {
    case "speed":
      return C.POWERUP_SPEED_COLOR;
    case "rapid_fire":
      return C.POWERUP_RAPID_FIRE_COLOR;
    case "shield":
      return C.POWERUP_SHIELD_COLOR;
  }
}

export function getPowerUpLabel(type: PowerUpType): string {
  switch (type) {
    case "speed":
      return "⚡";
    case "rapid_fire":
      return "🔥";
    case "shield":
      return "🛡";
  }
}