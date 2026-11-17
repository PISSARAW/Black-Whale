import { KNOCKDOWN_KNOCKBACK } from './towerJudging'
import type { FighterMove } from './movesetTypes'

/**
 * Frame advantage of a ground normal or command normal, as the training lab measures it:
 * contact on the first active frame, ordinary hit (no counter-hit, wall splat or
 * grounded hitstun decay). Validated against the engine in moveFrameAdvantage.test.ts.
 */
export interface MoveFrameAdvantage {
  startup: number
  active: number
  recovery: number
  /** 'knockdown' when the hit puts the defender on the ground. */
  onHit: number | 'knockdown'
  onBlock: number
}

const MEASURED_CATEGORIES: ReadonlySet<FighterMove['category']> = new Set(['normal', 'command'])

export function hasStaticFrameAdvantage(move: FighterMove): boolean {
  return (
    MEASURED_CATEGORIES.has(move.category) &&
    move.variant !== 'air' &&
    (move.kind === 'light' || move.kind === 'heavy') &&
    move.tuning.damage > 0
  )
}

export function moveFrameAdvantage(move: FighterMove): MoveFrameAdvantage | null {
  if (!hasStaticFrameAdvantage(move)) return null
  const { startup, active, recovery, hitstun, blockstun, knockback } = move.tuning
  const busy = active + recovery
  return {
    startup,
    active,
    recovery,
    onHit: knockback >= KNOCKDOWN_KNOCKBACK ? 'knockdown' : hitstun - busy,
    onBlock: blockstun - busy,
  }
}

/**
 * Frames during which `next` can be started after `first` has recovered and still hit
 * before the defender recovers. Zero or less: no link. Validated in the test.
 */
export function linkWindow(first: MoveFrameAdvantage, next: { startup: number }): number {
  return first.onHit === 'knockdown' ? 0 : first.onHit - next.startup
}

export function formatFrameAdvantage(value: number | 'knockdown', language: 'fr' | 'en'): string {
  if (value === 'knockdown') return language === 'fr' ? 'Sol' : 'KD'
  if (value > 0) return `+${value}`
  return value < 0 ? `−${-value}` : '0'
}
