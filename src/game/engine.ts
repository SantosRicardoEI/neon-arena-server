/**
 * Motor principal do jogo no cliente.
 *
 * Responsabilidades:
 * - inicializar o estado local do jogo;
 * - arrancar em modo solo ou online;
 * - processar input do jogador local;
 * - aplicar prediction no cliente quando está online;
 * - receber snapshots e eventos autoritários do servidor;
 * - atualizar o estado visual e tocar efeitos/sons;
 * - correr o loop principal e renderizar cada frame.
 *
 * Regras gerais:
 * - em modo solo, este motor também executa a simulação autoritária local;
 * - em modo online, a autoridade está no servidor e o cliente limita-se a:
 *   enviar input, prever localmente alguns movimentos e aplicar snapshots recebidos.
 */

import { isControlPressed } from './controls';
import type { DevSpawnCategory, DevSpawnOptionId } from '../gameplay/dev/types';
import { spawnDevEntity, clearDevSpawnedEntities } from '../gameplay/dev/spawn-actions';
import {
  GameState,
  InputState,
  Player,
  PlayerSkin,
  NetworkGameState,
  ChatMessage,
  ChatMessageType,
  SimulationEvents,
  Vec2,
} from './types';import { createPlayer } from '../gameplay/players/factory';
import {
  updateGameState,
  initiateDash,
  computeMovementVelocity,
} from './simulation';
import { createProjectile } from '../gameplay/projectiles/factory';
import { spawnDeathParticles } from '../gameplay/enemies/effects';
import { playerHasPowerUp } from '../gameplay/powerups/utils';
import { render } from './renderer';
import { playShoot, playEnemyDeath, playCollect, playDamage, playGameOver, playDash, playHealthPickup, playReloadComplete, playDroppedPointsPickup, playPowerUpPickup, playBossShockwave } from './audio';
import { music } from './music';
import * as C from './constants';
import { getShootCooldown, getReloadTime, getMagazineSize } from '../shared/scaling';
import { updateBossSchedule, checkRoundTimer, resetRound, respawnPlayer, cleanupExpiredEntities, createGameState } from '../server-ready/room-state';
import { submitScore } from '../lib/leaderboard';
// Prediction modules
import { InputBuffer } from '../client/prediction/input-buffer';
import { interpolateRemotePlayer} from '../client/prediction/interpolation';
import { GameSocket } from '../client/network/game-socket';
import { predictMovement } from '../client/prediction/movement-prediction';


const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "ws://localhost:3001";
const LOCAL_PREDICTION_STEP = 1 / 60;

const LOCAL_RECONCILE_HARD_DISTANCE = 40;
const LOCAL_RECONCILE_SNAP_DISTANCE = 120;

const LOCAL_RECONCILE_HARD_LERP = 0.45;


export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private input: InputState; 
  private localPlayerId: string;
  private running = false;
  private lastTime = 0;
  private animFrameId = 0;
  
  private wasDead = false;
  private lastReceivedGameStateSeq = -1;
  
  private chatting = false;
  private chatInput = '';
  private chatNextId = 0;
  private lastRespawnRequestAt = 0;
  private scoreSubmitted = false;
  private lastKnownBossShockwaves = new Map<string, number>();
  private gameMode: "solo" | "online" | "dev_test";
  private inputBuffer = new InputBuffer();
  private socket: GameSocket | null = null;
  private pingIntervalId: number | null = null;
  private devSelectedCategory: DevSpawnCategory = 'enemy';
  private devSelectedOptionId: DevSpawnOptionId | null = null;
  private previousMouseDown = false;
  private devSpawnClickConsumed = false;
  private localPredictionAccumulator = 0;

/**
 * Cria uma nova instância do motor de jogo.
 *
 * Inicializa o canvas, input, estado base e escolhe o modo de arranque:
 * - solo: cria logo o jogador local e define autoridade local;
 * - online: abre a ligação ao servidor e prepara os handlers de rede.
 */
  constructor(
  canvas: HTMLCanvasElement,
  input: InputState,
  playerId: string,
  playerName: string,
  roomId: string,
  playerColor: string,
  playerSkin: PlayerSkin,
  gameMode: "solo" | "online" | "dev_test"
) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.input = input;
    this.localPlayerId = playerId;
    this.gameMode = gameMode;

    this.state = createGameState(roomId, performance.now(), {
      seedInitialEnemies: !this.isDevTest,
      seedInitialCollectibles: !this.isDevTest,
    });

    if (this.isLocalMode) {
        this.initLocal(playerId, playerName, playerColor, playerSkin);
      } else {
        this.initOnline(roomId, playerName, playerColor, playerSkin);
    }
  }

/**
 * Inicializa o jogo em modo solo.
 *
 * Cria o jogador local no estado do jogo e marca este cliente
 * como autoridade local da sessão.
 */
  private initLocal(
  playerId: string,
  playerName: string,
  playerColor: string,
  playerSkin: PlayerSkin,
): void {
  this.state.players.set(
    playerId,
    createPlayer(playerId, playerName, playerColor, playerSkin)
  );
  this.state.hostId = playerId;
}

