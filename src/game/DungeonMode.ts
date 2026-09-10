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

// Shiren-like cumulative EXP curve.
// Lv1=0, Lv2=10, Lv3=30. This makes very early levels quick.
export const DUNGEON_PLAYER_EXP_THRESHOLDS: readonly number[] = [
  0,
  10,
  30,
  60,
  100,
  150,
  230,
  350,
  500,
  700,
  950,
  1200,
  1500,
  1800,
  2300,
  2800,
  3500,
  4200,
  5000,
  6000,
  7000,
  8000,
  10000,
  13000,
  16000,
  20000,
  25000,
  30000,
  36000,
  42000,
];

const DUNGEON_ENEMY_BASE_EXP: Record<EnemyKind, number> = {
  slime: 2,
  goblin: 4,
  rat: 3,
  snake: 5,
  bat: 6,
  caterpillar: 7,
  slug: 7,
  skeleton: 10,
  skeletonArcher: 12,
  bee: 8,
  roper: 12,
  frostMite: 10,
  ahriman: 15,
  redBee: 10,
  bomb: 14,
  kagenoko: 14,
  crystalEye: 20,
  elemental: 18,
  decaySlug: 16,
  totemEye: 18,
  mizaru: 18,
  iwazaru: 18,
  kikazaru: 18,
  kyokoki: 25,
  totemEyeDecay: 22,
  kyokokiPurple: 35,
};

export function getDungeonFloorConfig(floorNumber: number): DungeonFloorConfig | null {
  return DUNGEON_FLOORS.find((config) => config.floor === floorNumber) ?? null;
}

export function getDungeonPlayerLevelForExp(experience: number): number {
  const exp = Math.max(0, Math.floor(experience));
  let level = 1;

  for (let index = 1; index < DUNGEON_PLAYER_EXP_THRESHOLDS.length; index += 1) {
    if (exp < DUNGEON_PLAYER_EXP_THRESHOLDS[index]!) break;
    level = index + 1;
  }

  return level;
}

export function getDungeonNextLevelExperience(level: number): number | null {
  const normalizedLevel = Math.max(1, Math.floor(level));
  return DUNGEON_PLAYER_EXP_THRESHOLDS[normalizedLevel] ?? null;
}

export function getDungeonEnemyExperience(
  kind: EnemyKind,
  floorNumber: number,
): number {
  const base = DUNGEON_ENEMY_BASE_EXP[kind] ?? 3;
  // Small floor multiplier keeps expected player level rising roughly with depth
  // without hard-forcing a level on staircase use.
  const floorMultiplier = 1 + Math.max(0, floorNumber - 1) * 0.05;
  return Math.max(1, Math.round(base * floorMultiplier));
}
