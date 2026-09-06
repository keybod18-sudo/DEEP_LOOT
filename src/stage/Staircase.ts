import type { Rect } from '../game/types';

export class Staircase implements Rect {
  readonly w = 34;
  readonly h = 34;

  constructor(public x: number, public y: number) {}

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Transparent staircase: no solid rectangle behind it.
    // The old brown backing looked exactly like a projectile background panel.
    for (let i = 0; i < 5; i += 1) {
      const stepW = 9 + i * 6;
      const stepX = this.x + this.w - stepW;
      const stepY = this.y + i * 6;

      ctx.fillStyle = '#6d7780';
      ctx.fillRect(stepX, stepY, stepW, 4);
      ctx.fillStyle = '#a1abb2';
      ctx.fillRect(stepX, stepY, stepW, 1);
      ctx.fillStyle = '#333d46';
      ctx.fillRect(stepX, stepY + 4, stepW, 2);
    }

    ctx.restore();
  }
}
