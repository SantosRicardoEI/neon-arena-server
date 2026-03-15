/**
 * Shared network protocol message types.
 * Transport-agnostic discriminated unions for client↔server communication.
 * NO browser API dependencies.
 */
import type {
  Vec2,
  PlayerSkin,
  PowerUpType,
  EnemyType,
  NetworkPlayerState,
  NetworkGameState,
  SimulationEvents,
} from '../types';

// ─── Client → Server (Player Intent) ────────────────────────────────

/** Player movement/aim input sent every tick */
export interface ClientInputMessage {
  type: 'client:input';
  seq: number;
  moveDir: Vec2;
  aimAngle: number;
  clientTime: number;
}

/** Player intends to shoot in a direction */
export interface ClientShootMessage {
  type: 'client:shoot';
  aimAngle: number;
}

/** Player intends to dash in a direction */
export interface ClientDashMessage {
  type: 'client:dash';
  aimAngle: number;
}

/** Player triggers a reload */
export interface ClientReloadMessage {
  type: 'client:reload';
}

/** Player sends a chat message */
export interface ClientChatMessage {
  type: 'client:chat';
  text: string;
}

/** Player requests respawn after death */
export interface ClientRespawnMessage {
  type: 'client:respawn';
}

/** Player joins a room */
export interface ClientJoinMessage {
  type: 'client:join';
  roomId: string;
  playerName: string;
  skin: PlayerSkin;
  color: string;
}

/** Player leaves voluntarily */
export interface ClientLeaveMessage {
  type: 'client:leave';
}

export interface ClientListRoomsMessage {
  type: 'client:list_rooms';
}

export type ClientMessage =
  | ClientInputMessage
  | ClientShootMessage
  | ClientDashMessage
  | ClientReloadMessage
  | ClientChatMessage
  | ClientRespawnMessage
  | ClientJoinMessage
  | ClientLeaveMessage
  | ClientListRoomsMessage;

// ─── Server → Client (Authoritative State) ──────────────────────────

/** Full authoritative game state snapshot */
export interface ServerSnapshotMessage {
  type: 'server:snapshot';
  state: NetworkGameState;
  serverTime: number;
}

/** Authoritative gameplay events produced by the server simulation */
export interface ServerGameEventsMessage {
  type: 'server:game_events';
  events: SimulationEvents;
  serverTime: number;
}

/** Individual player state update */
export interface ServerPlayerStateMessage {
  type: 'server:player_state';
  player: NetworkPlayerState;
}

/** A player has left the room */
export interface ServerPlayerLeaveMessage {
  type: 'server:player_leave';
  playerId: string;
}

/** Authoritative enemy state batch */
export interface ServerEnemyStateMessage {
  type: 'server:enemy_state';
  enemies: {
    id: string;
    enemyType: EnemyType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    state: 'passive' | 'aggressive';
    targetPlayerId: string | null;
  }[];
}

/** Authoritative boss state batch */
export interface ServerBossStateMessage {
  type: 'server:boss_state';
  bosses: {
    id: string;
    definitionId: string;
    name: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    health: number;
    maxHealth: number;
    size: number;
    targetPlayerId: string | null;
    lastShockwave: number;
  }[];
}

/** Authoritative projectile state batch */
export interface ServerProjectileStateMessage {
  type: 'server:projectile_state';
  projectiles: {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ownerId: string;
    createdAt: number;
  }[];
}

/** Authoritative power-up item state batch */
export interface ServerPowerUpStateMessage {
  type: 'server:powerup_state';
  powerUpItems: {
    id: string;
    type: PowerUpType;
    x: number;
    y: number;
  }[];
  /** Active power-ups per player */
  activePowerUps: {
    playerId: string;
    type: PowerUpType;
    expiresAt: number;
  }[];
}

/** Round state (timer, over, restart countdown) */
export interface ServerRoundStateMessage {
  type: 'server:round_state';
  roundElapsedMs: number;
  roundOver: boolean;
  restartCountdownStart: number;
}

/** Room metadata update */
export interface ServerRoomStateMessage {
  type: 'server:room_state';
  hostId: string;
  playerIds: string[];
  roomName: string;
  yourPlayerId: string;
}

/** Chat message broadcast */
export interface ServerChatMessage {
  type: 'server:chat';
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/** Boss lifecycle event */
export interface ServerBossEventMessage {
  type: 'server:boss_event';
  event:
    | { kind: 'spawn_warning'; bossName: string; bossId: string; scheduleIndex: number }
    | { kind: 'spawned'; bossName: string; bossId: string }
    | { kind: 'defeated'; bossName: string; killerName: string }
    | { kind: 'shockwave'; bossId: string; x: number; y: number; radius: number };
  timestamp: number;
}

/** Player kill event */
export interface ServerKillEventMessage {
  type: 'server:kill_event';
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  timestamp: number;
}

/** Pause state change */
export interface ServerPauseMessage {
  type: 'server:pause';
  paused: boolean;
}

export interface ServerRoomListMessage {
  type: 'server:room_list';
  rooms: {
    roomId: string;
    playerCount: number;
  }[];
}

export type ServerMessage =
  | ServerSnapshotMessage
  | ServerGameEventsMessage
  | ServerPlayerStateMessage
  | ServerPlayerLeaveMessage
  | ServerEnemyStateMessage
  | ServerBossStateMessage
  | ServerProjectileStateMessage
  | ServerPowerUpStateMessage
  | ServerRoundStateMessage
  | ServerRoomStateMessage
  | ServerChatMessage
  | ServerBossEventMessage
  | ServerKillEventMessage
  | ServerPauseMessage
  | ServerRoomListMessage;

// ─── Envelope ────────────────────────────────────────────────────────

/** Transport-agnostic envelope wrapping any protocol message */
export interface NetworkEnvelope<T extends ClientMessage | ServerMessage = ClientMessage | ServerMessage> {
  senderId: string;
  message: T;
}

