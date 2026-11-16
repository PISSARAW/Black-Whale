import { describe, expect, it } from 'vitest'
// Load formats first: another entry order from engine.test.ts and formats.test.ts.
import { fightFormat } from './formats'
import { FIGHT_FPS, FIXED_STEP } from './frameData'
import { beginFight, createFight, tickFight } from './engine'
import { EMPTY_INPUT } from './types'

describe('fight clock initialization', () => {
  it.each([
    ['heavens-arena', 180],
    ['knockout', 90],
    ['arcade', 60],
  ] as const)(
    'keeps %s at %i seconds and expires on the last frame when formats load first',
    (formatId, seconds) => {
      expect(fightFormat(formatId).roundFrames).toBe(seconds * FIGHT_FPS)
      const state = beginFight(
        createFight('hisoka', 'hisoka', {
          formatId,
          mode: 'versus-local',
        }),
      )
      expect(state.time).toBe(seconds)
      expect(state.remainingFrames).toBe(seconds * FIGHT_FPS)
      const ticking = tickFight(state, EMPTY_INPUT, {
        dt: FIXED_STEP,
        opponentInput: EMPTY_INPUT,
      })
      expect(ticking.remainingFrames).toBe(state.remainingFrames - 1)
      expect(ticking.time).toBeCloseTo(seconds - FIXED_STEP)

      const expired = tickFight({ ...state, remainingFrames: 1, time: FIXED_STEP }, EMPTY_INPUT, {
        dt: FIXED_STEP,
        opponentInput: EMPTY_INPUT,
      })
      expect(expired.phase).toBe('finished')
      expect(expired.winner).toBe('draw')
      expect(expired.time).toBe(0)
    },
  )
})
