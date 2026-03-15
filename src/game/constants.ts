// =============================================
// WORLD
// =============================================

/** Largura total do mapa em pixels */
export const WORLD_WIDTH = 7000;
/** Altura total do mapa em pixels */
export const WORLD_HEIGHT = 5000;
/** Tamanho das células da grelha de fundo (px) */
export const GRID_SIZE = 80;
/** Grossura das linhas da grelha (px) */
export const GRID_LINE_WIDTH = 1;

// =============================================
// WORLD BORDER (Limites do mapa)
// =============================================

/** Grossura da linha da borda do mapa (px) */
export const BORDER_LINE_WIDTH = 4;
/** Cor da borda do mapa */
export const BORDER_COLOR = "hsl(0, 100%, 24%)";
/** Largura do efeito de vinheta/glow na borda (px) */
export const BORDER_GLOW_WIDTH = 80;
/** Opacidade máxima do glow da borda (0–1) */
export const BORDER_GLOW_OPACITY = 0.25;
/** Cor do glow da borda (sem alpha) */
export const BORDER_GLOW_COLOR = "0, 70%, 50%";

// =============================================
// PLAYER — Base stats (antes do scaling)
// =============================================

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

// =============================================
// PLAYER — Dash
// =============================================

/** Velocidade de pico durante o dash (px/s) */
export const DASH_SPEED = 1000;
/** Duração base do dash (ms) */
export const DASH_DURATION_BASE_MS = 300;
/** Fator de aumento da duração do dash por ponto */
export const DASH_DURATION_SCORE_FACTOR = 0.0006;
/** Duração máxima do dash (ms) — limite superior */
export const DASH_DURATION_MAX_MS = 450;
/** Tempo de espera entre dashes (ms) */
export const DASH_COOLDOWN_MS = 1000;
/** Fração da duração do dash usada para aceleração (0–1) — rápida */
export const DASH_ACCEL_RATIO = 0.1;
/** Fração da duração do dash usada para desaceleração (0–1) — lenta e suave */
export const DASH_DECEL_RATIO = 0.9;

// =============================================
// PROJECTILES (Balas)
// =============================================

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

// =============================================
// ENEMIES (Inimigos NPC)
// =============================================

// --- Normal ---
/** Tamanho do inimigo normal (px) */
export const ENEMY_NORMAL_SIZE = 28;
/** Vida do inimigo normal */
export const ENEMY_NORMAL_HEALTH = 1;
/** Velocidade passiva do inimigo normal (px/s) */
export const ENEMY_NORMAL_SPEED_PASSIVE = 60;
/** Velocidade agressiva do inimigo normal (px/s) */
export const ENEMY_NORMAL_SPEED_AGGRESSIVE = 130;
/** Distância de deteção do inimigo normal (px) */
export const ENEMY_NORMAL_DETECT_RANGE = 650;
/** Dano do inimigo normal */
export const ENEMY_NORMAL_DAMAGE = 20;
/** Pontos por matar inimigo normal */
export const ENEMY_NORMAL_KILL_SCORE = 10;
/** Cor passiva do inimigo normal */
export const ENEMY_NORMAL_COLOR_PASSIVE = "hsl(280, 100%, 80%)";
/** Cor agressiva do inimigo normal */
export const ENEMY_NORMAL_COLOR_AGGRESSIVE = "hsl(340, 100%, 70%)";

// --- Fast ---
/** Tamanho do inimigo rápido (px) */
export const ENEMY_FAST_SIZE = 18;
/** Vida do inimigo rápido */
export const ENEMY_FAST_HEALTH = 1;
/** Velocidade passiva do inimigo rápido (px/s) */
export const ENEMY_FAST_SPEED_PASSIVE = 120;
/** Velocidade agressiva do inimigo rápido (px/s) */
export const ENEMY_FAST_SPEED_AGGRESSIVE = 170;
/** Distância de deteção do inimigo rápido (px) */
export const ENEMY_FAST_DETECT_RANGE = 350;
/** Dano do inimigo rápido */
export const ENEMY_FAST_DAMAGE = 10;
/** Pontos por matar inimigo rápido */
export const ENEMY_FAST_KILL_SCORE = 15;
/** Cor passiva do inimigo rápido */
export const ENEMY_FAST_COLOR_PASSIVE = "hsl(160, 100%, 70%)";
/** Cor agressiva do inimigo rápido */
export const ENEMY_FAST_COLOR_AGGRESSIVE = "hsl(140, 100%, 55%)";

