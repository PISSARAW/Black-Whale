import type { EffectInstance, EntityRef, SpatialEstimate, WorldState } from './state.js'

export interface MapMarker {
  entity: EntityRef
  label: string
  locationId?: string
  precision: SpatialEstimate['precision']
  certainty: SpatialEstimate['certainty']
  probability?: number
  /**
   * Set when a PERCEPTION_MASK makes this entity look like another one and the
   * viewer is not entitled to the truth (In / Texture Surprise / Metamorphosen).
   */
  appearsAs?: string
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

/**
 * How the scene is being looked at. `omniscient` sees the world as it is; a
 * character observer sees masked effects only with Gyo, and sees a masked entity
 * as whoever it is impersonating unless the mask lists them as aware.
 */
export interface MapPerception {
  omniscient?: boolean
  gyo?: boolean
  observerId?: string
}

export interface MapSceneContext {
  assetKey: string
  visibleEntityIds?: Set<string>
  perception?: MapPerception
}

/** `attributes.masked` is the In convention: the effect exists, but nobody sees it. */
function seesEffect(effect: EffectInstance, perception: MapPerception): boolean {
  if (effect.attributes['masked'] !== true) return true
  if (perception.omniscient || perception.gyo) return true
  const aware = effect.attributes['awareObserverIds']
  return Array.isArray(aware) && perception.observerId !== undefined
    ? aware.includes(perception.observerId)
    : false
}

/** The identity a perception mask projects, or undefined when the viewer sees through it. */
function apparentIdentity(
  state: WorldState,
  entityId: string,
  perception: MapPerception,
): string | undefined {
  if (perception.omniscient) return undefined
  for (const effect of Object.values(state.effects)) {
    if (effect.kind !== 'PERCEPTION_MASK') continue
    if (effect.state === 'ENDED' || effect.state === 'DORMANT') continue
    if (!effect.targets.some((target) => target.id === entityId)) continue
    const aware = effect.attributes['awareObserverIds']
    if (Array.isArray(aware) && perception.observerId && aware.includes(perception.observerId)) {
      continue
    }
    const appearsAs = effect.attributes['appearsAs']
    if (typeof appearsAs === 'string') return appearsAs
  }
  return undefined
}

export function projectMapScene(state: WorldState, context: MapSceneContext): MapScene {
  const visible = context.visibleEntityIds
  const perception = context.perception ?? { omniscient: true }
  const markers = Object.values(state.presences)
    .filter((presence) => !visible || visible.has(presence.entity.id))
    .map((presence) => {
      const appearsAs = apparentIdentity(state, presence.entity.id, perception)
      return {
        entity: presence.entity,
        label:
          (appearsAs ? state.entities[appearsAs]?.label : undefined) ??
          state.entities[presence.entity.id]?.label ??
          presence.entity.id,
        locationId: presence.locationId,
        precision: presence.precision,
        certainty: presence.certainty,
        probability: presence.probability,
        appearsAs,
      }
    })

  const activeEffects = Object.values(state.effects)
    .filter((effect) => effect.state !== 'ENDED')
    .filter((effect) => seesEffect(effect, perception))
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
      .map((effect) => ({
        effectId: effect.id,
        source: effect.source,
        attributes: effect.attributes,
      })),
    fogEntityIds: visible
      ? Object.keys(state.entities).filter((entityId) => !visible.has(entityId))
      : [],
  }
}
