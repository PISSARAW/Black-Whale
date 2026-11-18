import type { CameraDetail, CameraEvent } from './cinematicTypes'
import { CHROLLO_MAJOR_FRAMES } from './chrolloAnimation'

const MAJOR = new Set(
  ['steal', 'copy', 'puppet', 'appearance', 'cloth', 'fish', 'black-voice', 'detonation'].map(
    (id) => `chrollo.${id}`,
  ),
)
export const chrolloCameraDuration = (detail: CameraDetail): number | null =>
  MAJOR.has(detail.eventId ?? '') ? CHROLLO_MAJOR_FRAMES : null

export function chrolloCameraEvent(event: CameraEvent): CameraEvent {
  const detail = event.detail
  if (!detail || detail.source !== 'chrollo' || MAJOR.has(detail.eventId ?? '')) return event
  return { cue: { ...event.cue, strength: 0.18, hold: 3, release: 15 }, duration: 18, priority: 1 }
}

export function chrolloCinematicDetail(
  detail: CameraDetail | null,
  age: number,
): CameraDetail | null {
  if (!detail || detail.followThrough || age < 30 || detail.eventId !== 'chrollo.steal')
    return detail
  return { ...detail, anchors: [{ type: 'rig', side: detail.side, part: 'head' }], frontal: true }
}
