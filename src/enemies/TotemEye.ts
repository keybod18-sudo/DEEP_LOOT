import { intersects } from '../game/Collision';
import type { Stage } from '../stage/Stage';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type TotemEyeAttachment = 'ground' | 'ceiling';
export type TotemEyeVariant = 'normal' | 'decay';
export type TotemEyeState = 'idle' | 'charge' | 'recover';

export interface TotemEyeOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  alive: boolean;
  phase: number;
}

const MAX_HP = 40;
const ATTACK_RANGE = 320;
const ORB_SPEED = 112;
const ORB_LIFE = 3.9;
const ORB_DAMAGE = 8;
const ORB_DAMAGE_DECAY = 9;
const CHARGE_TIME = 0.7;
const RECOVER_TIME = 0.6;
const ATTACK_COOLDOWN = 1.6;
const DECAY_DURATION = 999;
const DECAY_TICK = 1.0;
const DECAY_DAMAGE = 7;
const BODY_W = 42;
const BODY_H = 92;

export class TotemEye extends Enemy {
  readonly type: 'totemEye' | 'totemEyeDecay';
  readonly attachment: TotemEyeAttachment;
  readonly variant: TotemEyeVariant;
  state: TotemEyeState = 'idle';
  stateTime = 0;
  lookX = 0;
  lookY = 0;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly orbs: TotemEyeOrb[] = [];

  constructor(
    x: number,
    y: number,
    attachment: TotemEyeAttachment,
    variant: TotemEyeVariant = 'normal',
  ) {
    super(x, y, BODY_W, BODY_H, MAX_HP, MAX_HP);
    this.attachment = attachment;
    this.variant = variant;
    this.type = variant === 'decay' ? 'totemEyeDecay' : 'totemEye';
    this.anchorX = x;
    this.anchorY = y;
    this.cooldown = 0.6 + Math.random() * 0.8;
  }

  static async loadAssets(): Promise<void> {}

  interruptForKnockback(): void {
    this.state = 'idle';
    this.stateTime = 0;
    this.resetAnchor();
  }

  protected onKnockbackEnd(): void {
    this.resetAnchor();
  }

  protected updateKnockback(_dt: number, _stage: Stage): void {
    this.knockbackTime = 0;
    this.resetAnchor();
  }

  protected updateUnaware(dt: number, context: EnemyContext): void {
    this.updateCore(dt, context, false);
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.updateCore(dt, context, true);
  }

  private updateCore(dt: number, context: EnemyContext, canAttack: boolean): void {
    this.resetAnchor();
    this.updateEyeTracking(context, dt);
    this.updateOrbs(dt, context);
    this.stateTime += dt;

    if (this.state === 'charge') {
      if (this.stateTime >= CHARGE_TIME) {
        this.spawnOrb(context);
        this.state = 'recover';
        this.stateTime = 0;
      }
      return;
    }

    if (this.state === 'recover') {
      if (this.stateTime >= RECOVER_TIME) {
        this.state = 'idle';
        this.stateTime = 0;
        this.cooldown = ATTACK_COOLDOWN;
      }
      return;
    }

    const dx = (context.player.x + context.player.w / 2) - (this.x + this.w / 2);
    const dy = (context.player.y + context.player.h / 2) - this.eyeCenterY;
    if (canAttack && Math.hypot(dx, dy) <= ATTACK_RANGE && this.cooldown <= 0) {
      this.state = 'charge';
      this.stateTime = 0;
    }
  }

  private updateEyeTracking(context: EnemyContext, dt: number): void {
    const dx = (context.player.x + context.player.w / 2) - (this.x + this.w / 2);
    const dy = (context.player.y + context.player.h / 2) - this.eyeCenterY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const desiredX = Math.max(-5.4, Math.min(5.4, (dx / distance) * 5.4));
    const desiredY = Math.max(-4.2, Math.min(4.2, (dy / distance) * 4.2));
    const blend = Math.min(1, dt * 8.5);
    this.lookX += (desiredX - this.lookX) * blend;
    this.lookY += (desiredY - this.lookY) * blend;
    this.facing = dx >= 0 ? 1 : -1;
  }

  private spawnOrb(context: EnemyContext): void {
    const sx = this.x + this.w / 2 + this.lookX;
    const sy = this.eyeCenterY + this.lookY;
    const tx = context.player.x + context.player.w / 2;
    const ty = context.player.y + context.player.h / 2;
    const dx = tx - sx;
    const dy = ty - sy;
    const distance = Math.max(1, Math.hypot(dx, dy));

    this.orbs.push({
      x: sx - 7,
      y: sy - 7,
      vx: (dx / distance) * ORB_SPEED,
      vy: (dy / distance) * ORB_SPEED,
      life: ORB_LIFE,
      alive: true,
      phase: Math.random() * Math.PI * 2,
    });
  }

  private updateOrbs(dt: number, context: EnemyContext): void {
    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      orb.life -= dt;
      if (orb.life <= 0) {
        orb.alive = false;
        continue;
      }
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.phase += dt * 11;

      if (intersects({ x: orb.x, y: orb.y, w: 14, h: 14 }, context.player)) {
        const damage = this.variant === 'decay' ? ORB_DAMAGE_DECAY : ORB_DAMAGE;
        const damaged = context.hurtPlayer(damage, orb.x + 7);
        if (damaged && this.variant === 'decay') {
          context.decayPlayer(DECAY_DURATION, DECAY_TICK, DECAY_DAMAGE);
        }
        orb.alive = false;
      }
    }

    for (let index = this.orbs.length - 1; index >= 0; index -= 1) {
      if (!this.orbs[index]!.alive) this.orbs.splice(index, 1);
    }
  }

  get eyeCenterY(): number {
    return this.attachment === 'ground' ? this.y + 25 : this.y + this.h - 25;
  }

  private resetAnchor(): void {
    this.x = this.anchorX;
    this.y = this.anchorY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = this.attachment === 'ground';
  }
}
