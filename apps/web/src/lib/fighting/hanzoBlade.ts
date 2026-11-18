import type { ArcadeFighter } from './types'

export const HANZO_BLADE_MOVES = ['hanzo:forwardSpecial', 'hanzo:backSpecial'] as const

/** A carried weapon on the real right forearm, not equipment granted by Skill 4. */
export function hanzoBladeAvailable(fighter: ArcadeFighter): boolean {
  return fighter.id === 'hanzo' && !fighter.weaponsConfiscated && !fighter.hanzoProjection
}

export function hanzoBladeMove(moveId?: string): boolean {
  return HANZO_BLADE_MOVES.some((id) => id === moveId)
}

export function hanzoBladeAttack(fighter: ArcadeFighter): boolean {
  return fighter.id === 'hanzo' && hanzoBladeMove(fighter.attack?.moveId)
}

/** Losing the weapon interrupts its committed strike before the next collision check. */
export function interruptHanzoBlade(fighter: ArcadeFighter): ArcadeFighter {
  if (
    fighter.id !== 'hanzo' ||
    !hanzoBladeMove(fighter.attack?.moveId) ||
    hanzoBladeAvailable(fighter)
  )
    return fighter
  return { ...fighter, attack: null, bufferedAttack: null }
}
