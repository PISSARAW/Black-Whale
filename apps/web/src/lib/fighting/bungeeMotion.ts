import { freeCombatBody } from './fightActorState'
import { gumSourceAvailable } from './bungeeSource'
import { withGumChannel } from './bungeeChannel'
import { categoryPower } from './nenCategories'
import { otherSide } from './frameData'
import { liveEntity, updateEntity } from './preparationWorld'
import { collideArenaBodies } from './arenaSimulation'
import { gumCeilingHeight, gumLinkPoints, gumTargetPoint, gumLimbPoint } from './bungeeGeometry'
import { attachmentReach } from './bungeeCommands'
import {
  addGumLink,
  gumNetwork,
  moveGumLink,
  removeGumLinks,
  withGumNetwork,
} from './bungeeNetwork'
import type { GumLink } from './bungeeTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** Fixed-step elastic movement. No damage, teleportation, invulnerability or regenerated matter. */
export function advanceGumNetwork(state: FightState): FightState {
  if (!state.gumNetwork) return state
  state = withGumNetwork(state, gumNetwork(state))
  state = removeGumLinks(state, (link) => !linkSurvives(state, link))
  for (const side of ['player', 'opponent'] as const) state = advancePendingGum(state, side)
  for (const link of [...state.gumNetwork!.links])
    state = withGumChannel(state, { ...link, side: link.owner }, (scoped) =>
      advanceLink(scoped, link),
    )
  return state
}
function linkSurvives(state: FightState, link: GumLink): boolean {
  return gumSourceAvailable(state, link.owner, link) && Boolean(gumTargetPoint(state, link.target))
}
function advancePendingGum(state: FightState, side: FightSide): FightState {
  const network = gumNetwork(state),
    pending = network.pending[side]
  if (!pending) return state
  const fighter = state[side]
  const active =
    gumSourceAvailable(state, side, pending) && freeCombatBody(fighter) && !fighter.attack
  const frames = pending.frames - 1
  state = withGumNetwork(state, {
    ...network,
    pending: {
      ...network.pending,
      [side]: active && frames > 0 ? { ...pending, frames } : undefined,
    },
  })
  if (!active || frames > 0) return state
  const start = gumLimbPoint(state, side, pending.limb),
    point = gumTargetPoint(state, pending.target)
  if (!point || Math.hypot(start.x - point.x, start.y - point.y) > attachmentReach(pending.target))
    return state
  return addGumLink(state, { side, ...pending })
}
function advanceLink(state: FightState, link: GumLink): FightState {
  if (link.motion === 'idle') return state
  if (!freeCombatBody(state[link.owner])) return stopLink(state, link)
  if (state[link.owner].arenaRecovery) return state
  if (link.target.kind === 'projectile') return state
  if (link.motion === 'recall' && link.target.kind === 'entity') return recallEntity(state, link)
  return pullFighter(state, link)
}
function stopLink(state: FightState, link: GumLink): FightState {
  const network = gumNetwork(state)
  return withGumNetwork(state, {
    ...network,
    links: network.links.map((entry) =>
      entry.id === link.id ? { ...entry, motion: 'idle' } : entry,
    ),
  })
}
function pullFighter(state: FightState, link: GumLink): FightState {
  const points = gumLinkPoints(state, link)
  if (!points) return stopLink(state, link)
  const bodyTarget = link.target.kind === 'fighter'
  const [anchor, target] = points
  const start = bodyTarget ? { x: state[link.owner].x, y: state[link.owner].y + 9 } : anchor
  const distance = Math.hypot(target.x - start.x, target.y - start.y)
  const rest = restDistance(link)
  if (groundAnchorReached(state, link, { x: target.x - start.x, y: target.y - start.y }))
    return stopLink(state, link)
  if (distance <= rest && link.target.kind !== 'surface') return stopLink(state, link)
  const tension = Math.max(0, distance - rest)
  const pull = Math.min(
    tension,
    Math.min(2.4, Math.max(0.6, tension * 0.14 * categoryPower(state[link.owner], 'transmuter'))),
  )
  if (distance === 0) return stopLink(state, link)
  const side =
    link.motion === 'recall' && link.target.kind === 'fighter' ? link.target.side : link.owner
  const sign = side === link.owner ? 1 : -1
  const fighter = state[side]
  const x = Math.max(7, Math.min(93, fighter.x + ((sign * (target.x - start.x)) / distance) * pull))
  const y = boundedHeight(state, fighter.y + ((sign * (target.y - start.y)) / distance) * pull)
  const moved = {
    ...state,
    [side]: pulledBody(fighter, { x, y, controlled: side === link.owner }),
  }
  const collided = collideArenaBodies(state, moved)
  return sustainOverhead(collided, link)
}
function pulledBody(
  fighter: FightState['player'],
  moved: { x: number; y: number; controlled: boolean },
): FightState['player'] {
  const body = { ...fighter, x: moved.x, y: moved.y }
  return moved.controlled
    ? { ...body, velocityY: 0, blocking: false, motion: stoppedDrift(fighter.motion) }
    : body
}
function boundedHeight(state: FightState, y: number): number {
  const ceiling = gumCeilingHeight(state)
  return Math.max(0, Math.min(ceiling === null ? 120 : Math.max(0, ceiling - 20), y))
}
function restDistance(link: GumLink): number {
  if (link.target.kind === 'fighter') return 8
  return link.target.kind === 'entity' ? 7 : 3
}
function groundAnchorReached(
  state: FightState,
  link: GumLink,
  delta: { x: number; y: number },
): boolean {
  return (
    link.motion === 'rebound' &&
    state[link.owner].y === 0 &&
    delta.y < 0 &&
    Math.abs(delta.x) <= restDistance(link)
  )
}
function stoppedDrift(motion: FightState['player']['motion']) {
  return motion ? { ...motion, velocityX: 0, dash: null } : motion
}
function sustainOverhead(state: FightState, link: GumLink): FightState {
  if (link.target.kind !== 'surface' || link.target.surface !== 'ceiling') return state
  const fighter = state[link.owner]
  if (fighter.aura < 0.05) return moveGumLink(state, link.owner, 'idle')
  return { ...state, [link.owner]: { ...fighter, aura: fighter.aura - 0.05 } }
}
function recallEntity(state: FightState, link: GumLink): FightState {
  if (link.target.kind !== 'entity') return state
  const id = link.target.id,
    fighter = state[link.owner]
  const entity = recalledEntity(state, id)
  if (!entity || !liveEntity(entity)) return stopLink(state, link)
  const gap = Math.abs(entity.x - fighter.x)
  if (gap <= 7) return stopLink(state, link)
  const x = entity.x + Math.sign(fighter.x - entity.x) * Math.min(0.75, gap - 7)
  if (recallObstructed(state, entity, { x, side: link.owner })) return stopLink(state, link)
  return updateEntity(state, id, { x })
}
function recalledEntity(state: FightState, id: string) {
  return state.battlefield?.entities.find((entry) => entry.id === id)
}
function recallObstructed(
  state: FightState,
  entity: PreparedEntity,
  moved: { x: number; side: FightSide },
): boolean {
  const width = entity.arena?.width ?? 1
  return (
    recallBlocked(state, { id: entity.id, x: moved.x, width }) ||
    bodyBlocksRecall(state, { ...moved, y: entity.y, width })
  )
}
function bodyBlocksRecall(
  state: FightState,
  moved: { side: FightSide; x: number; y: number; width: number },
): boolean {
  const other = state[otherSide(moved.side)]
  return Math.hypot(other.x - moved.x, other.y - moved.y) < moved.width + 3
}
function recallBlocked(
  state: FightState,
  moved: { id: string; x: number; width: number },
): boolean {
  return Boolean(
    state.battlefield?.entities.some(
      (entry) =>
        entry.id !== moved.id &&
        entry.arena &&
        liveEntity(entry) &&
        Math.abs(entry.x - moved.x) < entry.arena.width + moved.width,
    ),
  )
}
