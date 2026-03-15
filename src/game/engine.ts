import { GameState, InputState, Player, PlayerSkin, NetworkPlayerState, NetworkGameState, ChatMessage, ChatMessageType, SimulationEvents } from './types';
import { createPlayer, createEnemy, createCollectible, createProjectile, createPowerUpItem, createBoss, updateGameState, playerHasPowerUp, applyPlayerMovement, initiateDash, computeMovementVelocity,spawnDeathParticles, } from './simulation';
import { render } from './renderer';
import { MultiplayerManager } from './multiplayer';
import { playShoot, playEnemyDeath, playCollect, playDamage, playGameOver, playDash, playHealthPickup, playReloadComplete, playDroppedPointsPickup, playChatNotification, playPowerUpPickup, playBossShockwave } from './audio';
import { music } from './music';
import * as C from './constants';
import { getShootCooldown, getReloadTime, getMagazineSize } from '../shared/scaling';
import { buildNetworkGameState, buildPlayerNetworkState } from '../shared/protocol';
import { updateBossSchedule, checkRoundTimer, resetRound, respawnPlayer, findSafeRespawnPosition, cleanupExpiredEntities, createGameState } from '../server-ready/room-state';
import { submitScore } from '../lib/leaderboard';
// Prediction modules
import { InputBuffer } from '../client/prediction/input-buffer';
import { predictMovement } from '../client/prediction/movement-prediction';
import { predictDash } from '../client/prediction/dash-prediction';
import { interpolateRemotePlayer, setRemotePlayerTarget } from '../client/prediction/interpolation';
import { GameSocket } from '../client/network/game-socket';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "ws://localhost:3001";


