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
  floor(1, 1, [
    ['slime', 8],
    ['goblin', 4],
  ]),
  floor(2, 1, [
    ['slime', 7],
    ['goblin', 6],
  ]),
  floor(3, 2, [
    ['slime', 5],
    ['goblin', 6],
    ['rat', 4],
  ]),
  floor(4, 2, [
    ['goblin', 6],
    ['snake', 5],
    ['rat', 4],
  ]),
  floor(5, 3, [
    ['goblin', 6],
    ['bat', 4],
    ['caterpillar', 5],
  ]),
  floor(6, 3, [
    ['slime', 4],
    ['goblin', 5],
    ['skeleton', 5],
    ['slug', 3],
  ]),
  floor(7, 3, [
    ['skeleton', 5],
    ['skeletonArcher', 3],
    ['bee', 4],
    ['rat', 4],
  ]),
  floor(8, 4, [
    ['goblin', 4],
    ['roper', 3],
    ['frostMite', 4],
    ['bat', 4],
  ]),
  floor(9, 4, [
    ['ahriman', 3],
    ['skeleton', 5],
    ['skeletonArcher', 3],
    ['redBee', 4],
  ]),
  floor(10, 4, [
    ['bomb', 4],
    ['kagenoko', 4],
    ['caterpillar', 4],
    ['roper', 3],
  ]),
  floor(11, 5, [
    ['crystalEye', 2],
    ['elemental', 4],
    ['skeleton', 5],
    ['bee', 4],
  ]),
  floor(12, 5, [
    ['decaySlug', 3],
    ['totemEye', 3],
    ['frostMite', 4],
    ['ahriman', 3],
  ]),
  floor(13, 5, [
    ['mizaru', 2],
    ['iwazaru', 2],
    ['kikazaru', 2],
    ['kagenoko', 4],
    ['redBee', 4],
  ]),
  floor(14, 6, [
    ['kyokoki', 2],
    ['elemental', 5],
    ['skeletonArcher', 4],
    ['totemEyeDecay', 3],
  ]),
  floor(15, 6, [
    ['kyokokiPurple', 2],
    ['kyokoki', 2],
    ['crystalEye', 2],
    ['elemental', 4],
    ['ahriman', 3],
    ['redBee', 4],
    ['totemEyeDecay', 2],
  ]),
];

export function getDungeonFloorConfig(floorNumber: number): DungeonFloorConfig | null {
  return DUNGEON_FLOORS.find((config) => config.floor === floorNumber) ?? null;
}
