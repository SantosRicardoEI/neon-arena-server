
-- Player sessions: one row per site visit (tab)
CREATE TABLE public.player_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_id text NOT NULL,
  player_name text,
  player_color text,
  player_skin text,
  entered_site_at timestamptz NOT NULL DEFAULT now(),
  left_site_at timestamptz
);

-- Player events: game_start, game_end, lobby_enter, lobby_leave
CREATE TABLE public.player_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.player_sessions(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  game_mode text,
  room_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public insert/update/select (no auth required for this game)
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sessions" ON public.player_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.player_sessions FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read sessions" ON public.player_sessions FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert events" ON public.player_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read events" ON public.player_events FOR SELECT TO public USING (true);

-- Index for querying active sessions
CREATE INDEX idx_player_sessions_active ON public.player_sessions (left_site_at) WHERE left_site_at IS NULL;
CREATE INDEX idx_player_events_session ON public.player_events (session_id);
CREATE INDEX idx_player_events_type ON public.player_events (event_type, created_at);
