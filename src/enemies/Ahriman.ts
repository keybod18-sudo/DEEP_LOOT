import { BALANCE } from '../config/balance';
import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';
import type { Stage } from '../stage/Stage';

export type AhrimanState = 'hover' | 'castFireball' | 'castFreeze';

export class Ahriman extends Enemy {
  readonly type = 'ahriman' as const;
  state: AhrimanState = 'hover';
  spellTriggered = false;

  constructor(x: number, y: number) {
    super(x, y, 46, 30, BALANCE.ahriman.maxHp, BALANCE.ahriman.maxHp);
    this.cooldown = 0.45;
  }

  get castingKind(): 'fireball' | 'freeze' | null {
    if (this.state === 'castFireball') return 'fireball';
    if (this.state === 'castFreeze') return 'freeze';
    return null;
  }

  interruptForKnockback(): void {
    this.state = 'hover';
    this.spellTriggered = false;
  }

  protected onKnockbackEnd(): void {
    this.vx = 0;
    this.vy = 0;
    this.state = 'hover';
    this.spellTriggered = false;
  }

  protected updateKnockback(dt: number, stage: Stage): void {
    this.knockbackTime = Math.max(0, this.knockbackTime - dt);
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= BALANCE.enemyKnockback.friction;
    this.vy *= BALANCE.enemyKnockback.friction;

    this.x = clamp(this.x, 8, stage.width - this.w - 8);
    this.y = clamp(this.y, 48, stage.height - 120);

    if (this.knockbackTime <= 0) this.onKnockbackEnd();
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;
    const playerCenterX = player.x + player.w / 2;
    const playerCenterY = player.y + player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distanceX = Math.abs(dx);
    const distanceY = Math.abs(dy);

    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'castFireball' || this.state === 'castFreeze') {
      // During spellcasting, Ahriman freezes in place.
      // It can only turn to keep facing the player.
      this.vx = 0;
      this.vy = 0;

      if (!this.spellTriggered && this.actionTime >= BALANCE.ahriman.castHitTime) {
        const castX = this.facing > 0 ? this.x + this.w + 2 : this.x - 16;
        const castY = this.y + 6;

        if (this.state === 'castFireball') {
          context.spawnAhrimanFireball(castX, castY, this.facing);
        } else {
          context.spawnFreezeLancer(
            castX,
            castY + 3,
            playerCenterX,
            playerCenterY,
          );
        }
        this.spellTriggered = true;
      }

      if (this.actionTime >= BALANCE.ahriman.castDuration) {
        this.state = 'hover';
        this.actionTime = 0;
        this.cooldown = BALANCE.ahriman.spellCooldown;
        this.spellTriggered = false;
      }

      if (intersects(player, this)) {
        context.hurtPlayer(BALANCE.ahriman.contactDamage, this.x);
      }
      return;
    }

    if (distanceX > BALANCE.ahriman.keepDistance) {
      this.x += this.facing * BALANCE.ahriman.flightSpeed;
    }

    const targetY = clamp(
      player.y - BALANCE.ahriman.hoverAbovePlayer + Math.sin(this.actionTime * BALANCE.ahriman.bobSpeed) * BALANCE.ahriman.bobAmplitude,
      70,
      context.stage.height - 140,
    );
    const deltaY = targetY - this.y;
    this.y += clamp(deltaY * BALANCE.ahriman.verticalTracking, -BALANCE.ahriman.maxVerticalSpeed, BALANCE.ahriman.maxVerticalSpeed);

    if (this.cooldown <= 0 && distanceX <= BALANCE.ahriman.spellRange && distanceY <= 120) {
      this.state = Math.random() < 0.52 ? 'castFireball' : 'castFreeze';
      this.actionTime = 0;
      this.spellTriggered = false;
    }

    this.x = clamp(this.x, 8, context.stage.width - this.w - 8);
    this.y = clamp(this.y, 70, context.stage.height - 120);

    if (intersects(player, this)) {
      context.hurtPlayer(BALANCE.ahriman.contactDamage, this.x);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
