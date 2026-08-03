import type { Body, Location, PerspectiveState } from '@black-whale/domain'

import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'
import { displayName } from '$lib/utils/displayNames'

import type {
  MapCharacter,
  MapMarker,
  MapNextChapterState,
  MapPresence,
  ProjectionContext,
} from './types'
import { calculatePresencePosition } from './position'
import { getTemporalVisual } from './certainty'
import { tierLabelFor, tierOverviewY } from './overview'
import type { KnowledgeView, PresenceEntities } from './identity'
import {
  hasConsciousnessTransfer,
  resolveEntities,
  resolveFollowedCharacter,
  resolveIdentityNames,
  resolveKnowledge,
  resolveKnowledgeState,
  resolveSourceLabel,
} from './identity'

/** What the next chapter does to this presence, previewed by the parallel future. */
function resolveFutureChange(
  presence: MapPresence,
  next: MapNextChapterState | null,
): 'stable' | 'moved' | 'dead' {
  const biologicalState = next?.bodyStates?.[presence.entityId]
  if (biologicalState === 'DEAD' || biologicalState === 'DESTROYED') return 'dead'

  const nextPresence = next?.presences?.find(
    (candidate) => candidate.entityId === presence.entityId,
  )
  if (nextPresence && nextPresence.locationId !== presence.locationId) return 'moved'
  return 'stable'
}

/**
 * Where the marker sits in the longitudinal overview: the mid height of its own
 * deck, or the middle of the picture for someone on no deck at all.
 */
function overviewAnchorFor(tierId: string | null) {
  return { overviewX: 50, overviewY: (tierId ? tierOverviewY[tierId] : undefined) ?? 46 }
}

/** The catalogue tags the marker carries over from the character behind the body. */
function ownerFields(owner: MapCharacter, followed: MapCharacter | undefined) {
  return {
    factionTags: owner.factionTags || [],
    beyondLineage: owner.beyondLineage,
    originalCharacterId: followed?.id || owner.id,
    hatsuNames: owner.hatsuNames || [],
    hatsuIds: owner.hatsuIds || [],
  }
}

/** The words under the marker: which deck, which room, and since when. */
function placeLabels(
  presence: MapPresence,
  place: { loc: Location; tierId: string | null },
  locale: Locale,
) {
  const messages = messagesFor(locale).map
  return {
    sinceLabel: presence.fromEventId
      ? messages.sinceEvent(presence.fromEventId)
      : messages.unknownEvent,
    tierLabel: place.tierId ? tierLabelFor(place.tierId, locale) : messages.outsideTier,
    locationLabel: place.loc.name || messages.unknownPosition,
  }
}

/**
 * True when the consciousness in this body did not start there — or when the
 * observer is looking at their own body and knows something is wrong with it.
 */
function transferFlagFor(
  body: Body,
  entities: PresenceEntities,
  view: { knowledge: KnowledgeView; perspective: PerspectiveState | null },
) {
  return (
    hasConsciousnessTransfer(body, entities) ||
    (view.knowledge.isObserverBody && Boolean(view.perspective?.observer?.isDissonant))
  )
}

/**
 * Returns null when the presence has no place on a tier map: an unknown body,
 * an unresolved owner, or a position the ship maps do not draw. Those belong in
 * the dedicated unknown-positions manifest, not at fallback coordinates.
 */
