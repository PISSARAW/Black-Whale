import { describe, expect, it } from 'vitest'
import { advanceIntentDrive } from './intentDrive'
import { initialFighter } from './types'

function driving(total: number) {
  const fighter = initialFighter([0, 0])
  return {
    ...fighter,
    intent: {
      zone: 'head' as const,
      remaining: 1,
      targetAt: [2, 0] as const,
      drive: { total, applied: 0, duration: 1, direction: [1, 0] as const },
    },
  }
}

describe('Arena authored attack drive', () => {
  it('commits the complete lunge by the end of startup', () => {
    const fighter = advanceIntentDrive({
      fighter: driving(0.4),
      rival: initialFighter([2, 0]),
      walls: [],
      dt: 1,
    })

    expect(fighter.position).toEqual([0.4, 0])
    expect(fighter.intent?.drive?.applied).toBe(0.4)
  })

  it('does not drive through the rival body', () => {
    const fighter = advanceIntentDrive({
      fighter: driving(0.4),
      rival: initialFighter([1.2, 0]),
      walls: [],
      dt: 1,
    })

    expect(fighter.position).toEqual([0, 0])
    expect(fighter.intent?.drive?.applied).toBe(0.4)
  })
})
