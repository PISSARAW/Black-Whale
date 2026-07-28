import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function requiredCharacter(slug) {
  const character = await prisma.character.findUnique({
    where: { slug },
    include: { originalBody: true, originalConsciousness: true },
  })
  if (!character?.originalBody || !character.originalConsciousness) {
    throw new Error(`Identity records missing for ${slug}`)
  }
  return character
}

async function requiredEvent(title) {
  const event = await prisma.narrativeEvent.findFirst({ where: { title } })
  if (!event) throw new Error(`Narrative event missing: ${title}`)
  return event
}

async function requiredLocation(slug) {
  const location = await prisma.location.findUnique({ where: { slug } })
  if (!location) throw new Error(`Location missing: ${slug}`)
  return location
}

async function eventOrdinalsById() {
  const events = await prisma.narrativeEvent.findMany({ select: { id: true, ordinal: true } })
  return new Map(events.map((event) => [event.id, event.ordinal ?? Number.MAX_SAFE_INTEGER]))
}

/// Capping a body's earlier presences at the moment it changes hands assumes
/// those presences all run past that moment. Once the catalogue can route a
/// managed character through several rooms, some of them already close earlier —
/// and rewriting their end to the later event resurrects the body in a room it
/// had left, overlapping the leg that followed. Only presences still open, or
/// closing after the cut, are pulled back to it.
function closesAfter(presence, cutEvent, ordinals) {
  if (!presence.untilEventId) return true
  const end = ordinals.get(presence.untilEventId) ?? Number.MAX_SAFE_INTEGER
  const cut = ordinals.get(cutEvent.id) ?? Number.MAX_SAFE_INTEGER
  return end > cut
}

async function endOriginalOccupancy(character, untilEventId) {
  const occupancy = await prisma.bodyOccupancy.findFirst({
    where: {
      bodyId: character.originalBody.id,
      consciousnessId: character.originalConsciousness.id,
      occupancyType: 'ORIGINAL',
    },
    orderBy: { id: 'asc' },
  })
  if (!occupancy) throw new Error(`Original occupancy missing for ${character.slug}`)
  await prisma.bodyOccupancy.update({
    where: { id: occupancy.id },
    data: { untilEventId },
  })
}

async function upsertOccupancy({
  id,
  bodyId,
  consciousnessId,
  fromEventId,
  occupancyType = 'TRANSFERRED',
  certainty = 'CONFIRMED',
}) {
  await prisma.bodyOccupancy.upsert({
    where: { id },
    update: { bodyId, consciousnessId, fromEventId, untilEventId: null, occupancyType, certainty },
    create: { id, bodyId, consciousnessId, fromEventId, occupancyType, certainty },
  })
}

async function upsertConsciousnessState({ id, consciousnessId, state, fromEventId }) {
  await prisma.consciousnessState.upsert({
    where: { id },
    update: { consciousnessId, state, fromEventId, untilEventId: null },
    create: { id, consciousnessId, state, fromEventId },
  })
}

async function endAliveState(bodyId, untilEventId) {
  const aliveStates = await prisma.bodyState.findMany({ where: { bodyId, state: 'ALIVE' } })
  for (const state of aliveStates) {
    await prisma.bodyState.update({ where: { id: state.id }, data: { untilEventId } })
  }
}

async function upsertBodyState({ id, bodyId, state, fromEventId }) {
  await prisma.bodyState.upsert({
    where: { id },
    update: { bodyId, state, fromEventId, untilEventId: null },
    create: { id, bodyId, state, fromEventId },
  })
}

async function upsertPresence({
  id,
  bodyId,
  locationId,
  fromEventId,
  untilEventId = null,
  precision,
  certainty,
}) {
  await prisma.presence.upsert({
    where: { id },
    update: {
      entityType: 'BODY',
      entityId: bodyId,
      locationId,
      fromEventId,
      untilEventId,
      precision,
      certainty,
    },
    create: {
      id,
      entityType: 'BODY',
      entityId: bodyId,
      locationId,
      fromEventId,
      untilEventId,
      precision,
      certainty,
    },
  })
}

