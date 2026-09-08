import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/constants';
import type { Platform } from './Platform';
import { Stage, type StageLadder, type StageRoom } from './Stage';

export function createDungeonStage(
  floor: number,
  seed = Math.floor(Math.random() * 0x7fffffff),
): Stage {
  const mixedSeed = (seed ^ (floor * 7919) ^ 0x51f15e) >>> 0;
  const rng = mulberry32(mixedSeed);
  const platforms: Platform[] = [];
  const rooms: StageRoom[] = [];
  const mainPlatforms: Platform[] = [];

  // Eight strata instead of four: the vertical exploration length is doubled.
  const bandY = Array.from({ length: 8 }, (_, index) => 190 + index * 180);

  bandY.forEach((y, row) => {
    const dropCenter =
      row % 2 === 0
        ? 1220 + Math.floor((rng() - 0.5) * 90)
        : 150 + Math.floor((rng() - 0.5) * 90);

    const gaps =
      row < bandY.length - 1
        ? [
            { center: dropCenter, width: 112 + Math.floor(rng() * 24) },
            { center: 420 + Math.floor(rng() * 220), width: 52 + Math.floor(rng() * 28) },
            { center: 850 + Math.floor(rng() * 190), width: 52 + Math.floor(rng() * 24) },
          ]
        : [
            { center: 500 + Math.floor(rng() * 180), width: 58 },
            { center: 950 + Math.floor(rng() * 160), width: 58 },
          ];

    const segments = addFloorWithGaps(platforms, y, gaps);
    mainPlatforms.push(...segments);

    // Floating shelves are generated over a main segment, so every shelf
    // always has a vertical ladder route to a lower platform.
    for (let i = 0; i < 5; i += 1) {
      const base = segments[Math.floor(rng() * segments.length)];
      if (!base || base.w < 86) continue;

      const maxShelfW = Math.max(58, Math.min(150, base.w - 24));
      const minShelfW = Math.min(72, maxShelfW);
      const w = minShelfW + Math.floor(rng() * Math.max(1, maxShelfW - minShelfW + 1));
      const usable = Math.max(1, base.w - w - 24);
      const x = base.x + 12 + Math.floor(rng() * usable);
      const layer = i % 3;
      const py = Math.max(42, y - 48 - layer * 42 - Math.floor(rng() * 18));

      platforms.push({
        x,
        y: py,
        w,
        h: 28 + Math.floor(rng() * 14),
      });
    }

    const roomCount = 3 + Math.floor(rng() * 2);
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

  // Safety floor under the eighth stratum.
  const safetyFloor: Platform = {
    x: 0,
    y: WORLD_HEIGHT - 24,
    w: WORLD_WIDTH,
    h: 24,
  };
  platforms.push(safetyFloor);

  // One climbable ladder for every platform except the final safety floor.
  const ladders = buildLadders(platforms, safetyFloor);

  const spawnCandidates = mainPlatforms.filter((platform) => platform.w >= 150);
  const safeCandidates = spawnCandidates.length ? spawnCandidates : mainPlatforms;

  const spawnPlatform =
    safeCandidates[Math.floor(rng() * safeCandidates.length)] ??
    platforms[0] ??
    safetyFloor;

  const stairPool = safeCandidates.filter((platform) =>
    platform !== spawnPlatform &&
    (
      Math.abs(platform.y - spawnPlatform.y) >= 180 ||
      Math.abs(platform.x - spawnPlatform.x) >= 360
    )
  );
  const staircasePlatform =
    stairPool[Math.floor(rng() * stairPool.length)] ??
    safeCandidates.find((platform) => platform !== spawnPlatform) ??
    spawnPlatform;

  const spawn = pointOnPlatform(spawnPlatform, 18, 28, rng);
  const staircase = pointOnPlatform(staircasePlatform, 34, 34, rng);

  return new Stage(
    WORLD_WIDTH,
    WORLD_HEIGHT,
    platforms,
    ladders,
    spawn,
    staircase,
    rooms,
    mixedSeed,
  );
}

function addFloorWithGaps(
  platforms: Platform[],
  y: number,
  rawGaps: ReadonlyArray<{ center: number; width: number }>,
): Platform[] {
  const created: Platform[] = [];
  const gaps = rawGaps
    .map((gap) => ({
      start: Math.max(10, gap.center - gap.width / 2),
      end: Math.min(WORLD_WIDTH - 10, gap.center + gap.width / 2),
    }))
    .sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const gap of gaps) {
    if (gap.start - cursor > 55) {
      const platform = {
        x: cursor,
        y,
        w: gap.start - cursor,
        h: 34,
      };
      platforms.push(platform);
      created.push(platform);
    }
    cursor = Math.max(cursor, gap.end);
  }

  if (WORLD_WIDTH - cursor > 55) {
    const platform = {
      x: cursor,
      y,
      w: WORLD_WIDTH - cursor,
      h: 34,
    };
    platforms.push(platform);
    created.push(platform);
  }

  return created;
}

function buildLadders(
  platforms: readonly Platform[],
  safetyFloor: Platform,
): StageLadder[] {
  const ladders: StageLadder[] = [];
  const eligible = platforms.filter((platform) =>
    platform !== safetyFloor &&
    platform.w >= 58 &&
    platform.y < safetyFloor.y - 18
  );

  for (const upper of eligible) {
    const candidates = platforms
      .filter((lower) =>
        lower.y > upper.y + 38 &&
        horizontalOverlap(upper, lower) >= 28
      )
      .sort((a, b) => a.y - b.y);

    const lower = candidates[0];
    if (!lower) continue;

    const overlapLeft = Math.max(upper.x, lower.x) + 10;
    const overlapRight = Math.min(upper.x + upper.w, lower.x + lower.w) - 10;
    if (overlapRight - overlapLeft < 20) continue;

    const ladderW = 24;
    const preferred = upper.x + upper.w * 0.5 - ladderW * 0.5;
    const x = clamp(preferred, overlapLeft, overlapRight - ladderW);
    const topY = upper.y;
    const bottomY = lower.y;

    ladders.push({
      x,
      y: topY,
      w: ladderW,
      h: Math.max(42, bottomY - topY),
    });
  }

  return ladders;
}

function pointOnPlatform(
  platform: Platform,
  width: number,
  height: number,
  rng: () => number,
): { x: number; y: number } {
  const margin = Math.min(48, Math.max(14, platform.w * 0.12));
  const usable = Math.max(1, platform.w - margin * 2 - width);
  return {
    x: platform.x + margin + rng() * usable,
    y: platform.y - height,
  };
}

function horizontalOverlap(a: Platform, b: Platform): number {
  return Math.max(
    0,
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
  );
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
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
