/**
 * What the visitor's eyes can make of someone else's aura.
 *
 * In the manga, aura is invisible to anyone whose nodes are still shut: Gon
 * and Killua at the Heavens Arena feel Wing's Ren as a weight on them before
 * either of them can see a thing. Once the nodes are open, aura is visible to
 * the naked eye, and Gyo is only needed for what In hides and for the finer
 * detail. The walk used to have only the second half of that, so every body
 * on deck wore its aura in full light for a visitor who had never opened a
 * node.
 *
 * Three levels, ordered from least to most:
 *
 * - **pressure** — not yet awakened. The aura is felt as a bend in the air
 *   (the refraction shell of `auraRefraction`), never seen as light.
 * - **sight** — awakened. Ten, Ren, Ken, On and Ko are visible as they are.
 * - **gyo** — awakened and looking hard: In stops hiding anything.
 *
 * Zetsu does not take sight away. It closes the visitor's own nodes, not their
 * eyes, which is how Gon watches the Ants from hiding.
 */
import {
  createNenTechniqueState,
  isAuraVisibleTo,
  transitionNen,
  type NenTechniqueState,
} from '@black-whale/nen-engine'

export type AuraSight = 'pressure' | 'sight' | 'gyo'

/** The visitor's level of sight, from their own Nen and whether it is open. */
export function auraSightOf(visitor: NenTechniqueState, awakened: boolean): AuraSight {
  if (!awakened) return 'pressure'
  return visitor.gyo ? 'gyo' : 'sight'
}

/** What may be built of one body's aura for an observer at a given sight. */
export interface AuraLayers {
  /** The aura as light: skin, shells, flames, Ken, Ko and the rest. */
  light: boolean
  /** The aura as a bend in the air. Also true where `light` is. */
  felt: boolean
  /** The observer is in Gyo: the finest layers, and what In hides. */
  gyo: boolean
}

const OPEN_EYES = createNenTechniqueState()
const GYO_EYES = transitionNen(createNenTechniqueState(), { type: 'GYO', on: true }).state

/**
 * The layers of `source` an observer at `sight` is shown.
 *
 * In hides the pressure as well as the light: a concealed aura is concealed
 * from everyone who is not looking with Gyo, and an unawakened visitor cannot.
 */
export function auraLayersFor(source: NenTechniqueState, sight: AuraSight = 'sight'): AuraLayers {
  const gyo = sight === 'gyo'
  const unhidden = isAuraVisibleTo(source, gyo ? GYO_EYES : OPEN_EYES)
  return { light: unhidden && sight !== 'pressure', felt: unhidden, gyo }
}

/** Whether things only Gyo reveals (hidden apparitions, tethers) are drawn. */
export const seesConcealed = (sight: AuraSight): boolean => sight === 'gyo'
