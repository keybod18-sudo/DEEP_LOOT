import { BALANCE } from '../config/balance';
import type { Enemy } from '../enemies/Enemy';

export function applyEnemyKnockback(enemy: Enemy, playerCenterX: number, multiplier = 1): void {
  const enemyCenterX = enemy.x + enemy.w / 2;
  const direction = enemyCenterX >= playerCenterX ? 1 : -1;

  enemy.knockbackTime = BALANCE.enemyKnockback.duration;
  enemy.vx = direction * BALANCE.enemyKnockback.x * multiplier;
  enemy.vy = -BALANCE.enemyKnockback.y * Math.min(1.2, multiplier);
  enemy.grounded = false;
  enemy.actionTime = 0;
  enemy.cooldown = Math.max(enemy.cooldown, 0.45);
  enemy.interruptForKnockback();
}
