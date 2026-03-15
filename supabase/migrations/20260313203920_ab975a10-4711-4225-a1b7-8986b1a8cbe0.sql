
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  host_name text NOT NULL DEFAULT '',
  host_id text NOT NULL DEFAULT '',
  password text DEFAULT '',
  max_players integer NOT NULL DEFAULT 4,
  player_count integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default room
INSERT INTO public.rooms (name, host_name, host_id, max_players, is_default)
VALUES ('default', '', '', 20, true);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms" ON public.rooms FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert rooms" ON public.rooms FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete rooms" ON public.rooms FOR DELETE TO public USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
