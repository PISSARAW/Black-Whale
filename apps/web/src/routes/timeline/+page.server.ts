import { prisma } from '$lib/server/db';
import { readSpoilerLimit } from '$lib/server/spoiler';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const maxChapter = readSpoilerLimit(cookies);

	// Fetch all chapters with their events, filtered by spoiler limit
	const chapters = await prisma.chapter.findMany({
		where: {
			...(maxChapter !== undefined ? { number: { lte: maxChapter } } : {}),
			events: { some: { occursOnBlackWhale: true } }
		},
		orderBy: { number: 'asc' },
		include: {
			events: {
				where: { occursOnBlackWhale: true },
				orderBy: { sequence: 'asc' }
			}
		}
	});

	return {
		chapters,
		spoilerLimit: maxChapter
	};
};
