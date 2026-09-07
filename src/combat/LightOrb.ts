import type { Enemy } from '../enemies/Enemy';
import type { Rect } from '../game/types';

export class LightOrb {
  x: number;
  y: number;
  w = 12;
  h = 12;
  vx = 0;
  vy = 0;
  alive = true;
  life = 4.9;

  private target: Enemy | null;
  private pulse = 0;
  private age = 0;
  private launched = false;
  private orbitAngle: number;
  private readonly launchDelay: number;
  private readonly orbitRadius: number;
  private readonly freeAngle: number;
  private trail: Array<{ x: number; y: number; life: number }> = [];

  constructor(
    x: number,
    y: number,
    facing: number,
    target: Enemy | null,
    orbitAngle = 0,
    launchDelay = 0.72,
    freeAngle = orbitAngle,
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.orbitAngle = orbitAngle;
    this.launchDelay = launchDelay;
    this.orbitRadius = 20 + Math.random() * 8;
    this.freeAngle = freeAngle;
    this.vx = facing * 10;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt: number, _enemies: Enemy[], anchorX: number, anchorY: number): void {
    if (!this.alive) return;

    this.life -= dt;
    this.age += dt;
    this.pulse += dt * 10;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    // Keep the target chosen when Shining was cast. Do not split or retarget.
    if (this.target && !this.target.alive) this.target = null;

    if (!this.launched && this.age < this.launchDelay) {
      this.orbitAngle += dt * 0.82;
      const radius = this.orbitRadius + Math.sin(this.pulse * 0.35) * 1.8;
      const cx = anchorX + Math.cos(this.orbitAngle) * radius;
      const cy = anchorY + Math.sin(this.orbitAngle) * (radius * 0.68);
      this.x += (cx - this.w / 2 - this.x) * Math.min(1, dt * 5.4);
      this.y += (cy - this.h / 2 - this.y) * Math.min(1, dt * 5.4);
      this.pushTrail(dt);
      return;
    }

    if (!this.launched) {
      this.launched = true;
      if (this.target?.alive) {
        const tangent = this.orbitAngle + Math.PI / 2;
        this.vx = Math.cos(tangent) * 26;
        this.vy = Math.sin(tangent) * 26;
      } else {
        // With no visible enemy, fly outward in all directions without homing.
        this.vx = Math.cos(this.freeAngle) * 22;
        this.vy = Math.sin(this.freeAngle) * 22;
      }
    }

    const launchAge = Math.max(0, this.age - this.launchDelay);
    const targetSpeed = Math.min(360, 42 + launchAge * 280);

    if (this.target?.alive) {
      const tx = this.target.x + this.target.w / 2;
      const ty = this.target.y + this.target.h / 2;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      const dx = tx - cx;
      const dy = ty - cy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const desiredX = (dx / dist) * targetSpeed;
      const desiredY = (dy / dist) * targetSpeed;
      const steer = Math.min(1, dt * (2.4 + Math.min(5, launchAge * 3.2)));
      this.vx += (desiredX - this.vx) * steer;
      this.vy += (desiredY - this.vy) * steer;
    } else {
      const speed = Math.max(1, Math.hypot(this.vx, this.vy));
      const accel = Math.min(360, speed + 260 * dt);
      this.vx = (this.vx / speed) * accel;
      this.vy = (this.vy / speed) * accel;
    }

    this.pushTrail(dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const point of this.trail) {
      const ratio = Math.max(0, point.life / 0.34);
      ctx.fillStyle = `rgba(255, 244, 154, ${ratio * 0.25})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 + ratio * 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const pulse = 1 + Math.sin(this.pulse) * 0.13;

    const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, 15 * pulse);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.18, 'rgba(255,252,205,1)');
    glow.addColorStop(0.48, 'rgba(255,224,92,.74)');
    glow.addColorStop(1, 'rgba(255,202,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 15 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,235,.96)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.6 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private pushTrail(dt: number): void {
    this.trail.push({ x: this.x + this.w / 2, y: this.y + this.h / 2, life: 0.34 });
    if (this.trail.length > 13) this.trail.shift();
    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter((point) => point.life > 0);
  }
}
