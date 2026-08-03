/**
 * Reading a world snapshot through the body/character indirection.
 *
 * Presences name a *body*, never a character. On the Black Whale a body may be
 * occupied by someone else's consciousness, or be wearing a Nen appearance, so
 * "where is character X" is only answerable after resolving who is behind the
 * body. Both the spoiler filter and the canonical-truth view got this wrong in
 * their own way before living here: filtering presences by character id drops
 * every position of an occupied body.
 */

/** A presence row as these helpers read it. */
export interface SnapshotPresence {
  /** The *body* id, not a character id. */
  entityId: string
  locationId?: string | null
  certainty?: string | null
}

/** A body row as these helpers read it. */
export interface SnapshotBody {
  id: string
  /** Absent for bodies with no canonical owner, e.g. conjured ones. */
  originalCharacterId?: string | null
}

/** An appearance row: the body `entityId` currently looks like another character. */
export interface SnapshotAppearance {
  entityId: string
  appearanceCharacterId?: string | null
}

// ──────────────────────────────────────────────
// Spoiler visibility
// ──────────────────────────────────────────────

/**
 * The bodies a reader may see, given the characters they may see.
 *
 * A body qualifies either because its owner is visible, or because it is
 * currently wearing the appearance of a visible character — the reader has met
 * the face even when the owner is still unrevealed.
 */
export function resolveVisibleBodyIds(
  snapshot: { bodies: SnapshotBody[]; appearances: SnapshotAppearance[] },
  visibleCharacterIds: ReadonlySet<string>,
): Set<string> {
  const bodiesWearingAVisibleFace = new Set(
    snapshot.appearances
      .filter(
        (appearance) =>
          appearance.appearanceCharacterId &&
          visibleCharacterIds.has(appearance.appearanceCharacterId),
      )
      .map((appearance) => appearance.entityId),
  )

  return new Set(
    snapshot.bodies
      .filter(
        (body) =>
          (body.originalCharacterId && visibleCharacterIds.has(body.originalCharacterId)) ||
          bodiesWearingAVisibleFace.has(body.id),
      )
      .map((body) => body.id),
  )
}

/** Keeps only the presences of bodies the reader may see. */
export function filterPresencesByBodies<P extends SnapshotPresence>(
  presences: P[],
  visibleBodyIds: ReadonlySet<string>,
): P[] {
  return presences.filter((presence) => visibleBodyIds.has(presence.entityId))
}

// ──────────────────────────────────────────────
// Canonical truth
// ──────────────────────────────────────────────

export interface CanonicalPosition {
  locationId: string | null
  certainty: string
}

/**
 * Where every character actually is, whatever anyone believes.
 *
 * Keyed by the *owner* of the occupied body, so a transferred consciousness
 * reports the position of the body it now inhabits. A body with no owner falls
 * back to its own id rather than being dropped.
 */
export function buildCanonicalPositions(snapshot: {
  bodies?: SnapshotBody[] | null
  presences?: SnapshotPresence[] | null
}): Record<string, CanonicalPosition> {
  const bodyById = new Map((snapshot.bodies || []).map((body) => [body.id, body]))
  const positions: Record<string, CanonicalPosition> = {}

  for (const presence of snapshot.presences || []) {
    const body = bodyById.get(presence.entityId)
    const subjectId = body?.originalCharacterId || presence.entityId
    positions[subjectId] = {
      locationId: presence.locationId || null,
      certainty: presence.certainty || 'CONFIRMED',
    }
  }

  return positions
}
