import type { Boss } from '../../shared/types';
import { drawLeviathan, drawDefaultBoss, drawVoidReaper, drawSolarArchon } from './renderers';

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
  {
    id: "void_reaper",
    name: "VOID REAPER",
    size: 110,
    health: 90,
    speed: 70,
    damage: 35,
    detectRange: 1400,
    killScore: 1200,
    color: "hsl(270, 60%, 20%)",
    glowColor: "hsl(280, 100%, 65%)",
    shockwaveRadius: 250,
    shockwaveDamage: 30,
    shockwaveCooldownMs: 5000,
    shockwaveTriggerRange: 300,
    render: (ctx, boss, def, now) => {
      drawVoidReaper(ctx, boss, def, now);
    },
  },
  {
    id: "solar_archon",
    name: "SOLAR ARCHON",
    size: 120,
    health: 100,
    speed: 50,
    damage: 45,
    detectRange: 1600,
    killScore: 1800,
    color: "hsl(40, 100%, 45%)",
    glowColor: "hsl(45, 100%, 75%)",
    shockwaveRadius: 350,
    shockwaveDamage: 40,
    shockwaveCooldownMs: 7000,
    shockwaveTriggerRange: 400,
    render: (ctx, boss, def, now) => {
      drawSolarArchon(ctx, boss, def, now);
    },
  },
];

export function getBossDefinition(id: string): BossDefinition {
  return BOSS_REGISTRY.find(b => b.id === id)!;
}