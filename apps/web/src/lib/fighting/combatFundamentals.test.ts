import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performMove, performThrow, tickFight } from './engine'
import { attackData, attackPhase } from './frameData'
import { resolveFightImpacts } from './combatImpact'
import { prepareDefence } from './combatDefence'
import { canCancel } from './duelMoves'
import { canStartFighterAttack } from './fighterAttacks'
import { canAct } from './fightActorState'
import { moveById, movesetFor } from './movesets'
import { FIGHTING_ROSTER } from './roster'
import { FIXED_STEP, INPUT_BUFFER_FRAMES } from './fightClock'
import {
  THROW_TECH_FRAMES,
  THROW_TECH_RECOVERY_FRAMES,
  REVERSAL_WINDOW_FRAMES,
  WAKEUP_INVULNERABLE_FRAMES,
} from './throwRules'
import { isThrowTech } from './reactionMotion'
import { advanceAttackBuffer } from './attackBuffer'
import type { ProjectileHit } from './projectiles'
import {
  EMPTY_INPUT,
  type FightInput,
  type FightSide,
  type FightState,
  type FighterId,
} from './types'

function duel(player: FighterId = 'kurapika', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 44, aura: 100 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function active(state: FightState, side: FightSide = 'player'): FightState {
  const fighter = state[side]
  if (!fighter.attack) throw new Error('Attack was refused')
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack, frame: attackData(fighter.attack.kind, fighter).startup },
    },
  }
}
function resolve(state: FightState, side: FightSide = 'player'): FightState {
  return resolveFightImpacts(active(state, side), [])
}
function step(state: FightState, count = 1, input: Partial<FightInput> = {}): FightState {
  for (let frame = 0; frame < count; frame++)
    state = tickFight(
      state,
      { ...EMPTY_INPUT, ...input },
      { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false },
    )
  return state
}
function guarded(state = duel()): FightState {
  return { ...state, opponent: { ...state.opponent, blocking: true, guardFrames: 50 } }
}
function shot(state: FightState, update: Partial<ProjectileHit['projectile']> = {}): ProjectileHit {
  return {
    defenderSide: 'opponent',
    position: { x: state.opponent.x, y: state.opponent.y + 6 },
    projectile: {
      id: 1,
      owner: 'player',
      fighterId: 'hisoka',
      x: state.opponent.x,
      y: state.opponent.y + 6,
      velocityX: 0,
      width: 1,
      height: 1,
      damage: 8,
      hitstun: 10,
      blockstun: 8,
      hitstop: 4,
      knockback: 1,
      targetZone: 'head',
      shape: 'card',
      colour: '#fff',
      age: 1,
      lifetime: 100,
      matter: 'object',
      guard: 'mid',
      ...update,
    },
  }
}

const defensiveCases = (['mid', 'low', 'overhead', 'throw'] as const).flatMap((guard) =>
  (['head', 'torso', 'hands', 'feet'] as const).flatMap((zone) =>
    [false, true].map((crouching) => ({ guard, zone, crouching })),
  ),
)
describe('guard type is independent of Nen body reinforcement', () => {
  it.each(defensiveCases)(
    '$guard on $zone against crouching=$crouching',
    ({ guard, zone, crouching }) => {
      const defender = { ...duel().opponent, blocking: true, crouching, guardFrames: 50 }
      const result = prepareDefence(defender, zone, { guard, concealed: false, position: defender })
      const expected =
        guard === 'mid' || (guard === 'low' && crouching) || (guard === 'overhead' && !crouching)
      expect(result.blocked).toBe(expected)
      expect(result.parried).toBe(false)
    },
  )
  it('applies an explicitly low projectile even when its damage zone is the head', () => {
    const state = guarded()
    const low = shot(state, { guard: 'low', targetZone: 'head' })
    const standing = resolveFightImpacts(state, [low])
    const crouching = resolveFightImpacts(
      { ...state, opponent: { ...state.opponent, crouching: true } },
      [low],
    )
    expect(standing.impact).toMatchObject({ blocked: false, zone: 'head' })
    expect(crouching.impact).toMatchObject({ blocked: true, zone: 'head' })
    expect(standing.impact!.damage).toBeGreaterThan(crouching.impact!.damage)
  })
  it('allows both guards against a mid projectile aimed at the feet', () => {
    const state = guarded()
    for (const crouching of [false, true]) {
      const next = resolveFightImpacts({ ...state, opponent: { ...state.opponent, crouching } }, [
        shot(state, { targetZone: 'feet' }),
      ])
      expect(next.impact).toMatchObject({ blocked: true, zone: 'feet' })
    }
  })
  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    '%s declares finite timings and defensive properties for every move',
    (id) => {
      const moveset = movesetFor(id)!
      const ids = new Set(moveset.moves.map((move) => move.id))
      for (const move of moveset.moves) {
        expect(['mid', 'low', 'overhead', 'throw']).toContain(move.guard)
        expect(move.guard === 'throw').toBe(move.category === 'throw')
        expect(typeof move.canHitDowned).toBe('boolean')
        expect(move.reversalInvulnerableFrames).toBe(0)
        expect(
          Number.isFinite(move.tuning.startup + move.tuning.active + move.tuning.recovery),
        ).toBe(true)
        expect(move.tuning.startup).toBeGreaterThanOrEqual(0)
        expect(move.tuning.recovery).toBeGreaterThanOrEqual(0)
        expect(move.cancelOnBlockInto.every((target) => ids.has(target))).toBe(true)
      }
    },
  )
})

