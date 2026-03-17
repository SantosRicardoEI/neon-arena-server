import type { GameState, Vec2, PowerUpType, EnemyType } from '../../shared/types';
import { createEnemy } from '../enemies/factory';
import { createCollectible, createDroppedPoints, createHealthPickup, createPowerUpItem } from '../pickups/factory';
import { createBoss } from '../bosses/factory';
import { getBossDefinition } from '../bosses/registry';
import type { DevSpawnOptionId } from './types';

function isEnemyOption(optionId: DevSpawnOptionId): optionId is EnemyType {
  return optionId === 'normal' || optionId === 'fast' || optionId === 'tank' || optionId === 'exploder';
}

function isPowerUpOption(optionId: DevSpawnOptionId): optionId is PowerUpType {
  return optionId === 'speed' || optionId === 'rapid_fire' || optionId === 'shield';
}

function isBossOption(optionId: DevSpawnOptionId): boolean {
  return (
    optionId === 'sentinel' ||
    optionId === 'leviathan' ||
    optionId === 'void_reaper' ||
    optionId === 'solar_archon'
  );
}

export function spawnDevEntity(
  state: GameState,
  optionId: DevSpawnOptionId,
  pos: Vec2,
  now: number,
): void {
  if (isEnemyOption(optionId)) {
    state.enemies.push(createEnemy(optionId, pos));
    return;
  }

  if (isBossOption(optionId)) {
    const def = getBossDefinition(optionId);
    state.bosses.push(createBoss(def, pos));
    return;
  }

  if (optionId === 'collectible') {
    state.collectibles.push(createCollectible(pos));
    return;
  }

  if (optionId === 'health_pickup') {
    state.healthPickups.push(createHealthPickup(pos));
    return;
  }

  if (optionId === 'dropped_points') {
    state.droppedPoints.push(createDroppedPoints(pos, 100, now));
    return;
  }

  if (isPowerUpOption(optionId)) {
    state.powerUpItems.push(createPowerUpItem(optionId, pos));
  }
}

export function clearDevSpawnedEntities(state: GameState): void {
  state.enemies = [];
  state.bosses = [];
  state.projectiles = [];
  state.collectibles = [];
  state.droppedPoints = [];
  state.healthPickups = [];
  state.powerUpItems = [];
  state.explosions = [];
  state.deathParticles = [];
  state.bossSpawnEvents = [];
  state.bossDefeatEvents = [];
  state.bossScheduleTriggered = new Set();
  state.roundOver = false;
  state.restartCountdownStart = 0;
}