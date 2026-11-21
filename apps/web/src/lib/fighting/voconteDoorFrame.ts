import { advanceAiCadence } from './aiCadence'
import { doorBodyPositions, doorFramesFor, transportDoorBodies } from './voconteDoors'
import type { FutureControls } from './parallelFutureTypes'
import type { FightInput, FightState } from './types'

interface DoorFrameEngine {
  step: (state: FightState, input: FightInput, opponentInput?: FightInput) => FightState
  decide: (state: FightState) => FightState
}

/** Doors see movement before collision, then knockback after collision, at most once per body per frame. */
export function simulateVoconteDoorFrame(
  state: FightState,
  controls: FutureControls,
  engine: DoorFrameEngine,
): FightState {
  const prepared = state.voconteDoors
    ? {
        ...state,
        voconteDoors: { ...state.voconteDoors, origins: doorBodyPositions(state), transported: [] },
      }
    : state
  let next = engine.step(prepared, controls.player, controls.opponent)
  if (next.phase === 'fighting' && prepared.hitstop === 0)
    next = faceDoorArrival(transportDoorBodies(next))
  return controls.ai && !controls.opponent && !next.catsName
    ? advanceAiCadence(next, engine.decide)
    : next
}

/** Standard pushbox facing must not overwrite the threshold's arrival orientation. */
function faceDoorArrival(state: FightState): FightState {
  let next = state
  for (const side of state.voconteDoors?.transported ?? []) {
    const transit = state.voconteDoors?.lastTransit?.[side]
    const exit = transit && doorFramesFor(state, transit.owner).find((f) => f.id === transit.to)
    if (exit) next = { ...next, [side]: { ...next[side], facing: exit.arrivalFacing } }
  }
  return next
}
