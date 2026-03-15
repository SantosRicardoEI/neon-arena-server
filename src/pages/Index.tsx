import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import starLogo from "@/assets/star-logo.png";
import GameCanvas from "@/components/GameCanvas";
import Leaderboard from "@/components/Leaderboard";
import Lobby from "@/components/Lobby";
import SettingsMenu from "@/components/SettingsMenu";
import { music } from "@/game/music";
import { PlayerSkin } from "@/game/types";
import * as C from "@/game/constants";
import { useSitePresence } from "@/hooks/useSitePresence";
import { Users, Monitor, Gamepad2 } from "lucide-react";

type GameMode = "solo" | "online";

function generatePlayerId(): string {
  return "p_" + Math.random().toString(36).slice(2, 10);
}

function getOrCreateTabId(): string {
  const key = "neon_arena_tab_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = "tab_" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(key, id);
  }
  return id;
}

const PLAYER_COLORS = C.PLAYER_COLOR_OPTIONS;
const PLAYER_SKINS: { id: PlayerSkin; label: string }[] = [
  { id: "circle", label: "Classic" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "star", label: "Star" },
];

type Screen = "menu" | "lobby" | "game";

const Index = () => {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("menu");
  const [roomId, setRoomId] = useState("default");
  const [playerId] = useState(generatePlayerId);
  const [playerName, setPlayerName] = useState("");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);
  const [selectedSkin, setSelectedSkin] = useState<PlayerSkin>("circle");
  const [tabId] = useState(getOrCreateTabId);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const activeCounts = useSitePresence({
    tabId,
    screen: screen === "game" ? "game" : "menu",
    roomId: screen === "game" ? roomId : null,
  });

  useEffect(() => {
    if (screen !== "game") {
      music.play("menu");
    }
  }, [screen]);

  // Room cleanup is now handled by presence sync in multiplayer.ts
  // No need for beforeunload handler

  const handleGoToLobby = useCallback(() => {
    const trimmedName = playerName.trim() || "Player";
    setPlayerName(trimmedName);
    setScreen("lobby");
  }, [playerName]);

  const handleJoinRoom = useCallback((roomName: string) => {
    setRoomId(roomName);
    setGameMode("online");
    setScreen("game");
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen("menu");
    setGameMode(null);
  }, []);

  const handleSoloStart = useCallback(() => {
  const trimmedName = playerName.trim() || "Player";
  setPlayerName(trimmedName);
  setRoomId("solo");
  setGameMode("solo");
  setScreen("game");
}, [playerName]);

