import { bungeeGum } from '@black-whale/ability-modules';
import { NenRuntime, type NenCatalogEntry } from '@black-whale/nen-engine';
import { SimulationStore } from '@black-whale/simulation-engine';
import { TimelineEngine } from '@black-whale/timeline-engine';
import abilityCatalog from '../../../../../data/abilities/abilities.json';
import { prisma } from './db';

const timeline = new TimelineEngine(prisma);

const nenRuntime = new NenRuntime(
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

/**
 * Branch persistence is process-local until it is rehydrated from a snapshot,
 * so the store is a module singleton rather than a per-request instance.
 */
export const simulationStore = new SimulationStore(prisma, {
	loadKernelState: (eventId) => timeline.getKernelState({ eventId }),
	executeAbility: (abilityId, request, state) => nenRuntime.executeInState(abilityId, request, state)
});

export { nenRuntime };
