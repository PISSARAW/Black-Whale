import { describe, expect, it, vi } from 'vitest'
import {
  defaultFightComfort,
  readFightComfort,
  saveFightComfort,
  effectiveFightComfort,
  comfortableImpact,
} from './fightComfort'
import { createHeldFightControl } from './heldFightControl'
import { createQueuedFightActions } from '../../routes/fighting/fightingQueuedActions'
import { sampleGamepad, type FightPad } from './fightGamepad'
import { beginFight, createFight, tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { FIXED_STEP } from './fightClock'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function pad(buttons: number[]): FightPad {
  return {
    index: 0,
    id: 'standard',
    connected: true,
    mapping: 'standard',
    axes: [0, 0],
    buttons: Array.from({ length: 17 }, (_, index) => ({
      pressed: buttons.includes(index),
      value: Number(buttons.includes(index)),
    })),
  }
}

describe('visual comfort is presentation only', () => {
  it('persists validated settings and tolerates corrupt, stale or inaccessible storage', () => {
    const settings = { shake: 0.5, flashes: false, highContrast: true } as const
    const setItem = vi.fn()
    saveFightComfort(settings, { setItem })
    expect(readFightComfort({ getItem: () => setItem.mock.calls[0][1] })).toEqual(settings)
    for (const json of ['{', 'null', '{}', '{"shake":-1,"flashes":false,"highContrast":true}'])
      expect(readFightComfort({ getItem: () => json })).toEqual(defaultFightComfort())
    expect(
      readFightComfort({
        getItem: () => {
          throw Error('denied')
        },
      }),
    ).toEqual(defaultFightComfort())
    expect(() =>
      saveFightComfort(settings, {
        setItem: () => {
          throw Error('quota')
        },
      }),
    ).not.toThrow()
  })
  it('honors system reduced motion even when saved settings request full effects', () => {
    const full = defaultFightComfort()
    expect(effectiveFightComfort(full, true)).toEqual({ ...full, shake: 0, flashes: false })
    expect(effectiveFightComfort(full, false)).toEqual(full)
    expect(full.shake).toBe(1)
  })
  it('removes camera shake and impact sparks without changing an impact or combat', () => {
    let state = beginFight(createFight('hisoka', 'kurapika', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, x: 47 }, opponent: { ...state.opponent, x: 52 } }
    state = performTrainingAction({ state, side: 'player', action: 'heavy' })
    for (let i = 0; i < 25 && !state.impact; i++)
      state = tickFight(state, EMPTY_INPUT, {
        dt: FIXED_STEP,
        opponentInput: EMPTY_INPUT,
        ai: false,
      })
    expect(state.impact).toBeTruthy()
    const snapshot = JSON.stringify(state)
    const profile = comfortableImpact({
      impact: state.impact!,
      attacker: 'hisoka',
      comfort: { shake: 0, flashes: false, highContrast: true },
    })
    expect(profile).toMatchObject({ shakeMs: 0, shakeX: 0, shakeY: 0, sparks: 0 })
    expect(JSON.stringify(state)).toBe(snapshot)
  })
})

describe('held touch controls release and cancel predictably', () => {
  it('keeps Hatsu held until commit and passes the held input to the attempt', () => {
    let input: FightInput = { ...EMPTY_INPUT }
    const captured: boolean[] = []
    const button = createHeldFightControl({
      hold: (hatsu) => {
        input = { ...input, hatsu }
      },
      commit: () => captured.push(input.hatsu),
    })
    button.press('pointer:7')
    button.release('pointer:8')
    expect(input.hatsu).toBe(true)
    button.release('pointer:7')
    expect(captured).toEqual([true])
    expect(input.hatsu).toBe(false)
    button.release('pointer:7')
    expect(captured).toHaveLength(1)
  })
  it('never emits a release attack after cancellation', () => {
    const hold = vi.fn(),
      commit = vi.fn()
    const button = createHeldFightControl({ hold, commit })
    button.press('pointer:1')
    button.cancel()
    button.release('pointer:1')
    expect(hold.mock.calls).toEqual([[true], [false]])
    expect(commit).not.toHaveBeenCalled()
  })
  it('ignores repeated keys and a second touch until the owner releases', () => {
    const hold = vi.fn(),
      commit = vi.fn()
    const button = createHeldFightControl({ hold, commit })
    button.press('key: ')
    button.press('key: ')
    button.press('pointer:2')
    button.release('pointer:2')
    expect(hold).toHaveBeenCalledTimes(1)
    button.release('key: ')
    expect(commit).toHaveBeenCalledOnce()
  })
})

describe('controller protection chords use the same Nen and hand rules', () => {
  it.each([
    [4, 'coverEars'],
    [5, 'plugWounds'],
  ] as const)(
    'Back + button %i occupies the hands without guard, aura or speech',
    (button, key) => {
      const input = sampleGamepad(pad([8, button]), pad([])).input
      expect(input[key]).toBe(true)
      expect(input.guard).toBe(false)
      expect(input.aura).toBe(false)
      expect(input.call).toBe(false)
      expect(sampleGamepad(pad([]), pad([8, button])).input[key]).toBeFalsy()
    },
  )
  it('does not cover wounds and ears simultaneously with the same two hands', () => {
    const input = sampleGamepad(pad([8, 4, 5]), pad([])).input
    expect(input.coverEars).toBe(true)
    expect(input.plugWounds).toBe(false)
  })
  it('keeps the ordinary guard and aura chord available outside the modifier', () => {
    const input = sampleGamepad(pad([4, 5]), pad([])).input
    expect(input.guard).toBe(true)
    expect(input.aura).toBe(true)
  })
})

it('discards queued commands on focus/reset and stops a flush once the fight has ended', () => {
  const queue = createQueuedFightActions()
  const action = vi.fn((state: FightState) => state)
  const state = beginFight(createFight('hisoka', 'kurapika'))
  queue.push(action)
  queue.clear()
  expect(queue.flush(state)).toBe(state)
  expect(action).not.toHaveBeenCalled()
  queue.push((current) => ({ ...current, phase: 'finished' }))
  queue.push(action)
  expect(queue.flush(state).phase).toBe('finished')
  expect(action).not.toHaveBeenCalled()
  expect(queue.flush(state)).toBe(state)
})
