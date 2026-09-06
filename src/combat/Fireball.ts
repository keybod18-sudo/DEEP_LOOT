import type { Facing, Rect } from '../game/types';

const frameUrls = [1, 2, 3, 4, 5, 6, 7, 8].map((index) =>
  new URL(`../../assets/effects/fireball/fireball_0${index}.png`, import.meta.url).href,
);

export class Fireball {
  static readonly images: HTMLImageElement[] = [];

  static async loadAssets(): Promise<void> {
    if (this.images.length > 0) return;
    this.images.push(...await Promise.all(frameUrls.map(loadImage)));
  }

  readonly w = 28;
  readonly h = 16;
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
    if (!this.alive || Fireball.images.length === 0) return;
    const frame = Math.floor(this.age * 18) % Fireball.images.length;
    const image = Fireball.images[frame] ?? Fireball.images[0]!;
    const drawH = 28;
    const drawW = Math.round(drawH * (image.naturalWidth / image.naturalHeight));

    ctx.save();
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    ctx.translate(centerX, centerY);
    if (this.facing < 0) ctx.scale(-1, 1);
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
