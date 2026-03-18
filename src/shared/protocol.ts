/**
 * Network protocol helpers: serialization/deserialization of game state
 * for network transport. Reusable by both client and future server.
 * NO browser API dependencies.
 */
import {
  GameState,
  NetworkGameState,
  NetworkPlayerState,
  Player,
  Enemy,
  Boss,
  Projectile,
  Collectible,
  DroppedPoints,
  HealthPickup,
  PowerUpItem,
  Explosion,
  ActivePowerUp,
} from './types';

function q(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Build a NetworkGameState snapshot from the authoritative GameState */
export function buildNetworkGameState(state: GameState, seq: number, now: number): NetworkGameState {
  const gs: NetworkGameState = {
    seq,
    enemies: state.enemies.map(e => ({
      id: e.id,
      type: e.type,
      x: q(e.pos.x),
      y: q(e.pos.y),
      vx: q(e.vel.x),
      vy: q(e.vel.y),
      health: e.health,
      maxHealth: e.maxHealth,
      state: e.state,
    })),
    bosses: state.bosses.map(b => ({
      id: b.id, definitionId: b.definitionId, name: b.name,
      x: b.pos.x, y: b.pos.y, vx: b.vel.x, vy: b.vel.y,
      health: b.health, maxHealth: b.maxHealth, size: b.size, speed: b.speed,
      damage: b.damage, detectRange: b.detectRange, killScore: b.killScore,
      color: b.color, glowColor: b.glowColor, targetPlayerId: b.targetPlayerId,
      lastShockwave: b.lastShockwave,
    })),
    projectiles: state.projectiles.map(p => ({
      id: p.id,
      x: q(p.pos.x),
      y: q(p.pos.y),
      vx: q(p.vel.x),
      vy: q(p.vel.y),
      ownerId: p.ownerId,
      createdAt: p.createdAt,
      clientShotId: p.clientShotId ?? null,
    })),
    explosions: state.explosions.map(e => ({
      x: e.pos.x, y: e.pos.y, radius: e.radius, createdAt: e.createdAt,
    })),
    players: {},
    roundElapsedMs: now - state.roundStartTime,
    roundOver: state.roundOver,
    restartCountdownStart: state.restartCountdownStart,
    bossSpawnEvents: state.bossSpawnEvents.map(e => ({
      scheduleIndex: e.scheduleIndex, bossId: e.bossId, bossName: e.bossName,
      warningStartedAt: e.warningStartedAt, spawned: e.spawned,
    })),
    bossDefeatEvents: state.bossDefeatEvents.map(e => ({
      bossName: e.bossName, killerName: e.killerName, timestamp: e.timestamp,
    })),
    bossScheduleTriggered: Array.from(state.bossScheduleTriggered),
  };

  for (const [id, p] of state.players) {
    gs.players[id] = {
      id: p.id,
      name: p.name,
      x: p.pos.x,
      y: p.pos.y,
      aimAngle: p.aimAngle,
      health: p.health,
      score: p.score,
      invincibleUntil: p.invincibleUntil,
      color: p.color,
      skin: p.skin,
      ammo: p.ammo,
      reloadingUntil: p.reloadingUntil,
      lastProcessedInputSeq: p.lastProcessedInputSeq,
      activePowerUps: p.activePowerUps.map(pu => ({
        type: pu.type,
        expiresAt: pu.expiresAt,
      })),
      
    };
  }

  return gs;
}

/** Build a NetworkPlayerState from a Player */
export function buildPlayerNetworkState(player: Player): NetworkPlayerState {
  return {
    id: player.id,
    name: player.name,
    x: player.pos.x,
    y: player.pos.y,
    aimAngle: player.aimAngle,
    health: player.health,
    score: player.score,
    color: player.color,
    skin: player.skin,
  };
}
