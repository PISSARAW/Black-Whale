/**
 * The console on the walk's own beat.
 *
 * `decipher.ts` argues the arithmetic and is tested on it directly; this asks
 * the other question, which is whether the walk hands that arithmetic the right
 * room. It is worth its own file because the two halves of the menu are wired
 * to the same beat and answer it in opposite ways, and because the one thing
 * that can go wrong here — measuring co-presence against the person rather than
 * the compartment — is invisible to a test that passes the booleans in itself.
 */
import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD } from './cast/types'
import type { TourWorld } from './cast/types'
import { daysNeeded } from './decipher'
import { stepConsole } from './pageWorldSteps'

const ROOM = 'tier-1-room-1004'
const ELSEWHERE = 'tier-2-room-2007'

const reading = (over: Partial<TourWorld['decipher'] & object> = {}): TourWorld => ({
  ...EMPTY_WORLD,
  decipher: {
    characterId: 'prince-benjamin',
    spaceId: ROOM,
    reading: 'guardianBeast',
    days: 0,
    ...over,
  },
})

const building = (spaceId: string): TourWorld => ({
  ...EMPTY_WORLD,
  fabrication: { slot: 'TOOL', days: 0, spaceId, needs: daysNeeded('guardianBeast') },
})

describe('the reading, which counts the room rather than the person', () => {
  // The regression: whose ability is read and which compartment it is read in
  // are two different identifiers, and the day is banked against the second.
  it('banks a day for a day in the room the reading was opened in', () => {
    const step = stepConsole({ world: reading(), standingIn: ROOM })
    expect(step?.world.decipher?.days).toBe(1)
    expect(step?.report).toEqual({
      kind: 'decipher-advanced',
      characterId: 'prince-benjamin',
      left: daysNeeded('guardianBeast') - 1,
    })
  })

  it('holds rather than falls in another room, and resumes on return', () => {
    const banked = stepConsole({ world: reading(), standingIn: ROOM })!.world
    expect(stepConsole({ world: banked, standingIn: ELSEWHERE })).toBeNull()
    expect(stepConsole({ world: banked, standingIn: null })).toBeNull()
    expect(stepConsole({ world: banked, standingIn: ROOM })?.world.decipher?.days).toBe(2)
  })

  it('finishes, which is what releases the aura the console holds', () => {
    const world = reading({ days: daysNeeded('guardianBeast') - 1 })
    const step = stepConsole({ world, standingIn: ROOM })
    expect(step?.report).toEqual({
      kind: 'deciphered',
      characterId: 'prince-benjamin',
      days: daysNeeded('guardianBeast'),
    })
    // And then it stops: a finished reading is not a beat that keeps firing.
    expect(stepConsole({ world: step!.world, standingIn: ROOM })).toBeNull()
  })
})

describe('the bench, which walking out destroys', () => {
  it('advances in the room it was started in', () => {
    const step = stepConsole({ world: building(ROOM), standingIn: ROOM })
    expect(step?.world.fabrication?.days).toBe(1)
    expect(step?.report).toBeNull()
  })

  it('is lost outright anywhere else', () => {
    const step = stepConsole({ world: building(ROOM), standingIn: ELSEWHERE })
    expect(step?.world.fabrication).toBeNull()
    expect(step?.report).toEqual({ kind: 'fabrication-lost', slot: 'TOOL', days: 0 })
  })
})

it('does nothing at all with the console away', () => {
  expect(stepConsole({ world: EMPTY_WORLD, standingIn: ROOM })).toBeNull()
})
