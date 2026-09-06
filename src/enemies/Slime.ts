import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type SlimeState = 'crawl' | 'cling' | 'drop' | 'pounce';

export class Slime extends Enemy {
  readonly type = 'slime' as const;
  state: SlimeState;
  dropHit = false;
  private readonly anchorX: number;
  private readonly anchorY: number;

  constructor(x: number, y: number, state: SlimeState) {
    super(x, y, 34, 25, BALANCE.slime.maxHp, BALANCE.slime.maxHp);
    this.state = state;
    this.anchorX = x;
    this.anchorY = y;
    this.cooldown = state === 'crawl' ? 0.7 : 0;
    this.vx = state === 'crawl' ? BALANCE.slime.crawlSpeed : 0;
  }

  interruptForKnockback(): void {
    if (this.state !== 'cling') this.state = 'crawl';
  }

  protected onKnockbackEnd(): void {
    if (this.state === 'cling') {
      this.state = 'drop';
      this.dropHit = false;
    } else {
      this.state = 'crawl';
    }
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'cling') {
      this.x = this.anchorX;
      this.y = this.anchorY;
      if (Math.abs((player.x + player.w / 2) - (this.x + this.w / 2)) < 75 && player.y > this.y + 18) {
        this.state = 'drop';
        this.actionTime = 0;
        this.vy = 0;
        this.dropHit = false;
      }
      return;
    }

    if (this.state === 'drop') {
      const previousY = this.y;
      this.vy += 0.62;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

      if (intersects(player, this) && !this.dropHit) {
        context.hurtPlayer(BALANCE.slime.dropDamage, this.x);
        this.dropHit = true;
      }

      if (this.grounded) {
        this.state = 'crawl';
        this.cooldown = 1;
        this.actionTime = 0;
        this.vx = this.facing * 0.5;
      }
      return;
    }

    if (this.state === 'pounce') {
      const previousY = this.y;
      this.vy += 0.5;
      this.x += this.vx;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

      if (intersects(player, this)) {
        context.hurtPlayer(BALANCE.slime.pounceDamage, this.x);
      }

      if (this.grounded && this.actionTime > 0.18) {
        this.state = 'crawl';
        this.cooldown = 1.1;
        this.actionTime = 0;
      }
      return;
    }

    this.x += this.facing * BALANCE.slime.crawlSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (intersects(player, this)) {
      context.hurtPlayer(BALANCE.slime.contactDamage, this.x);
    }

    if (distance < 125 && distance > 42 && this.cooldown <= 0) {
      this.state = 'pounce';
      this.actionTime = 0;
      this.vx = this.facing * 3.3;
      this.vy = -6.6;
      this.grounded = false;
    }
  }
}
