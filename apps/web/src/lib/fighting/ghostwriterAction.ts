import { GHOSTWRITER_CONDITIONS } from './ghostwriterPresentation'
import { freeDeviceHand, physicalHandOccupancy } from './deviceHands'
import { canAct } from './fightActorState'
import { physicalBodyKey } from './fightBodyIdentity'
import { replaceDocument } from './paperDocumentActions'
import { documentById } from './paperDocuments'
import { arsenalMindAvailable } from './arsenalMind'
import {
  ghostwriterChannelReady,
  ghostwriterMaterialsReady,
  ghostwriterSheet,
  fortuneMonth,
} from './ghostwriterAccess'
import type { FortuneMonth } from './ghostwriterTypes'
import type { ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Duel preparation and aura tuning; the poem concerns the declared month, not these 90 frames. */
const WRITING_FRAMES = 90
export function performGhostwriter(state: FightState, side: FightSide, id?: string): FightState {
  if (!canBeginGhostwriter(state, side)) return state
  if (!ghostwriterMaterialsReady(state, side)) return state
  const sheet = requestedFortuneSheet(state, side, id)
  if (!sheet || sheet.document!.text !== fortuneIdentity(sheet)) return state
  return beginAutomaticWriting(state, side, sheet)
}
function requestedFortuneSheet(state: FightState, side: FightSide, id?: string) {
  if (id) return ghostwriterSheet(state, side, id)
  return state.battlefield?.entities.find((entry) =>
    Boolean(ghostwriterSheet(state, side, entry.id)),
  )
}
function canBeginGhostwriter(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  return canAct(actor) && !actor.attack && actor.aura >= 12 && ghostwriterChannelReady(state, side)
}
function beginAutomaticWriting(
  state: FightState,
  side: FightSide,
  sheet: import('./preparationTypes').PreparedEntity,
): FightState {
  const actor = state[side],
    month = fortuneMonth(state, sheet)
  return {
    ...state,
    [side]: {
      ...actor,
      aura: actor.aura - 12,
      arenaRecovery: WRITING_FRAMES + 1,
      ghostwriterWriting: {
        sheetId: sheet.id,
        monthId: month?.id ?? sheet.document!.fortuneMonthId!,
        hand: freeDeviceHand(state, side)!,
        kitId: actor.writingKit!.sourceId,
        signatureText: sheet.document!.text,
        frames: WRITING_FRAMES,
        health: actor.health,
        x: actor.x,
        y: actor.y,
        verses: month ? monthVerses(month) : undefined,
        progress: 0,
      },
    },
  }
}
function fortuneIdentity(sheet: import('./preparationTypes').PreparedEntity): string {
  const identity = sheet.document!.fortuneSignature!
  return `${identity.name}\n${identity.dateOfBirth}\n${identity.bloodType}`
}
function monthVerses(month: FortuneMonth): string {
  return month.weeks
    .filter((week) => !month.deathWeek || week.week <= month.deathWeek)
    .map((week) => week.quatrain)
    .join('\n\n')
}
function writingInterrupted(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    work = actor.ghostwriterWriting!
  if (writerBodyInterrupted(state, side)) return true
  if (state.pvpSeat && side === 'opponent') return false
  return (
    !ghostwriterChannelReady(state, side) ||
    !ghostwriterMaterialsReady(state, side) ||
    actor.writingKit?.sourceId !== work.kitId ||
    physicalHandOccupancy(state, side).has(work.hand) ||
    !ghostwriterSheet(state, side, work.sheetId)
  )
}
function writerBodyInterrupted(state: FightState, side: FightSide): boolean {
  const actor = state[side],
    work = actor.ghostwriterWriting!
  return (
    !arsenalMindAvailable(actor) ||
    Boolean(actor.attack) ||
    actor.hitStun > 0 ||
    actor.knockdownFrames > 0 ||
    actor.health < work.health ||
    Math.hypot(actor.x - work.x, actor.y - work.y) > 1
  )
}
export function advanceGhostwriter(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const actor = next[side],
      work = actor.ghostwriterWriting
    if (!work) continue
    const interrupted = writingInterrupted(next, side)
    if (interrupted) {
      next = { ...next, [side]: { ...actor, ghostwriterWriting: undefined } }
      continue
    }
    const frames = work.frames - 1
    next = writeFortuneProgress(next, side, frames)
    next = {
      ...next,
      [side]: {
        ...next[side],
        ghostwriterWriting:
          frames <= 0 ? undefined : { ...work, frames, progress: WRITING_FRAMES - frames },
      },
    }
  }
  return next
}
function writeFortuneProgress(state: FightState, side: FightSide, frames: number): FightState {
  const work = state[side].ghostwriterWriting!,
    sheet = documentById(state, work.sheetId)!
  if (work.verses === undefined) return state // A private predictor cannot fabricate the hidden future.
  const fraction = (WRITING_FRAMES - frames) / WRITING_FRAMES
  const written = work.verses.slice(0, Math.floor(work.verses.length * fraction))
  const month = fortuneMonth(state, sheet)
  return replaceDocument(state, {
    ...sheet,
    document: {
      ...sheet.document!,
      fortuneInk: state[side].writingKit?.copyId
        ? { copyId: state[side].writingKit!.copyId!, originalText: work.signatureText }
        : undefined,
      text: `${work.signatureText}\n\n${written}`,
      fortuneWritten:
        frames > 0
          ? undefined
          : {
              monthId: work.monthId,
              weeks:
                month?.weeks.filter((week) => !month.deathWeek || week.week <= month.deathWeek)
                  .length ?? 0,
              writerBodyKey: physicalBodyKey(state, side),
            },
    },
  })
}
export function ghostwriterOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!ghostwriterChannelReady(state, side)) return []
  const sheets = (state.battlefield?.entities ?? []).filter(
    (entry) => entry.document?.fortuneSignature,
  )
  if (!sheets.length)
    return [
      {
        command: { action: 'history-ghostwriter' },
        ready: false,
        labelFr: 'Lovely Ghostwriter · Fournir une identité et un mois',
        labelEn: 'Lovely Ghostwriter · Provide an identity and a month',
        conditionFr: GHOSTWRITER_CONDITIONS.fr,
        conditionEn: GHOSTWRITER_CONDITIONS.en,
      },
    ]
  return sheets.map((entry) => ({
    command: { action: 'history-ghostwriter', target: entry.id },
    labelFr: 'Lovely Ghostwriter · Écrire le mois du participant',
    labelEn: 'Lovely Ghostwriter · Write the participant’s month',
    ready: performGhostwriter(state, side, entry.id) !== state,
    conditionFr: GHOSTWRITER_CONDITIONS.fr,
    conditionEn: GHOSTWRITER_CONDITIONS.en,
  }))
}
