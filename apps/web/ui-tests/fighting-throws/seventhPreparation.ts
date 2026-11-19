import { EMPTY_INPUT, type FightState, type FightSide } from '$lib/fighting/types'
import { performMove, performAuraAttack, tickFight } from '$lib/fighting/engine'
import { performSecretWindowCommand } from '$lib/fighting/secretWindowArsenal'

export interface SeventhPreparation {
  bird?: boolean
  console?: boolean
  offer?: boolean
  owl?: boolean
  side: FightSide
}
/** Prepare through the real game commands; the capture never supplies a free ability state. */
export function prepareSeventh(state: FightState, options: SeventhPreparation): FightState {
  const { side } = options
  if (options.bird) {
    const bird = state.battlefield?.entities.find(
      (entry) => entry.kind === 'bird' && entry.owner === side,
    )
    if (bird) {
      const x = bird.x - state[side].facing * 3,
        victim = side === 'player' ? 'opponent' : 'player'
      state = {
        ...state,
        [side]: { ...state[side], x },
        [victim]: { ...state[victim], x: x + state[side].facing * 5 },
      }
      state = performMove({ state, side, action: 'special' })
    }
  }
  if (options.console || options.offer) state = performMove({ state, side, action: 'special' })
  if (options.owl)
    state = performSecretWindowCommand(
      { state, side, command: { action: 'window-listen' } },
      performAuraAttack,
    )
  return advance(state, options.bird ? 20 : 45)
}
function advance(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
