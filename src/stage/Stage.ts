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

type StageThemeKind = 'mine' | 'jungle';

interface StageTheme {
  kind: StageThemeKind;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  voidBlobA: string;
  voidBlobB: string;
  topRock: string;
  blockA: string;
  blockB: string;
  blockHighlight: string;
  blockShadow: string;
  embeddedStone: string;
  crack: string;
  gemA: string;
  gemB: string;
  grass: string;
  grassShadow: string;
  web: string;
  rope: string;
  timberDark: string;
  timberLight: string;
}

const MINE_THEME: StageTheme = {
  kind: 'mine',
  skyTop: '#0a0c0d',
  skyMid: '#101317',
  skyBottom: '#050607',
  voidBlobA: 'rgba(30, 24, 19, 0.18)',
  voidBlobB: 'rgba(12, 12, 13, 0.24)',
  topRock: '#24160f',
  blockA: '#b06e32',
  blockB: '#955724',
  blockHighlight: '#d28d4d',
  blockShadow: '#5f3416',
  embeddedStone: '#bca07a',
  crack: '#623118',
  gemA: '#8ae26d',
  gemB: '#c770d9',
  grass: '#5e8b2a',
  grassShadow: '#2f4d16',
  web: 'rgba(236, 236, 236, 0.42)',
  rope: '#5a3921',
  timberDark: '#442919',
  timberLight: '#7b4c29',
};

const JUNGLE_THEME: StageTheme = {
  kind: 'jungle',
  skyTop: '#11130d',
  skyMid: '#1c2313',
  skyBottom: '#090b08',
  voidBlobA: 'rgba(44, 52, 23, 0.18)',
  voidBlobB: 'rgba(18, 24, 12, 0.24)',
  topRock: '#2b2712',
  blockA: '#a9992d',
  blockB: '#7d6f1f',
  blockHighlight: '#cfc04c',
  blockShadow: '#4e4512',
  embeddedStone: '#8c8137',
  crack: '#514611',
  gemA: '#59d455',
  gemB: '#f06aaf',
  grass: '#2f9a34',
  grassShadow: '#1c6120',
  web: 'rgba(210, 230, 190, 0.32)',
  rope: '#3f5220',
  timberDark: '#4a301a',
  timberLight: '#7b5429',
};

export class Stage {
  readonly staircase: Staircase;
  readonly theme: StageTheme;

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
    this.theme = (seed & 1) === 0 ? MINE_THEME : JUNGLE_THEME;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawBackdrop(ctx);
    this.drawFarCaveMass(ctx);
    this.drawCeilingSilhouette(ctx);
    if (this.theme.kind === 'mine') this.drawMineStructures(ctx);
    else this.drawJungleRuins(ctx);

    for (const platform of this.platforms) this.drawPlatformMass(ctx, platform);

