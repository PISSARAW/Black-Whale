import { describe, expect, it } from 'vitest'
import { PUNCH_STEP, punchRuns } from './punch'
import type { Vec2 } from './types'

/** A deck with a well cut out of it: floor everywhere except 8 m ≤ x < 12 m. */
const withAWell = (at: Vec2) => at[0] < 8 || at[0] >= 12

const everywhere = () => true
const nowhere = () => false

describe('the line the blow takes through the matter', () => {
  // The rule ch. 385 is unambiguous about, and the one the walk was getting
  // wrong: the aura runs *in* the surface, so a surface is required.
  it('runs the whole way when there is deck the whole way', () => {
    const through = punchRuns({ from: [0, 0], to: [10, 0], onFloor: everywhere })
    expect(through).not.toBeNull()
    expect(through![0]).toEqual([0, 0])
    expect(through![through!.length - 1]).toEqual([10, 0])
  })

  it('refuses the moment the line is over nothing', () => {
    expect(punchRuns({ from: [0, 0], to: [20, 0], onFloor: withAWell })).toBeNull()
  })

  // A bulkhead is not consulted at all, and that is deliberate: the panel the
  // ability is drawn in is a fist coming out of the leaf of a closed door.
  it('crosses anything that is made of something', () => {
    expect(punchRuns({ from: [0, 0], to: [7.5, 0], onFloor: withAWell })).not.toBeNull()
    expect(punchRuns({ from: [13, 0], to: [30, 0], onFloor: withAWell })).not.toBeNull()
  })

  it('checks both ends, so a visitor standing on nothing strikes nothing', () => {
    expect(punchRuns({ from: [10, 0], to: [10, 0], onFloor: withAWell })).toBeNull()
    expect(punchRuns({ from: [0, 0], to: [0, 0], onFloor: nowhere })).toBeNull()
  })

  it('walks it finely enough that no gap a visitor could fall down is hopped', () => {
    const steps = punchRuns({ from: [0, 0], to: [10, 0], onFloor: everywhere })!
    const gaps = steps.slice(1).map((at, index) => at[0] - steps[index][0])
    for (const gap of gaps) expect(gap).toBeLessThanOrEqual(PUNCH_STEP + 1e-9)
  })

  // Handed back rather than counted, because the line is what Gyo draws.
  it('hands back the run itself, in order, for the eye that can see it', () => {
    const through = punchRuns({ from: [0, 0], to: [0, 4], onFloor: everywhere })!
    expect(through.length).toBeGreaterThan(2)
    expect(through.map((at) => at[1])).toEqual(
      [...through.map((at) => at[1])].sort((a, b) => a - b),
    )
  })
})
