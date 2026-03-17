import type { Boss } from '../../shared/types';
import { drawLeviathan, drawDefaultBoss } from './renderers';

export interface BossDefinition {
  id: string;
  name: string;
  size: number;
  health: number;
  speed: number;
  damage: number;
  detectRange: number;
  killScore: number;
  color: string;
  glowColor: string;
  shockwaveRadius: number;
  shockwaveDamage: number;
  shockwaveCooldownMs: number;
  shockwaveTriggerRange: number;
  render: BossRenderFn;
}

export type BossRenderFn = (
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  def: BossDefinition,
  now: number
) => void;

export const BOSS_REGISTRY: BossDefinition[] = [
  {
    id: "sentinel",
    name: "THE SENTINEL",
    size: 70,
    health: 50,
    speed: 80,
    damage: 40,
    detectRange: 1200,
    killScore: 500,
    color: "hsl(0, 100%, 55%)",
    glowColor: "hsl(0, 100%, 65%)",
    shockwaveRadius: 0,
    shockwaveDamage: 0,
    shockwaveCooldownMs: 0,
    shockwaveTriggerRange: 0,
    render: (ctx, boss, def, now) => {
      drawDefaultBoss(ctx, boss, def, now);
    },
  },
  {
    id: "leviathan",
    name: "LEVIATHAN",
    size: 130,
    health: 120,
    speed: 55,
    damage: 50,
    detectRange: 1500,
    killScore: 1500,
    color: "hsl(195, 85%, 25%)",
    glowColor: "hsl(175, 100%, 50%)",
    shockwaveRadius: 300,
    shockwaveDamage: 45,
    shockwaveCooldownMs: 6000,
    shockwaveTriggerRange: 350,
    render: (ctx, boss, def, now) => {
      drawLeviathan(ctx, boss, def, now);
    },
  },
];

export function getBossDefinition(id: string): BossDefinition {
  return BOSS_REGISTRY.find(b => b.id === id)!;
}