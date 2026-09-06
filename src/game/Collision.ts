import type { PhysicsBody, Rect } from './types';

export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

export function resolveFloor(body: PhysicsBody, previousY: number, platforms: readonly Rect[], maxWidth = 736): void {
  body.grounded = false;

  for (const platform of platforms) {
    const overlapsX = body.x + body.w > platform.x && body.x < platform.x + platform.w;
    const crossedTop = previousY + body.h <= platform.y && body.y + body.h >= platform.y;

    if (overlapsX && crossedTop && body.vy >= 0) {
      body.y = platform.y - body.h;
      body.vy = 0;
      body.grounded = true;
    }
  }

  body.x = Math.max(0, Math.min(maxWidth - body.w, body.x));
}
