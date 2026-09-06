import { BALANCE } from '../config/balance';
import type { Rect } from '../game/types';

export class SkeletonArrow {
  readonly w = 24;
  readonly h = 10;
  alive = true;
  age = 0;
  private previousX: number;
  private previousY: number;

  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public vy: number,
    public readonly damage: number,
    public readonly poisoned: boolean,
    public life: number,
  ) {
    this.previousX = x;
    this.previousY = y;
  }

  get rect(): Rect {
    return {
      x: this.x - this.w / 2,
      y: this.y - this.h / 2,
      w: this.w,
      h: this.h,
    };
  }

  get sweptRect(): Rect {
    const halfW = this.w / 2;
    const halfH = this.h / 2;
    const minX = Math.min(this.previousX, this.x) - halfW;
    const maxX = Math.max(this.previousX, this.x) + halfW;
    const minY = Math.min(this.previousY, this.y) - halfH;
    const maxY = Math.max(this.previousY, this.y) + halfH;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    this.previousX = this.x;
    this.previousY = this.y;
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
    ctx.fillRect(-12, -2, 20, 4);
    ctx.fillStyle = shaft;
    ctx.fillRect(-11, -1, 18, 2);

    ctx.fillStyle = fletch;
    ctx.fillRect(-13, -3, 3, 2);
    ctx.fillRect(-13, 1, 3, 2);

    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(6, -4);
    ctx.lineTo(6, 4);
    ctx.closePath();
    ctx.fill();

    if (this.poisoned) {
      ctx.fillStyle = '#b5ff8b';
      ctx.fillRect(-2, -4, 4, 1);
      ctx.fillRect(2, 3, 4, 1);
    }

    ctx.restore();
  }
}
