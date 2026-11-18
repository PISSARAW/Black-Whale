import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { performArsenalAction } from './arsenalExecution'
import { toggleEmperorTime } from './kurapikaActions'
import { availablePaperScatter } from './kallutoScatter'
import { EMPTY_INPUT, type FightState } from './types'

function advance(state: FightState, count: number): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function syringe(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'kurapika:backSpecial',
    auraCharged: false,
  })
}
function loaded(): FightState {
  let state = beginFight(
    createFight('kurapika', 'kalluto', {
      mode: 'versus-local',
      formatId: 'knockout',
      environment: { preparation: { mode: 'scenario', resources: ['paper'], cohorts: [] } },
    }),
  )
  state = performArsenalCommand(
    { ...state, player: { ...state.player, x: 26, aura: 100 } },
    'player',
    { action: 'paper-kit-take', target: 'player:paper-kit' },
  )
  state = {
    ...state,
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 49, aura: 100 },
  }
  state = advance(
    performAuraAttack({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'kalluto:neutralSpecial',
      auraCharged: false,
    }),
    80,
  )
  state = advance(syringe(state), 220)
  state = syringe(toggleEmperorTime(state, 'player'))
  expect(state.player.kurapika?.held).toMatchObject({
    source: 'kalluto',
    loaded: true,
    used: false,
  })
  return state
}
describe('one stolen paper-manipulation application has its actual compound commands', () => {
  it('keeps Dolphin engaged across dispersion and reuse of the same real paper, then returns the donor’s Hatsu on release', () => {
    const prepared = loaded()
    const started = advance(syringe(prepared), 80)
    const paper = availablePaperScatter(started, 'player')!
    expect(paper).toBeDefined()
    expect(started.player.kurapika?.held?.used).toBe(true)
    expect(started.player.kurapika?.held?.returned).not.toBe(true)
    const before = started.player.kurapika!.held!.auraSupply!.amount
    const ordered = performArsenalAction(
      {
        state: started,
        side: 'player',
        command: { action: 'dolphin-move', target: 'kalluto:forwardSpecial' },
      },
      performAuraAttack,
    )
    expect(ordered.player.aura).toBe(started.player.aura)
    const repeated = advance(ordered, 80)
    expect(repeated.player.kurapika?.held?.auraSupply?.amount).toBeLessThan(before)
    expect(repeated.player.paperKit?.markers).toBe(11)
    expect(repeated.player.paperKit?.salvos).toBe(6)
    expect(availablePaperScatter(repeated, 'player')?.id).toBe(paper.id)
    expect(
      performArsenalAction(
        {
          state: repeated,
          side: 'player',
          command: { action: 'dolphin-move', target: 'kalluto:neutralSpecial' },
        },
        performAuraAttack,
      ),
    ).toBe(repeated)
    const stopped = advance(
      performArsenalCommand(repeated, 'player', { action: 'paper-release-confetti' }),
      5,
    )
    expect(stopped.player.kurapika?.held).toBeNull()
    expect(stopped.opponent.stolenChainAbility).toBeUndefined()
    expect(stopped.player.kurapika?.emperorTime).toBe(true)
    expect(availablePaperScatter(stopped, 'player')?.id).toBe(paper.id)
  })
})
