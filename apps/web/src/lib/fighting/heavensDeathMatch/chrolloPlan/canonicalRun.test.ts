import { describe, expect, it } from 'vitest'
import { puppetCensus } from '../puppets/census'
import { advanceDeathMatch } from '../scenario'
import { deathMatchDigest } from '../script'
import { RESCUE_DELAY_FRAMES } from '../verdict'
import { frontierBeat } from './phases'
import { stepDeathMatchWorld } from './simulate'
import { createDeathMatchWorld, type DeathMatchWorld } from './world'

/** Both hierarchical plans play the deterministic canonical reconstruction. */
function canonicalRun(limit: number): { world: DeathMatchWorld; frames: number } {
  let world = createDeathMatchWorld({ scenario: { playMode: 'scripted' } })
  for (let frame = 0; frame < limit; frame += 1) {
    world = stepDeathMatchWorld(world, { hisokaPlan: true }).world
    if (world.scenario.done.includes('final-explosion')) return { world, frames: frame }
  }
  return { world, frames: limit }
}

describe('the canonical plan, played to the final explosion', () => {
  const run = canonicalRun(60 * 180)

  it('reaches the final explosion in the scripted order', () => {
    expect(run.world.scenario.done).toContain('final-explosion')
    expect(run.world.scenario.divergences).toEqual([])
    expect(frontierBeat(run.world.scenario)).toBe('hisoka-buried')
  })

  it('leaves Sun-marked puppets behind after Gallery Fake closed, and bombs in the stands', () => {
    const census = puppetCensus(run.world.crowd)
    expect(census.vanished).toBeGreaterThan(0)
    expect(census.copies).toBeGreaterThan(40)
    expect(census.sunMarked).toBeGreaterThanOrEqual(census.copies - 1)
    expect(census.reserve).toBeGreaterThan(census.visible)
  })

  it('replays to the same frames', () => {
    const again = canonicalRun(run.frames + 1)
    expect(deathMatchDigest(again.world.scenario)).toBe(deathMatchDigest(run.world.scenario))
  })

  it('continues through rescue, post-mortem resuscitation, prostheses and Machi', () => {
    let frame = run.world.crowd.frame
    const scenario = ['hisoka-buried', 'hisoka-asphyxiated', 'chrollo-declared-winner'].reduce(
      (state, beat) => advanceDeathMatch(state, { beat, frame: (frame += 1) }),
      run.world.scenario,
    )
    let world: DeathMatchWorld = {
      ...run.world,
      scenario,
      hisoka: {
        ...run.world.hisoka,
        resuscitationProgrammed: true,
        wounds: {
          ...run.world.hisoka.wounds,
          oxygen: 0,
          deadFor: RESCUE_DELAY_FRAMES,
          cause: 'asphyxia',
        },
      },
    }
    for (let step = 0; step < 12; step += 1)
      world = stepDeathMatchWorld(world, { hisokaPlan: true }).world
    expect(world.scenario.done).toEqual(
      expect.arrayContaining([
        'rescue-arrives',
        'troupe-gathers',
        'resuscitation',
        'prosthetics-formed',
        'machi-bound',
      ]),
    )
    expect(world.scenario.survival.hisoka).toBe('revived')
    expect(world.hisoka.wounds.leftFingers).toBe(4)
    expect(world.hisoka.wounds.rightLowerLeg).toBe(true)
  })
})
