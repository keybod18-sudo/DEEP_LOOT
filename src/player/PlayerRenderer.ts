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
    sleeping: boolean,
    frozen: boolean,
  ): void {
    const now = performance.now() / 1000;
    const attacking = frame > 0 && !sleeping && !frozen;
    const image = attacking
      ? (this.attackFrames[frame] ?? this.attackFrames[0])
      : moving
        ? (this.walkFrames[Math.floor(walkTime * 11) % this.walkFrames.length] ?? this.walkFrames[0])
        : this.attackFrames[0];
    if (!image) return;

    const centerX = x + w / 2;
    const footY = y + h + 6;

    if (sleeping) {
      this.drawSleeping(ctx, image, centerX, footY, facing, invulnerability, now);
      return;
    }

    ctx.save();
    ctx.translate(centerX, footY);
    if (facing < 0) ctx.scale(-1, 1);

    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const drawH = attacking ? 98 : 95;
    const aspect = image.naturalWidth / image.naturalHeight;
    const drawW = Math.round(drawH * aspect);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();

    if (frozen) this.drawFrozenShell(ctx, centerX, footY, now);
  }

  private drawSleeping(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    centerX: number,
    footY: number,
    facing: Facing,
    invulnerability: number,
    time: number,
  ): void {
    const breathe = (Math.sin(time * 3.1) + 1) * 0.5;
    const twitch = Math.sin(time * 8.5) > 0.92 ? 1.8 : 0;
    const drawH = 84;
    const aspect = image.naturalWidth / image.naturalHeight;
    const drawW = Math.round(drawH * aspect);

    ctx.save();
    ctx.translate(centerX + facing * 4, footY - 4 + twitch);
    ctx.rotate(facing * (Math.PI / 2 - 0.08));
    if (facing < 0) ctx.scale(-1, 1);
    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.scale(1 + breathe * 0.018, 1 - breathe * 0.028);
    ctx.drawImage(image, -drawW / 2, -drawH + 24, drawW, drawH);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d9e7ff';
    const rise = (time * 16) % 18;
    const alpha = 1 - rise / 22;
    ctx.globalAlpha = Math.max(0.15, alpha);
    ctx.fillText('Z', centerX + 22, footY - 50 - rise);
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('Z', centerX + 34, footY - 65 - rise * 0.72);
    ctx.restore();
  }

  private drawFrozenShell(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const pulse = (Math.sin(time * 5.8) + 1) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.24 + pulse * 0.08;
    ctx.fillStyle = '#7be9ff';
    ctx.beginPath();
    ctx.moveTo(centerX - 22, footY - 2);
    ctx.lineTo(centerX - 27, footY - 38);
    ctx.lineTo(centerX - 12, footY - 78);
    ctx.lineTo(centerX + 9, footY - 88);
    ctx.lineTo(centerX + 28, footY - 55);
    ctx.lineTo(centerX + 24, footY - 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#bff8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, footY - 18);
    ctx.lineTo(centerX - 2, footY - 42);
    ctx.lineTo(centerX - 9, footY - 62);
    ctx.moveTo(centerX + 15, footY - 14);
    ctx.lineTo(centerX + 5, footY - 37);
    ctx.lineTo(centerX + 15, footY - 58);
    ctx.stroke();

    ctx.fillStyle = '#e9ffff';
    for (let i = 0; i < 5; i += 1) {
      const sparkle = (Math.floor(time * 8) + i * 3) % 5;
      if (sparkle !== 0) continue;
      ctx.fillRect(centerX - 18 + i * 9, footY - 72 + (i % 2) * 18, 2, 2);
    }
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
