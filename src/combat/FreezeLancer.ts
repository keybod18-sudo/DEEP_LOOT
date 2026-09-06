import { BALANCE } from '../config/balance';
import type { Rect } from '../game/types';

export class FreezeLancer {
  readonly w = 42;
  readonly h = 14;
  alive = true;
  age = 0;

  constructor(
    public x: number,
    public y: number,
    public readonly vx: number,
    public readonly vy: number,
    public life: number,
  ) {}

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  get damage(): number {
    return BALANCE.ahriman.freezeDamage;
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    this.x += this.vx;
    this.y += this.vy;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    ctx.fillStyle = '#76dfff';
    ctx.fillRect(-18, -2, 26, 4);
    ctx.fillRect(-8, -5, 10, 10);

    ctx.fillStyle = '#d8fbff';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(4, -8);
    ctx.lineTo(4, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c8ecff';
    ctx.fillRect(-20, -1, 16, 2);
    ctx.fillRect(-28, -4, 7, 2);
    ctx.fillRect(-28, 2, 7, 2);

    ctx.restore();
  }
}
