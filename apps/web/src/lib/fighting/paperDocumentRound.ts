import type { ArcadeFighter } from './types'

/** Resetting the round supplies no new kit or paper stock in a body's carried inventory. */
export function carryDocumentState(actor: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  if (
    !actor.writingKit &&
    !previous.writingKit &&
    !previous.documentReading &&
    !previous.dowsingMapReading &&
    previous.paperTextureGeneration === undefined
  )
    return actor
  return {
    ...actor,
    writingKit: previous.writingKit,
    documentReading: previous.documentReading,
    dowsingMapReading: previous.dowsingMapReading,
    paperTextureGeneration: previous.paperTextureGeneration,
    texturePaperId: previous.texturePaperId,
    texturePaperDraft: previous.texturePaperDraft,
  }
}
