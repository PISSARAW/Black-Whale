import { interruptEnForSpeech } from './en/interruptions'
import { captureLittleEyeSpeech } from './littleEyeSenses'
import { captureDeviceSpeech } from './deviceRecording'
import { resolveJudgmentCommunication } from './judgmentCommunication'
import {
  speechRecipient,
  recipientBody,
  recipientHears,
  recordHeardWords,
} from './fightSpeechRecipient'
import { canSpeak, senseDeprived } from './saiyuSenses'
import { sleepingBody, projectionPreparing } from './hanzoProjection'
import { paperAvailable, paperState, hasPlantedPaper } from './kallutoPaper'
import type { PaperWords } from './kallutoPaper'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Only the radius of a voice near the marked person is tuned; no invented remote-link range. */
export const PAPER_VOICE_RANGE = 18
export function paperListening(state: FightState, owner: FightSide): boolean {
  const fighter = state[owner]
  return Boolean(
    paperState(fighter).doll &&
    paperAvailable(fighter) &&
    hasPlantedPaper(state, owner) &&
    !senseDeprived(fighter, 'hearing') &&
    !fighter.coveringEars,
  )
}

/** A real utterance, supplied by T/V or Talk. No thoughts, aura values or silent inputs are relayed. */
export function speakPaperWords(
  state: FightState,
  speaker: FightSide,
  message: string | { text: string; recipient?: string; statementIntent?: boolean } = 'I am here.',
): FightState {
  const { text, target, intent } = normalizeSpokenWords(message)
  if (!text) return state
  if (!voiceAvailable(state, speaker)) return state
  const words: PaperWords = { frame: state.frame, speaker, text }
  let next = captureLittleEyeSpeech(
    captureDeviceSpeech(state, { side: speaker, text, deliberateLie: intent }),
    { side: speaker, text },
  )
  for (const owner of ['player', 'opponent'] as const) {
    if (!paperListening(next, owner)) continue
    const doll = paperState(next[owner]).doll!
    const source = next[speaker] // Hanzo's controlled double speaks at its own location.
    const target = sleepingBody(next[doll.target])
    if (Math.hypot(source.x - target.x, source.y - target.y) > PAPER_VOICE_RANGE) continue
    next = {
      ...next,
      [owner]: { ...next[owner], kallutoPaper: { ...paperState(next[owner]), heard: words } },
    }
  }
  const recipient = speechRecipient(state, speaker, target)
  next = interruptEnForSpeech(next, speaker)
  if (!recipient || !recipientHears(state, speaker, recipient)) return next
  next = recordHeardWords(next, recipient, { speaker, text })
  const actualRecipient = recipientBody(state, recipient)
  return resolveJudgmentCommunication(next, speaker, actualRecipient.nenOwner ?? actualRecipient.id)
}

export function voiceAvailable(state: FightState, speaker: FightSide): boolean {
  const fighter = state[speaker]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canSpeak(fighter) &&
    !projectionPreparing(fighter) &&
    !fighter.arsenalSleep &&
    !fighter.needlePuppet &&
    !fighter.blackVoiceControl?.active &&
    voluntarySpeechMind(fighter)
  )
}

function normalizeSpokenWords(
  message: string | { text: string; recipient?: string; statementIntent?: boolean },
) {
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
