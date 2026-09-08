import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type CaterpillarPhase = 'larva' | 'pupa' | 'butterfly';
export type ButterflyState = 'fly' | 'ramWindup' | 'ram' | 'powder';

export class Caterpillar extends Enemy {
  readonly type = 'caterpillar' as const;
  phase: CaterpillarPhase = 'larva';
  butterflyState: ButterflyState = 'fly';
  phaseTime = 0;
  private attackTime = 0;
  private attackTargetX = 0;
  private attackTargetY = 0;
  private powderReleased = false;
  private ramHit = false;
  private readonly larvaEvolutionTime =
    this.larvaEvolutionTime * (0.65 + Math.random() * 0.70);
  private readonly pupaEvolutionTime =
    this.pupaEvolutionTime * (0.65 + Math.random() * 0.70);
  private wanderAngle = Math.random() * Math.PI * 2;
  private wanderTime = 0.8 + Math.random() * 1.8;

  constructor(x: number, y: number) {
    super(x, y, 34, 20, BALANCE.caterpillar.maxHp, BALANCE.caterpillar.maxHp);
    this.facing = Math.random() < 0.5 ? -1 : 1;
    this.cooldown = 0.6 + Math.random() * 0.8;
  }

  interruptForKnockback(): void {
    if (this.phase === 'pupa') {
      this.knockbackTime = 0;
      this.vx = 0;
      this.vy = 0;
      return;
    }
    if (this.phase !== 'butterfly') return;
    this.butterflyState = 'fly';
    this.attackTime = 0;
    this.powderReleased = false;
    this.ramHit = false;
  }

  protected onKnockbackEnd(): void {
    if (this.phase !== 'butterfly') return;
    this.butterflyState = 'fly';
    this.attackTime = 0;
    this.cooldown = Math.max(this.cooldown, 0.7);
  }

  protected updateUnaware(dt: number, context: EnemyContext): void {
    this.phaseTime += dt;

    if (this.phase === 'larva') {
      this.updateLarva(context);
      if (this.phaseTime >= this.larvaEvolutionTime) {
        this.becomePupa();
      }
      return;
    }

    if (this.phase === 'pupa') {
      this.updatePupa(context);
      if (this.phaseTime >= this.pupaEvolutionTime) {
        this.becomeButterfly();
      }
      return;
    }

    this.updateButterflyWander(dt, context);
  }
  protected updateAi(dt: number, context: EnemyContext): void {
    this.phaseTime += dt;

    if (this.phase === 'larva') {
      this.updateLarva(context);
      if (this.phaseTime >= this.larvaEvolutionTime) this.becomePupa();
      return;
    }

    if (this.phase === 'pupa') {
      this.updatePupa(context);
      if (this.phaseTime >= this.pupaEvolutionTime) this.becomeButterfly();
      return;
    }

    this.updateButterfly(dt, context);
  }

  private updateLarva(context: EnemyContext): void {
    if (this.grounded && !this.hasGroundAhead(context)) this.facing = this.facing === 1 ? -1 : 1;

    this.vx = this.facing * BALANCE.caterpillar.crawlSpeed;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (this.x <= 1 || this.x + this.w >= context.stage.width - 1) {
      this.facing = this.facing === 1 ? -1 : 1;
    }
  }

