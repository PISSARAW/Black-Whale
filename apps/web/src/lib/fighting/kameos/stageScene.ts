import { createExtraBodyScenes } from '../rosterGuestScene'
import type { ProjectionSceneOptions } from '../hanzoProjectionScene'
import type { FightState } from '../types'
import { createKameoScene } from './scene'

/**
 * Every body beside the two leaders: Hanzo's sleeping body, roster guests, and the
 * kameos. FightScene imports this one entry point under its historical name.
 */
export function createExtraBodiesWithKameos(options: ProjectionSceneOptions) {
  const extras = createExtraBodyScenes(options)
  const kameos = createKameoScene(options)
  return {
    sync(state: FightState, seconds: number) {
      extras.sync(state, seconds)
      kameos.sync(state, seconds)
    },
    dispose() {
      extras.dispose()
      kameos.dispose()
    },
  }
}

export { createExtraBodiesWithKameos as createHanzoProjectionScene }
export { projectionCameraSpan } from '../rosterGuestScene'
