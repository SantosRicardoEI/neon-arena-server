import type {
  DroppedPoints,
  GameState,
  Player,
  Projectile,
  SimulationEvents,
  Vec2,
} from '../../shared/types';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';
import { dist } from '../../shared/math';
import { getEffectiveIncomingDamage } from '../../shared/effective-combat';


interface ProjectilePlayerCollisionDeps {
  createDroppedPoints: (pos: Vec2, value: number, now: number) => DroppedPoints;
}

export function processProjectileVsPlayers(
  state: GameState,
  projectile: Projectile,
  now: number,
  events: SimulationEvents,
  deps: ProjectilePlayerCollisionDeps,
): boolean {
  for (const [playerId, player] of state.players) {
    if (playerId === projectile.ownerId) continue;

    const playerRadius = getPlayerRadius(player.score);

    if (
      player.health > 0 &&
      now > player.invincibleUntil &&
      dist(projectile.pos, player.pos) < playerRadius + C.PROJECTILE_WIDTH
    ) {
        const projectileDamage = getEffectiveIncomingDamage(
          player,
          C.PROJECTILE_DAMAGE,
          now,
        );

      player.health -= projectileDamage;
      player.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;

      if (player.health <= 0) {
        player.health = 0;

        const killer = state.players.get(projectile.ownerId);
        if (killer) {
          killer.score += C.KILL_SCORE;
          events.playerKills.push({
            killerId: projectile.ownerId,
            killerName: killer.name,
            victimId: playerId,
            victimName: player.name,
          });
        }

        if (player.score > 0) {
          state.droppedPoints.push(
            deps.createDroppedPoints(player.pos, player.score, now),
          );
          player.score = 0;
        }
      }

      events.playersHit.push({
        playerId,
        damage: C.PROJECTILE_DAMAGE,
      });

      return true;
    }
  }

  return false;
}