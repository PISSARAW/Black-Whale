import type { PreparedEntity, FightBattlefield } from './preparationTypes'
import type { FightState, ArcadeFighter } from './types'

/** Gallery Fake reproduces only three inert physical pins, with new identities and its own age. */
export function copiedFaceNeedles(source: PreparedEntity, id: string): Partial<PreparedEntity> {
  if (!source.detachedFaceNeedles) return {}
  return {
    health: source.health,
    detachedFaceNeedles: {
      needles: [`${id}:pin:0`, `${id}:pin:1`, `${id}:pin:2`],
      mediumCopyId: id,
    },
  }
}

export function carryNeedleFace(actor: ArcadeFighter, previous: ArcadeFighter): ArcadeFighter {
  if (
    !previous.needleFace &&
    previous.illumiNeedleGeneration === undefined &&
    !previous.illumiNeedleMode
  )
    return actor
  return {
    ...actor,
    needleFace: previous.needleFace,
    illumiNeedleGeneration: previous.illumiNeedleGeneration,
    illumiNeedleMode: previous.illumiNeedleMode,
  }
}

/** Real piles and copied parent objects keep their identities and elapsed age across rounds. */
export function carryNeedleWorld(fresh: FightBattlefield, previous: FightState): FightBattlefield {
  const parents = needleParents(previous)
  const kept = (previous.battlefield?.entities ?? [])
    .filter(
      (entry) => entry.kind === 'needles' || entry.detachedFaceNeedles || parents.has(entry.id),
    )
    .map((entry) => ({
      ...entry,
      copy: entry.copy
        ? { ...entry.copy, createdAt: entry.copy.createdAt - previous.frame }
        : undefined,
    }))
  if (!kept.length) return fresh
  const ids = new Set(kept.map((entry) => entry.id))
  return { ...fresh, entities: [...fresh.entities.filter((entry) => !ids.has(entry.id)), ...kept] }
}

function needleParents(previous: FightState): Set<string> {
  const parents = new Set<string>()
  for (const side of ['player', 'opponent'] as const) {
    const actor = previous[side]
    for (const id of [
      actor.needleFace?.mediumCopyId,
      actor.illumi?.mediumCopyId,
      actor.equipmentProps?.needles?.copyId,
    ])
      if (id) parents.add(id)
  }
  return parents
}
