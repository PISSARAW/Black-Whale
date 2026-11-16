import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import type { ArcadeFighter, FightSide, FightState } from './types'

export interface MachiThread {
  owner: FightSide
  kind: 'mark' | 'bind'
  x: number
  y: number
}

/** Competitive reach, not a manga measurement. Longer threads cannot hold this bind. */
export const MACHI_BIND_RANGE = 16
export const MACHI_SUTURE_HEAL = 12

export function machiMoveId(fighter: ArcadeFighter): string | undefined {
  const move = fighter.attack?.moveId
  if (fighter.attack?.hatsuSource === 'machi' && move?.startsWith('chrollo:'))
    return 'machi:neutralSpecial'
  return move
}

export function machiUtilityMove(fighter: ArcadeFighter): boolean {
  return ['machi:neutralSpecial', 'machi:backSpecial'].includes(machiMoveId(fighter) ?? '')
}

export function machiImmobilized(fighter: ArcadeFighter): boolean {
  return fighter.machiThread?.kind === 'bind'
}

export function machiNenActive(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}

export function machiSourceActive(fighter: ArcadeFighter): boolean {
  if (!machiNenActive(fighter) || chainAbilitySealed(fighter, 'machi:downSpecial')) return false
  if (fighter.id === 'machi') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'machi')
  const held = fighter.kurapika?.held
  return held?.source === 'machi' && held.used
}

function holdingBind(fighter: ArcadeFighter): boolean {
  const move = machiMoveId(fighter)
  const handsFree = !fighter.attack || move === 'machi:downSpecial' || move === 'machi:finisher'
  return handsFree && fighter.hitStun === 0 && fighter.knockdownFrames === 0 && !fighter.blocking
}

export function machiThreadForOwner(state: FightState, side: FightSide): MachiThread | null {
  const target = state[side === 'player' ? 'opponent' : 'player']
  return target.machiThread?.owner === side ? target.machiThread : null
}

export function machiBindReady(state: FightState, side: FightSide): boolean {
  const target = state[side === 'player' ? 'opponent' : 'player']
  return machiThreadForOwner(state, side)?.kind === 'bind' && bindMaintained(state[side], target)
}

function bindMaintained(owner: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    machiSourceActive(owner) &&
    holdingBind(owner) &&
    Math.hypot(owner.x - target.x, owner.y - target.y) <= MACHI_BIND_RANGE
  )
}

export function releaseMachiThread(state: FightState, side: FightSide): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  if (state[targetSide].machiThread?.owner !== side) return state
  return { ...state, [targetSide]: clearMachiThread(state[targetSide]) }
}

/** Closing Machi's non-bookmarked page drops the actual link as well as its indicator. */
export function releaseMachiPageThread(
  state: FightState,
  side: FightSide,
  page: string,
): FightState {
  return page === 'machi' ? releaseMachiThread(state, side) : state
}

function clearMachiThread(fighter: ArcadeFighter): ArcadeFighter {
  return {
    ...fighter,
    machiThread: undefined,
    hatsuEffects: { ...fighter.hatsuEffects, stitchedFrames: 0 },
  }
}

export function advanceMachiThreads(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const target = next[side]
    const thread = target.machiThread
    if (!thread) continue
    const owner = next[thread.owner]
    if (target.health <= 0 || !machiSourceActive(owner)) {
      next = { ...next, [side]: clearMachiThread(target) }
      continue
    }
    const bind = thread.kind === 'bind' && bindMaintained(owner, target)
    const linked: ArcadeFighter = {
      ...target,
      machiThread: { ...thread, kind: bind ? 'bind' : 'mark' },
      hatsuEffects: { ...target.hatsuEffects, stitchedFrames: Number(bind) },
    }
    next = { ...next, [side]: bind ? holdTarget(linked, thread) : linked }
  }
  return next
}

function holdTarget(target: ArcadeFighter, thread: MachiThread): ArcadeFighter {
  return {
    ...target,
    x: thread.x,
    y: thread.y,
    velocityY: 0,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    motion: undefined,
    knockdownFrames: 0,
    pose: 'idle',
  }
}
