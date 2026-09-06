import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type KagenokoState = 'scuttle' | 'sink' | 'pounce' | 'orbCharge' | 'recover';

interface ShadowOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  phase: number;
  alive: boolean;
}

export class Kagenoko extends Enemy {
  readonly type = 'kagenoko' as const;
  state: KagenokoState = 'scuttle';
  stateTime = 0;
  private attackCycle = 0;
  private pounceHit = false;
  private orbReleased = false;
  private blinkTimer = 0.7 + Math.random() * 1.8;
  private blink = 0;
  private readonly orbs: ShadowOrb[] = [];

  constructor(x: number, y: number) {
    super(x, y, 28, 28, BALANCE.kagenoko.maxHp, BALANCE.kagenoko.maxHp);
    this.cooldown = 0.7 + Math.random() * 0.7;
    this.facing = Math.random() < 0.5 ? -1 : 1;
  }

  interruptForKnockback(): void {
    this.state = 'recover';
    this.stateTime = 0;
    this.pounceHit = false;
    this.orbReleased = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'recover';
    this.stateTime = 0;
    this.cooldown = Math.max(this.cooldown, 0.5);
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.updateBlink(dt);
    this.updateOrbs(dt, context);
    this.stateTime += dt;

    if (this.state === 'sink') {
      this.vx *= 0.72;
      if (this.stateTime >= BALANCE.kagenoko.sinkDuration) this.beginPounce(context);
      return;
    }

    if (this.state === 'pounce') {
      this.updatePounce(context);
      return;
    }

    if (this.state === 'orbCharge') {
      this.vx *= 0.76;
      if (!this.orbReleased && this.stateTime >= BALANCE.kagenoko.orbReleaseTime) {
        this.orbReleased = true;
        this.spawnShadowOrbs(context);
      }
      if (this.stateTime >= BALANCE.kagenoko.orbChargeDuration) this.beginRecover();
      return;
    }

    if (this.state === 'recover') {
      this.vx *= 0.85;
      const previousY = this.y;
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
      if (this.stateTime >= BALANCE.kagenoko.recoverDuration) {
        this.state = 'scuttle';
        this.stateTime = 0;
        this.cooldown = BALANCE.kagenoko.attackCooldown;
      }
      return;
    }

    this.updateScuttle(context);
  }

