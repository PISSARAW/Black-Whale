import type { ArcadeFighter } from './types'
import type { BodyPlan, FightPose } from './fightPose'

/** The same anatomical hand and shared arm joints hold the material contact. */
export function sunMoonChargeBodyPlan(
  body: ArcadeFighter,
  ordinary: BodyPlan | null,
): BodyPlan | null {
  if (
    !body.sunMoonCharging ||
    !ordinary ||
    body.health <= 0 ||
    body.hitStun > 0 ||
    body.knockdownFrames > 0
  )
    return ordinary
  const arm: FightPose =
    body.sunMoonCharging === 'sun'
      ? { rearShoulder: [-1.25, 0, -0.05], rearElbow: [-0.25, 0, 0], rearWrist: [0, 0, 0] }
      : { leadShoulder: [-1.25, 0, 0.05], leadElbow: [-0.25, 0, 0], leadWrist: [0, 0, 0] }
  return {
    ...ordinary,
    key: `sun-moon-charge-${body.sunMoonCharging}`,
    blend: 0.08,
    pose: { ...ordinary.pose, ...arm },
  }
}
