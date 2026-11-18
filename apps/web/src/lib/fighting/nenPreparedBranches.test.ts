import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { preparedNenDestinations, nextNenBranchCount } from './nenPreparedBranches'
import { FIGHTING_ROSTER } from './roster'
import { focusNenZone } from './nenAdvanced'
import { moveForSlot } from './movesets'
import { EMPTY_INPUT } from './types'
it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s earns a bounded branch from an actual focused hit',
  (id) => {
    let state = beginFight(createFight(id, 'beyond', { mode: 'versus-local' }))
    state = { ...state, player: { ...state.player, x: 44 }, opponent: { ...state.opponent, x: 49 } }
    const source = moveForSlot(id, 'standingLight')!
    state.player = focusNenZone(state.player, source.tuning.auraZone)
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'light',
      moveId: source.id,
      auraCharged: false,
    })
    for (let i = 0; i < 50 && !state.impact; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(state.player.nenOpening?.share).toBeGreaterThanOrEqual(0.6)
    const choices = preparedNenDestinations(state.player)
    expect(choices.length).toBeGreaterThan(0)
    const cost = state.player.aura
    expect(nextNenBranchCount(state.player, choices[0])).toBe(1)
    expect(preparedNenDestinations({ ...state.player, nenBranchCount: 1 })).toEqual([])
    expect(preparedNenDestinations({ ...state.player, nenOpening: undefined })).toEqual([])
    expect(state.player.aura).toBe(cost)
  },
)
