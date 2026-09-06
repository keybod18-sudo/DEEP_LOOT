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
    ctx.fillStyle = '#151d25';
    ctx.fillRect(0, 0, this.width, this.height);

    // Room zones are kept for generation only.
    // Do not draw the old rectangular outline: it looked like an unintended UI window.
    for (const room of this.rooms) {
      const c = 24 + room.tone * 2;
      ctx.fillStyle = `rgba(${c}, ${c + 7}, ${c + 12}, 0.22)`;
      ctx.fillRect(room.x, room.y, room.w, room.h);
    }

    // Deterministic brick texture based on world coordinates + floor seed.
    for (let y = 18; y < this.height; y += 32) {
      const offset = ((y / 32) & 1) * 18;
      for (let x = -offset; x < this.width; x += 72) {
        const noise = hash2(x, y, this.seed) % 4;
        ctx.fillStyle = noise === 0 ? '#222e38' : '#1d2932';
        ctx.fillRect(x, y, 36, 4);
      }
    }

    for (const platform of this.platforms) {
      ctx.fillStyle = '#4d5862';
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = '#7a858e';
      ctx.fillRect(platform.x, platform.y, platform.w, 3);
      ctx.fillStyle = '#303a43';
      for (let x = platform.x + 28; x < platform.x + platform.w; x += 32) {
        ctx.fillRect(x, platform.y + 4, 3, Math.max(2, platform.h - 4));
      }
      if (platform.h >= 18) {
        ctx.fillStyle = '#3e4851';
        ctx.fillRect(platform.x, platform.y + platform.h - 4, platform.w, 4);
      }
    }

    this.staircase.draw(ctx);
  }
}

function hash2(x: number, y: number, seed: number): number {
  let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  return (n ^ (n >>> 16)) >>> 0;
}
