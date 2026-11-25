import type { Object3D } from 'three'
import type { ArcadeFighter } from './types'
import { fightExpressionProfile } from './fightExpressionProfiles'
import { sampleHumanExpression } from '$lib/tour/expressions/expressionPlayer'
import { temperExpression } from '$lib/tour/expressions/temperament'
import type { FightFacePose } from './fightExpressions'

/** Authored acting is presentation only. Hits, KO and flute performances keep priority. */
export function fightCatalogueExpression(options: {
  figure: Object3D
  fighter: ArcadeFighter
  seconds: number
  base: FightFacePose
  mode: string
}): FightFacePose {
  const { fighter, mode } = options
  if (['pain', 'rest'].includes(mode) || fighter.melodyPerformance) return options.base
  const requested = sampleHumanExpression(options.figure, options.seconds)
  const profile = fightExpressionProfile(fighter)
  if (!requested || !profile) return options.base
  const target = temperExpression(requested, profile)
  target.headYaw += options.base.headYaw
  target.gaze *= fighter.facing
  if (fighter.parallelEyesClosed) {
    target.eye = 1
    target.gaze = 0
    target.gazeY = 0
  }
  return target
}
