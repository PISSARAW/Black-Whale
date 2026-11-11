import type { ProposedWorldEvent } from '@black-whale/canon-engine'

export interface ConditionalReaction {
  owner: 'PLAYER' | 'OPPOSITION'
  trigger: 'HOSTILE_MOVE'
  locationId: string
  effect: 'BLOCK'
}

export interface SimultaneousResolution {
  player: ProposedWorldEvent[]
  opposition: ProposedWorldEvent[]
  blockedPlayer: ProposedWorldEvent[]
  blockedOpposition: ProposedWorldEvent[]
}

export function blockingReactions(
  playerLocations: Iterable<string>,
  oppositionLocations: Iterable<string>,
): ConditionalReaction[] {
  const reactions = (owner: ConditionalReaction['owner'], locations: Iterable<string>) =>
    [...locations].map((locationId) => ({
      owner,
      trigger: 'HOSTILE_MOVE' as const,
      locationId,
      effect: 'BLOCK' as const,
    }))
  return [...reactions('PLAYER', playerLocations), ...reactions('OPPOSITION', oppositionLocations)]
}

/** Reveals both sealed plans together, then applies only declared reactions. */
export function resolveSimultaneousOrders(input: {
  player: readonly ProposedWorldEvent[]
  opposition: readonly ProposedWorldEvent[]
  reactions: readonly ConditionalReaction[]
}): SimultaneousResolution {
  const playerBlocks = reactionLocations(input.reactions, 'OPPOSITION')
  const oppositionBlocks = reactionLocations(input.reactions, 'PLAYER')
  const blockedPlayer = movesInto(input.player, playerBlocks)
  const blockedOpposition = movesInto(input.opposition, oppositionBlocks)
  return {
    player: input.player.filter((event) => !blockedPlayer.includes(event)),
    opposition: input.opposition.filter((event) => !blockedOpposition.includes(event)),
    blockedPlayer,
    blockedOpposition,
  }
}

function reactionLocations(
  reactions: readonly ConditionalReaction[],
  owner: ConditionalReaction['owner'],
) {
  return new Set(
    reactions.filter((reaction) => reaction.owner === owner).map((item) => item.locationId),
  )
}

function movesInto(events: readonly ProposedWorldEvent[], locations: Set<string>) {
  return events.filter(
    (event) =>
      event.type === 'ENTITY_MOVED' &&
      Boolean(event.payload.presence.locationId) &&
      locations.has(event.payload.presence.locationId!),
  )
}
