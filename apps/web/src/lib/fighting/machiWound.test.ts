import { describe, expect, it } from 'vitest'
import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { canStartFighterAttack } from './fighterAttacks'
import { moveForSlot } from './movesets'
import { tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { EMPTY_INPUT, type FightState, type MoveSlot } from './types'

function play(slots: MoveSlot[]): FightState {
  let state = createCombatRouteFight(
    {
      id: 'm',
      fighter: 'machi',
      kind: 'confirm',
      title: ['', ''],
      moves: [],
      requirement: ['', ''],
    },
    'chrollo',
  )
  state = { ...state, player: { ...state.player, x: 45 }, opponent: { ...state.opponent, x: 50 } }
  let index = 0
  for (let frame = 0; frame < 120; frame++) {
    const move = slots[index] && moveForSlot('machi', slots[index])
    if (move && canStartFighterAttack(state.player, move.kind, move.id)) {
      const after = performTrainingAction({
        state,
        side: 'player',
        action: combatRouteAction(slots[index]),
        input: combatRouteInput(slots[index], state.player.facing),
      })
      if (after.player.attack?.moveId === move.id && after.player.attack !== state.player.attack)
        index++
      state = after
    }
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
  }
  return state
}

describe('Fil court: the Seamstress Elbow opens a wound inside a combo', () => {
  it('opens one when it continues a combo', () => {
    const state = play(['standingLight', 'standingHeavy'])
    expect(state.opponent.comboHits === 0 || state.opponent.comboHits >= 2).toBe(true)
    expect(state.opponent.openWounds ?? 0).toBe(1)
  })

  it('opens none as an opener', () => {
    expect(play(['standingHeavy']).opponent.openWounds ?? 0).toBe(0)
  })
})
