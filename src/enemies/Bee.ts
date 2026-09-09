import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type BeeState = 'fly' | 'windup' | 'sting' | 'recover';

const MAX_HP = 28;
const HOVER_SPEED = 2.05;
const STING_SPEED = 9.2;
const STING_DAMAGE = 8;
const STING_RANGE = 185;
const WINDUP_TIME = 0.18;
const STING_TIME = 0.34;
const RECOVER_TIME = 0.30;
const POISON_CHANCE = 0.55;
const POISON_DURATION = 4.8;
const POISON_INTERVAL = 1.0;
const POISON_DAMAGE = 2;
const DRAW_SIZE = 54;

const flyUrls = [1, 2, 3, 4].map((index) =>
  new URL(
    `../../assets/monsters/bee/fly_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const stingUrls = [1, 2].map((index) =>
  new URL(
    `../../assets/monsters/bee/sting_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);

const flyImages: HTMLImageElement[] = [];
const stingImages: HTMLImageElement[] = [];

export class Bee extends Enemy {
  readonly type = 'bee' as const;
  state: BeeState = 'fly';
  private stateTime = 0;
  private stingHit = false;
  private targetX = 0;
  private targetY = 0;
  private readonly orbitPhase = Math.random() * Math.PI * 2;
  private readonly hoverPhase = Math.random() * Math.PI * 2;
  private readonly strafeBias = (Math.random() * 2 - 1) * 0.95;
  private readonly preferredDistance = 92 + Math.random() * 42;
  private readonly hoverSpeedScale = 0.92 + Math.random() * 0.22;
  private readonly verticalBias = -28 - Math.random() * 24;
  private facingCandidate: -1 | 1 = 1;
  private facingCandidateTime = 0;

  constructor(x: number, y: number) {
    super(x, y, 24, 20, MAX_HP, MAX_HP);
    this.cooldown = 0.55 + Math.random() * 0.9;
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.facingCandidate = this.facing;
  }

  static async loadAssets(): Promise<void> {
    if (flyImages.length === 0) {
      flyImages.push(...await Promise.all(flyUrls.map(loadImage)));
    }
    if (stingImages.length === 0) {
      stingImages.push(...await Promise.all(stingUrls.map(loadImage)));
    }
  }

  interruptForKnockback(): void {
    this.state = 'fly';
    this.stateTime = 0;
    this.stingHit = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'fly';
    this.stateTime = 0;
    this.cooldown = Math.max(this.cooldown, 0.55 + Math.random() * 0.45);
    this.vy = 0;
  }

  protected updateUnaware(dt: number, context: EnemyContext): void {
    super.updateUnaware(dt, context);
    this.updateTravelFacing(dt, this.vx, 0.62);
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.stateTime += dt;

    const playerCenterX = context.player.x + context.player.w / 2;
    const playerCenterY = context.player.y + context.player.h / 2 + this.verticalBias;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));

    if (this.state === 'windup') {
      this.facing = dx >= 0 ? 1 : -1;
      this.vx *= 0.70;
      this.vy *= 0.70;
      this.x -= this.facing * 0.22;

      if (this.stateTime >= WINDUP_TIME) {
        const aimX = this.targetX - (this.x + this.w / 2);
        const aimY = this.targetY - (this.y + this.h / 2);
        const aimDistance = Math.max(1, Math.hypot(aimX, aimY));
        this.vx = (aimX / aimDistance) * STING_SPEED;
        this.vy = (aimY / aimDistance) * STING_SPEED;
        this.facing = this.vx >= 0 ? 1 : -1;
        this.facingCandidate = this.facing;
        this.facingCandidateTime = 0;
        this.state = 'sting';
        this.stateTime = 0;
      }
      this.keepInStage(context);
      return;
    }

    if (this.state === 'sting') {
      this.x += this.vx;
      this.y += this.vy;
      // Keep the attack-facing chosen at launch. Do not flicker from tiny velocity changes.

      if (!this.stingHit && intersects(this, context.player)) {
        const hit = context.hurtPlayer(STING_DAMAGE, this.x + this.w / 2);
        if (hit && Math.random() < POISON_CHANCE) {
          context.poisonPlayer(POISON_DURATION, POISON_INTERVAL, POISON_DAMAGE);
        }
        this.stingHit = true;
      }

      this.keepInStage(context);
      if (this.stateTime >= STING_TIME) {
        this.state = 'recover';
        this.stateTime = 0;
        this.vx *= 0.33;
        this.vy *= 0.33;
      }
      return;
    }

    if (this.state === 'recover') {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.88;
      this.vy *= 0.88;
      // Recovery keeps the sting direction until normal flight resumes.
      this.keepInStage(context);

      if (this.stateTime >= RECOVER_TIME) {
        this.state = 'fly';
        this.stateTime = 0;
        this.cooldown = 0.55 + Math.random() * 0.8;
      }
      return;
    }

    let separationX = 0;
    let separationY = 0;
    for (const ally of context.allies) {
      if (ally === this || ally.type !== 'bee' || !ally.alive) continue;
      const otherCenterX = ally.x + ally.w / 2;
      const otherCenterY = ally.y + ally.h / 2;
      const awayX = centerX - otherCenterX;
      const awayY = centerY - otherCenterY;
      const gap = Math.hypot(awayX, awayY);
      if (gap <= 0.001 || gap > 74) continue;
      const strength = (74 - gap) / 74;
      separationX += (awayX / gap) * strength * 1.25;
      separationY += (awayY / gap) * strength * 1.25;
    }

    const towardX = dx / distance;
    const towardY = dy / distance;
    const approach = distance > this.preferredDistance ? 1 : distance < 74 ? -0.55 : 0.14;
    const orbit = Math.sin(this.actionTime * 4.2 + this.orbitPhase) * 0.62 + this.strafeBias * 0.36;
    const hoverWave = Math.sin(this.actionTime * 6.1 + this.hoverPhase) * 0.48;

    // Facing follows the broad travel intent, not the small orbit wiggle.
    // This prevents bees from rapidly looking left/right while still moving in one general direction.
    const travelIntentX =
      towardX * HOVER_SPEED * this.hoverSpeedScale * approach +
      separationX * 0.48;
    const targetVx =
      travelIntentX +
      orbit * 0.72 +
      separationX * 0.60;
    const targetVy =
      towardY * HOVER_SPEED * this.hoverSpeedScale * approach +
      hoverWave * 0.58 +
      separationY * 1.08;

    this.vx += (targetVx - this.vx) * Math.min(1, dt * 7.8);
    this.vy += (targetVy - this.vy) * Math.min(1, dt * 7.2);
    this.x += this.vx;
    this.y += this.vy;
    this.updateTravelFacing(dt, travelIntentX, 0.42);
    this.keepInStage(context);

    if (distance <= STING_RANGE && this.cooldown <= 0) {
      this.state = 'windup';
      this.stateTime = 0;
      this.stingHit = false;
      this.targetX = context.player.x + context.player.w / 2;
      this.targetY = context.player.y + context.player.h * (0.3 + Math.random() * 0.4);
      this.facing = dx >= 0 ? 1 : -1;
      this.facingCandidate = this.facing;
      this.facingCandidateTime = 0;
    }
  }

  private updateTravelFacing(dt: number, horizontalIntent: number, threshold: number): void {
    if (Math.abs(horizontalIntent) < threshold) {
      this.facingCandidate = this.facing;
      this.facingCandidateTime = 0;
      return;
    }

    const desiredFacing: -1 | 1 = horizontalIntent >= 0 ? 1 : -1;
    if (desiredFacing === this.facing) {
      this.facingCandidate = this.facing;
      this.facingCandidateTime = 0;
      return;
    }

    if (this.facingCandidate !== desiredFacing) {
      this.facingCandidate = desiredFacing;
      this.facingCandidateTime = 0;
      return;
    }

    this.facingCandidateTime += dt;
    if (this.facingCandidateTime < 0.22) return;

    this.facing = desiredFacing;
    this.facingCandidateTime = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const image = this.currentImage();
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const bob = this.state === 'fly' ? Math.sin(this.actionTime * 9.5 + this.hoverPhase) * 1.4 : 0;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(centerY + bob));
    // Bee art is authored facing left. Mirror only for right-facing movement/attack.
    if (this.facing > 0) ctx.scale(-1, 1);

    if (this.state === 'windup') {
      ctx.rotate(this.facing * -0.08);
    } else if (this.state === 'sting') {
      ctx.rotate(Math.atan2(this.vy, Math.max(0.01, Math.abs(this.vx))) * 0.22);
    }

    ctx.drawImage(image, -DRAW_SIZE / 2, -DRAW_SIZE / 2, DRAW_SIZE, DRAW_SIZE);
    ctx.restore();
  }

  private currentImage(): HTMLImageElement | undefined {
    if (this.state === 'sting') {
      const index = Math.min(
        stingImages.length - 1,
        Math.floor((this.stateTime / Math.max(0.01, STING_TIME)) * stingImages.length),
      );
      return stingImages[index] ?? stingImages[0];
    }
    if (this.state === 'windup') return stingImages[0] ?? flyImages[0];
    const index = Math.floor(this.actionTime * 11) % Math.max(1, flyImages.length);
    return flyImages[index] ?? flyImages[0];
  }

  private keepInStage(context: EnemyContext): void {
    this.x = Math.max(8, Math.min(context.stage.width - this.w - 8, this.x));
    this.y = Math.max(48, Math.min(context.stage.height - this.h - 54, this.y));
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Bee image load failed: ${src}`));
    image.src = src;
  });
}
