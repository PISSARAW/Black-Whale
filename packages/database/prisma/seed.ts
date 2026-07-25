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
    data: { 
      slug: 'zodiac-hq', 
      name: 'Zodiac HQ', 
      type: LocationType.UNKNOWN, 
      firstVisibleEventId: evt0.id,
      mapElementId: 'zodiac-hq-svg'
    }
  })

  const blackWhale = await prisma.location.create({
    data: { 
      slug: 'black-whale', 
      name: 'Black Whale', 
      type: LocationType.SHIP, 
      firstVisibleEventId: evt1.id,
      mapElementId: 'black-whale-overview'
    }
  })
  
  const tier1 = await prisma.location.create({
    data: { 
      slug: 'tier-1', 
      name: 'Tier 1', 
      type: LocationType.TIER, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: blackWhale.id,
      mapElementId: 'tier-1-svg'
    }
  })

  const vvip = await prisma.location.create({
    data: { 
      slug: 'tier-1-vvip', 
      name: 'VVIP Area', 
      type: LocationType.ZONE, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: tier1.id,
      mapElementId: 'tier-1-vvip-zone'
    }
  })

  const room1014 = await prisma.location.create({
    data: { 
      slug: 'tier-1-vvip-room-1014', 
      name: 'Room 1014', 
      type: LocationType.ROOM, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: vvip.id,
      mapElementId: 'room-1014-svg'
    }
  })

  const room1001 = await prisma.location.create({
    data: { 
      slug: 'tier-1-vvip-room-1001', 
      name: 'Room 1001', 
      type: LocationType.ROOM, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: vvip.id,
      mapElementId: 'room-1001-svg'
    }
  })

  const tier3 = await prisma.location.create({
    data: { 
      slug: 'tier-3', 
      name: 'Tier 3', 
      type: LocationType.TIER, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: blackWhale.id,
      mapElementId: 'tier-3-svg'
    }
  })

  const medicalDistrict = await prisma.location.create({
    data: { 
      slug: 'tier-3-medical-district', 
      name: 'Medical District', 
      type: LocationType.ZONE, 
      firstVisibleEventId: evt1.id, 
      parentLocationId: tier3.id,
      mapElementId: 'tier-3-medical-svg'
    }
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

  console.log('Seeding Abilities...')
  // Kurapika's abilities
  const kurapikaAbility1 = await prisma.nenAbility.create({
    data: {
      id: 'kurapika-ability-judgement-chain',
      ownerId: kurapika.id,
      name: 'Judgment Chain',
      category: 'CONJURATION' as any,
      description: 'Chains that can be thrown to capture targets. Each finger has a specific condition.',
      canonStatus: 'CANON' as any,
      moduleKey: 'judgement-chain'
    }
  })

  const kurapikaAbility2 = await prisma.nenAbility.create({
    data: {
      id: 'kurapika-ability-holy-chain',
      ownerId: kurapika.id,
      name: 'Holy Chain',
      category: 'CONJURATION' as any,
      description: 'Chains used for binding and defense. Can be used to restrain or protect.',
      canonStatus: 'CANON' as any,
      moduleKey: 'holy-chain'
    }
  })

  // Benjamin's abilities
  const benjaminAbility = await prisma.nenAbility.create({
    data: {
      id: 'benjamin-ability-dragon-diver',
      ownerId: benjamin.id,
      name: 'Dragon Diver',
      category: 'MANIPULATION' as any,
      description: 'Can manipulate dragon-like creatures.',
      canonStatus: 'CANON' as any,
      moduleKey: 'dragon-diver'
    }
  })

  console.log('Seeding Ability Activations...')
  await prisma.abilityActivation.create({
    data: {
      id: 'activation-kurapika-judgement-chain-evt1',
      abilityId: kurapikaAbility1.id,
      actorId: kurapika.id,
      startedAtEventId: evt1.id,
      state: 'ACTIVE' as any
    }
  })

  console.log('Seeding Facts...')
  // Fact about Kurapika being a Hunter
  const fact1 = await prisma.fact.create({
    data: {
      id: 'fact-kurapika-is-hunter',
      subjectType: 'CHARACTER' as any,
      subjectId: kurapika.id,
      predicate: 'is',
      value: { role: 'Hunter', specialization: 'Blacklist Hunter' },
      validFromEventId: evt0.id,
      validUntilEventId: null,
      truthStatus: 'CONFIRMED' as any,
      firstVisibleEventId: evt0.id
    }
  })

  // Fact about Benjamin being the 1st Prince
  const fact2 = await prisma.fact.create({
    data: {
      id: 'fact-benjamin-is-first-prince',
      subjectType: 'CHARACTER' as any,
      subjectId: benjamin.id,
      predicate: 'is',
      value: { title: '1st Prince', family: 'Hui Guo Rou' },
      validFromEventId: evt1.id,
      validUntilEventId: null,
      truthStatus: 'CONFIRMED' as any,
      firstVisibleEventId: evt1.id
    }
  })

  // Fact about Room 1014 location
  const fact3 = await prisma.fact.create({
    data: {
      id: 'fact-room-1014-is-vvip',
      subjectType: 'LOCATION' as any,
      subjectId: room1014.id,
      predicate: 'isLocatedIn',
      value: { area: 'VVIP', tier: 1 },
      validFromEventId: evt1.id,
      validUntilEventId: null,
      truthStatus: 'CONFIRMED' as any,
      firstVisibleEventId: evt1.id
    }
  })

  // Fact about Halkenburg collapse
  const fact4 = await prisma.fact.create({
    data: {
      id: 'fact-halkenburg-collapsed',
      subjectType: 'CHARACTER' as any,
      subjectId: 'halkenburg',
      predicate: 'status',
      value: { state: 'COLLAPSED', location: medicalDistrict.id },
      validFromEventId: evt4.id,
      validUntilEventId: null,
      truthStatus: 'CONFIRMED' as any,
      firstVisibleEventId: evt4.id
    }
  })

  console.log('Seeding KnowledgeStates...')
  // Kurapika knows about Benjamin being the 1st Prince
  await prisma.knowledgeState.create({
    data: {
      id: 'ks-kurapika-knows-benjamin-first-prince',
      observerCharacterId: kurapika.id,
      factId: fact2.id,
      fromEventId: evt1.id,
      untilEventId: null,
      epistemicState: 'KNOWN' as any,
      confidence: 1.0,
      acquisitionMethod: 'DIRECT_OBSERVATION' as any,
      sourceCharacterId: null,
      acquisitionEventId: evt1.id
    }
  })

  // Leorio knows about Kurapika being a Hunter
  await prisma.knowledgeState.create({
    data: {
      id: 'ks-leorio-knows-kurapika-hunter',
      observerCharacterId: leorio.id,
      factId: fact1.id,
      fromEventId: evt0.id,
      untilEventId: null,
      epistemicState: 'KNOWN' as any,
      confidence: 1.0,
      acquisitionMethod: 'DIRECT_OBSERVATION' as any,
      sourceCharacterId: null,
      acquisitionEventId: evt0.id
    }
  })

  // Oito knows about Room 1014 being VVIP (by being there)
  await prisma.knowledgeState.create({
    data: {
      id: 'ks-oito-knows-room-1014-vvip',
      observerCharacterId: oito.id,
      factId: fact3.id,
      fromEventId: evt1.id,
      untilEventId: null,
      epistemicState: 'KNOWN' as any,
      confidence: 1.0,
      acquisitionMethod: 'DIRECT_OBSERVATION' as any,
      sourceCharacterId: null,
      acquisitionEventId: evt1.id
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
