/**
 * The two states the hunt is played in — Ten and Zetsu.
 *
 * Neither costs aura. Ten is what a body does with its aura by default, and
 * Zetsu is the absence of it, so the price of Zetsu is not paid in points: it
 * is paid in blindness. A player in Zetsu cannot sweep, and — the part that
 * makes it a real decision — cannot feel the sweep that passes over them. They
 * hide their aura signature and no longer know they are being looked for.
 *
 * None of that is decided here any more. Those three consequences are the
 * engine's rules about Zetsu, and this file used to state them a second time in
 * a table of its own. ADR-001 chantier 3 makes the engine the only interpreter
 * of the Nen vocabulary, so the table below is derived from it rather than
 * written beside it: the hunt keeps its two states and its own prices, which
 * are the mode's business, and stops keeping its own rules, which are not.
 */
import {
  canUseHatsu,
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueState,
} from '@black-whale/nen-engine'

export type NenState = 'ten' | 'zetsu'

export interface NenStateRules {
  /** Whether an En sweep can identify the body's aura signature. */
  auraVisible: boolean
  /** Whether this body can sweep. */
  canSweep: boolean
  /** Whether this body feels a sweep that passes over it. */
  feelsEn: boolean
}

/** The hunt's two states, as the engine's technique state understands them. */
export function engineStateOf(state: NenState): NenTechniqueState {
  const ten = createNenTechniqueState()
  return state === 'ten' ? ten : transitionNen(ten, { type: 'ZETSU' }).state
}

function rulesFrom(state: NenState): NenStateRules {
  const engine = engineStateOf(state)
  // All three are one fact read three ways: aura is either leaving the body or
  // it is not. `detectWithEn` refuses to sweep from a body in Zetsu and reads
  // no signature off one, and a body with no aura out has nothing for a passing
  // sweep to disturb.
  const auraOut = canUseHatsu(engine)
  return { auraVisible: auraOut, canSweep: auraOut, feelsEn: auraOut }
}

export const NEN_STATES: Record<NenState, NenStateRules> = {
  ten: rulesFrom('ten'),
  zetsu: rulesFrom('zetsu'),
}

export function rulesOf(state: NenState): NenStateRules {
  return NEN_STATES[state]
}

export function toggled(state: NenState): NenState {
  return state === 'ten' ? 'zetsu' : 'ten'
}
