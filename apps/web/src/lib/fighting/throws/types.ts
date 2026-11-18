import type { FightPose } from '../fightPose'

export type ThrowPerformanceId =
  | 'kurapika-pendulum'
  | 'kurapika-last-link'
  | 'hisoka-return'
  | 'hisoka-trapeze'
  | 'chrollo-page'
  | 'chrollo-public'
  | 'benjamin-restraint'
  | 'benjamin-arrest'
  | 'tserriednich-collection'
  | 'tserriednich-future'
  | 'feitan-umbrella'
  | 'feitan-wheel'
  | 'saiyu-lever'
  | 'saiyu-vault'
  | 'theta-disarm'
  | 'theta-blind-spot'
  | 'biscuit-lesson'
  | 'biscuit-correction'
  | 'phinks-wringer'
  | 'phinks-reverse'

export interface ThrowBeat {
  at: number
  attacker: FightPose
  victim: FightPose
  /** Progress from grip to authoritative landing, lift in fight units, depth in world units. */
  path: readonly [number, number, number]
  actorPath?: readonly [number, number, number]
}
/** Yaw, lens elevation, gaze elevation, distance multiplier. */
export type ThrowCameraKey = readonly [number, number, number, number]
export interface ThrowPerformance {
  id: ThrowPerformanceId
  name: string
  effect:
    | 'chain'
    | 'gum'
    | 'book'
    | 'military'
    | 'collector'
    | 'umbrella'
    | 'staff'
    | 'bodyguard'
    | 'shingen'
    | 'powerhouse'
  grip?: 'both' | 'prop' | 'scissors' | 'waist'
  detail?: { yaw: number; anchor: 'hand' | 'head' | 'prop'; victim: 'wrist' | 'knee' | 'torso' }
  rightHand?: boolean
  beats: readonly ThrowBeat[]
  camera: readonly [ThrowCameraKey, ThrowCameraKey, ThrowCameraKey]
}

export const THROW_LAND: FightPose = {
  body: [-1.48, 0, 0.03],
  head: [0.18, 0, 0.08],
  leadShoulder: [-0.2, 0, 0.72],
  rearShoulder: [-0.15, 0, -0.65],
  leadElbow: [-0.6, 0, 0],
  rearElbow: [-0.7, 0, 0],
  leadHip: [-0.18, 0, 0.08],
  leadKnee: [0.48, 0, 0],
  rearKnee: [0.16, 0, 0],
}
export const THROW_CAPTURE: FightPose = {
  body: [0.12, 0, 0],
  head: [-0.12, 0, 0],
  leadShoulder: [-0.6, 0, 0.3],
  rearShoulder: [-0.7, 0, -0.25],
  leadElbow: [-1, 0, 0],
  rearElbow: [-0.85, 0, 0],
  leadKnee: [0.22, 0, 0],
  rearKnee: [0.18, 0, 0],
}
