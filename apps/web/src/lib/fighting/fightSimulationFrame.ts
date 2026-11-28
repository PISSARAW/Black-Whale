import { performArsenalAction } from './arsenalExecution'
import type { AuraAttackOptions } from './auraAttackAction'
import { stepPostMortemOrFuture } from './camillaFrame'
import { stepParallelFuture } from './parallelFuture'
import type { FutureControls, SimulateFutureFrame } from './parallelFutureTypes'
import type { FightState } from './types'

export function fightSimulationFrame(
  state: FightState,
  controls: FutureControls,
  actions: {
    simulate: SimulateFutureFrame
    auraAttack: (options: AuraAttackOptions) => FightState
  },
): FightState {
  return stepPostMortemOrFuture(state, () =>
    stepParallelFuture(state, controls, {
      simulate: actions.simulate,
      replay: (current, command) =>
        command.arsenal
          ? performArsenalAction(
              { state: current, side: 'opponent', command: command.arsenal },
              actions.auraAttack,
            )
          : actions.auraAttack({ state: current, side: 'opponent', ...command }),
    }),
  )
}
