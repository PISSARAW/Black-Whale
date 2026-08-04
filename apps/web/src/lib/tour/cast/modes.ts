/**
 * The four closed lists the walk chooses a behaviour from.
 *
 * A leaf on purpose: `types.ts`, `world.ts`, `worldPieces.ts` and `report.ts`
 * all name these, and a module that imports nothing of theirs is what keeps
 * that from being a circle. `types.ts` re-exports them, so no import outside
 * this folder changes.
 */
export const OWL_MODES = ['wander', 'shoulder', 'random'] as const
export const DOUBLE_MODES = ['follow', 'wander', 'scout'] as const
export const EYE_MODES = ['pilot', 'scout', 'film'] as const
export const TUNES = ['bloom', 'scatter', 'dance'] as const

export type TourTune = (typeof TUNES)[number]
export type TourOwlMode = (typeof OWL_MODES)[number]
export type TourDoubleMode = (typeof DOUBLE_MODES)[number]
export type TourEyeMode = (typeof EYE_MODES)[number]
