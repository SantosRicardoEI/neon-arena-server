/**
 * Server-ready simulation stepping.
 * Orchestrates a single authoritative tick: applies player movement,
 * runs authoritative simulation, manages boss schedule and round timer.
 *
 * Calls into src/game/simulation.ts for all gameplay formulas.
 * NO browser API dependencies.
 */
import type { GameState, SimulationEvents } from '../shared/types';
import {
  updateAuthoritative,
  applyPlayerMovement,
} from '../game/simulation';
import { getReloadTime, getMagazineSize } from '../shared/scaling';
import * as C from '../shared/constants';
import {
  updateBossSchedule,
  checkRoundTimer,
  resetRound,
  cleanupExpiredEntities,
} from './room-state';
import type { BossScheduleEvent } from './room-state';

/** Events produced by a single simulation step */
export interface StepResult {
  /** Gameplay events (kills, pickups, damage) */
  simulation: SimulationEvents;
  /** Boss schedule events (warnings, spawns) */
  bossEvents: BossScheduleEvent[];
  /** Whether the round just ended this tick */
  roundJustEnded: boolean;
  /** Whether a new round just started this tick */
  roundRestarted: boolean;
}

/**
 * Run one authoritative simulation tick.
 * This is the function a future dedicated server calls every tick.
 *
 * @param state - The authoritative GameState
 * @param dt - Delta time in seconds
 * @param now - Current timestamp (ms)
 */
export function stepAuthoritative(
  state: GameState,
  dt: number,
  now: number,
): StepResult {
  // 1. Move all players
  for (const [, player] of state.players) {
    applyPlayerMovement(player, dt, now, C.WORLD_WIDTH, C.WORLD_HEIGHT);
  }

  // 2. Per-player reload logic
  const reloadCompletedPlayerIds: string[] = [];

  for (const [playerId, player] of state.players) {
    if (player.ammo <= 0 && now >= player.reloadingUntil && player.reloadingUntil === 0) {
      player.reloadingUntil = now + getReloadTime(player.score);
    }

    if (player.reloadingUntil > 0 && now >= player.reloadingUntil) {
      player.ammo = getMagazineSize(player.score);
      player.reloadingUntil = 0;
      reloadCompletedPlayerIds.push(playerId);
    }
  }

  // 3. Expire power-ups
  for (const [, p] of state.players) {
    p.activePowerUps = p.activePowerUps.filter(pu => now < pu.expiresAt);
  }

  // 4. Pulse phases (harmless on server, keeps state consistent)
  for (const c of state.collectibles) c.pulsePhase += dt * 3;
  for (const dp of state.droppedPoints) dp.pulsePhase += dt * 4;
  for (const hp of state.healthPickups) hp.pulsePhase += dt * 2;
  for (const pu of state.powerUpItems) pu.pulsePhase += dt * 3.5;

  // 5. Run authoritative simulation (AI, spawns, collisions, damage)
  const simulation = updateAuthoritative(state, dt, now);
  simulation.reloadCompletedPlayerIds = reloadCompletedPlayerIds;

  // 6. Boss schedule
  let bossEvents: BossScheduleEvent[] = [];
  if (!state.roundOver) {
    bossEvents = updateBossSchedule(state, now);
  }

  // 7. Round timer
  const { roundJustEnded, shouldRestart } = checkRoundTimer(state, now);
  let roundRestarted = false;
  if (shouldRestart) {
    resetRound(state, now);
    roundRestarted = true;
  }

  // 8. Cleanup expired entities
  cleanupExpiredEntities(state, now);

  return { simulation, bossEvents, roundJustEnded, roundRestarted };
}