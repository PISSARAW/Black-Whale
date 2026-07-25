import { PrismaClient, LocationType, PresencePrecision, PresenceCertainty, BodyStateType, AffiliationType, NarrativeImportance } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning existing data...')
  // Delete in reverse order of dependencies
  await prisma.informationTransferEvent.deleteMany()
  await prisma.fact.deleteMany()
  await prisma.belief.deleteMany()
  await prisma.knowledgeState.deleteMany()
  await prisma.source.deleteMany()
  await prisma.appearanceState.deleteMany()
  await prisma.bodyOccupancy.deleteMany()
  await prisma.consciousnessState.deleteMany()
  await prisma.bodyState.deleteMany()
  await prisma.presence.deleteMany()
  await prisma.populationCohort.deleteMany()
  await prisma.characterAssignment.deleteMany()
  await prisma.characterRole.deleteMany()
  await prisma.affiliationMembership.deleteMany()
  await prisma.body.deleteMany()
  await prisma.consciousness.deleteMany()
  await prisma.character.deleteMany()
  await prisma.location.deleteMany()
  await prisma.narrativeEvent.deleteMany()
  await prisma.faction.deleteMany()
  await prisma.chapter.deleteMany()

  console.log('Seeding Chapters...')
  const ch340 = await prisma.chapter.create({ data: { number: 340, title: 'Special Mission' } })
  const ch358 = await prisma.chapter.create({ data: { number: 358, title: 'Eve' } })
  const ch359 = await prisma.chapter.create({ data: { number: 359, title: 'Departure' } })
  const ch382 = await prisma.chapter.create({ data: { number: 382, title: 'Awakening' } })

  console.log('Seeding Initial Events...')
  // Event 0: Zodiacs Meeting
  const evt0 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch340.id,
      sequence: 1,
      title: 'Zodiacs Assemble',
      summary: 'Kurapika and Leorio join the Zodiacs.',
    }
  })

  // Event 1: Boarding
  const evt1 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch358.id,
      sequence: 1,
      title: 'Boarding the Black Whale',
      summary: 'Passengers board the ship.',
    }
  })

  // Event 2: Departure (Ch 359)
  const evt2 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch359.id,
      sequence: 2,
      title: 'Ship Departs',
      summary: 'The Black Whale departs for the Dark Continent.',
    }
  })

  // Event 3: Vincent arrives at 1014
  const evt3 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch359.id,
      sequence: 3,
      title: 'Vincent arrives',
      summary: 'Vincent enters room 1014.',
    }
  })

  // Event 4: Halkenburg Collapse
  const evt4 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch382.id,
      sequence: 1,
      title: 'Halkenburg Collapse',
      summary: 'Halkenburg collapses and is taken to the medical facility.',
    }
  })

  console.log('Seeding Locations...')
  const zodiacHQ = await prisma.location.create({
    data: { slug: 'zodiac-hq', name: 'Zodiac HQ', type: LocationType.UNKNOWN, firstVisibleEventId: evt0.id }
  })

  const blackWhale = await prisma.location.create({
    data: { slug: 'black-whale', name: 'Black Whale', type: LocationType.SHIP, firstVisibleEventId: evt1.id }
  })
  
  const tier1 = await prisma.location.create({
    data: { slug: 'tier-1', name: 'Tier 1', type: LocationType.TIER, firstVisibleEventId: evt1.id, parentLocationId: blackWhale.id }
  })

  const vvip = await prisma.location.create({
    data: { slug: 'tier-1-vvip', name: 'VVIP Area', type: LocationType.ZONE, firstVisibleEventId: evt1.id, parentLocationId: tier1.id }
  })

  const room1014 = await prisma.location.create({
    data: { slug: 'tier-1-vvip-room-1014', name: 'Room 1014', type: LocationType.ROOM, firstVisibleEventId: evt1.id, parentLocationId: vvip.id }
  })

  const room1001 = await prisma.location.create({
    data: { slug: 'tier-1-vvip-room-1001', name: 'Room 1001', type: LocationType.ROOM, firstVisibleEventId: evt1.id, parentLocationId: vvip.id }
  })

  const tier3 = await prisma.location.create({
    data: { slug: 'tier-3', name: 'Tier 3', type: LocationType.TIER, firstVisibleEventId: evt1.id, parentLocationId: blackWhale.id }
  })

  const medicalDistrict = await prisma.location.create({
    data: { slug: 'tier-3-medical-district', name: 'Medical District', type: LocationType.ZONE, firstVisibleEventId: evt1.id, parentLocationId: tier3.id }
  })

  console.log('Seeding Characters...')
  const leorio = await prisma.character.create({
    data: { 
      slug: 'leorio-paradinight', 
      canonicalName: 'Leorio Paradinight', 
      firstVisibleEventId: evt0.id, 
      description: 'Zodiac, Doctor',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const kurapika = await prisma.character.create({
    data: { 
      slug: 'kurapika', 
      canonicalName: 'Kurapika', 
      firstVisibleEventId: evt1.id, 
      description: 'Hunter',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const oito = await prisma.character.create({
    data: { 
      slug: 'oito-hui-guo-rou', 
      canonicalName: 'Oito Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '8th Queen',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const woble = await prisma.character.create({
    data: { 
      slug: 'woble-hui-guo-rou', 
      canonicalName: 'Woble Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '14th Prince',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const benjamin = await prisma.character.create({
    data: { 
      slug: 'benjamin-hui-guo-rou', 
      canonicalName: 'Benjamin Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '1st Prince',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const vincent = await prisma.character.create({
    data: { 
      slug: 'prince-camp-benjamin-soldier-vincent', 
      canonicalName: 'Vincent', 
      firstVisibleEventId: evt3.id, 
      description: 'Benjamin Soldier',
      narrativeImportance: NarrativeImportance.SECONDARY,
      modelingLevel: 2
    }
  })

  console.log('Seeding Presences & States...')
  
  // Kurapika, Oito, Woble go to Room 1014
  // We don't seed Bodies right now for simplicity, just the Character if needed, but Presence takes Body? Wait...
  // In the V1 seed, we seeded `entityId` using character's ID even if entityType was BODY.
  // Wait, `Presence` entityId now points to a Body in the schema relation?
  // Let's check schema: body Body? @relation(fields: [entityId], references: [id])
  // This means entityId MUST be a Body's ID if we want to query it. But for V2 we are doing Bodies explicitly.
  // Let's create dummy bodies for them to make seed work perfectly.
  
  const createBody = async (charId: string, label: string, eventId: string) => {
    return await prisma.body.create({
      data: {
        originalCharacterId: charId,
        label,
        bodyType: 'ORIGINAL',
        firstVisibleEventId: eventId
      }
    })
  }

  const kuraBody = await createBody(kurapika.id, 'Kurapika Body', evt1.id)
  const oitoBody = await createBody(oito.id, 'Oito Body', evt1.id)
  const wobleBody = await createBody(woble.id, 'Woble Body', evt1.id)
  const benBody = await createBody(benjamin.id, 'Benjamin Body', evt1.id)
  const vincentBody = await createBody(vincent.id, 'Vincent Body', evt3.id)
  const leorioBody = await createBody(leorio.id, 'Leorio Body', evt0.id)

  for (const body of [kuraBody, oitoBody, wobleBody]) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: body.id,
        locationId: room1014.id,
        fromEventId: evt1.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED
      }
    })
    await prisma.bodyState.create({
      data: {
        bodyId: body.id,
        state: BodyStateType.ALIVE,
        fromEventId: evt1.id
      }
    })
  }

  // Benjamin goes to Room 1001
  await prisma.presence.create({
    data: {
      entityType: 'BODY',
      entityId: benBody.id,
      locationId: room1001.id,
      fromEventId: evt1.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED
    }
  })
  await prisma.bodyState.create({
    data: {
      bodyId: benBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt1.id
    }
  })

  await prisma.presence.create({
    data: {
      entityType: 'BODY',
      entityId: vincentBody.id,
      locationId: room1014.id,
      fromEventId: evt3.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED
    }
  })
  await prisma.bodyState.create({
    data: {
      bodyId: vincentBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt3.id
    }
  })

  // Leorio
  await prisma.presence.create({
    data: {
      entityType: 'BODY',
      entityId: leorioBody.id,
      locationId: zodiacHQ.id,
      fromEventId: evt0.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED,
      untilEventId: evt1.id
    }
  })
  await prisma.presence.create({
    data: {
      entityType: 'BODY',
      entityId: leorioBody.id,
      locationId: medicalDistrict.id,
      fromEventId: evt1.id,
      precision: PresencePrecision.EXACT_ROOM,
      certainty: PresenceCertainty.CONFIRMED
    }
  })
  // Event 4 (Halkenburg collapse) Leorio is still in Medical District, so presence remains the same.
  
  await prisma.bodyState.create({
    data: {
      bodyId: leorioBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt0.id
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
