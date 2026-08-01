/**
 * Building a character's chronicle out of the temporal tables.
 *
 * A character is not one continuous thread: their body and their
 * consciousness can be in two different places, and the manga catalogue
 * records appearances the database has no rows for. These functions weave
 * those sources into one ordered timeline and then fold it per chapter.
 *
 * They are pure over plain rows — the route fetches, this decides — so the
 * weaving rules can be tested without a database.
 */

export type TimelineEntry = {
  chapter: number | null
  sequence: number
  kind:
    'body-location' | 'body-state' | 'consciousness-state' | 'consciousness-location' | 'appearance'
  label: string
  detail?: string | null
  location?: string | null
  certainty?: string | null
  untilChapter?: number | null
  isFlashback?: boolean
  occurredAtLabel?: string | null
}

export type ChapterVisit = {
  sequence: number
  location: string
  detail?: string | null
  subject: 'body' | 'consciousness' | 'character'
  certainty?: string | null
}

export type ChapterTrajectory = {
  chapter: number
  visits: ChapterVisit[]
  events: TimelineEntry[]
  isMovement: boolean
}

export const eventDetail = (event: any) => event?.summary || event?.title || null

export function buildLocationPaths(locations: any[]) {
  const byId = new Map(locations.map((location) => [location.id, location]))
  const paths = new Map<string, string>()
  const resolve = (location: any): string => {
    if (!location) return 'Position inconnue'
    if (paths.has(location.id)) return paths.get(location.id)!
    const parent = location.parentLocationId ? byId.get(location.parentLocationId) : null
    const path =
      parent && parent.id !== 'black-whale-1'
        ? `${resolve(parent)} › ${location.name}`
        : location.name
    paths.set(location.id, path)
    return path
  }
  for (const location of locations) resolve(location)
  return paths
}

export const presenceLocation = (presence: any, paths: Map<string, string>) =>
  presence?.location ? paths.get(presence.location.slug) || presence.location.name : null

export const activeAtChapter = (record: any, chapter: number) => {
  const from = record.fromEvent.chapter.number
  const until = record.untilEvent?.chapter.number ?? Number.POSITIVE_INFINITY
  return from <= chapter && chapter <= until
}

export function bodyTimeline(
  body: any,
  locationPaths: Map<string, string>,
  includeLocation = true,
): TimelineEntry[] {
  if (!body) return []
  return [
    ...(includeLocation
      ? body.presences.map((presence: any) => ({
          chapter: presence.fromEvent.chapter.number,
          sequence: presence.fromEvent.sequence,
          kind: 'body-location' as const,
          label: presenceLocation(presence, locationPaths) || 'Position inconnue',
          detail: eventDetail(presence.fromEvent),
          location: presenceLocation(presence, locationPaths),
          certainty: presence.certainty,
          untilChapter: presence.untilEvent?.chapter.number || null,
          isFlashback: presence.fromEvent.isFlashback,
          occurredAtLabel: presence.fromEvent.occurredAtLabel,
        }))
      : []),
    ...body.states.map((state: any) => ({
      chapter: state.fromEvent.chapter.number,
      sequence: state.fromEvent.sequence,
      kind: 'body-state' as const,
      label: state.state,
      detail: eventDetail(state.fromEvent),
      untilChapter: state.untilEvent?.chapter.number || null,
      isFlashback: state.fromEvent.isFlashback,
      occurredAtLabel: state.fromEvent.occurredAtLabel,
    })),
  ]
}

