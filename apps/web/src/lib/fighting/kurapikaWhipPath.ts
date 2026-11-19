import type { Vector3 } from 'three'
import type { ChainMotion } from './kurapikaChainMotion'

/** A wrist-led loop travels behind the actual tip; contact and gameplay reach stay unchanged. */
export function kurapikaWhipPoints(options: {
  start: Vector3
  end: Vector3
  motion: ChainMotion
  reduced: boolean
}): Vector3[] {
  const { start, end, motion, reduced } = options
  const span = start.distanceTo(end)
  const amplitude = reduced ? 0 : Math.min(0.42, span * 0.22) * motion.extension
  const sign = motion.returning ? -1 : 1
  const first = start.clone().lerp(end, 0.3)
  const second = start.clone().lerp(end, 0.7)
  first.y += amplitude * sign
  second.y -= amplitude * sign
  first.z += amplitude * 0.3
  second.z -= amplitude * 0.3
  return [start, first, second, end]
}
