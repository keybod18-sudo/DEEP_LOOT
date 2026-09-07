import type { Enemy } from './Enemy';
import type { Goblin } from './Goblin';
import type { Slime } from './Slime';
import type { Ahriman } from './Ahriman';
import type { Snake } from './Snake';
import type { Bat } from './Bat';
import type { Roper } from './Roper';
import type { Slug } from './Slug';
import type { Rat } from './Rat';
import type { Skeleton } from './Skeleton';
import type { SkeletonArcher } from './SkeletonArcher';
import type { Bomb } from './Bomb';
import type { Caterpillar } from './Caterpillar';
import type { Facing } from '../game/types';
import { BALANCE } from '../config/balance';

const slimeUrl = new URL('../../assets/monsters/slime/crawl.png', import.meta.url).href;
const clingUrl = new URL('../../assets/monsters/slime/cling.png', import.meta.url).href;
const ahrimanUrl = new URL('../../assets/monsters/ahriman/base.png', import.meta.url).href;
const snakeUrls = [1, 2, 3].map((index) =>
  new URL(`../../assets/monsters/snake/move_0${index}.png`, import.meta.url).href,
);
const batUrls = [1, 2, 3].map((index) =>
  new URL(`../../assets/monsters/bat/fly_0${index}.png`, import.meta.url).href,
);
const goblinWalkUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/goblin/walk_0${index}.png`, import.meta.url).href,
);
const goblinSwingUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/monsters/goblin/swing_0${index}.png`, import.meta.url).href,
);
const goblinLeapUrls = [1, 2, 3].map((index) =>
  new URL(`../../assets/monsters/goblin/leap_0${index}.png`, import.meta.url).href,
);
const goblinSmashUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/goblin/smash_0${index}.png`, import.meta.url).href,
);

const roperIdleUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/roper/idle_0${index}.png`, import.meta.url).href,
);
const roperAttackUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/roper/attack_0${index}.png`, import.meta.url).href,
);
const slugMoveUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/slug/move_0${index}.png`, import.meta.url).href,
);
const ratRunUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/rat/run_0${index}.png`, import.meta.url).href,
);
const ratBiteUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/rat/bite_0${index}.png`, import.meta.url).href,
);
const skeletonWalkUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/skeleton/walk_0${index}.png`, import.meta.url).href,
);
const skeletonAttackUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/skeleton/attack_0${index}.png`, import.meta.url).href,
);
const skeletonArcherWalkUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/skeleton_archer/walk_0${index}.png`, import.meta.url).href,
);
const skeletonArcherShootUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/monsters/skeleton_archer/shoot_0${index}.png`, import.meta.url).href,
);
const bombExplosionUrls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) =>
  new URL(`../../assets/effects/bomb_explosion/explosion_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const caterpillarLarvaUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/caterpillar/larva/crawl_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const caterpillarPupaUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/caterpillar/pupa/pupa_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const caterpillarFlyUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/caterpillar/butterfly_fly/fly_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const caterpillarRamUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/caterpillar/butterfly_ram/ram_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const caterpillarPowderUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/caterpillar/butterfly_powder/powder_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);


// Explicit orientation of the adopted source sprites.
// This avoids per-monster ad-hoc flip conditions getting inverted again.
const SOURCE_FACING = {
  goblin: 1,
  snake: 1,
  roper: -1,
  slug: 1,
  rat: 1,
  skeleton: 1,
  skeletonArcher: 1,
  caterpillar: 1,
} as const satisfies Record<string, Facing>;

type SpriteBounds = { x: number; y: number; w: number; h: number };

const OPAQUE_BOUNDS = new WeakMap<HTMLImageElement, SpriteBounds>();

function getOpaqueBounds(image: HTMLImageElement): SpriteBounds {
  const cached = OPAQUE_BOUNDS.get(image);
  if (cached) return cached;

  const width = Math.max(1, image.naturalWidth);
  const height = Math.max(1, image.naturalHeight);
  const fallback = { x: 0, y: 0, w: width, h: height };

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return fallback;

  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0);

  const pixels = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha < 8) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const bounds = maxX >= minX && maxY >= minY
    ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
    : fallback;

  OPAQUE_BOUNDS.set(image, bounds);
  return bounds;
}

export class EnemyRenderer {
  private slimeImage!: HTMLImageElement;
  private clingImage!: HTMLImageElement;
  private ahrimanImage!: HTMLImageElement;
  private readonly snakeImages: HTMLImageElement[] = [];
  private readonly batImages: HTMLImageElement[] = [];
  private readonly goblinWalkImages: HTMLImageElement[] = [];
  private readonly goblinSwingImages: HTMLImageElement[] = [];
  private readonly goblinLeapImages: HTMLImageElement[] = [];
  private readonly goblinSmashImages: HTMLImageElement[] = [];
  private readonly roperIdleImages: HTMLImageElement[] = [];
  private readonly roperAttackImages: HTMLImageElement[] = [];
  private readonly slugMoveImages: HTMLImageElement[] = [];
  private readonly ratRunImages: HTMLImageElement[] = [];
  private readonly ratBiteImages: HTMLImageElement[] = [];
  private readonly skeletonWalkImages: HTMLImageElement[] = [];
  private readonly skeletonAttackImages: HTMLImageElement[] = [];
  private readonly skeletonArcherWalkImages: HTMLImageElement[] = [];
  private readonly skeletonArcherShootImages: HTMLImageElement[] = [];
  private readonly bombExplosionImages: HTMLImageElement[] = [];
  private readonly caterpillarLarvaImages: HTMLImageElement[] = [];
  private readonly caterpillarPupaImages: HTMLImageElement[] = [];
  private readonly caterpillarFlyImages: HTMLImageElement[] = [];
  private readonly caterpillarRamImages: HTMLImageElement[] = [];
  private readonly caterpillarPowderImages: HTMLImageElement[] = [];

  async load(): Promise<void> {
    [this.slimeImage, this.clingImage, this.ahrimanImage] = await Promise.all([
      loadImage(slimeUrl),
      loadImage(clingUrl),
      loadImage(ahrimanUrl),
    ]);
    const [snake, bat, walk, swing, leap, smash, roperIdle, roperAttack, slugMove, ratRun, ratBite, skeletonWalk, skeletonAttack, skeletonArcherWalk, skeletonArcherShoot, bombExplosion, caterpillarLarva, caterpillarPupa, caterpillarFly, caterpillarRam, caterpillarPowder] = await Promise.all([
      Promise.all(snakeUrls.map(loadImage)),
      Promise.all(batUrls.map(loadImage)),
      Promise.all(goblinWalkUrls.map(loadImage)),
      Promise.all(goblinSwingUrls.map(loadImage)),
      Promise.all(goblinLeapUrls.map(loadImage)),
      Promise.all(goblinSmashUrls.map(loadImage)),
      Promise.all(roperIdleUrls.map(loadImage)),
      Promise.all(roperAttackUrls.map(loadImage)),
      Promise.all(slugMoveUrls.map(loadImage)),
      Promise.all(ratRunUrls.map(loadImage)),
      Promise.all(ratBiteUrls.map(loadImage)),
      Promise.all(skeletonWalkUrls.map(loadImage)),
      Promise.all(skeletonAttackUrls.map(loadImage)),
      Promise.all(skeletonArcherWalkUrls.map(loadImage)),
      Promise.all(skeletonArcherShootUrls.map(loadImage)),
      Promise.all(bombExplosionUrls.map(loadImage)),
      Promise.all(caterpillarLarvaUrls.map(loadImage)),
      Promise.all(caterpillarPupaUrls.map(loadImage)),
      Promise.all(caterpillarFlyUrls.map(loadImage)),
      Promise.all(caterpillarRamUrls.map(loadImage)),
      Promise.all(caterpillarPowderUrls.map(loadImage)),
    ]);
    this.snakeImages.push(...snake);
    this.batImages.push(...bat);
    this.goblinWalkImages.push(...walk);
    this.goblinSwingImages.push(...swing);
    this.goblinLeapImages.push(...leap);
    this.goblinSmashImages.push(...smash);
    this.roperIdleImages.push(...roperIdle);
    this.roperAttackImages.push(...roperAttack);
    this.slugMoveImages.push(...slugMove);
    this.ratRunImages.push(...ratRun);
    this.ratBiteImages.push(...ratBite);
    this.skeletonWalkImages.push(...skeletonWalk);
    this.skeletonAttackImages.push(...skeletonAttack);
    this.skeletonArcherWalkImages.push(...skeletonArcherWalk);
    this.skeletonArcherShootImages.push(...skeletonArcherShoot);
    this.bombExplosionImages.push(...bombExplosion);
    this.caterpillarLarvaImages.push(...caterpillarLarva);
    this.caterpillarPupaImages.push(...caterpillarPupa);
    this.caterpillarFlyImages.push(...caterpillarFly);
    this.caterpillarRamImages.push(...caterpillarRam);
    this.caterpillarPowderImages.push(...caterpillarPowder);
  }

  draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.type === 'slime') this.drawSlime(ctx, enemy as Slime);
    else if (enemy.type === 'goblin') this.drawGoblin(ctx, enemy as Goblin);
    else if (enemy.type === 'ahriman') this.drawAhriman(ctx, enemy as Ahriman);
    else if (enemy.type === 'snake') this.drawSnake(ctx, enemy as Snake);
    else if (enemy.type === 'bat') this.drawBat(ctx, enemy as Bat);
    else if (enemy.type === 'roper') this.drawRoper(ctx, enemy as Roper);
    else if (enemy.type === 'slug') this.drawSlug(ctx, enemy as Slug);
    else if (enemy.type === 'rat') this.drawRat(ctx, enemy as Rat);
    else if (enemy.type === 'bomb') this.drawBomb(ctx, enemy as Bomb);
    else if (enemy.type === 'caterpillar') this.drawCaterpillar(ctx, enemy as Caterpillar);
    else if (enemy.type === 'skeletonArcher') this.drawSkeletonArcher(ctx, enemy as SkeletonArcher);
    else this.drawSkeleton(ctx, enemy as Skeleton);
  }

  private drawSlime(ctx: CanvasRenderingContext2D, slime: Slime): void {
    let image = this.slimeImage;
    let drawW = 72;
    let drawH = 48;
    let drawY = slime.y + slime.h - drawH + 1;
    let crawlPhase = 0;
    let visibleBounds: SpriteBounds | null = null;

    if (slime.state === 'cling' || slime.state === 'drop') {
      image = this.clingImage;
      drawW = 54;
      drawH = 36;
      drawY = slime.y + 2;
    } else if (slime.state === 'pounce') {
      drawW = 68;
      drawH = 42;
      drawY = slime.y + slime.h - drawH;
    } else {
      visibleBounds = getOpaqueBounds(image);
      drawW = 72 * (visibleBounds.w / Math.max(1, image.naturalWidth));
      drawH = 48 * (visibleBounds.h / Math.max(1, image.naturalHeight));
      crawlPhase = Math.sin(slime.actionTime * 11);
      drawW *= 1 + Math.abs(crawlPhase) * 0.10;
      drawH *= 1 - Math.abs(crawlPhase) * 0.13;
      drawY = slime.y + slime.h - drawH + 1;
    }

    ctx.save();
    const centerX = slime.x + slime.w / 2 + crawlPhase * 0.9;
    ctx.translate(centerX, 0);
    if (slime.facing < 0) ctx.scale(-1, 1);

    if (visibleBounds) {
      ctx.drawImage(
        image,
        visibleBounds.x,
        visibleBounds.y,
        visibleBounds.w,
        visibleBounds.h,
        -drawW / 2,
        drawY,
        drawW,
        drawH,
      );
    } else {
      ctx.drawImage(image, -drawW / 2, drawY, drawW, drawH);
    }

    ctx.restore();
  }

  private drawGoblin(ctx: CanvasRenderingContext2D, goblin: Goblin): void {
    let images: HTMLImageElement[] = this.goblinWalkImages;
    let index = Math.floor(goblin.actionTime * 10) % Math.max(1, images.length);

    if (goblin.state === 'swing') {
      images = this.goblinSwingImages;
      index = Math.min(images.length - 1, Math.floor((goblin.actionTime / 0.42) * images.length));
    } else if (goblin.state === 'leap') {
      images = this.goblinLeapImages;
      index = Math.min(images.length - 1, Math.floor(goblin.actionTime * 6));
    } else if (goblin.state === 'smash') {
      images = this.goblinSmashImages;
      index = Math.min(images.length - 1, Math.floor((goblin.actionTime / 0.38) * images.length));
    }

    const image = images[index] ?? images[0];
    if (!image) return;

    const bounds = getOpaqueBounds(image);
    const centerX = goblin.x + goblin.w / 2;
    const footY = goblin.y + goblin.h + 2;
    const drawH = 62;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const drawY = -(bounds.y + bounds.h) * (drawH / Math.max(1, image.naturalHeight));

    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, goblin.facing, SOURCE_FACING.goblin);
    ctx.drawImage(image, -drawW / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private drawAhriman(ctx: CanvasRenderingContext2D, ahriman: Ahriman): void {
    const drawW = 76;
    const drawH = 40;
    const castingKind = ahriman.castingKind;
    const flapSpeed = castingKind ? 3.8 : 13;
    const flapStrength = castingKind ? 1.2 : 5;
    const flap = Math.sin(ahriman.actionTime * flapSpeed);
    const centerX = ahriman.x + ahriman.w / 2;
    const centerY = ahriman.y + ahriman.h / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (ahriman.facing < 0) ctx.scale(-1, 1);

    if (castingKind) {
      const accent = castingKind === 'fireball' ? '#ff9342' : '#85f0ff';
      const accent2 = castingKind === 'fireball' ? '#6b1930' : '#265f7a';
      const radius = 19 + Math.sin(ahriman.actionTime * 6) * 3.5;

      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 16, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = accent2;
      for (let i = 0; i < 6; i += 1) {
        const angle = ahriman.actionTime * 3.4 + i * (Math.PI * 2 / 6);
        const px = Math.cos(angle) * (radius + 2);
        const py = 16 + Math.sin(angle) * (radius * 0.42);
        ctx.fillRect(Math.round(px) - 2, Math.round(py) - 2, 4, 4);
      }

      ctx.fillStyle = accent;
      ctx.fillRect(-4, -18, 8, 4);
    }

    const sourceW = this.ahrimanImage.naturalWidth;
    const sourceH = this.ahrimanImage.naturalHeight;
    const wingW = Math.floor(sourceW * 0.34);
    const bodyW = sourceW - wingW * 2;
    const wingLift = flap * flapStrength;
    const wingScaleY = 0.78 + (flap + 1) * 0.18;

    ctx.save();
    ctx.translate(-drawW / 2, wingLift * -0.45);
    ctx.scale(1, wingScaleY);
    ctx.drawImage(this.ahrimanImage, 0, 0, wingW, sourceH, 0, -drawH / 2, drawW * 0.34, drawH);
    ctx.restore();

    ctx.drawImage(this.ahrimanImage, wingW, 0, bodyW, sourceH, -drawW * 0.16, -drawH / 2, drawW * 0.32, drawH);

    ctx.save();
    ctx.translate(drawW * 0.16, wingLift * -0.45);
    ctx.scale(1, wingScaleY);
    ctx.drawImage(this.ahrimanImage, wingW + bodyW, 0, wingW, sourceH, 0, -drawH / 2, drawW * 0.34, drawH);
    ctx.restore();
    ctx.restore();
  }

  private drawSnake(ctx: CanvasRenderingContext2D, snake: Snake): void {
    const frame = snake.state === 'strike' ? 2 : Math.floor(snake.actionTime * 8) % this.snakeImages.length;
    const image = this.snakeImages[frame] ?? this.snakeImages[0];
    if (!image) return;
    const drawW = snake.state === 'strike' ? 64 : 58;
    const drawH = snake.state === 'strike' ? 38 : 34;
    const centerX = snake.x + snake.w / 2;
    const footY = snake.y + snake.h + 2;
    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, snake.facing, SOURCE_FACING.snake);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }

  private drawBat(ctx: CanvasRenderingContext2D, bat: Bat): void {
    const frame = Math.floor(bat.actionTime * 10) % this.batImages.length;
    const image = this.batImages[frame] ?? this.batImages[0];
    if (!image) return;
    const drawW = 52;
    const drawH = 30;
    const bob = Math.sin(bat.actionTime * 14) * 1.5;
    const centerX = bat.x + bat.w / 2;
    const centerY = bat.y + bat.h / 2 + bob;
    ctx.save();
    ctx.translate(centerX, centerY);
    if (bat.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }


  private drawBomb(ctx: CanvasRenderingContext2D, bomb: Bomb): void {
    const centerX = bomb.x + bomb.w / 2;
    const centerY = bomb.y + bomb.h / 2;

    if (bomb.state === 'explode') {
      const progress = Math.min(1, bomb.actionTime / BALANCE.bomb.explosionDuration);
      const frameIndex = Math.min(
        this.bombExplosionImages.length - 1,
        Math.floor(progress * this.bombExplosionImages.length),
      );
      const image = this.bombExplosionImages[frameIndex] ?? this.bombExplosionImages[0];
      if (!image) return;

      // Real sprite animation; no rectangular panel and no single-circle explosion.
      const drawSize = BALANCE.bomb.explosionRadius * 2.08;
      const pulse = progress < 0.18 ? 1 + (0.18 - progress) * 0.9 : 1;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);
      ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
      return;
    }

    const fuseFlash = bomb.state === 'fuse' ? (Math.sin(bomb.actionTime * 18) * 0.5 + 0.5) : 0;
    const radius = 12 + Math.sin(bomb.actionTime * 12) * 0.45;
    const rollOffset = bomb.state === 'roll' ? Math.sin(bomb.actionTime * 10) * 0.7 : 0;
    const rollAngle = bomb.x / 12;

    ctx.save();
    ctx.translate(centerX, centerY + rollOffset);
    ctx.rotate(rollAngle);

    ctx.fillStyle = fuseFlash > 0.45 ? '#f27d34' : '#363d4e';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fuseFlash > 0.45 ? '#ffb347' : '#737a8f';
    ctx.beginPath();
    ctx.arc(-3, -4, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#11151d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#1a1f2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, -0.9, 0.9);
    ctx.stroke();

    ctx.fillStyle = '#14181f';
    ctx.fillRect(-5, -2, 3, 3);
    ctx.fillRect(2, -2, 3, 3);
    ctx.fillRect(-3, 5, 6, 2);

    ctx.strokeStyle = '#59462a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -10);
    ctx.lineTo(8, -18);
    ctx.stroke();

    ctx.fillStyle = bomb.state === 'fuse' ? '#ffe86e' : '#ff9c3d';
    ctx.fillRect(8, -20, 4, 4);
    if (bomb.state === 'fuse') {
      ctx.fillStyle = '#fff5bf';
      ctx.fillRect(11, -23, 3, 3);
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(13, -18, 2, 2);
      ctx.fillRect(7, -24, 2, 2);
    }

    ctx.restore();
  }


  private drawRoper(ctx: CanvasRenderingContext2D, roper: Roper): void {
    const images = roper.state === 'attack' ? this.roperAttackImages : this.roperIdleImages;
    const speed = roper.state === 'attack' ? 8 : 5;
    const frame = Math.floor(roper.actionTime * speed) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    if (!image) return;

    const reference = this.roperIdleImages[0] ?? image;
    const scale = 82 / Math.max(1, reference.naturalHeight);
    const bounds = getOpaqueBounds(image);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawY = -(bounds.y + bounds.h) * scale;
    const centerX = roper.x + roper.w / 2;
    const footY = roper.y + roper.h + 1;

    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, roper.facing, SOURCE_FACING.roper);
    ctx.drawImage(image, -drawW / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private drawSlug(ctx: CanvasRenderingContext2D, slug: Slug): void {
    const frame = Math.floor(slug.actionTime * 9) % Math.max(1, this.slugMoveImages.length);
    const image = this.slugMoveImages[frame] ?? this.slugMoveImages[0];
    if (!image) return;

    const drawH = 18;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = slug.x + slug.w / 2;
    const footY = slug.y + slug.h + 1;

    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, slug.facing, SOURCE_FACING.slug);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }

  private drawRat(ctx: CanvasRenderingContext2D, rat: Rat): void {
    const images = rat.state === 'bite' ? this.ratBiteImages : this.ratRunImages;
    const frame = Math.floor(rat.actionTime * 12) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    if (!image) return;

    const drawH = rat.state === 'bite' ? 27 : 24;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = rat.x + rat.w / 2;
    const footY = rat.y + rat.h + 1;

    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, rat.facing, SOURCE_FACING.rat);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }



  private drawCaterpillar(ctx: CanvasRenderingContext2D, caterpillar: Caterpillar): void {
    let images: HTMLImageElement[];
    let index = 0;
    let drawH = 36;

    if (caterpillar.phase === 'larva') {
      images = this.caterpillarLarvaImages;
      index = Math.floor(caterpillar.actionTime * 9) % Math.max(1, images.length);
      drawH = 34;
    } else if (caterpillar.phase === 'pupa') {
      images = this.caterpillarPupaImages;
      const progress = Math.min(0.999, caterpillar.phaseTime / BALANCE.caterpillar.pupaDuration);
      index = Math.min(images.length - 1, Math.floor(progress * images.length));
      drawH = 42;
    } else if (caterpillar.butterflyState === 'powder') {
      images = this.caterpillarPowderImages;
      index = Math.floor(caterpillar.actionTime * 11) % Math.max(1, images.length);
      drawH = 68;
    } else if (caterpillar.butterflyState === 'ram' || caterpillar.butterflyState === 'ramWindup') {
      images = this.caterpillarRamImages;
      index = Math.floor(caterpillar.actionTime * 12) % Math.max(1, images.length);
      drawH = 66;
    } else {
      images = this.caterpillarFlyImages;
      index = Math.floor(caterpillar.phaseTime * 11) % Math.max(1, images.length);
      drawH = 72;
    }

    const image = images[index] ?? images[0];
    if (!image) return;

    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = caterpillar.x + caterpillar.w / 2;

    if (caterpillar.phase === 'butterfly' && caterpillar.butterflyState === 'powder') {
      const release = BALANCE.caterpillar.powderReleaseTime;
      const progress = Math.min(1, caterpillar.actionTime / Math.max(0.01, release));
      const cloudRadius = 24 + progress * 112;

      ctx.save();
      for (let i = 0; i < 34; i += 1) {
        const seed = i * 2.399963 + caterpillar.actionTime * (1.4 + (i % 3) * 0.18);
        const ring = ((i * 17) % 31) / 31;
        const radius = cloudRadius * (0.22 + ring * 0.78);
        const px = centerX + Math.cos(seed) * radius;
        const py = caterpillar.y + caterpillar.h / 2
          + Math.sin(seed * 1.23) * radius * 0.58;
        const size = 2 + (i % 3);
        ctx.globalAlpha = 0.24 + (i % 5) * 0.07;
        ctx.fillStyle =
          i % 3 === 0 ? '#b7df36' :
          i % 3 === 1 ? '#e33e9f' :
          '#71308c';
        ctx.fillRect(Math.round(px), Math.round(py), size, size);
      }
      ctx.restore();
    }

    ctx.save();
    if (caterpillar.phase === 'butterfly') {
      const centerY = caterpillar.y + caterpillar.h / 2;
      const hover = Math.sin(caterpillar.phaseTime * 7.4) * 2.2;
      ctx.translate(centerX, centerY + hover);
      applySpriteFacing(ctx, caterpillar.facing, SOURCE_FACING.caterpillar);
      if (caterpillar.butterflyState === 'ramWindup') {
        ctx.rotate(caterpillar.facing * -0.09);
      } else if (caterpillar.butterflyState === 'ram') {
        ctx.rotate(Math.atan2(caterpillar.vy, Math.max(0.01, Math.abs(caterpillar.vx))) * 0.28);
      }
      ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      const footY = caterpillar.y + caterpillar.h + 1;
      const squash = caterpillar.phase === 'larva'
        ? Math.sin(caterpillar.actionTime * 18) * 1.4
        : Math.sin(caterpillar.phaseTime * 7) * 0.8;
      ctx.translate(centerX, footY);
      applySpriteFacing(ctx, caterpillar.facing, SOURCE_FACING.caterpillar);
      const groundOffset = caterpillar.phase === 'larva' ? 6 : 0;
      ctx.drawImage(image, -drawW / 2, -drawH + squash + groundOffset, drawW, drawH - squash);
    }
    ctx.restore();
  }

private drawSkeletonArcher(ctx: CanvasRenderingContext2D, skeletonArcher: SkeletonArcher): void {
    const attacking = skeletonArcher.state === 'attack';
    const images = attacking
      ? this.skeletonArcherShootImages
      : this.skeletonArcherWalkImages;
    if (images.length === 0) return;

    const index = attacking
      ? Math.min(
          images.length - 1,
          Math.floor((skeletonArcher.actionTime / 0.5) * images.length),
        )
      : Math.floor(skeletonArcher.actionTime * 8) % Math.max(1, images.length);

    const image = images[index] ?? images[0];
    if (!image) return;

    const swordReference = this.skeletonWalkImages[0] ?? image;
    const swordBounds = getOpaqueBounds(swordReference);
    const swordScale = 96 / Math.max(1, swordReference.naturalHeight);
    const targetVisibleH = swordBounds.h * swordScale;
    const reference = this.skeletonArcherWalkImages[0] ?? image;
    const referenceBounds = getOpaqueBounds(reference);
    const scale = targetVisibleH / Math.max(1, referenceBounds.h);
    const bounds = getOpaqueBounds(image);

    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawX = -(bounds.x + bounds.w / 2) * scale;
    const drawY = -(bounds.y + bounds.h) * scale;

    const centerX = skeletonArcher.x + skeletonArcher.w / 2;
    const footY = skeletonArcher.y + skeletonArcher.h + 1;

    const tension = attacking && !skeletonArcher.shotReleased
      ? Math.min(1, index / Math.max(1, images.length - 1))
      : 0;
    const recoil = attacking && skeletonArcher.shotReleased
      ? Math.max(0, 1 - (skeletonArcher.actionTime - 0.18) * 7)
      : 0;

    ctx.save();
    ctx.translate(centerX - tension * 1.2 + recoil * 1.4, footY);
    applySpriteFacing(ctx, skeletonArcher.facing, SOURCE_FACING.skeletonArcher);
    ctx.drawImage(
      image,
      drawX,
      drawY + recoil * 0.5,
      drawW,
      drawH,
    );
    ctx.restore();
  }

private drawSkeleton(ctx: CanvasRenderingContext2D, skeleton: Skeleton): void {
    const attacking = skeleton.state === 'attack';
    const images = attacking
      ? this.skeletonAttackImages
      : this.skeletonWalkImages;
    if (images.length === 0) return;

    const frame = attacking
      ? Math.min(
          images.length - 1,
          Math.floor((skeleton.actionTime / 0.42) * images.length),
        )
      : Math.floor(skeleton.actionTime * 8) % Math.max(1, images.length);

    const image = images[frame] ?? images[0];
    if (!image) return;

    const reference = this.skeletonWalkImages[0] ?? image;
    const scale = 96 / Math.max(1, reference.naturalHeight);
    const bounds = getOpaqueBounds(image);

    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    const drawX = -(bounds.x + bounds.w / 2) * scale;
    const drawY = -(bounds.y + bounds.h) * scale;

    const centerX = skeleton.x + skeleton.w / 2;
    const footY = skeleton.y + skeleton.h + 1;

    ctx.save();
    ctx.translate(centerX, footY);
    applySpriteFacing(ctx, skeleton.facing, SOURCE_FACING.skeleton);
    ctx.drawImage(
      image,
      drawX,
      drawY,
      drawW,
      drawH,
    );
    ctx.restore();
  }

}

function applySpriteFacing(
  ctx: CanvasRenderingContext2D,
  logicalFacing: Facing,
  sourceFacing: Facing,
): void {
  if (logicalFacing !== sourceFacing) ctx.scale(-1, 1);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = src;
  });
}
