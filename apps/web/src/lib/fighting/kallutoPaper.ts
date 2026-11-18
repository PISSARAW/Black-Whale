import { voluntaryNenAvailable } from './nenAccess'
import { chrolloHasActivePage, chrolloPageForMove } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { sleepingBody } from './hanzoProjection'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export type PaperCommand = 'plant' | 'serpent' | 'doll'
export const PAPER_COSTS = { plant: 16, serpent: 24, doll: 12 } as const
export interface PlantedPaper {
  owner: FightSide
  zone: FightNenZone
}
export interface PaperWords {
  frame: number
  speaker: FightSide
  text: string
}
export interface KallutoPaperState {
  zone: FightNenZone
  command?: PaperCommand
  doll?: { target: FightSide; createdAt: number }
  heard?: PaperWords
}
export const PAPER_ZONES: readonly FightNenZone[] = ['head', 'torso', 'hands', 'feet']
export const paperState = (fighter: ArcadeFighter): KallutoPaperState =>
  fighter.kallutoPaper ?? { zone: 'torso' }

export function paperAvailable(fighter: ArcadeFighter): boolean {
  return (
    ownsPaper(fighter) &&
    !fighter.weaponsConfiscated &&
    paperNenAvailable(fighter) &&
    !chainAbilitySealed(fighter, 'kalluto:neutralSpecial')
  )
}
function ownsPaper(fighter: ArcadeFighter): boolean {
  if (fighter.id === 'kalluto') return true
  if (fighter.id === 'chrollo') return chrolloHasActivePage(fighter, 'kalluto')
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'kalluto')
}
function paperNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter, { requireReserve: true })
}
const PAPER_COMMANDS: Readonly<Record<string, PaperCommand>> = {
  'kalluto:neutralSpecial': 'plant',
  'kalluto:downSpecial': 'plant',
  'kalluto:forwardSpecial': 'serpent',
  'kalluto:finisher': 'serpent',
  'kalluto:backSpecial': 'doll',
}
export function paperCommand(
  fighter: ArcadeFighter,
  moveId = fighter.attack?.moveId,
): PaperCommand | null {
  if (fighter.id === 'kalluto') return PAPER_COMMANDS[moveId ?? 'kalluto:neutralSpecial'] ?? null
  return copiedPaperCommand(fighter, moveId) ? (paperState(fighter).command ?? 'plant') : null
}
function copiedPaperCommand(fighter: ArcadeFighter, moveId?: string): boolean {
  if (chrolloPageForMove(fighter, moveId) === 'kalluto') return true
  if (fighter.attack?.hatsuSource === 'kalluto' && moveId === fighter.attack.moveId) return true
  const held = fighter.kurapika?.held
  return Boolean(held?.used && held.source === 'kalluto')
}

export function paperUtilityAttack(fighter: ArcadeFighter): boolean {
  return fighter.attack?.kind === 'special' && paperCommand(fighter) !== null
}
export function selectedPaperZone(fighter: ArcadeFighter): FightNenZone {
  return fighter.attack?.moveId === 'kalluto:downSpecial' ? 'feet' : paperState(fighter).zone
}
export function hasPlantedPaper(state: FightState, owner: FightSide, zone?: FightNenZone): boolean {
  const target = owner === 'player' ? 'opponent' : 'player'
  return Boolean(
    state[target].plantedPaper?.some(
      (paper) => paper.owner === owner && (!zone || paper.zone === zone),
    ),
  )
}
export function paperCommandReady(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): boolean {
  if (!paperAvailable(state[side])) return false
  if (command === 'plant') return true
  return hasPlantedPaper(
    state,
    side,
    command === 'serpent' ? paperState(state[side]).zone : undefined,
  )
}
export function paperMoveAllowed(state: FightState, side: FightSide, moveId?: string): boolean {
  const command = paperCommand(state[side], moveId)
  return !command || paperCommandReady(state, side, command)
}
export function selectPaperTarget(
  state: FightState,
  side: FightSide,
  zone: FightNenZone,
): FightState {
  if (!PAPER_ZONES.includes(zone) || state[side].attack) return state
  return {
    ...state,
    [side]: { ...state[side], kallutoPaper: { ...paperState(state[side]), zone } },
  }
}
export function selectPaperCommand(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): FightState {
  if (!['plant', 'serpent', 'doll'].includes(command) || state[side].attack) return state
  return {
    ...state,
    [side]: { ...state[side], kallutoPaper: { ...paperState(state[side]), command } },
  }
}

/** Zone positions follow the actual body, including crouch, knockdown and Hanzo's sleeping body. */
export function paperZonePoint(
  fighter: ArcadeFighter,
  zone: FightNenZone,
): { x: number; y: number } {
  const body = sleepingBody(fighter)
  const height = { head: 10.5, torso: 6.8, hands: 5.5, feet: 1.5 }[zone]
  const y = body.knockdownFrames > 0 ? 2 : Math.max(1, height - (body.crouching ? 4 : 0))
  return { x: body.x + (zone === 'hands' ? body.facing * 1.5 : 0), y: body.y + y }
}
