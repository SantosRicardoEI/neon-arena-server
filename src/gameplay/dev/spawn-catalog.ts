import { BOSS_REGISTRY } from '../bosses/registry';
import type { PowerUpType } from '../../shared/types';
import type { DevSpawnCategory, DevSpawnOption } from './types';

const POWER_UP_OPTIONS: { id: PowerUpType; label: string }[] = [
  { id: 'speed', label: 'Speed' },
  { id: 'rapid_fire', label: 'Rapid Fire' },
  { id: 'shield', label: 'Shield' },
];

export const DEV_SPAWN_CATEGORIES: {
  id: DevSpawnCategory;
  label: string;
}[] = [
  { id: 'enemy', label: 'Enemies' },
  { id: 'boss', label: 'Bosses' },
  { id: 'collectible', label: 'Collectibles' },
  { id: 'powerup', label: 'Power-Ups' },
  { id: 'health_pickup', label: 'Health' },
  { id: 'dropped_points', label: 'Dropped Points' },
];

export const DEV_SPAWN_OPTIONS: DevSpawnOption[] = [
  { id: 'normal', label: 'Normal Enemy', category: 'enemy' },
  { id: 'fast', label: 'Fast Enemy', category: 'enemy' },
  { id: 'tank', label: 'Tank Enemy', category: 'enemy' },
  { id: 'exploder', label: 'Exploder Enemy', category: 'enemy' },

  ...BOSS_REGISTRY.map((boss) => ({
    id: boss.id as DevSpawnOption['id'],
    label: boss.name,
    category: 'boss' as const,
  })),

  { id: 'collectible', label: 'Collectible', category: 'collectible' },

  ...POWER_UP_OPTIONS.map((powerUp) => ({
    id: powerUp.id,
    label: powerUp.label,
    category: 'powerup' as const,
  })),

  { id: 'health_pickup', label: 'Health Pickup', category: 'health_pickup' },
  { id: 'dropped_points', label: 'Dropped Points', category: 'dropped_points' },
];

export function getDevSpawnOptionsByCategory(
  category: DevSpawnCategory,
): DevSpawnOption[] {
  return DEV_SPAWN_OPTIONS.filter((option) => option.category === category);
}