import type { Group, Object3D } from 'three'

export type HumanSide = 'left' | 'right'

export interface HumanHandAnchors {
  hand: Object3D
  palm: Group
  grip: Group
  effect: Group
}

export interface HumanFootAnchors {
  foot: Object3D
  heel: Group
  toe: Group
  ground: Group
}

export interface HumanExtremityAnchors {
  hands: readonly [HumanHandAnchors, HumanHandAnchors]
  feet: readonly [HumanFootAnchors, HumanFootAnchors]
}

/** Mount stable semantic anchors without changing the authored skeleton or visible geometry. */
export function ensureHumanExtremityAnchors(root: Object3D): HumanExtremityAnchors {
  return {
    hands: [handAnchors(root, 'left'), handAnchors(root, 'right')],
    feet: [footAnchors(root, 'left'), footAnchors(root, 'right')],
  }
}

export function humanExtremityAnchors(root: Object3D): HumanExtremityAnchors | null {
  const leftHand = existingHandAnchors(root, 'left')
  const rightHand = existingHandAnchors(root, 'right')
  const leftFoot = existingFootAnchors(root, 'left')
  const rightFoot = existingFootAnchors(root, 'right')
  if (!leftHand || !rightHand || !leftFoot || !rightFoot) return null
  return { hands: [leftHand, rightHand], feet: [leftFoot, rightFoot] }
}

function handAnchors(root: Object3D, side: HumanSide): HumanHandAnchors {
  const hand = required(root, `hand-${side}`)
  return {
    hand,
    palm: anchor(hand, `palm-${side}`, [0, -0.004, 0.004]),
    grip: anchor(hand, `grip-${side}`, [0, -0.044, 0.027]),
    effect: anchor(hand, `hand-effect-${side}`, [0, -0.052, 0.038]),
  }
}

function footAnchors(root: Object3D, side: HumanSide): HumanFootAnchors {
  const foot = required(root, `foot-${side}`)
  return {
    foot,
    heel: anchor(foot, `heel-${side}`, [0, -0.05, -0.075]),
    toe: anchor(foot, `toe-${side}`, [0, -0.05, 0.145]),
    ground: anchor(foot, `ground-contact-${side}`, [0, -0.05, 0.025]),
  }
}

function existingHandAnchors(root: Object3D, side: HumanSide): HumanHandAnchors | null {
  const hand = root.getObjectByName(`hand-${side}`)
  const palm = root.getObjectByName(`palm-${side}`) as Group | undefined
  const grip = root.getObjectByName(`grip-${side}`) as Group | undefined
  const effect = root.getObjectByName(`hand-effect-${side}`) as Group | undefined
  return hand && palm && grip && effect ? { hand, palm, grip, effect } : null
}

function existingFootAnchors(root: Object3D, side: HumanSide): HumanFootAnchors | null {
  const foot = root.getObjectByName(`foot-${side}`)
  const heel = root.getObjectByName(`heel-${side}`) as Group | undefined
  const toe = root.getObjectByName(`toe-${side}`) as Group | undefined
  const ground = root.getObjectByName(`ground-contact-${side}`) as Group | undefined
  return foot && heel && toe && ground ? { foot, heel, toe, ground } : null
}

function anchor(
  parent: Object3D,
  name: string,
  position: readonly [number, number, number],
): Group {
  const held = parent.getObjectByName(name)
  if (held) return held as Group
  if (!parent.parent) throw new Error(`Missing parent for human extremity anchor: ${name}`)
  const GroupClass = parent.parent.constructor as new () => Group
  const made = new GroupClass()
  made.name = name
  made.position.set(...position)
  made.userData.humanExtremityAnchor = true
  parent.add(made)
  return made
}

function required(root: Object3D, name: string): Object3D {
  const part = root.getObjectByName(name)
  if (!part) throw new Error(`Missing human extremity anchor parent: ${name}`)
  return part
}
