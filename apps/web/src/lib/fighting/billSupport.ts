import { chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, AttackKind } from './types'

import { ERIGERON_MOVE, ERIGERON_SUPPORT } from './billSupportTuning'
export { ERIGERON_MOVE, ERIGERON_SUPPORT } from './billSupportTuning'

/** Copying the ability preserves its supportive purpose and targeting requirements. */
export function isErigeronAction(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  if (kind !== 'special') return false
  if (fighter.id === 'bill' || moveId === ERIGERON_MOVE) return true
  return chrolloPageForMove(fighter, moveId) === 'bill'
}

/** Even a directly constructed attack cannot turn the support ability into a strike. */
export function isErigeronAttack(fighter: ArcadeFighter): boolean {
  if (!fighter.attack) return false
  if (fighter.attack.hatsuSource === 'bill') return true
  return isErigeronAction(fighter, fighter.attack.kind, fighter.attack.moveId)
}

export function erigeronHint(language: 'fr' | 'en'): string {
  return language === 'fr' ? ERIGERON_SUPPORT.hintFr : ERIGERON_SUPPORT.hintEn
}

export function erigeronPresentation(language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Erigeron · Soutien' : 'Erigeron · Support',
    ready: false,
    hint: erigeronHint(language),
  }
}
