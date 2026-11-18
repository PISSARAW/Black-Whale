import { freeDeviceHand } from './deviceHands'
import { historicalMatterExists, historicalPartExists } from './historicalCopyLifetime'
import { paperDolls } from './kallutoSurveillance'
import { availablePaperScatter } from './kallutoScatter'
import type { PaperCommand } from './kallutoPaperTypes'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
import type { PreparedEntity } from './preparationTypes'

export interface PaperKit {
  sourceId: string
  copyId?: string
  fan: boolean
  markers: number
  salvos: number
  sheets: number
  serial: number
  integrity: number
}
export interface PaperPart {
  id: string
  materialCopyId?: string
}
declare module './types' {
  interface ArcadeFighter {
    paperKit?: PaperKit
  }
}
declare module './preparationTypes' {
  interface PreparedEntity {
    paperKit?: PaperKit
  }
}

/** Physical duel inventory, never canonical ammunition quotas or Nen-created paper. */
export function createPaperKit(sourceId: string): PaperKit {
  return { sourceId, fan: true, markers: 12, salvos: 6, sheets: 6, serial: 0, integrity: 12 }
}
export function personalPaperKit(id: FighterId, facing: number): PaperKit | undefined {
  return id === 'kalluto'
    ? createPaperKit(`${facing === 1 ? 'player' : 'opponent'}:kalluto:kit`)
    : undefined
}
export function scenarioPaperKit(side: FightSide): PreparedEntity {
  const id = `${side}:paper-kit`
  return {
    id,
    kind: 'crate',
    owner: side,
    x: side === 'player' ? 26 : 74,
    y: 0,
    present: true,
    material: 'real',
    health: 12,
    paperKit: createPaperKit(id),
  }
}

export function existingPaperDoll(state: FightState, side: FightSide) {
  const target = side === 'player' ? 'opponent' : 'player'
  const member = state.teamMatch?.seats[target].active ?? 0
  return paperDolls(state[side]).find(
    (doll) =>
      doll.target === target &&
      (doll.targetMember ?? 0) === member &&
      historicalPartExists(state, doll.materialCopyId),
  )
}

export function paperStockReady(actor: ArcadeFighter, command: PaperCommand): boolean {
  const kit = actor.paperKit
  if (!kit || kit.integrity <= 0) return false
  if (command === 'doll') return kit.sheets > 0
  return kit.fan && (command === 'plant' ? kit.markers > 0 : kit.salvos > 0)
}

export function paperMaterialsReady(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): boolean {
  if (state[side].weaponsConfiscated) return false
  if (command === 'doll' && existingPaperDoll(state, side)) return true
  if (!historicalMatterExists(state, state[side].paperKit?.copyId) || !freeDeviceHand(state, side))
    return false
  if (command === 'serpent' && availablePaperScatter(state, side))
    return scatterFanReady(state[side])
  return paperStockReady(state[side], command)
}

/** Expend physical matter when it is actually released or folded; an interrupted windup creates none. */
export function issuePaperPart(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): { actor: ArcadeFighter; part: PaperPart } | null {
  if (!paperMaterialsReady(state, side, command) || !paperStockReady(state[side], command))
    return null
  const actor = state[side]
  const kit = actor.paperKit
  if (!kit) return null
  const field = { plant: 'markers', serpent: 'salvos', doll: 'sheets' } as const
  const resource = field[command]
  const serial = kit.serial + 1
  return {
    actor: { ...actor, paperKit: { ...kit, [resource]: kit[resource] - 1, serial } },
    part: { id: `${kit.sourceId}:paper:${serial}`, materialCopyId: kit.copyId },
  }
}

function scatterFanReady(actor: ArcadeFighter): boolean {
  return Boolean(actor.paperKit?.fan && actor.paperKit.integrity > 0)
}
