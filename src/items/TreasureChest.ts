import type { Rect } from '../game/types';

const closedUrl = new URL('../../assets/objects/chest/closed.png', import.meta.url).href;
const openUrl = new URL('../../assets/objects/chest/open.png', import.meta.url).href;

export class TreasureChest implements Rect {
  readonly w = 32;
  readonly h = 28;
  opened = false;

  private static closedImage: HTMLImageElement | null = null;
  private static openImage: HTMLImageElement | null = null;

  constructor(public x: number, public y: number) {}

  static async loadAssets(): Promise<void> {
    if (TreasureChest.closedImage && TreasureChest.openImage) return;
    [TreasureChest.closedImage, TreasureChest.openImage] = await Promise.all([
      loadImage(closedUrl),
      loadImage(openUrl),
    ]);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const image = this.opened ? TreasureChest.openImage : TreasureChest.closedImage;
    if (!image) return;
    ctx.drawImage(image, this.x - 4, this.y - 8, 40, 40);
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
