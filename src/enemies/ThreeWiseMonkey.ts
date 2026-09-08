import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type ThreeWiseMonkeyKind = 'mizaru' | 'iwazaru' | 'kikazaru';
type MonkeyState = 'run' | 'jump' | 'attack';

const MONKEY_MAX_HP = 34;
const MONKEY_RUN_SPEED = 1.18;
const MONKEY_JUMP_SPEED = 3.25;
const MONKEY_JUMP_POWER = 9.8;
const MONKEY_DAMAGE = 8;
const MONKEY_ATTACK_RANGE = 42;
const MONKEY_ATTACK_DURATION = 0.34;
const MONKEY_HIT_TIME = 0.14;
const MONKEY_COOLDOWN = 0.72;

export class ThreeWiseMonkey extends Enemy {
  readonly type: ThreeWiseMonkeyKind;
  state: MonkeyState = 'run';
  private hitDone = false;
  private jumpTimer = 0.45 + Math.random() * 0.9;

  constructor(
    x: number,
    y: number,
    public readonly kind: ThreeWiseMonkeyKind,
  ) {
    super(x, y, 28, 34, MONKEY_MAX_HP, MONKEY_MAX_HP);
    this.type = kind;
    this.cooldown = 0.3 + Math.random() * 0.4;
  }

  interruptForKnockback(): void {
    this.state = 'run';
    this.hitDone = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'run';
    this.hitDone = false;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;
    this.jumpTimer = Math.max(0, this.jumpTimer - dt);

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= MONKEY_HIT_TIME) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 2, y: this.y + 5, w: 30, h: 25 }
          : { x: this.x - 28, y: this.y + 5, w: 30, h: 25 };

        if (intersects(player, hitbox)) {
          const hit = context.hurtPlayer(MONKEY_DAMAGE, this.x);
          if (hit) this.applyStatus(context);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= MONKEY_ATTACK_DURATION) {
        this.state = 'run';
        this.actionTime = 0;
        this.cooldown = MONKEY_COOLDOWN;
        this.hitDone = false;
      }
      return;
    }

    if (this.state === 'jump') {
      const previousY = this.y;
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

      if (this.grounded) {
        this.state = 'run';
        this.actionTime = 0;
        this.vx = 0;
        this.jumpTimer = 0.5 + Math.random() * 1.0;
      }
      return;
    }

    if (distance <= MONKEY_ATTACK_RANGE && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.vx = 0;
      this.hitDone = false;
      return;
    }

    if (this.grounded && this.jumpTimer <= 0 && distance > 48) {
      this.state = 'jump';
      this.actionTime = 0;
      this.vx = this.facing * MONKEY_JUMP_SPEED;
      this.vy = -MONKEY_JUMP_POWER;
      this.grounded = false;
      this.jumpTimer = 0.9 + Math.random() * 1.2;
      return;
    }

    this.x += this.facing * MONKEY_RUN_SPEED;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
  }

  private applyStatus(context: EnemyContext): void {
    if (this.kind === 'mizaru') {
      context.blindPlayer(5.5);
      return;
    }
    if (this.kind === 'iwazaru') {
      context.silencePlayer(5.2);
      return;
    }
    context.paralyzePlayer(4.0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 2;
    const runPhase = this.state === 'run' ? Math.sin(this.actionTime * 18) : 0;
    const jumpTilt = this.state === 'jump' ? this.vy * 0.015 : 0;
    const attackReach = this.state === 'attack'
      ? Math.sin(Math.min(1, this.actionTime / MONKEY_ATTACK_DURATION) * Math.PI) * 7
      : 0;

    const accent =
      this.kind === 'mizaru' ? '#8a5cff' :
      this.kind === 'iwazaru' ? '#ff6285' :
      '#ffd35a';

    ctx.save();
    ctx.translate(centerX, footY);
    ctx.scale(this.facing, 1);
    ctx.rotate(jumpTilt);

    ctx.fillStyle = '#4b2d1d';
    ctx.beginPath();
    ctx.ellipse(0, -25, 11, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6d4229';
    ctx.beginPath();
    ctx.arc(0, -44, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d3a06d';
    ctx.beginPath();
    ctx.ellipse(2, -43, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c1a12';
    ctx.fillRect(4, -47, 2, 2);
    ctx.fillRect(9, -47, 2, 2);

    ctx.strokeStyle = '#56331f';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-7, -29);
    ctx.lineTo(-11 - runPhase * 3, -10);
    ctx.moveTo(7, -29);
    ctx.lineTo(11 + runPhase * 3, -10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-7, -34);
    ctx.lineTo(-14 + attackReach, -23);
    ctx.moveTo(7, -34);
    ctx.lineTo(15 + attackReach, -24);
    ctx.stroke();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;

    if (this.kind === 'mizaru') {
      ctx.beginPath();
      ctx.moveTo(-8, -40);
      ctx.lineTo(10, -48);
      ctx.moveTo(-7, -48);
      ctx.lineTo(10, -40);
      ctx.stroke();
    } else if (this.kind === 'iwazaru') {
      ctx.beginPath();
      ctx.moveTo(-7, -38);
      ctx.lineTo(11, -38);
      ctx.moveTo(-6, -42);
      ctx.lineTo(10, -35);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-10, -44, 6, -1.2, 1.2);
      ctx.arc(10, -44, 6, 1.9, 4.4);
      ctx.stroke();
    }

    ctx.fillStyle = accent;
    ctx.fillRect(-3, -19, 6, 3);

    if (this.state === 'jump') {
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, -4);
      ctx.lineTo(-8, 1);
      ctx.moveTo(-20, -9);
      ctx.lineTo(-10, -5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
