import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { StageLadder } from '../stage/Stage';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type GoblinState = 'walk' | 'climb' | 'swing' | 'leap' | 'smash';

export class Goblin extends Enemy {
  readonly type = 'goblin' as const;
  state: GoblinState = 'walk';
  hitDone = false;

  private climbLadder: StageLadder | null = null;
  private climbDirection: -1 | 1 = -1;

  constructor(x: number, y: number, facing: -1 | 1, cooldown: number) {
    super(x, y, 30, 38, BALANCE.goblin.maxHp, BALANCE.goblin.maxHp);
    this.facing = facing;
    this.cooldown = cooldown;
  }

  interruptForKnockback(): void {
    this.state = 'walk';
    this.hitDone = false;
    this.climbLadder = null;
  }

  protected onKnockbackEnd(): void {
    this.state = 'walk';
    this.hitDone = false;
    this.climbLadder = null;
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    const player = context.player;

    if (this.state === 'climb') {
      this.updateClimb(context);
      return;
    }

    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'walk') {
      const ladder = this.findTraversalLadder(context);
      if (ladder) {
        const ladderCenter = ladder.x + ladder.w / 2;
        const centerX = this.x + this.w / 2;
        const ladderDx = ladderCenter - centerX;

        if (Math.abs(ladderDx) > 7) {
          this.facing = ladderDx >= 0 ? 1 : -1;
          this.moveOnGround(context, this.facing * BALANCE.goblin.walkSpeed);
          return;
        }

        const playerCenterY = player.y + player.h / 2;
        const centerY = this.y + this.h / 2;
        this.beginClimb(ladder, playerCenterY < centerY ? -1 : 1);
        return;
      }

      this.moveOnGround(context, this.facing * BALANCE.goblin.walkSpeed);

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
      const hitbox: Rect = {
        x: this.x - 18,
        y: this.y + 12,
        w: this.w + 36,
        h: 28,
      };
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

  private moveOnGround(context: EnemyContext, speed: number): void {
    this.x += speed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
  }

  private findTraversalLadder(context: EnemyContext): StageLadder | null {
    const playerCenterY = context.player.y + context.player.h / 2;
    const centerY = this.y + this.h / 2;
    const verticalGap = playerCenterY - centerY;
    if (Math.abs(verticalGap) < 58) return null;

    const footY = this.y + this.h;
    const wantUp = verticalGap < 0;
    const candidates = context.stage.ladders.filter((ladder) => {
      const endpoint = wantUp ? ladder.y + ladder.h : ladder.y;
      return Math.abs(endpoint - footY) <= 34;
    });

    if (!candidates.length) return null;

    const centerX = this.x + this.w / 2;
    return candidates.reduce((best, ladder) => {
      const distance = Math.abs(ladder.x + ladder.w / 2 - centerX);
      const bestDistance = Math.abs(best.x + best.w / 2 - centerX);
      return distance < bestDistance ? ladder : best;
    });
  }

  private beginClimb(ladder: StageLadder, direction: -1 | 1): void {
    this.climbLadder = ladder;
    this.climbDirection = direction;
    this.state = 'climb';
    this.actionTime = 0;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
  }

  private updateClimb(context: EnemyContext): void {
    const ladder = this.climbLadder;
    if (!ladder) {
      this.state = 'walk';
      return;
    }

    const ladderCenter = ladder.x + ladder.w / 2;
    const centerX = this.x + this.w / 2;
    this.x += Math.max(-2.5, Math.min(2.5, (ladderCenter - centerX) * 0.42));
    this.vx = 0;
    this.vy = this.climbDirection * 2.15;
    this.y += this.vy;
    this.grounded = false;

    const topY = ladder.y;
    const bottomY = ladder.y + ladder.h;

    if (this.climbDirection < 0 && this.y + this.h <= topY + 2) {
      this.y = topY - this.h;
      this.finishClimb();
    } else if (this.climbDirection > 0 && this.y + this.h >= bottomY) {
      this.y = bottomY - this.h;
      this.finishClimb();
    }

    this.x = Math.max(0, Math.min(context.stage.width - this.w, this.x));
  }

  private finishClimb(): void {
    this.state = 'walk';
    this.climbLadder = null;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.actionTime = 0;
    this.cooldown = Math.max(this.cooldown, 0.25);
  }
}
