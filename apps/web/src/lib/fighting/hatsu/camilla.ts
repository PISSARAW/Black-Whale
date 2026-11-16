import { martialOnlyHatsu, type FighterHatsu } from './contract'
import { beginCatsName } from '../camillaCat'
import { CATS_NAME } from '../outsideDuelAbility'

/**
 * Cat's Name — Camilla (Succession Contest).
 *
 * Conditional Nen: it does nothing while Camilla lives, so she fights on Ren and
 * martial skill. Only her attributed death wakes it: the cat kills the one who
 * landed the fatal blow and Camilla comes back. A knockdown TKO, a points loss
 * or the timer kill no one, so they never wake it.
 */
export const camillaHatsu: FighterHatsu = {
  ...martialOnlyHatsu('camilla'),
  get stealableOutsideDuel() {
    return CATS_NAME
  },
  onDeath: ({ state, victimSide, killerSide }) => beginCatsName(state, victimSide, killerSide),
}
