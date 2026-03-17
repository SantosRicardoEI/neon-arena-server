import type {
  GameState,
  Player,
  SimulationEvents,
} from '../../shared/types';
import * as C from '../../game/constants';
import { getPlayerRadius } from '../../shared/scaling';
import { dist } from '../../shared/math';

export function updatePickupsPrediction(
  state: GameState,
  localPlayer: Player,
  events: SimulationEvents,
): void {
  const localRadius = getPlayerRadius(localPlayer.score);

  predictCollectibles(state, localPlayer, localRadius, events);
  predictDroppedPoints(state, localPlayer, localRadius, events);
  predictHealthPickups(state, localPlayer, localRadius, events);
  predictPowerUps(state, localPlayer, localRadius);
}

function predictCollectibles(
  state: GameState,
  localPlayer: Player,
  localRadius: number,
  events: SimulationEvents,
): void {
  for (let i = state.collectibles.length - 1; i >= 0; i--) {
    const collectible = state.collectibles[i];

    if (dist(localPlayer.pos, collectible.pos) < localRadius + C.COLLECTIBLE_SIZE / 2) {
      events.collectiblesGathered.push(collectible.id);
      state.collectibles.splice(i, 1);
      break;
    }
  }
}

function predictDroppedPoints(
  state: GameState,
  localPlayer: Player,
  localRadius: number,
  events: SimulationEvents,
): void {
  for (let i = state.droppedPoints.length - 1; i >= 0; i--) {
    const droppedPoints = state.droppedPoints[i];

    if (dist(localPlayer.pos, droppedPoints.pos) < localRadius + C.DROPPED_POINTS_SIZE / 2) {
      events.droppedPointsGathered.push({
        id: droppedPoints.id,
        pickerId: localPlayer.id,
        pickerName: localPlayer.name,
        value: droppedPoints.value,
      });

      state.droppedPoints.splice(i, 1);
      break;
    }
  }
}

function predictHealthPickups(
  state: GameState,
  localPlayer: Player,
  localRadius: number,
  events: SimulationEvents,
): void {
  for (let i = state.healthPickups.length - 1; i >= 0; i--) {
    const healthPickup = state.healthPickups[i];

    if (
      localPlayer.health < localPlayer.maxHealth &&
      dist(localPlayer.pos, healthPickup.pos) < localRadius + C.HEALTH_PICKUP_SIZE / 2
    ) {
      events.healthPickupsGathered.push({
        id: healthPickup.id,
        pickerId: localPlayer.id,
        pickerName: localPlayer.name,
      });

      state.healthPickups.splice(i, 1);
      break;
    }
  }
}

function predictPowerUps(
  state: GameState,
  localPlayer: Player,
  localRadius: number,
): void {
  for (let i = state.powerUpItems.length - 1; i >= 0; i--) {
    const powerUpItem = state.powerUpItems[i];

    if (dist(localPlayer.pos, powerUpItem.pos) < localRadius + C.POWERUP_SIZE / 2) {
      state.powerUpItems.splice(i, 1);
      break;
    }
  }
}