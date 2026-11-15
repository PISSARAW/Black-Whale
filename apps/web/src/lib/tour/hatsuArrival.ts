/** Reactions caused by crossing a room threshold in the tour. */
import type { Ship } from './blueprint'
import type { TourReport, TourWorld } from './cast/types'
import { filmOwlRoom } from './hatsuTraversal'

export interface TourArrival {
  world: TourWorld
  /** Where the walk has to put the visitor instead, if anywhere. */
  travelTo?: string
  report?: TourReport
  /** Whether the archive's own penalty — forced Zetsu — has been incurred. */
  punished?: boolean
}

interface ArrivalState {
  original: TourWorld
  next: TourWorld
  ship: Ship
  leaving: string | null
  report?: TourReport
  travelTo?: string
  punished: boolean
}

const arrival = (state: ArrivalState): TourArrival => ({
  world: state.next,
  travelTo: state.travelTo,
  report: state.report,
  punished: state.punished,
})

/** The double takes one punishment and is spent doing it. */
function intercept(state: ArrivalState): boolean {
  if (!state.next.double) return false
  state.report = { kind: 'double-spent', spaceId: state.next.double }
  state.next = { ...state.next, double: null }
  return true
}

function feedFishOnDeparture(state: ArrivalState): void {
  const { leaving } = state
  if (!leaving || !state.next.devouring.includes(leaving)) return
  const eaten = state.ship.structures.find(
    (solid) => solid.spaceId === leaving && !state.next.solids[solid.id]?.gone,
  )
  if (!eaten) return
  state.next = {
    ...state.next,
    solids: {
      ...state.next.solids,
      [eaten.id]: { ...state.next.solids[eaten.id], gone: true },
    },
  }
  state.report = { kind: 'fish-fed', spaceId: leaving, solidId: eaten.id }
}

function heldFast(state: ArrivalState, spaceId: string | null): TourArrival | null {
  const heldIn =
    state.next.pinned ??
    (state.leaving && state.next.cards[state.leaving] === 2 ? state.leaving : null)
  if (!heldIn || state.leaving !== heldIn || spaceId === heldIn || intercept(state)) return null
  return {
    world: { ...state.original, cameFrom: heldIn },
    travelTo: heldIn,
    report: { kind: 'held-fast', spaceId: heldIn },
  }
}

function rememberEntry(state: ArrivalState, spaceId: string): void {
  state.next = { ...state.next, trail: [...state.next.trail, spaceId].slice(-200) }
  if (state.next.owl && state.next.owlMode === 'shoulder' && state.next.owl !== spaceId) {
    state.next = {
      ...state.next,
      owl: spaceId,
      owlFilm: filmOwlRoom(state.next, spaceId),
    }
  }
}

function ageDroplets(state: ArrivalState): void {
  if (!state.next.droplets.length) return
  const aged = state.next.droplets.map((drop) => ({ ...drop, life: drop.life - 1 }))
  const spent = aged.find((drop) => drop.life <= 0)
  state.next = { ...state.next, droplets: aged.filter((drop) => drop.life > 0) }
  if (spent) state.report = { kind: 'droplet-expired', spaceId: spent.spaceId }
}

function followPoem(state: ArrivalState, spaceId: string): TourArrival | null {
  const line = state.next.poem.indexOf(spaceId)
  if (state.next.poem.length !== 3 || line < 0 || spaceId === state.leaving) return null
  const onward = state.next.poem[(line + 1) % 3]
  if (onward === state.leaving) return null
  return {
    world: { ...state.next, cameFrom: onward },
    travelTo: onward,
    report: state.report,
  }
}

function tripCurse(state: ArrivalState, spaceId: string): TourArrival | null {
  if (!state.next.curse || spaceId !== state.next.curse.sacrifice) return null
  const victim = state.next.curse.victim
  return {
    world: {
      ...state.next,
      curse: null,
      emptied: [...new Set([...state.next.emptied, victim])],
    },
    report: { kind: 'curse-fell', victim, sacrifice: spaceId },
  }
}

