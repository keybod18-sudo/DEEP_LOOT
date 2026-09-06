import { BALANCE } from '../config/balance';
import type { Facing, Rect } from '../game/types';

export class AhrimanFireball {
  readonly w = 26;
  readonly h = 26;
  alive = true;
  age = 0;

  constructor(
    public x: number,
    public y: number,
    public readonly vx: number,
    public readonly facing: Facing,
    public life: number,
  ) {}

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  get damage(): number {
    return BALANCE.ahriman.fireballDamage;
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    this.x += this.vx;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const pulse = Math.sin(this.age * 18) * 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#3b1022';
    ctx.fillRect(-14, -14, 28, 28);

    ctx.fillStyle = '#8e2840';
    ctx.fillRect(-11 + pulse * 0.2, -11, 22, 22);

    ctx.fillStyle = '#ff7e32';
    ctx.fillRect(-7, -7, 14, 14);

    ctx.fillStyle = '#ffe78f';
    ctx.fillRect(-3, -3, 6, 6);

    ctx.fillStyle = '#ffb048';
    const tailX = this.facing > 0 ? -18 : 12;
    ctx.fillRect(tailX, -4, 8, 8);
    ctx.fillRect(tailX + (this.facing > 0 ? 4 : -4), -2, 4, 4);

    ctx.restore();
  }
}
