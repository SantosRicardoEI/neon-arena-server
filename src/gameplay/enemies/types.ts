import type { Enemy } from '../../shared/types';

export interface EnemyConfig {
  size: number;
  health: number;
  speedPassive: number;
  speedAggressive: number;
  detectRange: number;
  damage: number;
  killScore: number;
  spawnWeight: number;
  hue: number;
  colors: {
    passive: string;
    aggressive: string;
  };
  render: EnemyRenderFn;
}

export type EnemyRenderFn = (
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  cfg: EnemyConfig,
  now: number
) => void;