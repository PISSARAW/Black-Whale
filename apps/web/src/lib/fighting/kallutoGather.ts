import { freeDeviceHand } from './deviceHands'
import { deviceBodyFree } from './physicalDevices'
import { activePaperOwner } from './kallutoSurveillance'
import { historicalPartExists } from './historicalCopyLifetime'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function gatherPaperReady(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  const actor = state[side]
  if (!ownedLoosePaper(state, side, entry) || !actor.paperKit || actor.attack) return false
  return (
    Boolean(freeDeviceHand(state, side)) &&
    deviceBodyFree(state, side) &&
    Math.hypot(entry.x - actor.x, Math.max(0, entry.y - actor.y - 8, actor.y - entry.y)) <= 4
  )
}

function ownedLoosePaper(state: FightState, side: FightSide, entry: PreparedEntity): boolean {
  const paper = entry.paperScatter
  if (!paper) return false
  const owner = activePaperOwner(state, side)
  if (paper.owner.owner !== owner.owner || paper.owner.member !== owner.member) return false
  return (
    entry.present &&
    entry.health > 0 &&
    !paper.flight &&
    historicalPartExists(state, paper.materialCopyId)
  )
}

/** Ordinary pickup into the carried reserve, available even without voluntary Nen. */
export function gatherPaper(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  if (command.action !== 'paper-kit-gather') return state
  const entry = state.battlefield?.entities.find((item) => item.id === command.target)
  if (!entry || !gatherPaperReady(state, side, entry)) return state
  const actor = state[side]
  return {
    ...state,
    battlefield: {
      ...state.battlefield!,
      entities: state.battlefield!.entities.filter((item) => item.id !== entry.id),
    },
    [side]: {
      ...actor,
      paperKit: {
        ...actor.paperKit!,
        confetti: [
          ...(actor.paperKit!.confetti ?? []),
          {
            ...entry,
            present: false,
            paperScatter: {
              ...entry.paperScatter!,
              controlled: false,
              burst: undefined,
              flight: undefined,
            },
          },
        ],
      },
    },
  }
}

export function gatherPaperOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state[side].paperKit) return []
  return (state.battlefield?.entities ?? [])
    .filter((entry) => ownedLoosePaper(state, side, entry))
    .map((entry) => ({
      command: { action: 'paper-kit-gather', target: entry.id },
      ready: gatherPaperReady(state, side, entry),
      labelFr: 'Papier · Ranger les confettis à portée',
      labelEn: 'Paper · Gather nearby confetti into the reserve',
      conditionFr:
        'Ramassage physique à portée de main, corps libre et réserve portée. Conserve les mêmes morceaux et leur provenance, sans ajouter de marques, salves ni feuilles neuves.',
      conditionEn:
        'Physical pickup within hand reach, free body and carried reserve. Keeps the same pieces and provenance, without adding fresh markers, salvos or sheets.',
    }))
}
