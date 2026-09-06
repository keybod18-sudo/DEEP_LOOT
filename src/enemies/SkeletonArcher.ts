import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type SkeletonArcherState = 'walk' | 'attack';
export type SkeletonArcherShot = 'normal' | 'triple' | 'poison';

export class SkeletonArcher extends Enemy {
  readonly type = 'skeletonArcher' as const;
  state: SkeletonArcherState = 'walk';
  shotType: SkeletonArcherShot = 'normal';
  shotReleased = false;
  private shotCycle = 0;

  constructor(x: number, y: number) {
    super(x, y, 28, 42, BALANCE.skeletonArcher.maxHp, BALANCE.skeletonArcher.maxHp);
    this.cooldown = 0.8;
  }

  interruptForKnockback(): void {
    this.state = 'walk';
    this.shotReleased = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'walk';
    this.shotReleased = false;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const centerX = this.x + this.w / 2;
    const dx = playerCenterX - centerX;
    const distance = Math.abs(dx);

    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      this.vx = 0;
      if (!this.shotReleased && this.actionTime >= BALANCE.skeletonArcher.releaseTime) {
        this.fireVolley(context, playerCenterX, playerCenterY);
        this.shotReleased = true;
      }

      if (this.actionTime >= BALANCE.skeletonArcher.attackDuration) {
        this.state = 'walk';
        this.actionTime = 0;
        this.cooldown = BALANCE.skeletonArcher.cooldown;
        this.shotReleased = false;
      }
      return;
    }

    // Archer is intentionally almost stationary. It only shuffles when the player is
    // well outside its shooting distance or extremely close.
    if (distance > BALANCE.skeletonArcher.idealRange) {
      this.x += this.facing * BALANCE.skeletonArcher.walkSpeed;
    } else if (distance < 70) {
      this.x -= this.facing * (BALANCE.skeletonArcher.walkSpeed * 0.55);
    }

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (distance <= BALANCE.skeletonArcher.attackRange && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.shotReleased = false;
      this.shotType = this.nextShotType();
    }
  }

  private nextShotType(): SkeletonArcherShot {
    const order: SkeletonArcherShot[] = ['normal', 'triple', 'poison'];
    const shot = order[this.shotCycle % order.length]!;
    this.shotCycle += 1;
    return shot;
  }

  private fireVolley(context: EnemyContext, targetX: number, targetY: number): void {
    const originX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
    const originY = this.y + 14;

    if (this.shotType === 'triple') {
      // Three clearly separated high arcs. They rise first, spread apart, then rain
      // down around the player's current position.
      const targets = [
        { x: targetX - 72, frames: 58 },
        { x: targetX,      frames: 66 },
        { x: targetX + 72, frames: 74 },
      ] as const;

      for (const target of targets) {
        const velocity = this.computeBallisticVelocity(
          originX,
          originY,
          target.x,
          targetY,
          target.frames,
        );
        context.spawnSkeletonArrow(
          originX,
          originY,
          velocity.vx,
          velocity.vy,
          BALANCE.skeletonArcher.tripleArrowDamage,
          false,
        );
      }
      return;
    }

    const flightFrames = this.shotType === 'poison' ? 56 : 48;
    const velocity = this.computeBallisticVelocity(
      originX,
      originY,
      targetX,
      targetY,
      flightFrames,
    );

    context.spawnSkeletonArrow(
      originX,
      originY,
      velocity.vx,
      velocity.vy,
      this.shotType === 'poison'
        ? BALANCE.skeletonArcher.poisonArrowDamage
        : BALANCE.skeletonArcher.arrowDamage,
      this.shotType === 'poison',
    );
  }

  private computeBallisticVelocity(
    originX: number,
    originY: number,
    targetX: number,
    targetY: number,
    flightFrames: number,
  ): { vx: number; vy: number } {
    const frames = Math.max(20, flightFrames);
    const gravity = BALANCE.skeletonArcher.arrowGravity;
    const vx = (targetX - originX) / frames;
    const vy = (
      targetY - originY - (gravity * frames * (frames - 1)) / 2
    ) / frames;

    return {
      vx: clamp(vx, -7.2, 7.2),
      vy: clamp(vy, -9.2, 1.0),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
