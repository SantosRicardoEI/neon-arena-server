import type { Player } from './types';
import {
  getShootCooldown,
  getPlayerSpeed,
  getReloadTime,
  getMagazineSize,
} from './scaling';

import { playerHasPowerUp } from '../gameplay/powerups/utils';
import * as C from '../game/constants';

/**
 * Devolve o cooldown real de disparo do jogador,
 * já com power-ups aplicados.
 */
export function getEffectiveShootCooldown(player: Player, now: number): number {
  let cooldown = getShootCooldown(player.score);

  if (playerHasPowerUp(player, 'rapid_fire', now)) {
    cooldown *= C.POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER;
  }

  return cooldown;
}

/**
 * Devolve a velocidade real de movimento do jogador,
 * já com power-ups aplicados.
 */
export function getEffectiveMoveSpeed(player: Player, now: number): number {
  let speed = getPlayerSpeed(player.score);

  if (playerHasPowerUp(player, 'speed', now)) {
    speed *= C.POWERUP_SPEED_MULTIPLIER;
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