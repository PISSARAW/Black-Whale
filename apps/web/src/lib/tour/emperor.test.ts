import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD } from './cast/types'
import {
  HOURS_IN_A_YEAR,
  HOURS_PER_SECOND,
  ZETSU_SECONDS,
  eyesTurn,
  hiddenByIn,
  isSpent,
  isTheVisitors,
  oneSecondOn,
  seesTheHidden,
  untilSpent,
} from './emperor'
import { stepScarlet } from './pageWorldSteps'

describe('the ledger, which is the ability', () => {
  it('starts at nothing and spends the canon’s own rate', () => {
    expect(eyesTurn().hours).toBe(0)
    expect(oneSecondOn(eyesTurn()).hours).toBe(HOURS_PER_SECOND)
  })

  // Whose years these are is not bookkeeping: a body in the ship that goes
  // scarlet under the emotion of the moment is not spending the reader's.
  it('knows whose life is being spent', () => {
    expect(isTheVisitors(eyesTurn())).toBe(true)
    expect(isTheVisitors(eyesTurn('kurapika'))).toBe(false)
    expect(eyesTurn('kurapika').by).toBe('kurapika')
  })

  it('counts down to the year ch. 380 puts on it', () => {
    expect(untilSpent(eyesTurn())).toBe(HOURS_IN_A_YEAR)
    expect(isSpent({ by: null, hours: HOURS_IN_A_YEAR })).toBe(true)
    expect(isSpent({ by: null, hours: HOURS_IN_A_YEAR - 1 })).toBe(false)
  })
})

describe('what a hundred per cent in every category finds', () => {
  it('finds what In is hiding without being aimed at it', () => {
    const world = { ...EMPTY_WORLD, gumTraps: ['tier-1-room-1004'] }
    expect(hiddenByIn(world)).toEqual(['gum:tier-1-room-1004'])
    expect(seesTheHidden(false, world)).toBe(false)
    expect(seesTheHidden(false, { ...world, laidOpen: true })).toBe(true)
    expect(seesTheHidden(true, world)).toBe(true)
  })
})

describe('the second, which is where the price is actually paid', () => {
  it('does nothing at all while the eyes are their own colour', () => {
    expect(stepScarlet(EMPTY_WORLD)).toBeNull()
  })

  it('spends an hour a second, held and untouched', () => {
    const step = stepScarlet({ ...EMPTY_WORLD, scarlet: eyesTurn(), laidOpen: true })
    expect(step?.world.scarlet?.hours).toBe(1)
    expect(step?.report).toEqual({ kind: 'eyes-held', hours: 1, until: HOURS_IN_A_YEAR - 1 })
  })

  // The sentence ch. 380 states as one: a year consumed, and five minutes
  // without Nen. The walk carries the sentence rather than either half.
  it('lets go of itself at the year, and the Nen goes with it', () => {
    const brink = { ...EMPTY_WORLD, laidOpen: true, scarlet: { by: null, hours: HOURS_IN_A_YEAR - 1 } }
    const step = stepScarlet(brink)
    expect(step?.world.scarlet).toBeNull()
    expect(step?.world.laidOpen).toBe(false)
    expect(step?.world.forcedZetsu).toBe(ZETSU_SECONDS)
    expect(step?.report).toEqual({ kind: 'zetsu-forced', seconds: ZETSU_SECONDS })
  })

  it('runs the five minutes down on the same beat, since nothing can end them', () => {
    const step = stepScarlet({ ...EMPTY_WORLD, forcedZetsu: 2 })
    expect(step?.world.forcedZetsu).toBe(1)
    const last = stepScarlet({ ...EMPTY_WORLD, forcedZetsu: 1 })
    expect(last?.world.forcedZetsu).toBe(0)
    expect(last?.report).toEqual({ kind: 'eyes-out', hours: 0 })
  })
})
