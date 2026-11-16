import { martialOnlyHatsu, type FighterHatsu } from './contract'

/**
 * Cat's Name — Camilla (Succession Contest).
 *
 * Conditional Nen: it does nothing while Camilla lives, so she fights on Ren and
 * martial skill. Only her direct death wakes it: the cat kills the one who
 * landed the fatal blow and Camilla comes back. A knockdown TKO, a points loss
 * or the timer kill no one, so they never wake it.
 */
export const camillaHatsu: FighterHatsu = {
  ...martialOnlyHatsu('camilla'),
  onDeath: ({ state, victimSide, killerSide }) => ({
    ...state,
    [victimSide]: { ...state[victimSide], health: 100 },
    [killerSide]: { ...state[killerSide], health: 0 },
  }),
}
