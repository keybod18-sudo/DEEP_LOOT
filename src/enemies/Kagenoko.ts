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
    const bob = this.state === 'scuttle' ? Math.sin(this.actionTime * 10.5) * 1.5 : 0;
    const sinkP = this.state === 'sink' ? Math.min(1, this.stateTime / BALANCE.kagenoko.sinkDuration) : 0;
    const pounceStretch = this.state === 'pounce' ? 1.16 : 1;
    const squash = 1 - sinkP * 0.62;

    ctx.save();
    ctx.globalAlpha = 0.28 + sinkP * 0.42;
    const pool = ctx.createRadialGradient(cx, footY + 2, 1, cx, footY + 2, 20 + sinkP * 10);
    pool.addColorStop(0, 'rgba(63, 35, 102, 0.55)');
    pool.addColorStop(0.45, 'rgba(27, 17, 44, 0.6)');
    pool.addColorStop(1, 'rgba(10, 6, 16, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(cx, footY + 2, 16 + sinkP * 9, 5 - sinkP * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (sinkP >= 0.94) {
      ctx.save();
      ctx.strokeStyle = 'rgba(147, 112, 221, 0.48)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, footY + 1, 20, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      this.drawOrbs(ctx);
      return;
    }

    ctx.save();
    ctx.translate(cx, footY - 14 + bob + sinkP * 10);
    ctx.scale(this.facing, 1);
    ctx.scale(1 / pounceStretch, squash * pounceStretch);

    // Purple back-glow for a cute shadow-creature silhouette.
    ctx.globalAlpha = 0.35;
    const aura = ctx.createRadialGradient(0, -4, 4, 0, -4, 22);
    aura.addColorStop(0, '#8a6bff');
    aura.addColorStop(0.42, '#4f2d83');
    aura.addColorStop(1, 'rgba(20, 10, 35, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, -2, 18, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Limbs first so the head/body sit over them.
    ctx.strokeStyle = '#2f183f';
    ctx.lineWidth = 4.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7, 9);
    ctx.quadraticCurveTo(-15, 10, -16, 17);
    ctx.moveTo(8, 9);
    ctx.quadraticCurveTo(16, 10, 17, 17);
    ctx.moveTo(-4, 18);
    ctx.quadraticCurveTo(-10, 24, -16, 25);
    ctx.moveTo(4, 18);
    ctx.quadraticCurveTo(10, 24, 16, 25);
    ctx.stroke();

    ctx.strokeStyle = '#453173';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, 9);
    ctx.quadraticCurveTo(-13, 10, -14, 16);
    ctx.moveTo(7, 9);
    ctx.quadraticCurveTo(14, 10, 15, 16);
    ctx.stroke();

    // Slender shadow body with slight purple tint, inspired by the references.
    const bodyGrad = ctx.createLinearGradient(0, -2, 0, 21);
    bodyGrad.addColorStop(0, '#2b1d46');
    bodyGrad.addColorStop(0.42, '#1b1726');
    bodyGrad.addColorStop(1, '#090b12');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.quadraticCurveTo(-11, 8, -9, 18);
    ctx.quadraticCurveTo(0, 22, 9, 18);
    ctx.quadraticCurveTo(11, 8, 7, 1);
    ctx.quadraticCurveTo(0, -1, -7, 1);
    ctx.fill();

    // Chest gem / purple belly accent from the second reference.
    ctx.fillStyle = '#d24a9d';
    ctx.beginPath();
    ctx.ellipse(0, 6, 2.6, 2.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 214, 239, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-0.6, 5.4, 0.8, 1.1, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Oversized head.
    const headGrad = ctx.createRadialGradient(-2, -12, 1, 0, -10, 19);
    headGrad.addColorStop(0, '#253246');
    headGrad.addColorStop(0.36, '#17212f');
    headGrad.addColorStop(0.68, '#10131d');
    headGrad.addColorStop(1, '#07090f');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -10, 15.2, 15.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left curled antenna-ear.
    ctx.strokeStyle = '#342144';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-8, -22);
    ctx.quadraticCurveTo(-16, -31, -18, -22);
    ctx.quadraticCurveTo(-15, -16, -8.5, -17);
    ctx.stroke();
    ctx.strokeStyle = '#566989';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -22);
    ctx.quadraticCurveTo(-15, -29, -17, -22);
    ctx.quadraticCurveTo(-14, -18, -9.5, -18.2);
    ctx.stroke();

    // Right tall pointed ear.
    ctx.fillStyle = '#11151f';
    ctx.beginPath();
    ctx.moveTo(7, -20);
    ctx.lineTo(12, -35);
    ctx.lineTo(18, -20);
    ctx.quadraticCurveTo(14, -17, 8, -18);
    ctx.fill();
    ctx.strokeStyle = '#4b688b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(9.3, -20.4);
    ctx.lineTo(12.1, -29.4);
    ctx.lineTo(15.3, -20.5);
    ctx.stroke();

    // Subtle purple underside on the head.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#5b2a79';
    ctx.beginPath();
    ctx.ellipse(0, -2, 10.5, 5.8, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Face / glowing eyes.
    if (this.blink > 0) {
      ctx.strokeStyle = '#ffe672';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-7.5, -10.5);
      ctx.lineTo(-3.2, -10.5);
      ctx.moveTo(3.1, -10.1);
      ctx.lineTo(8.1, -10.1);
      ctx.stroke();
    } else {
      ctx.shadowColor = 'rgba(255, 222, 62, 0.95)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd400';
      ctx.beginPath();
      ctx.ellipse(-5.3, -9.2, 3.1, 4.2, -0.45, 0, Math.PI * 2);
      ctx.ellipse(5.8, -8.7, 3.8, 4.9, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = 'rgba(255, 249, 190, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-6.1, -10.2, 0.8, 1.1, -0.3, 0, Math.PI * 2);
      ctx.ellipse(4.7, -9.8, 1.0, 1.3, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny mouth.
    ctx.strokeStyle = 'rgba(215, 189, 255, 0.8)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0.5, -2.2, 2.2, 0.2, Math.PI - 0.18);
    ctx.stroke();

    // Outline to make the silhouette cleaner and less flat.
    ctx.strokeStyle = '#43304f';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, -10, 15.2, 15.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.quadraticCurveTo(-11, 8, -9, 18);
    ctx.quadraticCurveTo(0, 22, 9, 18);
    ctx.quadraticCurveTo(11, 8, 7, 1);
    ctx.quadraticCurveTo(0, -1, -7, 1);
    ctx.stroke();

    if (this.state === 'orbCharge') {
      const p = Math.min(1, this.stateTime / BALANCE.kagenoko.orbChargeDuration);
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(193, 114, 255, ${0.28 + p * 0.58})`;
      ctx.beginPath();
      ctx.arc(13, 2, 4 + p * 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 238, 255, ${0.3 + p * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(13, 2, 2 + p * 4.2, 0, Math.PI * 2);
      ctx.stroke();
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
