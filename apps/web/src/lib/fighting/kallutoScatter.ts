import { historicalPartExists } from './historicalCopyLifetime'
import { activePaperOwner } from './kallutoSurveillance'
import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { PaperPart } from './kallutoMaterials'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export interface PaperScatter {
  owner: DolphinBodyRef
  paperId: string
  materialCopyId?: string
  controlled: boolean
  hidden?: boolean
  flight?: number
  burst?: number
  vacuum?: DolphinBodyRef
}
declare module './preparationTypes' {
  interface PreparedEntity {
    paperScatter?: PaperScatter
  }
}

export function ownedPaperScatters(state: FightState, owner: DolphinBodyRef): PreparedEntity[] {
  return (state.battlefield?.entities ?? []).filter(
    (entry) =>
      entry.paperScatter?.owner.owner === owner.owner &&
      entry.paperScatter.owner.member === owner.member,
  )
}
export function availablePaperScatter(
  state: FightState,
  side: FightSide,
): PreparedEntity | undefined {
  return ownedPaperScatters(state, activePaperOwner(state, side)).find(
    (entry) =>
      entry.present &&
      entry.health > 0 &&
      historicalPartExists(state, entry.paperScatter!.materialCopyId),
  )
}
export function paperControlBusy(state: FightState, side: FightSide): boolean {
  return ownedPaperScatters(state, activePaperOwner(state, side)).some(
    (entry) =>
      entry.health > 0 &&
      entry.paperScatter?.controlled &&
      historicalPartExists(state, entry.paperScatter.materialCopyId),
  )
}

/** A marking burst contains the actual marking fragment and the remaining confetti (chapter 226). */
export function newPaperScatter(
  state: FightState,
  side: FightSide,
  part: PaperPart,
): PreparedEntity {
  return {
    id: `scatter:${part.id}`,
    kind: 'paper',
    owner: side,
    x: state[side].x + state[side].facing * 3.4,
    y: state[side].y + 6,
    present: true,
    health: 5,
    material: part.materialCopyId ? 'nen' : 'real',
    paperScatter: {
      owner: activePaperOwner(state, side),
      paperId: `${part.id}:confetti`,
      materialCopyId: part.materialCopyId,
      controlled: true,
      hidden: Boolean(part.materialCopyId && state[side].attack?.concealed),
    },
  }
}
export function installPaperScatter(state: FightState, entry: PreparedEntity): FightState {
  const field = state.battlefield
  if (!field) return state
  const exists = field.entities.some((item) => item.id === entry.id)
  const entities = exists
    ? field.entities.map((item) => (item.id === entry.id ? entry : item))
    : [...field.entities, entry]
  return { ...state, battlefield: { ...field, entities } }
}
