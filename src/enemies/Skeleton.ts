import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type SkeletonState = 'walk' | 'attack';

export class Skeleton extends Enemy {
  readonly type = 'skeleton' as const;
  state: SkeletonState = 'walk';
  hitDone = false;

  constructor(x: number, y: number) {
    super(x, y, 30, 42, BALANCE.skeleton.maxHp, BALANCE.skeleton.maxHp);
    this.cooldown = 0.65;
  }

  interruptForKnockback(): void {
    this.state = 'walk';
    this.hitDone = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'walk';
    this.hitDone = false;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= BALANCE.skeleton.hitTime) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 2, y: this.y + 4, w: 38, h: 34 }
          : { x: this.x - 36, y: this.y + 4, w: 38, h: 34 };
        if (intersects(player, hitbox)) {
          context.hurtPlayer(BALANCE.skeleton.swordDamage, this.x);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= BALANCE.skeleton.attackDuration) {
        this.state = 'walk';
        this.actionTime = 0;
        this.cooldown = BALANCE.skeleton.cooldown;
        this.hitDone = false;
      }
      return;
    }

    this.x += this.facing * BALANCE.skeleton.walkSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (distance <= BALANCE.skeleton.attackRange && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.hitDone = false;
    }
  }
}
