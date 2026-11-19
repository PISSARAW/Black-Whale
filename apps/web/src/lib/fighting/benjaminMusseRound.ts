import type { ArcadeFighter } from './types'
import { secretWindowNenActive } from './secretWindowAccess'

/** A score reset is neither a new Musse inheritance nor an interruption of a surviving owl. */
export function carryMusseHistory(fresh: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  const archive = previous.hatsuEffects.baton?.musseArchive
  if (!archive || !fresh.hatsuEffects.baton) return fresh
  const owl =
    previous.secretWindow?.musseInheritance === 'canon373' && secretWindowNenActive(previous)
      ? previous.secretWindow
      : undefined
  return {
    ...fresh,
    secretWindow: owl ?? fresh.secretWindow,
    hatsuEffects: {
      ...fresh.hatsuEffects,
      baton: {
        ...fresh.hatsuEffects.baton,
        musseArchive: archive,
        markedTarget: owl?.target ?? null,
      },
    },
  }
}
