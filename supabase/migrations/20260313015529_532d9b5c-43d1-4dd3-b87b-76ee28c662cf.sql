
-- Feedback table for bug reports and suggestions
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Anonymous',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (no auth required)
CREATE POLICY "Anyone can insert feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Leaderboard table - top 25 scores
CREATE TABLE public.leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read leaderboard
CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

-- Anyone can insert scores (no auth required for this game)
CREATE POLICY "Anyone can insert scores"
  ON public.leaderboard FOR INSERT
  WITH CHECK (true);

-- Anyone can delete (needed for trimming to top 25 via edge function)
-- We'll use an edge function to manage the trimming
CREATE POLICY "Anyone can update scores"
  ON public.leaderboard FOR UPDATE
  USING (true)
  WITH CHECK (true);
