import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

type KyokokiState = 'roam' | 'drum';
type KyokokiPose = 'idleA' | 'idleB' | 'drum';
type SupportKind = 'haste' | 'berserk' | 'regeneration';

type SupportChoice = {
  target: Enemy;
  kind: SupportKind;
};

const MAX_HP = 42;
const SUPPORT_RADIUS_X = 330;
const SUPPORT_RADIUS_Y = 190;
const SUPPORT_HIT_TIME = 0.27;
const SUPPORT_ANIM_TIME = 0.62;
const SUPPORT_COOLDOWN_MIN = 2.8;
const SUPPORT_COOLDOWN_SPAN = 1.07;
const BUFF_DURATION = 30;
const WALK_SPEED = 0.34;
const KEEP_DISTANCE = 190;
const RETREAT_SPEED = 0.72;
const DRAW_W = 44;
const DRAW_H = 46;

const frameUrls: Record<KyokokiPose, string> = {
  idleA: new URL('../../assets/monsters/kyokoki/idleA.svg', import.meta.url).href,
  idleB: new URL('../../assets/monsters/kyokoki/idleB.svg', import.meta.url).href,
  drum: new URL('../../assets/monsters/kyokoki/drum.svg', import.meta.url).href,
};
const frameImages: Partial<Record<KyokokiPose, HTMLImageElement>> = {};

export class Kyokoki extends Enemy {
  readonly type = 'kyokoki' as const;
  state: KyokokiState = 'roam';
  private supportTriggered = false;
  private supportTarget: Enemy | null = null;
  private supportKind: SupportKind = 'haste';

  constructor(x: number, y: number) {
    super(x, y, 26, 30, MAX_HP, MAX_HP);
    this.cooldown = 1.0 + Math.random() * 1.2;
  }

  static async loadAssets(): Promise<void> {
    const poses: KyokokiPose[] = ['idleA', 'idleB', 'drum'];
    await Promise.all(poses.map(async (pose) => {
      if (frameImages[pose]) return;
      frameImages[pose] = await loadImage(frameUrls[pose]);
    }));
  }

  interruptForKnockback(): void {
    this.state = 'roam';
    this.supportTriggered = false;
    this.supportTarget = null;
  }

  protected onKnockbackEnd(): void {
    this.state = 'roam';
    this.supportTriggered = false;
    this.supportTarget = null;
    this.cooldown = Math.max(this.cooldown, 0.7);
  }

  protected updateUnaware(dt: number, context: EnemyContext): void {
    if (this.state === 'drum') {
      this.updateDrum(context);
      return;
    }

    if (this.tryStartSupport(context)) return;

    super.updateUnaware(dt, context);
  }

  protected updateAi(_dt: number, context: EnemyContext): void {
    if (this.state === 'drum') {
      this.updateDrum(context);
      return;
    }

    if (this.tryStartSupport(context)) return;

    const playerCenter = context.player.x + context.player.w / 2;
    const centerX = this.x + this.w / 2;
    const dx = playerCenter - centerX;
    const distance = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    if (distance < KEEP_DISTANCE) {
      const away = this.facing === 1 ? -1 : 1;
      this.vx = away * RETREAT_SPEED;
      this.x += this.vx;
    } else if (distance > KEEP_DISTANCE + 110) {
      this.vx = this.facing * WALK_SPEED;
      this.x += this.vx;
    } else {
      const sway = Math.sin(this.actionTime * 2.7);
      this.vx =
        sway > 0.55
          ? WALK_SPEED * 0.45
          : sway < -0.55
            ? -WALK_SPEED * 0.45
            : 0;
      this.x += this.vx;
    }

    this.applyGravity(context);
  }

  private tryStartSupport(context: EnemyContext): boolean {
    if (this.cooldown > 0) return false;

    const choice = this.pickSupportChoice(context);
    if (!choice) {
      this.cooldown = 0.5;
      return false;
    }

    this.supportTarget = choice.target;
    this.supportKind = choice.kind;
    this.state = 'drum';
    this.actionTime = 0;
    this.supportTriggered = false;
    this.vx = 0;
    return true;
  }

  private updateDrum(context: EnemyContext): void {
    this.vx = 0;

    if (!this.supportTriggered && this.actionTime >= SUPPORT_HIT_TIME) {
      this.supportTriggered = true;
      const target = this.supportTarget;

      if (target?.alive) {
        if (this.supportKind === 'haste') {
          if (!target.hasteActive) target.applyHaste(BUFF_DURATION);
        } else if (this.supportKind === 'berserk') {
          if (!target.berserkActive) target.applyBerserk(BUFF_DURATION);
        } else {
          if (!target.regenerationActive) target.applyRegeneration(BUFF_DURATION);
        }
      }
    }

    this.applyGravity(context);

    if (this.actionTime >= SUPPORT_ANIM_TIME) {
      this.state = 'roam';
      this.actionTime = 0;
      this.supportTriggered = false;
      this.supportTarget = null;
      this.cooldown =
        SUPPORT_COOLDOWN_MIN +
        Math.random() * SUPPORT_COOLDOWN_SPAN;
    }
  }

  private pickSupportChoice(context: EnemyContext): SupportChoice | null {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;

    const candidates = context.allies.filter((enemy) => {
      if (!enemy.alive || enemy === this || enemy.type === 'kyokoki') return false;
      const dx = Math.abs((enemy.x + enemy.w / 2) - centerX);
      const dy = Math.abs((enemy.y + enemy.h / 2) - centerY);
      return dx <= SUPPORT_RADIUS_X && dy <= SUPPORT_RADIUS_Y;
    });

    const choices: SupportChoice[] = [];

    for (const enemy of candidates) {
      if (!enemy.hasteActive) choices.push({ target: enemy, kind: 'haste' });
      if (!enemy.berserkActive) choices.push({ target: enemy, kind: 'berserk' });
      if (!enemy.regenerationActive) {
        choices.push({ target: enemy, kind: 'regeneration' });
      }
    }

    if (!choices.length) return null;
    return choices[Math.floor(Math.random() * choices.length)] ?? null;
  }

  private applyGravity(context: EnemyContext): void {
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(
      this,
      previousY,
      context.stage.platforms,
      context.stage.width,
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const pose: KyokokiPose =
      this.state === 'drum'
        ? 'drum'
        : Math.floor(this.actionTime * 4) % 2 === 0
          ? 'idleA'
          : 'idleB';
    const image = frameImages[pose] ?? frameImages.idleA;
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 2;
    const bob =
      this.state === 'drum'
        ? Math.sin(this.actionTime * 18) * 1.2
        : Math.sin(this.actionTime * 4) * 0.55;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.imageSmoothingEnabled = false;
    ctx.translate(
      Math.round(centerX),
      Math.round(footY + bob),
    );

    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.state === 'drum') {
      ctx.shadowColor =
        this.supportKind === 'haste'
          ? '#ff9a20'
          : this.supportKind === 'berserk'
            ? '#ff303c'
            : '#5cff86';
      ctx.shadowBlur = 12;
    }

    ctx.drawImage(
      image,
      -DRAW_W / 2,
      -DRAW_H,
      DRAW_W,
      DRAW_H,
    );
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`Kyokoki image load failed: ${src}`));
    image.src = src;
  });
}