export function buildTimeline(
  character: any,
  jsonCharacter: any,
  locationPaths: Map<string, string>,
): TimelineEntry[] {
  const timeline = bodyTimeline(character?.originalBody, locationPaths)
  const consciousness = character?.originalConsciousness

  for (const state of consciousness?.states || []) {
    timeline.push({
      chapter: state.fromEvent.chapter.number,
      sequence: state.fromEvent.sequence,
      kind: 'consciousness-state',
      label: state.state,
      detail: eventDetail(state.fromEvent),
      untilChapter: state.untilEvent?.chapter.number || null,
      isFlashback: state.fromEvent.isFlashback,
      occurredAtLabel: state.fromEvent.occurredAtLabel,
    })
  }

  for (const occupancy of consciousness?.occupancies || []) {
    const destination = occupancy.body?.character?.canonicalName
      ? `Corps de ${occupancy.body.character.canonicalName}`
      : occupancy.body?.label || 'Corps inconnu'
    const presence = occupancy.body?.presences?.findLast?.(
      (item: any) =>
        item.fromEvent.chapter.number < occupancy.fromEvent.chapter.number ||
        (item.fromEvent.chapter.number === occupancy.fromEvent.chapter.number &&
          item.fromEvent.sequence <= occupancy.fromEvent.sequence),
    )
    timeline.push({
      chapter: occupancy.fromEvent.chapter.number,
      sequence: occupancy.fromEvent.sequence,
      kind: 'consciousness-location',
      label: destination,
      detail: eventDetail(occupancy.fromEvent),
      location: presenceLocation(presence, locationPaths),
      certainty: occupancy.certainty,
      untilChapter: occupancy.untilEvent?.chapter.number || null,
      isFlashback: occupancy.fromEvent.isFlashback,
      occurredAtLabel: occupancy.fromEvent.occurredAtLabel,
    })
  }

  // The catalogue covers exceptional states not yet represented by the temporal database.
  const exceptionalStatuses = new Set([
    'debut',
    'appears',
    'pictured',
    'death',
    'corpse',
    'soul',
    'clone',
    'impersonated',
    'disguised',
    'absent',
  ])
  for (const appearance of jsonCharacter.mangaAppearances || []) {
    if (!exceptionalStatuses.has(appearance.status)) continue
    const duplicate = timeline.some(
      (entry) =>
        entry.chapter === appearance.chapter &&
        ((appearance.status === 'death' && entry.kind === 'body-state') ||
          (appearance.status === 'soul' && entry.kind === 'consciousness-state')),
    )
    if (!duplicate)
      timeline.push({
        chapter: appearance.chapter,
        sequence: 999,
        kind: 'appearance',
        label: appearance.status,
        detail: appearance.title,
      })
  }

  return timeline.sort(
    (a, b) =>
      (a.chapter ?? Number.MAX_SAFE_INTEGER) - (b.chapter ?? Number.MAX_SAFE_INTEGER) ||
      a.sequence - b.sequence,
  )
}

export function appendApparentBodyTimeline(
  timeline: TimelineEntry[],
  appearances: any[],
  locationPaths: Map<string, string>,
) {
  for (const appearance of appearances) {
    const bodyLabel = appearance.body?.label || 'Entité Nen'
    timeline.push({
      chapter: appearance.fromEvent.chapter.number,
      sequence: appearance.fromEvent.sequence,
      kind: 'appearance',
      label: `${bodyLabel} prend cette apparence`,
      detail: eventDetail(appearance.fromEvent),
      untilChapter: appearance.untilEvent?.chapter.number || null,
      isFlashback: appearance.fromEvent.isFlashback,
      occurredAtLabel: appearance.fromEvent.occurredAtLabel,
    })
    for (const presence of appearance.body?.presences || []) {
      timeline.push({
        chapter: presence.fromEvent.chapter.number,
        sequence: presence.fromEvent.sequence,
        kind: 'body-location',
        label: presenceLocation(presence, locationPaths) || 'Position inconnue',
        detail: `${bodyLabel} · ${eventDetail(presence.fromEvent) || 'présence active'}`,
        location: presenceLocation(presence, locationPaths),
        certainty: presence.certainty,
        untilChapter: presence.untilEvent?.chapter.number || null,
        isFlashback: presence.fromEvent.isFlashback,
        occurredAtLabel: presence.fromEvent.occurredAtLabel,
      })
    }
  }
  return timeline.sort(
    (a, b) =>
      (a.chapter ?? Number.MAX_SAFE_INTEGER) - (b.chapter ?? Number.MAX_SAFE_INTEGER) ||
      a.sequence - b.sequence,
  )
}

/**
 * Everything the trajectory is read from: the character under both the names it
 * is known by — the database row and the catalogue entry — the entries already
 * gathered for it, the catalogue to search for the ones that were missed, and
 * the table that turns a location id into a path.
 */
export interface TrajectorySources {
  timeline: TimelineEntry[]
  character: any
  jsonCharacter: any
  chapters: any[]
  locationPaths: Map<string, string>
}

