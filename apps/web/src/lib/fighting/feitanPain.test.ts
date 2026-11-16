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
import { createPainPacker, recordFightInjuries } from './feitanPain'
import { createRisingSun, inSolarHeat, SUN_PULSE_FRAMES } from './feitanSun'
import { activeHitbox, FIXED_STEP } from './frameData'
import { hatsuDamageFactor, hatsuDefenceFactor, hatsuSourceFor } from './hatsu'
import { feitanHatsu } from './hatsu/feitan'
import { finisherReady } from './movesets'
import { applyAuraContext, forceZetsu } from './nen'
import { EMPTY_INPUT, type FightInput, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('feitan', 'hisoka', { formatId: 'knockout', mode: 'versus-local' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 50, aura: 100 },
    opponent: { ...state.opponent, x: 58, aura: 100 },
  }
}

function advance(state: FightState, frames: number, input: FightInput = EMPTY_INPUT): FightState {
  let next = state
  for (let frame = 0; frame < frames; frame++) {
    next = tickFight(next, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  }
  return next
}

function wounded(damage = 40, state = duel()): FightState {
  return recordFightInjuries(state, { ...state, player: { ...state.player, health: state.player.health - damage } })
}

function armoured(damage = 40): FightState {
  return advance(performMove({ state: wounded(damage), side: 'player', action: 'special' }), 40)
}

function ignited(damage = 40): FightState {
  return advance(performMove({ state: armoured(damage), side: 'player', action: 'finisher' }), 65)
}

describe('Feitan — Pain Packer and Rising Sun', () => {
  it('refuses armour and sun without actual injuries, without spending aura', () => {
    const state = duel()
    expect(performAttack(state, 'player', 'special')).toBe(state)
    expect(performMove({ state, side: 'player', action: 'finisher' })).toBe(state)
    expect(performAuraAttack({ state, side: 'player', kind: 'special', auraCharged: false })).toBe(
      state,
    )
    const fake = { ...state, player: { ...state.player, health: 20 } }
    expect(performAttack(fake, 'player', 'special')).toBe(fake)
  })

  it('records health actually lost to an opponent, once per damage event', () => {
    const state = duel()
    const struck = advance(performAttack(state, 'opponent', 'light'), 12)
    const lost = state.player.health - struck.player.health
    expect(lost).toBeGreaterThan(0)
    expect(struck.player.hatsuEffects.painPacker?.injuries).toBe(lost)
    expect(advance(struck, 30).player.hatsuEffects.painPacker?.injuries).toBe(lost)
  })

  it('conjures armour at the end of startup, without healing, striking or scoring', () => {
    const state = wounded()
    const preparing = performAttack(state, 'player', 'special')
    expect(preparing.player.aura).toBe(94)
    expect(advance(preparing, 17).player.hatsuEffects.painPacker?.armour).toBe(false)
    const wrapped = advance(preparing, 18)
    expect(wrapped.player.hatsuEffects.painPacker).toMatchObject({
      injuries: 0,
      packedDamage: 40,
      armour: true,
      sun: null,
    })
    expect(wrapped.player.health).toBe(state.player.health)
    expect(wrapped.opponent.health).toBe(state.opponent.health)
    expect(wrapped.score).toEqual({ player: 0, opponent: 0 })
    expect(activeHitbox(wrapped.player)).toBeNull()
  })

  it('requires the charged outfit rather than an arbitrary 35-HP threshold', () => {
    const naked = wounded(80)
    expect(finisherReady(naked, 'player')).toBe(false)
    const wrapped = armoured(10)
    expect(wrapped.player.health).toBe(wrapped.player.maxHealth - 10)
    expect(finisherReady(wrapped, 'player')).toBe(true)
    const sun = ignited(10).player.hatsuEffects.painPacker
    expect(sun?.sun).not.toBeNull()
    expect(sun?.packedDamage).toBe(0)
    expect(sun?.armour).toBe(true)
  })

  it('does not turn martial directional attacks into fire or multiply their damage', () => {
    const state = wounded(80)
    const thrust = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, right: true },
    })
    expect(thrust.player.attack?.hatsuSource).toBeNull()
    expect(hatsuSourceFor(state.player, 'feitan:downSpecial')).toBeNull()
    expect(hatsuDamageFactor(thrust.player)).toBe(1)
    expect(hatsuDamageFactor({ ...thrust.player, health: 100 })).toBe(1)
  })

  it('scales the heat, reach and duration with committed injuries', () => {
    const mild = ignited(10).player.hatsuEffects.painPacker!.sun!
    const severe = ignited(70).player.hatsuEffects.painPacker!.sun!
    expect(severe.damage).toBeGreaterThan(mild.damage)
    expect(severe.radius).toBeGreaterThan(mild.radius)
    expect(severe.duration).toBeGreaterThan(mild.duration)
  })

  it('burns behind the caster after the animation ends, without a melee hitbox', () => {
    const state = ignited()
    expect(state.player.attack).toBeNull()
    const behind = { ...state, opponent: { ...state.opponent, x: 42, health: 100 } }
    const burned = advance(behind, 30)
    expect(burned.opponent.health).toBeLessThan(100)
    expect(burned.player.health).toBe(state.player.health)
    expect(burned.opponent.hitStun).toBe(0)
    expect(burned.knockdowns).toEqual({ player: 0, opponent: 0 })
  })

  it('leaves the sun at its original position when Feitan moves', () => {
    const state = ignited()
    const sun = state.player.hatsuEffects.painPacker!.sun!
    const walking = advance(state, 20, { ...EMPTY_INPUT, left: true })
    expect(walking.player.x).toBeLessThan(state.player.x)
    expect(walking.player.hatsuEffects.painPacker?.sun).toMatchObject({ x: sun.x, y: sun.y })
  })

  it('allows escape and re-entry without awarding a point for every pulse', () => {
    const state = ignited()
    const escaped = advance({ ...state, opponent: { ...state.opponent, x: 93, health: 100 } }, 45)
    expect(escaped.opponent.health).toBe(100)
    const returned = advance({ ...escaped, opponent: { ...escaped.opponent, x: 58 } }, 30)
    expect(returned.opponent.health).toBeLessThan(100)
    expect(returned.score.player).toBe(1)
  })

  it('cannot block or parry ambient heat, even with Ken', () => {
    const state = ignited()
    const opponent = applyAuraContext(state.opponent, { ...EMPTY_INPUT, aura: true, guard: true })
    const guarded = {
      ...state,
      opponent: { ...opponent, health: 100, blocking: true, guardFrames: 1 },
    }
    const sun = state.player.hatsuEffects.painPacker!.sun!
    const pulsing = {
      ...guarded,
      player: {
        ...state.player,
        hatsuEffects: {
          ...state.player.hatsuEffects,
          painPacker: {
            ...state.player.hatsuEffects.painPacker!,
            sun: { ...sun, age: SUN_PULSE_FRAMES - 1 },
          },
        },
      },
    }
    const burned = feitanHatsu.onFrame(pulsing)
    expect(burned.opponent.health).toBeLessThan(100)
    expect(burned.opponent.blockStun).toBe(0)
  })

  it('protects against heat but leaves physical defence unchanged', () => {
    const state = armoured()
    expect(hatsuDefenceFactor(state.player)).toBe(1)
    const struck = advance(performAttack(state, 'opponent', 'light'), 12)
    expect(struck.player.health).toBeLessThan(state.player.health)
    expect(struck.player.hatsuEffects.painPacker?.armour).toBe(true)
  })

  it('makes thermal protection, rather than the caster identity, prevent self-burning', () => {
    const state = ignited()
    const pain = state.player.hatsuEffects.painPacker!
    const exposed = feitanHatsu.onFrame({
      ...state,
      player: {
        ...state.player,
        hatsuEffects: {
          ...state.player.hatsuEffects,
          painPacker: {
            ...pain,
            armour: false,
            sun: { ...pain.sun!, age: SUN_PULSE_FRAMES - 1 },
          },
        },
      },
    })
    expect(exposed.player.health).toBeLessThan(state.player.health)
    expect(exposed.score.opponent).toBe(0)
  })

  it('supports the same outfit, sun and knockout when Feitan is P2', () => {
    const base = duel()
    const state: FightState = {
      ...base,
      player: { ...base.opponent, x: 42, facing: 1 },
      opponent: { ...base.player, x: 50, facing: -1 },
    }
    const hurt = recordFightInjuries(state, {
      ...state,
      opponent: { ...state.opponent, health: 40 },
    })
    const wrapped = advance(performAttack(hurt, 'opponent', 'special'), 40)
    const raised = advance(
      performMove({ state: wrapped, side: 'opponent', action: 'finisher' }),
      65,
    )
    expect(raised.opponent.hatsuEffects.painPacker?.sun).not.toBeNull()
    expect(raised.opponent.health).toBe(40)
    const finished = advance({ ...raised, player: { ...raised.player, health: 1 } }, 30)
    expect(finished.winner).toBe('opponent')
    expect(finished.roundsWon.opponent).toBe(1)
  })

  it('does not allow the same injuries to fuel a second sun', () => {
    const state = ignited(10)
    const expired = advance({ ...state, opponent: { ...state.opponent, x: 93 } }, 180)
    expect(expired.player.hatsuEffects.painPacker).toMatchObject({
      injuries: 0,
      packedDamage: 0,
      armour: false,
      sun: null,
    })
    expect(performAttack(expired, 'player', 'special')).toBe(expired)
    expect(finisherReady(expired, 'player')).toBe(false)
  })

  it('can be interrupted before the outfit or sun appears', () => {
    const preparing = performAttack(wounded(), 'player', 'special')
    const interrupted = advance(performAttack(preparing, 'opponent', 'light'), 20)
    expect(interrupted.player.hatsuEffects.painPacker?.armour).toBe(false)
    const raising = performMove({ state: armoured(), side: 'player', action: 'finisher' })
    const stopped = advance(performAttack(raising, 'opponent', 'light'), 20)
    expect(stopped.player.hatsuEffects.painPacker).toMatchObject({
      armour: true,
      packedDamage: 40,
      sun: null,
    })
  })

  it('drops the outfit and solar aura in Zetsu without returning the spent pain', () => {
    const state = ignited()
    const closed = feitanHatsu.onFrame({ ...state, player: forceZetsu(state.player) })
    expect(closed.player.hatsuEffects.painPacker).toMatchObject({
      armour: false,
      packedDamage: 0,
      sun: null,
    })
    expect(closed.player.health).toBe(state.player.health)
  })

  it.each(['forcedZetsuFrames', 'hatsuStolen'] as const)(
    'removes the outfit and sun when %s is imposed',
    (effect) => {
      const state = ignited()
      const closed = feitanHatsu.onFrame({
        ...state,
        player: {
          ...state.player,
          hatsuEffects: { ...state.player.hatsuEffects, [effect]: 60 },
        },
      })
      expect(closed.player.hatsuEffects.painPacker?.sun).toBeNull()
      expect(closed.player.hatsuEffects.painPacker?.armour).toBe(false)
    },
  )

  it('freezes the sun together with the simulation during hitstop', () => {
    const state = ignited()
    const frozen = advance({ ...state, hitstop: 5 }, 5)
    expect(frozen.player.hatsuEffects.painPacker?.sun).toEqual(
      state.player.hatsuEffects.painPacker?.sun,
    )
    expect(frozen.opponent.health).toBe(state.opponent.health)
  })

  it('judges heat KOs and updates the round score exactly once', () => {
    const state = ignited()
    const burned = advance({ ...state, opponent: { ...state.opponent, health: 1 } }, 30)
    expect(burned.phase).toBe('finished')
    expect(burned.winner).toBe('player')
    expect(burned.roundsWon.player).toBe(1)
    expect(burned.finishReason).toBe('knockout')
    expect(advance(burned, 30).roundsWon.player).toBe(1)
    const reset = nextRound(burned)
    expect(reset.player.hatsuEffects.painPacker).toEqual(createPainPacker())
  })

  it('preserves training and the point-only format during continued heat', () => {
    const state = ignited()
    const training = advance(
      { ...state, mode: 'training', opponent: { ...state.opponent, health: 1 } },
      30,
    )
    expect(training.phase).toBe('fighting')
    expect(training.opponent.health).toBeGreaterThan(0)
    const points = advance(
      { ...state, formatId: 'heavens-arena', opponent: { ...state.opponent, health: 1 } },
      45,
    )
    expect(points.phase).toBe('fighting')
    expect(points.opponent.health).toBe(1)
    expect(points.score.player).toBe(1)
  })

  it('lets a first heat contact complete a ten-point victory', () => {
    const state = ignited()
    const sun = state.player.hatsuEffects.painPacker!.sun!
    const setup: FightState = {
      ...state,
      formatId: 'heavens-arena',
      score: { player: 9, opponent: 0 },
      player: {
        ...state.player,
        hatsuEffects: {
          ...state.player.hatsuEffects,
          painPacker: { ...state.player.hatsuEffects.painPacker!, sun: { ...sun, scored: [] } },
        },
      },
    }
    const finished = advance(setup, 30)
    expect(finished.winner).toBe('player')
    expect(finished.finishReason).toBe('hits')
  })

  it('uses the real body for heat exposure and allows jumping outside the circle', () => {
    const state = duel()
    const sun = createRisingSun(state.player, 10)
    const projected = {
      ...state.opponent,
      x: 93,
      hanzoProjection: {
        bodyX: 58,
        bodyFacing: -1 as const,
        bodyNen: state.opponent.nen,
        startupFrames: 0,
      },
    }
    expect(inSolarHeat(projected, sun)).toBe(true)
    expect(inSolarHeat({ ...state.opponent, x: 93 }, sun)).toBe(false)
    expect(inSolarHeat({ ...state.opponent, y: 50 }, sun)).toBe(false)
  })

  it('requires Chrollo to prepare his own pain and outfit before replaying the sun', () => {
    const base = duel()
    const state = {
      ...base,
      player: {
        ...base.player,
        id: 'chrollo' as const,
        chrolloBook: { pages: ['feitan' as const], page: 0, open: true, bookmark: null },
        hatsuEffects: {
          ...base.player.hatsuEffects,
          stolenHatsu: 'feitan' as const,
        },
      },
    }
    expect(performAttack(state, 'player', 'special')).toBe(state)
    const packed = advance(performAttack(wounded(40, state), 'player', 'special'), 60)
    expect(packed.player.hatsuEffects.painPacker?.armour).toBe(true)
    const sun = advance(performAttack(packed, 'player', 'special'), 60)
    expect(sun.player.hatsuEffects.painPacker?.sun).not.toBeNull()
    expect(sun.player.health).toBe(sun.player.maxHealth - 40)
    expect(sun.opponent.health).toBeLessThan(sun.opponent.maxHealth)
    const closed = feitanHatsu.onFrame({
      ...sun,
      player: {
        ...sun.player,
        chrolloBook: { ...sun.player.chrolloBook!, open: false, bookmark: null },
      },
    })
    expect(closed.player.hatsuEffects.painPacker).toMatchObject({ armour: false, sun: null })
  })
})
