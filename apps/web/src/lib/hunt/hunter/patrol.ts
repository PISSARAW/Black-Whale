/**
 * The hunter's body and his routine.
 *
 * He does three things. He patrols — walks the doorway graph from room to room,
 * stopping at each to listen, which is also the only time he gets any aura
 * back. He searches — walks to the one point he has a reason to believe in and
 * looks at the floor there. And he sweeps, every twenty seconds or so, which is
 * how he finds anyone standing still in Ten and how they find out he is coming.
 *
 * Note what is not in this file's signature: the player. `updateHunter` takes a
 * `Percept | null` and never a position (I5). When he wants to sweep or inspect
 * he says so in his intents and the loop resolves it, so the truth about where
 * the player is stays one layer above him and cannot leak down by accident.
 *
 * His aura is the quiet half of the game. Patrolling roughly pays for itself:
 * the pause at each waypoint regenerates about what the next sweep costs.
 * Searching does not — it drains while he does it and gives him no time to
 * stand still — so every room the player makes him doubt is aura he will not
 * have at the moment of contact. That is the mechanism T4.4 is built on, and it
 * is entirely driven by how the player plays.
 */
import type { Vec2 } from '../../tour/types'
import { pointInPolygon } from '../../tour/geometry'
import { resolveMovement, wallsNear, WALK_SPEED } from '../../tour/navigation'
import type { Arena } from '../arena'
import { shortestPath, type NavGraph } from '../navmesh'
import { fullPool, regenerate, spend, type AuraPool } from '../aura'
import { EN_COST } from '../nen/en'
import { tickHold } from '../nen/entrave'
import { INSPECT_COST, INSPECT_INTERVAL } from './inspect'
import { pick, seedRng, type Rng } from '../random'
import {
  DEFAULT_HUNTER_PROFILE,
  hunterProfile,
  type HunterProfileId,
} from './profiles'
import {
  beliefIsStale,
  clearRoom,
  forget,
  initialBelief,
  updateBelief,
  type HunterBelief,
  type Percept,
} from './belief'

export type HunterMode = 'patrol' | 'listen' | 'search'

/** Seconds between sweeps, when he can afford one. */
export const SWEEP_INTERVAL = 20
/** Seconds he stands still at each waypoint — his only regeneration. */
export const LISTEN_FOR = 4
/** Aura per second burnt while actively searching. */
export const SEARCH_DRAIN = 3
/** How close counts as arrived. */
export const ARRIVE_WITHIN = 1

export interface HunterState {
  profileId: HunterProfileId
  position: Vec2
  spaceId: string | null
  mode: HunterMode
  belief: HunterBelief
  pool: AuraPool
  /** Seconds still held by an entrave. Zero means free to move. */
  held: number
  /** Rooms left on the current walk. */
  path: string[]
  sinceSweep: number
  sinceInspect: number
  listening: number
  rng: Rng
}

export interface HunterWorld {
  dt: number
  arena: Arena
  graph: NavGraph
  percept: Percept | null
}

/** What he wants the loop to resolve for him this tick. */
export interface HunterIntents {
  sweep: boolean
  inspect: boolean
}

export interface HunterSpawn {
  position: Vec2
  spaceId: string
  seed?: number
  profileId?: HunterProfileId
}

export function initialHunterState(spawn: HunterSpawn): HunterState {
  return {
    profileId: spawn.profileId ?? DEFAULT_HUNTER_PROFILE,
    position: spawn.position,
    spaceId: spawn.spaceId,
    mode: 'patrol',
    belief: initialBelief(),
    pool: fullPool(),
    held: 0,
    path: [],
    sinceSweep: 0,
    sinceInspect: INSPECT_INTERVAL,
    listening: 0,
    rng: seedRng(spawn.seed ?? 0x5eed),
  }
}

export function updateHunter(
  state: HunterState,
  world: HunterWorld,
): { hunter: HunterState; intents: HunterIntents } {
  const withBelief = perceive(state, world)
  if (withBelief.held > 0) return { hunter: held(withBelief, world.dt), intents: quiet() }

  const decided = decide(withBelief)
  const intents = wants(decided)
  const spending = pay(decided, world.dt, intents)
  return { hunter: walk(spending, world), intents }
}

function quiet(): HunterIntents {
  return { sweep: false, inspect: false }
}

/**
 * An entrave holds him where he stands. Note what he does *not* do: regenerate.
 * Being held is not resting — it is his aura against the player's, and the six
 * seconds it lasts are six seconds he gets nothing back. Without that, a hunter
 * at zero would climb back out of it every time he was caught, and the ending
 * T4.4 describes could never happen.
 */
