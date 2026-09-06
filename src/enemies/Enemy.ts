import { BALANCE } from '../config/balance';
import { KNOCKBACK_GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { Facing, PhysicsBody } from '../game/types';
import type { Player } from '../player/Player';
import type { Stage } from '../stage/Stage';

export interface EnemyContext {
  player: Player;
  stage: Stage;
  hurtPlayer: (damage: number, sourceX: number) => boolean;
  poisonPlayer: (duration: number, tickInterval: number, damage: number) => void;
  paralyzePlayer: (duration: number) => void;
  spawnAhrimanFireball: (x: number, y: number, facing: Facing) => void;
  spawnFreezeLancer: (x: number, y: number, targetX: number, targetY: number) => void;
  spawnSkeletonArrow: (x: number, y: number, vx: number, vy: number, damage: number, poisoned: boolean) => void;
}

export abstract class Enemy implements PhysicsBody {
  abstract readonly type: 'slime' | 'goblin' | 'ahriman' | 'snake' | 'bat' | 'roper' | 'slug' | 'rat' | 'skeleton' | 'skeletonArcher' | 'bomb';

  vx = 0;
  vy = 0;
  grounded = false;
  facing: Facing = 1;
  actionTime = 0;
  cooldown = 0;
  knockbackTime = 0;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public hp: number,
    public readonly maxHp: number,
  ) {}

  get alive(): boolean {
    return this.hp > 0;
  }

  update(dt: number, context: EnemyContext): void {
    if (!this.alive) return;

    this.actionTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.knockbackTime > 0) {
      this.updateKnockback(dt, context.stage);
      return;
    }

    this.updateAi(dt, context);
  }

  abstract interruptForKnockback(): void;
  protected abstract updateAi(dt: number, context: EnemyContext): void;

  protected updateKnockback(dt: number, stage: Stage): void {
    const previousY = this.y;
    this.knockbackTime = Math.max(0, this.knockbackTime - dt);
    this.vy += KNOCKBACK_GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= BALANCE.enemyKnockback.friction;
    resolveFloor(this, previousY, stage.platforms, stage.width);

    if (this.knockbackTime <= 0) {
      this.onKnockbackEnd();
    }
  }

  protected abstract onKnockbackEnd(): void;
}
