import { BALANCE } from '../config/balance';
import { damageEnemy } from '../combat/Damage';
import { intersects } from './Collision';
import { Goblin } from '../enemies/Goblin';
import { EnemyRenderer } from '../enemies/EnemyRenderer';
import type { Enemy } from '../enemies/Enemy';
import { Slime } from '../enemies/Slime';
import { Ahriman } from '../enemies/Ahriman';
import { Snake } from '../enemies/Snake';
import { Bat } from '../enemies/Bat';
import { Inventory } from '../items/Inventory';
import { createRandomItem } from '../items/Item';
import { LootDrop } from '../items/LootDrop';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { createStage01 } from '../stage/Stage01';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { MenuUI } from '../ui/Menu';

export interface HudElements {
  floor: HTMLElement;
  hp: HTMLElement;
  attack: HTMLElement;
  defense: HTMLElement;
  gold: HTMLElement;
}

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input = new Input();
  private readonly stage = createStage01();
  private readonly playerRenderer = new PlayerRenderer();
  private readonly enemyRenderer = new EnemyRenderer();
  private readonly player = new Player(this.playerRenderer);
  private readonly inventory = new Inventory();
  private readonly loop = new GameLoop((dt) => this.update(dt), () => this.draw());
  private readonly menu: MenuUI;
  private enemies: Enemy[] = [];
  private loot: LootDrop[] = [];
  private gold = 0;
  private floor = 1;
  private notice = '';
  private noticeTime = 0;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    menuRoot: HTMLElement,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D Canvasを初期化できません。');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;

    this.menu = new MenuUI(menuRoot, {
      onWeapon: (index) => this.equipWeapon(index),
      onArmor: (index) => this.equipArmor(index),
      onConsumable: (index) => this.useConsumable(index),
      onClose: () => this.setMenuOpen(false),
    });
  }

  async start(): Promise<void> {
    await Promise.all([
      this.playerRenderer.load(),
      this.enemyRenderer.load(),
    ]);
    this.reset();
    this.loop.start();
  }

  reset(): void {
    this.player.reset();
    this.floor = 1;
    this.gold = 0;
    this.loot = [];
    this.spawnEnemies();
    this.setMenuOpen(false);
    this.showNotice('探索開始');
    this.refreshUi();
  }

  toggleMenu(): void {
    this.setMenuOpen(!this.menu.isOpen);
  }

  private update(dt: number): void {
    if (this.input.consumePress('m', 'escape', 'tab')) {
      this.setMenuOpen(!this.menu.isOpen);
      return;
    }

    this.noticeTime = Math.max(0, this.noticeTime - dt);
    if (this.menu.isOpen || this.player.hp <= 0) return;

    const hpBeforeUpdate = this.player.hp;
    this.player.update(dt, this.input, this.stage);
    if (this.player.hp !== hpBeforeUpdate) this.refreshUi();
    this.resolvePlayerAttack();

    for (const enemy of this.enemies) {
      enemy.update(dt, {
        player: this.player,
        stage: this.stage,
        hurtPlayer: (damage, sourceX) => {
          const reduced = Math.max(1, damage - this.totalDefense - this.inventory.flatDamageReduction);
          const damaged = this.player.hurt(reduced, sourceX);
          if (damaged) this.refreshUi();
          return damaged;
        },
        poisonPlayer: (duration, tickInterval, damage) => {
          this.player.applyPoison(duration, tickInterval, damage);
          this.showNotice('毒状態になった');
          this.refreshUi();
        },
      });
    }

    for (const drop of this.loot) drop.update(dt, this.stage);
    this.collectLoot();
    this.checkStaircase();
  }

  private resolvePlayerAttack(): void {
    const hitbox = this.player.getHitbox();
    if (!hitbox) return;

    for (const enemy of this.enemies) {
      if (!enemy.alive || !intersects(hitbox, enemy)) continue;

      const killed = damageEnemy(
        enemy,
        this.totalAttack,
        this.player.x + this.player.w / 2,
        this.inventory.knockbackMultiplier,
      );
      this.player.attack.consumeHit();

      if (killed) {
        this.gold += 5;
        if (this.inventory.killHeal > 0) this.player.heal(this.inventory.killHeal, this.maxHp);
        this.loot.push(new LootDrop(enemy.x + enemy.w / 2 - 7, enemy.y + enemy.h / 2 - 7, createRandomItem(this.floor)));
      }
      this.refreshUi();
      break;
    }
  }

  private collectLoot(): void {
    const remaining: LootDrop[] = [];
    for (const drop of this.loot) {
      if (!intersects(this.player, drop)) {
        remaining.push(drop);
        continue;
      }
      if (this.inventory.add(drop.item)) {
        this.showNotice(`${drop.item.name} を入手`);
        this.refreshUi();
      } else {
        remaining.push(drop);
        this.showNotice('対応するアイテム欄が満杯です');
      }
    }
    this.loot = remaining;
  }

  private checkStaircase(): void {
    if (!intersects(this.player, this.stage.staircase)) return;
    if (!this.input.consumePress('e', 'enter')) return;
    this.floor += 1;
    this.player.resetPosition();
    this.loot = [];
    this.spawnEnemies();
    this.showNotice(`地下 ${this.floor} 階へ`);
    this.refreshUi();
  }

  private spawnEnemies(): void {
    const groundSpots = shuffle([95, 190, 285, 390, 500, 575]);
    const slimeX = groundSpots[0] ?? 95;
    const goblinX1 = groundSpots[1] ?? 190;
    const goblinX2 = groundSpots[2] ?? 470;
    const ahrimanX = shuffle([260, 330, 430, 560])[0] ?? 430;
    const snakeX = shuffle([125, 245, 355, 525])[0] ?? 355;
    const batX = shuffle([220, 340, 455, 590])[0] ?? 455;

    this.enemies = [
      new Slime(slimeX, 355, 'crawl'),
      new Slime(410, 129, 'cling'),
      new Goblin(goblinX1, 342, 1, 0.8),
      new Goblin(goblinX2, 342, -1, 0.5),
      new Ahriman(ahrimanX, 165),
      new Snake(snakeX, 362),
      new Bat(batX, 125),
    ];
  }

  private equipWeapon(index: number): void {
    this.inventory.equipWeapon(index);
    this.showNotice(`武器: ${this.inventory.equippedWeapon?.name ?? 'なし'}`);
    this.refreshUi();
  }

  private equipArmor(index: number): void {
    this.inventory.equipArmor(index);
    this.player.clampHp(this.maxHp);
    this.showNotice(`防具: ${this.inventory.equippedArmor?.name ?? 'なし'}`);
    this.refreshUi();
  }

  private useConsumable(index: number): void {
    if (this.player.hp >= this.maxHp) {
      this.showNotice('HPは満タンです');
      return;
    }
    const item = this.inventory.takeConsumable(index);
    if (!item) return;
    this.player.heal(item.heal, this.maxHp);
    this.showNotice(`${item.name}: HP +${item.heal}`);
    this.refreshUi();
  }

  private draw(): void {
    this.stage.draw(this.ctx);

    for (const drop of this.loot) drop.draw(this.ctx);
    for (const enemy of this.enemies) {
      if (enemy.alive) this.enemyRenderer.draw(this.ctx, enemy);
    }
    this.player.draw(this.ctx);
    this.drawEnemyHpBars();
    this.drawPlayerHpBar();
    this.drawStairPrompt();
    this.drawNotice();
  }

  private drawPlayerHpBar(): void {
    const centerX = this.player.x + this.player.w / 2;
    const topY = this.player.y - 13;
    const width = 44;

    this.drawHpBar(centerX, topY, width, this.player.hp, this.maxHp);

    if (this.player.poisoned) {
      this.drawPoisonMark(centerX + width / 2 + 9, topY + 3);
    }
  }

  private drawPoisonMark(centerX: number, centerY: number): void {
    const size = 12;
    const x = Math.round(centerX - size / 2);
    const y = Math.round(centerY - size / 2);

    this.ctx.save();
    this.ctx.fillStyle = '#7d1bb1';
    this.ctx.fillRect(x, y, size, size);
    this.ctx.strokeStyle = '#f0b6ff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 9px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('毒', centerX, centerY + 0.5);
    this.ctx.restore();
  }

  private drawEnemyHpBars(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const width = enemy.type === 'ahriman' ? 48 : enemy.type === 'goblin' ? 42 : enemy.type === 'snake' ? 40 : 38;
      const y = enemy.type === 'ahriman' ? enemy.y - 12 : enemy.y - 10;
      this.drawHpBar(
        enemy.x + enemy.w / 2,
        y,
        width,
        enemy.hp,
        enemy.maxHp,
      );
    }
  }

  private drawHpBar(centerX: number, topY: number, width: number, hp: number, maxHp: number): void {
    const clampedMax = Math.max(1, maxHp);
    const ratio = Math.max(0, Math.min(1, hp / clampedMax));
    const x = Math.round(centerX - width / 2);
    const y = Math.round(topY);
    const height = 6;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 12, 18, 0.92)';
    this.ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    this.ctx.fillStyle = '#2a0b0b';
    this.ctx.fillRect(x, y, width, height);

    this.ctx.fillStyle = '#ff2a2a';
    this.ctx.fillRect(x, y, Math.round(width * ratio), height);

    this.ctx.strokeStyle = '#f6e7d0';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 0.5, y - 0.5, width + 1, height + 1);
    this.ctx.restore();
  }

  private drawStairPrompt(): void {
    if (!intersects(this.player, this.stage.staircase)) return;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 12, 18, 0.86)';
    this.ctx.fillRect(570, 305, 145, 28);
    this.ctx.fillStyle = '#f0e3c2';
    this.ctx.font = '14px system-ui';
    this.ctx.fillText('E / Enter：次の階へ', 580, 324);
    this.ctx.restore();
  }

  private drawNotice(): void {
    if (this.noticeTime <= 0 || !this.notice) return;
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
    this.ctx.fillRect(16, 16, 250, 30);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px system-ui';
    this.ctx.fillText(this.notice, 26, 36);
    this.ctx.restore();
  }

  private setMenuOpen(open: boolean): void {
    this.menu.setOpen(open);
    this.refreshUi();
  }

  private showNotice(text: string): void {
    this.notice = text;
    this.noticeTime = 1.8;
  }

  private refreshUi(): void {
    this.hud.floor.textContent = String(this.floor);
    this.hud.hp.textContent = `${this.player.hp}/${this.maxHp}`;
    this.hud.attack.textContent = String(this.totalAttack);
    this.hud.defense.textContent = String(this.totalDefense);
    this.hud.gold.textContent = String(this.gold);
    this.menu.render({
      floor: this.floor,
      hp: this.player.hp,
      maxHp: this.maxHp,
      attack: this.totalAttack,
      defense: this.totalDefense,
      gold: this.gold,
    }, this.inventory);
  }

  private get totalAttack(): number {
    return BALANCE.player.attackDamage + this.inventory.attackBonus;
  }

  private get totalDefense(): number {
    return this.inventory.defenseBonus;
  }

  private get maxHp(): number {
    return BALANCE.player.maxHp + this.inventory.maxHpBonus;
  }
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
