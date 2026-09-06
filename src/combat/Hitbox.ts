import type { Facing, Rect } from '../game/types';

export function makeSwordHitbox(player: Rect, facing: Facing, frame: number): Rect | null {
  if (frame < 2 || frame > 3) return null;

  return facing > 0
    ? { x: player.x + player.w - 2, y: player.y + 2, w: 48, h: 28 }
    : { x: player.x - 46, y: player.y + 2, w: 48, h: 28 };
}
