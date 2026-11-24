import type { ArcadeFighter } from './types'
import { combatMindControlsBody } from './combatIdentity'

/** Voluntary panel orders need an awake mind with control of its actual body. */
export function arsenalMindAvailable(actor: ArcadeFighter): boolean {
  return combatMindControlsBody(actor)
}
