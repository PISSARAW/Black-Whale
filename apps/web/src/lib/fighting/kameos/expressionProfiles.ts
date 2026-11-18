import type { ExpressionProfile } from '../fightExpressionProfiles'
import type { FighterId } from '../types'

/** Support actors have their own direction without becoming selectable duel fighters. */
export const KAMEO_EXPRESSION_PROFILES: Partial<Record<FighterId, ExpressionProfile>> = {
  salesale: {
    direction:
      'Assurance festive, regard étroit et large sourire denté ; souffle ample et douleur prioritaire.',
    eye: 0.86,
    brow: -0.02,
    smile: 0.35,
    intensity: 0.94,
    shoulder: 0.01,
    eyeResponse: 0.9,
    browResponse: 0.95,
    bodyResponse: 1,
    opening: 0.36,
    gaze: 0.0035,
  },
  luzurus: {
    direction:
      'Détente nonchalante, paupières lourdes et léger sourire ; attention au piège, douleur prioritaire.',
    eye: 0.86,
    brow: -0.035,
    smile: 0.07,
    intensity: 0.88,
    shoulder: 0.006,
    eyeResponse: 0.82,
    browResponse: 0.9,
    bodyResponse: 0.8,
    opening: 0.36,
    gaze: 0.0038,
  },
  morena: {
    direction:
      'Sourire calme et invitation troublante ; attention douce, effort retenu et douleur immédiate.',
    eye: 0.98,
    brow: -0.035,
    smile: 0.22,
    intensity: 0.88,
    shoulder: 0.005,
    eyeResponse: 0.9,
    browResponse: 0.8,
    bodyResponse: 0.65,
    opening: 0.36,
    gaze: 0.004,
  },
  zhanglei: {
    direction:
      'Assurance paisible et regard mi-clos ; effort mesuré, plis nasaux souples et douleur contenue.',
    eye: 0.93,
    brow: 0.008,
    smile: 0.085,
    intensity: 0.72,
    shoulder: 0.006,
    eyeResponse: 0.7,
    browResponse: 0.25,
    bodyResponse: 0.6,
    opening: 0.32,
    gaze: 0.003,
  },
  marayam: {
    direction:
      'Curiosité timide, sursaut inquiet, concentration et douleur lisibles sur son visage enfantin.',
    eye: 1.04,
    brow: -0.07,
    smile: 0.025,
    intensity: 1.02,
    shoulder: 0.0065,
    eyeResponse: 0.65,
    browResponse: 1.05,
    bodyResponse: 0.7,
    opening: 0.42,
    gaze: 0.004,
  },
  tubeppa: {
    direction: 'Concentration analytique, geste précis et douleur contenue derrière les lunettes.',
    eye: 0.94,
    brow: 0.09,
    smile: 0,
    intensity: 0.82,
    shoulder: 0.006,
    eyeResponse: 0.85,
    browResponse: 0.9,
    bodyResponse: 0.65,
    opening: 0.38,
    gaze: 0.0035,
  },
}
