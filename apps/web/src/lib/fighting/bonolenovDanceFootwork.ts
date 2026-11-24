import { addPoses, type FightPose } from './fightPose'

const FULL_TURN = Math.PI * 2

/** Each half of the travelling phrase crosses, rises and sets the free foot back down. */
export function crossedDanceStep(phase: number, advancing: boolean): FightPose {
  const count = ((phase % FULL_TURN) + FULL_TURN) % FULL_TURN
  const leadFree = count < Math.PI
  const progress = (count % Math.PI) / Math.PI
  const rise = Math.sin(progress * Math.PI)
  const brush = Math.sin(progress * FULL_TURN) * rise
  const side = leadFree ? 1 : -1
  const travel = advancing ? 1 : -1
  return addPoses(
    {
      root: [side * -0.08 * rise, -0.065 * (1 - rise), travel * brush * 0.038],
      pelvis: [0, side * 0.37 * rise * travel, 0],
      chest: [0.025, side * -0.3 * rise, side * 0.12 * rise],
    },
    crossedLegs({ leadFree, rise, brush: travel * brush }),
    armPhrase(side * rise, brush * travel),
  )
}

function crossedLegs({
  leadFree,
  rise,
  brush,
}: {
  leadFree: boolean
  rise: number
  brush: number
}): FightPose {
  const hip = leadFree ? 'leadHip' : 'rearHip'
  const knee = leadFree ? 'leadKnee' : 'rearKnee'
  const foot = leadFree ? 'leadFoot' : 'rearFoot'
  const support = leadFree ? 'rearKnee' : 'leadKnee'
  const side = leadFree ? 1 : -1
  return {
    [hip]: [-0.67 * rise + 0.2 * brush, 0.22 * side * brush, -side * 0.31 * rise],
    [knee]: [0.93 * rise, 0, 0],
    [foot]: [0.54 * rise + 0.19 * brush, 0, 0],
    [support]: [0.29 * (1 - rise), 0, 0],
  }
}

function armPhrase(rise: number, brush: number): FightPose {
  const lead = Math.max(0, rise)
  const rear = Math.max(0, -rise)
  return {
    leadShoulder: [-0.45 - 0.66 * rear, 0.4 * brush, 0.43 + 0.62 * lead],
    rearShoulder: [-0.39 - 0.7 * lead, 0.41 * brush, -0.45 - 0.58 * rear],
    leadElbow: [0.37 * lead - 0.36 * rear, 0, 0],
    rearElbow: [0.37 * rear - 0.36 * lead, 0, 0],
    leadWrist: [-0.23 * brush, 0, 0.18 * lead],
    rearWrist: [0.23 * brush, 0, -0.18 * rear],
  }
}

export function bonolenovIdleBeat(seconds: number): FightPose {
  const count = seconds * Math.PI * 2.2
  const rise = Math.sin(count)
  const brush = Math.sin(count * 2) * 0.22
  return addPoses(
    { chest: [0, 0.1 * rise, 0.055 * rise], head: [0, -0.08 * rise, -0.035 * rise] },
    armPhrase(rise * 0.45, brush),
  )
}

/** The front pirouette completes one turn. The retreat opens and closes a shorter pivot. */
export function bonolenovDashTurn(progress: number, advancing: boolean): number {
  if (!advancing) return -1.85 * Math.sin(progress * Math.PI) ** 2
  const angle = Math.PI * (1 - Math.cos(progress * Math.PI))
  return angle <= Math.PI ? angle : angle - FULL_TURN
}
