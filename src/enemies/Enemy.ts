import { BALANCE } from '../config/balance';
import { GRAVITY, KNOCKBACK_GRAVITY } from '../config/constants';
import { resolveFloor } from '../game/Collision';
import type { Facing, PhysicsBody } from '../game/types';
import type { Player } from '../player/Player';
import type { Stage } from '../stage/Stage';

export interface EnemyContext {
  player: Player;
  stage: Stage;
  allies: Enemy[];
  hurtPlayer: (damage: number, sourceX: number) => boolean;
  poisonPlayer: (duration: number, tickInterval: number, damage: number) => void;
  severePoisonPlayer: (duration: number, tickInterval: number, damage: number) => void;
  decayPlayer: (duration: number, tickInterval: number, damage: number) => void;
  paralyzePlayer: (duration: number) => void;
  slowPlayer: (duration: number) => void;
  sealPlayer: (duration: number) => void;
  silencePlayer: (duration: number) => void;
  blindPlayer: (duration: number) => void;
  sleepPlayer: (duration: number) => void;
  freezePlayer: (duration: number) => void;
  spawnAhrimanFireball: (x: number, y: number, facing: Facing) => void;
  spawnFreezeLancer: (x: number, y: number, targetX: number, targetY: number) => void;
  spawnSkeletonArrow: (x: number, y: number, vx: number, vy: number, damage: number, poisoned: boolean) => void;
}

export type EnemyKind =
  | 'slime'
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
  | 'crystalEye'
  | 'kagenoko'
  | 'kyokoki'
  | 'kyokokiPurple'
  | 'elemental'
  | 'mizaru'
  | 'iwazaru'
  | 'kikazaru'
  | 'totemEye'
  | 'totemEyeDecay';

type IdleStyle = 'still' | 'creep' | 'patrol' | 'lurk' | 'skitter' | 'hover' | 'hoverWide';

interface AwarenessProfile {
  detectX: number;
  detectY: number;
  loseX: number;
  loseY: number;
  memory: number;
  idleStyle: IdleStyle;
  idleSpeed: number;
  idleRadius: number;
  moveChance: number;
}

