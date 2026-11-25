import type { Mesh } from 'three'
import type { AnimatedHuman, HumanAnimationChannel } from '../humanAnimation'
import type { HumanFigureBuild } from '../humanFigure'
import type { HumanProfile } from '../humanProfiles'
import { createExpressionFace, drawExpressionFace, type ExpressionFaceRig } from './faceRig'
import { sampleHumanExpression } from './expressionPlayer'
import { EXPRESSION_REST } from './types'
import { temperExpression, tourTemperament } from './temperament'
import { captureFaceParts } from './faceFeatures'

/** Explicit scene/dialogue acting composes after procedural Tour motion, and releases cleanly. */
export function humanExpressionChannel(options: {
  THREE: HumanFigureBuild['THREE']
  rig: AnimatedHuman
  profile: HumanProfile
}): HumanAnimationChannel {
  const { THREE, rig, profile } = options
  const baseline = [
    ...captureFaceParts(rig.head, 'face-eye'),
    ...captureFaceParts(rig.head, 'face-brow'),
  ]
  const temperament = tourTemperament(profile.likeness ?? '')
  let face: ExpressionFaceRig | undefined
  let applied = false
  return {
    beforeFrame: () => {
      if (face && applied) drawExpressionFace(face, EXPRESSION_REST)
      applied = false
    },
    afterFrame: ({ seconds, pose }) => {
      const sample = sampleHumanExpression(rig.figure, seconds)
      if (!sample || pose === 'flute' || pose === 'fallen') return
      if (!face) {
        face = createExpressionFace({
          THREE,
          head: rig.head,
          skin: profile.skin,
          mouth: rig.head.getObjectByName('face-mouth') as Mesh | undefined,
          mouthPolicy: temperament.mouth,
        })
        for (const part of [...face.eyes, ...face.brows]) {
          const rest = baseline.find((value) => value.node === part.node)
          if (rest) Object.assign(part, rest)
        }
      }
      const target = temperExpression(sample, temperament)
      if (pose === 'zetsu') target.eye = 0.06
      drawExpressionFace(face, target, seconds)
      rig.head.rotation.x += target.headPitch
      rig.head.rotation.y += target.headYaw
      rig.head.rotation.z += target.headRoll
      applied = true
    },
  }
}
