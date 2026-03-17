/**
 * Núcleo de simulação partilhado entre cliente e servidor.
 * Mantém factories de entidades, helpers reutilizáveis,
 * prediction local e simulação autoritária.
 */
import {
  Player, Projectile,
  Vec2, GameState, SimulationEvents,
} from '../shared/types';
import * as C from '../game/constants';
import {
  getPlayerRadius,
  getPlayerSpeed,
  getReloadTime,
  getDashSpeedCurve,
  getDashDuration,
  getMagazineSize,
} from '../shared/scaling';
import { segmentIntersectsCircle } from '../shared/math';
import { createEnemy } from '../gameplay/enemies/factory';
import { updateEnemiesAuthoritative } from '../gameplay/enemies/update-authoritative';
import { processProjectileVsEnemies } from '../gameplay/enemies/projectile-collision';
import { processProjectileVsBosses } from '../gameplay/bosses/projectile-collision';
import { updateBossesAuthoritative } from '../gameplay/bosses/update-authoritative';
import { processProjectileVsPlayers } from '../gameplay/players/projectile-collision';
import { updatePickupsAuthoritative } from '../gameplay/pickups/update-authoritative';
import { updatePickupsPrediction } from '../gameplay/pickups/update-prediction';
import {
  createCollectible,
  createDroppedPoints,
  createHealthPickup,
  createPowerUpItem,
} from '../gameplay/pickups/factory';
import {
  getPowerUpDuration,
  playerHasPowerUp,
} from '../gameplay/powerups/utils';
import { spawnDeathParticles } from '../gameplay/enemies/effects';
import { getEnemyConfig} from '../gameplay/enemies/registry';



/**
 * Aplica um tick de movimento a um jogador.
 * Se estiver em dash usa a curva de velocidade do dash;
 * caso contrário aplica a velocidade normal.
 * No fim limita o jogador aos limites do mapa.
 */
export function applyPlayerMovement(
  player: Player,
  dt: number,
  now: number,
  worldWidth: number,
  worldHeight: number,
): void {
  const radius = getPlayerRadius(player.score);
  if (player.isDashing && now < player.dashUntil) {
    const dashDuration = player.dashUntil - player.lastDash;
    const progress = dashDuration > 0 ? (now - player.lastDash) / dashDuration : 1;
    const speedMul = getDashSpeedCurve(Math.min(1, progress));
    const dashSpeed = C.DASH_SPEED * speedMul;
    player.pos.x += Math.cos(player.dashAngle) * dashSpeed * dt;
    player.pos.y += Math.sin(player.dashAngle) * dashSpeed * dt;
  } else {
    if (player.isDashing) player.isDashing = false;
    player.pos.x += player.vel.x * dt;
    player.pos.y += player.vel.y * dt;
  }
  player.pos.x = Math.max(radius, Math.min(worldWidth - radius, player.pos.x));
  player.pos.y = Math.max(radius, Math.min(worldHeight - radius, player.pos.y));
}

/**
 * Calcula a velocidade de movimento a partir da direção pretendida
 * e do score do jogador, incluindo multiplicador de speed power-up.
 */
export function computeMovementVelocity(
  moveDir: Vec2,
  score: number,
  hasSpeedPowerUp: boolean,
): Vec2 {
  let speed = getPlayerSpeed(score);
  if (hasSpeedPowerUp) speed *= C.POWERUP_SPEED_MULTIPLIER;
  const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
  if (len > 0) {
    return { x: (moveDir.x / len) * speed, y: (moveDir.y / len) * speed };
  }
  return { x: 0, y: 0 };
}

/**
 * Tenta iniciar um dash.
 * Devolve true se o dash arrancou, false se estava em cooldown
 * ou se o jogador já estava em dash.
 */
export function initiateDash(
  player: Player,
  aimAngle: number,
  moveDir: Vec2,
  now: number,
): boolean {
  if (player.isDashing || now - player.lastDash <= C.DASH_COOLDOWN_MS) return false;
  const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.y * moveDir.y);
  const dashAngle = len > 0 ? Math.atan2(moveDir.y, moveDir.x) : aimAngle;
  player.isDashing = true;
  player.dashUntil = now + getDashDuration(player.score);
  player.lastDash = now;
  player.dashAngle = dashAngle;
  return true;
}

/**
 * Atualizações comuns a cliente e servidor:
 * - movimento do jogador local
 * - recarga automática/manual concluída
 * - animação/pulse de pickups
 * - expiração de power-ups ativos
 */
