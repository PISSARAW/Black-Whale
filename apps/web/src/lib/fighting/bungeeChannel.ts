import { withLoanCarrier } from './dolphinBorrowing'
import { withDolphinSupply } from './dolphinSupply'
import type { GumSource } from './bungeeSource'
import type { FightSide, FightState } from './types'

/** Each connection uses its own Nen channel even inside a borrowed Hatsu's frame callback. */
export function withGumChannel(
  state: FightState,
  binding: GumSource & { side: FightSide },
  run: (state: FightState) => FightState,
): FightState {
  const { side } = binding
  const actor = state[side]
  const context = actor.dolphinExecution
  if (binding.source === 'dolphin') {
    if (context) return run(state)
    return withLoanCarrier(state, { side }, (loan) => withDolphinSupply(loan, side, run))
  }
  if (!context) return run(state)
  const prepared = {
    ...state,
    [side]: {
      ...actor,
      id: actor.nenOwner ?? actor.id,
      aura: context.ownAura,
      auraExhausted: context.ownExhausted,
      nen: context.ownNen,
      dolphinExecution: undefined,
    },
  }
  const next = run(prepared)
  if (next === prepared) return state
  const after = next[side]
  return {
    ...next,
    [side]: {
      ...after,
      id: actor.id,
      nenOwner: actor.nenOwner,
      aura: actor.aura,
      auraExhausted: actor.auraExhausted,
      nen: actor.nen,
      dolphinExecution: {
        ...context,
        ownAura: after.aura,
        ownExhausted: after.auraExhausted,
        ownNen: after.nen,
      },
    },
  }
}