describe('throws, techs and wakeup have explicit windows', () => {
  it.each([0, 1, THROW_TECH_FRAMES])(
    'only techs a contact with a live %i-frame tech window',
    (window) => {
      const base = duel()
      const state = resolve(
        performThrow(
          { ...base, opponent: { ...base.opponent, throwTechFrames: window } },
          'player',
        ),
      )
      expect(Boolean(state.throwTech)).toBe(window > 0)
      expect(state.opponent.health === base.opponent.health).toBe(window > 0)
      if (window > 0) {
        expect(state.player.throwTechRecoveryFrames).toBe(THROW_TECH_RECOVERY_FRAMES)
        expect(state.opponent.throwTechRecoveryFrames).toBe(THROW_TECH_RECOVERY_FRAMES)
        expect(state.score).toEqual({ player: 0, opponent: 0 })
      }
    },
  )
  it('techs real simultaneous commands, with finite recovery and no damage', () => {
    const base = duel()
    let state = performMove({
      state: performThrow(base, 'player'),
      side: 'opponent',
      action: 'throw',
    })
    state = step(state, 9)
    expect(isThrowTech(state)).toBe(true)
    expect(state.player.attack).toBeNull()
    expect(state.opponent.attack).toBeNull()
    expect(state.player.health).toBe(base.player.health)
    expect(state.opponent.health).toBe(base.opponent.health)
    expect(canAct(state.player)).toBe(false)
    state = step(state, THROW_TECH_RECOVERY_FRAMES)
    expect(canAct(state.player)).toBe(true)
    expect(canAct(state.opponent)).toBe(true)
    expect(isThrowTech(state)).toBe(false)
  })
  it('does not call two distant whiffed throws a tech', () => {
    const base = duel()
    const state = performThrow(
      performThrow({ ...base, opponent: { ...base.opponent, x: 90 } }, 'player'),
      'opponent',
    )
    expect(isThrowTech(state)).toBe(false)
    expect(step(state, 10).throwTech).toBeUndefined()
  })
  it.each([
    { y: 3 },
    { hitStun: 1 },
    { blockStun: 1 },
    { knockdownFrames: 1 },
    { wakeupInvulnerableFrames: 1 },
  ])('cannot throw a protected target %j', (protection) => {
    const base = duel()
    const state = resolve(
      performThrow({ ...base, opponent: { ...base.opponent, ...protection } }, 'player'),
    )
    expect(state.impact).toBeNull()
    expect(state.opponent.health).toBe(base.opponent.health)
  })
  it('throws through ordinary guard and can punish a whiffed throw recovery', () => {
    expect(resolve(performThrow(guarded(), 'player')).impact).toMatchObject({
      blocked: false,
      knockdown: true,
    })
    let state = performThrow(duel(), 'opponent')
    const data = attackData('heavy', state.opponent)
    state = {
      ...state,
      opponent: {
        ...state.opponent,
        throwTechFrames: 0,
        attack: { ...state.opponent.attack!, frame: data.startup + data.active },
      },
    }
    state = resolve(performThrow(state, 'player'))
    expect(state.impact).toMatchObject({ blocked: false, punish: true })
  })
  it('only accepts the final six frames as a reversal buffer', () => {
    let state = duel()
    state = { ...state, opponent: { ...state.opponent, knockdownFrames: 20 } }
    const refused = performMove({ state, side: 'opponent', action: 'heavy' })
    expect(refused).toBe(state)
    state = step(state, 14)
    state = performMove({ state, side: 'opponent', action: 'heavy' })
    expect(state.opponent.bufferedAttack?.bufferFrames).toBe(INPUT_BUFFER_FRAMES)
    state = step(state, 6)
    expect(state.opponent.attack).toMatchObject({ reversal: true, kind: 'heavy', frame: 0 })
    expect(state.opponent.wakeupInvulnerableFrames).toBe(0)
  })
  it('does not turn a wakeup normal into an invulnerable technique', () => {
    let state = duel()
    state = step({ ...state, opponent: { ...state.opponent, knockdownFrames: 1 } })
    expect(state.opponent.wakeupInvulnerableFrames).toBe(WAKEUP_INVULNERABLE_FRAMES)
    expect(state.opponent.reversalWindow).toBe(REVERSAL_WINDOW_FRAMES)
    state = performMove({ state, side: 'opponent', action: 'heavy' })
    state = resolve(performMove({ state, side: 'player', action: 'light' }))
    expect(state.impact).toMatchObject({ avoided: false, counterHit: true })
    expect(state.opponent.health).toBeLessThan(state.opponent.maxHealth)
  })
  it('expires a waiting buffer instead of retaining a command indefinitely', () => {
    let fighter = { ...duel().player, hitStun: 3 }
    const queued = performMove({
      state: { ...duel(), player: fighter },
      side: 'player',
      action: 'light',
    })
    fighter = queued.player
    for (let i = 0; i < INPUT_BUFFER_FRAMES + 1; i++) fighter = advanceAttackBuffer(fighter)
    expect(fighter.bufferedAttack).toBeNull()
  })
})