export function updateCommon(
  state: GameState,
  localPlayer: Player,
  dt: number,
  now: number,
): { reloadCompletedPlayerIds: string[] } {
  applyPlayerMovement(localPlayer, dt, now, C.WORLD_WIDTH, C.WORLD_HEIGHT);

  let reloadCompleted = false;

  // Auto-reload when clip empty
  if (localPlayer.ammo <= 0 && now >= localPlayer.reloadingUntil && localPlayer.reloadingUntil === 0) {
    localPlayer.reloadingUntil = now + getReloadTime(localPlayer.score);
  }
  if (localPlayer.reloadingUntil > 0 && now >= localPlayer.reloadingUntil) {
    localPlayer.ammo = getMagazineSize(localPlayer.score);
    localPlayer.reloadingUntil = 0;
    reloadCompleted = true;
  }

  // Pulse phases (visual-only but harmless on server)
  for (const c of state.collectibles) c.pulsePhase += dt * 3;
  for (const dp of state.droppedPoints) dp.pulsePhase += dt * 4;
  for (const hp of state.healthPickups) hp.pulsePhase += dt * 2;
  for (const pu of state.powerUpItems) pu.pulsePhase += dt * 3.5;

  // Expire power-ups for all players
  for (const [, p] of state.players) {
    p.activePowerUps = p.activePowerUps.filter(pu => now < pu.expiresAt);
  }

    return {
    reloadCompletedPlayerIds: reloadCompleted ? [localPlayer.id] : [],
  };
}

// =============================================
// Client-side prediction (visual snappiness, no authority)
// =============================================

/**
 * Prediction local no cliente.
 * Faz andar projéteis visualmente e antecipa pickups do jogador local,
 * sem autoridade real sobre o estado final.
 */
export function updateClientPrediction(
  state: GameState,
  localPlayer: Player,
  dt: number,
  now: number,
): SimulationEvents {
  const events: SimulationEvents = {
    enemiesKilled: [],
    collectiblesGathered: [],
    playersHit: [],
    droppedPointsGathered: [],
    healthPickupsGathered: [],
    powerUpsGathered: [],
    reloadCompletedPlayerIds: [],
    playerKills: [],
  };


  // Predict projectile travel and hide impacts locally
  const visibleProjectiles: Projectile[] = [];
  for (const proj of state.projectiles) {
    proj.trail.push({ x: proj.pos.x, y: proj.pos.y });
    if (proj.trail.length > 8) proj.trail.shift();

    const nextPos = {
      x: proj.pos.x + proj.vel.x * dt,
      y: proj.pos.y + proj.vel.y * dt,
    };

    if (now - proj.createdAt > C.PROJECTILE_LIFETIME_MS) continue;
    if (nextPos.x < 0 || nextPos.x > C.WORLD_WIDTH || nextPos.y < 0 || nextPos.y > C.WORLD_HEIGHT) continue;

    let hitSomething = false;
    for (const enemy of state.enemies) {
      const cfg = getEnemyConfig(enemy.type);
      if (segmentIntersectsCircle(proj.pos, nextPos, enemy.pos, cfg.size / 2 + C.PROJECTILE_WIDTH)) {
        hitSomething = true;
        break;
      }
    }
    if (hitSomething) continue;

    for (const boss of state.bosses) {
      if (segmentIntersectsCircle(proj.pos, nextPos, boss.pos, boss.size / 2 + C.PROJECTILE_WIDTH)) {
        hitSomething = true;
        break;
      }
    }

    for (const [pid, p] of state.players) {
      if (pid === proj.ownerId || p.health <= 0) continue;
      const pRadius = getPlayerRadius(p.score);
      if (segmentIntersectsCircle(proj.pos, nextPos, p.pos, pRadius + C.PROJECTILE_WIDTH)) {
        hitSomething = true;
        break;
      }
    }
    if (hitSomething) continue;

    proj.pos.x = nextPos.x;
    proj.pos.y = nextPos.y;
    visibleProjectiles.push(proj);
  }
  state.projectiles = visibleProjectiles;

  updatePickupsPrediction(state, localPlayer, events);

  return events;
}

/**
 * Simulação autoritária.
 * Trata spawn periódico, inimigos, bosses, projéteis e pickups.
 * É a fonte de verdade no host/servidor.
 */
