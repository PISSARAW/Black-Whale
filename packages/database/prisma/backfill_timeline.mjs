import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const knownEvents = [
	{
		chapter: 358,
		chapterTitle: 'Eve',
		sequence: 2,
		title: 'Woody is found dead',
		summary: 'Woody is found exsanguinated in the bathroom of room 1014.',
		legacyTitles: []
	},
	{
		chapter: 360,
		chapterTitle: 'Parasite',
		sequence: 1,
		title: 'Sayird is manipulated',
		summary: 'Controlled by a parasitic Nen ability, Sayird kills Kurton and attacks Kurapika before being subdued.',
		legacyTitles: ['Début du chapitre 360']
	},
	{
		chapter: 364,
		chapterTitle: 'Speculation',
		sequence: 1,
		title: 'Vincent attacks room 1014',
		summary: 'Vincent kills Sandra, opens fire on Bill and Kurapika, then poisons himself after they overpower him.',
		legacyTitles: ['Vincent arrives']
	},
	{
		chapter: 373,
		chapterTitle: 'Inheritance',
		sequence: 1,
		title: 'Camilla resurrects after Musse kills her',
		summary: "Camilla's post-mortem Nen beast kills Musse and uses his life force to restore her body.",
		legacyTitles: []
	},
	{
		chapter: 373,
		chapterTitle: 'Inheritance',
		sequence: 2,
		title: 'Camilla attacks Benjamin',
		summary: 'Camilla shoots at Furykov, Benjamin and Balsamilco before Furykov breaks her arm and arrests her.',
		legacyTitles: []
	}
];

async function syncEvent(definition) {
	const chapter = await prisma.chapter.upsert({
		where: { number: definition.chapter },
		update: { title: definition.chapterTitle },
		create: { number: definition.chapter, title: definition.chapterTitle }
	});

	const matchingTitles = [definition.title, ...definition.legacyTitles];
	const existing = await prisma.narrativeEvent.findFirst({
		where: { title: { in: matchingTitles } }
	});

	if (existing) {
		await prisma.narrativeEvent.update({
			where: { id: existing.id },
			data: {
				chapterId: chapter.id,
				sequence: definition.sequence,
				title: definition.title,
				summary: definition.summary
			}
		});
		return 'updated';
	}

	await prisma.narrativeEvent.create({
		data: {
			chapterId: chapter.id,
			sequence: definition.sequence,
			title: definition.title,
			summary: definition.summary
		}
	});
	return 'created';
}

async function main() {
	const results = { created: 0, updated: 0 };
	for (const definition of knownEvents) {
		const result = await syncEvent(definition);
		results[result] += 1;
	}
	console.log(`Timeline synchronisée : ${results.created} créations, ${results.updated} mises à jour.`);
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
