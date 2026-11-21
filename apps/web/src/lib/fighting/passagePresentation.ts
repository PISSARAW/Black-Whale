import { luiniAnchor } from './luiniSpatial'
import { doorFramesFor, doorNenAvailable } from './voconteDoors'
import { ownsVisitHatsu } from './visitSceneKit'
import type { FightSide, FightState } from './types'

export const PASSAGE_ACCENT_FRAMES = 18
type Point = { x: number; y: number }
export interface PassageAccent {
  id: string
  source: 'luini' | 'voconte'
  owner: FightSide
  traveler?: FightSide
  kind: 'anchor' | 'link' | 'transit' | 'close'
  from: Point
  to?: Point
  started: number
  age: number
}
function actor(state: FightState, side: FightSide) {
  const fighter = state[side],
    room = luiniAnchor(state, side)
  return {
    x: fighter.x,
    y: fighter.y,
    recovery: fighter.preparationRecovery ?? 0,
    room: room ? { id: room.id, x: room.x, y: room.y } : null,
    luini: ownsVisitHatsu(fighter, 'luini'),
    voconte: doorNenAvailable(fighter),
    linked: Boolean(state.voconteDoors?.networks[side]?.active),
    transit: state.voconteDoors?.lastTransit?.[side],
    frames: doorFramesFor(state, side),
  }
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    player: actor(state, 'player'),
    opponent: actor(state, 'opponent'),
  }
}
type Snapshot = ReturnType<typeof snapshot>
type Actor = ReturnType<typeof actor>
type NewAccent = Omit<PassageAccent, 'id' | 'started' | 'age'>
function luiniChanges(before: Actor, next: Actor, owner: FightSide): NewAccent[] {
  const events: NewAccent[] = []
  if (before.room?.id !== next.room?.id) {
    if (before.room) events.push({ source: 'luini', owner, kind: 'close', from: before.room })
    if (next.room) events.push({ source: 'luini', owner, kind: 'anchor', from: next.room })
  }
  if (
    before.room &&
    next.recovery > before.recovery &&
    (before.x !== next.x || before.y !== next.y)
  )
    events.push({
      source: 'luini',
      owner,
      traveler: owner,
      kind: 'transit',
      from: { x: before.x, y: before.y },
      to: { x: next.x, y: next.y },
    })
  return events
}
function doorChanges(before: Actor, next: Actor, owner: FightSide): NewAccent[] {
  if (before.linked === next.linked) return []
  return [
    {
      source: 'voconte',
      owner,
      kind: next.linked ? 'link' : 'close',
      from: { x: next.frames[0].x, y: 0 },
      to: { x: next.frames[1].x, y: 0 },
    },
  ]
}
function transitChange(before: Actor, next: Snapshot, traveler: FightSide): NewAccent | null {
  const transit = next[traveler].transit
  if (!transit || transit.frame === before.transit?.frame) return null
  const frames = next[transit.owner].frames
  const from = frames.find((entry) => entry.id === transit.from)!,
    to = frames.find((entry) => entry.id === transit.to)!
  return {
    source: 'voconte',
    owner: transit.owner,
    traveler,
    kind: 'transit',
    from: { x: from.x, y: 0 },
    to: { x: to.x, y: 0 },
  }
}
function alive(event: PassageAccent, next: Snapshot) {
  if (next.frame - event.started >= PASSAGE_ACCENT_FRAMES) return false
  return event.kind === 'close' || event.kind === 'transit' || next[event.owner][event.source]
}
function stamp(event: NewAccent, next: Snapshot): PassageAccent {
  const started =
    event.source === 'voconte' && event.traveler ? next[event.traveler].transit!.frame : next.frame
  return {
    ...event,
    started,
    age: 0,
    id: `${event.source}:${event.owner}:${event.traveler ?? ''}:${event.kind}:${started}`,
  }
}
/** Confirmed anchor/network changes and actual displacement/transit records only. */
export function createPassageClock() {
  let previous: Snapshot | null = null
  let held: PassageAccent[] = []
  return (state: FightState): PassageAccent[] => {
    const next = snapshot(state)
    if (
      !previous ||
      previous.key !== next.key ||
      next.frame < previous.frame ||
      next.phase !== 'fighting'
    ) {
      previous = next
      held = []
      return []
    }
    for (const side of ['player', 'opponent'] as const) {
      const changes = [
        ...luiniChanges(previous[side], next[side], side),
        ...doorChanges(previous[side], next[side], side),
      ]
      const transit = transitChange(previous[side], next, side)
      if (transit) changes.push(transit)
      for (const event of changes) held.push(stamp(event, next))
    }
    held = held.filter((event) => alive(event, next)).slice(-16)
    previous = next
    return held.map((event) => ({ ...event, age: state.frame - event.started }))
  }
}