// --- Tank ---
/** Tamanho do inimigo tanque (px) */
export const ENEMY_TANK_SIZE = 42;
/** Vida do inimigo tanque */
export const ENEMY_TANK_HEALTH = 3;
/** Velocidade passiva do inimigo tanque (px/s) */
export const ENEMY_TANK_SPEED_PASSIVE = 35;
/** Velocidade agressiva do inimigo tanque (px/s) */
export const ENEMY_TANK_SPEED_AGGRESSIVE = 110;
/** Distância de deteção do inimigo tanque (px) */
export const ENEMY_TANK_DETECT_RANGE = 800;
/** Dano do inimigo tanque */
export const ENEMY_TANK_DAMAGE = 35;
/** Pontos por matar inimigo tanque */
export const ENEMY_TANK_KILL_SCORE = 30;
/** Cor passiva do inimigo tanque */
export const ENEMY_TANK_COLOR_PASSIVE = "hsl(25, 100%, 65%)";
/** Cor agressiva do inimigo tanque */
export const ENEMY_TANK_COLOR_AGGRESSIVE = "hsl(10, 100%, 55%)";

// --- Exploder ---
/** Tamanho do inimigo explosivo (px) */
export const ENEMY_EXPLODER_SIZE = 24;
/** Vida do inimigo explosivo */
export const ENEMY_EXPLODER_HEALTH = 1;
/** Velocidade passiva do inimigo explosivo (px/s) */
export const ENEMY_EXPLODER_SPEED_PASSIVE = 50;
/** Velocidade agressiva do inimigo explosivo (px/s) */
export const ENEMY_EXPLODER_SPEED_AGGRESSIVE = 110;
/** Distância de deteção do inimigo explosivo (px) */
export const ENEMY_EXPLODER_DETECT_RANGE = 400;
/** Dano do inimigo explosivo (contacto) */
export const ENEMY_EXPLODER_DAMAGE = 15;
/** Raio da explosão ao morrer (px) */
export const ENEMY_EXPLODER_EXPLOSION_RADIUS = 120;
/** Dano da explosão */
export const ENEMY_EXPLODER_EXPLOSION_DAMAGE = 30;
/** Pontos por matar inimigo explosivo */
export const ENEMY_EXPLODER_KILL_SCORE = 20;
/** Duração visual da explosão (ms) */
export const ENEMY_EXPLODER_EXPLOSION_DURATION_MS = 400;
/** Cor passiva do inimigo explosivo */
export const ENEMY_EXPLODER_COLOR_PASSIVE = "hsl(55, 100%, 65%)";
/** Cor agressiva do inimigo explosivo */
export const ENEMY_EXPLODER_COLOR_AGGRESSIVE = "hsl(45, 100%, 50%)";

// --- Death Particles (efeito visual ao morrer) ---
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

// --- Spawn weights (probabilidade relativa de cada tipo) ---
/** Peso de spawn do inimigo normal */
export const ENEMY_SPAWN_WEIGHT_NORMAL = 40;
/** Peso de spawn do inimigo rápido */
export const ENEMY_SPAWN_WEIGHT_FAST = 20;
/** Peso de spawn do inimigo tanque */
export const ENEMY_SPAWN_WEIGHT_TANK = 25;
/** Peso de spawn do inimigo explosivo */
export const ENEMY_SPAWN_WEIGHT_EXPLODER = 10;

// --- Periodic Spawning ---
/** Intervalo base de spawn periódico de inimigos (ms) — com 1 jogador */
export const ENEMY_SPAWN_INTERVAL_BASE_MS = 4000;
/** Fator de redução do intervalo por jogador extra: interval = BASE / (1 + (players - 1) × FACTOR) */
export const ENEMY_SPAWN_INTERVAL_PLAYER_FACTOR = 0.4;
/** Intervalo mínimo de spawn (ms) — limite inferior */
export const ENEMY_SPAWN_INTERVAL_MIN_MS = 1500;
/** Número de inimigos spawnados por onda */
export const ENEMY_SPAWN_BATCH_BASE = 2;
/** Inimigos extra por jogador adicional na sala */
export const ENEMY_SPAWN_BATCH_PER_PLAYER = 1;
/** Número máximo de inimigos no mapa ao mesmo tempo */
export const ENEMY_MAX_COUNT = 0;

