import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, performMove } from './engine'
import { commandMary } from './bloodyMaryAction'
import { advanceBloodyMary } from './bloodyMaryFrame'
import { MARY_CAPACITY, maryState, type MaryCommand, type MaryDrop } from './bloodyMary'
import { MARY_DISPERSAL_FRAMES } from './bloodyMaryReserve'
import { vacuumMaryDrops } from './bloodyMaryVacuum'
import { activeHitbox, attackData } from './frameData'
import { projectileProfile } from './projectiles'
import { EMPTY_INPUT, type FightProjectile, type FighterId, type FightState } from './types'

function duel(rival: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight('zakuro', rival, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...base, player: { ...base.player, x: 42 }, opponent: { ...base.opponent, x: 51 } }
}
const command = (state: FightState, action: MaryCommand) =>
  commandMary({ state, side: 'player', command: action }, performAuraAttack)
const scouting = (rival?: FighterId) => command(command(duel(rival), 'bleed'), 'scout')
const withDrops = (state: FightState, drops: MaryDrop[]): FightState => ({
  ...state,
  player: { ...state.player, bloodyMary: { ...maryState(state.player), drops } },
})

/** The opponent's low kick, frozen on its first active frame, and the point it covers. */
function kick(state: FightState) {
  const kicked = performMove({
    state,
    side: 'opponent',
    action: 'light',
    input: { ...EMPTY_INPUT, down: true },
  })
  const opponent = {
    ...kicked.opponent,
    attack: { ...kicked.opponent.attack!, frame: attackData('light', kicked.opponent).startup },
  }
  const box = activeHitbox(opponent)!
  return {
    state: { ...kicked, opponent },
    point: { x: (box.left + box.right) / 2, y: (box.bottom + box.top) / 2 },
  }
}

describe('Bloody Mary draws on a material reserve', () => {
  it('takes deployed blood out of the reserve', () => {
    const state = scouting()
    expect(maryState(state.player).available).toBe(MARY_CAPACITY - 3)
    expect(maryState(state.player).drops).toHaveLength(3)
  })

  it('does not let the dispersing blow count twice', () => {
    const { state, point } = kick(scouting())
    const drop = { ...maryState(state.player).drops[0], ...point }
    let next = advanceBloodyMary(withDrops(state, [drop]))
    expect(maryState(next.player).drops[0].reformFrames).toBe(MARY_DISPERSAL_FRAMES)
    next = advanceBloodyMary(next)
    expect(maryState(next.player).drops).toHaveLength(1)
  })

  it('destroys a dispersed drop struck again, and that blood never returns', () => {
    const { state, point } = kick(scouting())
    const dispersed = {
      ...maryState(state.player).drops[0],
      ...point,
      reformFrames: MARY_DISPERSAL_FRAMES - 15,
    }
    const destroyed = advanceBloodyMary(withDrops(state, [dispersed]))
    expect(maryState(destroyed.player).drops).toEqual([])
    expect(maryState(destroyed.player).available).toBe(MARY_CAPACITY - 3)
    const recalled = command(
      { ...destroyed, opponent: { ...destroyed.opponent, attack: null } },
      'recall',
    )
    expect(maryState(recalled.player).available).toBe(MARY_CAPACITY - 3)
  })

  it('lets a passing projectile draw a patrolling drop away', () => {
    const state = scouting()
    const drop = { ...maryState(state.player).drops[0], x: 30, y: 1, direction: 1 as const }
    const shot: FightProjectile = {
      ...projectileProfile('hisoka'),
      id: 9,
      owner: 'opponent',
      fighterId: 'hisoka',
      x: 22,
      y: 4,
      velocityX: 0,
      damage: 0,
      age: 0,
      lifetime: 60,
      targetZone: 'torso',
    }
    const lured = advanceBloodyMary({ ...withDrops(state, [drop]), projectiles: [shot] })
    const moved = maryState(lured.player).drops[0]
    expect(moved.direction).toBe(-1)
    expect(moved.x).toBeLessThan(30)
    const free = advanceBloodyMary(withDrops(state, [drop]))
    expect(maryState(free.player).drops[0].x).toBeGreaterThan(30)
  })

  it('lets Blinky suck up drops in its clear nozzle; that blood is lost', () => {
    const state = scouting('shizuku')
    const sucking = performAuraAttack({
      state,
      side: 'opponent',
      kind: 'special',
      moveId: 'shizuku:neutralSpecial',
      auraCharged: false,
    })
    const active = {
      ...sucking,
      opponent: {
        ...sucking.opponent,
        attack: {
          ...sucking.opponent.attack!,
          frame: attackData('special', sucking.opponent).startup,
        },
      },
    }
    const drops = maryState(state.player).drops
    const inNozzle = { ...drops[0], x: 45, y: 6 }
    const behind = { ...drops[1], x: 60, y: 6 }
    const after = vacuumMaryDrops(withDrops(active, [inNozzle, behind]))
    expect(maryState(after.player).drops.map((drop) => drop.id)).toEqual([behind.id])
    expect(maryState(after.player).available).toBe(MARY_CAPACITY - 3)
  })
})
