import { describe, expect, it } from 'vitest'
import { COMBO_MASTER_DAYS } from '@black-whale/ability-modules'
import {
  daysLeft,
  daysNeeded,
  isBuilt,
  isDeciphered,
  isLocked,
  oneDayBeside,
  oneDayBuilding,
  type Decipher,
  type Fabrication,
} from './decipher'

const reading = (over: Partial<Decipher> = {}): Decipher => ({
  characterId: 'prince-benjamin',
  spaceId: 'tier-1-room-1004',
  reading: 'guardianBeast',
  days: 0,
  ...over,
})

const bench = (over: Partial<Fabrication> = {}): Fabrication => ({
  slot: 'TOOL',
  days: 0,
  spaceId: 'tier-1-room-1004',
  needs: COMBO_MASTER_DAYS.guardianBeast,
  ...over,
})

describe('the three durations the archive gives, and no fourth', () => {
  it('reads them off the ability module rather than restating them', () => {
    expect(daysNeeded('guardianBeast')).toBe(COMBO_MASTER_DAYS.guardianBeast)
    expect(daysNeeded('decodeCurse')).toBe(COMBO_MASTER_DAYS.decodeCurse)
    expect(daysNeeded('counterCurse')).toBe(COMBO_MASTER_DAYS.counterCurse)
  })

  // The numbers themselves, because they are the whole reason this exists.
  it('carries ten days, three hundred and sixty-five, and seven hundred', () => {
    expect([
      daysNeeded('guardianBeast'),
      daysNeeded('decodeCurse'),
      daysNeeded('counterCurse'),
    ]).toEqual([10, 365, 700])
  })

  it('offers no reading the archive does not put a duration on', () => {
    expect(Object.keys(COMBO_MASTER_DAYS)).toHaveLength(3)
  })
})

describe('deciphering, which banks co-presence', () => {
  it('advances a day for a day spent in the room', () => {
    expect(oneDayBeside(reading(), true).days).toBe(1)
  })

  // The half of the menu that walking away does not punish.
  it('survives interruption: away from them the counter holds rather than falls', () => {
    const banked = oneDayBeside(oneDayBeside(reading(), true), true)
    expect(banked.days).toBe(2)
    const wandered = oneDayBeside(oneDayBeside(banked, false), false)
    expect(wandered.days).toBe(2)
    expect(oneDayBeside(wandered, true).days).toBe(3)
  })

  it('stops at what the reading needs rather than counting past it', () => {
    let work = reading({ days: daysNeeded('guardianBeast') - 1 })
    work = oneDayBeside(work, true)
    expect(isDeciphered(work)).toBe(true)
    expect(oneDayBeside(work, true)).toBe(work)
    expect(daysLeft(work)).toBe(0)
  })

  it('shows the days left, which is the figure on the screen', () => {
    expect(daysLeft(reading({ reading: 'decodeCurse', days: 65 }))).toBe(300)
  })
})

describe('fabrication, which walking out destroys', () => {
  it('advances a day for a day spent at the bench', () => {
    expect(oneDayBuilding(bench(), 'tier-1-room-1004')!.days).toBe(1)
  })

  // The asymmetry, and the sentence the whole module exists for: leaving costs
  // everything, and only on this side of the menu.
  it('is gone the moment the room changes, days and all', () => {
    const started = oneDayBuilding(
      oneDayBuilding(bench(), 'tier-1-room-1004')!,
      'tier-1-room-1004',
    )!
    expect(started.days).toBe(2)
    expect(oneDayBuilding(started, 'tier-1-room-1005')).toBeNull()
    // And between rooms is not the room it was started in either.
    expect(oneDayBuilding(started, null)).toBeNull()
  })

  it('stops at what the build needs', () => {
    const done = bench({ days: 10, needs: 10 })
    expect(isBuilt(done)).toBe(true)
    expect(oneDayBuilding(done, done.spaceId)).toBe(done)
  })
})

describe('the lock, which is the character rather than a gap', () => {
  it('holds while a reading is unfinished', () => {
    expect(isLocked({ decipher: reading(), fabrication: null })).toBe(true)
  })

  it('holds while anything is on the bench, finished or not', () => {
    expect(isLocked({ decipher: null, fabrication: bench() })).toBe(true)
    expect(isLocked({ decipher: null, fabrication: bench({ days: 10, needs: 10 }) })).toBe(true)
  })

  it('lifts when the reading is done and the bench is clear', () => {
    const done = reading({ days: daysNeeded('guardianBeast') })
    expect(isLocked({ decipher: done, fabrication: null })).toBe(false)
    expect(isLocked({ decipher: null, fabrication: null })).toBe(false)
  })
})
