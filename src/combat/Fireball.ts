import { BALANCE } from '../config/balance';
import type { Facing, Rect } from '../game/types';

const frameUrls = [1, 2, 3, 4, 5, 6, 7, 8].map((index) =>
  new URL(`../../assets/effects/fireball/fireball_0${index}.png`, import.meta.url).href,
);

type SpriteBounds = { x: number; y: number; w: number; h: number };
const boundsCache = new WeakMap<HTMLImageElement, SpriteBounds>();

export class Fireball {
  static readonly images: HTMLImageElement[] = [];

  static async loadAssets(): Promise<void> {
    if (this.images.length > 0) return;
    this.images.push(...await Promise.all(frameUrls.map(loadImage)));
  }

  readonly w = BALANCE.fireball.width;
  readonly h = BALANCE.fireball.height;
  alive = true;
  age = 0;

  constructor(
    public x: number,
    public y: number,
    public vx: number,
    public readonly facing: Facing,
    public life: number,
  ) {}

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    this.x += this.vx;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive || Fireball.images.length < 8) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const flightIndex = Math.floor(this.age * 15) % 4;
    const sparkIndex = 4 + (Math.floor(this.age * 21) % 4);
    const core = Fireball.images[flightIndex];
    const spark = Fireball.images[sparkIndex];
    if (!core || !spark) return;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.globalCompositeOperation = 'lighter';
    drawCropped(
      ctx,
      spark,
      -18,
      0,
      BALANCE.fireball.drawHeight * 0.62,
    );
    ctx.restore();

    ctx.shadowColor = '#ff7b1f';
    ctx.shadowBlur = 9;
    drawCropped(
      ctx,
      core,
      4,
      0,
      BALANCE.fireball.drawHeight,
    );
    ctx.restore();
  }
}

function drawCropped(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  targetHeight: number,
): void {
  const bounds = getOpaqueBounds(image);
  const scale = targetHeight / Math.max(1, bounds.h);
  const drawW = Math.max(1, Math.round(bounds.w * scale));
  const drawH = Math.max(1, Math.round(bounds.h * scale));
  ctx.drawImage(
    image,
    bounds.x,
    bounds.y,
    bounds.w,
    bounds.h,
    Math.round(centerX - drawW / 2),
    Math.round(centerY - drawH / 2),
    drawW,
    drawH,
  );
}

function getOpaqueBounds(image: HTMLImageElement): SpriteBounds {
  const cached = boundsCache.get(image);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, image.naturalWidth);
  canvas.height = Math.max(1, image.naturalHeight);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { x: 0, y: 0, w: canvas.width, h: canvas.height };
  }

  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] < 24) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const bounds = maxX < minX
    ? { x: 0, y: 0, w: canvas.width, h: canvas.height }
    : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  boundsCache.set(image, bounds);
  return bounds;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Fireball image load failed: ${src}`));
    image.src = src;
  });
}
