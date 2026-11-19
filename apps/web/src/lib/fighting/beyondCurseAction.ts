import { chrolloPageForMove } from './chrolloBook'
import { BEYOND_CURSE } from './beyondCurse'
import type { ArcadeFighter, AttackKind } from './types'

/** Missing preparation never turns a copied/borrowed curse into a generic damaging carrier. */
export function beyondCurseUnavailable(options: {
  fighter: ArcadeFighter
  kind: AttackKind
  moveId?: string
}): boolean {
  if (options.moveId === BEYOND_CURSE.id || options.moveId === 'beyond:finisher') return true
  return (
    options.kind === 'special' && chrolloPageForMove(options.fighter, options.moveId) === 'beyond'
  )
}
