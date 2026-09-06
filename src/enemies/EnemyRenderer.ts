import type { Enemy } from './Enemy';
import type { Goblin } from './Goblin';
import type { Slime } from './Slime';
import type { Ahriman } from './Ahriman';
import type { Snake } from './Snake';
import type { Bat } from './Bat';

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

  async load(): Promise<void> {
    [this.slimeImage, this.clingImage, this.ahrimanImage] = await Promise.all([
      loadImage(slimeUrl),
      loadImage(clingUrl),
      loadImage(ahrimanUrl),
    ]);
    const [snake, bat, walk, swing, leap, smash] = await Promise.all([
      Promise.all(snakeUrls.map(loadImage)),
      Promise.all(batUrls.map(loadImage)),
      Promise.all(goblinWalkUrls.map(loadImage)),
      Promise.all(goblinSwingUrls.map(loadImage)),
      Promise.all(goblinLeapUrls.map(loadImage)),
      Promise.all(goblinSmashUrls.map(loadImage)),
    ]);
    this.snakeImages.push(...snake);
    this.batImages.push(...bat);
    this.goblinWalkImages.push(...walk);
    this.goblinSwingImages.push(...swing);
    this.goblinLeapImages.push(...leap);
    this.goblinSmashImages.push(...smash);
  }

  draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.type === 'slime') this.drawSlime(ctx, enemy as Slime);
    else if (enemy.type === 'goblin') this.drawGoblin(ctx, enemy as Goblin);
    else if (enemy.type === 'ahriman') this.drawAhriman(ctx, enemy as Ahriman);
    else if (enemy.type === 'snake') this.drawSnake(ctx, enemy as Snake);
    else this.drawBat(ctx, enemy as Bat);
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
    const drawH = 82;
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
    const flap = Math.sin(ahriman.actionTime * 13);
    const centerX = ahriman.x + ahriman.w / 2;
    const centerY = ahriman.y + ahriman.h / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (ahriman.facing < 0) ctx.scale(-1, 1);

    const sourceW = this.ahrimanImage.naturalWidth;
    const sourceH = this.ahrimanImage.naturalHeight;
    const wingW = Math.floor(sourceW * 0.34);
    const bodyW = sourceW - wingW * 2;
    const wingLift = flap * 5;
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
    const drawW = 50;
    const drawH = 28;
    const centerX = bat.x + bat.w / 2;
    const centerY = bat.y + bat.h / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    if (bat.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
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
