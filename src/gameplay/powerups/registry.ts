import type { Player, PowerUpType } from '../../shared/types';


export interface PowerUpDefinition {
  type: PowerUpType;
  durationMs: number;

  modifyMoveSpeed?: (base: number, player: Player, now: number) => number;
  modifyShootCooldown?: (base: number, player: Player, now: number) => number;
  modifyIncomingDamage?: (base: number, player: Player, now: number) => number;
}

export const POWERUP_REGISTRY: Record<PowerUpType, PowerUpDefinition> = {
  speed: {
    type: 'speed',
    durationMs: 20000,
    modifyMoveSpeed: (base) => base * 1.5,
  },

  rapid_fire: {
    type: 'rapid_fire',
    durationMs: 10000,
    modifyShootCooldown: (base) =>
      base * 0.4,
  },

  shield: {
    type: 'shield',
    durationMs: 15000,
    modifyIncomingDamage: (base) =>
      Math.ceil(base * 0.3),
  },
};