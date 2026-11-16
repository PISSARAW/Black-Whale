import { canUseFightHatsu } from './hatsu'
import type { ArcadeFighter } from './types'

/** Cat's Name never becomes a manual attack through the legacy style fallback. */
export function fightStyleSpecialReady(
  fighter: ArcadeFighter,
  gap: number,
  range: number,
): boolean {
  return fighter.id !== 'camilla' && canUseFightHatsu(fighter) && gap <= range
}
