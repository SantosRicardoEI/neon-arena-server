import { supabase } from "@/integrations/supabase/client";

let currentSessionId: string | null = null;

/**
 * Creates a new player_session row when the user opens the site.
 * Returns the session UUID for subsequent event logging.
 */
export async function startSession(tabId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("player_sessions" as any)
      .insert({ tab_id: tabId } as any)
      .select("id")
      .single();

    if (error) {
      console.error("[audit] startSession error", error);
      return null;
    }

    currentSessionId = (data as any).id;
    return currentSessionId;
  } catch (e) {
    console.error("[audit] startSession exception", e);
    return null;
  }
}

/**
 * Updates the session with player customization info.
 */
export async function updateSessionPlayer(
  sessionId: string,
  playerName: string,
  playerColor: string,
  playerSkin: string,
): Promise<void> {
  try {
    await supabase
      .from("player_sessions" as any)
      .update({
        player_name: playerName,
        player_color: playerColor,
        player_skin: playerSkin,
      } as any)
      .eq("id", sessionId);
  } catch (e) {
    console.error("[audit] updateSessionPlayer exception", e);
  }
}

/**
 * Marks the session as ended (left_site_at = now).
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    await supabase
      .from("player_sessions" as any)
      .update({ left_site_at: new Date().toISOString() } as any)
      .eq("id", sessionId);
  } catch (e) {
    console.error("[audit] endSession exception", e);
  }
}

/**
 * Logs a player event (game_start, game_end, lobby_enter, lobby_leave).
 */
export async function logEvent(
  sessionId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const row: Record<string, unknown> = {
      session_id: sessionId,
      event_type: eventType,
    };

    if (metadata?.game_mode) row.game_mode = metadata.game_mode;
    if (metadata?.room_id) row.room_id = metadata.room_id;
    if (metadata) row.metadata = metadata;

    await supabase.from("player_events" as any).insert(row as any);
  } catch (e) {
    console.error("[audit] logEvent exception", e);
  }
}

export function getCurrentSessionId(): string | null {
  return currentSessionId;
}
