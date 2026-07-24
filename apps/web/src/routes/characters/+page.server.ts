import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { filterVisible } from '@black-whale/spoiler-engine';

export const load: PageServerLoad = async ({ cookies }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const spoilerProfile = spoilerLimitCookie ? { maxChapter: parseInt(spoilerLimitCookie) } : undefined;

	let characters = await prisma.character.findMany({
		orderBy: { canonicalName: 'asc' },
		include: { firstVisibleEvent: { include: { chapter: true } } }
	});

	if (spoilerProfile) {
		characters = filterVisible(characters, spoilerProfile);
	}

	return { characters };
};
