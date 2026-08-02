/**
 * The two states the hunt is played in — Ten and Zetsu.
 *
 * Neither costs aura. Ten is what a body does with its aura by default, and
 * Zetsu is the absence of it, so the price of Zetsu is not paid in points: it
 * is paid in blindness. A player in Zetsu cannot sweep, and — the part that
 * makes it a real decision — cannot feel the sweep that passes over them. They
 * hide their aura signature and no longer know they are being looked for.
 */

export type NenState = 'ten' | 'zetsu'

export interface NenStateRules {
  /** Whether an En sweep can identify the body's aura signature. */
  auraVisible: boolean
  /** Whether this body can sweep. */
  canSweep: boolean
  /** Whether this body feels a sweep that passes over it. */
  feelsEn: boolean
}

export const NEN_STATES: Record<NenState, NenStateRules> = {
  ten: { auraVisible: true, canSweep: true, feelsEn: true },
  zetsu: { auraVisible: false, canSweep: false, feelsEn: false },
}

export function rulesOf(state: NenState): NenStateRules {
  return NEN_STATES[state]
}

export function toggled(state: NenState): NenState {
  return state === 'ten' ? 'zetsu' : 'ten'
}
