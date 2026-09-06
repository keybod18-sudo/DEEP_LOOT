import stageData from '../../data/stages/stage01.json';
import { Stage } from './Stage';

export function createStage01(): Stage {
  return new Stage(stageData.platforms);
}
