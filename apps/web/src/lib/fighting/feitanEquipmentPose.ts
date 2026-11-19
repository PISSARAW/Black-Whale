import { feitanStrike } from './feitanStrikeTimeline'
import type { ArcadeFighter } from './types'
import { addPoses, type BodyPlan, type FightPose } from './fightPose'

/** The right-hand umbrella shot is a physical aim, never the Pain Packer arm-crossing gesture. */
const UMBRELLA_SHOT = feitanStrike({
  load: {
    rearShoulder: [-0.65, 0, -0.2],
    rearElbow: [-1.15, 0, 0],
    leadShoulder: [-0.5, 0, 0.15],
    leadElbow: [-1.2, 0, 0],
  },
  contact: {
    chest: [0.02, -0.08, 0],
    rearShoulder: [-1.35, 0, -0.12],
    rearElbow: [-0.2, 0, 0],
    rearWrist: [0.1, 0, 0],
    leadShoulder: [-0.45, 0, 0.15],
    leadElbow: [-1.25, 0, 0],
  },
  catch: { rearShoulder: [-0.6, 0, -0.2], rearElbow: [-1.15, 0, 0] },
})

export function feitanEquipmentMove(fighter: ArcadeFighter) {
  if (fighter.id !== 'feitan' || fighter.attack?.kind !== 'ranged') return null
  return { timeline: UMBRELLA_SHOT, authored: true }
}

export function feitanUmbrellaPlan(fighter: ArcadeFighter, standing: FightPose): BodyPlan | null {
  if (
    fighter.id !== 'feitan' ||
    !fighter.umbrellaFeintFrames ||
    fighter.attack ||
    fighter.hitStun > 0
  )
    return null
  return {
    key: 'feitan:umbrella-feint',
    plant: fighter.y === 0,
    blend: 0.08,
    pose: addPoses(standing, {
      body: [0.08, 0, 0],
      head: [0.03, 0, 0],
      leadShoulder: [-0.4, 0.1, 0.12],
      leadElbow: [-1.05, 0, 0],
      rearShoulder: [0.4, 0, -0.15],
      rearElbow: [-0.4, 0, 0],
      leadHip: [-0.3, 0, 0],
      leadKnee: [0.5, 0, 0],
      rearHip: [-0.2, 0, 0],
      rearKnee: [0.4, 0, 0],
    }),
  }
}
