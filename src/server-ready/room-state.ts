/**
 * Server-ready game state management and simulation stepping.
 * NO browser API dependencies. Can run in Node.js / Railway.
 *
 * These are helper functions for managing authoritative game state,
 * boss scheduling, round management, and respawning.
 */
import {
  GameState
} from '../shared/types';
import * as C from '../shared/constants';
import { getMagazineSize } from '../shared/scaling';

import {
  createCollectible,
} from '../gameplay/pickups/factory';
import { BOSS_REGISTRY } from '../gameplay/bosses/registry';
import { createBoss } from '../gameplay/bosses/factory';
import { createEnemy } from '../gameplay/enemies/factory';
import { BOSS_SCHEDULE } from '../gameplay/bosses/schedule';

export interface CreateGameStateOptions {
  seedInitialEnemies?: boolean;
  seedInitialCollectibles?: boolean;
}

// =============================================
// Game State Factory
// =============================================

/** Create a fresh GameState for a new room */
/** Create a fresh GameState for a new room */
export function createGameState(
  roomName: string,
  now: number,
  options: CreateGameStateOptions = {},
): GameState {
  const {
    seedInitialEnemies = true,
    seedInitialCollectibles = true,
  } = options;

  const state: GameState = {
    players: new Map(),
    enemies: [],
    bosses: [],
    projectiles: [],
    collectibles: [],
    droppedPoints: [],
    healthPickups: [],
    powerUpItems: [],
    explosions: [],
    deathParticles: [],
    chatMessages: [],
    worldWidth: C.WORLD_WIDTH,
    worldHeight: C.WORLD_HEIGHT,
    lastHealthPickupSpawn: 0,
    lastEnemySpawn: 0,
    lastPowerUpSpawn: 0,
    hostId: null,
    roomName,
    roundStartTime: now,
    roundOver: false,
    restartCountdownStart: 0,
    bossSpawnEvents: [],
    bossDefeatEvents: [],
    bossScheduleTriggered: new Set(),
  };

  if (seedInitialEnemies) {
    for (let i = 0; i < C.INITIAL_ENEMIES; i++) {
      state.enemies.push(createEnemy());
    }
  }

  if (seedInitialCollectibles) {
    for (let i = 0; i < C.INITIAL_COLLECTIBLES; i++) {
      state.collectibles.push(createCollectible());
    }
  }

  return state;
}

// =============================================
// Boss Schedule Management
// =============================================

export interface BossScheduleEvent {
  type: 'warning' | 'spawn';
  bossName: string;
}

/** Update boss spawn schedule. Returns events for chat/announcements. */
export function updateBossSchedule(state: GameState, now: number): BossScheduleEvent[] {
  const events: BossScheduleEvent[] = [];
  const elapsed = now - state.roundStartTime;

  for (let i = 0; i < BOSS_SCHEDULE.length; i++) {
    if (state.bossScheduleTriggered.has(i)) continue;
    const entry = BOSS_SCHEDULE[i];
    const warningTime = entry.spawnAtMs - C.BOSS_SPAWN_WARNING_MS;

    // Start warning countdown
    if (elapsed >= warningTime && !state.bossSpawnEvents.some(e => e.scheduleIndex === i)) {
      const def = BOSS_REGISTRY.find(b => b.id === entry.bossId);
      if (!def) continue;
      state.bossSpawnEvents.push({
        scheduleIndex: i,
        bossId: entry.bossId,
        bossName: def.name,
        warningStartedAt: now,
        spawned: false,
      });
      events.push({ type: 'warning', bossName: def.name });
    }

    // Actually spawn
    if (elapsed >= entry.spawnAtMs) {
      const evt = state.bossSpawnEvents.find(e => e.scheduleIndex === i);
      if (evt && !evt.spawned) {
        const def = BOSS_REGISTRY.find(b => b.id === entry.bossId);
        if (def) {
          const boss = createBoss(def);
          state.bosses.push(boss);
          evt.spawned = true;
          state.bossScheduleTriggered.add(i);
          events.push({ type: 'spawn', bossName: def.name });
        }
      }
    }
  }

  // Remove old spawn events
  state.bossSpawnEvents = state.bossSpawnEvents.filter(
    e => !e.spawned || now - e.warningStartedAt < C.BOSS_SPAWN_WARNING_MS + 2000
  );

  // Remove old defeat events
  state.bossDefeatEvents = state.bossDefeatEvents.filter(
    e => now - e.timestamp < C.BOSS_DEFEAT_BANNER_MS
  );

  return events;
}

// =============================================
// Round Management
// =============================================

