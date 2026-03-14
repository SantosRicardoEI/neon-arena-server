import http from "node:http";
import { WebSocketServer, WebSocket } from "ws";

const port = Number(process.env.PORT) || 3000;
const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const PLAYER_SIZE = 40;
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 500;
const PLAYER_SPEED = 5;

type PlayerInput = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  input: PlayerInput;
  ws: WebSocket;
  lastProcessedInput: number;
};

const players: Record<string, Player> = {};

function createPlayerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createInitialInput(): PlayerInput {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
  };
}

function getSpawnPosition() {
  return {
    x: Math.floor(Math.random() * (WORLD_WIDTH - PLAYER_SIZE)),
    y: Math.floor(Math.random() * (WORLD_HEIGHT - PLAYER_SIZE)),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function broadcast(payload: unknown): void {
  const message = JSON.stringify(payload);

  for (const player of Object.values(players)) {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}

function buildPublicPlayersState() {
  return Object.fromEntries(
    Object.values(players).map((player) => [
      player.id,
      {
        id: player.id,
        name: player.name,
        x: player.x,
        y: player.y,
        lastProcessedInput: player.lastProcessedInput,
      },
    ])
  );
}

function sendState(): void {
  broadcast({
    type: "state",
    state: {
      players: buildPublicPlayersState(),
    },
  });
}

function updateWorld(): void {
  for (const player of Object.values(players)) {
    if (player.input.left) player.x -= PLAYER_SPEED;
    if (player.input.right) player.x += PLAYER_SPEED;
    if (player.input.up) player.y -= PLAYER_SPEED;
    if (player.input.down) player.y += PLAYER_SPEED;

    player.x = clamp(player.x, 0, WORLD_WIDTH - PLAYER_SIZE);
    player.y = clamp(player.y, 0, WORLD_HEIGHT - PLAYER_SIZE);
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Neon Arena game server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const id = createPlayerId();
  const spawn = getSpawnPosition();

  players[id] = {
    id,
    name: "Jogador",
    x: spawn.x,
    y: spawn.y,
    input: createInitialInput(),
    ws,
    lastProcessedInput: 0,
  };

  console.log("player connected:", id);

  ws.send(
    JSON.stringify({
      type: "welcome",
      id,
    })
  );

  sendState();

  ws.on("message", (data) => {
    try {
        const message = JSON.parse(data.toString()) as {
          type?: string;
          name?: unknown;
          input?: Partial<PlayerInput>;
          sequence?: unknown;
        };

      const player = players[id];
      if (!player) return;

      if (message.type === "join") {
        if (typeof message.name === "string" && message.name.trim()) {
          player.name = message.name.trim().slice(0, 20);
          sendState();
        }
        return;
      }

      if (message.type === "input") {
        const input = message.input ?? {};
        player.input = {
          up: Boolean(input.up),
          down: Boolean(input.down),
          left: Boolean(input.left),
          right: Boolean(input.right),
        };

  if (typeof message.sequence === "number") {
    player.lastProcessedInput = message.sequence;
  }
}
    } catch (error) {
      console.log("invalid message:", error);
    }
  });

  ws.on("close", () => {
    console.log("player disconnected:", id);
    delete players[id];
    sendState();
  });
});

setInterval(() => {
  updateWorld();
  sendState();
}, TICK_MS);

server.listen(port, "0.0.0.0", () => {
  console.log("Game server running on port", port);
});