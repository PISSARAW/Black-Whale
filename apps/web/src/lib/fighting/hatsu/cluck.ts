import { BIRD_MANIPULATION } from '../outsideDuelAbility'
import { martialOnlyHatsu, type FighterHatsu } from './contract'

/** A real bird-control Hatsu; this duel supplies no birds, so combat stays martial. */
export const cluckHatsu: FighterHatsu = {
  ...martialOnlyHatsu('cluck'),
  stealableOutsideDuel: BIRD_MANIPULATION,
}
