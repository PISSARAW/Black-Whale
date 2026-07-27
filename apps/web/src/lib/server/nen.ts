import {
  battleCantabileMetamorphosen,
  beyondSacrificialCurse,
  bungeeGum,
  catsName,
  chainJail,
  contagion,
  doubleFace,
  dowsingChain,
  emperorTime,
  grimmelTheDissonance,
  hanzoSkill4,
  holyChain,
  judgmentChain,
  littleEye,
  luiniSpatialTeleportation,
  magicalWorm,
  marayamGuardianIsolation,
  parallelFuture,
  skillHunter,
  stealChain,
  stealthDolphin,
  textureSurprise,
  withoutYou,
} from '@black-whale/ability-modules'
import { NenRuntime, type NenCatalogEntry } from '@black-whale/nen-engine'
import { TimelineEngine } from '@black-whale/timeline-engine'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import { prisma } from './db'

const timeline = new TimelineEngine(prisma)

export const nenRuntime = new NenRuntime(
  {
    loadWorldState: (eventId) => timeline.getKernelState({ eventId }),
    resolveCharacterId: async (slug) => {
      const character = await prisma.character.findUnique({ where: { slug }, select: { id: true } })
      return character?.id ?? null
    },
  },
  abilityCatalog as NenCatalogEntry[],
  // Every module whose `moduleKey` is filled in data/abilities/abilities.json.
  [
    bungeeGum,
    textureSurprise,
    chainJail,
    judgmentChain,
    dowsingChain,
    holyChain,
    stealChain,
    stealthDolphin,
    emperorTime,
    grimmelTheDissonance,
    hanzoSkill4,
    withoutYou,
    contagion,
    magicalWorm,
    luiniSpatialTeleportation,
    marayamGuardianIsolation,
    battleCantabileMetamorphosen,
    skillHunter,
    doubleFace,
    beyondSacrificialCurse,
    catsName,
    littleEye,
    parallelFuture,
  ],
)

export { timeline }
