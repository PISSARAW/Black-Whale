import { canAct } from './fightActorState'
import { freeDeviceHand, physicalHandsBusy } from './deviceHands'
import { spendWritingSheet, writingPaperExists } from './bashoMaterials'
import {
  documentById,
  documentPosition,
  paperBodyRef,
  samePaperBody,
  touchesDocument,
} from './paperDocuments'
import { readDocument, showDocument } from './paperDocumentReading'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function performPaperDocumentCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!state.battlefield || !canAct(actor) || actor.attack) return state
  const entry = documentById(state, command.target)
  if (command.action === 'document-read') return entry ? readDocument(state, side, entry) : state
  if (actor.hanzoProjection || physicalHandsBusy(actor)) return state
  if (command.action === 'document-draw') return drawDocument(state, side)
  if (!entry) return state
  return handleHeldDocument(state, side, { entry, command })
}

function handleHeldDocument(
  state: FightState,
  side: FightSide,
  { entry, command }: { entry: PreparedEntity; command: ArsenalCommand },
): FightState {
  if (command.action === 'document-show') return showDocument(state, side, entry)
  return command.action === 'document-drop'
    ? dropDocument(state, side, entry)
    : takeDocument(state, side, entry)
}

function takeDocument(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  const hand = freeDeviceHand(state, side)
  if (!hand || entry.document!.holder || !touchesDocument(state, side, entry)) return state
  return replaceDocument(state, {
    ...entry,
    document: {
      ...entry.document!,
      outward: false,
      holder: { ...paperBodyRef(state, side), hand },
      velocityY: 0,
    },
  })
}

function dropDocument(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  const holder = entry.document!.holder
  if (!holder || !samePaperBody(holder, paperBodyRef(state, side))) return state
  const point = documentPosition(state, entry)
  return replaceDocument(state, {
    ...entry,
    ...point,
    document: {
      ...entry.document!,
      holder: undefined,
      outward: false,
      velocityY: 0,
    },
  })
}

function drawDocument(state: FightState, side: FightSide): FightState {
  const hand = freeDeviceHand(state, side)
  const kit = state[side].writingKit
  if (!hand || !kit || kit.sheets <= 0 || !writingPaperExists(state, kit.copyId)) return state
  const spent = spendWritingSheet(state, side)
  const entry: PreparedEntity = {
    id: spent.paperId,
    kind: 'paper',
    owner: side,
    x: state[side].x,
    y: state[side].y + 6,
    health: 2,
    present: true,
    material: kit.copyId ? 'nen' : 'real',
    document: {
      text: '',
      sheetCopyId: kit.copyId,
      holder: { ...paperBodyRef(state, side), hand },
      outward: false,
    },
  }
  return {
    ...spent.state,
    battlefield: {
      ...spent.state.battlefield!,
      entities: [...spent.state.battlefield!.entities, entry],
    },
  }
}

export function replaceDocument(state: FightState, entry: PreparedEntity): FightState {
  return {
    ...state,
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.map((current) =>
        current.id === entry.id ? entry : current,
      ),
    },
  }
}
