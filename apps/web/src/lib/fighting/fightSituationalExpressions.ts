import type { ArcadeFighter } from './types'
import type { ExpressionProfile } from './fightExpressionProfiles'
import type { FightFacePose } from './fightExpressions'

export type FightSituation =
  'concentration' | 'vigilance' | 'fatigue' | 'determination' | 'charging' | 'alarm' | 'confidence'

/** Read combat state only; expressions never create a gameplay effect. */
export function fightSituation(fighter: ArcadeFighter): FightSituation {
  if (fighter.chainJail) return 'alarm'
  if (fighter.auraExhausted) return 'fatigue'
  if (fighter.hatsuChargeFrames > 0 && fighter.nen.in) return 'charging'
  if (fighter.health <= fighter.maxHealth * 0.3) return 'determination'
  if (fighter.blocking || fighter.pose === 'guard') return 'vigilance'
  if (fighter.nen.mode === 'ren') return 'confidence'
  return 'concentration'
}

interface SituationShape {
  eye: number
  brow: number
  lift: number
  mouth: number
  smile: number
  pitch: number
  roll: number
}

const SHAPES: Partial<Record<FightSituation, SituationShape>> = {
  vigilance: {
    eye: -0.12,
    brow: 0.14,
    lift: -0.003,
    mouth: 0.12,
    smile: -1,
    pitch: 0.025,
    roll: 0,
  },
  fatigue: {
    eye: -0.32,
    brow: -0.12,
    lift: -0.005,
    mouth: 0.24,
    smile: -1,
    pitch: 0.08,
    roll: 0.025,
  },
  determination: {
    eye: -0.2,
    brow: 0.24,
    lift: -0.006,
    mouth: 0.32,
    smile: -1,
    pitch: -0.045,
    roll: 0,
  },
  charging: {
    eye: -0.26,
    brow: 0.19,
    lift: -0.004,
    mouth: 0.55,
    smile: -1,
    pitch: -0.025,
    roll: -0.015,
  },
  alarm: { eye: 0.28, brow: -0.28, lift: 0.012, mouth: 0.4, smile: -1, pitch: -0.06, roll: 0.035 },
  confidence: {
    eye: -0.1,
    brow: -0.06,
    lift: 0.002,
    mouth: 0,
    smile: 0.3,
    pitch: -0.04,
    roll: -0.045,
  },
}

/** Relative offsets keep each fighter's authored temperament and mouth restrictions. */
export function applySituationalExpression(
  pose: FightFacePose,
  mode: string,
  profile: ExpressionProfile,
): void {
  const shape = SHAPES[mode as FightSituation]
  if (!shape) return
  const intensity = profile.intensity
  const eyes = (profile.eyeResponse ?? 1) * intensity
  const brows = (profile.browResponse ?? 1) * intensity
  const body = (profile.bodyResponse ?? 1) * intensity
  pose.eye = Math.max(0.18, pose.eye + shape.eye * eyes)
  pose.brow += shape.brow * brows
  pose.lift += shape.lift * brows
  pose.effort = shape.mouth * intensity
  pose.smile = Math.max(0, pose.smile + shape.smile * intensity)
  // Reserved characters keep their composure while projecting Ren.
  if (mode === 'confidence') pose.smile *= Math.min(1, profile.smile * 3)
  if (profile.mouth) {
    pose.smile = 0
    pose.effort = 0
  }
  pose.headPitch += shape.pitch * body
  pose.headRoll += shape.roll * body
}
