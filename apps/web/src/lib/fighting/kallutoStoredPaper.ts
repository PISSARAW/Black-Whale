import { historicalPartExists } from './historicalCopyLifetime'
import { activePaperOwner } from './kallutoSurveillance'
import type { PreparedEntity } from './preparationTypes'
import type { PaperKit } from './kallutoMaterials'
import type { ArcadeFighter, FightSide, FightState } from './types'

export function storedPaperScatters(state: FightState, side: FightSide): PreparedEntity[] {
  return (state[side].paperKit?.confetti ?? []).filter(
    (entry) => entry.health > 0 && historicalPartExists(state, entry.paperScatter?.materialCopyId),
  )
}

/** Transfer the same objects out of the carried reserve; no new paper or identity is made. */
export function unpackStoredPaper(state: FightState, side: FightSide): FightState {
  const entries = storedPaperScatters(state, side)
  const actor = state[side]
  if (!entries.length || !state.battlefield || !actor.paperKit) return state
  const ids = new Set(entries.map((entry) => entry.id))
  return {
    ...state,
    [side]: {
      ...actor,
      paperKit: {
        ...actor.paperKit,
        confetti: actor.paperKit.confetti?.filter((entry) => !ids.has(entry.id)),
      },
    },
    battlefield: {
      ...state.battlefield,
      entities: [
        ...state.battlefield.entities,
        ...entries.map((entry) => ({
          ...entry,
          present: true,
          x: actor.x + actor.facing * 3.4,
          y: actor.y + 6,
          paperScatter: { ...entry.paperScatter!, owner: activePaperOwner(state, side) },
        })),
      ],
    },
  }
}

export function cleanStoredPaper(state: FightState, actor: ArcadeFighter): ArcadeFighter {
  const kit = cleanStoredKit(state, actor.paperKit)
  return kit === actor.paperKit ? actor : { ...actor, paperKit: kit }
}
function cleanStoredKit(state: FightState, kit?: PaperKit): PaperKit | undefined {
  const confetti = kit?.confetti?.filter((entry) =>
    historicalPartExists(state, entry.paperScatter?.materialCopyId),
  )
  if (!confetti || confetti.length === kit?.confetti?.length) return kit
  return { ...kit!, confetti: confetti.length ? confetti : undefined }
}
export function cleanStoredPaperEntity(state: FightState, entry: PreparedEntity): PreparedEntity {
  const paperKit = cleanStoredKit(state, entry.paperKit)
  return paperKit === entry.paperKit ? entry : { ...entry, paperKit }
}
