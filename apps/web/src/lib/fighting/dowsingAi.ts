import { judgmentForbidsContact } from './judgmentCommunication'
import { canAskDowsing } from './dowsingRules'
import { performDowsingCommand } from './dowsingAction'
import type { DowsingQuestion } from './dowsingTypes'
import type { FightState } from './types'

export function dowsingAi(state: FightState): FightState | null {
  if (judgmentForbidsContact(state.opponent, state.player.id)) return null
  const prompt = state.opponent.dowsingPrompt
  if (prompt && state.frame - prompt.askedAt >= 30) {
    const answered = performDowsingCommand(state, 'opponent', {
      action: 'dowsing-answer',
      target: 'sincere',
    })
    if (answered !== state) return answered
  }
  if (!dowsingOpportunity(state)) return null
  const question: DowsingQuestion = (['identity', 'nen', 'in'] as const)[
    Math.floor(state.frame / 360) % 3
  ]
  const asked = performDowsingCommand(state, 'opponent', {
    action: 'dowsing-ask',
    target: question,
  })
  return asked === state ? null : asked
}

function dowsingOpportunity(state: FightState): boolean {
  return (
    canAskDowsing(state, 'opponent') &&
    !state.player.attack &&
    state.frame - (state.opponent.dowsingReading?.frame ?? -360) >= 360
  )
}
