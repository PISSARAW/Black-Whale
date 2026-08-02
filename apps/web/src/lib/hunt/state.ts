/**
 * The whole of a game, as one typed value, and the pure reducer that moves it.
 *
 * Everything the player does deliberately — sweeping, dropping into Zetsu,
 * laying an entrave, taking one back, every verb of the duel — arrives here as
 * an action. Nothing in this file touches the DOM, reads a clock, or draws a
 * random number that is not already in the state, so a game is a list of
 * actions and a seed, and a bug in the aura accounting is reproducible rather
 * than anecdotal.
 *
 * The duel lives inside the hunt state rather than beside it. That is the
 * junction made structural: there is one reservoir, one ledger of placed aura,
 * and one journal, and the duel is a phase of the same game rather than a
 * second game handed the first one's numbers.
 */
import type { Vec2 } from '../tour/types'
import { fullPool, type AuraPool } from './aura'
import { noEchoes, quietFeedback, ring, type Echoes, type HuntFeedback } from './feedback'
import { initialHunterState, type HunterState } from './hunter/patrol'
import { EN_COST, sweepEn, type EnSweep } from './nen/en'
import { ENTRAVE_COST } from './nen/entrave'
import { placeAura, recoverAura, type Ledger } from './nen/placed'
import { toggled, type NenState } from './nen/states'
import { record, type TelemetryEvent } from './telemetry'
import type { HuntOutcome } from './outcome'
import { duelReducer, type DuelAction } from './duel/reducer'
import { recoverInDuel } from './duel/recover'
import type { DuelState } from './duel/state'
import type { HunterProfileId } from './hunter/profiles'
import {
  DEFAULT_HUNT_HATSU,
  initialHatsu,
  openFuture,
  readDowsing,
  type HuntHatsuId,
  type HuntHatsuState,
} from './hatsu'

export interface PlayerState {
  position: Vec2
  heading: number
  spaceId: string | null
  nen: NenState
  /** Standing still is the only thing that regenerates, so it is state. */
  atRest: boolean
}

export interface HuntState {
  /** The one declared ability brought into this run. */
  hatsu: HuntHatsuState
  player: PlayerState
  hunter: HunterState
  /** The player's reservoir and everything they have laid down, in one place. */
  ledger: Ledger
  feedback: HuntFeedback
  /** What has happened recently and is still being felt. See `ECHO_LASTS`. */
  echoes: Echoes
  outcome: HuntOutcome
  clock: number
  targetSpaceId: string | null
  duel: DuelState | null
  log: TelemetryEvent[]
  /** Serial for placement ids — no clock, no randomness, replayable. */
  nextId: number
}

export type HuntAction =
  | { type: 'WALKED'; player: Partial<PlayerState> }
  | { type: 'SWEEP' }
  | { type: 'ZETSU' }
  | { type: 'LAY' }
  | { type: 'TAKE' }
  | { type: 'DUEL'; action: DuelAction }
  | { type: 'TAKE_IN_DUEL' }
  | { type: 'HATSU' }

export interface HuntSetup {
  playerAt: { position: Vec2; spaceId: string }
  hunterAt: { position: Vec2; spaceId: string }
  targetSpaceId: string
  seed?: number
  hatsu?: HuntHatsuId
  hunterProfile?: HunterProfileId
}

export function initialHuntState(setup: HuntSetup): HuntState {
  return {
    hatsu: initialHatsu(setup.hatsu ?? DEFAULT_HUNT_HATSU),
    player: {
      position: setup.playerAt.position,
      heading: 0,
      spaceId: setup.playerAt.spaceId,
      nen: 'ten',
      atRest: true,
    },
    hunter: initialHunterState({
      ...setup.hunterAt,
      seed: setup.seed,
      profileId: setup.hunterProfile,
    }),
    ledger: { pool: fullPool(), placements: [] },
    feedback: quietFeedback(),
    echoes: noEchoes(),
    outcome: 'playing',
    clock: 0,
    targetSpaceId: setup.targetSpaceId,
    duel: null,
    log: [],
    nextId: 1,
  }
}

export function huntReducer(state: HuntState, action: HuntAction): HuntState {
  switch (action.type) {
    case 'WALKED':
      return {
        ...state,
        player: { ...state.player, ...action.player },
        log:
          action.player.spaceId && action.player.spaceId !== state.player.spaceId
            ? record(state.log, state.clock, {
                actor: 'player',
                kind: 'enteredRoom',
                where: action.player.spaceId,
              })
            : state.log,
        hatsu:
          action.player.atRest === false && state.hatsu.probableBearing
            ? { ...state.hatsu, probableBearing: null }
            : state.hatsu,
      }
    case 'SWEEP':
      return sweep(state)
    case 'ZETSU':
      return changeNen(state)
    case 'LAY':
      return lay(state)
    case 'TAKE':
      return take(state)
    case 'DUEL':
      return state.duel ? { ...state, duel: duelReducer(state.duel, action.action) } : state
    case 'TAKE_IN_DUEL':
      return takeInDuel(state)
    case 'HATSU':
      return useHatsu(state)
    default:
      return state
  }
}

