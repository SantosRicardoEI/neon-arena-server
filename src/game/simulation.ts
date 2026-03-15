/**
 * Pure game simulation logic — entity factories, collision detection,
 * AI updates, pickup logic. NO browser API dependencies.
 *
 * This is the authoritative simulation that both the client (for prediction)
 * and a future server will use.
 */
import {
  Player, Enemy, EnemyType, Projectile, Collectible, DroppedPoints,
  HealthPickup, PowerUpItem, PowerUpType, DeathParticle, Boss,
  Vec2, GameState, PlayerSkin, SimulationEvents,
} from '../shared/types';
import * as C from '../game/constants';
import { getPlayerRadius, getPlayerSpeed, getReloadTime, getDashSpeedCurve, getDashDuration, getMagazineSize } from '../shared/scaling';
import { dist, segmentIntersectsCircle } from '../shared/math';

// =============================================
// ID generation
// =============================================

let nextId = 0;
export function genId(): string {
  return `e${nextId++}_${Math.random().toString(36).slice(2, 6)}`;
}

// =============================================
// Enemy variant config helper
// =============================================

export interface EnemyConfig {
  size: number;
  health: number;
  speedPassive: number;
  speedAggressive: number;
  detectRange: number;
  damage: number;
  killScore: number;
}

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  switch (type) {
    case 'fast':
      return {
        size: C.ENEMY_FAST_SIZE,
        health: C.ENEMY_FAST_HEALTH,
        speedPassive: C.ENEMY_FAST_SPEED_PASSIVE,
        speedAggressive: C.ENEMY_FAST_SPEED_AGGRESSIVE,
        detectRange: C.ENEMY_FAST_DETECT_RANGE,
        damage: C.ENEMY_FAST_DAMAGE,
        killScore: C.ENEMY_FAST_KILL_SCORE,
      };
    case 'tank':
      return {
        size: C.ENEMY_TANK_SIZE,
        health: C.ENEMY_TANK_HEALTH,
        speedPassive: C.ENEMY_TANK_SPEED_PASSIVE,
        speedAggressive: C.ENEMY_TANK_SPEED_AGGRESSIVE,
        detectRange: C.ENEMY_TANK_DETECT_RANGE,
        damage: C.ENEMY_TANK_DAMAGE,
        killScore: C.ENEMY_TANK_KILL_SCORE,
      };
    case 'exploder':
      return {
        size: C.ENEMY_EXPLODER_SIZE,
        health: C.ENEMY_EXPLODER_HEALTH,
        speedPassive: C.ENEMY_EXPLODER_SPEED_PASSIVE,
        speedAggressive: C.ENEMY_EXPLODER_SPEED_AGGRESSIVE,
        detectRange: C.ENEMY_EXPLODER_DETECT_RANGE,
        damage: C.ENEMY_EXPLODER_DAMAGE,
        killScore: C.ENEMY_EXPLODER_KILL_SCORE,
      };
    default:
      return {
        size: C.ENEMY_NORMAL_SIZE,
        health: C.ENEMY_NORMAL_HEALTH,
        speedPassive: C.ENEMY_NORMAL_SPEED_PASSIVE,
        speedAggressive: C.ENEMY_NORMAL_SPEED_AGGRESSIVE,
        detectRange: C.ENEMY_NORMAL_DETECT_RANGE,
        damage: C.ENEMY_NORMAL_DAMAGE,
        killScore: C.ENEMY_NORMAL_KILL_SCORE,
      };
  }
}

function getEnemyHue(type: EnemyType): number {
  switch (type) {
    case 'fast': return 160;
    case 'tank': return 25;
    case 'exploder': return 50;
    default: return 280;
  }
}

// =============================================
// Factory functions
// =============================================

export function createPlayer(id: string, name: string, color: string, skin: PlayerSkin = 'circle'): Player {
  return {
    id,
    name,
    pos: { x: C.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 400, y: C.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 400 },
    vel: { x: 0, y: 0 },
    health: C.PLAYER_MAX_HEALTH,
    maxHealth: C.PLAYER_MAX_HEALTH,
    score: 0,
    aimAngle: 0,
    lastShot: 0,
    invincibleUntil: 0,
    color,
    skin,
    ammo: C.MAGAZINE_SIZE,
    reloadingUntil: 0,
    lastDash: 0,
    isDashing: false,
    dashUntil: 0,
    dashAngle: 0,
    activePowerUps: [],
    targetPos: null,
    targetAimAngle: null,
    lastNetworkUpdate: 0,
    lastProcessedInputSeq: -1,
  };
}

