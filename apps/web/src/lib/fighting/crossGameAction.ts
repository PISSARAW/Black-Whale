import { witnessedHatsuState } from './nenWitness'
import { canStartFighterAttack } from './fighterAttacks'
import {
  confineCrossGame,
  crossGameBusy,
  crossGameCanWarn,
  crossGameIntent,
  CROSS_GAME_COST,
  CROSS_GAME_DISPLAY,
  CROSS_GAME_MOVE,
} from './crossGame'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** The yellow card is shown with a spoken order; it is never a strike or projectile. */
export function performCrossGameAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  if (kind !== 'special' || !crossGameIntent(state[side], moveId)) return null
  if (state[side].id === 'mizaistom' && moveId && moveId !== CROSS_GAME_MOVE) return state
  if (!crossGameCanWarn(state, side)) return state
  if (!canStartFighterAttack(state[side], kind, moveId)) return state
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: state[side].aura - CROSS_GAME_COST,
      crossGameCardFrames: CROSS_GAME_DISPLAY,
      blocking: false,
      guardFrames: 0,
      bufferedAttack: null,
      motion: undefined,
    },
    [targetSide]: {
      ...target,
      crossGame: {
        owner: side,
        phase: 'warning',
        noticeFrames: CROSS_GAME_DISPLAY,
        x: target.x,
        y: target.y,
      },
      hatsuEffects: {
        ...target.hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'mizaistom' }),
      },
    },
  }
}

/** Only an accepted new bodily action violates the order, never an invalid/buffered input. */
export function resolveCrossGameCommand(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const fighter = before[side]
  if (fighter.crossGame?.phase !== 'warning' || fighter.crossGame.noticeFrames > 0) return after
  const next = after[side]
  const startsAttack = next.attack && next.attack !== fighter.attack && next.attack.frame === 0
  const startsUtility = next.aura < fighter.aura || next.hanzoProjection !== fighter.hanzoProjection
  return startsAttack || startsUtility ? confineCrossGame(before, side) : after
}

/** Inspect locomotion before impacts/pushboxes: involuntary displacement never counts. */
export function resolveCrossGameMovement(before: FightState, after: FightState): FightState {
  let next = after
  for (const side of ['player', 'opponent'] as const) {
    const old = before[side]
    const moved = after[side]
    if (voluntaryMovement(old, moved)) next = confineCrossGame(next, side)
  }
  return next
}

function warningReady(fighter: ArcadeFighter): boolean {
  return (
    fighter.crossGame?.phase === 'warning' &&
    fighter.crossGame.noticeFrames === 0 &&
    !crossGameBusy(fighter)
  )
}

function voluntaryMovement(old: ArcadeFighter, moved: ArcadeFighter): boolean {
  if (!warningReady(old)) return false
  if (old.hitStun > 0 || old.blockStun > 0 || old.knockdownFrames > 0 || old.attack) return false
  if (old.y > 0) return false
  return moved.x !== old.x || beginsJump(old, moved)
}

function beginsJump(old: ArcadeFighter, moved: ArcadeFighter): boolean {
  return (
    moved.velocityY > old.velocityY ||
    (moved.motion?.prejumpFrames ?? 0) > (old.motion?.prejumpFrames ?? 0)
  )
}
