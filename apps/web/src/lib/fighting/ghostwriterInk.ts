import { historicalPartExists } from './historicalCopyLifetime'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

declare module './paperDocumentTypes' {
  interface PaperDocument {
    fortuneInk?: { copyId: string; originalText?: string }
  }
}

/** Deposited copied ink is a detached part: breaking the ink pot does not erase it. */
export function cleanFortuneInk(state: FightState, entry: PreparedEntity): PreparedEntity {
  const ink = entry.document?.fortuneInk
  if (!ink || historicalPartExists(state, ink.copyId)) return entry
  // A private predictor has no authority to reconstruct handwriting hidden under a cover.
  if (ink.originalText === undefined) return entry
  return {
    ...entry,
    document: {
      ...entry.document!,
      text: ink.originalText,
      fortuneInk: undefined,
      fortuneWritten: undefined,
    },
  }
}
