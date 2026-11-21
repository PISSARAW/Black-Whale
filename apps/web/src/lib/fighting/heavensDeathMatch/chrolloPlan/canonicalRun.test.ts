import { describe, expect, it } from 'vitest'
import { beatSpec, type DeathMatchBeat } from '../acts'
import { puppetCensus } from '../puppets/census'
import { deathMatchDigest } from '../script'
import { frontierBeat } from './phases'
import { stepDeathMatchWorld } from './simulate'
import { createDeathMatchWorld, type DeathMatchWorld } from './world'

/** Beats the fight engine measures (wounds, burial) until the Hisoka side reports them itself. */
const ENGINE_REPORTED = new Set<DeathMatchBeat>([
  'true-face-revealed',
  'head-body-link-tracked',
  'hand-destroyed',
  'leg-destroyed',
])

/** A stand-in for Hisoka's side: it plays his beats two seconds after they come up. */
function canonicalRun(limit: number): { world: DeathMatchWorld; frames: number } {
  let world = createDeathMatchWorld({ scenario: { playMode: 'scripted' } })
  for (let frame = 0; frame < limit; frame += 1) {
    const front = frontierBeat(world.scenario)
    const external = front && (beatSpec(front).actor === 'hisoka' || ENGINE_REPORTED.has(front))
    const reported = external && frame % 120 === 0 ? [front] : []
    world = stepDeathMatchWorld(world, { reported }).world
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
})
