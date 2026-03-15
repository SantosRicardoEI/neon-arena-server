import { useEffect, useState } from 'react';
import { fetchLeaderboard, LeaderboardEntry } from '@/lib/leaderboard';

interface LeaderboardProps {
  open: boolean;
  onClose: () => void;
}

const Leaderboard = ({ open, onClose }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchLeaderboard().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-sm p-6 w-full max-w-sm max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground hud-glow font-tabular tracking-wider">
            TOP 25
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-tabular"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-xs text-center font-tabular py-8">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-xs text-center font-tabular py-8">No scores yet. Be the first!</p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-3 py-2 rounded-sm text-sm font-tabular ${
                  i === 0
                    ? 'bg-primary/20 text-primary'
                    : i < 3
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right opacity-60">{i + 1}.</span>
                  <span className={i === 0 ? 'hud-glow' : ''}>{entry.player_name}</span>
                </div>
                <span className={i === 0 ? 'hud-glow font-bold' : ''}>{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
