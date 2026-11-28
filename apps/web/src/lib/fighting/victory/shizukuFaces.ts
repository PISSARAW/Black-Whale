import { drawFightFace, fightFaceRig } from '../fightExpressionRig'
import { REST_FACE } from '../fightExpressions'
import { ease } from './resources'
import { SHIZUKU_BLOOD, SHIZUKU_CAUGHT, SHIZUKU_RELEASE } from './shizukuTiming'
import type { VictoryContext } from './types'

export function poseShizukuFaces({ victim, hero, age }: VictoryContext, drain: number) {
  const winner = fightFaceRig(hero.root)
  const rival = fightFaceRig(victim.root)
  const search = ease((age - 48) / 55)
  const check = ease((age - SHIZUKU_CAUGHT) / 27)
  const blink = Math.max(0, 1 - Math.abs(age - 515) / 4)
  if (winner)
    drawFightFace(winner, {
      ...REST_FACE,
      eye: 1 - 0.78 * blink - 0.1 * check,
      brow: -0.12 * search * (1 - check),
      lift: 0.008 * check,
      gaze: 0.015 - 0.023 * search - 0.008 * check,
    })
  if (rival) {
    const strain = ease((age - SHIZUKU_BLOOD) / 26)
    const fade = 1 - ease((age - SHIZUKU_RELEASE + 42) / 42)
    drawFightFace(rival, {
      ...REST_FACE,
      eye: Math.max(0.05, 1 - drain * 0.94 + strain * fade * 0.35),
      brow: 0.43 * strain * fade,
      lift: 0.024 * strain * fade,
      pain: 0.92 * strain * fade,
      effort: 0.48 * strain * fade,
      gaze: -0.018 * (1 - drain),
    })
  }
}
