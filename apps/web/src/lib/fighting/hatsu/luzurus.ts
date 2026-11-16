import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu } from './contract'
const FRAMES = 90
export const luzurusHatsu: FighterHatsu = {
  id: 'luzurus',
  onTrigger: unchangedTrigger,
  onImpact: ({ state, defenderSide, blocked }) => (blocked ? state : bind(state, defenderSide)),
  onFrame: (state) => ({ ...state, player: tick(state.player), opponent: tick(state.opponent) }),
}
function bind(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  return {
    ...state,
    [side]: { ...fighter, hatsuEffects: { ...fighter.hatsuEffects, desireFrames: FRAMES } },
  }
}
function tick(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.hatsuEffects.desireFrames
  return frames > 0
    ? {
        ...fighter,
        hitStun: Math.max(fighter.hitStun, 2),
        hatsuEffects: { ...fighter.hatsuEffects, desireFrames: frames - 1 },
      }
    : fighter
}
