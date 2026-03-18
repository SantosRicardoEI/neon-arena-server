import type { DroppedPoints, GameState, Player, SimulationEvents } from '../../shared/types';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';
import { dist } from '../../shared/math';
import { getEnemyConfig } from './registry';
import { getEffectiveIncomingDamage } from '../../shared/effective-combat';

interface UpdateEnemiesAuthoritativeDeps {
  createDroppedPoints: (pos: { x: number; y: number }, value: number, now: number) => DroppedPoints;
}

export function updateEnemiesAuthoritative(
  state: GameState,
  dt: number,
  now: number,
  events: SimulationEvents,
  deps: UpdateEnemiesAuthoritativeDeps,
): void {
  for (const enemy of state.enemies) {
    const cfg = getEnemyConfig(enemy.type);

    let closestPlayer: Player | null = null;
    let closestDist = cfg.detectRange;

    for (const [, player] of state.players) {
      if (player.health <= 0) continue;

      const d = dist(enemy.pos, player.pos);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = player;
      }
    }

    if (closestPlayer) {
      if (enemy.state === 'passive') {
        enemy.stateChangeTime = now;
      }

      enemy.state = 'aggressive';
      enemy.targetPlayerId = closestPlayer.id;

      const angle = Math.atan2(
        closestPlayer.pos.y - enemy.pos.y,
        closestPlayer.pos.x - enemy.pos.x,
      );

      enemy.vel.x = Math.cos(angle) * cfg.speedAggressive;
      enemy.vel.y = Math.sin(angle) * cfg.speedAggressive;
    } else {
      if (enemy.state === 'aggressive') {
        enemy.stateChangeTime = now;
      }

      enemy.state = 'passive';
      enemy.targetPlayerId = null;
    }

    enemy.pos.x += enemy.vel.x * dt;
    enemy.pos.y += enemy.vel.y * dt;

    if (enemy.pos.x < 0 || enemy.pos.x > C.WORLD_WIDTH) {
      enemy.vel.x *= -1;
      enemy.pos.x = Math.max(0, Math.min(C.WORLD_WIDTH, enemy.pos.x));
    }

    if (enemy.pos.y < 0 || enemy.pos.y > C.WORLD_HEIGHT) {
      enemy.vel.y *= -1;
      enemy.pos.y = Math.max(0, Math.min(C.WORLD_HEIGHT, enemy.pos.y));
    }

    for (const [playerId, player] of state.players) {
      if (player.health <= 0 || now <= player.invincibleUntil) continue;

      const playerRadius = getPlayerRadius(player.score);
      const d = dist(enemy.pos, player.pos);

      if (d < playerRadius + cfg.size / 2) {
        const damage = getEffectiveIncomingDamage(player, cfg.damage, now);

        player.health -= damage;
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
          damage: cfg.damage,
        });
      }
    }
  }
}