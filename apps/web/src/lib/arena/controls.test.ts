import { describe, expect, it } from 'vitest'
import { ryuDistribution } from '../nen/controls'
import { initialFighter } from '../combat/types'
import { arenaRyuAction, auraPercent, strikeTarget } from './controls'

describe('Arena controls', () => {
  it.each([
    ['head', 'head', 0.45],
    ['torso', 'torso', 0.45],
    ['hands', 'arms', 0.55],
    ['feet', 'legs', 0.45],
  ] as const)('maps the shared %s Ryu zone to Arena', (tourZone, guard, attackShare) => {
    const action = arenaRyuAction(
      { type: 'RYU', distribution: ryuDistribution(tourZone, 0.55) },
      initialFighter([0, 0]),
    )
    expect(action.guard).toBe(guard)
    expect(action.attackShare).toBeCloseTo(attackShare)
  })

  it('keeps minus and equal oriented around the selected zone', () => {
    const fighter = { ...initialFighter([0, 0]), guard: 'head' as const, attackShare: 0.4 }
    const moreHead = arenaRyuAction(
      { type: 'RYU', distribution: ryuDistribution('head', 0.7) },
      fighter,
    )
    const lessHead = arenaRyuAction(
      { type: 'RYU', distribution: ryuDistribution('head', 0.5) },
      fighter,
    )
    expect(moreHead.attackShare).toBeCloseTo(0.3)
    expect(lessHead.attackShare).toBeCloseTo(0.5)
  })

  it('computes camera-directed strikes and capacity-aware meters', () => {
    expect(strikeTarget([2, 3], 0, 2)).toEqual([2, 1])
    expect(strikeTarget([2, 3], Math.PI / 2, 2)[0]).toBeCloseTo(0)
    expect(auraPercent(75, 150)).toBe(50)
  })
})
