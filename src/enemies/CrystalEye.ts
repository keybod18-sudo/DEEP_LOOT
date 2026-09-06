import { BALANCE } from '../config/balance';
import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type CrystalEyeState = 'hover' | 'beamCharge' | 'beamFire' | 'orbCharge' | 'recover';

interface CrystalOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  alive: boolean;
  phase: number;
}

const crystalEyeFrameUrls = Array.from({ length: 8 }, (_, index) =>
  new URL(`../../assets/monsters/crystal_eye/idle_${String(index + 1).padStart(2, '0')}.png`, import.meta.url).href,
);

export class CrystalEye extends Enemy {
  readonly type = 'crystalEye' as const;
  state: CrystalEyeState = 'hover';
  stateTime = 0;
  targetX = 0;
  targetY = 0;
  beamHit = false;
  private attackCycle = 0;
  private readonly orbs: CrystalOrb[] = [];
  private static readonly frames: HTMLImageElement[] = [];

  constructor(x: number, y: number) {
    super(x, y, 46, 82, BALANCE.crystalEye.maxHp, BALANCE.crystalEye.maxHp);
    this.cooldown = 0.8 + Math.random() * 0.6;
    this.facing = Math.random() < 0.5 ? -1 : 1;
  }

  static async loadAssets(): Promise<void> {
    if (this.frames.length > 0) return;
    const loaded = await Promise.all(crystalEyeFrameUrls.map(loadImage));
    this.frames.push(...loaded);
  }

  interruptForKnockback(): void {
    this.state = 'hover';
    this.stateTime = 0;
    this.beamHit = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'hover';
    this.stateTime = 0;
    this.cooldown = Math.max(this.cooldown, 0.7);
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.updateOrbs(dt, context);
    this.stateTime += dt;

    if (this.state === 'beamCharge') {
      this.vx *= 0.88;
      this.vy *= 0.88;
      if (this.stateTime >= BALANCE.crystalEye.beamCharge) this.beginBeamFire();
      return;
    }

    if (this.state === 'beamFire') {
      this.vx *= 0.76;
      this.vy *= 0.76;
      if (!this.beamHit) {
        this.beamHit = true;
        this.resolveBeamHit(context);
      }
      if (this.stateTime >= BALANCE.crystalEye.beamDuration) this.beginRecover();
      return;
    }

    if (this.state === 'orbCharge') {
      this.vx *= 0.86;
      this.vy *= 0.86;
      if (this.stateTime >= BALANCE.crystalEye.orbCharge) {
        this.spawnOrb(context);
        this.beginRecover();
      }
      return;
    }

    if (this.state === 'recover') {
      this.vx *= 0.92;
      this.vy *= 0.92;
      if (this.stateTime >= BALANCE.crystalEye.recoverDuration) {
        this.state = 'hover';
        this.stateTime = 0;
        this.cooldown = BALANCE.crystalEye.attackCooldown;
      }
      return;
    }

    this.updateHover(context);
  }