/**
 * Inicializa o jogo em modo online.
 *
 * Cria o socket de jogo, arranca o ping periódico para medir latência,
 * envia o pedido de join ao servidor e regista os handlers das mensagens
 * recebidas da rede.
 */
private initOnline(
  roomId: string,
  playerName: string,
  playerColor: string,
  playerSkin: PlayerSkin,
): void {
  this.socket = new GameSocket();

  this.pingIntervalId = window.setInterval(() => {
    this.socket?.send({
      type: "client:ping",
      t: Date.now(),
    } as any);
  }, 2000);

  this.socket.connect(SERVER_URL, () => {
    this.socket?.send({
      type: "client:join",
      roomId,
      playerName,
      skin: playerSkin,
      color: playerColor,
    });
  });

  this.setupSocketHandlers();
}

/**
 * Regista os handlers das mensagens recebidas do servidor.
 *
 * Trata:
 * - pong do servidor para cálculo de ping;
 * - estado da sala e identificação do jogador local;
 * - eventos autoritários de jogo;
 * - sincronização de pickups e itens do mundo;
 * - snapshots completos do estado do jogo.
 */
private setupSocketHandlers(): void {
  this.socket?.onMessage((msg) => {
    if ((msg as any).type === "server:pong") {
      const ping = Date.now() - (msg as any).t;
      console.log("[net] ping =", ping, "ms");
    }

    if (msg.type === "server:room_state") {
      this.localPlayerId = msg.yourPlayerId;
      this.state.hostId = msg.hostId;
      this.state.roomName = msg.roomName;
    }

    if (msg.type === "server:game_events") {
      this.handleAuthoritativeGameEvents(msg.events);
    }

    if (msg.type === "server:world_items_state") {
      this.applyWorldItemsState(msg);
    }

    if (msg.type === "server:snapshot") {
      this.handleGameStateReceived(msg.state);
    }
  });
}

/**
 * Arranca o motor de jogo.
 *
 * Inicia o loop principal, ativa a música de jogo e liga
 * os listeners de teclado necessários para o chat.
 */
  async start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    music.play('game');
    this.localPredictionAccumulator = 0;
    this.loop(this.lastTime);
    document.addEventListener('keydown', this.onChatKeyDown);
  }

