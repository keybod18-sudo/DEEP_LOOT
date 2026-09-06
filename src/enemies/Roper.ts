import { BALANCE } from '../config/balance';
import { intersects } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type RoperState = 'idle' | 'attack';

export class Roper extends Enemy {
  readonly type = 'roper' as const;
  state: RoperState = 'idle';
  hitDone = false;

  constructor(x: number, y: number) {
    super(x, y, 36, 58, BALANCE.roper.maxHp, BALANCE.roper.maxHp);
    this.cooldown = 0.7;
  }

  interruptForKnockback(): void {
    this.state = 'idle';
    this.hitDone = false;
  }

  protected onKnockbackEnd(): void {
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.hitDone = false;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = Math.abs((player.y + player.h / 2) - (this.y + this.h / 2));
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= BALANCE.roper.hitTime) {
        const reach = 112;
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 4, y: this.y + 10, w: reach, h: 34 }
          : { x: this.x - reach + 4, y: this.y + 10, w: reach, h: 34 };
        if (intersects(player, hitbox)) {
          const hit = context.hurtPlayer(BALANCE.roper.attackDamage, this.x);
          if (hit) context.paralyzePlayer(BALANCE.roper.paralyzeDuration);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= BALANCE.roper.attackDuration) {
        this.state = 'idle';
        this.actionTime = 0;
        this.cooldown = BALANCE.roper.cooldown;
        this.hitDone = false;
      }
      return;
    }

    if (distance <= BALANCE.roper.attackRange && dy < 90 && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.hitDone = false;
    }
  }
}