  private updatePupa(context: EnemyContext): void {
    this.vx = 0;
    const previousY = this.y;
    this.vy += GRAVITY;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);
  }

  private updateButterflyWander(dt: number, context: EnemyContext): void {
    this.wanderTime -= dt;
    if (this.wanderTime <= 0) {
      this.wanderAngle += (Math.random() - 0.5) * 1.9;
      this.wanderTime = 0.8 + Math.random() * 1.8;
    }

    const speed = BALANCE.caterpillar.butterflySpeed * 0.52;
    const maxX = Math.max(0, context.stage.width - this.w);
    const maxY = Math.max(40, context.stage.height - this.h - 50);
    let targetVx = Math.cos(this.wanderAngle) * speed;
    let targetVy = Math.sin(this.wanderAngle) * speed * 0.62;

    if (this.x < 65) targetVx = Math.abs(targetVx) + speed * 0.28;
    if (this.x > maxX - 65) targetVx = -Math.abs(targetVx) - speed * 0.28;
    if (this.y < 60) targetVy = Math.abs(targetVy) + speed * 0.18;
    if (this.y > maxY - 60) targetVy = -Math.abs(targetVy) - speed * 0.18;

    const steering = Math.min(1, dt * 4.5);
    this.vx += (targetVx - this.vx) * steering;
    this.vy += (targetVy - this.vy) * steering;
    this.vy += Math.sin(this.phaseTime * 4.8) * 0.035;
    this.x += this.vx;
    this.y += this.vy;
    if (Math.abs(this.vx) > 0.04) this.facing = this.vx >= 0 ? 1 : -1;
    this.keepButterflyInStage(context);
  }
  private updateButterfly(dt: number, context: EnemyContext): void {
    const playerCenterX = context.player.x + context.player.w / 2;
    const playerCenterY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.hypot(dx, dy);

    if (this.butterflyState === 'ramWindup') {
      this.updateRamWindup(dt);
      return;
    }

    if (this.butterflyState === 'ram') {
      this.updateRam(dt, context);
      return;
    }

    if (this.butterflyState === 'powder') {
      this.updatePowder(dt, context);
      return;
    }

    this.facing = dx >= 0 ? 1 : -1;
    const safeDistance = Math.max(1, distance);
    const hoverX = dx / safeDistance;
    const hoverY = dy / safeDistance;
    const speedScale = distance > BALANCE.caterpillar.hoverRange ? 1 : 0.42;
    this.vx = hoverX * BALANCE.caterpillar.butterflySpeed * speedScale;
    this.vy = hoverY * BALANCE.caterpillar.butterflySpeed * speedScale
      + Math.sin(this.phaseTime * 5.2) * 0.36;
    this.x += this.vx;
    this.y += this.vy;
    this.keepButterflyInStage(context);

    if (distance <= BALANCE.caterpillar.attackRange && this.cooldown <= 0) {
      this.beginButterflyAttack(playerCenterX, playerCenterY);
    }
  }

  private beginButterflyAttack(targetX: number, targetY: number): void {
    this.attackTargetX = targetX;
    this.attackTargetY = targetY;
    this.attackTime = 0;
    this.actionTime = 0;
    this.powderReleased = false;
    this.ramHit = false;

    if (Math.random() < 0.5) {
      this.butterflyState = 'ramWindup';
    } else {
      this.butterflyState = 'powder';
      this.vx = 0;
      this.vy = 0;
    }
  }

  private updateRamWindup(dt: number): void {
    this.attackTime += dt;
    this.actionTime = this.attackTime;
    this.x -= this.facing * 0.55;
    this.y += Math.sin(this.attackTime * 28) * 0.35;

    if (this.attackTime < BALANCE.caterpillar.ramWindup) return;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = this.attackTargetX - centerX;
    const dy = this.attackTargetY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    this.vx = (dx / distance) * BALANCE.caterpillar.ramSpeed;
    this.vy = (dy / distance) * BALANCE.caterpillar.ramSpeed;
    this.facing = this.vx >= 0 ? 1 : -1;
    this.butterflyState = 'ram';
    this.attackTime = 0;
    this.actionTime = 0;
  }

  private updateRam(dt: number, context: EnemyContext): void {
    this.attackTime += dt;
    this.actionTime = this.attackTime;
    this.x += this.vx;
    this.y += this.vy;
    this.keepButterflyInStage(context);

    if (!this.ramHit && intersects(this, context.player)) {
      const hit = context.hurtPlayer(BALANCE.caterpillar.ramDamage, this.x + this.w / 2);
      if (hit) this.applyRamStatuses(context);
      this.ramHit = true;
    }

    if (this.attackTime < BALANCE.caterpillar.ramDuration) return;
    this.finishButterflyAttack();
  }

  private applyRamStatuses(context: EnemyContext): void {
    let slow = Math.random() < BALANCE.caterpillar.slowChance;
    let paralysis = Math.random() < BALANCE.caterpillar.paralysisChance;
    let poison = Math.random() < BALANCE.caterpillar.poisonChance;
    let seal = Math.random() < BALANCE.caterpillar.sealChance;
    let silence = Math.random() < BALANCE.caterpillar.silenceChance;
    let blind = Math.random() < BALANCE.caterpillar.blindChance;
    let sleep = Math.random() < BALANCE.caterpillar.sleepChance;

    if (!slow && !paralysis && !poison && !seal && !silence && !blind && !sleep) {
      const forced = Math.floor(Math.random() * 7);
      slow = forced === 0;
      paralysis = forced === 1;
      poison = forced === 2;
      seal = forced === 3;
      silence = forced === 4;
      blind = forced === 5;
      sleep = forced === 6;
    }

    if (slow) context.slowPlayer(BALANCE.caterpillar.slowDuration);
    if (paralysis) context.paralyzePlayer(BALANCE.caterpillar.paralysisDuration);
    if (poison) {
      context.poisonPlayer(
        BALANCE.caterpillar.poisonDuration,
        BALANCE.caterpillar.poisonTickInterval,
        BALANCE.caterpillar.poisonDamage,
      );
    }
    if (seal) context.sealPlayer(BALANCE.caterpillar.sealDuration);
    if (silence) context.silencePlayer(BALANCE.caterpillar.silenceDuration);
    if (blind) context.blindPlayer(BALANCE.caterpillar.blindDuration);
    if (sleep) context.sleepPlayer(BALANCE.caterpillar.sleepDuration);
  }

  private updatePowder(dt: number, context: EnemyContext): void {
    this.attackTime += dt;
    this.actionTime = this.attackTime;
    this.y += Math.sin(this.attackTime * 18) * 0.18;

    if (!this.powderReleased && this.attackTime >= BALANCE.caterpillar.powderReleaseTime) {
      this.powderReleased = true;
      this.releasePowder(context);
    }

    if (this.attackTime < BALANCE.caterpillar.powderDuration) return;
    this.finishButterflyAttack();
  }

  private releasePowder(context: EnemyContext): void {
    const playerCenterX = context.player.x + context.player.w / 2;
    const playerCenterY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;

    if (Math.hypot(playerCenterX - centerX, playerCenterY - centerY) > BALANCE.caterpillar.powderRange) {
      return;
    }

    context.hurtPlayer(BALANCE.caterpillar.powderDamage, centerX);

    let slow = Math.random() < BALANCE.caterpillar.slowChance;
    let paralysis = Math.random() < BALANCE.caterpillar.paralysisChance;
    let poison = Math.random() < BALANCE.caterpillar.poisonChance;
    let seal = Math.random() < BALANCE.caterpillar.sealChance;
    let silence = Math.random() < BALANCE.caterpillar.silenceChance;
    let blind = Math.random() < BALANCE.caterpillar.blindChance;
    let sleep = Math.random() < BALANCE.caterpillar.sleepChance;

    if (!slow && !paralysis && !poison && !seal && !silence && !blind && !sleep) {
      const forced = Math.floor(Math.random() * 7);
      slow = forced === 0;
      paralysis = forced === 1;
      poison = forced === 2;
      seal = forced === 3;
      silence = forced === 4;
      blind = forced === 5;
      sleep = forced === 6;
    }

    if (slow) context.slowPlayer(BALANCE.caterpillar.slowDuration);
    if (paralysis) context.paralyzePlayer(BALANCE.caterpillar.paralysisDuration);
    if (poison) {
      context.poisonPlayer(
        BALANCE.caterpillar.poisonDuration,
        BALANCE.caterpillar.poisonTickInterval,
        BALANCE.caterpillar.poisonDamage,
      );
    }
    if (seal) context.sealPlayer(BALANCE.caterpillar.sealDuration);
    if (silence) context.silencePlayer(BALANCE.caterpillar.silenceDuration);
    if (blind) context.blindPlayer(BALANCE.caterpillar.blindDuration);
    if (sleep) context.sleepPlayer(BALANCE.caterpillar.sleepDuration);
  }

  private finishButterflyAttack(): void {
    this.butterflyState = 'fly';
    this.attackTime = 0;
    this.actionTime = 0;
    this.cooldown = BALANCE.caterpillar.attackCooldown;
    this.powderReleased = false;
    this.ramHit = false;
    this.vx *= 0.25;
    this.vy *= 0.25;
  }

  private becomePupa(): void {
    const footY = this.y + this.h;
    this.phase = 'pupa';
    this.phaseTime = 0;
    this.actionTime = 0;
    this.w = 44;
    this.h = 64;
    this.x -= 5;
    this.y = footY - this.h;
    this.vx = 0;
    this.vy = 0;
  }

  private becomeButterfly(): void {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    this.phase = 'butterfly';
    this.phaseTime = 0;
    this.actionTime = 0;
    this.butterflyState = 'fly';
    this.w = 48;
    this.h = 34;
    this.x = centerX - this.w / 2;
    this.y = centerY - this.h / 2 - 18;
    this.vx = this.facing * 0.8;
    this.vy = -1.6;
    this.cooldown = 1.0;
  }

  private hasGroundAhead(context: EnemyContext): boolean {
    const probeX = this.facing > 0 ? this.x + this.w + 5 : this.x - 5;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 4 &&
      platform.y <= footY + 14
    );
  }

  private keepButterflyInStage(context: EnemyContext): void {
    const maxX = Math.max(0, context.stage.width - this.w);
    const maxY = Math.max(40, context.stage.height - this.h - 50);

    if (this.x < 0 || this.x > maxX) {
      this.x = Math.max(0, Math.min(maxX, this.x));
      this.vx *= -0.65;
      this.facing = this.vx >= 0 ? 1 : -1;
    }

    if (this.y < 30 || this.y > maxY) {
      this.y = Math.max(30, Math.min(maxY, this.y));
      this.vy *= -0.65;
    }
  }
}
