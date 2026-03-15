/**
 * Backward-compatibility re-export from the new simulation module.
 * Existing imports from './entities' will continue to work.
 * New code should import directly from '@/game/simulation'.
 */
export {
  genId,
  getEnemyConfig,
  createPlayer,
  createEnemy,
  createCollectible,
  createDroppedPoints,
  createHealthPickup,
  createPowerUpItem,
  createBoss,
  createProjectile,
  getPowerUpDuration,
  playerHasPowerUp,
  spawnDeathParticles,
  updateGameState,
} from './simulation';
export type { EnemyConfig } from './simulation';
