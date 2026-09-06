import { BALANCE } from '../config/balance';
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
    if (!this.alive) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const flicker = Math.sin(this.age * 20) * 1.5;
    const tail = 18 + Math.sin(this.age * 16) * 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    if (this.facing < 0) ctx.scale(-1, 1);

    ctx.fillStyle = '#5f1b08';
    ctx.beginPath();
    ctx.ellipse(-tail * 0.45, 0, tail, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c74a12';
    ctx.beginPath();
    ctx.ellipse(-tail * 0.28, 0, tail * 0.78, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath();
    ctx.ellipse(2, 0, 18 + flicker, 12 + flicker * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffc53d';
    ctx.beginPath();
    ctx.ellipse(6, 0, 11 + flicker * 0.45, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff2a6';
    ctx.beginPath();
    ctx.ellipse(9, 0, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd168';
    ctx.fillRect(-18, -2, 8, 2);
    ctx.fillRect(-24, -1, 6, 1);
    ctx.fillRect(-14, 3, 5, 1);

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
