import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { attackData } from './frameData'
import { hatsuFor } from './hatsu'
import { blinkyBloodReady, blinkyState } from './blinky'
import { finisherReady, moveForSlot } from './movesets'
import type { PreparedEntity } from './preparationTypes'
import type { FightProjectile, FightSide, FightState, MoveSlot } from './types'

/** Shizuku at 30 facing Hisoka at 45: the nozzle covers lanes 31 to 50. */
function duel(): FightState {
  const state = beginFight(
    createFight('shizuku', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 30, aura: 100 },
    opponent: { ...state.opponent, x: 45, aura: 100 },
  }
}

function shot(id: number, x: number, rest: Partial<FightProjectile> = {}): FightProjectile {
  return {
    id,
    owner: 'opponent',
    fighterId: 'theta',
    shape: 'bullet',
    matter: 'object',
    colour: '#aaaabb',
    x,
    y: 6.1,
    velocityX: -50,
    width: 0.1,
    height: 0.1,
    damage: 10,
    hitstun: 10,
    blockstun: 5,
    hitstop: 3,
    knockback: 1,
    targetZone: 'torso',
    concealed: false,
    age: 0,
    lifetime: 120,
    ...rest,
  }
}

/** A real cover standing between the two fighters. */
function covered(state: FightState, x = 38): FightState {
  const cover: PreparedEntity = {
    id: 'cover',
    kind: 'crate',
    material: 'real',
    owner: 'neutral',
    x,
    y: 0,
    present: true,
    health: 100,
    arena: { width: 2, height: 10 },
  }
  return {
    ...state,
    battlefield: {
      entities: [cover],
      interactionHeld: { player: false, opponent: false },
      completed: { player: 0, opponent: 0 },
    },
  }
}

function active(state: FightState, slot: MoveSlot = 'neutralSpecial', side: FightSide = 'player') {
  const move = moveForSlot('shizuku', slot)!
  const started = performAuraAttack({
    state,
    side,
    kind: 'special',
    moveId: move.id,
    auraCharged: false,
  })
  const frame = attackData('special', started[side]).startup
  return { ...started, [side]: { ...started[side], attack: { ...started[side].attack!, frame } } }
}

const blinkyFrame = (state: FightState) => hatsuFor('shizuku').onFrame(state)

/** Keeps the same suction running for a few more active frames. */
function hold(state: FightState, frames: number): FightState {
  for (let n = 0; n < frames; n++) {
    const attack = state.player.attack!
    state = blinkyFrame({
      ...state,
      player: { ...state.player, attack: { ...attack, frame: attack.frame + 1 } },
    })
  }
  return state
}

describe('Blinky · sacrificing what was stored', () => {
  it('swallows exactly one named object per suction and leaves the rest in flight', () => {
    const state = duel()
    state.projectiles = [shot(1, 36), shot(2, 40)]
    const first = blinkyFrame(active(state))
    expect(blinkyState(first.player).lastObject?.id).toBe(1)
    const later = hold(first, 5)
    expect(later.projectiles.map((p) => p.id)).toEqual([2])
    expect(blinkyState(later.player).lastObject?.id).toBe(1)
  })

  it('gives up the stored object for good when a new danger is swallowed', () => {
    const state = duel()
    state.projectiles = [shot(1, 36, { damage: 4 })]
    const first = blinkyFrame(active(state))
    const idle = {
      ...first,
      projectiles: [shot(2, 36, { damage: 9 })],
      player: { ...first.player, attack: null, aura: 100 },
    }
    const second = blinkyFrame(active(idle))
    expect(blinkyState(second.player).lastObject?.id).toBe(2)
    expect(JSON.stringify(blinkyState(second.player))).not.toContain('"id":1,')
  })

  it('refuses Nen creations and living matter even of the named kind', () => {
    const state = duel()
    state.projectiles = [shot(1, 36, { matter: 'nen' }), shot(2, 37, { living: true })]
    const result = blinkyFrame(active(state))
    expect(result.projectiles.map((p) => p.id)).toEqual([1, 2])
    expect(blinkyState(result.player).lastObject).toBeUndefined()
  })

  it('needs a free path to swallow an object', () => {
    const state = covered(duel())
    state.projectiles = [shot(1, 42)]
    const result = blinkyFrame(active(state))
    expect(result.projectiles.map((p) => p.id)).toEqual([1])
    const reachable = { ...state, projectiles: [shot(2, 34)] }
    expect(blinkyState(blinkyFrame(active(reachable)).player).lastObject?.id).toBe(2)
  })

  it('needs a real open wound and a free path to draw blood', () => {
    const state = duel()
    state.opponent.openWounds = 1
    expect(blinkyBloodReady(state, 'player')).toBe(true)
    const hidden = covered(state)
    expect(blinkyBloodReady(hidden, 'player')).toBe(false)
    expect(finisherReady(hidden, 'player')).toBe(false)
    // A cover placed once the suction is running stops the blood loss as well.
    const running = active(state, 'finisher')
    const result = blinkyFrame(covered(running))
    expect(result.opponent.health).toBe(state.opponent.health)
    expect(blinkyFrame(running).opponent.health).toBeLessThan(state.opponent.health)
  })
})
