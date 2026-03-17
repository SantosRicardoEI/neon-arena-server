import type { Enemy } from '../../shared/types';
import type { EnemyConfig } from './types';
import { getEnemyConfig } from './registry';

export function getEnemyColors(
  enemy: Enemy,
  cfg: EnemyConfig,
): { fill: string; glow: string } {
  return {
    fill: enemy.state === 'aggressive' ? cfg.colors.aggressive : cfg.colors.passive,
    glow: cfg.colors.aggressive,
  };
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  now: number,
): void {
  const cfg = getEnemyConfig(enemy.type);
  const isAggressive = enemy.state === 'aggressive';
  const colors = getEnemyColors(enemy, cfg);
  const glitching = false;

  ctx.save();
  ctx.translate(enemy.pos.x, enemy.pos.y);

  if (glitching) {
    ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
  }

  ctx.fillStyle = colors.fill;

  if (isAggressive) {
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 8;
  }

  cfg.render(ctx, enemy, cfg, now);

  ctx.shadowBlur = 0;

  if (enemy.maxHealth > 1 && enemy.health > 0) {
    const barW = cfg.size;
    const barH = 3;
    const barX = -barW / 2;
    const barY = -cfg.size / 2 - 8;

    ctx.fillStyle = 'hsla(0, 0%, 0%, 0.5)';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = colors.fill;
    ctx.fillRect(barX, barY, barW * (enemy.health / enemy.maxHealth), barH);
  }

  ctx.restore();
}