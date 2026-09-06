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
    this.drawVoid(ctx);
    this.drawBackRockMass(ctx);
    this.drawCaveCeiling(ctx);
    this.drawRoomPockets(ctx);
    this.drawWallNoise(ctx);

    for (const platform of this.platforms) this.drawEarthPlatform(ctx, platform);

    this.drawSupportsAndWebs(ctx);
    this.drawLooseDetails(ctx);
    this.staircase.draw(ctx);
  }

  private drawVoid(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#080a0b');
    gradient.addColorStop(0.45, '#0d1011');
    gradient.addColorStop(1, '#050607');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < this.height; y += 96) {
      for (let x = 0; x < this.width; x += 96) {
        const n = hash2(x, y, this.seed);
        if ((n % 5) > 1) continue;
        ctx.fillStyle = (n & 1) === 0 ? 'rgba(28, 24, 20, 0.24)' : 'rgba(18, 20, 20, 0.30)';
        const r = 22 + (n % 28);
        ctx.beginPath();
        ctx.ellipse(x + 22 + (n % 47), y + 18 + ((n >>> 7) % 49), r, r * 0.55, (n % 7) * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawBackRockMass(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x29ac);
      const inset = 12 + (n % 16);
      const x = room.x + inset;
      const y = room.y + inset;
      const w = Math.max(36, room.w - inset * 2);
      const h = Math.max(34, room.h - inset * 2);

      ctx.fillStyle = room.tone % 2 === 0 ? 'rgba(49, 34, 23, 0.24)' : 'rgba(38, 31, 25, 0.22)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 14 + (n % 18));
      ctx.fill();

      for (let i = 0; i < 8; i += 1) {
        const q = hash2(room.x + i * 31, room.y + i * 19, this.seed);
        const px = x + 8 + (q % Math.max(9, Math.floor(w - 16)));
        const py = y + 8 + ((q >>> 9) % Math.max(9, Math.floor(h - 16)));
        ctx.fillStyle = (q & 1) === 0 ? 'rgba(89, 55, 30, 0.10)' : 'rgba(8, 8, 8, 0.22)';
        ctx.beginPath();
        ctx.arc(px, py, 5 + (q % 12), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCaveCeiling(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#241912';
    ctx.fillRect(0, 0, this.width, 18);

    for (let x = 0; x < this.width; x += 18) {
      const n = hash2(x, 3, this.seed);
      const depth = 5 + (n % 17);
      const w = 16 + (n % 8);
      ctx.fillStyle = (n & 1) === 0 ? '#382515' : '#2f2118';
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + w, 12);
      ctx.lineTo(x + w - 3, 18 + depth * 0.45);
      ctx.lineTo(x + w * 0.55, 17 + depth);
      ctx.lineTo(x + 3, 18 + depth * 0.6);
      ctx.closePath();
      ctx.fill();

      if ((n % 6) === 0) {
        ctx.fillStyle = '#6d4928';
        ctx.fillRect(x + 4, 11, 5 + (n % 7), 3);
      }
    }
  }

  private drawRoomPockets(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x + 71, room.y + 43, this.seed);
      if ((n % 3) !== 0) continue;
      const cx = room.x + room.w * (0.32 + (n % 35) / 100);
      const cy = room.y + room.h * (0.35 + ((n >>> 7) % 30) / 100);
      const rw = 28 + (n % 34);
      const rh = 18 + ((n >>> 5) % 28);
      ctx.fillStyle = 'rgba(2, 3, 3, 0.56)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawWallNoise(ctx: CanvasRenderingContext2D): void {
    for (let y = 32; y < this.height; y += 24) {
      for (let x = 16; x < this.width; x += 38) {
        const n = hash2(x, y, this.seed);
        if ((n % 4) !== 0) continue;
        ctx.fillStyle = (n & 1) === 0 ? 'rgba(116, 73, 36, 0.11)' : 'rgba(91, 102, 90, 0.07)';
        ctx.fillRect(x + (n % 11), y, 3 + (n % 8), 2 + ((n >>> 5) % 4));
      }
    }
  }

  private drawEarthPlatform(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const left = Math.round(platform.x);
    const top = Math.round(platform.y);
    const right = Math.round(platform.x + platform.w);
    const n0 = hash2(left, top, this.seed);
    const visualH = Math.max(platform.h, 34 + (n0 % 22));
    const bottom = top + visualH;

    // Heavy shadow first: platforms should read as chunks carved out of solid earth.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.fillRect(left + 5, top + 7, platform.w + 4, visualH + 6);

    ctx.fillStyle = '#4c2f18';
    ctx.fillRect(left, top + 3, platform.w, visualH - 3);

    const tile = 16;
    for (let y = top + 4; y < bottom; y += tile) {
      const row = Math.floor((y - top) / tile);
      const offset = (row & 1) * 7;
      for (let x = left - offset; x < right; x += tile) {
        const n = hash2(x, y, this.seed ^ 0x61e3);
        const w = Math.min(tile + 2 + (n % 5), right - x);
        if (w <= 0) continue;
        const h = Math.min(tile + 1 + ((n >>> 4) % 4), bottom - y);
        const palette = ['#68411f', '#744823', '#5b381c', '#815128'];
        ctx.fillStyle = palette[n % palette.length]!;
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(19, 13, 10, 0.52)';
        ctx.fillRect(x + w - 2, y + 2, 2, Math.max(2, h - 2));
        ctx.fillRect(x + 2, y + h - 2, Math.max(2, w - 2), 2);

        if ((n % 5) === 0) {
          ctx.fillStyle = '#9c6630';
          ctx.fillRect(x + 3 + (n % 5), y + 3, 3 + (n % 4), 2);
        }
        if ((n % 13) === 0) {
          ctx.fillStyle = '#d9c28a';
          ctx.fillRect(x + 6, y + 4, 3, 3);
          ctx.fillStyle = '#8b784f';
          ctx.fillRect(x + 7, y + 5, 3, 2);
        }
      }
    }

    // Thick irregular dirt lip like a cutaway cave tile.
    for (let x = left; x < right; x += 10) {
      const n = hash2(x, top, this.seed ^ 0xb431);
      const rise = 1 + (n % 6);
      const chunkW = Math.min(12, right - x);
      ctx.fillStyle = (n & 1) === 0 ? '#9b612b' : '#875126';
      ctx.fillRect(x, top - rise, chunkW, 6 + rise);
      ctx.fillStyle = '#c17c36';
      if ((n % 3) === 0) ctx.fillRect(x + 2, top - rise, Math.max(2, chunkW - 5), 2);
    }

    // Embedded stones, gems and cracks.
    for (let x = left + 10; x < right - 8; x += 29) {
      const n = hash2(x, top + 19, this.seed);
      if ((n % 4) === 0) {
        ctx.fillStyle = '#81766a';
        ctx.beginPath();
        ctx.ellipse(x, top + 15 + (n % 13), 4 + (n % 5), 3 + ((n >>> 4) % 4), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a89b89';
        ctx.fillRect(x - 2, top + 13 + (n % 13), 3, 1);
      }
      if ((n % 17) === 1) {
        const gemColors = ['#56c96b', '#7ac9ef', '#d07be7'];
        ctx.fillStyle = gemColors[(n >>> 7) % gemColors.length]!;
        ctx.beginPath();
        ctx.moveTo(x, top + 10);
        ctx.lineTo(x + 4, top + 15);
        ctx.lineTo(x, top + 20);
        ctx.lineTo(x - 3, top + 15);
        ctx.closePath();
        ctx.fill();
      }
      if ((n % 9) === 0) {
        ctx.strokeStyle = '#2f1c12';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 6, top + 7);
        ctx.lineTo(x + 2, top + 16);
        ctx.lineTo(x + 7, top + 24);
        ctx.lineTo(x + 3, top + 31);
        ctx.stroke();
      }
    }

    // Moss/roots hanging from some edges.
    if ((n0 % 3) === 0) {
      ctx.strokeStyle = '#536532';
      ctx.lineWidth = 2;
      for (let x = left + 14; x < right - 8; x += 33) {
        const n = hash2(x, top, this.seed ^ 0x3344);
        if ((n & 1) === 0) continue;
        const len = 5 + (n % 15);
        ctx.beginPath();
        ctx.moveTo(x, top + 2);
        ctx.quadraticCurveTo(x + 4, top + len * 0.55, x - 1, top + len);
        ctx.stroke();
      }
    }
  }

  private drawSupportsAndWebs(ctx: CanvasRenderingContext2D): void {
    for (const platform of this.platforms) {
      const n = hash2(platform.x, platform.y, this.seed ^ 0x7791);
      const x = platform.x + 18 + (n % Math.max(22, Math.floor(platform.w - 36)));
      const y = platform.y;

      if ((n % 7) === 0 && platform.w > 95) {
        const h = 36 + ((n >>> 5) % 54);
        ctx.fillStyle = '#2f2117';
        ctx.fillRect(x, y - h, 7, h);
        ctx.fillRect(x + 48, y - h, 7, h);
        ctx.fillRect(x - 2, y - h, 60, 7);
        ctx.fillStyle = '#5f4124';
        ctx.fillRect(x + 1, y - h + 2, 4, h - 4);
        ctx.fillRect(x + 49, y - h + 2, 4, h - 4);
      }

      if ((n % 11) === 2 && platform.w > 70) {
        const wx = platform.x + platform.w - 28;
        const wy = platform.y - 22;
        this.drawWeb(ctx, wx, wy, 22);
      }
    }
  }

  private drawWeb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(215, 217, 205, 0.52)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI * 0.05 + i * (Math.PI * 0.52 / 4);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
    for (let q = 0.35; q <= 1; q += 0.25) {
      ctx.beginPath();
      ctx.arc(x, y, r * q, -0.05, 1.52);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawLooseDetails(ctx: CanvasRenderingContext2D): void {
    for (const platform of this.platforms) {
      if (platform.w < 70) continue;
      const n = hash2(platform.x + 9, platform.y + 17, this.seed ^ 0x44a2);
      const x = platform.x + 12 + (n % Math.max(18, Math.floor(platform.w - 28)));
      const y = platform.y - 5;

      if ((n % 13) === 0) {
        // Tiny bones/skull silhouette.
        ctx.fillStyle = '#c8bfa5';
        ctx.beginPath();
        ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#171310';
        ctx.fillRect(x - 2, y - 3, 1, 1);
        ctx.fillRect(x + 1, y - 3, 1, 1);
        ctx.strokeStyle = '#c8bfa5';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 1);
        ctx.lineTo(x + 16, y - 4);
        ctx.moveTo(x + 8, y - 5);
        ctx.lineTo(x + 15, y + 2);
        ctx.stroke();
      } else if ((n % 9) === 1) {
        ctx.fillStyle = '#5f5548';
        ctx.beginPath();
        ctx.ellipse(x, y, 5 + (n % 4), 3 + ((n >>> 4) % 3), 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function hash2(x: number, y: number, seed: number): number {
  let n = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + seed * 1442695041) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}
