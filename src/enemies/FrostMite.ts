import { BALANCE } from '../config/balance';
import { GRAVITY } from '../config/constants';
import { intersects, resolveFloor } from '../game/Collision';
import type { Facing } from '../game/types';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

const frostMiteSpriteUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/monsters/frost_mite/frame_${String(index).padStart(2, '0')}.png`, import.meta.url).href,
);
const frostMiteSprites: HTMLImageElement[] = frostMiteSpriteUrls.map((src) => {
  const image = new Image();
  image.src = src;
  return image;
});

export type FrostMiteState = 'crawl' | 'charge' | 'breath' | 'shoot' | 'recover';

interface FrostShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  rotation: number;
}

interface FrostParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class FrostMite extends Enemy {
  readonly type = 'frostMite' as const;
  state: FrostMiteState = 'crawl';
  private attackMode: 'breath' | 'shoot' = 'shoot';
  private stateTime = 0;
  private released = false;
  private patrolFacing: Facing = Math.random() < 0.5 ? -1 : 1;
  private readonly shards: FrostShard[] = [];
  private readonly particles: FrostParticle[] = [];

  constructor(x: number, y: number) {
    super(x, y, 40, 24, BALANCE.frostMite.maxHp, BALANCE.frostMite.maxHp);
    this.facing = this.patrolFacing;
    this.cooldown = 0.8 + Math.random() * 0.7;
  }

  interruptForKnockback(): void {
    this.state = 'crawl';
    this.stateTime = 0;
    this.released = false;
  }

  protected onKnockbackEnd(): void {
    this.state = 'crawl';
    this.stateTime = 0;
    this.released = false;
    this.cooldown = Math.max(this.cooldown, 0.6);
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.updateShards(dt, context);
    this.updateParticles(dt);

    const playerCenterX = context.player.x + context.player.w / 2;
    const playerCenterY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.hypot(dx, dy);

    if (this.state !== 'crawl') {
      this.updateAttackState(dt, context, playerCenterX, playerCenterY, distance);
      this.applyGroundPhysics(context);
      return;
    }

    if (Math.abs(dx) < BALANCE.frostMite.noticeRange) {
      this.facing = dx >= 0 ? 1 : -1;
      this.patrolFacing = this.facing;
    }

    if (this.grounded && !this.hasGroundAhead(context)) {
      this.patrolFacing = this.patrolFacing === 1 ? -1 : 1;
      this.facing = this.patrolFacing;
    }

    const chase = Math.abs(dx) < BALANCE.frostMite.noticeRange;
    const direction: Facing = chase ? (dx >= 0 ? 1 : -1) : this.patrolFacing;
    const speed = chase ? BALANCE.frostMite.chaseSpeed : BALANCE.frostMite.crawlSpeed;
    this.vx = direction * speed;
    this.facing = direction;

    if (distance <= BALANCE.frostMite.attackRange && this.cooldown <= 0) {
      this.beginAttack(distance);
      this.vx = 0;
    }

    this.applyGroundPhysics(context);
  }

  private beginAttack(distance: number): void {
    this.attackMode = distance <= BALANCE.frostMite.breathRange && Math.random() < 0.62
      ? 'breath'
      : 'shoot';
    this.state = 'charge';
    this.stateTime = 0;
    this.actionTime = 0;
    this.released = false;
  }

  private updateAttackState(
    dt: number,
    context: EnemyContext,
    playerCenterX: number,
    playerCenterY: number,
    distance: number,
  ): void {
    this.stateTime += dt;
    this.actionTime = this.stateTime;
    this.vx = 0;

    if (this.state === 'charge') {
      if (this.stateTime < BALANCE.frostMite.chargeDuration) return;
      this.state = this.attackMode;
      this.stateTime = 0;
      this.actionTime = 0;
      return;
    }

    if (this.state === 'breath') {
      if (!this.released && this.stateTime >= BALANCE.frostMite.breathReleaseTime) {
        this.released = true;
        this.emitBreath(context, distance);
      }
      if (this.stateTime >= BALANCE.frostMite.breathDuration) this.beginRecovery();
      return;
    }

    if (this.state === 'shoot') {
      if (!this.released && this.stateTime >= BALANCE.frostMite.shardReleaseTime) {
        this.released = true;
        this.spawnShard(playerCenterX, playerCenterY);
      }
      if (this.stateTime >= BALANCE.frostMite.shardDuration) this.beginRecovery();
      return;
    }

    if (this.state === 'recover' && this.stateTime >= BALANCE.frostMite.recoverDuration) {
      this.state = 'crawl';
      this.stateTime = 0;
      this.actionTime = 0;
      this.released = false;
      this.cooldown = BALANCE.frostMite.attackCooldown;
    }
  }

  private beginRecovery(): void {
    this.state = 'recover';
    this.stateTime = 0;
    this.actionTime = 0;
    this.released = false;
  }

  private emitBreath(context: EnemyContext, distance: number): void {
    const mouthX = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
    const mouthY = this.y + 8;

    for (let i = 0; i < 24; i += 1) {
      const spread = (Math.random() - 0.5) * 1.4;
      const speed = 1.3 + Math.random() * 2.2;
      this.particles.push({
        x: mouthX,
        y: mouthY + (Math.random() - 0.5) * 8,
        vx: this.facing * speed,
        vy: spread,
        life: 0.28 + Math.random() * 0.34,
        maxLife: 0.62,
        size: 2 + Math.floor(Math.random() * 4),
      });
    }

    const playerCenterX = context.player.x + context.player.w / 2;
    const inFront = this.facing > 0
      ? playerCenterX >= this.x + this.w / 2
      : playerCenterX <= this.x + this.w / 2;

    if (inFront && distance <= BALANCE.frostMite.breathRange + 18) {
      context.hurtPlayer(BALANCE.frostMite.breathDamage, this.x + this.w / 2);
      context.freezePlayer(BALANCE.frostMite.breathFreezeDuration);
    }
  }

  private spawnShard(targetX: number, targetY: number): void {
    const originX = this.facing > 0 ? this.x + this.w + 4 : this.x - 4;
    const originY = this.y + 8;
    const dx = targetX - originX;
    const dy = targetY - originY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const speed = BALANCE.frostMite.shardSpeed;

    this.shards.push({
      x: originX,
      y: originY,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed - 0.25,
      life: BALANCE.frostMite.shardLife,
      rotation: Math.atan2(dy, dx),
    });
  }

  private updateShards(dt: number, context: EnemyContext): void {
    for (const shard of this.shards) {
      shard.life -= dt;
      if (shard.life <= 0) continue;
      shard.x += shard.vx;
      shard.y += shard.vy;
      shard.vy += 0.018;
      shard.rotation = Math.atan2(shard.vy, shard.vx);

      const rect = { x: shard.x - 9, y: shard.y - 5, w: 18, h: 10 };
      if (intersects(rect, context.player)) {
        context.hurtPlayer(BALANCE.frostMite.shardDamage, shard.x);
        context.freezePlayer(BALANCE.frostMite.shardFreezeDuration);
        shard.life = 0;
      }
    }

    for (let i = this.shards.length - 1; i >= 0; i -= 1) {
      const shard = this.shards[i]!;
      if (
        shard.life <= 0 ||
        shard.x < -80 ||
        shard.x > context.stage.width + 80 ||
        shard.y < -80 ||
        shard.y > context.stage.height + 80
      ) {
        this.shards.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.96;
      particle.vy *= 0.97;
    }
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      if (this.particles[i]!.life <= 0) this.particles.splice(i, 1);
    }
  }

  private applyGroundPhysics(context: EnemyContext): void {
    const previousY = this.y;
    this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;
    resolveFloor(this, previousY, context.stage.platforms, context.stage.width);

    if (this.x <= 1 || this.x + this.w >= context.stage.width - 1) {
      this.patrolFacing = this.patrolFacing === 1 ? -1 : 1;
      this.facing = this.patrolFacing;
    }
  }

  private hasGroundAhead(context: EnemyContext): boolean {
    const probeX = this.facing > 0 ? this.x + this.w + 6 : this.x - 6;
    const footY = this.y + this.h;
    return context.stage.platforms.some((platform) =>
      probeX >= platform.x &&
      probeX <= platform.x + platform.w &&
      platform.y >= footY - 4 &&
      platform.y <= footY + 14
    );
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const shard of this.shards) this.drawShard(ctx, shard);
    for (const particle of this.particles) this.drawParticle(ctx, particle);

    const centerX = this.x + this.w / 2;
    const footY = this.y + this.h;
    const charge = this.state === 'charge'
      ? Math.min(1, this.stateTime / BALANCE.frostMite.chargeDuration)
      : 0;
    const recoil = this.state === 'shoot' && this.released ? 2.5 : 0;

    ctx.save();
    ctx.translate(centerX - this.facing * recoil, footY);
    if (this.facing < 0) ctx.scale(-1, 1);

    // Approved Frost Mite sprite design: blue-white crystal shell + cyan glowing eyes.
    let spriteIndex = 0;
    if (this.state === 'charge') spriteIndex = 4;
    else if (this.state === 'breath' || this.state === 'shoot') spriteIndex = 5;
    else if (this.state === 'recover') spriteIndex = 3;
    else spriteIndex = Math.floor(this.actionTime * 8) % 4;

    const sprite = frostMiteSprites[spriteIndex] ?? frostMiteSprites[0];
    const drawH = this.state === 'charge' ? 45 : 42;
    const ratio = sprite && sprite.naturalHeight > 0 ? sprite.naturalWidth / sprite.naturalHeight : 1.45;
    const drawW = Math.round(drawH * ratio);

    if (sprite && sprite.complete && sprite.naturalWidth > 0) {
      if (this.facing > 0) ctx.scale(-1, 1);
      ctx.drawImage(sprite, -drawW / 2, -drawH + 3, drawW, drawH);
    }

    if (charge > 0) {
      const pulse = 0.28 + Math.sin(this.stateTime * 28) * 0.12;
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, pulse * charge);
      ctx.strokeStyle = '#bdf6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -18, 27 + charge * 4, 15 + charge * 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawShard(ctx: CanvasRenderingContext2D, shard: FrostShard): void {
    ctx.save();
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.rotation);
    ctx.fillStyle = 'rgba(113, 220, 247, 0.22)';
    ctx.fillRect(-15, -5, 19, 10);
    ctx.fillStyle = '#8de9ff';
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8ffff';
    ctx.fillRect(1, -2, 5, 2);
    ctx.restore();
  }

  private drawParticle(ctx: CanvasRenderingContext2D, particle: FrostParticle): void {
    const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = particle.size >= 4 ? '#dfffff' : '#75dff5';
    ctx.fillRect(
      Math.round(particle.x - particle.size / 2),
      Math.round(particle.y - particle.size / 2),
      particle.size,
      particle.size,
    );
    ctx.restore();
  }
}
