import { prepareCommandHands } from './commandHands'
import { observeFightCommand } from './commandFeedback'
import { performAuraAttack, performMove, performThrow } from './engine'
import { observeTrainingCommand } from './trainingHistory'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'
import type { TrainingAction } from './trainingTypes'
import { bufferDirectMove } from './directFightBuffer'

/** The lab observes attempted commands without changing the combat engine's no-op contract. */
export function performTrainingAction(options: {
  state: FightState
  side: FightSide
  action: TrainingAction
  input?: FightInput
}): FightState {
  const { state, side, action, input } = options
  const deferred = bufferDirectMove(state, { side, action, input })
  if (deferred) return deferred
  return observeFightCommand(prepareCommandHands(options.state, options), options, (current) =>
    observeTrainingCommand(current, options, (state) => {
      const { side, action, input = EMPTY_INPUT } = options
      if (action === 'throw') return performThrow(state, side, input)
      if (action === 'ranged')
        return performAuraAttack({ state, side, kind: 'ranged', auraCharged: input.aura })
      return performMove({ state, side, action, input })
    }),
  )
}
