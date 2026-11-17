import { cameraSnapshot, cinematicEvents } from './cinematicEvents'
import { onAwakeningDetail } from './onAwakening'
import { feitanCinematicDetail } from './feitanPresentation'
import type { FightSide, FightState } from './types'

import type { CinematicCue, CinematicDirection, CameraPacing } from './cinematicTypes'
export type { CameraDetail, CinematicCue, CinematicDirection } from './cinematicTypes'
import { createCameraScheduler, visibleCameraEvents, type CameraShot } from './cinematicScheduling'
function strongestCue(cues: CinematicCue[], frame: number) {
  return cues.reduce<{ strength: number; side: FightSide | null }>(
    (held, cue) => {
      const t = Math.max(0, (frame - cue.frame - cue.hold) / cue.release)
      const strength = cue.strength * (1 - t * t * (3 - 2 * t))
      return strength >= held.strength ? { strength, side: cue.side } : held
    },
    { strength: 0, side: null },
  )
}
function shouldReset(
  previous: ReturnType<typeof cameraSnapshot> | null,
  next: ReturnType<typeof cameraSnapshot>,
) {
  return (
    !previous ||
    previous.key !== next.key ||
    next.frame < previous.frame ||
    (previous.phase !== 'ready' && next.phase === 'ready')
  )
}

/** Live equivalent of the demo's independent camera track. Timing follows simulation frames. */
export function createCinematicDirector(
  options: { viewer?: () => FightSide; pacing?: CameraPacing } = {},
) {
  const scheduler = createCameraScheduler({ pacing: options.pacing })
  const viewer = options.viewer ?? (() => 'player' as const)
  let previous: ReturnType<typeof cameraSnapshot> | null = null
  let cues: CinematicCue[] = []
  let shot: CameraShot | null = null
  let finishAge = 0
  return {
    update(state: FightState, intensity = 1, dt = 0): CinematicDirection {
      const next = cameraSnapshot(state)
      if (shouldReset(previous, next)) {
        previous = next
        cues = []
        shot = null
        finishAge = 0
        scheduler.clear()
      }
      finishAge = state.phase === 'finished' ? finishAge + Math.max(0, dt) * 60 : 0
      const frame = state.frame + finishAge
      const events = visibleCameraEvents(cinematicEvents(state, previous!, next), {
        state,
        viewer: viewer(),
      })
      for (const event of events) {
        cues.push(event.cue)
      }
      previous = next
      cues = cues.filter((c) => frame - c.frame <= c.hold + c.release)
      shot = scheduler.update(shot, events, {
        state,
        frame,
        viewer: viewer(),
      })
      if (intensity <= 0) {
        cues = []
        shot = null
        scheduler.clear()
      }
      const { strength, side } = strongestCue(cues, frame)
      const detail = feitanCinematicDetail(onAwakeningDetail(shot, frame), shotAge(shot, frame))
      return { strength: strength * intensity, side, detail }
    },
  }
}

function shotAge(shot: CameraShot | null, frame: number) {
  return shot ? frame - shot.started : 0
}
