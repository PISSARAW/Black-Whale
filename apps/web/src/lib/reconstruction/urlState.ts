export interface ReconstructionUrlState {
  eventId: string | null
  view: 'overview' | 'scene'
  follow: string | null
  changesOnly: boolean
  certainty: string
  observer: string
}

export function readReconstructionUrl(
  params: Pick<URLSearchParams, 'get'>,
): ReconstructionUrlState {
  return {
    eventId: params.get('event'),
    view: params.get('view') === 'scene' ? 'scene' : 'overview',
    follow: params.get('follow'),
    changesOnly: params.get('changes') === '1',
    certainty: params.get('certainty') ?? 'all',
    observer: params.get('observer') ?? 'canon',
  }
}

export function writeReconstructionUrl(state: ReconstructionUrlState): string {
  const entries: [string, string][] = []
  if (state.eventId) entries.push(['event', state.eventId])
  if (state.view !== 'overview') entries.push(['view', state.view])
  if (state.follow) entries.push(['follow', state.follow])
  if (state.changesOnly) entries.push(['changes', '1'])
  if (state.certainty !== 'all') entries.push(['certainty', state.certainty])
  if (state.observer !== 'canon') entries.push(['observer', state.observer])
  return entries.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
}

export function sortChronologicalEvents<
  C extends { number: number; events: Array<{ ordinal?: number | null; sequence: number }> },
>(chapters: C[]): Array<{ chapter: C; event: C['events'][number] }> {
  return chapters
    .flatMap((chapter) => chapter.events.map((event) => ({ chapter, event })))
    .sort((a, b) => {
      if (a.event.ordinal != null && b.event.ordinal != null)
        return a.event.ordinal - b.event.ordinal
      return a.chapter.number - b.chapter.number || a.event.sequence - b.event.sequence
    })
}

export function resolveInitialReconstructionParams<
  C extends {
    number: number
    events: Array<{ id: string; ordinal?: number | null; sequence: number }>
  },
>(chapters: C[], searchParams: Pick<URLSearchParams, 'get'>) {
  const requested = readReconstructionUrl(searchParams)
  const events = sortChronologicalEvents(chapters)
  const eventIndex = requested.eventId
    ? events.findIndex((entry) => entry.event.id === requested.eventId)
    : 0
  const validCertainties = ['all', 'CONFIRMED', 'PROBABLE', 'LAST_KNOWN']
  const certaintyFilter = validCertainties.includes(requested.certainty)
    ? requested.certainty
    : 'all'
  return {
    index: eventIndex >= 0 ? eventIndex : 0,
    view: requested.view,
    follow: requested.follow,
    changeFilter: requested.changesOnly ? ('changed' as const) : ('all' as const),
    certaintyFilter,
    observer: requested.observer,
  }
}
