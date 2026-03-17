import type {
  Collectible,
  DroppedPoints,
  GameState,
  HealthPickup,
  Player,
  PowerUpItem,
  PowerUpType,
  SimulationEvents,
} from '../../shared/types';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';
import { dist } from '../../shared/math';

interface UpdatePickupsAuthoritativeDeps {
  createEnemy: () => any;
  createCollectible: () => Collectible;
  getPowerUpDuration: (type: PowerUpType) => number;
}

export function updatePickupsAuthoritative(
  state: GameState,
  now: number,
  events: SimulationEvents,
  deps: UpdatePickupsAuthoritativeDeps,
): void {
  updateCollectibles(state, events, deps);
  updateDroppedPoints(state, events);
  updateHealthPickups(state, events);
  updatePowerUps(state, now, events, deps);
}

function updateCollectibles(
  state: GameState,
  events: SimulationEvents,
  deps: Pick<UpdatePickupsAuthoritativeDeps, 'createEnemy' | 'createCollectible'>,
): void {
  for (let i = state.collectibles.length - 1; i >= 0; i--) {
    const collectible = state.collectibles[i];

    for (const [, player] of state.players) {
      if (player.health <= 0) continue;

      const playerRadius = getPlayerRadius(player.score);
      if (dist(player.pos, collectible.pos) < playerRadius + C.COLLECTIBLE_SIZE / 2) {
        player.score += C.COLLECTIBLE_SCORE;
        events.collectiblesGathered.push(collectible.id);

        state.collectibles.splice(i, 1);
        state.enemies.push(deps.createEnemy());
        state.collectibles.push(deps.createCollectible());
        break;
      }
    }
  }
}

function updateDroppedPoints(
  state: GameState,
  events: SimulationEvents,
): void {
  for (let i = state.droppedPoints.length - 1; i >= 0; i--) {
    const droppedPoints = state.droppedPoints[i];

    for (const [, player] of state.players) {
      if (player.health <= 0) continue;

      const playerRadius = getPlayerRadius(player.score);
      if (dist(player.pos, droppedPoints.pos) < playerRadius + C.DROPPED_POINTS_SIZE / 2) {
        player.score += droppedPoints.value;

        events.droppedPointsGathered.push({
          id: droppedPoints.id,
          pickerId: player.id,
          pickerName: player.name,
          value: droppedPoints.value,
        });

        state.droppedPoints.splice(i, 1);
        break;
      }
    }
  }
}

function updateHealthPickups(
  state: GameState,
  events: SimulationEvents,
): void {
  for (let i = state.healthPickups.length - 1; i >= 0; i--) {
    const healthPickup = state.healthPickups[i];

    for (const [, player] of state.players) {
      if (player.health <= 0 || player.health >= player.maxHealth) continue;

      const playerRadius = getPlayerRadius(player.score);
      if (dist(player.pos, healthPickup.pos) < playerRadius + C.HEALTH_PICKUP_SIZE / 2) {
        player.health = player.maxHealth;

        events.healthPickupsGathered.push({
          id: healthPickup.id,
          pickerId: player.id,
          pickerName: player.name,
        });

        state.healthPickups.splice(i, 1);
        break;
      }
    }
  }
}

function updatePowerUps(
  state: GameState,
  now: number,
  events: SimulationEvents,
  deps: Pick<UpdatePickupsAuthoritativeDeps, 'getPowerUpDuration'>,
): void {
  for (let i = state.powerUpItems.length - 1; i >= 0; i--) {
    const powerUpItem = state.powerUpItems[i];

    for (const [, player] of state.players) {
      if (player.health <= 0) continue;

      const playerRadius = getPlayerRadius(player.score);
      if (dist(player.pos, powerUpItem.pos) < playerRadius + C.POWERUP_SIZE / 2) {
        player.activePowerUps = player.activePowerUps.filter(
          (activePowerUp) => activePowerUp.type !== powerUpItem.type,
        );

        player.activePowerUps.push({
          type: powerUpItem.type,
          expiresAt: now + deps.getPowerUpDuration(powerUpItem.type),
        });

        events.powerUpsGathered.push({
          id: powerUpItem.id,
          pickerId: player.id,
          pickerName: player.name,
          type: powerUpItem.type,
        });

        state.powerUpItems.splice(i, 1);
        break;
      }
    }
  }
}