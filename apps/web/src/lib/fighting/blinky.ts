import { sleepingBody } from './hanzoProjection'
import { canUseHatsu } from '@black-whale/nen-engine'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hatsuSealedByOn } from './onTechnique'
import { predatorNenLocked } from './predatorSeal'
import type { ArcadeFighter, FightInput, FightProjectile, FightSide, FightState } from './types'

export type BlinkyTarget = 'bullet' | 'card' | 'stone' | 'needle'
export type BlinkyCommand = 'suction' | 'eject' | 'blood'
export interface BlinkyState {
  lastArenaObject?: string
  target: BlinkyTarget
  command?: BlinkyCommand
  lastObject?: FightProjectile
  lastWasBlood?: boolean
}
export const BLINKY_RANGE = 20
export const BLINKY_HALF_HEIGHT = 3
export const BLINKY_BLOOD_INTERVAL = 15
export const BLINKY_BLOOD_DAMAGE = 3
export const blinkyState = (fighter: ArcadeFighter): BlinkyState =>
  fighter.blinky ?? { target: 'bullet' }

export function blinkyAvailable(fighter: ArcadeFighter): boolean {
  if (!blinkyNenAvailable(fighter)) return false
  if (fighter.kurapika?.held?.used && fighter.kurapika.held.source === 'shizuku') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'shizuku')
  return fighter.id === 'shizuku' && !chainAbilitySealed(fighter, 'shizuku:neutralSpecial')
}

function blinkyNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    fighter.aura > 0 &&
    !fighter.auraExhausted &&
    canUseHatsu(fighter.nen) &&
    !fighter.nen.on &&
    !hatsuSealedByOn(fighter) &&
    !predatorNenLocked(fighter) &&
    fighter.hatsuEffects.hatsuStolen === 0 &&
    fighter.hatsuEffects.forcedZetsuFrames === 0
  )
}

/** One named material category, not indiscriminate suction of everything nearby. */
export function designateBlinkyTarget(
  state: FightState,
  side: FightSide,
  target: BlinkyTarget,
): FightState {
  if (!['bullet', 'card', 'stone', 'needle'].includes(target) || state[side].attack) return state
  return { ...state, [side]: { ...state[side], blinky: { ...blinkyState(state[side]), target } } }
}

const NATIVE_BLINKY_COMMANDS: Readonly<Record<string, BlinkyCommand>> = {
  'shizuku:neutralSpecial': 'suction',
  'shizuku:downSpecial': 'suction',
  'shizuku:backSpecial': 'eject',
  'shizuku:finisher': 'blood',
}
export function blinkyCommand(
  fighter: ArcadeFighter,
  moveId = fighter.attack?.moveId,
): BlinkyCommand | null {
  if (copiedBlinkyCommand(fighter, moveId)) return blinkyState(fighter).command ?? 'suction'
  if (moveId) return NATIVE_BLINKY_COMMANDS[moveId] ?? null
  return fighter.id === 'shizuku' && fighter.attack?.kind === 'special' ? 'suction' : null
}
function copiedBlinkyCommand(fighter: ArcadeFighter, moveId?: string): boolean {
  if (moveId === 'shizuku:forwardSpecial') return false
  if (borrowedBlinky(fighter)) return true
  if (fighter.id === 'shizuku') return false
  if (fighter.attack?.hatsuSource === 'shizuku' && moveId === fighter.attack.moveId) return true
  return chrolloPageForMove(fighter, moveId) === 'shizuku'
}
function borrowedBlinky(fighter: ArcadeFighter): boolean {
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'shizuku')
}

export function blinkyUtilityAttack(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && blinkyCommand(fighter) !== null
}

/** Coordinates are lane units. The nozzle has a facing and an actual vertical aperture. */
export function inBlinkyNozzle(fighter: ArcadeFighter, point: { x: number; y: number }): boolean {
  const forward = (point.x - fighter.x) * fighter.facing
  return (
    forward >= 1 &&
    forward <= BLINKY_RANGE &&
    Math.abs(point.y - blinkyNozzleY(fighter)) <= BLINKY_HALF_HEIGHT
  )
}
export function blinkyNozzleY(fighter: ArcadeFighter): number {
  return fighter.y + (fighter.attack?.moveId === 'shizuku:downSpecial' ? 2 : 6.1)
}

/** Two occupied hands can cover at most two separate wounds in this duel abstraction. */
export function exposedBlinkyWounds(fighter: ArcadeFighter): number {
  return Math.max(0, (fighter.openWounds ?? 0) - (fighter.pluggingWounds ? 2 : 0))
}
function handsFreeForPlugging(fighter: ArcadeFighter): boolean {
  return (
    fighter.health > 0 &&
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.hanzoProjection &&
    !fighter.coveringEars &&
    !fighter.melodyPerformance
  )
}
export function plugWoundsInput(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const pluggingWounds =
    Boolean(input.plugWounds) && (fighter.openWounds ?? 0) > 0 && handsFreeForPlugging(fighter)
  return {
    ...fighter,
    pluggingWounds,
    bufferedAttack: pluggingWounds ? null : fighter.bufferedAttack,
  }
}

export function blinkyBloodReady(state: FightState, side: FightSide): boolean {
  const other = side === 'player' ? 'opponent' : 'player'
  const body = sleepingBody(state[other])
  return (
    blinkyAvailable(state[side]) &&
    exposedBlinkyWounds(state[other]) > 0 &&
    inBlinkyNozzle(state[side], { x: body.x, y: body.y + 6.1 })
  )
}

export function selectBlinkyCommand(
  state: FightState,
  side: FightSide,
  command: BlinkyCommand,
): FightState {
  if (state[side].attack) return state
  return { ...state, [side]: { ...state[side], blinky: { ...blinkyState(state[side]), command } } }
}
