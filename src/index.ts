import http from "node:http";
import { WebSocketServer } from "ws";

const port = 3000;

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
  console.log("player connected");

  ws.send(
    JSON.stringify({
      type: "connected",
      message: "welcome to neon arena server",
    })
  );

  ws.on("message", (data) => {
    console.log("received:", data.toString());
  });

  ws.on("close", () => {
    console.log("player disconnected");
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log("Game server running on port", port);
});