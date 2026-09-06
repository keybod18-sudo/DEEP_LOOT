import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type BombState = 'roll' | 'fuse' | 'explode';

export class Bomb extends Enemy {
  readonly type = 'bomb' as const;
  state: BombState = 'roll';
  blastRadius = 0;
  private damageDone = false;

  constructor(x: number, y: number) {
    super(x, y, 26, 26, BALANCE.bomb.maxHp, BALANCE.bomb.maxHp);
    this.cooldown = 0.25;
  }

  interruptForKnockback(): void {
    if (this.state !== 'explode') {
      this.state = 'roll';
      this.damageDone = false;
      this.blastRadius = 0;
    }
  }

  protected onKnockbackEnd(): void {
    if (this.hp > 0 && this.state !== 'explode') {
      this.state = 'roll';
      this.damageDone = false;
      this.blastRadius = 0;
    }
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.hypot(dx, dy);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'explode') {
      const progress = Math.min(1, this.actionTime / BALANCE.bomb.explosionDuration);
      const burst = 1 - (1 - progress) * (1 - progress) * (1 - progress);
      this.blastRadius = BALANCE.bomb.explosionRadius * (0.24 + burst * 0.76);

      if (!this.damageDone && distance <= this.blastRadius) {
        const damaged = context.hurtPlayer(BALANCE.bomb.explosionDamage, this.x);
        if (damaged) {
          const knockDir = dx >= 0 ? 1 : -1;
          player.vx = knockDir * BALANCE.bomb.blastKnockbackX;
          player.vy = -BALANCE.bomb.blastKnockbackY;
        }
        this.damageDone = true;
      }

      if (this.actionTime >= BALANCE.bomb.explosionDuration) {
        this.hp = 0;
      }
      return;
    }

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (this.state === 'fuse') {
      this.vx = 0;
      // Short, nervous pre-explosion shimmy to sell the imminent blast.
      this.x += Math.sin(this.actionTime * 36) * 0.7;
      if (this.actionTime >= BALANCE.bomb.fuseDuration) {
        this.state = 'explode';
        this.actionTime = 0;
        this.damageDone = false;
        this.vx = 0;
        this.vy = 0;
        this.blastRadius = BALANCE.bomb.explosionRadius * 0.24;
      }
      return;
    }

    this.x += this.facing * BALANCE.bomb.rollSpeed;

    if (distance <= BALANCE.bomb.triggerRange && this.cooldown <= 0) {
      this.state = 'fuse';
      this.actionTime = 0;
      this.vx = 0;
      this.blastRadius = 0;
      return;
    }
  }
}
