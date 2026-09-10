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
import { Bee } from '../enemies/Bee';
import { RedBee } from '../enemies/RedBee';
import { Roper } from '../enemies/Roper';
import { Slug } from '../enemies/Slug';
import { DecaySlug } from '../enemies/DecaySlug';
import { Rat } from '../enemies/Rat';
import { Skeleton } from '../enemies/Skeleton';
import { SkeletonArcher } from '../enemies/SkeletonArcher';
import { Bomb } from '../enemies/Bomb';
import { Caterpillar } from '../enemies/Caterpillar';
import { FrostMite } from '../enemies/FrostMite';
import { CrystalEye } from '../enemies/CrystalEye';
import { TotemEye } from '../enemies/TotemEye';
import { Kagenoko } from '../enemies/Kagenoko';
import { Kyokoki } from '../enemies/Kyokoki';
import { Elemental, type ElementalKind } from '../enemies/Elemental';
import { ThreeWiseMonkey } from '../enemies/ThreeWiseMonkey';
import { Fireball } from '../combat/Fireball';
import { ThunderStrike } from '../combat/ThunderStrike';
import { LightOrb } from '../combat/LightOrb';
import { AhrimanFireball } from '../combat/AhrimanFireball';
import { FreezeLancer } from '../combat/FreezeLancer';
import { SkeletonArrow } from '../combat/SkeletonArrow';
import { Inventory } from '../items/Inventory';
import { createHealingPotion, createStarterFaultArmor, createRandomItem, createRemedy, createTreasureItem, type ItemCategory } from '../items/Item';
import { LootDrop } from '../items/LootDrop';
import { Player } from '../player/Player';
import { PlayerRenderer } from '../player/PlayerRenderer';
import { createDungeonStage } from '../stage/DungeonGenerator';
import { GameLoop } from './GameLoop';
import { DUNGEON_FLOORS, GAME_MODE_LABELS, getDungeonFloorConfig, type GameMode } from './DungeonMode';
import { Input } from './Input';
import { MenuUI } from '../ui/Menu';
import { TreasureChest, getChestRarityLabel, type ChestRarity } from '../items/TreasureChest';

export interface HudElements {
  floor: HTMLElement;
  level: HTMLElement;
  hp: HTMLElement;
  attack: HTMLElement;
  defense: HTMLElement;
  gold: HTMLElement;
}

interface DamageNumber {
  x: number;
  y: number;
  value: number;
  age: number;
  life: number;
}

const ENEMY_DISPLAY_NAMES: Record<string, string> = {
  slime: 'スライム',
  goblin: 'ゴブリン',
  ahriman: 'アーリマン',
  snake: 'ヘビ',
  bat: 'コウモリ',
  bee: 'ハチ',
  redBee: '赤ハチ',
  roper: 'ローパー',
  slug: 'ナメクジ',
  decaySlug: '腐敗ナメクジ',
  rat: 'ネズミ',
  skeleton: 'スケルトン',
  skeletonArcher: 'スケルトンアーチャー',
  bomb: 'ボム',
  caterpillar: 'イモムシ',
  frostMite: 'フロストマイト',
  crystalEye: 'クリスタルアイ',
  kagenoko: 'カゲノコ',
  kyokoki: '太鼓鬼',
  kyokokiPurple: '太鼓鬼・紫',
  elemental: 'エレメンタル',
  mizaru: '見ざる',
  iwazaru: '言わざる',
  kikazaru: '聞かざる',
  totemEye: 'トーテムアイ',
  totemEyeDecay: 'トーテムアイ（腐）',
};

