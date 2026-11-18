import {
  documentExists,
  documentPosition,
  paperBodyRef,
  samePaperBody,
  touchesDocument,
} from './paperDocuments'
import { physicalBodyAt } from './fightBodyIdentity'
import { senseDeprived } from './saiyuSenses'
import { displayedDocumentText } from './paperTexture'
import { resolveJudgmentCommunication } from './judgmentCommunication'
import { replaceDocument } from './paperDocumentActions'
import { visibleArenaMap } from './arenaMap'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** Sight reads the actual visible surface, not covered ink or another character's memory. */
export function canReadDocument(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  const actor = state[side]
  if (!documentExists(state, entry) || actor.health <= 0 || senseDeprived(actor, 'sight'))
    return false
  const holder = entry.document!.holder
  if (holder && samePaperBody(holder, paperBodyRef(state, side))) return !entry.document!.outward
  const point = documentPosition(state, entry)
  if (Math.abs(point.x - actor.x) > 6 || Math.abs(point.y - actor.y) > 9) return false
  if ((point.x - actor.x) * actor.facing < -1) return false
  return !holder || outwardDocumentFaces(state, side, entry)
}

function outwardDocumentFaces(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  const holder = entry.document!.holder!
  const actor = physicalBodyAt(state, holder.owner, holder.member)
  return Boolean(actor && entry.document!.outward && (state[side].x - actor.x) * actor.facing >= 0)
}

export function readDocument(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): FightState {
  if (!canReadDocument(state, side, entry)) return state
  return {
    ...state,
    [side]: {
      ...state[side],
      documentReading: {
        id: entry.id,
        text: displayedDocumentText(state, entry),
        frame: state.frame,
        round: state.roundNumber,
        ...(visibleArenaMap(state, entry) ? { arenaMap: visibleArenaMap(state, entry) } : {}),
      },
    },
  }
}

/** An addressed, delivered visual message uses Judgment's ordinary communication contract. */
export function showDocument(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): FightState {
  const holder = entry.document!.holder
  if (!holder || !samePaperBody(holder, paperBodyRef(state, side))) return state
  if (!touchesDocument(state, side, entry)) return state
  const other = side === 'player' ? 'opponent' : 'player'
  const shown = replaceDocument(state, {
    ...entry,
    document: { ...entry.document!, outward: true },
  })
  const document = shown.battlefield!.entities.find((current) => current.id === entry.id)!
  if (!canReadDocument(shown, other, document)) return state
  const communicated = resolveJudgmentCommunication(shown, side, shown[other].id)
  return readDocument(communicated, other, document)
}
