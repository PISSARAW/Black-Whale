import { describe, expect, it } from 'vitest'
import { FIGHTING_ROSTER } from './roster'
import { beginFight, createFight, tickFight } from './engine'
import { EMPTY_INPUT } from './types'
import { fightReplayHash } from './fightReplayHash'
import { responsiveFightPosition, visualFighter } from './fightVisualPrediction'

describe('local input-to-render positions', () => {
  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    'draws the completed %s movement tick without a frame of interpolation lag',
    (id) => {
      const before = beginFight(createFight(id, id, { mode: 'versus-local' }))
      const after = tickFight(
        before,
        { ...EMPTY_INPUT, right: true },
        { dt: 1 / 60, ai: false, opponentInput: { ...EMPTY_INPUT, left: true } },
      )
      const hash = fightReplayHash(after)
      expect(after.player.x).toBeGreaterThan(before.player.x)
      expect(after.opponent.x).toBeLessThan(before.opponent.x)
      expect(responsiveFightPosition(after, 'player').x).toBe(after.player.x)
      expect(responsiveFightPosition(after, 'opponent').x).toBe(after.opponent.x)
      expect(fightReplayHash(after)).toBe(hash)
    },
  )
  it('ignores an old preview after reset or replay state replacement', () => {
    const state = createFight('kurapika', 'hisoka')
    const other = createFight('kurapika', 'hisoka')
    const preview = { source: other, player: { ...other.player, x: 90 } }
    expect(responsiveFightPosition(state, 'player', preview).x).toBe(state.player.x)
    expect(visualFighter(state, 'player', preview)).toBe(state.player)
  })
})
