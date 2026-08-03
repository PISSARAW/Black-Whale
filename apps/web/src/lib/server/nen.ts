import { abilityModules } from '@black-whale/ability-modules'
import { NenRuntime, type NenCatalogEntry } from '@black-whale/nen-engine'
import { timeline } from '$lib/server/timeline'
import abilityCatalog from '../../../../../data/abilities/abilities.json'
import { prisma } from './db'

// One engine, shared: see `timeline.ts` for why remembering is safe here.

export const nenRuntime = new NenRuntime(
  {
    loadWorldState: (eventId) => timeline.getKernelState({ eventId }),
    resolveCharacterId: async (slug) => {
      const character = await prisma.character.findUnique({ where: { slug }, select: { id: true } })
      return character?.id ?? null
    },
  },
  abilityCatalog as NenCatalogEntry[],
  abilityModules,
)

export { timeline }
