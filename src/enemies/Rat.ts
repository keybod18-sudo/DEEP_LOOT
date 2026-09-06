import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type RatState = 'run' | 'bite';

export class Rat extends Enemy {
  readonly type = 'rat' as const;
  state: RatState = 'run';
  hitDone = false;

  constructor(x: number, y: number) {
    super(x, y, 28, 14, BALANCE.rat.maxHp, BALANCE.rat.maxHp);
    this.cooldown = 0.3;
  }

  interruptForKnockback(): void {
    this.state = 'run';
    this.hitDone = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'run';
    this.hitDone = false;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'bite') {
      if (!this.hitDone && this.actionTime >= BALANCE.rat.hitTime) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 2, y: this.y - 4, w: 24, h: 22 }
          : { x: this.x - 22, y: this.y - 4, w: 24, h: 22 };
        if (intersects(player, hitbox)) {
          context.hurtPlayer(BALANCE.rat.biteDamage, this.x);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= BALANCE.rat.biteDuration) {
        this.state = 'run';
        this.actionTime = 0;
        this.cooldown = BALANCE.rat.cooldown;
        this.hitDone = false;
      }
      return;
    }

    this.x += this.facing * BALANCE.rat.runSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (distance <= BALANCE.rat.biteRange && this.cooldown <= 0) {
      this.state = 'bite';
      this.actionTime = 0;
      this.hitDone = false;
    }
  }
}
