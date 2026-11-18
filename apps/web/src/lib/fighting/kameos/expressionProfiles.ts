import type { ExpressionProfile } from '../fightExpressionProfiles'
import type { FighterId } from '../types'

/** Support actors have their own direction without becoming selectable duel fighters. */
export const KAMEO_EXPRESSION_PROFILES: Partial<Record<FighterId, ExpressionProfile>> = {
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
