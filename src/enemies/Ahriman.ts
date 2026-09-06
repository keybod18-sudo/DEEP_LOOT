import { BALANCE } from '../config/balance';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';
import type { Stage } from '../stage/Stage';

export class Ahriman extends Enemy {
  readonly type = 'ahriman' as const;

  constructor(x: number, y: number) {
    super(x, y, 46, 30, BALANCE.ahriman.maxHp, BALANCE.ahriman.maxHp);
    this.cooldown = 0.3;
  }

  interruptForKnockback(): void {
    // 飛行敵なので地上状態へ落とさない。
  }

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
    this.y = clamp(this.y, 48, GAME_HEIGHT - 120);

    if (this.knockbackTime <= 0) this.onKnockbackEnd();
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distanceX = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (distanceX > BALANCE.ahriman.keepDistance) {
      this.x += this.facing * BALANCE.ahriman.flightSpeed;
    }

    const targetY = clamp(
      player.y - BALANCE.ahriman.hoverAbovePlayer + Math.sin(this.actionTime * BALANCE.ahriman.bobSpeed) * BALANCE.ahriman.bobAmplitude,
      BALANCE.ahriman.minY,
      BALANCE.ahriman.maxY,
    );
    const deltaY = targetY - this.y;
    this.y += clamp(deltaY * BALANCE.ahriman.verticalTracking, -BALANCE.ahriman.maxVerticalSpeed, BALANCE.ahriman.maxVerticalSpeed);

    this.x = clamp(this.x, 8, GAME_WIDTH - this.w - 8);
    this.y = clamp(this.y, BALANCE.ahriman.minY, BALANCE.ahriman.maxY);

    if (intersects(player, this)) {
      context.hurtPlayer(BALANCE.ahriman.contactDamage, this.x);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
