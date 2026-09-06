import type { Platform } from './Platform';
import { Staircase } from './Staircase';

export class Stage {
  readonly staircase = new Staircase(690, 346);

  constructor(public readonly platforms: readonly Platform[]) {}

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1c252f';
    ctx.fillRect(0, 0, 736, 420);

    ctx.fillStyle = '#2a343e';
    const dots: ReadonlyArray<readonly [number, number]> = [
      [27, 154], [162, 13], [353, 8], [547, 56], [707, 19],
      [111, 266], [581, 178], [680, 258], [322, 220],
    ];
    for (const [x, y] of dots) ctx.fillRect(x, y, 2, 2);

    for (const platform of this.platforms) {
      ctx.fillStyle = '#59636e';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#77818b';
      ctx.fillRect(platform.x, platform.y, platform.w, 3);
      ctx.fillStyle = '#36404a';
      for (let x = platform.x + 30; x < platform.x + platform.w; x += 32) {
        ctx.fillRect(x, platform.y + 4, 3, platform.h - 4);
      }
    }

    this.staircase.draw(ctx);
  }
}
