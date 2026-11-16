import { chrolloPageForMove, CHROLLO_SECONDARY } from './chrolloBook'
import { keyedMove, type KeyedMove } from './keyPoseMoves'
import { CHROLLO_KEY_POSES } from './keyPosesChrollo'
import type { ArcadeFighter } from './types'

/** Keep page casts on the proper hand, and reuse the stolen technique's own gesture. */
export function chrolloKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  if (fighter.id !== 'chrollo' || fighter.attack?.kind !== 'special') return null
  const page = chrolloPageForMove(fighter, fighter.attack.moveId)
  if (!page) return null
  if (page !== 'sun-and-moon' && page !== 'black-voice') return keyedMove(page, 'neutralSpecial')
  const moon = fighter.attack.moveId === CHROLLO_SECONDARY && !fighter.chrolloBook?.open
  return { timeline: CHROLLO_KEY_POSES[moon ? 'finisher' : 'neutralSpecial']!, authored: true }
}
