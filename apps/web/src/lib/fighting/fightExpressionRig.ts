import type { Mesh, Object3D } from 'three'
import type { HumanFigure, HumanFigureBuild } from '$lib/tour/humanFigure'
import { hasFightExpression, type FightEmotion, type FightFacePose } from './fightExpressions'
import { prepareExpressionMouth } from './fightExpressionMouth'
import type { ArcadeFighter } from './types'
import { fightExpressionProfile } from './fightExpressionProfiles'
import { drawExpressionTeeth, suspendExpressionTeeth } from './fightExpressionToothedMouth'
import {
  captureFacePart,
  captureFaceParts,
  nativeExpressionEyes,
  nativeExpressionMouth,
  drawNativeExpressionMouth,
  type FacePart,
} from './fightExpressionFeatures'

export interface FightFaceRig {
  fighterId: ArcadeFighter['id']
  active: boolean
  eyes: FacePart[]
  brows: FacePart[]
  pupils: FacePart[]
  mouth?: Mesh
  nativeMouth?: FacePart
  pose: FightFacePose | null
  seconds: number
  mode: FightEmotion
}
const RIGS = new WeakMap<Object3D, FightFaceRig>()

export function registerFightExpression(options: {
  THREE: HumanFigureBuild['THREE']
  model: HumanFigure
  fighter: ArcadeFighter
}) {
  const { THREE, model, fighter } = options
  if (!hasFightExpression(fighter.id)) return
  const mouth = model.root.getObjectByName('face-mouth') as Mesh | undefined
  const head = mouth?.parent
  if (!head) return
  const rig: FightFaceRig = {
    fighterId: fighter.id,
    active: true,
    eyes: nativeExpressionEyes(head),
    brows: captureFaceParts(head, 'face-brow'),
    pupils: captureFaceParts(head, 'face-eye').flatMap((eye) => {
      const node = eye.node.getObjectByName('eye-pupil')
      return node ? [captureFacePart(node, eye.side)] : []
    }),
    pose: null,
    seconds: 0,
    mode: 'concentration',
  }
  const covered = fightExpressionProfile(fighter)?.mouth
  if (!covered) rig.nativeMouth = nativeExpressionMouth({ THREE, head, mouth })
  if (!covered && !rig.nativeMouth && mouth?.visible) {
    prepareExpressionMouth({ THREE, mouth, head })
    rig.mouth = mouth
  }
  RIGS.set(model.turns, rig)
  RIGS.set(model.root, rig)
}

export const fightFaceRig = (root: Object3D) => RIGS.get(root)

export function drawFightFace(rig: FightFaceRig, pose: FightFacePose) {
  for (const part of rig.eyes) {
    part.node.scale.y = part.scale * pose.eye
    part.node.rotation.z = part.rotation + part.side * pose.brow * 0.25
  }
  for (const part of rig.brows) {
    part.node.rotation.z = part.rotation + part.side * pose.brow
    part.node.position.y = part.y + pose.lift
  }
  for (const part of rig.pupils) part.node.position.x = part.x + pose.gaze
  drawNativeExpressionMouth(rig.nativeMouth, pose)
  const morphs = rig.mouth?.morphTargetInfluences
  if (morphs) {
    morphs[0] = pose.effort
    morphs[1] = pose.pain
    morphs[2] = pose.smile
  }
  drawExpressionTeeth(rig.mouth, pose)
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
  return () => {
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
