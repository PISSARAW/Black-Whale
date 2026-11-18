import { displayedDocumentText } from './paperTexture'
import { canReadDocument } from './paperDocumentReading'
import { paperBodyRef, samePaperBody } from './paperDocuments'
import type { FightSide, FightState } from './types'

/** A private view receives the surface seen now, never covered ink or a foreign author's layers. */
export function concealDocumentWorld(state: FightState, viewer: FightSide): void {
  const field = state.battlefield
  if (!field) return
  const owner = paperBodyRef(state, viewer)
  field.entities = field.entities.map((entry) => {
    const paper = entry.document
    if (!paper) return entry
    const text = canReadDocument(state, viewer, entry) ? displayedDocumentText(state, entry) : ''
    const own = paper.textures?.filter((layer) => samePaperBody(layer.owner, owner))
    return {
      ...entry,
      document: { ...paper, text, appearanceText: text, textures: own?.length ? own : undefined },
    }
  })
}
