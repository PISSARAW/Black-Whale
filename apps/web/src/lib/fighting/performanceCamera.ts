import type { CameraEvent } from './cinematicTypes'

const EVENTS = new Set([
  'melody.breath',
  'melody.playing',
  'melody.listener',
  'melody.ears',
  'melody.stop',
  'melody.heart',
  'basho.write',
  'basho.ready',
  'basho.cancel',
  'rihan.watch',
  'rihan.study',
  'rihan.ready',
  'rihan.abandon',
])
/** Apply after private detail filtering; predation and manifested fire keep their own staging. */
export function performanceCameraEvent(event: CameraEvent): CameraEvent {
  if (!event.detail || !EVENTS.has(event.detail.eventId ?? '')) return event
  return { cue: { ...event.cue, strength: 0.1, hold: 3, release: 15 }, duration: 18, priority: 1 }
}