const handleLobbyClick = useCallback(() => {
  const confirmed = window.confirm(
    "⚠️ Multiplayer is still experimental and may contain bugs.\n\nDo you want to continue?"
  );

  if (!confirmed) return;

  handleGoToLobby();
}, [handleGoToLobby]);

  // Game screen
  if (screen === "game") {
    return (
      <div className="w-screen h-screen overflow-hidden bg-background">
        <SettingsMenu compact />
        <GameCanvas
          playerId={playerId}
          playerName={playerName}
          roomId={roomId}
          playerColor={selectedColor}
          playerSkin={selectedSkin}
          mode={gameMode ?? "solo"}
        />
      </div>
    );
  }

  // Lobby screen
  if (screen === "lobby") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background bg-cover bg-center p-4"
        style={{ backgroundImage: "url('/background.png')" }}
      >
        <div className="w-full max-w-lg">
          <Lobby
            playerName={playerName}
            playerId={playerId}
            onJoinRoom={handleJoinRoom}
            onBack={handleBackToMenu}
          />
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background bg-cover bg-center"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="text-center space-y-8">
        <img
          src={starLogo}
          alt="Neon Arena Logo"
          className="w-32 h-32 mx-auto drop-shadow-[0_0_30px_hsla(210,100%,70%,0.6)] animate-pulse-slow"
        />

        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl font-bold text-foreground title-glow font-tabular tracking-wider">
            NEON ARENA
          </h1>
          <span className="text-[10px] px-2 py-1 border border-primary text-primary font-tabular tracking-widest uppercase">
            easter egg...
          </span>
        </div>

        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          WASD and SPACE to move · Mouse to aim & shoot · Survive the arena
        </p>

        {/* Online players indicator */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-4 bg-card/60 border border-border rounded-sm px-5 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Users size={16} className="text-primary" />
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "hsl(120, 80%, 55%)" }} />
              </div>
              <span className="text-foreground font-tabular text-sm font-bold">{activeCounts.total}</span>
              <span className="text-muted-foreground text-xs font-tabular">online</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Gamepad2 size={13} className="text-accent" />
              <span className="text-foreground font-tabular text-xs">{activeCounts.game}</span>
              <span className="text-muted-foreground text-[10px] font-tabular">playing</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <Monitor size={13} className="text-muted-foreground" />
              <span className="text-foreground font-tabular text-xs">{activeCounts.menu}</span>
              <span className="text-muted-foreground text-[10px] font-tabular">in menu</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGoToLobby()}
            maxLength={16}
            className="block mx-auto w-64 bg-secondary text-foreground border border-border px-4 py-2 text-sm font-tabular rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />

          {/* Skin picker */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground text-xs font-tabular tracking-wider uppercase">Skin</span>
            <div className="flex gap-2">
              {PLAYER_SKINS.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => setSelectedSkin(skin.id)}
                  className={`w-16 h-16 border rounded-sm flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedSkin === skin.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-muted-foreground"
                  }`}
                >
                  <SkinPreview skin={skin.id} color={selectedColor} size={24} />
                  <span className="text-[9px] text-muted-foreground font-tabular">{skin.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground text-xs font-tabular tracking-wider uppercase">Color</span>
            <div className="flex gap-2">
              {PLAYER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                  style={{ backgroundColor: color, boxShadow: selectedColor === color ? `0 0 12px ${color}` : "none" }}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={handleSoloStart}
            className="bg-primary text-primary-foreground px-8 py-3 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm"
          >
            PLAY SOLO
          </button>
          
          <button
            onClick={handleLobbyClick}
            className="bg-primary/70 text-primary-foreground px-8 py-3 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm"
          >
            ENTER LOBBY
          </button>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setLeaderboardOpen(true)}
            className="text-muted-foreground text-xs font-tabular tracking-wider hover:text-primary transition-colors uppercase"
          >
            🏆 Ranking
          </button>
          <span className="text-border">|</span>
          <SettingsMenu />
          <span className="text-border">|</span>
          <button
            onClick={() => navigate("/feedback")}
            className="text-muted-foreground text-xs font-tabular tracking-wider hover:text-primary transition-colors uppercase"
          >
            💬 Feedback
          </button>
        </div>

        <p className="text-muted-foreground text-xs">Choose your look, then select a room</p>

        <div className="text-muted-foreground/50 text-[10px] font-tabular tracking-wider pt-4">
          <span>developed by </span>
          <a
            href="https://www.instagram.com/ricardo_santos0607?igsh=MWthNW1kbXpicjU1"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors underline underline-offset-2"
          >
            Ricardo Santos
          </a>
        </div>
      </div>

      <Leaderboard open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
    </div>
  );
};

/** Tiny canvas-like SVG preview of each skin shape */
function SkinPreview({ skin, color, size }: { skin: PlayerSkin; color: string; size: number }) {
  const s = size;
  const c = s / 2;

  const getPath = () => {
    switch (skin) {
      case "diamond":
        return `M ${c} 2 L ${s - 2} ${c} L ${c} ${s - 2} L 2 ${c} Z`;
      case "hexagon": {
        const pts: string[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          pts.push(`${c + Math.cos(a) * (c - 2)},${c + Math.sin(a) * (c - 2)}`);
        }
        return `M ${pts.join(" L ")} Z`;
      }
      case "star": {
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? c - 2 : (c - 2) * 0.45;
          pts.push(`${c + Math.cos(a) * r},${c + Math.sin(a) * r}`);
        }
        return `M ${pts.join(" L ")} Z`;
      }
      default:
        return "";
    }
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {skin === "circle" ? (
        <circle cx={c} cy={c} r={c - 2} fill="none" stroke={color} strokeWidth={2} />
      ) : (
        <path d={getPath()} fill="none" stroke={color} strokeWidth={2} />
      )}
    </svg>
  );
}

export default Index;
