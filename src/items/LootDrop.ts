import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { PhysicsBody } from '../game/types';
import type { Stage } from '../stage/Stage';
import type { Item } from './Item';

export class LootDrop implements PhysicsBody {
  readonly w = 14;
  readonly h = 14;
  vx: number;
  vy = -2.4;
  grounded = false;
  age = 0;

  constructor(
    public x: number,
    public y: number,
    public readonly item: Item,
  ) {
    this.vx = (Math.random() - 0.5) * 2.2;
  }

  update(dt: number, stage: Stage): void {
    this.age += dt;
    const previousY = this.y;
    this.vy += GRAVITY * 0.72;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.94;
    resolveFloor(this, previousY, stage.platforms, stage.width);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const bob = this.grounded ? Math.sin(this.age * 5) * 1.5 : 0;
    const x = Math.round(this.x);
    const y = Math.round(this.y + bob);

    ctx.save();
    ctx.fillStyle = '#101820';
    ctx.fillRect(x - 1, y - 1, this.w + 2, this.h + 2);

    if (this.item.category === 'weapon') {
      ctx.fillStyle = '#e5b94d';
      ctx.fillRect(x + 6, y + 1, 3, 10);
      ctx.fillStyle = '#dbe6ef';
      ctx.fillRect(x + 4, y + 1, 5, 7);
      ctx.fillStyle = '#8a5a2d';
      ctx.fillRect(x + 5, y + 9, 7, 3);
    } else if (this.item.category === 'armor') {
      ctx.fillStyle = '#6e9ed6';
      ctx.fillRect(x + 2, y + 2, 10, 8);
      ctx.fillStyle = '#3f648f';
      ctx.fillRect(x + 4, y + 10, 6, 2);
    } else {
      ctx.fillStyle = '#69c777';
      ctx.fillRect(x + 3, y + 5, 8, 7);
      ctx.fillStyle = '#d5e5d8';
      ctx.fillRect(x + 5, y + 2, 4, 4);
    }
    ctx.restore();
  }
}
