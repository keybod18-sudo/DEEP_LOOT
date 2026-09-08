import { GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { PhysicsBody } from '../game/types';
import type { Stage } from '../stage/Stage';
import type { EquipmentRarity, Item } from './Item';

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
    const x = Math.round(this.x + this.w / 2);
    const y = Math.round(this.y + this.h / 2 + bob);
    const pulse = 0.72 + Math.sin(this.age * 4.5) * 0.12;

    ctx.save();
    ctx.translate(x, y);
    ctx.imageSmoothingEnabled = false;

    if (this.item.category === 'weapon') {
      const color = rarityColor(this.item.dropRarity);
      this.drawWeaponIcon(ctx, pulse, color);
      this.drawPowerBadge(ctx, this.item.powerLevel);
    } else if (this.item.category === 'armor') {
      const color = rarityColor(this.item.dropRarity);
      this.drawArmorIcon(ctx, pulse, color);
      this.drawPowerBadge(ctx, this.item.powerLevel);
    } else {
      this.drawPotionIcon(ctx, pulse);
    }

    ctx.restore();
  }

  private drawWeaponIcon(ctx: CanvasRenderingContext2D, pulse: number, rarity: string): void {
    ctx.save();
    ctx.shadowColor = rarity;
    ctx.shadowBlur = 6 + pulse * 3;
    ctx.fillStyle = '#151b22';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = rarity;
    ctx.strokeRect(-9.5, -9.5, 19, 19);

    ctx.translate(0, 1);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#f5f8fb';
    ctx.fillRect(-1, -9, 3, 12);
    ctx.fillStyle = '#9fb6c9';
    ctx.fillRect(1, -8, 1, 10);
    ctx.fillStyle = rarity;
    ctx.fillRect(-5, 2, 11, 3);
    ctx.fillStyle = '#8b552d';
    ctx.fillRect(-1, 5, 3, 6);
    ctx.fillStyle = rarity;
    ctx.fillRect(-2, 10, 5, 2);
    ctx.restore();
  }

  private drawArmorIcon(ctx: CanvasRenderingContext2D, pulse: number, rarity: string): void {
    ctx.save();
    ctx.shadowColor = rarity;
    ctx.shadowBlur = 6 + pulse * 3;
    ctx.fillStyle = '#151b22';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = rarity;
    ctx.strokeRect(-9.5, -9.5, 19, 19);

    ctx.fillStyle = rarity;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(7, -5);
    ctx.lineTo(6, 3);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, 3);
    ctx.lineTo(-7, -5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3f7fb';
    ctx.fillRect(-1, -6, 2, 12);
    ctx.fillRect(-4, -2, 8, 2);
    ctx.fillStyle = '#263746';
    ctx.fillRect(-5, 4, 10, 2);
    ctx.restore();
  }

  private drawPowerBadge(ctx: CanvasRenderingContext2D, powerLevel: number): void {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(5,8,12,.94)';
    ctx.fillRect(3, -10, 8, 8);
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.strokeRect(3.5, -9.5, 7, 7);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(powerLevel), 7, -6);
    ctx.restore();
  }

  private drawPotionIcon(ctx: CanvasRenderingContext2D, pulse: number): void {
    const effect = this.item.category === 'consumable' ? this.item.effect : 'heal';
    const liquid = effect === 'remedy'
      ? '#65e8ff'
      : effect === 'antidote'
        ? '#9be54d'
        : '#ff4e63';
    const glow = effect === 'remedy'
      ? `rgba(101, 232, 255, ${pulse})`
      : effect === 'antidote'
        ? `rgba(155, 229, 77, ${pulse})`
        : `rgba(255, 78, 99, ${pulse})`;

    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#151b22';
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = liquid;
    ctx.strokeRect(-9.5, -9.5, 19, 19);

    ctx.fillStyle = '#d6b47a';
    ctx.fillRect(-3, -8, 6, 3);
    ctx.fillStyle = '#d8edf3';
    ctx.fillRect(-4, -5, 8, 3);
    ctx.fillRect(-6, -2, 12, 8);
    ctx.fillRect(-4, 6, 8, 2);
    ctx.fillStyle = liquid;
    ctx.fillRect(-5, 1, 10, 5);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.75;
    ctx.fillRect(-3, -1, 2, 4);
    ctx.restore();
  }
}

function rarityColor(rarity: EquipmentRarity): string {
  if (rarity === '赤神話') return '#ff4254';
  if (rarity === '金') return '#ffd653';
  if (rarity === '銀') return '#d8e3ee';
  return '#c47a48';
}
