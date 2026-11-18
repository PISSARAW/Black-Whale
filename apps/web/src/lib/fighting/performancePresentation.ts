import { melodyCanPerform, melodyPageActive } from './melodyRules'
import { hasBashoPoem } from './bashoPoem'
import { predatorNenAvailable, predatorReady } from './predator'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const PERFORMANCE_ACCENT_FRAMES = 18
export interface PerformanceAccent {
  id: string
  source: 'melody' | 'basho' | 'rihan'
  kind: 'breath' | 'playing' | 'writing' | 'written' | 'watch' | 'study' | 'ready'
  owner: FightSide
  started: number
  age: number
}
function actor(fighter: ArcadeFighter) {
  const music = fighter.melodyPerformance
  const musical = Boolean(music) && melodyCanPerform(fighter) && melodyPageActive(fighter)
  const poem = hasBashoPoem(fighter, fighter.bashoPoem?.sourceMoveId)
    ? fighter.bashoPoem
    : undefined
  return {
    music: musical ? (music!.startupFrames > 0 ? 'breath' : 'playing') : '',
    writing: poem?.writingFrames ?? 0,
    written: Boolean(poem?.ready),
  }
}
/** Only the selected participant's own acquired observation. No prey identity is retained. */
export function privateRihanFocus(state: FightState, viewer: FightSide) {
  const f = state[viewer],
    p = f.predator
  const watching = watchingRihan(f)
  return {
    watching,
    analysis: watching && Boolean(p?.analysis),
    frames: watching ? (p?.analysis?.observedFrames ?? 0) : 0,
    ready: watching && predatorReady(state, viewer),
  }
}
function watchingRihan(f: ArcadeFighter) {
  return Boolean(f.predator?.watching && !f.predator.hunt && predatorNenAvailable(f))
}
function snapshot(state: FightState, viewer: FightSide) {
  return {
    key: `${viewer}:${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    player: actor(state.player),
    opponent: actor(state.opponent),
    focus: privateRihanFocus(state, viewer),
  }
}
type Snapshot = ReturnType<typeof snapshot>
type Signal = Pick<PerformanceAccent, 'source' | 'kind' | 'owner'>
function actorChanges(before: Snapshot, next: Snapshot, side: FightSide): Signal[] {
  const a = before[side],
    b = next[side],
    result: Signal[] = []
  if (b.music && a.music !== b.music)
    result.push({ source: 'melody', kind: b.music as 'breath' | 'playing', owner: side })
  if (b.writing > 0 && (a.writing === 0 || b.writing > a.writing))
    result.push({ source: 'basho', kind: 'writing', owner: side })
  if (b.written && !a.written) result.push({ source: 'basho', kind: 'written', owner: side })
  return result
}
function focusChanges(before: Snapshot, next: Snapshot, viewer: FightSide): Signal[] {
  const a = before.focus,
    b = next.focus,
    result: Signal[] = []
  if (b.watching && !a.watching) result.push({ source: 'rihan', kind: 'watch', owner: viewer })
  if (b.analysis && (!a.analysis || b.frames < a.frames))
    result.push({ source: 'rihan', kind: 'study', owner: viewer })
  if (b.ready && !a.ready) result.push({ source: 'rihan', kind: 'ready', owner: viewer })
  return result
}
function available(event: PerformanceAccent, next: Snapshot) {
  if (next.frame - event.started >= PERFORMANCE_ACCENT_FRAMES) return false
  if (event.source === 'melody') return next[event.owner].music === event.kind
  if (event.source === 'basho')
    return event.kind === 'written' ? next[event.owner].written : next[event.owner].writing > 0
  return next.focus.watching && (event.kind !== 'ready' || next.focus.ready)
}
export function createPerformanceClock() {
  let before: Snapshot | null = null
  let held: PerformanceAccent[] = []
  return (state: FightState, viewer: FightSide): PerformanceAccent[] => {
    const next = snapshot(state, viewer)
    if (
      !before ||
      before.key !== next.key ||
      next.frame < before.frame ||
      state.phase !== 'fighting'
    ) {
      before = next
      held = []
      return []
    }
    const signals = [
      ...actorChanges(before, next, 'player'),
      ...actorChanges(before, next, 'opponent'),
      ...focusChanges(before, next, viewer),
    ]
    for (const signal of signals)
      held.push({
        ...signal,
        id: `${signal.owner}:${signal.kind}:${next.frame}`,
        started: next.frame,
        age: 0,
      })
    before = next
    held = held.filter((e) => available(e, next)).slice(-12)
    return held.map((e) => ({ ...e, age: next.frame - e.started }))
  }
}
