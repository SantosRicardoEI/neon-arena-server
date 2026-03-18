import type { Player } from './types';
import {
  getShootCooldown,
  getPlayerSpeed,
  getReloadTime,
  getMagazineSize,
} from './scaling';

import { POWERUP_REGISTRY } from '../gameplay/powerups/registry';

/**
 * Devolve o cooldown real de disparo do jogador,
 * já com power-ups aplicados.
 */
export function getEffectiveShootCooldown(player: Player, now: number): number {
  let cooldown = getShootCooldown(player.score);

  for (const pu of player.activePowerUps) {
    if (now >= pu.expiresAt) continue;

    const def = POWERUP_REGISTRY[pu.type];
    if (def.modifyShootCooldown) {
      cooldown = def.modifyShootCooldown(cooldown, player, now);
    }
  }

  return cooldown;
}

/**
 * Devolve a velocidade real de movimento do jogador,
 * já com power-ups aplicados.
 */
export function getEffectiveMoveSpeed(player: Player, now: number): number {
  let speed = getPlayerSpeed(player.score);

  for (const pu of player.activePowerUps) {
    if (now >= pu.expiresAt) continue;

    const def = POWERUP_REGISTRY[pu.type];
    if (def.modifyMoveSpeed) {
      speed = def.modifyMoveSpeed(speed, player, now);
    }
  }

  return speed;
}

/**
 * Devolve o tempo real de reload.
 *
 * Para já não tens nenhum power-up a alterar reload,
 * mas fica centralizado aqui para o futuro.
 */
export function getEffectiveReloadTime(player: Player, _now: number): number {
  return getReloadTime(player.score);
}

/**
 * Devolve o tamanho real do carregador.
 *
 * Para já também não há modificadores, mas fica preparado.
 */
export function getEffectiveMagazineSize(player: Player, _now: number): number {
  return getMagazineSize(player.score);
}