// --- Legacy aliases (used by old code) ---
/** @deprecated Use ENEMY_NORMAL_SIZE */
export const ENEMY_SIZE = ENEMY_NORMAL_SIZE;
/** @deprecated Use ENEMY_NORMAL_DAMAGE */
export const ENEMY_DAMAGE = ENEMY_NORMAL_DAMAGE;

// =============================================
// COLLECTIBLES & PICKUPS
// =============================================

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

// =============================================
// DROPPED POINTS (Pontos largados ao morrer)
// =============================================

/** Tamanho visual dos pontos largados (px) */
export const DROPPED_POINTS_SIZE = 20;
/** Tempo até desaparecerem (ms) */
export const DROPPED_POINTS_LIFETIME_MS = 30000;

// =============================================
// SCORING (Pontuação)
// =============================================
// CHAT
// =============================================

/** Tempo que uma mensagem de chat fica visível (ms) */
export const CHAT_MESSAGE_VISIBLE_MS = 8000;
/** Número máximo de mensagens visíveis no ecrã ao mesmo tempo */
export const CHAT_MAX_VISIBLE = 8;
/** Comprimento máximo de uma mensagem de chat (caracteres) */
export const CHAT_MAX_LENGTH = 100;

// --- Event log colors (used in chat for system events) ---
/** Cor de evento: jogador entrou */
export const EVENT_COLOR_JOIN = "hsla(120, 80%, 65%, ALPHA)";
/** Cor de evento: jogador saiu */
export const EVENT_COLOR_LEAVE = "hsla(0, 70%, 60%, ALPHA)";
/** Cor de evento: novo host */
export const EVENT_COLOR_HOST = "hsla(45, 100%, 65%, ALPHA)";
/** Cor de evento: jogador matou outro */
export const EVENT_COLOR_KILL = "hsla(340, 100%, 70%, ALPHA)";
/** Cor de evento: pontos apanhados */
export const EVENT_COLOR_POINTS = "hsla(45, 100%, 60%, ALPHA)";
/** Cor de evento: respawn */
export const EVENT_COLOR_RESPAWN = "hsla(210, 100%, 70%, ALPHA)";
/** Cor de evento: health pickup */
export const EVENT_COLOR_HEALTH = "hsla(120, 80%, 55%, ALPHA)";
/** Cor de evento: boss */
export const EVENT_COLOR_BOSS = "hsla(0, 100%, 65%, ALPHA)";

//

// =============================================
// ROUND TIMER
// =============================================

/** Duração de cada ronda (ms) — 5 minutos */
export const ROUND_DURATION_MS = 10 * 60 * 1000;
/** Duração da contagem decrescente para reiniciar (ms) */
export const ROUND_RESTART_COUNTDOWN_MS = 10000;

/** Pontos ganhos ao matar outro jogador */
export const KILL_SCORE = 200;
/** Pontos ganhos ao matar um inimigo NPC */
export const ENEMY_KILL_SCORE = 50;
/** Número inicial de inimigos no mapa */
export const INITIAL_ENEMIES = 0;

// =============================================
// BOSSES
// =============================================

/** Duração do aviso de countdown antes do boss spawnar (ms) */
export const BOSS_SPAWN_WARNING_MS = 5000;
/** Duração do banner de "boss defeated" (ms) */
export const BOSS_DEFEAT_BANNER_MS = 5000;

/** Largura da barra de vida do boss no HUD (px) */
export const BOSS_HUD_BAR_WIDTH = 400;
/** Altura da barra de vida do boss no HUD (px) */
export const BOSS_HUD_BAR_HEIGHT = 16;
/** Posição Y da barra de vida do boss (px from top) */
export const BOSS_HUD_BAR_Y = 70;

/** Tamanho do dot do boss no minimapa (px) */
export const UI_MINIMAP_BOSS_SIZE = 7;

