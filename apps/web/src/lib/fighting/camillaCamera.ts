import type { FightState } from './types'

/** Include the giant cat, raised tail and fallen body in narrow-viewport framing. */
export function camillaCameraSpan(options: {
  state: FightState
  centre: number
  gap: number
  worldX: (value: number) => number
}): { centre: number; gap: number } {
  const cat = options.state.catsName
  if (!cat) return { centre: options.centre, gap: options.gap }
  const killer = options.worldX(options.state[cat.killerSide].x)
  const victim = options.worldX(options.state[cat.victimSide].x)
  const left = Math.min(killer - 1, victim - 1.1)
  const right = Math.max(killer + 1.5, victim + 1.1)
  return { centre: (left + right) / 2, gap: right - left }
}
