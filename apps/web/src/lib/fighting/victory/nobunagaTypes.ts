import type { VictoryContext } from './types'

/** Presentation-only contract: Nobunaga is not a playable FighterId yet. */
export type NobunagaContext = Pick<
  VictoryContext,
  | 'scene'
  | 'camera'
  | 'hero'
  | 'victim'
  | 'age'
  | 'centre'
  | 'gap'
  | 'comfort'
  | 'save'
  | 'material'
  | 'defer'
  | 'add'
>
export const NOBUNAGA_ENTRY = 300
export const NOBUNAGA_CONTACT = 308
export const NOBUNAGA_FALL = 390
export const NOBUNAGA_SHEATH = 510
export const NOBUNAGA_EN_RADIUS = 4
