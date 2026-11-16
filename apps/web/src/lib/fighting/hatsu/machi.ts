import { attackPhase } from '../frameData'
import { fightFormat } from '../formats'
import {
  advanceMachiThreads,
  machiMoveId,
  machiSourceActive,
  MACHI_SUTURE_HEAL,
  releaseMachiThread,
} from '../machiThread'
import type { FightSide, FightState } from '../types'
import { unchangedTrigger, type FighterHatsu, type HatsuImpactContext } from './contract'

export const machiHatsu: FighterHatsu = {
  id: 'machi',
  onTrigger: unchangedTrigger,
  onImpact: threadImpact,
  onFrame: (state) => advanceMachiThreads(suture(suture(state, 'player'), 'opponent')),
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
  const maximum =
    'maxHealth' in fighter ? Number(fighter.maxHealth) : fightFormat(state.formatId).health
  return {
    ...state,
    [side]: {
      ...fighter,
      health: Math.min(maximum, fighter.health + MACHI_SUTURE_HEAL),
      attack: { ...fighter.attack, impacted: true },
    },
  }
}
