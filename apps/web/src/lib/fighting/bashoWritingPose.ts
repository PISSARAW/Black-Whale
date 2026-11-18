import type { EffectSceneOptions } from './fighterEffectScene'
import type { FightSide, FightState } from './types'
import type { Object3D, Quaternion, Vector3 } from 'three'

const PAPERS = new WeakMap<
  Object3D,
  { key: string; figure: Object3D | undefined; position: Vector3; quaternion: Quaternion }
>()
/** Freeze the physical sheet between simulation steps, including its live rig anchor. */
export function holdBashoPaper(
  options: EffectSceneOptions,
  c: { state: FightState; side: FightSide; root: Object3D },
) {
  const f = c.state[c.side],
    figure = options.figureOf?.(c.side)
  const key = `${c.state.frame}:${f.x}:${f.y}`
  const old = PAPERS.get(c.root)
  if (old && old.key === key && old.figure === figure) {
    c.root.position.copy(old.position)
    c.root.quaternion.copy(old.quaternion)
  } else
    PAPERS.set(c.root, {
      key,
      figure,
      position: c.root.position.clone(),
      quaternion: c.root.quaternion.clone(),
    })
}
/** Rotate the two real arm bones towards the grip, preserving both lengths. */
export function poseBashoWritingHand(
  options: EffectSceneOptions,
  c: { side: FightSide; pen: Object3D },
) {
  const figure = options.figureOf?.(c.side)
  const shoulder = figure?.getObjectByName('shoulder-right'),
    elbow = figure?.getObjectByName('elbow-right'),
    hand = figure?.getObjectByName('hand-right')
  if (!shoulder || !elbow || !hand) return
  const { THREE } = options
  const target = c.pen.localToWorld(new THREE.Vector3(0, 0.05, 0))
  const scratch = {
    target,
    pivot: new THREE.Vector3(),
    end: new THREE.Vector3(),
    towards: new THREE.Vector3(),
    delta: new THREE.Quaternion(),
    world: new THREE.Quaternion(),
    parent: new THREE.Quaternion(),
  }
  for (let pass = 0; pass < 6; pass++) {
    for (const joint of [elbow, shoulder]) aimJoint(joint, hand, scratch)
  }
}
function aimJoint(
  joint: Object3D,
  hand: Object3D,
  s: {
    target: Vector3
    pivot: Vector3
    end: Vector3
    towards: Vector3
    delta: Quaternion
    world: Quaternion
    parent: Quaternion
  },
) {
  joint.getWorldPosition(s.pivot)
  s.end.copy(hand.getWorldPosition(s.end)).sub(s.pivot).normalize()
  s.towards.copy(s.target).sub(s.pivot).normalize()
  s.delta.setFromUnitVectors(s.end, s.towards)
  joint.getWorldQuaternion(s.world).premultiply(s.delta)
  joint.parent!.getWorldQuaternion(s.parent).invert()
  joint.quaternion.copy(s.parent).multiply(s.world)
}
