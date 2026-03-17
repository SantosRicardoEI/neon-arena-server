import type { ChatMessageType } from '../../shared/types';
import * as C from '../../game/constants';

export function getEventColor(type: ChatMessageType, alpha: number): string {
  const a = alpha * 0.85;

  switch (type) {
    case "event_join":
      return C.EVENT_COLOR_JOIN.replace("ALPHA", `${a}`);
    case "event_leave":
      return C.EVENT_COLOR_LEAVE.replace("ALPHA", `${a}`);
    case "event_host":
      return C.EVENT_COLOR_HOST.replace("ALPHA", `${a}`);
    case "event_kill":
      return C.EVENT_COLOR_KILL.replace("ALPHA", `${a}`);
    case "event_points":
      return C.EVENT_COLOR_POINTS.replace("ALPHA", `${a}`);
    case "event_respawn":
      return C.EVENT_COLOR_RESPAWN.replace("ALPHA", `${a}`);
    case "event_health":
      return C.EVENT_COLOR_HEALTH.replace("ALPHA", `${a}`);
    case "event_boss":
      return C.EVENT_COLOR_BOSS.replace("ALPHA", `${a}`);
    default:
      return `hsla(240, 10%, 70%, ${a})`;
  }
}

export function getEventIcon(type: ChatMessageType): string {
  switch (type) {
    case "event_join": return "→";
    case "event_leave": return "←";
    case "event_host": return "★";
    case "event_kill": return "⚔";
    case "event_points": return "💰";
    case "event_respawn": return "↺";
    case "event_health": return "♥";
    case "event_boss": return "👹";
    default: return "•";
  }
}