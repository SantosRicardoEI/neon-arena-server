import type { PowerUpType } from '../../shared/types';

export function getPowerUpColor(type: PowerUpType): string {
  switch (type) {
    case "speed":
      return "hsl(190, 100%, 60%)";
    case "rapid_fire":
      return "hsl(30, 100%, 60%)";
    case "shield":
      return "hsl(270, 100%, 70%)";
    default:
      console.warn("[powerup] unknown color type:", type);
      return "hsl(0, 0%, 70%)";
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
    default:
      console.warn("[powerup] unknown label type:", type);
      return "?";
  }
}