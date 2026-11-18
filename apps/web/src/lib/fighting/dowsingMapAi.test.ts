import { describe, expect, it } from 'vitest'
import { dowsingAi } from './dowsingAi'
import { mapSetup, mapFrames } from './dowsingMapTestSetup'

describe('the AI uses the same physical map action as the player', () => {
  it('locates a previously met body during a distant opening and remembers the result', () => {
    const base = mapSetup('opponent')
    const far = { ...base, player: { ...base.player, x: 20 } }
    const started = dowsingAi(far)!
    expect(started.opponent.dowsingMapSearch?.bodyKey).toBe('player:0')
    expect(started.opponent.aura).toBe(far.opponent.aura - 3)
    expect(dowsingAi(started)).toBeNull()
    const read = mapFrames(started, 121)
    expect(read.opponent.dowsingMapReading?.point?.x).toBeCloseTo(13 / 86)
    expect(dowsingAi(read)?.opponent.dowsingMapSearch).toBeUndefined()
  })
  it('cannot obtain a position without the accessible real paper or prior encounter', () => {
    const base = mapSetup('opponent')
    const far = {
      ...base,
      player: { ...base.player, x: 20 },
      opponent: { ...base.opponent, personalEncounters: undefined },
      battlefield: { ...base.battlefield!, entities: [] },
    }
    expect(dowsingAi(far)?.opponent.dowsingMapSearch).toBeUndefined()
  })
})