/**
 * Pára o motor de jogo.
 *
 * Cancela o loop de animação, limpa timers ativos, remove listeners,
 * fecha a ligação de rede se existir e repõe a música de menu.
 */
  stop() {
    if (!this.running) return;
    if (this.pingIntervalId !== null) {
      window.clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    console.log("[engine] stop");
    this.running = false;
    cancelAnimationFrame(this.animFrameId);
    this.animFrameId = 0;
    document.removeEventListener('keydown', this.onChatKeyDown);
    this.localPredictionAccumulator = 0;
    this.socket?.disconnect();
    music.play('menu');
  }

/**
 * Aplica ao estado local a versão autoritária dos itens do mundo.
 *
 * Converte os dados recebidos do servidor para o formato interno usado
 * pelo cliente, incluindo collectibles, dropped points, health pickups
 * e power-ups.
 */
  private applyWorldItemsState(msg: {
    collectibles: Array<{ id: string; x: number; y: number; pulsePhase: number }>;
    droppedPoints: Array<{ id: string; x: number; y: number; value: number; pulsePhase: number; createdAt: number }>;
    healthPickups: Array<{ id: string; x: number; y: number; pulsePhase: number }>;
    powerUpItems: Array<{ id: string; x: number; y: number; type: string; pulsePhase: number }>;
  }): void {
    this.state.collectibles = msg.collectibles.map(c => ({
      id: c.id,
      pos: { x: c.x, y: c.y },
      pulsePhase: c.pulsePhase,
    }));

    this.state.droppedPoints = msg.droppedPoints.map(dp => ({
      id: dp.id,
      pos: { x: dp.x, y: dp.y },
      value: dp.value,
      pulsePhase: dp.pulsePhase,
      createdAt: dp.createdAt,
    }));

    this.state.healthPickups = msg.healthPickups.map(hp => ({
      id: hp.id,
      pos: { x: hp.x, y: hp.y },
      pulsePhase: hp.pulsePhase,
    }));

    this.state.powerUpItems = msg.powerUpItems.map(pu => ({
      id: pu.id,
      type: pu.type as any,
      pos: { x: pu.x, y: pu.y },
      pulsePhase: pu.pulsePhase,
    }));
  }

  /**
 * Mantém o estado da ronda congelado no modo dev_test.
 *
 * Isto impede:
 * - avanço visual do timer;
 * - round over;
 * - countdown de restart.
 */
private keepDevTestRoundFrozen(now: number): void {
  if (!this.isDevTest) return;

  this.state.roundStartTime = now;
  this.state.roundOver = false;
  this.state.restartCountdownStart = 0;
}

/**
 * Loop principal do jogo, executado a cada frame.
 *
 * Responsabilidades por frame:
 * - calcular delta time;
 * - atualizar timers e bosses em solo;
 * - processar input do jogador local;
 * - interpolar entidades remotas;
 * - executar a frame de jogo adequada ao modo atual;
 * - tocar efeitos/sons com base nos eventos;
 * - limpar entidades visuais expiradas;
 * - renderizar o estado atual;
 * - agendar o frame seguinte.
 */
  private loop = (timestamp: number) => {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.keepDevTestRoundFrozen(timestamp);

      if (this.isSolo && !this.isDevTest) {
        const { roundJustEnded, shouldRestart } = checkRoundTimer(this.state, timestamp);
        if (roundJustEnded) {
          this.addSystemEvent('event_host', 'Round over! Final scores:');
          this.submitScores();
        }
        if (shouldRestart) {
          resetRound(this.state, timestamp);
          this.addSystemEvent('event_host', 'New round started!');
          this.scoreSubmitted = false;
        }

        if (!this.state.roundOver) {
          const bossEvents = updateBossSchedule(this.state, timestamp);
          for (const evt of bossEvents) {
            if (evt.type === 'warning') {
              this.addSystemEvent('event_boss', `⚠ ${evt.bossName} approaches!`);
            } else if (evt.type === 'spawn') {
              this.addSystemEvent('event_boss', `👹 ${evt.bossName} has arrived!`);
            }
          }
        }
      }

    // Don't process gameplay input when round is over
    if (!this.chatting && (!this.state.roundOver || this.isDevTest)) {
      this.processInput(dt, timestamp);
    }    
    this.interpolateRemotePlayers(dt);
    this.interpolateEnemies(dt);

    const events = this.isLocalMode
      ? this.runLocalFrame(dt, timestamp)
      : this.runOnlineFrame(dt, timestamp);

    if (events.enemiesKilled.length > 0) { console.log('[SFX] enemyDeath'); playEnemyDeath(); }
    if (events.collectiblesGathered.length > 0) { console.log('[SFX] collect'); playCollect(); }
    if (events.playersHit.length > 0) { console.log('[SFX] damage'); playDamage(); }
    if (events.droppedPointsGathered.length > 0) {
      console.log('[SFX] droppedPointsPickup'); playDroppedPointsPickup();
      for (const dp of events.droppedPointsGathered) {
        this.addSystemEvent('event_points', `${dp.pickerName} picked up ${dp.value} points`);
      }
    }
    if (events.healthPickupsGathered.length > 0) {
      console.log('[SFX] healthPickup'); playHealthPickup();
      for (const hp of events.healthPickupsGathered) {
        this.addSystemEvent('event_health', `${hp.pickerName} picked up health`);
      }
    }
    if (events.powerUpsGathered.length > 0) {
      playPowerUpPickup();
      for (const pu of events.powerUpsGathered) {
        const label = pu.type.replace('_', ' ').toUpperCase();
        this.addSystemEvent('event_points', `${pu.pickerName} picked up ${label}`);
      }
    }
    if ((events.reloadCompletedPlayerIds ?? []).includes(this.localPlayerId)) {
      console.log('[SFX] reloadComplete');
      playReloadComplete();
    }
    for (const kill of events.playerKills) {
      this.addSystemEvent('event_kill', `${kill.killerName} killed ${kill.victimName}`);
    }

    // Detect boss shockwaves for sound
    for (const boss of this.state.bosses) {
      const prev = this.lastKnownBossShockwaves.get(boss.id) || 0;
      if (boss.lastShockwave > 0 && boss.lastShockwave !== prev) {
        this.lastKnownBossShockwaves.set(boss.id, boss.lastShockwave);
        playBossShockwave();
      }
    }

    const lp = this.state.players.get(this.localPlayerId);

    if (lp) {
      if (lp.health <= 0 && !this.wasDead) {
        this.wasDead = true;
        playGameOver();
      } else if (lp.health > 0) {
        this.wasDead = false;
      }
    } else {
      this.wasDead = false;
    }

    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
    }
    
    cleanupExpiredEntities(this.state, timestamp);

    if (!this.input.mouseDown) {
      this.devSpawnClickConsumed = false;
    }

    render(
      this.ctx,
      this.state,
      this.localPlayerId,
      this.canvas.width,
      this.canvas.height,
      timestamp,
      this.chatting,
      this.chatInput
    );

    this.previousMouseDown = this.input.mouseDown;
    this.animFrameId = requestAnimationFrame(this.loop);
  };

/**
 * Executa uma frame completa em modo solo.
 *
 * Em solo, o cliente também é autoridade local, por isso este método
 * corre a simulação completa do jogo e devolve os eventos produzidos
 * nessa atualização.
 */
private runLocalFrame(dt: number, timestamp: number): SimulationEvents {
  const emptyEvents: SimulationEvents = {
    enemiesKilled: [],
    collectiblesGathered: [],
    playersHit: [],
    droppedPointsGathered: [],
    healthPickupsGathered: [],
    powerUpsGathered: [],
    reloadCompletedPlayerIds: [],
    playerKills: [],
  };

  if (this.isSolo && this.state.roundOver) {
    return emptyEvents;
  }

  return updateGameState(
    this.state,
    this.localPlayerId,
    dt,
    timestamp,
    true,
    {
      disableAutoEnemySpawns: this.isDevTest,
      disableAutoHealthPickupSpawns: this.isDevTest,
      disableAutoPowerUpSpawns: this.isDevTest,
      disableAutoCollectibleRespawns: this.isDevTest,
    },
  );
}

