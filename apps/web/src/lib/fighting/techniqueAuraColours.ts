import { fighterAuraColour, type CanonAura } from './auraColours'
import type { ArcadeFighter } from './types'

/**
 * Techniques whose aura the anime shows in a colour of its own, keyed by move
 * id. Kurapika's chains are the case: each one wears its own aura. A move not
 * listed here wears its fighter's aura.
 */
export const TECHNIQUE_AURA_COLOURS: Readonly<Record<string, CanonAura>> = {
  'kurapika:forwardSpecial': {
    colour: '#e8d44d',
    source: 'anime 2011, Yorknew — Dowsing Chain, yellow aura',
  },
  'kurapika:neutralSpecial': {
    colour: '#e8d44d',
    source: 'anime 2011, Yorknew — Chain Jail on Uvogin, yellow aura',
  },
  'kurapika:downSpecial': {
    colour: '#4ee6d6',
    source: 'anime 2011, Yorknew — Holy Chain, cyan aura',
  },
}

/** The aura colour of the move a fighter is throwing, as `#rrggbb`. */
export function attackAuraColour(fighter: Pick<ArcadeFighter, 'id' | 'attack'>): string {
  const moveId = fighter.attack?.moveId
  return (moveId && TECHNIQUE_AURA_COLOURS[moveId]?.colour) || fighterAuraColour(fighter.id)
}
