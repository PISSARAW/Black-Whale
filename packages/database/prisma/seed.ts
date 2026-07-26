import { PrismaClient, LocationType, PresencePrecision, PresenceCertainty, BodyStateType, AffiliationType, NarrativeImportance } from '@prisma/client'

const prisma = new PrismaClient()

// Use dynamic import for Node.js built-ins to avoid ESM issues
const { readFile } = require('fs/promises')
const { resolve } = require('path')

// ──────────────────────────────────────────────
// Helper: Map JSON zoneType to Prisma LocationType
// ──────────────────────────────────────────────
function mapZoneTypeToLocationType(zoneType: string): LocationType {
  const mapping: Record<string, LocationType> = {
    ship: LocationType.SHIP,
    tier: LocationType.TIER,
    public: LocationType.ZONE,
    administrative: LocationType.ZONE,
    residential: LocationType.ZONE,
    quarters: LocationType.ROOM,
    infrastructure: LocationType.CORRIDOR,
    mafia: LocationType.ZONE,
    medical: LocationType.ZONE,
    prison: LocationType.ROOM,
    military: LocationType.ZONE,
    corridor: LocationType.CORRIDOR,
    zone: LocationType.ZONE,
    room: LocationType.ROOM,
    UNKNOWN: LocationType.UNKNOWN,
  }
  return mapping[zoneType?.toLowerCase() || ''] || LocationType.UNKNOWN
}

