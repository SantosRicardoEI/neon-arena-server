import { supabase } from "@/integrations/supabase/client";

export interface Room {
  id: string;
  name: string;
  host_name: string;
  host_id: string;
  password: string;
  max_players: number;
  player_count: number;
  is_default: boolean;
  created_at: string;
}

export async function fetchRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch rooms:", error);
    return [];
  }

  return (data ?? []) as Room[];
}

/**
 * Verify actual presence for rooms that claim to have players.
 * Subscribes briefly to each room's game channel (without tracking)
 * to read real presence state, then corrects the DB if stale.
 */
export async function cleanupStaleRooms(rooms: Room[]): Promise<Room[]> {
  const staleRooms = rooms.filter((r) => {
    if (r.player_count <= 0) return false;
    // Don't verify rooms younger than 10s — they may still be connecting
    const ageMs = Date.now() - new Date(r.created_at).getTime();
    return ageMs > 10000;
  });
  if (staleRooms.length === 0) return rooms;

  const results = await Promise.all(
    staleRooms.map(
      (room) =>
        new Promise<{ name: string; realCount: number }>((resolve) => {
          // Use the SAME channel name so we can see the game's presence state
          const channel = supabase.channel(`game:${room.name}`);
          let done = false;

          const finish = (count: number) => {
            if (done) return;
            done = true;
            supabase.removeChannel(channel);
            resolve({ name: room.name, realCount: count });
          };

          // Subscribe to the SAME topic as the game channel to see its presence
          channel
            .on('presence', { event: 'sync' }, () => {
              const state = channel.presenceState();
              let count = 0;
              for (const key of Object.keys(state)) {
                count += state[key].length;
              }
              finish(count);
            })
            .subscribe();

          // Timeout: if no sync in 3s, assume 0 (channel likely empty)
          setTimeout(() => finish(0), 3000);
        })
    )
  );

  // Update stale rooms in DB and in the returned array
  for (const { name, realCount } of results) {
    const room = rooms.find((r) => r.name === name);
    if (room && realCount !== room.player_count) {
      room.player_count = realCount;
      syncRoomPresence(name, realCount); // fire-and-forget
    }
  }

  return rooms;
}

export async function createRoom(params: {
  name: string;
  password?: string;
  maxPlayers: number;
  hostName: string;
  hostId: string;
}): Promise<{ room: Room | null; error: string | null }> {
  const trimmedName = params.name.trim();

  if (!trimmedName) return { room: null, error: "Room name is required." };
  if (trimmedName.toLowerCase() === "default")
    return { room: null, error: '"default" is a reserved room name.' };

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      name: trimmedName,
      password: params.password || "",
      max_players: params.maxPlayers,
      host_name: params.hostName,
      host_id: params.hostId,
      player_count: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { room: null, error: "A room with this name already exists." };
    }
    return { room: null, error: error.message };
  }

  return { room: data as Room, error: null };
}

export async function joinRoom(roomName: string, hostName: string, hostId: string): Promise<void> {
  const { data: room } = await supabase
    .from("rooms")
    .select("host_name")
    .eq("name", roomName)
    .single();

  const isFirstPlayer = room && (!room.host_name || room.host_name === "");

  if (isFirstPlayer) {
    await supabase
      .from("rooms")
      .update({ host_name: hostName, host_id: hostId })
      .eq("name", roomName);
  }
}

export async function leaveRoom(roomName: string, playerId: string): Promise<void> {
  const { data: room } = await supabase
    .from("rooms")
    .select("player_count, is_default, host_id")
    .eq("name", roomName)
    .single();

  if (!room) return;

  const newCount = Math.max(0, (room.player_count ?? 1) - 1);

  if (newCount === 0 && !room.is_default) {
    await supabase.from("rooms").delete().eq("name", roomName);
  } else if (newCount === 0 && room.is_default) {
    await supabase
      .from("rooms")
      .update({ player_count: 0, host_name: "", host_id: "" })
      .eq("name", roomName);
  } else {
    await supabase
      .from("rooms")
      .update({ player_count: newCount })
      .eq("name", roomName);
  }
}

export async function updateRoomHost(roomName: string, hostName: string, hostId: string): Promise<void> {
  await supabase
    .from("rooms")
    .update({ host_name: hostName, host_id: hostId })
    .eq("name", roomName);
}

/** Sync the player_count from presence state (called on every presence sync) */
export async function syncRoomPresence(
  roomName: string,
  playerCount: number,
  hostId?: string,
  hostName?: string
): Promise<void> {
  const update: Record<string, any> = { player_count: playerCount };

  if (playerCount === 0) {
    // If empty, clear host for default rooms; non-default rooms get deleted after grace period
    const { data: room } = await supabase
      .from("rooms")
      .select("is_default, created_at")
      .eq("name", roomName)
      .single();

    if (!room) return;

    if (!room.is_default) {
      const ageMs = Date.now() - new Date(room.created_at).getTime();
      if (ageMs < 10000) {
        // Room is too new — skip deletion, just update count
        await supabase.from("rooms").update({ player_count: 0 }).eq("name", roomName);
        return;
      }
      await supabase.from("rooms").delete().eq("name", roomName);
      return;
    }
    update.host_name = "";
    update.host_id = "";
  }

  await supabase.from("rooms").update(update).eq("name", roomName);
}
