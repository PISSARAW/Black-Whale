import { historicalCopyExpired } from './historicalCopyLifetime'
import { freeDeviceHand, physicalHandOccupancy } from './deviceHands'
import { deviceBodyFree } from './physicalDevices'
import { updateEntity } from './preparationWorld'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export interface WritingKit {
  copyId?: string
  sourceId: string
  sheets: number
  serial: number
  brush: boolean
  ink: boolean
  integrity: number
}
declare module './types' {
  interface ArcadeFighter {
    writingKit?: WritingKit
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    writingKit?: WritingKit
  }
}
/** A three-sheet setup is duel inventory, never a canonical daily quota or conjured equipment. */
export function createWritingKit(sourceId: string): WritingKit {
  return { sourceId, sheets: 3, serial: 0, brush: true, ink: true, integrity: 12 }
}
export function scenarioWritingKit(side: FightSide): PreparedEntity {
  const id = `${side}:writing-kit`
  return {
    id,
    kind: 'crate',
    owner: side,
    x: side === 'player' ? 26 : 74,
    y: 0,
    present: true,
    material: 'real',
    health: 12,
    writingKit: createWritingKit(id),
  }
}
export function writingHandsFree(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  if (actor.coveringEars || actor.melodyPerformance || actor.pluggingWounds) return false
  return physicalHandOccupancy(state, side).size === 0
}
export function writingMaterialsReady(state: FightState, side: FightSide): boolean {
  const kit = state[side].writingKit
  return Boolean(
    kit?.brush &&
    kit.ink &&
    kit.sheets > 0 &&
    writingHandsFree(state, side) &&
    writingCopyExists(state, kit.copyId),
  )
}
export function spendWritingSheet(
  state: FightState,
  side: FightSide,
): { state: FightState; paperId: string } {
  const kit = state[side].writingKit!,
    serial = kit.serial + 1
  return {
    paperId: `${kit.sourceId}:sheet:${serial}`,
    state: {
      ...state,
      [side]: { ...state[side], writingKit: { ...kit, sheets: kit.sheets - 1, serial } },
    },
  }
}
export function performWritingKitCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (
    !freeDeviceHand(state, side) ||
    !deviceBodyFree(state, side) ||
    state[side].attack ||
    (state[side].bashoPoem?.writingFrames ?? 0) > 0
  )
    return state
  return command.action === 'writing-drop'
    ? dropWritingKit(state, side)
    : takeWritingKit(state, side, command.target)
}
function takeWritingKit(state: FightState, side: FightSide, id?: string): FightState {
  const kit = state.battlefield?.entities.find(
    (entry) => entry.id === id && entry.present && entry.health > 0 && entry.writingKit,
  )
  if (!kit || state[side].writingKit || !freeDeviceHand(state, side)) return state
  if (Math.hypot(kit.x - state[side].x, kit.y - state[side].y) > 4) return state
  const taken = updateEntity(state, kit.id, { present: false })
  return {
    ...taken,
    [side]: { ...taken[side], writingKit: { ...kit.writingKit!, integrity: kit.health } },
  }
}
function dropWritingKit(state: FightState, side: FightSide): FightState {
  const kit = state[side].writingKit
  if (!kit || !state.battlefield) return state
  const original = state.battlefield.entities.find((entry) => entry.id === kit.sourceId)
  const entry: PreparedEntity = {
    id: kit.sourceId,
    kind: 'crate',
    owner: side,
    x: state[side].x,
    y: state[side].y,
    present: true,
    health: kit.integrity,
    material: kit.copyId ? 'nen' : 'real',
    writingKit: { ...kit },
    copy: original?.copy,
    arena: original?.arena,
  }
  const entities = original
    ? state.battlefield.entities.map((e) => (e.id === kit.sourceId ? entry : e))
    : [...state.battlefield.entities, entry]
  return {
    ...state,
    battlefield: { ...state.battlefield, entities },
    [side]: { ...state[side], writingKit: undefined },
  }
}
export function writingKitOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands: ArsenalCommand[] = state[side].writingKit
    ? [{ action: 'writing-drop' }]
    : (state.battlefield?.entities ?? [])
        .filter((e) => e.present && e.writingKit)
        .map((e) => ({ action: 'writing-take', target: e.id }))
  return commands.map((command) => ({
    command,
    ready: performWritingKitCommand(state, side, command) !== state,
    labelFr:
      command.action === 'writing-drop'
        ? 'Déposer papier, pinceau et encre'
        : 'Prendre le matériel d’écriture présent',
    labelEn:
      command.action === 'writing-drop'
        ? 'Put down paper, brush and ink'
        : 'Take the actual writing supplies',
    conditionFr:
      'Matériel physique au contact ; les copies ne le fournissent pas. Une feuille est consommée dès le début de l’écriture, sans remboursement après interruption. Stock de trois feuilles : réglage de duel.',
    conditionEn:
      'Physical supplies within reach; copying the Hatsu does not supply them. Starting consumes a real sheet without an interruption refund. Three sheets are duel tuning.',
  }))
}

export function writingCopyExists(state: FightState, copyId?: string): boolean {
  if (!copyId) return true
  const copy = state.battlefield?.entities.find((entry) => entry.id === copyId)
  return Boolean(copy?.copy && copy.health > 0 && !historicalCopyExpired(state, copy))
}
export function advanceWritingMaterials(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const kit = next[side].writingKit
    if (kit && !writingCopyExists(next, kit.copyId))
      next = { ...next, [side]: { ...next[side], writingKit: undefined } }
  }
  return next
}
