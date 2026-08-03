import type {
  EntityRef,
  ProposedWorldEvent,
  WorldEntity,
  WorldState,
} from '@black-whale/canon-engine'

export interface StrategyAIOptions {
  /** Destinations allowed by the scenario. Unknown ids are discarded. */
  destinationIds?: readonly string[]
  destinationTypes?: Readonly<Record<string, 'TIER' | 'ZONE' | 'ROOM' | 'CORRIDOR' | 'UNKNOWN'>>
  /** Injectable for deterministic tests and replayable sessions. */
  random?: () => number
  moveChance?: number
}

/**
 * A faction is catalogued by character, while the map normally tracks a body.
 * Resolve that mismatch once and prefer the already-present physical entity.
 */
export function resolveControlledEntity(
  state: WorldState,
  characterId: string,
): WorldEntity | undefined {
  const direct = state.entities[characterId]
  if (direct && state.presences[direct.id]) return direct

  const physical = Object.values(state.entities).find(
    (entity) =>
      entity.kind === 'BODY' &&
      entity.originalCharacterId === characterId &&
      Boolean(state.presences[entity.id]),
  )
  return physical ?? direct
}

/**
 * Small strategy opponent: it only moves known faction entities to real,
 * scenario-approved locations. Randomness is injectable so a turn can be
 * reproduced in tests or from a seeded caller.
 */
export function generateAIOperations(
  state: WorldState,
  charactersInFaction: readonly string[],
  options: StrategyAIOptions = {},
): ProposedWorldEvent[] {
  const random = options.random ?? Math.random
  const moveChance = Math.min(1, Math.max(0, options.moveChance ?? 0.5))
  const destinationIds = [...new Set(options.destinationIds ?? [])].filter(
    (id) => state.entities[id]?.kind === 'LOCATION',
  )
  if (destinationIds.length === 0) return []

  const operations: ProposedWorldEvent[] = []
  const moved = new Set<string>()

  for (const characterId of new Set(charactersInFaction)) {
    const entity = resolveControlledEntity(state, characterId)
    if (!entity || moved.has(entity.id)) continue
    const current = state.presences[entity.id]
    if (!current || random() >= moveChance) continue

    const choices = destinationIds.filter((id) => id !== current.locationId)
    if (choices.length === 0) continue
    const roll = random()
    const destination = choices[Math.min(choices.length - 1, Math.floor(roll * choices.length))]
    // The index is clamped to the array, so this only guards the type — but a
    // move with no destination is worth skipping rather than asserting away.
    if (destination === undefined) continue
    moved.add(entity.id)
    operations.push({
      type: 'ENTITY_MOVED',
      payload: {
        presence: {
          entity: { id: entity.id, kind: entity.kind } satisfies EntityRef,
          locationId: destination,
          precision:
            options.destinationTypes?.[destination] === 'TIER'
              ? 'TIER'
              : options.destinationTypes?.[destination] === 'ZONE'
                ? 'ZONE'
                : 'EXACT_ROOM',
          certainty: 'CONFIRMED',
        },
      },
    })
  }

  return operations
}
