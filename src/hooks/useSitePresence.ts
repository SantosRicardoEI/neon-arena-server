import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type PresenceMeta = {
  tab_id: string;
  screen: "menu" | "game";
  room_id: string | null;
  online_at: number;
};

type PresenceCounts = {
  total: number;
  menu: number;
  game: number;
};

function flattenPresence(state: Record<string, any[]>): PresenceMeta[] {
  const all: PresenceMeta[] = [];

  for (const key of Object.keys(state)) {
    const entries = state[key] ?? [];

    for (const entry of entries) {
      all.push({
        tab_id: entry.tab_id,
        screen: entry.screen,
        room_id: entry.room_id ?? null,
        online_at: entry.online_at,
      });
    }
  }

  return all;
}

export function useSitePresence(params: {
  tabId: string;
  screen: "menu" | "game";
  roomId?: string | null;
}) {
  const { tabId, screen, roomId = null } = params;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const [counts, setCounts] = useState<PresenceCounts>({
    total: 0,
    menu: 0,
    game: 0,
  });

  const payload = useMemo(
    () => ({
      tab_id: tabId,
      screen,
      room_id: roomId,
      online_at: Date.now(),
    }),
    [tabId, screen, roomId]
  );

  useEffect(() => {
    let mounted = true;

    if (!channelRef.current) {
      channelRef.current = supabase.channel("site_presence", {
        config: {
          presence: {
            key: tabId,
          },
        },
      });

      channelRef.current
        .on("presence", { event: "sync" }, () => {
          if (!mounted || !channelRef.current) return;

          const state = channelRef.current.presenceState() as Record<string, any[]>;
          const all = flattenPresence(state);

          let menuCount = 0;
          let gameCount = 0;

          for (const entry of all) {
            if (entry.screen === "game") gameCount++;
            else menuCount++;
          }

          setCounts({
            total: all.length,
            menu: menuCount,
            game: gameCount,
          });
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channelRef.current?.track(payload);
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [tabId]);

  useEffect(() => {
    const updatePresence = async () => {
      if (!channelRef.current) return;
      await channelRef.current.track(payload);
    };

    updatePresence();
  }, [payload]);

  useEffect(() => {
    return () => {
      const cleanup = async () => {
        if (!channelRef.current) return;
        await channelRef.current.untrack();
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      };

      cleanup();
    };
  }, []);

  return counts;
}