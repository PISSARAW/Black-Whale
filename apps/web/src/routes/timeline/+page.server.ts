import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const maxChapter = spoilerLimitCookie ? parseInt(spoilerLimitCookie) : Infinity;

	// Fetch all chapters with their events, filtered by spoiler limit
	const chapters = await prisma.chapter.findMany({
		where: maxChapter !== Infinity ? {
			number: { lte: maxChapter }
		} : undefined,
		orderBy: { number: 'asc' },
		include: {
			events: {
				orderBy: { sequence: 'asc' }
			}
		}
	});

	return {
		chapters,
		spoilerLimit: maxChapter !== Infinity ? maxChapter : undefined
	};
};
