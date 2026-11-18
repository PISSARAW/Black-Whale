import { historicalMatterExists, historicalPartExists } from './historicalCopyLifetime'
import { cleanPaperMaterial } from './kallutoMaterialLifetime'
import { mapPhysicalBodies } from './physicalBodyMap'
import { reconcileMelodySound } from './melodyChannel'
import type { FightEquipment, PreparedEntity } from './preparationTypes'
import type { ArcadeFighter, FightState } from './types'

export interface EquippedProp {
  entityId: string
  copyId?: string
  material: 'real' | 'nen'
}
declare module './types' {
  interface ArcadeFighter {
    equipmentProps?: Partial<Record<FightEquipment, EquippedProp>>
  }
}
export function recordEquipmentPickup(
  actor: ArcadeFighter,
  target: PreparedEntity,
  equipment: FightEquipment,
): ArcadeFighter {
  return {
    ...actor,
    equipment: [...(actor.equipment ?? []), equipment],
    equipmentProps: {
      ...actor.equipmentProps,
      [equipment]: {
        entityId: target.id,
        copyId: target.copy ? target.id : undefined,
        material: target.material,
      },
    },
    ...(equipment === 'flute' ? { melodyFlute: true } : {}),
  }
}
export function advanceCopiedInventory(state: FightState): FightState {
  const next = mapPhysicalBodies(state, (body) =>
    cleanPaperMaterial(state, cleanBodyEquipment(state, body)),
  )
  if (state.player.melodyPerformance && !next.player.melodyPerformance)
    return reconcileMelodySound(next)
  if (state.opponent.melodyPerformance && !next.opponent.melodyPerformance)
    return reconcileMelodySound(next)
  return next
}
function cleanBodyEquipment(state: FightState, body: ArcadeFighter): ArcadeFighter {
  if (!trackedInventory(body)) return body
  let actor = body
  const expired = (Object.entries(body.equipmentProps ?? []) as [FightEquipment, EquippedProp][])
    .filter(([, prop]) => !historicalMatterExists(state, prop.copyId))
    .map(([kind]) => kind)
  if (expired.length) {
    const props = { ...actor.equipmentProps }
    for (const kind of expired) delete props[kind]
    actor = {
      ...actor,
      equipmentProps: props,
      equipment: actor.equipment?.filter((kind) => !expired.includes(kind)),
      ...(expired.includes('flute') ? { melodyFlute: false, melodyPerformance: undefined } : {}),
    }
  }
  return cleanCopiedWriting(
    state,
    cleanStoredProjectiles(state, cleanEmbeddedNeedles(state, actor)),
  )
}
function trackedInventory(body: ArcadeFighter): boolean {
  return Boolean(
    body.equipmentProps ||
    body.needlePuppet?.mediumCopyId ||
    body.illumi?.mediumCopyId ||
    storedMaterial(body) ||
    copiedWriting(body),
  )
}
function storedMaterial(body: ArcadeFighter): boolean {
  return Boolean(
    body.hatsuEffects.baton?.card?.materialCopyId || body.gumCatch?.projectile?.materialCopyId,
  )
}
function cleanStoredProjectiles(state: FightState, body: ArcadeFighter): ArcadeFighter {
  let actor = body
  const baton = actor.hatsuEffects.baton
  if (baton?.card && !historicalPartExists(state, baton.card.materialCopyId))
    actor = { ...actor, hatsuEffects: { ...actor.hatsuEffects, baton: { ...baton, card: null } } }
  const caught = actor.gumCatch?.projectile
  if (caught && !historicalPartExists(state, caught.materialCopyId))
    actor = { ...actor, gumCatch: undefined }
  return actor
}
function copiedWriting(body: ArcadeFighter): boolean {
  return Boolean(
    body.writingKit?.copyId ||
    body.bashoPoem?.paperCopyId ||
    body.bashoWard?.paperCopyId ||
    body.bashoArchive?.some((poem) => poem.paperCopyId),
  )
}
function cleanCopiedWriting(state: FightState, body: ArcadeFighter): ArcadeFighter {
  let actor = body
  if (actor.writingKit && !historicalMatterExists(state, actor.writingKit.copyId))
    actor = { ...actor, writingKit: undefined }
  if (actor.bashoPoem && !historicalPartExists(state, actor.bashoPoem.paperCopyId))
    actor = { ...actor, bashoPoem: undefined }
  if (actor.bashoWard && !historicalPartExists(state, actor.bashoWard.paperCopyId))
    actor = { ...actor, bashoWard: undefined }
  return cleanWrittenArchive(state, actor)
}
function cleanWrittenArchive(state: FightState, actor: ArcadeFighter): ArcadeFighter {
  const archive = actor.bashoArchive?.filter((poem) =>
    historicalPartExists(state, poem.paperCopyId),
  )
  return archive && archive.length !== actor.bashoArchive?.length
    ? { ...actor, bashoArchive: archive.length ? archive : undefined }
    : actor
}
function cleanEmbeddedNeedles(state: FightState, actor: ArcadeFighter): ArcadeFighter {
  const puppet = actor.needlePuppet
  let next = actor
  if (puppet?.needleEmbedded && !historicalPartExists(state, puppet.mediumCopyId))
    next = { ...next, needlePuppet: { ...puppet, needleEmbedded: false } }
  const disguise = next.illumi
  if (disguise?.mediumCopyId && !historicalPartExists(state, disguise.mediumCopyId))
    next = {
      ...next,
      illumi: {
        ...disguise,
        mediumCopyId: undefined,
        disguised: false,
        preparation: 0,
        anchor: undefined,
      },
    }
  return next
}
