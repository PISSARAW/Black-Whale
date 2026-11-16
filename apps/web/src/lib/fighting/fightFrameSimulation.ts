import { advanceEasterEggs } from './easterEggs'
import { simulateVoconteDoorFrame } from './voconteDoorFrame'
import { stepTrainingFrame } from './trainingFrame'
import type { FutureControls } from './parallelFutureTypes'
import type { FightInput, FightState } from './types'
import type { TrainingAction } from './trainingTypes'

interface FrameEngine {
  step: (state: FightState, input: FightInput, opponent?: FightInput) => FightState
  decide: (state: FightState) => FightState
  attack: (state: FightState, action: TrainingAction, input: FightInput) => FightState
}

export function simulateClashFrame(
  state: FightState,
  controls: FutureControls,
  engine: FrameEngine,
): FightState {
  return stepTrainingFrame(state, controls, {
    simulate: (current, inputs) =>
      advanceEasterEggs(simulateVoconteDoorFrame(current, inputs, engine), current.hitstop === 0),
    attack: engine.attack,
  })
}