/**
 * Definição de boss. Cada boss tem:
 * - id: identificador único do tipo de boss
 * - name: nome exibido no jogo
 * - size: tamanho visual (px)
 * - health: vida total
 * - speed: velocidade de movimento (px/s)
 * - damage: dano de contacto
 * - detectRange: distância de deteção (px)
 * - killScore: pontos por matar
 * - color: cor principal (hsl)
 * - glowColor: cor do glow (hsl)
 */
export interface BossDefinition {
  id: string;
  name: string;
  size: number;
  health: number;
  speed: number;
  damage: number;
  detectRange: number;
  killScore: number;
  color: string;
  glowColor: string;
  /** Shockwave AoE attack — set to 0 to disable */
  shockwaveRadius: number;
  /** Damage dealt by shockwave */
  shockwaveDamage: number;
  /** Cooldown between shockwaves (ms) */
  shockwaveCooldownMs: number;
  /** Range within which players trigger shockwave */
  shockwaveTriggerRange: number;
}

/** Registo de todos os bosses disponíveis */
export const BOSS_REGISTRY: BossDefinition[] = [
  {
    id: "sentinel",
    name: "THE SENTINEL",
    size: 70,
    health: 50,
    speed: 80,
    damage: 40,
    detectRange: 1200,
    killScore: 500,
    color: "hsl(0, 100%, 55%)",
    glowColor: "hsl(0, 100%, 65%)",
    shockwaveRadius: 0,
    shockwaveDamage: 0,
    shockwaveCooldownMs: 0,
    shockwaveTriggerRange: 0,
  },
  {
    id: "leviathan",
    name: "LEVIATHAN",
    size: 130,
    health: 120,
    speed: 55,
    damage: 50,
    detectRange: 1500,
    killScore: 1500,
    color: "hsl(195, 85%, 25%)",
    glowColor: "hsl(175, 100%, 50%)",
    /** Shockwave AoE radius (px) */
    shockwaveRadius: 300,
    /** Shockwave damage */
    shockwaveDamage: 45,
    /** Shockwave cooldown (ms) */
    shockwaveCooldownMs: 6000,
    /** Players within this range trigger the shockwave */
    shockwaveTriggerRange: 350,
  },
];

/**
 * Schedule de bosses durante a ronda.
 */
export interface BossScheduleEntry {
  bossId: string;
  spawnAtMs: number;
}

/** Agenda de bosses para cada ronda. */
export const BOSS_SCHEDULE: BossScheduleEntry[] = [
  { bossId: "sentinel", spawnAtMs: 1 * 60 * 1000 }, // 1 minuto
  { bossId: "leviathan", spawnAtMs: 3 * 60 * 1000 }, // 3 minutos
  { bossId: "sentinel", spawnAtMs: 6 * 60 * 1000 }, // 6 minutos
  { bossId: "leviathan", spawnAtMs: 8 * 60 * 1000 }, // 8 minutos
];

/** Duração visual da shockwave do boss (ms) */
export const BOSS_SHOCKWAVE_DURATION_MS = 600;
/** Número de tentáculos visuais do Leviathan */
export const LEVIATHAN_TENTACLE_COUNT = 8;
/** Comprimento dos tentáculos (multiplicador do tamanho) */
export const LEVIATHAN_TENTACLE_LENGTH = 0.7;
/** Velocidade de rotação dos tentáculos (rad/s) */
export const LEVIATHAN_ROTATION_SPEED = 0.8;

// =============================================
// SCORE-BASED SCALING
// As stats do jogador mudam conforme a pontuação.
// Fórmulas usadas em src/game/scaling.ts
// =============================================

// --- Attack Speed (Shoot Cooldown) ---
// cooldown = BASE / (1 + score × FACTOR), mínimo MIN
/** Cooldown base entre tiros (ms) */
export const SHOOT_COOLDOWN_BASE_MS = 300;
/** Fator de redução do cooldown por ponto */
export const SHOOT_COOLDOWN_SCORE_FACTOR = 0.0004;
/** Cooldown mínimo entre tiros (ms) — limite inferior */
export const SHOOT_COOLDOWN_MIN_MS = 30;

