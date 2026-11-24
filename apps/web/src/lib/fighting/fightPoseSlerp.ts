import type { FightJoint, Turn } from './fightPose'

type Quat = readonly [number, number, number, number]

const SPHERICAL_JOINTS = new Set<FightJoint>(['leadShoulder', 'rearShoulder', 'leadHip', 'rearHip'])

const MAX_SAFE_Y = 1.35
const MAX_SAFE_STEP = 2.8
const AXIS_EPSILON = 1e-4

/** Interpolate spherical joints (shoulders, hips) along a quaternion geodesic when multi-axis. */
export function interpolateJointTurn(
  joint: FightJoint,
  endpoints: { from: Turn; to: Turn },
  amount: number,
): Turn {
  const { from, to } = endpoints
  if (amount <= 0) return from
  if (amount >= 1) return to
  if (!shouldSlerp(joint, from, to)) return linearTurn(from, to, amount)
  const qa = eulerXyzToQuat(from)
  const qb = eulerXyzToQuat(to)
  return quatToEulerXyz(slerpQuat(qa, qb, amount))
}

function shouldSlerp(joint: FightJoint, from: Turn, to: Turn): boolean {
  if (!SPHERICAL_JOINTS.has(joint)) return false
  if (Math.abs(from[1]) >= MAX_SAFE_Y || Math.abs(to[1]) >= MAX_SAFE_Y) return false
  if (!withinSafeRange(from, to)) return false
  return activeAxes(from, to) >= 2
}

function withinSafeRange(from: Turn, to: Turn): boolean {
  for (let i = 0; i < 3; i++) {
    if (Math.abs(from[i]) > MAX_SAFE_STEP || Math.abs(to[i]) > MAX_SAFE_STEP) return false
    if (Math.abs(to[i] - from[i]) > MAX_SAFE_STEP) return false
  }
  return true
}

function activeAxes(from: Turn, to: Turn): number {
  let count = 0
  for (let i = 0; i < 3; i++) {
    if (Math.abs(from[i]) > AXIS_EPSILON || Math.abs(to[i]) > AXIS_EPSILON) count++
  }
  return count
}

function linearTurn(from: Turn, to: Turn, amount: number): Turn {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount,
  ]
}

function eulerXyzToQuat(turn: Turn): Quat {
  const c1 = Math.cos(turn[0] * 0.5)
  const s1 = Math.sin(turn[0] * 0.5)
  const c2 = Math.cos(turn[1] * 0.5)
  const s2 = Math.sin(turn[1] * 0.5)
  const c3 = Math.cos(turn[2] * 0.5)
  const s3 = Math.sin(turn[2] * 0.5)
  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ]
}

function slerpQuat(a: Quat, b: Quat, t: number): Quat {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  const sign = dot < 0 ? -1 : 1
  dot = Math.abs(dot)
  if (dot > 0.9995) {
    return normaliseQuat([
      a[0] + (b[0] * sign - a[0]) * t,
      a[1] + (b[1] * sign - a[1]) * t,
      a[2] + (b[2] * sign - a[2]) * t,
      a[3] + (b[3] * sign - a[3]) * t,
    ])
  }
  const theta = Math.acos(Math.min(1, dot))
  const sinTheta = Math.sin(theta)
  const wa = Math.sin((1 - t) * theta) / sinTheta
  const wb = (Math.sin(t * theta) / sinTheta) * sign
  return [
    a[0] * wa + b[0] * wb,
    a[1] * wa + b[1] * wb,
    a[2] * wa + b[2] * wb,
    a[3] * wa + b[3] * wb,
  ]
}

function normaliseQuat(q: Quat): Quat {
  const length = Math.hypot(q[0], q[1], q[2], q[3]) || 1
  return [q[0] / length, q[1] / length, q[2] / length, q[3] / length]
}

function quatToEulerXyz(q: Quat): Turn {
  const [x, y, z, w] = q
  const m11 = 1 - 2 * (y * y + z * z)
  const m12 = 2 * (x * y - z * w)
  const m13 = 2 * (x * z + y * w)
  const m22 = 1 - 2 * (x * x + z * z)
  const m23 = 2 * (y * z - x * w)
  const m32 = 2 * (y * z + x * w)
  const m33 = 1 - 2 * (x * x + y * y)
  const ey = Math.asin(Math.min(1, Math.max(-1, m13)))
  if (Math.abs(m13) < 0.9999999) {
    return [Math.atan2(-m23, m33), ey, Math.atan2(-m12, m11)]
  }
  return [Math.atan2(m32, m22), ey, 0]
}
