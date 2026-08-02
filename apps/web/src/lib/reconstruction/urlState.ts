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
