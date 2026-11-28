import type { Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { hasFightExpression, type FightEmotion, type FightFacePose } from './fightExpressions'
import type { ArcadeFighter } from './types'
import { fightExpressionProfile } from './fightExpressionProfiles'
import { suspendExpressionTeeth } from './fightExpressionToothedMouth'
import {
  createExpressionFace,
  drawExpressionFace,
  suspendExpressionDetails,
  type ExpressionFaceRig,
} from '$lib/tour/expressions/faceRig'

export interface FightFaceRig extends ExpressionFaceRig {
  fighterId: ArcadeFighter['id']
  active: boolean
  pose: FightFacePose | null
  seconds: number
  mode: FightEmotion
}
const RIGS = new WeakMap<Object3D, FightFaceRig>()

export function registerFightExpression(options: {
  THREE: HumanFigureBuild['THREE']
  model: HumanFigure
  fighter: ArcadeFighter
  skin?: number
}) {
  const { THREE, model, fighter } = options
  if (!hasFightExpression(fighter.id)) return
  const mouth = model.root.getObjectByName('face-mouth') as Mesh | undefined
  const head = mouth?.parent
  if (!head) return
  const rig: FightFaceRig = {
    ...createExpressionFace({
      THREE,
      head,
      mouth,
      skin: options.skin ?? 0xd8b49a,
      mouthPolicy: fightExpressionProfile(fighter)?.mouth,
    }),
    fighterId: fighter.id,
    active: true,
    pose: null,
    seconds: 0,
    mode: 'concentration',
  }
  RIGS.set(model.turns, rig)
  RIGS.set(model.root, rig)
}

export const fightFaceRig = (root: Object3D) => RIGS.get(root)

export function drawFightFace(rig: FightFaceRig, pose: FightFacePose) {
  drawExpressionFace(rig, pose, rig.seconds)
}

/** Cinematics borrow the untouched face, then restore combat without losing its transition. */
export function suspendFightExpression(root: Object3D) {
  const rig = RIGS.get(root)
  if (!rig) return () => {}
  const parts = [
    ...rig.eyes,
    ...rig.brows,
    ...rig.pupils,
    ...(rig.nativeMouth ? [rig.nativeMouth] : []),
  ]
  const held = parts.map(({ node }) => ({
    scale: node.scale.y,
    scaleX: node.scale.x,
    rotation: node.rotation.z,
    y: node.position.y,
    x: node.position.x,
  }))
  for (const part of parts) {
    part.node.scale.y = part.scale
    if (part === rig.nativeMouth) part.node.scale.x = 1
    part.node.rotation.z = part.rotation
    part.node.position.y = part.y
    part.node.position.x = part.x
  }
  const morphs = rig.mouth?.morphTargetInfluences
  const weights = morphs?.slice()
  morphs?.fill(0)
  const restoreTeeth = suspendExpressionTeeth(rig.mouth)
  const restoreDetails = suspendExpressionDetails(rig)
  return () => {
    restoreDetails()
    parts.forEach(({ node }, index) => {
      node.scale.y = held[index].scale
      node.scale.x = held[index].scaleX
      node.rotation.z = held[index].rotation
      node.position.y = held[index].y
      node.position.x = held[index].x
    })
    weights?.forEach((weight, index) => {
      morphs![index] = weight
    })
    restoreTeeth()
  }
}
