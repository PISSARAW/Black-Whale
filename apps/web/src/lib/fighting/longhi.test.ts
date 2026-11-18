import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  nextRound,
  opponentAttack,
  performAttack,
  performMove,
  tickFight,
} from './engine'
import { hatsuFor } from './hatsu/registry'
import { finisherReady, moveForAction, moveForSlot, movesetFor } from './movesets'
import { applyAuraContext } from './nen'
import {
  MOONLIGHT_TRUCE_FRAMES,
  offerMoonlightContract,
  respondMoonlightContract,
} from './moonlightContract'
import { EMPTY_INPUT, type FightSide, type FightState } from './types'

function duel(): FightState {
  const state = beginFight(
    createFight('longhi', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, x: 42, aura: 80 },
    opponent: { ...state.opponent, x: 50, aura: 80 },
  }
}

function propose(state = duel()): FightState {
  return performMove({ state, side: 'player', action: 'special' })
}

function sign(state = propose(), side: FightSide = 'opponent'): FightState {
  return respondMoonlightContract({ state, side, accept: true })
}

function advance(state: FightState, frames: number): FightState {
  let next = state
  for (let i = 0; i < frames; i++)
    next = tickFight(next, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return next
}

describe('Longhi’s voluntary Moonlight Act', () => {
  it('offers disclosed terms without a hitbox, damage, movement, aura charge or signature on hit', () => {
    const ready = duel()
    const offered = propose(ready)
    expect(offered.moonlight?.offer).toMatchObject({
      issuer: 'player',
      recipient: 'opponent',
      terms: 'no-attacks',
      reward: 'one-use-of-moonlight-act',
      penalty: 'one-week-zetsu',
    })
    expect(offered.player.attack).toBeNull()
    expect(offered.player.aura).toBe(80)
    expect(offered.player.x).toBe(42)
    expect(offered.opponent).toMatchObject({ health: ready.opponent.maxHealth, hitStun: 0 })
    expect(offered.moonlight?.active).toBeUndefined()
    const impact = hatsuFor('longhi').onImpact({
      state: ready,
      side: 'player',
      defenderSide: 'opponent',
      source: 'longhi',
      blocked: false,
      concealed: false,
    })
    expect(impact).toBe(ready)
  })

  it('requires the recipient’s explicit signature, and lets them refuse without consequence', () => {
    const offered = propose()
    expect(sign(offered, 'player')).toBe(offered)
    expect(advance(offered, 120).moonlight?.active).toBeUndefined()
    const declined = respondMoonlightContract({ state: offered, side: 'opponent', accept: false })
    expect(declined.moonlight?.offer).toBeUndefined()
    expect(declined.moonlight?.outcome?.kind).toBe('refused')
    expect(declined.opponent.moonlightZetsu).toBeUndefined()
    const signed = sign(offered)
    expect(signed.moonlight?.active?.remainingFrames).toBe(MOONLIGHT_TRUCE_FRAMES)
    expect(signed.player.hitStun).toBe(0)
    expect(signed.opponent.hitStun).toBe(0)
  })

  it('never treats silence as acceptance and expires an unsigned offer', () => {
    const expired = advance(propose(), 480)
    expect(expired.moonlight?.active).toBeUndefined()
    expect(expired.moonlight?.outcome?.kind).toBe('expired')
    expect(expired.opponent.moonlightZetsu).toBeUndefined()
    expect(expired.opponent.moonlightLoan ?? 0).toBe(0)
  })

  it('does not accept a signature from a manipulated or entranced recipient', () => {
    const offered = propose()
    for (const key of [
      'manipulatedFrames',
      'entrancedFrames',
      'possessedFrames',
    ] as const) {
      const controlled = {
        ...offered,
        opponent: {
          ...offered.opponent,
          hatsuEffects: {
            ...offered.opponent.hatsuEffects,
            [key]: 60,
          },
        },
      }
      expect(sign(controlled)).toBe(controlled)
    }
  })

  it('requires conscious, grounded signatories close enough to sign', () => {
    const ready = duel()
    const offered = propose(ready)
    const away = { ...offered, opponent: { ...offered.opponent, x: 80 } }
    expect(sign(away)).toBe(away)
    for (const patch of [{ y: 5 }, { knockdownFrames: 20 }, { hitStun: 10 }]) {
      const unavailable = { ...ready, player: { ...ready.player, ...patch } }
      expect(propose(unavailable)).toBe(unavailable)
    }
    const stolen = {
      ...ready,
      player: { ...ready.player, hatsuEffects: { ...ready.player.hatsuEffects, hatsuStolen: 1 } },
    }
    expect(propose(stolen)).toBe(stolen)
  })

  it.each(['player', 'opponent'] as const)(
    'binds %s to the same clause and only sanctions an actual breach',
    (side) => {
      const signed = sign()
      expect(advance(signed, 40)[side].moonlightZetsu).toBeUndefined()
      const struck = performAttack(signed, side, 'light')
      expect(struck[side].moonlightZetsu).toBe(true)
      expect(struck[side].nen.mode).toBe('zetsu')
      expect(struck[side].hitStun).toBe(0)
      expect(struck[side].attack?.kind).toBe('light')
      expect(struck.moonlight?.outcome).toEqual({ kind: 'breached', side })
      expect(struck[side === 'player' ? 'opponent' : 'player'].moonlightZetsu).toBeUndefined()
    },
  )

  it('does not punish movement, guard or basic Nen, and rejects an attack that cannot start', () => {
    const signed = sign()
    const guarded = tickFight(
      signed,
      { ...EMPTY_INPUT, guard: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
    expect(guarded.player.moonlightZetsu).toBeUndefined()
    expect(guarded.player.blocking).toBe(true)
    const moving = tickFight(
      signed,
      { ...EMPTY_INPUT, left: true, aura: true },
      { dt: 1 / 60, opponentInput: EMPTY_INPUT },
    )
    expect(moving.player.x).toBeLessThan(42)
    expect(moving.player.moonlightZetsu).toBeUndefined()
    const stunned = { ...signed, player: { ...signed.player, hitStun: 20 } }
    expect(performAttack(stunned, 'player', 'light').player.moonlightZetsu).toBeUndefined()
  })

  it('grants exactly one usable loan after fulfilment and never overwrites the recipient’s own Hatsu', () => {
    const fulfilled = advance(sign(), MOONLIGHT_TRUCE_FRAMES)
    expect(fulfilled.opponent.moonlightLoan).toBe(1)
    expect(fulfilled.opponent.id).toBe('hisoka')
    expect(advance(fulfilled, 30).opponent.moonlightLoan).toBe(1)
    const reoffer = offerMoonlightContract({ state: fulfilled, side: 'opponent' })
    expect(reoffer.moonlight?.offer?.issuer).toBe('opponent')
    expect(reoffer.opponent.moonlightLoan).toBe(1)
    const accepted = sign(reoffer, 'player')
    expect(accepted.opponent.moonlightLoan).toBe(0)
    expect(accepted.moonlight?.active).toBeDefined()
    const used = { ...accepted, moonlight: undefined }
    expect(offerMoonlightContract({ state: used, side: 'opponent' })).toBe(used)
  })

  it('keeps the penalty through aura inputs and subsequent rounds, without paralysis', () => {
    const breached = performAttack(sign(), 'player', 'light')
    expect(applyAuraContext(breached.player, { ...EMPTY_INPUT, aura: true }).nen.mode).toBe('zetsu')
    const next = nextRound({ ...breached, phase: 'finished', winner: 'opponent' })
    expect(next.player.moonlightZetsu).toBe(true)
    expect(next.player.nen.mode).toBe('zetsu')
    const ready = beginFight(next)
    expect(performAttack(ready, 'player', 'light').player.attack?.kind).toBe('light')
    expect(createFight('longhi', 'hisoka').player.moonlightZetsu).toBeUndefined()
  })

  it('cancels a forbidden Nen activation before its effects and never turns a breach into an execution', () => {
    const signed = sign()
    const attempt = performAttack(signed, 'opponent', 'special')
    expect(attempt.opponent.moonlightZetsu).toBe(true)
    expect(attempt.opponent.attack).toBeNull()
    expect(attempt.bungeeGum).toBeNull()
    expect(attempt.player.health).toBe(signed.player.health)
    expect(attempt.opponent.health).toBe(signed.opponent.health)
  })

  it('lets only the AI choose its own signature and then honour the agreement', () => {
    const offered = advance(propose(), 30)
    const accepted = opponentAttack({
      ...offered,
      mode: 'versus-ai',
      opponent: { ...offered.opponent, aura: 25 },
    })
    expect(accepted.moonlight?.active).toBeDefined()
    expect(opponentAttack(accepted).opponent.attack).toBeNull()
    const declined = opponentAttack({ ...offered, mode: 'versus-ai' })
    expect(declined.moonlight?.outcome?.kind).toBe('refused')
    const human = {
      ...offered,
      player: offered.opponent,
      opponent: offered.player,
      moonlight: {
        offer: {
          ...offered.moonlight!.offer!,
          issuer: 'opponent' as const,
          recipient: 'player' as const,
        },
      },
    }
    expect(opponentAttack({ ...human, mode: 'versus-ai' }).moonlight?.active).toBeUndefined()
  })

  it('allows a stolen Longhi page to offer terms but never to impose them', () => {
    const base = duel()
    const chrollo = createFight('chrollo', 'hisoka').player
    const ready = {
      ...base,
      player: {
        ...chrollo,
        x: 42,
        chrolloBook: { pages: ['longhi' as const], page: 0, open: true, bookmark: null },
      },
    }
    const offered = propose(ready)
    expect(offered.moonlight?.offer).toBeDefined()
    expect(offered.moonlight?.active).toBeUndefined()
    expect(sign(offered).moonlight?.active).toBeDefined()
  })

  it('has one non-damaging contract technique and no forced consent or offensive finisher', () => {
    const moveset = movesetFor('longhi')!
    expect(moveset.moves).toHaveLength(11)
    expect(moveset.moves.filter((move) => move.category === 'special')).toHaveLength(1)
    expect(moveset.moves.some((move) => move.category === 'finisher')).toBe(false)
    expect(moveset.moves.some((move) => move.nameFr.includes('forcé'))).toBe(false)
    expect(finisherReady(duel(), 'player')).toBe(false)
    expect(moveForSlot('longhi', 'neutralSpecial')?.canon.source).toContain('401')
    expect(moveForAction(duel().player, 'special', { ...EMPTY_INPUT, right: true })?.slot).toBe(
      'neutralSpecial',
    )
    expect(
      hatsuFor('longhi').onTrigger({ state: duel(), side: 'player', source: 'longhi' }).moonlight
        ?.active,
    ).toBeUndefined()
  })
})
