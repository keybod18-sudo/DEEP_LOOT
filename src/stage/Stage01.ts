import { createDungeonStage } from './DungeonGenerator';
import type { Stage } from './Stage';

export function createStage01(): Stage {
  return createDungeonStage(1);
}
