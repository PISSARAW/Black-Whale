import { describe, expect, it } from 'vitest'
import { beginFight, createFight, tickFight } from './engine'
import { applyReplayCommand } from './fightReplayCommands'
import { performArsenalCommand } from './retrospectiveArsenal'
import { liveBookEffects, liveBookMove, liveBookMoveReady } from './chrolloLiveBook'
import { EMPTY_INPUT } from './types'

it('bookmarks and uses the actual P2 page without moving P1 or using P1 aura', () => {
  let state = beginFight(createFight('kurapika', 'chrollo', { mode: 'versus-local' }))
  state = performArsenalCommand(state, 'opponent', {
    action: 'history-page',
    target: 'sun-and-moon',
  })
  for (let i = 0; i < 13; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  const player = state.player
  expect(liveBookMoveReady(state, 'bookmark', 'opponent')).toBe(true)
  state = applyReplayCommand(state, liveBookMove('bookmark', 'opponent'))
  expect(state.opponent.chrolloBook).toMatchObject({ bookmark: 'sun-and-moon', open: false })
  expect(state.player).toEqual(player)
})

describe('P2 book effect ownership', () => {
  it('reads the enemy marks and the caster phone, rather than the other camp', () => {
    const state = beginFight(createFight('kurapika', 'chrollo', { mode: 'versus-local' }))
    state.player.hatsuEffects.sunMark = 1
    state.opponent.chrolloHistorical = {
      phone: {
        target: 'player',
        calls: 1,
        dayFrame: 0,
        number: '670000',
        guidance: { kind: 'nearby' },
      },
    }
    expect(liveBookEffects(state, 'fr', 'opponent')).toContain('Soleil posé')
    expect(liveBookEffects(state, 'fr', 'opponent').some((row) => row.includes('Love Dial'))).toBe(
      true,
    )
    expect(liveBookEffects(state, 'fr')).not.toContain('Soleil posé')
  })
})
