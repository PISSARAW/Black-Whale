import { getPrisma } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const prisma = await getPrisma();
	const chapters = await prisma.chapter.findMany({ orderBy: { number: 'asc' } });
	const characters = await prisma.character.findMany({ orderBy: { canonicalName: 'asc' } });
	const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
	const events = await prisma.narrativeEvent.findMany({
		include: { chapter: true },
		orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }]
	});

	return { chapters, characters, locations, events };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const prisma = await getPrisma();
		
		const chapterId = data.get('chapterId')?.toString();
		const sequence = parseInt(data.get('sequence')?.toString() || '0');
		const title = data.get('title')?.toString();
		const summary = data.get('summary')?.toString();
		const isFlashback = data.get('temporalMode')?.toString() === 'flashback';
		const occursBeforeEventId = data.get('occursBeforeEventId')?.toString() || null;
		const occurredAtLabel = data.get('occurredAtLabel')?.toString().trim() || null;

		// Consequence data
		const characterId = data.get('characterId')?.toString();
		const locationId = data.get('locationId')?.toString();
		const precision = data.get('precision')?.toString() as any;
		const certainty = data.get('certainty')?.toString() as any;

		if (!chapterId || !title || !summary || sequence <= 0) {
			return fail(400, { error: 'Missing required event fields' });
		}
		if (isFlashback && !occursBeforeEventId) {
			return fail(400, { error: 'A flashback must be placed before a known event.' });
		}

		try {
			// Run everything in a transaction
            await prisma.$transaction(async (tx: any) => {
				// 1. Create the event
				const event = await tx.narrativeEvent.create({
					data: {
						chapterId,
						sequence,
						title,
						summary,
						isFlashback,
						occurredAtLabel
					}
				});

				// Rebuild the occurrence order. Chapter/sequence remain the reading order;
				// ordinal is the actual chronology aboard the ship.
				const existingEvents = await tx.narrativeEvent.findMany({
					where: { id: { not: event.id } },
					include: { chapter: true }
				});
				existingEvents.sort((left: any, right: any) =>
					(left.ordinal ?? Number.MAX_SAFE_INTEGER) - (right.ordinal ?? Number.MAX_SAFE_INTEGER)
					|| left.chapter.number - right.chapter.number
					|| left.sequence - right.sequence
				);
				const insertionIndex = occursBeforeEventId
					? existingEvents.findIndex((candidate: any) => candidate.id === occursBeforeEventId)
					: existingEvents.length;
				if (occursBeforeEventId && insertionIndex < 0) throw new Error('Occurrence anchor not found');
				const chronologicalEvents = [...existingEvents];
				chronologicalEvents.splice(insertionIndex, 0, event);
				await tx.narrativeEvent.updateMany({ data: { ordinal: null } });
				for (const [ordinal, chronologicalEvent] of chronologicalEvents.entries()) {
					await tx.narrativeEvent.update({ where: { id: chronologicalEvent.id }, data: { ordinal } });
				}

				// 2. Handle consequences if provided
				if (characterId && locationId && precision && certainty) {
					// 2a. Find the original body of the character
					const originalBody = await tx.body.findFirst({
						where: { originalCharacterId: characterId, bodyType: 'ORIGINAL' }
					});

					if (originalBody) {
						const presences = await tx.presence.findMany({
							where: { entityId: originalBody.id },
							include: { fromEvent: true, untilEvent: true }
						});
						presences.sort((left: any, right: any) =>
							(left.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) - (right.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER)
						);
						const eventOrdinal = chronologicalEvents.findIndex((candidate: any) => candidate.id === event.id);
						const previousPresence = presences.findLast((presence: any) =>
							(presence.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) < eventOrdinal
							&& (!presence.untilEvent || (presence.untilEvent.ordinal ?? Number.MAX_SAFE_INTEGER) > eventOrdinal)
						);
						const nextPresence = presences.find((presence: any) =>
							(presence.fromEvent.ordinal ?? Number.MAX_SAFE_INTEGER) > eventOrdinal
						);

						if (previousPresence) {
							await tx.presence.update({
								where: { id: previousPresence.id },
								data: { untilEventId: event.id }
							});
						}

						// 2d. Create the new presence
						await tx.presence.create({
							data: {
								entityType: 'BODY',
								entityId: originalBody.id,
								locationId: locationId,
								fromEventId: event.id,
								untilEventId: nextPresence?.fromEventId || null,
								precision,
								certainty
							}
						});
					}
				}
			});
		} catch (err) {
			console.error('Error creating event:', err);
			return fail(500, { error: 'Internal server error while creating event' });
		}

		redirect(303, '/events');
	}
};
