import type { GumSource } from './bungeeSource'
import type { FightSide } from './types'

export type IllumiNeedleMode = 'needle-people' | 'face-warp' | 'condition'
export interface NeedleFace {
  owner: FightSide
  member: number
  origin: GumSource
  needles: readonly [string, string, string]
  mediumCopyId?: string
  reshaping: boolean
}
export interface DetachedFaceNeedles {
  needles: readonly [string, string, string]
  mediumCopyId?: string
  velocityY?: number
}
declare module './types' {
  interface FightImpact {
    illumiNeedleMode?: IllumiNeedleMode
  }
  interface ArcadeFighter {
    illumiNeedleMode?: IllumiNeedleMode
    illumiNeedleGeneration?: number
    needleFace?: NeedleFace
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    detachedFaceNeedles?: DetachedFaceNeedles
  }
}
