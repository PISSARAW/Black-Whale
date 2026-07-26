import type { EntityRef, SpatialEstimate, WorldState } from './state.js'

export interface MapMarker {
  entity: EntityRef
  label: string
  locationId?: string
  precision: SpatialEstimate['precision']
  certainty: SpatialEstimate['certainty']
  probability?: number
}

export interface MapEffectLink {
  effectId: string
  kind: string
  abilityId: string
  anchors: NonNullable<WorldState['effects'][string]['anchors']>
  state: WorldState['effects'][string]['state']
}

export interface MapScene {
  branchId: string
  eventId: string
  assetKey: string
  markers: MapMarker[]
  effectLinks: MapEffectLink[]
  auraLayers: Array<{ effectId: string; source: EntityRef; attributes: Record<string, unknown> }>
  fogEntityIds: string[]
}

export interface MapSceneContext {
  assetKey: string
  visibleEntityIds?: Set<string>
}

export function projectMapScene(state: WorldState, context: MapSceneContext): MapScene {
  const visible = context.visibleEntityIds
  const markers = Object.values(state.presences)
    .filter((presence) => !visible || visible.has(presence.entity.id))
    .map((presence) => ({
      entity: presence.entity,
      label: state.entities[presence.entity.id]?.label ?? presence.entity.id,
      locationId: presence.locationId,
      precision: presence.precision,
      certainty: presence.certainty,
      probability: presence.probability,
    }))

  const activeEffects = Object.values(state.effects).filter((effect) => effect.state !== 'ENDED')
  const effectLinks = activeEffects
    .filter((effect) => effect.anchors && effect.anchors.length > 1)
    .map((effect) => ({
      effectId: effect.id,
      kind: effect.kind,
      abilityId: effect.abilityId,
      anchors: effect.anchors ?? [],
      state: effect.state,
    }))

  return {
    branchId: state.cursor.branchId,
    eventId: state.cursor.eventId,
    assetKey: context.assetKey,
    markers,
    effectLinks,
    auraLayers: activeEffects
      .filter((effect) => effect.kind === 'AURA_MODIFIER')
      .map((effect) => ({ effectId: effect.id, source: effect.source, attributes: effect.attributes })),
    fogEntityIds: visible
      ? Object.keys(state.entities).filter((entityId) => !visible.has(entityId))
      : [],
  }
}
