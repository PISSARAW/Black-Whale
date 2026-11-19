import { cleanFortuneInk } from './ghostwriterInk'
import { newGumSource, sameGumSource, type GumSource } from './bungeeSource'
import { textureOriginAvailable, createTextureSurprise } from './hisokaTextureOrigin'
import { physicalBodyKey } from './fightBodyIdentity'
import { dolphinBody } from './dolphinBodies'
import { equippedDolphin } from './dolphinBorrowing'
import { showDocument } from './paperDocumentReading'
import {
  documentById,
  documentExists,
  paperBodyRef,
  samePaperBody,
  touchesDocument,
} from './paperDocuments'
import { DOCUMENT_TEXT_LENGTH, type PaperTexture } from './paperDocumentTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function paperTextureReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  const entry = documentById(state, actor.texturePaperId)
  return Boolean(
    entry &&
    typeof actor.texturePaperDraft === 'string' &&
    actor.texturePaperDraft.length <= DOCUMENT_TEXT_LENGTH &&
    touchesDocument(state, side, entry) &&
    changesPaperSurface(state, side, entry),
  )
}

function changesPaperSurface(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  const latest = entry.document?.textures?.at(-1)
  if (!latest || !paperTextureLive(state, entry, latest)) return true
  return (
    !samePaperBody(latest.owner, paperBodyRef(state, side)) ||
    !sameGumSource(latest, state[side].attack?.nenOrigin ?? newGumSource(state[side])) ||
    latest.text !== state[side].texturePaperDraft
  )
}

/** A document is a separate physical support; covering it does not replace a body disguise. */
export function applySelectedTexture(state: FightState, side: FightSide): FightState {
  if (state[side].textureTarget === 'paper') return applyPaperTexture(state, side)
  const textureSurprise = createTextureSurprise(state[side])
  return textureSurprise ? { ...state, [side]: { ...state[side], textureSurprise } } : state
}

function applyPaperTexture(state: FightState, side: FightSide): FightState {
  if (!paperTextureReady(state, side)) return state
  const actor = state[side]
  const entry = documentById(state, actor.texturePaperId)!
  const source = actor.attack?.nenOrigin ?? newGumSource(actor)
  const owner = paperBodyRef(state, side)
  const generation = (actor.paperTextureGeneration ?? 0) + 1
  const layer: PaperTexture = {
    ...source,
    owner,
    text: actor.texturePaperDraft!,
    id: `paper-texture:${physicalBodyKey(state, side)}:${generation}`,
  }
  const kept = (entry.document!.textures ?? []).filter(
    (previous) => !samePaperBody(previous.owner, owner) || !sameGumSource(previous, source),
  )
  const applied: FightState = {
    ...state,
    [side]: { ...actor, paperTextureGeneration: generation },
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.map((current) =>
        current.id === entry.id
          ? {
              ...current,
              document: {
                ...current.document!,
                textures: [...kept, layer],
                appearanceText: undefined,
              },
            }
          : current,
      ),
    },
  }
  const current = documentById(applied, entry.id)!
  const holder = current.document!.holder
  return current.document!.outward && holder && samePaperBody(holder, owner)
    ? showDocument(applied, side, current)
    : applied
}

export function paperTextureLive(
  state: FightState,
  entry: PreparedEntity,
  layer: PaperTexture,
): boolean {
  if (!documentExists(state, entry)) return false
  const actor = dolphinBody(state, layer.owner)
  return Boolean(actor && textureOriginAvailable(state, { actor, source: layer }))
}

export function displayedDocumentText(state: FightState, entry: PreparedEntity): string {
  const paper = cleanFortuneInk(state, entry).document
  if (!paper) return ''
  if (paper.appearanceText !== undefined) return paper.appearanceText
  const layers = (paper.textures ?? []).filter((layer) => paperTextureLive(state, entry, layer))
  return layers.at(-1)?.text ?? paper.text
}

export function advancePaperTextures(state: FightState): FightState {
  const field = state.battlefield
  if (!field) return state
  const entities = field.entities.map((entry) => {
    const layers = entry.document?.textures
    if (!layers?.length) return entry
    const live = layers.filter((layer) => paperTextureLive(state, entry, layer))
    return live.length === layers.length
      ? entry
      : {
          ...entry,
          document: {
            ...entry.document!,
            textures: live.length ? live : undefined,
          },
        }
  })
  return entities.some((entry, index) => entry !== field.entities[index])
    ? { ...state, battlefield: { ...field, entities } }
    : state
}

export function clearPaperTextures(
  state: FightState,
  side: FightSide,
  scope: GumSource,
): FightState {
  const owner = paperBodyRef(state, side)
  const field = state.battlefield
  if (!field) return state
  const entities = field.entities.map((entry) => {
    const layers = entry.document?.textures
    if (!layers?.length) return entry
    const kept = layers.filter(
      (layer) => !samePaperBody(layer.owner, owner) || !sameGumSource(layer, scope),
    )
    return kept.length === layers.length
      ? entry
      : {
          ...entry,
          document: {
            ...entry.document!,
            textures: kept.length ? kept : undefined,
          },
        }
  })
  return entities.some((entry, index) => entry !== field.entities[index])
    ? { ...state, battlefield: { ...field, entities } }
    : state
}

export function borrowedPaperTextureBusy(state: FightState, side: FightSide): boolean {
  const owner = paperBodyRef(state, side)
  const scope = { source: 'dolphin' as const, theftId: equippedDolphin(state[side])?.theftId }
  return (state.battlefield?.entities ?? []).some((entry) =>
    entry.document?.textures?.some(
      (layer) =>
        samePaperBody(layer.owner, owner) &&
        sameGumSource(layer, scope) &&
        paperTextureLive(state, entry, layer),
    ),
  )
}

export function anyPaperTextureBusy(state: FightState): boolean {
  return Boolean(
    state.battlefield?.entities.some((entry) =>
      entry.document?.textures?.some((layer) => paperTextureLive(state, entry, layer)),
    ),
  )
}