/**
 * Executa a frame em modo online.
 *
 * Em online, a simulação autoritária corre no servidor, por isso este
 * método não altera a simulação do mundo e devolve apenas um conjunto
 * vazio de eventos locais.
 */
  private runOnlineFrame(_dt: number, _timestamp: number): SimulationEvents {
    return {
      enemiesKilled: [],
      collectiblesGathered: [],
      playersHit: [],
      droppedPointsGathered: [],
      healthPickupsGathered: [],
      powerUpsGathered: [],
      reloadCompletedPlayerIds: [],
      playerKills: [],
    };
  }

/**
 * Suaviza a posição visual dos inimigos com base na última posição alvo
 * recebida da rede.
 *
 * Serve para evitar movimentos bruscos causados por snapshots discretos.
 */
  private interpolateEnemies(dt: number) {
  for (const enemy of this.state.enemies) {
    if (!enemy.targetPos) continue;

    const factor = Math.min(1, dt * 12);

    enemy.pos.x += (enemy.targetPos.x - enemy.pos.x) * factor;
    enemy.pos.y += (enemy.targetPos.y - enemy.pos.y) * factor;
  }
}

/**
 * Envia os scores finais dos jogadores para o leaderboard.
 *
 * Só envia uma vez por ronda e ignora jogadores com score zero.
 */
  private submitScores() {
    if (this.scoreSubmitted) return;
    this.scoreSubmitted = true;
    this.state.players.forEach((player) => {
      if (player.score > 0) {
        submitScore(player.name, player.score).catch(console.error);
      }
    });
  }

/**
 * Aplica ao cliente os eventos autoritários recebidos do servidor.
 *
 * Trata efeitos visuais, sons e mensagens de sistema relacionados com:
 * - mortes de inimigos e bosses;
 * - dano em jogadores;
 * - recolha de pontos, vida e power-ups;
 * - conclusão de reload;
 * - kills entre jogadores.
 */
  private handleAuthoritativeGameEvents(events: SimulationEvents) {
    if (events.enemiesKilled.length > 0) {
      playEnemyDeath();

      const localNow = performance.now();

      for (const kill of events.enemiesKilled) {
        if (kill.kind === 'enemy') {
          spawnDeathParticles(
            this.state,
            { x: kill.x, y: kill.y },
            kill.type as any,
            localNow
          );
        } else if (kill.kind === 'boss') {
          // efeito próprio para boss
          this.state.explosions.push({
            pos: { x: kill.x, y: kill.y },
            radius: 120,
            createdAt: localNow,
          });
        }
      }
    }

  if (events.collectiblesGathered.length > 0) {
    playCollect();
  }

  if (events.playersHit.length > 0) {
    const localPlayerWasHit = events.playersHit.some(hit => hit.playerId === this.localPlayerId);
    if (localPlayerWasHit) {
      playDamage();
    }
  }

  if (events.droppedPointsGathered.length > 0) {
    const localPicked = events.droppedPointsGathered.some(dp => dp.pickerId === this.localPlayerId);
    if (localPicked) {
      playDroppedPointsPickup();
    }

    for (const dp of events.droppedPointsGathered) {
      this.addSystemEvent('event_points', `${dp.pickerName} picked up ${dp.value} points`);
    }
  }

  if (events.healthPickupsGathered.length > 0) {
    const localPicked = events.healthPickupsGathered.some(hp => hp.pickerId === this.localPlayerId);
    if (localPicked) {
      playHealthPickup();
    }

    for (const hp of events.healthPickupsGathered) {
      this.addSystemEvent('event_health', `${hp.pickerName} picked up health`);
    }
  }

  if (events.powerUpsGathered.length > 0) {
    const localPicked = events.powerUpsGathered.some(pu => pu.pickerId === this.localPlayerId);
    if (localPicked) {
      playPowerUpPickup();
    }

    for (const pu of events.powerUpsGathered) {
      const label = pu.type.replace('_', ' ').toUpperCase();
      this.addSystemEvent('event_points', `${pu.pickerName} picked up ${label}`);
    }
  }

  if ((events.reloadCompletedPlayerIds ?? []).includes(this.localPlayerId)) {
    playReloadComplete();
  }

  for (const kill of events.playerKills) {
    this.addSystemEvent('event_kill', `${kill.killerName} killed ${kill.victimName}`);
  }
}

