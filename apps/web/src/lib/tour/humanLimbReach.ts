import { Matrix4, Quaternion, Vector3, type Object3D } from 'three'
import { keepHumanJoint } from './humanJointLimits'
import { humanReachReference } from './humanReachMemory'

export interface LimbChain {
  root: Object3D
  hinge: Object3D
  end: Object3D
}

export interface HumanReachOptions {
  weight?: number
  pole?: Vector3
  reference?: Quaternion
}

/** Solve a two-bone chain in its current bend plane; never extend or resize a bone. */
export function reachHumanLimb(
  chain: LimbChain,
  target: Vector3,
  options: number | HumanReachOptions = 1,
): number {
  const { weight, pole, reference: preferred } = reachOptions(options)
  const reference = reachReference(chain.root, preferred)
  if (weight <= 0) return chain.end.getWorldPosition(new Vector3()).distanceTo(target)
  const previousRoot = chain.root.quaternion.clone()
  const previousHinge = chain.hinge.quaternion.clone()
  const root = chain.root.getWorldPosition(new Vector3())
  const hinge = chain.hinge.getWorldPosition(new Vector3())
  const end = chain.end.getWorldPosition(new Vector3())
  const upper = root.distanceTo(hinge),
    lower = hinge.distanceTo(end)
  if (upper < 1e-5 || lower < 1e-5) return end.distanceTo(target)
  const direction = target.clone().sub(root)
  const distance = Math.max(
    Math.abs(upper - lower) + 0.001,
    Math.min(upper + lower - 0.001, direction.length()),
  )
  direction.normalize()
  if (direction.lengthSq() < 0.5) return end.distanceTo(target)
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
  const bend = bendNormal(root, hinge, { direction, pole })
  const elbow = root
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(bend.normalize(), Math.sqrt(Math.max(0, upper * upper - along * along)))
  const solved = root.clone().addScaledVector(direction, distance)
  if (chain.end.parent === chain.hinge) {
    // The knee/elbow is a hinge, not a ball joint. Include the shoe centre's
    // offset from the shin axis; aiming it as a free joint twists the knee.
    const restPitch = Math.atan2(-chain.end.position.z, -chain.end.position.y)
    const flex = Math.acos(
      Math.max(
        -1,
        Math.min(1, (distance * distance - upper * upper - lower * lower) / (2 * upper * lower)),
      ),
    )
    const sign = chain.hinge.name.startsWith('knee-') ? 1 : -1
    chain.hinge.rotation.set(sign * flex - restPitch, 0, 0)
    keepHumanJoint(chain.hinge)
    aimChain(chain, { elbow, target: solved })
  } else {
    rotateToward(chain.root, { from: hinge.sub(root), to: elbow.sub(root) }, 1)
    const pivot = chain.hinge.getWorldPosition(new Vector3())
    rotateToward(
      chain.hinge,
      {
        from: chain.end.getWorldPosition(new Vector3()).sub(pivot),
        to: solved.sub(pivot),
      },
      1,
    )
  }
  chain.root.quaternion.copy(previousRoot.slerp(chain.root.quaternion, Math.min(1, weight)))
  chain.hinge.quaternion.copy(previousHinge.slerp(chain.hinge.quaternion, Math.min(1, weight)))
  keepHumanJoint(chain.root)
  keepHumanJoint(chain.hinge)
  if (chain.end.parent === chain.hinge && weight >= 1)
    fitReachPlane(chain, target, { origin: root, direction, bend, along, upper, solved, reference })
  return chain.end.getWorldPosition(new Vector3()).distanceTo(target)
}

function reachOptions(options: number | HumanReachOptions) {
  return typeof options === 'number'
    ? { weight: options, pole: undefined, reference: undefined }
    : { weight: options.weight ?? 1, pole: options.pole, reference: options.reference }
}

function bendNormal(
  origin: Vector3,
  hinge: Vector3,
  options: { direction: Vector3; pole?: Vector3 },
): Vector3 {
  const bend = (options.pole ?? hinge).clone().sub(origin)
  bend.addScaledVector(options.direction, -bend.dot(options.direction))
  if (bend.lengthSq() < 1e-6) bend.crossVectors(options.direction, new Vector3(0, 0, 1))
  if (bend.lengthSq() < 1e-6) bend.set(1, 0, 0)
  return bend
}

interface ReachPlane {
  origin: Vector3
  direction: Vector3
  bend: Vector3
  along: number
  upper: number
  solved: Vector3
  reference?: Quaternion
}

