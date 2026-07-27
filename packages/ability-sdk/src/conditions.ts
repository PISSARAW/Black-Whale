import type { AbilityConditionResult, AbilityContext } from '@black-whale/nen-engine'
import { listParam, numberParam, param } from './context.js'

export type ConditionFn = (ctx: AbilityContext) => AbilityConditionResult

export const condition =
  (
    id: string,
    label: string,
    evaluate: (ctx: AbilityContext) => AbilityConditionResult['status'],
    reason?: string,
  ): ConditionFn =>
  (ctx) => ({ id, label, status: evaluate(ctx), reason })

export const canUseNen = (): ConditionFn =>
  condition('can-use-nen', 'Actor can use Nen', (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const abilities = ctx.worldState.abilitiesByOwner[ctx.actorId]
    return abilities?.includes(ctx.abilityId) ? 'MET' : 'UNMET'
  })

export const isConscious = (): ConditionFn =>
  condition('is-conscious', 'Actor is conscious', (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const actor = ctx.worldState.entities[ctx.actorId]
    if (!actor) return 'UNKNOWN'
    const state = String(actor.metadata?.mentalState ?? actor.metadata?.state ?? '')
    return state ? (state === 'ACTIVE' ? 'MET' : 'UNMET') : 'UNKNOWN'
  })

export const isAlive = (): ConditionFn =>
  condition('is-alive', 'Actor body is alive', (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const state = ctx.worldState.bodyStates[ctx.actorId]
    return state ? (state === 'ALIVE' || state === 'INJURED' ? 'MET' : 'UNMET') : 'UNKNOWN'
  })

export const maxDistance = (meters: number): ConditionFn =>
  condition(`max-distance-${meters}`, `Targets are within ${meters} metres`, (ctx) =>
    typeof ctx.parameters?.distanceMeters === 'number'
      ? ctx.parameters.distanceMeters <= meters
        ? 'MET'
        : 'UNMET'
      : 'UNKNOWN',
  )

/** A vow the user swore. Unverifiable from the world state, but always displayed. */
export const vow = (id: string, label: string): ConditionFn =>
  condition(`vow-${id}`, label, () => 'MET', 'Serment déclaré par l’utilisateur')

/**
 * A restriction the manga states but the model cannot check yet. Shows up as
 * "condition non révélée" in the "Why?" panel instead of being silently assumed.
 */
export const unrevealed = (id: string, label: string): ConditionFn =>
  condition(`unknown-${id}`, label, () => 'UNKNOWN', 'Condition non révélée par le canon')

export const requiresParameter = (key: string, label: string): ConditionFn =>
  condition(`parameter-${key}`, label, (ctx) => (param(ctx, key) ? 'MET' : 'UNKNOWN'))

export const requiresTarget = (label = 'Une cible est sélectionnée'): ConditionFn =>
  condition('requires-target', label, (ctx) => (ctx.targets.length > 0 ? 'MET' : 'UNMET'))

/** Chain Jail only closes on the Phantom Troupe: Kurapika's vow, encoded. */
export const targetHasAffiliation = (affiliationId: string, label: string): ConditionFn =>
  condition(`affiliation-${affiliationId}`, label, (ctx) => {
    if (!ctx.worldState || ctx.targets.length === 0) return 'UNKNOWN'
    const statuses = ctx.targets.map((targetId) => {
      const metadata = ctx.worldState?.entities[targetId]?.metadata
      if (!metadata) return 'UNKNOWN'
      const affiliations = metadata['affiliationIds'] ?? metadata['affiliations']
      if (!Array.isArray(affiliations)) return 'UNKNOWN'
      return affiliations.includes(affiliationId) ? 'MET' : 'UNMET'
    })
    if (statuses.includes('UNMET')) return 'UNMET'
    return statuses.includes('UNKNOWN') ? 'UNKNOWN' : 'MET'
  })

export const targetIsAlive = (): ConditionFn =>
  condition('target-is-alive', 'La cible est vivante', (ctx) => {
    if (!ctx.worldState || ctx.targets.length === 0) return 'UNKNOWN'
    const states = ctx.targets.map((targetId) => ctx.worldState?.bodyStates[targetId])
    if (states.some((state) => state === 'DEAD')) return 'UNMET'
    return states.some((state) => state === undefined) ? 'UNKNOWN' : 'MET'
  })

/** Luini, Indoor Fish: the anchor room must still be sealed. */
export const locationIsSealed = (label = 'La pièce d’ancrage est close'): ConditionFn =>
  condition('location-sealed', label, (ctx) => {
    const locationId = param(ctx, 'locationId')
    if (!ctx.worldState || !locationId) return 'UNKNOWN'
    const sealed = ctx.worldState.entities[locationId]?.metadata?.['sealed']
    return typeof sealed === 'boolean' ? (sealed ? 'MET' : 'UNMET') : 'UNKNOWN'
  })

/**
 * Magical Worm and Luini can only reach somewhere the user has already been:
 * the timeline is the condition, not a description.
 */
