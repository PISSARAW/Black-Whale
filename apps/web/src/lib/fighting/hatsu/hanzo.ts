import { boxesOverlap, pushbox } from '../frameData'
import { projectHanzo, wakeHanzoBody } from '../hanzoProjection'
import { voluntaryNenAvailable } from '../nenAccess'
import { chainAbilitySealed } from '../kurapika'
import type { ArcadeFighter, FightSide, FightState } from '../types'
import { unchangedImpact, type FighterHatsu } from './contract'

export const hanzoHatsu: FighterHatsu = {
  id: 'hanzo',
  sourceFor: (_fighter, moveId) => (!moveId || moveId === 'hanzo:neutralSpecial' ? 'hanzo' : null),
  onTrigger: ({ state, side }) => ({ ...state, [side]: projectHanzo(state[side]) }),
  onImpact: unchangedImpact,
  onFrame: (state) => tickProjection(tickProjection(state, 'player'), 'opponent'),
}

function tickProjection(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const projection = fighter.hanzoProjection
  if (!projection) return state
  const opponent = state[side === 'player' ? 'opponent' : 'player']
  const disturbed = boxesOverlap(pushbox(fighter), pushbox(opponent))
  if (disturbed || projectionBroken(fighter) || state.phase !== 'fighting') {
    return { ...state, [side]: wakeHanzoBody(fighter) }
  }
  return {
    ...state,
    [side]: {
      ...fighter,
      hanzoProjection: { ...projection, startupFrames: Math.max(0, projection.startupFrames - 1) },
    },
  }
}

function projectionBroken(fighter: ArcadeFighter): boolean {
  return !voluntaryNenAvailable(fighter) || chainAbilitySealed(fighter, 'hanzo:neutralSpecial')
}