describe('confirmed cancels, pressure and reproducible punishment', () => {
  it('allows the declared Kurapika light-to-heavy block cancel, without making it universal', () => {
    const blocked = resolve(performMove({ state: guarded(), side: 'player', action: 'light' }))
    expect(blocked.player.attack).toMatchObject({ confirmedHit: false, confirmedBlock: true })
    expect(canCancel(blocked.player, 'heavy', 'kurapika:standingHeavy')).toBe(true)
    expect(
      performMove({ state: blocked, side: 'player', action: 'heavy' }).player.attack?.moveId,
    ).toBe('kurapika:standingHeavy')
    const other = resolve(
      performMove({ state: guarded(duel('hisoka', 'kurapika')), side: 'player', action: 'light' }),
    )
    expect(canCancel(other.player, 'heavy', 'hisoka:standingHeavy')).toBe(false)
    expect(canCancel(blocked.player, 'special', 'kurapika:neutralSpecial')).toBe(false)
  })
  it('does not cancel a whiff, a parried contact or an expired cancel window', () => {
    const whiff = performMove({ state: duel(), side: 'player', action: 'light' })
    expect(canCancel(whiff.player, 'heavy', 'kurapika:standingHeavy')).toBe(false)
    const base = guarded()
    const parried = resolve(
      performMove({
        state: { ...base, opponent: { ...base.opponent, guardFrames: 1 } },
        side: 'player',
        action: 'light',
      }),
    )
    expect(parried.impact!.parried).toBe(true)
    expect(canCancel(parried.player, 'heavy', 'kurapika:standingHeavy')).toBe(false)
    const blocked = resolve(performMove({ state: guarded(), side: 'player', action: 'light' }))
    const data = attackData('light', blocked.player)
    const expired = {
      ...blocked.player,
      attack: { ...blocked.player.attack!, frame: data.cancelEnd + 1 },
    }
    expect(canStartFighterAttack(expired, 'heavy', 'kurapika:standingHeavy')).toBe(false)
  })
  it.each(['player', 'opponent'] as const)(
    'transfers wall-clipped guard pushback to the %s attacker',
    (side) => {
      const base = duel()
      const defender = side === 'player' ? 'opponent' : 'player'
      const state = {
        ...base,
        [side]: { ...base[side], x: side === 'player' ? 87 : 13 },
        [defender]: {
          ...base[defender],
          x: side === 'player' ? 93 : 7,
          blocking: true,
          guardFrames: 50,
        },
      }
      const armed = active(performMove({ state, side, action: 'light' }), side)
      const result = resolveFightImpacts(armed, [])
      expect(result.impact!.blocked).toBe(true)
      expect(Math.abs(result[side].x - result[defender].x)).toBeGreaterThan(
        Math.abs(armed[side].x - armed[defender].x),
      )
      expect(result[side].x).toBeGreaterThanOrEqual(7)
      expect(result[side].x).toBeLessThanOrEqual(93)
    },
  )
  it('does not add recoil when the defender can receive full pushback', () => {
    const armed = active(performMove({ state: guarded(), side: 'player', action: 'light' }))
    expect(resolveFightImpacts(armed, []).player.x).toBe(armed.player.x)
  })
  it('allows a real light punish of a blocked heavy at the first recovery opportunity', () => {
    const run = () => {
      let state = resolve(performMove({ state: guarded(), side: 'player', action: 'heavy' }))
      while (state.hitstop > 0 || state.opponent.blockStun > 0) state = step(state)
      expect(attackPhase(state.player)).toBe('recovery')
      state = performMove({ state, side: 'opponent', action: 'light' })
      for (let i = 0; i < 20 && state.impact?.attacker !== 'opponent'; i++) state = step(state)
      expect(state.impact).toMatchObject({ attacker: 'opponent', punish: true, blocked: false })
      return state
    }
    expect(run()).toEqual(run())
  })
  it.each(FIGHTING_ROSTER.map(({ id }) => id))(
    '%s hit and block cancel routes cannot create a cycle',
    (id) => {
      const moves = movesetFor(id)!.moves
      for (const property of ['cancelInto', 'cancelOnBlockInto'] as const) {
        function visit(moveId: string, path: Set<string>): void {
          expect(path.has(moveId), [...path, moveId].join(' -> ')).toBe(false)
          const move = moveById(moveId)!
          for (const target of move[property]) visit(target, new Set([...path, moveId]))
        }
        for (const move of moves) visit(move.id, new Set())
      }
    },
  )
})

