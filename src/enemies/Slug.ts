import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export class Slug extends Enemy {
  readonly type = 'slug' as const;
  private wanderDirection: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
  private pauseTimer = 0;
  private moveTimer = 1.4 + Math.random() * 3.0;

  constructor(x: number, y: number) {
    super(x, y, 26, 11, BALANCE.slug.maxHp, BALANCE.slug.maxHp);
    this.facing = this.wanderDirection;
  }

  interruptForKnockback(): void {}

  protected onKnockbackEnd(): void {}

  protected updateAi(dt: number, context: EnemyContext): void {
    if (this.pauseTimer > 0) {
      this.pauseTimer = Math.max(0, this.pauseTimer - dt);
      this.vx = 0;

      if (this.pauseTimer <= 0) {
        if (Math.random() < 0.45) {
          this.wanderDirection = this.wanderDirection === 1 ? -1 : 1;
        }
        this.facing = this.wanderDirection;
        this.moveTimer = 1.4 + Math.random() * 3.0;
      }
    } else {
      const atLeftEdge = this.x <= 1;
      const atRightEdge = this.x + this.w >= context.stage.width - 1;
      const noGroundAhead = this.grounded && !this.hasGroundAhead(context, this.wanderDirection);

      if (
        (this.wanderDirection < 0 && atLeftEdge) ||
        (this.wanderDirection > 0 && atRightEdge) ||
        noGroundAhead
      ) {
        this.wanderDirection = this.wanderDirection === 1 ? -1 : 1;
      }

      this.facing = this.wanderDirection;
      this.vx = this.wanderDirection * BALANCE.slug.crawlSpeed;
      this.x += this.vx;

      this.moveTimer = Math.max(0, this.moveTimer - dt);
      if (this.moveTimer <= 0) {
        this.pauseTimer = 0.7 + Math.random() * 1.8;
        this.vx = 0;
      }
    }

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (intersects(context.player, this)) {
      context.hurtPlayer(BALANCE.slug.contactDamage, this.x);
    }
  }

  private hasGroundAhead(context: EnemyContext, direction: -1 | 1): boolean {
    const probeX = direction > 0 ? this.x + this.w + 4 : this.x - 4;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 4 &&
      platform.y <= footY + 12
    );
  }
}
