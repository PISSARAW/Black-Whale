import { PrismaClient, LocationType, PresencePrecision, PresenceCertainty, BiologicalStateType, AffiliationType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning existing data...')
  await prisma.source.deleteMany()
  await prisma.biologicalState.deleteMany()
  await prisma.presence.deleteMany()
  await prisma.characterAffiliation.deleteMany()
  await prisma.affiliation.deleteMany()
  await prisma.narrativeEvent.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.location.deleteMany()
  await prisma.character.deleteMany()

  console.log('Seeding Chapters...')
  const ch358 = await prisma.chapter.create({ data: { number: 358, title: 'Eve' } })
  const ch359 = await prisma.chapter.create({ data: { number: 359, title: 'Departure' } })

  console.log('Seeding Locations...')
  const blackWhale = await prisma.location.create({
    data: { slug: 'black-whale', name: 'Black Whale', type: LocationType.SHIP, firstVisibleChapter: 358 }
  })
  
  const tier1 = await prisma.location.create({
    data: { slug: 'tier-1', name: 'Tier 1', type: LocationType.TIER, firstVisibleChapter: 358, parentLocationId: blackWhale.id }
  })

  const vvip = await prisma.location.create({
    data: { slug: 'tier-1-vvip', name: 'VVIP Area', type: LocationType.ZONE, firstVisibleChapter: 358, parentLocationId: tier1.id }
  })

  const room1014 = await prisma.location.create({
    data: { slug: 'tier-1-vvip-room-1014', name: 'Room 1014', type: LocationType.ROOM, firstVisibleChapter: 358, parentLocationId: vvip.id }
  })

  const room1001 = await prisma.location.create({
    data: { slug: 'tier-1-vvip-room-1001', name: 'Room 1001', type: LocationType.ROOM, firstVisibleChapter: 358, parentLocationId: vvip.id }
  })

  console.log('Seeding Characters...')
  const kurapika = await prisma.character.create({
    data: { slug: 'kurapika', canonicalName: 'Kurapika', firstVisibleChapter: 358, description: 'Hunter' }
  })
  const oito = await prisma.character.create({
    data: { slug: 'oito-hui-guo-rou', canonicalName: 'Oito Hui Guo Rou', firstVisibleChapter: 358, description: '8th Queen' }
  })
  const woble = await prisma.character.create({
    data: { slug: 'woble-hui-guo-rou', canonicalName: 'Woble Hui Guo Rou', firstVisibleChapter: 358, description: '14th Prince' }
  })
  const benjamin = await prisma.character.create({
    data: { slug: 'benjamin-hui-guo-rou', canonicalName: 'Benjamin Hui Guo Rou', firstVisibleChapter: 358, description: '1st Prince' }
  })
  const vincent = await prisma.character.create({
    data: { slug: 'prince-camp-benjamin-soldier-vincent', canonicalName: 'Vincent', firstVisibleChapter: 359, description: 'Benjamin Soldier' }
  })

  console.log('Seeding Events & States...')
  
  // Event 1: Boarding
  const evt1 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch358.id,
      sequence: 1,
      title: 'Boarding the Black Whale',
      summary: 'Passengers board the ship.',
      firstVisibleChapter: 358
    }
  })

  // Kurapika, Oito, Woble go to Room 1014
  for (const char of [kurapika, oito, woble]) {
    await prisma.presence.create({
      data: {
        entityId: char.id,
        locationId: room1014.id,
        fromEventId: evt1.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED
      }
    })
    await prisma.biologicalState.create({
      data: {
        characterId: char.id,
        state: BiologicalStateType.ALIVE,
        fromEventId: evt1.id
      }
    })
  }

  // Benjamin goes to Room 1001
  await prisma.presence.create({
    data: {
      entityId: benjamin.id,
      locationId: room1001.id,
      fromEventId: evt1.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED
    }
  })
  await prisma.biologicalState.create({
    data: {
      characterId: benjamin.id,
      state: BiologicalStateType.ALIVE,
      fromEventId: evt1.id
    }
  })

  // Event 2: Departure (Ch 359)
  const evt2 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch359.id,
      sequence: 2,
      title: 'Ship Departs',
      summary: 'The Black Whale departs for the Dark Continent.',
      firstVisibleChapter: 359
    }
  })

  // Event 3: Vincent arrives at 1014
  const evt3 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch359.id,
      sequence: 3,
      title: 'Vincent arrives',
      summary: 'Vincent enters room 1014.',
      firstVisibleChapter: 359
    }
  })

  await prisma.presence.create({
    data: {
      entityId: vincent.id,
      locationId: room1014.id,
      fromEventId: evt3.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED
    }
  })
  await prisma.biologicalState.create({
    data: {
      characterId: vincent.id,
      state: BiologicalStateType.ALIVE,
      fromEventId: evt3.id
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
