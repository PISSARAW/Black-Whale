import { describe, expect, it } from 'vitest'
import { beginFight, tickFight, performAuraAttack } from './engine'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { performArsenalAction } from './arsenalExecution'
import { EMPTY_INPUT, type FightState } from './types'

function setup(): FightState {
  return beginFight(
    createTeamFight(
      { player: ['illumi', 'bill', 'melody'], opponent: ['theta', 'machi', 'hisoka'] },
      { needleStock: { player: false } },
    ),
  )
}
function choose(state: FightState): FightState {
  return performArsenalAction(
    { state, side: 'player', command: { action: 'illumi-face-mode', target: 'unpinned-hisoka' } },
    performAuraAttack,
  )
}
function frames(state: FightState, count = 35): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
describe('Illumi’s physical face belongs to its body through a relay', () => {
  it('does not block a relay merely for an uncast face choice', () => {
    const base = choose(setup())
    const state = { ...base, player: { ...base.player, x: 7 } }
    expect(requestTeamAssist(state, 'player', 1).player.id).toBe('bill')
  })
  it('keeps the completed native face on its owner and expires it while that body waits at the gate', () => {
    let state = choose(setup())
    state = performArsenalAction(
      { state, side: 'player', command: { action: 'illumi-face-apply' } },
      performAuraAttack,
    )
    state = frames(state)
    const expiry = state.player.illumi!.disguiseExpiresAt!
    state = requestTeamAssist({ ...state, player: { ...state.player, x: 7 } }, 'player', 1)
    expect(state.player.id).toBe('bill')
    expect(state.player.illumi).toBeUndefined()
    expect(state.teamMatch!.seats.player.members[0].illumi?.disguised).toBe(true)
    state = frames({ ...state, frame: expiry - 1 }, 1)
    expect(state.teamMatch!.seats.player.members[0].illumi?.disguised).toBe(false)
    expect(state.player.id).toBe('bill')
  })
})
