import { voluntaryNenAvailable } from './nenAccess'
import { canSpeak, senseDeprived } from './saiyuSenses'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface CrossGameState {
  owner: FightSide
  phase: 'warning' | 'restrained'
  noticeFrames: number
  x: number
  y: number
}

export const CROSS_GAME_MOVE = 'mizaistom:neutralSpecial'
export const CROSS_GAME_RANGE = 28
export const CROSS_GAME_COST = 40
export const CROSS_GAME_RESTRAINT = 90
export const CROSS_GAME_DISPLAY = 18

export function crossGameIntent(fighter: ArcadeFighter, moveId?: string): boolean {
  return fighter.id === 'mizaistom' || chrolloPageForMove(fighter, moveId) === 'mizaistom'
}

export function crossGameNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter) && !fighter.stolenChainAbility && crossGameOwned(fighter)
}

function crossGameOwned(fighter: ArcadeFighter): boolean {
  const borrowed = fighter.kurapika?.held
  return (
    fighter.id === 'mizaistom' ||
    chrolloHasActivePage(fighter, 'mizaistom') ||
    Boolean(borrowed?.used && borrowed.source === 'mizaistom')
  )
}

/** A bodily confinement, not hitstun, silence, forced Zetsu or damage. */
export function crossGameRestrained(fighter: ArcadeFighter): boolean {
  return fighter.crossGame?.phase === 'restrained'
}

export function crossGameBusy(fighter: ArcadeFighter): boolean {
  return crossGameRestrained(fighter) || (fighter.crossGameCardFrames ?? 0) > 0
}

export function crossGameCanWarn(state: FightState, side: FightSide): boolean {
  const owner = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return (
    crossGameBodyReady(owner) &&
    crossGameNenActive(owner) &&
    owner.aura >= CROSS_GAME_COST &&
    !target.crossGame &&
    target.health > 0 &&
    Math.hypot(owner.x - target.x, owner.y - target.y) <= CROSS_GAME_RANGE &&
    warningPerceived(owner, target)
  )
}

function warningPerceived(owner: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    canSpeak(owner) &&
    !target.coveringEars &&
    !senseDeprived(target, 'hearing') &&
    !senseDeprived(target, 'sight')
  )
}

function crossGameBodyReady(fighter: ArcadeFighter): boolean {
  if (fighter.hanzoProjection || fighter.parallelEyesClosed || fighter.melodyPerformance)
    return false
  return (
    !crossGameBusy(fighter) &&
    !fighter.attack &&
    fighter.y === 0 &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.hatsuEffects.entrancedFrames === 0
  )
}

export function confineCrossGame(state: FightState, side: FightSide): FightState {
  const target = state[side]
  const warning = target.crossGame
  if (warning?.phase !== 'warning' || warning.noticeFrames > 0) return state
  if (!crossGameNenActive(state[warning.owner])) return state
  return {
    ...state,
    [warning.owner]: { ...state[warning.owner], crossGameCardFrames: CROSS_GAME_DISPLAY },
    [side]: holdCrossGame({
      ...target,
      crossGame: { ...warning, phase: 'restrained', x: target.x, y: target.y },
      hatsuEffects: { ...target.hatsuEffects, restrainedFrames: CROSS_GAME_RESTRAINT },
    }),
  }
}

export function holdCrossGame(fighter: ArcadeFighter): ArcadeFighter {
  if (!crossGameRestrained(fighter)) return fighter
  return {
    ...fighter,
    x: fighter.crossGame!.x,
    y: fighter.crossGame!.y,
    velocityY: 0,
    motion: undefined,
    pose: 'idle',
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    melodyPerformance: undefined,
  }
}

export function advanceCrossGame(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const fighter = next[side]
    const crossGame = fighter.crossGame
    const card = fighter.hitStun > 0 ? 0 : Math.max(0, (fighter.crossGameCardFrames ?? 0) - 1)
    const frames = Math.max(0, fighter.hatsuEffects.restrainedFrames - 1)
    const active =
      crossGame &&
      crossGameNenActive(next[crossGame.owner]) &&
      fighter.health > 0 &&
      (crossGame.phase === 'warning' || frames > 0)
    next = {
      ...next,
      [side]: holdCrossGame({
        ...fighter,
        crossGameCardFrames: card,
        crossGame: active
          ? { ...crossGame, noticeFrames: Math.max(0, crossGame.noticeFrames - 1) }
          : undefined,
        hatsuEffects: { ...fighter.hatsuEffects, restrainedFrames: active ? frames : 0 },
      }),
    }
  }
  return next
}
