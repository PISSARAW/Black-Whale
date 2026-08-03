import { prisma } from '$lib/server/db'
import { readSpoilerLimit, readSpoilerProfile } from '$lib/server/spoiler'
import { timeline } from '$lib/server/timeline'
import { selectEvent } from '@black-whale/canon-engine'
import { HATSU_PROFILES } from '$lib/nen/hatsuRegistry'
import { TOUR_HATSU_KINDS } from '$lib/tour/hatsu'
import { inSlugSpace, rosterFrom, type RosterAbility, type RosterCharacter } from '$lib/tour/cast'
import type { CastPayload } from '$lib/tour/cast'
import { NO_HOUR, shipHourOf, type ShipHour } from '$lib/tour/hour'
import characterCatalog from '../../../../../data/characters/characters.json'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import type { PageServerLoad } from './$types'

/**
 * Who is aboard while the visitor walks.
 *
 * The walk used to load nothing: the ship is `blueprint.json`, and
 * `blueprint.json` is geometry. ADR-003 gives it people, and it takes them from
 * exactly where `/ship` takes its markers — `selectEvent` over the events under
 * the reader's cap, then `timeline.getWorldState`. The two surfaces cannot
 * disagree about who is in room 1014 because they are reading the same answer,
 * and the snapshot chantier of ADR-001 will make both cheaper on the same day.
 *
 * What crosses to the browser is a cast list, not a world state: a name, a
 * room, a role, a chapter, and two booleans. The walk needs nothing else, and
 * the payload is the place where that is enforced.
 */

/** Which of the walk's own kinds a technique falls under, or null. */
const KINDS_BY_ABILITY = new Map(HATSU_PROFILES.map((profile) => [profile.id, profile.kind]))
const CARRIED = new Set<string>(TOUR_HATSU_KINDS)

const abilities: RosterAbility[] = (
  abilityCatalog as Array<{ id: string; ownerId?: string | null }>
).map((ability) => {
  const kind = KINDS_BY_ABILITY.get(ability.id as never)
  return {
    ownerId: ability.ownerId ?? null,
    // A technique the walk does not carry is carried as `null` rather than
    // dropped: the conduct may only choose from what the tour can perform, and
    // that filter belongs here, once, where the catalogue is read.
    kind: kind && CARRIED.has(kind) ? kind : null,
  }
})

const catalogue = characterCatalog as unknown as RosterCharacter[]

/**
 * The walk is a reconstruction of a ship, and it was one before it had anybody
 * in it. So a timeline that cannot be reached is an empty ship rather than a
 * failed page: the geometry, the light and every technique still work, and the
 * corridors are as empty as they were the day before ADR-003 — which is a state
 * this walk has always been able to be in.
 */
export const load: PageServerLoad = async (event) => {
  try {
    return await aboardAt(event)
  } catch (error) {
    console.error('Failed to load the cast for the tour', error)
    return { cast: empty(readSpoilerLimit(event.cookies) ?? null), hour: NO_HOUR }
  }
}

/** The cast at the projected event, and the hour that event happens at. */
interface Aboard {
  cast: CastPayload
  /**
   * Arbitrated here rather than in the browser — see `$lib/tour/hour`. The
   * hour is where the time is computed, so two clients cannot come to two
   * different skies for the same event by each doing the arithmetic
   * themselves.
   */
  hour: ShipHour
}

const aboardAt = async ({ url, cookies }: Parameters<PageServerLoad>[0]): Promise<Aboard> => {
  const spoilerProfile = readSpoilerProfile(cookies)
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(spoilerProfile ? { chapter: { number: { lte: spoilerProfile.maxChapter } } } : {}),
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true },
  })
  const { event } = selectEvent(events, { eventId: url.searchParams.get('eventId') })
  if (!event) return { cast: empty(spoilerProfile?.maxChapter ?? null), hour: NO_HOUR }

  const world = await timeline.getWorldState({ eventId: event.id })

  // The same cut `/ship` makes: a body whose owner the reader has not met yet
  // is not in the walk either. Applied to characters rather than to presences,
  // because a presence names a body and a body is not a reveal.
  const allowed = spoilerProfile
    ? new Set(
        (
          await prisma.character.findMany({
            where: {
              firstVisibleEvent: { chapter: { number: { lte: spoilerProfile.maxChapter } } },
            },
            select: { slug: true },
          })
        ).map((character) => character.slug),
      )
    : null

  const locations = await prisma.location.findMany({
    select: { id: true, slug: true, parentLocationId: true },
  })

  const { members, beasts } = rosterFrom({
    ...inSlugSpace(world),
    locations,
    catalogue,
    abilities,
  })

  return {
    cast: {
      eventId: event.id,
      chapterNumber: event.chapter.number,
      spoilerLimit: spoilerProfile?.maxChapter ?? null,
      members: allowed ? members.filter((member) => allowed.has(member.characterId)) : members,
      beasts,
    },
    // Read off the event rather than recomputed: the voyage clock runs once, at
    // compile time, and both the walk and `/ship` read what it stamped.
    hour: shipHourOf(event),
  }
}

/** No event under the cap: an empty ship, which is a true answer. */
function empty(spoilerLimit: number | null): CastPayload {
  return { eventId: null, chapterNumber: null, spoilerLimit, members: [], beasts: [] }
}
