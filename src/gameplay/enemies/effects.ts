import type { EnemyType, GameState, Vec2 } from '../../shared/types';
import * as C from '../../game/constants';
import { getEnemyHue } from './registry';

export function spawnDeathParticles(
  state: GameState,
  pos: Vec2,
  type: EnemyType,
  now: number,
): void {
  const hue = getEnemyHue(type);

  for (let i = 0; i < C.DEATH_PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed =
      C.DEATH_PARTICLE_SPEED_MIN +
      Math.random() * (C.DEATH_PARTICLE_SPEED_MAX - C.DEATH_PARTICLE_SPEED_MIN);

    state.deathParticles.push({
      pos: { x: pos.x, y: pos.y },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      createdAt: now,
      hue: hue + (Math.random() - 0.5) * 30,
      size:
        C.DEATH_PARTICLE_SIZE_MIN +
        Math.random() * (C.DEATH_PARTICLE_SIZE_MAX - C.DEATH_PARTICLE_SIZE_MIN),
    });
  }
}