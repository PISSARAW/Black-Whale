export const MAX_CATCH_UP_SECONDS = 0.25

export function safeFrameDebt(current: number, elapsed: number): number {
  if (!Number.isFinite(elapsed) || elapsed < 0) return current
  return Math.min(MAX_CATCH_UP_SECONDS, current + elapsed)
}
