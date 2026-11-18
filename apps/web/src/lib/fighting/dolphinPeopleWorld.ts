import type { FightBattlefield, PreparedEntity } from './preparationTypes'

export function scenarioOito(): PreparedEntity {
  return {
    id: 'person:queen-oito',
    kind: 'person',
    owner: 'neutral',
    x: 27,
    y: 0,
    present: true,
    material: 'real',
    health: 100,
    person: { identity: 'queen-oito', control: { side: 'player' }, nen: 'closed' },
  }
}
/** A new score round cannot remove an equipped recipient or erase her opened aura nodes. */
export function carryDolphinPeople(
  fresh: FightBattlefield,
  previous?: FightBattlefield,
): FightBattlefield {
  const retained =
    previous?.entities.filter((entry) => entry.person || entry.controller?.person) ?? []
  if (!retained.length) return fresh
  const replacements = new Map(retained.map((entry) => [entry.id, entry]))
  const entities = fresh.entities.map((entry) => replacements.get(entry.id) ?? entry)
  for (const entry of retained)
    if (!entities.some((held) => held.id === entry.id)) entities.push(entry)
  return {
    ...fresh,
    entities,
    littleEyeShots: previous?.littleEyeShots?.filter((shot) => shot.person),
  }
}
