import { describe, expect, it } from 'vitest'
import type { HatsuProfile } from '../nen/hatsuRegistry'
import { initialCombatState } from '../combat/reducer'
import { advanceArena, type ArenaDifficulty, type OpponentDoctrine } from './ai'
import { arenaDefinition } from './hatsu/contract'
import { ARENA_TERRAIN_IDS, buildCombatTerrain } from './terrain'

const doctrines: OpponentDoctrine[] = ['counter', 'binder', 'artillery', 'deceiver']
const difficulties: ArenaDifficulty[] = ['initiate', 'fighter', 'master']

describe('Arena V2 release matrix', () => {
  for (const terrainId of ARENA_TERRAIN_IDS) {
    for (const doctrine of doctrines) {
      for (const difficulty of difficulties) {
        it(`${terrainId} / ${doctrine} / ${difficulty} remains referee-safe`, () => {
          const terrain = buildCombatTerrain(terrainId)
          let state = initialCombatState({
            playerAt: terrain.spawns[0],
            opponentAt: terrain.spawns[1],
            terrain: { id: terrain.id, footprint: terrain.footprint, walls: terrain.walls },
          })
          for (let frame = 0; frame < 60 * 20 && state.outcome === 'playing'; frame += 1) {
            state = advanceArena(state, 1 / 60, doctrine, difficulty)
          }
          for (const fighter of [state.player, state.opponent]) {
            expect(fighter.position.every(Number.isFinite)).toBe(true)
            expect(fighter.aura).toBeGreaterThanOrEqual(0)
            expect(fighter.aura).toBeLessThanOrEqual(fighter.capacity)
          }
        })
      }
    }
  }

  it.each([
    ['bungee-gum', 'bind'],
    ['ripper-cyclotron', 'impact'],
    ['double-machine-gun', 'barrage'],
    ['battle-cantabile-jupiter', 'impact'],
  ] as const)('ships an individualized contract for %s', (id, effect) => {
    const profile = { id } as HatsuProfile
    expect(arenaDefinition(profile)).toMatchObject({ id, effect })
  })
})
