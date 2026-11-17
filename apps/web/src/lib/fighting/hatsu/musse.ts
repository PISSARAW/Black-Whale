import { attackPhase } from '../frameData'
import { secretWindowNenActive, secretWindowUtility } from '../secretWindow'
import { advanceSecretWindowFeeds } from '../secretWindowFeeds'
import { attachSecretWindow } from '../secretWindowContact'
import type { FightSide, FightState } from '../types'
import { unchangedImpact, unchangedTrigger, type FighterHatsu } from './contract'

export const musseHatsu: FighterHatsu = {
  id: 'musse',
  onTrigger: unchangedTrigger,
  onImpact: unchangedImpact,
  onFrame: (state) => tickSide(tickSide(advanceSecretWindowFeeds(state), 'player'), 'opponent'),
}

function tickSide(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  if (!secretWindowNenActive(fighter) || fighter.secretWindow) return state
  if (
    !secretWindowUtility(fighter) ||
    attackPhase(fighter) !== 'active' ||
    fighter.attack?.impacted
  )
    return state
  return attachSecretWindow(state, side)
}
