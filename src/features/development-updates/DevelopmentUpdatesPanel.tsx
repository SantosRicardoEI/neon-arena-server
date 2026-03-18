import type { DevelopmentUpdate, NoticeLevel } from "./types";

function getNoticeIcon(level: NoticeLevel) {
  switch (level) {
    case "critical":
      return "🔺";
    case "warning":
      return "⚠";
    default:
      return "•";
  }
}

function levelColor(level: NoticeLevel) {
  switch (level) {
    case "critical":
      return "text-red-400";
    case "warning":
      return "text-yellow-400";
    default:
      return "text-muted-foreground";
  }
}

interface Props {
  updates: DevelopmentUpdate[];
}

const DevelopmentUpdatesPanel = ({ updates }: Props) => {
  if (updates.length === 0) return null;

  return (
    <div className="max-w-md mx-auto bg-card/70 border border-border rounded-sm px-4 py-3 space-y-2 backdrop-blur-sm">
      <div className="text-primary text-[10px] font-tabular tracking-widest uppercase">
        Development Updates
      </div>
      {updates.map((u) => (
        <p
          key={u.id}
          className="text-foreground text-xs font-tabular text-left leading-relaxed flex gap-2 items-start"
        >
          <span className={levelColor(u.level)}>{getNoticeIcon(u.level)}</span>
          <span>{u.text}</span>
        </p>
      ))}
    </div>
  );
};

export default DevelopmentUpdatesPanel;
