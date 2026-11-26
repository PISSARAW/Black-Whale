/** Closed eye silhouettes shared by catalogue validation and the procedural head. */
export const HUMAN_EYE_SHAPES = ['almond', 'round', 'narrow', 'doll', 'heavy'] as const

export type HumanEyeShape = (typeof HUMAN_EYE_SHAPES)[number]

/** Optional, panel-attested refinements layered over the coarse face category. */
export interface HumanFaceFeatures {
  eyes: HumanEyeShape
  cheek: number
  jaw: number
  chin: number
  brow: number
  nose: number
  mouth: number
  neck: number
  headY: number
}
