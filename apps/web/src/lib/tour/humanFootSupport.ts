import { Quaternion, Vector3 } from 'three'
import type { AnimatedHuman } from './humanAnimation'
import { keepHumanJoint } from './humanJointLimits'
import { WALK_STRIDE_METRES } from './humanWalk'
import { reachHumanLimb } from './humanLimbReach'

export const HUMAN_WALK_TRANSITION = 0.22
const TRANSITION = HUMAN_WALK_TRANSITION
interface PlantedFoot {
  position: Vector3
  rotation: Quaternion
}
const clamp = (value: number) => Math.min(1, Math.max(0, value))
function needsReset(feet: PlantedFoot[], seconds: number, lastDraw: number): boolean {
  return !feet.length || seconds - lastDraw > 0.25 || seconds < lastDraw
}

/** Pin a world-space support through pose blending, travel and the final settling steps. */
export function createHumanFootSupport() {
  let lastDraw = -Infinity
  let support = -1
  let feet: PlantedFoot[] = []
  let ground = 0
  return (
    human: AnimatedHuman,
    input: { seconds: number; walking: boolean; distance: number; stoppingAt?: number },
  ) => {
    const { seconds, walking, distance, stoppingAt } = input
    const ankles = human.knees.map((knee) => knee.children[1])
    if (ankles.some((ankle) => !ankle)) return
    if (needsReset(feet, seconds, lastDraw)) {
      feet = ankles.map((ankle) => ({
        position: ankle.getWorldPosition(new Vector3()),
        rotation: ankle.getWorldQuaternion(new Quaternion()),
      }))
      ground = Math.min(...feet.map((foot) => foot.position.y))
      support = -1
    }
    lastDraw = seconds
    if (!walking && stoppingAt === undefined) {
      feet = []
      return
    }
    if (!walking && stoppingAt !== undefined) {
      // Return each foot under the hips in turn; cross-fading both legs alone
      // would drag two grounded soles back to the guard simultaneously.
      const elapsed = seconds - stoppingAt
      if (elapsed >= TRANSITION * 2) {
        feet = []
        return
      }
      settleFeet(human, { ankles, feet, support, elapsed, ground })
      return
    }
    const phase = (((distance / WALK_STRIDE_METRES) % 1) + 1) % 1
    const planted = phase < 0.5 ? 0 : 1
    if (support !== planted) {
      feet[planted].position.copy(ankles[planted].getWorldPosition(new Vector3()))
      feet[planted].position.y = ground
      feet[planted].rotation.copy(ankles[planted].getWorldQuaternion(new Quaternion()))
      support = planted
    }
    const ankle = ankles[planted]
    reachHumanLimb(
      { root: human.legs[planted], hinge: human.knees[planted], end: ankle },
      feet[planted].position,
    )
    ankle.quaternion.copy(
      ankle.parent!.getWorldQuaternion(new Quaternion()).invert().multiply(feet[planted].rotation),
    )
    keepHumanJoint(ankle, 'ankle')
  }
}

function settleFeet(
  human: AnimatedHuman,
  input: {
    ankles: import('three').Object3D[]
    feet: PlantedFoot[]
    support: number
    elapsed: number
    ground: number
  },
): void {
  const { ankles, feet, support, elapsed, ground } = input
  const first = 1 - Math.max(0, support)
  const moving = elapsed < TRANSITION ? first : 1 - first
  const p = clamp((elapsed % TRANSITION) / TRANSITION)
  for (const [index, ankle] of ankles.entries()) {
    const rest = ankle.getWorldPosition(new Vector3())
    const target =
      index === moving
        ? feet[index].position.clone().lerp(rest, p * p * (3 - 2 * p))
        : index === first && elapsed >= TRANSITION
          ? rest
          : feet[index].position.clone()
    target.y = ground + (index === moving ? Math.sin(p * Math.PI) * 0.045 : 0)
    reachHumanLimb({ root: human.legs[index], hinge: human.knees[index], end: ankle }, target)
  }
}
