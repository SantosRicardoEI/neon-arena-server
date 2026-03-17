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

/* ============================================================
 *  VOID REAPER — Dark-matter entity with sweeping scythe arms,
 *  gravity vortex rings, and a menacing vertical eye slit.
 * ============================================================ */
export function drawVoidReaper(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  def: BossDefinition,
  now: number,
) {
  const hs = boss.size / 2;
  const timeSec = now / 1000;
  const rotation = timeSec * C.REAPER_ROTATION_SPEED;
  const breathe = 1 + 0.05 * Math.sin(timeSec * 1.2);
  const healthFrac = boss.health / boss.maxHealth;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  // --- Shockwave / Vortex Pulse ---
  if (def.shockwaveRadius > 0) {
    const sinceLast = now - boss.lastShockwave;
    const cooldownFrac = Math.min(sinceLast / def.shockwaveCooldownMs, 1);

    // Charge-up warning: concentric shrinking rings
    if (cooldownFrac > 0.6 && cooldownFrac < 1) {
      const chargeProgress = (cooldownFrac - 0.6) / 0.4;
      for (let r = 0; r < 3; r++) {
        const ringPhase = (chargeProgress + r * 0.33) % 1;
        const ringRadius = def.shockwaveTriggerRange * (1 - ringPhase * 0.6);
        const ringAlpha = 0.08 + 0.15 * ringPhase * Math.sin(now * 0.02 + r);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(280, 100%, 70%, ${Math.abs(ringAlpha)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Active vortex blast
    if (sinceLast < C.REAPER_VORTEX_DURATION_MS) {
      const progress = sinceLast / C.REAPER_VORTEX_DURATION_MS;
      const waveRadius = def.shockwaveRadius * progress;
      const waveAlpha = 0.7 * (1 - progress);

      // Spiraling void energy
      for (let s = 0; s < 3; s++) {
        const spiralAngle = rotation * 4 + s * (Math.PI * 2 / 3) + progress * Math.PI * 3;
        const spiralR = waveRadius * (0.3 + 0.7 * progress);
        ctx.beginPath();
        ctx.arc(
          Math.cos(spiralAngle) * spiralR * 0.3,
          Math.sin(spiralAngle) * spiralR * 0.3,
          spiralR * 0.6,
          spiralAngle,
          spiralAngle + Math.PI * 0.8,
        );
        ctx.strokeStyle = `hsla(270, 100%, 60%, ${waveAlpha * 0.4})`;
        ctx.lineWidth = 4 * (1 - progress);
        ctx.stroke();
      }

      // Main wave
      const vortexGrad = ctx.createRadialGradient(0, 0, waveRadius * 0.3, 0, 0, waveRadius);
      vortexGrad.addColorStop(0, `hsla(280, 80%, 50%, ${waveAlpha * 0.2})`);
      vortexGrad.addColorStop(0.5, `hsla(270, 100%, 40%, ${waveAlpha * 0.4})`);
      vortexGrad.addColorStop(1, `hsla(260, 80%, 20%, 0)`);
      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(280, 100%, 80%, ${waveAlpha})`;
      ctx.lineWidth = 2.5 * (1 - progress) + 0.5;
      ctx.stroke();
    }
  }

  // --- Dark Aura with void distortion ---
  const auraSize = hs * 3 * breathe;
  const auraGrad = ctx.createRadialGradient(0, 0, hs * 0.2, 0, 0, auraSize);
  auraGrad.addColorStop(0, 'hsla(270, 80%, 30%, 0.12)');
  auraGrad.addColorStop(0.4, 'hsla(280, 60%, 15%, 0.06)');
  auraGrad.addColorStop(1, 'hsla(260, 40%, 5%, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraSize, 0, Math.PI * 2);
  ctx.fill();

  // --- Gravity Vortex Rings ---
  const ringCount = C.REAPER_VORTEX_RING_COUNT;
  for (let i = 0; i < ringCount; i++) {
    const ringProgress = ((timeSec * 0.5 + i / ringCount) % 1);
    const ringR = hs * (0.7 + ringProgress * 1.8);
    const ringAlpha = 0.12 * (1 - ringProgress);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(275, 80%, 55%, ${ringAlpha})`;
    ctx.lineWidth = 1.5 * (1 - ringProgress) + 0.5;
    ctx.stroke();
  }

  // --- Floating Void Particles ---
  const particleCount = C.REAPER_PARTICLE_COUNT;
  for (let i = 0; i < particleCount; i++) {
    const pAngle = rotation * 0.7 + (i / particleCount) * Math.PI * 2;
    const pDist = hs * (0.8 + 0.6 * Math.sin(timeSec * 1.5 + i * 2.1));
    const pFloat = Math.sin(timeSec * 2.3 + i * 1.7) * 8;
    const px = Math.cos(pAngle) * pDist;
    const py = Math.sin(pAngle) * pDist + pFloat;
    const pSize = 1.5 + Math.sin(timeSec * 3 + i) * 1;
    const pAlpha = 0.3 + 0.3 * Math.sin(timeSec * 4 + i * 0.8);
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(280, 100%, 75%, ${pAlpha})`;
    ctx.fill();
  }

  // --- Scythe Arms ---
  const scytheCount = C.REAPER_SCYTHE_COUNT;
  const scytheLen = hs * C.REAPER_SCYTHE_LENGTH;

  for (let i = 0; i < scytheCount; i++) {
    const baseAngle = rotation + (i / scytheCount) * Math.PI * 2;
    const sweep = Math.sin(timeSec * 1.8 + i * 1.5) * 0.3;
    const angle = baseAngle + sweep;

    const startX = Math.cos(angle) * hs * 0.45;
    const startY = Math.sin(angle) * hs * 0.45;

    // Curved scythe blade using two bezier control points
    const midAngle1 = angle + 0.4 + Math.sin(timeSec * 2 + i) * 0.15;
    const mid1X = Math.cos(midAngle1) * (hs * 0.45 + scytheLen * 0.4);
    const mid1Y = Math.sin(midAngle1) * (hs * 0.45 + scytheLen * 0.4);

    const tipAngle = angle - 0.2 + sweep * 0.5;
    const tipX = Math.cos(tipAngle) * (hs * 0.45 + scytheLen);
    const tipY = Math.sin(tipAngle) * (hs * 0.45 + scytheLen);

    // Shadow / glow pass
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(mid1X, mid1Y, tipX, tipY);
    ctx.strokeStyle = 'hsla(280, 100%, 60%, 0.1)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Main blade
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(mid1X, mid1Y, tipX, tipY);
    const bladeGrad = ctx.createLinearGradient(startX, startY, tipX, tipY);
    bladeGrad.addColorStop(0, 'hsla(270, 50%, 25%, 0.9)');
    bladeGrad.addColorStop(0.6, 'hsla(280, 80%, 50%, 0.7)');
    bladeGrad.addColorStop(1, 'hsla(290, 100%, 70%, 0.4)');
    ctx.strokeStyle = bladeGrad;
    ctx.lineWidth = 4 + (i % 2);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glowing tip
    const tipGlow = 0.5 + 0.4 * Math.sin(timeSec * 5 + i * 1.2);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(290, 100%, 80%, ${tipGlow})`;
    ctx.fill();

    // Inner edge highlight
    const innerAngle = angle - 0.15;
    const innerTipX = Math.cos(innerAngle) * (hs * 0.45 + scytheLen * 0.85);
    const innerTipY = Math.sin(innerAngle) * (hs * 0.45 + scytheLen * 0.85);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      mid1X * 0.95, mid1Y * 0.95,
      innerTipX, innerTipY,
    );
    ctx.strokeStyle = 'hsla(280, 100%, 90%, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // --- Main Body (amorphous dark core) ---
  ctx.save();
  ctx.scale(breathe, breathe);

  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 35;

  ctx.beginPath();
  const bodySegs = 36;
  for (let i = 0; i < bodySegs; i++) {
    const a = (i / bodySegs) * Math.PI * 2;
    const warp = 1
      + 0.1 * Math.sin(a * 4 + timeSec * 1.5)
      + 0.06 * Math.sin(a * 7 - timeSec * 2.5)
      + 0.03 * Math.cos(a * 2 + timeSec * 3);
    const r = hs * 0.5 * warp;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.5);
  bodyGrad.addColorStop(0, 'hsl(280, 40%, 12%)');
  bodyGrad.addColorStop(0.5, boss.color);
  bodyGrad.addColorStop(1, 'hsl(260, 50%, 8%)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Body outline
  ctx.strokeStyle = 'hsla(280, 100%, 60%, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Vertical Eye Slit ---
  const eyeW = hs * C.REAPER_EYE_SLIT_WIDTH;
  const eyeH = hs * 0.35;

  // Outer eye glow
  const eyeGlowGrad = ctx.createRadialGradient(0, 0, eyeH * 0.3, 0, 0, eyeH * 1.5);
  eyeGlowGrad.addColorStop(0, 'hsla(280, 100%, 70%, 0.25)');
  eyeGlowGrad.addColorStop(1, 'hsla(280, 100%, 50%, 0)');
  ctx.fillStyle = eyeGlowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, eyeH * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye shape (vertical almond)
  ctx.beginPath();
  ctx.ellipse(0, 0, eyeW * 0.15, eyeH, 0, 0, Math.PI * 2);
  const eyeInnerGrad = ctx.createLinearGradient(0, -eyeH, 0, eyeH);
  eyeInnerGrad.addColorStop(0, 'hsl(290, 100%, 85%)');
  eyeInnerGrad.addColorStop(0.5, 'hsl(280, 100%, 70%)');
  eyeInnerGrad.addColorStop(1, 'hsl(270, 80%, 50%)');
  ctx.fillStyle = eyeInnerGrad;
  ctx.fill();

  // Pupil slit (narrow vertical line that tracks player)
  let pupilOffY = 0;
  if (boss.targetPlayerId) {
    const lookAngle = Math.atan2(boss.vel.y, boss.vel.x);
    pupilOffY = Math.sin(lookAngle) * eyeH * 0.25;
  }

  ctx.beginPath();
  ctx.ellipse(0, pupilOffY, eyeW * 0.04, eyeH * 0.7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'hsl(260, 90%, 5%)';
  ctx.fill();

  // Specular highlights
  ctx.fillStyle = 'hsla(290, 100%, 95%, 0.6)';
  ctx.beginPath();
  ctx.ellipse(eyeW * 0.04, pupilOffY - eyeH * 0.3, eyeW * 0.03, eyeH * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Rage mode: cracking void fissures ---
  if (healthFrac < 0.4) {
    const rageIntensity = 0.4 + 0.3 * Math.sin(now * 0.012);
    const fissureCount = 8;
    for (let i = 0; i < fissureCount; i++) {
      const a = (i / fissureCount) * Math.PI * 2 + timeSec * 0.3;
      const fLen = hs * (0.3 + 0.15 * Math.sin(timeSec * 2 + i));
      const startR = hs * 0.15;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * startR, Math.sin(a) * startR);
      const midA = a + Math.sin(timeSec * 4 + i * 2) * 0.25;
      ctx.quadraticCurveTo(
        Math.cos(midA) * fLen * 0.6,
        Math.sin(midA) * fLen * 0.6,
        Math.cos(a + Math.sin(timeSec * 2.5 + i) * 0.15) * fLen,
        Math.sin(a + Math.sin(timeSec * 2.5 + i) * 0.15) * fLen,
      );
      ctx.strokeStyle = `hsla(290, 100%, 65%, ${rageIntensity})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fissure glow dots at ends
      ctx.beginPath();
      ctx.arc(
        Math.cos(a) * fLen,
        Math.sin(a) * fLen,
        2,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `hsla(290, 100%, 85%, ${rageIntensity * 0.8})`;
      ctx.fill();
    }

    // Pulsing core overload
    const overloadGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.35);
    overloadGrad.addColorStop(0, `hsla(290, 100%, 60%, ${rageIntensity * 0.3})`);
    overloadGrad.addColorStop(1, 'hsla(290, 100%, 40%, 0)');
    ctx.fillStyle = overloadGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hs * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // scale
  ctx.restore(); // translate

  drawBossOverhead(ctx, boss);
}

/* ============================================================
 *  SOLAR ARCHON — Geometric sun-god mandala with orbiting
 *  crystal shards, radiating energy beams, and solar flare
 *  shockwave. Warm gold/white palette, hexagonal symmetry.
 * ============================================================ */
export function drawSolarArchon(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  def: BossDefinition,
  now: number,
) {
  const hs = boss.size / 2;
  const timeSec = now / 1000;
  const rotation = timeSec * C.ARCHON_ROTATION_SPEED;
  const breathe = 1 + 0.04 * Math.sin(timeSec * 1.8);
  const healthFrac = boss.health / boss.maxHealth;

  ctx.save();
  ctx.translate(boss.pos.x, boss.pos.y);

  // --- Solar Flare Shockwave ---
  if (def.shockwaveRadius > 0) {
    const sinceLast = now - boss.lastShockwave;
    const cooldownFrac = Math.min(sinceLast / def.shockwaveCooldownMs, 1);

    // Charge-up: pulsing golden ring that shrinks
    if (cooldownFrac > 0.65 && cooldownFrac < 1) {
      const charge = (cooldownFrac - 0.65) / 0.35;
      const pulseR = def.shockwaveTriggerRange * (1 - charge * 0.4);
      const alpha = 0.1 + 0.2 * charge * Math.abs(Math.sin(now * 0.018));
      ctx.beginPath();
      ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(40, 100%, 65%, ${alpha})`;
      ctx.lineWidth = 2 + charge * 2;
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Active solar flare
    if (sinceLast < C.ARCHON_FLARE_DURATION_MS) {
      const progress = sinceLast / C.ARCHON_FLARE_DURATION_MS;
      const waveRadius = def.shockwaveRadius * progress;
      const waveAlpha = 0.8 * (1 - progress);

      // Inner fire gradient
      const flareGrad = ctx.createRadialGradient(0, 0, waveRadius * 0.2, 0, 0, waveRadius);
      flareGrad.addColorStop(0, `hsla(50, 100%, 90%, ${waveAlpha * 0.4})`);
      flareGrad.addColorStop(0.4, `hsla(35, 100%, 60%, ${waveAlpha * 0.5})`);
      flareGrad.addColorStop(0.8, `hsla(15, 100%, 45%, ${waveAlpha * 0.3})`);
      flareGrad.addColorStop(1, `hsla(0, 100%, 30%, 0)`);
      ctx.fillStyle = flareGrad;
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.fill();

      // Expanding ring edge
      ctx.beginPath();
      ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(45, 100%, 85%, ${waveAlpha})`;
      ctx.lineWidth = 3 * (1 - progress) + 1;
      ctx.stroke();

      // Radial flame tongues
      for (let i = 0; i < 8; i++) {
        const flameA = rotation * 3 + (i / 8) * Math.PI * 2;
        const flameR = waveRadius * (0.7 + 0.3 * Math.sin(now * 0.01 + i * 2));
        const fx = Math.cos(flameA) * flameR;
        const fy = Math.sin(flameA) * flameR;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(fx, fy);
        ctx.strokeStyle = `hsla(30, 100%, 70%, ${waveAlpha * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  // --- Corona (outer glow) ---
  const coronaSize = hs * 3.2 * breathe;
  const coronaGrad = ctx.createRadialGradient(0, 0, hs * 0.4, 0, 0, coronaSize);
  coronaGrad.addColorStop(0, 'hsla(45, 100%, 70%, 0.12)');
  coronaGrad.addColorStop(0.3, 'hsla(35, 100%, 55%, 0.06)');
  coronaGrad.addColorStop(0.6, 'hsla(20, 80%, 40%, 0.03)');
  coronaGrad.addColorStop(1, 'hsla(10, 60%, 20%, 0)');
  ctx.fillStyle = coronaGrad;
  ctx.beginPath();
  ctx.arc(0, 0, coronaSize, 0, Math.PI * 2);
  ctx.fill();

  // --- Radiating Energy Beams ---
  const beamCount = C.ARCHON_BEAM_COUNT;
  const beamLen = hs * C.ARCHON_BEAM_LENGTH;
  for (let i = 0; i < beamCount; i++) {
    const beamAngle = rotation * 0.5 + (i / beamCount) * Math.PI * 2;
    const flicker = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(timeSec * 3.5 + i * 1.7));
    const bLen = beamLen * (0.6 + 0.4 * Math.sin(timeSec * 2 + i * 0.9));

    const bx1 = Math.cos(beamAngle) * hs * 0.6;
    const by1 = Math.sin(beamAngle) * hs * 0.6;
    const bx2 = Math.cos(beamAngle) * (hs * 0.6 + bLen);
    const by2 = Math.sin(beamAngle) * (hs * 0.6 + bLen);

    const beamGrad = ctx.createLinearGradient(bx1, by1, bx2, by2);
    beamGrad.addColorStop(0, `hsla(45, 100%, 80%, ${0.4 * flicker})`);
    beamGrad.addColorStop(1, `hsla(40, 100%, 60%, 0)`);
    ctx.beginPath();
    ctx.moveTo(bx1, by1);
    ctx.lineTo(bx2, by2);
    ctx.strokeStyle = beamGrad;
    ctx.lineWidth = 2.5 - (i % 3) * 0.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // --- Orbiting Crystal Shards ---
  const shardCount = C.ARCHON_SHARD_COUNT;
  const orbitR = hs * C.ARCHON_SHARD_ORBIT_RADIUS;
  for (let i = 0; i < shardCount; i++) {
    const shardAngle = -rotation * 1.8 + (i / shardCount) * Math.PI * 2;
    const wobble = Math.sin(timeSec * 2.5 + i * 1.4) * 8;
    const sx = Math.cos(shardAngle) * (orbitR + wobble);
    const sy = Math.sin(shardAngle) * (orbitR + wobble);
    const shardRot = rotation * 3 + i * Math.PI / 3;
    const shardSize = 8 + 3 * Math.sin(timeSec * 4 + i);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(shardRot);

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(0, -shardSize);
    ctx.lineTo(shardSize * 0.5, 0);
    ctx.lineTo(0, shardSize);
    ctx.lineTo(-shardSize * 0.5, 0);
    ctx.closePath();

    const shardGrad = ctx.createLinearGradient(0, -shardSize, 0, shardSize);
    shardGrad.addColorStop(0, 'hsla(50, 100%, 90%, 0.9)');
    shardGrad.addColorStop(0.5, 'hsla(40, 100%, 70%, 0.8)');
    shardGrad.addColorStop(1, 'hsla(30, 90%, 50%, 0.6)');
    ctx.fillStyle = shardGrad;
    ctx.fill();

    ctx.strokeStyle = 'hsla(45, 100%, 95%, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Shard glow
    const glowA = 0.3 + 0.3 * Math.sin(timeSec * 5 + i * 2);
    ctx.shadowColor = `hsla(45, 100%, 80%, ${glowA})`;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // --- Corona Particles ---
  const pCount = C.ARCHON_CORONA_PARTICLE_COUNT;
  for (let i = 0; i < pCount; i++) {
    const pAngle = timeSec * 0.6 + (i / pCount) * Math.PI * 2;
    const pDist = hs * (1.0 + 0.8 * Math.sin(timeSec * 1.2 + i * 2.3));
    const drift = Math.sin(timeSec * 3 + i * 1.1) * 6;
    const px = Math.cos(pAngle) * pDist + drift;
    const py = Math.sin(pAngle) * pDist;
    const pSize = 1.5 + Math.sin(timeSec * 4 + i) * 1;
    const pAlpha = 0.25 + 0.25 * Math.sin(timeSec * 5 + i * 0.7);
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(40, 100%, 80%, ${pAlpha})`;
    ctx.fill();
  }

  // --- Concentric Mandala Rings ---
  const ringCount = C.ARCHON_RING_COUNT;
  for (let r = 0; r < ringCount; r++) {
    const ringR = hs * (0.35 + r * 0.15) * breathe;
    const ringRot = rotation * (r % 2 === 0 ? 1 : -1) * (1 + r * 0.4);
    const segments = 6 + r * 2;
    const alpha = 0.35 - r * 0.08;

    ctx.save();
    ctx.rotate(ringRot);
    ctx.beginPath();
    for (let s = 0; s < segments; s++) {
      const sa = (s / segments) * Math.PI * 2;
      const px = Math.cos(sa) * ringR;
      const py = Math.sin(sa) * ringR;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `hsla(45, 100%, 75%, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vertex dots
    for (let s = 0; s < segments; s++) {
      const sa = (s / segments) * Math.PI * 2;
      const px = Math.cos(sa) * ringR;
      const py = Math.sin(sa) * ringR;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(50, 100%, 90%, ${alpha + 0.1})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Main Body (hexagonal sun core) ---
  ctx.save();
  ctx.scale(breathe, breathe);

  ctx.shadowColor = boss.glowColor;
  ctx.shadowBlur = 40;

  // Hexagonal body with warped edges
  ctx.beginPath();
  const hexPoints = 6;
  for (let i = 0; i <= hexPoints; i++) {
    const a = (i / hexPoints) * Math.PI * 2 + rotation * 0.2;
    const warp = 1 + 0.06 * Math.sin(a * 3 + timeSec * 2.5);
    const r = hs * 0.5 * warp;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.5);
  bodyGrad.addColorStop(0, 'hsl(50, 100%, 95%)');
  bodyGrad.addColorStop(0.3, 'hsl(45, 100%, 75%)');
  bodyGrad.addColorStop(0.7, boss.color);
  bodyGrad.addColorStop(1, 'hsl(25, 80%, 30%)');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  ctx.strokeStyle = 'hsla(45, 100%, 85%, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // --- Inner symbol (six-pointed star) ---
  ctx.beginPath();
  const starR = hs * 0.3;
  const innerR = starR * 0.45;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rotation * 0.5;
    const r = i % 2 === 0 ? starR : innerR;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'hsla(50, 100%, 95%, 0.3)';
  ctx.fill();
  ctx.strokeStyle = 'hsla(45, 100%, 90%, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // --- Central Eye (circular, warm) ---
  const eyeR = hs * 0.12;
  const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeR);
  eyeGrad.addColorStop(0, 'hsl(0, 0%, 100%)');
  eyeGrad.addColorStop(0.4, 'hsl(50, 100%, 90%)');
  eyeGrad.addColorStop(1, 'hsl(40, 80%, 60%)');
  ctx.fillStyle = eyeGrad;
  ctx.beginPath();
  ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Pupil that tracks
  let pupilOX = 0, pupilOY = 0;
  if (boss.targetPlayerId) {
    const lookA = Math.atan2(boss.vel.y, boss.vel.x);
    pupilOX = Math.cos(lookA) * eyeR * 0.35;
    pupilOY = Math.sin(lookA) * eyeR * 0.35;
  }
  ctx.fillStyle = 'hsl(20, 90%, 15%)';
  ctx.beginPath();
  ctx.arc(pupilOX, pupilOY, eyeR * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Specular
  ctx.fillStyle = 'hsla(50, 100%, 97%, 0.7)';
  ctx.beginPath();
  ctx.arc(pupilOX - eyeR * 0.2, pupilOY - eyeR * 0.2, eyeR * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // --- Rage Mode: Supernova Build-up ---
  if (healthFrac < 0.4) {
    const rageA = 0.35 + 0.3 * Math.sin(now * 0.014);

    // Solar prominences (arcing flame tendrils)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + timeSec * 0.8;
      const arcLen = hs * (0.35 + 0.2 * Math.sin(timeSec * 3 + i * 1.5));
      const startR = hs * 0.25;
      const ctrlAngle = a + Math.sin(timeSec * 4 + i) * 0.5;
      const ctrlR = arcLen * 1.3;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * startR, Math.sin(a) * startR);
      ctx.quadraticCurveTo(
        Math.cos(ctrlAngle) * ctrlR,
        Math.sin(ctrlAngle) * ctrlR,
        Math.cos(a + 0.3) * arcLen,
        Math.sin(a + 0.3) * arcLen,
      );
      ctx.strokeStyle = `hsla(15, 100%, 55%, ${rageA})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // White-hot core overload
    const novaGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hs * 0.4);
    novaGrad.addColorStop(0, `hsla(50, 100%, 95%, ${rageA * 0.5})`);
    novaGrad.addColorStop(0.5, `hsla(35, 100%, 70%, ${rageA * 0.25})`);
    novaGrad.addColorStop(1, 'hsla(20, 100%, 50%, 0)');
    ctx.fillStyle = novaGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hs * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // scale
  ctx.restore(); // translate

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