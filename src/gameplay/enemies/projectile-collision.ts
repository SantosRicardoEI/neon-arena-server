import type {
  DroppedPoints,
  GameState,
  Player,
  Projectile,
  SimulationEvents,
  Vec2,
} from '../../shared/types';
import * as C from '../../game/constants';
import { dist } from '../../shared/math';
import { getEnemyConfig } from './registry';
import type { EnemyType } from '../../shared/types';

interface ProjectileEnemyCollisionDeps {
  playerHasPowerUp: (player: Player, type: 'shield', now: number) => boolean;
  createDroppedPoints: (pos: Vec2, value: number, now: number) => DroppedPoints;
  spawnDeathParticles: (
  gameState: GameState,
  pos: Vec2,
  type: EnemyType,
  timestamp: number
) => void;
}

export function processProjectileVsEnemies(
  state: GameState,
  projectile: Projectile,
  now: number,
  events: SimulationEvents,
  deps: ProjectileEnemyCollisionDeps,
): boolean {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const enemy = state.enemies[i];
    const cfg = getEnemyConfig(enemy.type);

    if (dist(projectile.pos, enemy.pos) < cfg.size / 2 + C.PROJECTILE_WIDTH) {
      enemy.health -= 1;

      if (enemy.health <= 0) {
        deps.spawnDeathParticles(state, enemy.pos, enemy.type, now);

        state.enemies.splice(i, 1);

        events.enemiesKilled.push({
          id: enemy.id,
          kind: 'enemy',
          type: enemy.type,
          x: enemy.pos.x,
          y: enemy.pos.y,
        });

        const owner = state.players.get(projectile.ownerId);
        if (owner) {
          owner.score += cfg.killScore;
        }

        if (enemy.type === 'exploder') {
          state.explosions.push({
            pos: { x: enemy.pos.x, y: enemy.pos.y },
            radius: C.ENEMY_EXPLODER_EXPLOSION_RADIUS,
            createdAt: now,
          });

          for (const [playerId, player] of state.players) {
            if (player.health <= 0) continue;

            const d = dist(enemy.pos, player.pos);
            if (d < C.ENEMY_EXPLODER_EXPLOSION_RADIUS) {
              const explosionDamage = deps.playerHasPowerUp(player, 'shield', now)
                ? Math.ceil(C.ENEMY_EXPLODER_EXPLOSION_DAMAGE * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER)
                : C.ENEMY_EXPLODER_EXPLOSION_DAMAGE;

              player.health -= explosionDamage;
              player.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;

              if (player.health <= 0) {
                player.health = 0;

                if (player.score > 0) {
                  state.droppedPoints.push(
                    deps.createDroppedPoints(player.pos, player.score, now),
                  );
                  player.score = 0;
                }
              }

              events.playersHit.push({
                playerId,
                damage: C.ENEMY_EXPLODER_EXPLOSION_DAMAGE,
              });
            }
          }
        }
      } else {
        if (enemy.state === 'passive') {
          enemy.stateChangeTime = now;
        }
        enemy.state = 'aggressive';
      }

      return true;
    }
  }

  return false;
}