/**
 * Whether the visitor has opened their nodes yet.
 *
 * A visitor arrives unawakened. Until then, other people's aura is a pressure
 * and not a sight (`auraSight.ts`), and the only technique within reach is the
 * ones that open the nodes: Ten, or Ren for a visitor who forces them the way
 * Wing forced Gon's. The first of either awakens them for good,
 * and it is remembered across visits the way their Nen state is.
 *
 * Pure apart from the two storage helpers, which follow `nen/persistence.ts`:
 * a private window or a full quota must never stop a press from landing.
 */
import type { NenTechnique, NenTechniqueAction } from '@black-whale/nen-engine'
import type { NenRefusalCode } from './nenRefusal'

export const TOUR_AWAKENING_STORAGE_KEY = 'black-whale:tour:awakened:v1'

export const NODES_SHUT: NenRefusalCode = 'NODES_SHUT'

/** The presses that open the nodes. */
export function awakensWith(action: NenTechniqueAction): boolean {
  return action.type === 'TEN' || action.type === 'REN'
}

/** Whether a press is refused because the nodes are still shut. */
export function refusedBeforeAwakening(awakened: boolean, action: NenTechniqueAction): boolean {
  return !awakened && !awakensWith(action)
}

const LOCKED: NenTechnique[] = ['zetsu', 'gyo', 'in', 'en', 'ken', 'ko', 'ryu', 'shu', 'on']

/** What the Nen panel greys out before awakening, with the reason on hover. */
export function awakeningAvailability(
  awakened: boolean,
): Partial<Record<NenTechnique, NenRefusalCode>> {
  if (awakened) return {}
  return Object.fromEntries(LOCKED.map((technique) => [technique, NODES_SHUT]))
}

export function loadAwakened(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(TOUR_AWAKENING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveAwakened(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(TOUR_AWAKENING_STORAGE_KEY, 'true')
  } catch {
    // Private browsing or a full quota must not prevent the nodes from opening.
  }
}
