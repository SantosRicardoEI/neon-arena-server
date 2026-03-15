import { useState, useEffect, useCallback } from "react";
import { Settings, Volume2, VolumeX, Music, X } from "lucide-react";
import { music } from "@/game/music";
import { getSfxVolume, setSfxVolume } from "@/game/audio";

interface SettingsMenuProps {
  /** If true, renders a smaller gear icon suitable for overlay on game */
  compact?: boolean;
}

const SettingsMenu = ({ compact = false }: SettingsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [musicVol, setMusicVol] = useState(music.getVolume());
  const [sfxVol, setSfxVol_] = useState(getSfxVolume());

  const handleMusicChange = useCallback((v: number) => {
    setMusicVol(v);
    music.setVolume(v);
  }, []);

  const handleSfxChange = useCallback((v: number) => {
    setSfxVol_(v);
    setSfxVolume(v);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`${
          compact
            ? "fixed top-3 left-3 z-50 p-2 rounded-sm bg-card/80 border border-border backdrop-blur-sm hover:bg-card transition-colors"
            : "text-muted-foreground text-xs font-tabular tracking-wider hover:text-primary transition-colors uppercase flex items-center gap-1"
        }`}
        title="Settings"
      >
        <Settings size={compact ? 18 : 14} className={compact ? "text-muted-foreground" : ""} />
        {!compact && <span>Settings</span>}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-sm p-6 w-80 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground font-tabular tracking-wider uppercase flex items-center gap-2">
            <Settings size={14} className="text-primary" />
            Settings
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Music Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground font-tabular tracking-wider uppercase flex items-center gap-1.5">
              <Music size={12} />
              Music
            </label>
            <span className="text-[10px] text-muted-foreground font-tabular">
              {Math.round(musicVol * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX size={12} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVol * 100)}
              onChange={(e) => handleMusicChange(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-secondary rounded-sm appearance-none cursor-pointer accent-primary"
            />
            <Volume2 size={12} className="text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* SFX Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground font-tabular tracking-wider uppercase flex items-center gap-1.5">
              <Volume2 size={12} />
              Sound Effects
            </label>
            <span className="text-[10px] text-muted-foreground font-tabular">
              {Math.round(sfxVol * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX size={12} className="text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(sfxVol * 100)}
              onChange={(e) => handleSfxChange(Number(e.target.value) / 100)}
              className="w-full h-1.5 bg-secondary rounded-sm appearance-none cursor-pointer accent-primary"
            />
            <Volume2 size={12} className="text-muted-foreground shrink-0" />
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="w-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
