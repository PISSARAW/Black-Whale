import type { DisplayPresence, PresenceChange } from './workspaceTypes'

/**
 * What changed aboard between two consecutive moments of the voyage.
 *
 * Everyone known now is arrived, moved or unchanged against the moment before;
 * everyone known before and no longer known is departed, kept at the last place
 * the reconstruction had them.
 */
export function diffPresences(
  previous: readonly DisplayPresence[],
  current: readonly DisplayPresence[],
): PresenceChange[] {
  const previousById = new Map(previous.map((presence) => [presence.entityId, presence]))
  const currentIds = new Set(current.map((presence) => presence.entityId))
  const changes: PresenceChange[] = current.map((presence) => {
    const before = previousById.get(presence.entityId)
    const moved =
      before &&
      (before.locationId !== presence.locationId || before.precision !== presence.precision)
    return {
      ...presence,
      change: before ? (moved ? 'moved' : 'unchanged') : 'arrived',
      previousLocationLabel: before?.locationLabel ?? null,
      previousTierId: before?.tierId ?? null,
    }
  })
  for (const before of previous) {
    if (currentIds.has(before.entityId)) continue
    changes.push({
      ...before,
      change: 'departed',
      previousLocationLabel: before.locationLabel,
      previousTierId: before.tierId,
    })
  }
  return changes
}
