import { describe, expect, it } from 'vitest'
import { RIPPER_ANT_TURNS, ripperIsCharged, ripperReach, ripperShatters } from './ripper'

describe('the one figure ch. 92 gives', () => {
  it('carries fifteen, which is what the blow that killed an ant was wound to', () => {
    expect(RIPPER_ANT_TURNS).toBe(15)
  })

  // A threshold, not a slope: the walk makes no claim about eleven versus
  // twelve, because the manga makes none.
  it('breaks at fifteen and moves below it', () => {
    expect(ripperShatters(RIPPER_ANT_TURNS)).toBe(true)
    expect(ripperShatters(RIPPER_ANT_TURNS + 40)).toBe(true)
    expect(ripperShatters(RIPPER_ANT_TURNS - 1)).toBe(false)
    expect(ripperShatters(0)).toBe(false)
  })

  it('throws further for every turn wound into it', () => {
    expect(ripperReach(0)).toBe(3)
    expect(ripperReach(1)).toBe(7)
    expect(ripperReach(RIPPER_ANT_TURNS)).toBe(63)
  })
})

describe('the calibration, which its own bearer calls the weak point', () => {
  it('has nothing to let go of before the arm has turned', () => {
    expect(ripperIsCharged(0)).toBe(false)
    expect(ripperIsCharged(1)).toBe(true)
  })
})
