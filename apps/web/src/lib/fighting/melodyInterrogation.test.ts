import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack } from './engine'
import { performArsenalAction } from './arsenalExecution'
import { advanceMelodyHearing } from './melodyHearing'
import { melodyQuestionOptions, SPEECH_PULSE_FRAMES } from './melodyInterrogation'
import { privatePvpState } from './pvp/view'
import { singleCombatArsenalAi } from './singleCombatAi'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

function duel(): FightState {
  const state = beginFight(createFight('melody', 'hisoka', { mode: 'versus-local' }))
  return { ...state, player: { ...state.player, x: 42 }, opponent: { ...state.opponent, x: 52 } }
}
function command(state: FightState, command: ArsenalCommand, side: FightSide = 'player') {
  return performArsenalAction({ state, side, command }, performAuraAttack)
}
function ask(state = duel()) {
  return command(state, { action: 'melody-ask', target: 'identity' })
}
function answer(state: FightState, target: string) {
  return advanceMelodyHearing(command(state, { action: 'melody-answer', target }, 'opponent'))
}

describe('Melody’s chapter 68 physiological questioning', () => {
  it('asks audibly without Nen, with no forced response or hidden truth verdict', () => {
    const initial = duel()
    const sealed = {
      ...initial,
      player: {
        ...initial.player,
        nen: { ...initial.player.nen, mode: 'zetsu' as const },
        hatsuEffects: { ...initial.player.hatsuEffects, hatsuStolen: 1 },
      },
    }
    const asked = ask(sealed)
    expect(asked.opponent.heardWords?.text).toBe('Qui es-tu réellement ?')
    expect(asked.opponent.melodyPrompt?.owner).toBe('player')
    expect(asked.player.aura).toBe(initial.player.aura)
    expect(advanceMelodyHearing(asked).player.melodyHearing?.acceleration).toBeUndefined()
    const answered = answer(asked, 'lie-stressed')
    expect(answered.player.heardWords?.text).toBe('Je suis Kurapika.')
    expect(answered.player.melodyHearing).toMatchObject({
      pulse: 'agitated',
      acceleration: 'sudden',
    })
    expect(answered.player.melodyHearing).not.toHaveProperty('truth')
    expect(answered.player.melodyHearing).not.toHaveProperty('swings')
    expect(answered.opponent.melodyPrompt).toBeUndefined()
  })

  it('keeps truth and stress independent, instead of creating a perfect lie detector', () => {
    const asked = ask()
    expect(answer(asked, 'sincere-stressed').player.melodyHearing).toEqual(
      answer(asked, 'lie-stressed').player.melodyHearing,
    )
    expect(answer(asked, 'sincere-calm').player.melodyHearing).toEqual(
      answer(asked, 'lie-calm').player.melodyHearing,
    )
    expect(answer(asked, 'lie-calm').player.melodyHearing?.acceleration).toBe('gradual')
    expect(answer(asked, 'sincere-calm').player.heardWords?.text).toBe('Je suis Hisoka.')
  })

  it('requires a real voice, a listener and a current question', () => {
    const initial = duel()
    const mute = {
      ...initial,
      player: {
        ...initial.player,
        hatsuEffects: { ...initial.player.hatsuEffects, senseSeals: 4 },
      },
    }
    expect(ask(mute)).toBe(mute)
    const deaf = { ...initial, opponent: { ...initial.opponent, coveringEars: true } }
    expect(ask(deaf)).toBe(deaf)
    const far = { ...initial, opponent: { ...initial.opponent, x: 90 } }
    expect(ask(far)).toBe(far)
    const asked = ask()
    const expired = { ...asked, frame: asked.frame + 180 }
    expect(command(expired, { action: 'melody-answer', target: 'lie-stressed' }, 'opponent')).toBe(
      expired,
    )
    expect(command(initial, { action: 'melody-answer', target: 'lie-stressed' }, 'opponent')).toBe(
      initial,
    )
    expect(ask(asked)).toBe(asked)
  })

  it('expires the physiological clue, loses it without hearing and keeps it private in PvP', () => {
    const state = answer(ask(), 'sincere-stressed')
    expect(privatePvpState(state, 'player').opponent.speechPulse).toBeUndefined()
    expect(privatePvpState(state, 'player').player.melodyHearing?.acceleration).toBe('sudden')
    expect(privatePvpState(state, 'opponent').opponent.melodyHearing).toBeUndefined()
    expect(
      advanceMelodyHearing({ ...state, frame: state.frame + SPEECH_PULSE_FRAMES }).player
        .melodyHearing?.acceleration,
    ).toBeUndefined()
    expect(
      advanceMelodyHearing({ ...state, player: { ...state.player, coveringEars: true } }).player
        .melodyHearing,
    ).toBeUndefined()
    const copied = { ...state, player: { ...state.player, id: 'chrollo' as const } }
    expect(advanceMelodyHearing(copied).player.melodyHearing).toBeUndefined()
  })

  it('exposes validated commands and only lets the AI answer for its own seat', () => {
    const asked = ask()
    expect(melodyQuestionOptions(asked, 'opponent')).toHaveLength(4)
    expect(command(asked, { action: 'melody-answer', target: 'automatic-truth' }, 'opponent')).toBe(
      asked,
    )
    const later = { ...asked, frame: asked.frame + 30 }
    const ai = singleCombatArsenalAi(later, performAuraAttack)!
    expect(ai.opponent.melodyPrompt).toBeUndefined()
    expect(ai.opponent.speechPulse?.shape).toBe('gradual')
    const mirrored: FightState = {
      ...duel(),
      player: { ...duel().opponent },
      opponent: { ...duel().player },
    }
    const question = singleCombatArsenalAi(mirrored, performAuraAttack)!
    expect(question.player.melodyPrompt?.owner).toBe('opponent')
    expect(
      singleCombatArsenalAi({ ...question, frame: question.frame + 31 }, performAuraAttack),
    ).toBeNull()
    expect(question.player.speechPulse).toBeUndefined()
  })
})
