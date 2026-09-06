import { BALANCE } from '../config/balance';
import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type CrystalEyeState = 'idle' | 'beamCharge' | 'beamFire' | 'orbCharge' | 'recover';

interface CrystalOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  alive: boolean;
  phase: number;
}

export class CrystalEye extends Enemy {
  readonly type = 'crystalEye' as const;
  state: CrystalEyeState = 'idle';
  stateTime = 0;
  targetX = 0;
  targetY = 0;
  beamHit = false;

  private readonly anchorX: number;
  private readonly anchorY: number;
  private attackCycle = 0;
  private lookX = 0;
  private lookY = 0;
  private readonly orbs: CrystalOrb[] = [];

  constructor(x: number, y: number) {
    super(x, y, 60, 104, BALANCE.crystalEye.maxHp, BALANCE.crystalEye.maxHp);
    this.anchorX = x;
    this.anchorY = y;
    this.cooldown = 0.8 + Math.random() * 0.6;
  }

  static async loadAssets(): Promise<void> {
    // V38 draws the translucent crystal and organic eyeball directly.
    // Old robot-containing Crystal Eye sprite files are intentionally unused.
  }

  interruptForKnockback(): void {
    this.knockbackTime = 0;
    this.vx = 0;
    this.vy = 0;
    this.x = this.anchorX;
    this.y = this.anchorY;
    this.state = 'idle';
    this.stateTime = 0;
    this.beamHit = false;
  }

  protected onKnockbackEnd(): void {
    this.knockbackTime = 0;
    this.vx = 0;
    this.vy = 0;
    this.x = this.anchorX;
    this.y = this.anchorY;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    // Crystal Eye is a fixed turret. It never translates, even after knockback.
    this.x = this.anchorX;
    this.y = this.anchorY;
    this.vx = 0;
    this.vy = 0;
    this.knockbackTime = 0;

    this.updateEyeTracking(context);
    this.updateOrbs(dt, context);
    this.stateTime += dt;

    const playerX = context.player.x + context.player.w / 2;
    const playerY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const distance = Math.hypot(playerX - centerX, playerY - centerY);

    if (this.state === 'beamCharge') {
      // The eye follows the player while charging. The beam locks at release.
      this.targetX = playerX;
      this.targetY = playerY;
      if (this.stateTime >= BALANCE.crystalEye.beamCharge) this.beginBeamFire();
      return;
    }

    if (this.state === 'beamFire') {
      if (!this.beamHit) {
        this.beamHit = true;
        this.resolveBeamHit(context);
      }
      if (this.stateTime >= BALANCE.crystalEye.beamDuration) this.beginRecover();
      return;
    }

    if (this.state === 'orbCharge') {
      this.targetX = playerX;
      this.targetY = playerY;
      if (this.stateTime >= BALANCE.crystalEye.orbCharge) {
        this.spawnOrb(context);
        this.beginRecover();
      }
      return;
    }

    if (this.state === 'recover') {
      if (this.stateTime >= BALANCE.crystalEye.recoverDuration) {
        this.state = 'idle';
        this.stateTime = 0;
        this.cooldown = BALANCE.crystalEye.attackCooldown;
      }
      return;
    }

    if (distance <= BALANCE.crystalEye.attackRange && this.cooldown <= 0) {
      this.targetX = playerX;
      this.targetY = playerY;
      this.stateTime = 0;
      this.beamHit = false;
      this.state = (this.attackCycle++ & 1) === 0 ? 'beamCharge' : 'orbCharge';
    }
  }

