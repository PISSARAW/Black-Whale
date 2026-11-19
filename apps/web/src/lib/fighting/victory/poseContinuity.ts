import type { Euler, Object3D, Quaternion, Vector3 } from 'three'
import { humanAnimationRig } from '$lib/tour/humanAnimation'
import { keepHumanFigure } from '$lib/tour/humanConstraints'
import { beginHumanJointFrame, endHumanJointFrame } from '$lib/tour/humanJointMotion'
import { createFightPoseContinuity } from '../fightPoseContinuity'
import type { BodyPlan } from '../fightPose'

interface Transform {
  position: Vector3
  rotation: Quaternion
  euler: Euler
}
interface PoseFrame {
  token: string
  age: number
  parts: Map<string, Transform>
}
interface Entry extends PoseFrame {
  phase: string
  since: number
}
const DISPLAYED = new WeakMap<Object3D, PoseFrame>()
const ACTIVE = new WeakMap<Object3D, { token: string; age: number }>()
const ENTRIES = new WeakMap<Object3D, Entry>()
const COMBOS = new WeakMap<
  Object3D,
  { token: string; age: number; draw: ReturnType<typeof createFightPoseContinuity> }
>()
const ENTRY_FRAMES = 6

export function beginVictoryPose(root: Object3D, clock: { token: string; age: number }): void {
  ACTIVE.set(root, clock)
  const previous = DISPLAYED.get(root)
  const delta = previous ? clock.age - previous.age : -1
  for (const [key, node] of partsOf(root)) {
    endHumanJointFrame(node)
    const from = previous?.parts.get(key)
    if (key !== 'figure' && from && previous?.token === clock.token && delta >= 0 && delta <= 6)
      beginHumanJointFrame(node, from.euler, delta / 60)
  }
}

/** Keep the same anatomical elbow branch while solving a moving cinematic grip. */
export function previousVictoryArm(root: Object3D, side: 'left' | 'right'): Quaternion | undefined {
  const clock = ACTIVE.get(root)
  const previous = DISPLAYED.get(root)
  if (!clock || !previous || clock.token !== previous.token) return
  const delta = clock.age - previous.age
  if (delta < 0 || delta > 6) return
  return previous.parts.get(side === 'left' ? 'arm0' : 'arm1')?.rotation
}

function partsOf(root: Object3D): Array<readonly [string, Object3D]> {
  const human = humanAnimationRig(root.children[0])
  if (!human) return []
  const parts: Array<readonly [string, Object3D]> = [
    ['figure', human.figure],
    ['head', human.head],
  ]
  for (const [i, arm] of human.arms.entries())
    parts.push([`arm${i}`, arm], [`elbow${i}`, arm.children[1]])
  for (const [i, leg] of human.legs.entries())
    parts.push(
      [`leg${i}`, leg],
      [`knee${i}`, human.knees[i]],
      [`ankle${i}`, human.knees[i].children[1]],
    )
  const chest = human.figure.getObjectByName('fight-chest')
  if (chest) parts.push(['chest', chest])
  for (const [i, arm] of human.arms.entries()) {
    const hand = arm.children[1].children.find((node) => node.name.startsWith('hand-'))
    if (hand) parts.push([`hand${i}`, hand])
  }
  return parts
}
function capture(root: Object3D) {
  return new Map(
    partsOf(root).map(([key, node]) => [
      key,
      {
        position: node.position.clone(),
        rotation: node.quaternion.clone(),
        euler: node.rotation.clone(),
      },
    ]),
  )
}

/** The transaction restores the scene; retain only pose values for the next displayed frame. */
export function rememberVictoryPose(root: Object3D, clock: { token: string; age: number }): void {
  DISPLAYED.set(root, { ...clock, parts: capture(root) })
  for (const [, node] of partsOf(root)) endHumanJointFrame(node)
}

/** Blend a phase entry from the outgoing film pose before grounding or attaching any prop. */
export function nativePoseEntry(
  root: Object3D,
  input: { token: string; phase: string; age: number; start?: number },
): () => void {
  let entry = ENTRIES.get(root)
  if (!samePhase(entry, input)) entry = beginEntry(root, input)
  ENTRIES.set(root, { ...entry, age: input.age })
  const p = Math.max(0, Math.min(1, (input.age - entry.since) / ENTRY_FRAMES))
  if (p >= 1) return () => {}
  const amount = p * p * (3 - 2 * p)
  return () => {
    for (const [key, node] of partsOf(root)) {
      const from = entry.parts.get(key)
      if (!from) continue
      node.position.lerpVectors(from.position, node.position, amount)
      node.quaternion.copy(from.rotation.clone().slerp(node.quaternion, amount))
    }
    keepHumanFigure(root)
  }
}

function samePhase(
  entry: Entry | undefined,
  input: { token: string; phase: string; age: number },
): entry is Entry {
  return (
    entry !== undefined &&
    entry.token === input.token &&
    entry.phase === input.phase &&
    input.age >= entry.age &&
    input.age - entry.age <= 6
  )
}
function beginEntry(
  root: Object3D,
  input: { token: string; phase: string; age: number; start?: number },
): Entry {
  const previous = DISPLAYED.get(root)
  const adjacent =
    previous?.token === input.token && input.age >= previous.age && input.age - previous.age <= 6
  return {
    ...input,
    since: input.start ?? (adjacent ? input.age : input.age - ENTRY_FRAMES),
    parts: adjacent ? previous.parts : capture(root),
  }
}

/** Native cancels and received blows use the same continuous pose curves as a live duel. */
export function nativeComboPose(
  root: Object3D,
  plan: BodyPlan,
  input: { token: string; age: number },
) {
  let flow = COMBOS.get(root)
  if (!flow || flow.token !== input.token || input.age < flow.age || input.age - flow.age > 6)
    flow = { token: input.token, age: input.age, draw: createFightPoseContinuity() }
  flow.age = input.age
  COMBOS.set(root, flow)
  return flow.draw(plan, input.age / 60)
}
