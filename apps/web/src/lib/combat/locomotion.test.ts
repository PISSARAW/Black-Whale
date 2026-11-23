import { describe, expect, it } from 'vitest'
import { jumpTrajectory, lungeAdvance, moveThroughOpenRoom } from './locomotion'
import { initialCombatState } from './types'
import type { CombatState } from './types'
import type { DangerBoundary, PassageBoundary, WallSegment, Polygon } from '../tour/types'

const FOOTPRINT: Polygon = [
  [-2, -2],
  [2, -2],
  [2, 2],
  [-2, 2],
]

function stateWith(
  boundaries: Array<PassageBoundary | DangerBoundary>,
  walls: WallSegment[] = [],
): CombatState {
  return initialCombatState({
    playerAt: [0, 0],
    opponentAt: [0, 6],
    terrain: { id: 'locomotion-room', footprint: FOOTPRINT, walls, boundaries },
  })
}

describe('the open-room locomotion layer', () => {
  it('stops a ground move against a solid wall without sanctioning the fighter', () => {
    const state = stateWith([], [{ spaceId: 'locomotion-room', start: [1, -2], end: [1, 2] }])
    state.player.position = [0, 0]
    state.player.movement = [1, 0]
    const move = moveThroughOpenRoom(state, 'player', 1)
    expect(move.expelled).toBe(false)
    expect(move.crossed).toBeNull()
    expect(move.fighter.position[0]).toBeCloseTo(0.55, 5)
  })

  it('stays silent for a move that never leaves the footprint', () => {
    const state = stateWith([])
    state.player.position = [-1, 0]
    state.player.movement = [0, 0]
    const move = moveThroughOpenRoom(state, 'player', 1)
    expect(move.crossed).toBeNull()
    expect(move.expelled).toBe(false)
  })

  it('sanctions a walk-off from an open dangerous edge', () => {
    const state = stateWith([
      {
        kind: 'danger',
        edge: [
          [2, -2],
          [2, 2],
        ],
        hazard: { kind: 'fall', drop: 12 },
        barrierHeight: 0,
      },
    ])
    state.player.position = [1, 0]
    state.player.movement = [1, 0]
    const move = moveThroughOpenRoom(state, 'player', 1)
    expect(move.crossed?.kind).toBe('danger')
    expect(move.expelled).toBe(true)
  })

  it('lets a move cross an open way out without a KO', () => {
    const state = stateWith([
      {
        kind: 'passage',
        edge: [
          [2, -2],
          [2, 2],
        ],
        targetSpaceId: 'tier-2-screening-room',
        doorway: null,
        link: null,
      },
    ])
    state.player.position = [1, 0]
    state.player.movement = [1, 0]
    const move = moveThroughOpenRoom(state, 'player', 1)
    expect(move.crossed?.kind).toBe('passage')
    expect(move.expelled).toBe(false)
  })

  it('blocks a ground move against a railing before the dangerous edge', () => {
    const state = stateWith([
      {
        kind: 'danger',
        edge: [
          [2, -2],
          [2, 2],
        ],
        hazard: { kind: 'fall', drop: 12 },
        barrierHeight: 3,
      },
    ])
    state.player.position = [1, 0]
    state.player.movement = [1, 0]
    const move = moveThroughOpenRoom(state, 'player', 1)
    expect(move.crossed).toBeNull()
    expect(move.expelled).toBe(false)
    expect(move.fighter.position[0]).toBe(1)
  })

  it('commits a lunge progressively from launch to strike', () => {
    expect(lungeAdvance(2, 0)).toBe(0)
    expect(lungeAdvance(2, 0.25)).toBeCloseTo(0.3125)
    expect(lungeAdvance(2, 1)).toBe(2)
    expect(lungeAdvance(2, -1)).toBe(0)
    expect(lungeAdvance(2, 4)).toBe(2)
  })

  it('gives a deterministic arc from launch velocity and elapsed time', () => {
    expect(jumpTrajectory(4.5, 0)).toEqual({ height: 0, grounded: true })
    expect(jumpTrajectory(4.5, 0.5).height).toBeCloseTo(1.025)
    expect(jumpTrajectory(4.5, 2).grounded).toBe(true)
  })
})
