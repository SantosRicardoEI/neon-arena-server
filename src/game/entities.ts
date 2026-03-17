/**
 * Backward-compatibility re-exports.
 * Existing imports from './entities' will continue to work.
 * New code should import from the specific modules directly.
 */

export { genId } from '../gameplay/core/id';

export { createPlayer } from '../gameplay/players/factory';

export {
  updateGameState,
} from './simulation';
export { createProjectile } from '../gameplay/projectiles/factory';


export {
  getPowerUpDuration,
  playerHasPowerUp,
} from '../gameplay/powerups/utils';

export {
  createCollectible,
  createDroppedPoints,
  createHealthPickup,
  createPowerUpItem,
} from '../gameplay/pickups/factory';

export { createBoss } from '../gameplay/bosses/factory';
export { spawnDeathParticles } from '../gameplay/enemies/effects';
export { getEnemyConfig } from '../gameplay/enemies/registry';
export { createEnemy } from '../gameplay/enemies/factory';

export type { EnemyConfig } from '../gameplay/enemies/types';