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
    this.drawBackdrop(ctx);
    this.drawFarRockMass(ctx);
    this.drawMineCavities(ctx);
    for (const platform of this.platforms) this.drawPlatformMass(ctx, platform);
    this.drawForegroundDecor(ctx);
    this.staircase.draw(ctx);
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#090b0d');
    gradient.addColorStop(0.35, '#0e1215');
    gradient.addColorStop(1, '#050608');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < this.height; y += 72) {
      for (let x = 0; x < this.width; x += 72) {
        const n = hash2(x, y, this.seed ^ 0x51aa);
        const r = 18 + (n % 34);
        const alpha = 0.10 + ((n >>> 4) % 10) * 0.01;
        ctx.fillStyle = (n & 1) === 0 ? 'rgba(23, 22, 20, ' + alpha.toFixed(2) + ')' : 'rgba(10, 11, 13, ' + (alpha + 0.04).toFixed(2) + ')';
        ctx.beginPath();
        ctx.ellipse(x + 12 + (n % 41), y + 10 + ((n >>> 6) % 43), r, r * 0.66, (n % 8) * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.drawCeilingSilhouette(ctx);
  }

  private drawCeilingSilhouette(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1f150f';
    ctx.fillRect(0, 0, this.width, 16);
    for (let x = 0; x < this.width + 20; x += 20) {
      const n = hash2(x, 7, this.seed);
      const w = 14 + (n % 10);
      const h = 10 + ((n >>> 3) % 18);
      ctx.fillStyle = (n & 1) === 0 ? '#2d1d11' : '#382417';
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x + w, 15);
      ctx.lineTo(x + w - 3, 17 + h * 0.55);
      ctx.lineTo(x + w * 0.55, 16 + h);
      ctx.lineTo(x + 2, 17 + h * 0.72);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawFarRockMass(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x29ac);
      const inset = 6 + (n % 10);
      const x = room.x + inset;
      const y = room.y + inset;
      const w = Math.max(32, room.w - inset * 2);
      const h = Math.max(28, room.h - inset * 2);

      ctx.fillStyle = room.tone % 2 === 0 ? 'rgba(20, 18, 17, 0.55)' : 'rgba(28, 22, 17, 0.48)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 18);
      ctx.fill();

      for (let i = 0; i < 10; i += 1) {
        const q = hash2(room.x + i * 29, room.y + i * 17, this.seed);
        ctx.fillStyle = (q & 1) === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(72, 49, 28, 0.11)';
        ctx.beginPath();
        ctx.arc(x + 8 + (q % Math.max(10, w - 16)), y + 8 + ((q >>> 8) % Math.max(10, h - 16)), 4 + (q % 11), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawMineCavities(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x9102);
      const x = room.x + 8;
      const y = room.y + 10;
      const w = room.w - 16;
      const h = room.h - 20;
      if (w < 28 || h < 20) continue;

      const cavityH = Math.min(h, 30 + (n % 26));
      const cavityY = y + 8 + ((n >>> 4) % Math.max(8, h - cavityH - 8));
      const frameEvery = 20;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.fillRect(x + 2, cavityY + 4, w - 4, cavityH);

      if ((n % 3) !== 0) {
        ctx.fillStyle = '#3b2417';
        ctx.fillRect(x, cavityY, w, 4);
        ctx.fillRect(x, cavityY + cavityH - 4, w, 4);
        for (let px = x; px <= x + w; px += frameEvery) {
          ctx.fillRect(px, cavityY - 1, 4, cavityH + 2);
        }
        ctx.fillStyle = '#6e4528';
        for (let px = x + 1; px <= x + w - 2; px += frameEvery) {
          ctx.fillRect(px, cavityY, 2, cavityH);
        }
      }

      if ((n & 1) === 0) {
        for (let i = 0; i < Math.max(2, Math.floor(w / 26)); i += 1) {
          const px = x + 8 + i * 24 + (hash2(i, n, this.seed) % 6);
          ctx.fillStyle = '#5c3920';
          ctx.fillRect(px, cavityY + cavityH - 12, 16, 5);
          ctx.fillStyle = '#2f1f15';
          ctx.fillRect(px + 2, cavityY + cavityH - 10, 12, 2);
        }
      }

      if ((n % 5) <= 1) {
        const crateX = x + 10 + (n % Math.max(10, w - 30));
        const crateY = cavityY + cavityH - 18;
        ctx.fillStyle = '#7d4b20';
        ctx.fillRect(crateX, crateY, 14, 14);
        ctx.strokeStyle = '#3c2614';
        ctx.lineWidth = 2;
        ctx.strokeRect(crateX + 1, crateY + 1, 12, 12);
        ctx.beginPath();
        ctx.moveTo(crateX + 2, crateY + 2);
        ctx.lineTo(crateX + 12, crateY + 12);
        ctx.moveTo(crateX + 12, crateY + 2);
        ctx.lineTo(crateX + 2, crateY + 12);
        ctx.stroke();
      }
    }
  }

  private drawPlatformMass(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const step = 16;
    const cols = Math.max(2, Math.ceil(platform.w / step));
    const left = platform.x;
    const right = platform.x + platform.w;
    const top = platform.y;
    const bottom = platform.y + platform.h + 12;

    const topOffsets: number[] = [];
    const bottomOffsets: number[] = [];
    for (let i = 0; i <= cols; i += 1) {
      const nTop = hash2(left + i * 17, top, this.seed ^ 0x2222);
      const nBottom = hash2(left + i * 11, bottom, this.seed ^ 0x4444);
      topOffsets.push((nTop % 7) - 1);
      bottomOffsets.push(4 + (nBottom % 10));
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top + topOffsets[0]);
    for (let i = 1; i <= cols; i += 1) {
      const x = Math.min(right, left + i * step);
      ctx.lineTo(x, top + topOffsets[i]);
    }
    for (let i = cols; i >= 0; i -= 1) {
      const x = Math.min(right, left + i * step);
      ctx.lineTo(x, bottom + bottomOffsets[i]);
    }
    ctx.closePath();
    ctx.fillStyle = '#b27435';
    ctx.fill();

    ctx.globalAlpha = 0.34;
    ctx.fillStyle = '#7b4720';
    ctx.fillRect(left, top + 12, platform.w, bottom - top);
    ctx.globalAlpha = 1;

    const tile = 16;
    for (let y = top; y < bottom; y += tile) {
      for (let x = left; x < right; x += tile) {
        const n = hash2(x, y, this.seed);
        const insetX = x + ((n >>> 3) % 2);
        const insetY = y + ((n >>> 5) % 2);
        const w = Math.min(tile, right - x);
        const h = Math.min(tile, bottom - y);
        ctx.fillStyle = (n & 1) === 0 ? '#a66731' : '#935927';
        ctx.fillRect(insetX, insetY, w, h);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#d49756';
        ctx.fillRect(insetX + 1, insetY + 1, Math.max(0, w - 3), 2);
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = '#5e3516';
        ctx.fillRect(insetX, insetY + h - 2, w, 2);
        ctx.globalAlpha = 1;

        if ((n % 6) === 0) {
          ctx.fillStyle = '#c1a079';
          ctx.beginPath();
          ctx.ellipse(insetX + 8, insetY + 8, 4 + (n % 4), 3 + ((n >>> 4) % 3), 0, 0, Math.PI * 2);
          ctx.fill();
        } else if ((n % 11) === 0) {
          ctx.fillStyle = (n & 1) === 0 ? '#85d36b' : '#c978e2';
          ctx.fillRect(insetX + 7, insetY + 6, 3, 6);
          ctx.fillRect(insetX + 6, insetY + 8, 5, 2);
        } else if ((n % 8) === 0) {
          ctx.strokeStyle = '#5f2d18';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(insetX + 6, insetY + 2);
          ctx.lineTo(insetX + 10, insetY + 7);
          ctx.lineTo(insetX + 7, insetY + 13);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(left + 4, bottom - 2, Math.max(0, platform.w - 8), 6);

    if (platform.w > 92) this.drawTimberSupport(ctx, platform);
    ctx.restore();
  }

  private drawTimberSupport(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const y = platform.y + platform.h + 4;
    const x1 = platform.x + 18;
    const x2 = platform.x + platform.w - 18;
    const postH = 18 + (hash2(platform.x, platform.y, this.seed) % 34);

    ctx.fillStyle = '#4e301b';
    ctx.fillRect(x1, y, 4, postH);
    ctx.fillRect(x2, y, 4, postH);
    ctx.fillRect(x1 - 2, y - 4, x2 - x1 + 8, 5);
    ctx.strokeStyle = '#7a4d29';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1 + 2, y + 5);
    ctx.lineTo(x2 + 2, y + 5);
    ctx.moveTo(x1 + 2, y + 13);
    ctx.lineTo(x2 + 2, y + 13);
    ctx.stroke();
  }

  private drawForegroundDecor(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x7137);
      if ((n % 3) === 0) {
        const webX = room.x + 8 + (n % Math.max(8, room.w - 24));
        const webY = room.y + 6 + ((n >>> 6) % Math.max(8, room.h - 24));
        this.drawWeb(ctx, webX, webY, 10 + (n % 8));
      }
      if ((n % 4) === 0) {
        const ropeX = room.x + 12 + (n % Math.max(8, room.w - 22));
        const ropeLen = 16 + ((n >>> 8) % 54);
        ctx.strokeStyle = '#5b3a21';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(ropeX, 0);
        ctx.lineTo(ropeX, room.y + ropeLen);
        ctx.stroke();
      }
    }
  }

  private drawWeb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(235, 235, 235, 0.42)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
      ctx.moveTo(x, y);
      ctx.lineTo(x - Math.cos(angle) * r, y - Math.sin(angle) * r);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function hash2(x: number, y: number, seed: number): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + (seed | 0) * 2147483647;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
