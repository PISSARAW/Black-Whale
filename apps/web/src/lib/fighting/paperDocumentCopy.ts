import { displayedDocumentText } from './paperTexture'
import { visibleArenaMap } from './arenaMap'
import { paperBodyRef } from './paperDocuments'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

/** An inert facsimile retains the reproduced appearance, without transferring its author's Nen. */
export function copiedDocumentMaterials(
  state: FightState,
  context: { source: PreparedEntity; id: string; side: FightSide },
): Partial<PreparedEntity> {
  if (!context.source.document) return {}
  return {
    health: context.source.health,
    document: {
      text: displayedDocumentText(state, context.source),
      arenaMap: visibleArenaMap(state, context.source),
      sheetCopyId: context.id,
      holder: { ...paperBodyRef(state, context.side), hand: 'right' },
      outward: false,
    },
  }
}
