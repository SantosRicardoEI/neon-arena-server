import type { Boss } from '../../shared/types';
import type { BossDefinition } from './registry';
import * as C from '../../game/constants';

export function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, def: BossDefinition, now: number) {
  def.render(ctx, boss, def, now);
}

export function drawDefaultBoss(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  _def: BossDefinition,
  now: number,
) {
  const hs = boss.size / 2;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  const pulse = 1 + 0.1 * Math.sin(now * 0.003);

  const glowGrad = ctx.createRadialGradient(0, 0, hs * 0.5, 0, 0, hs * 2);
  glowGrad.addColorStop(0, boss.glowColor.replace('hsl(', 'hsla(').replace(')', ', 0.3)'));
  glowGrad.addColorStop(1, boss.glowColor.replace('hsl(', 'hsla(').replace(')', ', 0)'));
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, hs * 2 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = boss.color;
  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    const px = Math.cos(a) * hs;
    const py = Math.sin(a) * hs;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'hsla(0, 0%, 0%, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-hs * 0.35, 0);
  ctx.lineTo(hs * 0.35, 0);
  ctx.moveTo(0, -hs * 0.35);
  ctx.lineTo(0, hs * 0.35);
  ctx.stroke();

  ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 8;
    const px = Math.cos(a) * hs;
    const py = Math.sin(a) * hs;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
  drawBossOverhead(ctx, boss);
}

