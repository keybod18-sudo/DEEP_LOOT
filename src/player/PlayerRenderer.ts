import type { Facing } from '../game/types';

const attackFrameUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/player/attack/attack_0${index}.png`, import.meta.url).href,
);

export class PlayerRenderer {
  private readonly attackFrames: HTMLImageElement[] = [];

  async load(): Promise<void> {
    this.attackFrames.push(...await Promise.all(attackFrameUrls.map(loadImage)));
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
    const image = this.attackFrames[frame] ?? this.attackFrames[0];
    if (!image) return;

    const attacking = frame > 0;
    const phase = moving && !attacking ? Math.sin(walkTime * 14) : 0;
    const bob = moving && !attacking ? Math.abs(phase) * 2.2 : 0;
    const tilt = moving && !attacking ? phase * 0.035 : 0;
    const squashX = moving && !attacking ? 1 + Math.abs(phase) * 0.035 : 1;
    const squashY = moving && !attacking ? 1 - Math.abs(phase) * 0.025 : 1;

    // Attack frame 4 has a large slash arc. Use its full aspect ratio so no part is clipped.
    const baseH = attacking ? 92 : 88;
    const aspect = image.naturalWidth / image.naturalHeight;
    const baseW = attacking ? Math.round(baseH * aspect) : 88;
    const drawW = baseW * squashX;
    const drawH = baseH * squashY;
    const centerX = x + w / 2;
    const footY = y + h + 6 - bob;

    ctx.save();
    ctx.translate(centerX, footY);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.rotate(tilt);

    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

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
