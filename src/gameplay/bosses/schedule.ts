export interface BossScheduleEntry {
  bossId: string;
  spawnAtMs: number;
}

export const BOSS_SCHEDULE: BossScheduleEntry[] = [
  { bossId: "sentinel", spawnAtMs: 1 * 60 * 1000 },
  { bossId: "leviathan", spawnAtMs: 3 * 60 * 1000 },
  { bossId: "solar_archon", spawnAtMs: 4 * 60 * 1000 },
  { bossId: "void_reaper", spawnAtMs: 5 * 60 * 1000 },
  { bossId: "sentinel", spawnAtMs: 6 * 60 * 1000 },

  { bossId: "solar_archon", spawnAtMs: 7 * 60 * 1000 },
  { bossId: "void_reapers", spawnAtMs: 8 * 60 * 1000 },
  { bossId: "leviathan", spawnAtMs: 10 * 60 * 1000 },
];
