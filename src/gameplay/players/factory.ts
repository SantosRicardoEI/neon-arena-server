import type { Player, PlayerSkin } from '../../shared/types';
import * as C from '../../game/constants';

export function createPlayer(
  id: string,
  name: string,
  color: string,
  skin: PlayerSkin = 'circle',
): Player {
  return {
    id,
    name,
    pos: {
      x: C.WORLD_WIDTH / 2 + (Math.random() - 0.5) * 400,
      y: C.WORLD_HEIGHT / 2 + (Math.random() - 0.5) * 400,
    },
    vel: { x: 0, y: 0 },
    health: C.PLAYER_MAX_HEALTH,
    maxHealth: C.PLAYER_MAX_HEALTH,
    score: 0,
    aimAngle: 0,
    lastShot: 0,
    invincibleUntil: 0,
    color,
    skin,
    ammo: C.MAGAZINE_SIZE,
    reloadingUntil: 0,
    lastDash: 0,
    isDashing: false,
    dashUntil: 0,
    dashAngle: 0,
    activePowerUps: [],
    targetPos: null,
    targetAimAngle: null,
    lastNetworkUpdate: 0,
    lastProcessedInputSeq: -1,
  };
}