// ──────────────────────────────────────────────
// Helper: Generate mapElementId from location ID
// ──────────────────────────────────────────────
function generateMapElementId(id: string): string | undefined {
  const mapping: Record<string, string> = {
    'black-whale-1': 'black-whale-overview',
    'black-whale': 'black-whale-overview',
    'tier-1': 'tier-1-svg',
    'tier-2': 'tier-2-svg',
    'tier-3': 'tier-3-svg',
    'tier-4': 'tier-4-svg',
    'tier-5': 'tier-5-svg',
    'tier-1-royal-residential-sector-room-1014': 'room-1014-svg',
    'tier-1-royal-residential-sector-room-1001': 'room-1001-svg',
    'tier-1-vvip': 'tier-1-vvip-zone',
    'tier-1-royal-residential-sector': 'tier-1-royal-residential-svg',
    'tier-3-medical-district': 'tier-3-medical-svg',
  }
  return mapping[id] || `${id}-svg`
}

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
  const ch360 = await prisma.chapter.create({ data: { number: 360, title: 'Parasite' } })
  const ch364 = await prisma.chapter.create({ data: { number: 364, title: 'Speculation' } })
  const ch373 = await prisma.chapter.create({ data: { number: 373, title: 'Inheritance' } })
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

  // Woody's death is documented in his passenger record and his chapter 358
  // appearance. Keep it separate from boarding so it remains addressable.
  await prisma.narrativeEvent.create({
    data: {
      chapterId: ch358.id,
      sequence: 2,
      title: 'Woody is found dead',
      summary: 'Woody is found exsanguinated in the bathroom of room 1014.',
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

  // Sayird's two recorded battles both occur in chapter 360.
  await prisma.narrativeEvent.create({
    data: {
      chapterId: ch360.id,
      sequence: 1,
      title: 'Sayird is manipulated',
      summary: 'Controlled by a parasitic Nen ability, Sayird kills Kurton and attacks Kurapika before being subdued.',
    }
  })

  // These events are cross-referenced by the passenger biographies and their
  // explicit battle chapters in data/characters/characters.json.
  const evt3 = await prisma.narrativeEvent.create({
    data: {
      chapterId: ch364.id,
      sequence: 1,
      title: 'Vincent attacks room 1014',
      summary: 'Vincent kills Sandra, opens fire on Bill and Kurapika, then poisons himself after they overpower him.',
    }
  })

  await prisma.narrativeEvent.create({
    data: {
      chapterId: ch373.id,
      sequence: 1,
      title: 'Camilla resurrects after Musse kills her',
      summary: "Camilla's post-mortem Nen beast kills Musse and uses his life force to restore her body.",
    }
  })

  await prisma.narrativeEvent.create({
    data: {
      chapterId: ch373.id,
      sequence: 2,
      title: 'Camilla attacks Benjamin',
      summary: 'Camilla shoots at Furykov, Benjamin and Balsamilco before Furykov breaks her arm and arrests her.',
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

  console.log('Seeding Locations from V2 detailed data...')
  
  // Read locations from JSON file
  const locationsFilePath = resolve(process.cwd(), 'prisma', 'locations.json')
  const locationsData = JSON.parse(await readFile(locationsFilePath, 'utf-8')) as Array<{
    id: string
    name: string
    parentLocationId: string | null
    deck: number | null
    zoneType: string
    description: string
    entrances: string[]
    exits: string[]
  }>
  
  // Create a map from JSON id to Prisma Location for parent resolution
  const locationMap: Map<string, { id: string, slug: string }> = new Map()
  
  // First pass: create all locations
  for (const loc of locationsData) {
    const locationType = mapZoneTypeToLocationType(loc.zoneType)
    const mapElementId = generateMapElementId(loc.id)
    
    // Determine firstVisibleEventId based on tier/deck
    let firstVisibleEventId = evt1.id // Default: visible at boarding
    if (loc.id === 'zodiac-hq') {
      firstVisibleEventId = evt0.id // Zodiac HQ visible earlier
    }
    
    const slug = loc.id.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()
    
    const created = await prisma.location.create({
      data: {
        slug,
        name: loc.name,
        type: locationType,
        parentLocationId: null, // Will be set in second pass
        mapElementId,
        firstVisibleEventId,
      }
    })
    
    locationMap.set(loc.id, { id: created.id, slug: created.slug })
  }
  
  // Second pass: set parent relationships
  for (const loc of locationsData) {
    const current = locationMap.get(loc.id)
    if (!current) continue
    
    if (loc.parentLocationId && loc.parentLocationId !== 'null') {
      const parent = locationMap.get(loc.parentLocationId)
      if (parent) {
        await prisma.location.update({
          where: { id: current.id },
          data: { parentLocationId: parent.id }
        })
      }
    }
  }
  
  // Get references to key locations for the rest of the seed
  const zodiacHQ = locationMap.get('zodiac-hq')
  const blackWhale = locationMap.get('black-whale-1') || locationMap.get('black-whale')
  const tier1 = locationMap.get('tier-1')
  const tier3 = locationMap.get('tier-3')
  const medicalDistrict = locationMap.get('tier-3-medical-district') || locationMap.get('tier-3-central-hospital')
  const room1014 = locationMap.get('tier-1-royal-residential-sector-room-1014') || locationMap.get('tier-1-vvip-room-1014')
  const room1001 = locationMap.get('tier-1-royal-residential-sector-room-1001') || locationMap.get('tier-1-vvip-room-1001')
  
  if (!blackWhale || !zodiacHQ || !tier1 || !tier3) {
    throw new Error('Required locations not found in seed data')
  }

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
      slug: 'queen-oito',
      canonicalName: 'Oito Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '8th Queen',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const woble = await prisma.character.create({
    data: { 
      slug: 'prince-woble',
      canonicalName: 'Woble Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '14th Prince',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const benjamin = await prisma.character.create({
    data: { 
      slug: 'prince-benjamin',
      canonicalName: 'Benjamin Hui Guo Rou', 
      firstVisibleEventId: evt1.id, 
      description: '1st Prince',
      narrativeImportance: NarrativeImportance.PRIMARY,
      modelingLevel: 1
    }
  })
  const vincent = await prisma.character.create({
    data: { 
      slug: 'vincent',
      canonicalName: 'Vincent', 
      firstVisibleEventId: evt3.id, 
      description: 'Benjamin Soldier',
      narrativeImportance: NarrativeImportance.SECONDARY,
      modelingLevel: 2
    }
  })

  console.log('Seeding Presences & States...')
  
  // Helper to get location ID from map by various possible IDs
  const getLocationId = (id: string): string | null => {
    // Try direct match
    const loc = locationMap.get(id)
    if (loc) return loc.id
    
    // Try to find by slug
    for (const [key, value] of locationMap.entries()) {
      if (value.slug === id) return value.id
    }
    
    return null
  }
  
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

  const createOriginalIdentity = async (character: { id: string; canonicalName: string }, bodyId: string, eventId: string) => {
    const consciousness = await prisma.consciousness.create({
      data: {
        originCharacterId: character.id,
        label: `${character.canonicalName} Consciousness`,
        consciousnessType: 'ORIGINAL',
        firstVisibleEventId: eventId
      }
    })
    await prisma.bodyOccupancy.create({
      data: {
        bodyId,
        consciousnessId: consciousness.id,
        fromEventId: eventId,
        occupancyType: 'ORIGINAL',
        certainty: 'CONFIRMED'
      }
    })
  }

  await createOriginalIdentity(kurapika, kuraBody.id, evt1.id)
  await createOriginalIdentity(oito, oitoBody.id, evt1.id)
  await createOriginalIdentity(woble, wobleBody.id, evt1.id)
  await createOriginalIdentity(benjamin, benBody.id, evt1.id)
  await createOriginalIdentity(vincent, vincentBody.id, evt3.id)
  await createOriginalIdentity(leorio, leorioBody.id, evt0.id)

  // Get actual location IDs
  const locRoom1014 = room1014 ? getLocationId(room1014.id) : null
  const locRoom1001 = room1001 ? getLocationId(room1001.id) : null
  const locZodiacHQ = zodiacHQ ? getLocationId(zodiacHQ.id) : null
  const locMedicalDistrict = medicalDistrict ? getLocationId(medicalDistrict.id) : null
  
  if (!locRoom1014 || !locRoom1001 || !locZodiacHQ || !locMedicalDistrict) {
    console.warn('Some locations not found, using fallback references')
  }

  for (const body of [kuraBody, oitoBody, wobleBody]) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: body.id,
        locationId: locRoom1014 || '',
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
  if (locRoom1001) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: benBody.id,
        locationId: locRoom1001,
        fromEventId: evt1.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED
      }
    })
  }
  await prisma.bodyState.create({
    data: {
      bodyId: benBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt1.id
    }
  })

  if (locRoom1014) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: vincentBody.id,
        locationId: locRoom1014,
        fromEventId: evt3.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED
      }
    })
  }
  await prisma.bodyState.create({
    data: {
      bodyId: vincentBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt3.id
    }
  })

  // Leorio
  if (locZodiacHQ) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: leorioBody.id,
        locationId: locZodiacHQ,
        fromEventId: evt0.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED,
        untilEventId: evt1.id
      }
    })
  }
  if (locMedicalDistrict) {
    await prisma.presence.create({
      data: {
        entityType: 'BODY',
        entityId: leorioBody.id,
        locationId: locMedicalDistrict,
        fromEventId: evt1.id,
        precision: PresencePrecision.EXACT_ROOM,
        certainty: PresenceCertainty.CONFIRMED
      }
    })
  }
  // Event 4 (Halkenburg collapse) Leorio is still in Medical District, so presence remains the same.
  
  await prisma.bodyState.create({
    data: {
      bodyId: leorioBody.id,
      state: BodyStateType.ALIVE,
      fromEventId: evt0.id
    }
  })

  // console.log('Seeding Abilities...')
  // NOTE: NenAbility and AbilityActivation models not in current schema
  // TODO: Uncomment when these models are added to Prisma schema
  // const kurapikaAbility1 = await prisma.nenAbility.create({...})
  // const kurapikaAbility2 = await prisma.nenAbility.create({...})
  // const benjaminAbility = await prisma.nenAbility.create({...})
  // await prisma.abilityActivation.create({...})

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
      subjectId: locRoom1014 || room1014?.id || '',
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
      value: { state: 'COLLAPSED', location: locMedicalDistrict || medicalDistrict?.id || '' },
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
