import { arenaObjects } from './arenaActions'
import { ownsBungeeGum } from './hisokaArsenal'
import { equippedDolphin } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface GumObjectAnchor {
  objectId: string
  hidden: boolean
  pull: 'none' | 'self' | 'object'
  source?: 'personal' | 'book' | 'dolphin'
  theftId?: string
}
declare module './types' {
  interface ArcadeFighter {
    gumObjectAnchors?: readonly GumObjectAnchor[]
  }
}

/** Each actual body owns its own connections; no fixed number of simultaneous strands is imposed. */
export function gumObjectAnchors(actor: ArcadeFighter): readonly GumObjectAnchor[] {
  return actor.gumObjectAnchors ?? []
}
export function gumManifestationHidden(state: FightState, side: FightSide): boolean {
  const hidden = gumObjectAnchors(state[side]).map((anchor) => anchor.hidden)
  if (state.bungeeGum?.owner === side) hidden.push(state.bungeeGum.hidden)
  return hidden.length > 0 && hidden.every(Boolean)
}
export function gumObjectAnchorTarget(
  state: FightState,
  objectId?: string,
): PreparedEntity | undefined {
  return arenaObjects(state).find((entry) => entry.id === objectId)
}
export function touchesGumObject(actor: ArcadeFighter, entry: PreparedEntity): boolean {
  const box = entry.arena!
  const dx = Math.max(0, Math.abs(entry.x - actor.x) - box.width)
  const dy = Math.max(entry.y - (actor.y + 6), actor.y - (entry.y + box.height), 0)
  return Math.hypot(dx, dy) <= 3.5
}
export function newGumObjectAnchor(actor: ArcadeFighter, objectId: string): GumObjectAnchor {
  const held = equippedDolphin(actor)
  return {
    objectId,
    hidden: actor.nen.in,
    pull: 'none',
    source: actor.dolphinExecution ? 'dolphin' : actor.id === 'chrollo' ? 'book' : 'personal',
    theftId: actor.dolphinExecution ? held?.theftId : undefined,
  }
}
export function canAttachGumObject(state: FightState, side: FightSide, objectId?: string): boolean {
  const actor = state[side]
  if (
    !ownsBungeeGum(stolenAuraActor(actor)) ||
    gumObjectAnchors(actor).some((anchor) => anchor.objectId === objectId)
  )
    return false
  const entry = gumObjectAnchorTarget(state, objectId)
  return Boolean(entry && touchesGumObject(actor, entry))
}
