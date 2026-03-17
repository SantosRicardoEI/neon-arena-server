import type { Boss } from '../../shared/types';
import type { BossDefinition } from './registry';
import * as C from '../../game/constants';
import { genId } from '../core/id';

export function createBoss(def: C.BossDefinition): Boss {
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