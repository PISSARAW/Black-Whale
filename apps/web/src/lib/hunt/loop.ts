/**
 * The fixed-step loop. It advances a game by one tick and draws nothing.
 *
 * The player's body is not simulated here. The tour already walks a visitor
 * through this deck with collision against these exact walls, and rewriting
 * that would be a second implementation of the one thing on the page most
 * likely to regress (I7). `/hunt` lets `TourScene` do the walking and reads the
 * position back, so what this file owns is everything the tour has no opinion
 * about: the reservoir, the hunter, what each of them can perceive, and how it
 * ends.
 *
 * It is also the only place allowed to know both bodies at once. `patrol.ts`
 * asks to sweep; this file resolves the sweep through `nen/en.ts` and hands
 * back a percept only if something was actually found. That is what makes
 * invariant I5 a property of the code rather than a promise in a comment.
 */
import type { Vec2 } from '../tour/types'
import type { Arena } from './arena'
import type { NavGraph } from './navmesh'
import { regenerate } from './aura'
import { fade, HEARING_RANGE, ring, senseAround, THROUGH_A_WALL } from './feedback'
import { EN_COST, sweepEn, type EnSweep } from './nen/en'
import { entravesUnderfoot, springEntraves } from './nen/entrave'
import { markSeen, type Ledger } from './nen/placed'
import { inspectRoom, INSPECT_COST } from './hunter/inspect'
import { updateHunter, type HunterIntents, type HunterState } from './hunter/patrol'
import type { Percept } from './hunter/belief'
import { playHunter } from './hunter/duel'
import { duelReducer } from './duel/reducer'
import { openDuel } from './duel/inherit'
import { GAME_LENGTH, judgeHunt, type HuntOutcome } from './outcome'
import { record, type TelemetryEvent } from './telemetry'
import type { HuntState } from './state'
import { tickHatsu } from './hatsu'

export const HUNT_TICK_RATE = 60
export const HUNT_DT = 1 / HUNT_TICK_RATE

export interface HuntWorld {
  dt: number
  arena: Arena
  graph: NavGraph
}

export function updateHunt(state: HuntState, world: HuntWorld): HuntState {
  if (state.outcome !== 'playing' && state.outcome !== 'contact') return state
  if (state.duel) return advanceDuel(state, world.dt)

  const ticked = {
    ...state,
    clock: state.clock + world.dt,
    ledger: breathe(state, world.dt),
    hatsu: tickHatsu(state.hatsu, world.dt),
  }
  const moved = advanceHunter(ticked, world)
  const sprung = springUnderHunter(moved)
  return conclude(sprung, world)
}

/** Regeneration, at a standstill only, up to the ceiling the placements leave. */
function breathe(state: HuntState, dt: number): Ledger {
  return { ...state.ledger, pool: regenerate(state.ledger.pool, dt, state.player.atRest) }
}

/**
 * The hunter's tick, and the resolution of whatever he asked for. The order
 * matters: he decides blind, then the world answers.
 */
function advanceHunter(state: HuntState, world: HuntWorld): HuntState {
  const heard = overheard(state, world.graph)
  const { hunter, intents } = updateHunter(state.hunter, { ...world, percept: heard })

  const movedLog =
    hunter.spaceId && hunter.spaceId !== state.hunter.spaceId
      ? record(state.log, state.clock, {
          actor: 'hunter',
          kind: 'enteredRoom',
          where: hunter.spaceId,
        })
      : state.log
  const swept = resolveSweep({ ...state, hunter, log: movedLog }, intents)
  return resolveInspection(swept, intents)
}

/** Footsteps carrying into the hunter's ear — a bearing, never a position. */
function overheard(state: HuntState, graph: NavGraph): Percept | null {
  if (state.player.atRest) return null
  const reach = earshotBetween(state.player.spaceId, state.hunter.spaceId, graph)
  if (reach === 'apart') return null

  const gap = distance(state.player.position, state.hunter.position)
  const nearness =
    Math.max(0, 1 - gap / HEARING_RANGE) * (reach === 'adjacent' ? THROUGH_A_WALL : 1)
  if (nearness <= 0.15) return null

  return { kind: 'sound', at: state.player.position, spaceId: state.player.spaceId, sharp: false }
}

