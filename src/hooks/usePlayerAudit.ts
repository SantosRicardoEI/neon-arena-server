import { useEffect, useRef } from "react";
import {
  startSession,
  endSession,
  updateSessionPlayer,
  logEvent,
} from "@/lib/audit";

/**
 * Hook that manages the full audit lifecycle for a player visit.
 *
 * - Creates a session on mount (site enter)
 * - Ends the session on unmount / beforeunload (site leave)
 * - Exposes the sessionId for event logging from other components
 */
export function usePlayerAudit(tabId: string) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    startSession(tabId).then((id) => {
      if (!mounted || !id) return;
      sessionIdRef.current = id;
    });

    const handleUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliability on page close
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/player_sessions?id=eq.${sessionIdRef.current}`;
        const body = JSON.stringify({ left_site_at: new Date().toISOString() });
        navigator.sendBeacon(
          url,
          new Blob([body], { type: "application/json" }),
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      mounted = false;
      window.removeEventListener("beforeunload", handleUnload);
      if (sessionIdRef.current) {
        endSession(sessionIdRef.current);
      }
    };
  }, [tabId]);

  return {
    getSessionId: () => sessionIdRef.current,
    updatePlayer: (name: string, color: string, skin: string) => {
      if (sessionIdRef.current) {
        updateSessionPlayer(sessionIdRef.current, name, color, skin);
      }
    },
    logEvent: (eventType: string, metadata?: Record<string, unknown>) => {
      if (sessionIdRef.current) {
        logEvent(sessionIdRef.current, eventType, metadata);
      }
    },
  };
}
