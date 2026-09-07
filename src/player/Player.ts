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
  w = 18;
  h = 28;
  vx = 0;
  vy = 0;
  grounded = false;
  facing: Facing = 1;
  hp: number = BALANCE.player.maxHp;
  invulnerability = 0;
  readonly attack = new PlayerAttack();
  walkTime = 0;

  poisonTime = 0;
  poisonTickTimer = 0;
  poisonTickInterval = 1;
  poisonDamage = 0;

  paralysisTime = 0;
  paralysisStunTime = 0;
  paralysisPulseTime = 0;
  slowTime = 0;
  sealTime = 0;
  silenceTime = 0;
  blindTime = 0;
  sleepTime = 0;
  frozenTime = 0;

  constructor(private readonly renderer: PlayerRenderer) {}

  reset(): void {
    this.resetPosition();
    this.hp = BALANCE.player.maxHp;
    this.invulnerability = 0;
    this.attack.timer = 0;
    this.attack.cooldown = 0;
    this.attack.hitConsumed = false;
    this.attack.missed = false;
    this.walkTime = 0;
    this.poisonTime = 0;
    this.poisonTickTimer = 0;
    this.poisonTickInterval = 1;
    this.poisonDamage = 0;
    this.paralysisTime = 0;
    this.paralysisStunTime = 0;
    this.paralysisPulseTime = 0;
    this.slowTime = 0;
    this.sealTime = 0;
    this.silenceTime = 0;
    this.blindTime = 0;
    this.sleepTime = 0;
    this.frozenTime = 0;
  }

  resetPosition(x = 30, y = 330): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.facing = 1;
    this.walkTime = 0;
  }

  update(dt: number, input: Input, stage: Stage): void {
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.updatePoison(dt);
    this.updateTimedStatuses(dt);

    const disabled = this.paralysisStunned || this.sleeping || this.frozen;
    const speedFactor = this.slowed ? 0.48 : 1;
    const canAct = !disabled && this.hp > 0;
    const left = canAct && input.isDown('a', 'arrowleft');
    const right = canAct && input.isDown('d', 'arrowright');

    if (left) {
      this.vx -= BALANCE.player.moveAcceleration * speedFactor;
      this.facing = -1;
    }
    if (right) {
      this.vx += BALANCE.player.moveAcceleration * speedFactor;
      this.facing = 1;
    }
    if (!left && !right) {
      this.vx *= disabled ? (this.frozen ? 0.2 : 0.72) : BALANCE.player.moveFriction;
    }

    const maxMoveSpeed = BALANCE.player.maxMoveSpeed * speedFactor;
    this.vx = Math.max(-maxMoveSpeed, Math.min(maxMoveSpeed, this.vx));

    if (canAct && input.consumePress('w', 'arrowup', ' ') && this.grounded) {
      this.vy = -BALANCE.player.jumpPower * (this.slowed ? 0.82 : 1);
    }

    if (canAct && input.consumePress('j')) {
      this.attack.tryStart(this.blinded ? BALANCE.caterpillar.blindMissChance : 0);
    }

    if (disabled) this.attack.cancel();
    else this.attack.update(dt);

    const movingOnGround = this.grounded && Math.abs(this.vx) > 0.15 && this.attack.timer <= 0 && !disabled;
    if (movingOnGround) this.walkTime += dt;

    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, stage.platforms, stage.width);
  }

  applyPoison(_duration: number, tickInterval: number, damage: number): void {
    this.poisonTime = Number.POSITIVE_INFINITY;
    this.poisonTickInterval = Math.max(0.1, tickInterval);
    this.poisonDamage = Math.max(this.poisonDamage, damage);
    if (this.poisonTickTimer <= 0) this.poisonTickTimer = this.poisonTickInterval;
  }

  applyParalysis(_duration: number): void {
    const wasParalyzed = this.paralyzed;
    this.paralysisTime = Number.POSITIVE_INFINITY;
    if (!wasParalyzed) {
      this.paralysisStunTime = 0;
      this.paralysisPulseTime = 0.7 + Math.random() * 1.4;
    }
  }

  applySlow(duration: number): void {
    this.slowTime = Math.max(this.slowTime, duration);
  }

  applySeal(duration: number): void {
    this.sealTime = Math.max(this.sealTime, duration);
  }

  applySilence(duration: number): void {
    this.silenceTime = Math.max(this.silenceTime, duration);
  }

  applyBlind(duration: number): void {
    this.blindTime = Math.max(this.blindTime, duration);
  }

  applySleep(duration: number): void {
    this.sleepTime = Math.max(this.sleepTime, duration);
    this.attack.cancel();
    this.vx *= 0.25;
  }

  applyFrozen(duration: number): void {
    this.frozenTime = Math.max(this.frozenTime, duration);
    this.attack.cancel();
    this.vx = 0;
  }

  wakeUp(): void {
    this.sleepTime = 0;
  }

  clearStatusEffects(): void {
    this.poisonTime = 0;
    this.poisonTickTimer = 0;
    this.poisonDamage = 0;
    this.paralysisTime = 0;
    this.paralysisStunTime = 0;
    this.paralysisPulseTime = 0;
    this.slowTime = 0;
    this.sealTime = 0;
    this.silenceTime = 0;
    this.blindTime = 0;
    this.sleepTime = 0;
    this.frozenTime = 0;
  }

  get hasStatusEffects(): boolean {
    return this.poisoned || this.paralyzed || this.slowed || this.sealed ||
      this.silenced || this.blinded || this.sleeping || this.frozen;
  }

  private breakFrozenWithDamage(damage: number): number {
    if (!this.frozen) return damage;
    this.frozenTime = 0;
    return Math.max(damage + 8, Math.ceil(damage * 2.25));
  }

  get poisoned(): boolean { return this.poisonTime > 0; }
  get paralyzed(): boolean { return this.paralysisTime > 0; }
  get paralysisStunned(): boolean { return this.paralysisStunTime > 0; }
  get slowed(): boolean { return this.slowTime > 0; }
  get sealed(): boolean { return this.sealTime > 0; }
  get silenced(): boolean { return this.silenceTime > 0; }
  get blinded(): boolean { return this.blindTime > 0; }
  get sleeping(): boolean { return this.sleepTime > 0; }
  get frozen(): boolean { return this.frozenTime > 0; }

  private updatePoison(dt: number): void {
    if (this.poisonTime <= 0 || this.hp <= 0) return;

    // Poison is permanent until cured by a remedy.
    this.poisonTickTimer -= dt;

    while (this.poisonTickTimer <= 0 && this.poisonTime > 0 && this.hp > 0) {
      this.hp = Math.max(0, this.hp - this.poisonDamage);
      this.poisonTickTimer += this.poisonTickInterval;
    }

    if (this.poisonTime <= 0) {
      this.poisonTime = 0;
      this.poisonTickTimer = 0;
      this.poisonDamage = 0;
    }
  }

  private updateTimedStatuses(dt: number): void {
    if (this.paralyzed) {
      this.paralysisStunTime = Math.max(0, this.paralysisStunTime - dt);
      this.paralysisPulseTime -= dt;
      if (this.paralysisPulseTime <= 0) {
        this.paralysisStunTime = 0.5;
        this.paralysisPulseTime = 0.85 + Math.random() * 1.75;
      }
    } else {
      this.paralysisStunTime = 0;
      this.paralysisPulseTime = 0;
    }
    this.slowTime = Math.max(0, this.slowTime - dt);
    this.sealTime = Math.max(0, this.sealTime - dt);
    this.silenceTime = Math.max(0, this.silenceTime - dt);
    this.blindTime = Math.max(0, this.blindTime - dt);
    this.sleepTime = Math.max(0, this.sleepTime - dt);
    this.frozenTime = Math.max(0, this.frozenTime - dt);
  }

  hurt(damage: number, sourceX: number): boolean {
    if (this.invulnerability > 0 || this.hp <= 0) return false;

    this.wakeUp();
    const finalDamage = this.breakFrozenWithDamage(damage);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.invulnerability = BALANCE.player.hurtInvulnerability;
    this.vx = this.x < sourceX ? -BALANCE.player.hurtKnockbackX : BALANCE.player.hurtKnockbackX;
    this.vy = -BALANCE.player.hurtKnockbackY;
    return true;
  }

  hurtProjectile(damage: number, sourceX: number): boolean {
    if (this.hp <= 0) return false;

    this.wakeUp();
    const finalDamage = this.breakFrozenWithDamage(damage);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.invulnerability = Math.max(this.invulnerability, BALANCE.player.hurtInvulnerability * 0.7);
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
    const disabled = this.paralysisStunned || this.sleeping || this.frozen;
    this.renderer.draw(
      ctx,
      this.x,
      this.y,
      this.w,
      this.h,
      this.facing,
      this.attack.frame,
      this.invulnerability,
      this.grounded && Math.abs(this.vx) > 0.15 && this.attack.timer <= 0 && !disabled,
      this.walkTime,
      this.sleeping,
      this.frozen,
      this.poisoned,
      this.paralysisStunned,
    );
  }
}
