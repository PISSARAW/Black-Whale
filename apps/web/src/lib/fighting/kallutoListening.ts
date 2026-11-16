import { canSpeak, senseDeprived } from './saiyuSenses'
import { sleepingBody } from './hanzoProjection'
import { paperAvailable, paperState, hasPlantedPaper } from './kallutoPaper'
import type { PaperWords } from './kallutoPaper'
import type { FightSide, FightState } from './types'

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
export function speakPaperWords(state: FightState, speaker: FightSide): FightState {
  if (
    state.phase !== 'fighting' ||
    state.catsName ||
    !canSpeak(state[speaker]) ||
    state[speaker].hanzoProjection ||
    state[speaker].needlePuppet
  )
    return state
  if (
    ![state.player, state.opponent].some(
      (fighter) =>
        fighter.id === 'kalluto' || paperAvailable(fighter) || fighter.kallutoPaper?.doll,
    )
  )
    return state
  const words: PaperWords = { frame: state.frame, speaker, text: 'I am here.' }
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
  return next
}
