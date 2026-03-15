import { supabase } from '@/integrations/supabase/client';

const MAX_ENTRIES = 25;

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(MAX_ENTRIES);

  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
  return (data ?? []) as LeaderboardEntry[];
}

export async function submitScore(playerName: string, score: number): Promise<void> {
  if (score <= 0) return;

  // Check if this score qualifies for top 25
  const { data: lowest } = await supabase
    .from('leaderboard')
    .select('id, score')
    .order('score', { ascending: true })
    .limit(1);

  const { count } = await supabase
    .from('leaderboard')
    .select('*', { count: 'exact', head: true });

  const totalEntries = count ?? 0;

  if (totalEntries >= MAX_ENTRIES && lowest && lowest.length > 0 && score <= lowest[0].score) {
    return; // Score doesn't qualify
  }

  // Insert new score
  await supabase
    .from('leaderboard')
    .insert({ player_name: playerName, score } as any);

  // If over 25, delete the lowest
  if (totalEntries >= MAX_ENTRIES && lowest && lowest.length > 0) {
    await supabase
      .from('leaderboard')
      .delete()
      .eq('id', lowest[0].id);
  }
}
