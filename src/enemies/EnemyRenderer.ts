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
const goblinClimbUrls = [1, 2].map((index) =>
  new URL(`../../assets/monsters/goblin/climb_0${index}.svg`, import.meta.url).href,
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
const roperHurtUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/roper/hurt_0${index}.png`, import.meta.url).href,
);

const slugMoveUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/slug/move_0${index}.png`, import.meta.url).href,
);
const slugSquashUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/slug/squash_0${index}.png`, import.meta.url).href,
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
const skeletonClimbUrls = [1, 2].map((index) =>
  new URL(`../../assets/monsters/skeleton/climb_0${index}.svg`, import.meta.url).href,
);
const skeletonAttackUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/skeleton/attack_0${index}.png`, import.meta.url).href,
);
const skeletonHurtUrls = [1, 2, 3, 4].map((index) =>
  new URL(`../../assets/monsters/skeleton/hurt_0${index}.png`, import.meta.url).href,
);

const skeletonArcherWalkUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/skeleton_archer/walk_0${index}.png`, import.meta.url).href,
);
const skeletonArcherShootUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/monsters/skeleton_archer/shoot_0${index}.png`, import.meta.url).href,
);

const bombExplosionUrls = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) =>
  new URL(
    `../../assets/effects/bomb_explosion/explosion_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);

const caterpillarLarvaUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(
    `../../assets/monsters/caterpillar/larva/crawl_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const caterpillarPupaUrls = [1, 2, 3, 4].map((index) =>
  new URL(
    `../../assets/monsters/caterpillar/pupa/pupa_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const caterpillarFlyUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(
    `../../assets/monsters/caterpillar/butterfly_fly/fly_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const caterpillarRamUrls = [1, 2, 3, 4].map((index) =>
  new URL(
    `../../assets/monsters/caterpillar/butterfly_ram/ram_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);
const caterpillarPowderUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(
    `../../assets/monsters/caterpillar/butterfly_powder/powder_${String(index).padStart(2, '0')}.png`,
    import.meta.url,
  ).href,
);

const SOURCE_FACING = {
  goblin: -1,
  snake: -1,
  bat: 1,
  roper: -1,
  slug: 1,
  rat: 1,
  skeleton: -1,
  skeletonArcher: -1,
  // Keep lifecycle sprite directions independent. Larva art is authored facing right,
  // while the redesigned butterfly set uses the opposite source orientation.
  // Do not collapse these back into one caterpillar facing value.
  caterpillarLarva: 1,
  caterpillarPupa: 1,
  caterpillarButterfly: -1,
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

function scaleFromReference(reference: HTMLImageElement, targetFullHeight: number): number {
  return targetFullHeight / Math.max(1, reference.naturalHeight);
}

function drawGroundedSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  footY: number,
  scale: number,
  logicalFacing: Facing,
  sourceFacing: Facing,
  offsetX = 0,
  offsetY = 0,
): void {
  const bounds = getOpaqueBounds(image);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const drawX = -(bounds.x + bounds.w / 2) * scale + offsetX;
  const drawY = -(bounds.y + bounds.h) * scale + offsetY;

  ctx.save();
  ctx.translate(centerX, footY);
  applySpriteFacing(ctx, logicalFacing, sourceFacing);
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function drawCenteredSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  scale: number,
  logicalFacing: Facing,
  sourceFacing: Facing,
): void {
  const bounds = getOpaqueBounds(image);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const drawX = -(bounds.x + bounds.w / 2) * scale;
  const drawY = -(bounds.y + bounds.h / 2) * scale;

  ctx.save();
  ctx.translate(centerX, centerY);
  applySpriteFacing(ctx, logicalFacing, sourceFacing);
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function drawRearClimbSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  footY: number,
  targetVisibleHeight: number,
): void {
  const bounds = getOpaqueBounds(image);
  const scale = targetVisibleHeight / Math.max(1, bounds.h);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const drawX = -(bounds.x + bounds.w / 2) * scale;
  const drawY = -(bounds.y + bounds.h) * scale;

  ctx.save();
  ctx.translate(centerX, footY);
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
  ctx.restore();
}
function drawClimbingSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  footY: number,
  scale: number,
  logicalFacing: Facing,
  sourceFacing: Facing,
  time: number,
  gripColor: string,
): void {
  const bounds = getOpaqueBounds(image);
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const drawX = -(bounds.x + bounds.w / 2) * scale;
  const drawY = -(bounds.y + bounds.h) * scale;

  const sourceW = Math.max(1, image.naturalWidth);
  const sourceH = Math.max(1, image.naturalHeight);
  const splitX = Math.floor(sourceW * 0.5);
  const splitY = Math.floor(sourceH * 0.56);
  const scaleX = drawW / sourceW;
  const scaleY = drawH / sourceH;
  const phase = Math.sin(time * 15);
  const bob = Math.abs(Math.cos(time * 15)) * 1.5;
  const upperShift = phase * 2.4;
  const lowerShift = phase * 3.2;

  ctx.save();
  ctx.translate(centerX + phase * 0.8, footY - bob);
  applySpriteFacing(ctx, logicalFacing, sourceFacing);

  ctx.drawImage(
    image,
    0,
    0,
    splitX,
    splitY,
    drawX,
    drawY + upperShift,
    splitX * scaleX,
    splitY * scaleY,
  );
  ctx.drawImage(
    image,
    splitX,
    0,
    sourceW - splitX,
    splitY,
    drawX + splitX * scaleX,
    drawY - upperShift,
    (sourceW - splitX) * scaleX,
    splitY * scaleY,
  );
  ctx.drawImage(
    image,
    0,
    splitY,
    splitX,
    sourceH - splitY,
    drawX,
    drawY + splitY * scaleY - lowerShift,
    splitX * scaleX,
    (sourceH - splitY) * scaleY,
  );
  ctx.drawImage(
    image,
    splitX,
    splitY,
    sourceW - splitX,
    sourceH - splitY,
    drawX + splitX * scaleX,
    drawY + splitY * scaleY + lowerShift,
    (sourceW - splitX) * scaleX,
    (sourceH - splitY) * scaleY,
  );

  const visibleH = bounds.h * scale;
  ctx.fillStyle = gripColor;
  ctx.globalAlpha = 0.92;
  const handY = -visibleH * 0.60;
  const footLocalY = -visibleH * 0.16;
  ctx.fillRect(-8, handY + phase * 4.8 - 2, 4, 4);
  ctx.fillRect(4, handY - phase * 4.8 - 2, 4, 4);
  ctx.fillRect(-9, footLocalY - phase * 4.8 - 2, 5, 4);
  ctx.fillRect(4, footLocalY + phase * 4.8 - 2, 5, 4);

  ctx.restore();
}
export class EnemyRenderer {
  private slimeImage!: HTMLImageElement;
  private clingImage!: HTMLImageElement;
  private ahrimanImage!: HTMLImageElement;

  private readonly snakeImages: HTMLImageElement[] = [];
  private readonly batImages: HTMLImageElement[] = [];

  private readonly goblinWalkImages: HTMLImageElement[] = [];
  private readonly goblinClimbImages: HTMLImageElement[] = [];
  private readonly goblinSwingImages: HTMLImageElement[] = [];
  private readonly goblinLeapImages: HTMLImageElement[] = [];
  private readonly goblinSmashImages: HTMLImageElement[] = [];

  private readonly roperIdleImages: HTMLImageElement[] = [];
  private readonly roperAttackImages: HTMLImageElement[] = [];
  private readonly roperHurtImages: HTMLImageElement[] = [];

  private readonly slugMoveImages: HTMLImageElement[] = [];
  private readonly slugSquashImages: HTMLImageElement[] = [];

  private readonly ratRunImages: HTMLImageElement[] = [];
  private readonly ratBiteImages: HTMLImageElement[] = [];

  private readonly skeletonWalkImages: HTMLImageElement[] = [];
  private readonly skeletonClimbImages: HTMLImageElement[] = [];
  private readonly skeletonAttackImages: HTMLImageElement[] = [];
  private readonly skeletonHurtImages: HTMLImageElement[] = [];

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

    const [
      snake,
      bat,
      goblinWalk,
      goblinClimb,
      goblinSwing,
      goblinLeap,
      goblinSmash,
      roperIdle,
      roperAttack,
      roperHurt,
      slugMove,
      slugSquash,
      ratRun,
      ratBite,
      skeletonWalk,
      skeletonClimb,
      skeletonAttack,
      skeletonHurt,
      skeletonArcherWalk,
      skeletonArcherShoot,
      bombExplosion,
      caterpillarLarva,
      caterpillarPupa,
      caterpillarFly,
      caterpillarRam,
      caterpillarPowder,
    ] = await Promise.all([
      Promise.all(snakeUrls.map(loadImage)),
      Promise.all(batUrls.map(loadImage)),
      Promise.all(goblinWalkUrls.map(loadImage)),
      Promise.all(goblinClimbUrls.map(loadImage)),
      Promise.all(goblinSwingUrls.map(loadImage)),
      Promise.all(goblinLeapUrls.map(loadImage)),
      Promise.all(goblinSmashUrls.map(loadImage)),
      Promise.all(roperIdleUrls.map(loadImage)),
      Promise.all(roperAttackUrls.map(loadImage)),
      Promise.all(roperHurtUrls.map(loadImage)),
      Promise.all(slugMoveUrls.map(loadImage)),
      Promise.all(slugSquashUrls.map(loadImage)),
      Promise.all(ratRunUrls.map(loadImage)),
      Promise.all(ratBiteUrls.map(loadImage)),
      Promise.all(skeletonWalkUrls.map(loadImage)),
      Promise.all(skeletonClimbUrls.map(loadImage)),
      Promise.all(skeletonAttackUrls.map(loadImage)),
      Promise.all(skeletonHurtUrls.map(loadImage)),
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
    this.goblinWalkImages.push(...goblinWalk);
    this.goblinClimbImages.push(...goblinClimb);
    this.goblinSwingImages.push(...goblinSwing);
    this.goblinLeapImages.push(...goblinLeap);
    this.goblinSmashImages.push(...goblinSmash);
    this.roperIdleImages.push(...roperIdle);
    this.roperAttackImages.push(...roperAttack);
    this.roperHurtImages.push(...roperHurt);
    this.slugMoveImages.push(...slugMove);
    this.slugSquashImages.push(...slugSquash);
    this.ratRunImages.push(...ratRun);
    this.ratBiteImages.push(...ratBite);
    this.skeletonWalkImages.push(...skeletonWalk);
    this.skeletonClimbImages.push(...skeletonClimb);
    this.skeletonAttackImages.push(...skeletonAttack);
    this.skeletonHurtImages.push(...skeletonHurt);
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
    else if (enemy.type === 'skeletonArcher') {
      this.drawSkeletonArcher(ctx, enemy as SkeletonArcher);
    } else {
      this.drawSkeleton(ctx, enemy as Skeleton);
    }
  }

  private drawSlime(ctx: CanvasRenderingContext2D, slime: Slime): void {
    let image = this.slimeImage;
    let drawW = 34;
    let drawH = 22;
    let drawY = slime.y + slime.h - drawH + 1;
    let crawlPhase = 0;

    if (slime.state === 'cling' || slime.state === 'drop') {
      image = this.clingImage;
      drawW = 34;
      drawH = 22;
      drawY = slime.y + 2;
    } else if (slime.state === 'pounce') {
      drawW = 34;
      drawH = 22;
      drawY = slime.y + slime.h - drawH;
    } else {
      crawlPhase = Math.sin(slime.actionTime * 11);
      drawW *= 1 + Math.abs(crawlPhase) * 0.10;
      drawH *= 1 - Math.abs(crawlPhase) * 0.13;
      drawY = slime.y + slime.h - drawH + 1;
    }

    const centerX = slime.x + slime.w / 2 + crawlPhase * 0.9;
    ctx.save();
    ctx.translate(centerX, 0);
    if (slime.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private drawGoblin(ctx: CanvasRenderingContext2D, goblin: Goblin): void {
    let images: HTMLImageElement[] = this.goblinWalkImages;
    let index = Math.floor(goblin.actionTime * (goblin.state === 'climb' ? 14 : 10)) % Math.max(1, images.length);

    if (goblin.state === 'swing') {
      images = this.goblinSwingImages;
      index = Math.min(
        images.length - 1,
        Math.floor((goblin.actionTime / 0.42) * images.length),
      );
    } else if (goblin.state === 'leap') {
      images = this.goblinLeapImages;
      index = Math.min(images.length - 1, Math.floor(goblin.actionTime * 6));
    } else if (goblin.state === 'smash') {
      images = this.goblinSmashImages;
      index = Math.min(
        images.length - 1,
        Math.floor((goblin.actionTime / 0.38) * images.length),
      );
    }

    const image = images[index] ?? images[0];
    const reference = this.goblinWalkImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 62);
    if (goblin.state === 'climb') {
      const climbIndex =
        Math.floor(goblin.actionTime * 5) % Math.max(1, this.goblinClimbImages.length);
      const climbImage = this.goblinClimbImages[climbIndex];

      if (climbImage?.complete && climbImage.naturalWidth > 0) {
        drawRearClimbSprite(
          ctx,
          climbImage,
          goblin.x + goblin.w / 2,
          goblin.y + goblin.h + 2,
          62,
        );
      } else {
        drawClimbingSprite(
          ctx,
          image,
          goblin.x + goblin.w / 2,
          goblin.y + goblin.h + 2,
          scale,
          goblin.facing,
          SOURCE_FACING.goblin,
          goblin.actionTime,
          '#8ca45a',
        );
      }
      return;
    }
    drawGroundedSprite(
      ctx,
      image,
      goblin.x + goblin.w / 2,
      goblin.y + goblin.h + 2,
      scale,
      goblin.facing,
      SOURCE_FACING.goblin,
    );
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
    ctx.drawImage(
      this.ahrimanImage,
      0,
      0,
      wingW,
      sourceH,
      0,
      -drawH / 2,
      drawW * 0.34,
      drawH,
    );
    ctx.restore();

    ctx.drawImage(
      this.ahrimanImage,
      wingW,
      0,
      bodyW,
      sourceH,
      -drawW * 0.16,
      -drawH / 2,
      drawW * 0.32,
      drawH,
    );

    ctx.save();
    ctx.translate(drawW * 0.16, wingLift * -0.45);
    ctx.scale(1, wingScaleY);
    ctx.drawImage(
      this.ahrimanImage,
      wingW + bodyW,
      0,
      wingW,
      sourceH,
      0,
      -drawH / 2,
      drawW * 0.34,
      drawH,
    );
    ctx.restore();
    ctx.restore();
  }

  private drawSnake(ctx: CanvasRenderingContext2D, snake: Snake): void {
    const frame = snake.state === 'strike'
      ? 2
      : Math.floor(snake.actionTime * 8) % Math.max(1, this.snakeImages.length);
    const image = this.snakeImages[frame] ?? this.snakeImages[0];
    const reference = this.snakeImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 34);
    drawGroundedSprite(
      ctx,
      image,
      snake.x + snake.w / 2,
      snake.y + snake.h + 2,
      scale,
      snake.facing,
      SOURCE_FACING.snake,
    );
  }

  private drawBat(ctx: CanvasRenderingContext2D, bat: Bat): void {
    const frame = Math.floor(bat.actionTime * 10) % Math.max(1, this.batImages.length);
    const image = this.batImages[frame] ?? this.batImages[0];
    const reference = this.batImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 30);
    const bob = Math.sin(bat.actionTime * 14) * 1.5;
    drawCenteredSprite(
      ctx,
      image,
      bat.x + bat.w / 2,
      bat.y + bat.h / 2 + bob,
      scale,
      bat.facing,
      SOURCE_FACING.bat,
    );
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
      const image =
        this.bombExplosionImages[frameIndex] ?? this.bombExplosionImages[0];
      if (!image) return;

      const drawSize = BALANCE.bomb.explosionRadius * 2.08;
      const pulse = progress < 0.18 ? 1 + (0.18 - progress) * 0.9 : 1;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(pulse, pulse);
      ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();
      return;
    }

    const fuseFlash =
      bomb.state === 'fuse' ? Math.sin(bomb.actionTime * 18) * 0.5 + 0.5 : 0;
    const radius = 12 + Math.sin(bomb.actionTime * 12) * 0.45;
    const rollOffset =
      bomb.state === 'roll' ? Math.sin(bomb.actionTime * 10) * 0.7 : 0;
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
    const hurt = roper.knockbackTime > 0 && this.roperHurtImages.length > 0;
    const images = hurt
      ? this.roperHurtImages
      : roper.state === 'attack'
        ? this.roperAttackImages
        : this.roperIdleImages;

    const speed = hurt ? 12 : roper.state === 'attack' ? 8 : 5;
    const frame = Math.floor(roper.actionTime * speed) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    const reference = this.roperIdleImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 82);
    drawGroundedSprite(
      ctx,
      image,
      roper.x + roper.w / 2,
      roper.y + roper.h + 1,
      scale,
      roper.facing,
      SOURCE_FACING.roper,
    );
  }

  private drawSlug(ctx: CanvasRenderingContext2D, slug: Slug): void {
    const squashed = slug.knockbackTime > 0 && this.slugSquashImages.length > 0;
    const idle = slug.paused ? !squashed : false;
    const images = squashed ? this.slugSquashImages : this.slugMoveImages;
    const speed = squashed ? 12 : 9;
    const frame = idle ? 0 : Math.floor(slug.actionTime * speed) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    const reference = this.slugMoveImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 22);
    const idlePulse = idle ? Math.sin(slug.actionTime * 1.35) : 0;
    const drawScale = scale * (1 + idlePulse * 0.007);
    const idleLift = 0;
    drawGroundedSprite(
      ctx,
      image,
      slug.x + slug.w / 2,
      slug.y + slug.h + 1 + idleLift,
      drawScale,
      slug.facing,
      SOURCE_FACING.slug,
    );
  }

  private drawRat(ctx: CanvasRenderingContext2D, rat: Rat): void {
    const images = rat.state === 'bite' ? this.ratBiteImages : this.ratRunImages;
    const frame = Math.floor(rat.actionTime * 12) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    const reference = this.ratRunImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 27);
    drawGroundedSprite(
      ctx,
      image,
      rat.x + rat.w / 2,
      rat.y + rat.h + 1,
      scale,
      rat.facing,
      SOURCE_FACING.rat,
    );
  }

  private drawCaterpillar(
    ctx: CanvasRenderingContext2D,
    caterpillar: Caterpillar,
  ): void {
    let images: HTMLImageElement[];
    let index = 0;
    let drawH = 44;

    if (caterpillar.phase === 'larva') {
      images = this.caterpillarLarvaImages;
      index = Math.floor(caterpillar.actionTime * 9) % Math.max(1, images.length);
      drawH = 44;
    } else if (caterpillar.phase === 'pupa') {
      images = this.caterpillarPupaImages;
      const progress = Math.min(
        0.999,
        caterpillar.phaseTime / caterpillar.pupaEvolutionTime,
      );
      index = Math.min(images.length - 1, Math.floor(progress * images.length));
      drawH = 104;
    } else if (caterpillar.butterflyState === 'powder') {
      images = this.caterpillarPowderImages;
      index = Math.floor(caterpillar.actionTime * 11) % Math.max(1, images.length);
      drawH = 80;
    } else if (
      caterpillar.butterflyState === 'ram' ||
      caterpillar.butterflyState === 'ramWindup'
    ) {
      images = this.caterpillarRamImages;
      index = Math.floor(caterpillar.actionTime * 12) % Math.max(1, images.length);
      drawH = 78;
    } else {
      images = this.caterpillarFlyImages;
      index = Math.floor(caterpillar.phaseTime * 11) % Math.max(1, images.length);
      drawH = 84;
    }

    const image = images[index] ?? images[0];
    if (!image) return;

    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = caterpillar.x + caterpillar.w / 2;

    if (
      caterpillar.phase === 'butterfly' &&
      caterpillar.butterflyState === 'powder'
    ) {
      const release = BALANCE.caterpillar.powderReleaseTime;
      const progress = Math.min(
        1,
        caterpillar.actionTime / Math.max(0.01, release),
      );
      const cloudRadius = 24 + progress * 112;

      ctx.save();
      for (let i = 0; i < 34; i += 1) {
        const seed =
          i * 2.399963 + caterpillar.actionTime * (1.4 + (i % 3) * 0.18);
        const ring = ((i * 17) % 31) / 31;
        const radius = cloudRadius * (0.22 + ring * 0.78);
        const px = centerX + Math.cos(seed) * radius;
        const py =
          caterpillar.y +
          caterpillar.h / 2 +
          Math.sin(seed * 1.23) * radius * 0.58;
        const size = 2 + (i % 3);
        ctx.globalAlpha = 0.24 + (i % 5) * 0.07;
        ctx.fillStyle =
          i % 3 === 0 ? '#b7df36' : i % 3 === 1 ? '#e33e9f' : '#71308c';
        ctx.fillRect(Math.round(px), Math.round(py), size, size);
      }
      ctx.restore();
    }

    ctx.save();
    if (caterpillar.phase === 'butterfly') {
      const centerY = caterpillar.y + caterpillar.h / 2;
      const hover = Math.sin(caterpillar.phaseTime * 7.4) * 2.2;
      ctx.translate(centerX, centerY + hover);
      applySpriteFacing(
        ctx,
        caterpillar.facing,
        SOURCE_FACING.caterpillarButterfly,
      );
      if (caterpillar.butterflyState === 'ramWindup') {
        ctx.rotate(caterpillar.facing * -0.09);
      } else if (caterpillar.butterflyState === 'ram') {
        ctx.rotate(
          Math.atan2(
            caterpillar.vy,
            Math.max(0.01, Math.abs(caterpillar.vx)),
          ) * 0.28,
        );
      }
      ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
    } else {
      const footY = caterpillar.y + caterpillar.h + 1;
      const squash =
        caterpillar.phase === 'larva'
          ? Math.sin(caterpillar.actionTime * 18) * 1.4
          : Math.sin(caterpillar.phaseTime * 7) * 0.8;
      ctx.translate(centerX, footY);
      applySpriteFacing(
        ctx,
        caterpillar.facing,
        caterpillar.phase === 'larva'
          ? SOURCE_FACING.caterpillarLarva
          : SOURCE_FACING.caterpillarPupa,
      );
      const groundOffset = caterpillar.phase === 'larva' ? 6 : 0;
      ctx.drawImage(
        image,
        -drawW / 2,
        -drawH + squash + groundOffset,
        drawW,
        drawH - squash,
      );
    }
    ctx.restore();
  }

  private drawSkeletonArcher(
    ctx: CanvasRenderingContext2D,
    skeletonArcher: SkeletonArcher,
  ): void {
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
    const swordReference = this.skeletonWalkImages[0] ?? image;
    const archerReference = this.skeletonArcherWalkImages[0] ?? image;
    if (!image || !swordReference || !archerReference) return;

    const swordBounds = getOpaqueBounds(swordReference);
    const swordScale = scaleFromReference(swordReference, 72);
    const targetVisibleH = swordBounds.h * swordScale;
    const archerReferenceBounds = getOpaqueBounds(archerReference);
    const scale = targetVisibleH / Math.max(1, archerReferenceBounds.h);

    const tension =
      attacking && !skeletonArcher.shotReleased
        ? Math.min(1, index / Math.max(1, images.length - 1))
        : 0;
    const recoil =
      attacking && skeletonArcher.shotReleased
        ? Math.max(0, 1 - (skeletonArcher.actionTime - 0.18) * 7)
        : 0;

    drawGroundedSprite(
      ctx,
      image,
      skeletonArcher.x + skeletonArcher.w / 2,
      skeletonArcher.y + skeletonArcher.h + 1,
      scale,
      skeletonArcher.facing,
      SOURCE_FACING.skeletonArcher,
      -tension * 1.2 + recoil * 1.4,
      recoil * 0.5,
    );
  }

  private drawSkeleton(ctx: CanvasRenderingContext2D, skeleton: Skeleton): void {
    const hurt = skeleton.knockbackTime > 0 && this.skeletonHurtImages.length > 0;
    const attacking = skeleton.state === 'attack' && !hurt;

    const images = hurt
      ? this.skeletonHurtImages
      : attacking
        ? this.skeletonAttackImages
        : this.skeletonWalkImages;

    let frame: number;
    if (hurt) {
      frame = Math.floor(skeleton.actionTime * 12) % Math.max(1, images.length);
    } else if (attacking) {
      frame = Math.min(
        images.length - 1,
        Math.floor((skeleton.actionTime / 0.42) * images.length),
      );
    } else {
      frame = Math.floor(skeleton.actionTime * (skeleton.state === 'climb' ? 12 : 8)) % Math.max(1, images.length);
    }

    const image = images[frame] ?? images[0];
    const reference = this.skeletonWalkImages[0] ?? image;
    if (!image || !reference) return;

    const scale = scaleFromReference(reference, 72);
    const sourceFacing = attacking ? 1 : SOURCE_FACING.skeleton;
    if (skeleton.state === 'climb') {
      const climbIndex =
        Math.floor(skeleton.actionTime * 5) % Math.max(1, this.skeletonClimbImages.length);
      const climbImage = this.skeletonClimbImages[climbIndex];

      if (climbImage?.complete && climbImage.naturalWidth > 0) {
        drawRearClimbSprite(
          ctx,
          climbImage,
          skeleton.x + skeleton.w / 2,
          skeleton.y + skeleton.h + 1,
          72,
        );
      } else {
        drawClimbingSprite(
          ctx,
          image,
          skeleton.x + skeleton.w / 2,
          skeleton.y + skeleton.h + 1,
          scale,
          skeleton.facing,
          sourceFacing,
          skeleton.actionTime,
          '#e0d6bd',
        );
      }
      return;
    }
    drawGroundedSprite(
      ctx,
      image,
      skeleton.x + skeleton.w / 2,
      skeleton.y + skeleton.h + 1,
      scale,
      skeleton.facing,
      sourceFacing,
    );
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
