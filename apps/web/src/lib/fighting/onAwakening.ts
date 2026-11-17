import { lerpPose, type BodyPlan, type FightPose } from './fightPose'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { CameraDetail } from './cinematicTypes'

/** The Last Mission reference: indigo/black ascent, dark sclera and golden irises. */
export const ON_LOOK = { iris: 0xffd84a, sclera: 0x141024, ink: 0x080919, edge: 0x3535bf }
export const ON_AWAKENING_FRAMES = 108
export type OnAwakeningFrames = Record<FightSide, number | null>
const SIDES = ['player', 'opponent'] as const

/** The release is followed by the transformed gaze, using the current posed head. */
export function onAwakeningDetail(
  shot: { detail: CameraDetail; started: number } | null,
  frame: number,
): CameraDetail | null {
  if (!shot) return null
  const { detail } = shot
  if (detail.eventId !== 'nen.on' || frame - shot.started < 54) return detail
  return {
    ...detail,
    anchors: [{ type: 'rig', side: detail.side, part: 'head' }],
    frontal: true,
    isolate: true,
  }
}

function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    player: Boolean(state.player.nen.on),
    opponent: Boolean(state.opponent.nen.on),
  }
}

/** Render-local edge detection: pausing, reposing and rebuilding a rig never restart the entry. */
export function createOnAwakeningClock(initial: FightState) {
  let previous = snapshot(initial)
  const started: OnAwakeningFrames = { player: null, opponent: null }
  return (state: FightState, reducedMotion = false): OnAwakeningFrames => {
    const next = snapshot(state)
    const reset = resetsOnClock(previous, next)
    const frames: OnAwakeningFrames = { player: null, opponent: null }
    for (const side of SIDES) {
      started[side] = reset
        ? null
        : entryStart({
            active: next[side],
            previous: previous[side],
            start: started[side],
            frame: next.frame,
          })
      const start = started[side]
      frames[side] = elapsedEntry(start, next.frame)
    }
    previous = next
    return reducedMotion ? { player: null, opponent: null } : frames
  }
}

function resetsOnClock(previous: ReturnType<typeof snapshot>, next: ReturnType<typeof snapshot>) {
  return (
    previous.key !== next.key ||
    next.frame < previous.frame ||
    (next.phase === 'ready' && previous.phase !== 'ready')
  )
}
function entryStart(c: {
  active: boolean
  previous: boolean
  start: number | null
  frame: number
}) {
  if (!c.active) return null
  return c.previous ? c.start : c.frame
}
function elapsedEntry(start: number | null, frame: number) {
  return start !== null && frame - start < ON_AWAKENING_FRAMES ? frame - start : null
}
function poseAvailable(fighter: ArcadeFighter) {
  return (
    fighter.pose === 'idle' &&
    fighter.y === 0 &&
    fighter.health > 0 &&
    !fighter.attack &&
    !fighter.hanzoProjection &&
    !fighter.easterEgg
  )
}
function stationary(fighter: ArcadeFighter) {
  return (fighter.motion?.velocityX ?? 0) === 0 && !fighter.motion?.dash
}

const GATHER: FightPose = {
  chest: [0.3, 0, 0],
  head: [0.35, 0, 0],
  leadShoulder: [-0.3, 0, 0.12],
  rearShoulder: [-0.3, 0, -0.12],
  leadElbow: [-1.3, 0, 0],
  rearElbow: [-1.3, 0, 0],
  leadKnee: [0.25, 0, 0],
  rearKnee: [0.25, 0, 0],
}
const RELEASE: FightPose = {
  chest: [-0.12, 0, 0],
  head: [-0.16, 0, 0],
  leadShoulder: [-0.12, 0, 1.25],
  rearShoulder: [-0.12, 0, -1.25],
  leadElbow: [-0.16, 0, 0],
  rearElbow: [-0.16, 0, 0],
}
const ease = (n: number) => {
  const t = Math.min(1, Math.max(0, n))
  return t * t * (3 - 2 * t)
}

/** A grounded idle flourish yields immediately to every playable action and reaction. */
export function onAwakeningBodyPlan(options: {
  fighter: ArcadeFighter
  frame?: number | null
  ordinary: BodyPlan | null
}): BodyPlan | null {
  const { fighter, frame, ordinary } = options
  if (
    frame == null ||
    frame < 0 ||
    frame >= ON_AWAKENING_FRAMES ||
    !fighter.nen.on ||
    !poseAvailable(fighter) ||
    !stationary(fighter) ||
    !ordinary
  )
    return ordinary
  const rising = lerpPose(GATHER, RELEASE, ease((frame - 18) / 30))
  const entry = lerpPose(ordinary.pose, rising, ease(frame / 12))
  return {
    key: 'on-awakening',
    plant: true,
    blend: 0,
    pose: lerpPose(entry, ordinary.pose, ease((frame - 74) / 34)),
  }
}
