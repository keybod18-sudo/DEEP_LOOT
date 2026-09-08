import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type ThreeWiseMonkeyKind = 'mizaru' | 'iwazaru' | 'kikazaru';
type MonkeyState = 'run' | 'jump' | 'attack';

interface MonkeyPalette {
  furDark: string;
  fur: string;
  furLight: string;
  skin: string;
  skinLight: string;
  accent: string;
  aura: string;
}

const MONKEY_MAX_HP = 38;
const MONKEY_RUN_SPEED = 1.70;
const MONKEY_JUMP_SPEED = 4.90;
const MONKEY_JUMP_POWER = 12.5;
const MONKEY_DAMAGE = 9;
const MONKEY_ATTACK_RANGE = 48;
const MONKEY_ATTACK_DURATION = 0.28;
const MONKEY_HIT_TIME = 0.11;
const MONKEY_COOLDOWN = 0.48;

const PALETTES: Record<ThreeWiseMonkeyKind, MonkeyPalette> = {
  mizaru: {
    furDark: '#17131f',
    fur: '#36294a',
    furLight: '#5a4478',
    skin: '#b58e78',
    skinLight: '#dfbba1',
    accent: '#9a6dff',
    aura: 'rgba(141, 92, 255, 0.70)',
  },
  iwazaru: {
    furDark: '#211417',
    fur: '#4b292f',
    furLight: '#75404a',
    skin: '#c6967f',
    skinLight: '#edc0a8',
    accent: '#ff6b88',
    aura: 'rgba(255, 76, 112, 0.68)',
  },
  kikazaru: {
    furDark: '#201b10',
    fur: '#4d4122',
    furLight: '#78683a',
    skin: '#c9a076',
    skinLight: '#efc69a',
    accent: '#ffd75a',
    aura: 'rgba(255, 210, 74, 0.66)',
  },
};

export class ThreeWiseMonkey extends Enemy {
  readonly type: ThreeWiseMonkeyKind;
  state: MonkeyState = 'run';
  private hitDone = false;
  private jumpTimer = 0.22 + Math.random() * 0.48;

  constructor(
    x: number,
    y: number,
    public readonly kind: ThreeWiseMonkeyKind,
  ) {
    super(x, y, 30, 36, MONKEY_MAX_HP, MONKEY_MAX_HP);
    this.type = kind;
    this.cooldown = 0.18 + Math.random() * 0.25;
  }

  interruptForKnockback(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.18;
  }

