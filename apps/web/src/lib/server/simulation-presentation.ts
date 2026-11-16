import { calculatePresencePosition } from '$lib/components/map/markerProjection'
import { describeError, log } from '$lib/server/log'
import { nenRuntime } from '$lib/server/nen'
import { simulationStore } from '$lib/server/simulations'
import { TABLE_KINDS, type MorenaGame } from '@black-whale/ability-modules'
import type { Location } from '@black-whale/domain'
import { parseNenActionRequest, type AbilityActionPlan } from '@black-whale/nen-engine'

type BranchSnapshot = Awaited<ReturnType<typeof simulationStore.getBranchState>>['snapshot']

export interface SimulationSelection {
  abilityId: string
  actionId: string | null
  actorId: string
  targetId: string | null
}

export function morenaState(snapshot: BranchSnapshot) {
  const effects = Object.values(snapshot.effects)
  const network = effects.find(
    (entry) =>
      entry.abilityId === 'contagion' &&
      entry.attributes['cohortId'] === 'heil-ly-infected' &&
      Array.isArray(entry.attributes['memberIds']),
  )
  const gameEffect = effects
    .filter((entry) => entry.abilityId === 'contagion' && entry.attributes['game'])
    .sort((left, right) => right.startedAt.ordinal - left.startedAt.ordinal)[0]
  const game = (gameEffect?.attributes['game'] as MorenaGame | undefined) ?? null
  const members = morenaMembers(snapshot)

  return {
    networkEffectId: network?.id ?? null,
    ...morenaGameDetails(gameEffect),
    game,
    members,
    tableKinds: TABLE_KINDS,
  }
}

/**
 * The plan the server would follow if the form were submitted as it stands.
 * It is the same call `activate` makes, so what the panel lists is what the
 * branch will receive — the page no longer merely claims that it is.
 */
export async function planFor(
  snapshot: BranchSnapshot,
  selection: SimulationSelection,
): Promise<AbilityActionPlan | null> {
  if (!selection.actionId || !selection.actorId) return null
  try {
    return await nenRuntime.planInState(
      selection.abilityId,
      parseNenActionRequest({
        actorId: selection.actorId,
        interaction: selection.actionId,
        actionId: selection.actionId,
        targets: selection.targetId ? [selection.targetId] : [],
        eventId: snapshot.cursor.eventId,
      }),
      snapshot,
    )
  } catch (error) {
    // A malformed selection must not cost the visitor the whole branch view.
    log.error('[simulations] plan', describeError(error))
    return null
  }
}

/** The actions the selected ability offers in this branch, with their visibility. */
export async function actionsFor(snapshot: BranchSnapshot, selection: SimulationSelection) {
  if (!selection.actorId) return []
  try {
    return await nenRuntime.actionsInState(
      selection.abilityId,
      parseNenActionRequest({
        actorId: selection.actorId,
        interaction: 'activate',
        targets: selection.targetId ? [selection.targetId] : [],
        eventId: snapshot.cursor.eventId,
      }),
      snapshot,
    )
  } catch (error) {
    log.error('[simulations] actions', describeError(error))
    return []
  }
}

/**
 * The branch drawn on the deck plan rather than counted.
 *
 * The scene panel used to report three numbers — markers, effect links, aura
 * layers — which is a summary of a map, not a map. The projection that places a
 * canonical presence on the ship SVG reads the same fields a branch marker
 * carries, so the branch is placed with it.
 */
export function sceneMarkers(
  scene: Awaited<ReturnType<typeof simulationStore.getMapScene>>,
  snapshot: BranchSnapshot,
  locations: Location[],
) {
  const presences = scene.markers.map((marker) => ({
    id: marker.entity.id,
    entityType: 'BODY' as const,
    entityId: marker.entity.id,
    locationId: marker.locationId,
    fromEventId: snapshot.cursor.eventId,
    precision: marker.precision,
    certainty: marker.certainty,
  }))

  /** Entities an effect of this branch starts from or lands on. */
  const touched = new Set(
    Object.values(snapshot.effects)
      .filter((effect) => effect.state !== 'ENDED')
      .flatMap((effect) => [effect.source.id, ...effect.targets.map((target) => target.id)]),
  )

  const markers = presences.map((presence, index) => {
    const placement = calculatePresencePosition(presence, presences, locations)
    const marker = scene.markers[index]
    return {
      id: presence.entityId,
      label: marker.label,
      x: placement.x,
      y: placement.y,
      tier: placement.tierId,
      locationLabel: placement.loc?.name ?? null,
      state:
        marker.certainty === 'CONFIRMED'
          ? ('confirmed' as const)
          : marker.certainty === 'PROBABLE'
            ? ('believed' as const)
            : ('outdated' as const),
      // Highlighted rather than "the observer": on this map the entities worth
      // picking out are the ones the branch's own effects reach. An effect names
      // the character, while a marker is usually their body, so the body's owner
      // counts too — otherwise the entity an ability just hit is not marked.
      isObserver:
        touched.has(presence.entityId) ||
        touched.has(snapshot.entities[presence.entityId]?.originalCharacterId ?? ''),
    }
  })

  // The deck most of the scene stands on is the one worth drawing.
  const counts = new Map<string, number>()
  for (const marker of markers) {
    if (marker.tier) counts.set(marker.tier, (counts.get(marker.tier) ?? 0) + 1)
  }
  const tier = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null

  return { markers, tier }
}

function morenaMembers(snapshot: BranchSnapshot) {
  const effects = Object.values(snapshot.effects)
  return effects.flatMap((entry) => {
    if (entry.abilityId !== 'contagion' || typeof entry.attributes['memberId'] !== 'string')
      return []
    return [
      {
        effectId: entry.id,
        memberId: entry.attributes['memberId'] as string,
        label:
          snapshot.entities[entry.attributes['memberId'] as string]?.label ??
          String(entry.attributes['memberId']),
        level: Number(entry.attributes['level'] ?? 0),
        kills: Number(entry.attributes['kills'] ?? 0),
      },
    ]
  })
}

function morenaGameDetails(gameEffect: BranchSnapshot['effects'][string] | undefined) {
  return {
    gameEffectId: gameEffect?.id ?? null,
    gameEffectState: gameEffect?.state ?? null,
    candidateId:
      typeof gameEffect?.attributes['candidateId'] === 'string'
        ? gameEffect.attributes['candidateId']
        : null,
    witnessed: gameEffect?.attributes['witnessedMurder'] === true,
  }
}
