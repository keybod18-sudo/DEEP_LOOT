import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { Facing } from '../game/types';
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
  private attackElapsed = 0;
  private attackFacing: Facing = 1;
  private lockedTargetX = 0;
  private lockedTargetY = 0;

  constructor(x: number, y: number) {
    super(x, y, 28, 42, BALANCE.skeletonArcher.maxHp, BALANCE.skeletonArcher.maxHp);
    this.cooldown = 0.8;
  }

  interruptForKnockback(): void {
    this.state = 'walk';
    this.shotReleased = false;
    this.attackElapsed = 0;
    this.actionTime = 0;
  }

  protected onKnockbackEnd(): void {
    this.state = 'walk';
    this.shotReleased = false;
    this.attackElapsed = 0;
    this.actionTime = 0;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    const player = context.player;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const centerX = this.x + this.w / 2;
    const dx = playerCenterX - centerX;
    const distance = Math.abs(dx);

    if (this.state === 'attack') {
      this.updateAttack(dt, context);
      return;
    }

    this.facing = dx >= 0 ? 1 : -1;

    let moved = false;
    if (distance > BALANCE.skeletonArcher.idealRange) {
      this.x += this.facing * BALANCE.skeletonArcher.walkSpeed;
      moved = true;
    } else if (distance < 70) {
      this.x -= this.facing * (BALANCE.skeletonArcher.walkSpeed * 0.55);
      moved = true;
    }

    // Do not cycle the six-frame walk animation while the archer is standing still.
    if (!moved) this.actionTime = 0;

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (distance <= BALANCE.skeletonArcher.attackRange && this.cooldown <= 0) {
      this.beginAttack(playerCenterX, playerCenterY);
    }
  }

  private beginAttack(targetX: number, targetY: number): void {
    this.state = 'attack';
    this.actionTime = 0;
    this.attackElapsed = 0;
    this.shotReleased = false;
    this.shotType = this.nextShotType();
    this.attackFacing = this.facing;
    this.lockedTargetX = targetX;
    this.lockedTargetY = targetY;
  }

  private updateAttack(dt: number, context: EnemyContext): void {
    this.vx = 0;
    this.facing = this.attackFacing;
    this.attackElapsed += dt;

    // EnemyRenderer converts actionTime to the five raster frames. Feed it a staged
    // animation clock instead of a linear timer so the bow visibly rises, draws,
    // holds at full tension, snaps on release, recoils, and settles back down.
    this.actionTime = this.getAttackAnimationTime(this.attackElapsed);

    if (!this.shotReleased && this.attackElapsed >= BALANCE.skeletonArcher.releaseTime) {
      this.fireVolley(context, this.lockedTargetX, this.lockedTargetY);
      this.shotReleased = true;
    }

    if (this.attackElapsed >= BALANCE.skeletonArcher.attackDuration) {
      this.state = 'walk';
      this.actionTime = 0;
      this.attackElapsed = 0;
      this.cooldown = BALANCE.skeletonArcher.cooldown;
      this.shotReleased = false;
    }
  }

  private getAttackAnimationTime(elapsed: number): number {
    const duration = BALANCE.skeletonArcher.attackDuration;
    const release = BALANCE.skeletonArcher.releaseTime;
    const frameTime = (frame: number) => duration * ((frame + 0.18) / 5);

    if (elapsed < release * 0.18) return frameTime(0);
    if (elapsed < release * 0.42) return frameTime(1);
    if (elapsed < release * 0.68) return frameTime(2);

    // Triple shot gets a small extra draw pulse before the full-tension hold.
    if (this.shotType === 'triple' && elapsed < release * 0.82) return frameTime(2);
    if (elapsed < release) return frameTime(3);

    const recovery = Math.max(0.001, duration - release);
    const afterRelease = elapsed - release;
    if (afterRelease < recovery * 0.24) return frameTime(4);
    if (afterRelease < recovery * 0.52) return frameTime(3);
    if (afterRelease < recovery * 0.78) return frameTime(2);
    return frameTime(1);
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
      const targets = [
        { x: targetX - 72, frames: 58 },
        { x: targetX, frames: 66 },
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
