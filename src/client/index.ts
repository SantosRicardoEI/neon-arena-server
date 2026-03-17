/**
 * Client-only barrel export.
 * Re-exports client-specific modules for convenient importing.
 */

// Client-only modules — these depend on browser APIs
export { createInputState, setupInput } from '../game/input';
export { render } from '../game/renderer';
export { music } from '../game/music';

// Audio SFX
export {
  playShoot, playEnemyDeath, playCollect, playDamage, playGameOver,
  playDash, playHealthPickup, playReloadComplete, playDroppedPointsPickup,
  playChatNotification, playPowerUpPickup, playBossShockwave,
  getSfxVolume, setSfxVolume,
} from '../game/audio';

// Client-side prediction
export * from './prediction';
