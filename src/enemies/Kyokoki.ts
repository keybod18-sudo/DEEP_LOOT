import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

type KyokokiState = 'roam' | 'drum';
export type KyokokiVariant = 'normal' | 'purple';
type SupportKind = 'haste' | 'berserk' | 'regeneration' | 'all';

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
const DRAW_SIZE = 60;

const idleUrls = [1, 2].map((index) =>
  new URL(
    `../../assets/monsters/kyokoki/idle_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const drumUrls = [1, 2, 3, 4].map((index) =>
  new URL(
    `../../assets/monsters/kyokoki/drum_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);

const idleImages: HTMLImageElement[] = [];
const drumImages: HTMLImageElement[] = [];

export class Kyokoki extends Enemy {
  readonly type: 'kyokoki' | 'kyokokiPurple';
  state: KyokokiState = 'roam';
  private supportTriggered = false;
  private supportTarget: Enemy | null = null;
  private supportKind: SupportKind = 'haste';
  private readonly purple: boolean;

  constructor(x: number, y: number, variant: KyokokiVariant = 'normal') {
    super(x, y, 26, 30, MAX_HP, MAX_HP);
    this.purple = variant === 'purple';
    this.type = this.purple ? 'kyokokiPurple' : 'kyokoki';
    this.cooldown = this.purple
      ? 1.25 + Math.random() * 1.1
      : 1.0 + Math.random() * 1.2;
  }

  static async loadAssets(): Promise<void> {
    if (idleImages.length === 0) {
      idleImages.push(...await Promise.all(idleUrls.map(loadImage)));
    }
    if (drumImages.length === 0) {
      drumImages.push(...await Promise.all(drumUrls.map(loadImage)));
    }
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

    // Movement direction is the rendered direction. Never walk backwards.
    if (Math.abs(this.vx) > 0.01) this.facing = this.vx >= 0 ? 1 : -1;

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
    this.facing =
      choice.target.x + choice.target.w / 2 >= this.x + this.w / 2 ? 1 : -1;
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
        if (this.supportKind === 'all') {
          if (!target.hasteActive) target.applyHaste(BUFF_DURATION);
          if (!target.berserkActive) target.applyBerserk(BUFF_DURATION);
          if (!target.regenerationActive) target.applyRegeneration(BUFF_DURATION);
        } else if (this.supportKind === 'haste') {
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
      if (!enemy.alive || enemy === this || enemy.type === 'kyokoki' || enemy.type === 'kyokokiPurple') return false;
      const dx = Math.abs((enemy.x + enemy.w / 2) - centerX);
      const dy = Math.abs((enemy.y + enemy.h / 2) - centerY);
      return dx <= SUPPORT_RADIUS_X && dy <= SUPPORT_RADIUS_Y;
    });

    if (this.purple) {
      const targets = candidates.filter((enemy) =>
        !enemy.hasteActive || !enemy.berserkActive || !enemy.regenerationActive
      );
      if (!targets.length) return null;
      return {
        target: targets[Math.floor(Math.random() * targets.length)]!,
        kind: 'all',
      };
    }

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
    const image = this.state === 'drum'
      ? this.currentDrumImage()
      : this.currentIdleImage();
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h + 2;
    const bob = this.state === 'drum'
      ? Math.sin(this.actionTime * 18) * 1.1
      : Math.sin(this.actionTime * 4) * 0.45;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = this.purple
      ? 'hue-rotate(286deg) saturate(2.35) brightness(0.9) contrast(1.12)'
      : 'none';
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(footY + bob));

    // New PNG sprites are authored facing right. Mirror only when moving/facing left.
    if (this.facing < 0) ctx.scale(-1, 1);

    if (this.state === 'drum') {
      ctx.shadowColor =
        this.supportKind === 'all'
          ? '#b858ff'
          : this.supportKind === 'haste'
            ? '#ff9a20'
            : this.supportKind === 'berserk'
              ? '#ff303c'
              : '#5cff86';
      ctx.shadowBlur = 12;
    }

    ctx.drawImage(
      image,
      -DRAW_SIZE / 2,
      -DRAW_SIZE,
      DRAW_SIZE,
      DRAW_SIZE,
    );
    ctx.restore();
  }

  private currentIdleImage(): HTMLImageElement | undefined {
    if (idleImages.length === 0) return undefined;
    const moving = Math.abs(this.vx) > 0.05;
    const speed = moving ? 7 : 3.4;
    const index = Math.floor(this.actionTime * speed) % idleImages.length;
    return idleImages[index] ?? idleImages[0];
  }

  private currentDrumImage(): HTMLImageElement | undefined {
    if (drumImages.length === 0) return undefined;
    const progress = Math.min(0.999, this.actionTime / SUPPORT_ANIM_TIME);
    const index = Math.min(
      drumImages.length - 1,
      Math.floor(progress * drumImages.length),
    );
    return drumImages[index] ?? drumImages[0];
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
