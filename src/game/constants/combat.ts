/** Velocidade das balas (px/s) */
export const PROJECTILE_SPEED = 600;
/** Largura visual da bala (px) */
export const PROJECTILE_WIDTH = 4;
/** Comprimento visual da bala (px) */
export const PROJECTILE_LENGTH = 16;
/** Tempo de vida máximo de uma bala (ms) */
export const PROJECTILE_LIFETIME_MS = 2000;
/** Dano causado por cada bala */
export const PROJECTILE_DAMAGE = 25;

/** Cooldown base entre tiros (ms) */
export const SHOOT_COOLDOWN_BASE_MS = 300;
/** Fator de redução do cooldown por ponto */
export const SHOOT_COOLDOWN_SCORE_FACTOR = 0.0004;
/** Cooldown mínimo entre tiros (ms) */
export const SHOOT_COOLDOWN_MIN_MS = 30;

/** Tempo base de recarga (ms) */
export const RELOAD_TIME_BASE_MS = 1200;
/** Fator de redução do reload por ponto */
export const RELOAD_TIME_SCORE_FACTOR = 0.0003;
/** Tempo mínimo de recarga (ms) */
export const RELOAD_TIME_MIN_MS = 170;

/** Pontos ganhos ao matar outro jogador */
export const KILL_SCORE = 200;