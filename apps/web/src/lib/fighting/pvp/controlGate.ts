/** A new server control generation clears held inputs until the player returns to neutral. */
export function createPvpControlGate() {
  let epoch: number | null = null
  let neutral = false
  return {
    accept(next: number, requireNeutral = true) {
      const changed = epoch !== null && next !== epoch
      if (changed && requireNeutral) neutral = true
      epoch = next
      return changed
    },
    input(value: number) {
      if (value === 0) neutral = false
      return neutral ? 0 : value
    },
    get blocked() {
      return neutral
    },
  }
}