export const locationAlreadyVisited = (
  label = 'La destination a déjà été visitée par l’utilisateur',
): ConditionFn =>
  condition('location-visited', label, (ctx) => {
    const locationId = param(ctx, 'locationId')
    if (!locationId) return 'UNKNOWN'
    const visited = listParam(ctx, 'visitedLocationIds')
    if (visited.length === 0) return 'UNKNOWN'
    return visited.includes(locationId) ? 'MET' : 'UNMET'
  })

/** Contagion caps its network at 22 members; Silent Majority picks among 10. */
export const belowCapacity = (key: string, capacity: number, label: string): ConditionFn =>
  condition(`capacity-${key}`, label, (ctx) => {
    const used = numberParam(ctx, key)
    return used === undefined ? 'UNKNOWN' : used < capacity ? 'MET' : 'UNMET'
  })

/** Parallel Future and Predator both require the user to be in Zetsu. */
export const inZetsu = (): ConditionFn =>
  condition('in-zetsu', 'L’utilisateur maintient le Zetsu', (ctx) => {
    const declared = ctx.parameters?.['zetsu']
    if (typeof declared === 'boolean') return declared ? 'MET' : 'UNMET'
    if (!ctx.worldState) return 'UNKNOWN'
    const auraState = ctx.worldState.entities[ctx.actorId]?.metadata?.['auraState']
    return typeof auraState === 'string' ? (auraState === 'ZETSU' ? 'MET' : 'UNMET') : 'UNKNOWN'
  })

/**
 * A source effect must exist and still be live — everything that mutates a
 * running effect (counters, triggers, revocations) depends on it.
 */
export const effectIsLive = (
  parameterKey = 'effectId',
  label = 'L’effet visé est actif',
): ConditionFn =>
  condition('effect-live', label, (ctx) => {
    const id = param(ctx, parameterKey)
    if (!ctx.worldState || !id) return 'UNKNOWN'
    const effect = ctx.worldState.effects[id]
    if (!effect) return 'UNMET'
    return effect.state === 'ENDED' ? 'UNMET' : 'MET'
  })

/**
 * A threshold on a counter carried by an effect: Contagion's level 20, a charge
 * gauge, a daily quota. Reads the live effect rather than trusting the caller.
 */
export const effectAttributeAtLeast = (
  key: string,
  threshold: number,
  label: string,
  parameterKey = 'effectId',
): ConditionFn =>
  condition(`attribute-${key}-${threshold}`, label, (ctx) => {
    const id = param(ctx, parameterKey)
    if (!ctx.worldState || !id) return 'UNKNOWN'
    const value = ctx.worldState.effects[id]?.attributes[key]
    if (typeof value !== 'number') return 'UNKNOWN'
    return value >= threshold ? 'MET' : 'UNMET'
  })

/**
 * A yes/no fact the caller asserts: holding one's breath against Salé-salé's
 * smoke, keeping eye contact for Yomotsu Hegui, having been warned by a card.
 */
export const declaredFlag = (key: string, expected: boolean, label: string): ConditionFn =>
  condition(`flag-${key}-${expected}`, label, (ctx) => {
    const value = ctx.parameters?.[key]
    return typeof value === 'boolean' ? (value === expected ? 'MET' : 'UNMET') : 'UNKNOWN'
  })

/**
 * Rihan's Predator only works on what he found out alone: the knowledge engine
 * becomes the activation condition, which no other ability in the catalogue does.
 */
export const soleObserverOf = (factPrefix: string, label: string): ConditionFn =>
  condition(`sole-observer-${factPrefix}`, label, (ctx) => {
    if (!ctx.worldState) return 'UNKNOWN'
    const matches = (records: Record<string, unknown>): boolean =>
      Object.keys(records).some((factId) => factId.startsWith(factPrefix))

    const own = ctx.worldState.knowledgeByObserver[ctx.actorId]
    if (!own || !matches(own)) return 'UNMET'

    const sharedWithSomeoneElse = Object.entries(ctx.worldState.knowledgeByObserver).some(
      ([observerId, records]) => observerId !== ctx.actorId && matches(records),
    )
    return sharedWithSomeoneElse ? 'UNMET' : 'MET'
  })

/** Skill Hunter steals within the hour, Metamorphosen lasts a bounded time. */
export const withinMinutes = (key: string, limit: number, label: string): ConditionFn =>
  condition(`within-${key}-${limit}`, label, (ctx) => {
    const elapsed = numberParam(ctx, key)
    return elapsed === undefined ? 'UNKNOWN' : elapsed <= limit ? 'MET' : 'UNMET'
  })

/** Skill Hunter's four conditions, Rihan's solitary analysis: an explicit checklist. */
export const checklist = (id: string, label: string, steps: string[]): ConditionFn =>
  condition(`checklist-${id}`, label, (ctx) => {
    const done = listParam(ctx, 'completedSteps')
    if (done.length === 0) return 'UNKNOWN'
    return steps.every((step) => done.includes(step)) ? 'MET' : 'UNMET'
  })
