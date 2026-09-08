import { intersects } from '../game/Collision';
import type { EnemyContext } from './Enemy';
import { Enemy } from './Enemy';

export type ElementalKind = 'fire' | 'ice' | 'thunder' | 'wind' | 'light' | 'dark';
export type ElementalState = 'move' | 'castLower' | 'castUpper' | 'warpOut' | 'warpIn';

type SpellTier = 'lower' | 'upper';

interface ElementalShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  tier: SpellTier;
  alive: boolean;
  phase: number;
}

const ELEMENT_COLORS: Record<ElementalKind, { edge: string; core: string; glow: string }> = {
  fire: { edge: '#ff5a2d', core: '#ffd36e', glow: 'rgba(255, 80, 35, 0.72)' },
  ice: { edge: '#4bc9ff', core: '#e9fdff', glow: 'rgba(74, 211, 255, 0.72)' },
  thunder: { edge: '#9d6cff', core: '#fff56b', glow: 'rgba(184, 128, 255, 0.72)' },
  wind: { edge: '#54d899', core: '#eafff4', glow: 'rgba(83, 225, 160, 0.68)' },
  light: { edge: '#ffe67a', core: '#ffffff', glow: 'rgba(255, 239, 145, 0.78)' },
  dark: { edge: '#6e43b7', core: '#d7b9ff', glow: 'rgba(93, 57, 167, 0.78)' },
};

const ELEMENTAL_MAX_HP = 44;
const MOVE_SPEED = 28;
const PREFERRED_RANGE = 205;
const ATTACK_RANGE = 410;
const LOWER_CAST = 0.78;
const UPPER_CAST = 1.12;
const LOWER_DAMAGE = 9;
const UPPER_DAMAGE = 15;
const LOWER_SPEED = 220;
const UPPER_SPEED = 190;
const SHOT_LIFE = 2.8;
const WARP_OUT_TIME = 0.2;
const WARP_IN_TIME = 0.22;

export class Elemental extends Enemy {
  readonly type = 'elemental' as const;
  state: ElementalState = 'move';
  stateTime = 0;
  private spellReleased = false;
  private castCount = 0;
  private warpCooldown = 3.2 + Math.random() * 2.1;
  private readonly hoverSeed = Math.random() * Math.PI * 2;
  private readonly shots: ElementalShot[] = [];

  constructor(x: number, y: number, public readonly element: ElementalKind) {
    super(x, y, 28, 34, ELEMENTAL_MAX_HP, ELEMENTAL_MAX_HP);
    this.cooldown = 0.8 + Math.random() * 0.7;
  }

  interruptForKnockback(): void {
    this.knockbackTime = 0;
    this.vx = 0;
    this.vy = 0;
    this.state = 'move';
    this.stateTime = 0;
    this.spellReleased = false;
  }

  protected onKnockbackEnd(): void {
    this.knockbackTime = 0;
    this.vx = 0;
    this.vy = 0;
  }

  protected updateAi(dt: number, context: EnemyContext): void {
    this.updateShots(dt, context);
    this.stateTime += dt;
    this.warpCooldown = Math.max(0, this.warpCooldown - dt);

    const playerX = context.player.x + context.player.w / 2;
    const playerY = context.player.y + context.player.h / 2;
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const dx = playerX - centerX;
    const dy = playerY - centerY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    this.facing = dx >= 0 ? 1 : -1;

    if (this.state === 'warpOut') {
      if (this.stateTime >= WARP_OUT_TIME) this.finishWarp(context);
      return;
    }

    if (this.state === 'warpIn') {
      if (this.stateTime >= WARP_IN_TIME) {
        this.state = 'move';
        this.stateTime = 0;
        this.cooldown = Math.max(this.cooldown, 0.45);
      }
      return;
    }

    if (this.state === 'castLower' || this.state === 'castUpper') {
      const upper = this.state === 'castUpper';
      const castTime = upper ? UPPER_CAST : LOWER_CAST;
      if (!this.spellReleased && this.stateTime >= castTime * 0.72) {
        this.spellReleased = true;
        this.releaseSpell(context, upper ? 'upper' : 'lower');
      }
      if (this.stateTime >= castTime) {
        this.state = 'move';
        this.stateTime = 0;
        this.cooldown = upper ? 2.05 : 1.35;
        this.spellReleased = false;
      }
      return;
    }

    const side = centerX < playerX ? -1 : 1;
    const desiredX = playerX + side * PREFERRED_RANGE;
    const desiredY = playerY - 58 + Math.sin(this.actionTime * 1.8 + this.hoverSeed) * 28;
    const moveX = desiredX - centerX;
    const moveY = desiredY - centerY;
    const moveDistance = Math.max(1, Math.hypot(moveX, moveY));
    const step = MOVE_SPEED * dt;
    this.x += (moveX / moveDistance) * Math.min(step, Math.abs(moveX));
    this.y += (moveY / moveDistance) * Math.min(step * 0.72, Math.abs(moveY));

    this.x = Math.max(36, Math.min(context.stage.width - this.w - 36, this.x));
    this.y = Math.max(72, Math.min(context.stage.height - this.h - 100, this.y));

    if (this.warpCooldown <= 0 || distance < 92) {
      this.state = 'warpOut';
      this.stateTime = 0;
      this.spellReleased = false;
      return;
    }

    if (distance <= ATTACK_RANGE && this.cooldown <= 0) {
      this.castCount += 1;
      const upper = this.castCount % 3 === 0 || Math.random() < 0.24;
      this.state = upper ? 'castUpper' : 'castLower';
      this.stateTime = 0;
      this.spellReleased = false;
      this.vx = 0;
      this.vy = 0;
    }
  }

