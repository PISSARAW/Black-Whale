/** Facial controls use authored head coordinates, never gameplay state. */
export interface ExpressionPose {
  eye: number
  brow: number
  lift: number
  effort: number
  pain: number
  smile: number
  headPitch: number
  headYaw: number
  gaze: number
  headRoll: number
  shoulder: number
  frown: number
  teeth: number
  jaw: number
  mouthWidth: number
  mouthPress: number
  mouthSkew: number
  browAsymmetry: number
  eyeAsymmetry: number
  gazeY: number
  tremble: number
  tears: number
  sweat: number
  blush: number
  pallor: number
  noseWrinkle: number
  cheekRaise: number
  nostrilFlare: number
}

export const EXPRESSION_REST: Readonly<ExpressionPose> = {
  eye: 1,
  brow: 0,
  lift: 0,
  effort: 0,
  pain: 0,
  smile: 0,
  headPitch: 0,
  headYaw: 0,
  gaze: 0,
  headRoll: 0,
  shoulder: 0,
  frown: 0,
  teeth: 0,
  jaw: 0,
  mouthWidth: 0,
  mouthPress: 0,
  mouthSkew: 0,
  browAsymmetry: 0,
  eyeAsymmetry: 0,
  gazeY: 0,
  tremble: 0,
  tears: 0,
  sweat: 0,
  blush: 0,
  pallor: 0,
  noseWrinkle: 0,
  cheekRaise: 0,
  nostrilFlare: 0,
}
export const EXPRESSION_CONTROLS = Object.keys(EXPRESSION_REST) as (keyof ExpressionPose)[]
export interface ExpressionDefinition {
  id: string
  label: string
  family: string
  pose: Readonly<ExpressionPose>
  /** Looped expressive breath; blink rate 0 intentionally holds the gaze. */
  rhythm: 'still' | 'breath' | 'laugh' | 'sob' | 'tremble'
  blink: number
}
export interface ExpressionCue {
  id: string
  intensity?: number
  /** Same seconds clock as the figure's animation. Omit duration to hold. */
  start?: number
  duration?: number
  fade?: number
  secondary?: { id: string; weight: number }
}
