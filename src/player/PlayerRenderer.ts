import type { Facing } from '../game/types';

const attackFrameUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/player/attack/attack_0${index}.png`, import.meta.url).href,
);
const walkFrameUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/player/walk/walk_0${index}.png`, import.meta.url).href,
);

export class PlayerRenderer {
  private readonly attackFrames: HTMLImageElement[] = [];
  private readonly walkFrames: HTMLImageElement[] = [];

  async load(): Promise<void> {
    const [attack, walk] = await Promise.all([
      Promise.all(attackFrameUrls.map(loadImage)),
      Promise.all(walkFrameUrls.map(loadImage)),
    ]);
    this.attackFrames.push(...attack);
    this.walkFrames.push(...walk);
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
    moving: boolean,
    walkTime: number,
  ): void {
    const attacking = frame > 0;
    const image = attacking
      ? (this.attackFrames[frame] ?? this.attackFrames[0])
      : moving
        ? (this.walkFrames[Math.floor(walkTime * 11) % this.walkFrames.length] ?? this.walkFrames[0])
        : this.attackFrames[0];
    if (!image) return;

    const centerX = x + w / 2;
    const footY = y + h + 6;

    ctx.save();
    ctx.translate(centerX, footY);
    if (facing < 0) ctx.scale(-1, 1);

    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Dedicated walking PNG frames are used here: no fake bob/squash animation.
    const drawH = attacking ? 98 : 95;
    const aspect = image.naturalWidth / image.naturalHeight;
    const drawW = Math.round(drawH * aspect);
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
