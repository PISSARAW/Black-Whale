import type { FighterHatsu } from './contract'

const MIN_X = 7
const MAX_X = 93

export const hisokaHatsu: FighterHatsu = {
  id: 'hisoka',
  onTrigger: ({ state, side }) => {
    if (state.bungeeGum?.owner !== side) return state
    const targetSide = state.bungeeGum.target
    const owner = state[side]
    const target = state[targetSide]
    const direction = target.x >= owner.x ? 1 : -1
    return {
      ...state,
      bungeeGum: null,
      [targetSide]: { ...target, x: clamp(owner.x + direction * 9, MIN_X, MAX_X) },
    }
  },
  onImpact: ({ state, side, defenderSide, blocked, concealed }) =>
    blocked
      ? state
      : { ...state, bungeeGum: { owner: side, target: defenderSide, hidden: concealed } },
  onFrame: (state) => state,
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
