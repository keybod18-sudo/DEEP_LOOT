import type { EnemyKind } from '../enemies/Enemy';

export type GameMode = 'default' | 'dungeon' | 'debug';

export interface DungeonFloorEnemy {
  kind: EnemyKind;
  count: number;
  level: number;
}

export interface DungeonFloorConfig {
  floor: number;
  enemyLevel: number;
  enemies: readonly DungeonFloorEnemy[];
}

export const GAME_MODE_LABELS: Record<GameMode, string> = {
  default: 'デフォルト',
  dungeon: 'ダンジョン',
  debug: 'デバッグ',
};

const floor = (
  floorNumber: number,
  enemyLevel: number,
  enemies: Array<[EnemyKind, number]>,
): DungeonFloorConfig => ({
  floor: floorNumber,
  enemyLevel,
  enemies: enemies.map(([kind, count]) => ({ kind, count, level: enemyLevel })),
});

export const DUNGEON_FLOORS: readonly DungeonFloorConfig[] = [
  floor(1, 1, [['slime', 7], ['goblin', 4], ['rat', 3]]),
  floor(2, 1, [['slime', 6], ['goblin', 5], ['rat', 4]]),
  floor(3, 1, [['slime', 5], ['goblin', 5], ['snake', 3], ['rat', 3]]),
  floor(4, 2, [['goblin', 5], ['snake', 4], ['bat', 3], ['rat', 3]]),
  floor(5, 2, [['goblin', 4], ['snake', 4], ['caterpillar', 4], ['bat', 3]]),
  floor(6, 2, [['skeleton', 4], ['goblin', 4], ['slug', 3], ['caterpillar', 4]]),
  floor(7, 3, [['skeleton', 5], ['skeletonArcher', 2], ['bee', 4], ['rat', 3]]),
  floor(8, 3, [['roper', 2], ['frostMite', 4], ['bee', 4], ['bat', 3]]),
  floor(9, 3, [['ahriman', 2], ['skeleton', 4], ['skeletonArcher', 3], ['redBee', 3]]),
  floor(10, 4, [['bomb', 3], ['kagenoko', 4], ['roper', 3], ['caterpillar', 4]]),
  floor(11, 4, [['crystalEye', 2], ['elemental', 3], ['skeleton', 4], ['bee', 4]]),
  floor(12, 4, [['decaySlug', 3], ['totemEye', 2], ['frostMite', 4], ['ahriman', 3]]),
  floor(13, 5, [['mizaru', 2], ['iwazaru', 2], ['kikazaru', 2], ['kagenoko', 4], ['redBee', 3]]),
  floor(14, 5, [['kyokoki', 2], ['elemental', 4], ['skeletonArcher', 3], ['totemEyeDecay', 2]]),
  floor(15, 6, [['kyokokiPurple', 2], ['kyokoki', 2], ['crystalEye', 2], ['elemental', 4], ['ahriman', 3], ['redBee', 3], ['totemEyeDecay', 2]]),
];

export function getDungeonFloorConfig(floorNumber: number): DungeonFloorConfig | null {
  return DUNGEON_FLOORS.find((config) => config.floor === floorNumber) ?? null;
}
