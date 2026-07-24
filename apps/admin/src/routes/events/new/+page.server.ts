import { prisma } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const chapters = await prisma.chapter.findMany({ orderBy: { number: 'asc' } });
	const characters = await prisma.character.findMany({ orderBy: { canonicalName: 'asc' } });
	const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });

	return { chapters, characters, locations };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		
		const chapterId = data.get('chapterId')?.toString();
		const sequence = parseInt(data.get('sequence')?.toString() || '0');
		const title = data.get('title')?.toString();
		const summary = data.get('summary')?.toString();

		// Consequence data
		const characterId = data.get('characterId')?.toString();
		const locationId = data.get('locationId')?.toString();
		const precision = data.get('precision')?.toString() as any;
		const certainty = data.get('certainty')?.toString() as any;

		if (!chapterId || !title || !summary || sequence <= 0) {
			return fail(400, { error: 'Missing required event fields' });
		}

		try {
			// Run everything in a transaction
			await prisma.$transaction(async (tx) => {
				// 1. Create the event
				const event = await tx.narrativeEvent.create({
					data: {
						chapterId,
						sequence,
						title,
						summary
					}
				});

				// 2. Handle consequences if provided
				if (characterId && locationId && precision && certainty) {
					// 2a. Find the original body of the character
					const originalBody = await tx.body.findFirst({
						where: { originalCharacterId: characterId, bodyType: 'ORIGINAL' }
					});

					if (originalBody) {
						// 2b. Find currently open presence for this body
						const activePresence = await tx.presence.findFirst({
							where: {
								entityId: originalBody.id,
								untilEventId: null
							}
						});

						// 2c. Close the previous presence
						if (activePresence) {
							await tx.presence.update({
								where: { id: activePresence.id },
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
