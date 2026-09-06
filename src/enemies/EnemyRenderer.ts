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
import type { Bomb } from './Bomb';

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

  async load(): Promise<void> {
    [this.slimeImage, this.clingImage, this.ahrimanImage] = await Promise.all([
      loadImage(slimeUrl),
      loadImage(clingUrl),
      loadImage(ahrimanUrl),
    ]);
    const [snake, bat, walk, swing, leap, smash, roperIdle, roperAttack, slugMove, ratRun, ratBite, skeletonWalk, skeletonAttack] = await Promise.all([
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
    else this.drawSkeleton(ctx, enemy as Skeleton);
  }

  private drawSlime(ctx: CanvasRenderingContext2D, slime: Slime): void {
    let image = this.slimeImage;
    let drawW = 46;
    let drawH = 30;
    let drawY = slime.y + slime.h - drawH;
    let crawlPhase = 0;

    if (slime.state === 'cling' || slime.state === 'drop') {
      image = this.clingImage;
      drawW = 42;
      drawH = 28;
      drawY = slime.y - 1;
    } else if (slime.state === 'pounce') {
      drawW = 50;
      drawH = 30;
      drawY = slime.y + slime.h - drawH;
    } else {
      crawlPhase = Math.sin(slime.actionTime * 11);
      drawW *= 1 + Math.abs(crawlPhase) * 0.12;
      drawH *= 1 - Math.abs(crawlPhase) * 0.10;
      drawY = slime.y + slime.h - drawH + Math.max(0, crawlPhase) * 1.5;
    }

    ctx.save();
    const centerX = slime.x + slime.w / 2 + crawlPhase * 1.2;
    ctx.translate(centerX, 0);
    if (slime.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, drawY, drawW, drawH);
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

    const centerX = goblin.x + goblin.w / 2;
    const footY = goblin.y + goblin.h + 2;
    const drawH = 62;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));

    ctx.save();
    ctx.translate(centerX, footY);
    // Existing adopted orientation: frames face the opposite logical direction.
    if (goblin.facing > 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
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
    const drawW = snake.state === 'strike' ? 58 : 52;
    const drawH = snake.state === 'strike' ? 34 : 30;
    const centerX = snake.x + snake.w / 2;
    const footY = snake.y + snake.h + 2;
    ctx.save();
    ctx.translate(centerX, footY);
    if (snake.facing > 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }

  private drawBat(ctx: CanvasRenderingContext2D, bat: Bat): void {
    const frame = Math.floor(bat.actionTime * 10) % this.batImages.length;
    const image = this.batImages[frame] ?? this.batImages[0];
    if (!image) return;
    const drawW = 44;
    const drawH = 24;
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
      const radius = Math.max(14, bomb.blastRadius);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 205, 72, 0.38)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 118, 30, 0.42)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.72, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff1bf';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.92, 0, Math.PI * 2);
      ctx.stroke();

      for (let i = 0; i < 8; i += 1) {
        const angle = bomb.actionTime * 10 + i * (Math.PI / 4);
        const px = centerX + Math.cos(angle) * radius * 0.92;
        const py = centerY + Math.sin(angle) * radius * 0.92;
        ctx.fillStyle = i % 2 === 0 ? '#ffe07a' : '#ff7b2c';
        ctx.fillRect(Math.round(px) - 3, Math.round(py) - 3, 6, 6);
      }
      ctx.restore();
      return;
    }

    const fuseFlash = bomb.state === 'fuse' ? (Math.sin(bomb.actionTime * 18) * 0.5 + 0.5) : 0;
    const radius = 12 + Math.sin(bomb.actionTime * 12) * 0.6;
    const rollOffset = Math.sin(bomb.actionTime * 10) * 1.2;

    ctx.save();
    ctx.translate(centerX, centerY + rollOffset);

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

    // Rolling seam
    ctx.save();
    ctx.rotate(bomb.actionTime * 8 * bomb.facing);
    ctx.strokeStyle = '#1a1f2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, -0.9, 0.9);
    ctx.stroke();
    ctx.restore();

    // Face
    ctx.fillStyle = '#14181f';
    ctx.fillRect(-5, -2, 3, 3);
    ctx.fillRect(2, -2, 3, 3);
    ctx.fillRect(-3, 5, 6, 2);

    // Fuse
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

    const drawH = roper.state === 'attack' ? 92 : 82;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = roper.x + roper.w / 2;
    const footY = roper.y + roper.h + 2;

    ctx.save();
    ctx.translate(centerX, footY);
    if (roper.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
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
    if (slug.facing < 0) ctx.scale(-1, 1);
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
    if (rat.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }

  private drawSkeleton(ctx: CanvasRenderingContext2D, skeleton: Skeleton): void {
    const images = skeleton.state === 'attack' ? this.skeletonAttackImages : this.skeletonWalkImages;
    const speed = skeleton.state === 'attack' ? 9 : 8;
    const frame = Math.floor(skeleton.actionTime * speed) % Math.max(1, images.length);
    const image = images[frame] ?? images[0];
    if (!image) return;

    const drawH = 68;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));
    const centerX = skeleton.x + skeleton.w / 2;
    const footY = skeleton.y + skeleton.h + 1;

    ctx.save();
    ctx.translate(centerX, footY);
    if (skeleton.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = src;
  });
}
