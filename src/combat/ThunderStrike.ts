import type { Facing, Rect } from '../game/types';

export class ThunderStrike {
  alive = true;
  age = 0;

  constructor(
    public readonly startX: number,
    public readonly centerY: number,
    public readonly facing: Facing,
    public readonly range: number,
    public life: number,
    public readonly beamHeight: number,
  ) {}

  get rect(): Rect {
    const endX = this.startX + this.facing * this.range;
    const left = Math.min(this.startX, endX);
    return {
      x: left,
      y: this.centerY - this.beamHeight / 2,
      w: Math.abs(endX - this.startX),
      h: this.beamHeight,
    };
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.age += dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const dir = this.facing;
    const phase = Math.floor(this.age * 90) % 2;
    const segment = 55;
    const segmentCount = Math.ceil(this.range / segment);

    ctx.save();

    // Wide electric glow around the horizontal strike.
    const rect = this.rect;
    ctx.fillStyle = 'rgba(126, 226, 255, 0.16)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    const drawBolt = (stroke: string, lineWidth: number): void => {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(this.startX, this.centerY);

      for (let i = 1; i <= segmentCount; i += 1) {
        const distance = Math.min(this.range, i * segment);
        const x = this.startX + dir * distance;
        const zig = ((i + phase) % 2 === 0 ? -1 : 1) * (9 + (i % 3) * 3);
        ctx.lineTo(x, this.centerY + zig);
      }

      ctx.stroke();
    };

    drawBolt('#70dcff', 10);
    drawBolt('#ffffff', 4);

    ctx.fillStyle = '#d9fbff';
    for (let i = 0; i < 10; i += 1) {
      const distance = (this.range / 10) * i + (phase ? 8 : 0);
      const x = this.startX + dir * distance;
      const y = this.centerY + ((i % 2 === 0) ? -16 : 14);
      ctx.fillRect(Math.round(x), Math.round(y), 4, 3);
    }

    ctx.restore();
  }
}
