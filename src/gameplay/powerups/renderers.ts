import type { PowerUpType } from '../../shared/types';
import * as C from '../../game/constants';
import { getPowerUpColor, getPowerUpLabel } from './render-utils';

export function drawPowerUpItem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: PowerUpType,
  pulsePhase: number,
): void {
  const color = getPowerUpColor(type);
  const pulse = 1 + 0.2 * Math.sin(pulsePhase);
  const s = C.POWERUP_SIZE / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);

  const grad = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 2);
  grad.addColorStop(0, color.replace(")", ", 0.3)").replace("hsl(", "hsla("));
  grad.addColorStop(1, color.replace(")", ", 0)").replace("hsl(", "hsla("));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, s * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    const px = Math.cos(a) * s;
    const py = Math.sin(a) * s;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = `${Math.round(s)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getPowerUpLabel(type), 0, 1);

  ctx.restore();

  ctx.font = '9px "Roboto Mono", monospace';
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(type.replace("_", " ").toUpperCase(), x, y + s + 14);
}