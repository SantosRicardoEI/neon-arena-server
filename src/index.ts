import { WebSocketServer } from "ws";

const port = Number(process.env.PORT) || 3000;

const wss = new WebSocketServer({ port });

console.log("Game server running on port", port);

wss.on("connection", (ws) => {
  console.log("player connected");

  ws.send(JSON.stringify({ type: "connected" }));

  ws.on("message", (data) => {
    console.log("received:", data.toString());
  });

  ws.on("close", () => {
    console.log("player disconnected");
  });
});