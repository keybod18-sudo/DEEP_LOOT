import type { Enemy } from '../enemies/Enemy';
import type { Rect } from '../game/types';

export class LightOrb {
  x: number;
  y: number;
  w = 14;
  h = 14;
  vx: number;
  vy = 0;
  alive = true;
  life = 2.8;

  private target: Enemy | null;
  private pulse = 0;
  private trail: Array<{ x: number; y: number; life: number }> = [];

  constructor(x: number, y: number, facing: number, target: Enemy | null) {
    this.x = x;
    this.y = y;
    this.vx = facing * 185;
    this.target = target;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt: number, enemies: Enemy[]): void {
    if (!this.alive) return;

    this.life -= dt;
    this.pulse += dt * 11;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    if (!this.target?.alive) {
      this.target = this.findNearest(enemies);
    }

    if (this.target?.alive) {
      const tx = this.target.x + this.target.w / 2;
      const ty = this.target.y + this.target.h / 2;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const speed = 300;
      const desiredX = (dx / dist) * speed;
      const desiredY = (dy / dist) * speed;
      const steer = Math.min(1, dt * 8.5);
      this.vx += (desiredX - this.vx) * steer;
      this.vy += (desiredY - this.vy) * steer;
    }

    this.trail.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, life: 0.24 });
    if (this.trail.length > 10) this.trail.shift();
    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter((point) => point.life > 0);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const point of this.trail) {
      const ratio = Math.max(0, point.life / 0.24);
      ctx.fillStyle = `rgba(255, 244, 154, ${ratio * 0.24})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 + ratio * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const pulse = 1 + Math.sin(this.pulse) * 0.12;

    const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, 12 * pulse);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.24, 'rgba(255,249,185,1)');
    glow.addColorStop(0.56, 'rgba(255,220,88,.66)');
    glow.addColorStop(1, 'rgba(255,205,56,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,230,.92)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.4 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private findNearest(enemies: Enemy[]): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.x + enemy.w / 2 - cx;
      const dy = enemy.y + enemy.h / 2 - cy;
      const distance = dx * dx + dy * dy;
      if (distance < bestDist) {
        bestDist = distance;
        best = enemy;
      }
    }
    return best;
  }
}