/**
 * Aplica um snapshot autoritário do estado do jogo recebido do servidor.
 *
 * Atualiza:
 * - inimigos;
 * - projéteis;
 * - explosões;
 * - jogadores;
 * - bosses;
 * - estado da ronda e eventos de bosses.
 *
 * Também faz reconciliação do jogador local:
 * - corrige a posição para o estado autoritário;
 * - descarta inputs já processados pelo servidor;
 * - reaplica inputs pendentes para manter responsividade.
 */
  private handleGameStateReceived(gs: NetworkGameState) {
    if (gs.seq <= this.lastReceivedGameStateSeq) return;
    this.lastReceivedGameStateSeq = gs.seq;

    const existingProjectiles = new Map(this.state.projectiles.map(p => [p.id, p]));
    const hostProjectileIds = new Set(gs.projectiles.map(p => p.id));

    const existingEnemies = new Map(this.state.enemies.map(e => [e.id, e]));
    const nextEnemies = gs.enemies.map(e => {
      const existing = existingEnemies.get(e.id);

      if (existing) {
        existing.type = (e.type || 'normal') as any;
        existing.vel.x = e.vx;
        existing.vel.y = e.vy;
        existing.health = e.health ?? 1;
        existing.maxHealth = e.maxHealth ?? 1;
        existing.state = e.state as 'passive' | 'aggressive';

        existing.targetPos = { x: e.x, y: e.y };
        existing.lastNetworkUpdate = performance.now();

        return existing;
      }

      return {
        id: e.id,
        type: (e.type || 'normal') as any,
        pos: { x: e.x, y: e.y },
        vel: { x: e.vx, y: e.vy },
        health: e.health ?? 1,
        maxHealth: e.maxHealth ?? 1,
        state: e.state as 'passive' | 'aggressive',
        targetPlayerId: null,
        stateChangeTime: 0,
        targetPos: { x: e.x, y: e.y },
        lastNetworkUpdate: performance.now(),
      };
    });

    this.state.enemies = nextEnemies;

    const mergedProjectiles = gs.projectiles.map(np => {
      const existing = existingProjectiles.get(np.id);
      const trail = existing ? [...existing.trail] : [];

      trail.push({ x: np.x, y: np.y });
      if (trail.length > 8) trail.shift();

      return {
        id: np.id,
        pos: { x: np.x, y: np.y },
        vel: { x: np.vx, y: np.vy },
        ownerId: np.ownerId,
        createdAt: np.createdAt,
        trail,
      };
    });

    this.state.projectiles = mergedProjectiles;

    if (gs.explosions) {
      const localNow = performance.now();
      for (const exp of gs.explosions) {
        const already = this.state.explosions.some(e =>
          Math.abs(e.pos.x - exp.x) < 1 && Math.abs(e.pos.y - exp.y) < 1
        );
        if (!already) {
          this.state.explosions.push({ pos: { x: exp.x, y: exp.y }, radius: exp.radius, createdAt: localNow });
        }
      }
    }

    const snapshotPlayerIds = new Set(Object.keys(gs.players));

    for (const existingId of Array.from(this.state.players.keys())) {
      if (!snapshotPlayerIds.has(existingId)) {
        this.state.players.delete(existingId);
      }
    }

    for (const [pid, data] of Object.entries(gs.players)) {
      let p = this.state.players.get(pid);

      if (!p) {
        p = createPlayer(
          data.id,
          data.name,
          data.color || C.COLORS.otherPlayer,
          data.skin || 'circle'
        );
        this.state.players.set(pid, p);
      }

      const prevHealth = p.health;
      if (data.health < prevHealth) {
        p.invincibleUntil = performance.now() + C.PLAYER_INVINCIBLE_MS;
      }

      p.name = data.name;
      p.color = data.color || p.color;
      p.skin = data.skin || p.skin;

      if (pid === this.localPlayerId) {
        const dx = data.x - p.pos.x;
        const dy = data.y - p.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= LOCAL_RECONCILE_SNAP_DISTANCE) {
          p.pos.x = data.x;
          p.pos.y = data.y;
        } else if (dist >= LOCAL_RECONCILE_HARD_DISTANCE) {
          p.pos.x += dx * LOCAL_RECONCILE_HARD_LERP;
          p.pos.y += dy * LOCAL_RECONCILE_HARD_LERP;
        }

        p.aimAngle = data.aimAngle;
        this.inputBuffer.discardUpTo(data.lastProcessedInputSeq);
      } else {
        p.pos.x += (data.x - p.pos.x) * 0.5;
        p.pos.y += (data.y - p.pos.y) * 0.5;
        p.aimAngle = data.aimAngle;
      }

      p.health = data.health;
      p.score = data.score;
      p.ammo = data.ammo;
      if (data.reloadingUntil > 0) {
        const remainingReloadMs = Math.max(0, data.reloadingUntil - Date.now());
        p.reloadingUntil = performance.now() + remainingReloadMs;
      } else {
        p.reloadingUntil = 0;
      }
      p.activePowerUps = (data.activePowerUps || []).map(pu => ({
        type: pu.type as any,
        expiresAt: pu.expiresAt
      }));
    }

    this.state.roundStartTime = performance.now() - gs.roundElapsedMs;
    this.state.roundOver = gs.roundOver;
    this.state.restartCountdownStart = gs.restartCountdownStart;

    const existingBosses = new Map(this.state.bosses.map(b => [b.id, b]));
    const nextBosses = (gs.bosses || []).map(b => {
      const existing = existingBosses.get(b.id);

      if (existing) {
        existing.definitionId = b.definitionId;
        existing.name = b.name;
        existing.vel.x = b.vx;
        existing.vel.y = b.vy;
        existing.health = b.health;
        existing.maxHealth = b.maxHealth;
        existing.size = b.size;
        existing.speed = b.speed;
        existing.damage = b.damage;
        existing.detectRange = b.detectRange;
        existing.killScore = b.killScore;
        existing.color = b.color;
        existing.glowColor = b.glowColor;
        existing.targetPlayerId = b.targetPlayerId;
        existing.lastShockwave = b.lastShockwave || 0;

        existing.pos.x += (b.x - existing.pos.x) * 0.35;
        existing.pos.y += (b.y - existing.pos.y) * 0.35;

        return existing;
      }

      return {
        id: b.id,
        definitionId: b.definitionId,
        name: b.name,
        pos: { x: b.x, y: b.y },
        vel: { x: b.vx, y: b.vy },
        health: b.health,
        maxHealth: b.maxHealth,
        size: b.size,
        speed: b.speed,
        damage: b.damage,
        detectRange: b.detectRange,
        killScore: b.killScore,
        color: b.color,
        glowColor: b.glowColor,
        targetPlayerId: b.targetPlayerId,
        lastShockwave: b.lastShockwave || 0,
      };
    });

    this.state.bosses = nextBosses;

    this.state.bossSpawnEvents = (gs.bossSpawnEvents || []).map(e => ({ ...e }));
    this.state.bossDefeatEvents = (gs.bossDefeatEvents || []).map(e => ({ ...e }));
    this.state.bossScheduleTriggered = new Set(gs.bossScheduleTriggered || []);
  }