  private updateScuttle(context: EnemyContext): void {
    const playerX = context.player.x + context.player.w / 2;
    const centerX = this.x + this.w / 2;
    const dx = playerX - centerX;
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.grounded && !this.hasGroundAhead(context)) this.facing = this.facing === 1 ? -1 : 1;
    const hop = Math.sin(this.actionTime * 10.5);
    this.vx = this.facing * BALANCE.kagenoko.scuttleSpeed * (0.86 + Math.abs(hop) * 0.22);

    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (distance <= BALANCE.kagenoko.attackRange && this.cooldown <= 0) {
      this.stateTime = 0;
      this.pounceHit = false;
      this.orbReleased = false;
      if ((this.attackCycle++ & 1) === 0) {
        this.state = 'sink';
        this.vx = 0;
      } else {
        this.state = 'orbCharge';
        this.vx = 0;
      }
    }
  }

  private beginPounce(context: EnemyContext): void {
    const playerX = context.player.x + context.player.w / 2;
    const centerX = this.x + this.w / 2;
    this.facing = playerX >= centerX ? 1 : -1;
    this.state = 'pounce';
    this.stateTime = 0;
    this.pounceHit = false;
    this.grounded = false;
    this.vx = this.facing * BALANCE.kagenoko.pounceSpeed;
    this.vy = -BALANCE.kagenoko.pounceLift;
  }

  private updatePounce(context: EnemyContext): void {
    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (!this.pounceHit && intersects(this, context.player)) {
      const hit = context.hurtPlayer(BALANCE.kagenoko.pounceDamage, this.x + this.w / 2);
      if (hit) context.blindPlayer(BALANCE.kagenoko.pounceBlindDuration);
      this.pounceHit = true;
    }

    if (this.stateTime >= BALANCE.kagenoko.pounceDuration || (this.grounded && this.stateTime > 0.24)) {
      this.beginRecover();
    }
  }

  private spawnShadowOrbs(context: EnemyContext): void {
    const sx = this.x + this.w / 2;
    const sy = this.y + 8;
    const tx = context.player.x + context.player.w / 2;
    const ty = context.player.y + context.player.h / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const baseVx = (dx / distance) * BALANCE.kagenoko.orbSpeed;
    const baseVy = (dy / distance) * BALANCE.kagenoko.orbSpeed;

    for (const offset of [-0.34, 0.34]) {
      this.orbs.push({
        x: sx - 5,
        y: sy - 5,
        vx: baseVx + offset,
        vy: baseVy - offset * 0.35,
        life: BALANCE.kagenoko.orbLife,
        phase: Math.random() * Math.PI * 2,
        alive: true,
      });
    }
  }

  private updateOrbs(dt: number, context: EnemyContext): void {
    const tx = context.player.x + context.player.w / 2;
    const ty = context.player.y + context.player.h / 2;
    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      orb.life -= dt;
      orb.phase += dt * 9;
      if (orb.life <= 0) {
        orb.alive = false;
        continue;
      }

      const dx = tx - (orb.x + 5);
      const dy = ty - (orb.y + 5);
      const distance = Math.max(1, Math.hypot(dx, dy));
      orb.vx += (dx / distance) * BALANCE.kagenoko.orbHoming * dt * 60;
      orb.vy += (dy / distance) * BALANCE.kagenoko.orbHoming * dt * 60;
      const speed = Math.max(0.1, Math.hypot(orb.vx, orb.vy));
      const maxSpeed = BALANCE.kagenoko.orbSpeed * 1.22;
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        orb.vx *= scale;
        orb.vy *= scale;
      }
      orb.x += orb.vx;
      orb.y += orb.vy;

      if (intersects({ x: orb.x, y: orb.y, w: 10, h: 10 }, context.player)) {
        const hit = context.hurtPlayer(BALANCE.kagenoko.orbDamage, orb.x + 5);
        if (hit) context.blindPlayer(BALANCE.kagenoko.orbBlindDuration);
        orb.alive = false;
      }
    }

    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      if (!this.orbs[i]!.alive) this.orbs.splice(i, 1);
    }
  }

  private beginRecover(): void {
    this.state = 'recover';
    this.stateTime = 0;
    this.vx *= 0.3;
  }

  private hasGroundAhead(context: EnemyContext): boolean {
    const probeX = this.facing > 0 ? this.x + this.w + 5 : this.x - 5;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x && probeX <= platform.x + platform.w &&
      platform.y >= footY - 5 && platform.y <= footY + 15
    );
  }

  private updateBlink(dt: number): void {
    this.blinkTimer -= dt;
    if (this.blink > 0) {
      this.blink = Math.max(0, this.blink - dt);
      return;
    }
    if (this.blinkTimer <= 0) {
      this.blink = 0.11;
      this.blinkTimer = 0.8 + Math.random() * 2.1;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.w / 2;
    const footY = this.y + this.h;
    const bob = this.state === 'scuttle' ? Math.sin(this.actionTime * 10.5) * 1.4 : 0;
    const sinkP = this.state === 'sink' ? Math.min(1, this.stateTime / BALANCE.kagenoko.sinkDuration) : 0;
    const pounceStretch = this.state === 'pounce' ? 1.14 : 1;
    const squash = 1 - sinkP * 0.62;

    ctx.save();
    ctx.globalAlpha = 0.34 + sinkP * 0.34;
    ctx.fillStyle = '#120d22';
    ctx.beginPath();
    ctx.ellipse(cx, footY + 1, 15 + sinkP * 6, 4 - sinkP * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (sinkP >= 0.93) {
      ctx.save();
      ctx.strokeStyle = '#7a5bb4';
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(cx, footY, 19, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      this.drawOrbs(ctx);
      return;
    }

    ctx.save();
    ctx.translate(cx, footY - 14 + bob + sinkP * 10);
    ctx.scale(this.facing, 1);
    ctx.scale(1 / pounceStretch, squash * pounceStretch);

    // Tiny shadow-child body.
    const bodyGlow = ctx.createRadialGradient(-2, -5, 1, 0, 0, 18);
    bodyGlow.addColorStop(0, '#56417d');
    bodyGlow.addColorStop(0.55, '#2c2245');
    bodyGlow.addColorStop(1, '#151122');
    ctx.fillStyle = bodyGlow;
    ctx.beginPath();
    ctx.ellipse(0, 3, 11, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mushroom-like shadow cap: the name Kagenoko is reflected in the silhouette.
    ctx.fillStyle = '#392b59';
    ctx.beginPath();
    ctx.moveTo(-13, -5);
    ctx.quadraticCurveTo(-8, -17, 0, -18);
    ctx.quadraticCurveTo(9, -17, 14, -5);
    ctx.quadraticCurveTo(7, -8, 0, -7);
    ctx.quadraticCurveTo(-7, -8, -13, -5);
    ctx.fill();
    ctx.fillStyle = '#7656a2';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(-4, -12, 3.2, 1.6, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Little tail made of shadow smoke.
    ctx.strokeStyle = '#31234d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-16, 9, -14, 14);
    ctx.stroke();

    // Cute face; blink is a real animation rather than a static icon.
    ctx.fillStyle = '#f5e9c8';
    if (this.blink > 0) {
      ctx.fillRect(-6, -1, 4, 1.5);
      ctx.fillRect(3, -1, 4, 1.5);
    } else {
      ctx.beginPath();
      ctx.ellipse(-4, -1, 2.4, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(5, -1, 2.4, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b275d';
      ctx.beginPath();
      ctx.arc(-3.5, -0.5, 0.9, 0, Math.PI * 2);
      ctx.arc(5.5, -0.5, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#d8b9ef';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0.5, 4.5, 3, 0.15, Math.PI - 0.15);
    ctx.stroke();

    if (this.state === 'orbCharge') {
      const p = Math.min(1, this.stateTime / BALANCE.kagenoko.orbChargeDuration);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(188, 121, 255, ${0.2 + p * 0.55})`;
      ctx.beginPath();
      ctx.arc(12, 2, 4 + p * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.drawOrbs(ctx);
  }

  private drawOrbs(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.orbs) {
      const x = orb.x + 5;
      const y = orb.y + 5;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = '#4c2c72';
      ctx.beginPath();
      ctx.arc(x - orb.vx * 2, y - orb.vy * 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = '#a567d3';
      ctx.beginPath();
      ctx.arc(x, y, 5.5 + Math.sin(orb.phase) * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#f1d7ff';
      ctx.beginPath();
      ctx.arc(x - 1.2, y - 1.4, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
