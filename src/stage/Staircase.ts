import type { Rect } from '../game/types';

export class Staircase implements Rect {
  readonly w = 34;
  readonly h = 34;

  constructor(public x: number, public y: number) {}

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#1a1513';
    ctx.fillRect(this.x - 3, this.y - 5, this.w + 6, this.h + 5);
    ctx.fillStyle = '#8f765f';
    for (let i = 0; i < 5; i += 1) {
      const stepW = 8 + i * 6;
      ctx.fillRect(this.x + this.w - stepW, this.y + i * 6, stepW, 4);
    }
    ctx.fillStyle = '#d0b18e';
    ctx.fillRect(this.x + this.w - 10, this.y, 8, 3);
    ctx.restore();
  }
}
