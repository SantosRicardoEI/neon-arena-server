/**
 * Shared type definitions used by both client and server.
 * NO browser API dependencies allowed in this file.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type PlayerSkin = 'circle' | 'diamond' | 'hexagon' | 'star';

export type PowerUpType = 'speed' | 'rapid_fire' | 'shield';

export interface ActivePowerUp {
  type: PowerUpType;
  expiresAt: number;
}

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  pos: Vec2;
  pulsePhase: number;
}

export interface Player {
  id: string;
  name: string;
  pos: Vec2;
  vel: Vec2;
  health: number;
  maxHealth: number;
  score: number;
  aimAngle: number;
  lastShot: number;
  invincibleUntil: number;
  color: string;
  skin: PlayerSkin;
  // Ammo / reload
  ammo: number;
  reloadingUntil: number;
  // Dash
  lastDash: number;
  isDashing: boolean;
  dashUntil: number;
  dashAngle: number;
  // Power-ups
  activePowerUps: ActivePowerUp[];
  // Remote interpolation state
  targetPos: Vec2 | null;
  targetAimAngle: number | null;
  lastNetworkUpdate: number;
  lastProcessedInputSeq: number;
}

export type EnemyType = 'normal' | 'fast' | 'tank' | 'exploder';

export interface Enemy {
  id: string;
  type: EnemyType;
  pos: Vec2;
  vel: Vec2;
  health: number;
  maxHealth: number;
  state: 'passive' | 'aggressive';
  targetPlayerId: string | null;
  stateChangeTime: number;
  targetPos: Vec2 | null;
  lastNetworkUpdate: number;
}

export interface Projectile {
  id: string;
  pos: Vec2;
  vel: Vec2;
  ownerId: string;
  createdAt: number;
  trail: Vec2[];
}

export interface Collectible {
  id: string;
  pos: Vec2;
  pulsePhase: number;
}

export interface DroppedPoints {
  id: string;
  pos: Vec2;
  value: number;
  pulsePhase: number;
  createdAt: number;
}

export interface HealthPickup {
  id: string;
  pos: Vec2;
  pulsePhase: number;
}

export interface Explosion {
  pos: Vec2;
  radius: number;
  createdAt: number;
}

export interface DeathParticle {
  pos: Vec2;
  vel: Vec2;
  createdAt: number;
  hue: number;
  size: number;
}

export interface Boss {
  id: string;
  definitionId: string;
  name: string;
  pos: Vec2;
  vel: Vec2;
  health: number;
  maxHealth: number;
  size: number;
  speed: number;
  damage: number;
  detectRange: number;
  killScore: number;
  color: string;
  glowColor: string;
  targetPlayerId: string | null;
  /** Timestamp of last shockwave attack */
  lastShockwave: number;
}

export interface BossSpawnEvent {
  scheduleIndex: number;
  bossId: string;
  bossName: string;
  /** When the warning started (timestamp) */
  warningStartedAt: number;
  /** Whether the boss has actually spawned */
  spawned: boolean;
}

export interface BossDefeatEvent {
  bossName: string;
  killerName: string;
  timestamp: number;
}

export type ChatMessageType = 'chat' | 'event_join' | 'event_leave' | 'event_host' | 'event_kill' | 'event_points' | 'event_respawn' | 'event_health' | 'event_boss';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  type: ChatMessageType;
}

export interface GameState {
  players: Map<string, Player>;
  enemies: Enemy[];
  bosses: Boss[];
  projectiles: Projectile[];
  collectibles: Collectible[];
  droppedPoints: DroppedPoints[];
  healthPickups: HealthPickup[];
  powerUpItems: PowerUpItem[];
  explosions: Explosion[];
  deathParticles: DeathParticle[];
  chatMessages: ChatMessage[];
  worldWidth: number;
  worldHeight: number;
  lastHealthPickupSpawn: number;
  lastEnemySpawn: number;
  lastPowerUpSpawn: number;
  hostId: string | null;
  roomName: string;
  // Round timer
  roundStartTime: number;
  roundOver: boolean;
  restartCountdownStart: number;
  // Boss system
  bossSpawnEvents: BossSpawnEvent[];
  bossDefeatEvents: BossDefeatEvent[];
  /** Which schedule indices have been triggered already */
  bossScheduleTriggered: Set<number>;
}

export interface InputState {
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
  canvasRect: DOMRect | null;
}

export interface NetworkPlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  aimAngle: number;
  health: number;
  score: number;
  color: string;
  skin: PlayerSkin;
}

export interface NetworkMessage {
  type: 'player_state' | 'shoot' | 'enemy_kill' | 'collect' | 'player_hit';
  payload: any;
  senderId: string;
}

export interface NetworkGameState {
  seq: number;
  enemies: {
    id: string;
    type: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    state: string;
  }[];  
  bosses: { id: string; definitionId: string; name: string; x: number; y: number; vx: number; vy: number; health: number; maxHealth: number; size: number; speed: number; damage: number; detectRange: number; killScore: number; color: string; glowColor: string; targetPlayerId: string | null; lastShockwave: number }[];
  projectiles: { id: string; x: number; y: number; vx: number; vy: number; ownerId: string; createdAt: number }[];
  explosions: { x: number; y: number; radius: number; createdAt: number }[];
  players: {
    [id: string]: {
      id: string;
      name: string;
      x: number;
      y: number;
      aimAngle: number;
      health: number;
      score: number;
      invincibleUntil: number;
      color: string;
      skin: PlayerSkin;
      ammo: number;
      reloadingUntil: number;
      lastProcessedInputSeq: number;
      activePowerUps: { type: string; expiresAt: number }[];
    };
  };
  roundElapsedMs: number;
  roundOver: boolean;
  restartCountdownStart: number;
  bossSpawnEvents: { scheduleIndex: number; bossId: string; bossName: string; warningStartedAt: number; spawned: boolean }[];
  bossDefeatEvents: { bossName: string; killerName: string; timestamp: number }[];
  bossScheduleTriggered: number[];
}

/**
 * Events emitted by the simulation update function.
 * Used by both client (for SFX/UI) and future server (for broadcasting).
 */
export interface SimulationEvents {
  enemiesKilled: {
    id: string;
    kind: "enemy" | "boss";
    type: EnemyType | string;
    x: number;
    y: number;
  }[];
  collectiblesGathered: string[];
  playersHit: { playerId: string; damage: number }[];
  droppedPointsGathered: { id: string; pickerId: string; pickerName: string; value: number }[];
  healthPickupsGathered: { id: string; pickerId: string; pickerName: string }[];
  powerUpsGathered: { id: string; pickerId: string; pickerName: string; type: PowerUpType }[];
  reloadCompletedPlayerIds: string[];
  playerKills: { killerId: string; killerName: string; victimId: string; victimName: string }[];
}
