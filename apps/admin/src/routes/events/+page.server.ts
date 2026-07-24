import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const spoilerLimitCookie = cookies.get('adminSpoilerLimit');
	const spoilerLimit = spoilerLimitCookie ? parseInt(spoilerLimitCookie) : null;

	const whereClause = spoilerLimit ? {
		firstVisibleChapter: { lte: spoilerLimit }
	} : {};

	const events = await prisma.narrativeEvent.findMany({
		where: whereClause,
		include: {
			chapter: true,
			presencesFrom: {
				include: { character: true, location: true }
			},
			presencesUntil: {
				include: { character: true, location: true }
			}
		},
		orderBy: [
			{ chapter: { number: 'asc' } },
			{ sequence: 'asc' }
		]
	});

	return { events };
};
