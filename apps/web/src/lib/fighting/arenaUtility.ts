import { witnessedHatsuState } from './nenWitness'
import { arenaNenAvailable, arenaObjects } from './arenaActions'
import { storeArenaVacuum, ejectArenaVacuum } from './arenaVacuum'
import { liveEntity, updateEntity } from './preparationWorld'
import { chrolloHasActivePage } from './chrolloBook'
import type { ArenaState } from './arenaTypes'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

type Pending = NonNullable<ArenaState['pending']['player']>
type Tether = NonNullable<ArenaState['tether']['player']>

function arenaWounded(fighter: ArcadeFighter): boolean {
  return (
    fighter.hitStun > 0 ||
    fighter.blockStun > 0 ||
    fighter.knockdownFrames > 0 ||
    fighter.health <= 0
  )
}

function arenaUtilityInterrupted(fighter: ArcadeFighter): boolean {
  return arenaWounded(fighter) || Boolean(fighter.attack)
}

export function advanceArenaUtility(state: FightState, side: FightSide): FightState {
  const pending = state.arena!.pending[side]
  if (!pending) return state
  const interrupted = arenaUtilityInterrupted(state[side]) || !arenaNenAvailable(state, side)
  const frames = pending.frames - 1
  state = {
    ...state,
    arena: {
      ...state.arena!,
      pending: {
        ...state.arena!.pending,
        [side]: interrupted || frames <= 0 ? undefined : { ...pending, frames },
      },
    },
  }
  if (interrupted || frames > 0) return state
  const entry = utilityObject(state, side, pending)
  return entry ? completeUtility({ state, side, pending, entry }) : state
}

function utilityObject(state: FightState, side: FightSide, pending: Pending) {
  const entry = state.battlefield?.entities.find((object) => object.id === pending.objectId)
  if (!entry?.arena) return undefined
  if (state.arena!.stored[side] === entry.id) return entry
  const fighter = state[side]
  const reach = pending.kind === 'gum' ? 24 : 8
  return liveEntity(entry) && Math.hypot(entry.x - fighter.x, entry.y - fighter.y) <= reach
    ? entry
    : undefined
}

function completeUtility(context: {
  state: FightState
  side: FightSide
  pending: Pending
  entry: PreparedEntity
}): FightState {
  const { state, side, pending, entry } = context
  let next = state
  if (pending.kind === 'gum' || pending.kind === 'thread')
    next = {
      ...state,
      arena: {
        ...state.arena!,
        tether: {
          ...state.arena!.tether,
          [side]: { objectId: entry.id, kind: pending.kind, pulling: pending.kind === 'thread' },
        },
      },
    }
  else if (pending.kind === 'marks') next = stampObject(state, side, entry)
  else next = vacuumObject(state, side, entry)
  if (next === state) return state
  const witness = side === 'player' ? 'opponent' : 'player'
  return {
    ...next,
    [witness]: {
      ...next[witness],
      hatsuEffects: {
        ...next[witness].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: state[side].id }),
      },
    },
  }
}

function stampObject(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  const fighter = state[side]
  if (!chrolloHasActivePage(fighter, 'sun-and-moon')) return state
  const mark = fighter.chrolloBook?.open ? 'sun' : 'moon'
  return updateEntity(state, entry.id, { arena: { ...entry.arena!, [mark]: side } })
}

function vacuumObject(state: FightState, side: FightSide, entry: PreparedEntity): FightState {
  return state.arena!.stored[side] === entry.id
    ? ejectArenaVacuum(state, side)
    : storeArenaVacuum(state, side, entry)
}

export function advanceArenaTether(state: FightState, side: FightSide): FightState {
  const tether = state.arena!.tether[side]
  if (!tether) return state
  const entry = arenaObjects(state).find((object) => object.id === tether.objectId)
  if (!entry || !tetherSurvives(state, side, tether))
    return {
      ...state,
      arena: { ...state.arena!, tether: { ...state.arena!.tether, [side]: undefined } },
    }
  const fighter = state[side]
  if (!tetherCanPull(fighter, tether)) return state
  const distance = entry.x - fighter.x
  if (Math.abs(distance) <= 7) return state
  if (tether.kind === 'gum') return pullBody(state, side, distance)
  const x = entry.x - Math.sign(distance) * Math.min(0.16, Math.abs(distance) - 7)
  return occupiedCrate(state, { ...entry, x }) ? state : updateEntity(state, entry.id, { x })
}

function tetherSurvives(state: FightState, side: FightSide, tether: Tether): boolean {
  const entry = arenaObjects(state).find((object) => object.id === tether.objectId)!
  const fighter = state[side]
  const limit = tether.kind === 'gum' ? 30 : 24
  return (
    arenaNenAvailable(state, side) &&
    !arenaWounded(fighter) &&
    Math.abs(entry.x - fighter.x) <= limit
  )
}

function pullBody(state: FightState, side: FightSide, distance: number): FightState {
  const fighter = state[side]
  const x = fighter.x + Math.sign(distance) * Math.min(0.75, Math.abs(distance) - 7)
  if (arenaObjects(state).some((entry) => Math.abs(entry.x - x) < entry.arena!.width + 2.5))
    return state
  return { ...state, [side]: { ...fighter, x } }
}

function occupiedCrate(state: FightState, moved: PreparedEntity): boolean {
  if (['player', 'opponent'].some((key) => Math.abs(state[key as FightSide].x - moved.x) < 6))
    return true
  return arenaObjects(state).some(
    (entry) => entry.id !== moved.id && Math.abs(entry.x - moved.x) < 6.1,
  )
}

function tetherCanPull(fighter: ArcadeFighter, tether: Tether): boolean {
  return tether.pulling && !fighter.attack && !fighter.arenaRecovery && !fighter.melodyPerformance
}
