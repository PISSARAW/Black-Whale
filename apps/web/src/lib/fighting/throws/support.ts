import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import { throwSmooth } from './sample'
import type { ThrowCinematicFrame } from '../throwCinematic'

/** Two rigid bones, one knee hinge, and a lifted swing foot; never pin both feet through a turn. */
export function supportThrowLeg(human: AnimatedHuman, frame: ThrowCinematicFrame, index: number) {
  const root = human.legs[index],
    hinge = human.knees[index],
    foot = hinge.children[1]
  const goal = supportGoal(human, { frame, index })
  const origin = root.getWorldPosition(new Vector3()),
    knee = hinge.getWorldPosition(new Vector3())
  const upper = origin.distanceTo(knee),
    lower = knee.distanceTo(foot.getWorldPosition(new Vector3()))
  const direction = goal.clone().sub(origin)
  const distance = Math.max(
    Math.abs(upper - lower) + 0.001,
    Math.min(upper + lower - 0.001, direction.length()),
  )
  direction.normalize()
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  const bend = new Vector3(0, 0, 1).applyQuaternion(
    human.figure.getWorldQuaternion(new Quaternion()),
  )
  bend.addScaledVector(direction, -bend.dot(direction)).normalize()
  const elbow = origin
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, upper * upper - along * along)))
  const flex = Math.acos(
    Math.max(
      -1,
      Math.min(1, (distance * distance - upper * upper - lower * lower) / (2 * upper * lower)),
    ),
  )
  hinge.rotation.set(flex - Math.atan2(-foot.position.z, -foot.position.y), 0, 0)
  orientLeg(root, hinge, { foot, elbow, goal: origin.clone().addScaledVector(direction, distance) })
  levelFoot(foot, human.figure)
}

function orientLeg(
  root: import('three').Object3D,
  hinge: import('three').Object3D,
  pose: { foot: import('three').Object3D; elbow: Vector3; goal: Vector3 },
) {
  const localUpper = hinge.position.clone().normalize()
  const localLower = pose.foot.position.clone().applyQuaternion(hinge.quaternion)
  const localBend = localLower.addScaledVector(localUpper, -localLower.dot(localUpper)).normalize()
  const elbow = root.parent!.worldToLocal(pose.elbow.clone())
  const upper = elbow.clone().sub(root.position).normalize()
  const lower = root.parent!.worldToLocal(pose.goal.clone()).sub(elbow)
  const bend = lower.addScaledVector(upper, -lower.dot(upper)).normalize()
  const local = new Matrix4().makeBasis(localUpper, localBend, localUpper.clone().cross(localBend))
  const world = new Matrix4().makeBasis(upper, bend, upper.clone().cross(bend))
  root.quaternion.setFromRotationMatrix(world.multiply(local.transpose()))
}

function supportGoal(human: AnimatedHuman, options: { frame: ThrowCinematicFrame; index: number }) {
  const { frame, index } = options,
    t = frame.age / frame.duration
  const lead = frame.facing === 1 ? 1 : 0
  const phase = Math.max(0, Math.min(1, (t - (index === lead ? 0.12 : 0.38)) / 0.24))
  const local = new Vector3(human.legs[index].position.x, 0, index === lead ? 0.16 : -0.16)
  local.applyAxisAngle(new Vector3(0, 1, 0), human.figure.rotation.y * throwSmooth(phase))
  const goal = human.figure.parent!.localToWorld(local)
  const ankle = human.knees[index].children[1]
  const scale = ankle.getWorldScale(new Vector3())
  goal.y = 0.012 - footSole(ankle) * scale.y + Math.sin(Math.PI * phase) * 0.1
  return goal
}

function levelFoot(foot: import('three').Object3D, figure: import('three').Object3D) {
  const desired = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), figure.rotation.y)
  desired.premultiply(figure.parent!.getWorldQuaternion(new Quaternion()))
  foot.quaternion.copy(foot.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(desired))
  foot.rotation.x = Math.max(-0.9, Math.min(0.9, foot.rotation.x))
  foot.rotation.z = Math.max(-0.4, Math.min(0.4, foot.rotation.z))
}

const SOLES = new WeakMap<import('three').Object3D, number>()
function footSole(foot: import('three').Object3D): number {
  const cached = SOLES.get(foot)
  if (cached !== undefined) return cached
  foot.updateWorldMatrix(true, true)
  const inverse = foot.matrixWorld.clone().invert(),
    box = new Box3()
  foot.traverse((node) => {
    const mesh = node as import('three').Mesh
    if (!mesh.isMesh) return
    mesh.geometry.computeBoundingBox()
    const relative = inverse.clone().multiply(mesh.matrixWorld)
    box.union(mesh.geometry.boundingBox!.clone().applyMatrix4(relative))
  })
  SOLES.set(foot, box.min.y)
  return box.min.y
}
