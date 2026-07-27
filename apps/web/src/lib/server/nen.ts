import { bungeeGum } from '@black-whale/ability-modules';
import { NenRuntime, type NenCatalogEntry } from '@black-whale/nen-engine';
import { TimelineEngine } from '@black-whale/timeline-engine';
import abilityCatalog from '../../../../../data/abilities/abilities.json';
import { prisma } from './db';

const timeline = new TimelineEngine(prisma);

export const nenRuntime = new NenRuntime(
	{
		loadWorldState: (eventId) => timeline.getKernelState({ eventId }),
		resolveCharacterId: async (slug) => {
			const character = await prisma.character.findUnique({ where: { slug }, select: { id: true } });
			return character?.id ?? null;
		}
	},
	abilityCatalog as NenCatalogEntry[],
	[bungeeGum]
);

export { timeline };
