import { visibleFortunePortrait } from './ghostwriterAccess'
import { canReadDocument } from './paperDocumentReading'
import { displayedDocumentText } from './paperTexture'
import type { FightSide, FightState } from './types'

/** Nobody receives the still-unwritten future or the automatic writer's unremembered text. */
export function concealFortuneWorld(state: FightState, viewer: FightSide): void {
  state.fortuneMonths = undefined
  for (const side of ['player', 'opponent'] as const) {
    const work = state[side].ghostwriterWriting
    if (work)
      state[side].ghostwriterWriting = {
        ...work,
        verses: undefined,
        signatureText: side === viewer ? work.signatureText : '',
      }
  }
  if (!state.battlefield) return
  state.battlefield.entities = state.battlefield.entities.map((entry) => {
    if (!entry.document) return entry
    const read = canReadDocument(state, viewer, entry)
    const unmasked = read && displayedDocumentText(state, entry) === entry.document.text
    return {
      ...entry,
      document: {
        ...entry.document,
        fortuneSignature: unmasked ? entry.document.fortuneSignature : undefined,
        fortuneInk: entry.document.fortuneInk
          ? { copyId: entry.document.fortuneInk.copyId }
          : undefined,
        fortunePortrait: read ? visibleFortunePortrait(state, entry) : undefined,
        fortuneWritten: read ? entry.document.fortuneWritten : undefined,
      },
    }
  })
}