  protected onKnockbackEnd(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.16 + Math.random() * 0.32;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    const player = context.player;
    const playerX = player.x + player.w / 2;
    const centerX = this.x + this.w / 2;
    const dx = playerX - centerX;
    const distance = Math.abs(dx);
    const desiredFacing: -1 | 1 = dx >= 0 ? 1 : -1;
    this.jumpTimer = Math.max(0, this.jumpTimer - dt);

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= MONKEY_HIT_TIME) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 5, y: this.y + 2, w: 38, h: 31 }
          : { x: this.x - 33, y: this.y + 2, w: 38, h: 31 };

        if (intersects(player, hitbox)) {
          const hit = context.hurtPlayer(MONKEY_DAMAGE, this.x + this.w / 2);
          if (hit) this.applyStatus(context);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= MONKEY_ATTACK_DURATION) {
        this.state = 'run';
        this.actionTime = 0;
        this.cooldown = MONKEY_COOLDOWN;
        this.hitDone = false;
        this.jumpTimer = 0.12 + Math.random() * 0.28;
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
        this.jumpTimer = 0.18 + Math.random() * 0.48;
      }
      return;
    }

    this.facing = desiredFacing;

    if (distance <= MONKEY_ATTACK_RANGE && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.vx = 0;
      this.hitDone = false;
      return;
    }

    const edgeAhead = this.grounded && !this.hasGroundAhead(context, this.facing);
    if (
      this.grounded &&
      (this.jumpTimer <= 0 || edgeAhead) &&
      distance > 28
    ) {
      this.state = 'jump';
      this.actionTime = 0;
      this.vx = this.facing * MONKEY_JUMP_SPEED;
      this.vy = -MONKEY_JUMP_POWER;
      this.grounded = false;
      this.jumpTimer = 0.45 + Math.random() * 0.65;
      return;
    }

    this.vx = this.facing * MONKEY_RUN_SPEED;
    this.x += this.vx;

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
  }

  private hasGroundAhead(context: EnemyContext, direction: -1 | 1): boolean {
    const probeX = direction > 0 ? this.x + this.w + 7 : this.x - 7;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 5 &&
      platform.y <= footY + 17
    );
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
    const palette = PALETTES[this.kind];
    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 3;

    const runPhase = this.state === 'run' ? Math.sin(this.actionTime * 24) : 0;
    const runBob = this.state === 'run' ? Math.abs(Math.sin(this.actionTime * 24)) * 2.1 : 0;
    const jumpTuck = this.state === 'jump' ? Math.min(1, Math.abs(this.vy) / MONKEY_JUMP_POWER) : 0;
    const attackP = this.state === 'attack'
      ? Math.sin(Math.min(1, this.actionTime / MONKEY_ATTACK_DURATION) * Math.PI)
      : 0;

    ctx.save();
    ctx.translate(centerX, footY - runBob);
    ctx.scale(this.facing, 1);

    if (this.state === 'jump') {
      ctx.rotate(Math.max(-0.22, Math.min(0.22, this.vy * 0.022)));
    } else if (this.state === 'attack') {
      ctx.translate(attackP * 5, 0);
      ctx.rotate(-attackP * 0.08);
    } else {
      ctx.rotate(runPhase * 0.025);
    }

    ctx.shadowColor = 'rgba(0, 0, 0, 0.58)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;

    this.drawTail(ctx, palette, runPhase, jumpTuck, attackP);
    this.drawLegs(ctx, palette, runPhase, jumpTuck, attackP);
    this.drawBody(ctx, palette, runPhase, jumpTuck, attackP);
    this.drawHead(ctx, palette, runPhase, jumpTuck, attackP);
    this.drawSignatureHands(ctx, palette, attackP);

    ctx.shadowColor = 'transparent';
    this.drawKindMark(ctx, palette);
    if (this.state === 'attack') this.drawAttackAura(ctx, palette, attackP);
    if (this.state === 'jump') this.drawJumpTrails(ctx, palette);

    ctx.restore();
  }

  private drawTail(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    runPhase: number,
    jumpTuck: number,
    attackP: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-10, -28);
    ctx.bezierCurveTo(
      -25,
      -29 - runPhase * 3,
      -30 - attackP * 4,
      -12 - jumpTuck * 9,
      -20,
      -4 - jumpTuck * 5,
    );
    ctx.stroke();

    ctx.strokeStyle = palette.furLight;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.62;
    ctx.beginPath();
    ctx.moveTo(-11, -29);
    ctx.bezierCurveTo(-23, -29 - runPhase * 3, -27, -15, -20, -7);
    ctx.stroke();
    ctx.restore();
  }

  private drawLegs(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    runPhase: number,
    jumpTuck: number,
    attackP: number,
  ): void {
    const stride = runPhase * 7;
    const tuck = jumpTuck * 8;
    const thrust = attackP * 5;

    ctx.save();
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-7, -22);
    ctx.lineTo(-10 - stride * 0.35 + thrust, -10 - tuck);
    ctx.lineTo(-13 - stride, -2 - tuck);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(7, -22);
    ctx.lineTo(10 + stride * 0.35 + thrust, -10 - tuck);
    ctx.lineTo(13 + stride, -2 - tuck);
    ctx.stroke();

    ctx.strokeStyle = palette.skin;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14 - stride, -2 - tuck);
    ctx.lineTo(-19 - stride, -1 - tuck);
    ctx.moveTo(14 + stride, -2 - tuck);
    ctx.lineTo(19 + stride, -1 - tuck);
    ctx.stroke();
    ctx.restore();
  }

  private drawBody(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    runPhase: number,
    jumpTuck: number,
    attackP: number,
  ): void {
    const lean = runPhase * 1.2 + attackP * 2.2;

    ctx.save();
    ctx.translate(lean, -2 - jumpTuck * 2);

    ctx.fillStyle = palette.furDark;
    ctx.beginPath();
    ctx.moveTo(-14, -43);
    ctx.quadraticCurveTo(-18, -28, -11, -16);
    ctx.quadraticCurveTo(0, -10, 12, -17);
    ctx.quadraticCurveTo(18, -29, 13, -43);
    ctx.quadraticCurveTo(0, -50, -14, -43);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.fur;
    ctx.beginPath();
    ctx.ellipse(1, -31, 12, 15, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.furLight;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(-7, -41);
    ctx.quadraticCurveTo(0, -47, 8, -41);
    ctx.lineTo(5, -37);
    ctx.lineTo(1, -40);
    ctx.lineTo(-2, -36);
    ctx.lineTo(-5, -40);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawHead(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    runPhase: number,
    jumpTuck: number,
    attackP: number,
  ): void {
    const headX = 2 + attackP * 4 + runPhase * 0.6;
    const headY = -52 - jumpTuck * 2;

    ctx.save();
    ctx.translate(headX, headY);

    ctx.fillStyle = palette.furDark;
    ctx.beginPath();
    ctx.moveTo(-15, -4);
    ctx.quadraticCurveTo(-13, -18, -4, -21);
    ctx.lineTo(-1, -27);
    ctx.lineTo(4, -22);
    ctx.lineTo(9, -26);
    ctx.lineTo(10, -19);
    ctx.quadraticCurveTo(17, -13, 16, -3);
    ctx.quadraticCurveTo(11, 11, 0, 13);
    ctx.quadraticCurveTo(-11, 11, -15, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = palette.fur;
    ctx.beginPath();
    ctx.ellipse(1, -4, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.ellipse(4, -1, 9.5, 9, 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.skinLight;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.ellipse(6, -4, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    this.drawEar(ctx, palette, -14, -5, -1);
    this.drawEar(ctx, palette, 15, -5, 1);

    if (this.kind !== 'mizaru') {
      ctx.fillStyle = '#171417';
      ctx.fillRect(4, -8, 2, 2);
      ctx.fillRect(10, -8, 2, 2);
    }

    if (this.kind !== 'iwazaru') {
      ctx.strokeStyle = '#4d2824';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.quadraticCurveTo(8, 7, 12, 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawEar(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    x: number,
    y: number,
    side: -1 | 1,
  ): void {
    ctx.fillStyle = palette.furDark;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.arc(x + side, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.skinLight;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(x + side, y, 2.3, -1.2, 1.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private drawSignatureHands(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    attackP: number,
  ): void {
    ctx.save();
    ctx.strokeStyle = palette.furDark;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';

    if (this.kind === 'mizaru') {
      ctx.beginPath();
      ctx.moveTo(-8, -39);
      ctx.lineTo(-7 - attackP * 2, -55);
      ctx.moveTo(9, -39);
      ctx.lineTo(12 + attackP * 2, -55);
      ctx.stroke();
      this.drawPalm(ctx, palette, -3, -58, 0.15);
      this.drawPalm(ctx, palette, 8, -58, -0.15);
      return;
    }

    if (this.kind === 'iwazaru') {
      ctx.beginPath();
      ctx.moveTo(-8, -38);
      ctx.lineTo(0 - attackP * 2, -48);
      ctx.moveTo(9, -38);
      ctx.lineTo(9 + attackP * 2, -48);
      ctx.stroke();
      this.drawPalm(ctx, palette, 3, -48, 0.05);
      this.drawPalm(ctx, palette, 9, -48, -0.05);
      return;
    }

    ctx.beginPath();
    ctx.moveTo(-8, -38);
    ctx.lineTo(-13 - attackP * 2, -56);
    ctx.moveTo(9, -38);
    ctx.lineTo(18 + attackP * 2, -56);
    ctx.stroke();
    this.drawPalm(ctx, palette, -13, -57, -0.35);
    this.drawPalm(ctx, palette, 18, -57, 0.35);
    ctx.restore();
  }

  private drawPalm(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    x: number,
    y: number,
    rotation: number,
  ): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.fillStyle = palette.skin;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.skinLight;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 2, -1);
      ctx.lineTo(i * 2.2, -6);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawKindMark(ctx: CanvasRenderingContext2D, palette: MonkeyPalette): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(-2, -29, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(-2, -29, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawAttackAura(
    ctx: CanvasRenderingContext2D,
    palette: MonkeyPalette,
    attackP: number,
  ): void {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = attackP * 0.62;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(10, -42, 24 + attackP * 8, -0.85, 0.85);
    ctx.stroke();

    ctx.globalAlpha = attackP * 0.24;
    ctx.fillStyle = palette.aura;
    ctx.beginPath();
    ctx.ellipse(8, -35, 23 + attackP * 6, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawJumpTrails(ctx: CanvasRenderingContext2D, palette: MonkeyPalette): void {
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-23, -6);
    ctx.lineTo(-12, 1);
    ctx.moveTo(-27, -13);
    ctx.lineTo(-14, -7);
    ctx.moveTo(-21, -20);
    ctx.lineTo(-12, -17);
    ctx.stroke();

    ctx.restore();
  }
}
