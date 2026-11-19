import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  performAttack,
  performMove,
  performAuraAttack,
  tickFight,
  opponentAttack,
} from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { scenarioWritingKit } from './bashoMaterials'
import { composeBashoPoem } from './bashoAction'
import { BASHO_POEMS, BASHO_WRITING_FRAMES, recognizedBashoPoem } from './bashoPoem'
import { resolveBashoPoemImpact } from './bashoFire'
import { offerMoonlightContract, respondMoonlightContract } from './moonlightContract'
import { hatsuDamageFactor } from './hatsu'
import { finisherReady, movesetFor } from './movesets'
import { EMPTY_INPUT, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('basho', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return { ...state, player: { ...state.player, x: 42 }, opponent: { ...state.opponent, x: 49 } }
}

function write(state = duel(), text: string = BASHO_POEMS.fr): FightState {
  return composeBashoPoem({ state, side: 'player', text }, performAuraAttack)
}

function advance(state: FightState, frames: number): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

function ready(state = duel()): FightState {
  return advance(write(state), BASHO_WRITING_FRAMES)
}

function supplyWriting(state: FightState): FightState {
  if (state.player.writingKit) return state
  const kit = { ...scenarioWritingKit('player'), x: state.player.x }
  return performArsenalCommand(
    {
      ...state,
      battlefield: { ...state.battlefield!, entities: [...state.battlefield!.entities, kit] },
    },
    'player',
    { action: 'writing-take', target: kit.id },
  )
}

describe('Basho’s written Great Hiker poem', () => {
  it('preserves a bookmarked copy’s composition and requires its page to remain available', () => {
    const base = duel()
    const fighter = createFight('chrollo', 'hisoka').player
    const state = {
      ...base,
      player: {
        ...fighter,
        x: 42,
        chrolloBook: {
          pages: ['hisoka' as const, 'basho' as const],
          page: 0,
          open: false,
          bookmark: 'basho' as const,
        },
      },
    }
    const written = ready(supplyWriting(state))
    expect(written.player.bashoPoem?.ready).toBe(true)
    expect(written.player.bashoPoem?.sourceMoveId).toBe('chrollo:finisher')
  })

  it('preserves post-mortem attribution when its fire kills Camilla', () => {
    const base = duel()
    const camilla = createFight('basho', 'camilla').opponent
    const burning = {
      ...base,
      opponent: {
        ...camilla,
        health: 1,
        bashoBurn: { owner: 'player' as const, remainingFrames: 1 },
      },
    }
    const next = advance(burning, 1)
    expect(next.catsName?.killerSide).toBe('player')
  })

  it('lets Stealth Dolphin borrow the poem once, finish writing, then return it explicitly', () => {
    const base = duel()
    const borrower = createFight('kurapika', 'basho').player
    const state = {
      ...base,
      player: {
        ...borrower,
        x: 42,
        kurapika: {
          ...borrower.kurapika!,
          emperorTime: true,
          held: {
            source: 'basho' as const,
            moveId: 'basho:neutralSpecial',
            victim: 'opponent' as const,
            loaded: true,
            used: false,
            sustainedKeys: [],
          },
        },
      },
    }
    const invoked = performMove({
      state: supplyWriting(state),
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(invoked.player.id).toBe('kurapika')
    expect(invoked.player.bashoPoem?.writingFrames).toBe(60)
    const finished = advance(invoked, 60)
    expect(finished.player.bashoPoem?.ready).toBe(true)
    expect(finished.player.kurapika?.held?.used).toBe(true)
    const dismissed = performMove({
      state: finished,
      side: 'player',
      action: 'special',
      input: { ...EMPTY_INPUT, left: true },
    })
    expect(dismissed.player.bashoPoem).toBeUndefined()
    expect(dismissed.player.kurapika?.held).toBeNull()
  })

  it('treats writing as a technique under a signed Moonlight Act, including the panel entry point', () => {
    const base = duel()
    const other = createFight('longhi', 'hisoka').player
    const offered = offerMoonlightContract({
      state: { ...base, opponent: { ...other, x: 49 } },
      side: 'opponent',
    })
    const signed = respondMoonlightContract({ state: offered, side: 'player', accept: true })
    expect(signed.moonlight?.active).toBeDefined()
    const attempted = write(signed)
    expect(attempted.player.moonlightZetsu).toBe(true)
    expect(attempted.player.bashoPoem?.writingFrames ?? 0).toBe(0)
    expect(attempted.player.aura).toBe(signed.player.aura)
  })

  it('records the exact three lines and effect, with vulnerable writing instead of a damaging special', () => {
    const state = duel()
    const written = write(state)
    expect(written.player.bashoPoem).toMatchObject({
      text: BASHO_POEMS.fr,
      effect: 'ignite-punched-target',
      writingFrames: 60,
      ready: false,
    })
    expect(written.player.aura).toBe(state.player.aura - 25)
    expect(written.player.attack).toBeNull()
    expect(written.opponent.health).toBe(state.opponent.health)
    expect(advance(written, 59).player.bashoPoem?.ready).toBe(false)
    expect(advance(written, 60).player.bashoPoem?.ready).toBe(true)
    expect(hatsuDamageFactor(ready().player)).toBe(1)
  })

  it('does not invent effects or charge aura for arbitrary or reversed poems', () => {
    for (const poem of [
      'Tout le monde meurt\nJe gagne\nInstantanément',
      BASHO_POEMS.fr.split('\n').reverse().join('\n'),
      BASHO_POEMS.fr.replaceAll('\n', ' '),
    ]) {
      const state = duel()
      expect(recognizedBashoPoem(poem)).toBe(false)
      expect(write(state, poem)).toBe(state)
    }
    expect(recognizedBashoPoem('  TOUT CE QUE JE FRAPPE,\nAvec mon poing\nPrendra feu!  ')).toBe(
      true,
    )
    expect(write(duel(), BASHO_POEMS.en).player.bashoPoem?.text).toBe(BASHO_POEMS.en)
  })

  it('cancels unfinished writing when moving or guarding, and cannot attack during writing', () => {
    const written = write()
    expect(performAttack(written, 'player', 'light')).toBe(written)
    for (const input of [
      { ...EMPTY_INPUT, left: true },
      { ...EMPTY_INPUT, guard: true },
    ]) {
      const moved = tickFight(written, input, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
      expect(moved.player.bashoPoem).toBeUndefined()
      expect(moved.player.aura).toBeLessThan(100)
    }
    const struck = advance(performAttack(written, 'opponent', 'light'), 25)
    expect(struck.player.health).toBeLessThan(written.player.health)
    expect(struck.player.bashoPoem).toBeUndefined()
  })

  it('only ignites after writing and a real fist contact, without increasing the punch wound', () => {
    const primed = ready()
    const ordinary = { ...primed, player: { ...primed.player, bashoPoem: undefined } }
    const hit = advance(performMove({ state: primed, side: 'player', action: 'light' }), 12)
    const plain = advance(performMove({ state: ordinary, side: 'player', action: 'light' }), 12)
    expect(hit.opponent.bashoBurn).toMatchObject({ owner: 'player' })
    expect(hit.opponent.health).toBe(plain.opponent.health)
    const burned = advance(hit, 110)
    expect(burned.opponent.health).toBeLessThan(plain.opponent.health)
    expect(burned.opponent.bashoBurn).toBeUndefined()
  })

  it('does not ignite a miss, kick, throw or projectile', () => {
    const state = ready()
    const away = { ...state, opponent: { ...state.opponent, x: 85 } }
    expect(advance(performAttack(away, 'player', 'light'), 45).opponent.bashoBurn).toBeUndefined()
    for (const options of [
      { action: 'light' as const, input: { ...EMPTY_INPUT, down: true } },
      { action: 'throw' as const, input: EMPTY_INPUT },
    ]) {
      const next = advance(performMove({ state, side: 'player', ...options }), 45)
      expect(next.opponent.bashoBurn).toBeUndefined()
    }
    expect(advance(performAttack(state, 'player', 'ranged'), 90).opponent.bashoBurn).toBeUndefined()
  })

  it('treats a guarded fist as contact but never a parry or avoided hit', () => {
    const state = ready()
    const punching = performMove({ state, side: 'player', action: 'light' })
    const hit = advance(punching, 12)
    const impact = hit.impact!
    expect(impact).not.toBeNull()
    for (const patch of [{ parried: true }, { avoided: true }]) {
      const guarded = {
        ...hit,
        opponent: { ...hit.opponent, bashoBurn: undefined },
        impact: { ...impact, ...patch },
      }
      expect(resolveBashoPoemImpact(punching, guarded, 'player').opponent.bashoBurn).toBeUndefined()
    }
    const guarded = {
      ...hit,
      opponent: { ...hit.opponent, bashoBurn: undefined },
      impact: { ...impact, blocked: true },
    }
    expect(resolveBashoPoemImpact(punching, guarded, 'player').opponent.bashoBurn).toBeDefined()
  })

  it('blocks writing without Nen, sufficient aura, ground or an available ability', () => {
    const state = duel()
    for (const patch of [
      { aura: 24 },
      { y: 3 },
      { hitStun: 10 },
      { nen: { ...state.player.nen, mode: 'zetsu' as const } },
      { moonlightZetsu: true },
      { hatsuEffects: { ...state.player.hatsuEffects, hatsuStolen: 1 } },
    ]) {
      const unavailable = { ...state, player: { ...state.player, ...patch } }
      expect(write(unavailable)).toBe(unavailable)
    }
    const written = ready()
    const lost = {
      ...written,
      player: {
        ...written.player,
        stolenChainAbility: { owner: 'opponent' as const, moveId: 'basho:neutralSpecial' },
      },
    }
    expect(advance(lost, 1).player.bashoPoem).toBeUndefined()
  })

  it('lets Chrollo write with actual supplies and both hands, then removes the effect with the bookmark', () => {
    const base = duel()
    const chrollo = createFight('chrollo', 'hisoka').player
    const state = {
      ...base,
      player: {
        ...chrollo,
        x: 42,
        chrolloBook: {
          pages: ['basho' as const],
          page: 0,
          open: false,
          bookmark: 'basho' as const,
        },
      },
    }
    const written = ready(supplyWriting(state))
    expect(written.player.bashoPoem?.ready).toBe(true)
    const closed = {
      ...written,
      player: {
        ...written.player,
        chrolloBook: { ...written.player.chrolloBook!, open: false, bookmark: null },
      },
    }
    expect(advance(closed, 1).player.bashoPoem).toBeUndefined()
  })

  it('attributes lethal burning to the poet without paralysis, and clears poems and fire next round', () => {
    const state = duel()
    const burning = {
      ...state,
      opponent: {
        ...state.opponent,
        health: 1,
        bashoBurn: { owner: 'player' as const, remainingFrames: 1 },
      },
    }
    const ended = advance(burning, 1)
    expect(ended.winner).toBe('player')
    expect(ended.opponent.hitStun).toBe(0)
    const next = nextRound({ ...ended, matchWinner: null })
    expect(next.player.bashoPoem).toBeUndefined()
    expect(next.opponent.bashoBurn).toBeUndefined()
  })

  it('lets AI finish writing and keeps only ordinary blows plus the attested poem', () => {
    const base = duel()
    const state = {
      ...base,
      mode: 'versus-ai' as const,
      player: base.opponent,
      opponent: base.player,
    }
    const written = performAttack(state, 'opponent', 'special')
    expect(opponentAttack(written).opponent.attack).toBeNull()
    const finished = tickFight(written, EMPTY_INPUT, { dt: 1, ai: true })
    expect(finished.opponent.bashoPoem?.writingFrames).toBeLessThan(60)
    const moves = movesetFor('basho')!.moves
    expect(moves).toHaveLength(11)
    expect(moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(moves.some((move) => move.category === 'finisher')).toBe(false)
    expect(finisherReady(base, 'player')).toBe(false)
    expect(
      moves.some((move) => /Encre terrestre|Poème funéraire|Vers de protection/.test(move.nameFr)),
    ).toBe(false)
  })
})
