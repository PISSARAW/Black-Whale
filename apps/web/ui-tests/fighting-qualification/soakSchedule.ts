/** RAF can carry a timestamp just before a setup call made later in that same frame. */
export function soakSegment(now: number, startedAt: number) {
  return Math.max(0, Math.min(5, Math.floor((now - startedAt) / 100000)))
}
