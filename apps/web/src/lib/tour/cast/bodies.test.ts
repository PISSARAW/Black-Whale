import { describe, expect, it } from 'vitest'
import {
  expire,
  HOLD_SECONDS,
  holdFor,
  holdOn,
  holdProgress,
  isHeld,
  lay,
  NO_BODIES,
  releaseBodies,
} from './bodies'

const NOW = 1_000_000

const bind = (characterId: string, now = NOW) =>
  holdFor(characterId, { kind: 'elastic', mark: 'bound' }, now)

describe('what the walk is holding on whom', () => {
  it('lays a hold that already carries its own end', () => {
    const hold = bind('sakata')
    expect(hold.since).toBe(NOW)
    expect(hold.until).toBe(NOW + HOLD_SECONDS.bound * 1000)
  })

  it('answers who is held and who is not', () => {
    const world = lay(NO_BODIES, bind('sakata'))
    expect(isHeld(world, 'sakata')).toBe(true)
    expect(isHeld(world, 'kurapika')).toBe(false)
    expect(isHeld(world, null)).toBe(false)
    expect(holdOn(world, 'sakata')?.mark).toBe('bound')
  })

  /** One hold per body: two techniques on one person is a question the manga
   * answers case by case, so the newest simply wins. */
  it('replaces whatever that body was already under', () => {
    const first = lay(NO_BODIES, bind('sakata'))
    const second = lay(first, holdFor('sakata', { kind: 'melody', mark: 'soothed' }, NOW))
    expect(second.holds).toHaveLength(1)
    expect(holdOn(second, 'sakata')?.mark).toBe('soothed')
  })

  it('holds two bodies apart from one another', () => {
    const world = lay(lay(NO_BODIES, bind('sakata')), bind('kurapika'))
    expect(world.holds).toHaveLength(2)
  })
})

describe('nothing survives its own end', () => {
  it('drops a hold the moment its clock runs out', () => {
    const world = lay(NO_BODIES, bind('sakata'))
    const until = world.holds[0]!.until
    expect(expire(world, until - 1).holds).toHaveLength(1)
    expect(expire(world, until).holds).toEqual([])
  })

  it('hands back the same world when nothing has expired', () => {
    const world = lay(NO_BODIES, bind('sakata'))
    expect(expire(world, NOW + 1)).toBe(world)
  })

  it('lets go of everybody at a threshold', () => {
    const world = lay(lay(NO_BODIES, bind('sakata')), bind('kurapika'))
    expect(releaseBodies(world)).toEqual(NO_BODIES)
    expect(releaseBodies(NO_BODIES)).toBe(NO_BODIES)
  })

  it('reads how far through its life a hold is, and never past its end', () => {
    const hold = bind('sakata')
    expect(holdProgress(hold, NOW)).toBe(0)
    expect(holdProgress(hold, NOW + (HOLD_SECONDS.bound * 1000) / 2)).toBeCloseTo(0.5)
    expect(holdProgress(hold, NOW + 999_999)).toBe(1)
  })
})
