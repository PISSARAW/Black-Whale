import { describe, expect, it } from 'vitest'
import type { ChrolloBookState } from '../../chrolloBook'
import { createDeathMatchChrolloBook } from '../loadout'
import { puppetCensus } from '../puppets/census'
import { pageActive } from '../puppets/pipeline'
import { advanceDeathMatch } from '../scenario'
import { replayDeathMatch, scriptBefore } from '../script'
import { applyBookStep, bookStepsTo } from './book'
import { chrolloPhase } from './phases'
import { stepDeathMatchWorld } from './simulate'
import { SAFE_DISTANCE, decideChrollo } from './tactics'
import { createDeathMatchWorld, distance, type DeathMatchWorld } from './world'

function steps(world: DeathMatchWorld, frames: number, hisokaPlan = false): DeathMatchWorld {
  let next = world
  for (let frame = 0; frame < frames; frame += 1)
    next = stepDeathMatchWorld(next, { hisokaPlan }).world
  return next
}

describe('Chrollo’s book in the hand', () => {
  it('reaches Gallery Fake open with Sun and Moon under the bookmark, one gesture at a time', () => {
    let book: ChrolloBookState = createDeathMatchChrolloBook()
    const gestures = bookStepsTo(book, 'gallery-fake', 'sun-and-moon')
    expect(gestures).toEqual(['bookmark', 'open', 'turn', 'turn'])
    for (const gesture of gestures) book = applyBookStep(book, gesture)
    expect(pageActive(book, 'gallery-fake') && pageActive(book, 'sun-and-moon')).toBe(true)
    expect(bookStepsTo(book, 'gallery-fake', 'sun-and-moon')).toEqual([])
  })
})

describe('the hierarchical plan', () => {
  it('reads its phase from the scenario frontier', () => {
    const world = createDeathMatchWorld()
    expect(chrolloPhase(world.scenario)).toBe('prepare')
    const later = replayDeathMatch(scriptBefore('gallery-fake-copies'))
    expect(chrolloPhase(later)).toBe('build-army')
  })

  it('refuses a frontal fight once in the crowd phases', () => {
    const world = createDeathMatchWorld()
    const army = { ...world, scenario: replayDeathMatch(scriptBefore('gallery-fake-copies')) }
    const close = {
      ...army,
      hisoka: { ...army.hisoka, at: { ...army.chrollo.at, x: army.chrollo.at.x - 1 } },
    }
    expect(decideChrollo(close).intent.kind).toBe('retreat')
    const busy = { ...close, hisoka: { ...close.hisoka, busy: true, facing: { x: -1, z: 0 } } }
    expect(decideChrollo(busy).intent.kind).toBe('surprise-strike')
  })

  it('opens the fight: referee under Black Voice, feint, abilities, then the first explosion', () => {
    let world = createDeathMatchWorld({ scenario: { playMode: 'free' }, crowd: { count: 80 } })
    world = steps(world, 60 * 20, true)
    expect(world.scenario.done).toEqual(
      expect.arrayContaining([
        'floor-masters-enter',
        'death-agreement',
        'referee-marked-black-voice',
        'chrollo-feint-kick-flurry',
        'abilities-presented',
        'first-explosion',
      ]),
    )
  })

  it('builds an army out of Hisoka’s sight, keeping the Sun-marked copies', () => {
    const base = createDeathMatchWorld({ scenario: { playMode: 'free' }, crowd: { count: 200 } })
    const scenario = [
      'floor-masters-enter',
      'death-agreement',
      'referee-marked-black-voice',
      'chrollo-feint-kick-flurry',
      'abilities-presented',
      'first-explosion',
      'chrollo-vanishes-crowd',
    ].reduce((state, beat, frame) => advanceDeathMatch(state, { beat, frame }), base.scenario)
    let world: DeathMatchWorld = {
      ...base,
      scenario,
      chrollo: { ...base.chrollo, at: { x: 0, y: 1, z: -14 } },
      hisoka: { ...base.hisoka, at: { x: 0, y: 0, z: 0.3 }, facing: { x: 0, z: 1 } },
    }
    world = steps(world, 60 * 25)
    const census = puppetCensus(world.crowd)
    // Unmarked copies vanish once the stamp closes Gallery Fake; the Sun-marked ones stay.
    expect(census.copies + census.vanished).toBeGreaterThanOrEqual(20)
    expect(census.sunMarked).toBe(census.copies)
    expect(census.reserve).toBeGreaterThan(0)
    expect(world.scenario.done).toContain('gallery-fake-copies')
    expect(distance(world.chrollo.at, world.hisoka.at)).toBeGreaterThanOrEqual(SAFE_DISTANCE)
  })

  it('is deterministic frame for frame', () => {
    const a = steps(
      createDeathMatchWorld({ scenario: { playMode: 'free' }, crowd: { count: 60 } }),
      900,
    )
    const b = steps(
      createDeathMatchWorld({ scenario: { playMode: 'free' }, crowd: { count: 60 } }),
      900,
    )
    expect(a.scenario.log).toEqual(b.scenario.log)
    expect(a.crowd.spectators.map((spectator) => spectator.at)).toEqual(
      b.crowd.spectators.map((spectator) => spectator.at),
    )
  })
})
