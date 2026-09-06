import { BALANCE } from '../config/balance';
import { GAME_WIDTH } from '../config/constants';
import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';
import type { Stage } from '../stage/Stage';

export class Bat extends Enemy {
  readonly type = 'bat' as const;
  private impactCooldown = 0;

  constructor(x: number, y: number) {
    super(x, y, 34, 20, BALANCE.bat.maxHp, BALANCE.bat.maxHp);
  }

  update(dt: number, context: EnemyContext): void {
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);
    super.update(dt, context);
  }

  interruptForKnockback(): void {}

  protected onKnockbackEnd(): void {
    this.vx = 0;
    this.vy = 0;
  }

  protected updateKnockback(dt: number, _stage: Stage): void {
    this.knockbackTime = Math.max(0, this.knockbackTime - dt);
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= BALANCE.enemyKnockback.friction;
    this.vy *= BALANCE.enemyKnockback.friction;
    this.x = clamp(this.x, 8, GAME_WIDTH - this.w - 8);
    this.y = clamp(this.y, BALANCE.bat.minY, BALANCE.bat.maxY);
    if (this.knockbackTime <= 0) this.onKnockbackEnd();
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const length = Math.max(1, Math.hypot(dx, dy));

    this.facing = dx >= 0 ? 1 : -1;
    this.x += (dx / length) * BALANCE.bat.flightSpeed;
    this.y += (dy / length) * BALANCE.bat.verticalSpeed;

    this.x = clamp(this.x, 8, GAME_WIDTH - this.w - 8);
    this.y = clamp(this.y, BALANCE.bat.minY, BALANCE.bat.maxY);

    if (this.impactCooldown <= 0 && intersects(player, this)) {
      const damaged = context.hurtPlayer(BALANCE.bat.contactDamage, this.x);
      if (damaged) {
        this.impactCooldown = BALANCE.bat.hitCooldown;
        this.vx = -this.facing * 3.2;
        this.vy = dy >= 0 ? -2.2 : 2.2;
        this.knockbackTime = 0.16;
      }
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
