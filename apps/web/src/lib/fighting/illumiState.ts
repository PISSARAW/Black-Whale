import type { ArcadeFighter, FightSide } from './types'

export type NeedleOrder = 'stay' | 'approach' | 'retreat'
export interface IllumiState {
  mediumCopyId?: string
  order: NeedleOrder
  disguised: boolean
  preparation: number
  anchor?: { x: number; y: number }
}
export interface NeedlePuppet {
  mediumCopyId?: string
  owner: FightSide
  order: NeedleOrder
  needleEmbedded: boolean
}

export const ILLUMI_IMPLANT = 'illumi:neutralSpecial'
export const ILLUMI_DISGUISE = 'illumi:backSpecial'
/** Duel timings and costs; the manga does not give these numbers. */
export const ILLUMI_DISGUISE_FRAMES = 30
export const ILLUMI_DISGUISE_COST = 20
export const ILLUMI_IMPLANT_COST = 40

export function illumiState(fighter: ArcadeFighter): IllumiState {
  return fighter.illumi ?? { order: 'stay', disguised: false, preparation: 0 }
}

/** Needle People destroys autonomy. Consuming its needle does not undo the brain injury. */
export function needleAutonomy(fighter: ArcadeFighter): boolean {
  return !fighter.needlePuppet
}

export function illumiPreparing(fighter: ArcadeFighter): boolean {
  return (fighter.illumi?.preparation ?? 0) > 0
}

export function illumiBodyFree(fighter: ArcadeFighter): boolean {
  return (
    !fighter.arsenalSleep &&
    !fighter.clothCapture &&
    needleAutonomy(fighter) &&
    !fighter.blackVoiceControl?.active &&
    !illumiPreparing(fighter)
  )
}
