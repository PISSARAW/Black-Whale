import { describe, expect, it } from 'vitest'
import { moveForSlot } from '../fighting/movesets'
import { combatReducer } from './reducer'
import { initialCombatState, type CombatState } from './types'

const STEP = 1 / 60

function landKurapikaJab(): CombatState {
  let state: CombatState = {
    ...initialCombatState({
      playerAt: [0, 0],
      opponentAt: [1.5, 0],
      terrain: initialCombatState().terrain,
    }),
    nenRules: 'clash',
  }
  state = combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'player',
    fighterId: 'kurapika',
    slot: 'standingLight',
    targetAt: state.opponent.position,
  })
  for (let frame = 0; frame < 30 && !state.lastEvent; frame += 1)
    state = combatReducer(state, { type: 'TICK', dt: STEP })
  return state
}

describe('Arena authored hitstop', () => {
  it('freezes combat time for the move authored frame count', () => {
    let state = landKurapikaJab()
    const move = moveForSlot('kurapika', 'standingLight')!
    const contactClock = state.clock
    const contactPosition = state.opponent.position

    expect(state.lastEvent).toMatchObject({ moveId: move.id, hitstop: move.tuning.hitstop / 60 })
    for (let frame = 0; frame < move.tuning.hitstop; frame += 1)
      state = combatReducer(state, { type: 'TICK', dt: STEP })

    expect(state.hitstop).toBe(0)
    expect(state.clock).toBe(contactClock)
    expect(state.opponent.position).toEqual(contactPosition)
  })

  it('buffers a cancel during hitstop and releases it on the first active boundary', () => {
    let state = landKurapikaJab()
    state = combatReducer(state, {
      type: 'FIGHTING_MOVE',
      side: 'player',
      fighterId: 'kurapika',
      slot: 'standingHeavy',
      targetAt: state.opponent.position,
    })

    expect(state.player.buffered?.slot).toBe('standingHeavy')
    while (state.hitstop > 0) state = combatReducer(state, { type: 'TICK', dt: STEP })
    expect(state.player.buffered).toBeNull()
    expect(state.player.intent?.moveId).toBe('kurapika:standingHeavy')
  })
})