function resolveSweep(state: HuntState, intents: HunterIntents): HuntState {
  if (!intents.sweep) return state

  const { pool, sweep } = sweepEn(state.hunter.pool, {
    origin: state.hunter.position,
    caster: 'ten',
    bodies: [{ id: 'player', position: state.player.position, nen: state.player.nen }],
  })
  if (!sweep) return state

  const hunter = { ...state.hunter, pool, belief: believeSweep(state, sweep) }
  return {
    ...state,
    hunter,
    // Felt, not merely cast: a player in Zetsu is neither found nor warned, and
    // `sweep.felt` is where that single rule lives.
    echoes: ring(state.echoes, {
      sweptFrom: sweep.felt.includes('player') ? sweep.origin : null,
    }),
    log: journalSweep(state, sweep),
  }
}

/**
 * What the sweep told him. The two lists it comes back with are two different
 * pieces of news, and keeping them apart is the whole value of Zetsu: a body
 * that displaced the field is *something over there*, and a body whose aura he
 * could also read is *someone, there*.
 *
 * So a read gives him a sharp belief and an intrusion gives him a vague one. He
 * still comes looking either way — Zetsu was never invisibility — but he comes
 * looking for a place rather than for a person, and he has spent the same
 * fifteen either way.
 */
function believeSweep(state: HuntState, sweep: EnSweep): HunterState['belief'] {
  if (!sweep.found.includes('player')) return state.hunter.belief
  return {
    at: state.player.position,
    spaceId: state.player.spaceId,
    from: 'en',
    sharp: sweep.auraRead.includes('player'),
    age: 0,
    cleared: [],
  }
}

function journalSweep(state: HuntState, sweep: EnSweep): TelemetryEvent[] {
  const swept = record(state.log, state.clock, {
    actor: 'hunter',
    kind: 'sweptEn',
    cost: EN_COST,
    where: state.hunter.spaceId,
  })
  const seen = sweep.auraRead.includes('player')
    ? record(swept, state.clock, { actor: 'hunter', kind: 'believed', where: state.player.spaceId })
    : swept
  // The other half of the same event: the player felt it go past, which is the
  // only warning the hunt ever gives them.
  return sweep.felt.includes('player')
    ? record(seen, state.clock, { actor: 'player', kind: 'feltEn', where: state.player.spaceId })
    : seen
}

/** His Gyo, on a floor he has a reason to distrust. He does not find them all. */
function resolveInspection(state: HuntState, intents: HunterIntents): HuntState {
  if (!intents.inspect) return state

  const looked = inspectRoom(
    {
      position: state.hunter.position,
      spaceId: state.hunter.spaceId,
      pool: state.hunter.pool,
      rng: state.hunter.rng,
    },
    state.ledger.placements,
  )

  const hunter = { ...state.hunter, pool: looked.pool, rng: looked.rng }
  if (looked.found.length === 0) {
    return { ...state, hunter, log: journalInspection(state, false) }
  }

  return {
    ...state,
    hunter,
    ledger: { ...state.ledger, placements: markSeen(state.ledger.placements, looked.found) },
    echoes: ring(state.echoes, { found: true }),
    log: journalInspection(state, true),
  }
}

function journalInspection(state: HuntState, found: boolean): TelemetryEvent[] {
  const looked = record(state.log, state.clock, {
    actor: 'hunter',
    kind: 'inspected',
    cost: INSPECT_COST,
    where: state.hunter.spaceId,
  })
  if (!found) return looked
  return record(looked, state.clock, {
    actor: 'hunter',
    kind: 'spottedEntrave',
    where: state.hunter.spaceId,
  })
}

/** Entraves the hunter has just walked into. Ones he has spotted, he steps over. */
function springUnderHunter(state: HuntState): HuntState {
  const caught = entravesUnderfoot(state.ledger.placements, {
    position: state.hunter.position,
    spaceId: state.hunter.spaceId,
  })
  if (caught.length === 0) return state

  const { ledger, hold } = springEntraves(state.ledger, caught)
  return {
    ...state,
    ledger,
    hunter: { ...state.hunter, held: hold },
    echoes: ring(state.echoes, { sprung: true }),
    log: record(state.log, state.clock, {
      actor: 'hunter',
      kind: 'sprungEntrave',
      where: state.hunter.spaceId,
    }),
  }
}

