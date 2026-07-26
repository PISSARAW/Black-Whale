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
		chapter: 351,
		chapterTitle: 'Battle to the Death',
		sequence: 1,
		title: 'Hisoka and Chrollo begin their death match',
		summary: 'At Heaven\'s Arena, Chrollo reveals a prepared combination of stolen abilities and promises Hisoka certain death.',
		legacyTitles: []
	},
	{
		chapter: 356,
		chapterTitle: 'Unfortunate: Part 1',
		sequence: 1,
		title: 'Chrollo kills Hisoka',
		summary: 'More than two hundred manipulated puppets overwhelm Hisoka; the final explosions leave him dead beneath the bodies.',
		legacyTitles: []
	},
	{
		chapter: 357,
		chapterTitle: 'Unfortunate: Part 2',
		sequence: 1,
		title: 'Hisoka resurrects and changes the hunt',
		summary: 'Post-mortem Bungee Gum restarts Hisoka\'s heart and lungs; he then kills Kortopi and Shalnark and vows to hunt every Spider.',
		legacyTitles: []
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
		chapter: 366,
		chapterTitle: 'To Each His Own',
		sequence: 2,
		title: 'Chrollo orders the hunt for Hisoka',
		summary: 'The Phantom Troupe gathers aboard the Black Whale, accepts Illumi as a member and begins searching the lower tiers for Hisoka.',
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
		chapter: 369,
		chapterTitle: 'Limits',
		sequence: 2,
		title: 'Silent Majority kills Barrigen',
		summary: 'Four conjured snakes drain Barrigen\'s blood during Kurapika\'s first Nen class while the hidden user observes through Loberry.',
		legacyTitles: []
	},
	{
		chapter: 369,
		chapterTitle: 'Limits',
		sequence: 1,
		title: 'Silent Majority possesses Loberry',
		summary: 'The hidden assassin uses Loberry as the only witness to the masked doll observing Kurapika\'s Nen class.',
		legacyTitles: ['Début du chapitre 369']
	},
	{
		chapter: 370,
		chapterTitle: 'Observation',
		sequence: 1,
		title: 'Silent Majority kills Myuhan',
		summary: 'Myuhan is found exsanguinated in a bathroom after the unresolved assassin activates Silent Majority again.',
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
		chapter: 371,
		chapterTitle: 'Mission',
		sequence: 2,
		title: 'The Phantom Troupe subdues the Buor men',
		summary: 'Franklin, Phinks, Feitan and Nobunaga overpower three mafia members and interrogate them about Kakin\'s underworld.',
		legacyTitles: []
	},
	{
		chapter: 377,
		chapterTitle: 'Scheme',
		sequence: 1,
		title: 'The Phantom Troupe divides the search for Hisoka',
		summary: 'Chrollo disperses the Spiders across the lower tiers while Shizuku and Bonolenov choose to accompany him.',
		legacyTitles: ['Appearance of Hinrigh Biganduffno']
	},
	{
		chapter: 378,
		chapterTitle: 'Balance',
		sequence: 1,
		title: 'Morena unleashes Contagion',
		summary: 'Morena infects the Heil-Ly members, assigns levels for murder and sends them out to destroy Kakin and the world.',
		legacyTitles: ['Appearance of Morena Prudo']
	},
	{
		chapter: 384,
		chapterTitle: 'War',
		sequence: 1,
		title: 'The mafia bosses set the Spiders against Heil-Ly',
		summary: 'Onior and Brocco decide to let the Phantom Troupe and Heil-Ly weaken each other while their families search for Hisoka.',
		legacyTitles: []
	},
	{
		chapter: 380,
		chapterTitle: 'Alarm',
		sequence: 1,
		title: 'Fugetsu emerges alone on Tier 3',
		summary: 'An uncontrolled use of Magical Worm takes Fugetsu to Tier 3, where the Hunters place her under Justice protection.',
		legacyTitles: ['Début du chapitre 380']
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
		chapter: 392,
		chapterTitle: 'Information',
		sequence: 2,
		title: 'Lynch exposes the false Hisoka',
		summary: 'Lynch strikes Bonolenov in disguise and her ability reveals that the man posing as Hisoka is an impostor.',
		legacyTitles: []
	},
	{
		chapter: 392,
		chapterTitle: 'Information',
		sequence: 1,
		title: 'Lynch tests Hanal while searching for Hisoka',
		summary: 'Lynch strikes Hanal on Tier 3 and Body and Soul confirms that the passer-by is not Hisoka.',
		legacyTitles: ['Début du chapitre 392']
	},
	{
		chapter: 393,
		chapterTitle: 'Plea',
		sequence: 1,
		title: 'Bonolenov kills Lynch',
		summary: 'Bonolenov neutralizes Zakuro, kills Lynch and impersonates her to keep the Phantom Troupe\'s deception intact.',
		legacyTitles: []
	},
	{
		chapter: 398,
		chapterTitle: 'Search',
		sequence: 1,
		title: "The Heil-Ly hideout is traced to Tier 2",
		summary: 'Hinrigh plants a transmitter beyond the room 3101 trap, allowing the Phantom Troupe to locate Morena\'s true base.',
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
		chapter: 405,
		chapterTitle: 'Performance',
		sequence: 1,
		title: 'Dogman abducts Borksen',
		summary: 'Using Halkenburg\'s funeral procession as cover, Dogman identifies and abducts the Specialist sought by Morena.',
		legacyTitles: []
	},
	{
		chapter: 405,
		chapterTitle: 'Performance',
		sequence: 3,
		title: 'Chrollo searches the funeral procession',
		summary: 'Chrollo uses Love Dial 6700 among Halkenburg\'s mourners and concludes that the target he needs is on an upper tier.',
		legacyTitles: ['Début du chapitre 405']
	},
	{
		chapter: 405,
		chapterTitle: 'Performance',
		sequence: 2,
		title: 'The real Hisoka appears at the Tier 1 casino',
		summary: 'Hisoka plays SQ-X while Bonolenov, still disguised as him, spots him and immediately changes form to avoid detection.',
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
		chapter: 406,
		chapterTitle: 'Regalia',
		sequence: 2,
		title: 'Chrollo targets the Kakin regalia',
		summary: 'Chrollo identifies the three royal treasures as the key to strengthening Skill Hunter before his next fight with Hisoka.',
		legacyTitles: []
	},
	{
		chapter: 407,
		chapterTitle: 'Negotiation',
		sequence: 1,
		title: 'Morena begins her negotiation game with Borksen',
		summary: 'Morena asks Borksen to join Heil-Ly and uses a card game that forces both sides to reveal information and narrow the answer.',
		legacyTitles: []
	},
	{
		chapter: 408,
		chapterTitle: 'Negotiation: Part 2',
		sequence: 1,
		title: 'Morena reveals her goal and origins',
		summary: 'The game compels Morena to explain Contagion, her origin as a Kakin “Meat” and her plan to destroy the kingdom and the world.',
		legacyTitles: []
	},
	{
		chapter: 409,
		chapterTitle: 'Negotiation: Part 3',
		sequence: 1,
		title: 'Borksen fulfills a condition of Contagion',
		summary: 'Borksen trades a kiss for a recovered response card, unknowingly satisfying one of the conditions of Morena\'s ability.',
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
		chapter: 410,
		chapterTitle: 'Negotiation: Part 4',
		sequence: 2,
		title: 'Borksen accepts Morena\'s offer',
		summary: 'Borksen deliberately chooses Yes and joins Heil-Ly, remaining at level zero until Contagion\'s final condition is met.',
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
