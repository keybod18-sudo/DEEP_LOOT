import playerData from '../../data/player.json';
import enemyData from '../../data/enemies.json';

export const BALANCE = {
  player: playerData,
  slime: enemyData.slime,
  goblin: enemyData.goblin,
  ahriman: enemyData.ahriman,
  snake: enemyData.snake,
  bat: enemyData.bat,
  roper: enemyData.roper,
  slug: enemyData.slug,
  rat: enemyData.rat,
  skeleton: enemyData.skeleton,
  skeletonArcher: enemyData.skeletonArcher,
  bomb: enemyData.bomb,
  caterpillar: enemyData.caterpillar,
  frostMite: enemyData.frostMite,
  crystalEye: enemyData.crystalEye,
  fireball: enemyData.fireball,
  thunder: enemyData.thunder,
  enemyKnockback: enemyData.knockback,
} as const;
