import { machiMoveId } from './machiThread'
import type { ArcadeFighter, FightSide, FightState, FightNenZone } from './types'

export const FINE_CONTROL_FRAMES = 18
export interface FineControlFrame {
  thread: number | null
  suture: number | null
  paperLaunch: number | null
  paperPlant: number | null
  paperZone: FightNenZone | null
  blood: number | null
  bloodReturn: number | null
  drops: Record<number, number>
}
const empty = (): FineControlFrame => ({
  thread: null,
  suture: null,
  paperLaunch: null,
  paperPlant: null,
  paperZone: null,
  blood: null,
  bloodReturn: null,
  drops: {},
})
function actor(state: FightState, side: FightSide) {
  const self = state[side],
    other = state[side === 'player' ? 'opponent' : 'player']
  return {
    ...threadObservation(self, other, side),
    ...paperObservation(self, other, side),
    ...bloodObservation(self),
  }
}
function threadObservation(self: ArcadeFighter, other: ArcadeFighter, side: FightSide) {
  return {
    thread: other.machiThread?.owner === side ? other.machiThread.kind : '',
    health: self.health,
    suture: self.attack?.hatsuSource === 'machi' && machiMoveId(self) === 'machi:neutralSpecial',
  }
}
function paperObservation(self: ArcadeFighter, other: ArcadeFighter, side: FightSide) {
  return {
    zones: other.plantedPaper?.filter((p) => p.owner === side).map((p) => p.zone) ?? [],
    launched: Boolean(
      self.attack?.projectileSpawned &&
      (self.attack.hatsuSource === 'kalluto' || self.id === 'kalluto'),
    ),
  }
}
function bloodObservation(self: ArcadeFighter) {
  return {
    blood: self.bloodyMary?.tendril?.phase ?? '',
    returning: Boolean(self.bloodyMary?.returning),
    drops: self.bloodyMary?.drops.filter((d) => d.reformFrames === 0).map((d) => d.id) ?? [],
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
type Actor = ReturnType<typeof actor>
type Snapshot = ReturnType<typeof snapshot>
function reset(before: Snapshot, next: Snapshot) {
  return before.key !== next.key || next.frame < before.frame || next.phase !== 'fighting'
}
function age(start: number | null, frame: number) {
  return start !== null && frame - start < FINE_CONTROL_FRAMES ? frame - start : null
}
function observe(before: Actor, next: Actor, c: { held: FineControlFrame; frame: number }) {
  const { held, frame } = c
  updateThreads(before, next, c)
  if (next.launched && !before.launched) held.paperLaunch = frame
  const planted = next.zones.find((zone) => !before.zones.includes(zone))
  if (planted) {
    held.paperPlant = frame
    held.paperZone = planted
  }
  if (!next.zones.includes(held.paperZone!)) held.paperPlant = null
  updateBlood(before, next, c)
  return {
    thread: age(held.thread, frame),
    suture: age(held.suture, frame),
    paperLaunch: age(held.paperLaunch, frame),
    paperPlant: age(held.paperPlant, frame),
    paperZone: held.paperZone,
    blood: age(held.blood, frame),
    bloodReturn: age(held.bloodReturn, frame),
    drops: dropAges(held.drops, frame),
  }
}
function dropAges(drops: Record<number, number>, frame: number) {
  const shown: Record<number, number> = {}
  for (const [id, start] of Object.entries(drops)) {
    const current = age(start, frame)
    if (current !== null) shown[Number(id)] = current
  }
  return shown
}
function updateThreads(before: Actor, next: Actor, c: { held: FineControlFrame; frame: number }) {
  if (next.thread && next.thread !== before.thread) c.held.thread = c.frame
  if (!next.thread) c.held.thread = null
  if (next.suture && next.health > before.health) c.held.suture = c.frame
}
function updateBlood(before: Actor, next: Actor, c: { held: FineControlFrame; frame: number }) {
  if (next.blood && next.blood !== before.blood) c.held.blood = c.frame
  if (!next.blood) c.held.blood = null
  if (next.returning && !before.returning) c.held.bloodReturn = c.frame
  if (!next.returning) c.held.bloodReturn = null
  updateDrops(before.drops, next.drops, c)
}
function updateDrops(
  before: number[],
  next: number[],
  c: { held: FineControlFrame; frame: number },
) {
  for (const id of next) if (!before.includes(id)) c.held.drops[id] = c.frame
  for (const id of Object.keys(c.held.drops))
    if (!next.includes(Number(id))) delete c.held.drops[Number(id)]
}
/** Scalar observations of actual material and completed effects, never attempted commands. */
export function createFineControlClock() {
  let previous: Snapshot | null = null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, FineControlFrame> => {
    const next = snapshot(state)
    if (!previous || reset(previous, next)) {
      previous = next
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const shown = {
      player: observe(previous.player, next.player, { held: held.player, frame: next.frame }),
      opponent: observe(previous.opponent, next.opponent, {
        held: held.opponent,
        frame: next.frame,
      }),
    }
    previous = next
    return shown
  }
}
