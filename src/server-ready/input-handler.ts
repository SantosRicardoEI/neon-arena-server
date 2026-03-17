/**
 * Server-ready input handler.
 * Applies player intent (from ClientMessage) to the authoritative GameState.
 *
 * Calls into src/game/simulation.ts for all gameplay formulas.
 * NO browser API dependencies.
 */
import type { GameState, Player, Vec2, PlayerSkin } from '../shared/types';
import type {
  ClientMessage,
  ClientInputMessage,
  ClientShootMessage,
  ClientDashMessage,
  ClientJoinMessage,
} from '../shared/protocol/messages';
import {
  computeMovementVelocity,
  initiateDash,
} from '../game/simulation';
import { createPlayer } from '../gameplay/players/factory';
import { createProjectile } from '../gameplay/projectiles/factory';
import { playerHasPowerUp } from '../gameplay/powerups/utils';
import { getShootCooldown, getReloadTime, getMagazineSize } from '../shared/scaling';
import * as C from '../shared/constants';
import { respawnPlayer } from './room-state';

/**
 * Apply a single client message to the authoritative game state.
 * Returns true if the message was handled.
 */
export function applyClientMessage(
  state: GameState,
  senderId: string,
  message: ClientMessage,
  now: number,
): boolean {
  switch (message.type) {
    case 'client:input':
      return handleInput(state, senderId, message, now);
    case 'client:shoot':
      return handleShoot(state, senderId, message, now);
    case 'client:dash':
      return handleDash(state, senderId, message, now);
    case 'client:reload':
      return handleReload(state, senderId, now);
    case 'client:respawn':
      return respawnPlayer(state, senderId, now);
    case 'client:join':
      return handleJoin(state, senderId, message);
    case 'client:leave':
      return handleLeave(state, senderId);
    case 'client:chat':
      // Chat is pass-through — server broadcasts but doesn't mutate game state
      return true;
    default:
      return false;
  }
}

function handleInput(
  state: GameState,
  playerId: string,
  msg: ClientInputMessage,
  now: number,
): boolean {
  const player = state.players.get(playerId);

  if (!player) {
    console.warn('[server] input rejected: player not found', { playerId, seq: msg.seq });
    return false;
  }

  if (player.health <= 0) {
    console.warn('[server] input rejected: player dead', { playerId, seq: msg.seq });
    return false;
  }

  if (player.reloadingUntil > 0 && now >= player.reloadingUntil) {
    player.ammo = getMagazineSize(player.score);
    player.reloadingUntil = 0;
  }

  const hasSpeed = playerHasPowerUp(player, 'speed', now);
  const vel = computeMovementVelocity(msg.moveDir, player.score, hasSpeed);
  player.vel.x = vel.x;
  player.vel.y = vel.y;
  player.aimAngle = msg.aimAngle;
  player.lastProcessedInputSeq = msg.seq;

  return true;
}

function handleShoot(
  state: GameState,
  playerId: string,
  msg: ClientShootMessage,
  now: number,
): boolean {
  const player = state.players.get(playerId);
  if (!player || player.health <= 0) return false;
  if (player.ammo <= 0 || player.reloadingUntil > now) return false;

  const cooldown = getShootCooldown(player.score);
  if (now - player.lastShot < cooldown) return false;

  const proj = createProjectile(player, msg.aimAngle, now);
  state.projectiles.push(proj);
  player.lastShot = now;
  player.ammo--;

  // Auto-reload when clip empty
  if (player.ammo <= 0) {
    player.reloadingUntil = now + getReloadTime(player.score);
  }

  return true;
}

function handleDash(
  state: GameState,
  playerId: string,
  msg: ClientDashMessage,
  now: number,
): boolean {
  const player = state.players.get(playerId);
  if (!player || player.health <= 0) return false;
  return initiateDash(player, msg.aimAngle, player.vel, now);
}

function handleReload(
  state: GameState,
  playerId: string,
  now: number,
): boolean {
  const player = state.players.get(playerId);
  if (!player || player.health <= 0) return false;
  if (player.reloadingUntil > now) return false;
  if (player.ammo >= getMagazineSize(player.score)) return false;

  player.reloadingUntil = now + getReloadTime(player.score);
  return true;
}

function handleJoin(
  state: GameState,
  playerId: string,
  msg: ClientJoinMessage,
): boolean {
  if (state.players.has(playerId)) return false;
  const player = createPlayer(playerId, msg.playerName, msg.color, msg.skin);
  state.players.set(playerId, player);
  return true;
}

function handleLeave(
  state: GameState,
  playerId: string,
): boolean {
  return state.players.delete(playerId);
}
