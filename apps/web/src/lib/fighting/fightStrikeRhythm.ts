import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

/** Contact stays exact. Follow-through advances briskly, then the guard takes longer to settle. */
export function strikePresentationFrame(
  fighter: ArcadeFighter,
  frames: PhaseFrames,
  frame: number,
): number {
  const start = frames.startup + frames.active
  if (frame <= start || frames.recovery <= 0) return frame
  const hold =
    fighter.attack?.confirmedHit && fighter.attack.kind === 'heavy'
      ? Math.min(2, Math.floor(frames.recovery * 0.18))
      : 0
  const p = Math.min(1, Math.max(0, (frame - start - hold) / Math.max(1, frames.recovery - hold)))
  const accent = fighter.attack?.kind === 'heavy' ? 0.12 : 0.065
  return start + (p + Math.sin(Math.PI * p) * accent) * frames.recovery
}
