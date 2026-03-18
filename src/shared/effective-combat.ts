import type { Player } from './types';
import { POWERUP_REGISTRY } from '../gameplay/powerups/registry';


/**
 * Indica se o shield está ativo neste momento.
 */
export function hasEffectiveShield(player: Player, now: number): boolean {
  return player.activePowerUps.some(
    (pu) => pu.type === 'shield' && now < pu.expiresAt,
  );
}

/**
 * Devolve o dano final recebido pelo jogador após aplicar efeitos defensivos.
 *
 * Para já:
 * - shield reduz dano recebido;
 * - arredondamos para cima para nunca dar 0 se houver dano base > 0.
 */
export function getEffectiveIncomingDamage(
  player: Player,
  baseDamage: number,
  now: number,
): number {
  let damage = baseDamage;

  for (const pu of player.activePowerUps) {
    if (now >= pu.expiresAt) continue;

    const def = POWERUP_REGISTRY[pu.type];
    if (def.modifyIncomingDamage) {
      damage = def.modifyIncomingDamage(damage, player, now);
    }
  }

  return damage;
}