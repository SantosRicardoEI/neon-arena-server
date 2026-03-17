import type { BossDefinition } from './registry';
import * as C from '../../game/constants';
import type {
  DroppedPoints,
  GameState,
  Player,
  SimulationEvents,
  Vec2,
} from '../../shared/types';
import { getPlayerRadius } from '../../shared/scaling';
import { dist } from '../../shared/math';
import { BOSS_REGISTRY } from '../../gameplay/bosses/registry';

interface UpdateBossesAuthoritativeDeps {
  playerHasPowerUp: (player: Player, type: 'shield', now: number) => boolean;
  createDroppedPoints: (pos: Vec2, value: number, now: number) => DroppedPoints;
}

function findBossDefinition(definitionId: string): BossDefinition | undefined {
  return BOSS_REGISTRY.find((definition) => definition.id === definitionId);
}

function applyScoreDropOnDeath(
  state: GameState,
  player: Player,
  now: number,
  createDroppedPoints: UpdateBossesAuthoritativeDeps['createDroppedPoints'],
): void {
  if (player.score > 0) {
    state.droppedPoints.push(createDroppedPoints(player.pos, player.score, now));
    player.score = 0;
  }
}

export function updateBossesAuthoritative(
  state: GameState,
  dt: number,
  now: number,
  events: SimulationEvents,
  deps: UpdateBossesAuthoritativeDeps,
): void {
  for (const boss of state.bosses) {
    let closestPlayer: Player | null = null;
    let closestDist = boss.detectRange;

    for (const [, player] of state.players) {
      if (player.health <= 0) continue;

      const d = dist(boss.pos, player.pos);
      if (d < closestDist) {
        closestDist = d;
        closestPlayer = player;
      }
    }

    if (closestPlayer) {
      boss.targetPlayerId = closestPlayer.id;

      const angle = Math.atan2(
        closestPlayer.pos.y - boss.pos.y,
        closestPlayer.pos.x - boss.pos.x,
      );

      boss.vel.x = Math.cos(angle) * boss.speed;
      boss.vel.y = Math.sin(angle) * boss.speed;
    } else {
      boss.targetPlayerId = null;
      boss.vel.x = Math.cos(now * 0.0003) * boss.speed * 0.3;
      boss.vel.y = Math.sin(now * 0.0004) * boss.speed * 0.3;
    }

    boss.pos.x += boss.vel.x * dt;
    boss.pos.y += boss.vel.y * dt;
    boss.pos.x = Math.max(boss.size / 2, Math.min(C.WORLD_WIDTH - boss.size / 2, boss.pos.x));
    boss.pos.y = Math.max(boss.size / 2, Math.min(C.WORLD_HEIGHT - boss.size / 2, boss.pos.y));

    const definition = findBossDefinition(boss.definitionId);

    if (
      definition &&
      definition.shockwaveRadius > 0 &&
      now - boss.lastShockwave > definition.shockwaveCooldownMs
    ) {
      let playerNearby = false;

      for (const [, player] of state.players) {
        if (player.health <= 0) continue;

        if (dist(boss.pos, player.pos) < definition.shockwaveTriggerRange) {
          playerNearby = true;
          break;
        }
      }

      if (playerNearby) {
        boss.lastShockwave = now;

        state.explosions.push({
          pos: { x: boss.pos.x, y: boss.pos.y },
          radius: definition.shockwaveRadius,
          createdAt: now,
        });

        for (const [playerId, player] of state.players) {
          if (player.health <= 0 || now <= player.invincibleUntil) continue;

          if (dist(boss.pos, player.pos) < definition.shockwaveRadius) {
            const damage = deps.playerHasPowerUp(player, 'shield', now)
              ? Math.ceil(definition.shockwaveDamage * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER)
              : definition.shockwaveDamage;

            player.health -= damage;
            player.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;

            if (player.health <= 0) {
              player.health = 0;
              applyScoreDropOnDeath(state, player, now, deps.createDroppedPoints);
            }

            events.playersHit.push({
              playerId,
              damage: definition.shockwaveDamage,
            });
          }
        }
      }
    }

    for (const [playerId, player] of state.players) {
      if (player.health <= 0 || now <= player.invincibleUntil) continue;

      const playerRadius = getPlayerRadius(player.score);
      const d = dist(boss.pos, player.pos);

      if (d < playerRadius + boss.size / 2) {
        const damage = deps.playerHasPowerUp(player, 'shield', now)
          ? Math.ceil(boss.damage * C.POWERUP_SHIELD_DAMAGE_MULTIPLIER)
          : boss.damage;

        player.health -= damage;
        player.invincibleUntil = now + C.PLAYER_INVINCIBLE_MS;

        if (player.health <= 0) {
          player.health = 0;
          applyScoreDropOnDeath(state, player, now, deps.createDroppedPoints);
        }

        events.playersHit.push({
          playerId,
          damage: boss.damage,
        });
      }
    }
  }
}