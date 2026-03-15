import type { ClientMessage, ServerMessage } from "../../shared/protocol/messages";

export class GameSocket {
  private ws: WebSocket | null = null;

  connect(url: string, onOpen?: () => void) {
    console.log("[socket] connect called with", url);

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[socket] connected");
      onOpen?.();
    };

    this.ws.onclose = (ev) => {
      console.log("[socket] disconnected", ev);
    };

    this.ws.onerror = (err) => {
      console.error("[socket] error", err);
    };
  }

  send(msg: ClientMessage) {
    if (!this.ws) return;
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(msg));
  }

  onMessage(handler: (msg: ServerMessage) => void) {
    if (!this.ws) return;

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        handler(msg);
      } catch (e) {
        console.error("[socket] invalid message", e);
      }
    };
  }

  disconnect() {
    if (!this.ws) return;
    this.ws.close();
    this.ws = null;
  }
}