function recordVisit(state: ArrivalState, spaceId: string): void {
  if (state.next.watched.some((doll) => doll.spaceId === spaceId)) {
    state.next = {
      ...state.next,
      watched: state.next.watched.map((doll) =>
        doll.spaceId === spaceId ? { ...doll, visits: doll.visits + 1 } : doll,
      ),
    }
  }
  if (state.next.isolated?.occupant && state.next.isolated.spaceId !== spaceId) {
    state.next = { ...state.next, isolated: { ...state.next.isolated, occupant: false } }
  }
}

function triggerTrap(state: ArrivalState, spaceId: string): void {
  if (state.next.trap !== spaceId) return
  state.next = { ...state.next, trap: null, pinned: spaceId }
  state.report = { kind: 'trapped', spaceId }
}

function meetPact(state: ArrivalState, spaceId: string): void {
  if (state.next.pact !== spaceId) return
  const released = state.next.shut.length + state.next.guarded.length
  state.next = { ...state.next, pact: null, shut: [], guarded: [], cards: {} }
  state.report = { kind: 'pact-met', spaceId, released }
}

function breakVow(state: ArrivalState, spaceId: string): void {
  for (const vow of Object.values(state.next.vows)) {
    if (vow.subjectId === 'self' || vow.violated || spaceId !== vow.subjectId) continue
    const absorbed = intercept(state)
    state.next = {
      ...state.next,
      vows: {
        ...state.next.vows,
        [vow.subjectId]: { ...vow, violated: true },
      },
    }
    if (!absorbed) {
      state.report = { kind: 'vow-broken', subjectId: vow.subjectId }
      state.punished = true
    }
    break
  }
}

function feedSnakes(state: ArrivalState, spaceId: string): void {
  if (!state.next.snakes || state.next.snakes.fed || !state.next.snakes.rooms.includes(spaceId)) {
    return
  }
  state.next = { ...state.next, snakes: { ...state.next.snakes, fed: true } }
  state.report = { kind: 'snakes-fed', spaceId }
}

function reboundFromGum(state: ArrivalState, spaceId: string): TourArrival | null {
  if (!state.next.gumTraps.includes(spaceId) || !state.leaving || state.leaving === spaceId) {
    return null
  }
  if (intercept(state)) return null
  return {
    world: { ...state.next, cameFrom: state.leaving },
    travelTo: state.leaving,
    report: { kind: 'gum-rebound', spaceId },
  }
}

function meetGuards(state: ArrivalState, spaceId: string): TourArrival | null {
  if (!state.next.guarded.includes(spaceId) || !state.leaving || state.leaving === spaceId) {
    return null
  }
  if (state.next.body.masked) {
    return {
      world: { ...state.next, cameFrom: state.leaving },
      report: { kind: 'unrecognised', spaceId, asId: state.next.body.masked },
    }
  }
  if (intercept(state)) return null
  return {
    world: { ...state.next, cameFrom: state.leaving },
    travelTo: state.leaving,
    report: { kind: 'expelled', spaceId, toId: state.leaving },
  }
}

/** Apply every threshold technique in the order the visitor encounters it. */
export function arriveInTour(world: TourWorld, ship: Ship, spaceId: string | null): TourArrival {
  const leaving = world.cameFrom
  if (spaceId === leaving) return { world }

  const state: ArrivalState = {
    original: world,
    next: { ...world, cameFrom: spaceId },
    ship,
    leaving,
    punished: false,
  }
  feedFishOnDeparture(state)

  const held = heldFast(state, spaceId)
  if (held) return held
  if (!spaceId) return arrival(state)

  rememberEntry(state, spaceId)
  ageDroplets(state)
  const poem = followPoem(state, spaceId)
  if (poem) return poem
  const curse = tripCurse(state, spaceId)
  if (curse) return curse

  recordVisit(state, spaceId)
  triggerTrap(state, spaceId)
  meetPact(state, spaceId)
  breakVow(state, spaceId)
  feedSnakes(state, spaceId)

  const rebound = reboundFromGum(state, spaceId)
  if (rebound) return rebound
  const guarded = meetGuards(state, spaceId)
  return guarded ?? arrival(state)
}
