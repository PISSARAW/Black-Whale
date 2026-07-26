import { prisma } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { filterVisible } from '@black-whale/spoiler-engine';

export const load: PageServerLoad = async ({ cookies, url, fetch }) => {
	const spoilerLimitCookie = cookies.get('userSpoilerLimit');
	const maxChapter = spoilerLimitCookie ? parseInt(spoilerLimitCookie) : Infinity;
	const spoilerProfile = spoilerLimitCookie ? { maxChapter } : undefined;

	// Load all characters
	let characters = await prisma.character.findMany({
		orderBy: { canonicalName: 'asc' },
		include: { firstVisibleEvent: { include: { chapter: true } } }
	});

	if (spoilerProfile) {
		characters = filterVisible(characters as any, spoilerProfile) as any;
	}

	// Load all events with their chapters
	const events = await prisma.narrativeEvent.findMany({
		where: {
			occursOnBlackWhale: true,
			...(maxChapter !== Infinity ? { chapter: { number: { lte: maxChapter } } } : {})
		},
		orderBy: [
			{ chapter: { number: 'asc' } },
			{ sequence: 'asc' }
		],
		include: {
			chapter: true
		}
	});

	// Parse queries
	const eventId = url.searchParams.get('eventId');
	const leftCharacterId = url.searchParams.get('left');
	const rightCharacterId = url.searchParams.get('right');

	let leftPerspective = null;
	let rightPerspective = null;
	let comparison = null;

	if (eventId && leftCharacterId) {
		try {
			const resLeft = await fetch(`http://localhost:3001/v1/perspectives/${leftCharacterId}?eventId=${eventId}`);
			if (resLeft.ok) leftPerspective = await resLeft.json();

			if (rightCharacterId) {
				const resRight = await fetch(`http://localhost:3001/v1/perspectives/${rightCharacterId}?eventId=${eventId}`);
				if (resRight.ok) rightPerspective = await resRight.json();

				const resCompare = await fetch(`http://localhost:3001/v1/perspectives/compare?left=${leftCharacterId}&right=${rightCharacterId}&eventId=${eventId}`);
				if (resCompare.ok) comparison = await resCompare.json();
			}
		} catch (e) {
			console.error("Failed to fetch perspective data from API", e);
		}
	}

	return {
		characters,
		events,
		eventId,
		leftCharacterId,
		rightCharacterId,
		leftPerspective,
		rightPerspective,
		comparison
	};
};
