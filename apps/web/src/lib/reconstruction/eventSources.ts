interface EventCoordinate {
  id: string
  sequence: number
}

interface ChapterEvents {
  number: number
  events: readonly EventCoordinate[]
}

interface WorldEventSources {
  chapterNumber: number
  localSequence: number
  sourceIds: readonly string[]
}

interface PresenceSources {
  fromEvent: { id: string }
  sources: readonly { id: string }[]
}

export function sourceIdsByEvent(
  chapters: readonly ChapterEvents[],
  worldEvents: readonly WorldEventSources[],
  presences: readonly PresenceSources[],
): Record<string, string[]> {
  const result: Record<string, Set<string>> = {}
  const eventIdByCoordinate = new Map<string, string>()
  for (const chapter of chapters) {
    for (const event of chapter.events) {
      eventIdByCoordinate.set(`${chapter.number}:${event.sequence}`, event.id)
      result[event.id] = new Set()
    }
  }
  for (const event of worldEvents) {
    const eventId = eventIdByCoordinate.get(`${event.chapterNumber}:${event.localSequence}`)
    if (!eventId) continue
    for (const sourceId of event.sourceIds) result[eventId]!.add(sourceId)
  }
  for (const presence of presences) {
    const sources = result[presence.fromEvent.id]
    if (!sources) continue
    for (const source of presence.sources) sources.add(source.id)
  }
  return Object.fromEntries(
    Object.entries(result).map(([eventId, sourceIds]) => [eventId, [...sourceIds]]),
  )
}