/** Feedback, then the verdict, then — on contact — the junction. */
function conclude(state: HuntState, world: HuntWorld): HuntState {
  const echoes = fade(state.echoes, world.dt)
  const sensed = { ...state, echoes, feedback: senseFor({ ...state, echoes }, world.graph) }
  const outcome = judgeHunt({
    clock: sensed.clock,
    gap: distance(sensed.player.position, sensed.hunter.position),
    playerSpaceId: sensed.player.spaceId,
    targetSpaceId: sensed.targetSpaceId,
    hunterSpent: sensed.hunter.pool.available <= 0,
    hunterHeld: sensed.hunter.held > 0,
  })

  if (outcome !== 'contact') return { ...sensed, outcome }
  return handOver({ ...sensed, outcome })
}

function senseFor(state: HuntState, graph: NavGraph) {
  return senseAround(
    {
      at: state.player.position,
      hunterAt: state.hunter.position,
      earshot: earshotBetween(state.player.spaceId, state.hunter.spaceId, graph),
    },
    state.echoes,
  )
}

/** The junction: the duel opens with what the hunt left, in the room it left it in. */
function handOver(state: HuntState): HuntState {
  const junction = openDuel(state.ledger, {
    hunterPool: state.hunter.pool,
    hunterHeld: state.hunter.held,
    spaceId: state.player.spaceId,
    seed: state.hunter.rng.seed,
  })

  const opened = record(state.log, state.clock, {
    actor: 'player',
    kind: 'duelOpened',
    where: state.player.spaceId,
  })

  return {
    ...state,
    duel: junction.duel,
    ledger: junction.ledger,
    log: junction.sprung.reduce(
      (log, placement) =>
        record(log, state.clock, {
          actor: 'hunter',
          kind: 'sprungEntrave',
          where: placement.spaceId,
        }),
      opened,
    ),
  }
}

/**
 * The duel's own tick. Breaking away hands the game back to the hunt with the
 * reservoir the duel left, which is the point of a rupture: it is a retreat,
 * not a reset.
 */
function advanceDuel(state: HuntState, dt: number): HuntState {
  const duel = playHunter(duelReducer(state.duel!, { type: 'TICK', dt }), dt)
  const carried = { ...state, clock: state.clock + dt, duel }

  // The ten minutes do not stop for the contact. The duel happens inside the
  // game rather than beside it, and a standoff neither duellist has a reason to
  // leave still costs the player the only thing they were ever playing for —
  // the room they have not reached. Without this the clock was suspended the
  // moment the two of them met, and a player content to cover could stand there
  // for the rest of time.
  if (carried.clock >= GAME_LENGTH) return { ...carried, outcome: 'timeUp' }

  if (duel.outcome === 'playing') return carried
  if (duel.outcome === 'broke') return backToTheHunt(carried)
  return {
    ...carried,
    outcome: duel.outcome === 'won' ? 'eliminated' : 'caught',
    log: record(carried.log, carried.clock, {
      actor: 'player',
      kind: 'duelClosed',
      where: duel.spaceId,
    }),
  }
}

function backToTheHunt(state: HuntState): HuntState {
  const duel = state.duel!
  return {
    ...state,
    duel: null,
    outcome: 'playing',
    ledger: { ...state.ledger, pool: duel.player.pool },
    hunter: { ...state.hunter, pool: duel.hunter.pool, held: duel.hunter.held },
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'duelClosed',
      where: duel.spaceId,
    }),
  }
}

function earshotBetween(
  playerSpace: string | null,
  hunterSpace: string | null,
  graph: NavGraph,
): 'same' | 'adjacent' | 'apart' {
  if (!playerSpace || !hunterSpace) return 'apart'
  if (playerSpace === hunterSpace) return 'same'
  return graph.edges.get(playerSpace)?.includes(hunterSpace) ? 'adjacent' : 'apart'
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** Whether the game is showing its ending rather than being played. */
export function huntIsOver(outcome: HuntOutcome): boolean {
  return outcome === 'reached' || outcome === 'timeUp' || outcome === 'eliminated'
}
