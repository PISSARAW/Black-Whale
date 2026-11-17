import { dowsingVideoOptions, performDowsingVideo } from './dowsingVideo'
import { judgmentForbidsContact } from './judgmentCommunication'
import { canAskDowsing } from './dowsingRules'
import { performDowsingCommand } from './dowsingAction'
import type { DowsingQuestion } from './dowsingTypes'
import type { FightState } from './types'

export function dowsingAi(state: FightState): FightState | null {
  const video = videoAi(state)
  if (video) return video
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

function videoAi(state: FightState): FightState | null {
  if (state.frame - (state.opponent.dowsingReading?.frame ?? -360) < 360) return null
  const option = dowsingVideoOptions(state, 'opponent').find(
    (entry, index) => entry.ready && unreadVideoWord(state, index),
  )
  if (!option) return null
  const next = performDowsingVideo(state, 'opponent', option.command.target)
  return next === state ? null : next
}

function unreadVideoWord(state: FightState, index: number): boolean {
  const playback = state.opponent.devicePlayback!
  const sampleId = playback.words[index].sampleId
  return !state.opponent.dowsingScreened?.some(
    (mark) => mark.deviceId === playback.deviceId && mark.sampleId === sampleId,
  )
}
