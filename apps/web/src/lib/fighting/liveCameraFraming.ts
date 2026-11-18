import { fightWorldX } from './fightCoordinates'
import { projectionCameraSpan } from './rosterGuestScene'
import { camillaCameraSpan } from './camillaCamera'
import { biscuitCameraFrame } from './biscuitCamera'
import { sceneryCameraFrame } from './stageCamera'
import type { FightScenery } from './stageKit'
import type { FightState } from './types'

/** Shared combat frame continues underneath authored throws, ready for their handoff. */
export function liveCameraFraming(options: {
  state: FightState
  positions: [number, number]
  aspect: number
  scenery: Pick<FightScenery, 'framing'>
}) {
  const { state, aspect, scenery } = options
  const pair = projectionCameraSpan(state, options.positions, fightWorldX)
  const span = camillaCameraSpan({ state, ...pair, worldX: fightWorldX })
  const base = sceneryCameraFrame(biscuitCameraFrame({ state, ...span, aspect }), scenery)
  return { span, base }
}
