/** Tamanho visual dos coletáveis de pontos (px) */
export const COLLECTIBLE_SIZE = 16;
/** Número inicial de coletáveis no mapa */
export const INITIAL_COLLECTIBLES = 100;
/** Pontos ganhos ao apanhar um coletável */
export const COLLECTIBLE_SCORE = 10;

/** Tamanho visual dos health pickups (px) */
export const HEALTH_PICKUP_SIZE = 20;
/** Intervalo entre spawns de health pickups (ms) */
export const HEALTH_PICKUP_SPAWN_INTERVAL_MS = 10000;
/** Número máximo de health pickups no mapa ao mesmo tempo */
export const MAX_HEALTH_PICKUPS = 3;

/** Tamanho visual dos pontos largados (px) */
export const DROPPED_POINTS_SIZE = 20;
/** Tempo até desaparecerem (ms) */
export const DROPPED_POINTS_LIFETIME_MS = 30000;

/** Tamanho visual dos power-ups no mapa (px) */
export const POWERUP_SIZE = 25;
/** Intervalo entre spawns de power-ups (ms) */
export const POWERUP_SPAWN_INTERVAL_MS = 5000;
/** Número máximo de power-ups no mapa ao mesmo tempo */
export const POWERUP_MAX_COUNT = 6;

/** Duração do Speed Boost (ms) */
export const POWERUP_SPEED_DURATION_MS = 20000;
/** Multiplicador de velocidade do Speed Boost */
export const POWERUP_SPEED_MULTIPLIER = 1.5;
/** Cor do Speed Boost */
export const POWERUP_SPEED_COLOR = "hsl(190, 100%, 60%)";

/** Duração do Rapid Fire (ms) */
export const POWERUP_RAPID_FIRE_DURATION_MS = 10000;
/** Multiplicador de cooldown do Rapid Fire */
export const POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER = 0.4;
/** Cor do Rapid Fire */
export const POWERUP_RAPID_FIRE_COLOR = "hsl(30, 100%, 60%)";

/** Duração do Shield (ms) */
export const POWERUP_SHIELD_DURATION_MS = 15000;
/** Multiplicador de dano recebido com Shield */
export const POWERUP_SHIELD_DAMAGE_MULTIPLIER = 0.3;
/** Cor do Shield */
export const POWERUP_SHIELD_COLOR = "hsl(270, 100%, 70%)";