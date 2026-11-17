import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { chainAbilitySealed } from './kurapika'
import { EMPTY_INPUT } from './types'

describe('Skill Hunter observes the actual newly started technique', () => {
  it('steals Texture Surprise after seeing it without taking Bungee Gum', () => {
    let state = beginFight(
      createFight('hisoka', 'chrollo', { mode: 'versus-local', formatId: 'knockout' }),
    )
    state = {
      ...state,
      player: { ...state.player, x: 45, aura: 100 },
      opponent: { ...state.opponent, x: 50, aura: 100 },
    }
    state = performAuraAttack({
      state,
      side: 'player',
      kind: 'special',
      moveId: 'hisoka:downSpecial',
      auraCharged: false,
    })
    expect(state.opponent.hatsuEffects.witnessedMoveId).toBe('hisoka:downSpecial')
    for (let i = 0; i < 90; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    state = performArsenalCommand(state, 'opponent', { action: 'hunter-ask' })
    state = performArsenalCommand(state, 'player', { action: 'hunter-answer' })
    state = performArsenalCommand(state, 'player', { action: 'hunter-palm' })
    expect(state.player.skillHunterStolen).toEqual([
      { owner: 'opponent', moveId: 'hisoka:downSpecial' },
    ])
    expect(chainAbilitySealed(state.player, 'hisoka:downSpecial')).toBe(true)
    expect(chainAbilitySealed(state.player, 'hisoka:neutralSpecial')).toBe(false)
  })
})