// --- Reload Time ---
// reload = BASE / (1 + score × FACTOR), mínimo MIN
/** Tempo base de recarga (ms) */
export const RELOAD_TIME_BASE_MS = 1200;
/** Fator de redução do reload por ponto */
export const RELOAD_TIME_SCORE_FACTOR = 0.0003;
/** Tempo mínimo de recarga (ms) — limite inferior */
export const RELOAD_TIME_MIN_MS = 170;

// --- Player Size (Radius) ---
// radius = BASE + score × FACTOR, máximo MAX
/** Raio base do jogador (px) */
export const PLAYER_RADIUS_BASE = 16;
/** Aumento do raio por ponto */
export const PLAYER_RADIUS_SCORE_FACTOR = 0.008;
/** Raio máximo do jogador (px) — limite superior */
export const PLAYER_RADIUS_MAX = 200;

// --- Player Speed ---
// speed = BASE / (1 + score × FACTOR), mínimo MIN
/** Velocidade base do jogador (px/s) */
export const PLAYER_SPEED_BASE = 310;
/** Fator de redução de velocidade por ponto */
export const PLAYER_SPEED_SCORE_FACTOR = 0.0002;
/** Velocidade mínima do jogador (px/s) — limite inferior */
export const PLAYER_SPEED_MIN = 200;

// =============================================
// UI LAYOUT
// Posições dos elementos do HUD no ecrã.
// Valores em píxeis, relativos ao canto indicado.
// =============================================

// Controls help panel
export const UI_CONTROLS_X = 20;
export const UI_CONTROLS_Y = 70;
export const UI_CONTROLS_WIDTH = 220;
export const UI_CONTROLS_LINE_HEIGHT = 20;
export const UI_CONTROLS_PADDING_X = 12;
export const UI_CONTROLS_PADDING_Y = 12;

// Controls help text
export const UI_CONTROLS_TITLE = "CONTROLS";
export const UI_CONTROL_MOVE_LABEL = "MOVE";
export const UI_CONTROL_MOVE_VALUE = "WASD";
export const UI_CONTROL_DASH_LABEL = "DASH";
export const UI_CONTROL_DASH_VALUE = "SPACE";
export const UI_CONTROL_AIM_LABEL = "AIM";
export const UI_CONTROL_AIM_VALUE = "MOUSE";
export const UI_CONTROL_SHOOT_LABEL = "SHOOT";
export const UI_CONTROL_SHOOT_VALUE = "LEFT CLICK";
export const UI_CONTROL_RELOAD_LABEL = "RELOAD";
export const UI_CONTROL_RELOAD_VALUE = "R";

// Controls help colors
export const UI_CONTROLS_PANEL_BG = "hsla(233, 47%, 4%, 0.75)";
export const UI_CONTROLS_PANEL_BORDER = "hsla(240, 10%, 40%, 0.4)";
export const UI_CONTROLS_TITLE_COLOR = "hsla(210, 100%, 70%, 0.9)";
export const UI_CONTROLS_LABEL_COLOR = "hsla(240, 10%, 70%, 0.85)";
export const UI_CONTROLS_VALUE_COLOR = "hsla(240, 10%, 92%, 0.95)";
export const UI_CONTROLS_SEPARATOR_COLOR = "hsla(240, 10%, 50%, 0.3)";

/** Painel de stats — margem esquerda (px) */
export const UI_STATS_X = 20;
/** Painel de stats — margem superior (px) */
export const UI_STATS_Y = 60;
export const UI_STATS_GAP_ABOVE_BOTTOM_UI = 130;

/** Texto do score — margem direita (px) */
export const UI_SCORE_RIGHT = 20;
/** Texto do score — margem superior (px) */
export const UI_SCORE_TOP = 40;

/** Barra de vida — margem esquerda (px) */
export const UI_HEALTH_X = 20;
/** Barra de vida — margem inferior (px, a partir do fundo) */
export const UI_HEALTH_BOTTOM = 40;

/** Indicador de munição — offset acima da barra de vida (px) */
export const UI_AMMO_OFFSET_ABOVE_HEALTH = 30;
/** Indicador de dash — offset acima da munição (px) */
export const UI_DASH_OFFSET_ABOVE_AMMO = 24;

