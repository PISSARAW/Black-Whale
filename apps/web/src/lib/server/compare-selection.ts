/**
 * What the /compare URL asks for.
 *
 * Every field falls back so the page is meaningful on a bare `/compare`: the
 * latest event the reader is allowed to see, and the first two characters as
 * the two sides. The defaults depend on the spoiler-filtered data, which is
 * why this takes the loaded rows rather than reading them itself.
 */

export interface ComparisonSides {
  id: string
}

export interface ComparisonSelection {
  selectedEventId: string
  selectedLeft: string
  selectedRight: string
  /** `?canonical=1` — show objective truth beside the two perspectives. */
  compareCanonical: boolean
  /** Viewport state mirrored between the two maps so they stay aligned. */
  sync: {
    zoom: number
    tier: string
    zone: string
    subject: string
  }
}

export function resolveComparisonSelection(
  searchParams: URLSearchParams,
  data: { characters: ComparisonSides[]; events: ComparisonSides[] },
): ComparisonSelection {
  const latestEvent = data.events[data.events.length - 1]
  const zoom = Number(searchParams.get('zoom'))

  return {
    selectedEventId: searchParams.get('eventId') || latestEvent?.id || '',
    selectedLeft: searchParams.get('left') || data.characters[0]?.id || '',
    selectedRight: searchParams.get('right') || data.characters[1]?.id || '',
    compareCanonical: searchParams.get('canonical') === '1',
    sync: {
      // A junk `?zoom=` must not reach the map as NaN and blank both panels.
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : 1,
      tier: searchParams.get('tier') || 'tier-1',
      zone: searchParams.get('zone') || '',
      subject: searchParams.get('subject') || '',
    },
  }
}
