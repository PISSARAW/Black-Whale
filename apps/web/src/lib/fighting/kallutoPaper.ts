import { chrolloPageForMove } from './chrolloBook'
import { paperAbilityAvailable } from './kallutoAccess'
import { paperMaterialsReady } from './kallutoMaterials'
export { paperAvailable } from './kallutoAccess'
import { sleepingBody } from './hanzoProjection'
import { paperMarksAt, activePaperOwner } from './kallutoSurveillance'
import type { KallutoPaperState, PaperCommand } from './kallutoPaperTypes'
export type { KallutoPaperState, PaperCommand, PlantedPaper, PaperWords } from './kallutoPaperTypes'
import type { ArcadeFighter, FightNenZone, FightSide, FightState } from './types'

export { PAPER_COSTS } from './kallutoTuning'
export const PAPER_ZONES: readonly FightNenZone[] = ['head', 'torso', 'hands', 'feet']
export const paperState = (fighter: ArcadeFighter): KallutoPaperState =>
  fighter.kallutoPaper ?? { zone: 'torso' }

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
/** With a zone, only a guide mark counts: a fragment committed to listening steers nothing. */
export function hasPlantedPaper(state: FightState, owner: FightSide, zone?: FightNenZone): boolean {
  const target = owner === 'player' ? 'opponent' : 'player'
  return paperMarksAt(state, {
    owner: activePaperOwner(state, owner),
    target: activePaperOwner(state, target),
    zone,
    use: zone ? 'guide' : undefined,
  })
}
export function paperCommandReady(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): boolean {
  if (!paperAbilityAvailable(state[side], command)) return false
  if (!paperMaterialsReady(state, side, command)) return false
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
