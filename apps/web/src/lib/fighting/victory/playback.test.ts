import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFight } from '../engine'
import { FIGHTING_ROSTER } from '../roster'
import { FIGHT_STAGES } from '../stages'
import type { FightState, FighterId, FightSide } from '../types'
import { selectVictory, VICTORY_FIGHTERS } from './catalogue'
import { createVictoryPlayback } from './playback'

function result(
  winner: FighterId = 'hisoka',
  target: FighterId = 'chrollo',
  side: FightSide = 'player',
): FightState {
  return {
    ...createFight(side === 'player' ? winner : target, side === 'player' ? target : winner),
    phase: 'finished',
    winner: side,
    frame: 666,
  }
}
describe('victory selection', () => {
  it.each(['hisoka', 'biscuit', 'benjamin', 'kurapika'] as const)(
    'selects Judgment rather than Chain Jail for non-Spider %s',
    (target) => {
      expect(selectVictory(result('kurapika', target))?.variant).toBe('kurapika-judgment')
    },
  )
  it.each(['franklin', 'chrollo', 'kalluto'] as const)(
    'keeps the existing Troupe cinematic for %s',
    (target) => {
      expect(selectVictory(result('kurapika', target))?.variant).toBe('kurapika-troupe')
    },
  )

  it('uses all real opponents and every stage for either winning side, including mirrors', () => {
    for (const fighter of VICTORY_FIGHTERS)
      for (const target of FIGHTING_ROSTER)
        for (const side of ['player', 'opponent'] as const) {
          const state = result(fighter, target.id, side)
          for (const stage of FIGHT_STAGES) {
            state.environment.stageId = stage.id
            const selected = selectVictory(state)!
            expect(selected.fighter).toBe(fighter)
            expect(selected.winner).toBe(side)
            expect(state[selected.loser].id).toBe(target.id)
            expect(selected.token.startsWith(`${stage.id}:`)).toBe(true)
          }
        }
  })
  it('rejects pending fights, draws, unsupported winners, training and speculative outcomes', () => {
    const state = result()
    expect(selectVictory({ ...state, phase: 'ready' })).toBeNull()
    expect(selectVictory({ ...state, winner: 'draw' })).toBeNull()
    expect(selectVictory({ ...state, winner: null })).toBeNull()
    expect(selectVictory(result('theta'))).toBeNull()
    expect(selectVictory({ ...state, mode: 'training' })).toBeNull()
    expect(selectVictory({ ...state, forecastSimulation: true })).toBeNull()
  })
})
describe('victory playback', () => {
  it('keeps real ten-second timing when rendering drops below ten frames per second', () => {
    const playback = createVictoryPlayback()
    playback.observe(result())
    playback.sceneReady()
    playback.advance(3.2)
    playback.advance(2.8)
    expect(get(playback)?.elapsed).toBeCloseTo(6)
    expect(get(playback)?.active).toBe(true)
    playback.advance(4)
    expect(get(playback)?.active).toBe(false)
    expect(get(playback)?.elapsed).toBe(10)
  })
  it('waits for the rendered scene, lasts ten presentation seconds and then stays completed', () => {
    const playback = createVictoryPlayback(),
      state = result()
    playback.observe(state)
    playback.advance(1)
    expect(get(playback)?.elapsed).toBe(0)
    playback.sceneReady()
    for (let i = 0; i < 99; i++) playback.advance(0.1)
    expect(get(playback)?.active).toBe(true)
    expect(get(playback)?.elapsed).toBeCloseTo(9.9)
    playback.advance(0.1)
    expect(get(playback)?.active).toBe(false)
    expect(get(playback)?.elapsed).toBe(10)
    playback.observe({ ...state })
    expect(get(playback)?.active).toBe(false)
  })
  it('pauses, skips, resets on rematch and waits again when the scene changes', () => {
    const playback = createVictoryPlayback(),
      state = result()
    playback.observe(state)
    playback.sceneReady()
    playback.advance(0.1, true)
    expect(get(playback)?.elapsed).toBe(0)
    playback.advance(0.1)
    playback.skip()
    playback.observe(state)
    expect(get(playback)?.active).toBe(false)
    playback.observe({ ...state, phase: 'ready', winner: null })
    playback.sceneLoading()
    playback.observe(state)
    playback.advance(0.1)
    expect(get(playback)?.elapsed).toBe(0)
    playback.sceneReady()
    playback.advance(0.1)
    expect(get(playback)?.elapsed).toBe(0.1)
  })
  it('falls back to results on rendering failure and disables replay presentation', () => {
    const playback = createVictoryPlayback(),
      state = result()
    playback.observe(state, false)
    expect(get(playback)).toBeNull()
    playback.observe(state)
    playback.sceneFailed()
    expect(get(playback)?.active).toBe(false)
    playback.observe(state)
    expect(get(playback)).toBeNull()
    playback.sceneLoading()
    playback.observe(state)
    expect(get(playback)?.active).toBe(true)
  })
})
