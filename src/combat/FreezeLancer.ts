import { BALANCE } from '../config/balance';
import type { Facing, Rect } from '../game/types';

export class FreezeLancer {
  readonly w = 42;
  readonly h = 14;
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
    return BALANCE.ahriman.freezeDamage;
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

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dir = this.facing > 0 ? 1 : -1;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (dir < 0) ctx.scale(-1, 1);

    ctx.fillStyle = '#76dfff';
    ctx.fillRect(-18, -2, 26, 4);
    ctx.fillRect(-8, -5, 10, 10);

    ctx.fillStyle = '#d8fbff';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-2, -7);
    ctx.lineTo(-2, 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#c8ecff';
    ctx.fillRect(-16, -1, 16, 2);
    ctx.fillRect(-24, -4, 6, 2);
    ctx.fillRect(-24, 2, 6, 2);
    ctx.restore();
  }
}
