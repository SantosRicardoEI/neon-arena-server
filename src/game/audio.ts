const audioCtxRef: { current: AudioContext | null } = { current: null };
let sfxVolume = 0.8;

export function getSfxVolume(): number { return sfxVolume; }
export function setSfxVolume(v: number) { sfxVolume = Math.max(0, Math.min(1, v)); }

function getCtx(): AudioContext {
  if (!audioCtxRef.current) {
    audioCtxRef.current = new AudioContext();
  }
  if (audioCtxRef.current.state === 'suspended') {
    audioCtxRef.current.resume();
  }
  return audioCtxRef.current;
}

/** Master gain node for SFX volume control */
function dest(ctx: AudioContext): GainNode {
  const g = ctx.createGain();
  g.gain.value = sfxVolume;
  g.connect(ctx.destination);
  return g;
}

/** Laser-style shoot sound */
export function playShoot() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + 0.1);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(out);

  osc.start(now);
  osc.stop(now + 0.12);
}

/** Explosion / enemy death — short burst of filtered noise */
export function playEnemyDeath() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const duration = 0.25;
  const out = dest(ctx);

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + duration);
  filter.Q.value = 2;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(80, now);
  sub.frequency.exponentialRampToValueAtTime(30, now + duration);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.15, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(out);

  sub.connect(subGain);
  subGain.connect(out);

  noise.start(now);
  noise.stop(now + duration);
  sub.start(now);
  sub.stop(now + duration);
}

/** Collectible pickup — ascending chime */
export function playCollect() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const notes = [600, 800, 1000, 1200];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.05;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.15);
  });
}

/** Player damage — low distorted hit */
export function playDamage() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const distortion = ctx.createWaveShaper();

  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = (Math.PI + 40) * x / (Math.PI + 40 * Math.abs(x));
  }
  distortion.curve = curve;

  osc.type = 'square';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(distortion);
  distortion.connect(gain);
  gain.connect(out);

  osc.start(now);
  osc.stop(now + 0.2);
}

/** Game over — descending warble */
export function playGameOver() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.2;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 - i * 100, t);
    osc.frequency.exponentialRampToValueAtTime(200 - i * 50, t + 0.18);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.2);
  }
}

/** Dash — whoosh burst */
export function playDash() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const duration = 0.15;
  const out = dest(ctx);

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(4000, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(out);

  noise.start(now);
  noise.stop(now + duration);
}

/** Health pickup — warm rising chord */
export function playHealthPickup() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const notes = [330, 415, 523, 660];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.06;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.25);
  });
}

/** Reload complete — mechanical click */
export function playReloadComplete() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.setValueAtTime(1200, now + 0.03);

  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  osc.connect(gain);
  gain.connect(out);

  osc.start(now);
  osc.stop(now + 0.06);
}

/** Dropped points pickup — coin-like bling */
export function playDroppedPointsPickup() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const notes = [500, 700, 500];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.04;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.12);
  });
}

/** Chat notification — soft double blip */
export function playChatNotification() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const notes = [880, 1100];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.1);
  });
}

/** Power-up pickup — ascending sparkle arpeggio */
export function playPowerUpPickup() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const out = dest(ctx);

  const notes = [523, 659, 784, 1047]; // C5-E5-G5-C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(out);

    osc.start(t);
    osc.stop(t + 0.2);
  });
}

/** Boss shockwave — deep rumbling impact */
export function playBossShockwave() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const duration = 0.5;
  const out = dest(ctx);

  // Deep sub bass rumble
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(40, now);
  sub.frequency.exponentialRampToValueAtTime(20, now + duration);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.25, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  sub.connect(subGain);
  subGain.connect(out);
  sub.start(now);
  sub.stop(now + duration);

  // Noise burst
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, now);
  filter.frequency.exponentialRampToValueAtTime(50, now + duration);
  filter.Q.value = 3;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(out);
  noise.start(now);
  noise.stop(now + duration);
}
