/** Raio da explosão do exploder ao morrer (px) */
export const ENEMY_EXPLODER_EXPLOSION_RADIUS = 120;
/** Dano da explosão do exploder */
export const ENEMY_EXPLODER_EXPLOSION_DAMAGE = 30;
/** Duração visual da explosão (ms) */
export const ENEMY_EXPLODER_EXPLOSION_DURATION_MS = 400;

/** Número de partículas por morte de inimigo */
export const DEATH_PARTICLE_COUNT = 10;
/** Velocidade mínima das partículas (px/s) */
export const DEATH_PARTICLE_SPEED_MIN = 80;
/** Velocidade máxima das partículas (px/s) */
export const DEATH_PARTICLE_SPEED_MAX = 250;
/** Tamanho mínimo das partículas (px) */
export const DEATH_PARTICLE_SIZE_MIN = 2;
/** Tamanho máximo das partículas (px) */
export const DEATH_PARTICLE_SIZE_MAX = 5;
/** Duração de vida das partículas (ms) */
export const DEATH_PARTICLE_LIFETIME_MS = 500;

/** Intervalo base de spawn periódico de inimigos (ms) */
export const ENEMY_SPAWN_INTERVAL_BASE_MS = 4000;
/** Fator de redução do intervalo por jogador extra */
export const ENEMY_SPAWN_INTERVAL_PLAYER_FACTOR = 0.4;
/** Intervalo mínimo de spawn (ms) */
export const ENEMY_SPAWN_INTERVAL_MIN_MS = 1500;
/** Número de inimigos spawnados por onda */
export const ENEMY_SPAWN_BATCH_BASE = 2;
/** Inimigos extra por jogador adicional na sala */
export const ENEMY_SPAWN_BATCH_PER_PLAYER = 1;
/** Número máximo de inimigos no mapa ao mesmo tempo */
export const ENEMY_MAX_COUNT = 100;

/** Número inicial de inimigos no mapa */
export const INITIAL_ENEMIES = 30;
/** Pontos globais por matar inimigo, se ainda houver código legado a usar isto */
export const ENEMY_KILL_SCORE = 50;