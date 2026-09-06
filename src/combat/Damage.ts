import { applyEnemyKnockback } from './Knockback';
import type { Enemy } from '../enemies/Enemy';

export function damageEnemy(
  enemy: Enemy,
  damage: number,
  playerCenterX: number,
  knockbackMultiplier = 1,
): boolean {
  enemy.hp -= damage;

  if (enemy.hp <= 0) {
    enemy.hp = 0;
    return true;
  }

  applyEnemyKnockback(enemy, playerCenterX, knockbackMultiplier);
  return false;
}
