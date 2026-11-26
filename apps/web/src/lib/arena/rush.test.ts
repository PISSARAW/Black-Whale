import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/types'
import type { WallSegment } from '../tour/types'
import { advanceArena } from './ai'
import { arenaRushStep, RUSH_DURATION, RUSH_STOP_DISTANCE } from './rush'
import { buildCombatTerrain, OBSERVATION_DECK_ID } from './terrain'
import { combatReducer } from '../combat/reducer'
import { distance } from './sceneGeometry'

function duel(walls: WallSegment[] = []) {
  return initialCombatState({
    playerAt: [0, 0],
    opponentAt: [8, 0],
    terrain: {
      id: 'room',
      footprint: [
        [-2, -2],
        [12, -2],
        [12, 2],
        [-2, 2],
      ],
      walls,
    },
  })
}

describe('Arena rush', () => {
  it('moves toward the opponent without overshooting melee range', () => {
    let state = duel()
    const firstStep = arenaRushStep(state, 1 / 60)
    expect(firstStep?.[0]).toBeCloseTo(0.3)
    let position = firstStep
    while (position) {
      state = { ...state, player: { ...state.player, position } }
      position = arenaRushStep(state, 1 / 60)
    }
    expect(8 - state.player.position[0]).toBeCloseTo(RUSH_STOP_DISTANCE)
  })

  it('stops against room geometry and during hitstop', () => {
    const state = duel([{ spaceId: 'room', start: [0.45, -2], end: [0.45, 2] }])
    expect(arenaRushStep(state, 1 / 60)).toBeNull()
    expect(arenaRushStep({ ...duel(), hitstop: 0.1 }, 1 / 60)).toBeNull()
  })

  it('closes the opening distance on the observation deck against the live opponent', () => {
    const terrain = buildCombatTerrain(OBSERVATION_DECK_ID)
    let state = initialCombatState({
      playerAt: terrain.spawns[0],
      opponentAt: terrain.spawns[1],
      terrain,
    })
    for (let tick = 0; tick < RUSH_DURATION * 60; tick += 1) {
      const position = arenaRushStep(state, 1 / 60)
      if (!position) break
      state = combatReducer(state, { type: 'SYNC_POSITION', side: 'player', position })
      state = advanceArena(state, 1 / 60, { fighterId: 'hisoka' })
    }
    expect(distance(state.player.position, state.opponent.position)).toBeLessThan(2.5)
  })
})
