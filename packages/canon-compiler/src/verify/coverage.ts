import type { Character } from '@black-whale/contracts'
import { isActiveAt } from '@black-whale/domain'
import { deathChapter, PRESENT_STATUSES } from '../characters.js'

/**
 * Whether the map agrees with the catalogue, decided on data alone.
 *
 * The compiler projects `characters.json` into Presence and BodyState rows, and
 * nothing else re-reads those rows to confirm the projection survived. This
 * does: it walks every chapter the catalogue says a character is physically on
 * panel and asserts the map puts them somewhere aboard at that point.
 *
 * The catalogue-side half of this check — bare tiers, malformed trajectories,
 * rooms filed on the wrong deck — moved into canon-lint, where it fails before
 * the deploy writes anything. What is left is what only the database can
 * answer.
 */

export interface VerifyEvent {
  id: string
  sequence: number
  ordinal?: number | null
  chapter: { number: number }
  occursOnBlackWhale: boolean
}

export interface VerifyPresence {
  id: string
  entityId: string
  locationSlug: string | null
  locationType: string | null
  fromEvent: VerifyEvent
  untilEvent?: VerifyEvent | null
}

export interface VerifyBodyState {
  bodyId: string
  state: string
  fromEvent: { chapter: { number: number } }
}

export interface VerifyWorld {
  events: readonly VerifyEvent[]
  presences: readonly VerifyPresence[]
  bodyStates: readonly VerifyBodyState[]
  /** The body each catalogue slug owns, when the projection made one. */
  bodyBySlug: ReadonlyMap<string, { id: string }>
}

export interface Failure {
  scope: string
  message: string
}

/** Events of each chapter that play out aboard, by chapter number. */
function aboardByChapter(events: readonly VerifyEvent[]): Map<number, VerifyEvent[]> {
  const byChapter = new Map<number, VerifyEvent[]>()
  for (const event of events) {
    if (!event.occursOnBlackWhale) continue
    const bucket = byChapter.get(event.chapter.number) ?? []
    bucket.push(event)
    byChapter.set(event.chapter.number, bucket)
  }
  return byChapter
}

/** The compiler resolves a bare `ch-N` to the chapter's first event. */
function firstEventByChapter(events: readonly VerifyEvent[]): Map<number, VerifyEvent> {
  const first = new Map<number, VerifyEvent>()
  for (const event of events) {
    const current = first.get(event.chapter.number)
    if (!current || event.sequence < current.sequence) first.set(event.chapter.number, event)
  }
  return first
}

function checkAppearances({
  character,
  presences,
  index,
}: {
  character: Character
  presences: readonly VerifyPresence[]
  index: { aboard: Map<number, VerifyEvent[]>; first: Map<number, VerifyEvent> }
}): Failure[] {
  const failures: Failure[] = []

  for (const appearance of character.mangaAppearances ?? []) {
    if (!PRESENT_STATUSES.has(appearance.status)) continue
    let events = index.aboard.get(appearance.chapter)
    if (!events) continue // the chapter plays out off the ship

    // Dying ends the presence, so only the part of the chapter up to the death
    // can be checked — and a chapter can open off the ship, as 383 does with
    // Kacho's escape. Nothing to assert then: the death happened elsewhere.
    if (appearance.status === 'death') {
      const deathEvent = index.first.get(appearance.chapter)
      if (!deathEvent) continue
      events = events.filter((event) => event.sequence <= deathEvent.sequence)
      if (!events.length) continue
    }

    const covered = events.some((event) =>
      presences.some((presence) => isActiveAt(presence, event)),
    )
    if (!covered) {
      failures.push({
        scope: character.id,
        message: `« ${appearance.status} » au chapitre ${appearance.chapter} sans position sur la carte`,
      })
    }
  }
  return failures
}

function checkDeath({
  character,
  presences,
  world,
}: {
  character: Character
  presences: readonly VerifyPresence[]
  world: { bodyId: string; states: readonly VerifyBodyState[] }
}): Failure[] {
  const death = deathChapter(character)
  if (death === null) return []

  const failures: Failure[] = []
  const stillOpen = presences.filter(
    (presence) => !presence.untilEvent || presence.untilEvent.chapter.number > death + 1,
  )
  if (stillOpen.length) {
    failures.push({
      scope: character.id,
      message: `meurt au chapitre ${death} mais garde ${stillOpen.length} présence(s) ensuite`,
    })
  }

  const dead = world.states.filter(
    (state) => state.bodyId === world.bodyId && state.state === 'DEAD',
  )
  if (!dead.length) {
    failures.push({
      scope: character.id,
      message: `meurt au chapitre ${death} sans état de corps DEAD`,
    })
  } else if (dead.some((state) => state.fromEvent.chapter.number !== death)) {
    failures.push({
      scope: character.id,
      message: `état DEAD ouvert au chapitre ${dead[0]!.fromEvent.chapter.number}, mort au ${death}`,
    })
  }
  return failures
}

export function verifyMapCoverage(characters: readonly Character[], world: VerifyWorld): Failure[] {
  const failures: Failure[] = []
  const index = { aboard: aboardByChapter(world.events), first: firstEventByChapter(world.events) }

  const byEntity = new Map<string, VerifyPresence[]>()
  for (const presence of world.presences) {
    const bucket = byEntity.get(presence.entityId) ?? []
    bucket.push(presence)
    byEntity.set(presence.entityId, bucket)
  }

  for (const character of characters) {
    const body = world.bodyBySlug.get(character.id)
    if (!body) {
      if (character.mapTrajectory?.length) {
        failures.push({ scope: character.id, message: 'déclare un trajet sans avoir de corps' })
      }
      continue
    }
    const presences = byEntity.get(body.id) ?? []
    failures.push(...checkAppearances({ character, presences, index }))
    failures.push(
      ...checkDeath({
        character,
        presences,
        world: { bodyId: body.id, states: world.bodyStates },
      }),
    )
  }

  // The catalogue check above covers what the catalogue authors; this covers
  // what the projection wrote, including presences no catalogue entry owns.
  for (const presence of world.presences) {
    if (presence.locationType !== 'TIER') continue
    failures.push({
      scope: presence.entityId,
      message: `la présence ${presence.id} est posée sur ${presence.locationSlug}, qui est un pont et non une pièce`,
    })
  }

  return failures
}
