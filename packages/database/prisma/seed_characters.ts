import { PrismaClient, NarrativeImportance } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Map canonStatus to narrativeImportance
const getNarrativeImportance = (canonStatus: string): NarrativeImportance => {
	if (canonStatus === 'canon') return NarrativeImportance.PRIMARY;
	if (canonStatus === 'semi-canon') return NarrativeImportance.SECONDARY;
	return NarrativeImportance.MINOR;
};

// Map shipLocation tier to modelingLevel
const getModelingLevel = (tier: number | null): number => {
	if (tier === null) return 4;
	if (tier === 1) return 1;
	if (tier === 2) return 2;
	if (tier === 3) return 3;
	if (tier === 4) return 3;
	if (tier === 5) return 3;
	return 3;
};

async function main() {
	console.log('Seeding all characters from JSON...');

	// Read the JSON file
	// Use absolute path from the Black-Whale project root
	const charactersPath = path.join('/Users', 'henripissa', 'Documents', 'GitHub.nosync', 'Black-Whale', 'data', 'characters', 'characters.json');
	const charactersData = await fs.readFile(charactersPath, 'utf-8');
	const characters = JSON.parse(charactersData);

	console.log(`Found ${characters.length} characters in JSON file`);

	// Get or create chapters
	const uniqueChapterIds = new Set<string>();
	
	// First pass: collect all unique chapter IDs
	for (const char of characters) {
		if (char.firstAppearanceChapterId) {
			uniqueChapterIds.add(char.firstAppearanceChapterId);
		}
	}

	console.log(`Found ${uniqueChapterIds.size} unique chapter references`);

	// Get existing chapters
	const existingChapters = await prisma.chapter.findMany();
	const existingChapterMap = new Map<string, string>();
	for (const ch of existingChapters) {
		// Assuming chapter ids in JSON are like "ch-340"
		const chapterKey = `ch-${ch.number}`;
		existingChapterMap.set(chapterKey, ch.id);
	}

	console.log(`Found ${existingChapters.length} existing chapters in database`);

	// Create missing chapters
	const chapterMap = new Map<string, string>(existingChapterMap);
	
	for (const chapterId of uniqueChapterIds) {
		if (!chapterMap.has(chapterId)) {
			// Extract number from chapterId (e.g., "ch-340" -> 340)
			const match = chapterId.match(/ch-(\d+)/);
			if (match) {
				const chapterNumber = parseInt(match[1]);
				const chapterTitle = `Chapter ${chapterNumber}`;
				
				const newChapter = await prisma.chapter.create({
					data: {
						number: chapterNumber,
						title: chapterTitle
					}
				});
				chapterMap.set(chapterId, newChapter.id);
				console.log(`Created chapter: ${chapterId} -> ${newChapter.id}`);
			} else {
				// For unknown chapters, use a default chapter
				console.warn(`Could not parse chapter number from ${chapterId}, skipping`);
			}
		}
	}

	console.log(`Total chapters available: ${chapterMap.size}`);

	// Seed all characters
	let createdCount = 0;
	let skippedCount = 0;

	for (const char of characters) {
		const existingChar = await prisma.character.findUnique({
			where: { slug: char.id }
		});

		if (existingChar) {
			skippedCount++;
			continue;
		}

		// Get firstVisibleEventId
		let firstVisibleEventId: string | undefined;
		if (char.firstAppearanceChapterId) {
			const chapterDbId = chapterMap.get(char.firstAppearanceChapterId);
			if (chapterDbId) {
				// Find the first event for this chapter
				const firstEvent = await prisma.narrativeEvent.findFirst({
					where: { chapterId: chapterDbId },
					orderBy: { sequence: 'asc' }
				});
				if (firstEvent) {
					firstVisibleEventId = firstEvent.id;
				} else {
					// Create an event if none exists
					const newEvent = await prisma.narrativeEvent.create({
						data: {
							chapterId: chapterDbId,
							sequence: 1,
							title: `Appearance of ${char.canonicalName}`,
							summary: `${char.canonicalName} first appears`
						}
					});
					firstVisibleEventId = newEvent.id;
				}
			}
		}

		if (!firstVisibleEventId) {
			// Use first event from first chapter as fallback
			const fallbackEvent = await prisma.narrativeEvent.findFirst({
				orderBy: { sequence: 'asc' }
			});
			if (fallbackEvent) {
				firstVisibleEventId = fallbackEvent.id;
			}
		}

		if (!firstVisibleEventId) {
			console.error(`Cannot create character ${char.id}: no firstVisibleEventId`);
			continue;
		}

		await prisma.character.create({
			data: {
				slug: char.id,
				canonicalName: char.canonicalName,
				aliases: char.aliases || [],
				description: char.description || null,
				narrativeImportance: getNarrativeImportance(char.canonStatus || 'canon'),
				modelingLevel: getModelingLevel(char.shipLocation?.tier || null),
				firstVisibleEventId: firstVisibleEventId
			}
		});

		console.log(`Created character: ${char.id} (${char.canonicalName})`);
		createdCount++;
	}

	console.log(`\nSeeding completed: ${createdCount} created, ${skippedCount} skipped`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
