import type { Rect } from '../game/types';

const closedUrl = new URL('../../assets/objects/chest/closed.png', import.meta.url).href;
const openUrl = new URL('../../assets/objects/chest/open.png', import.meta.url).href;

export type ChestRarity = '銅' | '銀' | '金' | '赤神話';

export const CHEST_RARITY_LABELS: Record<ChestRarity, string> = {
  銅: 'コモン（銅）',
  銀: 'アンコモン（銀）',
  金: 'レア（金）',
  赤神話: '神話レア（赤）',
};

export function getChestRarityLabel(rarity: ChestRarity): string {
  return CHEST_RARITY_LABELS[rarity];
}

interface ChestPalette {
  glow: string;
  border: string;
  filter: string;
}

const CHEST_PALETTES: Record<ChestRarity, ChestPalette> = {
  銅: {
    glow: 'rgba(0, 0, 0, 0)',
    border: 'rgba(0, 0, 0, 0)',
    filter: 'none',
  },
  銀: {
    glow: 'rgba(220, 236, 255, 0.88)',
    border: '#dcecff',
    filter: 'grayscale(1) brightness(1.55) contrast(1.08)',
  },
  金: {
    glow: 'rgba(255, 211, 74, 0.92)',
    border: '#ffd34a',
    filter: 'sepia(1) saturate(3.1) brightness(1.12)',
  },
  赤神話: {
    glow: 'rgba(255, 48, 70, 0.98)',
    border: '#ff3046',
    filter: 'sepia(1) saturate(5.4) hue-rotate(318deg) brightness(0.92) contrast(1.16)',
  },
};

export class TreasureChest implements Rect {
  readonly w = 32;
  readonly h = 28;
  opened = false;

  private static closedImage: HTMLImageElement | null = null;
  private static openImage: HTMLImageElement | null = null;

  constructor(
    public x: number,
    public y: number,
    public readonly rarity: ChestRarity = '銅',
  ) {}

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

    // Bronze intentionally stays exactly on the current art.
    if (this.rarity === '銅') {
      ctx.drawImage(image, this.x - 4, this.y - 8, 40, 40);
      return;
    }

    const palette = CHEST_PALETTES[this.rarity];
    const pulse = 0.72 + Math.sin(performance.now() * 0.006 + this.x * 0.013) * 0.18;

    ctx.save();
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = this.rarity === '赤神話' ? 13 + pulse * 5 : 7 + pulse * 3;
    ctx.filter = palette.filter;
    ctx.drawImage(image, this.x - 4, this.y - 8, 40, 40);
    ctx.filter = 'none';

    ctx.globalAlpha = 0.64 + pulse * 0.2;
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = this.rarity === '赤神話' ? 2 : 1;
    ctx.strokeRect(this.x - 3.5, this.y - 7.5, 39, 39);

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = palette.border;
    ctx.save();
    ctx.translate(this.x + 16, this.y - 4);
    ctx.rotate(Math.PI / 4);
    const gemSize = this.rarity === '赤神話' ? 5 : 4;
    ctx.fillRect(-gemSize / 2, -gemSize / 2, gemSize, gemSize);
    ctx.restore();

    if (this.rarity === '赤神話') {
      const sparkle = 4 + pulse * 2;
      ctx.strokeStyle = '#ffd7dc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x + 3, this.y + 2);
      ctx.lineTo(this.x + 3, this.y + 2 - sparkle);
      ctx.moveTo(this.x + 3 - sparkle / 2, this.y + 2 - sparkle / 2);
      ctx.lineTo(this.x + 3 + sparkle / 2, this.y + 2 - sparkle / 2);
      ctx.stroke();
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