describe('downed bodies and juggle ceilings', () => {
  it('rejects ordinary strikes and projectiles against a downed body', () => {
    const base = duel()
    const state = { ...base, opponent: { ...base.opponent, knockdownFrames: 30 } }
    const struck = resolve(
      performMove({
        state,
        side: 'player',
        action: 'heavy',
        input: { ...EMPTY_INPUT, down: true },
      }),
    )
    expect(struck.impact).toBeNull()
    expect(resolveFightImpacts(state, [shot(state)]).impact).toBeNull()
  })
  it('honors an explicitly permitted grounded projectile without granting it to ordinary shots', () => {
    const base = duel()
    const state = { ...base, opponent: { ...base.opponent, knockdownFrames: 30 } }
    expect(resolveFightImpacts(state, [shot(state, { canHitDowned: true })]).impact).toMatchObject({
      attacker: 'player',
    })
  })
  it('applies the juggle ceiling to every hit in a simultaneous projectile volley', () => {
    const base = duel()
    const state = { ...base, opponent: { ...base.opponent, y: 4, juggleCount: 2, comboHits: 2 } }
    const result = resolveFightImpacts(state, [shot(state), shot(state, { id: 2 })])
    expect(result.opponent.juggleCount).toBe(3)
    expect(result.impact!.sequence).toBe(1)
    expect(result.impact!.projectileId).toBe(1)
  })
  it('keeps the separate sleeping Hanzo body vulnerable on the floor', () => {
    const base = duel('kurapika', 'hanzo')
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        y: 8,
        hanzoProjection: {
          bodyX: base.opponent.x,
          bodyFacing: -1 as const,
          bodyNen: base.opponent.nen,
          startupFrames: 0,
        },
      },
    }
    const result = resolve(
      performMove({
        state,
        side: 'player',
        action: 'light',
        input: { ...EMPTY_INPUT, down: true },
      }),
    )
    expect(result.impact).toMatchObject({ avoided: false })
    expect(result.opponent.health).toBeLessThan(state.opponent.health)
  })
})
