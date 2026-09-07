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
  life = 4.4;

  private target: Enemy | null;
  private pulse = 0;
  private age = 0;
  private launched = false;
  private orbitAngle: number;
  private readonly launchDelay: number;
  private readonly orbitRadius: number;
  private trail: Array<{ x: number; y: number; life: number }> = [];

  constructor(
    x: number,
    y: number,
    facing: number,
    target: Enemy | null,
    orbitAngle = 0,
    launchDelay = 0.34,
  ) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.orbitAngle = orbitAngle;
    this.launchDelay = launchDelay;
    this.orbitRadius = 20 + Math.random() * 9;
    this.vx = facing * 22;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(
    dt: number,
    enemies: Enemy[],
    anchorX: number,
    anchorY: number,
  ): void {
    if (!this.alive) return;

    this.life -= dt;
    this.age += dt;
    this.pulse += dt * 13;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    // First, the light spheres appear slowly around the player.
    if (!this.launched && this.age < this.launchDelay) {
      this.orbitAngle += dt * 1.65;
      const radius = this.orbitRadius + Math.sin(this.pulse * 0.45) * 2.2;
      const cx = anchorX + Math.cos(this.orbitAngle) * radius;
      const cy = anchorY + Math.sin(this.orbitAngle) * (radius * 0.72);
      this.x += (cx - this.w / 2 - this.x) * Math.min(1, dt * 9);
      this.y += (cy - this.h / 2 - this.y) * Math.min(1, dt * 9);
      this.pushTrail(dt);
      return;
    }

    if (!this.launched) {
      this.launched = true;
      const tangent = this.orbitAngle + Math.PI / 2;
      this.vx = Math.cos(tangent) * 54;
      this.vy = Math.sin(tangent) * 54;
    }

    if (!this.target?.alive) this.target = this.findNearest(enemies);

    const launchAge = Math.max(0, this.age - this.launchDelay);
    const targetSpeed = Math.min(465, 62 + launchAge * 560);

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

      // Slow at launch, then steering and speed ramp up aggressively.
      const steer = Math.min(1, dt * (4.3 + Math.min(7, launchAge * 5.5)));
      this.vx += (desiredX - this.vx) * steer;
      this.vy += (desiredY - this.vy) * steer;
    } else {
      const speed = Math.max(1, Math.hypot(this.vx, this.vy));
      const accel = Math.min(465, speed + 520 * dt);
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
      const ratio = Math.max(0, point.life / 0.30);
      ctx.fillStyle = `rgba(255, 244, 154, ${ratio * 0.28})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2 + ratio * 4.2, 0, Math.PI * 2);
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
    this.trail.push({
      x: this.x + this.w / 2,
      y: this.y + this.h / 2,
      life: 0.30,
    });
    if (this.trail.length > 13) this.trail.shift();
    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter((point) => point.life > 0);
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