async function main() {
  const [
    halkenburg,
    balsamilco,
    shikaku,
    sumidori,
    kacho,
    shikakuStrike,
    balsamilcoStrike,
    halkenburgBodyDeath,
    kachoDeath,
    withoutYouReturn,
    centralHospital,
    ministryOfJustice,
    witnessProtection,
    unknownLocation,
    // Chapter 400 is where the confinement is on panel: Melody is let in to
    // examine Fugetsu, who is already being held in witness protection.
    fugetsuProtected,
  ] = await Promise.all([
    requiredCharacter('prince-halkenburg'),
    requiredCharacter('balsamilco-might'),
    requiredCharacter('shikaku'),
    requiredCharacter('sumidori'),
    requiredCharacter('prince-kacho'),
    requiredEvent('Halkenburg strikes Shikaku'),
    requiredEvent("Halkenburg takes Balsamilco's body"),
    requiredEvent("Halkenburg's body dies"),
    requiredEvent('Kacho dies and Without You awakens'),
    requiredEvent('Without You rejoins Fugetsu aboard the Black Whale'),
    requiredLocation('tier-3-central-hospital'),
    requiredLocation('tier-2-ministry-of-justice'),
    requiredLocation('tier-2-vip-witness-protection-area'),
    requiredLocation('black-whale-unknown'),
    requiredEvent('The Phantom Troupe confirms the hideout is on Tier 2'),
  ])
  const eventOrdinals = await eventOrdinalsById()

  // Grimmel the Dissonance swaps the selected supporter and target.
  await endOriginalOccupancy(sumidori, shikakuStrike.id)
  await endOriginalOccupancy(shikaku, shikakuStrike.id)
  await upsertOccupancy({
    id: 'occupancy-sumidori-in-shikaku',
    bodyId: shikaku.originalBody.id,
    consciousnessId: sumidori.originalConsciousness.id,
    fromEventId: shikakuStrike.id,
  })
  await upsertOccupancy({
    id: 'occupancy-shikaku-in-sumidori',
    bodyId: sumidori.originalBody.id,
    consciousnessId: shikaku.originalConsciousness.id,
    fromEventId: shikakuStrike.id,
  })
  await upsertConsciousnessState({
    id: 'consciousness-state-sumidori-transferred',
    consciousnessId: sumidori.originalConsciousness.id,
    state: 'TRANSFERRED',
    fromEventId: shikakuStrike.id,
  })
  await upsertConsciousnessState({
    id: 'consciousness-state-shikaku-transferred',
    consciousnessId: shikaku.originalConsciousness.id,
    state: 'TRANSFERRED',
    fromEventId: shikakuStrike.id,
  })

  // Halkenburg later leaves his biological body and operates through Balsamilco.
  await endOriginalOccupancy(halkenburg, balsamilcoStrike.id)
  await endOriginalOccupancy(balsamilco, balsamilcoStrike.id)
  await upsertOccupancy({
    id: 'occupancy-halkenburg-in-balsamilco',
    bodyId: balsamilco.originalBody.id,
    consciousnessId: halkenburg.originalConsciousness.id,
    fromEventId: balsamilcoStrike.id,
  })
  await upsertConsciousnessState({
    id: 'consciousness-state-halkenburg-transferred',
    consciousnessId: halkenburg.originalConsciousness.id,
    state: 'TRANSFERRED',
    fromEventId: balsamilcoStrike.id,
  })
  await upsertConsciousnessState({
    id: 'consciousness-state-balsamilco-suppressed',
    consciousnessId: balsamilco.originalConsciousness.id,
    state: 'SUPPRESSED',
    fromEventId: balsamilcoStrike.id,
  })

  const halkenburgPriorPresences = await prisma.presence.findMany({
    where: {
      entityId: halkenburg.originalBody.id,
      id: { notIn: ['presence-halkenburg-hospital', 'presence-halkenburg-corpse'] },
    },
  })
  for (const presence of halkenburgPriorPresences) {
    if (!closesAfter(presence, balsamilcoStrike, eventOrdinals)) continue
    await prisma.presence.update({
      where: { id: presence.id },
      data: { untilEventId: balsamilcoStrike.id },
    })
  }
  await upsertPresence({
    id: 'presence-halkenburg-hospital',
    bodyId: halkenburg.originalBody.id,
    locationId: centralHospital.id,
    fromEventId: balsamilcoStrike.id,
    untilEventId: halkenburgBodyDeath.id,
    precision: 'ZONE',
    certainty: 'CONFIRMED',
  })
  await upsertPresence({
    id: 'presence-halkenburg-corpse',
    bodyId: halkenburg.originalBody.id,
    locationId: unknownLocation.id,
    fromEventId: halkenburgBodyDeath.id,
    precision: 'UNKNOWN',
    certainty: 'LAST_KNOWN',
  })
  await endAliveState(halkenburg.originalBody.id, halkenburgBodyDeath.id)
  await upsertBodyState({
    id: 'body-state-halkenburg-dead',
    bodyId: halkenburg.originalBody.id,
    state: 'DEAD',
    fromEventId: halkenburgBodyDeath.id,
  })

  // Kacho's biological continuity ends outside the ship.
  await endOriginalOccupancy(kacho, kachoDeath.id)
  await endAliveState(kacho.originalBody.id, kachoDeath.id)
  await upsertBodyState({
    id: 'body-state-kacho-dead',
    bodyId: kacho.originalBody.id,
    state: 'DEAD',
    fromEventId: kachoDeath.id,
  })
  await upsertConsciousnessState({
    id: 'consciousness-state-kacho-destroyed',
    consciousnessId: kacho.originalConsciousness.id,
    state: 'DESTROYED',
    fromEventId: kachoDeath.id,
  })
  const kachoPresences = await prisma.presence.findMany({
    where: { entityId: kacho.originalBody.id },
  })
  for (const presence of kachoPresences) {
    if (!closesAfter(presence, kachoDeath, eventOrdinals)) continue
    await prisma.presence.update({
      where: { id: presence.id },
      data: { untilEventId: kachoDeath.id },
    })
  }

  // Without You is a distinct post-mortem Nen entity, not Kacho's surviving body.
  const withoutYouBody = await prisma.body.upsert({
    where: { id: 'body-without-you-kacho' },
    update: {
      originalCharacterId: null,
      label: 'Without You — Kacho construct',
      bodyType: 'CONSTRUCT',
      firstVisibleEventId: withoutYouReturn.id,
    },
    create: {
      id: 'body-without-you-kacho',
      originalCharacterId: null,
      label: 'Without You — Kacho construct',
      bodyType: 'CONSTRUCT',
      firstVisibleEventId: withoutYouReturn.id,
    },
  })
  const withoutYouConsciousness = await prisma.consciousness.upsert({
    where: { id: 'consciousness-without-you-kacho' },
    update: {
      originCharacterId: null,
      label: 'Without You',
      consciousnessType: 'NEN_ENTITY',
      firstVisibleEventId: withoutYouReturn.id,
    },
    create: {
      id: 'consciousness-without-you-kacho',
      originCharacterId: null,
      label: 'Without You',
      consciousnessType: 'NEN_ENTITY',
      firstVisibleEventId: withoutYouReturn.id,
    },
  })
  await upsertOccupancy({
    id: 'occupancy-without-you-kacho',
    bodyId: withoutYouBody.id,
    consciousnessId: withoutYouConsciousness.id,
    fromEventId: withoutYouReturn.id,
    occupancyType: 'ORIGINAL',
  })
  await upsertBodyState({
    id: 'body-state-without-you-active',
    bodyId: withoutYouBody.id,
    state: 'ALIVE',
    fromEventId: withoutYouReturn.id,
  })
  await prisma.appearanceState.upsert({
    where: { id: 'appearance-without-you-as-kacho' },
    update: {
      entityId: withoutYouBody.id,
      entityType: 'BODY',
      appearanceCharacterId: kacho.id,
      appearanceAssetId: null,
      fromEventId: withoutYouReturn.id,
      untilEventId: null,
      cause: 'NEN_ABILITY',
    },
    create: {
      id: 'appearance-without-you-as-kacho',
      entityId: withoutYouBody.id,
      entityType: 'BODY',
      appearanceCharacterId: kacho.id,
      fromEventId: withoutYouReturn.id,
      cause: 'NEN_ABILITY',
    },
  })
  await upsertPresence({
    id: 'presence-without-you-justice-bureau',
    bodyId: withoutYouBody.id,
    locationId: ministryOfJustice.id,
    fromEventId: withoutYouReturn.id,
    untilEventId: fugetsuProtected.id,
    precision: 'ZONE',
    certainty: 'CONFIRMED',
  })
  // The construct is not held in the bureau at large: it is shut in the witness
  // protection area with Fugetsu, which is where it finds her exhausted and
  // arranges for Melody to cross her in the halls.
  await upsertPresence({
    id: 'presence-without-you-witness-protection',
    bodyId: withoutYouBody.id,
    locationId: witnessProtection.id,
    fromEventId: fugetsuProtected.id,
    precision: 'ZONE',
    certainty: 'CONFIRMED',
  })

  console.log(
    JSON.stringify(
      {
        halkenburgTransfers: 2,
        kachoBodyEnded: true,
        withoutYouBodyId: withoutYouBody.id,
        withoutYouAppearance: kacho.slug,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
