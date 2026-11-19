import { arenaObjects } from './arenaActions'
import { stolenAuraActor } from './dolphinSupply'
import { gumObjectAnchors, gumObjectAnchorTarget, canAttachGumObject } from './gumObjectAnchors'
import { performArsenalCommand } from './retrospectiveArsenal'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightState } from './types'

/** Choose only real nearby supports; no object, contact or attachment is fabricated. */
export function gumObjectAnchorAi(state: FightState): FightState | null {
  const actor = stolenAuraActor(state.opponent)
  const gap = Math.abs(actor.x - state.player.x)
  if (gap < 12 || actor.aura < 12) return null
  for (const anchor of gumObjectAnchors(actor)) {
    const entry = gumObjectAnchorTarget(state, anchor.objectId)
    if (!entry || Math.abs(entry.x - actor.x) <= entry.arena!.width + 4) continue
    if (Math.abs(entry.x - state.player.x) >= gap) continue
    const moved = use(state, { action: 'gum-anchor-self', target: entry.id })
    if (moved) return moved
  }
  if (actor.aura < 30) return null
  const target = arenaObjects(state).find((entry) =>
    canAttachGumObject(state, 'opponent', entry.id),
  )
  return target ? use(state, { action: 'gum-anchor-attach', target: target.id }) : null
}
function use(state: FightState, command: ArsenalCommand): FightState | null {
  const next = performArsenalCommand(state, 'opponent', command)
  return next === state ? null : next
}
