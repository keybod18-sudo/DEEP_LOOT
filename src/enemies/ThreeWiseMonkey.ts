import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type ThreeWiseMonkeyKind = 'mizaru' | 'iwazaru' | 'kikazaru';
type MonkeyState = 'run' | 'jump' | 'attack';
type MonkeyPose = 'runA' | 'runB' | 'jump' | 'attack';

interface MonkeyPalette {
  outline: string;
  furDark: string;
  fur: string;
  furLight: string;
  skin: string;
  skinLight: string;
  accent: string;
}

const MONKEY_MAX_HP = 38;
const MONKEY_RUN_SPEED = 1.70;
const MONKEY_JUMP_SPEED = 4.90;
const MONKEY_JUMP_POWER = 12.5;
const MONKEY_DAMAGE = 9;
const MONKEY_ATTACK_RANGE = 44;
const MONKEY_ATTACK_DURATION = 0.28;
const MONKEY_HIT_TIME = 0.11;
const MONKEY_COOLDOWN = 0.48;

const SPRITE_W = 24;
const SPRITE_H = 28;
const DRAW_W = 36;
const DRAW_H = 42;

const PALETTES: Record<ThreeWiseMonkeyKind, MonkeyPalette> = {
  mizaru: {
    outline: '#100d16',
    furDark: '#241a31',
    fur: '#3d2c52',
    furLight: '#62487e',
    skin: '#b78d75',
    skinLight: '#e1b89b',
    accent: '#9b73ff',
  },
  iwazaru: {
    outline: '#160d10',
    furDark: '#321b20',
    fur: '#512b32',
    furLight: '#79424c',
    skin: '#c4937a',
    skinLight: '#ecc0a4',
    accent: '#ff718d',
  },
  kikazaru: {
    outline: '#151108',
    furDark: '#352c16',
    fur: '#554725',
    furLight: '#7e6d39',
    skin: '#c99c70',
    skinLight: '#f0c58f',
    accent: '#ffd95c',
  },
};

const spriteCache = new Map<string, HTMLCanvasElement>();

export class ThreeWiseMonkey extends Enemy {
  readonly type: ThreeWiseMonkeyKind;
  state: MonkeyState = 'run';
  private hitDone = false;
  private jumpTimer = 0.18 + Math.random() * 0.42;

  constructor(
    x: number,
    y: number,
    public readonly kind: ThreeWiseMonkeyKind,
  ) {
    super(x, y, 22, 28, MONKEY_MAX_HP, MONKEY_MAX_HP);
    this.type = kind;
    this.cooldown = 0.14 + Math.random() * 0.22;
  }

  interruptForKnockback(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.12;
  }

  protected onKnockbackEnd(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.12 + Math.random() * 0.28;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    this.jumpTimer = Math.max(0, this.jumpTimer - dt);

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= MONKEY_HIT_TIME) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 4, y: this.y + 2, w: 32, h: 24 }
          : { x: this.x - 28, y: this.y + 2, w: 32, h: 24 };

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
        this.jumpTimer = 0.10 + Math.random() * 0.24;
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
        this.jumpTimer = 0.14 + Math.random() * 0.34;
      }
      return;
    }

    this.facing = dx >= 0 ? 1 : -1;

    if (distance <= MONKEY_ATTACK_RANGE && this.cooldown <= 0) {
      this.state = 'attack';
      this.actionTime = 0;
      this.vx = 0;
      this.hitDone = false;
      return;
    }

    const edgeAhead = this.grounded && !this.hasGroundAhead(context, this.facing);
    if (this.grounded && distance > 24 && (edgeAhead || this.jumpTimer <= 0)) {
      this.state = 'jump';
      this.actionTime = 0;
      this.vx = this.facing * MONKEY_JUMP_SPEED;
      this.vy = -MONKEY_JUMP_POWER;
      this.grounded = false;
      this.jumpTimer = 0.36 + Math.random() * 0.54;
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
    const probeX = direction > 0 ? this.x + this.w + 6 : this.x - 6;
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
    const pose = this.currentPose();
    const sprite = getMonkeySprite(this.kind, pose);
    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 2;
    const bob = this.state === 'run'
      ? Math.abs(Math.sin(this.actionTime * 25)) * 1.2
      : 0;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(footY - bob));
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.state === 'attack') {
      ctx.shadowColor = PALETTES[this.kind].accent;
      ctx.shadowBlur = 5;
    }

    ctx.drawImage(
      sprite,
      -Math.round(DRAW_W / 2),
      -DRAW_H,
      DRAW_W,
      DRAW_H,
    );
    ctx.restore();
  }

  private currentPose(): MonkeyPose {
    if (this.state === 'jump') return 'jump';
    if (this.state === 'attack') return 'attack';
    return Math.floor(this.actionTime * 12) % 2 === 0 ? 'runA' : 'runB';
  }
}

