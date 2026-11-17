import type { FighterId } from '../types'
import type { PredatorPreyId } from '../predatorTypes'

export const RIHAN_TIMING = {
  birth: 78,
  anchor: 144,
  bite: 282,
  consumed: 342,
  dismissed: 366,
  shot: 384,
  fall: 396,
}
export interface RihanPlan {
  kind: 'vacuum' | 'filament' | 'physical'
  prey: PredatorPreyId | null
  name: string
}
/** A tailored cinematic design needs an identified construct; no guess at an unknown Hatsu. */
export function rihanPlan(target: FighterId): RihanPlan {
  if (target === 'shizuku') return { kind: 'vacuum', prey: 'blinky', name: 'Deme-chan' }
  if (target === 'hisoka') return { kind: 'filament', prey: 'bungee-gum', name: 'Bungee Gum' }
  return { kind: 'physical', prey: null, name: '' }
}
