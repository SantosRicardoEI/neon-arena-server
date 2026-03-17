import type {
  GameState,
  Projectile,
  SimulationEvents,
} from '../../shared/types';
import * as C from '../../game/constants';
import { dist } from '../../shared/math';

export function processProjectileVsBosses(
  state: GameState,
  projectile: Projectile,
  now: number,
  events: SimulationEvents,
): boolean {
  for (let i = state.bosses.length - 1; i >= 0; i--) {
    const boss = state.bosses[i];

    if (dist(projectile.pos, boss.pos) < boss.size / 2 + C.PROJECTILE_WIDTH) {
      boss.health -= 1;

      if (boss.health <= 0) {
        const owner = state.players.get(projectile.ownerId);

        if (owner) {
          owner.score += boss.killScore;

          state.bossDefeatEvents.push({
            bossName: boss.name,
            killerName: owner.name,
            timestamp: now,
          });
        }

        events.enemiesKilled.push({
          id: boss.id,
          kind: 'boss',
          type: boss.definitionId,
          x: boss.pos.x,
          y: boss.pos.y,
        });

        state.bosses.splice(i, 1);
      }

      return true;
    }
  }

  return false;
}