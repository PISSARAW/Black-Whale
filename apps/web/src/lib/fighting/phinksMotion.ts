import { attackData } from './frameData'
import { CYCLOTRON_ROTATION_FRAMES } from './phinksCyclotron'
import type { FightRig } from './fightRig'
import type { BodyPlan } from './fightPose'
import type { ArcadeFighter } from './types'

export function cyclotronBodyPlan(fighter: ArcadeFighter): BodyPlan | null {
  if (fighter.hitStun > 0 || fighter.health <= 0) return null
  if (!fighter.cyclotronWindup && !fighter.attack?.cyclotronTurns) return null
  return {
    key: 'cyclotron',
    plant: true,
    blend: 0,
    pose: { chest: [0.08, -0.2, 0], leadKnee: [0.15, 0, 0], rearKnee: [0.15, 0, 0] },
  }
}

/** Use the anatomical right shoulder, never the facing-dependent lead/rear arm. */
export function animateCyclotron(rig: FightRig, fighter: ArcadeFighter): void {
  if (!cyclotronBodyPlan(fighter)) return
  const right = rig.human.arms.findIndex((arm) => arm.name === 'shoulder-right')
  if (right < 0) return
  const shoulder = rig.human.arms[right]
  const windup = fighter.cyclotronWindup
  if (windup) {
    const turns = fighter.hatsuEffects.cyclotronTurns + windup.frame / CYCLOTRON_ROTATION_FRAMES
    shoulder.rotation.set(-turns * Math.PI * 2, 0, -0.22)
    rig.elbows[right].rotation.set(-0.3, 0, 0)
    return
  }
  const data = attackData('special', fighter)
  const frame = fighter.attack!.frame
  const extension = punchExtension(frame, data)
  shoulder.rotation.set(-0.75 - extension * 0.8, 0, -0.15)
  rig.elbows[right].rotation.set(-1.5 * (1 - extension), 0, 0)
}

function punchExtension(frame: number, data: ReturnType<typeof attackData>): number {
  if (frame < data.startup) return Math.max(0, (frame / data.startup - 0.6) / 0.4)
  if (frame < data.startup + data.active) return 1
  return Math.max(0, 1 - (frame - data.startup - data.active) / data.recovery)
}
