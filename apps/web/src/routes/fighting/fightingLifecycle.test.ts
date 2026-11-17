import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountFightingPage } from './fightingLifecycle'
import { createFightState } from '$lib/fighting/fightState'
import { EMPTY_INPUT } from '$lib/fighting/types'

vi.mock('./fightingEvents', () => ({ listenFightEvents: () => () => {} }))
vi.mock('$lib/fighting/combatSchool', () => ({
  advanceCombatSchool: ({ state }: { state: unknown }) => state,
}))

let nextFrame: FrameRequestCallback
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    nextFrame = callback
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())

describe('gamepad actions at the page frame boundary', () => {
  it.each(['start', 'pause'] as const)('keeps the state produced by gamepad %s', (action) => {
    let state = createFightState('kurapika', 'hisoka')
    let paused = false
    const update = vi.fn((next: typeof state) => {
      state = next
    })
    const options = {
      controls: {
        poll: () => {
          if (action === 'start') state = { ...state, phase: 'fighting' }
          else paused = true
        },
        combine: () => EMPTY_INPUT,
      },
      practice: { opponentInput: () => EMPTY_INPUT },
      match: { replays: { active: false } },
      read: () => ({ state, paused, active: true, input: EMPTY_INPUT, opponentInput: EMPTY_INPUT }),
      update,
    } as unknown as Parameters<typeof mountFightingPage>[0]
    const stop = mountFightingPage(options)
    nextFrame(performance.now() + 16)
    if (action === 'start') {
      expect(state.phase).toBe('fighting')
      expect(update).toHaveBeenCalledOnce()
    } else {
      expect(paused).toBe(true)
      expect(update).not.toHaveBeenCalled()
    }
    stop()
  })
})
