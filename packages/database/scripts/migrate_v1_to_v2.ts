import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration V1 -> V2...');

  // 1. Fetch all characters
  const characters = await prisma.character.findMany();
  
  for (const character of characters) {
    // 2. Create original body
    const body = await prisma.body.create({
      data: {
        originalCharacterId: character.id,
        label: `body-${character.slug}-original`,
        bodyType: 'ORIGINAL',
        firstVisibleChapter: character.firstVisibleChapter,
      }
    });

    // 3. Create original consciousness
    const consciousness = await prisma.consciousness.create({
      data: {
        originCharacterId: character.id,
        label: `consciousness-${character.slug}-original`,
        consciousnessType: 'ORIGINAL',
        firstVisibleChapter: character.firstVisibleChapter,
      }
    });

    // 4. Create initial occupancy
    // We need to find the first event where the character appears to set fromEventId.
    // For now, we will pick a default "start of story" event or the earliest event they're part of.
    // In a real migration, we would query the earliest Presence for the character.
    const earliestPresence = await prisma.presence.findFirst({
      where: { entityId: character.id },
      orderBy: { fromEvent: { sequence: 'asc' } },
      include: { fromEvent: true }
    });

    if (earliestPresence) {
      await prisma.bodyOccupancy.create({
        data: {
          bodyId: body.id,
          consciousnessId: consciousness.id,
          fromEventId: earliestPresence.fromEventId,
          occupancyType: 'ORIGINAL',
          certainty: 'CONFIRMED'
        }
      });
      
      // Also update all Presences to point to the new Body and set entityType
      await prisma.presence.updateMany({
        where: { entityId: character.id },
        data: {
          entityId: body.id,
          entityType: 'BODY'
        }
      });
      
      // Update all BodyStates to point to the new Body
      // Note: we changed `characterId` to `bodyId` in the schema.
      // We will need raw SQL or prisma to update this, assuming old data was under characterId
      // Because we overwrote the schema, old data in DB might have column `characterId` instead of `bodyId`.
      // We assume Prisma migration handled column renaming via mapped names if we did it properly.
      // But for this typescript migration snippet:
      // await prisma.bodyState.updateMany({ where: { bodyId: character.id }, data: { bodyId: body.id } }); 
      
      // Similarly for Appearances
      await prisma.appearanceState.create({
        data: {
          entityId: body.id,
          entityType: 'BODY',
          appearanceCharacterId: character.id,
          fromEventId: earliestPresence.fromEventId,
          cause: 'NATURAL'
        }
      });
    }

    console.log(`Migrated Character ${character.slug} -> Body: ${body.id}, Consciousness: ${consciousness.id}`);
  }

  console.log('Migration V1 -> V2 complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
