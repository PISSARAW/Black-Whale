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
