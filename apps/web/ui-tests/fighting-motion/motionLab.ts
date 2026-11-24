import type { AttackFrameData } from '../../src/lib/fighting/frameData'

export type MotionPhase = 'startup' | 'active' | 'recovery'

export function totalMoveFrames(frames: AttackFrameData): number {
  return Math.max(1, frames.startup + frames.active + frames.recovery)
}

export function clampMotionFrame(frame: number, frames: AttackFrameData): number {
  return Math.min(totalMoveFrames(frames) - 1, Math.max(0, Math.round(frame)))
}

export function phaseAtFrame(frame: number, frames: AttackFrameData): MotionPhase {
  const current = clampMotionFrame(frame, frames)
  if (current < frames.startup) return 'startup'
  if (current < frames.startup + frames.active) return 'active'
  return 'recovery'
}

export function representativeFrame(phase: MotionPhase, frames: AttackFrameData): number {
  if (phase === 'startup') return Math.max(0, Math.floor(frames.startup * 0.65))
  if (phase === 'active') return frames.startup
  return Math.min(
    totalMoveFrames(frames) - 1,
    frames.startup + frames.active + Math.floor(frames.recovery * 0.45),
  )
}

export interface MotionReviewCase<Fighter extends string, Slot extends string> {
  fighter: Fighter
  slot: Slot
  phase: MotionPhase
  facing: 1 | -1
}

/** Deterministic review matrix shared by the browser lab and its coverage test. */
export function motionReviewCases<Fighter extends string, Slot extends string>(
  fighters: readonly Fighter[],
  slots: readonly Slot[],
): MotionReviewCase<Fighter, Slot>[] {
  return fighters.flatMap((fighter) =>
    slots.flatMap((slot) =>
      (['startup', 'active', 'recovery'] as const).flatMap((phase) =>
        ([1, -1] as const).map((facing) => ({ fighter, slot, phase, facing })),
      ),
    ),
  )
}
