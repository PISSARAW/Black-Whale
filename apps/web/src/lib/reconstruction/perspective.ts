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