export function buildChapterTrajectory({
  timeline,
  character,
  jsonCharacter,
  chapters,
  locationPaths,
}: TrajectorySources): ChapterTrajectory[] {
  // A flashback revealed in a chapter is not a present-time position in that
  // chapter. It stays in the event index but must not move the character there.
  const chapterNumbers = new Set(
    timeline.flatMap((entry) =>
      entry.chapter === null || entry.isFlashback ? [] : [entry.chapter],
    ),
  )
  const identifiers = new Set([jsonCharacter.id, character?.slug].filter(Boolean))
  const catalogueEvents = new Map<number, any[]>()

  for (const chapter of chapters) {
    const matchingEvents = (chapter.timeline || []).filter(
      (event: any) =>
        !event.isFlashback &&
        (event.charactersInvolved || []).some((id: string) => identifiers.has(id)),
    )
    if (matchingEvents.length) {
      catalogueEvents.set(chapter.number, matchingEvents)
      chapterNumbers.add(chapter.number)
    }
  }

  const addVisit = (visits: ChapterVisit[], visit: ChapterVisit) => {
    const normalized = visit.location.trim().toLocaleLowerCase()
    const duplicate = visits.find(
      (candidate) =>
        candidate.location.trim().toLocaleLowerCase() === normalized &&
        candidate.subject === visit.subject,
    )
    if (!duplicate) visits.push(visit)
  }

  return [...chapterNumbers]
    .sort((a, b) => a - b)
    .map((chapter): ChapterTrajectory => {
      const events = timeline.filter((entry) => entry.chapter === chapter)
      const visits: ChapterVisit[] = []

      for (const [index, event] of (catalogueEvents.get(chapter) || []).entries()) {
        if (!event.location) continue
        addVisit(visits, {
          sequence: index + 1,
          location: event.location,
          detail: event.event,
          subject: 'character',
          certainty: 'CONFIRMED',
        })
      }

      for (const entry of events) {
        if (entry.isFlashback) continue
        if (entry.kind === 'body-location')
          addVisit(visits, {
            sequence: entry.sequence,
            location: entry.location || entry.label,
            detail: entry.detail,
            subject: 'body',
            certainty: entry.certainty,
          })
        if (entry.kind === 'consciousness-location')
          addVisit(visits, {
            sequence: entry.sequence,
            location: entry.location ? `${entry.location} · ${entry.label}` : entry.label,
            detail: entry.detail,
            subject: 'consciousness',
            certainty: entry.certainty,
          })
      }

      // A temporal presence covering the whole chapter is a valid position even if no move starts there.
      if (!visits.length) {
        const bodyPresence = character?.originalBody?.presences
          ?.filter((presence: any) => activeAtChapter(presence, chapter))
          .sort(
            (a: any, b: any) =>
              b.fromEvent.chapter.number - a.fromEvent.chapter.number ||
              b.fromEvent.sequence - a.fromEvent.sequence,
          )[0]
        const bodyLocation = presenceLocation(bodyPresence, locationPaths)
        if (bodyLocation)
          addVisit(visits, {
            sequence: 0,
            location: bodyLocation,
            detail: 'Position du corps valable pour ce chapitre.',
            subject: 'body',
            certainty: bodyPresence.certainty,
          })

        const activeOccupancy = character?.originalConsciousness?.occupancies
          ?.filter((occupancy: any) => activeAtChapter(occupancy, chapter))
          .sort(
            (a: any, b: any) =>
              b.fromEvent.chapter.number - a.fromEvent.chapter.number ||
              b.fromEvent.sequence - a.fromEvent.sequence,
          )[0]
        if (activeOccupancy && activeOccupancy.bodyId !== character?.originalBody?.id) {
          const hostPresence = activeOccupancy.body?.presences
            ?.filter((presence: any) => activeAtChapter(presence, chapter))
            .sort(
              (a: any, b: any) =>
                b.fromEvent.chapter.number - a.fromEvent.chapter.number ||
                b.fromEvent.sequence - a.fromEvent.sequence,
            )[0]
          const hostLocation = presenceLocation(hostPresence, locationPaths)
          const hostName = activeOccupancy.body?.character?.canonicalName
            ? `corps de ${activeOccupancy.body.character.canonicalName}`
            : activeOccupancy.body?.label
          if (hostLocation && hostName)
            addVisit(visits, {
              sequence: 0,
              location: `${hostLocation} · ${hostName}`,
              detail: 'Position de la conscience valable pour ce chapitre.',
              subject: 'consciousness',
              certainty: activeOccupancy.certainty,
            })
        }
      }

      if (!visits.length)
        visits.push({
          sequence: 0,
          location: 'Position inconnue',
          detail: 'Aucune source ne permet de situer précisément le personnage dans ce chapitre.',
          subject: 'character',
          certainty: 'UNKNOWN',
        })

      visits.sort((a, b) => a.sequence - b.sequence)
      const isMovement = visits.some(
        (visit, index) =>
          index > 0 &&
          visit.subject === visits[index - 1].subject &&
          visit.location !== visits[index - 1].location,
      )
      return { chapter, visits, events, isMovement }
    })
}
