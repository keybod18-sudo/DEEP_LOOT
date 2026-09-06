import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type GoblinState = 'walk' | 'swing' | 'leap' | 'smash';

export class Goblin extends Enemy {
  readonly type = 'goblin' as const;
  state: GoblinState = 'walk';
  hitDone = false;

  constructor(x: number, y: number, facing: -1 | 1, cooldown: number) {
    super(x, y, 30, 38, BALANCE.goblin.maxHp, BALANCE.goblin.maxHp);
    this.facing = facing;
    this.cooldown = cooldown;
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

    if (this.state === 'walk') {
      this.x += this.facing * BALANCE.goblin.walkSpeed;
      const previousY = this.y;
      this.vy += GRAVITY;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

      if (distance < 48 && this.cooldown <= 0) {
        this.state = 'swing';
        this.actionTime = 0;
        this.cooldown = 1;
        this.hitDone = false;
      } else if (distance >= 70 && distance < 150 && this.cooldown <= 0) {
        this.state = 'leap';
        this.actionTime = 0;
        this.vx = this.facing * 2.6;
        this.vy = -7;
        this.grounded = false;
        this.hitDone = false;
        this.cooldown = 1.4;
      }
      return;
    }

    if (this.state === 'swing') {
      if (this.actionTime > 0.18 && !this.hitDone) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w, y: this.y + 4, w: 30, h: 30 }
          : { x: this.x - 30, y: this.y + 4, w: 30, h: 30 };
        if (intersects(player, hitbox)) {
          context.hurtPlayer(BALANCE.goblin.clubDamage, this.x);
        }
        this.hitDone = true;
      }
      if (this.actionTime > 0.42) {
        this.state = 'walk';
        this.actionTime = 0;
      }
      return;
    }

    if (this.state === 'leap') {
      const previousY = this.y;
      this.vy += 0.5;
      this.x += this.vx;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

      if (intersects(player, this)) {
        context.hurtPlayer(BALANCE.goblin.leapContactDamage, this.x);
      }

      if (this.grounded) {
        this.state = 'smash';
        this.actionTime = 0;
        this.hitDone = false;
      }
      return;
    }

    if (this.actionTime > 0.10 && !this.hitDone) {
      const hitbox: Rect = { x: this.x - 18, y: this.y + 12, w: this.w + 36, h: 28 };
      if (intersects(player, hitbox)) {
        context.hurtPlayer(BALANCE.goblin.smashDamage, this.x);
      }
      this.hitDone = true;
    }
    if (this.actionTime > 0.38) {
      this.state = 'walk';
      this.actionTime = 0;
    }
  }
}