  private finishWarp(context: EnemyContext): void {
    const playerX = context.player.x + context.player.w / 2;
    const playerY = context.player.y + context.player.h / 2;
    const side = Math.random() < 0.5 ? -1 : 1;
    const distance = 150 + Math.random() * 120;
    const vertical = -100 + Math.random() * 120;

    this.x = playerX + side * distance - this.w / 2;
    this.y = playerY + vertical - this.h / 2;
    this.x = Math.max(40, Math.min(context.stage.width - this.w - 40, this.x));
    this.y = Math.max(70, Math.min(context.stage.height - this.h - 105, this.y));
    this.state = 'warpIn';
    this.stateTime = 0;
    this.warpCooldown = 3.8 + Math.random() * 2.4;
  }

  private releaseSpell(context: EnemyContext, tier: SpellTier): void {
    const sx = this.x + this.w / 2;
    const sy = this.y + this.h / 2;
    const tx = context.player.x + context.player.w / 2;
    const ty = context.player.y + context.player.h / 2;
    const baseAngle = Math.atan2(ty - sy, tx - sx);
    const upper = tier === 'upper';
    const count = upper ? 3 : 1;

    for (let index = 0; index < count; index += 1) {
      const spread = upper ? (index - 1) * 0.18 : 0;
      const angle = baseAngle + spread;
      const speed = upper ? UPPER_SPEED : LOWER_SPEED;
      const radius = upper ? 9 : 6;
      this.shots.push({
        x: sx - radius,
        y: sy - radius,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: SHOT_LIFE,
        radius,
        tier,
        alive: true,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateShots(dt: number, context: EnemyContext): void {
    for (const shot of this.shots) {
      if (!shot.alive) continue;
      shot.life -= dt;
      if (shot.life <= 0) {
        shot.alive = false;
        continue;
      }

      if ((this.element === 'light' || this.element === 'dark') && shot.tier === 'upper') {
        const tx = context.player.x + context.player.w / 2;
        const ty = context.player.y + context.player.h / 2;
        const cx = shot.x + shot.radius;
        const cy = shot.y + shot.radius;
        const dx = tx - cx;
        const dy = ty - cy;
        const distance = Math.max(1, Math.hypot(dx, dy));
        shot.vx += (dx / distance) * 38 * dt;
        shot.vy += (dy / distance) * 38 * dt;
      }

      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.phase += dt * 11;

      const size = shot.radius * 2;
      if (intersects({ x: shot.x, y: shot.y, w: size, h: size }, context.player)) {
        const baseDamage = shot.tier === 'upper' ? UPPER_DAMAGE : LOWER_DAMAGE;
        const damage = baseDamage + (this.element === 'fire' ? 2 : this.element === 'dark' ? 1 : 0);
        const hit = context.hurtPlayer(damage, shot.x + shot.radius);
        if (hit) this.applyElementEffect(context, shot.tier);
        shot.alive = false;
      }
    }

    for (let index = this.shots.length - 1; index >= 0; index -= 1) {
      if (!this.shots[index]!.alive) this.shots.splice(index, 1);
    }
  }

  private applyElementEffect(context: EnemyContext, tier: SpellTier): void {
    const upper = tier === 'upper';
    const lowerProc = Math.random() < 0.22;
    if (!upper && !lowerProc) return;

    switch (this.element) {
      case 'ice':
        context.freezePlayer(upper ? 2.2 : 1.0);
        break;
      case 'thunder':
        context.paralyzePlayer(upper ? 1.5 : 0.7);
        break;
      case 'wind':
        context.slowPlayer(upper ? 3.2 : 1.6);
        break;
      case 'dark':
        context.blindPlayer(upper ? 3.0 : 1.5);
        if (upper) context.silencePlayer(1.6);
        break;
      case 'light':
        if (upper) context.sealPlayer(1.4);
        break;
      case 'fire':
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawShots(ctx);

    const colors = ELEMENT_COLORS[this.element];
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2 + Math.sin(this.actionTime * 2.9 + this.hoverSeed) * 3.2;
    const casting = this.state === 'castLower' || this.state === 'castUpper';
    const upper = this.state === 'castUpper';
    const warpOut = this.state === 'warpOut';
    const warpIn = this.state === 'warpIn';

    let alpha = 1;
    if (warpOut) alpha = Math.max(0, 1 - this.stateTime / WARP_OUT_TIME);
    if (warpIn) alpha = Math.min(1, this.stateTime / WARP_IN_TIME);

    const pulse = casting ? 1 + Math.sin(this.stateTime * 13) * (upper ? 0.08 : 0.045) : 1;
    const halfW = 12 * pulse;
    const halfH = 16 * pulse;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(centerX, centerY);
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = casting ? (upper ? 18 : 12) : 8;

    ctx.fillStyle = colors.edge;
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(halfW, 0);
    ctx.lineTo(0, halfH);
    ctx.lineTo(-halfW, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = colors.core;
    ctx.beginPath();
    ctx.moveTo(0, -halfH + 4);
    ctx.lineTo(halfW - 4, 0);
    ctx.lineTo(0, 2);
    ctx.lineTo(-halfW + 4, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -halfH + 2);
    ctx.lineTo(0, halfH - 2);
    ctx.moveTo(-halfW + 2, 0);
    ctx.lineTo(halfW - 2, 0);
    ctx.stroke();

    if (casting) this.drawCasting(ctx, colors.edge, colors.core, upper);
    if (warpOut || warpIn) this.drawWarpRing(ctx, colors.edge, warpOut);
    ctx.restore();
  }

  private drawCasting(ctx: CanvasRenderingContext2D, edge: string, core: string, upper: boolean): void {
    const progress = Math.min(1, this.stateTime / (upper ? UPPER_CAST : LOWER_CAST));
    const radius = (upper ? 28 : 21) + Math.sin(this.stateTime * 9) * 2;
    ctx.save();
    ctx.rotate(this.stateTime * (upper ? 3.8 : 2.8));
    ctx.strokeStyle = edge;
    ctx.lineWidth = upper ? 2 : 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius * progress, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62 * progress, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    const count = upper ? 6 : 3;
    ctx.fillStyle = core;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.stateTime * 2.2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, upper ? 4 : 3, upper ? 4 : 3);
    }
    ctx.restore();
  }

  private drawWarpRing(ctx: CanvasRenderingContext2D, color: string, outgoing: boolean): void {
    const duration = outgoing ? WARP_OUT_TIME : WARP_IN_TIME;
    const progress = Math.min(1, this.stateTime / duration);
    const radius = outgoing ? 12 + progress * 30 : 40 - progress * 28;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = outgoing ? 1 - progress : progress;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawShots(ctx: CanvasRenderingContext2D): void {
    const colors = ELEMENT_COLORS[this.element];
    for (const shot of this.shots) {
      if (!shot.alive) continue;
      const cx = shot.x + shot.radius;
      const cy = shot.y + shot.radius;
      const pulse = 1 + Math.sin(shot.phase) * 0.16;
      const radius = shot.radius * pulse;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = shot.tier === 'upper' ? 12 : 7;
      ctx.fillStyle = colors.edge;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.core;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.48, 0, Math.PI * 2);
      ctx.fill();
      if (shot.tier === 'upper') {
        ctx.strokeStyle = colors.core;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