const AWARENESS: Record<EnemyKind, AwarenessProfile> = {
  slime: {
    detectX: 165, detectY: 90, loseX: 245, loseY: 145, memory: 1.4,
    idleStyle: 'creep', idleSpeed: 0.16, idleRadius: 64, moveChance: 0.72,
  },
  goblin: {
    detectX: 285, detectY: 135, loseX: 410, loseY: 205, memory: 2.0,
    idleStyle: 'patrol', idleSpeed: 0.30, idleRadius: 118, moveChance: 0.90,
  },
  ahriman: {
    detectX: 340, detectY: 225, loseX: 480, loseY: 325, memory: 2.8,
    idleStyle: 'hoverWide', idleSpeed: 0.28, idleRadius: 125, moveChance: 1,
  },
  snake: {
    detectX: 180, detectY: 80, loseX: 275, loseY: 125, memory: 1.6,
    idleStyle: 'lurk', idleSpeed: 0.10, idleRadius: 34, moveChance: 0.28,
  },
  bat: {
    detectX: 400, detectY: 270, loseX: 545, loseY: 370, memory: 3.0,
    idleStyle: 'hoverWide', idleSpeed: 0.44, idleRadius: 155, moveChance: 1,
  },
  bee: {
    detectX: 360, detectY: 235, loseX: 510, loseY: 340, memory: 2.6,
    idleStyle: 'hoverWide', idleSpeed: 0.34, idleRadius: 120, moveChance: 1,
  },
  redBee: {
    detectX: 390, detectY: 255, loseX: 540, loseY: 365, memory: 2.9,
    idleStyle: 'hoverWide', idleSpeed: 0.42, idleRadius: 138, moveChance: 1,
  },
  roper: {
    detectX: 210, detectY: 140, loseX: 295, loseY: 205, memory: 2.2,
    idleStyle: 'still', idleSpeed: 0, idleRadius: 0, moveChance: 0,
  },
  slug: {
    detectX: 105, detectY: 60, loseX: 165, loseY: 95, memory: 1.0,
    idleStyle: 'creep', idleSpeed: 0.10, idleRadius: 58, moveChance: 0.52,
  },
  decaySlug: {
    detectX: 135, detectY: 72, loseX: 210, loseY: 120, memory: 1.4,
    idleStyle: 'creep', idleSpeed: 0.08, idleRadius: 52, moveChance: 0.64,
  },
  rat: {
    detectX: 250, detectY: 100, loseX: 370, loseY: 160, memory: 1.5,
    idleStyle: 'skitter', idleSpeed: 0.48, idleRadius: 105, moveChance: 0.86,
  },
  skeleton: {
    detectX: 295, detectY: 130, loseX: 425, loseY: 205, memory: 2.2,
    idleStyle: 'patrol', idleSpeed: 0.26, idleRadius: 96, moveChance: 0.78,
  },
  skeletonArcher: {
    detectX: 385, detectY: 185, loseX: 535, loseY: 275, memory: 3.2,
    idleStyle: 'still', idleSpeed: 0, idleRadius: 0, moveChance: 0,
  },
  bomb: {
    detectX: 165, detectY: 105, loseX: 250, loseY: 165, memory: 5.0,
    idleStyle: 'still', idleSpeed: 0, idleRadius: 0, moveChance: 0,
  },
  caterpillar: {
    detectX: 215, detectY: 115, loseX: 320, loseY: 180, memory: 1.8,
    idleStyle: 'creep', idleSpeed: 0.11, idleRadius: 52, moveChance: 0.70,
  },
  frostMite: {
    detectX: 225, detectY: 110, loseX: 335, loseY: 170, memory: 1.9,
    idleStyle: 'lurk', idleSpeed: 0.14, idleRadius: 62, moveChance: 0.34,
  },
  crystalEye: {
    detectX: 420, detectY: 290, loseX: 575, loseY: 395, memory: 3.4,
    idleStyle: 'hover', idleSpeed: 0.10, idleRadius: 36, moveChance: 1,
  },
  totemEye: {
    detectX: 335, detectY: 225, loseX: 475, loseY: 305, memory: 2.8,
    idleStyle: 'still', idleSpeed: 0, idleRadius: 0, moveChance: 0,
  },
  totemEyeDecay: {
    detectX: 350, detectY: 235, loseX: 490, loseY: 315, memory: 3.0,
    idleStyle: 'still', idleSpeed: 0, idleRadius: 0, moveChance: 0,
  },
  kagenoko: {
    detectX: 305, detectY: 140, loseX: 445, loseY: 220, memory: 2.2,
    idleStyle: 'skitter', idleSpeed: 0.40, idleRadius: 88, moveChance: 0.76,
  },
  kyokoki: {
    detectX: 360, detectY: 180, loseX: 500, loseY: 260, memory: 3.0,
    idleStyle: 'patrol', idleSpeed: 0.18, idleRadius: 100, moveChance: 0.70,
  },
  kyokokiPurple: {
    detectX: 390, detectY: 200, loseX: 545, loseY: 285, memory: 3.2,
    idleStyle: 'patrol', idleSpeed: 0.18, idleRadius: 100, moveChance: 0.70,
  },
  elemental: {
    detectX: 365, detectY: 250, loseX: 520, loseY: 355, memory: 3.0,
    idleStyle: 'hover', idleSpeed: 0.18, idleRadius: 82, moveChance: 1,
  },
  mizaru: {
    detectX: 325, detectY: 155, loseX: 480, loseY: 245, memory: 2.2,
    idleStyle: 'skitter', idleSpeed: 0.58, idleRadius: 125, moveChance: 0.94,
  },
  iwazaru: {
    detectX: 325, detectY: 155, loseX: 480, loseY: 245, memory: 2.2,
    idleStyle: 'skitter', idleSpeed: 0.58, idleRadius: 125, moveChance: 0.94,
  },
  kikazaru: {
    detectX: 325, detectY: 155, loseX: 480, loseY: 245, memory: 2.2,
    idleStyle: 'skitter', idleSpeed: 0.58, idleRadius: 125, moveChance: 0.94,
  },
};

export abstract class Enemy implements PhysicsBody {
  abstract readonly type: EnemyKind;

  vx = 0;
  vy = 0;
  grounded = false;
  facing: Facing = 1;
  actionTime = 0;
  cooldown = 0;
  knockbackTime = 0;
  private hasteTime = 0;
  private berserkTime = 0;
  private regenerationTime = 0;
  private regenerationTickTime = 0;
  private regenerationBaseMaxHp: number | null = null;

