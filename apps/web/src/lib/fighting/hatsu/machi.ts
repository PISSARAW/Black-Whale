import { advanceMachiMaterial, sutureWound } from '../machiMaterial'
import { attackPhase } from '../frameData'
import {
  advanceMachiThreads,
  machiMoveId,
  machiSourceActive,
  releaseMachiThread,
} from '../machiThread'
import type { FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

export const machiHatsu: FighterHatsu = {
  id: 'machi',
  onTrigger: unchangedTrigger,
  onImpact: threadImpact,
  onFrame: (state) =>
    advanceMachiMaterial(advanceMachiThreads(suture(suture(state, 'player'), 'opponent'))),
}

function threadImpact(context: HatsuImpactContext): FightState {
  const { state, side, defenderSide, blocked, moveId } = context
  if (blocked || !machiSourceActive(state[side])) return state
  if (moveId === 'machi:finisher') return releaseMachiThread(state, side)
  const kind =
    moveId === 'machi:forwardSpecial' ? 'mark' : moveId === 'machi:downSpecial' ? 'bind' : null
  if (!kind) return state
  const target = state[defenderSide]
  return {
    ...state,
    [defenderSide]: {
      ...target,
      machiThread: { owner: side, kind, x: target.x, y: target.y },
      hatsuEffects: { ...target.hatsuEffects, stitchedFrames: Number(kind === 'bind') },
    },
  }
}

function suture(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (machiMoveId(fighter) !== 'machi:neutralSpecial' || !fighter.attack) return state
  if (fighter.attack.impacted || attackPhase(fighter) !== 'active' || !machiSourceActive(fighter))
    return state
  return {
    ...state,
    [side]: {
      ...sutureWound(fighter),
      attack: { ...fighter.attack, impacted: true },
    },
  }
}
