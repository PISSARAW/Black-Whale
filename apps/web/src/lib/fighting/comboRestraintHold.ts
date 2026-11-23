import { crossGameRestrained } from './crossGame'
import type { ArcadeFighter } from './types'

/**
 * Physical restraints that keep a target bound during a sequence: Machi's short thread bind,
 * Illumi's embedded skull needle, Hinrigh's living handcuffs and Mizaistom's Cross Game hold.
 */
export function comboRestraintHeld(fighter: ArcadeFighter): boolean {
  return Boolean(
    fighter.machiThread?.kind === 'bind' ||
      fighter.needlePuppet?.needleEmbedded ||
      fighter.biohazardRestraint ||
      crossGameRestrained(fighter),
  )
}
