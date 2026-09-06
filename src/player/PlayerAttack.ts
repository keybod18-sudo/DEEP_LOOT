import { BALANCE } from '../config/balance';
import { makeSwordHitbox } from '../combat/Hitbox';
import type { Facing, Rect } from '../game/types';

export class PlayerAttack {
  timer = 0;
  cooldown = 0;
  hitConsumed = false;
  missed = false;

  update(dt: number): void {
    this.timer = Math.max(0, this.timer - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.timer <= 0) this.missed = false;
  }

  tryStart(missChance = 0): void {
    if (this.cooldown > 0) return;
    this.timer = BALANCE.player.attackDuration;
    this.cooldown = BALANCE.player.attackCooldown;
    this.hitConsumed = false;
    this.missed = missChance > 0 && Math.random() < missChance;
  }

  cancel(): void {
    this.timer = 0;
    this.hitConsumed = false;
    this.missed = false;
  }

  get frame(): number {
    if (this.timer <= 0) return 0;
    const elapsed = BALANCE.player.attackDuration - this.timer;
    return Math.max(0, Math.min(4, Math.floor(elapsed / 0.076)));
  }

  getHitbox(player: Rect, facing: Facing): Rect | null {
    if (this.timer <= 0 || this.hitConsumed || this.missed) return null;
    return makeSwordHitbox(player, facing, this.frame);
  }

  consumeHit(): void {
    this.hitConsumed = true;
  }
}
