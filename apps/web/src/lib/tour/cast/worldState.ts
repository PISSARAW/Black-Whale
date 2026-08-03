/**
 * The world state, translated out of the database's keys and into the
 * catalogue's.
 *
 * A module of its own for two reasons. SvelteKit allows a `+page.server.ts` no
 * exports but its own, so a translation that anything else can test cannot live
 * there. And the seam is worth naming: it is where a relational world state
 * stops and a projection over `data/` begins.
 */

/**
 * The two halves of this chantier speak different languages, and both are right
 * to. The timeline answers in row ids — a body's owner is a `Character` primary
 * key, a presence's chapter is a `Chapter` primary key — because that is what a
 * relational world state is. `lib/tour/cast/` answers in slugs, because `data/`
 * and `blueprint.json` are the only things it reads and neither has ever heard
 * of a uuid.
 *
 * Translating here rather than teaching either side the other's keys is what
 * keeps the projection pure and testable without a database. It is also the
 * defect this function exists because of: the walk shipped with an empty cast
 * for exactly as long as it took to notice that `originalCharacterId` is not
 * `kurapika`.
 */
export function inSlugSpace(world: {
  characters: unknown[]
  bodies: unknown[]
  appearances: unknown[]
  presences: unknown[]
}) {
  const characters = world.characters as Array<{ id: string; slug: string }>
  const slugOf = new Map(characters.map((character) => [character.id, character.slug]))
  const bodies = world.bodies as Array<{ id: string; originalCharacterId: string | null }>
  const appearances = world.appearances as Array<{
    entityId: string
    appearanceCharacterId: string | null
  }>
  const presences = world.presences as Array<{
    entityId: string
    locationId: string | null
    precision: string
    fromEvent?: { chapter?: { number?: number | null } | null } | null
  }>

  return {
    bodies: bodies.map((body) => ({
      id: body.id,
      originalCharacterId: body.originalCharacterId
        ? (slugOf.get(body.originalCharacterId) ?? null)
        : null,
    })),
    appearances: appearances.map((appearance) => ({
      entityId: appearance.entityId,
      appearanceCharacterId: appearance.appearanceCharacterId
        ? (slugOf.get(appearance.appearanceCharacterId) ?? null)
        : null,
    })),
    presences: presences.map((presence) => ({
      entityId: presence.entityId,
      locationId: presence.locationId,
      precision: presence.precision,
      // The chapter reference the archive writes everywhere else, rebuilt from
      // the number the join already carries: `ch-361`, not a row id nobody can
      // read on a card.
      fromEvent: {
        chapterId:
          presence.fromEvent?.chapter?.number === undefined ||
          presence.fromEvent?.chapter?.number === null
            ? null
            : `ch-${presence.fromEvent.chapter.number}`,
      },
    })),
  }
}
