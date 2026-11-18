import { attackPhase } from './frameData'
import { benjaminNenActive } from './benjaminBaton'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BENJAMIN_ACCENT_FRAMES = 18
export interface BenjaminFrames {
  air: number | null
  capture: number | null
  release: number | null
}
const empty = (): BenjaminFrames => ({ air: null, capture: null, release: null })
function actor(fighter: ArcadeFighter) {
  const attack = fighter.attack
  const air = attack?.moveId === 'benjamin:neutralSpecial' && attack.hatsuSource === 'benjamin'
  return {
    air: air && attackPhase(fighter) === 'active',
    airHeld: air,
    available: benjaminNenActive(fighter),
    card: fighter.hatsuEffects.baton?.card?.id ?? null,
    released:
      attack?.moveId === 'benjamin:finisher' &&
      attack.hatsuSource === 'benjamin' &&
      Boolean(attack.projectileSpawned),
  }
}
function snapshot(state: FightState) {
  return {
    key: `${state.player.id}:${state.opponent.id}:${state.roundNumber}:${state.environment.stageId}`,
    frame: state.frame,
    phase: state.phase,
    nextProjectile: state.nextProjectileId,
    player: actor(state.player),
    opponent: actor(state.opponent),
  }
}
type Snapshot = ReturnType<typeof snapshot>
function resets(before: Snapshot, next: Snapshot) {
  return before.key !== next.key || next.frame < before.frame || next.phase !== 'fighting'
}
function age(start: number | null, frame: number) {
  return start !== null && frame - start < BENJAMIN_ACCENT_FRAMES ? frame - start : null
}
function observe(before: Snapshot, next: Snapshot, c: { side: FightSide; held: BenjaminFrames }) {
  const old = before[c.side],
    now = next[c.side],
    held = c.held
  if (now.air && !old.air) held.air = next.frame
  if (old.card === null && now.card !== null) held.capture = next.frame
  if (realRelease(before, next, c.side)) held.release = next.frame
  if (!now.airHeld) held.air = null
  if (now.card === null) held.capture = null
  if (!now.available) return empty()
  return {
    air: age(held.air, next.frame),
    capture: age(held.capture, next.frame),
    release: age(held.release, next.frame),
  }
}
function realRelease(before: Snapshot, next: Snapshot, side: FightSide) {
  return (
    before[side].card !== null &&
    next[side].card === null &&
    next[side].released &&
    next.nextProjectile > before.nextProjectile
  )
}

/** Render-local scalar evidence: no prepared rectangle or lost card implies a successful capture/replay. */
export function createBenjaminPresentationClock() {
  let previous: Snapshot | null = null
  let held = { player: empty(), opponent: empty() }
  return (state: FightState): Record<FightSide, BenjaminFrames> => {
    const next = snapshot(state)
    if (!previous || resets(previous, next)) {
      previous = next
      held = { player: empty(), opponent: empty() }
      return { player: empty(), opponent: empty() }
    }
    const shown = {
      player: observe(previous, next, { side: 'player', held: held.player }),
      opponent: observe(previous, next, { side: 'opponent', held: held.opponent }),
    }
    previous = next
    return shown
  }
}
