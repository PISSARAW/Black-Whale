import { describe, expect, it } from 'vitest'
import { initialArenaSkillHunterBook } from '../combat/fightingSkillHunter'
import { initialCombatState } from '../combat/types'
import { arenaPov } from './pov'

describe('Skill Hunter POV privacy', () => {
  it('hides the opponent book and reveals only its open page under Gyo', () => {
    const base = initialCombatState()
    const state = {
      ...base,
      opponent: {
        ...base.opponent,
        skillHunterBook: { ...initialArenaSkillHunterBook(), selectedSlot: 1 as const },
      },
    }

    expect(arenaPov(state, 'player').opponent.skillHunterBook?.deck).toEqual([
      'unknown-page',
      'unknown-page',
      'unknown-page',
      'unknown-page',
    ])
    expect(
      arenaPov({ ...state, player: { ...state.player, gyo: true } }, 'player').opponent
        .skillHunterBook?.deck,
    ).toEqual(['unknown-page', 'black-voice', 'unknown-page', 'unknown-page'])
  })
})
