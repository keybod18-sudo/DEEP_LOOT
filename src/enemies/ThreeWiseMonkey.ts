import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Rect } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type ThreeWiseMonkeyKind = 'mizaru' | 'iwazaru' | 'kikazaru';
type MonkeyState = 'run' | 'jump' | 'attack' | 'retreat';
type MonkeyPose = 'runA' | 'runB' | 'jump' | 'attack';

const MONKEY_MAX_HP = 38;
const MONKEY_RUN_SPEED = 1.70;
const MONKEY_JUMP_SPEED = 4.90;
const MONKEY_JUMP_POWER = 12.5;
const MONKEY_DAMAGE = 9;
const MONKEY_ATTACK_RANGE = 44;
const MONKEY_ATTACK_DURATION = 0.28;
const MONKEY_HIT_TIME = 0.11;
const MONKEY_COOLDOWN = 0.48;
const MONKEY_RETREAT_SPEED = 5.60;
const MONKEY_RETREAT_LIFT = 8.60;
const MONKEY_RETREAT_MAX_TIME = 0.72;

const DRAW_W = 36;
const DRAW_H = 42;

const KINDS: ThreeWiseMonkeyKind[] = ['mizaru', 'iwazaru', 'kikazaru'];
const POSES: MonkeyPose[] = ['runA', 'runB', 'jump', 'attack'];

const frameUrls: Record<ThreeWiseMonkeyKind, Record<MonkeyPose, string>> = {
  mizaru: {
    runA: new URL('../../assets/monsters/three_wise_monkeys/mizaru/runA.svg', import.meta.url).href,
    runB: new URL('../../assets/monsters/three_wise_monkeys/mizaru/runB.svg', import.meta.url).href,
    jump: new URL('../../assets/monsters/three_wise_monkeys/mizaru/jump.svg', import.meta.url).href,
    attack: new URL('../../assets/monsters/three_wise_monkeys/mizaru/attack.svg', import.meta.url).href,
  },
  iwazaru: {
    runA: new URL('../../assets/monsters/three_wise_monkeys/iwazaru/runA.svg', import.meta.url).href,
    runB: new URL('../../assets/monsters/three_wise_monkeys/iwazaru/runB.svg', import.meta.url).href,
    jump: new URL('../../assets/monsters/three_wise_monkeys/iwazaru/jump.svg', import.meta.url).href,
    attack: new URL('../../assets/monsters/three_wise_monkeys/iwazaru/attack.svg', import.meta.url).href,
  },
  kikazaru: {
    runA: new URL('../../assets/monsters/three_wise_monkeys/kikazaru/runA.svg', import.meta.url).href,
    runB: new URL('../../assets/monsters/three_wise_monkeys/kikazaru/runB.svg', import.meta.url).href,
    jump: new URL('../../assets/monsters/three_wise_monkeys/kikazaru/jump.svg', import.meta.url).href,
    attack: new URL('../../assets/monsters/three_wise_monkeys/kikazaru/attack.svg', import.meta.url).href,
  },
};

const frameImages: Record<ThreeWiseMonkeyKind, Partial<Record<MonkeyPose, HTMLImageElement>>> = {
  mizaru: {},
  iwazaru: {},
  kikazaru: {},
};

export class ThreeWiseMonkey extends Enemy {
  readonly type: ThreeWiseMonkeyKind;
  state: MonkeyState = 'run';
  private hitDone = false;
  private jumpTimer = 0.18 + Math.random() * 0.42;
  private retreatDirection: -1 | 1 = 1;
  private reengageTimer = 0;

  constructor(
    x: number,
    y: number,
    public readonly kind: ThreeWiseMonkeyKind,
  ) {
    super(x, y, 20, 24, MONKEY_MAX_HP, MONKEY_MAX_HP);
    this.type = kind;
    this.cooldown = 0.14 + Math.random() * 0.22;
  }

  static async loadAssets(): Promise<void> {
    const jobs: Promise<void>[] = [];
    for (const kind of KINDS) {
      for (const pose of POSES) {
        if (frameImages[kind][pose]) continue;
        jobs.push(loadImage(frameUrls[kind][pose]).then((image) => {
          frameImages[kind][pose] = image;
        }));
      }
    }
    await Promise.all(jobs);
  }

