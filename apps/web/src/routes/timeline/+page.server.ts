import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const parsedSpoilerLimit = spoilerLimitCookie ? Number.parseInt(spoilerLimitCookie, 10) : Number.NaN;
	const maxChapter = Number.isFinite(parsedSpoilerLimit) ? parsedSpoilerLimit : Infinity;

	// Fetch all chapters with their events, filtered by spoiler limit
	const chapters = await prisma.chapter.findMany({
		where: {
			...(maxChapter !== Infinity ? { number: { lte: maxChapter } } : {}),
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
		spoilerLimit: maxChapter !== Infinity ? maxChapter : undefined
	};
};
