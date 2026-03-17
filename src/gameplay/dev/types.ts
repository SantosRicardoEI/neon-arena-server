import type { EnemyType, PowerUpType, Vec2 } from '../../shared/types';

export type DevSpawnCategory =
  | 'enemy'
  | 'boss'
  | 'collectible'
  | 'powerup'
  | 'health_pickup'
  | 'dropped_points';

export type DevSpawnOptionId =
  | EnemyType
  | PowerUpType
  | 'sentinel'
  | 'leviathan'
  | 'void_reaper'
  | 'solar_archon'
  | 'collectible'
  | 'health_pickup'
  | 'dropped_points';

export interface DevSpawnOption {
  id: DevSpawnOptionId;
  label: string;
  category: DevSpawnCategory;
}

export interface DevToolState {
  selectedCategory: DevSpawnCategory;
  selectedOptionId: DevSpawnOptionId | null;
}

export interface ManualSpawnRequest {
  optionId: DevSpawnOptionId;
  pos: Vec2;
}