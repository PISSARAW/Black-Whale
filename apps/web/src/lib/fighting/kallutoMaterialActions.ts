import { freeDeviceHand } from './deviceHands'
import { deviceBodyFree } from './physicalDevices'
import { updateEntity } from './preparationWorld'
import { historicalMatterExists } from './historicalCopyLifetime'
import { gatherPaper, gatherPaperOptions } from './kallutoGather'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function performPaperKitCommand(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (!freeDeviceHand(state, side) || !deviceBodyFree(state, side) || state[side].attack)
    return state
  if (command.action === 'paper-kit-drop') return dropPaperKit(state, side)
  if (command.action === 'paper-kit-gather') return gatherPaper(state, side, command)
  return command.action === 'paper-kit-take' ? takePaperKit(state, side, command.target) : state
}
function takePaperKit(state: FightState, side: FightSide, id?: string): FightState {
  if (state[side].paperKit) return state
  const entry = state.battlefield?.entities.find(
    (item) => item.id === id && item.present && item.health > 0 && item.paperKit,
  )
  if (!entry || !paperKitInReach(state, side, entry)) return state
  if (!historicalMatterExists(state, entry.paperKit!.copyId)) return state
  const taken = updateEntity(state, entry.id, { present: false })
  return {
    ...taken,
    [side]: { ...taken[side], paperKit: { ...entry.paperKit!, integrity: entry.health } },
  }
}
export function paperKitInReach(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  const actor = state[side]
  const dx = Math.max(0, Math.abs(entry.x - actor.x) - (entry.arena?.width ?? 0))
  const dy = Math.max(0, entry.y - actor.y, actor.y - entry.y - (entry.arena?.height ?? 0))
  return Math.hypot(dx, dy) <= 4
}
function dropPaperKit(state: FightState, side: FightSide): FightState {
  const kit = state[side].paperKit
  if (!kit || !state.battlefield) return state
  const original = state.battlefield.entities.find((entry) => entry.id === kit.sourceId)
  const entry: PreparedEntity = {
    id: kit.sourceId,
    kind: 'crate',
    owner: side,
    x: state[side].x,
    y: state[side].y,
    health: kit.integrity,
    material: kit.copyId ? 'nen' : 'real',
    present: true,
    paperKit: { ...kit },
    copy: original?.copy,
    arena: original?.arena,
  }
  const entities = original
    ? state.battlefield.entities.map((item) => (item.id === kit.sourceId ? entry : item))
    : [...state.battlefield.entities, entry]
  return {
    ...state,
    battlefield: { ...state.battlefield, entities },
    [side]: { ...state[side], paperKit: undefined },
  }
}
export function paperKitOptions(state: FightState, side: FightSide): ArsenalOption[] {
  const commands: ArsenalCommand[] = state[side].paperKit
    ? [{ action: 'paper-kit-drop' }]
    : (state.battlefield?.entities ?? [])
        .filter((item) => item.present && item.paperKit)
        .map((item) => ({ action: 'paper-kit-take', target: item.id }))
  return [
    ...gatherPaperOptions(state, side),
    ...commands.map((command) => ({
      command,
      ready: performPaperKitCommand(state, side, command) !== state,
      labelFr:
        command.action === 'paper-kit-drop'
          ? 'Papier · Déposer éventail et réserve'
          : 'Papier · Prendre le matériel présent',
      labelEn:
        command.action === 'paper-kit-drop'
          ? 'Paper · Put down fan and supplies'
          : 'Paper · Take actual supplies',
      conditionFr:
        'Éventail et papier physiques à portée de main. Un Hatsu copié ou prêté ne fournit pas ces objets. Les quantités sont des réglages de scénario.',
      conditionEn:
        'Actual fan and paper within reach. Copying or borrowing the Hatsu does not provide these objects. Quantities are scenario tuning.',
    })),
  ]
}
