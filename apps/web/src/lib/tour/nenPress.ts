/**
 * What a press of the visitor's Nen keys does, apart from the scene drawing it.
 *
 * Moved out of `TourScene.svelte`: the Ten toggle unchanged except for the
 * awakening, and the one question the scene must ask before it plays a sound —
 * whether the page that owns the visitor's Nen refused the press.
 */
import {
  isAuraAtRest,
  type NenTechniqueAction,
  type NenTechniqueState,
  type NenTransition,
} from '@black-whale/nen-engine'

/** Controlled pages report a transition, an acceptance flag, or no verdict. */
export type NenOutcome = NenTransition | boolean | void

/** Whether the page that owns the visitor's Nen turned the press down. */
export function wasRefused(outcome: NenOutcome): boolean {
  return outcome === false || (typeof outcome === 'object' && !outcome.accepted)
}

export interface TenPress {
  /** Before awakening, every Ten opens the nodes and never puts the skin down. */
  awakened: boolean
  nen: NenTechniqueState
  /** Whether a Ten held for nothing is currently shown. See `Comfort.restingAura`. */
  restingAura: boolean
  setComfort: (change: { restingAura: boolean }) => void
  useNen: (action: NenTechniqueAction) => void
}

/**
 * T, twice: raise the Ten, then put it back down.
 *
 * The key used to be one-way — from a Ren or a Zetsu it dropped you into Ten,
 * and from a Ten it did nothing at all, which is a key that stops answering
 * once you have pressed it. So the second press is the way out, and what it
 * puts down is the *showing* of the skin rather than the skin: the visitor
 * goes on holding Ten, because a body that stops holding it is in Zetsu and
 * Zetsu is X. See `Comfort.restingAura` for why that is the honest half to
 * hand a key.
 *
 * Raising always shows again, so the two presses are a true toggle from
 * wherever the aura was. Otherwise a T out of Ren would land on a skin the
 * visitor had put down an hour ago and the next press would do nothing —
 * the same dead key, one state further along.
 */
export function pressTen({ awakened, nen, restingAura, setComfort, useNen }: TenPress): void {
  if (awakened && isAuraAtRest(nen) && restingAura) {
    setComfort({ restingAura: false })
    return
  }
  setComfort({ restingAura: true })
  useNen({ type: 'TEN' })
}
