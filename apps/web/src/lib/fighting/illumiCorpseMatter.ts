import { historicalPartExists } from './historicalCopyLifetime'
import { physicalBodyAt } from './fightBodyIdentity'
import { corpseOriginAvailable } from './illumiCorpseAccess'
import { releasePreparedEntity } from './preparedCorpseBody'
import type { PreparedEntity, FightBattlefield } from './preparationTypes'
import type { FightState } from './types'
import './illumiCorpseTypes'

export function corpsePinsLive(state: FightState, entry: PreparedEntity): boolean {
  return Boolean(
    entry.corpseNeedles && historicalPartExists(state, entry.corpseNeedles.mediumCopyId),
  )
}
export function corpseControllerBody(state: FightState, entry: PreparedEntity) {
  const ref = entry.corpseControl?.owner
  return ref ? physicalBodyAt(state, ref.owner, ref.member) : undefined
}

/** Only the actual caster and the exact embedded assembly can keep this control alive. */
export function corpseControlLive(state: FightState, entry: PreparedEntity): boolean {
  const control = entry.corpseControl
  if (!control) return true // Legacy constructed states keep their existing admission path.
  if (!corpsePinsLive(state, entry) || control.pinsId !== entry.corpseNeedles?.id) return false
  const body = corpseControllerBody(state, entry)
  return Boolean(body && body.health > 0 && corpseOriginAvailable(state, body, control.origin))
}
export function cleanCorpseMatter(state: FightState, entry: PreparedEntity): PreparedEntity {
  if (entry.corpsePinBundle) return cleanCorpseBundle(state, entry)
  if (entry.kind !== 'corpse') return entry
  const physical = cleanEmbeddedCorpsePins(state, entry)
  return corpseControlRetained(state, physical)
    ? physical
    : { ...releasePreparedEntity(physical), corpseControl: undefined }
}
function cleanCorpseBundle(state: FightState, entry: PreparedEntity): PreparedEntity {
  return entry.present && !historicalPartExists(state, entry.corpsePinBundle!.mediumCopyId)
    ? { ...entry, present: false }
    : entry
}
function cleanEmbeddedCorpsePins(state: FightState, entry: PreparedEntity): PreparedEntity {
  return entry.corpseNeedles && !corpsePinsLive(state, entry)
    ? { ...entry, corpseNeedles: undefined }
    : entry
}
function corpseControlRetained(state: FightState, entry: PreparedEntity): boolean {
  return (
    !entry.corpseControl || (entry.present && entry.health > 0 && corpseControlLive(state, entry))
  )
}

export function copiedCorpseNeedles(source: PreparedEntity, id: string): Partial<PreparedEntity> {
  if (source.corpsePinBundle)
    return { health: source.health, corpsePinBundle: { id: `${id}:corpse-pins`, mediumCopyId: id } }
  const needles = source.corpseNeedles
    ? { corpseNeedles: { id: `${id}:corpse-pins`, mediumCopyId: id } }
    : {}
  return source.kind === 'corpse'
    ? { ...needles, arena: source.arena ? { ...source.arena, height: 3 } : undefined }
    : needles
}

/** A new round cannot replace the same dead body, release history or copied parent's age. */
export function carryCorpseWorld(fresh: FightBattlefield, previous: FightState): FightBattlefield {
  const carried = (previous.battlefield?.entities ?? [])
    .filter((entry) => ['corpse', 'hostage'].includes(entry.kind))
    .map((entry) => ({
      ...entry,
      releasedAt: entry.releasedAt === undefined ? undefined : entry.releasedAt - previous.frame,
      copy: entry.copy
        ? { ...entry.copy, createdAt: entry.copy.createdAt - previous.frame }
        : undefined,
    }))
  const ids = new Set(carried.map((entry) => entry.id))
  return {
    ...fresh,
    entities: [...fresh.entities.filter((entry) => !ids.has(entry.id)), ...carried],
  }
}
