import { limbInjury, surfaceInjury, type InjuryPreparation } from './injuryPreparation'
import type { FightSide } from './types'

export function selectInjury(options: {
  injuries: InjuryPreparation
  side: FightSide
  group: 'limbs' | 'surfaces'
  checked: boolean
}): InjuryPreparation {
  const { injuries, side, group, checked } = options
  const limbs = group === 'limbs' ? checked : limbInjury(injuries[side])
  const surfaces = group === 'surfaces' ? checked : surfaceInjury(injuries[side])
  const next = { ...injuries }
  if (!limbs && !surfaces) delete next[side]
  else
    next[side] =
      limbs && surfaces ? 'post-explosion' : limbs ? 'hand-and-lower-leg' : 'face-and-neck'
  return next
}
