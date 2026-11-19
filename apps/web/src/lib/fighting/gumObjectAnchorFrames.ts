import { arenaObjects } from './arenaActions'
import { collideArenaBodies } from './arenaSimulation'
import { canAct } from './fightActorState'
import { updateEntity } from './preparationWorld'
import { gumAnchorNenAvailable } from './gumObjectAnchorAccess'
import { gumObjectAnchors, gumObjectAnchorTarget } from './gumObjectAnchors'
import type { GumObjectAnchor } from './gumObjectAnchors'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** Real attached strands survive a hit; only voluntary reeling pauses while the body cannot act. */
export function advanceGumObjectAnchors(state: FightState): FightState {
  for (const side of ['player', 'opponent'] as const) {
    state = reconcileGumObjectAnchors(state, side)
    if (!canAct(state[side])) continue
    for (const anchor of gumObjectAnchors(state[side]))
      state = advanceObjectAnchor(state, side, anchor)
  }
  return state
}
export function reconcileGumObjectAnchors(state: FightState, side: FightSide): FightState {
  const old = gumObjectAnchors(state[side])
  const anchors = old.filter(
    (anchor) =>
      anchorSurvives(state, side, anchor) && gumObjectAnchorTarget(state, anchor.objectId),
  )
  if (anchors.length === old.length) return state
  const next = {
    ...state,
    [side]: { ...state[side], gumObjectAnchors: anchors.length ? anchors : undefined },
  }
  const selected = state.arena?.tether[side]
  if (!selected || anchors.some((anchor) => anchor.objectId === selected.objectId)) return next
  return {
    ...next,
    arena: { ...state.arena!, tether: { ...state.arena!.tether, [side]: undefined } },
  }
}
function anchorSurvives(state: FightState, side: FightSide, anchor: GumObjectAnchor): boolean {
  // A masked client knows this strand exists, not its private acquisition.
  if (state.pvpSeat && !anchor.source) return state[side].health > 0
  return gumAnchorNenAvailable(state[side], anchor)
}
function advanceObjectAnchor(
  state: FightState,
  side: FightSide,
  anchor: GumObjectAnchor,
): FightState {
  if (anchor.pull === 'none' || state[side].arenaRecovery) return state
  const entry = gumObjectAnchorTarget(state, anchor.objectId)
  if (!entry) return state
  const actor = state[side]
  const dx = entry.x - actor.x
  const dy = entry.y + entry.arena!.height / 2 - (actor.y + 4)
  const distance = Math.hypot(dx, dy)
  const stretch = distance - (entry.arena!.width + 4)
  if (stretch <= 0) return state
  const step = Math.min(anchor.pull === 'self' ? 0.75 : 0.35, stretch)
  const movement = { x: (dx / distance) * step, y: (dy / distance) * step }
  return anchor.pull === 'self'
    ? pullAnchorBody(state, side, movement)
    : pullAnchorObject(state, entry, movement)
}
function pullAnchorBody(
  state: FightState,
  side: FightSide,
  movement: { x: number; y: number },
): FightState {
  const actor = state[side]
  return collideArenaBodies(state, {
    ...state,
    [side]: {
      ...actor,
      x: Math.max(7, Math.min(93, actor.x + movement.x)),
      y: Math.max(0, actor.y + movement.y),
      velocityY: movement.y ? 0 : actor.velocityY,
    },
  })
}
function pullAnchorObject(
  state: FightState,
  entry: PreparedEntity,
  movement: { x: number; y: number },
): FightState {
  const moved = { ...entry, x: entry.x - movement.x, y: Math.max(0, entry.y - movement.y) }
  return objectPathBlocked(state, moved)
    ? state
    : updateEntity(state, entry.id, { x: moved.x, y: moved.y })
}
function objectPathBlocked(state: FightState, moved: PreparedEntity): boolean {
  const width = moved.arena!.width
  const bodies = [state.player, state.opponent].some(
    (body) =>
      Math.abs(body.x - moved.x) < width + 2.5 &&
      body.y + 10 > moved.y &&
      body.y < moved.y + moved.arena!.height,
  )
  if (bodies) return true
  return arenaObjects(state).some(
    (other) =>
      other.id !== moved.id &&
      Math.abs(other.x - moved.x) < other.arena!.width + width &&
      other.y + other.arena!.height > moved.y &&
      other.y < moved.y + moved.arena!.height,
  )
}
