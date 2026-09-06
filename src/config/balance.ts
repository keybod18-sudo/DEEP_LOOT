import playerData from '../../data/player.json';
import enemyData from '../../data/enemies.json';

export const BALANCE = {
  player: playerData,
  slime: enemyData.slime,
  goblin: enemyData.goblin,
  enemyKnockback: enemyData.knockback,
} as const;
