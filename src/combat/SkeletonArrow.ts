import { BALANCE } from '../config/balance';
import type { Rect } from '../game/types';

export class SkeletonArrow {
  readonly w = 22;
  readonly h = 8;
  alive = true;
  age = 0;

  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public readonly damage: number,
    public readonly poisoned: boolean,
    public life: number,
  ) {}

  get rect(): Rect {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h,
    };
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    this.x += this.vx;
    this.y += this.vy;
    this.vy += BALANCE.skeletonArcher.arrowGravity;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const angle = Math.atan2(this.vy, this.vx);
    const shaft = this.poisoned ? '#85f07e' : '#d7d8db';
    const outline = this.poisoned ? '#214f22' : '#2a313a';
    const fletch = this.poisoned ? '#5ad85b' : '#7d4f24';
    const tip = this.poisoned ? '#b9ffb4' : '#eef4ff';

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    ctx.fillStyle = outline;
    ctx.fillRect(-11, -2, 18, 4);
    ctx.fillStyle = shaft;
    ctx.fillRect(-10, -1, 16, 2);

    ctx.fillStyle = fletch;
    ctx.fillRect(-12, -3, 3, 2);
    ctx.fillRect(-12, 1, 3, 2);

    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(4, -4);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();

    if (this.poisoned) {
      ctx.fillStyle = '#b5ff8b';
      ctx.fillRect(-2, -3, 3, 1);
      ctx.fillRect(1, 2, 3, 1);
    }

    ctx.restore();
  }
}
