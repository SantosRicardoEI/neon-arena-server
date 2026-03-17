/** Vida máxima do jogador */
export const PLAYER_MAX_HEALTH = 150;
/** Duração da invencibilidade após levar dano (ms) */
export const PLAYER_INVINCIBLE_MS = 500;
/** Duração da invencibilidade ao respawn (ms) */
export const RESPAWN_INVINCIBLE_MS = 2000;
/** Cooldown entre pedidos de respawn (ms) */
export const RESPAWN_REQUEST_COOLDOWN_MS = 250;
/** Distância mínima de inimigos ao escolher posição de respawn (px) */
export const RESPAWN_SAFE_DISTANCE_FROM_ENEMIES = 260;
/** Número máximo de tentativas para encontrar spawn seguro */
export const RESPAWN_SAFE_POSITION_MAX_ATTEMPTS = 25;

/** Número de balas por carregador */
export const MAGAZINE_SIZE = 8;
/** Pontos necessários para ganhar +1 bala no carregador */
export const AMMO_BONUS_SCORE_INTERVAL = 1000;
/** Máximo de balas extra que podem ser ganhas pelo score */
export const AMMO_BONUS_MAX_EXTRA = 12;

/** Velocidade de pico durante o dash (px/s) */
export const DASH_SPEED = 1000;
/** Duração base do dash (ms) */
export const DASH_DURATION_BASE_MS = 300;
/** Fator de aumento da duração do dash por ponto */
export const DASH_DURATION_SCORE_FACTOR = 0.0006;
/** Duração máxima do dash (ms) */
export const DASH_DURATION_MAX_MS = 450;
/** Tempo de espera entre dashes (ms) */
export const DASH_COOLDOWN_MS = 1000;
/** Fração da duração do dash usada para aceleração */
export const DASH_ACCEL_RATIO = 0.1;
/** Fração da duração do dash usada para desaceleração */
export const DASH_DECEL_RATIO = 0.9;

/** Raio base do jogador (px) */
export const PLAYER_RADIUS_BASE = 16;
/** Aumento do raio por ponto */
export const PLAYER_RADIUS_SCORE_FACTOR = 0.008;
/** Raio máximo do jogador (px) */
export const PLAYER_RADIUS_MAX = 200;

/** Velocidade base do jogador (px/s) */
export const PLAYER_SPEED_BASE = 310;
/** Fator de redução de velocidade por ponto */
export const PLAYER_SPEED_SCORE_FACTOR = 0.0002;
/** Velocidade mínima do jogador (px/s) */
export const PLAYER_SPEED_MIN = 200;