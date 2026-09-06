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
import { Roper } from '../enemies/Roper';
import { Slug } from '../enemies/Slug';
import { Rat } from '../enemies/Rat';
import { Skeleton } from '../enemies/Skeleton';
import { SkeletonArcher } from '../enemies/SkeletonArcher';
import { Bomb } from '../enemies/Bomb';
import { Caterpillar } from '../enemies/Caterpillar';
import { FrostMite } from '../enemies/FrostMite';
import { CrystalEye } from '../enemies/CrystalEye';
import { Fireball } from '../combat/Fireball';
import { ThunderStrike } from '../combat/ThunderStrike';
import { AhrimanFireball } from '../combat/AhrimanFireball';
import { FreezeLancer } from '../combat/FreezeLancer';
import { SkeletonArrow } from '../combat/SkeletonArrow';
import { Inventory } from '../items/Inventory';
import { createHealingPotion, createRandomItem, createRemedy } from '../items/Item';
import { LootDrop } from '../items/LootDrop';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { createDungeonStage } from '../stage/DungeonGenerator';
import { GameLoop } from './GameLoop';
import { Input } from './Input';
import { MenuUI } from '../ui/Menu';
import { TreasureChest } from '../items/TreasureChest';
import type { Platform } from '../stage/Platform';

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
  private stage = createDungeonStage(1);
  private readonly playerRenderer = new PlayerRenderer();
  private readonly enemyRenderer = new EnemyRenderer();
  private readonly player = new Player(this.playerRenderer);
  private readonly inventory = new Inventory();
  private readonly loop = new GameLoop((dt) => this.update(dt), () => this.draw());
  private readonly menu: MenuUI;
  private enemies: Enemy[] = [];
  private loot: LootDrop[] = [];
  private chests: TreasureChest[] = [];
  private fireballs: Fireball[] = [];
  private thunderStrikes: ThunderStrike[] = [];
  private ahrimanFireballs: AhrimanFireball[] = [];
  private freezeLancers: FreezeLancer[] = [];
  private skeletonArrows: SkeletonArrow[] = [];
  private fireballCooldown = 0;
  private thunderCooldown = 0;
  private cameraX = 0;
  private cameraY = 0;
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
      CrystalEye.loadAssets(),
      TreasureChest.loadAssets(),
      Fireball.loadAssets(),
    ]);
    this.reset();
    this.loop.start();
  }

  reset(): void {
    this.player.reset();
    this.inventory.clear();
    this.inventory.add(createHealingPotion());
    this.inventory.add(createHealingPotion());
    this.inventory.add(createRemedy());
    this.inventory.add(createRemedy());
    this.floor = 1;
    this.gold = 0;
    this.loot = [];
    this.fireballs = [];
    this.thunderStrikes = [];
    this.ahrimanFireballs = [];
    this.freezeLancers = [];
    this.skeletonArrows = [];
    this.fireballCooldown = 0;
    this.thunderCooldown = 0;
    this.stage = createDungeonStage(this.floor);
    this.player.resetPosition(this.stage.spawn.x, this.stage.spawn.y);
    this.cameraX = 0;
    this.cameraY = 0;
    this.spawnStageContents();
    this.setMenuOpen(false);
    this.showNotice('探索開始');
    this.refreshUi();
  }

  toggleMenu(): void {
    if (this.menu.isOpen) {
      this.setMenuOpen(false);
      return;
    }
    if (this.player.sealed) {
      this.showNotice('封印でメニューを開けない');
      return;
    }
    if (this.player.sleeping) {
      this.showNotice('睡眠中で動けない');
      return;
    }
    if (this.player.frozen) {
      this.showNotice('氷結中で動けない');
      return;
    }
    this.setMenuOpen(true);
  }

  private update(dt: number): void {
    if (this.input.consumePress('m', 'escape', 'tab')) {
      if (this.menu.isOpen) {
        this.setMenuOpen(false);
      } else if (this.player.sealed) {
        this.showNotice('封印でメニューを開けない');
      } else if (this.player.sleeping) {
        this.showNotice('睡眠中で動けない');
      } else if (this.player.frozen) {
        this.showNotice('氷結中で動けない');
      } else {
        this.setMenuOpen(true);
      }
      return;
    }

    this.noticeTime = Math.max(0, this.noticeTime - dt);
    if (this.menu.isOpen || this.player.hp <= 0) return;

    const hpBeforeUpdate = this.player.hp;
    this.player.update(dt, this.input, this.stage);
    if (this.player.hp !== hpBeforeUpdate) this.refreshUi();

    this.fireballCooldown = Math.max(0, this.fireballCooldown - dt);
    this.thunderCooldown = Math.max(0, this.thunderCooldown - dt);

    if (this.input.consumePress('k')) {
      if (this.player.silenced) {
        this.showNotice('沈黙で呪文を唱えられない');
      } else if (!this.player.paralysisStunned && !this.player.sleeping && !this.player.frozen && this.fireballCooldown <= 0) {
        this.castFireball();
      }
    }
    if (this.input.consumePress('l')) {
      if (this.player.silenced) {
        this.showNotice('沈黙で呪文を唱えられない');
      } else if (!this.player.paralysisStunned && !this.player.sleeping && !this.player.frozen && this.thunderCooldown <= 0) {
        this.castThunder();
      }
    }

    this.resolvePlayerAttack();
    this.updateFireballs(dt);
    this.updateThunderStrikes(dt);

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
          const wasPoisoned = this.player.poisoned;
          this.player.applyPoison(duration, tickInterval, damage);
          if (!wasPoisoned) this.showNotice('毒状態になった');
          this.refreshUi();
        },
        paralyzePlayer: (duration) => {
          const wasParalyzed = this.player.paralyzed;
          this.player.applyParalysis(duration);
          if (!wasParalyzed) this.showNotice('麻痺した');
          this.refreshUi();
        },
        slowPlayer: (duration) => {
          const wasSlowed = this.player.slowed;
          this.player.applySlow(duration);
          if (!wasSlowed) this.showNotice('スロウ状態になった');
          this.refreshUi();
        },
        sealPlayer: (duration) => {
          const wasSealed = this.player.sealed;
          this.player.applySeal(duration);
          this.setMenuOpen(false);
          if (!wasSealed) this.showNotice('封印された');
          this.refreshUi();
        },
        silencePlayer: (duration) => {
          const wasSilenced = this.player.silenced;
          this.player.applySilence(duration);
          if (!wasSilenced) this.showNotice('沈黙状態になった');
          this.refreshUi();
        },
        blindPlayer: (duration) => {
          const wasBlinded = this.player.blinded;
          this.player.applyBlind(duration);
          if (!wasBlinded) this.showNotice('暗闇状態になった');
          this.refreshUi();
        },
        sleepPlayer: (duration) => {
          const wasSleeping = this.player.sleeping;
          this.player.applySleep(duration);
          this.setMenuOpen(false);
          if (!wasSleeping) this.showNotice('睡眠状態になった');
          this.refreshUi();
        },
        freezePlayer: (duration) => {
          const wasFrozen = this.player.frozen;
          this.player.applyFrozen(duration);
          this.setMenuOpen(false);
          if (!wasFrozen) this.showNotice('氷結した');
          this.refreshUi();
        },
        spawnAhrimanFireball: (x, y, facing) => {
          this.ahrimanFireballs.push(new AhrimanFireball(
            x,
            y,
            facing * BALANCE.ahriman.fireballSpeed,
            facing,
            BALANCE.ahriman.fireballLife,
          ));
        },
        spawnFreezeLancer: (x, y, targetX, targetY) => {
          const dx = targetX - (x + 21);
          const dy = targetY - (y + 7);
          const distance = Math.max(1, Math.hypot(dx, dy));
          const speed = BALANCE.ahriman.freezeSpeed;

          this.freezeLancers.push(new FreezeLancer(
            x,
            y,
            (dx / distance) * speed,
            (dy / distance) * speed,
            BALANCE.ahriman.freezeLife,
          ));
        },
        spawnSkeletonArrow: (x, y, vx, vy, damage, poisoned) => {
          this.skeletonArrows.push(new SkeletonArrow(
            x,
            y,
            vx,
            vy,
            damage,
            poisoned,
            BALANCE.skeletonArcher.arrowLife,
          ));
        },
      });
    }

    this.updateAhrimanFireballs(dt);
    this.updateFreezeLancers(dt);
    this.updateSkeletonArrows(dt);

    for (const drop of this.loot) drop.update(dt, this.stage);
    this.collectLoot();
    this.checkChestInteraction();
    this.checkStaircase();
    this.updateCamera();
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
        this.handleEnemyKilled(enemy);
      }
      this.refreshUi();
      break;
    }
  }

  private castFireball(): void {
    const facing = this.player.facing;
    const x = facing > 0
      ? this.player.x + this.player.w + 10
      : this.player.x - BALANCE.fireball.width - 10;
    const y = this.player.y - 2;

    this.fireballs.push(new Fireball(
      x,
      y,
      facing * BALANCE.fireball.speed,
      facing,
      BALANCE.fireball.life,
    ));
    this.fireballCooldown = BALANCE.fireball.cooldown;
  }

  private castThunder(): void {
    const facing = this.player.facing;
    const startX = facing > 0
      ? this.player.x + this.player.w + 8
      : this.player.x - 8;
    const centerY = this.player.y + this.player.h * 0.48;

    const strike = new ThunderStrike(
      startX,
      centerY,
      facing,
      BALANCE.thunder.range,
      BALANCE.thunder.life,
      BALANCE.thunder.beamHeight,
    );

    this.thunderStrikes.push(strike);
    this.thunderCooldown = BALANCE.thunder.cooldown;
    this.showNotice('サンダー');

    // Piercing: every enemy intersecting the horizontal lightning takes damage.
    for (const enemy of this.enemies) {
      if (!enemy.alive || !intersects(strike.rect, enemy)) continue;
      const killed = damageEnemy(
        enemy,
        BALANCE.thunder.damage,
        this.player.x + this.player.w / 2,
        1.2,
      );
      if (killed) this.handleEnemyKilled(enemy);
    }
    this.refreshUi();
  }

  private updateFireballs(dt: number): void {
    for (const fireball of this.fireballs) {
      fireball.update(dt);
      if (!fireball.alive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.alive || !intersects(fireball.rect, enemy)) continue;

        const killed = damageEnemy(
          enemy,
          BALANCE.fireball.damage,
          fireball.x + fireball.w / 2,
          0.8,
        );
        fireball.alive = false;

        if (killed) {
          this.handleEnemyKilled(enemy);
        }
        this.refreshUi();
        break;
      }
    }

    this.fireballs = this.fireballs.filter((fireball) =>
      fireball.alive &&
      fireball.x > -120 &&
      fireball.x < this.stage.width + 120
    );
  }

  private updateThunderStrikes(dt: number): void {
    for (const strike of this.thunderStrikes) strike.update(dt);
    this.thunderStrikes = this.thunderStrikes.filter((strike) => strike.alive);
  }

  private updateAhrimanFireballs(dt: number): void {
    for (const shot of this.ahrimanFireballs) {
      shot.update(dt);
      if (!shot.alive) continue;

      if (intersects(shot.rect, this.player)) {
        const hit = this.player.hurt(shot.damage, shot.x);
        if (hit) this.refreshUi();
        shot.alive = false;
      }
    }

    this.ahrimanFireballs = this.ahrimanFireballs.filter((shot) =>
      shot.alive &&
      shot.x > -120 &&
      shot.x < this.stage.width + 120
    );
  }

  private updateFreezeLancers(dt: number): void {
    for (const lance of this.freezeLancers) {
      lance.update(dt);
      if (!lance.alive) continue;

      if (intersects(lance.rect, this.player)) {
        const hit = this.player.hurt(lance.damage, lance.x);
        if (hit) this.refreshUi();
        lance.alive = false;
      }
    }

    this.freezeLancers = this.freezeLancers.filter((lance) =>
      lance.alive &&
      lance.x > -140 &&
      lance.x < this.stage.width + 140
    );
  }


  private updateSkeletonArrows(dt: number): void {
    for (const arrow of this.skeletonArrows) {
      arrow.update(dt);
      if (!arrow.alive) continue;

      if (intersects(arrow.sweptRect, this.player)) {
        const hit = this.player.hurtProjectile(arrow.damage, arrow.x);

        if (arrow.poisoned) {
          const wasPoisoned = this.player.poisoned;
          this.player.applyPoison(
            BALANCE.skeletonArcher.poisonDuration,
            BALANCE.skeletonArcher.poisonTickInterval,
            BALANCE.skeletonArcher.poisonDamage,
          );
          if (!wasPoisoned) this.showNotice('毒矢を受けた');
        }

        if (hit) this.refreshUi();
        arrow.alive = false;
      }
    }

    this.skeletonArrows = this.skeletonArrows.filter((arrow) =>
      arrow.alive &&
      arrow.x > -120 &&
      arrow.x < this.stage.width + 120 &&
      arrow.y > -60 &&
      arrow.y < this.stage.height + 120
    );
  }

  private handleEnemyKilled(enemy: Enemy): void {
    this.gold += 5;
    if (this.inventory.killHeal > 0) this.player.heal(this.inventory.killHeal, this.maxHp);
    this.loot.push(new LootDrop(
      enemy.x + enemy.w / 2 - 7,
      enemy.y + enemy.h / 2 - 7,
      createRandomItem(this.floor),
    ));
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
    this.loot = [];
    this.fireballs = [];
    this.thunderStrikes = [];
    this.ahrimanFireballs = [];
    this.freezeLancers = [];
    this.skeletonArrows = [];
    this.fireballCooldown = 0;
    this.thunderCooldown = 0;
    this.stage = createDungeonStage(this.floor);
    this.player.resetPosition(this.stage.spawn.x, this.stage.spawn.y);
    this.cameraX = 0;
    this.cameraY = 0;
    this.spawnStageContents();
    this.showNotice(`地下 ${this.floor} 階へ`);
    this.refreshUi();
  }

  private spawnStageContents(): void {
    const groundPlatforms = this.stage.platforms
      .filter((platform) => platform.w >= 120 && platform.y > 180 && platform.y < this.stage.height - 30);
    const upperPlatforms = this.stage.platforms
      .filter((platform) => platform.w >= 110 && platform.y > 120 && platform.y < this.stage.height - 140);

    const chosen = shuffle(groundPlatforms).slice(0, 9);
    const point = (platform: Platform | undefined, h: number, fallbackX: number, fallbackY: number) => {
      if (!platform) return { x: fallbackX, y: fallbackY };
      const margin = Math.min(50, Math.max(18, platform.w * 0.2));
      const usable = Math.max(1, platform.w - margin * 2 - 42);
      return {
        x: platform.x + margin + Math.random() * usable,
        y: platform.y - h,
      };
    };

    const slime1 = point(chosen[0], 25, 260, 345);
    const slime2 = point(chosen[4], 25, 1060, 525);
    const gob1 = point(chosen[1], 38, 520, 342);
    const gob2 = point(chosen[2], 38, 900, 522);
    const gob3 = point(chosen[5], 38, 1180, 702);
    const snake1 = point(chosen[3], 18, 780, 532);
    const snake2 = point(chosen[6], 18, 360, 712);
    const roper1 = point(chosen[7], 58, 980, 672);

    // Small / newly added monsters must be visible without deep exploration.
    const startingPlatforms = groundPlatforms
      .filter((platform) => platform.y >= 180 && platform.y <= 390)
      .sort((a, b) => a.x - b.x);
    const midPlatforms = groundPlatforms
      .filter((platform) => platform.y > 390 && platform.y <= 560)
      .sort((a, b) => a.x - b.x);

    const ratPlatform = startingPlatforms[0] ?? chosen[0];
    const slugPlatform = startingPlatforms[1] ?? startingPlatforms[0] ?? chosen[1];
    const skeletonPlatform = midPlatforms[0] ?? startingPlatforms[startingPlatforms.length - 1] ?? chosen[5];
    const skeletonArcherPlatform = midPlatforms[1] ?? startingPlatforms[2] ?? chosen[6];
    const bombPlatform = startingPlatforms[2] ?? midPlatforms[0] ?? chosen[8] ?? chosen[2];
    const caterpillarPlatform = startingPlatforms[1] ?? startingPlatforms[0] ?? chosen[0];
    const caterpillarFarPlatform = groundPlatforms[groundPlatforms.length - 1] ?? chosen[8] ?? chosen[4];
    const frostMitePlatform = midPlatforms[0] ?? startingPlatforms[startingPlatforms.length - 1] ?? chosen[5];

    const rat1 = point(ratPlatform, 14, 250, 356);
    const slug1 = point(slugPlatform, 11, 520, 359);
    const skeleton1 = point(skeletonPlatform, 42, 720, 498);
    const skeletonArcher1 = point(skeletonArcherPlatform, 42, 880, 476);
    const bomb1 = point(bombPlatform, 26, 610, 356);
    const caterpillar1 = point(caterpillarPlatform, 20, 430, 350);
    const caterpillar2 = point(caterpillarFarPlatform, 20, this.stage.width - 260, 700);
    const frostMite1 = point(frostMitePlatform, 24, 760, 526);

    const batBandX1 = Math.max(260, this.stage.spawn.x + 140);
    const batBandX2 = Math.min(this.stage.width - 260, this.stage.spawn.x + 520);

    const clingPlatform = shuffle(upperPlatforms)[0];
    const clingX = clingPlatform ? clingPlatform.x + clingPlatform.w * 0.5 - 17 : 680;
    const clingY = clingPlatform ? clingPlatform.y + clingPlatform.h : 285;

    this.enemies = [
      new Slime(slime1.x, slime1.y, 'crawl'),
      new Slime(slime2.x, slime2.y, 'crawl'),
      new Slime(clingX, clingY, 'cling'),
      new Goblin(gob1.x, gob1.y, 1, 0.8),
      new Goblin(gob2.x, gob2.y, -1, 0.5),
      new Goblin(gob3.x, gob3.y, 1, 1.1),
      new Ahriman(630 + Math.random() * 470, 220 + Math.random() * 320),
      new Snake(snake1.x, snake1.y),
      new Snake(snake2.x, snake2.y),
      new Bat(batBandX1 + Math.random() * Math.max(40, batBandX2 - batBandX1), 170 + Math.random() * 120),
      new Bat(batBandX1 + 80 + Math.random() * Math.max(40, batBandX2 - batBandX1), 220 + Math.random() * 110),
      new Roper(roper1.x, roper1.y),
      new Slug(slug1.x, slug1.y),
      new Rat(rat1.x, rat1.y),
      new Skeleton(skeleton1.x, skeleton1.y),
      new SkeletonArcher(skeletonArcher1.x, skeletonArcher1.y),
      new Bomb(bomb1.x, bomb1.y),
      new Caterpillar(caterpillar1.x, caterpillar1.y),
      new Caterpillar(caterpillar2.x, caterpillar2.y),
      new FrostMite(frostMite1.x, frostMite1.y),
      new CrystalEye(
        Math.min(this.stage.width - 140, this.stage.spawn.x + 720 + Math.random() * 220),
        190 + Math.random() * 170,
      ),
    ];

    const chestPlatforms = shuffle(groundPlatforms)
      .filter((platform) => Math.abs(platform.x - this.stage.spawn.x) > 180)
      .slice(0, 3);
    this.chests = chestPlatforms.map((platform, index) => {
      const x = platform.x + 34 + ((index * 97 + this.floor * 53) % Math.max(50, platform.w - 80));
      return new TreasureChest(x, platform.y - 28);
    });
  }

  private checkChestInteraction(): void {
    const chest = this.chests.find((candidate) => !candidate.opened && intersects(this.player, {
      x: candidate.x - 12,
      y: candidate.y - 10,
      w: candidate.w + 24,
      h: candidate.h + 18,
    }));
    if (!chest || !this.input.consumePress('e', 'enter')) return;

    chest.opened = true;
    const goldReward = 12 + Math.floor(Math.random() * 19) + this.floor * 2;
    this.gold += goldReward;
    const item = createRandomItem(this.floor + 1);
    if (this.inventory.add(item)) {
      this.showNotice(`宝箱: ${item.name} / ${goldReward}G`);
    } else {
      this.loot.push(new LootDrop(chest.x + 8, chest.y - 5, item));
      this.showNotice(`宝箱: ${goldReward}G（アイテムは床へ）`);
    }
    this.refreshUi();
  }

  private updateCamera(): void {
    const canvas = this.ctx.canvas;
    const targetX = this.player.x + this.player.w / 2 - canvas.width / 2;
    const targetY = this.player.y + this.player.h / 2 - canvas.height / 2;
    const maxX = Math.max(0, this.stage.width - canvas.width);
    const maxY = Math.max(0, this.stage.height - canvas.height);
    const clampedX = Math.max(0, Math.min(maxX, targetX));
    const clampedY = Math.max(0, Math.min(maxY, targetY));
    this.cameraX += (clampedX - this.cameraX) * 0.14;
    this.cameraY += (clampedY - this.cameraY) * 0.14;
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
    const item = this.inventory.getConsumable(index);
    if (!item) return;

    if (item.effect === 'remedy') {
      if (!this.player.hasStatusEffects) {
        this.showNotice('状態異常はない');
        return;
      }
      this.inventory.takeConsumable(index);
      this.player.clearStatusEffects();
      this.showNotice('万能薬: 状態異常を解除');
      this.refreshUi();
      return;
    }

    if (this.player.hp >= this.maxHp) {
      this.showNotice('HPは満タンです');
      return;
    }
    this.inventory.takeConsumable(index);
    this.player.heal(item.heal, this.maxHp);
    this.showNotice(`${item.name}: HP +${item.heal}`);
    this.refreshUi();
  }

  private draw(): void {
    this.ctx.save();

    const explodingBomb = this.enemies.find((enemy) =>
      enemy.type === 'bomb' && (enemy as Bomb).state === 'explode'
    ) as Bomb | undefined;
    let shakeX = 0;
    let shakeY = 0;
    if (explodingBomb) {
      const progress = Math.min(1, explodingBomb.actionTime / BALANCE.bomb.explosionDuration);
      const strength = 10 * (1 - progress);
      shakeX = (Math.random() * 2 - 1) * strength;
      shakeY = (Math.random() * 2 - 1) * strength;
    }

    this.ctx.translate(
      -Math.round(this.cameraX) + Math.round(shakeX),
      -Math.round(this.cameraY) + Math.round(shakeY),
    );
    this.stage.draw(this.ctx);

    for (const chest of this.chests) chest.draw(this.ctx);
    for (const drop of this.loot) drop.draw(this.ctx);
    for (const strike of this.thunderStrikes) strike.draw(this.ctx);
    for (const fireball of this.fireballs) fireball.draw(this.ctx);
    for (const shot of this.ahrimanFireballs) shot.draw(this.ctx);
    for (const lance of this.freezeLancers) lance.draw(this.ctx);
    for (const arrow of this.skeletonArrows) arrow.draw(this.ctx);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.type === 'crystalEye') (enemy as CrystalEye).draw(this.ctx);
      else if (enemy.type === 'frostMite') (enemy as FrostMite).draw(this.ctx);
      else this.enemyRenderer.draw(this.ctx, enemy);
    }
    this.player.draw(this.ctx);
    this.drawEnemyHpBars();
    this.drawPlayerHpBar();
    this.ctx.restore();

    this.drawInteractionPrompt();
    this.drawNotice();
  }

  private drawPlayerHpBar(): void {
    const centerX = this.player.x + this.player.w / 2;
    const topY = this.player.y - 62;
    const width = 44;

    this.drawHpBar(centerX, topY, width, this.player.hp, this.maxHp);

    let iconX = centerX + width / 2 + 9;
    if (this.player.poisoned) {
      this.drawStatusMark(iconX, topY + 3, '#7d1bb1', '#f0b6ff', '毒');
      iconX += 16;
    }
    if (this.player.slowed) {
      this.drawStatusMark(iconX, topY + 3, '#285f70', '#a5efff', '遅');
      iconX += 16;
    }
    if (this.player.paralyzed) {
      this.drawStatusMark(iconX, topY + 3, '#8d6c11', '#ffe38a', '麻');
      iconX += 16;
    }
    if (this.player.sealed) {
      this.drawStatusMark(iconX, topY + 3, '#5d253f', '#ff9dc8', '封');
      iconX += 16;
    }
    if (this.player.silenced) {
      this.drawStatusMark(iconX, topY + 3, '#283858', '#9cbcff', '沈');
      iconX += 16;
    }
    if (this.player.blinded) {
      this.drawStatusMark(iconX, topY + 3, '#1d1a28', '#bbb0df', '暗');
      iconX += 16;
    }
    if (this.player.sleeping) {
      this.drawStatusMark(iconX, topY + 3, '#34325f', '#d9ddff', '眠');
      iconX += 16;
    }
    if (this.player.frozen) {
      this.drawStatusMark(iconX, topY + 3, '#17677e', '#c7f8ff', '氷');
    }
  }

  private drawStatusMark(centerX: number, centerY: number, fill: string, stroke: string, label: string): void {
    const size = 12;
    const x = Math.round(centerX - size / 2);
    const y = Math.round(centerY - size / 2);

    this.ctx.save();
    this.ctx.fillStyle = fill;
    this.ctx.fillRect(x, y, size, size);
    this.ctx.strokeStyle = stroke;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 0.5, y - 0.5, size + 1, size + 1);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 9px system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, centerX, centerY + 0.5);
    this.ctx.restore();
  }

  private drawEnemyHpBars(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      const width =
        enemy.type === 'ahriman' ? 48 :
        enemy.type === 'goblin' ? 42 :
        enemy.type === 'skeleton' ? 44 :
        enemy.type === 'skeletonArcher' ? 44 :
        enemy.type === 'roper' ? 44 :
        enemy.type === 'snake' ? 40 :
        enemy.type === 'bomb' ? 38 :
        enemy.type === 'caterpillar' ? 42 :
        enemy.type === 'frostMite' ? 42 :
        enemy.type === 'crystalEye' ? 50 :
        36;

      const y =
        enemy.type === 'goblin' ? enemy.y - 30 :
        enemy.type === 'skeleton' ? enemy.y - 34 :
        enemy.type === 'skeletonArcher' ? enemy.y - 34 :
        enemy.type === 'roper' ? enemy.y - 32 :
        enemy.type === 'ahriman' ? enemy.y - 18 :
        enemy.type === 'bat' ? enemy.y - 16 :
        enemy.type === 'snake' ? enemy.y - 22 :
        enemy.type === 'slug' ? enemy.y - 15 :
        enemy.type === 'rat' ? enemy.y - 17 :
        enemy.type === 'bomb' ? enemy.y - 20 :
        enemy.type === 'caterpillar' ? enemy.y - 26 :
        enemy.type === 'frostMite' ? enemy.y - 28 :
        enemy.type === 'crystalEye' ? enemy.y - 30 :
        enemy.y - 16;

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

  private drawInteractionPrompt(): void {
    let text = '';
    if (intersects(this.player, this.stage.staircase)) {
      text = 'E / Enter：次の階へ';
    } else {
      const chest = this.chests.find((candidate) => !candidate.opened && intersects(this.player, {
        x: candidate.x - 12,
        y: candidate.y - 10,
        w: candidate.w + 24,
        h: candidate.h + 18,
      }));
      if (chest) text = 'E / Enter：宝箱を開ける';
    }
    if (!text) return;

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(8, 12, 18, 0.88)';
    this.ctx.fillRect(498, 350, 220, 30);
    this.ctx.fillStyle = '#f0e3c2';
    this.ctx.font = '14px system-ui';
    this.ctx.fillText(text, 510, 370);
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
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
