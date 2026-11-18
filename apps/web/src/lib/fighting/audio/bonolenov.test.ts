import { beforeEach, describe, expect, it, vi } from 'vitest'
import { beginFight, createFight, performAttack, tickFight } from '../engine'
import { EMPTY_INPUT } from '../types'
import { bonolenovInstrumentExposed } from '../bonolenovInstrument'
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
import { bonolenovMusicPhrase, createBonolenovVoices } from './bonolenov'

const tick = (state: ReturnType<typeof createFight>) =>
  tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })

describe('Bonolenov body instrument', () => {
  beforeEach(() => vi.clearAllMocks())

  it('unwraps once through simulation, sounds ordinary combat on both sides, and keeps holes exposed at rest', () => {
    const mix = { context: { currentTime: 1 }, effects: {} } as FightMix
    const voices = createBonolenovVoices(mix)
    const initial = beginFight(createFight('bonolenov', 'bonolenov', { mode: 'versus-local' }))
    expect(bonolenovInstrumentExposed(initial.player)).toBe(false)
    let state = tick(performAttack(performAttack(initial, 'player', 'light'), 'opponent', 'light'))
    expect(state.player.battleCantabile?.unwrapped).toBe(true)
    expect(state.opponent.battleCantabile?.unwrapped).toBe(true)
    expect(bonolenovMusicPhrase({ ...state.player, crouching: true })).not.toBeNull()
    voices.update(state, true)
    const sources = audio.continuous.mock.results.map((result) => result.value)
    expect(sources).toHaveLength(8)
    for (const source of sources)
      expect(source.level.setTargetAtTime.mock.lastCall?.[0]).toBeGreaterThan(0)
    for (let i = 0; i < 90; i++) state = tick(state)
    expect(state.player.attack).toBeNull()
    expect(bonolenovInstrumentExposed(state.player)).toBe(true)
    expect(bonolenovMusicPhrase(state.player)).toBeNull()
    voices.update(state, true)
    for (const source of sources) expect(source.level.setTargetAtTime.mock.lastCall?.[0]).toBe(0)
    voices.stop()
    for (const source of sources) expect(source.stop).toHaveBeenCalledOnce()
  })

  it('follows preparation counters and cuts sound on interruption, hitstop, pause, mute and round end', () => {
    const initial = beginFight(createFight('bonolenov', 'hisoka', { mode: 'versus-local' }))
    const state = performAttack(initial, 'player', 'special')
    const mix = { context: { currentTime: 1 }, effects: {} } as FightMix
    const voices = createBonolenovVoices(mix)
    const sources = audio.continuous.mock.results.map((result) => result.value)
    voices.update(state, true)
    expect(sources[0].level.setTargetAtTime.mock.lastCall?.[0]).toBeGreaterThan(0)
    const phrase = bonolenovMusicPhrase(state.player)
    expect(bonolenovMusicPhrase(state.player)).toEqual(phrase)
    expect(
      bonolenovMusicPhrase({
        ...state.player,
        battleCantabile: {
          ...state.player.battleCantabile!,
          preparation: { piece: 'prologue', total: 60, remaining: 44 },
        },
      })?.hz,
    ).not.toBe(phrase?.hz)
    for (const interrupted of [
      { ...state, hitstop: 4 },
      { ...state, phase: 'finished' as const },
      { ...state, player: { ...state.player, hitStun: 5 } },
      { ...state, player: { ...state.player, blocking: true } },
      { ...state, player: { ...state.player, health: 0 } },
    ]) {
      voices.update(interrupted, true)
      expect(sources[0].level.setTargetAtTime.mock.lastCall?.[0]).toBe(0)
    }
    voices.update(state, false)
    for (const source of sources) expect(source.level.setTargetAtTime.mock.lastCall?.[0]).toBe(0)
    voices.stop()
  })

  it('does not give body holes or body music to a copied Hatsu or a transformed model', () => {
    const state = performAttack(
      beginFight(createFight('bonolenov', 'chrollo')),
      'player',
      'special',
    )
    expect(bonolenovMusicPhrase({ ...state.player, id: 'chrollo' })).toBeNull()
    expect(
      bonolenovMusicPhrase({
        ...state.player,
        battleCantabile: {
          ...state.player.battleCantabile!,
          form: { model: 'hisoka', remaining: 10, duration: 10 },
        },
      }),
    ).toBeNull()
  })
})