  interruptForKnockback(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.12;
    this.reengageTimer = 0.20;
  }

  protected onKnockbackEnd(): void {
    this.state = 'run';
    this.hitDone = false;
    this.jumpTimer = 0.12 + Math.random() * 0.28;
    this.reengageTimer = 0.18 + Math.random() * 0.18;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    const player = context.player;
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const distance = Math.abs(dx);
    const playerDirection: -1 | 1 = dx >= 0 ? 1 : -1;
    this.jumpTimer = Math.max(0, this.jumpTimer - dt);
    this.reengageTimer = Math.max(0, this.reengageTimer - dt);

    if (this.state === 'attack') {
      if (!this.hitDone && this.actionTime >= MONKEY_HIT_TIME) {
        const hitbox: Rect = this.facing > 0
          ? { x: this.x + this.w - 3, y: this.y + 1, w: 30, h: 22 }
          : { x: this.x - 27, y: this.y + 1, w: 30, h: 22 };

        if (intersects(player, hitbox)) {
          const hit = context.hurtPlayer(MONKEY_DAMAGE, this.x + this.w / 2);
          if (hit) this.applyStatus(context);
        }
        this.hitDone = true;
      }

      if (this.actionTime >= MONKEY_ATTACK_DURATION) {
        this.beginRetreat(context);
      }
      return;
    }

    if (this.state === 'retreat') {
      this.updateRetreat(context);
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

    this.facing = playerDirection;

    if (this.reengageTimer > 0) {
      const awayDirection: -1 | 1 = playerDirection === 1 ? -1 : 1;
      if (this.grounded && this.hasGroundAhead(context, awayDirection)) {
        this.vx = awayDirection * MONKEY_RUN_SPEED * 0.82;
        this.x += this.vx;
      } else {
        this.vx = 0;
      }

      const previousY = this.y;
      this.vy += GRAVITY;
      this.y += this.vy;
      resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
      return;
    }

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

  private beginRetreat(context: EnemyContext): void {
    const playerCenter = context.player.x + context.player.w / 2;
    const centerX = this.x + this.w / 2;
    const playerDirection: -1 | 1 = playerCenter >= centerX ? 1 : -1;

    this.retreatDirection = playerDirection === 1 ? -1 : 1;
    this.facing = playerDirection;
    this.state = 'retreat';
    this.actionTime = 0;
    this.hitDone = false;
    this.cooldown = MONKEY_COOLDOWN + 0.18;
    this.reengageTimer = 0.35 + Math.random() * 0.25;
    this.grounded = false;
    this.vx = this.retreatDirection * MONKEY_RETREAT_SPEED;
    this.vy = -MONKEY_RETREAT_LIFT;
  }

  private updateRetreat(context: EnemyContext): void {
    const playerCenter = context.player.x + context.player.w / 2;
    const centerX = this.x + this.w / 2;
    this.facing = playerCenter >= centerX ? 1 : -1;

    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (
      (this.grounded && this.actionTime >= 0.16) ||
      this.actionTime >= MONKEY_RETREAT_MAX_TIME
    ) {
      this.state = 'run';
      this.actionTime = 0;
      this.vx = 0;
      this.jumpTimer = 0.18 + Math.random() * 0.28;
    }
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
    const image = frameImages[this.kind][pose];
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 1;
    const bob = this.state === 'run'
      ? Math.abs(Math.sin(this.actionTime * 25)) * 0.8
      : 0;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(footY - bob));
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.state === 'attack') {
      ctx.shadowColor =
        this.kind === 'mizaru' ? '#9a70ff' :
        this.kind === 'iwazaru' ? '#ff6d8d' :
        '#ffd754';
      ctx.shadowBlur = 5;
    }

    ctx.drawImage(
      image,
      -Math.round(DRAW_W / 2),
      -DRAW_H,
      DRAW_W,
      DRAW_H,
    );
    ctx.restore();
  }

  private currentPose(): MonkeyPose {
    if (this.state === 'jump' || this.state === 'retreat') return 'jump';
    if (this.state === 'attack') return 'attack';
    return Math.floor(this.actionTime * 12) % 2 === 0 ? 'runA' : 'runB';
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Monkey image load failed: ${src}`));
    image.src = src;
  });
}
