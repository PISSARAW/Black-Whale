import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack } from '../engine'
import { applyAuraContext, isCriticalAuraStrike, nenDamageFactor } from '../nen'
import { planOpponentNen } from '../opponentNenPlan'
import { reflexInput } from '../qwen/reflexes'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type FightState } from '../types'
import {
  AI_REACTION_FRAMES,
  incomingTargetZone,
  perceivesAttack,
  preferOpenZones,
  readDefensiveKo,
} from './aiReads'

function duel(gap = 10): FightState {
  const state = beginFight(
    createFight('biscuit', 'phinks', { mode: 'versus-local', formatId: 'knockout' }),
  )
  return {
    ...state,
    player: { ...state.player, aura: 100, x: 40 },
    opponent: { ...state.opponent, aura: 100, x: 40 + gap },
  }
}
const aura = (fighter: ArcadeFighter, input: Partial<FightInput>) =>
  applyAuraContext(fighter, { ...EMPTY_INPUT, ...input })
const dKoHands = { aura: true, guard: true, gyo: true, focusHands: true }

function windUp(
  state: FightState,
  kind: 'light' | 'heavy',
  frame = AI_REACTION_FRAMES,
): FightState {
  const attacked = performAttack(state, 'player', kind)
  return {
    ...attacked,
    player: { ...attacked.player, attack: { ...attacked.player.attack!, frame } },
  }
}

describe('defensive Ko balance', () => {
  it('guards its zone better than Ken without nearing invulnerability', () => {
    const { player } = duel()
    const ken = nenDamageFactor(aura(player, { aura: true, guard: true }), 'hands')
    const ko = nenDamageFactor(aura(player, dKoHands), 'hands')
    expect(ko).toBeLessThan(ken)
    expect(ko).toBeGreaterThan(0.4)
    expect(nenDamageFactor(aura(player, dKoHands), 'head')).toBeGreaterThan(1.5)
  })

  it('keeps the paid hand Ko usable for the strike it was committed to', () => {
    const state = duel()
    const struck = performAttack(
      { ...state, player: aura(state.player, dKoHands) },
      'player',
      'light',
    )
    expect(struck.player.nen.ko).toBe('hands')
    expect(isCriticalAuraStrike(struck.player)).toBe(true)
  })
})

describe('AI Nen reads', () => {
  it('answers a visible strike only after the reaction delay, on the aimed zone', () => {
    const state = duel()
    expect(incomingTargetZone(state.opponent, windUp(state, 'heavy', 1).player, 10)).toBeNull()
    expect(incomingTargetZone(state.opponent, windUp(state, 'heavy').player, 10)).toBe('torso')
    // A jab whose startup is shorter than the reaction delay cannot be read in time.
    expect(incomingTargetZone(state.opponent, windUp(state, 'light').player, 10)).toBeNull()
  })

  it('needs ocular Gyo to perceive a technique concealed by In', () => {
    const state = windUp(duel(), 'heavy')
    const concealed = { ...state.player, attack: { ...state.player.attack!, concealed: true } }
    expect(perceivesAttack(state.opponent, concealed)).toBe(false)
    expect(perceivesAttack(aura(state.opponent, { gyo: true }), concealed)).toBe(true)
  })

  it('focuses Ryu or a paid defensive Ko where the strike lands', () => {
    const low = windUp(duel(), 'heavy')
    const ryu = planOpponentNen({ ...low, opponent: { ...low.opponent, aura: 40 } })
    expect(ryu.opponent.nen.ryu.torso).toBeGreaterThan(0.7)
    expect(ryu.opponent.nen.ko).toBeNull()
    const heavy = windUp(duel(), 'heavy')
    const planned = planOpponentNen(heavy)
    expect(planned.opponent.nen.ko).toBe(incomingTargetZone(heavy.opponent, heavy.player, 10))
    expect(planned.opponent.aura).toBe(80)
  })

  it('does not rest in Zetsu inside striking range', () => {
    const close = duel(10)
    const tired = { ...close, opponent: { ...close.opponent, aura: 12 } }
    expect(planOpponentNen(tired).opponent.nen.mode).not.toBe('zetsu')
    const far = { ...tired, opponent: { ...tired.opponent, x: 80 } }
    expect(planOpponentNen(far).opponent.nen.mode).toBe('zetsu')
  })

  it('reads a defensive Ko only through Gyo and tries the open zones first', () => {
    const state = duel()
    const guarded = aura(state.player, dKoHands)
    expect(readDefensiveKo(state.opponent, guarded)).toBeNull()
    expect(readDefensiveKo(aura(state.opponent, { gyo: true }), guarded)).toBe('hands')
    const moves = [
      { id: 'a', tuning: { targetZone: 'hands' as const } },
      { id: 'b', tuning: { targetZone: 'head' as const } },
    ]
    expect(preferOpenZones(moves, 'hands').map((move) => move.id)).toEqual(['b', 'a'])
    expect(preferOpenZones(moves, null).map((move) => move.id)).toEqual(['a', 'b'])
  })

  it('lets Qwen commit Ko by releasing Aura and aim Ryu at the incoming zone', () => {
    const plan = { goal: 'pressure', move: 'none', nen: 'ko' } as never
    const state = duel(8)
    expect(reflexInput(state, 'opponent', plan).aura).toBe(true)
    const charging = {
      ...state,
      opponent: {
        ...state.opponent,
        attack: { ...windUp(state, 'heavy').player.attack!, auraCharged: true },
      },
    }
    expect(reflexInput(charging, 'opponent', plan).aura).toBe(false)
    const ryu = reflexInput(windUp(duel(8), 'heavy', 10), 'opponent', {
      ...(plan as object),
      nen: 'ryu',
    } as never)
    expect(ryu).toMatchObject({ guard: true, focusTorso: true, focusHands: false })
  })
})
