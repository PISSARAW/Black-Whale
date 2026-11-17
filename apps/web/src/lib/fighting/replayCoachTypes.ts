import type { FightSide } from './types'

export interface ReplayCoachFinding {
  id: string
  kind: 'recovery-opportunity' | 'recovery-punished'
  side: FightSide
  round: number
  frame: number
  packet: number
  responseFrames?: number
}
export interface ReplayCoachReport {
  status: 'running' | 'complete' | 'invalid' | 'unsupported' | 'cancelled' | 'limit'
  packet: number
  packets: number
  frames: number
  probes: number
  findings: ReplayCoachFinding[]
  nonExhaustive: true
}
export const COACH_MAX_PACKETS = 18_000
export const COACH_MAX_FRAMES = 18_000
export const COACH_MAX_PROBES = 80
export const COACH_MAX_FINDINGS = 20