function getMonkeySprite(kind: ThreeWiseMonkeyKind, pose: MonkeyPose): HTMLCanvasElement {
  const key = `${kind}:${pose}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_W;
  canvas.height = SPRITE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Monkey sprite generation failed');

  ctx.imageSmoothingEnabled = false;
  drawPixelMonkey(ctx, kind, pose);
  spriteCache.set(key, canvas);
  return canvas;
}

function drawPixelMonkey(
  ctx: CanvasRenderingContext2D,
  kind: ThreeWiseMonkeyKind,
  pose: MonkeyPose,
): void {
  const p = PALETTES[kind];
  ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);

  const jump = pose === 'jump';
  const attack = pose === 'attack';
  const runB = pose === 'runB';
  const bodyY = jump ? 12 : 13;
  const headY = jump ? 4 : 5;

  // Tail: chunky stepped silhouette, like a hand-drawn sprite rather than a vector line.
  px(ctx, p.outline, 2, bodyY + 5, 3, 3);
  px(ctx, p.outline, 1, bodyY + 3, 2, 3);
  px(ctx, p.outline, 2, bodyY + 1, 2, 2);
  px(ctx, p.fur, 3, bodyY + 5, 2, 2);
  px(ctx, p.furLight, 2, bodyY + 3, 1, 2);

  // Feet / legs.
  if (jump) {
    px(ctx, p.outline, 7, 21, 5, 4);
    px(ctx, p.outline, 13, 20, 5, 4);
    px(ctx, p.furDark, 8, 21, 3, 2);
    px(ctx, p.furDark, 14, 20, 3, 2);
    px(ctx, p.skin, 6, 24, 5, 2);
    px(ctx, p.skin, 15, 23, 5, 2);
  } else if (runB) {
    px(ctx, p.outline, 6, 20, 5, 6);
    px(ctx, p.outline, 14, 19, 5, 7);
    px(ctx, p.furDark, 7, 20, 3, 4);
    px(ctx, p.furDark, 15, 19, 3, 5);
    px(ctx, p.skin, 4, 25, 6, 2);
    px(ctx, p.skin, 15, 25, 6, 2);
  } else {
    px(ctx, p.outline, 7, 19, 5, 7);
    px(ctx, p.outline, 13, 20, 5, 6);
    px(ctx, p.furDark, 8, 19, 3, 5);
    px(ctx, p.furDark, 14, 20, 3, 4);
    px(ctx, p.skin, 6, 25, 6, 2);
    px(ctx, p.skin, 14, 25, 6, 2);
  }

  // Body.
  px(ctx, p.outline, 6, bodyY, 13, 10);
  px(ctx, p.furDark, 7, bodyY, 11, 9);
  px(ctx, p.fur, 8, bodyY + 1, 9, 7);
  px(ctx, p.furLight, 9, bodyY + 1, 6, 2);
  px(ctx, p.accent, 11, bodyY + 7, 3, 2);

  // Neck / head outline.
  px(ctx, p.outline, 7, headY + 1, 13, 10);
  px(ctx, p.outline, 9, headY - 1, 8, 2);
  px(ctx, p.outline, 10, headY - 2, 2, 2);
  px(ctx, p.outline, 15, headY - 2, 2, 2);
  px(ctx, p.furDark, 8, headY + 1, 11, 8);
  px(ctx, p.fur, 9, headY, 9, 8);

  // Big ears.
  px(ctx, p.outline, 5, headY + 3, 4, 5);
  px(ctx, p.outline, 18, headY + 3, 4, 5);
  px(ctx, p.skin, 6, headY + 4, 2, 3);
  px(ctx, p.skin, 19, headY + 4, 2, 3);
  px(ctx, p.skinLight, 6, headY + 4, 1, 1);
  px(ctx, p.skinLight, 20, headY + 4, 1, 1);

  // Muzzle / face plate.
  px(ctx, p.skin, 10, headY + 3, 8, 6);
  px(ctx, p.skinLight, 11, headY + 3, 6, 2);
  px(ctx, p.outline, 13, headY + 6, 2, 1);

  // Visible expression when not covered by that monkey's signature pose.
  if (kind !== 'mizaru') {
    px(ctx, '#171417', 11, headY + 4, 1, 1);
    px(ctx, '#171417', 16, headY + 4, 1, 1);
  }
  if (kind !== 'iwazaru') {
    px(ctx, '#542e2b', 12, headY + 8, 5, 1);
  }

  // Arms and the three-wise-monkeys pose.
  if (kind === 'mizaru') {
    arm(ctx, p, 7, bodyY + 2, 10, headY + 3);
    arm(ctx, p, 18, bodyY + 2, 17, headY + 3);
    px(ctx, p.skin, 9, headY + 3, 5, 3);
    px(ctx, p.skin, 15, headY + 3, 4, 3);
    px(ctx, p.skinLight, 10, headY + 3, 3, 1);
    px(ctx, p.skinLight, 15, headY + 3, 3, 1);
  } else if (kind === 'iwazaru') {
    arm(ctx, p, 7, bodyY + 2, 11, headY + 7);
    arm(ctx, p, 18, bodyY + 2, 17, headY + 7);
    px(ctx, p.skin, 10, headY + 7, 8, 3);
    px(ctx, p.skinLight, 11, headY + 7, 6, 1);
  } else {
    arm(ctx, p, 8, bodyY + 2, 6, headY + 4);
    arm(ctx, p, 17, bodyY + 2, 20, headY + 4);
    px(ctx, p.skin, 5, headY + 3, 3, 5);
    px(ctx, p.skin, 19, headY + 3, 3, 5);
    px(ctx, p.skinLight, 6, headY + 4, 1, 3);
    px(ctx, p.skinLight, 20, headY + 4, 1, 3);
  }

  if (attack) {
    px(ctx, p.accent, 20, 10, 2, 2);
    px(ctx, p.accent, 21, 8, 2, 1);
    px(ctx, p.accent, 22, 6, 1, 1);
    px(ctx, p.skinLight, 19, 12, 3, 2);
  }

  if (jump) {
    px(ctx, p.accent, 2, 24, 3, 1);
    px(ctx, p.accent, 1, 26, 4, 1);
  }
}

function arm(
  ctx: CanvasRenderingContext2D,
  p: MonkeyPalette,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
): void {
  const midX = Math.round((sx + ex) / 2);
  const midY = Math.round((sy + ey) / 2);
  px(ctx, p.outline, sx - 1, sy - 1, 3, 3);
  px(ctx, p.furDark, sx, sy, 2, 2);
  px(ctx, p.outline, midX - 1, midY - 1, 3, 3);
  px(ctx, p.fur, midX, midY, 2, 2);
  px(ctx, p.outline, ex - 1, ey - 1, 3, 3);
}

function px(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
