CREATE POLICY "Anyone can delete scores"
  ON public.leaderboard FOR DELETE
  USING (true);