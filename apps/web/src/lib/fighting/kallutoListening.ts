import { interruptEnForSpeech } from './en/interruptions'
import { captureLittleEyeSpeech } from './littleEyeSenses'
import { captureSecretWindowSpeech } from './secretWindowSpeech'
import { captureDeviceSpeech } from './deviceRecording'
import { resolveJudgmentCommunication } from './judgmentCommunication'
import { resolveJudgmentReply } from './judgmentInquirySpeech'
import { resolveDowsingReply } from './dowsingSpeech'
import type { SpokenMessage } from './judgmentInquiryTypes'
import {
  speechRecipient,
  recipientBody,
  recipientHears,
  recordHeardWords,
} from './fightSpeechRecipient'
import { canSpeak } from './saiyuSenses'
import { projectionPreparing } from './hanzoProjection'
import { capturePaperDollSpeech, paperOwnerListening } from './kallutoSpeech'
import { activePaperOwner } from './kallutoSurveillance'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Only the radius of a voice near the marked person is tuned; no invented remote-link range. */
export { PAPER_VOICE_RANGE } from './kallutoSpeech'
export function paperListening(state: FightState, owner: FightSide): boolean {
  return paperOwnerListening(state, activePaperOwner(state, owner))
}

/** A real utterance, supplied by T/V or Talk. No thoughts, aura values or silent inputs are relayed. */
export function speakPaperWords(
  state: FightState,
  speaker: FightSide,
  message: string | SpokenMessage = 'I am here.',
): FightState {
  const { text, target, intent } = normalizeSpokenWords(message)
  if (!text) return state
  if (!voiceAvailable(state, speaker)) return state
  let next = captureLittleEyeSpeech(
    captureDeviceSpeech(state, { side: speaker, text, deliberateLie: intent }),
    { side: speaker, text },
  )
  next = captureSecretWindowSpeech(next, { side: speaker, text })
  next = capturePaperDollSpeech(next, { side: speaker, text })
  const recipient = speechRecipient(state, speaker, target)
  next = interruptEnForSpeech(next, speaker)
  if (!recipient || !recipientHears(state, speaker, recipient)) return next
  next = recordHeardWords(next, recipient, { speaker, text })
  const actualRecipient = recipientBody(state, recipient)
  next = resolveJudgmentCommunication(next, speaker, actualRecipient.nenOwner ?? actualRecipient.id)
  const speech = {
    recipient,
    message: declaredMessage(message, text),
  }
  return resolveDowsingReply(resolveJudgmentReply(next, speaker, speech), speaker, speech)
}

function declaredMessage(message: string | SpokenMessage, text: string): SpokenMessage {
  return typeof message === 'string' ? { text } : { ...message, text }
}

export function voiceAvailable(state: FightState, speaker: FightSide): boolean {
  const fighter = state[speaker]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canSpeak(fighter) &&
    !projectionPreparing(fighter) &&
    !fighter.halkSoulSleep &&
    !fighter.arsenalSleep &&
    !fighter.needlePuppet &&
    !fighter.blackVoiceControl?.active &&
    voluntarySpeechMind(fighter)
  )
}

function normalizeSpokenWords(message: string | SpokenMessage) {
  return typeof message === 'string'
    ? { text: message.trim(), target: undefined, intent: undefined }
    : { text: message.text.trim(), target: message.recipient, intent: message.statementIntent }
}

function voluntarySpeechMind(fighter: ArcadeFighter): boolean {
  return (
    !speechBlackout(fighter) &&
    ![
      fighter.hatsuEffects.manipulatedFrames,
      fighter.hatsuEffects.possessedFrames,
      fighter.hatsuEffects.momozeFrames,
    ].some((frames) => frames > 0)
  )
}

function speechBlackout(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.kurapika?.blackoutFrames || fighter.dolphinLoan?.blackoutFrames)
}
