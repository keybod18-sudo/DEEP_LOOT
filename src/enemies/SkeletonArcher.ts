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
    this.cooldown = 0.9;
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
    const dx = playerCenterX - (this.x + this.w / 2);
    const distance = Math.abs(dx);

    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
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

    if (distance > BALANCE.skeletonArcher.idealRange) {
      this.x += this.facing * BALANCE.skeletonArcher.walkSpeed;
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
    const shot = order[this.shotCycle % order.length];
    this.shotCycle += 1;
    return shot;
  }

  private fireVolley(context: EnemyContext, targetX: number, targetY: number): void {
    const originX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
    const originY = this.y + 14;
    const base = this.computeVelocity(originX, originY, targetX, targetY);

    if (this.shotType === 'triple') {
      const spreads = [-1.05, 0, 1.05] as const;
      for (const spread of spreads) {
        context.spawnSkeletonArrow(
          originX,
          originY,
          base.vx,
          base.vy + spread,
          BALANCE.skeletonArcher.tripleArrowDamage,
          false,
        );
      }
      return;
    }

    context.spawnSkeletonArrow(
      originX,
      originY,
      base.vx,
      base.vy,
      this.shotType === 'poison'
        ? BALANCE.skeletonArcher.poisonArrowDamage
        : BALANCE.skeletonArcher.arrowDamage,
      this.shotType === 'poison',
    );
  }

  private computeVelocity(originX: number, originY: number, targetX: number, targetY: number): { vx: number; vy: number } {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const dir = dx >= 0 ? 1 : -1;
    const distance = Math.abs(dx);
    const vx = dir * clamp(4.1 + distance / 120, 4.1, 6.4);
    const vy = clamp((dy / Math.max(28, distance * 0.22)) - (2.9 + Math.min(1.4, distance / 180)), -7.2, 1.5);
    return { vx, vy };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
