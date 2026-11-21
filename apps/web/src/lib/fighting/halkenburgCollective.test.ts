import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { hatsuFor } from './hatsu/registry'
import { COHORT_REACH } from './halkenburgCollective'
import { readyCohort, updateEntity } from './preparationWorld'
import { COHORT_WILL_FRAMES } from './preparationTuning'
import { interceptProjectileWorld } from './projectileInterception'
import { projectileProfile } from './projectiles'
import { arenaObjects } from './arenaActions'
import { EMPTY_INPUT, type FightProjectile, type FightState } from './types'

function cohortDuel(): FightState {
  const state = beginFight(
    createFight('halkenburg', 'hisoka', {
      mode: 'versus-local',
      environment: {
        arenaInteractions: true,
        preparation: { mode: 'scenario', resources: [], cohorts: ['player'] },
      },
    }),
  )
  return {
    ...state,
    player: {
      ...state.player,
      aura: 100,
      hatsuEffects: { ...state.player.hatsuEffects, cohortWillFrames: COHORT_WILL_FRAMES },
    },
  }
}
const supporters = (state: FightState) =>
  state.battlefield!.entities.filter((entry) => entry.kind === 'supporter')
function frames(state: FightState, count: number): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}
function nock(state: FightState): FightState {
  return performAuraAttack({
    state,
    side: 'player',
    kind: 'special',
    moveId: 'halkenburg:neutralSpecial',
    auraCharged: false,
  })
}
const arrows = (state: FightState) => state.projectiles.filter((shot) => shot.halkenburgArrow)
/** Counts every arrow seen in flight, since a released one is consumed on contact. */
function releasedArrows(state: FightState, count: number): { state: FightState; seen: number } {
  const seen = new Set<number>()
  for (let frame = 0; frame < count; frame++) {
    state = frames(state, 1)
    for (const shot of arrows(state)) seen.add(shot.id)
  }
  return { state, seen: seen.size }
}

describe('Halkenburg’s collective weapon', () => {
  it('counts only real, marked, consenting, awake partisans near the archer', () => {
    const state = cohortDuel()
    expect(readyCohort(state, 'player')).toHaveLength(3)
    const far = { ...state, player: { ...state.player, x: 17 + COHORT_REACH + 1 } }
    expect(readyCohort(far, 'player').map((entry) => entry.id)).toEqual([])
    const [first, second, third] = supporters(state)
    let altered = updateEntity(state, first.id, { material: 'nen' })
    altered = updateEntity(altered, second.id, { feather: false })
    altered = updateEntity(altered, third.id, { consenting: false })
    expect(readyCohort(altered, 'player')).toEqual([])
  })

  it('loses the gathered will when a landed hit breaks the archer’s concentration', () => {
    const state = cohortDuel()
    const gathering = {
      ...state,
      player: {
        ...state.player,
        hatsuEffects: { ...state.player.hatsuEffects, cohortWillFrames: 100 },
      },
    }
    const calm = hatsuFor('halkenburg').onFrame(gathering)
    expect(calm.player.hatsuEffects.cohortWillFrames).toBe(101)
    const struck = hatsuFor('halkenburg').onFrame({
      ...gathering,
      player: { ...gathering.player, hitStun: 6 },
    })
    expect(struck.player.hatsuEffects.cohortWillFrames).toBe(0)
  })

  it('protects the archer with the group’s aura, and releases a real arrow', () => {
    const nocked = nock(cohortDuel())
    expect(nocked.player.hatsuEffects.arrowNocked).toBe(1)
    const participant = nocked.player.halkenburgSupporter!
    const pool = [...supporters(nocked).map((entry) => entry.id), 'self:player']
    expect(pool).toContain(participant)
    expect(frames(nocked, 1).player.halkenburgGroupProtection).toBe(true)
    expect(releasedArrows(nocked, 60).seen).toBe(1)
  })

  it('dissolves the arrow when the group is separated before the release', () => {
    let scattered = nock(cohortDuel())
    for (const entry of supporters(scattered))
      scattered = updateEntity(scattered, entry.id, { x: 90 })
    const { state: after, seen } = releasedArrows(scattered, 60)
    expect(seen).toBe(0)
    expect(after.player.hatsuEffects.arrowNocked).toBe(0)
    expect(after.player.halkenburgGroupProtection).toBeFalsy()
  })

  it('crosses cover that stops an ordinary projectile', () => {
    const state = cohortDuel()
    const bullet: FightProjectile = {
      ...projectileProfile('theta'),
      id: 1,
      owner: 'player',
      fighterId: 'theta',
      x: 36,
      y: 6,
      velocityX: 100,
      damage: 50,
      age: 0,
      lifetime: 60,
      targetZone: 'torso',
    }
    const ordinary = interceptProjectileWorld(state, { projectile: bullet, previousX: 30 })
    expect(ordinary.intercepted).toBe(true)
    const arrow = { ...bullet, halkenburgArrow: { participant: 'self:player' } }
    const crossed = interceptProjectileWorld(state, { projectile: arrow, previousX: 30 })
    expect(crossed.intercepted).toBe(false)
    expect(arenaObjects(crossed.state)).toHaveLength(arenaObjects(state).length)
  })
})
