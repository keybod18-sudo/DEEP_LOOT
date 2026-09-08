import type { Facing } from '../game/types';

const attackFrameUrls = [1, 2, 3, 4, 5].map((index) =>
  new URL(`../../assets/player/attack/attack_0${index}.png`, import.meta.url).href,
);
const walkFrameUrls = [1, 2, 3, 4, 5, 6].map((index) =>
  new URL(`../../assets/player/walk/walk_0${index}.png`, import.meta.url).href,
);

export class PlayerRenderer {
  private readonly attackFrames: HTMLImageElement[] = [];
  private readonly walkFrames: HTMLImageElement[] = [];

  async load(): Promise<void> {
    const [attack, walk] = await Promise.all([
      Promise.all(attackFrameUrls.map(loadImage)),
      Promise.all(walkFrameUrls.map(loadImage)),
    ]);
    this.attackFrames.push(...attack);
    this.walkFrames.push(...walk);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    facing: Facing,
    frame: number,
    invulnerability: number,
    moving: boolean,
    walkTime: number,
    sleeping: boolean,
    frozen: boolean,
    poisoned: boolean,
    slowed: boolean,
    paralyzed: boolean,
    silenced: boolean,
    blinded: boolean,
    paralysisStunned: boolean,
  ): void {
    const now = performance.now() / 1000;
    const attacking = frame > 0 && !sleeping && !frozen;
    const image = attacking
      ? (this.attackFrames[frame] ?? this.attackFrames[0])
      : moving
        ? (this.walkFrames[Math.floor(walkTime * 11) % this.walkFrames.length] ?? this.walkFrames[0])
        : this.attackFrames[0];
    if (!image) return;

    const centerX = x + w / 2;
    const footY = y + h + 6;

    if (sleeping) {
      this.drawSleeping(ctx, image, centerX, footY, facing, invulnerability, now);
      this.drawStatusEffects(ctx, centerX, footY, now, poisoned, slowed, paralyzed, silenced, blinded, paralysisStunned);
      return;
    }

    ctx.save();
    ctx.translate(centerX, footY);
    if (facing < 0) ctx.scale(-1, 1);

    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    const drawH = attacking ? 82 : 79;
    const aspect = image.naturalWidth / image.naturalHeight;
    const drawW = Math.round(drawH * aspect);
    ctx.drawImage(image, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();

    if (frozen) this.drawFrozenShell(ctx, centerX, footY, now);
    this.drawStatusEffects(ctx, centerX, footY, now, poisoned, slowed, paralyzed, silenced, blinded, paralysisStunned);
  }

  private drawStatusEffects(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
    poisoned: boolean,
    slowed: boolean,
    paralyzed: boolean,
    silenced: boolean,
    blinded: boolean,
    paralysisStunned: boolean,
  ): void {
    if (slowed) this.drawSlowFrame(ctx, centerX, footY, time);
    if (poisoned) this.drawPoisonBubbles(ctx, centerX, footY, time);
    if (paralyzed) this.drawParalysisMark(ctx, centerX, footY, time);
    if (paralysisStunned) this.drawParalysisShock(ctx, centerX, footY, time);
    if (silenced) this.drawSilenceBubble(ctx, centerX, footY, time);
    if (blinded) this.drawBlindMark(ctx, centerX, footY, time);
  }

  private drawSlowFrame(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const colors = ['#72e7ff', '#2f7dff', '#8d4cff', '#72e7ff'];
    const color = colors[Math.floor(time * 7) % colors.length] ?? colors[0];
    const pulse = 0.62 + (Math.sin(time * 18) + 1) * 0.16;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(Math.round(centerX - 29), Math.round(footY - 86), 58, 87);
    ctx.globalAlpha = pulse * 0.42;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(centerX - 33), Math.round(footY - 90), 66, 95);
    ctx.restore();
  }
  private drawSilenceBubble(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const y = footY - 98 + Math.sin(time * 3.2) * 1.2;
    ctx.save();
    ctx.fillStyle = '#e8e8e4';
    ctx.strokeStyle = '#7d7d78';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, y, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - 4, y + 10);
    ctx.lineTo(centerX - 8, y + 17);
    ctx.lineTo(centerX + 1, y + 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3d3d3a';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(centerX + i * 7, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  private drawParalysisMark(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const x = centerX + 25;
    const y = footY - 79 + Math.sin(time * 5) * 1.4;
    ctx.save();
    ctx.fillStyle = '#fff06a';
    ctx.strokeStyle = '#9a7810';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#5d4500';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 7);
    ctx.lineTo(x - 3, y);
    ctx.lineTo(x + 2, y);
    ctx.lineTo(x - 2, y + 7);
    ctx.stroke();
    ctx.restore();
  }
  private drawBlindMark(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const x = centerX - 25;
    const y = footY - 79 + Math.sin(time * 4.3) * 1.2;
    ctx.save();
    ctx.fillStyle = '#2b2834';
    ctx.strokeStyle = '#9f94c4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e1daf7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.quadraticCurveTo(x, y - 5, x + 6, y);
    ctx.quadraticCurveTo(x, y + 5, x - 6, y);
    ctx.stroke();
    ctx.strokeStyle = '#ff7d9c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - 7);
    ctx.lineTo(x + 7, y + 7);
    ctx.stroke();
    ctx.restore();
  }
  private drawPoisonBubbles(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    ctx.save();

    for (let i = 0; i < 7; i += 1) {
      const cycle = (time * (0.62 + i * 0.035) + i * 0.143) % 1;
      const side = i % 2 === 0 ? -1 : 1;
      const drift = Math.sin(time * 2.8 + i * 1.7) * (3 + (i % 3));
      const x = centerX + side * (9 + (i * 5) % 15) + drift;
      const y = footY - 8 - cycle * 72;
      const radius = 2 + (i % 4);
      const fade = Math.min(1, cycle * 4) * Math.min(1, (1 - cycle) * 5);

      ctx.globalAlpha = 0.32 + fade * 0.48;
      ctx.fillStyle = i % 3 === 0 ? '#9dff48' : '#46d84f';
      ctx.strokeStyle = '#174f25';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 0.5 * fade;
      ctx.fillStyle = '#ddff9b';
      ctx.fillRect(Math.round(x - radius * 0.35), Math.round(y - radius * 0.45), 1.5, 1.5);

      if (cycle > 0.9) {
        const pop = (cycle - 0.9) / 0.1;
        ctx.globalAlpha = (1 - pop) * 0.42;
        ctx.strokeStyle = '#79f05b';
        ctx.beginPath();
        ctx.arc(x, y, radius + pop * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawParalysisShock(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const flicker = Math.floor(time * 34);
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'square';

    for (let i = 0; i < 4; i += 1) {
      const phase = flicker + i * 17;
      const side = i % 2 === 0 ? -1 : 1;
      const topY = footY - 75 + ((phase * 13) % 17);
      const baseX = centerX + side * (15 + ((phase * 7) % 8));

      ctx.globalAlpha = 0.72 + ((phase & 1) ? 0.18 : 0);
      ctx.strokeStyle = '#ffe84a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(baseX, topY);
      ctx.lineTo(baseX - side * 7, topY + 12);
      ctx.lineTo(baseX + side * 4, topY + 20);
      ctx.lineTo(baseX - side * 9, topY + 33);
      ctx.lineTo(baseX + side * 2, topY + 43);
      ctx.stroke();

      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = '#fffbd0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#fff36b';
    for (let i = 0; i < 5; i += 1) {
      const px = centerX - 21 + ((flicker * 11 + i * 19) % 43);
      const py = footY - 68 + ((flicker * 7 + i * 13) % 59);
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }

    ctx.restore();
  }

  private drawSleeping(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    centerX: number,
    footY: number,
    facing: Facing,
    invulnerability: number,
    time: number,
  ): void {
    const breathe = (Math.sin(time * 3.1) + 1) * 0.5;
    const twitch = Math.sin(time * 8.5) > 0.92 ? 1.8 : 0;
    const drawH = 70;
    const aspect = image.naturalWidth / image.naturalHeight;
    const drawW = Math.round(drawH * aspect);

    ctx.save();
    ctx.translate(centerX + facing * 4, footY - 4 + twitch);
    ctx.rotate(facing * (Math.PI / 2 - 0.08));
    if (facing < 0) ctx.scale(-1, 1);
    if (invulnerability > 0 && Math.floor(invulnerability * 14) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.scale(1 + breathe * 0.018, 1 - breathe * 0.028);
    ctx.drawImage(image, -drawW / 2, -drawH + 24, drawW, drawH);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 15px system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d9e7ff';
    const rise = (time * 16) % 18;
    const alpha = 1 - rise / 22;
    ctx.globalAlpha = Math.max(0.15, alpha);
    ctx.fillText('Z', centerX + 22, footY - 50 - rise);
    ctx.font = 'bold 11px system-ui';
    ctx.fillText('Z', centerX + 34, footY - 65 - rise * 0.72);
    ctx.restore();
  }

  private drawFrozenShell(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    footY: number,
    time: number,
  ): void {
    const pulse = (Math.sin(time * 5.8) + 1) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.24 + pulse * 0.08;
    ctx.fillStyle = '#7be9ff';
    ctx.beginPath();
    ctx.moveTo(centerX - 22, footY - 2);
    ctx.lineTo(centerX - 27, footY - 38);
    ctx.lineTo(centerX - 12, footY - 78);
    ctx.lineTo(centerX + 9, footY - 88);
    ctx.lineTo(centerX + 28, footY - 55);
    ctx.lineTo(centerX + 24, footY - 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = '#bff8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 14, footY - 18);
    ctx.lineTo(centerX - 2, footY - 42);
    ctx.lineTo(centerX - 9, footY - 62);
    ctx.moveTo(centerX + 15, footY - 14);
    ctx.lineTo(centerX + 5, footY - 37);
    ctx.lineTo(centerX + 15, footY - 58);
    ctx.stroke();

    ctx.fillStyle = '#e9ffff';
    for (let i = 0; i < 5; i += 1) {
      const sparkle = (Math.floor(time * 8) + i * 3) % 5;
      if (sparkle !== 0) continue;
      ctx.fillRect(centerX - 18 + i * 9, footY - 72 + (i % 2) * 18, 2, 2);
    }
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`画像を読み込めません: ${src}`));
    image.src = src;
  });
}
