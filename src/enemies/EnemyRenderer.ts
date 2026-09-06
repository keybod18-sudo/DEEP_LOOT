import type { Enemy } from './Enemy';
import type { Goblin } from './Goblin';
import type { Slime } from './Slime';
import type { Ahriman } from './Ahriman';

const slimeUrl = new URL('../../assets/monsters/slime/crawl.png', import.meta.url).href;
const clingUrl = new URL('../../assets/monsters/slime/cling.png', import.meta.url).href;
const goblinUrl = new URL('../../assets/monsters/goblin/base.png', import.meta.url).href;
const ahrimanUrl = new URL('../../assets/monsters/ahriman/base.png', import.meta.url).href;

export class EnemyRenderer {
  private slimeImage!: HTMLImageElement;
  private clingImage!: HTMLImageElement;
  private goblinImage!: HTMLImageElement;
  private ahrimanImage!: HTMLImageElement;

  async load(): Promise<void> {
    [this.slimeImage, this.clingImage, this.goblinImage, this.ahrimanImage] = await Promise.all([
      loadImage(slimeUrl),
      loadImage(clingUrl),
      loadImage(goblinUrl),
      loadImage(ahrimanUrl),
    ]);
  }

  draw(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.type === 'slime') {
      this.drawSlime(ctx, enemy as Slime);
    } else if (enemy.type === 'goblin') {
      this.drawGoblin(ctx, enemy as Goblin);
    } else {
      this.drawAhriman(ctx, enemy as Ahriman);
    }
  }

  private drawSlime(ctx: CanvasRenderingContext2D, slime: Slime): void {
    let image = this.slimeImage;
    let drawW = 46;
    let drawH = 30;
    let drawY = slime.y + slime.h - drawH;

    if (slime.state === 'cling' || slime.state === 'drop') {
      image = this.clingImage;
      drawW = 42;
      drawH = 28;
      drawY = slime.y - 1;
    }
    if (slime.state === 'pounce') {
      drawW = 50;
      drawH = 30;
      drawY = slime.y + slime.h - drawH;
    }

    ctx.save();
    if (slime.facing < 0) {
      ctx.translate(slime.x + slime.w / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(slime.x + slime.w / 2), 0);
    }
    ctx.drawImage(image, slime.x - (drawW - slime.w) / 2, drawY, drawW, drawH);
    ctx.restore();
  }

  private drawGoblin(ctx: CanvasRenderingContext2D, goblin: Goblin): void {
    ctx.save();
    const centerX = goblin.x + goblin.w / 2;
    const centerY = goblin.y + goblin.h;
    ctx.translate(centerX, centerY);

    // 採用元画像は右向き/左向きの基準が逆なので、現行版と同じ反転条件を維持。
    if (goblin.facing > 0) ctx.scale(-1, 1);

    let rotation = 0;
    let offsetY = 0;
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
    ctx.drawImage(this.goblinImage, -34, -67, 68, 67);
    ctx.restore();
  }

  private drawAhriman(ctx: CanvasRenderingContext2D, ahriman: Ahriman): void {
    const drawW = 76;
    const flap = Math.sin(ahriman.actionTime * 12);
    const drawH = 40 + flap * 2.2;
    const centerX = ahriman.x + ahriman.w / 2;
    const centerY = ahriman.y + ahriman.h / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (ahriman.facing < 0) ctx.scale(-1, 1);
    ctx.rotate(flap * 0.025);
    ctx.drawImage(this.ahrimanImage, -drawW / 2, -drawH / 2, drawW, drawH);
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
