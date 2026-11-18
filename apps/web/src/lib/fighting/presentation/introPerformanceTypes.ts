import type { FightPose } from '../fightPose'

/** Orbit angle relative to the opponent, camera height, radius, gaze height, roll. */
export type IntroCameraKey = readonly [number, number, number, number, number?]

export interface IntroPerformance {
  /** Direction for animators; cosmetic staging written for Clash. */
  intention: string
  poses: readonly [FightPose, FightPose, FightPose]
  camera: readonly [IntroCameraKey, IntroCameraKey, IntroCameraKey]
  /** Anticipation, signature gesture, and settling into guard, on the shared shot clock. */
  beats: readonly [number, number, number]
}

export { gesturePose as introPose } from '../easterEggGestureKit'
