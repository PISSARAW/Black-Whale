import {
  chrolloPageForMove,
  chrolloPageSource,
  chrolloCopiedMove,
  CHROLLO_SECONDARY,
} from './chrolloBook'
import { keyedMove, type KeyedMove } from './keyPoseMoves'
import { CHROLLO_KEY_POSES } from './keyPosesChrollo'
import { chrolloPhysicalMove } from './chrolloPhysicalPoses'
import type { ArcadeFighter } from './types'

/** Keep page casts on the proper hand, and reuse the stolen technique's own gesture. */
export function chrolloKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  if (fighter.id !== 'chrollo') return null
  return chrolloPhysicalMove(fighter) ?? specialChrolloMove(fighter)
}
function specialChrolloMove(fighter: ArcadeFighter): KeyedMove | null {
  if (fighter.attack?.kind !== 'special') return null
  const page = chrolloPageForMove(fighter, fighter.attack.moveId)
  if (!page) return null
  if (chrolloPageSource(page) !== 'chrollo') {
    const [source, slot] = (chrolloCopiedMove(fighter, fighter.attack.moveId) ?? '').split(':')
    return keyedMove(source as import('./types').FighterId, slot as import('./types').MoveSlot)
  }
  const moon = fighter.attack.moveId === CHROLLO_SECONDARY && !fighter.chrolloBook?.open
  return { timeline: CHROLLO_KEY_POSES[moon ? 'finisher' : 'neutralSpecial']!, authored: true }
}
