import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const knownEvents = [
	{
		chapter: 345,
		chapterTitle: 'Signature',
		sequence: 1,
		title: 'Tserriednich is revealed as a serial killer',
		summary: 'Tserriednich murders and dismembers young women while treating their bodies as material for his collection.',
		legacyTitles: ['Début du chapitre 345']
	},
	{
		chapter: 348,
		chapterTitle: 'Resolve',
		sequence: 1,
		title: 'Benjamin challenges Tserriednich',
		summary: 'Benjamin tells Tserriednich that only one prince will survive the voyage and promises to eliminate him personally.',
		legacyTitles: ['Début du chapitre 348']
	},
	{
		chapter: 349,
		chapterTitle: 'Worm Toxin',
		sequence: 1,
		title: 'The fourteen princes enter the Succession Contest',
		summary: 'The royal heirs gather for the urn ceremony and receive the eggs that will awaken their Guardian Spirit Beasts.',
		legacyTitles: ['Appearance of Benjamin Hui Guo Rou']
	},
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
		chapter: 365,
		chapterTitle: 'Choice',
		sequence: 1,
		title: 'Zhang Lei and Tubeppa approach room 1014',
		summary: 'Both princes seek information from Kurapika; Zhang Lei receives Oito and Woble while Tubeppa proposes a truce.',
		legacyTitles: []
	},
	{
		chapter: 366,
		chapterTitle: 'To Each His Own',
		sequence: 1,
		title: 'The princes respond to the Nen stalemate',
		summary: 'Tyson promotes her Book, Luzurus sends a guard to learn Nen, and the royal factions adapt to Kurapika\'s announcement.',
		legacyTitles: []
	},
	{
		chapter: 373,
		chapterTitle: 'Inheritance',
		sequence: 2,
		title: 'Camilla attacks Benjamin',
		summary: 'Camilla shoots at Furykov, Benjamin and Balsamilco before Furykov breaks her arm and arrests her.',
		legacyTitles: []
	},
	{
		chapter: 368,
		chapterTitle: 'Foul Play',
		sequence: 1,
		title: 'Momoze is assassinated',
		summary: 'Tuffdy strangles Momoze after her Guardian Spirit Beast exhausts her aura and disappears.',
		legacyTitles: []
	},
	{
		chapter: 371,
		chapterTitle: 'Mission',
		sequence: 1,
		title: 'Hanzo avenges Momoze',
		summary: 'Hanzo identifies Tuffdy, obtains his confession in detention and kills him with Hanzo Skill 4.',
		legacyTitles: []
	},
	{
		chapter: 375,
		chapterTitle: 'Persuasion',
		sequence: 1,
		title: "Fugetsu's Magical Worm opens",
		summary: "Fugetsu's Guardian Spirit Beast creates a passage connecting her room to Kacho's.",
		legacyTitles: []
	},
	{
		chapter: 375,
		chapterTitle: 'Persuasion',
		sequence: 2,
		title: "Marayam's room is isolated",
		summary: "Marayam's Guardian Spirit Beast moves room 1013 into a protected Nen space that cannot be re-entered from outside.",
		legacyTitles: []
	},
	{
		chapter: 381,
		chapterTitle: 'Predation',
		sequence: 1,
		title: "Predator devours Salé-salé's Guardian Spirit Beast",
		summary: "After studying its conditions, Rihan's Predator neutralizes Salé-salé's manipulative Guardian Spirit Beast.",
		legacyTitles: []
	},
	{
		chapter: 382,
		chapterTitle: 'Awakening',
		sequence: 1,
		title: 'Salé-salé is assassinated',
		summary: 'Yushohi kills Salé-salé with Stand by Me; the death is concealed and attributed publicly to illness.',
		legacyTitles: []
	},
	{
		chapter: 382,
		chapterTitle: 'Awakening',
		sequence: 2,
		title: 'Halkenburg commits to the Succession Contest',
		summary: 'After failing to shoot Nasubi or himself, Halkenburg accepts the fight and awakens his collective Nen ability.',
		legacyTitles: ['Halkenburg Collapse']
	},
	{
		chapter: 383,
		chapterTitle: 'Escape',
		sequence: 1,
		title: 'Kacho and Fugetsu attempt to escape',
		summary: 'The twins leave the Black Whale in a lifeboat, triggering the succession ceremony trap.',
		legacyTitles: []
	},
	{
		chapter: 383,
		chapterTitle: 'Escape',
		sequence: 2,
		title: 'Kacho dies and Without You awakens',
		summary: "Kacho dies outside the ship; her Guardian Spirit Beast takes her form and rejoins Fugetsu through Magical Worm.",
		legacyTitles: []
	},
	{
		chapter: 387,
		chapterTitle: 'Recreation',
		sequence: 1,
		title: 'Tserriednich survives Theta\'s execution attempt',
		summary: 'Parallel Future lets Tserriednich foresee the gunshot, evade it and conceal the outcome from his guards.',
		legacyTitles: []
	},
	{
		chapter: 389,
		chapterTitle: 'Curse',
		sequence: 1,
		title: 'Halkenburg strikes Shikaku',
		summary: "Halkenburg's collective arrow pierces every defence and transfers Sumidori into Shikaku's body.",
		legacyTitles: []
	},
	{
		chapter: 402,
		chapterTitle: 'Letter',
		sequence: 1,
		title: "Kacho's posthumous letters are distributed",
		summary: 'Fugetsu visits the princes under Justice Ministry escort to deliver the messages prepared by Kacho.',
		legacyTitles: []
	},
	{
		chapter: 406,
		chapterTitle: 'Regalia',
		sequence: 1,
		title: "Halkenburg's body dies",
		summary: "Halkenburg's original body dies while his consciousness continues operating from Balsamilco's body.",
		legacyTitles: []
	},
	{
		chapter: 410,
		chapterTitle: 'Negotiation: Part 4',
		sequence: 1,
		title: 'Benjamin discovers the body swap and his infection',
		summary: 'Benjamin realizes that Halkenburg controls Balsamilco and learns that he has been infected with TSK-17.',
		legacyTitles: []
	},
	{
		chapter: 411,
		chapterTitle: 'Announcement',
		sequence: 1,
		title: 'Benjamin proclaims martial law',
		summary: 'Benjamin orders the capture of the princes and moves his command centre to the Justice Bureau on Tier 2.',
		legacyTitles: []
	},
	{
		chapter: 414,
		chapterTitle: 'Friends',
		sequence: 1,
		title: "Oito reveals that the baby is not Woble",
		summary: 'Confronted by Kurapika and Bill, Oito admits that the child in room 1014 is her nephew; the real Woble remains missing.',
		legacyTitles: ['Début du chapitre 414']
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
