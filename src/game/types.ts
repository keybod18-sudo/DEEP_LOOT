export type Facing = -1 | 1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PhysicsBody extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
}
