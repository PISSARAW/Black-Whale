import { describe, expect, it } from 'vitest'
import { beginFight, performAuraAttack, tickFight } from './engine'
import { createTeamFight, requestTeamAssist } from './teamMatch'
import { performArsenalAction } from './arsenalExecution'
import { performArsenalCommand } from './retrospectiveArsenal'
import { toggleEmperorTime, advanceEmperorClock } from './kurapikaActions'
import { teamRelayReady } from './teamRelayRules'
import { EMPTY_INPUT, type FightState } from './types'

function cast(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function frames(state: FightState, count: number): FightState {
  for (let i = 0; i < count; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function allyLoan(): FightState {
  const base = beginFight(
    createTeamFight({
      player: ['kurapika', 'biscuit', 'theta'],
      opponent: ['hisoka', 'chrollo', 'benjamin'],
    }),
  )
  const drained = frames(
    cast({
      ...base,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: { ...base.opponent, x: 49, aura: 100 },
    }),
    220,
  )
  const loaded = cast(toggleEmperorTime(drained, 'player'))
  const contact = {
    ...loaded,
    player: { ...loaded.player, x: 7 },
    opponent: { ...loaded.opponent, x: 90 },
  }
  return performArsenalCommand(contact, 'player', {
    action: 'dolphin-lend',
    target: 'body:player:1',
  })
}
describe('Stealth Dolphin stays attached to actual team members', () => {
  it('lends to an actual ally at the gate, lets that ally enter, and clocks the waiting lender', () => {
    const loaned = allyLoan()
    expect(loaned.teamMatch!.seats.player.members[1].dolphinLoan?.lender).toEqual({
      owner: 'player',
      member: 0,
    })
    expect(teamRelayReady(loaned, 'player')).toBe(true)
    const entered = requestTeamAssist(loaned, 'player', 1)
    expect(entered.player.id).toBe('biscuit')
    expect(entered.player.dolphinLoan?.held.source).toBe('hisoka')
    const old = entered.teamMatch!.seats.player.members[0].kurapika!.lifespanFrames
    const elapsed = advanceEmperorClock(entered)
    expect(elapsed.teamMatch!.seats.player.members[0].kurapika!.lifespanFrames).toBe(old + 1)
    expect(elapsed.player.kurapika).toBeUndefined()
  })
  it('runs the donor’s Hatsu on the ally’s body and never enables it on a replacement member', () => {
    const entered = requestTeamAssist(allyLoan(), 'player', 1)
    const contact = {
      ...entered,
      player: { ...entered.player, x: 44 },
      opponent: { ...entered.opponent, x: 49 },
    }
    const used = performArsenalAction(
      { state: contact, side: 'player', command: { action: 'dolphin-use' } },
      performAuraAttack,
    )
    expect(used.player.id).toBe('biscuit')
    expect(used.player.attack?.moveId).toBe('hisoka:neutralSpecial')
    expect(used.player.kurapika).toBeUndefined()
    expect(frames(used, 60).bungeeGum?.owner).toBe('player')
    expect(used.teamMatch!.seats.player.members[2].dolphinLoan).toBeUndefined()
  })
})
