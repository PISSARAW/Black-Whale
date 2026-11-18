import { blinkyAvailable, blinkyBloodReady, blinkyCommand, BLINKY_BLOOD_INTERVAL } from './blinky'
import { attackData } from './frameData'
import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BLINKY_ACCENT_FRAMES = 18
export interface BlinkyCapture {
  id: string
  kind: 'object' | 'arena' | 'blood'
  shape: string
  colour: string
  x: number
  y: number
  started: number
  age: number
}
export interface BlinkyAccentFrame {
  start: number | null
  captures: BlinkyCapture[]
}
function observation(state: FightState, side: FightSide) {
  const self = state[side],
    other = state[side === 'player' ? 'opponent' : 'player']
  const command = blinkyCommand(self)
  const available = blinkyAvailable(self)
  const active =
    available &&
    self.hatsuEffects.blinkyFrames > 0 &&
    (command === 'suction' || command === 'blood')
  const elapsed = self.attack ? self.attack.frame - attackData('special', self).startup : -1
  const body = sleepingBody(other)
  return {
    available,
    active,
    command,
    elapsed,
    ready: blinkyBloodReady(state, side),
    health: other.health,
    x: body.x,
    y: body.y + 6.1,
    ...memory(self),
  }
}
function memory(fighter: ArcadeFighter) {
  return {
    object: fighter.blinky?.lastObject,
    arena: fighter.blinky?.lastArenaObject,
    blood: Boolean(fighter.blinky?.lastWasBlood),
  }
}
type Observation = ReturnType<typeof observation>
const empty = (): BlinkyAccentFrame => ({ start: null, captures: [] })
function capture(
  next: Observation,
  c: { before: Observation; state: FightState; side: FightSide },
): Omit<BlinkyCapture, 'id' | 'started' | 'age'> | null {
  const stored = storedCapture(next, c)
  if (stored) return stored
  if (drewBlood(c.before, next))
    return { kind: 'blood', shape: 'blood', colour: '#a51c43', x: next.x, y: next.y }
  return null
}
function drewBlood(before: Observation, next: Observation) {
  const crossed =
    Math.floor(next.elapsed / BLINKY_BLOOD_INTERVAL) >
    Math.floor(before.elapsed / BLINKY_BLOOD_INTERVAL)
  return (
    next.active &&
    next.command === 'blood' &&
    next.blood &&
    next.health < before.health &&
    (before.ready || next.ready) &&
    crossed
  )
}
function storedCapture(next: Observation, c: { before: Observation; state: FightState }) {
  if (next.object && next.object.id !== c.before.object?.id && next.active) {
    const shot = next.object
    return { kind: 'object' as const, shape: shot.shape, colour: shot.colour, x: shot.x, y: shot.y }
  }
  return arenaCapture(next, c)
}
function arenaCapture(next: Observation, c: { before: Observation; state: FightState }) {
  if (next.arena && next.arena !== c.before.arena) {
    const entry = c.state.battlefield?.entities.find((e) => e.id === next.arena && !e.present)
    if (entry)
      return {
        kind: 'arena' as const,
        shape: 'crate',
        colour: '#947454',
        x: entry.x,
        y: entry.y + (entry.arena?.height ?? 4) / 2,
      }
  }
  return null
}
function update(
  next: Observation,
  c: { before: Observation; state: FightState; side: FightSide; held: BlinkyAccentFrame },
) {
  const frame = c.state.frame
  if (!next.available) {
    c.held.start = null
    c.held.captures = []
    return empty()
  }
  if (next.active && !c.before.active) c.held.start = frame
  if (!next.active) c.held.start = null
  const found = capture(next, c)
  if (found)
    c.held.captures.push({
      ...found,
      id: `${c.side}:${frame}:${found.kind}`,
      started: frame,
      age: 0,
    })
  c.held.captures = c.held.captures
    .filter(
      (event) =>
        frame - event.started < BLINKY_ACCENT_FRAMES && (next.active || event.kind === 'arena'),
    )
    .slice(-8)
  return {
    start:
      c.held.start !== null && frame - c.held.start < BLINKY_ACCENT_FRAMES
        ? frame - c.held.start
        : null,
    captures: c.held.captures.map((event) => ({ ...event, age: frame - event.started })),
  }
}
/** Only newly stored matter and actual blood loss create material trails. */
export function createBlinkyClock() {
  let previous: { key: string; frame: number; player: Observation; opponent: Observation } | null =
    null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, BlinkyAccentFrame> => {
    const next = {
      key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
      frame: state.frame,
      player: observation(state, 'player'),
      opponent: observation(state, 'opponent'),
    }
    if (
      !previous ||
      previous.key !== next.key ||
      next.frame < previous.frame ||
      state.phase !== 'fighting'
    ) {
      previous = next
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const result = {
      player: update(next.player, {
        before: previous.player,
        state,
        side: 'player',
        held: held.player,
      }),
      opponent: update(next.opponent, {
        before: previous.opponent,
        state,
        side: 'opponent',
        held: held.opponent,
      }),
    }
    previous = next
    return result
  }
}
