import { resolveJudgmentCommunication } from './judgmentCommunication'
import { speechRecipient, recipientBody, recipientHears, recordHeardWords } from './fightSpeechRecipient'
import { canSpeak, senseDeprived } from './saiyuSenses'
import { sleepingBody } from './hanzoProjection'
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
  message: string | { text: string; recipient?: string } = 'I am here.',
): FightState {
  const { text, target } = normalizeSpokenWords(message)
  if (!text) return state
  if (!voiceAvailable(state, speaker)) return state
  const words: PaperWords = { frame: state.frame, speaker, text }
  let next = state
  for (const owner of ['player', 'opponent'] as const) {
    if (!paperListening(next, owner)) continue
    const doll = paperState(next[owner]).doll!
    const source = sleepingBody(next[speaker])
    const target = sleepingBody(next[doll.target])
    if (Math.hypot(source.x - target.x, source.y - target.y) > PAPER_VOICE_RANGE) continue
    next = {
      ...next,
      [owner]: { ...next[owner], kallutoPaper: { ...paperState(next[owner]), heard: words } },
    }
  }
  const recipient = speechRecipient(state, speaker, target)
  if (!recipient || !recipientHears(state, speaker, recipient)) return next
  next = recordHeardWords(next, recipient, { speaker, text })
  return resolveJudgmentCommunication(next, speaker, recipientBody(state, recipient).id)
}

export function voiceAvailable(state: FightState, speaker: FightSide): boolean {
  const fighter = state[speaker]
  return (
    state.phase === 'fighting' &&
    !state.catsName &&
    canSpeak(fighter) &&
    !fighter.hanzoProjection &&
    !fighter.arsenalSleep &&
    !fighter.needlePuppet &&
    voluntarySpeechMind(fighter)
  )
}

function normalizeSpokenWords(message: string | {text: string; recipient?: string}) {
  return typeof message === 'string' ? { text: message.trim(), target: undefined }
    : { text: message.text.trim(), target: message.recipient }
}

function voluntarySpeechMind(fighter: ArcadeFighter): boolean {
  return (fighter.kurapika?.blackoutFrames ?? 0) === 0 &&
    ![fighter.hatsuEffects.manipulatedFrames, fighter.hatsuEffects.possessedFrames, fighter.hatsuEffects.momozeFrames].some((frames) => frames > 0)
}