  private updateEyeTracking(context: EnemyContext): void {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const playerX = context.player.x + context.player.w / 2;
    const playerY = context.player.y + context.player.h / 2;
    const dx = playerX - centerX;
    const dy = playerY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));

    const desiredX = (dx / distance) * 7.2;
    const desiredY = (dy / distance) * 5.0;
    this.lookX += (desiredX - this.lookX) * 0.16;
    this.lookY += (desiredY - this.lookY) * 0.16;
    this.facing = dx >= 0 ? 1 : -1;
  }

  private beginBeamFire(): void {
    this.state = 'beamFire';
    this.stateTime = 0;
    this.beamHit = false;
  }

  private beginRecover(): void {
    this.state = 'recover';
    this.stateTime = 0;
  }

  private resolveBeamHit(context: EnemyContext): void {
    const sx = this.x + this.w / 2;
    const sy = this.y + this.h / 2;
    const px = context.player.x + context.player.w / 2;
    const py = context.player.y + context.player.h / 2;
    const distance = pointSegmentDistance(px, py, sx, sy, this.targetX, this.targetY);
    if (distance > BALANCE.crystalEye.beamRadius + Math.max(context.player.w, context.player.h) * 0.36) return;

    const hit = context.hurtPlayer(BALANCE.crystalEye.beamDamage, sx);
    if (hit) this.applyOneRandomStatus(context);
  }

  private spawnOrb(context: EnemyContext): void {
    const sx = this.x + this.w / 2;
    const sy = this.y + this.h / 2;
    const tx = context.player.x + context.player.w / 2;
    const ty = context.player.y + context.player.h / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.max(1, Math.hypot(dx, dy));

    this.orbs.push({
      x: sx - 8,
      y: sy - 8,
      vx: (dx / distance) * BALANCE.crystalEye.orbSpeed,
      vy: (dy / distance) * BALANCE.crystalEye.orbSpeed,
      life: BALANCE.crystalEye.orbLife,
      alive: true,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private updateOrbs(dt: number, context: EnemyContext): void {
    const targetX = context.player.x + context.player.w / 2;
    const targetY = context.player.y + context.player.h / 2;

    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      orb.life -= dt;
      if (orb.life <= 0) {
        orb.alive = false;
        continue;
      }

      const cx = orb.x + 8;
      const cy = orb.y + 8;
      const dx = targetX - cx;
      const dy = targetY - cy;
      const distance = Math.max(1, Math.hypot(dx, dy));
      orb.vx += (dx / distance) * BALANCE.crystalEye.orbHoming * dt * 60;
      orb.vy += (dy / distance) * BALANCE.crystalEye.orbHoming * dt * 60;
      const speed = Math.max(0.1, Math.hypot(orb.vx, orb.vy));
      const maxSpeed = BALANCE.crystalEye.orbSpeed * 1.16;
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        orb.vx *= scale;
        orb.vy *= scale;
      }

      orb.x += orb.vx;
      orb.y += orb.vy;
      orb.phase += dt * 8;

      if (intersects({ x: orb.x, y: orb.y, w: 16, h: 16 }, context.player)) {
        const hit = context.hurtPlayer(BALANCE.crystalEye.orbDamage, orb.x + 8);
        if (hit) this.applyOneRandomStatus(context);
        orb.alive = false;
      }
    }

    for (let i = this.orbs.length - 1; i >= 0; i -= 1) {
      if (!this.orbs[i]!.alive) this.orbs.splice(i, 1);
    }
  }

  private applyOneRandomStatus(context: EnemyContext): void {
    switch (Math.floor(Math.random() * 8)) {
      case 0:
        context.slowPlayer(BALANCE.caterpillar.slowDuration);
        break;
      case 1:
        context.paralyzePlayer(BALANCE.caterpillar.paralysisDuration);
        break;
      case 2:
        context.poisonPlayer(
          BALANCE.caterpillar.poisonDuration,
          BALANCE.caterpillar.poisonTickInterval,
          BALANCE.caterpillar.poisonDamage,
        );
        break;
      case 3:
        context.sealPlayer(BALANCE.caterpillar.sealDuration);
        break;
      case 4:
        context.silencePlayer(BALANCE.caterpillar.silenceDuration);
        break;
      case 5:
        context.blindPlayer(BALANCE.caterpillar.blindDuration);
        break;
      case 6:
        context.sleepPlayer(BALANCE.caterpillar.sleepDuration);
        break;
      default:
        context.freezePlayer(Math.max(2, Math.min(3, BALANCE.frostMite.shardFreezeDuration)));
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const charge = this.state === 'beamCharge' || this.state === 'orbCharge'
      ? Math.min(1, this.stateTime / Math.max(0.01, this.state === 'beamCharge' ? BALANCE.crystalEye.beamCharge : BALANCE.crystalEye.orbCharge))
      : 0;

    this.drawOrganicEye(ctx, centerX, centerY, charge);
    this.drawCrystalShell(ctx, centerX, centerY, charge);

    if (this.state === 'beamCharge') this.drawBeamCharge(ctx, centerX, centerY);
    if (this.state === 'beamFire') this.drawBeam(ctx, centerX, centerY);
    if (this.state === 'orbCharge') this.drawOrbCharge(ctx, centerX, centerY);
    this.drawOrbs(ctx);
  }

  private drawOrganicEye(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, charge: number): void {
    const pulse = 1 + Math.sin(this.actionTime * 2.7) * 0.014;
    ctx.save();
    ctx.translate(centerX, centerY + 2);
    ctx.scale(pulse, 1 / pulse);

    // Fleshy socket behind the eyeball. The crystal shell is not touched by V39.
    ctx.fillStyle = '#3a112c';
    ctx.beginPath();
    ctx.ellipse(0, 1, 30.5, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 32, 82, 0.82)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 1, 29, 23.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    const sclera = ctx.createRadialGradient(-8, -8, 2, 1, 1, 31);
    sclera.addColorStop(0, '#fffdf2');
    sclera.addColorStop(0.55, '#e5dfcf');
    sclera.addColorStop(0.82, '#b9a8a0');
    sclera.addColorStop(1, '#765765');
    ctx.fillStyle = sclera;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27.5, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bloodshot veins, closer to the reference eye: thin, branching and irregular.
    ctx.strokeStyle = 'rgba(151, 33, 62, 0.74)';
    ctx.lineWidth = 1.05;
    for (let i = 0; i < 11; i += 1) {
      const angle = i * (Math.PI * 2 / 11) + 0.18;
      const ex = Math.cos(angle) * 25.5;
      const ey = Math.sin(angle) * 19.5;
      const mx = Math.cos(angle + (i % 2 ? 0.26 : -0.24)) * 16;
      const my = Math.sin(angle + (i % 2 ? 0.26 : -0.24)) * 12;
      const tx = this.lookX * 0.42 + Math.cos(angle) * 8;
      const ty = this.lookY * 0.34 + Math.sin(angle) * 6;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();
      if ((i % 3) === 0) {
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + Math.cos(angle + 0.9) * 5, my + Math.sin(angle + 0.9) * 4);
        ctx.stroke();
      }
    }

    const irisX = this.lookX;
    const irisY = this.lookY;
    const irisGlow = ctx.createRadialGradient(irisX, irisY, 1, irisX, irisY, 15);
    irisGlow.addColorStop(0, charge > 0 ? '#fff0ff' : '#ffb7ed');
    irisGlow.addColorStop(0.25, '#f05bd0');
    irisGlow.addColorStop(0.58, '#a82aac');
    irisGlow.addColorStop(1, 'rgba(63, 15, 76, 0)');
    ctx.fillStyle = irisGlow;
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, 11.5, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tall magenta iris and a narrow vertical pupil, matching the requested eye feel.
    ctx.fillStyle = charge > 0 ? '#ff75e9' : '#d83ac4';
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, 7.4, 14.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6f1b7d';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#120813';
    ctx.beginPath();
    ctx.ellipse(irisX, irisY, 2.25, 10.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(irisX - 3.7, irisY - 6.2, 1.8, 3.1, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = 'rgba(80, 31, 55, 0.88)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27.5, 22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawCrystalShell(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, charge: number): void {
    ctx.save();
    ctx.translate(centerX, centerY);

    const outer = [
      [0, -66], [31, -35], [42, 12], [24, 56], [0, 69], [-27, 55], [-42, 11], [-32, -36],
    ] as const;

    const glass = ctx.createLinearGradient(-42, -60, 42, 62);
    glass.addColorStop(0, 'rgba(135, 205, 255, 0.12)');
    glass.addColorStop(0.34, 'rgba(95, 85, 255, 0.23)');
    glass.addColorStop(0.66, 'rgba(83, 54, 200, 0.17)');
    glass.addColorStop(1, 'rgba(180, 225, 255, 0.13)');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(outer[0][0], outer[0][1]);
    for (let i = 1; i < outer.length; i += 1) ctx.lineTo(outer[i][0], outer[i][1]);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = charge > 0 ? `rgba(225, 192, 255, ${0.78 + charge * 0.2})` : 'rgba(165, 193, 255, 0.78)';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Facets: deliberately sparse so the eyeball remains clearly visible through the glass.
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = 'rgba(166, 205, 255, 0.48)';
    const facets: ReadonlyArray<readonly [number, number, number, number]> = [
      [0, -66, -18, -15], [0, -66, 18, -16], [-32, -36, -18, -15], [31, -35, 18, -16],
      [-42, 11, -20, 17], [42, 12, 20, 17], [-27, 55, -19, 18], [24, 56, 19, 18],
      [-18, -15, 0, -28], [18, -16, 0, -28], [-20, 17, 0, 30], [20, 17, 0, 30],
      [0, 30, 0, 69],
    ];
    for (const [x1, y1, x2, y2] of facets) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const shimmer = Math.sin(this.actionTime * 3.6) * 0.5 + 0.5;
    ctx.globalAlpha = 0.35 + shimmer * 0.45 + charge * 0.18;
    ctx.fillStyle = '#e9f8ff';
    const sparkleX = -21 + shimmer * 12;
    const sparkleY = -43 + Math.cos(this.actionTime * 2.8) * 4;
    ctx.fillRect(Math.round(sparkleX) - 1, Math.round(sparkleY) - 6, 2, 13);
    ctx.fillRect(Math.round(sparkleX) - 6, Math.round(sparkleY) - 1, 13, 2);

    ctx.restore();
  }

  private drawBeamCharge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const p = Math.min(1, this.stateTime / Math.max(0.01, BALANCE.crystalEye.beamCharge));
    const radius = 8 + p * 18;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = `rgba(225, 125, 255, ${0.4 + p * 0.55})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + this.lookX, y + this.lookY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 220, 255, ${0.25 + p * 0.55})`;
    ctx.beginPath();
    ctx.arc(x + this.lookX, y + this.lookY, 3 + p * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeam(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(103, 32, 194, 0.48)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220, 80, 255, 0.92)';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#fff0ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawOrbCharge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const p = Math.min(1, this.stateTime / Math.max(0.01, BALANCE.crystalEye.orbCharge));
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, 18 + p * 10);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.3, 'rgba(224,122,255,0.88)');
    gradient.addColorStop(1, 'rgba(92,20,170,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 18 + p * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawOrbs(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.orbs) {
      const x = orb.x + 8;
      const y = orb.y + 8;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const radius = 9 + Math.sin(orb.phase) * 1.4;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, radius * 2.2);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.24, '#ec9dff');
      glow.addColorStop(0.58, 'rgba(153, 51, 235, 0.75)');
      glow.addColorStop(1, 'rgba(70, 14, 136, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  if (lengthSq <= 0.0001) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSq));
  const x = ax + abx * t;
  const y = ay + aby * t;
  return Math.hypot(px - x, py - y);
}
