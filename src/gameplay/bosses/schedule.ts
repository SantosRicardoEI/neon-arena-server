export interface BossScheduleEntry {
  bossId: string;
  spawnAtMs: number;
}

export const BOSS_SCHEDULE: BossScheduleEntry[] = [
  { bossId: "void_reaper", spawnAtMs: 1 * 10 * 1000 },
  { bossId: "leviathan", spawnAtMs: 3 * 60 * 1000 },
  { bossId: "sentinel", spawnAtMs: 5 * 60 * 1000 },
  { bossId: "sentinel", spawnAtMs: 6 * 60 * 1000 },
  { bossId: "leviathan", spawnAtMs: 8 * 60 * 1000 },
  { bossId: "void_reaper", spawnAtMs: 10 * 60 * 1000 },
];
