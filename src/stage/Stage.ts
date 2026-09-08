import type { Platform } from './Platform';
import { Staircase } from './Staircase';

const mineAtlasUrl = new URL('../../assets/stage/mine_atlas.png', import.meta.url).href;
const jungleAtlasUrl = new URL('../../assets/stage/jungle_atlas.png', import.meta.url).href;

export interface StagePoint {
  x: number;
  y: number;
}

export interface StageRoom {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: number;
}

export interface StageLadder {
  x: number;
  y: number;
  w: number;
  h: number;
}
type StageThemeKind = 'mine' | 'jungle';

interface TileRef {
  col: number;
  row: number;
}

const TILE = 32;
const ROCK_TILES: readonly TileRef[] = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },
];
const TOP_TILES: readonly TileRef[] = [
  { col: 4, row: 0 }, { col: 5, row: 0 }, { col: 6, row: 0 }, { col: 7, row: 0 },
];
const BG_TILES: readonly TileRef[] = [
  { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 },
];

export class Stage {
  readonly staircase: Staircase;
  private readonly themeKind: StageThemeKind;
  private readonly atlas: HTMLImageElement;

  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly platforms: readonly Platform[],
    public readonly ladders: readonly StageLadder[],
    public readonly spawn: StagePoint,
    staircase: StagePoint,
    public readonly rooms: readonly StageRoom[],
    public readonly seed: number,
  ) {
    this.staircase = new Staircase(staircase.x, staircase.y);
    this.themeKind = (seed & 1) === 0 ? 'mine' : 'jungle';
    this.atlas = new Image();
    this.atlas.src = this.themeKind === 'mine' ? mineAtlasUrl : jungleAtlasUrl;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackdrop(ctx);
    this.drawBackgroundCave(ctx);
    this.drawCeiling(ctx);
    this.drawRoomSetDressing(ctx);

    for (const platform of this.platforms) this.drawPlatform(ctx, platform);
    for (const ladder of this.ladders) this.drawLadder(ctx, ladder);

    this.drawForegroundDetails(ctx);
    this.staircase.draw(ctx);
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    if (this.themeKind === 'mine') {
      gradient.addColorStop(0, '#090b0d');
      gradient.addColorStop(0.5, '#101418');
      gradient.addColorStop(1, '#050607');
    } else {
      gradient.addColorStop(0, '#11150e');
      gradient.addColorStop(0.5, '#182113');
      gradient.addColorStop(1, '#080a07');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < this.height; y += 62) {
      for (let x = 0; x < this.width; x += 62) {
        const n = hash2(x, y, this.seed ^ 0x6161);
        const r = 16 + (n % 30);
        ctx.fillStyle = this.themeKind === 'mine'
          ? ((n & 1) === 0 ? 'rgba(54, 42, 31, 0.10)' : 'rgba(0, 0, 0, 0.14)')
          : ((n & 1) === 0 ? 'rgba(54, 68, 32, 0.10)' : 'rgba(0, 0, 0, 0.14)');
        ctx.beginPath();
        ctx.ellipse(x + 16 + (n % 28), y + 14 + ((n >>> 8) % 28), r, r * 0.62, (n % 7) * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawBackgroundCave(ctx: CanvasRenderingContext2D): void {
    if (!this.atlas.complete || this.atlas.naturalWidth === 0) return;

    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x2471);
      const tile = BG_TILES[n % BG_TILES.length]!;
      const inset = 6 + (n % 9);
      const left = room.x + inset;
      const top = room.y + inset;
      const right = room.x + room.w - inset;
      const bottom = room.y + room.h - inset;

      ctx.save();
      ctx.globalAlpha = this.themeKind === 'mine' ? 0.52 : 0.58;
      for (let y = top; y < bottom; y += TILE) {
        for (let x = left; x < right; x += TILE) {
          const q = hash2(x, y, this.seed);
          const bg = BG_TILES[q % BG_TILES.length] ?? tile;
          this.drawAtlasTile(ctx, bg, x, y, TILE, TILE);
        }
      }
      ctx.restore();
    }
  }

  private drawCeiling(ctx: CanvasRenderingContext2D): void {
    if (!this.atlas.complete || this.atlas.naturalWidth === 0) {
      ctx.fillStyle = this.themeKind === 'mine' ? '#24170f' : '#292813';
      ctx.fillRect(0, 0, this.width, 18);
      return;
    }

    for (let x = 0; x < this.width; x += TILE) {
      const n = hash2(x, 0, this.seed);
      const tile = TOP_TILES[n % TOP_TILES.length]!;
      this.drawAtlasTile(ctx, tile, x, -8 + (n % 5), TILE, TILE);
    }
  }

  private drawRoomSetDressing(ctx: CanvasRenderingContext2D): void {
    if (!this.atlas.complete || this.atlas.naturalWidth === 0) return;

    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x9871);
      if (this.themeKind === 'mine') {
        if ((n % 3) !== 0) continue;
        const x = room.x + 12;
        const y = room.y + 18 + ((n >>> 5) % Math.max(12, room.h - 62));
        const maxW = Math.max(32, room.w - 24);
        const panels = Math.max(2, Math.floor(maxW / TILE));
        const panelCount = Math.min(8, panels);

        for (let i = 0; i < panelCount; i += 1) {
          this.drawAtlasTile(ctx, { col: 4, row: 1 }, x + i * TILE, y, TILE, TILE);
        }
        for (let i = 0; i <= panelCount; i += 2) {
          this.drawAtlasTile(ctx, { col: 5, row: 1 }, x + i * TILE - 6, y - 2, 18, 40);
        }

        if ((n & 1) === 0) this.drawAtlasTile(ctx, { col: 6, row: 1 }, x + 6, y + 18, TILE, TILE);
        if ((n % 5) <= 2) this.drawAtlasTile(ctx, { col: 7, row: 1 }, x + Math.max(16, panelCount * TILE - 40), y + 18, TILE, TILE);
        if ((n % 4) === 0) this.drawAtlasTile(ctx, { col: 0, row: 2 }, x + Math.floor(panelCount * TILE * 0.5), y - 26, TILE, 64);
        if ((n % 5) === 0) this.drawAtlasTile(ctx, { col: 1, row: 2 }, x + panelCount * TILE - 18, y - 12, TILE, TILE);
      } else {
        if ((n % 2) === 0) {
          const x = room.x + 8 + (n % Math.max(8, room.w - 40));
          const y = room.y + 4 + ((n >>> 6) % Math.max(8, room.h - 36));
          this.drawAtlasTile(ctx, { col: 3, row: 2 }, x, y, TILE, 52);
          if ((n % 4) === 0) this.drawAtlasTile(ctx, { col: 3, row: 3 }, x - 8, y + 22, TILE, TILE);
          if ((n % 5) === 0) this.drawAtlasTile(ctx, { col: 2, row: 3 }, x + 18, y + 28, TILE, TILE);
        }
      }
    }
  }

  private drawLadder(ctx: CanvasRenderingContext2D, ladder: StageLadder): void {
    const railLeft = ladder.x + 4;
    const railRight = ladder.x + ladder.w - 4;
    const rungStep = 14;

    ctx.save();
    ctx.lineCap = 'square';

    ctx.strokeStyle = this.themeKind === 'mine' ? '#4f3420' : '#3e4020';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(railLeft, ladder.y - 18);
    ctx.lineTo(railLeft, ladder.y + ladder.h + 3);
    ctx.moveTo(railRight, ladder.y - 18);
    ctx.lineTo(railRight, ladder.y + ladder.h + 3);
    ctx.stroke();

    ctx.strokeStyle = this.themeKind === 'mine' ? '#9a6538' : '#7e7b37';
    ctx.lineWidth = 3;
    for (let y = ladder.y - 10; y < ladder.y + ladder.h; y += rungStep) {
      ctx.beginPath();
      ctx.moveTo(railLeft, y);
      ctx.lineTo(railRight, y);
      ctx.stroke();
    }

    ctx.restore();
  }
  private drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const left = Math.floor(platform.x / TILE) * TILE;
    const right = platform.x + platform.w;
    const top = platform.y;
    const rowCount = Math.max(1, Math.ceil(Math.max(platform.h, 28) / TILE));
    const cols = Math.max(1, Math.ceil((right - left) / TILE));

    if (!this.atlas.complete || this.atlas.naturalWidth === 0) {
      ctx.fillStyle = this.themeKind === 'mine' ? '#9b5a28' : '#83751f';
      ctx.fillRect(platform.x, platform.y, platform.w, Math.max(24, platform.h));
      return;
    }

    for (let c = 0; c < cols; c += 1) {
      const x = left + c * TILE;
      const n = hash2(x, top, this.seed ^ 0x1113);
      const topTile = TOP_TILES[n % TOP_TILES.length]!;
      const cropLeft = Math.max(platform.x, x);
      const cropRight = Math.min(right, x + TILE);
      if (cropRight <= cropLeft) continue;
      this.drawPartialTile(ctx, topTile, cropLeft, top - 3 + (n % 3), cropRight - cropLeft, TILE, cropLeft - x);
    }

    for (let r = 1; r <= rowCount; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = left + c * TILE;
        const y = top - 3 + r * TILE;
        const n = hash2(x, y, this.seed ^ 0x3317);
        const rock = ROCK_TILES[n % ROCK_TILES.length]!;
        const cropLeft = Math.max(platform.x, x);
        const cropRight = Math.min(right, x + TILE);
        if (cropRight <= cropLeft) continue;
        this.drawPartialTile(ctx, rock, cropLeft, y, cropRight - cropLeft, TILE, cropLeft - x);

        if ((n % 9) === 0 && r === 1) {
          this.drawAtlasTile(ctx, { col: 2, row: 2 }, cropLeft + 4, y + 4, 24, 24);
        }
      }
    }

    this.drawPlatformUnderside(ctx, platform, top + rowCount * TILE + 2);
  }

  private drawLadder(ctx: CanvasRenderingContext2D, ladder: StageLadder): void {
    const railLeft = ladder.x + 4;
    const railRight = ladder.x + ladder.w - 4;
    const rungStep = 14;

    ctx.save();
    ctx.lineCap = 'square';

    ctx.strokeStyle = this.themeKind === 'mine' ? '#4f3420' : '#3e4020';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(railLeft, ladder.y - 18);
    ctx.lineTo(railLeft, ladder.y + ladder.h + 3);
    ctx.moveTo(railRight, ladder.y - 18);
    ctx.lineTo(railRight, ladder.y + ladder.h + 3);
    ctx.stroke();

    ctx.strokeStyle = this.themeKind === 'mine' ? '#9a6538' : '#7e7b37';
    ctx.lineWidth = 3;
    for (let y = ladder.y - 10; y < ladder.y + ladder.h; y += rungStep) {
      ctx.beginPath();
      ctx.moveTo(railLeft, y);
      ctx.lineTo(railRight, y);
      ctx.stroke();
    }

    ctx.restore();
  }
  private drawPlatformUnderside(ctx: CanvasRenderingContext2D, platform: Platform, y: number): void {
    const n = hash2(platform.x, platform.y, this.seed ^ 0xa81f);
    if (this.themeKind === 'mine' && platform.w >= 100 && (n % 3) !== 1) {
      const left = platform.x + 12;
      const right = platform.x + platform.w - 16;
      this.drawAtlasTile(ctx, { col: 4, row: 1 }, left, y - 8, Math.max(32, right - left), 24);
      this.drawAtlasTile(ctx, { col: 5, row: 1 }, left + 4, y - 4, 18, 46);
      this.drawAtlasTile(ctx, { col: 5, row: 1 }, right - 12, y - 4, 18, 46);
    } else if (this.themeKind === 'jungle' && platform.w >= 74) {
      const count = Math.max(1, Math.floor(platform.w / 90));
      for (let i = 0; i < count; i += 1) {
        const x = platform.x + 12 + i * (platform.w / count);
        this.drawAtlasTile(ctx, { col: 3, row: 2 }, x, y - 3, 30, 54 + (n % 18));
      }
    }
  }

  private drawForegroundDetails(ctx: CanvasRenderingContext2D): void {
    if (!this.atlas.complete || this.atlas.naturalWidth === 0) return;

    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0xe117);
      if (this.themeKind === 'mine') {
        if ((n % 4) === 0) this.drawAtlasTile(ctx, { col: 1, row: 3 }, room.x + 10, room.y + room.h - 30, TILE, TILE);
      } else {
        if ((n % 3) === 0) this.drawAtlasTile(ctx, { col: 3, row: 3 }, room.x + 8, room.y + room.h - 32, TILE, TILE);
      }
    }
  }

  private drawAtlasTile(
    ctx: CanvasRenderingContext2D,
    tile: TileRef,
    dx: number,
    dy: number,
    dw = TILE,
    dh = TILE,
  ): void {
    ctx.drawImage(this.atlas, tile.col * TILE, tile.row * TILE, TILE, TILE, Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
  }

  private drawPartialTile(
    ctx: CanvasRenderingContext2D,
    tile: TileRef,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    sourceOffsetX: number,
  ): void {
    const sx = tile.col * TILE + sourceOffsetX;
    const sw = Math.min(TILE - sourceOffsetX, dw);
    if (sw <= 0) return;
    ctx.drawImage(this.atlas, sx, tile.row * TILE, sw, TILE, Math.round(dx), Math.round(dy), Math.round(sw), Math.round(dh));
  }
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul((x | 0) ^ 0x9e3779b9, 374761393) + Math.imul((y | 0) ^ 0x7f4a7c15, 668265263) + Math.imul((seed | 0) ^ 0x85ebca6b, 1442695041);
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
