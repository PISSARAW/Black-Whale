import { addPoses, scalePose, type FightPose } from './fightPose'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

const PHRASES = new WeakMap<MoveTimeline, MoveTimeline>()

/** Unarmed strikes begin with a preparation and finish with a crossed recovery step. */
export function danceStrikePhrase(slot: MoveSlot, native: MoveTimeline): MoveTimeline {
  const cached = PHRASES.get(native)
  if (cached) return cached
  const heavy = slot.endsWith('Heavy')
  const air = slot.startsWith('air')
  const close = closingBeat({ heavy, air })
  const timeline = native.map((key) => {
    if (key.phase === 'active') return key
    if (key.phase === 'startup') {
      const preparation: FightPose = {
        chest: [0.04, heavy ? -0.24 : 0.17, 0.12],
        leadShoulder: [-0.18, 0.26, 0.33],
        rearShoulder: [-0.33, -0.23, -0.47],
      }
      return { ...key, pose: addPoses(key.pose, scalePose(preparation, 1 - key.at * 0.62)) }
    }
    return { ...key, pose: addPoses(key.pose, scalePose(close, key.at < 0.8 ? 0.85 : 0.16)) }
  })
  PHRASES.set(native, timeline)
  return timeline
}

function closingBeat({ heavy, air }: { heavy: boolean; air: boolean }): FightPose {
  const armCircle: FightPose = {
    chest: [0.02, heavy ? 0.28 : -0.24, heavy ? -0.15 : 0.14],
    leadShoulder: [-0.39, 0.22, 0.53],
    rearShoulder: [-0.48, -0.22, -0.63],
    leadElbow: [-0.28, 0, 0],
    rearElbow: [-0.24, 0, 0],
  }
  if (air) return armCircle
  const hip = heavy ? 'rearHip' : 'leadHip'
  const knee = heavy ? 'rearKnee' : 'leadKnee'
  const foot = heavy ? 'rearFoot' : 'leadFoot'
  return addPoses(armCircle, {
    [hip]: [-0.32, heavy ? -0.17 : 0.17, heavy ? 0.24 : -0.24],
    [knee]: [0.43, 0, 0],
    [foot]: [0.38, 0, 0],
  })
}
