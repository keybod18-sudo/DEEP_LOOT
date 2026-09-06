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
    const speed = Math.max(0.001, Math.hypot(this.vx, this.vy));
    const dirX = this.vx / speed;
    const dirY = this.vy / speed;
    const trailLength = Math.min(18, 5 + speed * 1.6);

    // A short velocity trail makes the arc readable without turning the projectile
    // into a large effect. Poison arrows get a second pulse so they are unmistakable.
    ctx.save();
    ctx.globalAlpha = this.poisoned ? 0.42 : 0.24;
    ctx.strokeStyle = this.poisoned ? '#7dff72' : '#c9d3df';
    ctx.lineWidth = this.poisoned ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(this.x - dirX * 5, this.y - dirY * 5);
    ctx.lineTo(this.x - dirX * trailLength, this.y - dirY * trailLength);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    const flightPulse = Math.sin(this.age * 34) * 0.5;
    ctx.translate(0, flightPulse);

    if (this.poisoned) {
      ctx.save();
      ctx.globalAlpha = 0.16 + (Math.sin(this.age * 18) + 1) * 0.05;
      ctx.fillStyle = '#85ff75';
      ctx.fillRect(-8, -4, 17, 8);
      ctx.restore();
    }

    ctx.fillStyle = outline;
    ctx.fillRect(-12, -2, 20, 4);
    ctx.fillStyle = shaft;
    ctx.fillRect(-11, -1, 18, 2);

    ctx.fillStyle = fletch;
    const fletchKick = Math.sin(this.age * 42) >= 0 ? 0 : 1;
    ctx.fillRect(-13, -3 - fletchKick, 3, 2);
    ctx.fillRect(-13, 1 + fletchKick, 3, 2);

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

      const drip = Math.floor(this.age * 18) % 2;
      ctx.fillRect(-7 + drip * 6, 4, 2, 2);
    }

    ctx.restore();
  }
}