function held(state: HunterState, dt: number): HunterState {
  return {
    ...state,
    held: tickHold(state.held, dt),
    sinceSweep: state.sinceSweep + dt,
    sinceInspect: state.sinceInspect + dt,
  }
}

function perceive(state: HunterState, world: HunterWorld): HunterState {
  const belief = updateBelief(state.belief, world.dt, world.percept)
  return {
    ...state,
    belief,
    sinceSweep: state.sinceSweep + world.dt,
    sinceInspect: state.sinceInspect + world.dt,
  }
}

/** Mode follows belief: something to chase, a waypoint to reach, or a pause. */
function decide(state: HunterState): HunterState {
  if (beliefIsStale(state.belief)) {
    const belief = state.belief.at ? forget(state.belief) : state.belief
    if (state.mode === 'search') return { ...state, belief, mode: 'patrol', path: [] }
    return { ...state, belief }
  }
  if (state.mode === 'search') return state
  return { ...state, mode: 'search', path: [] }
}

function wants(state: HunterState): HunterIntents {
  const canSweep =
    state.sinceSweep >= hunterProfile(state.profileId).sweepInterval &&
    state.pool.available >= EN_COST
  const canInspect =
    state.mode === 'search' &&
    state.sinceInspect >= INSPECT_INTERVAL &&
    state.pool.available >= INSPECT_COST
  return { sweep: canSweep, inspect: canInspect }
}

/**
 * The cost of looking. The sweep and the inspection are charged by the loop
 * that resolves them; what is charged here is the searching itself, and the
 * standing still that is the only thing that pays it back.
 */
function pay(state: HunterState, dt: number, intents: HunterIntents): HunterState {
  const searching = state.mode === 'search'
  const pool = searching
    ? spend(state.pool, hunterProfile(state.profileId).searchDrain * dt)
    : regenerate(state.pool, dt, state.mode === 'listen')
  return {
    ...state,
    pool,
    sinceSweep: intents.sweep ? 0 : state.sinceSweep,
    sinceInspect: intents.inspect ? 0 : state.sinceInspect,
  }
}

function walk(state: HunterState, world: HunterWorld): HunterState {
  if (state.mode === 'listen') return listen(state, world.dt)
  const goal = goalOf(state, world.graph)
  if (!goal) return route(state, world.graph)
  return advance(state, goal, world)
}

function listen(state: HunterState, dt: number): HunterState {
  const listening = state.listening - dt
  if (listening > 0) return { ...state, listening }
  return { ...state, listening: 0, mode: 'patrol' }
}

/** The point he is walking to: the belief if he has one, else the next room on the route. */
function goalOf(state: HunterState, graph: NavGraph): Vec2 | null {
  if (state.mode === 'search') return state.belief.at
  const next = state.path[0]
  return next ? (graph.centers.get(next) ?? null) : null
}

/** Picks a fresh room to walk to — one he has not just cleared, if there is one. */
function route(state: HunterState, graph: NavGraph): HunterState {
  if (!state.spaceId) return state
  const elsewhere = graph.nodes.filter(
    (id) => id !== state.spaceId && !state.belief.cleared.includes(id),
  )
  const drawn = pick(state.rng, elsewhere.length > 0 ? elsewhere : graph.nodes)
  if (!drawn.item) return { ...state, rng: drawn.rng }
  const path = shortestPath(graph, state.spaceId, drawn.item)
  return { ...state, rng: drawn.rng, path: path ? path.slice(1) : [] }
}

/** One step towards the goal, at the tour's own pace: he is no faster than the player. */
function advance(state: HunterState, goal: Vec2, world: HunterWorld): HunterState {
  const gap = Math.hypot(goal[0] - state.position[0], goal[1] - state.position[1])
  if (gap <= ARRIVE_WITHIN) return arrive(state)

  const step = (WALK_SPEED * world.dt) / gap
  const target: Vec2 = [
    state.position[0] + (goal[0] - state.position[0]) * step,
    state.position[1] + (goal[1] - state.position[1]) * step,
  ]
  const walls = wallsNear(world.arena.walls, state.position, 2)
  const moved = resolveMovement(state.position, target, walls)
  const space = world.arena.spaces.find((room) => pointInPolygon(moved, room.footprint))
  return { ...state, position: moved, spaceId: space?.id ?? state.spaceId }
}

/**
 * Reaching the goal. Searching, he has looked and found nothing, so the room
 * comes off the list and he goes back to his round; patrolling, he stops to
 * listen, which is where his aura comes from.
 */
function arrive(state: HunterState): HunterState {
  if (state.mode === 'search') {
    return { ...state, belief: clearRoom(state.belief, state.spaceId), mode: 'patrol', path: [] }
  }
  return {
    ...state,
    path: state.path.slice(1),
    mode: 'listen',
    listening: hunterProfile(state.profileId).listenFor,
  }
}
