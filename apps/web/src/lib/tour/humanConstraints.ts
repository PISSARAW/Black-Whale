import type { Object3D } from 'three'
import { humanAnimationRig } from './humanAnimation'
import { keepHumanJoint } from './humanJointLimits'

/** Constrain the final displayed skeleton, including procedural cinematic layers. */
export function keepHumanFigure(root: Object3D): void {
  const human = humanAnimationRig(root) ?? humanAnimationRig(root.children[0])
  if (!human) return
  keepHumanJoint(human.head, 'head')
  for (const arm of human.arms) {
    keepHumanJoint(arm)
    const elbow = arm.children[1]
    keepHumanJoint(elbow)
    const hand = elbow.children.find((node) => node.name.startsWith('hand-'))
    if (hand) keepHumanJoint(hand, 'wrist')
  }
  for (const leg of human.legs) keepHumanJoint(leg)
  for (const knee of human.knees) {
    keepHumanJoint(knee)
    keepHumanJoint(knee.children[1], 'ankle')
  }
  const chest = human.figure.getObjectByName('fight-chest')
  if (chest) constrainChest(chest, human.legs[0].position.y + 0.08)
}

function constrainChest(chest: Object3D, waist: number): void {
  const { x, y, z } = chest.rotation
  keepHumanJoint(chest, 'chest')
  if (x === chest.rotation.x && y === chest.rotation.y && z === chest.rotation.z) return
  chest.position.set(0, waist, 0).applyEuler(chest.rotation).multiplyScalar(-1)
  chest.position.y += waist
}
