import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { Input } from '../game/Input';
import type { Facing, PhysicsBody, Rect } from '../game/types';
import type { Stage } from '../stage/Stage';
import { PlayerAttack } from './PlayerAttack';
import { PlayerRenderer } from './PlayerRenderer';

export class Player implements PhysicsBody {
  x = 30;
  y = 330;
  w = 22;
  h = 34;
  vx = 0;
  vy = 0;
  grounded = false;
  facing: Facing = 1;
  hp: number = BALANCE.player.maxHp;
  invulnerability = 0;
  readonly attack = new PlayerAttack();

  constructor(private readonly renderer: PlayerRenderer) {}

  reset(): void {
    this.resetPosition();
    this.hp = BALANCE.player.maxHp;
    this.invulnerability = 0;
    this.attack.timer = 0;
    this.attack.cooldown = 0;
    this.attack.hitConsumed = false;
  }

  resetPosition(): void {
    this.x = 30;
    this.y = 330;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
  }

  update(dt: number, input: Input, stage: Stage): void {
    const left = input.isDown('a', 'arrowleft');
    const right = input.isDown('d', 'arrowright');

    if (left) {
      this.vx -= BALANCE.player.moveAcceleration;
      this.facing = -1;
    }
    if (right) {
      this.vx += BALANCE.player.moveAcceleration;
      this.facing = 1;
    }
    if (!left && !right) {
      this.vx *= BALANCE.player.moveFriction;
    }

    this.vx = Math.max(-BALANCE.player.maxMoveSpeed, Math.min(BALANCE.player.maxMoveSpeed, this.vx));

    if (input.consumePress('w', 'arrowup', ' ') && this.grounded) {
      this.vy = -BALANCE.player.jumpPower;
    }

    if (input.consumePress('j')) {
      this.attack.tryStart();
    }

    this.attack.update(dt);
    this.invulnerability = Math.max(0, this.invulnerability - dt);

    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, stage.platforms);
  }

  hurt(damage: number, sourceX: number): boolean {
    if (this.invulnerability > 0 || this.hp <= 0) return false;

    this.hp = Math.max(0, this.hp - damage);
    this.invulnerability = BALANCE.player.hurtInvulnerability;
    this.vx = this.x < sourceX ? -BALANCE.player.hurtKnockbackX : BALANCE.player.hurtKnockbackX;
    this.vy = -BALANCE.player.hurtKnockbackY;
    return true;
  }

  heal(amount: number, maxHp: number): void {
    this.hp = Math.min(maxHp, this.hp + amount);
  }

  clampHp(maxHp: number): void {
    this.hp = Math.min(this.hp, maxHp);
  }

  getHitbox(): Rect | null {
    return this.attack.getHitbox(this, this.facing);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.renderer.draw(
      ctx,
      this.x,
      this.y,
      this.w,
      this.h,
      this.facing,
      this.attack.frame,
      this.invulnerability,
    );
  }
}
