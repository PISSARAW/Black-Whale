import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { FIXED_STEP } from '../fightClock'
import { EMPTY_INPUT } from '../types'
import type { FightMix } from './mixer'

const audio = vi.hoisted(() => ({
  continuous: vi.fn(() => ({
    frequency: { setTargetAtTime: vi.fn() },
    level: { setTargetAtTime: vi.fn() },
    pan: { setTargetAtTime: vi.fn() },
    stop: vi.fn(),
  })),
}))
vi.mock('./mixer', () => ({ continuousVoice: audio.continuous }))
import { createMelodyVoices } from './melody'

describe('continuous flute audio', () => {
  beforeEach(() => vi.clearAllMocks())

  it('waits for preparation, sustains both performers, and silences an interrupted performance', () => {
    const mix = { context: { currentTime: 1 }, effects: {} } as FightMix
    const voices = createMelodyVoices(mix)
    let state = beginFight(createFight('melody', 'melody', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, x: 10 }, opponent: { ...state.opponent, x: 90 } }
    state = performAttack(performAttack(state, 'player', 'special'), 'opponent', 'special')
    const sources = audio.continuous.mock.results.map((result) => result.value)
    const latestLevel = (index: number) => sources[index].level.setTargetAtTime.mock.lastCall?.[0]
    voices.update(state, true)
    expect(sources.every((source) => source.level.setTargetAtTime.mock.lastCall?.[0] === 0)).toBe(
      true,
    )
    for (let n = 0; n < 120; n++) {
      state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
      voices.update(state, true)
    }
    expect(audio.continuous).toHaveBeenCalledTimes(4)
    expect(latestLevel(0)).toBeGreaterThan(0)
    expect(latestLevel(2)).toBeGreaterThan(0)
    state = performAttack(state, 'player', 'special')
    voices.update(state, true)
    expect(latestLevel(0)).toBe(0)
    expect(latestLevel(1)).toBe(0)
    expect(latestLevel(2)).toBeGreaterThan(0)
    voices.update(state, false)
    expect(sources.every((source) => source.level.setTargetAtTime.mock.lastCall?.[0] === 0)).toBe(
      true,
    )
    voices.update(state, true)
    expect(latestLevel(2)).toBeGreaterThan(0)
    voices.update({ ...state, phase: 'finished' }, true)
    expect(latestLevel(2)).toBe(0)
    voices.stop()
    for (const source of sources) expect(source.stop).toHaveBeenCalledOnce()
  })
})