/**
 * Processa o input do jogador local no frame atual.
 *
 * Responsabilidades:
 * - tratar respawn;
 * - calcular direção de movimento;
 * - calcular mira;
 * - guardar input no buffer de reconciliação;
 * - enviar input ao servidor em online;
 * - tratar movimento e dash;
 * - tratar disparo;
 * - tratar reload manual.
 */
  private processInput(dt: number, now: number) {
    const player = this.state.players.get(this.localPlayerId);
    if (!player) return;

    if (this.handleRespawnInput(player, now)) {
      return;
    }

    if (this.handleDevSpawnClick(player, now)) {
      this.previousMouseDown = this.input.mouseDown;
      return;
    }

 
    let vx = 0, vy = 0;
    if (isControlPressed(this.input, 'move_up')) vy -= 1;
    if (isControlPressed(this.input, 'move_down')) vy += 1;
    if (isControlPressed(this.input, 'move_left')) vx -= 1;
    if (isControlPressed(this.input, 'move_right')) vx += 1;
    const moveDir = { x: vx, y: vy };

    const camX = player.pos.x - this.canvas.width / 2;
    const camY = player.pos.y - this.canvas.height / 2;
    const worldMouseX = this.input.mouseX + camX;
    const worldMouseY = this.input.mouseY + camY;
    const nextAimAngle = Math.atan2(worldMouseY - player.pos.y, worldMouseX - player.pos.x);
    player.aimAngle = Number.isFinite(nextAimAngle) ? nextAimAngle : 0;

    this.inputBuffer.push({
      time: now,
      moveDir,
      aimAngle: player.aimAngle,
      shoot: isControlPressed(this.input, 'shoot'),
      dash: isControlPressed(this.input, 'dash'),
      reload: isControlPressed(this.input, 'reload'),
    });

    if (!this.isLocalMode) {
      this.sendOnlineInput(now, moveDir, player.aimAngle);
    }

    this.handleMovementInput(player, moveDir, dt, now);

    this.handleShootInput(player, now);

    this.handleReloadInput(player, now);
  }

/**
 * Trata um pedido de respawn em modo solo.
 *
 * Em solo, o cliente tem autoridade local e pode executar o respawn
 * diretamente no estado do jogo.
 */
  private handleRespawnRequest(playerId: string) {
    if (!this.isLocalMode) return;
    const success = respawnPlayer(this.state, playerId, performance.now());
    if (success) {
      const player = this.state.players.get(playerId);
      if (player) {
        this.addSystemEvent('event_respawn', `${player.name} respawned`);
      }
    }
  }

/**
 * Suaviza a posição visual dos jogadores remotos.
 *
 * Ignora o jogador local e aplica interpolação apenas aos jogadores
 * controlados por outros clientes.
 */
  private interpolateRemotePlayers(dt: number) {
    for (const [id, player] of this.state.players) {
      if (id === this.localPlayerId) continue;
      if (!player.targetPos) continue;
      interpolateRemotePlayer(player, dt, 15);
    }
  }

