import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Plus, ArrowLeft } from "lucide-react";


interface LobbyProps {
  playerName: string;
  playerId: string;
  onJoinRoom: (roomName: string) => void;
  onBack: () => void;
}

type ActiveRoom = {
  roomId: string;
  playerCount: number;
};

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || "ws://localhost:3001";

const Lobby = ({ onJoinRoom, onBack }: LobbyProps) => {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [createError, setCreateError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  const requestRooms = useCallback(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: "client:list_rooms" }));
  }, []);

  useEffect(() => {
    const ws = new WebSocket(SERVER_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      requestRooms();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "server:room_list") {
          setRooms(msg.rooms);
        }
      } catch (error) {
        console.error("[Lobby] invalid message", error);
      }
    };

    ws.onclose = () => {
      socketRef.current = null;
    };

    const interval = window.setInterval(() => {
      requestRooms();
    }, 2000);

    return () => {
      window.clearInterval(interval);
      ws.close();
      socketRef.current = null;
    };
  }, [requestRooms]);

  const handleJoinRoom = useCallback((roomId: string) => {
    onJoinRoom(roomId);
  }, [onJoinRoom]);

  const handleCreateRoom = useCallback(() => {
    const trimmed = newRoomName.trim();

    if (!trimmed) {
      setCreateError("Room name is required.");
      return;
    }

    setCreateError("");
    setShowCreateDialog(false);
    onJoinRoom(trimmed);
  }, [newRoomName, onJoinRoom]);

  return (
    
      <div className="relative w-full">


    <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      <div className="flex items-center gap-4 w-full">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-2xl font-bold text-foreground font-tabular tracking-wider title-glow flex-1">
          SELECT ROOM
        </h2>

        <button
          onClick={() => {
            setShowCreateDialog(true);
            setCreateError("");
            setNewRoomName("");
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm"
        >
          <Plus size={14} />
          CREATE
        </button>
      </div>

      <div className="w-full space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {rooms.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8 font-tabular">
            No active rooms. Create one!
          </p>
        )}

        {rooms.map((room) => (
          <button
            key={room.roomId}
            onClick={() => handleJoinRoom(room.roomId)}
            className="w-full text-left border rounded-sm px-4 py-3 transition-all font-tabular border-border bg-secondary/50 hover:border-primary hover:bg-primary/5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-bold tracking-wider uppercase">
                  {room.roomId}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  <span className="text-foreground">{room.playerCount}</span>
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-sm p-6 w-80 space-y-4">
            <h3 className="text-sm font-bold text-foreground font-tabular tracking-wider uppercase">
              Create Room
            </h3>

            <div>
              <label className="text-[10px] text-muted-foreground font-tabular tracking-wider uppercase block mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateRoom();
                }
              }}
                maxLength={24}
                autoFocus
                className="w-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-tabular rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                placeholder="My Room"
              />
            </div>

            {createError && (
              <p className="text-destructive text-xs font-tabular">{createError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border border-border text-muted-foreground px-4 py-2 text-xs font-bold tracking-widest uppercase hover:text-foreground transition-colors rounded-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim()}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Lobby;