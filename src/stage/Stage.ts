import type { Platform } from './Platform';
import { Staircase } from './Staircase';

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

export class Stage {
  readonly staircase: Staircase;

  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly platforms: readonly Platform[],
    public readonly spawn: StagePoint,
    staircase: StagePoint,
    public readonly rooms: readonly StageRoom[],
    public readonly seed: number,
  ) {
    this.staircase = new Staircase(staircase.x, staircase.y);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawDeepBackground(ctx);
    this.drawFarArchitecture(ctx);
    this.drawWallTexture(ctx);
    this.drawRoomDetails(ctx);
    this.drawHangingDetails(ctx);

    for (const platform of this.platforms) this.drawPlatform(ctx, platform);

    this.drawForegroundDebris(ctx);
    this.staircase.draw(ctx);
  }

  private drawDeepBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0a1116');
    gradient.addColorStop(0.52, '#111a20');
    gradient.addColorStop(1, '#070c10');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Broad depth bands stop the stage from reading as one flat wall.
    for (let y = 70; y < this.height; y += 180) {
      const h = 84 + (hash2(11, y, this.seed) % 44);
      ctx.fillStyle = 'rgba(20, 34, 40, 0.42)';
      ctx.fillRect(0, y, this.width, h);
      ctx.fillStyle = 'rgba(6, 12, 16, 0.38)';
      ctx.fillRect(0, y + h - 10, this.width, 10);
    }
  }

  private drawFarArchitecture(ctx: CanvasRenderingContext2D): void {
    // Recessed arches, shafts and broken masonry silhouettes.
    for (let x = 38; x < this.width - 40; x += 220) {
      const n = hash2(x, 91, this.seed);
      const w = 82 + (n % 48);
      const h = 92 + ((n >>> 5) % 88);
      const y = 58 + ((n >>> 11) % Math.max(80, this.height - h - 160));
      const arch = (n & 1) === 0;

      ctx.save();
      ctx.globalAlpha = 0.48;
      ctx.fillStyle = '#081014';
      if (arch) {
        ctx.beginPath();
        ctx.rect(x, y + 28, w, h - 28);
        ctx.arc(x + w / 2, y + 28, w / 2, Math.PI, 0);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#101d23';
        ctx.fillRect(x + 8, y + 8, w - 16, 6);
      }
      ctx.restore();

      if ((n % 5) === 0) {
        ctx.fillStyle = 'rgba(80, 120, 96, 0.13)';
        ctx.fillRect(x + 7, y + h - 18, Math.max(8, w - 14), 5);
      }
    }
  }

  private drawWallTexture(ctx: CanvasRenderingContext2D): void {
    for (let y = 20; y < this.height; y += 28) {
      const row = Math.floor(y / 28);
      const offset = (row & 1) * 22;
      for (let x = -offset; x < this.width; x += 56) {
        const noise = hash2(x, y, this.seed);
        const alpha = 0.14 + (noise % 4) * 0.025;
        ctx.fillStyle = `rgba(80, 96, 102, ${alpha})`;
        ctx.fillRect(x + 2, y, 43 + (noise % 9), 2);

        if ((noise % 17) === 0) {
          ctx.strokeStyle = 'rgba(2, 7, 9, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 18, y + 3);
          ctx.lineTo(x + 13, y + 12);
          ctx.lineTo(x + 21, y + 20);
          ctx.lineTo(x + 16, y + 27);
          ctx.stroke();
        }
      }
    }
  }

  private drawRoomDetails(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed);
      const cx = room.x + room.w / 2;
      const floorY = room.y + room.h - 14;

      // No rectangular room outline. Each room gets an irregular niche / support set.
      ctx.fillStyle = 'rgba(6, 11, 14, 0.28)';
      const nicheW = Math.min(room.w * 0.5, 90 + (n % 46));
      const nicheH = Math.min(room.h * 0.68, 60 + ((n >>> 8) % 55));
      ctx.beginPath();
      ctx.rect(cx - nicheW / 2, floorY - nicheH + 18, nicheW, nicheH - 18);
      ctx.arc(cx, floorY - nicheH + 18, nicheW / 2, Math.PI, 0);
      ctx.fill();

      if ((n & 3) !== 1) {
        this.drawColumn(ctx, room.x + 18, floorY, 10 + (n % 6), 42 + ((n >>> 5) % 30));
      }
      if ((n & 3) !== 2) {
        this.drawColumn(ctx, room.x + room.w - 26, floorY, 10 + ((n >>> 3) % 6), 46 + ((n >>> 9) % 34));
      }

      if ((n % 3) === 0) this.drawTorch(ctx, cx + (n % 31) - 15, room.y + 32 + (n % 24));
    }
  }

  private drawColumn(ctx: CanvasRenderingContext2D, x: number, footY: number, w: number, h: number): void {
    ctx.fillStyle = '#26343a';
    ctx.fillRect(x, footY - h, w, h);
    ctx.fillStyle = '#3b4a50';
    ctx.fillRect(x - 3, footY - h - 4, w + 6, 5);
    ctx.fillStyle = '#162228';
    ctx.fillRect(x + w - 3, footY - h + 5, 3, h - 5);
  }

  private drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const t = performance.now() / 1000;
    const flicker = Math.sin(t * 12 + x * 0.03) * 2 + Math.sin(t * 21 + y * 0.04);

    ctx.fillStyle = '#3a271b';
    ctx.fillRect(Math.round(x), Math.round(y), 3, 18);
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#ffb14b';
    ctx.beginPath();
    ctx.arc(x + 1, y - 3, 18 + flicker, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ff7b2d';
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 2);
    ctx.lineTo(x - 4, y - 7 - flicker * 0.3);
    ctx.lineTo(x + 1, y - 14 - flicker * 0.5);
    ctx.lineTo(x + 6, y - 6 + flicker * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe27d';
    ctx.fillRect(Math.round(x), Math.round(y - 8 - flicker * 0.2), 2, 6);
  }

  private drawHangingDetails(ctx: CanvasRenderingContext2D): void {
    for (let x = 70; x < this.width; x += 170) {
      const n = hash2(x, 407, this.seed);
      if ((n % 3) === 0) {
        const topY = 18 + ((n >>> 4) % 130);
        const length = 38 + ((n >>> 8) % 92);
        ctx.strokeStyle = 'rgba(58, 72, 76, 0.52)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        for (let y = topY + 8; y <= topY + length; y += 8) {
          ctx.lineTo(x + Math.sin(y * 0.12 + n) * 2, y);
        }
        ctx.stroke();
      } else if ((n % 4) === 1) {
        const topY = 10 + ((n >>> 5) % 110);
        const length = 32 + ((n >>> 11) % 75);
        ctx.strokeStyle = 'rgba(62, 102, 62, 0.48)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.quadraticCurveTo(x - 9, topY + length * 0.5, x + 2, topY + length);
        ctx.stroke();
      }
    }
  }

  private drawPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const left = Math.round(platform.x);
    const top = Math.round(platform.y);
    const right = Math.round(platform.x + platform.w);
    const bottom = Math.round(platform.y + platform.h);

    // Shadow mass makes ledges feel cut out of the cave instead of UI rectangles.
    ctx.fillStyle = '#121d22';
    ctx.fillRect(left + 3, top + 5, Math.max(1, platform.w), platform.h + 5);

    ctx.fillStyle = '#46565c';
    ctx.fillRect(left, top + 2, platform.w, Math.max(2, platform.h - 2));

    // Uneven rock lip.
    for (let x = left; x < right; x += 12) {
      const n = hash2(x, top, this.seed);
      const rise = n % 4;
      const chunkW = Math.min(13, right - x);
      ctx.fillStyle = (n & 2) === 0 ? '#6b797c' : '#5b6a6f';
      ctx.fillRect(x, top - rise, chunkW, 4 + rise);
      if ((n % 7) === 0) {
        ctx.fillStyle = '#82908f';
        ctx.fillRect(x + 2, top - rise, Math.max(2, chunkW - 5), 1);
      }
    }

    // Individual stone faces and cracks.
    for (let x = left + 8; x < right - 4; x += 24) {
      const n = hash2(x, top + 12, this.seed);
      ctx.fillStyle = (n % 3) === 0 ? '#35454b' : '#3b4b50';
      const stoneW = Math.min(19 + (n % 7), right - x - 2);
      ctx.fillRect(x, top + 7, stoneW, Math.max(2, platform.h - 10));
      ctx.fillStyle = '#1f2c31';
      ctx.fillRect(x + stoneW - 2, top + 9, 2, Math.max(2, platform.h - 12));

      if ((n % 5) === 0) {
        ctx.strokeStyle = '#202d32';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, top + 7);
        ctx.lineTo(x + 10, top + 12);
        ctx.lineTo(x + 7, top + 17);
        ctx.stroke();
      }
    }

    // Moss and mineral staining, sparse enough not to hide collision readability.
    const deco = hash2(left, top, this.seed);
    if ((deco % 3) === 0) {
      ctx.fillStyle = '#465f48';
      for (let x = left + 12; x < right - 8; x += 31) {
        const n = hash2(x, top, this.seed ^ 0x55aa);
        if ((n & 1) === 0) continue;
        const w = 5 + (n % 9);
        ctx.fillRect(x, top - 1, w, 2);
        if ((n % 4) === 0) ctx.fillRect(x + 2, top + 1, 2, 4 + (n % 7));
      }
    } else if ((deco % 5) === 1) {
      ctx.fillStyle = 'rgba(93, 118, 128, 0.42)';
      for (let x = left + 10; x < right - 10; x += 37) {
        ctx.fillRect(x, top + 4, 2, 4 + (hash2(x, top, this.seed) % 8));
      }
    }

    // Underside teeth / stalactites on thicker platforms.
    if (platform.h >= 14) {
      for (let x = left + 16; x < right - 12; x += 34) {
        const n = hash2(x, bottom, this.seed);
        if ((n % 4) !== 0) continue;
        const len = 4 + (n % 10);
        ctx.fillStyle = '#27363b';
        ctx.beginPath();
        ctx.moveTo(x, bottom - 1);
        ctx.lineTo(x + 7, bottom - 1);
        ctx.lineTo(x + 3, bottom + len);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  private drawForegroundDebris(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < 80; i += 1) {
      const n = hash2(i * 53, i * 29, this.seed);
      const x = n % this.width;
      const y = 40 + ((n >>> 8) % Math.max(1, this.height - 70));
      const size = 1 + ((n >>> 17) % 3);
      if ((n % 7) !== 0) continue;
      ctx.fillStyle = 'rgba(116, 130, 132, 0.24)';
      ctx.fillRect(x, y, size, size);
    }
  }
}

function hash2(x: number, y: number, seed: number): number {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
