import type { HumanMotion } from '$lib/tour/humanAnimation'
import type { ArcadeFighter } from './types'

export function variantMotion(
  fighter: Partial<Pick<ArcadeFighter, 'attack' | 'crouching'>>,
  progress: number,
): HumanMotion | undefined {
  const variant = fighter.attack?.variant
  if (!fighter.crouching && variant !== 'low' && variant !== 'throw' && variant !== 'air')
    return undefined
  const extension = Math.sin(progress * Math.PI)
  return (rig) => {
    if (variant === 'throw') {
      rig.arms.forEach((arm) => {
        arm.rotation.x -= extension * 1.4
      })
      rig.figure.rotation.y += extension * 0.8
      return
    }
    if (variant === 'air') {
      rig.legs[1].rotation.x -= extension * 1.3
      rig.knees[0].rotation.x += 0.7
      return
    }
    rig.figure.position.y -= 0.35
    rig.knees.forEach((knee) => {
      knee.rotation.x += 0.8
    })
    rig.legs[1].rotation.x -= extension
    rig.arms[1].rotation.x -= extension
  }
}
