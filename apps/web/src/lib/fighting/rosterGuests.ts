import { FIGHTING_ROSTER } from './roster'
import { createFightState } from './fightState'
import { resolveFightOutcome } from './fightOutcome'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

export interface RosterGuest {
  id: string
  owner: FightSide
  role: 'puppet' | 'loan'
  phase: 'preparing' | 'acting' | 'leaving' | 'eliminated'
  fighter: ArcadeFighter
  frames: number
  cooldown: number
  loanMove?: string
  loanSource?: FighterId
  used?: boolean
}
declare module './types' {
  interface FightState {
    rosterGuests?: readonly RosterGuest[]
    rosterProjection?: { owner: FightSide; guestId: string }
  }
  interface FightProjectile {
    sourceBody?: string
    targetBody?: string
  }
}

/** Explicit game adaptation: roster casting supplies a physical extra, not a copied Hatsu. */
export function drawRosterBody(
  state: FightState,
  side: FightSide,
): { state: FightState; fighter: ArcadeFighter } {
  const excluded = new Set([
    state.player.id,
    state.opponent.id,
    ...(state.rosterGuests ?? [])
      .filter((guest) => guest.phase !== 'eliminated')
      .map((guest) => guest.fighter.id),
  ])
  const choices = FIGHTING_ROSTER.filter((entry) => !excluded.has(entry.id))
  const rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0
  const id = choices[rng % choices.length].id
  const original = createFightState(id, state[side === 'player' ? 'opponent' : 'player'].id, {
    mode: 'versus-local',
    formatId: state.formatId,
    environment: state.environment,
  }).player
  const leader = state[side]
  return {
    state: { ...state, rng },
    fighter: {
      ...original,
      x: Math.max(7, Math.min(93, leader.x - leader.facing * 5)),
      y: leader.y,
      facing: leader.facing,
      aura: Math.min(55, original.aura),
    },
  }
}

export function storeRosterGuest(state: FightState, guest: RosterGuest): FightState {
  return {
    ...state,
    rosterGuests: (state.rosterGuests ?? []).map((held) => (held.id === guest.id ? guest : held)),
  }
}

export function guestProjection(state: FightState, guest: RosterGuest): FightState {
  return {
    ...state,
    [guest.owner]: guest.fighter,
    arena: guestArena(state, guest.owner),
    rosterGuests: undefined,
    rosterProjection: { owner: guest.owner, guestId: guest.id },
  }
}

/** The other body's clocks are not stepped in a projection. Commit only this pair's effects. */
export function mergeGuestProjection(
  state: FightState,
  projected: FightState,
  guest: RosterGuest,
): FightState {
  const other = guest.owner === 'player' ? 'opponent' : 'player'
  const updated = { ...guest, fighter: projected[guest.owner] }
  const merged: FightState = {
    ...projected,
    [guest.owner]: state[guest.owner],
    [other]: projected[other],
    catsName: projectedGuestCat(projected, guest),
    arena: restoreArenaOwner(state, projected, guest.owner),
    rosterGuests: (state.rosterGuests ?? []).map((held) => (held.id === guest.id ? updated : held)),
    roundsWon: state.roundsWon,
    matchWinner: state.matchWinner,
    teamMatch: state.teamMatch,
    rosterProjection: state.rosterProjection,
    // Judge once with the real leader restored, so a guest never takes its team seat.
    phase: state.phase,
    winner: state.winner,
    finishReason: state.finishReason,
  }
  return resolveFightOutcome(merged)
}

function projectedGuestCat(state: FightState, guest: RosterGuest): FightState['catsName'] {
  if (!state.catsName) return undefined
  return {
    ...state.catsName,
    ...(state.catsName.killerSide === guest.owner ? { killerBody: guest.id } : {}),
    ...(state.catsName.victimSide === guest.owner ? { victimBody: guest.id } : {}),
  }
}

function guestArena(state: FightState, owner: FightSide): FightState['arena'] {
  const arena = state.arena
  if (!arena) return undefined
  return {
    ...arena,
    held: { ...arena.held, [owner]: false },
    tether: { ...arena.tether, [owner]: undefined },
    stored: { ...arena.stored, [owner]: undefined },
    pending: { ...arena.pending, [owner]: undefined },
  }
}
function restoreArenaOwner(
  state: FightState,
  projected: FightState,
  owner: FightSide,
): FightState['arena'] {
  const arena = state.arena,
    other = projected.arena
  if (!arena || !other) return other
  return {
    ...other,
    held: { ...other.held, [owner]: arena.held[owner] },
    tether: { ...other.tether, [owner]: arena.tether[owner] },
    stored: { ...other.stored, [owner]: arena.stored[owner] },
    pending: { ...other.pending, [owner]: arena.pending[owner] },
  }
}