function pickEnemyType(): EnemyType {
  const total = C.ENEMY_SPAWN_WEIGHT_NORMAL + C.ENEMY_SPAWN_WEIGHT_FAST + C.ENEMY_SPAWN_WEIGHT_TANK + C.ENEMY_SPAWN_WEIGHT_EXPLODER;
  let r = Math.random() * total;
  r -= C.ENEMY_SPAWN_WEIGHT_NORMAL;
  if (r <= 0) return 'normal';
  r -= C.ENEMY_SPAWN_WEIGHT_FAST;
  if (r <= 0) return 'fast';
  r -= C.ENEMY_SPAWN_WEIGHT_TANK;
  if (r <= 0) return 'tank';
  return 'exploder';
}

export function createEnemy(forceType?: EnemyType): Enemy {
  const type = forceType ?? pickEnemyType();
  const cfg = getEnemyConfig(type);

  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;
  switch (edge) {
    case 0: x = Math.random() * C.WORLD_WIDTH; y = 0; break;
    case 1: x = C.WORLD_WIDTH; y = Math.random() * C.WORLD_HEIGHT; break;
    case 2: x = Math.random() * C.WORLD_WIDTH; y = C.WORLD_HEIGHT; break;
    default: x = 0; y = Math.random() * C.WORLD_HEIGHT; break;
  }
  const angle = Math.random() * Math.PI * 2;
  return {
    id: genId(),
    type,
    pos: { x, y },
    vel: { x: Math.cos(angle) * cfg.speedPassive, y: Math.sin(angle) * cfg.speedPassive },
    health: cfg.health,
    maxHealth: cfg.health,
    state: 'passive',
    targetPlayerId: null,
    stateChangeTime: 0,
    targetPos: null,
    lastNetworkUpdate: 0,
  };
}

