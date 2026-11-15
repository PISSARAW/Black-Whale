import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { ArcadeFighter } from './types'

export function variantMotion(
  fighter: Partial<Pick<ArcadeFighter, 'id' | 'attack' | 'crouching'>>,
  progress: number,
): HumanMotion | undefined {
  const variant = fighter.attack?.variant
  if (!fighter.crouching && variant !== 'low' && variant !== 'throw' && variant !== 'air')
    return undefined
  const extension = Math.sin(progress * Math.PI)
  const anticipation = Math.sin(Math.min(1, progress / 0.34) * Math.PI) * (progress < 0.34 ? 1 : 0)
  return (rig) => {
    if (variant === 'throw') {
      rig.figure.rotation.x -= anticipation * 0.22
      rig.knees.forEach((knee) => (knee.rotation.x += anticipation * 0.28))
      if (fighter.id === 'kurapika') {
        rig.figure.rotation.y -= extension * 0.72
        rig.arms[0].rotation.set(-1.2 * extension, 0, 0.7 * extension)
        rig.arms[1].rotation.set(-0.75 * extension, 0, -0.45 * extension)
      } else if (fighter.id === 'hisoka') {
        rig.figure.rotation.y += extension * 1.05
        rig.arms[0].rotation.z += extension * 0.92
        rig.arms[1].rotation.x -= extension * 1.35
        rig.legs[1].rotation.x -= extension * 0.45
      } else {
        rig.arms.forEach((arm) => (arm.rotation.x -= extension * 1.4))
        rig.figure.rotation.y += extension * 0.8
      }
      return
    }
    if (variant === 'air') {
      rig.figure.rotation.x += anticipation * 0.16
      rig.legs[1].rotation.x -= extension * 1.3
      rig.knees[0].rotation.x += 0.7
      return
    }
    rig.figure.position.y -= 0.35 + anticipation * 0.08
    rig.figure.rotation.x += anticipation * 0.12
    rig.knees.forEach((knee) => {
      knee.rotation.x += 0.8
    })
    rig.legs[1].rotation.x -= extension
    rig.arms[1].rotation.x -= extension
  }
}
