import { WebSocketServer, WebSocket } from 'ws';
import { createGameState } from '../src/server-ready/room-state';
import { stepAuthoritative } from '../src/server-ready/simulation-step';
import { applyClientMessage } from '../src/server-ready/input-handler';
import { buildNetworkGameState } from '../src/shared/protocol';
import type { ClientMessage } from '../src/shared/protocol/messages';

const PORT = Number(process.env.PORT) || 3001;
const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
let tickCount = 0;

type ClientConnection = {
  id: string;
  ws: WebSocket;
  roomId: string | null;
};

type Room = {
  id: string;
  state: ReturnType<typeof createGameState>;
  clients: Map<string, ClientConnection>;
  stateSeq: number;
};

const clients = new Map<string, ClientConnection>();
const rooms = new Map<string, Room>();

function makeClientId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

function safeSend(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);

  if (!room) {
    room = {
      id: roomId,
      state: createGameState(roomId, Date.now()),
      clients: new Map(),
      stateSeq: 0,
    };
    rooms.set(roomId, room);
    console.log(`[server] room created: ${roomId}`);
  }

  return room;
}

function buildRoomList() {
  return Array.from(rooms.values()).map((room) => ({
    roomId: room.id,
    playerCount: room.clients.size,
  }));
}

function broadcastSnapshot(room: Room, now: number) {
  const snapshot = {
    type: 'server:snapshot' as const,
    state: buildNetworkGameState(room.state, ++room.stateSeq, now),
    serverTime: now,
  };

  if (room.stateSeq % 600 === 0) {
    console.log(
      `[server] snapshot players JSON (${room.id}) =`,
      JSON.stringify(snapshot.state.players, null, 2)
    );
  }

  for (const [, client] of room.clients) {
    safeSend(client.ws, snapshot);
  }
}

function broadcastGameEvents(room: Room, events: import('../src/shared/types').SimulationEvents, now: number) {
  const hasEvents =
    events.enemiesKilled.length > 0 ||
    events.collectiblesGathered.length > 0 ||
    events.playersHit.length > 0 ||
    events.droppedPointsGathered.length > 0 ||
    events.healthPickupsGathered.length > 0 ||
    events.powerUpsGathered.length > 0 ||
    events.reloadCompletedPlayerIds.length > 0 ||
    events.playerKills.length > 0;

  if (!hasEvents) return;

  const message = {
    type: 'server:game_events' as const,
    events,
    serverTime: now,
  };

  for (const [, client] of room.clients) {
    safeSend(client.ws, message);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  const clientId = makeClientId();
  clients.set(clientId, { id: clientId, ws, roomId: null });

  console.log(`[server] client connected: ${clientId}`);

  safeSend(ws, {
    type: 'server:room_state',
    hostId: 'server',
    playerIds: [],
    roomName: '',
    yourPlayerId: clientId
  });

  ws.on('message', (raw) => {
  try {
    const message = JSON.parse(raw.toString()) as ClientMessage;
    const client = clients.get(clientId);

    console.log('[server] message from', clientId, message.type, message);

    if (!client) return;

    if (message.type === 'client:list_rooms') {
      safeSend(ws, {
        type: 'server:room_list',
        rooms: buildRoomList(),
      });
      return;
  }

    // JOIN: define a sala do cliente e cria a room se necessário
    if (message.type === 'client:join') {
      const room = getOrCreateRoom(message.roomId);

      client.roomId = message.roomId;
      room.clients.set(clientId, client);

      const handled = applyClientMessage(room.state, clientId, message, Date.now());

      if (!handled) {
        console.warn('[server] unhandled join:', clientId, message.type);
      }

      safeSend(ws, {
        type: 'server:room_state',
        hostId: 'server',
        playerIds: Array.from(room.state.players.keys()),
        roomName: room.state.roomName,
        yourPlayerId: clientId,
      });

      broadcastSnapshot(room, Date.now());
      return;
    }

    // Para qualquer outra mensagem, o cliente já tem de estar numa sala
    if (!client.roomId) {
      console.warn('[server] client has no room yet:', clientId, message.type);
      return;
    }

    const room = rooms.get(client.roomId);
    if (!room) {
      console.warn('[server] room not found for client:', clientId, client.roomId);
      return;
    }

    const handled = applyClientMessage(room.state, clientId, message, Date.now());

    if (!handled) {
      console.warn('[server] unhandled message:', clientId, message.type);
    }

    if (message.type === 'client:chat') {
      for (const [, roomClient] of room.clients) {
        safeSend(roomClient.ws, {
          type: 'server:chat',
          senderId: clientId,
          senderName: room.state.players.get(clientId)?.name ?? clientId,
          text: message.text,
          timestamp: Date.now(),
        });
      }
    }

    broadcastSnapshot(room, Date.now());

  } catch (error) {
    console.error('[server] failed to parse message', error);
  }
  });

    ws.on('close', () => {
    console.log(`[server] client disconnected: ${clientId}`);

    const client = clients.get(clientId);

    if (client?.roomId) {
      const room = rooms.get(client.roomId);

      if (room) {
        room.clients.delete(clientId);
        applyClientMessage(room.state, clientId, { type: 'client:leave' }, Date.now());

        if (room.clients.size === 0) {
          rooms.delete(room.id);
          console.log(`[server] room deleted: ${room.id}`);
        } else {
          broadcastSnapshot(room, Date.now());
        }
      }
    }

    clients.delete(clientId);
  });
});

setInterval(() => {
  const now = Date.now();

  for (const [, room] of rooms) {
    const step = stepAuthoritative(room.state, 1 / TICK_RATE, now);
    broadcastGameEvents(room, step.simulation, now);
    broadcastSnapshot(room, now);
  }

  tickCount++;
  if (tickCount % 600 === 0) {
    for (const [, room] of rooms) {
      console.log('[server] tick summary', {
        roomId: room.id,
        players: room.state.players.size,
        enemies: room.state.enemies.length,
        projectiles: room.state.projectiles.length,
      });
    }
  }
}, TICK_MS);

console.log(`[server] listening on port ${PORT}`);