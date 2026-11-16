import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  opponentAttack,
  performAttack,
  performAuraAttack,
  performMove,
  tickFight,
} from './engine'
import { activeHitbox, attackData } from './frameData'
import { FIXED_STEP } from './fightClock'
import {
  canUseFightHatsu,
  hatsuDamageFactor,
  hatsuDefenceFactor,
  hatsuSourceFor,
  triggerHatsu,
} from './hatsu'
import { billHatsu } from './hatsu/bill'
import { canUseMovesetMove, finisherReady, moveForSlot, movesetFor } from './movesets'
import { applyAuraContext } from './nen'
import { fightSpecialPresentation } from './fightSpecialPresentation'
import { createKurapika } from './kurapika'
import { dolphinCanUse, stealableChainMove } from './kurapikaDolphin'
import { chooseMovesetAttack } from './movesetAi'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightInput,
  type FightSide,
  type FightState,
  type MoveAction,
} from './types'

function fight(player: FighterId = 'bill', opponent: FighterId = 'hisoka'): FightState {
  const state = beginFight(
    createFight(player, opponent, { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 46, aura: 100 },
    opponent: { ...state.opponent, x: 52, aura: 100 },
  }
}

function frames(state: FightState, count = 50, input: FightInput = EMPTY_INPUT): FightState {
  let next = state
  for (let frame = 0; frame < count; frame++)
    next = tickFight(next, input, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT })
  return next
}

