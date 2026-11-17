import { transitionNen } from '@black-whale/nen-engine'
import type { ArcadeFighter, FightInput } from '../types'
function requested(fighter: ArcadeFighter, input: FightInput): boolean {
  if (fighter.nen.ko) return false
  const zone = [input.focusHead, input.focusTorso, input.focusHands, input.focusFeet].some(Boolean)
  return Boolean((input.gyo && (!zone || input.aura)) || (input.aura && input.jump))
}
/** Regular ocular Gyo uses Ren. G + down without Aura selects the lower-output practice version. */
export function applyOcularInput(
  fighter: ArcadeFighter,
  input: FightInput,
  available: boolean,
): ArcadeFighter {
  const gyo = available && requested(fighter, input)
  const low = gyo && input.down && !input.aura
  const nen = transitionNen(fighter.nen, { type: 'GYO', on: gyo }).state
  return {
    ...fighter,
    gyoLow: low ? true : undefined,
    nen: gyo ? { ...nen, mode: low ? 'ten' : 'ren' } : nen,
  }
}
