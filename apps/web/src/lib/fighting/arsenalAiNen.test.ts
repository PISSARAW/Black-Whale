import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performOpponentArsenalMove } from './arsenalAiNen'
import { moveForSlot } from './movesets'
import { KO_COST, forceZetsu } from './nen'
import { attackAuraCost } from './fightAttackCost'
import { canSwearOn, opponentWantsOn } from './onTechnique'
import type { FighterId, FightState, MoveSlot } from './types'

function duel(id: FighterId): FightState {
  const state = beginFight(createFight('franklin', id, { mode: 'versus-ai' }))
  return {
    ...state,
    player: { ...state.player, x: 45 },
    opponent: { ...state.opponent, x: 50, aura: 100 },
  }
}
function perform(state: FightState, slot: MoveSlot, roll = 0.9): FightState {
  return performOpponentArsenalMove(
    { state, move: moveForSlot(state.opponent.id, slot)!, roll },
    performAuraAttack,
  )
}

describe('AI aura techniques pay the same price and expose the same body as player commands', () => {
  it('conceals a real attachment and pays its actual In surcharge once', () => {
    const state = duel('hisoka')
    const next = perform(state, 'neutralSpecial')
    const cost = attackAuraCost({
      fighter: state.opponent,
      kind: 'special',
      moveId: 'hisoka:neutralSpecial',
      concealed: true,
    })
    expect(next.opponent.attack?.concealed).toBe(true)
    expect(next.opponent.nen.in).toBe(true)
    expect(next.opponent.aura).toBe(100 - cost)
    expect(state.opponent.nen.in).toBe(false)
  })

  it('does not create enough aura to conceal, and does not hide physical bullets', () => {
    const state = duel('hisoka')
    state.opponent.aura = moveForSlot('hisoka', 'neutralSpecial')!.auraCost
    expect(perform(state, 'neutralSpecial').opponent.attack?.concealed).not.toBe(true)
    expect(perform(duel('theta'), 'neutralSpecial').opponent.attack?.concealed).not.toBe(true)
  })

  it('commits and pays Ko only against an observed opening', () => {
    const state = duel('biscuit')
    state.player.hitStun = 30
    const next = perform(state, 'standingHeavy')
    expect(next.opponent.nen.ko).toBeTruthy()
    expect(next.opponent.aura).toBe(100 - KO_COST)
    expect(next.opponent.attack?.auraCharged).toBe(false)
    expect(perform(duel('biscuit'), 'standingHeavy').opponent.nen.ko).toBeNull()
  })

  it('does not obtain a safe Ko opening through blindness or private future state', () => {
    const state = duel('biscuit')
    state.player.hitStun = 30
    state.opponent.hatsuEffects.senseSeals = 1
    expect(perform(state, 'standingHeavy').opponent.nen.ko).toBeNull()
  })

  it('preserves Zetsu and does not turn a refused Hatsu into a paid attack', () => {
    const state = duel('hisoka')
    state.opponent = forceZetsu(state.opponent)
    expect(perform(state, 'neutralSpecial')).toBe(state)
  })

  it('keeps On available as explicitly requested, including the existing AI oath', () => {
    const state = duel('benjamin')
    state.opponent.health = state.opponent.maxHealth * 0.4
    state.opponent.on = { grudge: 100, sealFrames: 0 }
    expect(canSwearOn(state.opponent)).toBe(true)
    expect(opponentWantsOn(state.opponent)).toBe(true)
  })
})
