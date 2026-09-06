import type { Facing } from '../game/types';

const frameUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/player/attack/attack_0${index}.png`, import.meta.url).href,
);

export class PlayerRenderer {
  private readonly frames: HTMLImageElement[] = [];

  async load(): Promise<void> {
    this.frames.push(...await Promise.all(frameUrls.map(loadImage)));
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    facing: Facing,
    frame: number,
    invulnerability: number,
  ): void {
    const image = this.frames[frame] ?? this.frames[0];
    if (!image) return;

    const drawW = 88;
    const drawH = 88;
    const drawX = x + w / 2 - drawW / 2;
    const drawY = y + h - drawH + 6;

    ctx.save();
    if (facing < 0) {
      ctx.translate(x + w / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + w / 2), 0);
    }
    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
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
