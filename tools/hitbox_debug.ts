// 将来のデバッグ描画用。
// Game.draw() から Rect を受けて半透明矩形を描く用途に使う。
export function drawDebugRect(ctx: CanvasRenderingContext2D, rect: {x:number;y:number;w:number;h:number}): void {
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#fff';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}
