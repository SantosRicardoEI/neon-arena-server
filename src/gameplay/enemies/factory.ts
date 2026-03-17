import type { Enemy, EnemyType } from '../../shared/types';
import * as C from '../../game/constants';
import { genId } from '../core/id';
import { getEnemyConfig } from './registry';

export function pickEnemyType(): EnemyType {
  const entries = Object.entries(getSpawnWeights()) as [EnemyType, number][];

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * totalWeight;

  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return type;
    }
  }

  return 'normal';
}

function getSpawnWeights(): Record<EnemyType, number> {
  return {
    normal: getEnemyConfig('normal').spawnWeight,
    fast: getEnemyConfig('fast').spawnWeight,
    tank: getEnemyConfig('tank').spawnWeight,
    exploder: getEnemyConfig('exploder').spawnWeight,
  };
}

export function createEnemy(forceType?: EnemyType): Enemy {
  const type = forceType ?? pickEnemyType();
  const cfg = getEnemyConfig(type);

  const edge = Math.floor(Math.random() * 4);
  let x: number;
  let y: number;

  switch (edge) {
    case 0:
      x = Math.random() * C.WORLD_WIDTH;
      y = 0;
      break;
    case 1:
      x = C.WORLD_WIDTH;
      y = Math.random() * C.WORLD_HEIGHT;
      break;
    case 2:
      x = Math.random() * C.WORLD_WIDTH;
      y = C.WORLD_HEIGHT;
      break;
    default:
      x = 0;
      y = Math.random() * C.WORLD_HEIGHT;
      break;
  }

  const angle = Math.random() * Math.PI * 2;

  return {
    id: genId(),
    type,
    pos: { x, y },
    vel: {
      x: Math.cos(angle) * cfg.speedPassive,
      y: Math.sin(angle) * cfg.speedPassive,
    },
    health: cfg.health,
    maxHealth: cfg.health,
    state: 'passive',
    targetPlayerId: null,
    stateChangeTime: 0,
    targetPos: null,
    lastNetworkUpdate: 0,
  };
}