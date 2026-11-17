import type { FightSide, FightState } from './types'
import type { CameraDetail } from './cinematicTypes'

export const PAIN_PACKER_ENTRY_FRAMES = 72
export const SOLAR_ENTRY_FRAMES = 78
export type ArmourFrames = Record<FightSide, number | null>
export const feitanEase = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    player: Boolean(state.player.hatsuEffects.painPacker?.armour),
    opponent: Boolean(state.opponent.hatsuEffects.painPacker?.armour),
  }
}
function resetClock(previous: ReturnType<typeof snapshot>, next: ReturnType<typeof snapshot>) {
  return (
    previous.key !== next.key ||
    next.frame < previous.frame ||
    (next.phase === 'ready' && previous.phase !== 'ready')
  )
}
function armourStart(c: {
  active: boolean
  previous: boolean
  start: number | null
  frame: number
}) {
  if (!c.active) return null
  return c.previous ? c.start : c.frame
}
function entryAge(start: number | null, frame: number) {
  return start !== null && frame - start < PAIN_PACKER_ENTRY_FRAMES ? frame - start : null
}

/** Scene-local timing follows accepted manifestations, including copied Pain Packer. */
export function createFeitanPresentationClock(initial?: FightState) {
  let previous = initial ? snapshot(initial) : null
  const started: ArmourFrames = { player: null, opponent: null }
  return (state: FightState): ArmourFrames => {
    const next = snapshot(state)
    if (!previous) previous = next
    const reset = resetClock(previous, next)
    const result: ArmourFrames = { player: null, opponent: null }
    for (const side of ['player', 'opponent'] as const) {
      started[side] = reset
        ? null
        : armourStart({
            active: next[side],
            previous: previous[side],
            start: started[side],
            frame: next.frame,
          })
      result[side] = entryAge(started[side], next.frame)
    }
    previous = next
    return result
  }
}

/** Each section reaches its exact native geometry; the completed hood conceals the head. */
export function armourReveal(frame: number | null) {
  if (frame === null) return { coat: 1, chest: 1, arms: 1, hood: 1 }
  return {
    coat: feitanEase(frame / 28),
    chest: feitanEase((frame - 8) / 30),
    arms: feitanEase((frame - 18) / 30),
    hood: feitanEase((frame - 30) / 30),
  }
}

export function feitanCinematicDetail(
  detail: CameraDetail | null,
  age: number,
): CameraDetail | null {
  if (!detail) return null
  if (detail.eventId === 'feitan.armour' && age >= 42)
    return {
      ...detail,
      kind: 'focus',
      frontal: true,
      isolate: true,
      anchors: [
        {
          type: 'node',
          actor: detail.side,
          name: 'pain-packer-hood:combat-joint',
          fallback: { type: 'rig', side: detail.side, part: 'head' },
        },
      ],
    }
  if (detail.eventId === 'feitan.sun' && age >= 36)
    return {
      ...detail,
      kind: 'focus',
      isolate: true,
      anchors: [
        {
          type: 'node',
          name: `rising-sun:${detail.side}`,
          fallback: { type: 'rig', side: detail.side, part: 'body' },
        },
      ],
    }
  return detail
}
