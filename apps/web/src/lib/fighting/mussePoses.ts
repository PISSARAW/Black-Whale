import type { ArcadeFighter } from './types'
import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import { secretWindowUtility } from './secretWindow'
import { bodyguardFiring } from './bodyguardFirearms'

const AIM = {
  body: [0.06, 0, 0],
  leadShoulder: [-0.77, 0, -0.15],
  leadElbow: [1.7, 0, 0],
  rearShoulder: [-0.97, 0, 0.15],
  rearElbow: [2, 0, 0],
} as const

const HANDGUN: MoveTimeline = [
  { phase: 'startup', at: 0.65, pose: AIM },
  { phase: 'active', at: 0, ease: 'snap', pose: { ...AIM, body: [-0.06, 0, 0] } },
  { phase: 'recovery', at: 0.35, pose: AIM },
]

const CONTACT: MoveTimeline = [
  { phase: 'startup', at: 0.6, pose: { leadShoulder: [-0.25, 0, -0.1], leadElbow: [0.8, 0, 0] } },
  {
    phase: 'active',
    at: 0,
    ease: 'out',
    pose: { leadShoulder: [-0.65, 0, -0.1], leadElbow: [1.7, 0, 0] },
  },
  { phase: 'recovery', at: 0.4, pose: { leadShoulder: [-0.2, 0, -0.1], leadElbow: [0.6, 0, 0] } },
]

export function musseKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  if (secretWindowUtility(fighter)) return { timeline: CONTACT, authored: false }
  return fighter.id !== 'theta' && bodyguardFiring(fighter)
    ? { timeline: HANDGUN, authored: false }
    : null
}