/**
 * The player's own En. It costs the same fifteen the hunter pays and it is just
 * as loud: the sweep is recorded on both journals, because the hunter feeling it
 * is the half the player does not get told about.
 */
function sweep(state: HuntState): HuntState {
  const { pool, sweep: cast } = sweepEn(state.ledger.pool, {
    origin: state.player.position,
    caster: state.player.nen,
    bodies: [{ id: 'hunter', position: state.hunter.position, nen: 'ten' }],
  })
  if (!cast) return state

  return {
    ...state,
    ledger: { ...state.ledger, pool },
    hunter: heardSweep(state, cast),
    // Their own sweep going out. Fifteen points leave the body whether or not
    // it finds anything, and that is worth seeing happen.
    echoes: ring(state.echoes, { cast: true }),
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'sweptEn',
      cost: EN_COST,
      where: state.player.spaceId,
    }),
  }
}

/** A hunter the sweep passed over knows exactly where it came from. */
function heardSweep(state: HuntState, cast: EnSweep): HunterState {
  if (!cast.felt.includes('hunter')) return state.hunter
  return {
    ...state.hunter,
    belief: {
      ...state.hunter.belief,
      at: cast.origin,
      spaceId: state.player.spaceId,
      from: 'en',
      sharp: true,
      age: 0,
      cleared: [],
    },
  }
}

function changeNen(state: HuntState): HuntState {
  const nen = toggled(state.player.nen)
  return {
    ...state,
    player: { ...state.player, nen },
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: nen === 'zetsu' ? 'wentZetsu' : 'wentTen',
      where: state.player.spaceId,
    }),
  }
}

function lay(state: HuntState): HuntState {
  // Bungee Gum requires usable Nen and a surface. The current room's attested
  // floor is that surface; Zetsu makes the first condition false.
  if (state.hatsu.id !== 'bungee-gum' || !state.player.spaceId || state.player.nen === 'zetsu')
    return state
  const { ledger, placed } = placeAura(state.ledger, {
    id: `entrave-${state.nextId}`,
    cost: ENTRAVE_COST,
    at: {
      position: state.player.position,
      spaceId: state.player.spaceId,
      clock: state.clock,
    },
  })
  if (!placed) return state

  return {
    ...state,
    ledger,
    nextId: state.nextId + 1,
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'laidEntrave',
      cost: ENTRAVE_COST,
      where: placed.spaceId,
    }),
  }
}

function useHatsu(state: HuntState): HuntState {
  if (state.duel || state.hatsu.id === 'bungee-gum') return state

  if (state.hatsu.id === 'parallel-future') {
    if (state.player.nen !== 'zetsu') return state
    const intended = state.hunter.path.at(-1) ?? state.hunter.belief.spaceId ?? state.hunter.spaceId
    return withHatsuUse(state, openFuture(state.hatsu, intended))
  }

  if (state.player.nen !== 'ten' || !state.player.atRest) return state
  return withHatsuUse(state, readDowsing(state.hatsu, directionToHunter(state)))
}

function withHatsuUse(state: HuntState, hatsu: HuntHatsuState): HuntState {
  if (hatsu.uses === state.hatsu.uses) return state
  return {
    ...state,
    hatsu,
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'usedHatsu',
      where: state.player.spaceId,
    }),
  }
}

function directionToHunter(state: HuntState): Vec2 | null {
  const dx = state.hunter.position[0] - state.player.position[0]
  const dz = state.hunter.position[1] - state.player.position[1]
  const gap = Math.hypot(dx, dz)
  return gap === 0 ? null : [dx / gap, dz / gap]
}

function take(state: HuntState): HuntState {
  const reachable = state.ledger.placements.find(
    (placement) => placement.state === 'set' && placement.spaceId === state.player.spaceId,
  )
  if (!reachable) return state

  const { ledger, recovered } = recoverAura(state.ledger, reachable.id)
  if (!recovered) return state

  return {
    ...state,
    ledger,
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'tookEntraveBack',
      cost: -recovered.cost,
      where: recovered.spaceId,
    }),
  }
}

function takeInDuel(state: HuntState): HuntState {
  if (!state.duel) return state
  const { duel, ledger, recovered } = recoverInDuel(state.ledger, state.duel)
  if (recovered.length === 0) return state

  return {
    ...state,
    duel,
    ledger,
    log: record(state.log, state.clock, {
      actor: 'player',
      kind: 'tookEntraveBack',
      cost: -ENTRAVE_COST,
      where: duel.spaceId,
    }),
  }
}

/** The reservoir as it stands, for the gauge and for the junction. */
export function poolOfPlayer(state: HuntState): AuraPool {
  return state.duel ? state.duel.player.pool : state.ledger.pool
}
