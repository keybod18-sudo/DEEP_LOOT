import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants';
import type { Platform } from './Platform';
import { Stage, type StageRoom } from './Stage';

export function createDungeonStage(
  floor: number,
  seed = Math.floor(Math.random() * 0x7fffffff),
): Stage {
  const mixedSeed = (seed ^ (floor * 7919) ^ 0x51f15e) >>> 0;
  const rng = mulberry32(mixedSeed);
  const platforms: Platform[] = [];
  const rooms: StageRoom[] = [];

  const bandY = [190, 370, 550, 730];
  const mainDrops = [1250, 120, 1240];

  // Four large horizontal strata, connected by alternating drop shafts.
  bandY.forEach((y, row) => {
    if (row < 3) {
      const dropCenter = mainDrops[row]! + Math.floor((rng() - 0.5) * 70);
      addFloorWithGaps(platforms, y, [
        { center: dropCenter, width: 118 },
        { center: 420 + Math.floor(rng() * 220), width: 58 + Math.floor(rng() * 22) },
        { center: 860 + Math.floor(rng() * 170), width: 58 + Math.floor(rng() * 18) },
      ]);
    } else {
      addFloorWithGaps(platforms, y, [
        { center: 520 + Math.floor(rng() * 160), width: 62 },
        { center: 940 + Math.floor(rng() * 130), width: 62 },
      ]);
    }

    // Floating shelves, side chambers and alternate paths.
    for (let i = 0; i < 8; i += 1) {
      const w = 72 + Math.floor(rng() * 96);
      const x = 34 + Math.floor(rng() * (WORLD_WIDTH - w - 68));
      const layer = i % 3;
      const py = y - 46 - layer * 43 - Math.floor(rng() * 24);
      platforms.push({ x, y: py, w, h: 30 + Math.floor(rng() * 18) });
    }

    const roomCount = 4 + Math.floor(rng() * 2);
    for (let i = 0; i < roomCount; i += 1) {
      const rw = 170 + Math.floor(rng() * 190);
      const rh = 90 + Math.floor(rng() * 55);
      rooms.push({
        x: 25 + Math.floor(rng() * (WORLD_WIDTH - rw - 50)),
        y: Math.max(20, y - rh - 25),
        w: rw,
        h: rh,
        tone: Math.floor(rng() * 4),
      });
    }
  });

  // Deep safety floor under the last stratum; player can never fall out of the map.
  platforms.push({ x: 0, y: WORLD_HEIGHT - 24, w: WORLD_WIDTH, h: 24 });

  // Short stepping platforms near the alternating shafts to prevent soft-locks.
  platforms.push({ x: 1160, y: 292, w: 170, h: 26 });
  platforms.push({ x: 55, y: 472, w: 180, h: 26 });
  platforms.push({ x: 1160, y: 652, w: 180, h: 26 });

  const spawn = { x: 44, y: bandY[0]! - 36 };
  const staircase = { x: 76, y: bandY[3]! - 34 };

  return new Stage(WORLD_WIDTH, WORLD_HEIGHT, platforms, spawn, staircase, rooms, mixedSeed);
}

function addFloorWithGaps(
  platforms: Platform[],
  y: number,
  rawGaps: ReadonlyArray<{ center: number; width: number }>,
): void {
  const gaps = rawGaps
    .map((gap) => ({
      start: Math.max(10, gap.center - gap.width / 2),
      end: Math.min(WORLD_WIDTH - 10, gap.center + gap.width / 2),
    }))
    .sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const gap of gaps) {
    if (gap.start - cursor > 55) {
      platforms.push({ x: cursor, y, w: gap.start - cursor, h: 34 });
    }
    cursor = Math.max(cursor, gap.end);
  }
  if (WORLD_WIDTH - cursor > 55) {
    platforms.push({ x: cursor, y, w: WORLD_WIDTH - cursor, h: 34 });
  }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
