import { describe, it, expect } from 'vitest'
import { ECHO_LASTS, fade, noEchoes, ring } from './feedback'
import { poolOf } from './aura'
import { initialDuelState, type DuelState } from './duel/state'
import { KO_WINDUP } from './duel/ko'
import { cueOf, cuesFor, easeOut, relativeBearing, remaining, type VeilReading } from './veil'

function reading(over: Partial<VeilReading> = {}): VeilReading {
  return { echoes: noEchoes(), nen: 'ten', at: [0, 0], heading: 0, duel: null, ...over }
}

function duelWith(over: Partial<DuelState['player']> = {}): DuelState {
  const duel = initialDuelState({ player: poolOf(100), hunter: poolOf(100) })
  return { ...duel, player: { ...duel.player, ...over } }
}

describe('turning a world bearing into a relative one', () => {
  it('puts a cue dead ahead when the player is facing it', () => {
    expect(relativeBearing([0, 0], [0, -10], 0)).toBeCloseTo(0, 6)
  })

  it('puts it to the right when it is to the right', () => {
    expect(relativeBearing([0, 0], [10, 0], 0)).toBeCloseTo(Math.PI / 2, 6)
  })

  it('turns with the player', () => {
    const ahead = relativeBearing([0, 0], [0, -10], Math.PI / 2)!
    expect(ahead).toBeCloseTo(-Math.PI / 2, 6)
  })

  it('has no bearing at all when the cue is where the player is', () => {
    expect(relativeBearing([3, 3], [3, 3], 0)).toBeNull()
  })
})

describe('the fade', () => {
  it('is full at the moment it rings and nothing once it has run out', () => {
    expect(remaining(ECHO_LASTS)).toBe(1)
    expect(remaining(0)).toBe(0)
  })

  it('is loud early and long in the tail', () => {
    // Halfway through in time is a quarter of the way through in strength.
    expect(easeOut(0.5)).toBeCloseTo(0.25, 6)
    expect(easeOut(1)).toBe(1)
  })

  it('clamps rather than going negative or past full', () => {
    expect(easeOut(-1)).toBe(0)
    expect(easeOut(4)).toBe(1)
    expect(remaining(99)).toBe(1)
  })
})

describe('what the hunt shows', () => {
  it('shows nothing but the standing state when nothing has happened', () => {
    const cues = cuesFor(reading())
    expect(cues.map((cue) => cue.kind)).toEqual(['ten'])
  })

  it('swaps Ten for Zetsu when the aura goes down', () => {
    expect(cueOf(cuesFor(reading({ nen: 'zetsu' })), 'zetsu')).not.toBeNull()
    expect(cueOf(cuesFor(reading({ nen: 'zetsu' })), 'ten')).toBeNull()
  })

  it('shows a sweep of the player’s own going out', () => {
    const cast = cueOf(cuesFor(reading({ echoes: ring(noEchoes(), { cast: true }) })), 'cast')
    expect(cast?.strength).toBe(1)
    expect(cast?.travel).toBe(0)
  })

  it('grows the ring outward as it dies away', () => {
    const half = fade(ring(noEchoes(), { cast: true }), ECHO_LASTS / 2)
    const cast = cueOf(cuesFor(reading({ echoes: half })), 'cast')!
    expect(cast.travel).toBeCloseTo(0.5, 6)
    expect(cast.strength).toBeCloseTo(0.25, 6)
  })

  it('drops a cue entirely once its echo has run out', () => {
    const gone = fade(ring(noEchoes(), { cast: true, sprung: true }), ECHO_LASTS + 0.1)
    expect(cuesFor(reading({ echoes: gone })).map((cue) => cue.kind)).toEqual(['ten'])
  })

  it('gives a received sweep the bearing it came from, relative to the player', () => {
    const echoes = ring(noEchoes(), { sweptFrom: [10, 0] })
    const swept = cueOf(cuesFor(reading({ echoes })), 'swept')!
    expect(swept.bearing).toBeCloseTo(Math.PI / 2, 6)
  })

  it('gives the events that have no side no bearing', () => {
    const echoes = ring(noEchoes(), { sprung: true, found: true })
    for (const kind of ['sprung', 'found'] as const) {
      expect(cueOf(cuesFor(reading({ echoes })), kind)?.bearing).toBeNull()
    }
  })
})

describe('what the duel shows', () => {
  it('shows each principle exactly while it is held', () => {
    for (const held of ['gyo', 'in', 'ken'] as const) {
      const cues = cuesFor(reading({ duel: duelWith({ [held]: true }) }))
      expect(cueOf(cues, held)?.strength).toBe(1)
    }
    expect(cueOf(cuesFor(reading({ duel: duelWith() })), 'gyo')).toBeNull()
  })

  it('shows the wind-up filling rather than fading', () => {
    const half = duelWith({ ko: 'head', gathering: KO_WINDUP / 2 })
    expect(cueOf(cuesFor(reading({ duel: half })), 'gathering')?.strength).toBeCloseTo(0.5, 6)

    const ready = duelWith({ ko: 'head', gathering: KO_WINDUP })
    expect(cueOf(cuesFor(reading({ duel: ready })), 'gathering')?.strength).toBe(1)
  })

  it('does not overfill a wind-up that overran a tick', () => {
    const over = duelWith({ ko: 'head', gathering: KO_WINDUP * 3 })
    expect(cueOf(cuesFor(reading({ duel: over })), 'gathering')?.strength).toBe(1)
  })

  it('shows nothing gathering when nothing is gathered', () => {
    expect(cueOf(cuesFor(reading({ duel: duelWith() })), 'gathering')).toBeNull()
  })

  it('shows the duel’s Zetsu the same way the hunt’s is shown', () => {
    const cues = cuesFor(reading({ duel: duelWith({ zetsu: true }) }))
    expect(cues.filter((cue) => cue.kind === 'zetsu')).toHaveLength(1)
  })
})

describe('the layer is a second reading and not the only one', () => {
  it('says nothing the state does not already say', () => {
    // Every cue is derived; none carries a fact of its own. If this file ever
    // needs an input the HUD does not have, the veil has stopped being optional
    // and the step-3 gate has quietly been answered for us.
    const busy = reading({
      echoes: ring(noEchoes(), { cast: true, sprung: true, found: true, sweptFrom: [1, 1] }),
      duel: duelWith({ gyo: true, ken: true }),
    })
    for (const cue of cuesFor(busy)) {
      expect(cue.strength).toBeGreaterThan(0)
      expect(cue.strength).toBeLessThanOrEqual(1)
      expect(cue.travel).toBeGreaterThanOrEqual(0)
      expect(cue.travel).toBeLessThanOrEqual(1)
    }
  })
})
