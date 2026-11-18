import { arsenalMindAvailable } from './arsenalMind'
import { changeDolphinBody, dolphinBody } from './dolphinBodies'
import { sleepingBody } from './hanzoProjection'
import { paperAbilityAvailable } from './kallutoAccess'
import { paperDollBody, paperDollMarked, paperDolls } from './kallutoSurveillance'
import { senseDeprived } from './saiyuSenses'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { PaperDoll, PaperWords } from './kallutoPaperTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Voice pickup around the real marking; a scenario distance, not a stated Nen link range. */
export const PAPER_VOICE_RANGE = 18

export function paperObserverReady(actor: ArcadeFighter): boolean {
  return (
    paperAbilityAvailable(actor, 'doll') &&
    arsenalMindAvailable(actor) &&
    !senseDeprived(actor, 'hearing') &&
    !actor.coveringEars
  )
}

export function capturePaperDollSpeech(
  state: FightState,
  speech: { side: FightSide; text: string },
): FightState {
  if (state.pvpSeat) return state
  let next = state
  for (const owner of ['player', 'opponent'] as const) {
    const count = state.teamMatch?.seats[owner].members.length ?? 1
    for (let member = 0; member < count; member++) {
      const ref = { owner, member }
      next = changeDolphinBody(next, ref, (actor) =>
        receivePaperSpeech(state, actor, { owner: ref, speech }),
      )
    }
  }
  return next
}

function receivePaperSpeech(
  state: FightState,
  actor: ArcadeFighter,
  context: { owner: DolphinBodyRef; speech: { side: FightSide; text: string } },
): ArcadeFighter {
  if (!paperObserverReady(actor)) return actor
  const words = { frame: state.frame, speaker: context.speech.side, text: context.speech.text }
  const old = paperDolls(actor)
  const dolls = old.map((doll) =>
    heardAtDoll(state, { owner: context.owner, doll }, words) ? { ...doll, heard: words } : doll,
  )
  if (dolls.every((doll, index) => doll === old[index])) return actor
  const selected = actor.kallutoPaper?.doll
  const doll = dolls.find(
    (entry) => entry.target === selected?.target && entry.targetMember === selected?.targetMember,
  )
  return { ...actor, kallutoPaper: { ...actor.kallutoPaper!, dolls, doll, heard: words } }
}

function heardAtDoll(
  state: FightState,
  context: { owner: DolphinBodyRef; doll: PaperDoll },
  words: PaperWords,
): boolean {
  if (context.doll.active === false || !paperDollMarked(state, context.owner, context.doll))
    return false
  const target = paperDollBody(state, context.doll)
  if (!target) return false
  const body = sleepingBody(target)
  const speaker = state[words.speaker]
  return Math.hypot(speaker.x - body.x, speaker.y - body.y) <= PAPER_VOICE_RANGE
}

export function paperOwnerListening(state: FightState, owner: DolphinBodyRef): boolean {
  const actor = dolphinBody(state, owner)
  return Boolean(
    actor &&
    paperObserverReady(actor) &&
    paperDolls(actor).some((doll) => doll.active !== false && paperDollMarked(state, owner, doll)),
  )
}