/**
 * Handler de teclado usado pelo sistema de chat.
 *
 * Permite:
 * - abrir o chat com Enter;
 * - cancelar com Escape;
 * - enviar mensagem com Enter;
 * - apagar com Backspace;
 * - escrever caracteres válidos no input de chat.
 */
  private onChatKeyDown = (e: KeyboardEvent) => {
    if (!this.running) return;

    if (e.key === 'Escape' && !this.chatting && this.isDevTest && this.devSelectedOptionId) {
      e.preventDefault();
      this.clearDevSpawnSelection();
      return;
    }

    if (e.key === 'Enter' && !this.chatting) {
      e.preventDefault();
      this.chatting = true;
      this.chatInput = '';

      this.input.keys.clear();
      this.input.mouseDown = false;

      const player = this.state.players.get(this.localPlayerId);
      if (player) {
        player.vel.x = 0;
        player.vel.y = 0;
      }

      return;
    }

    if (!this.chatting) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      this.chatting = false;
      this.chatInput = '';
      this.input.keys.clear();
      return;
    }

    if (e.key === 'Enter') {
      if (this.chatInput.trim().length > 0) {
        const lp = this.state.players.get(this.localPlayerId);
        const name = lp?.name || this.localPlayerId;
        const text = this.chatInput.trim().slice(0, C.CHAT_MAX_LENGTH);
        this.addChatMessage(this.localPlayerId, name, text);
      }
      this.chatting = false;
      this.chatInput = '';
      this.input.keys.clear();
      return;
    }

    if (e.key === 'Backspace') {
      this.chatInput = this.chatInput.slice(0, -1);
      return;
    }

    if (e.key.length === 1 && this.chatInput.length < C.CHAT_MAX_LENGTH) {
      this.chatInput += e.key;
    }
  };

/**
 * Adiciona uma mensagem ao histórico local de chat.
 *
 * Mantém um número máximo de mensagens armazenadas para evitar
 * crescimento indefinido da lista.
 */
  private addChatMessage(senderId: string, senderName: string, text: string, type: ChatMessageType = 'chat') {
    const msg: ChatMessage = {
      id: `chat_${this.chatNextId++}`,
      senderId,
      senderName,
      text,
      timestamp: performance.now(),
      type,
    };
    this.state.chatMessages.push(msg);
    if (this.state.chatMessages.length > C.CHAT_MAX_VISIBLE * 2) {
      this.state.chatMessages = this.state.chatMessages.slice(-C.CHAT_MAX_VISIBLE * 2);
    }
  }

/**
 * Adiciona ao chat uma mensagem de sistema.
 *
 * É usado para eventos do jogo como kills, respawns, bosses,
 * recolhas e mudanças de estado relevantes para o jogador.
 */
  private addSystemEvent(type: ChatMessageType, text: string) {
    this.addChatMessage('system', 'SYSTEM', text, type);
  }

/**
 * Indica se o jogador está atualmente a escrever no chat.
 */
  get isChatting(): boolean {
    return this.chatting;
  }

  /**
 * Devolve o conteúdo atual da caixa de input do chat.
 */
  get currentChatInput(): string {
    return this.chatInput;
  }

/**
 * Devolve a referência ao jogador local no estado atual do jogo.
 */
  getLocalPlayer(): Player | undefined {
    return this.state.players.get(this.localPlayerId);
  }

  /**
 * Trata o input de respawn do jogador local.
 *
 * Se o jogador estiver morto:
 * - em solo, executa o respawn localmente;
 * - em online, envia o pedido de respawn ao servidor.
 *
 * Devolve true se o jogador está morto e o processamento de input
 * normal deve parar neste frame.
 */
  private handleRespawnInput(player: Player, now: number): boolean {
  if (player.health > 0) return false;

  if (
    isControlPressed(this.input, 'respawn') &&
    now - this.lastRespawnRequestAt > C.RESPAWN_REQUEST_COOLDOWN_MS
  ) {
    this.lastRespawnRequestAt = now;

    if (this.isLocalMode) {
        this.handleRespawnRequest(this.localPlayerId);
      } else {
        this.socket?.send({
          type: "client:respawn",
        });
      }
  }

  return true;
}

/**
 * Envia ao servidor o input atual do jogador local.
 *
 * Inclui:
 * - sequência do input;
 * - direção de movimento;
 * - ângulo de mira;
 * - timestamp do cliente.
 *
 * É usado para simulação autoritária e reconciliação no online.
 */
  private sendOnlineInput(now: number, moveDir: Vec2, aimAngle: number): void {
    if (!this.socket) return;

    this.socket.send({
      type: "client:input",
      seq: this.inputBuffer.currentSeq - 1,
      moveDir,
      aimAngle: Number.isFinite(aimAngle) ? aimAngle : 0,
      clientTime: now,
    });
  }

