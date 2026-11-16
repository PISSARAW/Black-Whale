import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { maryHasInfusion } from './bloodyMaryEquipment'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const MARY_CAPACITY = 6
export const MARY_BAGS = 6
export const MARY_BIND_COST = 12
export const MARY_REACH = 30
export const MARY_HOLD_FRAMES = 90
export const MARY_SLAM_NOTICE = 30
export const MARY_ESCAPE_FRAMES = 24
export const MARY_SCOUT_LIFE = 30 * 60 * 60
export const MARY_INFUSION_FRAMES = 120
export type MaryCommand = 'bleed' | 'bind' | 'slam' | 'scout' | 'recall' | 'infuse'

export interface MaryTendril {
  phase: 'flying' | 'resting' | 'bound' | 'returning'
  x: number
  y: number
  originX: number
  aimX: number
  aimY: number
  age: number
  units: number
}
export interface MaryDrop {
  id: number
  x: number
  y: number
  direction: -1 | 1
  remainingFrames: number
  reformFrames: number
}
export interface BloodyMaryState {
  available: number
  bags: number
  command?: MaryCommand
  sourceMoveId?: string
  tendril?: MaryTendril
  drops: readonly MaryDrop[]
  returning?: boolean
  infusion?: { remainingFrames: number; originX: number; health: number }
  lastSeen?: { x: number; y: number; frame: number }
}
export interface MaryCapture {
  owner: FightSide
  x: number
  y: number
  frames: number
  resistance: number
  health: number
}

export const maryState = (fighter: ArcadeFighter): BloodyMaryState =>
  fighter.bloodyMary ?? { available: MARY_CAPACITY, bags: MARY_BAGS, drops: [] }

export function maryNen(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireReserve: true })
}

export function maryOwned(fighter: ArcadeFighter): boolean {
  if (fighter.hatsuEffects.hatsuStolen > 0) return false
  if (fighter.id === 'zakuro') return !chainAbilitySealed(fighter, 'zakuro:neutralSpecial')
  if (fighter.kurapika?.held?.source === 'zakuro') return fighter.kurapika.held.loaded
  return chrolloHasActivePage(fighter, 'zakuro')
}

export function maryAuthority(fighter: ArcadeFighter, moveId?: string): boolean {
  if (!maryOwned(fighter) || !maryNen(fighter) || !maryHasInfusion(fighter)) return false
  if (fighter.id !== 'chrollo' || !moveId) return true
  return chrolloPageForMove(fighter, moveId) === 'zakuro'
}

export const maryHeld = (fighter: ArcadeFighter): boolean => Boolean(fighter.maryCapture)
export const maryBusy = (fighter: ArcadeFighter): boolean =>
  Boolean(fighter.bloodyMary?.tendril || fighter.bloodyMary?.drops.length)

export function maryBodyFree(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    !fighter.attack &&
    fighter.y === 0 &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !maryHeld(fighter) &&
    !fighter.hanzoProjection &&
    !fighter.biohazardRestraint &&
    !fighter.crossGame
  )
}

export function maryResists(fighter: ArcadeFighter): boolean {
  return fighter.aura >= 30 && (fighter.nen.mode === 'ren' || fighter.nen.ken)
}

/** Physical confinement leaves the target's Nen untouched. */
export function holdMary(fighter: ArcadeFighter): ArcadeFighter {
  const capture = fighter.maryCapture
  if (!capture) return fighter
  return {
    ...fighter,
    x: capture.x,
    y: capture.y,
    velocityY: 0,
    motion: undefined,
    attack: null,
    bufferedAttack: null,
    blocking: false,
    guardFrames: 0,
    pose: 'idle',
  }
}

export function maryCommandReady(
  state: FightState,
  side: FightSide,
  command: MaryCommand,
): boolean {
  const fighter = state[side]
  if (state.phase !== 'fighting' || state.catsName || !maryBodyFree(fighter)) return false
  if (!maryOwned(fighter) || !maryHasInfusion(fighter)) return false
  const blood = maryState(fighter)
  if (blood.infusion) return false
  const material = maryPreparationReady(fighter, command)
  if (material !== null) return material
  if (!maryAuthority(fighter)) return false
  return maryNenCommandReady(state, side, command)
}

function maryNenCommandReady(state: FightState, side: FightSide, command: MaryCommand): boolean {
  const fighter = state[side]
  if (command === 'recall') return maryBusy(fighter)
  if (command === 'slam') return marySlamReady(state, side)
  return maryDeploymentReady(fighter, command)
}

function maryPreparationReady(fighter: ArcadeFighter, command: MaryCommand): boolean | null {
  if (command === 'bleed')
    return (fighter.openWounds ?? 0) === 0 && fighter.health > 2 && fighter.aura >= 1
  if (command !== 'infuse') return null
  const blood = maryState(fighter)
  return (
    blood.bags > 0 && blood.available < MARY_CAPACITY && !maryBusy(fighter) && fighter.aura >= 1
  )
}

function marySlamReady(state: FightState, side: FightSide): boolean {
  const capture = state[side === 'player' ? 'opponent' : 'player'].maryCapture
  return capture?.owner === side && capture.frames <= MARY_HOLD_FRAMES - MARY_SLAM_NOTICE
}

function maryDeploymentReady(fighter: ArcadeFighter, command: MaryCommand): boolean {
  const blood = maryState(fighter)
  if ((fighter.openWounds ?? 0) === 0 || blood.tendril || blood.drops.length) return false
  const cost = command === 'bind' ? MARY_BIND_COST : 8
  return blood.available >= 3 && fighter.aura >= cost
}