export function updateAuthoritative(
  state: GameState,
  dt: number,
  now: number,
): SimulationEvents {
  const events: SimulationEvents = {
    enemiesKilled: [],
    collectiblesGathered: [],
    playersHit: [],
    droppedPointsGathered: [],
    healthPickupsGathered: [],
    powerUpsGathered: [],
    reloadCompletedPlayerIds: [],
    playerKills: [],
  };

  // Periodic enemy spawning (scaled by player count)
  const playerCount = state.players.size;
  const spawnInterval = Math.max(
    C.ENEMY_SPAWN_INTERVAL_MIN_MS,
    C.ENEMY_SPAWN_INTERVAL_BASE_MS / (1 + (playerCount - 1) * C.ENEMY_SPAWN_INTERVAL_PLAYER_FACTOR)
  );
  if (state.enemies.length < C.ENEMY_MAX_COUNT && now - state.lastEnemySpawn > spawnInterval) {
    const batch = C.ENEMY_SPAWN_BATCH_BASE + (playerCount - 1) * C.ENEMY_SPAWN_BATCH_PER_PLAYER;
    for (let i = 0; i < batch && state.enemies.length < C.ENEMY_MAX_COUNT; i++) {
      state.enemies.push(createEnemy());
    }
    state.lastEnemySpawn = now;
  }

  // Spawn health pickups periodically
  if (state.healthPickups.length < C.MAX_HEALTH_PICKUPS && now - state.lastHealthPickupSpawn > C.HEALTH_PICKUP_SPAWN_INTERVAL_MS) {
    state.healthPickups.push(createHealthPickup());
    state.lastHealthPickupSpawn = now;
  }

  // Spawn power-ups periodically
  if (state.powerUpItems.length < C.POWERUP_MAX_COUNT && now - state.lastPowerUpSpawn > C.POWERUP_SPAWN_INTERVAL_MS) {
    state.powerUpItems.push(createPowerUpItem());
    state.lastPowerUpSpawn = now;
  }

  // Remove expired dropped points
  state.droppedPoints = state.droppedPoints.filter(dp => now - dp.createdAt < C.DROPPED_POINTS_LIFETIME_MS);

    updateEnemiesAuthoritative(state, dt, now, events, {
    playerHasPowerUp,
    createDroppedPoints,
  });

    updateBossesAuthoritative(state, dt, now, events, {
    playerHasPowerUp,
    createDroppedPoints,
  });


  const aliveProjectiles: Projectile[] = [];
  for (const proj of state.projectiles) {
    proj.trail.push({ x: proj.pos.x, y: proj.pos.y });
    if (proj.trail.length > 8) proj.trail.shift();

    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;

    if (now - proj.createdAt > C.PROJECTILE_LIFETIME_MS) continue;
    if (proj.pos.x < 0 || proj.pos.x > C.WORLD_WIDTH || proj.pos.y < 0 || proj.pos.y > C.WORLD_HEIGHT) continue;

      const hitEnemy = processProjectileVsEnemies(state, proj, now, events, {
        playerHasPowerUp,
        createDroppedPoints,
        spawnDeathParticles,
    });

    if (hitEnemy) continue;

    const hitBoss = processProjectileVsBosses(state, proj, now, events);
    if (hitBoss) continue;

      const hitPlayer = processProjectileVsPlayers(state, proj, now, events, {
      playerHasPowerUp,
      createDroppedPoints,
    });
    if (hitPlayer) continue;

    aliveProjectiles.push(proj);
  }
  state.projectiles = aliveProjectiles;

    updatePickupsAuthoritative(state, now, events, {
    createEnemy: () => createEnemy(),
    createCollectible,
    getPowerUpDuration,
  });

  return events;
}

/**
 * Atualiza toda a lógica de jogo para o frame atual.
 * Em host usa simulação autoritária.
 * Em cliente não-host usa prediction local.
 * Mantido por compatibilidade com o GameEngine atual.
 */
export function updateGameState(
  state: GameState,
  localPlayerId: string,
  dt: number,
  now: number,
  isHost: boolean,
): SimulationEvents {
  const localPlayer = state.players.get(localPlayerId);
  if (!localPlayer) {
    return {
      enemiesKilled: [], collectiblesGathered: [], playersHit: [],
      droppedPointsGathered: [], healthPickupsGathered: [], powerUpsGathered: [],
      reloadCompletedPlayerIds: [], playerKills: [],
    };
  }

  const common = updateCommon(state, localPlayer, dt, now);

  if (isHost) {
    // Authoritative: move ALL players, run full simulation
    for (const [pid, p] of state.players) {
      if (pid !== localPlayerId) {
        applyPlayerMovement(p, dt, now, C.WORLD_WIDTH, C.WORLD_HEIGHT);
      }
    }
    const events = updateAuthoritative(state, dt, now);
    events.reloadCompletedPlayerIds.push(...common.reloadCompletedPlayerIds);
    return events;
  } else {
    const events = updateClientPrediction(state, localPlayer, dt, now);
    events.reloadCompletedPlayerIds.push(...common.reloadCompletedPlayerIds);
    return events;
  }
}