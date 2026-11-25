import type { Mesh, Object3D } from 'three'
import type { HumanFigureBuild } from '../humanFigure'
import { EXPRESSION_REST, type ExpressionPose } from './types'
import { drawCatalogueTeeth, suspendCatalogueTeeth } from './expressionTeeth'
import { prepareExpressionMouth } from './mouthGeometry'
import { drawExpressionTeeth } from './toothedMouthGeometry'
import {
  captureFacePart,
  captureFaceParts,
  nativeExpressionEyes,
  nativeExpressionMouth,
  drawNativeExpressionMouth,
  type FacePart,
} from './faceFeatures'
import { drawFaceRelief } from './faceRelief'
import { drawFaceEffects, suspendFaceEffects } from './faceEffects'

export interface ExpressionFaceRig {
  head: Object3D
  eyes: FacePart[]
  brows: FacePart[]
  pupils: FacePart[]
  mouth?: Mesh
  nativeMouth?: FacePart
  THREE: HumanFigureBuild['THREE']
  skin: number
}
export function createExpressionFace(options: {
  THREE: HumanFigureBuild['THREE']
  head: Object3D
  skin: number
  mouth?: Mesh
  mouthPolicy?: string
}): ExpressionFaceRig {
  const { THREE, head, mouth, mouthPolicy, skin } = options
  const rig: ExpressionFaceRig = {
    THREE,
    head,
    skin,
    eyes: nativeExpressionEyes(head),
    brows: captureFaceParts(head, 'face-brow'),
    pupils: captureFaceParts(head, 'face-eye').flatMap((eye) => {
      const node = eye.node.getObjectByName('eye-pupil')
      return node ? [captureFacePart(node, eye.side)] : []
    }),
  }
  if (!mouthPolicy) rig.nativeMouth = nativeExpressionMouth({ THREE, head, mouth })
  if (!mouthPolicy && !rig.nativeMouth && mouth?.visible) {
    prepareExpressionMouth({ THREE, mouth, head })
    rig.mouth = mouth
  }
  return rig
}

/** Both games draw the same independent controls on their authored head. */
export function drawExpressionFace(
  rig: ExpressionFaceRig,
  pose: ExpressionPose,
  seconds = 0,
): void {
  drawEyes(rig, pose)
  drawBrows(rig, pose)
  for (const part of rig.pupils) {
    part.node.position.x = part.x + pose.gaze
    part.node.position.y = part.y + pose.gazeY
  }
  drawNativeExpressionMouth(rig.nativeMouth, pose)
  drawMouth(rig, pose)
  drawCatalogueTeeth(rig, pose)
  drawExpressionTeeth(rig.mouth, { ...pose, smile: pose.smile - pose.frown })
  drawFaceRelief(rig.head, pose)
  drawFaceEffects(rig, pose, seconds)
}
function drawEyes(rig: ExpressionFaceRig, pose: ExpressionPose) {
  for (const part of rig.eyes) {
    const asymmetric = Math.max(0.03, 1 + part.side * pose.eyeAsymmetry)
    part.node.scale.y = part.scale * pose.eye * asymmetric
    part.node.rotation.z = part.rotation + part.side * pose.brow * 0.25
    part.node.position.y = part.y + pose.cheekRaise * 0.002
  }
}
function drawBrows(rig: ExpressionFaceRig, pose: ExpressionPose) {
  for (const part of rig.brows) {
    part.node.rotation.z = part.rotation + part.side * pose.brow
    if (pose.browAsymmetry !== 0) part.node.rotation.z += pose.browAsymmetry
    part.node.position.y = part.y + pose.lift + part.side * pose.browAsymmetry * 0.012
    part.node.position.x = part.x - part.side * pose.noseWrinkle * 0.004
  }
}
const MOUTH_BASE = new WeakMap<
  Object3D,
  { x: number; y: number; z: number; sx: number; sy: number }
>()
function drawMouth(rig: ExpressionFaceRig, pose: ExpressionPose) {
  const mouth = rig.mouth ?? rig.nativeMouth?.node
  if (!mouth) return
  let base = MOUTH_BASE.get(mouth)
  if (!base) {
    base = {
      x: mouth.position.x,
      y: mouth.position.y,
      z: mouth.rotation.z,
      sx: mouth.scale.x,
      sy: mouth.scale.y,
    }
    MOUTH_BASE.set(mouth, base)
  }
  const native = rig.nativeMouth
  const sx = native ? 1 + pose.effort * 0.04 + pose.smile * 0.025 - pose.pain * 0.025 : base.sx
  const sy = native ? native.scale * (1 + pose.effort * 0.1 - pose.pain * 0.12) : base.sy
  mouth.scale.x = sx * (1 + pose.mouthWidth * 0.25)
  mouth.scale.y = sy * (1 + pose.jaw * 2.5) * (1 - pose.mouthPress * 0.7)
  mouth.position.y = base.y - pose.jaw * 0.008 + pose.cheekRaise * 0.002
  mouth.rotation.z = base.z + pose.mouthSkew * 0.22
  const morphs = rig.mouth?.morphTargetInfluences
  if (morphs) {
    morphs[0] = pose.effort + pose.jaw * 0.35
    morphs[1] = pose.pain
    morphs[2] = pose.smile - pose.frown
  }
}

/** Cinematics borrow the face without retaining a cue's jaw, relief or tear effects. */
export function suspendExpressionDetails(rig: ExpressionFaceRig): () => void {
  const nodes = [
    rig.mouth,
    rig.nativeMouth?.node,
    ...['face-relief', 'face-nose', 'melody-cheek-left', 'melody-cheek-right'].map((name) =>
      rig.head.getObjectByName(name),
    ),
  ].filter((node): node is Object3D => Boolean(node))
  const held = nodes.map((node) => ({
    position: node.position.clone(),
    scale: node.scale.clone(),
    rotation: node.rotation.clone(),
  }))
  drawMouth(rig, EXPRESSION_REST)
  drawFaceRelief(rig.head, EXPRESSION_REST)
  const restoreEffects = suspendFaceEffects(rig.head)
  const restoreTeeth = suspendCatalogueTeeth(rig.mouth)
  return () => {
    nodes.forEach((node, index) => {
      node.position.copy(held[index].position)
      node.scale.copy(held[index].scale)
      node.rotation.copy(held[index].rotation)
    })
    restoreEffects()
    restoreTeeth()
  }
}