export function drawLeviathan(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  def: BossDefinition,
  now: number,
) {
  const hs = boss.size / 2;
  const timeSec = now / 1000;
  const rotation = timeSec * C.LEVIATHAN_ROTATION_SPEED;
  const breathe = 1 + 0.06 * Math.sin(timeSec * 1.5);
  const healthFrac = boss.health / boss.maxHealth;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  if (def.shockwaveRadius > 0) {
    const sinceLast = now - boss.lastShockwave;
    const cooldownFrac = Math.min(sinceLast / def.shockwaveCooldownMs, 1);

    if (cooldownFrac > 0.7 && cooldownFrac < 1) {
      const chargeAlpha = 0.15 + 0.2 * Math.sin(now * 0.015);
      ctx.beginPath();
      ctx.arc(0, 0, def.shockwaveTriggerRange, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(0, 100%, 60%, ${chargeAlpha})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (sinceLast < C.BOSS_SHOCKWAVE_DURATION_MS) {
      const progress = sinceLast / C.BOSS_SHOCKWAVE_DURATION_MS;
      const waveRadius = def.shockwaveRadius * progress;
      const waveAlpha = 0.6 * (1 - progress);
      const waveGrad = ctx.createRadialGradient(0, 0, waveRadius * 0.5, 0, 0, waveRadius);
      waveGrad.addColorStop(0, `hsla(175, 100%, 70%, ${waveAlpha * 0.3})`);
      waveGrad.addColorStop(0.7, `hsla(195, 100%, 50%, ${waveAlpha * 0.5})`);
      waveGrad.addColorStop(1, `hsla(220, 100%, 40%, 0)`);
      ctx.fillStyle = waveGrad;
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(175, 100%, 80%, ${waveAlpha})`;
      ctx.lineWidth = 3 * (1 - progress) + 1;
      ctx.stroke();
    }
  }

  const auraSize = hs * 2.5 * breathe;
  const auraGrad = ctx.createRadialGradient(0, 0, hs * 0.3, 0, 0, auraSize);
  auraGrad.addColorStop(0, 'hsla(195, 100%, 40%, 0.15)');
  auraGrad.addColorStop(0.5, 'hsla(210, 80%, 25%, 0.08)');
  auraGrad.addColorStop(1, 'hsla(220, 60%, 15%, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
  ctx.fill();

  const tentacleCount = C.LEVIATHAN_TENTACLE_COUNT;
  const tentacleLen = hs * C.LEVIATHAN_TENTACLE_LENGTH;

  for (let i = 0; i < tentacleCount; i++) {
    const baseAngle = rotation + (i / tentacleCount) * Math.PI * 2;
    const wave1 = Math.sin(timeSec * 2.5 + i * 1.3) * 0.25;
    const wave2 = Math.sin(timeSec * 1.8 + i * 0.9) * 0.15;
    const angle = baseAngle + wave1;

    const startX = Math.cos(angle) * hs * 0.6;
    const startY = Math.sin(angle) * hs * 0.6;
    const midAngle = angle + wave2;
    const midX = Math.cos(midAngle) * (hs * 0.6 + tentacleLen * 0.5);
    const midY = Math.sin(midAngle) * (hs * 0.6 + tentacleLen * 0.5);
    const endAngle = angle + wave1 * 1.5 + wave2;
    const endX = Math.cos(endAngle) * (hs * 0.6 + tentacleLen);
    const endY = Math.sin(endAngle) * (hs * 0.6 + tentacleLen);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.strokeStyle = 'hsla(175, 100%, 55%, 0.15)';
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    const tentGrad = ctx.createLinearGradient(startX, startY, endX, endY);
    tentGrad.addColorStop(0, 'hsla(195, 85%, 30%, 0.9)');
    tentGrad.addColorStop(1, 'hsla(175, 100%, 45%, 0.3)');
    ctx.strokeStyle = tentGrad;
    ctx.lineWidth = 5 - (i % 2);
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(175, 100%, 70%, ${0.5 + 0.3 * Math.sin(timeSec * 4 + i)})`;
    ctx.fill();
  }

  ctx.save();
  ctx.scale(breathe, breathe);

  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 30;

  ctx.beginPath();
  const bodyPoints = 32;
  for (let i = 0; i < bodyPoints; i++) {
    const a = (i / bodyPoints) * Math.PI * 2;
    const warp = 1 + 0.08 * Math.sin(a * 3 + timeSec * 2) + 0.05 * Math.sin(a * 5 - timeSec * 3);
    const r = hs * 0.55 * warp;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.55);
  bodyGrad.addColorStop(0, 'hsl(200, 60%, 20%)');
  bodyGrad.addColorStop(0.6, boss.color);
  bodyGrad.addColorStop(1, 'hsl(210, 70%, 15%)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle = 'hsla(175, 100%, 50%, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const eyeSize = hs * 0.2;
  const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeSize);
  eyeGrad.addColorStop(0, 'hsl(175, 100%, 90%)');
  eyeGrad.addColorStop(0.5, 'hsl(175, 80%, 70%)');
  eyeGrad.addColorStop(1, 'hsl(195, 60%, 40%)');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  const pupilSize = eyeSize * 0.5;
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;

  if (boss.targetPlayerId) {
    const lookAngle = Math.atan2(boss.vel.y, boss.vel.x);
    pupilOffsetX = Math.cos(lookAngle) * eyeSize * 0.3;
    pupilOffsetY = Math.sin(lookAngle) * eyeSize * 0.3;
  }

  ctx.fillStyle = 'hsl(220, 90%, 10%)';
  ctx.beginPath();
  ctx.arc(pupilOffsetX, pupilOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'hsla(175, 100%, 90%, 0.8)';
  ctx.beginPath();
  ctx.arc(
    pupilOffsetX - pupilSize * 0.3,
    pupilOffsetY - pupilSize * 0.3,
    pupilSize * 0.25,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  if (healthFrac < 0.4) {
    const rageAlpha = 0.3 + 0.2 * Math.sin(now * 0.01);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + timeSec * 0.5;
      const veinLen = hs * 0.4;
      ctx.beginPath();
      ctx.moveTo(eyeSize * 0.8 * Math.cos(a), eyeSize * 0.8 * Math.sin(a));
      const midA = a + Math.sin(timeSec * 3 + i) * 0.3;
      ctx.quadraticCurveTo(
        Math.cos(midA) * veinLen * 0.6,
        Math.sin(midA) * veinLen * 0.6,
        Math.cos(a) * veinLen,
        Math.sin(a) * veinLen,
      );
      ctx.strokeStyle = `hsla(0, 100%, 50%, ${rageAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  ctx.restore();
  ctx.restore();

  drawBossOverhead(ctx, boss);
}

export function drawBossOverhead(ctx: CanvasRenderingContext2D, boss: Boss) {
  const hs = boss.size / 2;

  ctx.font = 'bold 14px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.lineWidth = 4;
  ctx.strokeText(boss.name, boss.pos.x, boss.pos.y - hs - 18);
  ctx.fillStyle = boss.glowColor;
  ctx.fillText(boss.name, boss.pos.x, boss.pos.y - hs - 18);

  const barW = boss.size * 1.5;
  const barH = 6;
  const barX = boss.pos.x - barW / 2;
  const barY = boss.pos.y - hs - 14;
  const healthFrac = boss.health / boss.maxHealth;

  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.6)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = healthFrac > 0.3 ? boss.color : 'hsl(0, 100%, 60%)';
  ctx.fillRect(barX, barY, barW * healthFrac, barH);
  ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.textBaseline = 'alphabetic';
}