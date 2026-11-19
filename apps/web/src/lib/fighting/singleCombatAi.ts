import { judgmentForbidsContact } from './judgmentCommunication'
import { performSecretWindowCommand } from './secretWindowArsenal'
import { performBashoArsenal, canAskBasho } from './bashoInterrogation'
import { performSweetHomeCommand, sweetHomeObjects } from './sweetHomeArsenal'
import { canAskMelody, performMelodyQuestion } from './melodyInterrogation'
import type { AuraAttackOptions } from './auraAttackAction'
import type { FightState } from './types'

/** AI only supplies its own speech. A human's unanswered question stays unanswered. */
export function singleCombatArsenalAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  return (
    melodySpeechAi(state) ??
    bashoSpeechAi(state, perform) ??
    bashoWritingAi(state, perform) ??
    sweetHomeAi(state) ??
    windowAi(state, perform)
  )
}
function melodySpeechAi(state: FightState): FightState | null {
  if (judgmentForbidsContact(state.opponent, state.player.id)) return null
  if (state.opponent.melodyPrompt && state.frame - state.opponent.melodyPrompt.askedAt >= 30) {
    const reply = performMelodyQuestion({
      state,
      side: 'opponent',
      command: { action: 'melody-answer', target: 'sincere-calm' },
    })
    if (reply !== state) return reply
  }
  if (state.frame % 600 < 30 && canAskMelody(state, 'opponent')) {
    const asked = performMelodyQuestion({
      state,
      side: 'opponent',
      command: { action: 'melody-ask', target: 'identity' },
    })
    if (asked !== state) return asked
  }
  return null
}
function bashoSpeechAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  if (!judgmentForbidsContact(actor, state.player.id)) {
    if (
      actor.bashoPrompt &&
      state.frame - (actor.bashoPrompt.askedAt ?? actor.bashoPrompt.frame) >= 30
    ) {
      const answered = performBashoArsenal(
        { state, side: 'opponent', command: { action: 'basho-answer', target: 'sincere' } },
        perform,
      )
      if (answered !== state) return answered
    }
    if (canAskBasho(state, 'opponent') && !actor.bashoPoem?.declaration) {
      const asked = performBashoArsenal(
        { state, side: 'opponent', command: { action: 'basho-ask', target: 'identity' } },
        perform,
      )
      if (asked !== state) return asked
    }
  }
  return null
}
function bashoWritingAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const target = bashoWritingOpportunity(state)
  if (target) {
    const written = performBashoArsenal(
      { state, side: 'opponent', command: { action: 'basho-compose', target } },
      perform,
    )
    if (written !== state) return written
  }
  return null
}

function bashoWritingOpportunity(state: FightState): 'punch' | 'trial' | null {
  const actor = state.opponent,
    poem = actor.bashoPoem
  if (actor.id !== 'basho') return null
  if (!poem) return state.frame % 600 >= 300 ? 'trial' : null
  if (poem.declaration && state.frame - poem.declaration.frame >= 180) return 'punch'
  if (!poem.ready) return null
  return poem.effect === 'ignite-punched-target' && state.frame % 900 >= 600 ? 'trial' : null
}
function sweetHomeAi(state: FightState): FightState | null {
  const actor = state.opponent
  if (
    actor.id === 'terebellum' &&
    !actor.sweetHomeObject &&
    state.player.attack &&
    !state.player.attack.concealed
  ) {
    const object = sweetHomeObjects(state, 'opponent')[0]
    if (object) {
      const prepared = performSweetHomeCommand(state, 'opponent', {
        action: 'sweet-home-object',
        target: object.id,
      })
      if (prepared !== state) return prepared
    }
  }
  return null
}
function windowAi(
  state: FightState,
  perform: (options: AuraAttackOptions) => FightState,
): FightState | null {
  const actor = state.opponent
  const gap = Math.abs(actor.x - state.player.x)
  if (!actor.secretWindow && gap > 18) {
    const listening = performSecretWindowCommand(
      { state, side: 'opponent', command: { action: 'window-listen' } },
      perform,
    )
    if (listening !== state) return listening
  }
  if (actor.secretWindow?.mode === 'listening' && gap <= 6) {
    const attached = performSecretWindowCommand(
      { state, side: 'opponent', command: { action: 'window-contact' } },
      perform,
    )
    if (attached !== state) return attached
  }
  return null
}
