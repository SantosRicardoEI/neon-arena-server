import type { Player, Projectile } from '../../shared/types';
import { genId } from '../core/id';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';

export function createProjectile(
  owner: Player,
  angle: number,
  now: number,
  clientShotId: string | null = null,
): Projectile {
  const r = getPlayerRadius(owner.score);

  return {
    id: genId(),
    pos: {
      x: owner.pos.x + Math.cos(angle) * (r + 4),
      y: owner.pos.y + Math.sin(angle) * (r + 4),
    },
    vel: {
      x: Math.cos(angle) * C.PROJECTILE_SPEED,
      y: Math.sin(angle) * C.PROJECTILE_SPEED,
    },
    ownerId: owner.id,
    createdAt: now,
    trail: [],
    clientShotId,
  };
}