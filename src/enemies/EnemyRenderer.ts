import type { Enemy } from './Enemy';
import type { Goblin } from './Goblin';
import type { Slime } from './Slime';
import type { Ahriman } from './Ahriman';
import type { Snake } from './Snake';
import type { Bat } from './Bat';

const slimeUrl = new URL('../../assets/monsters/slime/crawl.png', import.meta.url).href;
const clingUrl = new URL('../../assets/monsters/slime/cling.png', import.meta.url).href;
const goblinUrl = new URL('../../assets/monsters/goblin/base.png', import.meta.url).href;
const ahrimanUrl = new URL('../../assets/monsters/ahriman/base.png', import.meta.url).href;
const snakeUrls = [1, 2, 3].map((index) =>
  new URL(`../../assets/monsters/snake/move_0${index}.png`, import.meta.url).href,
);
const batUrls = [1, 2, 3].map((index) =>
  new URL(`../../assets/monsters/bat/fly_0${index}.png`, import.meta.url).href,
);

export class EnemyRenderer {
  private slimeImage!: HTMLImageElement;
  private clingImage!: HTMLImageElement;
  private goblinImage!: HTMLImageElement;
  private ahrimanImage!: HTMLImageElement;
  private readonly snakeImages: HTMLImageElement[] = [];
  private readonly batImages: HTMLImageElement[] = [];

  async load(): Promise<void> {
    [this.slimeImage, this.clingImage, this.goblinImage, this.ahrimanImage] = await Promise.all([
      loadImage(slimeUrl),
      loadImage(clingUrl),
      loadImage(goblinUrl),
      loadImage(ahrimanUrl),
    ]);
    this.snakeImages.push(...await Promise.all(snakeUrls.map(loadImage)));
    this.batImages.push(...await Promise.all(batUrls.map(loadImage)));
  }

  draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.type === 'slime') {
      this.drawSlime(ctx, enemy as Slime);
    } else if (enemy.type === 'goblin') {
      this.drawGoblin(ctx, enemy as Goblin);
    } else if (enemy.type === 'ahriman') {
      this.drawAhriman(ctx, enemy as Ahriman);
    } else if (enemy.type === 'snake') {
      this.drawSnake(ctx, enemy as Snake);
    } else {
      this.drawBat(ctx, enemy as Bat);
    }
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
      // Crawl motion: squash/stretch plus a tiny side-to-side body shift.
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
    ctx.save();
    const centerX = goblin.x + goblin.w / 2;
    const centerY = goblin.y + goblin.h;
    ctx.translate(centerX, centerY);

    // Keep the adopted goblin facing rule.
    if (goblin.facing > 0) ctx.scale(-1, 1);

    let rotation = 0;
    let offsetY = 0;
    let scaleX = 1;
    let scaleY = 1;

    if (goblin.state === 'walk') {
      const step = Math.sin(goblin.actionTime * 12);
      offsetY = -Math.abs(step) * 2;
      rotation = step * 0.035;
      scaleX = 1 + Math.abs(step) * 0.035;
      scaleY = 1 - Math.abs(step) * 0.025;
    }
    if (goblin.state === 'swing') {
      rotation = Math.sin(Math.min(1, goblin.actionTime / 0.42) * Math.PI) * -0.20;
    }
    if (goblin.state === 'leap') {
      rotation = -0.10;
      offsetY = -4;
    }
    if (goblin.state === 'smash') {
      rotation = 0.14;
      offsetY = 2;
    }

    ctx.translate(0, offsetY);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(this.goblinImage, -34, -67, 68, 67);
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

    // Split the sprite into left wing / eye / right wing so the wings visibly flap.
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

    ctx.drawImage(
      this.ahrimanImage,
      wingW, 0, bodyW, sourceH,
      -drawW * 0.16, -drawH / 2, drawW * 0.32, drawH,
    );

    ctx.save();
    ctx.translate(drawW * 0.16, wingLift * -0.45);
    ctx.scale(1, wingScaleY);
    ctx.drawImage(
      this.ahrimanImage,
      wingW + bodyW, 0, wingW, sourceH,
      0, -drawH / 2, drawW * 0.34, drawH,
    );
    ctx.restore();

    ctx.restore();
  }
  private drawSnake(ctx: CanvasRenderingContext2D, snake: Snake): void {
    const frame = snake.state === 'strike'
      ? 2
      : Math.floor(snake.actionTime * 8) % this.snakeImages.length;
    const image = this.snakeImages[frame] ?? this.snakeImages[0];
    if (!image) return;

    const drawW = snake.state === 'strike' ? 58 : 52;
    const drawH = snake.state === 'strike' ? 34 : 30;
    const centerX = snake.x + snake.w / 2;
    const footY = snake.y + snake.h + 2;

    ctx.save();
    ctx.translate(centerX, footY);
    if (snake.facing < 0) ctx.scale(-1, 1);
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
