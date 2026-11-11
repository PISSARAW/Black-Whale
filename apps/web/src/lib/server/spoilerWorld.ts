import {
  filterPresencesByBodies,
  resolveVisibleBodyIds,
  type WorldSnapshot,
} from '@black-whale/canon-engine'

/** The part of a world state the spoiler filter rewrites. */
export type SpoilerFilteredWorld = Pick<
  WorldSnapshot,
  | 'characters'
  | 'bodies'
  | 'consciousnesses'
  | 'presences'
  | 'occupancies'
  | 'appearances'
  | 'bodyStates'
>

type Body = WorldSnapshot['bodies'][number]

/** The ids the reader may see, and the bodies those ids make visible. */
interface Visibility {
  characterIds: ReadonlySet<string>
  bodyIds: ReadonlySet<string>
}

/** An optional reference is safe when it is absent or points at a visible id. */
function isVisibleRef(id: string | null | undefined, visible: ReadonlySet<string>) {
  return !id || visible.has(id)
}

/**
 * A body can be visible because it wears a face the reader has met while its
 * owner is still unrevealed. It then travels anonymous: the owner's id is a
 * slug of their name, and the label is how the archive names the body.
 */
function maskBody(body: Body, visibleCharacterIds: ReadonlySet<string>): Body {
  if (isVisibleRef(body.originalCharacterId, visibleCharacterIds)) return body
  return { ...body, originalCharacterId: undefined, label: '' }
}

/**
 * The identity records — bodies, the minds inside them, the faces they wear,
 * the state they are in — each cut to what the reader may see. A consciousness
 * whose origin is hidden is dropped with every occupancy that names it, so a
 * visible body inhabited by an unrevealed mind reads as its own body.
 */
function filterIdentities(worldState: WorldSnapshot, visibility: Visibility) {
  const { characterIds, bodyIds } = visibility
  const consciousnesses = worldState.consciousnesses.filter((consciousness) =>
    isVisibleRef(consciousness.originCharacterId, characterIds),
  )
  const consciousnessIds = new Set(consciousnesses.map((consciousness) => consciousness.id))
  return {
    bodies: worldState.bodies
      .filter((body) => bodyIds.has(body.id))
      .map((body) => maskBody(body, characterIds)),
    consciousnesses,
    occupancies: worldState.occupancies.filter(
      (occupancy) =>
        bodyIds.has(occupancy.bodyId) && isVisibleRef(occupancy.consciousnessId, consciousnessIds),
    ),
    appearances: worldState.appearances.filter(
      (appearance) =>
        bodyIds.has(appearance.entityId) &&
        isVisibleRef(appearance.appearanceCharacterId, characterIds),
    ),
    bodyStates: Object.fromEntries(
      Object.entries(worldState.bodyStates).filter(([bodyId]) => bodyIds.has(bodyId)),
    ),
  }
}

/**
 * Applies the spoiler cap to every collection of a world state that names a
 * character, directly or through a body: characters outside the reader's
 * allow-list drop out, and so does everything that would place, name or
 * describe them. Used for the present world *and* the next-chapter preview.
 *
 * `null` means the reader has no cap: the identity records pass through whole,
 * and presences keep only bodies a character stands behind, as they always have.
 */
export function applySpoilerFilters(
  worldState: WorldSnapshot,
  allowedCharacterIds: ReadonlySet<string> | null,
): SpoilerFilteredWorld {
  if (!allowedCharacterIds) {
    const { characters, bodies, consciousnesses, occupancies, appearances } = worldState
    const bodyIds = resolveVisibleBodyIds(worldState, new Set(characters.map((c) => c.id)))
    const presences = filterPresencesByBodies(worldState.presences, bodyIds)
    const { bodyStates } = worldState
    return { characters, bodies, consciousnesses, presences, occupancies, appearances, bodyStates }
  }
  const characters = worldState.characters.filter((character) =>
    allowedCharacterIds.has(character.id),
  )
  const characterIds = new Set(characters.map((character) => character.id))
  const bodyIds = resolveVisibleBodyIds(worldState, characterIds)
  return {
    characters,
    presences: filterPresencesByBodies(worldState.presences, bodyIds),
    ...filterIdentities(worldState, { characterIds, bodyIds }),
  }
}