/** Scoreboard — margem direita (px) */
export const UI_SCOREBOARD_RIGHT = 20;

/** Minimapa — margem direita (px) */
export const UI_MINIMAP_RIGHT = 16;
/** Minimapa — margem inferior (px) */
export const UI_MINIMAP_BOTTOM = 16;
/** Minimapa — largura (px) */
export const UI_MINIMAP_WIDTH = 270;

// --- Minimap visual config ---
/** Opacidade do fundo do minimapa (0–1) */
export const UI_MINIMAP_BG_OPACITY = 0.85;
/** Cor do fundo do minimapa */
export const UI_MINIMAP_BG_COLOR = "233, 47%, 4%";
/** Cor da borda do minimapa */
export const UI_MINIMAP_BORDER_COLOR = "hsla(210, 40%, 35%, 0.6)";
/** Border radius do minimapa (px) */
export const UI_MINIMAP_BORDER_RADIUS = 6;
/** Padding interno do header acima do minimapa (px) */
export const UI_MINIMAP_HEADER_HEIGHT = 22;
/** Fonte do header */
export const UI_MINIMAP_HEADER_FONT = '10px "Roboto Mono", monospace';
/** Cor do texto do header */
export const UI_MINIMAP_HEADER_COLOR = "hsla(210, 60%, 75%, 0.9)";

// --- Minimap dot sizes ---
/** Tamanho do dot do jogador local no minimapa (px) */
export const UI_MINIMAP_LOCAL_PLAYER_SIZE = 5;
/** Tamanho do dot dos outros jogadores no minimapa (px) */
export const UI_MINIMAP_OTHER_PLAYER_SIZE = 3.5;
/** Tamanho do dot de inimigos no minimapa (px) */
export const UI_MINIMAP_ENEMY_SIZE = 3;
/** Mostrar coletáveis no minimapa */
export const UI_MINIMAP_SHOW_COLLECTIBLES = true;
/** Tamanho do dot de coletáveis no minimapa (px) */
export const UI_MINIMAP_COLLECTIBLE_SIZE = 1;
/** Opacidade dos coletáveis no minimapa (0–1) */
export const UI_MINIMAP_COLLECTIBLE_OPACITY = 0.3;
/** Tamanho do dot de power-ups no minimapa (px) */
export const UI_MINIMAP_POWERUP_SIZE = 4;
/** Tamanho do dot de health pickups no minimapa (px) */
export const UI_MINIMAP_HEALTH_SIZE = 3;
/** Mostrar indicador de direção do jogador local */
export const UI_MINIMAP_SHOW_DIRECTION = true;
/** Comprimento do indicador de direção (px) */
export const UI_MINIMAP_DIRECTION_LENGTH = 8;
/** Mostrar glow no jogador local */
export const UI_MINIMAP_LOCAL_GLOW = true;
/** Raio do glow do jogador local (px) */
export const UI_MINIMAP_LOCAL_GLOW_RADIUS = 10;
/** Mostrar viewport rect no minimapa */
export const UI_MINIMAP_SHOW_VIEWPORT = true;
/** Cor do viewport rect */
export const UI_MINIMAP_VIEWPORT_COLOR = "hsla(210, 60%, 70%, 0.25)";

/** Chat — margem esquerda (px) */
export const UI_CHAT_X = 20;
/** Chat — posição vertical a partir do centro do ecrã (px, positivo = abaixo do centro) */
export const UI_CHAT_CENTER_OFFSET_Y = 40;

// =============================================
// PLAYER CUSTOMIZATION
// =============================================

/** Available player colors */
export const PLAYER_COLOR_OPTIONS = [
  "hsl(210, 100%, 70%)", // Blue
  "hsl(0, 100%, 65%)", // Red
  "hsl(160, 100%, 60%)", // Cyan-green
  "hsl(300, 100%, 70%)", // Magenta
  "hsl(30, 100%, 65%)", // Orange
  "hsl(50, 100%, 65%)", // Gold
  "hsl(270, 100%, 75%)", // Purple
  "hsl(180, 100%, 60%)", // Cyan
];

// =============================================
// STARFIELD BACKGROUND
// =============================================

