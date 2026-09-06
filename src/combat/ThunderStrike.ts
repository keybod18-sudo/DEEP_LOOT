import type { Rect } from '../game/types';

export class ThunderStrike {
  alive = true;
  age = 0;

  constructor(
    public readonly centerX: number,
    public readonly stageHeight: number,
    public life: number,
    public readonly beamWidth: number,
  ) {}

  get rect(): Rect {
    return {
      x: this.centerX - this.beamWidth / 2,
      y: 0,
      w: this.beamWidth,
      h: this.stageHeight,
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

    const x = Math.round(this.centerX);
    const phase = Math.floor(this.age * 80) % 2;
    const points = [
      { x, y: 0 },
      { x: x - 10 + phase * 3, y: 60 },
      { x: x + 6 - phase * 2, y: 120 },
      { x: x - 12 + phase * 3, y: 180 },
      { x: x + 8 - phase * 2, y: 240 },
      { x: x - 4 + phase * 2, y: 300 },
      { x: x + 10 - phase * 3, y: 360 },
      { x: x - 6 + phase * 2, y: this.stageHeight },
    ];

    ctx.save();
    ctx.fillStyle = 'rgba(142, 235, 255, 0.18)';
    ctx.fillRect(Math.round(this.centerX - this.beamWidth / 2), 0, this.beamWidth, this.stageHeight);

    ctx.strokeStyle = '#7ce8ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0]!.x, points[0]!.y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();

    ctx.fillStyle = '#d7ffff';
    for (let i = 0; i < 9; i += 1) {
      const sparkX = Math.round(this.centerX - this.beamWidth / 2 + (i * 7 % this.beamWidth));
      const sparkY = Math.round((i / 8) * this.stageHeight);
      ctx.fillRect(sparkX, sparkY + (phase ? 8 : 0), 2, 4);
    }
    ctx.restore();
  }
}