describe('Bill’s physical combat and support-only Erigeron', () => {
  it('keeps his ten ordinary physical moves and a single non-offensive support ability', () => {
    const moveset = movesetFor('bill')!
    expect(moveset.moves).toHaveLength(11)
    expect(
      moveset.moves.filter((move) => move.category === 'special').map((move) => move.id),
    ).toEqual(['bill:neutralSpecial'])
    const support = moveForSlot('bill', 'neutralSpecial')!
    expect(support.canon).toMatchObject({
      evidence: 'manga-shown',
      source: expect.stringContaining('388'),
    })
    expect(support).toMatchObject({
      auraCost: 0,
      tuning: { damage: 0, reach: 0, lunge: 0, hitstun: 0 },
    })
    expect(
      moveset.combos
        .flat()
        .every((id) => moveset.moves.some((move) => move.id === id && move.category !== 'special')),
    ).toBe(true)
    for (const slot of ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'] as const)
      expect(moveForSlot('bill', slot)).toBeNull()
    expect(JSON.stringify(moveset)).not.toMatch(
      /Seconde floraison|Second Bloom|Floraison protectrice|Protective Bloom|Racines de garde|Guard Roots/,
    )
  })

  it.each(
    (
      [
        ['light', {}, 'standingLight', 0],
        ['heavy', {}, 'standingHeavy', 0],
        ['light', { down: true }, 'lowLight', 0],
        ['heavy', { down: true }, 'lowHeavy', 0],
        ['light', {}, 'airLight', 5],
        ['heavy', {}, 'airHeavy', 5],
        ['light', { right: true }, 'forwardLight', 0],
        ['heavy', { right: true }, 'forwardHeavy', 0],
        ['heavy', { left: true }, 'backHeavy', 0],
        ['throw', {}, 'throw', 0],
      ] as const
    ).map(([action, partial, slot, y]) => ({ action, partial, slot, y })),
  )('retains physical damage for $slot', ({ action, partial, slot, y }) => {
    const base = fight()
    const state = { ...base, player: { ...base.player, y } }
    const armed = performMove({
      state,
      side: 'player',
      action: action as MoveAction,
      input: { ...EMPTY_INPUT, ...partial },
    })
    expect(armed.player.attack?.moveId).toBe(`bill:${slot}`)
    expect(frames(armed, 30).opponent.health).toBeLessThan(base.opponent.health)
  })

  it.each(['player', 'opponent'] as const)(
    'does not activate Erigeron or spend aura for %s in a duel without a support target',
    (side: FightSide) => {
      const state = side === 'player' ? fight() : fight('hisoka', 'bill')
      const wounded = { ...state, [side]: { ...state[side], health: 30 } }
      expect(canUseFightHatsu(wounded[side])).toBe(false)
      expect(performAttack(wounded, side, 'special')).toBe(wounded)
      for (const partial of [{}, { down: true }, { left: true }, { right: true }]) {
        expect(
          performMove({
            state: wounded,
            side,
            action: 'special',
            input: { ...EMPTY_INPUT, ...partial },
          }),
        ).toBe(wounded)
      }
      expect(performMove({ state: wounded, side, action: 'finisher' })).toBe(wounded)
      expect(triggerHatsu(wounded, side, 'bill')).toBe(wounded)
      expect(finisherReady(wounded, side)).toBe(false)
    },
  )

  it('does not buffer unsupported or removed techniques during an ordinary strike', () => {
    const armed = performAttack(fight(), 'player', 'light')
    const length = attackData('light', armed.player)
    const state = {
      ...armed,
      player: {
        ...armed.player,
        attack: {
          ...armed.player.attack!,
          frame: length.startup + length.active + length.recovery - 2,
        },
      },
    }
    for (const moveId of [
      undefined,
      'bill:neutralSpecial',
      'bill:forwardSpecial',
      'bill:downSpecial',
      'bill:backSpecial',
      'bill:finisher',
    ]) {
      expect(
        performAuraAttack({ state, side: 'player', kind: 'special', moveId, auraCharged: false }),
      ).toBe(state)
    }
    expect(state.player.bufferedAttack).toBeNull()
  })

  it('never heals, boosts damage, or adds automatic defence through its Hatsu hooks', () => {
    const base = fight()
    const state = { ...base, player: { ...base.player, health: 20 } }
    expect(billHatsu.onTrigger({ state, side: 'player', source: 'bill' })).toBe(state)
    expect(
      billHatsu.onImpact({
        state,
        side: 'player',
        defenderSide: 'opponent',
        source: 'bill',
        blocked: false,
        concealed: false,
      }),
    ).toBe(state)
    expect(billHatsu.onFrame(state)).toBe(state)
    expect(frames(state, 180).player.health).toBe(20)
    // A stale effect from the old implementation cannot reintroduce its combat bonuses.
    const stale = {
      ...state.player,
      hatsuEffects: { ...state.player.hatsuEffects, growthFrames: 300 },
    }
    expect(hatsuDamageFactor(stale)).toBe(1)
    expect(hatsuDefenceFactor(stale)).toBe(1)
  })

  it('keeps Ken available and makes protection depend on actual guarding', () => {
    const base = fight()
    const input = { ...EMPTY_INPUT, aura: true, guard: true }
    expect(applyAuraContext(base.player, input).nen.ken).toBe(true)
    const unguarded = frames(performAttack(base, 'opponent', 'light'), 20)
    const held = { ...base, player: { ...base.player, blocking: true, guardFrames: 12 } }
    const guarded = frames(performAttack(held, 'opponent', 'light'), 20, input)
    expect(guarded.impact).toMatchObject({ blocked: true, parried: false })
    expect(guarded.player.health).toBeGreaterThan(unguarded.player.health)
    expect(hatsuDefenceFactor(guarded.player)).toBe(1)
  })

  it('cannot turn a directly constructed Erigeron attack into a hitbox', () => {
    const base = fight()
    const fighter = {
      ...base.player,
      attack: {
        kind: 'special' as const,
        moveId: 'bill:neutralSpecial',
        frame: 13,
        impacted: false,
        auraCharged: false,
        concealed: false,
        hatsuSource: 'bill' as const,
        projectileSpawned: false,
        reversal: false,
      },
    }
    expect(activeHitbox(fighter)).toBeNull()
  })

  it('keeps Erigeron as a real, stealable support ability without inventing an offensive copy', () => {
    expect(hatsuSourceFor(fight().player)).toBe('bill')
    expect(stealableChainMove(fight().player)).toBe('bill:neutralSpecial')
    const base = fight('chrollo', 'bill')
    const state = {
      ...base,
      player: {
        ...base.player,
        chrolloBook: { pages: ['bill'] as const, page: 0, open: true, bookmark: 'bill' as const },
        hatsuEffects: { ...base.player.hatsuEffects, stolenHatsu: 'bill' as const },
      },
    }
    for (const action of ['special', 'finisher'] as const) {
      expect(performMove({ state, side: 'player', action })).toBe(state)
    }
    expect(canUseMovesetMove(state, 'player', moveForSlot('chrollo', 'forwardSpecial')!)).toBe(true)
    const borrowed = fight('kurapika', 'bill')
    borrowed.player.kurapika = {
      ...createKurapika(),
      emperorTime: true,
      held: {
        victim: 'opponent',
        source: 'bill',
        moveId: 'bill:neutralSpecial',
        loaded: false,
        used: false,
        sustainedKeys: [],
      },
    }
    const loaded = performMove({
      state: borrowed,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(loaded.player.kurapika!.held!.loaded).toBe(true)
    expect(dolphinCanUse(loaded, 'player')).toBe(false)
  })

  it('makes the AI use ordinary attacks instead of repeatedly activating unsupported growth', () => {
    const state = fight('hisoka', 'bill')
    for (const roll of [0, 0.3, 0.55, 0.75, 0.95]) {
      const move = chooseMovesetAttack(state, roll, 6)!
      expect(move).not.toBeNull()
      expect(move.category).not.toBe('special')
      expect(move.category).not.toBe('finisher')
    }
    expect(opponentAttack(state).opponent.attack?.kind).not.toBe('special')
  })

  it.each(['fr', 'en'] as const)('explains the unavailable support target in %s', (language) => {
    const presentation = fightSpecialPresentation(fight(), language)
    expect(presentation.ready).toBe(false)
    expect(presentation.label).toContain('Erigeron')
    expect(presentation.hint).toContain(language === 'fr' ? 'Graine vivante' : 'Living seed')
  })
})
