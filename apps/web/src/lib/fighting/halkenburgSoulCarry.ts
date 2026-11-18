import type { ArcadeFighter, FightState } from './types'
import type { FightBattlefield } from './preparationTypes'

export function carryHalkenburgSoul(body: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  if (!previous.halkenburgSoul && !previous.halkenburgSleeping) return body
  return {
    ...body,
    halkenburgSoul: previous.halkenburgSoul,
    halkenburgSleeping: previous.halkenburgSleeping,
    hatsuEffects: {
      ...body.hatsuEffects,
      possessedFrames: previous.halkenburgSoul ? 1 : body.hatsuEffects.possessedFrames,
    },
  }
}

/** A round neither wakes an exchanged consciousness nor replaces its real supporter body. */
export function carryHalkenburgWorld(
  fresh: FightBattlefield,
  previous: FightState,
): FightBattlefield {
  const carried = (previous.battlefield?.entities ?? []).filter(
    (entry) => entry.kind === 'supporter' && entry.material === 'real',
  )
  const ids = new Set(carried.map((entry) => entry.id))
  return {
    ...fresh,
    entities: [...fresh.entities.filter((entry) => !ids.has(entry.id)), ...carried],
  }
}