/** Number of small distant stars */
export const STARS_SMALL_COUNT = 30000;
/** Number of medium stars */
export const STARS_MEDIUM_COUNT = 200;
/** Number of large bright stars with glow */
export const STARS_LARGE_COUNT = 70;
/** Parallax factor for small stars (0 = static, 1 = moves with camera) */
export const STARS_PARALLAX_SMALL = 0.05;
/** Parallax factor for medium stars */
export const STARS_PARALLAX_MEDIUM = 0.1;
/** Parallax factor for large stars */
export const STARS_PARALLAX_LARGE = 0.15;
/** Max glow radius for large stars */
export const STARS_GLOW_RADIUS = 40;
/** Glow pulse speed (radians per second) */
export const STARS_GLOW_PULSE_SPEED = 1.5;
/** Background gradient color 1 (center) */
export const BG_GRADIENT_CENTER = "hsl(245, 48%, 5%)";
/** Background gradient color 2 (edges) */
export const BG_GRADIENT_EDGE = "hsl(246, 33%, 6%)";
/** Subtle nebula tint color */
export const BG_NEBULA_COLOR = "210, 80%, 30%";
/** Nebula max opacity */
export const BG_NEBULA_OPACITY = 0.06; //0.06

// =============================================
// PLAYER TRAIL (Smoke trail atrás dos jogadores)
// =============================================

/** Número máximo de pontos no trail por jogador */
export const TRAIL_MAX_POINTS = 40;
/** Intervalo mínimo entre registos de pontos do trail (ms) */
export const TRAIL_SAMPLE_INTERVAL_MS = 40;
/** Raio base das partículas de fumo (px) */
export const TRAIL_PARTICLE_RADIUS = 20; //6
/** Opacidade máxima do trail (0–1) */
export const TRAIL_MAX_OPACITY = 0.15;
/** Fator de crescimento do raio com a idade */
export const TRAIL_RADIUS_GROWTH = 2.9;
/** Tempo de vida do trail antes de desaparecer completamente (ms) */
export const TRAIL_LIFETIME_MS = 1000;
/** Velocidade de dispersão/drift das partículas (px/s) */
export const TRAIL_DRIFT_SPEED = 18;

// =============================================
// POWER-UPS
// =============================================

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
/** Multiplicador de cooldown do Rapid Fire (menor = mais rápido) */
export const POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER = 0.4;
/** Cor do Rapid Fire */
export const POWERUP_RAPID_FIRE_COLOR = "hsl(30, 100%, 60%)";

/** Duração do Shield (ms) */
export const POWERUP_SHIELD_DURATION_MS = 15000;
/** Multiplicador de dano recebido com Shield (0.3 = 70% redução) */
export const POWERUP_SHIELD_DAMAGE_MULTIPLIER = 0.3;
/** Cor do Shield */
export const POWERUP_SHIELD_COLOR = "hsl(270, 100%, 70%)";

// =============================================
// COLORS (Paleta de cores do jogo)
// =============================================

export const COLORS = {
  /** Fundo do mapa */
  background: "hsl(233, 47%, 4%)",
  /** Cor da grelha */
  grid: "hsl(216, 23%, 13%)",
  /** Cor do jogador local (fallback) */
  player: "hsl(210, 100%, 70%)",
  /** Cor do jogador local quando a levar dano */
  playerDamage: "hsl(0, 100%, 70%)",
  /** Cor dos outros jogadores (fallback) */
  otherPlayer: "hsl(120, 100%, 70%)",
  /** Cor dos inimigos passivos */
  enemyPassive: "hsl(280, 100%, 80%)",
  /** Cor dos inimigos agressivos */
  enemyAggressive: "hsl(340, 100%, 70%)",
  /** Cor das balas */
  projectile: "hsl(60, 100%, 70%)",
  /** Cor dos coletáveis */
  collectible: "hsl(180, 100%, 50%)",
  /** Cor dos pontos largados ao morrer */
  droppedPoints: "hsl(45, 100%, 60%)",
  /** Cor dos health pickups */
  healthPickup: "hsl(120, 80%, 55%)",
  /** Cor do texto do HUD */
  hudText: "hsl(240, 10%, 95%)",
};
