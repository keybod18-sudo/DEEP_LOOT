import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Player } from '../player/Player';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

interface DecayTrail {
  x: number;
  y: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  contactCooldown: number;
  phase: number;
}

const MAX_HP = Math.max(BALANCE.slug.maxHp + 18, 38);
const CRAWL_SPEED = BALANCE.slug.crawlSpeed * 0.72;
const CONTACT_DAMAGE = Math.max(BALANCE.slug.contactDamage + 2, 5);
const TRAIL_LIFE = 30.0;
const TRAIL_INTERVAL = 0.14;
const DECAY_TICK_INTERVAL = 1.0;
const DECAY_DAMAGE = 7;
const DRAW_W = 50;
const DRAW_H = 33;

const moveUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/decay_slug/move_0${index}.png`, import.meta.url).href,
);
const squashUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/decay_slug/squash_0${index}.png`, import.meta.url).href,
);

const moveImages: HTMLImageElement[] = [];
const squashImages: HTMLImageElement[] = [];

export class DecaySlug extends Enemy {
  readonly type = 'decaySlug' as const;
  private wanderDirection: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
  private pauseTimer = 0;
  private moveTimer = 4.2 + Math.random() * 3.6;
  private trailTimer = Math.random() * TRAIL_INTERVAL;
  private static trails: DecayTrail[] = [];

  constructor(x: number, y: number) {
    super(x, y, 30, 13, MAX_HP, MAX_HP);
    this.facing = this.wanderDirection;
  }

  get paused(): boolean {
    return this.pauseTimer > 0;
  }

  static async loadAssets(): Promise<void> {
    if (moveImages.length === 0) {
      moveImages.push(...await Promise.all(moveUrls.map(loadImage)));
    }
    if (squashImages.length === 0) {
      squashImages.push(...await Promise.all(squashUrls.map(loadImage)));
    }
  }

  static clearTrails(): void {
    this.trails.length = 0;
  }

  static updateTrails(dt: number, player: Player, applyDecay: () => void): void {
    for (const trail of this.trails) {
      trail.life -= dt;
      trail.contactCooldown = Math.max(0, trail.contactCooldown - dt);
      if (trail.life <= 0 || trail.contactCooldown > 0) continue;
      if (!intersects(player, trail)) continue;
      trail.contactCooldown = 0.65;
      applyDecay();
    }
    this.trails = this.trails.filter((trail) => trail.life > 0);
  }

  static drawTrails(ctx: CanvasRenderingContext2D): void {
    const now = performance.now() / 1000;
    for (const trail of this.trails) {
      const fade = Math.max(0, Math.min(1, trail.life / Math.min(1.6, trail.maxLife)));
      const pulse = (Math.sin(now * 4.2 + trail.phase) + 1) / 2;
      const cx = trail.x + trail.w / 2;
      const cy = trail.y + trail.h / 2;

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = (0.46 + pulse * 0.12) * fade;
      ctx.fillStyle = '#63201b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, trail.w / 2, trail.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = (0.72 + pulse * 0.12) * fade;
      ctx.strokeStyle = '#bd4b38';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#d05a45';
      for (let index = 0; index < 3; index += 1) {
        const bx = trail.x + 4 + ((index * 9 + trail.phase * 3) % Math.max(6, trail.w - 8));
        const rise = (now * (7 + index) + trail.phase * 2 + index * 3.1) % 7;
        const by = trail.y + trail.h - 2 - rise;
        const radius = index === 1 ? 1.8 : 1.2;
        ctx.globalAlpha = (0.55 + 0.2 * pulse) * fade;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  interruptForKnockback(): void {}

  protected onKnockbackEnd(): void {}

  protected updateAi(dt: number, context: EnemyContext): void {
    let moving = false;

    if (this.pauseTimer > 0) {
      this.pauseTimer = Math.max(0, this.pauseTimer - dt);
      this.vx = 0;

      if (this.pauseTimer <= 0) {
        if (Math.random() < 0.42) {
          this.wanderDirection = this.wanderDirection === 1 ? -1 : 1;
        }
        this.facing = this.wanderDirection;
        this.moveTimer = 4.2 + Math.random() * 3.6;
      }
    } else {
      const atLeftEdge = this.x <= 1;
      const atRightEdge = this.x + this.w >= context.stage.width - 1;
      const noGroundAhead = this.grounded && !this.hasGroundAhead(context, this.wanderDirection);

      if (
        (this.wanderDirection < 0 && atLeftEdge) ||
        (this.wanderDirection > 0 && atRightEdge) ||
        noGroundAhead
      ) {
        this.wanderDirection = this.wanderDirection === 1 ? -1 : 1;
      }

      this.facing = this.wanderDirection;
      this.vx = this.wanderDirection * CRAWL_SPEED;
      this.x += this.vx;
      moving = Math.abs(this.vx) > 0.01;

      this.moveTimer = Math.max(0, this.moveTimer - dt);
      if (this.moveTimer <= 0) {
        this.pauseTimer = 0.18 + Math.random() * 0.42;
        this.vx = 0;
        moving = false;
      }
    }

    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    this.trailTimer -= dt;
    if (moving && this.grounded && this.trailTimer <= 0) {
      this.trailTimer += TRAIL_INTERVAL;
      DecaySlug.addTrail(this.x - 4, this.y + this.h - 4, this.w + 8, 10);
    }

    if (intersects(context.player, this)) {
      const hit = context.hurtPlayer(CONTACT_DAMAGE, this.x + this.w / 2);
      if (hit && Math.random() < 0.48) {
        context.decayPlayer(999, DECAY_TICK_INTERVAL, DECAY_DAMAGE);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const squashed = this.knockbackTime > 0 && squashImages.length > 0;
    const images = squashed ? squashImages : moveImages;
    const speed = squashed ? 12 : 7.5;
    const frame = this.paused && !squashed
      ? 0
      : Math.floor(this.actionTime * speed) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    if (!image) return;

    const centerX = this.x + this.w / 2;
    const groundY = this.y + this.h + 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(groundY));
    // Source art is authored facing right. Mirror only when travelling left.
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -DRAW_W / 2, -DRAW_H, DRAW_W, DRAW_H);
    ctx.restore();
  }

  private static addTrail(x: number, y: number, w: number, h: number): void {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const nearby = this.trails.find((trail) =>
      Math.abs((trail.x + trail.w / 2) - cx) < 15 &&
      Math.abs((trail.y + trail.h / 2) - cy) < 8
    );

    if (nearby) {
      nearby.life = TRAIL_LIFE;
      nearby.maxLife = TRAIL_LIFE;
      nearby.w = Math.min(56, Math.max(nearby.w, w + 12));
      nearby.h = Math.min(14, Math.max(nearby.h, h));
      return;
    }

    this.trails.push({
      x,
      y,
      w: Math.max(32, w),
      h: Math.max(9, h),
      life: TRAIL_LIFE,
      maxLife: TRAIL_LIFE,
      contactCooldown: 0,
      phase: Math.random() * Math.PI * 2,
    });

    if (this.trails.length > 480) {
      this.trails.splice(0, this.trails.length - 480);
    }
  }

  private hasGroundAhead(context: EnemyContext, direction: -1 | 1): boolean {
    const probeX = direction > 0 ? this.x + this.w + 4 : this.x - 4;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 4 &&
      platform.y <= footY + 12
    );
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`DecaySlug image load failed: ${src}`));
    image.src = src;
  });
}