const CHEST_RARITY_ORDER: ChestRarity[] = ['銅', '銀', '金', '赤神話'];

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input = new Input();
  private stage = createDungeonStage(1);
  private readonly playerRenderer = new PlayerRenderer();
  private readonly enemyRenderer = new EnemyRenderer();
  private readonly enemyBuffCanvas = document.createElement('canvas');
  private readonly player = new Player(this.playerRenderer);
  private readonly inventory = new Inventory();
  private readonly loop = new GameLoop((dt) => this.update(dt), () => this.draw());
  private readonly menu: MenuUI;
  private enemies: Enemy[] = [];
  private loot: LootDrop[] = [];
  private chests: TreasureChest[] = [];
  private fireballs: Fireball[] = [];
  private thunderStrikes: ThunderStrike[] = [];
  private lightOrbs: LightOrb[] = [];
  private ahrimanFireballs: AhrimanFireball[] = [];
  private freezeLancers: FreezeLancer[] = [];
  private skeletonArrows: SkeletonArrow[] = [];
  private readonly damageNumbers: DamageNumber[] = [];
  private readonly memorySpells: Array<'fireball' | 'thunder' | 'shining'> = [
    'fireball',
    'thunder',
    'shining',
  ];
  private fireballCooldown = 0;
  private thunderCooldown = 0;
  private lightCooldown = 0;
  private equipmentRegenTimer = 0;
  private cameraX = 0;
  private cameraY = 0;
  private gold = 0;
  private floor = 1;
  private gameMode: GameMode = 'default';
  private playerLevel = 1;
  private readonly menuRoot: HTMLElement;
  private notice = '';
  private noticeTime = 0;
  private readonly floorInfoEl: HTMLElement;
  private floorInfoSignature = '';

  constructor(
    canvas: HTMLCanvasElement,
    private readonly hud: HudElements,
    menuRoot: HTMLElement,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D Canvasを初期化できません。');
    this.ctx = context;
    this.ctx.imageSmoothingEnabled = false;
    this.menuRoot = menuRoot;

    this.floorInfoEl = document.createElement('section');
    this.floorInfoEl.className = 'floor-info';
    this.floorInfoEl.setAttribute('aria-live', 'polite');
    const shell = canvas.closest('.game-shell');
    if (shell) shell.insertAdjacentElement('afterend', this.floorInfoEl);
    else canvas.insertAdjacentElement('afterend', this.floorInfoEl);

    window.addEventListener('deep-loot-memory-change', (event) => {
      const slots = (event as CustomEvent<{ slots?: string[] }>).detail?.slots;
      if (!Array.isArray(slots)) return;
      const valid = new Set<string>(['fireball', 'thunder', 'shining']);
      for (let index = 0; index < Math.min(3, slots.length); index += 1) {
        const spell = slots[index];
        if (spell && valid.has(spell)) {
          this.memorySpells[index] = spell as 'fireball' | 'thunder' | 'shining';
        }
      }
    });

    this.menu = new MenuUI(menuRoot, {
      onWeapon: (index) => this.equipWeapon(index),
      onArmor: (index) => this.equipArmor(index),
      onConsumable: (index) => this.useConsumable(index),
      onDiscard: (category, index) => this.discardItem(category, index),
      onClose: () => this.setMenuOpen(false),
    });

    for (const button of menuRoot.querySelectorAll<HTMLElement>('[data-game-mode]')) {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const mode = button.dataset.gameMode;
        if (mode === 'default' || mode === 'dungeon' || mode === 'debug') {
          this.setGameMode(mode);
        }
      });
    }
    this.renderModeMenu();
  }

  async start(): Promise<void> {
    await Promise.all([
      this.playerRenderer.load(),
      this.enemyRenderer.load(),
      CrystalEye.loadAssets(),
      TotemEye.loadAssets(),
      Kagenoko.loadAssets(),
      Bee.loadAssets(),
      RedBee.loadAssets(),
      DecaySlug.loadAssets(),
      Kyokoki.loadAssets(),
      ThreeWiseMonkey.loadAssets(),
      TreasureChest.loadAssets(),
      Fireball.loadAssets(),
    ]);
    this.reset();
    this.loop.start();
  }

  reset(): void {
    this.floor = 1;
    this.playerLevel = 1;
    this.player.reset();
    this.inventory.clear();
    if (this.gameMode !== 'dungeon') {
      const starterArmor = createStarterFaultArmor();
      this.inventory.add(starterArmor);
      this.inventory.equipArmor(0);
    }
    this.player.clampHp(this.maxHp);
    this.player.heal(this.maxHp, this.maxHp);
    this.inventory.add(createHealingPotion());
    this.inventory.add(createHealingPotion());
    this.inventory.add(createRemedy());
    this.inventory.add(createRemedy());
    this.floor = 1;
    this.gold = 0;
    this.loot = [];
    this.fireballs = [];
    this.thunderStrikes = [];
    this.lightOrbs = [];
    this.ahrimanFireballs = [];
    this.freezeLancers = [];
    this.skeletonArrows = [];
    DecaySlug.clearTrails();
    this.damageNumbers.length = 0;
    this.fireballCooldown = 0;
    this.thunderCooldown = 0;
    this.lightCooldown = 0;
    this.stage = createDungeonStage(this.floor);
    this.player.resetPosition(this.stage.spawn.x, this.stage.spawn.y);
    this.cameraX = 0;
    this.cameraY = 0;
    this.spawnStageContents();
    this.setMenuOpen(false);
    this.showNotice('探索開始');
    this.refreshUi();
  }


  private setGameMode(mode: GameMode): void {
    if (this.gameMode === mode) {
      this.syncModeButtons();
      this.setMenuOpen(false);
      return;
    }

    this.gameMode = mode;
    this.syncModeButtons();
    this.reset();
    this.showNotice(`${GAME_MODE_LABELS[mode]}モード`);
  }

  private syncModeButtons(): void {
    for (const button of this.menuRoot.querySelectorAll<HTMLElement>('[data-game-mode]')) {
      button.classList.toggle('is-active', button.dataset.gameMode === this.gameMode);
    }
  }

  private renderModeMenu(): void {
    this.syncModeButtons();
    const preview = this.menuRoot.querySelector<HTMLElement>('#dungeon-floor-preview');
    if (!preview) return;

    preview.innerHTML = DUNGEON_FLOORS.map((config) => {
      const enemies = config.enemies.map((entry) => {
        const label = ENEMY_DISPLAY_NAMES[entry.kind] ?? entry.kind;
        return `<span class="dungeon-enemy-chip">${label}<b>×${entry.count}</b></span>`;
      }).join('');

      return `<div class="dungeon-floor-row">
        <strong>${config.floor}F</strong>
        <span class="dungeon-floor-level">敵Lv${config.enemyLevel}</span>
        <div class="dungeon-floor-enemies">${enemies}</div>
      </div>`;
    }).join('');
  }


  private syncDungeonPlayerLevel(): void {
    if (this.gameMode !== 'dungeon') {
      this.playerLevel = 1;
      return;
    }

    const config = getDungeonFloorConfig(this.floor);
    const nextLevel = config?.enemyLevel ?? 1;
    if (nextLevel === this.playerLevel) return;

    const oldMaxHp = this.maxHp;
    this.playerLevel = nextLevel;
    const newMaxHp = this.maxHp;

    if (newMaxHp > oldMaxHp) {
      // Level-up increases current HP by the amount max HP increased.
      this.player.hp = Math.min(newMaxHp, this.player.hp + (newMaxHp - oldMaxHp));
    } else {
      this.player.clampHp(newMaxHp);
    }
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
    this.updateDamageNumbers(dt);
    if (this.menu.isOpen || this.player.hp <= 0) return;

    const hpBeforeUpdate = this.player.hp;
    this.player.moveSpeedMultiplier = this.inventory.moveSpeedMultiplier;
    this.player.update(dt, this.input, this.stage);
    if (this.player.hp < hpBeforeUpdate) this.addDamageNumber(hpBeforeUpdate - this.player.hp);
    if (this.player.hp !== hpBeforeUpdate) this.refreshUi();
    this.updateEquipmentRegen(dt);

    this.fireballCooldown = Math.max(0, this.fireballCooldown - dt);
    this.thunderCooldown = Math.max(0, this.thunderCooldown - dt);
    this.lightCooldown = Math.max(0, this.lightCooldown - dt);

    if (this.input.consumePress('s')) this.castMemorySpell(this.memorySpells[0]);
    if (this.input.consumePress('d')) this.castMemorySpell(this.memorySpells[1]);
    if (this.input.consumePress('f')) this.castMemorySpell(this.memorySpells[2]);

    this.resolvePlayerAttack();
    this.updateFireballs(dt);
    this.updateThunderStrikes(dt);
    this.updateLightOrbs(dt);

    const hpBeforeEnemyPhase = this.player.hp;

    for (const enemy of this.enemies) {
      enemy.update(dt, {
        player: this.player,
        stage: this.stage,
        allies: this.enemies,
        hurtPlayer: (damage, sourceX) => {
          const boostedDamage = Math.ceil(damage * enemy.attackPowerMultiplier);
          const reduced = Math.max(1, boostedDamage - this.totalDefense - this.inventory.flatDamageReduction);
          const damaged = this.player.hurt(reduced, sourceX, this.inventory.incomingKnockbackMultiplier);
          if (damaged) this.refreshUi();
          return damaged;
        },
        poisonPlayer: (duration, tickInterval, damage) => {
          if (this.resistsStatusEffect()) return;
          const wasPoisoned = this.player.poisoned;
          this.player.applyPoison(duration, tickInterval, damage);
          if (!wasPoisoned) this.showNotice('毒状態になった');
          this.refreshUi();
        },
        severePoisonPlayer: (duration, tickInterval, damage) => {
          if (this.resistsStatusEffect()) return;
          const wasActive = this.player.severelyPoisoned;
          this.player.applySeverePoison(duration, tickInterval, damage);
          if (!wasActive) this.showNotice('猛毒状態になった');
          this.refreshUi();
        },
        decayPlayer: (duration, tickInterval, damage) => {
          if (this.resistsStatusEffect()) return;
          const wasActive = this.player.decaying;
          this.player.applyDecay(duration, tickInterval, damage);
          if (!wasActive) this.showNotice('腐敗状態になった');
          this.refreshUi();
        },
        paralyzePlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasParalyzed = this.player.paralyzed;
          this.player.applyParalysis(duration);
          if (!wasParalyzed) this.showNotice('麻痺した');
          this.refreshUi();
        },
        slowPlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasSlowed = this.player.slowed;
          this.player.applySlow(duration);
          if (!wasSlowed) this.showNotice('スロウ状態になった');
          this.refreshUi();
        },
        sealPlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasSealed = this.player.sealed;
          this.player.applySeal(duration);
          this.setMenuOpen(false);
          if (!wasSealed) this.showNotice('封印された');
          this.refreshUi();
        },
        silencePlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasSilenced = this.player.silenced;
          this.player.applySilence(duration);
          if (!wasSilenced) this.showNotice('沈黙状態になった');
          this.refreshUi();
        },
        blindPlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasBlinded = this.player.blinded;
          this.player.applyBlind(duration);
          if (!wasBlinded) this.showNotice('暗闇状態になった');
          this.refreshUi();
        },
        sleepPlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
          const wasSleeping = this.player.sleeping;
          this.player.applySleep(duration);
          this.setMenuOpen(false);
          if (!wasSleeping) this.showNotice('睡眠状態になった');
          this.refreshUi();
        },
        freezePlayer: (duration) => {
          if (this.resistsStatusEffect()) return;
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
            enemy.attackPowerMultiplier,
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
            enemy.attackPowerMultiplier,
          ));
        },
        spawnSkeletonArrow: (x, y, vx, vy, damage, poisoned) => {
          this.skeletonArrows.push(new SkeletonArrow(
            x,
            y,
            vx,
            vy,
            damage * enemy.attackPowerMultiplier,
            poisoned,
            BALANCE.skeletonArcher.arrowLife,
          ));
        },
      });
    }

    DecaySlug.updateTrails(dt, this.player, () => {
      if (this.player.decaying) return;
      if (this.resistsStatusEffect()) return;
      this.player.applyDecay(999, 1.0, 7);
      this.showNotice('腐敗床を踏んだ');
      this.refreshUi();
    });

    this.spreadNearbyEnemies();
    this.updateAhrimanFireballs(dt);
    this.updateFreezeLancers(dt);
    this.updateSkeletonArrows(dt);
    if (this.player.hp < hpBeforeEnemyPhase) {
      this.addDamageNumber(hpBeforeEnemyPhase - this.player.hp);
    }

    for (const drop of this.loot) drop.update(dt, this.stage);
    this.collectLoot();
    this.checkChestInteraction();
    this.checkStaircase();
    this.updateCamera();
  }

  private spreadNearbyEnemies(): void {
    const active = this.enemies.filter((enemy) =>
      enemy.alive &&
      enemy.grounded &&
      enemy.type !== 'roper' &&
      enemy.type !== 'crystalEye' &&
      enemy.type !== 'elemental'
    );

    const tryShift = (enemy: Enemy, delta: number): void => {
      const nextX = Math.max(0, Math.min(this.stage.width - enemy.w, enemy.x + delta));
      const footY = enemy.y + enemy.h;
      const left = nextX + 2;
      const right = nextX + enemy.w - 2;
      const supported = this.stage.platforms.some((platform) =>
        platform.y >= footY - 6 &&
        platform.y <= footY + 9 &&
        right >= platform.x &&
        left <= platform.x + platform.w
      );
      if (supported) enemy.x = nextX;
    };

    for (let i = 0; i < active.length; i += 1) {
      const a = active[i]!;
      for (let j = i + 1; j < active.length; j += 1) {
        const b = active[j]!;
        const footGap = Math.abs((a.y + a.h) - (b.y + b.h));
        if (footGap > 14) continue;

        let dx = (b.x + b.w / 2) - (a.x + a.w / 2);
        const minGap = Math.min(40, (a.w + b.w) / 2 + 14);
        const overlap = minGap - Math.abs(dx);
        if (overlap <= 0) continue;
        if (Math.abs(dx) < 0.01) dx = 1;

        const direction = dx > 0 ? 1 : -1;
        const push = Math.min(1.6, overlap * 0.16);
        tryShift(a, -direction * push);
        tryShift(b, direction * push);
      }
    }

    const playerCenter = this.player.x + this.player.w / 2;
    const playerFoot = this.player.y + this.player.h;
    const nearPlayer = active
      .filter((enemy) =>
        Math.abs((enemy.y + enemy.h) - playerFoot) <= 18 &&
        Math.abs((enemy.x + enemy.w / 2) - playerCenter) <= 96
      )
      .sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));

    if (nearPlayer.length >= 2) {
      const middle = (nearPlayer.length - 1) / 2;
      for (let index = 0; index < nearPlayer.length; index += 1) {
        const enemy = nearPlayer[index]!;
        const currentCenter = enemy.x + enemy.w / 2;
        const targetCenter = playerCenter + (index - middle) * 28;
        const correction = Math.max(-0.85, Math.min(0.85, (targetCenter - currentCenter) * 0.05));
        tryShift(enemy, correction);
      }
    }
  }
  private resolvePlayerAttack(): void {
    const hitbox = this.player.getHitbox();
    if (!hitbox) return;

    for (const enemy of this.enemies) {
      if (!enemy.alive || !intersects(hitbox, enemy)) continue;

      let meleeDamage = this.totalAttack;
      if (Math.random() < this.inventory.criticalChance) {
        meleeDamage = Math.ceil(meleeDamage * this.inventory.criticalMultiplier);
        this.showNotice('会心の一撃');
      }
      const killed = damageEnemy(
        enemy,
        meleeDamage,
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

  private updateEquipmentRegen(dt: number): void {
    const amount = this.inventory.regenAmount;
    if (amount <= 0 || this.player.hp <= 0) {
      this.equipmentRegenTimer = 0;
      return;
    }
    this.equipmentRegenTimer += dt;
    if (this.player.hp >= this.maxHp) {
      this.equipmentRegenTimer = Math.min(this.equipmentRegenTimer, 3);
      return;
    }
    if (this.equipmentRegenTimer < 3) return;
    this.equipmentRegenTimer -= 3;
    const before = this.player.hp;
    this.player.heal(amount, this.maxHp);
    if (this.player.hp > before) this.refreshUi();
  }

  private resistsStatusEffect(): boolean {
    const resistance = this.inventory.statusResistance;
    if (resistance <= 0 || Math.random() >= resistance) return false;
    this.showNotice('状態異常を防いだ');
    return true;
  }

  private castMemorySpell(spell: 'fireball' | 'thunder' | 'shining'): void {
    if (this.player.silenced) {
      this.showNotice('沈黙で呪文を唱えられない');
      return;
    }
    if (this.player.paralysisStunned || this.player.sleeping || this.player.frozen) return;

    if (spell === 'fireball' && this.fireballCooldown <= 0) {
      this.castFireball();
      return;
    }
    if (spell === 'thunder' && this.thunderCooldown <= 0) {
      this.castThunder();
      return;
    }
    if (spell === 'shining' && this.lightCooldown <= 0) {
      this.castLight();
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

  private castLight(): void {
    const px = this.player.x + this.player.w / 2;
    const py = this.player.y + this.player.h * 0.43;
    const count = 5 + Math.floor(Math.random() * 4);
    const viewLeft = this.cameraX;
    const viewTop = this.cameraY;
    const viewRight = viewLeft + this.ctx.canvas.width;
    const viewBottom = viewTop + this.ctx.canvas.height;

    const visibleTargets = this.enemies
      .filter((enemy) =>
        enemy.alive &&
        enemy.x + enemy.w > viewLeft &&
        enemy.x < viewRight &&
        enemy.y + enemy.h > viewTop &&
        enemy.y < viewBottom
      )
      .sort((a, b) => {
        const adx = a.x + a.w / 2 - px;
        const ady = a.y + a.h / 2 - py;
        const bdx = b.x + b.w / 2 - px;
        const bdy = b.y + b.h / 2 - py;
        return adx * adx + ady * ady - (bdx * bdx + bdy * bdy);
      });

    // One visible enemy is selected for the whole volley.
    const volleyTarget = visibleTargets[0] ?? null;
    const scatterOffset = Math.random() * Math.PI * 2;

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
      const radius = 14 + (index % 2) * 5;
      const x = px + Math.cos(angle) * radius - 6;
      const y = py + Math.sin(angle) * radius * 0.72 - 6;
      const freeAngle = scatterOffset + (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.36;

      this.lightOrbs.push(new LightOrb(
        x,
        y,
        this.player.facing,
        volleyTarget,
        angle,
        0.78 + index * 0.075,
        freeAngle,
      ));
    }

    this.lightCooldown = 1.12;
    this.showNotice('シャイニング');
  }




  private updateLightOrbs(dt: number): void {
    const anchorX = this.player.x + this.player.w / 2;
    const anchorY = this.player.y + this.player.h * 0.43;

    for (const orb of this.lightOrbs) {
      orb.update(dt, this.enemies, anchorX, anchorY);
      if (!orb.alive) continue;

      for (const enemy of this.enemies) {
        if (!enemy.alive || !intersects(orb.rect, enemy)) continue;

        const killed = damageEnemy(
          enemy,
          15,
          orb.x + orb.w / 2,
          0.95,
        );
        orb.alive = false;

        if (killed) this.handleEnemyKilled(enemy);
        this.refreshUi();
        break;
      }
    }

    this.lightOrbs = this.lightOrbs.filter((orb) =>
      orb.alive &&
      orb.x > -180 &&
      orb.x < this.stage.width + 180 &&
      orb.y > -160 &&
      orb.y < this.stage.height + 180
    );
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
        const hit = this.player.hurt(shot.damage, shot.x, this.inventory.incomingKnockbackMultiplier);
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
        const hit = this.player.hurt(lance.damage, lance.x, this.inventory.incomingKnockbackMultiplier);
        if (hit && !this.resistsStatusEffect()) {
          const wasFrozen = this.player.frozen;
          this.player.applyFrozen(BALANCE.ahriman.freezeDuration);
          this.setMenuOpen(false);
          if (!wasFrozen) this.showNotice('フリーズランサーで氷結した');
          this.refreshUi();
        }
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
        const hit = this.player.hurtProjectile(arrow.damage, arrow.x, this.inventory.incomingKnockbackMultiplier);

        if (arrow.poisoned && !this.resistsStatusEffect()) {
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
    this.gold += 5 + (this.gameMode === 'dungeon' ? 0 : this.inventory.goldFindBonus);

    if (this.gameMode === 'dungeon') {
      // Dungeon mode has no weapons or armor. Enemy kills only award gold.
      return;
    }

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
    if (this.gameMode === 'dungeon' && this.floor >= DUNGEON_FLOORS.length) {
      this.showNotice('ダンジョン15Fクリア');
      return;
    }
    this.floor += 1;
    this.syncDungeonPlayerLevel();
    this.loot = [];
    this.fireballs = [];
    this.thunderStrikes = [];
    this.lightOrbs = [];
    this.ahrimanFireballs = [];
    this.freezeLancers = [];
    this.skeletonArrows = [];
    DecaySlug.clearTrails();
    this.damageNumbers.length = 0;
    this.fireballCooldown = 0;
    this.thunderCooldown = 0;
    this.lightCooldown = 0;
    this.stage = createDungeonStage(this.floor);
    this.player.resetPosition(this.stage.spawn.x, this.stage.spawn.y);
    this.cameraX = 0;
    this.cameraY = 0;
    this.spawnStageContents();
    this.showNotice(`地下 ${this.floor} 階へ`);
    this.refreshUi();
  }

  private spawnStageContents(): void {
    const groundPlatforms = this.stage.platforms.filter((platform) =>
      platform.w >= 110 &&
      platform.y > 150 &&
      platform.y < this.stage.height - 24
    );
    const upperPlatforms = this.stage.platforms.filter((platform) =>
      platform.w >= 100 &&
      platform.y > 105 &&
      platform.y < this.stage.height - 110
    );

    if (this.gameMode === 'debug') {
      this.enemies = [];
      this.chests = [];
      return;
    }

    const occupied: Array<{ x: number; y: number }> = [];

    const randomGroundPoint = (height: number, width = 42): { x: number; y: number } => {
      if (!groundPlatforms.length) {
        return {
          x: 180 + Math.random() * Math.max(120, this.stage.width - 360),
          y: this.stage.height - 120 - height,
        };
      }

      let best = {
        x: groundPlatforms[0].x + 24,
        y: groundPlatforms[0].y - height,
      };
      let bestSpacing = -1;

      for (let attempt = 0; attempt < 32; attempt += 1) {
        const platform = groundPlatforms[Math.floor(Math.random() * groundPlatforms.length)];
        const margin = Math.min(54, Math.max(16, platform.w * 0.12));
        const usable = Math.max(1, platform.w - margin * 2 - width);
        const x = platform.x + margin + Math.random() * usable;
        const y = platform.y - height;
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const spawnDistance = Math.hypot(
          centerX - (this.stage.spawn.x + 18),
          centerY - (this.stage.spawn.y + 20),
        );
        const stairDistance = Math.hypot(
          centerX - (this.stage.staircase.x + this.stage.staircase.w / 2),
          centerY - (this.stage.staircase.y + this.stage.staircase.h / 2),
        );

        let nearest = Math.min(spawnDistance, stairDistance);
        for (const point of occupied) {
          nearest = Math.min(nearest, Math.hypot(centerX - point.x, centerY - point.y));
        }

        if (nearest > bestSpacing) {
          bestSpacing = nearest;
          best = { x, y };
        }
        if (nearest >= 66) break;
      }

      occupied.push({
        x: best.x + width / 2,
        y: best.y + height / 2,
      });
      return best;
    };

    const randomAirPoint = (
      width: number,
      height: number,
      minY = 120,
      maxY = Math.max(180, this.stage.height - 180),
    ): { x: number; y: number } => {
      const minX = Math.max(110, this.stage.spawn.x + 90);
      const maxX = Math.max(minX + 80, this.stage.width - width - 90);

      let best = { x: minX, y: minY };
      let bestSpacing = -1;

      for (let attempt = 0; attempt < 30; attempt += 1) {
        const x = minX + Math.random() * Math.max(1, maxX - minX);
        const y = minY + Math.random() * Math.max(1, maxY - minY);
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const spawnDistance = Math.hypot(
          centerX - (this.stage.spawn.x + 18),
          centerY - (this.stage.spawn.y + 20),
        );

        let nearest = spawnDistance;
        for (const point of occupied) {
          nearest = Math.min(nearest, Math.hypot(centerX - point.x, centerY - point.y));
        }

        if (nearest > bestSpacing) {
          bestSpacing = nearest;
          best = { x, y };
        }
        if (nearest >= 90) break;
      }

      occupied.push({
        x: best.x + width / 2,
        y: best.y + height / 2,
      });
      return best;
    };

    const randomClingPoint = (): { x: number; y: number } => {
      const candidates = upperPlatforms.length ? upperPlatforms : groundPlatforms;
      if (!candidates.length) return randomAirPoint(34, 25, 160, 300);

      const platform = candidates[Math.floor(Math.random() * candidates.length)];
      const margin = Math.min(42, Math.max(12, platform.w * 0.14));
      const usable = Math.max(1, platform.w - margin * 2 - 34);
      const point = {
        x: platform.x + margin + Math.random() * usable,
        y: platform.y + platform.h,
      };
      occupied.push({
        x: point.x + 17,
        y: point.y + 12,
      });
      return point;
    };

    type EnemyKind =
      | 'slime'
      | 'clingSlime'
      | 'goblin'
      | 'ahriman'
      | 'snake'
      | 'bat'
      | 'bee'
      | 'redBee'
      | 'roper'
      | 'slug'
      | 'decaySlug'
      | 'rat'
      | 'skeleton'
      | 'skeletonArcher'
      | 'bomb'
      | 'caterpillar'
      | 'frostMite'
      | 'kagenoko'
      | 'kyokoki'
      | 'kyokokiPurple'
      | 'crystalEye'
      | 'mizaru'
      | 'iwazaru'
      | 'kikazaru'
      | 'elemental'
      | 'totemEye'
      | 'totemEyeDecay';

    const baseWeights: Record<EnemyKind, number> = {
      slime: 3,
      clingSlime: 1,
      goblin: 3,
      ahriman: 1,
      snake: 2,
      bat: 2,
      bee: 2,
      redBee: 2,
      roper: 1,
      slug: 1,
      decaySlug: 1,
      rat: 1,
      skeleton: 2,
      skeletonArcher: 1,
      bomb: 1,
      caterpillar: 2,
      frostMite: 1,
      kagenoko: 1,
      kyokoki: 1,
      kyokokiPurple: 1,
      crystalEye: 1,
      totemEye: 1,
      totemEyeDecay: 1,
      elemental: 2,
      mizaru: 1,
      iwazaru: 1,
      kikazaru: 1,
    };

    const allKinds = Object.keys(baseWeights) as EnemyKind[];
    const floorWeights = {} as Record<EnemyKind, number>;

    for (const kind of allKinds) {
      const roll = Math.random();
      const multiplier =
        roll < 0.12 ? 0 :
        roll < 0.34 ? 0.5 :
        roll < 0.70 ? 1 :
        roll < 0.90 ? 1.75 :
        2.75;
      floorWeights[kind] = Math.max(0, Math.round(baseWeights[kind] * multiplier));
    }

    // Each floor gets 2-3 featured species. This intentionally allows
    // floors such as bomb-heavy, rat-heavy, skeleton-heavy, or no-bomb floors.
    const featuredCount = 2 + Math.floor(Math.random() * 2);
    for (const kind of shuffle(allKinds).slice(0, featuredCount)) {
      floorWeights[kind] += 2 + Math.floor(Math.random() * 4);
    }

    // All monster species are eligible from floor 1. No unlock-by-floor gating.
    const weightedKinds: EnemyKind[] = [];
    for (const kind of allKinds) {
      for (let count = 0; count < floorWeights[kind]; count += 1) {
        weightedKinds.push(kind);
      }
    }
    if (weightedKinds.length === 0) weightedKinds.push('slime', 'goblin');

    const caps: Partial<Record<EnemyKind, number>> = {
      crystalEye: 2,
      totemEye: 3,
      totemEyeDecay: 2,
      ahriman: 3,
      bee: 4,
      redBee: 3,
      decaySlug: 3,
      roper: 3,
      frostMite: 3,
      kagenoko: 3,
      kyokoki: 2,
      skeletonArcher: 3,
      elemental: 4,
      mizaru: 3,
      iwazaru: 3,
      kikazaru: 3,
      clingSlime: 3,
    };

    const spawnedByKind: Partial<Record<EnemyKind, number>> = {};

    const pickKind = (): EnemyKind => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const kind = weightedKinds[Math.floor(Math.random() * weightedKinds.length)];
        const cap = caps[kind];
        const used = spawnedByKind[kind] ?? 0;
        if (cap === undefined || used < cap) return kind;
      }
      return Math.random() < 0.5 ? 'slime' : 'goblin';
    };

    const spawnEnemy = (kind: EnemyKind): Enemy => {
      spawnedByKind[kind] = (spawnedByKind[kind] ?? 0) + 1;

      switch (kind) {
        case 'slime': {
          const p = randomGroundPoint(25, 34);
          return new Slime(p.x, p.y, 'crawl');
        }
        case 'clingSlime': {
          const p = randomClingPoint();
          return new Slime(p.x, p.y, 'cling');
        }
        case 'goblin': {
          const p = randomGroundPoint(38, 32);
          return new Goblin(
            p.x,
            p.y,
            Math.random() < 0.5 ? -1 : 1,
            0.55 + Math.random() * 0.7,
          );
        }
        case 'ahriman': {
          const p = randomAirPoint(42, 34, 150, Math.max(190, this.stage.height - 220));
          return new Ahriman(p.x, p.y);
        }
        case 'snake': {
          const p = randomGroundPoint(18, 42);
          return new Snake(p.x, p.y);
        }
        case 'bat': {
          const p = randomAirPoint(34, 25, 135, Math.max(180, this.stage.height - 170));
          return new Bat(p.x, p.y);
        }
        case 'bee': {
          const p = randomAirPoint(28, 24, 120, Math.max(180, this.stage.height - 190));
          return new Bee(p.x, p.y);
        }
        case 'redBee': {
          const p = randomAirPoint(28, 24, 120, Math.max(180, this.stage.height - 190));
          return new RedBee(p.x, p.y);
        }
        case 'roper': {
          const p = randomGroundPoint(58, 42);
          return new Roper(p.x, p.y);
        }
        case 'slug': {
          const p = randomGroundPoint(11, 40);
          return new Slug(p.x, p.y);
        }
        case 'decaySlug': {
          const p = randomGroundPoint(13, 44);
          return new DecaySlug(p.x, p.y);
        }
        case 'rat': {
          const p = randomGroundPoint(14, 28);
          return new Rat(p.x, p.y);
        }
        case 'skeleton': {
          const p = randomGroundPoint(42, 34);
          return new Skeleton(p.x, p.y);
        }
        case 'skeletonArcher': {
          const p = randomGroundPoint(42, 34);
          return new SkeletonArcher(p.x, p.y);
        }
        case 'bomb': {
          const p = randomGroundPoint(26, 30);
          return new Bomb(p.x, p.y);
        }
        case 'caterpillar': {
          const p = randomGroundPoint(20, 42);
          return new Caterpillar(p.x, p.y);
        }
        case 'frostMite': {
          const p = randomGroundPoint(24, 38);
          return new FrostMite(p.x, p.y);
        }
        case 'kagenoko': {
          const p = randomGroundPoint(28, 34);
          return new Kagenoko(p.x, p.y);
        }
        case 'kyokoki': {
          const p = randomGroundPoint(30, 34);
          return new Kyokoki(p.x, p.y);
        }
        case 'kyokokiPurple': {
          const p = randomGroundPoint(30, 34);
          return new Kyokoki(p.x, p.y, 'purple');
        }
        case 'elemental': {
          const p = randomAirPoint(30, 38, 120, Math.max(180, this.stage.height - 210));
          const elementalKinds: ElementalKind[] = ['fire', 'ice', 'thunder', 'wind', 'light', 'dark'];
          const element = elementalKinds[Math.floor(Math.random() * elementalKinds.length)]!;
          return new Elemental(p.x, p.y, element);
        }
        case 'mizaru': {
          const p = randomGroundPoint(34, 30);
          return new ThreeWiseMonkey(p.x, p.y, 'mizaru');
        }
        case 'iwazaru': {
          const p = randomGroundPoint(34, 30);
          return new ThreeWiseMonkey(p.x, p.y, 'iwazaru');
        }
        case 'kikazaru': {
          const p = randomGroundPoint(34, 30);
          return new ThreeWiseMonkey(p.x, p.y, 'kikazaru');
        }
        case 'crystalEye': {
          const p = randomAirPoint(76, 108, 125, Math.max(180, this.stage.height - 260));
          return new CrystalEye(p.x, p.y);
        }
        case 'totemEye': {
          if (Math.random() < 0.45) {
            const p = randomClingPoint();
            // 44px visual stem hangs below the ceiling. Collision starts at the eye body only.
            return new TotemEye(p.x - 2, p.y + 44, 'ceiling', 'normal');
          }
          // 36px eye body + 44px visual stem = 80px from platform to eye top.
          const p = randomGroundPoint(80, 40);
          return new TotemEye(p.x + 1, p.y, 'ground', 'normal');
        }
        case 'totemEyeDecay': {
          if (Math.random() < 0.5) {
            const p = randomClingPoint();
            return new TotemEye(p.x - 2, p.y + 44, 'ceiling', 'decay');
          }
          const p = randomGroundPoint(80, 40);
          return new TotemEye(p.x + 1, p.y, 'ground', 'decay');
        }
      }
    };

    const spawnEnemyGroup = (kind: EnemyKind): Enemy[] => {
      if (kind !== 'rat') return [spawnEnemy(kind)];

      const base = randomGroundPoint(14, 28);
      const count = 3 + Math.floor(Math.random() * 3);
      const swarm: Enemy[] = [];
      for (let index = 0; index < count; index += 1) {
        const offset = (index - (count - 1) / 2) * (10 + Math.random() * 6);
        swarm.push(new Rat(
          Math.max(0, Math.min(this.stage.width - 28, base.x + offset)),
          base.y - Math.random() * 2,
        ));
      }
      return swarm;
    };

    // The old implementation always spawned exactly 22 enemies.
    // Now the TOTAL enemy count and the count of each species both change every floor.
    const floorBonus = Math.min(4, Math.floor((this.floor - 1) / 3));
    const minEnemies = 12 + floorBonus;
    const maxEnemies = 22 + floorBonus;
    const enemyCount = Math.ceil((minEnemies + Math.floor(Math.random() * (maxEnemies - minEnemies + 1))) * 2.25);

    const generatedEnemies: Enemy[] = [];

    if (this.gameMode === 'dungeon') {
      const dungeonConfig = getDungeonFloorConfig(this.floor);
      if (!dungeonConfig) {
        throw new Error(`Dungeon floor config missing: ${this.floor}F`);
      }

      for (const entry of dungeonConfig.enemies) {
        for (let count = 0; count < entry.count; count += 1) {
          const enemy = spawnEnemy(entry.kind as EnemyKind);
          enemy.setLevel(entry.level);
          generatedEnemies.push(enemy);
        }
      }
    } else {
      // Default mode keeps the existing random-spawn behaviour.
      generatedEnemies.push(spawnEnemy('redBee'));
      generatedEnemies.push(spawnEnemy('decaySlug'));
      for (let index = 0; index < enemyCount; index += 1) {
        const kind = pickKind();
        generatedEnemies.push(...spawnEnemyGroup(kind));
      }
    }

    if (this.gameMode === 'dungeon' && generatedEnemies.length === 0) {
      throw new Error(`Dungeon spawn produced zero enemies on ${this.floor}F`);
    }

    this.enemies = shuffle(generatedEnemies);

    const chestCandidates = shuffle(
      groundPlatforms.filter((platform) =>
        Math.abs(platform.x - this.stage.spawn.x) > 150 &&
        Math.abs(platform.x - this.stage.staircase.x) > 90
      )
    ).slice(0, Math.min(3, groundPlatforms.length));

    this.chests = chestCandidates.map((platform) => {
      const margin = Math.min(44, Math.max(16, platform.w * 0.12));
      const usable = Math.max(1, platform.w - margin * 2 - 28);
      return new TreasureChest(
        platform.x + margin + Math.random() * usable,
        platform.y - 28,
        rollTreasureChestRarity(this.floor),
      );
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

    if (this.gameMode === 'dungeon') {
      // Dungeon mode chest: gold only. No weapon/armor can enter the run.
      this.showNotice(`${getChestRarityLabel(chest.rarity)}宝箱: ${goldReward}G`);
      this.refreshUi();
      return;
    }

    const item = createTreasureItem(this.floor + 1, chest.rarity);
    if (this.inventory.add(item)) {
      this.showNotice(`${getChestRarityLabel(chest.rarity)}宝箱: ${item.name} / ${goldReward}G`);
    } else {
      this.loot.push(new LootDrop(chest.x + 8, chest.y - 5, item));
      this.showNotice(`${getChestRarityLabel(chest.rarity)}宝箱: ${goldReward}G（アイテムは床へ）`);
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

  private discardItem(category: ItemCategory, index: number): void {
    const item = this.inventory.getSlots(category)[index];
    if (!item) return;

    if (category === 'weapon' && item.id === this.inventory.equippedWeaponId) {
      this.showNotice('装備中の武器は捨てられない');
      return;
    }
    if (category === 'armor' && item.id === this.inventory.equippedArmorId) {
      this.showNotice('装備中の防具は捨てられない');
      return;
    }

    const discarded = this.inventory.discard(category, index);
    if (!discarded) return;
    this.showNotice(`${discarded.name}を捨てた`);
    this.refreshUi();
  }

  private equipWeapon(index: number): void {
    if (this.gameMode === 'dungeon') {
      this.showNotice('ダンジョンでは武器を装備しない');
      return;
    }
    this.inventory.equipWeapon(index);
    this.showNotice(`武器: ${this.inventory.equippedWeapon?.name ?? 'なし'}`);
    this.refreshUi();
  }

  private equipArmor(index: number): void {
    if (this.gameMode === 'dungeon') {
      this.showNotice('ダンジョンでは防具を装備しない');
      return;
    }
    this.inventory.equipArmor(index);
    this.player.clampHp(this.maxHp);
    this.showNotice(`防具: ${this.inventory.equippedArmor?.name ?? 'なし'}`);
    this.refreshUi();
  }

  private useConsumable(index: number): void {
    const item = this.inventory.getConsumable(index);
    if (!item) return;

    if (item.effect === 'antidote') {
      if (!this.player.toxinAffected) {
        this.showNotice(String.fromCodePoint(0x6bd2, 0x72b6, 0x614b, 0x3067, 0x306f, 0x306a, 0x3044));
        return;
      }
      this.inventory.takeConsumable(index);
      this.player.clearPoison();
      this.showNotice(item.name + ': ' + String.fromCodePoint(0x6bd2, 0x3092, 0x89e3, 0x9664));
      this.refreshUi();
      return;
    }
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

  private drawEnemySprite(ctx: CanvasRenderingContext2D, enemy: Enemy): void {
    if (enemy.type === 'bee') (enemy as Bee).draw(ctx);
    else if (enemy.type === 'redBee') (enemy as RedBee).draw(ctx);
    else if (enemy.type === 'decaySlug') (enemy as DecaySlug).draw(ctx);
    else if (enemy.type === 'crystalEye') (enemy as CrystalEye).draw(ctx);
    else if (enemy.type === 'kagenoko') (enemy as Kagenoko).draw(ctx);
    else if (enemy.type === 'kyokoki' || enemy.type === 'kyokokiPurple') (enemy as Kyokoki).draw(ctx);
    else if (enemy.type === 'elemental') (enemy as Elemental).draw(ctx);
    else if (enemy.type === 'mizaru' || enemy.type === 'iwazaru' || enemy.type === 'kikazaru') {
      (enemy as ThreeWiseMonkey).draw(ctx);
    } else if (enemy.type === 'frostMite') {
      (enemy as FrostMite).draw(ctx);
    } else {
      this.enemyRenderer.draw(ctx, enemy);
    }
  }

  private drawEnemyBuffAura(enemy: Enemy): void {
    if (!enemy.hasteActive && !enemy.berserkActive && !enemy.regenerationActive) return;

    const ctx = this.ctx;
    const now = performance.now() / 1000;
    const cx = enemy.x + enemy.w / 2;

    if (enemy.hasteActive) {
      const pad = 80;
      const width = Math.max(1, Math.ceil(enemy.w + pad * 2));
      const height = Math.max(1, Math.ceil(enemy.h + pad * 2));
      const buffer = this.enemyBuffCanvas;

      if (buffer.width !== width) buffer.width = width;
      if (buffer.height !== height) buffer.height = height;

      const bufferCtx = buffer.getContext('2d');
      if (bufferCtx) {
        bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
        bufferCtx.globalAlpha = 1;
        bufferCtx.globalCompositeOperation = 'source-over';
        bufferCtx.filter = 'none';
        bufferCtx.imageSmoothingEnabled = false;
        bufferCtx.clearRect(0, 0, width, height);
        bufferCtx.save();
        bufferCtx.translate(-enemy.x + pad, -enemy.y + pad);
        this.drawEnemySprite(bufferCtx, enemy);
        bufferCtx.restore();

        const hasteColors = ['#ffe13b', '#ff9824', '#ff3f2d', '#ffe13b'];
        const color = hasteColors[Math.floor(now * 13) % hasteColors.length] ?? hasteColors[0];
        const pulse = (Math.sin(now * 20) + 1) / 2;
        const glow = (2.5 + pulse * 2.4).toFixed(1);

        ctx.save();
        ctx.globalAlpha = 0.78 + pulse * 0.14;
        ctx.filter =
          'drop-shadow(0 0 1px ' + color + ') ' +
          'drop-shadow(0 0 ' + glow + 'px ' + color + ')';
        ctx.drawImage(buffer, enemy.x - pad, enemy.y - pad);
        ctx.restore();
      }
    }

    if (enemy.regenerationActive) {
      const phase = (now * 19) % 24;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#62ff7d';
      ctx.globalAlpha = 0.84;
      for (let i = 0; i < 2; i += 1) {
        const rise = (phase + i * 12) % 24;
        const px = Math.round(cx - 8 + i * 15 + Math.sin(now * 5 + i) * 2);
        const py = Math.round(enemy.y + 8 - rise);
        ctx.fillRect(px - 1, py - 4, 3, 9);
        ctx.fillRect(px - 4, py - 1, 9, 3);
      }
      ctx.restore();
    }

    if (enemy.berserkActive) {
      const jx = Math.sin(now * 22) * 1.2;
      const jy = Math.cos(now * 18) * 0.8;
      const px = Math.round(enemy.x + enemy.w + 3 + jx);
      const py = Math.round(enemy.y - 8 + jy);

      const drawAnger = (strokeStyle: string, lineWidth: number): void => {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(px - 11, py);
        ctx.lineTo(px - 5, py - 6);
        ctx.lineTo(px - 6, py - 13);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, py - 12);
        ctx.lineTo(px + 2, py - 4);
        ctx.lineTo(px + 9, py - 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px + 9, py + 5);
        ctx.lineTo(px + 2, py + 6);
        ctx.lineTo(px - 1, py + 13);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px - 12, py + 9);
        ctx.lineTo(px - 7, py + 3);
        ctx.lineTo(px - 11, py - 2);
        ctx.stroke();
      };

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.98;
      drawAnger('rgba(45, 0, 0, 0.95)', 6);
      drawAnger('#ff1712', 4);
      ctx.restore();
    }
  }
  private draw(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.filter = 'none';
    this.ctx.shadowBlur = 0;
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
    DecaySlug.drawTrails(this.ctx);

    for (const chest of this.chests) chest.draw(this.ctx);
    for (const drop of this.loot) drop.draw(this.ctx);
    for (const strike of this.thunderStrikes) strike.draw(this.ctx);
    for (const orb of this.lightOrbs) orb.draw(this.ctx);
    for (const fireball of this.fireballs) fireball.draw(this.ctx);
    for (const shot of this.ahrimanFireballs) shot.draw(this.ctx);
    for (const lance of this.freezeLancers) lance.draw(this.ctx);
    for (const arrow of this.skeletonArrows) arrow.draw(this.ctx);
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.drawEnemySprite(this.ctx, enemy);
      this.drawEnemyBuffAura(enemy);
    }
    this.player.draw(this.ctx);
    this.drawDamageNumbers();
    this.drawEnemyHpBars();
    this.drawPlayerHpBar();
    this.ctx.restore();

    this.drawInteractionPrompt();
    this.drawNotice();
    this.refreshFloorInfo();
  }

  private updateDamageNumbers(dt: number): void {
    for (const number of this.damageNumbers) number.age += dt;
    for (let index = this.damageNumbers.length - 1; index >= 0; index -= 1) {
      if (this.damageNumbers[index]!.age >= this.damageNumbers[index]!.life) {
        this.damageNumbers.splice(index, 1);
      }
    }
  }

  private addDamageNumber(value: number): void {
    const amount = Math.max(1, Math.round(value));
    this.damageNumbers.push({
      x: this.player.x + this.player.w / 2 + (Math.random() - 0.5) * 10,
      y: this.player.y - 8,
      value: amount,
      age: 0,
      life: 0.72,
    });
  }

  private drawDamageNumbers(): void {
    for (const number of this.damageNumbers) {
      const progress = Math.min(1, number.age / number.life);
      this.ctx.save();
      this.ctx.globalAlpha = 1 - progress;
      this.ctx.fillStyle = '#ff3838';
      this.ctx.font = 'bold 10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      this.ctx.shadowBlur = 2;
      this.ctx.fillText('-' + number.value, number.x, number.y - progress * 24);
      this.ctx.restore();
    }
  }

  private drawPlayerHpBar(): void {
    const centerX = this.player.x + this.player.w / 2;
    const topY = this.player.y - 62;
    const width = 44;

    this.drawHpBar(centerX, topY, width, this.player.hp, this.maxHp);

    let iconX = centerX + width / 2 + 9;
    if (this.player.poisoned) {
      this.drawStatusMark(iconX, topY + 3, '#1d6f2b', '#baff84', '毒');
      iconX += 16;
    }
    if (this.player.severelyPoisoned) {
      this.drawStatusMark(iconX, topY + 3, '#6f2aa8', '#efc6ff', '猛');
      iconX += 16;
    }
    if (this.player.decaying) {
      this.drawStatusMark(iconX, topY + 3, '#8a3b28', '#ffc0a8', '腐');
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
        enemy.type === 'bee' ? 40 :
        enemy.type === 'redBee' ? 40 :
        enemy.type === 'goblin' ? 42 :
        enemy.type === 'skeleton' ? 44 :
        enemy.type === 'skeletonArcher' ? 44 :
        enemy.type === 'roper' ? 44 :
        enemy.type === 'snake' ? 40 :
        enemy.type === 'bomb' ? 38 :
        enemy.type === 'caterpillar' ? 42 :
        enemy.type === 'frostMite' ? 42 :
        enemy.type === 'crystalEye' ? 58 :
        enemy.type === 'totemEye' ? 42 :
        enemy.type === 'totemEyeDecay' ? 42 :
        enemy.type === 'elemental' ? 42 :
        enemy.type === 'kagenoko' ? 38 :
        enemy.type === 'kyokoki' ? 48 :
        enemy.type === 'mizaru' || enemy.type === 'iwazaru' || enemy.type === 'kikazaru' ? 40 :
        36;

      const y =
        enemy.type === 'goblin' ? enemy.y - 30 :
        enemy.type === 'skeleton' ? enemy.y - 34 :
        enemy.type === 'skeletonArcher' ? enemy.y - 34 :
        enemy.type === 'roper' ? enemy.y - 32 :
        enemy.type === 'ahriman' ? enemy.y - 18 :
        enemy.type === 'bat' ? enemy.y - 16 :
        enemy.type === 'bee' ? enemy.y - 28 :
        enemy.type === 'redBee' ? enemy.y - 28 :
        enemy.type === 'snake' ? enemy.y - 22 :
        enemy.type === 'slug' ? enemy.y - 15 :
        enemy.type === 'rat' ? enemy.y - 17 :
        enemy.type === 'bomb' ? enemy.y - 20 :
        enemy.type === 'caterpillar' ? enemy.y - 26 :
        enemy.type === 'frostMite' ? enemy.y - 28 :
        enemy.type === 'crystalEye' ? enemy.y - 46 :
        enemy.type === 'totemEye' ? enemy.y - 15 :
        enemy.type === 'totemEyeDecay' ? enemy.y - 15 :
        enemy.type === 'elemental' ? enemy.y - 24 :
        enemy.type === 'kagenoko' ? enemy.y - 22 :
        // Kyokoki draws a 72px sprite over a 30px hitbox. Put the bar above
        // the rendered head rather than above the much smaller physics box.
        enemy.type === 'kyokoki' || enemy.type === 'kyokokiPurple' ? enemy.y - 48 :
        enemy.type === 'mizaru' || enemy.type === 'iwazaru' || enemy.type === 'kikazaru' ? enemy.y - 34 :
        enemy.y - 16;

      this.drawHpBar(
        enemy.x + enemy.w / 2,
        y,
        width,
        enemy.hp,
        enemy.maxHp,
      );

      if (this.gameMode === 'dungeon') {
        this.ctx.save();
        this.ctx.font = 'bold 8px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = '#fff6d8';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = 2;
        this.ctx.fillText(`Lv${enemy.level}`, enemy.x + enemy.w / 2, y - 2);
        this.ctx.restore();
      }
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
    this.ctx.font = '11px system-ui';
    const width = Math.min(164, Math.max(72, this.ctx.measureText(this.notice).width + 14));
    const height = 20;
    const x = 640 - width - 10;
    const y = 8;
    this.ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
    this.ctx.fillRect(x, y, width, height);
    this.ctx.strokeStyle = 'rgba(196, 207, 229, 0.28)';
    this.ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.notice, x + width / 2, y + height / 2 + 0.5);
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

  private refreshFloorInfo(): void {
    const enemyCounts = new Map<string, { type: string; level: number; count: number }>();
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const level = this.gameMode === 'dungeon' ? enemy.level : 1;
      const key = `${enemy.type}:${level}`;
      const current = enemyCounts.get(key);
      if (current) current.count += 1;
      else enemyCounts.set(key, { type: enemy.type, level, count: 1 });
    }

    const enemyParts = [...enemyCounts.values()]
      .sort((a, b) => {
        const labelA = ENEMY_DISPLAY_NAMES[a.type] ?? a.type;
        const labelB = ENEMY_DISPLAY_NAMES[b.type] ?? b.type;
        return labelA.localeCompare(labelB, 'ja') || a.level - b.level;
      })
      .map(({ type, level, count }) => {
        const label = ENEMY_DISPLAY_NAMES[type] ?? type;
        const levelText = this.gameMode === 'dungeon'
          ? `<small>Lv${level}</small>`
          : '';
        return `<span class="floor-info-chip enemy-chip">${label}${levelText}<b>×${count}</b></span>`;
      });

    const chestCounts = new Map<ChestRarity, number>();
    for (const chest of this.chests) {
      if (chest.opened) continue;
      chestCounts.set(chest.rarity, (chestCounts.get(chest.rarity) ?? 0) + 1);
    }

    const chestParts = CHEST_RARITY_ORDER
      .filter((rarity) => (chestCounts.get(rarity) ?? 0) > 0)
      .map((rarity) => {
        const count = chestCounts.get(rarity) ?? 0;
        const className =
          rarity === '銅' ? 'common' :
          rarity === '銀' ? 'uncommon' :
          rarity === '金' ? 'rare' :
          'mythic';
        return `<span class="floor-info-chip chest-chip ${className}">${getChestRarityLabel(rarity)}<b>×${count}</b></span>`;
      });

    const dungeonConfig = this.gameMode === 'dungeon'
      ? getDungeonFloorConfig(this.floor)
      : null;
    const modeDetail = dungeonConfig
      ? ` / 主人公Lv${this.playerLevel} / 敵Lv${dungeonConfig.enemyLevel}`
      : '';

    const signature =
      `${this.gameMode}|${this.floor}|${enemyParts.join('')}|${chestParts.join('')}`;
    if (signature === this.floorInfoSignature) return;
    this.floorInfoSignature = signature;

    this.floorInfoEl.innerHTML =
      `<div class="floor-info-mode"><strong>${GAME_MODE_LABELS[this.gameMode]}</strong><span>${this.floor}F${modeDetail}</span></div>` +
      `<div class="floor-info-row"><strong>現在の敵</strong><div class="floor-info-list">${enemyParts.join('') || '<span class="floor-info-empty">なし</span>'}</div></div>` +
      `<div class="floor-info-row"><strong>宝箱</strong><div class="floor-info-list">${chestParts.join('') || '<span class="floor-info-empty">なし</span>'}</div></div>`;
  }

  private refreshUi(): void {
    this.hud.floor.textContent = String(this.floor);
    this.hud.level.textContent = this.gameMode === 'dungeon' ? String(this.playerLevel) : '-';
    this.hud.hp.textContent = `${this.player.hp}/${this.maxHp}`;
    this.hud.attack.textContent = String(this.totalAttack);
    this.hud.defense.textContent = String(this.totalDefense);
    this.hud.gold.textContent = String(this.gold);
    this.menu.render({
      floor: this.floor,
      level: this.gameMode === 'dungeon' ? this.playerLevel : null,
      hp: this.player.hp,
      maxHp: this.maxHp,
      attack: this.totalAttack,
      defense: this.totalDefense,
      gold: this.gold,
    }, this.inventory);
    this.refreshFloorInfo();
  }

  private get totalAttack(): number {
    if (this.gameMode === 'dungeon') {
      return BALANCE.player.attackDamage + Math.max(0, this.playerLevel - 1);
    }
    return BALANCE.player.attackDamage + this.inventory.attackBonus;
  }

  private get totalDefense(): number {
    if (this.gameMode === 'dungeon') return 0;
    return this.inventory.defenseBonus;
  }

  private get maxHp(): number {
    if (this.gameMode === 'dungeon') {
      // Final Dungeon HP. Equipment never modifies this value.
      return 20 + (this.playerLevel - 1) * 5;
    }
    return BALANCE.player.maxHp + this.inventory.maxHpBonus;
  }
}

function rollTreasureChestRarity(floor: number): ChestRarity {
  const depth = Math.max(1, floor);
  const redChance = Math.min(0.05, 0.005 + depth * 0.0015);
  const goldChance = Math.min(0.18, 0.035 + depth * 0.006);
  const silverChance = Math.min(0.34, 0.18 + depth * 0.008);
  const roll = Math.random();

  if (roll < redChance) return '赤神話';
  if (roll < redChance + goldChance) return '金';
  if (roll < redChance + goldChance + silverChance) return '銀';
  return '銅';
}

function shuffle<T>(values: readonly T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
