import type { FightBattlefield } from './preparationTypes'
import type { FightState } from './types'
import { carryCorpseWorld } from './illumiCorpseMatter'
import { carryNeedleWorld } from './illumiNeedleMatter'
import { carryHalkenburgWorld } from './halkenburgSoulCarry'

/** A round does not replenish picked-up supplies or discard a real kit left on the floor. */
export function carryPaperWorld(fresh: FightBattlefield, previous: FightState): FightBattlefield {
  const carried = (previous.battlefield?.entities ?? [])
    .filter(
      (entry) =>
        entry.paperKit ||
        entry.paperScatter ||
        entry.writingKit ||
        entry.document ||
        entry.detachedForearm,
    )
    .map((entry) => ({
      ...entry,
      copy: entry.copy
        ? { ...entry.copy, createdAt: entry.copy.createdAt - previous.frame }
        : undefined,
    }))
  const ids = new Set(carried.map((entry) => entry.id))
  return carryHalkenburgWorld(
    carryCorpseWorld(
      carryNeedleWorld(
        {
          ...fresh,
          entities: [...fresh.entities.filter((entry) => !ids.has(entry.id)), ...carried],
        },
        previous,
      ),
      previous,
    ),
    previous,
  )
}