/**
 * Trata o movimento e dash do jogador local.
 *
 * Em solo:
 * - calcula a velocidade real localmente;
 * - inicia o dash diretamente.
 *
 * Em online:
 * - aplica prediction local do movimento;
 * - envia pedido de dash ao servidor quando aplicável.
 */
  private handleMovementInput(
  player: Player,
  moveDir: Vec2,
  dt: number,
  now: number,
): void {
  if (this.isLocalMode) {
    const hasSpeed = playerHasPowerUp(player, 'speed', now);
    const vel = computeMovementVelocity(moveDir, player.score, hasSpeed);
    player.vel.x = vel.x;
    player.vel.y = vel.y;

    if (isControlPressed(this.input, 'dash')) {
      if (initiateDash(player, player.aimAngle, moveDir, now)) {
        playDash();
      }
    }

    return;
  }

  // NO prediction for now (debug phase)
  this.localPredictionAccumulator += dt;

  while (this.localPredictionAccumulator >= LOCAL_PREDICTION_STEP) {
    predictMovement(player, moveDir, LOCAL_PREDICTION_STEP, now);
    this.localPredictionAccumulator -= LOCAL_PREDICTION_STEP;
  }

  if (isControlPressed(this.input, 'dash')) {
    const canDash = !player.isDashing && now - player.lastDash > C.DASH_COOLDOWN_MS;

    if (canDash) {
      this.socket?.send({
        type: "client:dash",
        aimAngle: player.aimAngle,
      });

      if (initiateDash(player, player.aimAngle, moveDir, now)) {
        playDash();
      }
    }
  }
}

/**
 * Trata o disparo do jogador local.
 *
 * Responsabilidades:
 * - verificar cooldown e condições de disparo;
 * - concluir reload pendente se aplicável;
 * - gastar munição;
 * - criar projétil local em solo;
 * - enviar intenção de disparo ao servidor em online;
 * - tocar som de disparo;
 * - iniciar reload automático quando o carregador esvazia.
 */
private handleShootInput(player: Player, now: number): void {
  if (this.devSpawnClickConsumed) {
    return;
  }

  let shootCooldown = getShootCooldown(player.score);
  if (playerHasPowerUp(player, 'rapid_fire', now)) {
    shootCooldown *= C.POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER;
  }

  const reloadTime = getReloadTime(player.score);
  const magSize = getMagazineSize(player.score);
  const canShoot =
    player.ammo > 0 &&
    (player.reloadingUntil === 0 || now >= player.reloadingUntil);

  if (!isControlPressed(this.input, 'shoot') || now - player.lastShot <= shootCooldown || !canShoot) {
    return;
  }

  if (player.reloadingUntil > 0 && now >= player.reloadingUntil) {
    player.ammo = magSize;
    player.reloadingUntil = 0;
    playReloadComplete();
  }

  player.lastShot = now;
  player.ammo--;

  if (this.isLocalMode) {
    const proj = createProjectile(player, player.aimAngle, now);
    this.state.projectiles.push(proj);
  } else {
    this.socket?.send({
      type: "client:shoot",
      aimAngle: player.aimAngle,
    });
  }

  playShoot();

  if (player.ammo <= 0) {
    player.reloadingUntil = now + reloadTime;
  }
}

/**
 * Trata o reload manual do jogador local.
 *
 * Em solo:
 * - inicia o reload diretamente no estado local.
 *
 * Em online:
 * - envia ao servidor o pedido de reload.
 */
private handleReloadInput(player: Player, now: number): void {
  if (
    !isControlPressed(this.input, 'reload') ||
    player.health <= 0 ||
    player.ammo >= getMagazineSize(player.score) ||
    player.reloadingUntil !== 0
  ) {
    return;
  }

  const reloadTime = getReloadTime(player.score);

  if (this.isLocalMode) {
    player.reloadingUntil = now + reloadTime;
  } else {
    this.socket?.send({
      type: "client:reload",
    });
  }
}

setDevSpawnSelection(
  category: DevSpawnCategory,
  optionId: DevSpawnOptionId | null,
): void {
  this.devSelectedCategory = category;
  this.devSelectedOptionId = optionId;
}

clearDevWorld(): void {
  if (!this.isDevTest) return;
  clearDevSpawnedEntities(this.state);
}

getDevSelectedOptionId(): DevSpawnOptionId | null {
  return this.devSelectedOptionId;
}

private getMouseWorldPosition(player: Player): Vec2 {
  const camX = player.pos.x - this.canvas.width / 2;
  const camY = player.pos.y - this.canvas.height / 2;

  return {
    x: this.input.mouseX + camX,
    y: this.input.mouseY + camY,
  };
}

private handleDevSpawnClick(player: Player, now: number): boolean {
  if (!this.isDevTest) return false;
  if (!this.devSelectedOptionId) return false;

  const justPressed = this.input.mouseDown && !this.previousMouseDown;
  if (!justPressed) return false;

  const worldPos = this.getMouseWorldPosition(player);

  spawnDevEntity(this.state, this.devSelectedOptionId, worldPos, now);
  this.devSpawnClickConsumed = true;

  return true;
}

/**
 * Indica se o motor está a correr em modo solo.
 *
 * É usado para distinguir autoridade local de simulação
 * face ao modo online com servidor autoritário.
 */
private get isSolo(): boolean {
  return this.gameMode === "solo";
}

private get isDevTest(): boolean {
  return this.gameMode === "dev_test";
}

private get isLocalMode(): boolean {
  return this.gameMode === "solo" || this.gameMode === "dev_test";
}

clearDevSpawnSelection(): void {
  if (!this.isDevTest) return;

  this.devSelectedOptionId = null;
}

}
