import { describe, expect, it } from 'vitest'
import { combatReducer, initialCombatState } from '../combat/reducer'
import type { CombatState } from '../combat/types'
import type { Vec2 } from '../tour/types'
import { reconcileWalk } from './walkSync'

function harness(initial: CombatState) {
  let state = initial
  const dispatch = (action: Parameters<typeof combatReducer>[1]) => {
    state = combatReducer(state, action)
    return state
  }
  return { dispatch, current: () => state }
}

const at = (state: CombatState): Vec2 => state.player.position

describe('arena camera and duel body', () => {
  it('offers a walk to the rules and leaves the camera where it is', () => {
    const { dispatch, current } = harness(initialCombatState())
    const frame = { camera: [1, 0] as Vec2, heading: 0, state: current(), agreed: at(current()) }
    expect(reconcileWalk(frame, dispatch)).toBeNull()
    expect(at(current())).toEqual([1, 0])
  })

  it('moves the camera after the rules moved the body', () => {
    const { dispatch, current } = harness(initialCombatState())
    const agreed = at(current())
    dispatch({ type: 'EVADE', side: 'player', vector: [0, 1] })
    const frame = { camera: agreed, heading: 0, state: current(), agreed }
    expect(reconcileWalk(frame, dispatch)).toEqual(at(current()))
    expect(at(current())).not.toEqual(agreed)
  })

  it('puts the camera back when the rules refuse the walk', () => {
    const base = initialCombatState()
    const { dispatch, current } = harness({ ...base, player: { ...base.player, bound: 1 } })
    const frame = { camera: [1, 0] as Vec2, heading: 0, state: current(), agreed: at(current()) }
    expect(reconcileWalk(frame, dispatch)).toEqual([0, 0])
  })

  it('never lets a step out of the room ring the visitor out', () => {
    const { dispatch, current } = harness(initialCombatState())
    const frame = { camera: [80, 0] as Vec2, heading: 0, state: current(), agreed: at(current()) }
    expect(reconcileWalk(frame, dispatch)).toEqual([0, 0])
    expect(current().outcome).toBe('playing')
    expect(at(current())).toEqual([0, 0])
  })

  it('leaves the camera free once the match is over', () => {
    const base = initialCombatState()
    const { dispatch, current } = harness({ ...base, outcome: 'won' })
    const frame = { camera: [80, 0] as Vec2, heading: 0, state: current(), agreed: [5, 5] as Vec2 }
    expect(reconcileWalk(frame, dispatch)).toBeNull()
  })
})
