import type { MapWorldState } from '$lib/components/map/markerProjection'

export type ShipDeltaKind = 'moved' | 'appeared' | 'disappeared' | 'dead'

export interface ShipEventDelta {
  entityId: string
  kind: ShipDeltaKind
  fromLocationId: string | null
  toLocationId: string | null
}

function presenceByEntity(state: Pick<MapWorldState, 'presences'>) {
  return new Map(state.presences.map((presence) => [presence.entityId, presence]))
}

type PresenceMap = ReturnType<typeof presenceByEntity>

interface DeltaContext {
  before: PresenceMap
  after: PresenceMap
  current: Pick<MapWorldState, 'bodyStates'>
  next: Pick<MapWorldState, 'bodyStates'>
}

function newlyDead(currentState: string, nextState: string) {
  if (!['DEAD', 'DESTROYED'].includes(nextState)) return false
  return currentState !== nextState
}

function changeKind(options: {
  from: MapWorldState['presences'][number] | undefined
  to: MapWorldState['presences'][number] | undefined
  currentState: string
  nextState: string
}): ShipDeltaKind | null {
  const { from, to, currentState, nextState } = options
  if (newlyDead(currentState, nextState)) return 'dead'
  if (!from) return to ? 'appeared' : null
  if (!to) return 'disappeared'
  return from.locationId === to.locationId ? null : 'moved'
}

function deltaFor(entityId: string, context: DeltaContext): ShipEventDelta | null {
  const { before, after, current, next } = context
  const from = before.get(entityId)
  const to = after.get(entityId)
  const nextState = next.bodyStates?.[entityId] || ''
  const kind = changeKind({
    from,
    to,
    currentState: current.bodyStates?.[entityId] || '',
    nextState,
  })
  return kind
    ? {
        entityId,
        kind,
        fromLocationId: from?.locationId || null,
        toLocationId: to?.locationId || null,
      }
    : null
}

export function buildShipEventDelta(
  current: Pick<MapWorldState, 'presences' | 'bodyStates'>,
  next: Pick<MapWorldState, 'presences' | 'bodyStates'> | null,
): ShipEventDelta[] {
  if (!next) return []
  const before = presenceByEntity(current as Pick<MapWorldState, 'presences'>)
  const after = presenceByEntity(next as Pick<MapWorldState, 'presences'>)
  const entityIds = [...new Set([...before.keys(), ...after.keys()])].sort()
  const context = { before, after, current, next }

  return entityIds
    .map((entityId) => deltaFor(entityId, context))
    .filter((change): change is ShipEventDelta => change !== null)
}
