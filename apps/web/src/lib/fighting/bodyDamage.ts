import { gumSupportAvailable } from './hisokaSupportOrigin'
import type { GumSource } from './bungeeSource'
import type { ArcadeFighter, FightState } from './types'

export const DAMAGED_BODY_PARTS = ['left-hand', 'right-lower-leg'] as const
export type DamagedBodyPart = (typeof DAMAGED_BODY_PARTS)[number]
export interface GumProstheses extends GumSource {
  id: string
  hidden?: boolean
  parts: readonly DamagedBodyPart[]
}
declare module './types' {
  interface ArcadeFighter {
    bodyDamage?: { parts: readonly DamagedBodyPart[] }
    gumProstheses?: GumProstheses
    gumProsthesisGeneration?: number
  }
}

/** A rubber replacement does not repair the underlying flesh or restore hit points. */
export function bodyPartFunctional(actor: ArcadeFighter, part: DamagedBodyPart): boolean {
  if (!actor.bodyDamage?.parts.includes(part)) return true
  return Boolean(
    actor.gumProstheses?.parts.includes(part) && gumSupportAvailable(actor, actor.gumProstheses),
  )
}

/** This mobility reduction is duel tuning, not a numerical rule from the manga. */
export function bodyLegFactor(actor: ArcadeFighter): number {
  return bodyPartFunctional(actor, 'right-lower-leg') ? 1 : 0.5
}

export function prepareBodyDamage(state: FightState): FightState {
  const injuries = state.environment.preparation?.injuries
  if (state.environment.preparation?.mode !== 'scenario' || !injuries) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    if (injuries[side] !== 'hand-and-lower-leg') continue
    next = { ...next, [side]: { ...next[side], bodyDamage: { parts: [...DAMAGED_BODY_PARTS] } } }
  }
  return next
}

export function carryBodyDamage(actor: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  if (!previous.bodyDamage) return actor
  return {
    ...actor,
    bodyDamage: previous.bodyDamage,
    gumProstheses: previous.gumProstheses,
    gumProsthesisGeneration: previous.gumProsthesisGeneration,
    textureSurprise:
      previous.textureSurprise?.surface === 'gum-prostheses'
        ? previous.textureSurprise
        : actor.textureSurprise,
  }
}
