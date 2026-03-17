import type {
  Collectible,
  DroppedPoints,
  HealthPickup,
  PowerUpItem,
  PowerUpType,
  Vec2,
} from '../../shared/types';
import * as C from '../../game/constants';
import { genId } from '../core/id';

export function createCollectible(spawnPos?: Vec2): Collectible {  return {
    id: genId(),
    pos: spawnPos ?? {
      x: 100 + Math.random() * (C.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (C.WORLD_HEIGHT - 200),
    },
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function createDroppedPoints(pos: Vec2, value: number, now: number): DroppedPoints {
  return {
    id: genId(),
    pos: {
      x: pos.x + (Math.random() - 0.5) * 30,
      y: pos.y + (Math.random() - 0.5) * 30,
    },
    value,
    pulsePhase: Math.random() * Math.PI * 2,
    createdAt: now,
  };
}

export function createHealthPickup(spawnPos?: Vec2): HealthPickup {  return {
    id: genId(),
    pos: spawnPos ?? {
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

export function createPowerUpItem(forceType?: PowerUpType, spawnPos?: Vec2): PowerUpItem {  return {
    id: genId(),
    type: forceType ?? pickPowerUpType(),
    pos: spawnPos ?? {
      x: 100 + Math.random() * (C.WORLD_WIDTH - 200),
      y: 100 + Math.random() * (C.WORLD_HEIGHT - 200),
    },
    pulsePhase: Math.random() * Math.PI * 2,
  };
}