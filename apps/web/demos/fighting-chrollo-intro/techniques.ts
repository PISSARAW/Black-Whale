/** The checklist shown on screen, in the order the reel introduces them. */
export const TECHNIQUES = [
  'TEN',
  'REN',
  'KO',
  'COMBO',
  'RYU',
  'THROW',
  'ZETSU',
  'IN',
  'HATSU',
  'GYO',
  'KEN',
  'SHU',
  'ON',
] as const

/** Maps an engine status from `nenStatus` (ten, ko:hands, gyo-faible…) to its label. */
export function techniqueOf(status: string): string {
  const base = status.split(':')[0].split('-')[0]
  return base.toUpperCase()
}