export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private input: InputState;
  private localPlayerId: string;
  private multiplayer: MultiplayerManager | null = null;
  private running = false;
  private lastTime = 0;
  private animFrameId = 0;
  
  private wasDead = false;
  private isHost = false;
  private hostStateSeq = 0;
  private lastReceivedGameStateSeq = -1;
  
  private chatting = false;
  private chatInput = '';
  private chatNextId = 0;
  private lastRespawnRequestAt = 0;
  private scoreSubmitted = false;
  private lastKnownBossShockwaves = new Map<string, number>();
  private gameMode: "solo" | "online";
  private inputBuffer = new InputBuffer();
  private socket: GameSocket | null = null;
  private pingIntervalId: number | null = null;

  constructor(
  canvas: HTMLCanvasElement,
  input: InputState,
  playerId: string,
  playerName: string,
  roomId: string,
  playerColor: string,
  playerSkin: PlayerSkin,
  gameMode: "solo" | "online"
) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d')!;
  this.input = input;
  this.localPlayerId = playerId;
  this.gameMode = gameMode;

  console.log("[engine] gameMode =", this.gameMode);

  // criar estado primeiro
  this.state = createGameState(roomId, performance.now());

  if (this.gameMode === "solo") {
    this.state.players.set(playerId, createPlayer(playerId, playerName, playerColor, playerSkin));
  }

  if (this.gameMode === "online") {
    console.log("[engine] creating GameSocket");

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

    this.socket.onMessage((msg) => {
      // console.log("[engine] socket message", msg);

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

      if (msg.type === "server:snapshot") {
        // console.log("[engine] snapshot players =", msg.state.players);
        
        /*
        console.log(
          "[engine] snapshot local player raw =",
          this.localPlayerId,
          msg.state.players[this.localPlayerId]
        );
        */

        this.handleGameStateReceived(msg.state);
      }
    });
  } else {
    // modo solo = host local, sem rede
    this.isHost = true;
    this.state.hostId = playerId;
  }
}

  async start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    music.play('game');
    this.loop(this.lastTime);
    document.addEventListener('keydown', this.onChatKeyDown);
  }

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
    this.socket?.disconnect();
    music.play('menu');
  }


  private handleHostChanged(host: boolean, hostId: string) {
    this.isHost = host;
    this.state.hostId = hostId;
    if (host) this.hostStateSeq = 0;
    else this.lastReceivedGameStateSeq = -1;
    const hostPlayer = this.state.players.get(hostId);
    const hostName = hostPlayer?.name || hostId;
    this.addSystemEvent('event_host', `${hostName} is now the host`);
    console.log(`[GameEngine] Host status: ${host ? 'HOST' : 'CLIENT'}`);
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    // Round timer logic (host-only decisions)
    if (this.isHost) {
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

      // Boss schedule logic
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
    if (!this.chatting && !this.state.roundOver) this.processInput(dt, timestamp);
    this.interpolateRemotePlayers(dt);
    this.interpolateEnemies(dt);

    let events = {
      enemiesKilled: [],
      collectiblesGathered: [],
      playersHit: [],
      droppedPointsGathered: [],
      healthPickupsGathered: [],
      powerUpsGathered: [],
      reloadCompletedPlayerIds: [],
      playerKills: []
    };

    if (this.gameMode === "solo") {
      events = this.state.roundOver
        ? events
        : updateGameState(this.state, this.localPlayerId, dt, timestamp, this.isHost);
    }
    // o chat pediu para comentar isto (?)
    // if (!this.isHost) this.extrapolateEntities(dt);

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

    // Cleanup expired visual entities
    cleanupExpiredEntities(this.state, timestamp);

    /*
    console.log(
      "[engine] local state players before render =",
      Array.from(this.state.players.entries()).map(([id, p]) => ({
        id,
        name: p.name,
        x: p.pos.x,
        y: p.pos.y,
        health: p.health,
      }))
    );
    */
    render(this.ctx, this.state, this.localPlayerId, this.canvas.width, this.canvas.height, timestamp, this.chatting, this.chatInput);

    /*
    // O chat pediu para comentar isto (?)
    this.multiplayer?.broadcastState(buildPlayerNetworkState(lp), timestamp);
    if (this.isHost) this.broadcastGameState(timestamp);
    */

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private interpolateEnemies(dt: number) {
  for (const enemy of this.state.enemies) {
    if (!enemy.targetPos) continue;

    const factor = Math.min(1, dt * 12);

    enemy.pos.x += (enemy.targetPos.x - enemy.pos.x) * factor;
    enemy.pos.y += (enemy.targetPos.y - enemy.pos.y) * factor;
  }
}

  private submitScores() {
    if (this.scoreSubmitted) return;
    this.scoreSubmitted = true;
    this.state.players.forEach((player) => {
      if (player.score > 0) {
        submitScore(player.name, player.score).catch(console.error);
      }
    });
  }

  private extrapolateEntities(dt: number) {
    for (const enemy of this.state.enemies) {
      enemy.pos.x += enemy.vel.x * dt;
      enemy.pos.y += enemy.vel.y * dt;

      enemy.pos.x += enemy.vel.x * dt;
      enemy.pos.y += enemy.vel.y * dt;
      if (enemy.pos.x < 0 || enemy.pos.x > C.WORLD_WIDTH) {
        enemy.vel.x *= -1;
        enemy.pos.x = Math.max(0, Math.min(C.WORLD_WIDTH, enemy.pos.x));
      }
      if (enemy.pos.y < 0 || enemy.pos.y > C.WORLD_HEIGHT) {
        enemy.vel.y *= -1;
        enemy.pos.y = Math.max(0, Math.min(C.WORLD_HEIGHT, enemy.pos.y));
      }
    }
    for (const boss of this.state.bosses) {
      if (boss.targetPlayerId) {
        const target = this.state.players.get(boss.targetPlayerId);
        if (target && target.health > 0) {
          const dx = target.pos.x - boss.pos.x;
          const dy = target.pos.y - boss.pos.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 1) {
            boss.vel.x = (dx / len) * boss.speed;
            boss.vel.y = (dy / len) * boss.speed;
          }
        }
      }
      boss.pos.x += boss.vel.x * dt;
      boss.pos.y += boss.vel.y * dt;
      boss.pos.x = Math.max(boss.size / 2, Math.min(C.WORLD_WIDTH - boss.size / 2, boss.pos.x));
      boss.pos.y = Math.max(boss.size / 2, Math.min(C.WORLD_HEIGHT - boss.size / 2, boss.pos.y));
    }
    for (const proj of this.state.projectiles) {
      proj.trail.push({ x: proj.pos.x, y: proj.pos.y });
      if (proj.trail.length > 8) proj.trail.shift();
      proj.pos.x += proj.vel.x * dt;
      proj.pos.y += proj.vel.y * dt;
    }
  }

  // Nao usado | NAO USAR
  private broadcastGameState(now: number) {
    const gs = buildNetworkGameState(this.state, ++this.hostStateSeq, now);
    this.multiplayer?.broadcastGameState(gs, now);
  }

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

          // se quiseres, também podes criar várias explosões ou partículas especiais
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

        // suavizar posição em vez de dar snap direto
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
        // 1. corrigir para estado autoritário do servidor
        p.pos.x = data.x;
        p.pos.y = data.y;
        p.aimAngle = data.aimAngle;

        // 2. descartar inputs já processados pelo servidor
        this.inputBuffer.discardUpTo(data.lastProcessedInputSeq);

        // 3. reaplicar inputs pendentes
        const pendingInputs = this.inputBuffer.getAfter(data.lastProcessedInputSeq);
        for (const input of pendingInputs) {
          predictMovement(p, input.moveDir, 1 / 60, input.time);
          p.aimAngle = input.aimAngle;
        }
      } else {
        p.pos.x = data.x;
        p.pos.y = data.y;
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

  private processInput(dt: number, now: number) {
    const player = this.state.players.get(this.localPlayerId);
    if (!player) return;

    // Respawn (host-authoritative)
    if (player.health <= 0) {
      if (
        this.input.keys.has('f') &&
        now - this.lastRespawnRequestAt > C.RESPAWN_REQUEST_COOLDOWN_MS
      ) {
        this.lastRespawnRequestAt = now;

        if (this.gameMode === "solo") {
          this.handleRespawnRequest(this.localPlayerId);
        } else {
          this.socket?.send({
            type: "client:respawn",
          });
        }
      }
      return;
    }

    // Build move direction from keys
    let vx = 0, vy = 0;
    if (this.input.keys.has('w') || this.input.keys.has('arrowup')) vy -= 1;
    if (this.input.keys.has('s') || this.input.keys.has('arrowdown')) vy += 1;
    if (this.input.keys.has('a') || this.input.keys.has('arrowleft')) vx -= 1;
    if (this.input.keys.has('d') || this.input.keys.has('arrowright')) vx += 1;
    const moveDir = { x: vx, y: vy };

    // Aim
    const camX = player.pos.x - this.canvas.width / 2;
    const camY = player.pos.y - this.canvas.height / 2;
    const worldMouseX = this.input.mouseX + camX;
    const worldMouseY = this.input.mouseY + camY;
    const nextAimAngle = Math.atan2(worldMouseY - player.pos.y, worldMouseX - player.pos.x);
    player.aimAngle = Number.isFinite(nextAimAngle) ? nextAimAngle : 0;

    // Record input into buffer (for future reconciliation)
    this.inputBuffer.push({
      time: now,
      moveDir,
      aimAngle: player.aimAngle,
      shoot: this.input.mouseDown,
      dash: this.input.keys.has(' '),
      reload: this.input.keys.has('r'),
    });

    if (this.gameMode === "online") {
      this.socket?.send({
        type: "client:input",
        seq: this.inputBuffer.currentSeq - 1,
        moveDir,
        aimAngle: Number.isFinite(player.aimAngle) ? player.aimAngle : 0,
        clientTime: now,
      });
    }

    // Movement / dash
    if (this.gameMode === "solo") {
      const hasSpeed = playerHasPowerUp(player, 'speed', now);
      const vel = computeMovementVelocity(moveDir, player.score, hasSpeed);
      player.vel.x = vel.x;
      player.vel.y = vel.y;

      if (this.input.keys.has(' ')) {
        if (initiateDash(player, player.aimAngle, moveDir, now)) {
          playDash();
        }
      }
    } else {
      predictMovement(player, moveDir, dt, now);

      if (this.input.keys.has(' ')) {
        const canDash = !player.isDashing && now - player.lastDash > C.DASH_COOLDOWN_MS;

        if (canDash) {
          this.socket?.send({
            type: "client:dash",
            aimAngle: player.aimAngle,
          });

          playDash();
          player.lastDash = now;
        }
      }
    }

    // Shoot
    let shootCooldown = getShootCooldown(player.score);
    if (playerHasPowerUp(player, 'rapid_fire', now)) shootCooldown *= C.POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER;
    const reloadTime = getReloadTime(player.score);
    const magSize = getMagazineSize(player.score);
    const canShoot = player.ammo > 0 && (player.reloadingUntil === 0 || now >= player.reloadingUntil);
    if (this.input.mouseDown && now - player.lastShot > shootCooldown && canShoot) {
      if (player.reloadingUntil > 0 && now >= player.reloadingUntil) {
        player.ammo = magSize;
        player.reloadingUntil = 0;
        playReloadComplete();
      }
      player.lastShot = now;
      player.ammo--;

      // --- Local visual projectile prediction ---
      // Create a predicted projectile for immediate visual feedback.
      // This is NOT authoritative — the host/server creates the real projectile.
      if (this.gameMode === "solo") {
        const proj = createProjectile(player, player.aimAngle, now);
        this.state.projectiles.push(proj);
      } else {
        this.socket?.send({
          type: "client:shoot",
          aimAngle: player.aimAngle,
        });
      }

      // --- Shoot intent (protocol-aligned) ---
      // Send only the aim angle — no projectile ID or spawn position.
      // The host/server is responsible for creating the authoritative projectile.
      
      // Chat tambem disse para comentar isto (?)
      // this.multiplayer?.broadcastShoot(player.aimAngle);
      playShoot();

      if (player.ammo <= 0) {
        player.reloadingUntil = now + reloadTime;
      }
    }

    // Manual reload with R
    if (
      this.input.keys.has('r') &&
      player.health > 0 &&
      player.ammo < getMagazineSize(player.score) &&
      player.reloadingUntil === 0
    ) {
      if (this.gameMode === "solo") {
        player.reloadingUntil = now + reloadTime;
      } else {
        this.socket?.send({
          type: "client:reload",
        });
      }
    }
  }

  private handleRemotePlayerUpdate(s: NetworkPlayerState) {
    let p = this.state.players.get(s.id);
    const isNew = !p;
    if (!p) {
      p = createPlayer(s.id, s.name, s.color || C.COLORS.otherPlayer, s.skin || 'circle');
      p.pos.x = s.x;
      p.pos.y = s.y;
      p.aimAngle = s.aimAngle;
      this.state.players.set(s.id, p);
    }
    if (isNew) {
      this.addSystemEvent('event_join', `${s.name} joined the game`);
    }
    p.name = s.name;
    p.color = s.color || p.color;
    p.skin = s.skin || p.skin;
    // Use prediction module's interpolation target setter
    setRemotePlayerTarget(p, { x: s.x, y: s.y }, s.aimAngle, performance.now());
  }

  private handleRespawnRequest(playerId: string) {
    if (!this.isHost) return;
    const success = respawnPlayer(this.state, playerId, performance.now());
    if (success) {
      const player = this.state.players.get(playerId);
      if (player) {
        this.addSystemEvent('event_respawn', `${player.name} respawned`);
      }
    }
  }

  private interpolateRemotePlayers(dt: number) {
    for (const [id, player] of this.state.players) {
      if (id === this.localPlayerId) continue;
      if (!player.targetPos) continue;
      interpolateRemotePlayer(player, dt, 15);
    }
  }

  // ===== Chat =====

  private onChatKeyDown = (e: KeyboardEvent) => {
    if (!this.running) return;

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

        // Chat tambem disse para comentar isto (?)
        // this.multiplayer?.broadcastChat(name, text);
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

  private addSystemEvent(type: ChatMessageType, text: string) {
    this.addChatMessage('system', 'SYSTEM', text, type);
  }

  get isChatting(): boolean {
    return this.chatting;
  }

  get currentChatInput(): string {
    return this.chatInput;
  }

  getLocalPlayer(): Player | undefined {
    return this.state.players.get(this.localPlayerId);
  }
}
