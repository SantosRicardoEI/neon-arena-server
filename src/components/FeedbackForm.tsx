import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

interface FeedbackFormProps {
  onBack: () => void;
}

const FeedbackForm = ({ onBack }: FeedbackFormProps) => {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      name: name.trim() || "Anonymous",
      title: title.trim(),
      message: message.trim(),
    });

    setSending(false);
    if (!error) {
      setSent(true);
      setTimeout(() => onBack(), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground text-xs font-tabular tracking-wider hover:text-foreground transition-colors uppercase"
      >
        <ArrowLeft size={14} />
        Back to Neon Pulse
      </button>

      <h2 className="text-3xl font-bold text-foreground title-glow font-tabular tracking-wider text-center">
        FEEDBACK
      </h2>
      <p className="text-muted-foreground text-xs text-center">
        Report bugs, suggest features, or share your thoughts
      </p>

      {sent ? (
        <div className="text-center space-y-2">
          <p className="text-primary font-tabular text-sm title-glow">
            Message sent! Thank you.
          </p>
          <p className="text-muted-foreground text-xs">Redirecting...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
            className="block w-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-tabular rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="block w-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-tabular rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
          <textarea
            placeholder="Describe the bug or suggestion... *"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={2000}
            className="block w-full bg-secondary text-foreground border border-border px-4 py-2 text-sm font-tabular rounded-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={sending || !title.trim() || !message.trim()}
            className="w-full bg-primary text-primary-foreground px-8 py-3 text-sm font-bold tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm disabled:opacity-50"
          >
            {sending ? "SENDING..." : "SEND"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;