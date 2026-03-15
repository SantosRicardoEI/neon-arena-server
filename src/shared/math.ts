/**
 * Pure math/geometry utilities shared between client and server.
 * NO browser API dependencies.
 */
import { Vec2 } from './types';

/** Euclidean distance between two points */
export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Check if a line segment intersects a circle */
export function segmentIntersectsCircle(start: Vec2, end: Vec2, center: Vec2, radius: number): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return dist(start, center) < radius;

  const t = Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lenSq));
  const closestX = start.x + dx * t;
  const closestY = start.y + dy * t;
  const ddx = center.x - closestX;
  const ddy = center.y - closestY;
  return ddx * ddx + ddy * ddy < radius * radius;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
