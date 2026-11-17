import { gyoSight } from './nenPerception'
import {
  cameraContinuation,
  cameraDuration,
  cameraDwell,
  cameraObservationLive,
} from './cinematicContinuation'
import type { CameraDetail, CameraEvent, CameraPacing } from './cinematicTypes'
import type { FightSide, FightState } from './types'
export interface CameraShot {
  detail: CameraDetail
  until: number
  priority: number
  started: number
  group?: string
  minimumUntil?: number
}
interface Context {
  state: FightState
  frame: number
  viewer: FightSide
}
export function cameraDetailAllowed(
  detail: CameraDetail,
  viewer: FightSide,
  state?: FightState,
): boolean {
  if (detail.privateTo && detail.privateTo !== viewer) return false
  if (!state || !detail.aura) return true
  const side = detail.sourceSide ?? detail.side
  return side === viewer || !state[side].nen.in || gyoSight(state[viewer])
}
export function cameraShotActive(shot: CameraShot | null, c: Context): boolean {
  return Boolean(
    shot &&
    c.frame < shot.until &&
    cameraDetailAllowed(shot.detail, c.viewer, c.state) &&
    cameraObservationLive(shot.detail, c.state),
  )
}
const key = (detail: CameraDetail) =>
  `${detail.sourceSide ?? detail.side}:${detail.eventId ?? detail.labelEn}`
function group(event: CameraEvent, c: Context) {
  const d = event.detail!
  const side = d.sourceSide ?? d.side
  if (d.kind === 'impact')
    return `impact:${side}:${c.state[side].attack?.moveId ?? d.source ?? c.state.impact?.kind}`
  if (d.eventId?.startsWith('camilla.cat-') || d.eventId === 'camilla.revived')
    return `camilla:${side}`
  return key(d)
}
function continuing(shot: CameraShot | null, c: Context, pacing: CameraPacing) {
  if (!shot || c.frame >= shot.until || !cameraDetailAllowed(shot.detail, c.viewer, c.state))
    return null
  if (cameraObservationLive(shot.detail, c.state, pacing)) return shot
  return pacing === 'extended' ? { ...shot, detail: cameraContinuation(shot.detail) } : null
}
function merge(held: CameraShot, event: CameraEvent, c: Context): CameraShot {
  return {
    ...held,
    detail: event.detail!,
    until: Math.min(held.started + 360, Math.max(held.until, c.frame + (event.duration ?? 180))),
    priority: Math.max(held.priority, event.priority ?? 0),
  }
}
export function createCameraScheduler(options: { pacing?: CameraPacing } = {}) {
  const pacing = options.pacing ?? 'extended'
  let pending: CameraEvent[] = []
  return {
    clear() {
      pending = []
    },
    update(held: CameraShot | null, events: CameraEvent[], c: Context): CameraShot | null {
      held = continuing(held, c, pacing)
      const incoming = events
        .filter((event) => event.detail && cameraDetailAllowed(event.detail, c.viewer, c.state))
        .map((event) => normalize(event, pacing))
      for (const event of incoming) {
        pending = pending.filter((p) => key(p.detail!) !== key(event.detail!))
        if (canMerge(held, event, { ...c, pacing })) held = merge(held!, event, c)
        else pending.push(event)
      }
      pending = orderPending(pending, { ...c, pacing })
      return selectShot(held, pending, { ...c, pacing })
    },
  }
}
interface PolicyContext extends Context {
  pacing: CameraPacing
}
function normalize(original: CameraEvent, pacing: CameraPacing): CameraEvent {
  const detail =
    pacing === 'extended' && original.detail!.kind === 'impact'
      ? {
          ...original.detail!,
          labelFr: original.detail!.labelFr.replace(/Impact$/, 'Impact confirmé'),
          labelEn: original.detail!.labelEn.replace(/Impact$/, 'Confirmed impact'),
        }
      : original.detail!
  return { ...original, detail, duration: cameraDuration(detail, original.duration, pacing) }
}
function canMerge(held: CameraShot | null, event: CameraEvent, c: PolicyContext) {
  return (
    c.pacing === 'extended' &&
    Boolean(held && held.group === group(event, c) && c.frame < held.started + 360)
  )
}
function orderPending(pending: CameraEvent[], c: PolicyContext) {
  return pending
    .filter((e) => pendingValid(e, c, c.pacing))
    .sort(
      (a, b) =>
        (b.priority ?? 0) - (a.priority ?? 0) ||
        (c.pacing === 'compact' ? b.cue.frame - a.cue.frame : a.cue.frame - b.cue.frame),
    )
    .slice(0, 8)
}
function keepCompact(held: CameraShot, next: CameraEvent, frame: number) {
  const priority = next.priority ?? 0
  return (
    (frame - held.started < 36 && priority <= held.priority) ||
    (held.priority > priority && priority < 2.5)
  )
}
function urgent(held: CameraShot, priority: number) {
  return (
    (held.detail.followThrough && priority >= held.priority) ||
    (priority >= 4 && priority > held.priority)
  )
}
function keepExtended(held: CameraShot, next: CameraEvent, frame: number) {
  const priority = next.priority ?? 0
  if (urgent(held, priority)) return false
  const minimum = held.minimumUntil ?? held.started + 54
  if (frame < minimum) return true
  return held.priority > priority && priority < 2.5 && next.detail?.kind !== 'impact'
}
function keepShot(held: CameraShot, next: CameraEvent, c: PolicyContext) {
  return c.pacing === 'compact'
    ? keepCompact(held, next, c.frame)
    : keepExtended(held, next, c.frame)
}
function selectShot(held: CameraShot | null, pending: CameraEvent[], c: PolicyContext) {
  const next = pending[0]
  if (!next?.detail) return held
  if (held && keepShot(held, next, c)) return held
  pending.shift()
  return newShot(next, c)
}
function newShot(event: CameraEvent, c: PolicyContext): CameraShot {
  const original = event.detail!
  const detail = cameraObservationLive(original, c.state, c.pacing)
    ? original
    : cameraContinuation(original)
  return {
    detail,
    priority: event.priority ?? 0,
    started: c.frame,
    group: group(event, c),
    minimumUntil: c.frame + (c.pacing === 'compact' ? 36 : cameraDwell(detail)),
    until:
      c.pacing === 'compact'
        ? Math.max(c.frame + 24, event.cue.frame + (event.duration ?? 42))
        : c.frame + (event.duration ?? 180),
  }
}
export function visibleCameraEvents(
  events: CameraEvent[],
  c: { state: FightState; viewer: FightSide },
) {
  return events.filter((e) => !e.detail || cameraDetailAllowed(e.detail, c.viewer, c.state))
}
function pendingValid(event: CameraEvent, c: Context, pacing: CameraPacing) {
  if (!event.detail || c.frame - event.cue.frame >= (event.duration ?? 42)) return false
  return (
    cameraDetailAllowed(event.detail, c.viewer, c.state) &&
    (pacing === 'extended' || cameraObservationLive(event.detail, c.state, pacing))
  )
}
