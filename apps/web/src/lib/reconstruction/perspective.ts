export interface PerspectiveProjection {
  visibleBodyIds: string[]
  knownFactCount: number
  beliefCount: number
}

export function visibleInPerspective<T extends { entityId: string }>(
  presences: T[],
  projection: PerspectiveProjection | null,
): T[] {
  if (!projection) return presences
  const visible = new Set(projection.visibleBodyIds)
  return presences.filter((presence) => visible.has(presence.entityId))
}

/** Who is looking, and what the server last said they can see. */
export interface ObserverView {
  observer: string
  projection: PerspectiveProjection | null
}

/**
 * What a chosen observer is allowed to see.
 *
 * The objective canon sees everything. A character sees only the bodies their
 * projection names — and while that projection is loading or has failed, they
 * see nobody: falling back to the canon would present omniscience under a
 * character's name.
 */
export function observedBy<T>(items: T[], view: ObserverView, bodyOf: (item: T) => string): T[] {
  if (view.observer === 'canon') return items
  if (!view.projection) return []
  const visible = new Set(view.projection.visibleBodyIds)
  return items.filter((item) => visible.has(bodyOf(item)))
}