export function projectPresenceMarker(
  presence: MapPresence,
  context: ProjectionContext,
): MapMarker | null {
  const {
    world,
    perspective,
    nextChapterState,
    followMode,
    perspectiveIsReader,
    locale = DEFAULT_LOCALE,
  } = context

  const entities = resolveEntities(presence.entityId, world)
  const { body, ownerCharacter } = entities
  const { x, y, loc, tierId } = calculatePresencePosition(
    presence,
    world.presences,
    world.locations,
  )

  if (!body || !ownerCharacter || !loc || loc.type === 'UNKNOWN') return null

  const knowledge = resolveKnowledge({ entityId: presence.entityId, body }, world, perspective)
  const names = resolveIdentityNames(entities, knowledge, {
    perspective,
    followMode,
    perspectiveIsReader,
    locale,
  })

  const messages = messagesFor(locale).map
  const temporalVisual = getTemporalVisual(
    presence,
    { currentEvent: context.currentEvent, currentSequence: context.currentSequence },
    locale,
  )
  const followedCharacter = resolveFollowedCharacter(entities, followMode)

  return {
    id: presence.entityId,
    tierId,
    locationId: loc.slug,
    characterSlug: ownerCharacter.slug,
    location: loc,
    currentEventTitle: context.currentEvent?.title,
    ...overviewAnchorFor(tierId),
    x: x / 10,
    y: y / 6,
    body: names.bodyName,
    consciousness: names.consciousness,
    appearance: names.appearance,
    perceivedIdentity: names.perceivedIdentity,
    transferFlag: transferFlagFor(body, entities, { knowledge, perspective }),
    suspicionLabel:
      !perspectiveIsReader && knowledge.hasBeliefOnly ? messages.activeSuspicion : undefined,
    knowledgeState: resolveKnowledgeState(presence, knowledge),
    sourceLabel: resolveSourceLabel(knowledge, locale),
    ...placeLabels(presence, { loc, tierId }, locale),
    positionColor: temporalVisual.color,
    temporalLabel: temporalVisual.label,
    temporalDetail: temporalVisual.detail,
    isFollowTarget: knowledge.isObserverBody,
    ...ownerFields(ownerCharacter, followedCharacter),
    futureChange: resolveFutureChange(presence, nextChapterState),
  }
}

/** The body, the character behind it and its fate, as the next chapter holds them. */
function futureSubject(presence: MapPresence, next: MapNextChapterState) {
  const body = next.bodies.find((candidate) => candidate.id === presence.entityId)
  return {
    body,
    character: body
      ? next.characters.find((candidate) => candidate.id === body.originalCharacterId)
      : null,
    biologicalState: next.bodyStates?.[presence.entityId],
  }
}

/** Where the future marker says it is, in a chapter the reader has not reached. */
function futurePlaceLabels(
  loc: Location | null,
  tierId: string | null,
  locale: Locale,
): { tierLabel: string; locationLabel: string } {
  const messages = messagesFor(locale).map
  return {
    tierLabel: tierId ? tierLabelFor(tierId, locale) : messages.outsideTier,
    locationLabel: loc?.name || messages.unknownFuturePosition,
  }
}

/** The catalogue tags a future marker keeps: no faction, no follow target, just lineage and Hatsu. */
function futureOwnerFields(character: MapCharacter) {
  return {
    beyondLineage: character.beyondLineage,
    hatsuNames: character.hatsuNames || [],
    hatsuIds: character.hatsuIds || [],
  }
}

/**
 * The parallel-future overlay. It has no perspective to respect — it shows the
 * next chapter as the reader will find it — so it skips the identity masking
 * entirely and only needs a name and a position.
 */
export function projectFutureMarker(
  presence: MapPresence,
  next: MapNextChapterState,
  options: { fallbackLocations: Location[]; locale?: Locale } = { fallbackLocations: [] },
): MapMarker | null {
  const { fallbackLocations, locale = DEFAULT_LOCALE } = options
  const { body, character, biologicalState } = futureSubject(presence, next)
  if (!body || !character || biologicalState === 'DEAD' || biologicalState === 'DESTROYED')
    return null

  const { x, y, loc, tierId } = calculatePresencePosition(
    presence,
    next.presences,
    next.locations.length ? next.locations : fallbackLocations,
  )
  const messages = messagesFor(locale).map
  const name = displayName(character.canonicalName, locale)

  return {
    id: presence.entityId,
    x: x / 10,
    y: y / 6,
    body: name,
    consciousness: name,
    appearance: name,
    perceivedIdentity: messages.futureIdentity(name, next.chapterNumber),
    knowledgeState: 'confirmed',
    positionColor: '#d598ff',
    ...futurePlaceLabels(loc, tierId, locale),
    temporalLabel: messages.parallelFuture,
    temporalDetail: messages.positionInChapter(next.chapterNumber),
    tierId,
    locationId: loc?.slug,
    characterSlug: character.slug,
    location: loc,
    ...overviewAnchorFor(tierId),
    ...futureOwnerFields(character),
  }
}
