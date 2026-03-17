/** Available player colors */
export const PLAYER_COLOR_OPTIONS = [
  "hsl(210, 100%, 70%)",
  "hsl(0, 100%, 65%)",
  "hsl(160, 100%, 60%)",
  "hsl(300, 100%, 70%)",
  "hsl(30, 100%, 65%)",
  "hsl(50, 100%, 65%)",
  "hsl(270, 100%, 75%)",
  "hsl(180, 100%, 60%)",
];

/** Number of small distant stars */
export const STARS_SMALL_COUNT = 30000;
/** Number of medium stars */
export const STARS_MEDIUM_COUNT = 200;
/** Number of large bright stars with glow */
export const STARS_LARGE_COUNT = 70;
/** Parallax factor for small stars */
export const STARS_PARALLAX_SMALL = 0.05;
/** Parallax factor for medium stars */
export const STARS_PARALLAX_MEDIUM = 0.1;
/** Parallax factor for large stars */
export const STARS_PARALLAX_LARGE = 0.15;
/** Max glow radius for large stars */
export const STARS_GLOW_RADIUS = 40;
/** Glow pulse speed */
export const STARS_GLOW_PULSE_SPEED = 1.5;
/** Background gradient color 1 (center) */
export const BG_GRADIENT_CENTER = "hsl(245, 48%, 5%)";
/** Background gradient color 2 (edges) */
export const BG_GRADIENT_EDGE = "hsl(246, 33%, 6%)";
/** Subtle nebula tint color */
export const BG_NEBULA_COLOR = "210, 80%, 30%";
/** Nebula max opacity */
export const BG_NEBULA_OPACITY = 0.06;

/** Número máximo de pontos no trail por jogador */
export const TRAIL_MAX_POINTS = 40;
/** Intervalo mínimo entre registos de pontos do trail (ms) */
export const TRAIL_SAMPLE_INTERVAL_MS = 40;
/** Raio base das partículas de fumo (px) */
export const TRAIL_PARTICLE_RADIUS = 20;
/** Opacidade máxima do trail (0–1) */
export const TRAIL_MAX_OPACITY = 0.15;
/** Fator de crescimento do raio com a idade */
export const TRAIL_RADIUS_GROWTH = 2.9;
/** Tempo de vida do trail antes de desaparecer completamente (ms) */
export const TRAIL_LIFETIME_MS = 1000;
/** Velocidade de dispersão/drift das partículas (px/s) */
export const TRAIL_DRIFT_SPEED = 18;

export const COLORS = {
  background: "hsl(233, 47%, 4%)",
  grid: "hsl(216, 23%, 13%)",
  player: "hsl(210, 100%, 70%)",
  playerDamage: "hsl(0, 100%, 70%)",
  otherPlayer: "hsl(120, 100%, 70%)",
  enemyPassive: "hsl(280, 100%, 80%)",
  enemyAggressive: "hsl(340, 100%, 70%)",
  projectile: "hsl(60, 100%, 70%)",
  collectible: "hsl(180, 100%, 50%)",
  droppedPoints: "hsl(45, 100%, 60%)",
  healthPickup: "hsl(120, 80%, 55%)",
  hudText: "hsl(240, 10%, 95%)",
};

/** Leviathan boss visual constants */
export const LEVIATHAN_ROTATION_SPEED = 0.4;
export const LEVIATHAN_TENTACLE_COUNT = 8;
export const LEVIATHAN_TENTACLE_LENGTH = 1.2;

/** Void Reaper boss visual constants */
export const REAPER_SCYTHE_COUNT = 4;
export const REAPER_SCYTHE_LENGTH = 1.6;
export const REAPER_ROTATION_SPEED = 0.25;
export const REAPER_VORTEX_RING_COUNT = 5;
export const REAPER_EYE_SLIT_WIDTH = 0.6;
export const REAPER_PARTICLE_COUNT = 24;

/** Void Reaper shockwave visual duration (ms) */
export const REAPER_VORTEX_DURATION_MS = 800;

/** Solar Archon boss visual constants */
export const ARCHON_RING_COUNT = 3;
export const ARCHON_SHARD_COUNT = 6;
export const ARCHON_SHARD_ORBIT_RADIUS = 1.4;
export const ARCHON_ROTATION_SPEED = 0.3;
export const ARCHON_BEAM_COUNT = 12;
export const ARCHON_BEAM_LENGTH = 2.2;
export const ARCHON_CORONA_PARTICLE_COUNT = 20;
export const ARCHON_FLARE_DURATION_MS = 900;