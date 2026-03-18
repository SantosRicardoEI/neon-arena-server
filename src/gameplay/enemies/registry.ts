import type { EnemyType } from '../../shared/types';
import type { EnemyConfig } from './types';

export const ENEMY_REGISTRY: Record<EnemyType, EnemyConfig> = {
  normal: {
    size: 28,
    health: 1,
    speedPassive: 60,
    speedAggressive: 130,
    detectRange: 650,
    damage: 20,
    killScore: 10,
    spawnWeight: 40,
    hue: 280,
    colors: {
      passive: 'hsl(280, 100%, 80%)',
      aggressive: 'hsl(340, 100%, 70%)',
    },
    render: (ctx, enemy, cfg) => {
      const hs = cfg.size / 2;
      ctx.fillRect(-hs, -hs, cfg.size, cfg.size);
    },
  },

  fast: {
    size: 18,
    health: 1,
    speedPassive: 120,
    speedAggressive: 170,
    detectRange: 350,
    damage: 10,
    killScore: 15,
    spawnWeight: 20,
    hue: 160,
    colors: {
      passive: 'hsl(160, 100%, 70%)',
      aggressive: 'hsl(140, 100%, 55%)',
    },
    render: (ctx, enemy, cfg) => {
      const hs = cfg.size / 2;
      ctx.beginPath();
      ctx.moveTo(0, -hs);
      ctx.lineTo(hs, hs);
      ctx.lineTo(-hs, hs);
      ctx.closePath();
      ctx.fill();
    },
  },

  tank: {
    size: 42,
    health: 3,
    speedPassive: 35,
    speedAggressive: 110,
    detectRange: 800,
    damage: 35,
    killScore: 30,
    spawnWeight: 25,
    hue: 25,
    colors: {
      passive: 'hsl(25, 100%, 65%)',
      aggressive: 'hsl(10, 100%, 55%)',
    },
    render: (ctx, enemy, cfg) => {
      const hs = cfg.size / 2;
      const r = 6;

      ctx.beginPath();
      ctx.moveTo(-hs + r, -hs);
      ctx.lineTo(hs - r, -hs);
      ctx.quadraticCurveTo(hs, -hs, hs, -hs + r);
      ctx.lineTo(hs, hs - r);
      ctx.quadraticCurveTo(hs, hs, hs - r, hs);
      ctx.lineTo(-hs + r, hs);
      ctx.quadraticCurveTo(-hs, hs, -hs, hs - r);
      ctx.lineTo(-hs, -hs + r);
      ctx.quadraticCurveTo(-hs, -hs, -hs + r, -hs);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'hsla(0, 0%, 0%, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hs * 0.4, 0);
      ctx.lineTo(hs * 0.4, 0);
      ctx.moveTo(0, -hs * 0.4);
      ctx.lineTo(0, hs * 0.4);
      ctx.stroke();
    },
  },

  exploder: {
    size: 24,
    health: 1,
    speedPassive: 50,
    speedAggressive: 110,
    detectRange: 400,
    damage: 15,
    killScore: 20,
    spawnWeight: 10,
    hue: 50,
    explosionRadius: 120,
    explosionDamage: 30,
    explosionDurationMs: 400,
    colors: {
      passive: 'hsl(55, 100%, 65%)',
      aggressive: 'hsl(45, 100%, 50%)',
    },
    render: (ctx, enemy, cfg) => {
      const hs = cfg.size / 2;
      const spikes = 6;

      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? hs : hs * 0.55;
        const px = Math.cos(angle) * rad;
        const py = Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
};

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_REGISTRY[type];
}

export function getEnemyHue(type: EnemyType): number {
  return ENEMY_REGISTRY[type].hue;
}