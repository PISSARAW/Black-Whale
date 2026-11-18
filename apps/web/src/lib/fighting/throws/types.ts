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
  | 'franklin-cargo'
  | 'franklin-unload'
  | 'machi-cross-stitch'
  | 'machi-spool'
  | 'illumi-joint'
  | 'illumi-puppet'
  | 'kalluto-screen'
  | 'kalluto-bow'
  | 'bonolenov-waltz'
  | 'bonolenov-prologue'
  | 'shizuku-brush'
  | 'shizuku-spring-clean'
  | 'hinrigh-handshake'
  | 'hinrigh-underboss'
  | 'mizaistom-warning'
  | 'mizaistom-custody'
  | 'leorio-consultation'
  | 'leorio-house-call'
  | 'hanzo-blind-side'
  | 'hanzo-moonfall'
  | 'rihan-snare'
  | 'rihan-dead-end'
  | 'zakuro-red-step'
  | 'zakuro-red-spiral'
  | 'melody-offbeat'
  | 'melody-last-bar'
  | 'basho-fifth-verse'
  | 'basho-full-stop'
  | 'camilla-kiss-hand'
  | 'camilla-dismissal'
  | 'halkenburg-broken-line'
  | 'halkenburg-rampart'
  | 'gel-bracelet'
  | 'gel-royal-coil'
  | 'lynch-answer-me'
  | 'lynch-cross-examination'
  | 'luini-wrong-door'
  | 'luini-emergency-exit'
  | 'bill-stake'
  | 'bill-living-shield'
  | 'furykov-blind-angle'
  | 'furykov-perfect-sequence'
  | 'cluck-underwing'
  | 'cluck-denied-flight'
  | 'beyond-mountain-pass'
  | 'beyond-unconquered-summit'
  | 'longhi-exit-clause'
  | 'longhi-non-negotiable'
  | 'musse-guarded-passage'
  | 'musse-window-closes'
  | 'padaille-lever-arm'
  | 'padaille-worksite'
  | 'sayird-out-of-sight'
  | 'sayird-reverse-view'
  | 'terebellum-palm-relay'
  | 'terebellum-home-delivery'
  | 'voconte-after-you'
  | 'voconte-wrong-entrance'
  | 'yokotani-objection'
  | 'yokotani-dismissed'

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
    | 'giant'
    | 'thread'
    | 'needle'
    | 'paper'
    | 'music'
    | 'blinky'
    | 'cuffs'
    | 'referee'
    | 'doctor'
    | 'remote'
    | 'ninja'
    | 'hunter'
    | 'blood'
    | 'flute'
    | 'poet'
    | 'royal'
    | 'archer'
    | 'serpent'
    | 'interrogator'
    | 'passage'
    | 'growth'
    | 'analyst'
    | 'aviary'
    | 'explorer'
    | 'agreement'
    | 'spy'
    | 'artisan'
    | 'scout'
    | 'relay'
    | 'gatekeeper'
    | 'bailiff'
  grip?: 'both' | 'prop' | 'scissors' | 'waist' | 'left'
  detail?: { yaw: number; anchor: 'hand' | 'head' | 'prop'; victim: 'wrist' | 'knee' | 'torso' }
  rightHand?: boolean
  /** Keep real scenery on the same depth side when the attacker switches seats. */
  worldDepth?: boolean
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