/** Check round timer and return whether the round just ended */
export function checkRoundTimer(state: GameState, now: number): { roundJustEnded: boolean; shouldRestart: boolean } {
  const elapsed = now - state.roundStartTime;

  if (!state.roundOver && elapsed >= C.ROUND_DURATION_MS) {
    state.roundOver = true;
    state.restartCountdownStart = now;
    return { roundJustEnded: true, shouldRestart: false };
  }

  if (state.roundOver && state.restartCountdownStart > 0) {
    const countdownElapsed = now - state.restartCountdownStart;
    if (countdownElapsed >= C.ROUND_RESTART_COUNTDOWN_MS) {
      return { roundJustEnded: false, shouldRestart: true };
    }
  }

  return { roundJustEnded: false, shouldRestart: false };
}

/** Reset state for a new round */
export function resetRound(state: GameState, now: number): void {
  for (const [, p] of state.players) {
    p.health = p.maxHealth;
    p.score = 0;
    p.ammo = getMagazineSize(0);
    p.reloadingUntil = 0;
    p.invincibleUntil = 0;
    p.activePowerUps = [];
    p.pos.x = C.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 400;
    p.pos.y = C.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 400;
  }
  state.enemies = [];
  state.bosses = [];
  state.projectiles = [];
  state.droppedPoints = [];
  state.healthPickups = [];
  state.powerUpItems = [];
  state.explosions = [];
  state.deathParticles = [];
  state.collectibles = [];
  for (let i = 0; i < C.INITIAL_ENEMIES; i++) state.enemies.push(createEnemy());
  for (let i = 0; i < C.INITIAL_COLLECTIBLES; i++) state.collectibles.push(createCollectible());
  state.lastEnemySpawn = now;
  state.lastHealthPickupSpawn = now;
  state.lastPowerUpSpawn = now;
  state.bossSpawnEvents = [];
  state.bossDefeatEvents = [];
  state.bossScheduleTriggered = new Set();
  state.roundStartTime = now;
  state.roundOver = false;
  state.restartCountdownStart = 0;
}

// =============================================
// Respawn Management
// =============================================

/** Find a safe respawn position away from enemies */
export function findSafeRespawnPosition(state: GameState): { x: number; y: number } {
  const margin = 120;
  const safeDistanceSq = C.RESPAWN_SAFE_DISTANCE_FROM_ENEMIES * C.RESPAWN_SAFE_DISTANCE_FROM_ENEMIES;

  for (let i = 0; i < C.RESPAWN_SAFE_POSITION_MAX_ATTEMPTS; i++) {
    const x = margin + Math.random() * (C.WORLD_WIDTH - margin * 2);
    const y = margin + Math.random() * (C.WORLD_HEIGHT - margin * 2);

    const tooCloseToEnemy = state.enemies.some((enemy) => {
      const dx = enemy.pos.x - x;
      const dy = enemy.pos.y - y;
      return dx * dx + dy * dy < safeDistanceSq;
    });

    if (!tooCloseToEnemy) {
      return { x, y };
    }
  }

  return {
    x: C.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 400,
    y: C.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 400,
  };
}

/** Respawn a player at a safe position */
export function respawnPlayer(state: GameState, playerId: string, now: number): boolean {
  if (state.roundOver) return false;
  const player = state.players.get(playerId);
  if (!player || player.health > 0) return false;

  const spawnPos = findSafeRespawnPosition(state);
  player.health = player.maxHealth;
  player.score = 0;
  player.ammo = getMagazineSize(0);
  player.reloadingUntil = 0;
  player.lastShot = 0;
  player.isDashing = false;
  player.activePowerUps = [];
  player.pos.x = spawnPos.x;
  player.pos.y = spawnPos.y;
  player.targetPos = { x: spawnPos.x, y: spawnPos.y };
  player.invincibleUntil = now + C.RESPAWN_INVINCIBLE_MS;
  return true;
}

// =============================================
// Cleanup helpers
// =============================================

/** Remove expired visual entities (explosions, death particles, chat) */
export function cleanupExpiredEntities(state: GameState, now: number): void {
  const maxExplosionDuration = Math.max(C.ENEMY_EXPLODER_EXPLOSION_DURATION_MS, C.BOSS_SHOCKWAVE_DURATION_MS);
  state.explosions = state.explosions.filter(e => now - e.createdAt < maxExplosionDuration);
  state.deathParticles = state.deathParticles.filter(p => now - p.createdAt < C.DEATH_PARTICLE_LIFETIME_MS);
  const chatExpiry = now - C.CHAT_MESSAGE_VISIBLE_MS;
  state.chatMessages = state.chatMessages.filter(m => m.timestamp > chatExpiry);
}