    this.drawRoomDecor(ctx);
    this.staircase.draw(ctx);
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, this.theme.skyTop);
    gradient.addColorStop(0.42, this.theme.skyMid);
    gradient.addColorStop(1, this.theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (let y = 0; y < this.height; y += 64) {
      for (let x = 0; x < this.width; x += 64) {
        const n = hash2(x, y, this.seed ^ 0x5179);
        const r = 20 + (n % 36);
        ctx.fillStyle = (n & 1) === 0 ? this.theme.voidBlobA : this.theme.voidBlobB;
        ctx.beginPath();
        ctx.ellipse(x + 10 + (n % 40), y + 12 + ((n >>> 7) % 38), r, r * 0.62, (n % 9) * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawFarCaveMass(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x2401);
      const inset = 6 + (n % 10);
      const x = room.x + inset;
      const y = room.y + inset;
      const w = Math.max(20, room.w - inset * 2);
      const h = Math.max(18, room.h - inset * 2);
      ctx.fillStyle = room.tone % 2 === 0 ? 'rgba(0,0,0,0.20)' : 'rgba(55,40,28,0.14)';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 16);
      ctx.fill();

      for (let i = 0; i < 10; i += 1) {
        const q = hash2(room.x + i * 13, room.y + i * 23, this.seed);
        ctx.fillStyle = (q & 1) === 0 ? 'rgba(0,0,0,0.16)' : 'rgba(90, 70, 40, 0.10)';
        ctx.beginPath();
        ctx.arc(x + 6 + (q % Math.max(8, w - 12)), y + 6 + ((q >>> 8) % Math.max(8, h - 12)), 4 + (q % 10), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCeilingSilhouette(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.theme.topRock;
    ctx.fillRect(0, 0, this.width, 14);
    for (let x = 0; x < this.width + 20; x += 18) {
      const n = hash2(x, 4, this.seed);
      const w = 12 + (n % 11);
      const h = 8 + ((n >>> 6) % 18);
      ctx.fillStyle = (n & 1) === 0 ? this.theme.blockB : this.theme.blockShadow;
      ctx.beginPath();
      ctx.moveTo(x, 13);
      ctx.lineTo(x + w, 13);
      ctx.lineTo(x + w - 2, 16 + h * 0.45);
      ctx.lineTo(x + w * 0.55, 15 + h);
      ctx.lineTo(x + 2, 15 + h * 0.68);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawMineStructures(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x9091);
      if ((n % 3) !== 0) continue;
      const x = room.x + 8;
      const y = room.y + 10 + ((n >>> 5) % Math.max(10, room.h - 28));
      const w = Math.max(28, room.w - 16);
      const h = Math.min(32, Math.max(16, room.h - 24));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(x + 2, y + 3, w - 4, h);

      ctx.fillStyle = this.theme.timberDark;
      ctx.fillRect(x, y, w, 4);
      ctx.fillRect(x, y + h - 4, w, 4);
      for (let px = x; px <= x + w; px += 18) ctx.fillRect(px, y, 4, h);

      ctx.fillStyle = this.theme.timberLight;
      for (let px = x + 1; px <= x + w - 3; px += 18) ctx.fillRect(px, y + 1, 2, h - 2);

      if ((n & 1) === 0) {
        const crateX = x + 8 + (n % Math.max(8, w - 22));
        const crateY = y + h - 18;
        this.drawCrate(ctx, crateX, crateY);
      }
      if ((n % 5) <= 2) {
        const potX = x + 10 + ((n >>> 7) % Math.max(8, w - 18));
        const potY = y + h - 17;
        this.drawPot(ctx, potX, potY);
      }
    }
  }

  private drawJungleRuins(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x5022);
      if ((n % 3) !== 0) continue;
      const x = room.x + 12 + (n % Math.max(8, room.w - 28));
      const y = room.y + 10 + ((n >>> 5) % Math.max(10, room.h - 48));
      const h = 24 + ((n >>> 9) % 22);
      this.drawTotem(ctx, x, y, h);

      if ((n & 1) === 0) {
        const vineX = x + 4;
        this.drawVineStrand(ctx, vineX, room.y, h + 22, 2 + (n % 3));
      }
    }
  }

  private drawPlatformMass(ctx: CanvasRenderingContext2D, platform: Platform): void {
    const step = 16;
    const cols = Math.max(2, Math.ceil(platform.w / step));
    const left = platform.x;
    const right = platform.x + platform.w;
    const top = platform.y;
    const baseBottom = platform.y + platform.h + 10;

    const topOffsets: number[] = [];
    const bottomOffsets: number[] = [];
    for (let i = 0; i <= cols; i += 1) {
      const nTop = hash2(left + i * 17, top, this.seed ^ 0x11aa);
      const nBottom = hash2(left + i * 11, baseBottom, this.seed ^ 0x22bb);
      topOffsets.push((nTop % 7) - 1);
      bottomOffsets.push(4 + (nBottom % 10));
    }

    const bottom = baseBottom + Math.max(...bottomOffsets);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left, top + topOffsets[0]);
    for (let i = 1; i <= cols; i += 1) {
      const x = Math.min(right, left + i * step);
      ctx.lineTo(x, top + topOffsets[i]);
    }
    for (let i = cols; i >= 0; i -= 1) {
      const x = Math.min(right, left + i * step);
      ctx.lineTo(x, baseBottom + bottomOffsets[i]);
    }
    ctx.closePath();
    ctx.fillStyle = this.theme.blockA;
    ctx.fill();

    for (let y = top; y < bottom; y += 16) {
      for (let x = left; x < right; x += 16) {
        const n = hash2(x, y, this.seed);
        const w = Math.min(16, right - x);
        const h = Math.min(16, bottom - y);
        const ox = (n >>> 3) % 2;
        const oy = (n >>> 5) % 2;
        ctx.fillStyle = (n & 1) === 0 ? this.theme.blockA : this.theme.blockB;
        ctx.fillRect(x + ox, y + oy, w, h);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = this.theme.blockHighlight;
        ctx.fillRect(x + ox + 1, y + oy + 1, Math.max(0, w - 3), 2);
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = this.theme.blockShadow;
        ctx.fillRect(x + ox, y + oy + h - 2, w, 2);
        ctx.globalAlpha = 1;

        if ((n % 5) === 0) {
          ctx.fillStyle = this.theme.embeddedStone;
          ctx.beginPath();
          ctx.ellipse(x + 8, y + 8, 3 + (n % 4), 2 + ((n >>> 4) % 3), 0, 0, Math.PI * 2);
          ctx.fill();
        } else if ((n % 9) === 0) {
          ctx.strokeStyle = this.theme.crack;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 2);
          ctx.lineTo(x + 5, y + 7);
          ctx.lineTo(x + 9, y + 12);
          ctx.lineTo(x + 7, y + 15);
          ctx.stroke();
        } else if ((n % 11) === 0) {
          ctx.fillStyle = (n & 1) === 0 ? this.theme.gemA : this.theme.gemB;
          ctx.fillRect(x + 7, y + 6, 3, 6);
          ctx.fillRect(x + 6, y + 8, 5, 2);
        }
      }
    }

    this.drawTopGrowth(ctx, platform, topOffsets);
    if (this.theme.kind === 'mine' && platform.w >= 94) this.drawTimberSupport(ctx, platform, bottom);
    if (this.theme.kind === 'jungle' && platform.w >= 82) this.drawRootClusters(ctx, platform, bottom);
    ctx.restore();
  }

  private drawTopGrowth(ctx: CanvasRenderingContext2D, platform: Platform, topOffsets: readonly number[]): void {
    const top = platform.y;
    for (let x = platform.x + 4, i = 0; x < platform.x + platform.w - 8; x += 14, i += 1) {
      const n = hash2(x, top, this.seed ^ 0xa75c);
      if ((n % 4) !== 0) continue;
      const y = top + (topOffsets[Math.min(topOffsets.length - 1, i)] ?? 0);
      const h = 3 + (n % 4);
      ctx.fillStyle = this.theme.grassShadow;
      ctx.fillRect(x, y - 1, 7, 2);
      ctx.fillStyle = this.theme.grass;
      ctx.fillRect(x + 1, y - h, 1, h);
      ctx.fillRect(x + 3, y - h - 1, 1, h + 1);
      ctx.fillRect(x + 5, y - h + 1, 1, h - 1);
    }
  }

  private drawTimberSupport(ctx: CanvasRenderingContext2D, platform: Platform, bottom: number): void {
    const x1 = platform.x + 18;
    const x2 = platform.x + platform.w - 20;
    const postH = 18 + (hash2(platform.x, platform.y, this.seed) % 30);
    ctx.fillStyle = this.theme.timberDark;
    ctx.fillRect(x1, bottom - 2, 4, postH);
    ctx.fillRect(x2, bottom - 2, 4, postH);
    ctx.fillRect(x1 - 2, bottom - 6, x2 - x1 + 8, 5);
    ctx.strokeStyle = this.theme.timberLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1 + 2, bottom + 5);
    ctx.lineTo(x2 + 2, bottom + 5);
    ctx.moveTo(x1 + 2, bottom + 13);
    ctx.lineTo(x2 + 2, bottom + 13);
    ctx.stroke();
  }

  private drawRootClusters(ctx: CanvasRenderingContext2D, platform: Platform, bottom: number): void {
    const count = Math.max(1, Math.floor(platform.w / 52));
    for (let i = 0; i < count; i += 1) {
      const n = hash2(platform.x + i * 31, platform.y, this.seed ^ 0x33cc);
      const x = platform.x + 12 + i * Math.floor(platform.w / count) + (n % 9);
      this.drawVineStrand(ctx, x, bottom - 1, 14 + (n % 18), 2 + (n % 3));
    }
  }

  private drawRoomDecor(ctx: CanvasRenderingContext2D): void {
    for (const room of this.rooms) {
      const n = hash2(room.x, room.y, this.seed ^ 0x7ca1);
      if (this.theme.kind === 'mine') {
        if ((n % 3) === 0) this.drawWeb(ctx, room.x + 8 + (n % Math.max(8, room.w - 18)), room.y + 10 + ((n >>> 6) % Math.max(8, room.h - 20)), 8 + (n % 7));
        if ((n % 4) === 0) {
          const ropeX = room.x + 12 + (n % Math.max(8, room.w - 20));
          ctx.strokeStyle = this.theme.rope;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ropeX, 0);
          ctx.lineTo(ropeX, room.y + 20 + ((n >>> 8) % 44));
          ctx.stroke();
        }
      } else {
        if ((n % 2) === 0) this.drawLeafPatch(ctx, room.x + 10 + (n % Math.max(8, room.w - 20)), room.y + 8 + ((n >>> 6) % Math.max(8, room.h - 18)));
        if ((n % 4) === 0) this.drawVineStrand(ctx, room.x + 6 + (n % Math.max(6, room.w - 12)), room.y, 24 + ((n >>> 7) % 40), 2 + (n % 3));
      }
    }
  }

  private drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#7d4b20';
    ctx.fillRect(x, y, 14, 14);
    ctx.strokeStyle = '#3c2614';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, 12, 12);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + 12, y + 12);
    ctx.moveTo(x + 12, y + 2);
    ctx.lineTo(x + 2, y + 12);
    ctx.stroke();
  }

  private drawPot(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#c3b39d';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 4);
    ctx.lineTo(x + 11, y + 4);
    ctx.lineTo(x + 13, y + 11);
    ctx.lineTo(x, y + 11);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8b6e54';
    ctx.fillRect(x + 3, y + 2, 7, 2);
  }

  private drawTotem(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    ctx.fillStyle = '#5a2f19';
    ctx.fillRect(x, y, 18, h);
    ctx.strokeStyle = '#31170d';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 18, h);
    ctx.fillStyle = '#8b5d31';
    ctx.fillRect(x + 2, y + 2, 14, 4);
    ctx.beginPath();
    ctx.arc(x + 6, y + 13, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 12, y + 13, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a130c';
    ctx.beginPath();
    ctx.arc(x + 6, y + 13, 1.2, 0, Math.PI * 2);
    ctx.arc(x + 12, y + 13, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 5, y + 22, 8, 3);
    ctx.fillRect(x + 4, y + 28, 10, 2);
  }

  private drawLeafPatch(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#13571d';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(x + i * 4, y + (i % 2), 5, 3, (-0.4 + i * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#27a037';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 1, 4, 2, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawVineStrand(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, sway: number): void {
    ctx.strokeStyle = this.theme.rope;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + sway, y + h * 0.2, x - sway, y + h * 0.68, x + sway * 0.35, y + h);
    ctx.stroke();

    ctx.fillStyle = this.theme.grass;
    for (let py = y + 8; py < y + h; py += 12) {
      ctx.fillRect(Math.round(x + sway * 0.45), py, 4, 2);
      ctx.fillRect(Math.round(x - sway * 0.45 - 2), py + 2, 4, 2);
    }
  }

  private drawWeb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.save();
    ctx.strokeStyle = this.theme.web;
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
  let h = Math.imul((x | 0) ^ 0x9e3779b9, 374761393) + Math.imul((y | 0) ^ 0x7f4a7c15, 668265263) + Math.imul((seed | 0) ^ 0x85ebca6b, 2147483647);
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