  private aware = false;
  private loseSightTime = 0;
  private damageAlertTime = 0;
  private readonly homeX: number;
  private readonly homeY: number;
  private idleDirection: Facing = Math.random() < 0.5 ? -1 : 1;
  private idleDecisionTime = 0.5 + Math.random() * 1.1;
  private idleMoving = Math.random() < 0.65;
  private readonly idlePhase = Math.random() * Math.PI * 2;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public hp: number,
    public maxHp: number,
  ) {
    this.homeX = x;
    this.homeY = y;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  get hasDetectedPlayer(): boolean {
    return this.aware;
  }

  get hasteActive(): boolean { return this.hasteTime > 0; }

  get berserkActive(): boolean { return this.berserkTime > 0; }

  get attackPowerMultiplier(): number { return this.berserkActive ? 1.55 : 1; }

  applyHaste(duration: number): void { this.hasteTime = Math.max(this.hasteTime, duration); }

  applyBerserk(duration: number): void { this.berserkTime = Math.max(this.berserkTime, duration); }
  get regenerationActive(): boolean { return this.regenerationTime > 0; }  applyRegeneration(duration: number): void {
    if (!this.regenerationActive) {
      const oldMaxHp = Math.max(1, this.maxHp);
      const hpRatio = Math.max(0, Math.min(1, this.hp / oldMaxHp));
      this.regenerationBaseMaxHp = oldMaxHp;
      this.maxHp = oldMaxHp * 2;
      this.hp = Math.max(1, Math.min(this.maxHp, Math.ceil(this.maxHp * hpRatio)));
    }

    this.regenerationTime = Math.max(this.regenerationTime, duration);
    if (this.regenerationTickTime <= 0) this.regenerationTickTime = 0.25;
  }

  alertByDamage(): void {
    this.aware = true;
    this.loseSightTime = 0;
    this.damageAlertTime = 4.0;
  }

  update(dt: number, context: EnemyContext): void {
    if (!this.alive) return;

    this.actionTime += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.damageAlertTime = Math.max(0, this.damageAlertTime - dt);
    this.hasteTime = Math.max(0, this.hasteTime - dt);
    this.berserkTime = Math.max(0, this.berserkTime - dt);    const wasRegenerating = this.regenerationTime > 0;
    this.regenerationTime = Math.max(0, this.regenerationTime - dt);
    if (this.regenerationTime > 0) {
      this.regenerationTickTime -= dt;
      if (this.regenerationTickTime <= 0) {
        const regenerationHeal = Math.max(1, Math.ceil(this.maxHp * 0.02));
        this.hp = Math.min(this.maxHp, this.hp + regenerationHeal);
        this.regenerationTickTime += 1.0;
      }
    } else {
      this.regenerationTickTime = 0;

      if (wasRegenerating && this.regenerationBaseMaxHp !== null) {
        const boostedMaxHp = Math.max(1, this.maxHp);
        const hpRatio = Math.max(0, Math.min(1, this.hp / boostedMaxHp));
        this.maxHp = this.regenerationBaseMaxHp;
        this.hp = Math.max(1, Math.min(this.maxHp, Math.ceil(this.maxHp * hpRatio)));
        this.regenerationBaseMaxHp = null;
      }
    }

    if (this.knockbackTime > 0) {
      this.updateKnockback(dt, context.stage);
      return;
    }

    const movementStartX = this.x;
    if (!this.updateAwareness(dt, context)) {
      this.updateUnaware(dt, context);
      this.applyHasteMovement(movementStartX, context.stage);
      return;
    }

    this.updateAi(dt, context);
    this.applyHasteMovement(movementStartX, context.stage);
  }

  abstract interruptForKnockback(): void;
  protected abstract updateAi(dt: number, context: EnemyContext): void;

  protected updateUnaware(dt: number, context: EnemyContext): void {
    const profile = AWARENESS[this.type];

    if (profile.idleStyle === 'hover' || profile.idleStyle === 'hoverWide') {
      this.updateIdleHover(dt, context, profile);
      return;
    }

    this.updateIdleGround(dt, context, profile);
  }

  private applyHasteMovement(startX: number, stage: Stage): void {
    if (!this.hasteActive) return;
    const deltaX = this.x - startX;
    this.x = Math.max(0, Math.min(stage.width - this.w, startX + deltaX * 1.75));
  }

  protected updateKnockback(dt: number, stage: Stage): void {
    const previousY = this.y;
    this.knockbackTime = Math.max(0, this.knockbackTime - dt);
    this.vy += KNOCKBACK_GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= BALANCE.enemyKnockback.friction;
    resolveFloor(this, previousY, stage.platforms, stage.width);

    if (this.knockbackTime <= 0) {
      this.onKnockbackEnd();
    }
  }

  protected abstract onKnockbackEnd(): void;

  private updateAwareness(dt: number, context: EnemyContext): boolean {
    const profile = AWARENESS[this.type];
    const enemyCenterX = this.x + this.w / 2;
    const enemyCenterY = this.y + this.h / 2;
    const playerCenterX = context.player.x + context.player.w / 2;
    const playerCenterY = context.player.y + context.player.h / 2;
    const dx = Math.abs(playerCenterX - enemyCenterX);
    const dy = Math.abs(playerCenterY - enemyCenterY);

    const awarenessMultiplier = this.berserkActive ? 2 : 1;
    const detectX = profile.detectX * awarenessMultiplier;
    const detectY = profile.detectY * awarenessMultiplier;
    const loseX = profile.loseX * awarenessMultiplier;
    const loseY = profile.loseY * awarenessMultiplier;

    if (this.damageAlertTime > 0) {
      this.aware = true;
      this.loseSightTime = 0;
      return true;
    }

    if (!this.aware) {
      if (dx <= detectX && dy <= detectY) {
        this.aware = true;
        this.loseSightTime = 0;
      }
      return this.aware;
    }

    if (dx <= loseX && dy <= loseY) {
      this.loseSightTime = 0;
      return true;
    }

    this.loseSightTime += dt;
    if (this.loseSightTime >= profile.memory) {
      this.aware = false;
      this.loseSightTime = 0;
      this.idleDecisionTime = 0.15 + Math.random() * 0.45;
      this.idleMoving = false;
      this.vx *= 0.35;
    }
    return this.aware;
  }

  private updateIdleGround(
    dt: number,
    context: EnemyContext,
    profile: AwarenessProfile,
  ): void {
    this.idleDecisionTime -= dt;

    if (profile.idleStyle === 'still') {
      if (this.idleDecisionTime <= 0) {
        if (Math.random() < 0.38) this.idleDirection = this.idleDirection === 1 ? -1 : 1;
        this.facing = this.idleDirection;
        this.idleDecisionTime = 1.6 + Math.random() * 2.8;
      }
      this.vx *= 0.65;
      this.applyIdleGravity(context);
      return;
    }

    if (this.idleDecisionTime <= 0) {
      this.idleMoving = Math.random() < profile.moveChance;
      if (Math.random() < this.turnChance(profile.idleStyle)) {
        this.idleDirection = this.idleDirection === 1 ? -1 : 1;
      }
      this.idleDecisionTime = this.nextIdleDecision(profile.idleStyle);
    }

    const offsetFromHome = this.x - this.homeX;
    if (offsetFromHome > profile.idleRadius) this.idleDirection = -1;
    if (offsetFromHome < -profile.idleRadius) this.idleDirection = 1;

    if (this.grounded && !this.hasIdleGroundAhead(context.stage, this.idleDirection)) {
      this.idleDirection = this.idleDirection === 1 ? -1 : 1;
      this.idleDecisionTime = 0.4 + Math.random() * 0.5;
    }

    this.facing = this.idleDirection;

    if (this.idleMoving) {
      const burst =
        profile.idleStyle === 'skitter'
          ? 0.84 + Math.abs(Math.sin(this.actionTime * 9 + this.idlePhase)) * 0.35
          : 1;
      this.vx = this.idleDirection * profile.idleSpeed * burst;
      this.x += this.vx;
    } else {
      this.vx *= 0.55;
    }

    this.applyIdleGravity(context);
  }

  private updateIdleHover(
    dt: number,
    context: EnemyContext,
    profile: AwarenessProfile,
  ): void {
    this.idleDecisionTime -= dt;

    if (this.idleDecisionTime <= 0) {
      if (Math.random() < 0.55) this.idleDirection = this.idleDirection === 1 ? -1 : 1;
      this.idleDecisionTime =
        profile.idleStyle === 'hoverWide'
          ? 1.0 + Math.random() * 1.6
          : 1.6 + Math.random() * 2.4;
    }

    const offsetFromHome = this.x - this.homeX;
    if (offsetFromHome > profile.idleRadius) this.idleDirection = -1;
    if (offsetFromHome < -profile.idleRadius) this.idleDirection = 1;

    this.facing = this.idleDirection;
    this.vx = this.idleDirection * profile.idleSpeed;
    this.x += this.vx;

    const amplitude = profile.idleStyle === 'hoverWide' ? 18 : 10;
    const frequency = profile.idleStyle === 'hoverWide' ? 1.9 : 1.35;
    const targetY = this.homeY + Math.sin(this.actionTime * frequency + this.idlePhase) * amplitude;
    this.y += (targetY - this.y) * 0.055;
    this.vy = 0;

    this.x = Math.max(6, Math.min(context.stage.width - this.w - 6, this.x));
    this.y = Math.max(55, Math.min(context.stage.height - this.h - 55, this.y));
  }

  private applyIdleGravity(context: EnemyContext): void {
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
  }

  private hasIdleGroundAhead(stage: Stage, direction: Facing): boolean {
    const probeX = direction > 0 ? this.x + this.w + 5 : this.x - 5;
    const footY = this.y + this.h;
    return stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 5 &&
      platform.y <= footY + 15
    );
  }

  private turnChance(style: IdleStyle): number {
    if (style === 'skitter') return 0.58;
    if (style === 'lurk') return 0.42;
    if (style === 'creep') return 0.30;
    return 0.22;
  }

  private nextIdleDecision(style: IdleStyle): number {
    if (style === 'skitter') return 0.28 + Math.random() * 0.72;
    if (style === 'lurk') return 0.75 + Math.random() * 1.9;
    if (style === 'creep') return 0.9 + Math.random() * 1.7;
    return 1.1 + Math.random() * 1.8;
  }
}
