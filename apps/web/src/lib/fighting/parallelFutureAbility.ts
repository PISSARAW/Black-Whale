import { voluntaryNenAvailable } from './nenAccess'
import { startFutureField } from './futureIllusion'
import { transitionNen } from '@black-whale/nen-engine'
import { hatsuSourceFor, triggerHatsu } from './hatsu'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function futureNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { allowVoluntaryZetsu: true, requireReserve: true })
}

export function futureCanPrepare(fighter: ArcadeFighter): boolean {
  if (fighter.futureIllusionMode && !fighter.futureStoredFrames) return false
  return (
    futureNenAvailable(fighter) &&
    fighter.y === 0 &&
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.chainJail &&
    !fighter.drainingChain
  )
}

export function futureSource(fighter: ArcadeFighter, moveId?: string): boolean {
  return hatsuSourceFor(fighter, moveId) === 'tserriednich'
}

/** Closed eyes are a vulnerable stance, never an attack, guard, dodge or invulnerability. */
export function closeFutureEyes(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    parallelEyesClosed: true,
    nen: transitionNen(fighter.nen, { type: 'ZETSU' }).state,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    crouching: false,
    guardFrames: 0,
    wakeupInvulnerableFrames: 0,
    reversalWindow: 0,
    hatsuChargeFrames: 0,
    ryuWindow: 0,
    pose: 'idle',
  }
}

export function stopParallelFuture(state: FightState, keepField = false): FightState {
  return {
    ...state,
    parallelFuture: undefined,
    futureIllusion: keepField ? state.futureIllusion : undefined,
    player: {
      ...state.player,
      parallelEyesClosed: false,
      futureIllusionActive: keepField && state.player.futureIllusionActive,
    },
    opponent: {
      ...state.opponent,
      parallelEyesClosed: false,
      futureIllusionActive: keepField && state.opponent.futureIllusionActive,
    },
  }
}

export function beginFutureDivergence(state: FightState, side: FightSide): FightState {
  const future = state.parallelFuture
  if (future?.owner !== side || future.phase !== 'vision') return state
  const field = startFutureField(state, side)
  return {
    ...field,
    [side]: { ...field[side], parallelEyesClosed: false },
    parallelFuture: { ...future, phase: 'diverging', cursor: 0 },
  }
}

/** Intercepts commands before the shared rule that normally forbids Hatsu in Zetsu. */
export function performParallelFutureAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  const future = state.parallelFuture
  const blocked = futureCommandBlocked(options)
  if (blocked) return state
  if (kind !== 'special') return null
  if (!futureSource(state[side], moveId)) return state[side].parallelEyesClosed ? state : null
  if (state.forecastSimulation) return state
  if (future) return futureCommand(state, side)
  if (moveId === 'tserriednich:finisher' || !futureCanPrepare(state[side])) return state
  const witnessed = triggerHatsu(state, side, 'tserriednich')
  return {
    ...witnessed,
    [side]: closeFutureEyes(state[side]),
    parallelFuture: {
      owner: side,
      sourceMoveId: moveId,
      phase: 'preparing',
      preparation: 0,
      cursor: 0,
      previewCursor: 0,
      frames: [],
      controls: null,
    },
  }
}

function futureCommand(state: FightState, side: FightSide): FightState {
  if (state.parallelFuture?.owner !== side) return state
  if (state.parallelFuture.phase === 'vision') return beginFutureDivergence(state, side)
  return stopParallelFuture(state)
}

export function futureMoveResources(fighter: ArcadeFighter, moveId: string): boolean | null {
  if (fighter.id !== 'tserriednich' || !moveId.startsWith('tserriednich:')) return null
  if (!['tserriednich:neutralSpecial', 'tserriednich:finisher'].includes(moveId)) return null
  return futureNenAvailable(fighter)
}

function futureCommandBlocked({ state, side, kind }: AuraAttackOptions): boolean {
  const future = state.parallelFuture
  if (future && !future.replaying && future.owner !== side) return future.phase !== 'preparing'
  return kind !== 'special' && Boolean(state[side].parallelEyesClosed)
}

export function futureAcceptsMove(state: FightState, side: FightSide): boolean {
  const future = state.parallelFuture
  if (!future || future.replaying || future.phase === 'preparing') return true
  return future.owner === side
}