export function createCollectible(): Collectible {
  return {
    id: genId(),
    pos: {
      x: 100 + Math.random() * (C.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (C.WORLD_HEIGHT - 200),
    },
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function createDroppedPoints(pos: Vec2, value: number, now: number): DroppedPoints {
  return {
    id: genId(),
    pos: { x: pos.x + (Math.random() - 0.5) * 30, y: pos.y + (Math.random() - 0.5) * 30 },
    value,
    pulsePhase: Math.random() * Math.PI * 2,
    createdAt: now,
  };
}

export function createHealthPickup(): HealthPickup {
  return {
    id: genId(),
    pos: {
      x: 100 + Math.random() * (C.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (C.WORLD_HEIGHT - 200),
    },
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

function pickPowerUpType(): PowerUpType {
  const types: PowerUpType[] = ['speed', 'rapid_fire', 'shield'];
  return types[Math.floor(Math.random() * types.length)];
}

export function createPowerUpItem(forceType?: PowerUpType): PowerUpItem {
  return {
    id: genId(),
    type: forceType ?? pickPowerUpType(),
    pos: {
      x: 100 + Math.random() * (C.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (C.WORLD_HEIGHT - 200),
    },
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function createBoss(def: C.BossDefinition): Boss {
  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;
  switch (edge) {
    case 0: x = Math.random() * C.WORLD_WIDTH; y = 0; break;
    case 1: x = C.WORLD_WIDTH; y = Math.random() * C.WORLD_HEIGHT; break;
    case 2: x = Math.random() * C.WORLD_WIDTH; y = C.WORLD_HEIGHT; break;
    default: x = 0; y = Math.random() * C.WORLD_HEIGHT; break;
  }
  return {
    id: genId(),
    definitionId: def.id,
    name: def.name,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    health: def.health,
    maxHealth: def.health,
    size: def.size,
    speed: def.speed,
    damage: def.damage,
    detectRange: def.detectRange,
    killScore: def.killScore,
    color: def.color,
    glowColor: def.glowColor,
    targetPlayerId: null,
    lastShockwave: 0,
  };
}

export function createProjectile(owner: Player, angle: number, now: number): Projectile {
  const r = getPlayerRadius(owner.score);
  return {
    id: genId(),
    pos: {
      x: owner.pos.x + Math.cos(angle) * (r + 4),
      y: owner.pos.y + Math.sin(angle) * (r + 4),
    },
    vel: { x: Math.cos(angle) * C.PROJECTILE_SPEED, y: Math.sin(angle) * C.PROJECTILE_SPEED },
    ownerId: owner.id,
    createdAt: now,
    trail: [],
  };
}

// =============================================
// Utility helpers
// =============================================

export function getPowerUpDuration(type: PowerUpType): number {
  switch (type) {
    case 'speed': return C.POWERUP_SPEED_DURATION_MS;
    case 'rapid_fire': return C.POWERUP_RAPID_FIRE_DURATION_MS;
    case 'shield': return C.POWERUP_SHIELD_DURATION_MS;
  }
}

export function playerHasPowerUp(player: Player, type: PowerUpType, now: number): boolean {
  return player.activePowerUps.some(pu => pu.type === type && now < pu.expiresAt);
}

export function spawnDeathParticles(state: GameState, pos: Vec2, type: EnemyType, now: number) {
  const hue = getEnemyHue(type);
  for (let i = 0; i < C.DEATH_PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = C.DEATH_PARTICLE_SPEED_MIN + Math.random() * (C.DEATH_PARTICLE_SPEED_MAX - C.DEATH_PARTICLE_SPEED_MIN);
    state.deathParticles.push({
      pos: { x: pos.x, y: pos.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      createdAt: now,
      hue: hue + (Math.random() - 0.5) * 30,
      size: C.DEATH_PARTICLE_SIZE_MIN + Math.random() * (C.DEATH_PARTICLE_SIZE_MAX - C.DEATH_PARTICLE_SIZE_MIN),
    });
  }
}

// =============================================
// Reusable movement helpers (used by both simulation and client prediction)
// =============================================

/**
 * Apply one tick of movement to a player: dash physics or normal velocity,
 * then clamp to world bounds. Mutates player in place.
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
 * Compute movement velocity from a normalised direction + player score.
 * Applies speed power-up multiplier if active.
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
 * Initiate a dash on a player. Returns true if dash was started.
 * Does NOT play audio — caller is responsible for SFX.
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

// =============================================
// Common simulation (runs on both host and client)
// =============================================

/** Shared per-tick updates: player movement, reload, pulse phases, power-up expiry */
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

/** Client-side prediction: projectile travel, pickup hints. NOT authoritative. */
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

  const localRadius = getPlayerRadius(localPlayer.score);

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

  // Predict collectible pickup
  for (let i = state.collectibles.length - 1; i >= 0; i--) {
    const c = state.collectibles[i];
    if (dist(localPlayer.pos, c.pos) < localRadius + C.COLLECTIBLE_SIZE / 2) {
      events.collectiblesGathered.push(c.id);
      state.collectibles.splice(i, 1);
      break;
    }
  }
  // Predict dropped points pickup
  for (let i = state.droppedPoints.length - 1; i >= 0; i--) {
    const dp = state.droppedPoints[i];
    if (dist(localPlayer.pos, dp.pos) < localRadius + C.DROPPED_POINTS_SIZE / 2) {
      events.droppedPointsGathered.push({ id: dp.id, pickerId: localPlayer.id, pickerName: localPlayer.name, value: dp.value });
      state.droppedPoints.splice(i, 1);
      break;
    }
  }
  // Predict health pickup
  for (let i = state.healthPickups.length - 1; i >= 0; i--) {
    const hp = state.healthPickups[i];
    if (localPlayer.health < localPlayer.maxHealth && dist(localPlayer.pos, hp.pos) < localRadius + C.HEALTH_PICKUP_SIZE / 2) {
      events.healthPickupsGathered.push({ id: hp.id, pickerId: localPlayer.id, pickerName: localPlayer.name });
      state.healthPickups.splice(i, 1);
      break;
    }
  }
  // Predict power-up pickup
  for (let i = state.powerUpItems.length - 1; i >= 0; i--) {
    const pu = state.powerUpItems[i];
    if (dist(localPlayer.pos, pu.pos) < localRadius + C.POWERUP_SIZE / 2) {
      state.powerUpItems.splice(i, 1);
      break;
    }
  }

  return events;
}

// =============================================
// Authoritative simulation (host / future server)
// =============================================

/**
 * Authoritative simulation tick: enemy AI, spawning, collisions, damage,
 * projectile resolution, pickups. This is the source of truth.
 *
 * Called by the host in the current architecture, and by the future
 * dedicated server's simulation step.
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

  // Update enemies
  for (const enemy of state.enemies) {
    const cfg = getEnemyConfig(enemy.type);
    let closestPlayer: Player | null = null;
    let closestDist = cfg.detectRange;
    for (const [, p] of state.players) {
      if (p.health <= 0) continue;
      const d = dist(enemy.pos, p.pos);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = p;
      }
    }

    if (closestPlayer) {
      if (enemy.state === 'passive') enemy.stateChangeTime = now;
      enemy.state = 'aggressive';
      enemy.targetPlayerId = closestPlayer.id;
      const angle = Math.atan2(closestPlayer.pos.y - enemy.pos.y, closestPlayer.pos.x - enemy.pos.x);
      enemy.vel.x = Math.cos(angle) * cfg.speedAggressive;
      enemy.vel.y = Math.sin(angle) * cfg.speedAggressive;
    } else {
      if (enemy.state === 'aggressive') enemy.stateChangeTime = now;
      enemy.state = 'passive';
      enemy.targetPlayerId = null;
    }

    enemy.pos.x += enemy.vel.x * dt;
    enemy.pos.y += enemy.vel.y * dt;

    if (enemy.pos.x < 0 || enemy.pos.x > C.WORLD_WIDTH) {
      enemy.vel.x *= -1;
      enemy.pos.x = Math.max(0, Math.min(C.WORLD_WIDTH, enemy.pos.x));
    }
    if (enemy.pos.y < 0 || enemy.pos.y > C.WORLD_HEIGHT) {
      enemy.vel.y *= -1;
      enemy.pos.y = Math.max(0, Math.min(C.WORLD_HEIGHT, enemy.pos.y));
    }

    // Enemy-player collision
    for (const [pid, p] of state.players) {
      if (p.health <= 0 || now <= p.invincibleUntil) continue;
      const pRadius = getPlayerRadius(p.score);
      const d = dist(enemy.pos, p.pos);
      if (d < pRadius + cfg.size / 2) {
        const dmg = playerHasPowerUp(p, 'shield', now) ? Math.ceil(cfg.damage * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER) : cfg.damage;
        p.health -= dmg;
        p.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;
        if (p.health <= 0) {
          p.health = 0;
          if (p.score > 0) {
            state.droppedPoints.push(createDroppedPoints(p.pos, p.score, now));
            p.score = 0;
          }
        }
        events.playersHit.push({ playerId: pid, damage: cfg.damage });
      }
    }
  }

  // Update bosses (AI movement + player collision + shockwave)
  for (const boss of state.bosses) {
    let closestPlayer: Player | null = null;
    let closestDist = boss.detectRange;
    for (const [, p] of state.players) {
      if (p.health <= 0) continue;
      const d = dist(boss.pos, p.pos);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = p;
      }
    }

    if (closestPlayer) {
      boss.targetPlayerId = closestPlayer.id;
      const angle = Math.atan2(closestPlayer.pos.y - boss.pos.y, closestPlayer.pos.x - boss.pos.x);
      boss.vel.x = Math.cos(angle) * boss.speed;
      boss.vel.y = Math.sin(angle) * boss.speed;
    } else {
      boss.targetPlayerId = null;
      boss.vel.x = Math.cos(now * 0.0003) * boss.speed * 0.3;
      boss.vel.y = Math.sin(now * 0.0004) * boss.speed * 0.3;
    }

    boss.pos.x += boss.vel.x * dt;
    boss.pos.y += boss.vel.y * dt;
    boss.pos.x = Math.max(boss.size / 2, Math.min(C.WORLD_WIDTH - boss.size / 2, boss.pos.x));
    boss.pos.y = Math.max(boss.size / 2, Math.min(C.WORLD_HEIGHT - boss.size / 2, boss.pos.y));

    // Shockwave AoE attack
    const def = C.BOSS_REGISTRY.find(d => d.id === boss.definitionId);
    if (def && def.shockwaveRadius > 0 && now - boss.lastShockwave > def.shockwaveCooldownMs) {
      let playerNearby = false;
      for (const [, p] of state.players) {
        if (p.health <= 0) continue;
        if (dist(boss.pos, p.pos) < def.shockwaveTriggerRange) {
          playerNearby = true;
          break;
        }
      }
      if (playerNearby) {
        boss.lastShockwave = now;
        state.explosions.push({
          pos: { x: boss.pos.x, y: boss.pos.y },
          radius: def.shockwaveRadius,
          createdAt: now,
        });
        for (const [pid, p] of state.players) {
          if (p.health <= 0 || now <= p.invincibleUntil) continue;
          if (dist(boss.pos, p.pos) < def.shockwaveRadius) {
            const dmg = playerHasPowerUp(p, 'shield', now) ? Math.ceil(def.shockwaveDamage * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER) : def.shockwaveDamage;
            p.health -= dmg;
            p.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;
            if (p.health <= 0) {
              p.health = 0;
              if (p.score > 0) {
                state.droppedPoints.push(createDroppedPoints(p.pos, p.score, now));
                p.score = 0;
              }
            }
            events.playersHit.push({ playerId: pid, damage: def.shockwaveDamage });
          }
        }
      }
    }

    // Boss-player collision damage
    for (const [pid, p] of state.players) {
      if (p.health <= 0 || now <= p.invincibleUntil) continue;
      const pRadius = getPlayerRadius(p.score);
      const d = dist(boss.pos, p.pos);
      if (d < pRadius + boss.size / 2) {
        const dmg = playerHasPowerUp(p, 'shield', now) ? Math.ceil(boss.damage * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER) : boss.damage;
        p.health -= dmg;
        p.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;
        if (p.health <= 0) {
          p.health = 0;
          if (p.score > 0) {
            state.droppedPoints.push(createDroppedPoints(p.pos, p.score, now));
            p.score = 0;
          }
        }
        events.playersHit.push({ playerId: pid, damage: boss.damage });
      }
    }
  }

  const aliveProjectiles: Projectile[] = [];
  for (const proj of state.projectiles) {
    proj.trail.push({ x: proj.pos.x, y: proj.pos.y });
    if (proj.trail.length > 8) proj.trail.shift();

    proj.pos.x += proj.vel.x * dt;
    proj.pos.y += proj.vel.y * dt;

    if (now - proj.createdAt > C.PROJECTILE_LIFETIME_MS) continue;
    if (proj.pos.x < 0 || proj.pos.x > C.WORLD_WIDTH || proj.pos.y < 0 || proj.pos.y > C.WORLD_HEIGHT) continue;

    let hitEnemy = false;
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];
      const cfg = getEnemyConfig(enemy.type);
      if (dist(proj.pos, enemy.pos) < cfg.size / 2 + C.PROJECTILE_WIDTH) {
        enemy.health -= 1;
        if (enemy.health <= 0) {
          spawnDeathParticles(state, enemy.pos, enemy.type, now);
          state.enemies.splice(i, 1);
          events.enemiesKilled.push(enemy.id);
          const owner = state.players.get(proj.ownerId);
          if (owner) owner.score += cfg.killScore;

          if (enemy.type === 'exploder') {
            state.explosions.push({
              pos: { x: enemy.pos.x, y: enemy.pos.y },
              radius: C.ENEMY_EXPLODER_EXPLOSION_RADIUS,
              createdAt: now,
            });
            for (const [pid, p] of state.players) {
              if (p.health <= 0) continue;
              const d = dist(enemy.pos, p.pos);
              if (d < C.ENEMY_EXPLODER_EXPLOSION_RADIUS) {
                const explDmg = playerHasPowerUp(p, 'shield', now) ? Math.ceil(C.ENEMY_EXPLODER_EXPLOSION_DAMAGE * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER) : C.ENEMY_EXPLODER_EXPLOSION_DAMAGE;
                p.health -= explDmg;
                p.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;
                if (p.health <= 0) {
                  p.health = 0;
                  if (p.score > 0) {
                    state.droppedPoints.push(createDroppedPoints(p.pos, p.score, now));
                    p.score = 0;
                  }
                }
                events.playersHit.push({ playerId: pid, damage: C.ENEMY_EXPLODER_EXPLOSION_DAMAGE });
              }
            }
          }
        } else {
          if (enemy.state === 'passive') enemy.stateChangeTime = now;
          enemy.state = 'aggressive';
        }
        hitEnemy = true;
        break;
      }
    }
    if (hitEnemy) continue;

    let hitBoss = false;
    for (let i = state.bosses.length - 1; i >= 0; i--) {
      const boss = state.bosses[i];
      if (dist(proj.pos, boss.pos) < boss.size / 2 + C.PROJECTILE_WIDTH) {
        boss.health -= 1;
        if (boss.health <= 0) {
          const owner = state.players.get(proj.ownerId);
          if (owner) {
            owner.score += boss.killScore;
            state.bossDefeatEvents.push({
              bossName: boss.name,
              killerName: owner.name,
              timestamp: now,
            });
          }
          state.bosses.splice(i, 1);
          events.enemiesKilled.push(boss.id);
        }
        hitBoss = true;
        break;
      }
    }
    if (hitBoss) continue;

    let hitPlayer = false;
    for (const [pid, p] of state.players) {
      if (pid === proj.ownerId) continue;
      const pRadius = getPlayerRadius(p.score);
      if (p.health > 0 && now > p.invincibleUntil && dist(proj.pos, p.pos) < pRadius + C.PROJECTILE_WIDTH) {
        const projDmg = playerHasPowerUp(p, 'shield', now) ? Math.ceil(C.PROJECTILE_DAMAGE * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER) : C.PROJECTILE_DAMAGE;
        p.health -= projDmg;
        p.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;
        if (p.health <= 0) {
          p.health = 0;
          const killer = state.players.get(proj.ownerId);
          if (killer) {
            killer.score += C.KILL_SCORE;
            events.playerKills.push({ killerId: proj.ownerId, killerName: killer.name, victimId: pid, victimName: p.name });
          }
          if (p.score > 0) {
            state.droppedPoints.push(createDroppedPoints(p.pos, p.score, now));
            p.score = 0;
          }
        }
        events.playersHit.push({ playerId: pid, damage: C.PROJECTILE_DAMAGE });
        hitPlayer = true;
        break;
      }
    }
    if (hitPlayer) continue;

    aliveProjectiles.push(proj);
  }
  state.projectiles = aliveProjectiles;

  // Check collectible pickup
  for (let i = state.collectibles.length - 1; i >= 0; i--) {
    const c = state.collectibles[i];
    for (const [, p] of state.players) {
      if (p.health <= 0) continue;
      const pRadius = getPlayerRadius(p.score);
      if (dist(p.pos, c.pos) < pRadius + C.COLLECTIBLE_SIZE / 2) {
        p.score += C.COLLECTIBLE_SCORE;
        events.collectiblesGathered.push(c.id);
        state.collectibles.splice(i, 1);
        state.enemies.push(createEnemy());
        state.collectibles.push(createCollectible());
        break;
      }
    }
  }

  // Check dropped points pickup
  for (let i = state.droppedPoints.length - 1; i >= 0; i--) {
    const dp = state.droppedPoints[i];
    for (const [, p] of state.players) {
      if (p.health <= 0) continue;
      const pRadius = getPlayerRadius(p.score);
      if (dist(p.pos, dp.pos) < pRadius + C.DROPPED_POINTS_SIZE / 2) {
        p.score += dp.value;
        events.droppedPointsGathered.push({ id: dp.id, pickerId: p.id, pickerName: p.name, value: dp.value });
        state.droppedPoints.splice(i, 1);
        break;
      }
    }
  }

  // Check health pickup
  for (let i = state.healthPickups.length - 1; i >= 0; i--) {
    const hp = state.healthPickups[i];
    for (const [, p] of state.players) {
      if (p.health <= 0 || p.health >= p.maxHealth) continue;
      const pRadius = getPlayerRadius(p.score);
      if (dist(p.pos, hp.pos) < pRadius + C.HEALTH_PICKUP_SIZE / 2) {
        p.health = p.maxHealth;
        events.healthPickupsGathered.push({ id: hp.id, pickerId: p.id, pickerName: p.name });
        state.healthPickups.splice(i, 1);
        break;
      }
    }
  }

  // Check power-up pickup
  for (let i = state.powerUpItems.length - 1; i >= 0; i--) {
    const pu = state.powerUpItems[i];
    for (const [, p] of state.players) {
      if (p.health <= 0) continue;
      const pRadius = getPlayerRadius(p.score);
      if (dist(p.pos, pu.pos) < pRadius + C.POWERUP_SIZE / 2) {
        p.activePowerUps = p.activePowerUps.filter(a => a.type !== pu.type);
        p.activePowerUps.push({ type: pu.type, expiresAt: now + getPowerUpDuration(pu.type) });
        events.powerUpsGathered.push({ id: pu.id, pickerId: p.id, pickerName: p.name, type: pu.type });
        state.powerUpItems.splice(i, 1);
        break;
      }
    }
  }

  return events;
}

// =============================================
// Main dispatcher (backward-compatible, used by engine.ts)
// =============================================

/**
 * Combined simulation update dispatching to either authoritative or client
 * prediction path. Kept for backward compatibility with the existing engine.
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
