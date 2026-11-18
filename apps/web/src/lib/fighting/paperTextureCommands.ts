import { canAct } from './fightActorState'
import { textureSelectable } from './hisokaTextureCommands'
import { newGumSource, sameGumSource } from './bungeeSource'
import { documentById, paperBodyRef, samePaperBody, touchesDocument } from './paperDocuments'
import { DOCUMENT_TEXT_LENGTH } from './paperDocumentTypes'
import { replaceDocument } from './paperDocumentActions'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

export function performPaperTextureCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!canAct(actor) || actor.attack) return state
  if (command.action === 'texture-paper-remove')
    return removePaperLayer(state, side, command.target)
  if (!textureSelectable(actor)) return state
  if (command.action === 'texture-paper-text') return preparePaperText(state, side, command.target)
  const entry = documentById(state, command.target)
  if (!entry || !touchesDocument(state, side, entry)) return state
  return {
    ...state,
    [side]: {
      ...actor,
      textureTarget: 'paper',
      texturePaperId: entry.id,
      texturePaperDraft: actor.texturePaperDraft ?? '',
    },
  }
}

function preparePaperText(state: FightState, side: FightSide, text?: string): FightState {
  if (
    typeof text !== 'string' ||
    text.length > DOCUMENT_TEXT_LENGTH ||
    text === state[side].texturePaperDraft
  )
    return state
  return { ...state, [side]: { ...state[side], texturePaperDraft: text } }
}

function removePaperLayer(state: FightState, side: FightSide, id?: string): FightState {
  const entry = documentById(state, id)
  const layers = entry?.document?.textures
  if (!entry || !layers?.length) return state
  const owner = paperBodyRef(state, side)
  const origin = newGumSource(state[side])
  const kept = layers.filter(
    (layer) => !samePaperBody(layer.owner, owner) || !sameGumSource(layer, origin),
  )
  return kept.length === layers.length
    ? state
    : replaceDocument(state, {
        ...entry,
        document: { ...entry.document!, textures: kept.length ? kept : undefined },
      })
}
