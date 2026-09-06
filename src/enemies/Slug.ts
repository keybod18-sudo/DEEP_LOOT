import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export class Slug extends Enemy {
  readonly type = 'slug' as const;

  constructor(x: number, y: number) {
    super(x, y, 26, 11, BALANCE.slug.maxHp, BALANCE.slug.maxHp);
  }

  interruptForKnockback(): void {}

  protected onKnockbackEnd(): void {}

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    this.facing = dx >= 0 ? 1 : -1;

    this.x += this.facing * BALANCE.slug.crawlSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (intersects(player, this)) {
      context.hurtPlayer(BALANCE.slug.contactDamage, this.x);
    }
  }
}
