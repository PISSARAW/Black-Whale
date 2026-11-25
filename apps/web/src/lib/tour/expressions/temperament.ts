import { EXPRESSION_CONTROLS, EXPRESSION_REST, type ExpressionPose } from './types'

export interface ExpressionTemperament {
  intensity: number
  eyeResponse?: number
  browResponse?: number
  bodyResponse?: number
  mouth?: string
}
const EYES = new Set<keyof ExpressionPose>(['eye', 'eyeAsymmetry', 'gaze', 'gazeY'])
const BROWS = new Set<keyof ExpressionPose>(['brow', 'lift', 'browAsymmetry', 'noseWrinkle'])
const BODY = new Set<keyof ExpressionPose>([
  'headPitch',
  'headYaw',
  'headRoll',
  'shoulder',
  'tremble',
])
const MOUTH = new Set<keyof ExpressionPose>([
  'teeth',
  'smile',
  'frown',
  'jaw',
  'effort',
  'pain',
  'mouthWidth',
  'mouthPress',
  'mouthSkew',
  'cheekRaise',
  'nostrilFlare',
])
export function temperExpression(
  pose: ExpressionPose,
  temperament: ExpressionTemperament,
): ExpressionPose {
  const result = { ...pose }
  for (const key of EXPRESSION_CONTROLS) {
    const gain = response(key, temperament) * Math.min(1, temperament.intensity)
    result[key] = EXPRESSION_REST[key] + (pose[key] - EXPRESSION_REST[key]) * gain
  }
  return result
}
function response(key: keyof ExpressionPose, temperament: ExpressionTemperament) {
  if (EYES.has(key)) return temperament.eyeResponse ?? 1
  if (BROWS.has(key)) return temperament.browResponse ?? 1
  if (BODY.has(key)) return temperament.bodyResponse ?? 1
  if (MOUTH.has(key) && temperament.mouth) return 0
  if (temperament.mouth === 'still') return 0
  return 1
}
export function tourTemperament(identity: string): ExpressionTemperament {
  if (identity === 'illumi')
    return { intensity: 0.15, eyeResponse: 0, browResponse: 0, bodyResponse: 0.2, mouth: 'still' }
  if (identity === 'bonolenov')
    return { intensity: 0.72, eyeResponse: 0, browResponse: 0, mouth: 'covered' }
  if (identity === 'feitan') return { intensity: 1, mouth: 'covered' }
  if (identity === 'chrollo' || identity === 'machi') return { intensity: 0.58 }
  if (identity === 'shizuku') return { intensity: 0.38, eyeResponse: 0.5, browResponse: 0.35 }
  return { intensity: 1 }
}
