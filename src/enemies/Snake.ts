import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type SnakeState = 'crawl' | 'strike';

export class Snake extends Enemy {
  readonly type = 'snake' as const;
  state: SnakeState = 'crawl';
  hitDone = false;

  constructor(x: number, y: number) {
    super(x, y, 34, 18, BALANCE.snake.maxHp, BALANCE.snake.maxHp);
    this.cooldown = 0.6;
  }

  interruptForKnockback(): void {
    this.state = 'crawl';
    this.hitDone = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'crawl';
    this.hitDone = false;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'strike') {
      if (this.actionTime >= BALANCE.snake.strikeHitTime && !this.hitDone) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 4, y: this.y - 4, w: 28, h: 24 }
          : { x: this.x - 24, y: this.y - 4, w: 28, h: 24 };

        if (intersects(player, hitbox)) {
          const damaged = context.hurtPlayer(BALANCE.snake.biteDamage, this.x);
          if (damaged) {
            context.poisonPlayer(
              BALANCE.snake.poisonDuration,
              BALANCE.snake.poisonTickInterval,
              BALANCE.snake.poisonDamage,
            );
          }
        }
        this.hitDone = true;
      }

      if (this.actionTime >= BALANCE.snake.strikeDuration) {
        this.state = 'crawl';
        this.actionTime = 0;
        this.cooldown = BALANCE.snake.strikeCooldown;
        this.hitDone = false;
      }
      return;
    }

    this.x += this.facing * BALANCE.snake.crawlSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms);

    if (distance <= BALANCE.snake.strikeDistance && this.cooldown <= 0) {
      this.state = 'strike';
      this.actionTime = 0;
      this.hitDone = false;
      this.vx = 0;
    }
  }
}
