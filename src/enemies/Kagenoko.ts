import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

const kagenokoFrameUrls = Array.from({ length: 8 }, (_, index) =>
  new URL(`../../assets/monsters/kagenoko/frame_${String(index + 1).padStart(2, '0')}.png`, import.meta.url).href,
);
const kagenokoFrameImages: HTMLImageElement[] = [];

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
  private scuttleDirection: -1 | 1 = 1;

  constructor(x: number, y: number) {
    super(x, y, 28, 28, BALANCE.kagenoko.maxHp, BALANCE.kagenoko.maxHp);
    this.cooldown = 0.7 + Math.random() * 0.7;
    const initialDirection: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
    this.facing = initialDirection;
    this.scuttleDirection = initialDirection;
  }

  static async loadAssets(): Promise<void> {
    if (kagenokoFrameImages.length > 0) return;
    kagenokoFrameImages.push(...await Promise.all(kagenokoFrameUrls.map(loadImage)));
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
    const desiredDirection: -1 | 1 = dx >= 0 ? 1 : -1;

    if (this.grounded) {
      if (!this.hasGroundAhead(context, this.scuttleDirection)) {
        this.scuttleDirection = this.scuttleDirection === 1 ? -1 : 1;
      } else if (
        desiredDirection !== this.scuttleDirection &&
        distance > 20 &&
        this.hasGroundAhead(context, desiredDirection)
      ) {
        this.scuttleDirection = desiredDirection;
      }
    }

    this.facing = this.scuttleDirection;
    const hop = Math.sin(this.actionTime * 10.5);
    this.vx = this.scuttleDirection * BALANCE.kagenoko.scuttleSpeed * (0.86 + Math.abs(hop) * 0.22);

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
    const direction: -1 | 1 = playerX >= centerX ? 1 : -1;
    this.facing = direction;
    this.scuttleDirection = direction;
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

  private hasGroundAhead(context: EnemyContext, direction: -1 | 1): boolean {
    const probeX = direction > 0 ? this.x + this.w + 5 : this.x - 5;
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
    let frameIndex = 0;

    if (this.state === 'scuttle') {
      // frame_03 is the canonical scuttle-facing frame.
      // Do not alternate frame_03/frame_04 because their baked orientation
      // can make Kagenoko appear to flip left/right while moving.
      frameIndex = 2;
    } else if (this.state === 'sink') {
      frameIndex = 4;
    } else if (this.state === 'pounce') {
      frameIndex = 7;
    } else if (this.state === 'orbCharge') {
      frameIndex = 6;
    } else if (this.state === 'recover') {
      frameIndex = this.stateTime < 0.18 ? 5 : (this.blink > 0 ? 1 : 0);
    } else {
      frameIndex = this.blink > 0 ? 1 : 0;
    }

    const image = kagenokoFrameImages[frameIndex] ?? kagenokoFrameImages[0];
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h;
    const bob = this.state === 'scuttle' ? Math.sin(this.actionTime * 10.5) * 1.2 : 0;
    const drawW = this.state === 'pounce' ? 68 : this.state === 'sink' ? 62 : 58;
    const drawH = this.state === 'pounce' ? 64 : this.state === 'sink' ? 58 : 62;
    const yShift = this.state === 'sink' ? 9 : 5;

    ctx.save();
    ctx.translate(centerX, footY + bob);
    ctx.scale(this.facing, 1);

    if (this.state === 'orbCharge') {
      const p = Math.min(1, this.stateTime / BALANCE.kagenoko.orbChargeDuration);
      ctx.shadowColor = 'rgba(180, 96, 255, 0.9)';
      ctx.shadowBlur = 5 + p * 9;
    }

    ctx.drawImage(image, -drawW / 2, -drawH + yShift, drawW, drawH);
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = src;
  });
}