  private updateHover(context: EnemyContext): void {
    const playerX = context.player.x + context.player.w / 2;
    const playerY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerX - centerX;
    const dy = playerY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));

    this.facing = dx >= 0 ? 1 : -1;
    const desiredDistance = BALANCE.crystalEye.hoverRange;
    const toward = distance > desiredDistance ? 1 : distance < desiredDistance * 0.64 ? -0.65 : 0;
    const orbit = Math.sin(this.actionTime * 1.8) * 0.42;
    this.vx += ((dx / distance) * BALANCE.crystalEye.hoverSpeed * toward + orbit - this.vx) * 0.08;
    this.vy += (((dy / distance) * BALANCE.crystalEye.hoverSpeed * 0.7 * toward) + Math.sin(this.actionTime * 3.2) * 0.32 - this.vy) * 0.07;
    this.x += this.vx;
    this.y += this.vy;
    this.keepInStage(context);

    if (distance <= BALANCE.crystalEye.attackRange && this.cooldown <= 0) {
      this.targetX = playerX;
      this.targetY = playerY;
      this.stateTime = 0;
      this.beamHit = false;
      if ((this.attackCycle++ & 1) === 0) {
        this.state = 'beamCharge';
      } else {
        this.state = 'orbCharge';
      }
    }
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
      x: sx - 7,
      y: sy - 7,
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

      const cx = orb.x + 7;
      const cy = orb.y + 7;
      const dx = targetX - cx;
      const dy = targetY - cy;
      const distance = Math.max(1, Math.hypot(dx, dy));
      orb.vx += (dx / distance) * BALANCE.crystalEye.orbHoming * dt * 60;
      orb.vy += (dy / distance) * BALANCE.crystalEye.orbHoming * dt * 60;
      const speed = Math.max(0.1, Math.hypot(orb.vx, orb.vy));
      if (speed > BALANCE.crystalEye.orbSpeed * 1.16) {
        const scale = (BALANCE.crystalEye.orbSpeed * 1.16) / speed;
        orb.vx *= scale;
        orb.vy *= scale;
      }
      orb.x += orb.vx;
      orb.y += orb.vy;
      orb.phase += dt * 8;

      if (intersects({ x: orb.x, y: orb.y, w: 14, h: 14 }, context.player)) {
        const hit = context.hurtPlayer(BALANCE.crystalEye.orbDamage, orb.x + 7);
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

  private keepInStage(context: EnemyContext): void {
    const maxX = Math.max(0, context.stage.width - this.w);
    const maxY = Math.max(70, context.stage.height - this.h - 80);
    if (this.x < 0 || this.x > maxX) {
      this.x = Math.max(0, Math.min(maxX, this.x));
      this.vx *= -0.72;
    }
    if (this.y < 55 || this.y > maxY) {
      this.y = Math.max(55, Math.min(maxY, this.y));
      this.vy *= -0.72;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const frame = CrystalEye.frames[Math.floor(this.actionTime * 6) % Math.max(1, CrystalEye.frames.length)];
    if (!frame) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const bob = Math.sin(this.actionTime * 3.4) * 2.3;
    const pulse = 1 + Math.sin(this.actionTime * 5.1) * 0.018;
    const attackGlow = this.state === 'beamCharge' || this.state === 'orbCharge' ? Math.min(1, this.stateTime * 1.5) : 0;

    ctx.save();
    ctx.translate(centerX, centerY + bob);
    ctx.scale(pulse, 1 / pulse);
    ctx.globalAlpha = 0.96;
    const drawH = 96;
    const drawW = Math.round(drawH * (frame.naturalWidth / frame.naturalHeight));
    ctx.drawImage(frame, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18 + attackGlow * 0.22;
    ctx.strokeStyle = '#9fdcff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(18, -8);
    ctx.lineTo(3, 43);
    ctx.lineTo(-18, 7);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    if (this.state === 'beamCharge') this.drawBeamCharge(ctx, centerX, centerY + bob);
    if (this.state === 'beamFire') this.drawBeam(ctx, centerX, centerY + bob);
    if (this.state === 'orbCharge') this.drawOrbCharge(ctx, centerX, centerY + bob);
    this.drawOrbs(ctx);
  }

  private drawBeamCharge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const p = Math.min(1, this.stateTime / BALANCE.crystalEye.beamCharge);
    const radius = 8 + p * 17;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = '#d7a2ff';
    ctx.lineWidth = 2 + p * 2;
    ctx.globalAlpha = 0.32 + p * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffb9ff';
    ctx.globalAlpha = 0.4 + p * 0.5;
    ctx.beginPath();
    ctx.arc(x, y, 3 + p * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBeam(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const life = 1 - Math.min(1, this.stateTime / BALANCE.crystalEye.beamDuration);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.42 + life * 0.38;
    ctx.strokeStyle = '#7d38ff';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.stroke();
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = '#d35cff';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.strokeStyle = '#fff3ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawOrbCharge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const p = Math.min(1, this.stateTime / BALANCE.crystalEye.orbCharge);
    const ox = x + this.facing * (18 + p * 8);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i === 2 ? '#ffffff' : i === 1 ? '#e267ff' : '#7c2fff';
      ctx.globalAlpha = 0.28 + i * 0.18;
      ctx.beginPath();
      ctx.arc(ox, y, 13 - i * 4 + p * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawOrbs(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.orbs) {
      const cx = orb.x + 7;
      const cy = orb.y + 7;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#6f1dff';
      ctx.beginPath();
      ctx.arc(cx - orb.vx * 2.6, cy - orb.vy * 2.6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.48;
      ctx.fillStyle = '#ac45ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + Math.sin(orb.phase) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = '#fff1ff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function pointSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const wx = px - x1;
  const wy = py - y1;
  const len2 = vx * vx + vy * vy;
  if (len2 <= 0.0001) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const cx = x1 + vx * t;
  const cy = y1 + vy * t;
  return Math.hypot(px - cx, py - cy);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = src;
  });
}