/** Align both segment axes at once; a shortest-arc aim alone leaves upper-arm roll ambiguous. */
function aimChain(chain: LimbChain, goal: { elbow: Vector3; target: Vector3 }): void {
  const { root, hinge, end } = chain
  const localUpper = hinge.position.clone().multiply(root.scale).normalize()
  const localLower = end.position
    .clone()
    .multiply(hinge.scale)
    .applyQuaternion(hinge.quaternion)
    .multiply(root.scale)
  const localBend = localLower.addScaledVector(localUpper, -localLower.dot(localUpper)).normalize()
  const parent = root.parent!
  const elbow = parent.worldToLocal(goal.elbow.clone())
  const upper = elbow.clone().sub(root.position).normalize()
  const lower = parent.worldToLocal(goal.target.clone()).sub(elbow)
  const bend = lower.addScaledVector(upper, -lower.dot(upper)).normalize()
  const local = new Matrix4().makeBasis(localUpper, localBend, localUpper.clone().cross(localBend))
  const world = new Matrix4().makeBasis(upper, bend, upper.clone().cross(bend))
  root.quaternion.setFromRotationMatrix(world.multiply(local.transpose()))
}

/** An elbow pole is a preference: rotate its plane before violating a shoulder limit. */
function fitReachPlane(chain: LimbChain, target: Vector3, plane: ReachPlane): void {
  const root = chain.root
  let best = root.quaternion.clone()
  let error = chain.end.getWorldPosition(new Vector3()).distanceTo(target)
  const reach = chain.end.getWorldPosition(new Vector3()).distanceTo(plane.origin)
  const unavoidable = Math.abs(reach - target.distanceTo(plane.origin))
  if (keepPlane(error - unavoidable, best, plane.reference)) return
  let angle = 0
  let score = planeScore(error, best, { angle, reference: plane.reference })
  for (let step = Math.PI; step > 0.02; step /= 2) {
    const centre = angle
    const candidates =
      step === Math.PI ? [referencePlaneAngle(chain, plane)] : [centre - step, centre + step]
    for (const candidate of candidates) {
      const next = candidatePlane(chain, target, { ...plane, angle: candidate })
      const cost = planeScore(next, root.quaternion, {
        angle: candidate,
        reference: plane.reference,
      })
      if (cost < score) {
        score = cost
        error = next
        angle = candidate
        best = root.quaternion.clone()
      }
    }
    if (keepPlane(error - unavoidable, best, plane.reference)) break
  }
  root.quaternion.copy(best)
  keepHumanJoint(root)
}

function reachReference(root: Object3D, preferred?: Quaternion): Quaternion | undefined {
  return preferred ?? humanReachReference(root)
}

function candidatePlane(
  chain: LimbChain,
  target: Vector3,
  plane: ReachPlane & { angle: number },
): number {
  const bend = plane.bend.clone().applyAxisAngle(plane.direction, plane.angle)
  const elbow = plane.origin
    .clone()
    .addScaledVector(plane.direction, plane.along)
    .addScaledVector(bend, Math.sqrt(Math.max(0, plane.upper ** 2 - plane.along ** 2)))
  aimChain(chain, { elbow, target: plane.solved })
  keepHumanJoint(chain.root)
  return chain.end.getWorldPosition(new Vector3()).distanceTo(target)
}

/** Seed with the outgoing elbow plane, rather than searching from an unrelated rest branch. */
function referencePlaneAngle(chain: LimbChain, plane: ReachPlane): number {
  if (!plane.reference) return 0
  const parent = chain.root.parent!
  const previousElbow = chain.hinge.position
    .clone()
    .multiply(chain.root.scale)
    .applyQuaternion(plane.reference)
    .add(chain.root.position)
  parent.localToWorld(previousElbow)
  const normal = previousElbow.sub(plane.origin)
  normal.addScaledVector(plane.direction, -normal.dot(plane.direction))
  if (normal.lengthSq() < 1e-10) {
    normal
      .set(0, 0, chain.hinge.name.startsWith('knee-') ? 1 : -1)
      .applyQuaternion(plane.reference)
      .transformDirection(parent.matrixWorld)
    normal.addScaledVector(plane.direction, -normal.dot(plane.direction))
  }
  normal.normalize()
  return Math.atan2(plane.direction.dot(plane.bend.clone().cross(normal)), plane.bend.dot(normal))
}

function keepPlane(error: number, rotation: Quaternion, reference?: Quaternion): boolean {
  return error <= 0.00001 && (!reference || reference.angleTo(rotation) < 0.25)
}

function planeScore(
  error: number,
  rotation: Quaternion,
  input: { angle: number; reference?: Quaternion },
): number {
  return error * 1000 + (input.reference?.angleTo(rotation) ?? 0) + Math.abs(input.angle) * 0.1
}

function rotateToward(joint: Object3D, vectors: { from: Vector3; to: Vector3 }, weight: number) {
  const turn = new Quaternion().setFromUnitVectors(vectors.from.normalize(), vectors.to.normalize())
  const parent = joint.parent!.getWorldQuaternion(new Quaternion())
  turn.premultiply(parent.clone().invert()).multiply(parent)
  turn.slerp(new Quaternion(), 1 - Math.min(1, Math.max(0, weight)))
  joint.quaternion.premultiply(turn)
  joint.updateWorldMatrix(false, false)
}
