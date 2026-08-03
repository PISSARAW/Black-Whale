import type {
  AppearanceState,
  Belief,
  Body,
  Consciousness,
  PerspectiveState,
  SubjectiveFact,
} from '@black-whale/domain'

import type { FollowMode, KnowledgeVisualState } from '$lib/components/perspective/types'
import { displayName } from '$lib/utils/displayNames'
import type { Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

import type { MapCharacter, MapPresence, MapWorldState } from './types'

/**
 * Who is looking, and how.
 *
 * The four travel together because they answer one question between them —
 * what this viewer is allowed to be shown, and in which words. Splitting them
 * across a call means every function that masks an identity takes the same four
 * arguments in the same order, which is the shape a type is for.
 */
interface Viewpoint {
  perspective: PerspectiveState | null
  followMode: FollowMode
  /** The reader sees the archive whole: nothing is masked from them. */
  perspectiveIsReader: boolean
  locale: Locale
}

export interface PresenceEntities {
  body?: Body
  appearanceState?: AppearanceState
  structuralApparentCharacter?: MapCharacter
  biologicalOwner?: MapCharacter
  ownerCharacter?: MapCharacter
  activeConsciousness?: Consciousness
  consciousnessOwner?: MapCharacter
}

/** Walks presence → body → occupancy → consciousness → the characters behind each. */
export function resolveEntities(entityId: string, world: MapWorldState): PresenceEntities {
  const body = world.bodies.find((candidate) => candidate.id === entityId)
  const appearanceState = world.appearances.find((candidate) => candidate.entityId === entityId)
  const structuralApparentCharacter = appearanceState
    ? world.characters.find((candidate) => candidate.id === appearanceState.appearanceCharacterId)
    : undefined
  const biologicalOwner = body
    ? world.characters.find((candidate) => candidate.id === body.originalCharacterId)
    : undefined
  const occupancy = world.occupancies.find((candidate) => candidate.bodyId === entityId)
  const activeConsciousness = occupancy
    ? world.consciousnesses.find((candidate) => candidate.id === occupancy.consciousnessId)
    : undefined
  const consciousnessOwner = activeConsciousness?.originCharacterId
    ? world.characters.find((candidate) => candidate.id === activeConsciousness.originCharacterId)
    : undefined

  return {
    body,
    appearanceState,
    structuralApparentCharacter,
    biologicalOwner,
    ownerCharacter: biologicalOwner || structuralApparentCharacter,
    activeConsciousness,
    consciousnessOwner,
  }
}

export interface KnowledgeView {
  relatedFacts: SubjectiveFact[]
  relatedBeliefs: Belief[]
  isObserverBody: boolean
  hasConfirmedKnowledge: boolean
  hasBeliefOnly: boolean
  observerCharacter?: MapCharacter
  observerApparentCharacter?: MapCharacter
}

/** A body and the character it belongs to: the two ids the archive files facts under. */
type KnowledgeSubject = { entityId: string; ownerId: string | null | undefined }

/** Everything the observer holds about either id, fact or belief alike. */
function relatedRecords(perspective: PerspectiveState | null, subject: KnowledgeSubject) {
  const { entityId, ownerId } = subject
  return {
    relatedFacts: (perspective?.knownFacts || []).filter(
      (fact) => fact.subjectId === entityId || fact.subjectId === ownerId,
    ),
    relatedBeliefs: (perspective?.beliefs || []).filter(
      (belief) => belief.subjectId === entityId || belief.subjectId === ownerId,
    ),
  }
}

/** Whether the observer is this body, and whether they can confirm who it is. */
function knowledgeStanding(
  subject: KnowledgeSubject,
  perspective: PerspectiveState | null,
  relatedFacts: SubjectiveFact[],
) {
  const observer = perspective?.observer
  const knownCharacterIds = new Set<string>(perspective?.knownCharacters || [])
  const isObserverBody = Boolean(
    observer?.currentBodyId && observer.currentBodyId === subject.entityId,
  )
  const knowsOwner = Boolean(subject.ownerId && knownCharacterIds.has(subject.ownerId))

  return {
    isObserverBody,
    hasConfirmedKnowledge: isObserverBody || knowsOwner || relatedFacts.length > 0,
  }
}

/** The two characters the observer is, structurally and as they appear. */
function observerCharacters(world: MapWorldState, observer: PerspectiveState['observer'] | null) {
  return {
    observerCharacter: world.characters.find((character) => character.id === observer?.characterId),
    observerApparentCharacter: world.characters.find(
      (character) => character.id === observer?.apparentCharacterId,
    ),
  }
}

/** What the current observer knows, believes, or merely suspects about this body. */
export function resolveKnowledge(
  subject: { entityId: string; body: Body },
  world: MapWorldState,
  perspective: PerspectiveState | null,
): KnowledgeView {
  const target = { entityId: subject.entityId, ownerId: subject.body.originalCharacterId }
  const records = relatedRecords(perspective, target)
  const standing = knowledgeStanding(target, perspective, records.relatedFacts)

  return {
    ...records,
    ...standing,
    hasBeliefOnly: !standing.hasConfirmedKnowledge && records.relatedBeliefs.length > 0,
    ...observerCharacters(world, perspective?.observer ?? null),
  }
}

/**
 * A contested fact outranks everything: the observer holds a belief the world
 * denies, and the marker has to say so rather than quietly showing either side.
 */
export function resolveKnowledgeState(
  presence: MapPresence,
  knowledge: KnowledgeView,
): KnowledgeVisualState {
  if (knowledge.relatedFacts.some((fact) => fact.truthStatus === 'CONTESTED')) return 'contradicted'
  if (knowledge.hasConfirmedKnowledge) return 'confirmed'
  if (knowledge.hasBeliefOnly) return 'believed'
  if (presence.certainty === 'CONFIRMED') return 'confirmed'
  if (presence.certainty === 'PROBABLE') return 'suspected'
  if (presence.certainty === 'LAST_KNOWN') return 'outdated'
  return 'unknown'
}

interface IdentityNames {
  bodyName: string
  consciousness: string
  appearance: string
  perceivedIdentity: string
}

/** The body's own name: its owner's, the label it carries, or none at all. */
function bodyNameOf(entities: PresenceEntities, locale: Locale) {
  return (
    displayName(entities.biologicalOwner?.canonicalName || entities.body?.label, locale) ||
    messagesFor(locale).map.unknownBody
  )
}

/** The names the world state carries, before any observer is taken into account. */
function structuralNames(entities: PresenceEntities, locale: Locale) {
  const bodyName = bodyNameOf(entities, locale)

  return {
    bodyName,
    consciousnessName: displayName(
      entities.consciousnessOwner?.canonicalName || entities.activeConsciousness?.label || bodyName,
      locale,
    ),
    appearanceName: displayName(
      entities.structuralApparentCharacter?.canonicalName || bodyName,
      locale,
    ),
  }
}

/**
 * The observer looking at their own body knows it from the inside, so the
 * perspective's own identity outranks whatever the world state records.
 */
function observedNames(
  structural: ReturnType<typeof structuralNames>,
  knowledge: KnowledgeView,
  perspective: PerspectiveState | null,
) {
  if (!knowledge.isObserverBody) {
    return { consciousness: structural.consciousnessName, appearance: structural.appearanceName }
  }

  return {
    consciousness:
      knowledge.observerCharacter?.canonicalName ||
      perspective?.observer?.consciousnessId ||
      structural.consciousnessName,
    appearance: knowledge.observerApparentCharacter?.canonicalName || structural.appearanceName,
  }
}

/**
 * What this observer is allowed to see. An observer who cannot confirm the
 * identity must not be shown the name: they get the apparent identity, or
 * nothing at all when even that is unknown.
 */
function perceivedName(
  seen: { followedIdentity: string; appearance: string },
  knowledge: KnowledgeView,
  view: Viewpoint,
) {
  const { followedIdentity, appearance } = seen
  const { perspectiveIsReader, locale } = view
  if (perspectiveIsReader || knowledge.isObserverBody) return followedIdentity
  if (knowledge.hasConfirmedKnowledge) return appearance
  const m = messagesFor(locale).map
  return knowledge.hasBeliefOnly ? m.assumedIdentity : m.unknownIndividual
}

/** The three identity axes, then the one the visitor is actually shown. */
export function resolveIdentityNames(
  entities: PresenceEntities,
  knowledge: KnowledgeView,
  view: Viewpoint,
): IdentityNames {
  const { perspective, followMode, locale } = view
  const structural = structuralNames(entities, locale)
  const { consciousness, appearance } = observedNames(structural, knowledge, perspective)

  const followedIdentity =
    followMode === 'body'
      ? structural.bodyName
      : followMode === 'appearance'
        ? appearance
        : consciousness

  return {
    bodyName: structural.bodyName,
    consciousness,
    appearance,
    perceivedIdentity: perceivedName({ followedIdentity, appearance }, knowledge, view),
  }
}

/** Where the marker's claim comes from, so the panel can cite it. */
export function resolveSourceLabel(knowledge: KnowledgeView, locale: Locale) {
  const m = messagesFor(locale).map
  const predicate = knowledge.relatedFacts[0]?.predicate || knowledge.relatedBeliefs[0]?.predicate
  if (knowledge.hasConfirmedKnowledge) return m.factSource(predicate)
  if (knowledge.hasBeliefOnly) return m.beliefSource(predicate)
  return m.structuralPresence
}

/** The character the follow mode is tracking, which need not be the body's owner. */
export function resolveFollowedCharacter(entities: PresenceEntities, followMode: FollowMode) {
  if (followMode === 'consciousness') return entities.consciousnessOwner
  if (followMode === 'appearance')
    return entities.structuralApparentCharacter || entities.biologicalOwner
  return entities.biologicalOwner
}

/** True when the consciousness in this body originated in someone else. */
export function hasConsciousnessTransfer(body: Body, entities: PresenceEntities) {
  const origin = entities.activeConsciousness?.originCharacterId
  return Boolean(origin && body.originalCharacterId !== origin)
}
