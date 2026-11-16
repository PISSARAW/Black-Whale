import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { activeHitbox, attackData, FIXED_STEP } from './frameData'
import { finisherReady, moveForSlot, movesetFor } from './movesets'
import { canUseRangedAttack, rangedAuraCost } from './projectiles'
import { EMPTY_INPUT, type FightInput, type FightSide, type FightState } from './types'

function ready(side: FightSide = 'player'): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'leorio' : 'hisoka',
      side === 'opponent' ? 'leorio' : 'hisoka',
      { mode: 'versus-local', formatId: 'knockout' },
    ),
  )
  return {
    ...base,
    player: { ...base.player, x: 30, aura: 100 },
    opponent: { ...base.opponent, x: 55, aura: 100 },
  }
}

function frames(state: FightState, count: number, input: FightInput = EMPTY_INPUT): FightState {
  let next = state
  for (let frame = 0; frame < count; frame++)
    next = tickFight(next, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  return next
}

function launched(side: FightSide = 'player'): FightState {
  const armed = performAttack(ready(side), side, 'special')
  return frames(armed, attackData('special', armed[side]).startup)
}

describe('Leorio’s surface-transmitted punch', () => {
  it('strikes the floor before emitting aura, without a contact hitbox or instant damage', () => {
    const armed = performAttack(ready(), 'player', 'special')
    const startup = attackData('special', armed.player).startup
    expect(frames(armed, startup - 1).projectiles).toHaveLength(0)
    const state = frames(armed, startup)
    expect(state.opponent.health).toBe(100)
    expect(activeHitbox(state.player)).toBeNull()
    expect(state.projectiles).toHaveLength(1)
    expect(state.projectiles[0]).toMatchObject({
      shape: 'remote-fist',
      matter: 'nen',
      y: -3,
      remotePunch: { targetX: 55, struck: false },
    })
    const travelling = frames(state, 5)
    expect(travelling.projectiles[0].x).toBeGreaterThan(state.projectiles[0].x)
    expect(travelling.projectiles[0].y).toBeLessThan(0)
    expect(travelling.opponent.health).toBe(100)
  })

  it.each(['player', 'opponent'] as const)('emerges upward and hits once for %s', (side) => {
    const state = launched(side)
    const victim = side === 'player' ? 'opponent' : 'player'
    const remote = state.projectiles[0].remotePunch!
    const emerging = frames(state, remote.travelFrames - 1)
    expect(emerging.projectiles[0].x).toBe(remote.targetX)
    expect(emerging[victim].health).toBe(100)
    const hit = frames(emerging, 4)
    expect(hit[victim].health).toBeLessThan(100)
    expect(hit.projectiles[0].remotePunch?.struck).toBe(true)
    expect(hit.impact?.projectileId).toBe(state.projectiles[0].id)
    expect(frames(hit, 50)[victim].health).toBe(hit[victim].health)
    expect(frames(hit, 50).projectiles).toHaveLength(0)
  })

  it('locks the exit point when the surface is struck, allowing a sidestep', () => {
    const state = launched('opponent')
    const targetX = state.projectiles[0].remotePunch!.targetX
    const dodged = frames(state, 50, { ...EMPTY_INPUT, left: true })
    expect(dodged.player.x).toBeLessThan(targetX - 4)
    expect(dodged.player.health).toBe(100)
    expect(dodged.impact).toBeNull()
  })

  it('lets a jump clear the emerging fist and respects guard and parry', () => {
    const state = launched('opponent')
    const beforeJump = frames(performAttack(ready('opponent'), 'opponent', 'special'), 8)
    const jumped = frames(beforeJump, 60, { ...EMPTY_INPUT, jump: true })
    expect(jumped.player.health).toBe(100)
    const blocked = frames(state, 35, { ...EMPTY_INPUT, guard: true })
    expect(blocked.impact).toMatchObject({ blocked: true, parried: false })
    const beforeHit = frames(state, state.projectiles[0].remotePunch!.travelFrames)
    const parried = frames(beforeHit, 5, { ...EMPTY_INPUT, guard: true })
    expect(parried.impact).toMatchObject({ blocked: true, parried: true, damage: 0 })
    expect(parried.player.health).toBe(100)
  })

  it('uses one canonical move for directional L and U, at the same aura cost', () => {
    const base = ready()
    const ranged = performAttack(base, 'player', 'ranged')
    const special = performAttack(base, 'player', 'special')
    expect(ranged.player.attack).toEqual(special.player.attack)
    expect(ranged.player.aura).toBe(100 - rangedAuraCost('leorio'))
    for (const input of [{ down: true }, { left: true }, { right: true }]) {
      const result = performMove({
        state: base,
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, ...input },
      })
      expect(result.player.attack?.moveId).toBe('leorio:neutralSpecial')
      expect(result.player.aura).toBe(ranged.player.aura)
    }
  })

  it('requires the floor, sufficient aura, and an available Hatsu for L and U', () => {
    const base = ready()
    const invalid = [
      { ...base.player, y: 5 },
      { ...base.player, aura: 39 },
      { ...base.player, nen: { ...base.player.nen, mode: 'zetsu' as const } },
      { ...base.player, hatsuEffects: { ...base.player.hatsuEffects, hatsuStolen: 1 } },
      { ...base.player, hatsuEffects: { ...base.player.hatsuEffects, forcedZetsuFrames: 30 } },
    ]
    for (const player of invalid) {
      const state = { ...base, player }
      expect(canUseRangedAttack(player)).toBe(false)
      expect(performAttack(state, 'player', 'ranged')).toBe(state)
      expect(performAttack(state, 'player', 'special')).toBe(state)
    }
  })

  it('limits the strike to its reach and does not hit along the underground path', () => {
    const base = ready()
    const far = { ...base, opponent: { ...base.opponent, x: 90 } }
    const armed = performAttack(far, 'player', 'special')
    const state = frames(armed, 70)
    expect(state.opponent.health).toBe(100)
    expect(state.impact).toBeNull()
    const travelling = launched()
    const crossing = { ...travelling, opponent: { ...travelling.opponent, x: 39 } }
    expect(frames(crossing, 40).opponent.health).toBe(100)
  })

  it('leaves no punch when interrupted before the floor strike or starting a new round', () => {
    const state = performAttack(ready(), 'player', 'special')
    const interrupted = { ...state, player: { ...state.player, attack: null, hitStun: 30 } }
    expect(frames(interrupted, 50).projectiles).toHaveLength(0)
    const reset = nextRound({ ...launched(), phase: 'finished', winner: 'player' })
    expect(reset.projectiles).toHaveLength(0)
  })

  it('lets Chrollo replay the surface strike with the same floor restriction', () => {
    const base = ready()
    const state = {
      ...base,
      player: {
        ...base.player,
        id: 'chrollo' as const,
        chrolloBook: { pages: ['leorio'] as const, page: 0, open: true, bookmark: null },
        hatsuEffects: { ...base.player.hatsuEffects, stolenHatsu: 'leorio' as const },
      },
    }
    const armed = performMove({ state, side: 'player', action: 'special' })
    expect(armed.player.attack?.hatsuSource).toBe('leorio')
    expect(frames(armed, attackData('special', armed.player).startup).projectiles[0].shape).toBe(
      'remote-fist',
    )
    const airborne = { ...state, player: { ...state.player, y: 5 } }
    expect(performMove({ state: airborne, side: 'player', action: 'special' })).toBe(airborne)
  })
})

describe('Leorio’s attested techniques', () => {
  it('lists only one Hatsu, generic physical blows, and no finisher', () => {
    const moveset = movesetFor('leorio')!
    expect(moveset.moves).toHaveLength(11)
    expect(
      moveset.moves.filter((move) => move.category === 'special').map((move) => move.id),
    ).toEqual(['leorio:neutralSpecial'])
    expect(moveForSlot('leorio', 'neutralSpecial')?.canon.evidence).toBe('manga-shown')
    for (const slot of ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'] as const)
      expect(moveForSlot('leorio', slot)).toBeNull()
    expect(moveset.combos.flat().every((id) => moveset.moves.some((move) => move.id === id))).toBe(
      true,
    )
    const state = ready()
    expect(finisherReady({ ...state, player: { ...state.player, health: 1 } }, 'player')).toBe(
      false,
    )
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
    expect(
      performAuraAttack({
        state,
        side: 'player',
        kind: 'special',
        auraCharged: false,
        moveId: 'leorio:backSpecial',
      }),
    ).toBe(state)
  })
})
