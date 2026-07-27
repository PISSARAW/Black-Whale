import { IdentityEngine } from '@black-whale/identity-engine';
import { KnowledgeEngine } from '@black-whale/knowledge-engine';
import { PerspectiveEngine } from '@black-whale/perspective-engine';
import { prisma } from './db';

export const perspectiveEngine = new PerspectiveEngine(
	prisma,
	new IdentityEngine(prisma),
	new KnowledgeEngine(prisma)
);

/**
 * Build a character's view of the world at an event. `spoilerLimit` is the
 * reader's own cap, not the character's; omit it to reveal everything the
 * character knows.
 */
export async function buildPerspective(observerCharacterId: string, eventId: string, spoilerLimit?: number) {
	const perspective = await perspectiveEngine.buildPerspective({
		observerCharacterId,
		eventId,
		spoilerLimit: spoilerLimit ?? Number.POSITIVE_INFINITY
	});

	return { observerId: observerCharacterId, eventId, mode: 'character' as const, ...perspective };
}
