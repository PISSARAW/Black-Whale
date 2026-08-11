import type { PrismaClient } from '@prisma/client'
import { EventIndex } from '../map/events.js'
import {
  closesAfter,
  endAliveState,
  endOriginalOccupancy,
  requiredCharacter,
  requiredEvent,
  requiredLocation,
  upsertBodyState,
  upsertConsciousnessState,
  upsertOccupancy,
  upsertPresence,
  type CharacterIdentity,
  type EventRow,
} from './writes.js'

/**
 * The three places the arc separates a body from the consciousness in it.
 *
 * Nothing here can be inferred from `shipLocation`: a swap is an event, not a
 * position, and the catalogue has no way to say "Halkenburg is now driving
 * Balsamilco". So the episodes are written out — but keyed, idempotent, and
 * running against the same event log everything else uses.
 *
 * The catalogue marks the bodies involved `temporalIdentityManaged`, which is
 * how the map pass knows to leave their history alone.
 */

export interface CompileIdentitiesReport {
  halkenburgTransfers: number
  kachoBodyEnded: boolean
  withoutYouBodyId: string
}

/** Grimmel the Dissonance swaps the selected supporter and the target. */
async function grimmelSwap({
  prisma,
  pair,
  strike,
}: {
  prisma: PrismaClient
  pair: { sumidori: CharacterIdentity; shikaku: CharacterIdentity }
  strike: EventRow
}): Promise<void> {
  const { sumidori, shikaku } = pair
  await endOriginalOccupancy({ prisma, character: sumidori, untilEventId: strike.id })
  await endOriginalOccupancy({ prisma, character: shikaku, untilEventId: strike.id })

  await upsertOccupancy(prisma, {
    id: 'occupancy-sumidori-in-shikaku',
    bodyId: shikaku.originalBody.id,
    consciousnessId: sumidori.originalConsciousness.id,
    fromEventId: strike.id,
  })
  await upsertOccupancy(prisma, {
    id: 'occupancy-shikaku-in-sumidori',
    bodyId: sumidori.originalBody.id,
    consciousnessId: shikaku.originalConsciousness.id,
    fromEventId: strike.id,
  })
  for (const [id, consciousnessId] of [
    ['consciousness-state-sumidori-transferred', sumidori.originalConsciousness.id],
    ['consciousness-state-shikaku-transferred', shikaku.originalConsciousness.id],
  ] as const) {
    await upsertConsciousnessState(prisma, {
      id,
      consciousnessId,
      state: 'TRANSFERRED',
      fromEventId: strike.id,
    })
  }
}

/**
 * Halkenburg leaves his biological body and operates through Balsamilco.
 *
 * His own body is carried to the central hospital and dies there, so it holds
 * one closed presence in the ward and one open last-known record afterwards —
 * a corpse is not on the map, but it is not nowhere either.
 */
async function halkenburgTransfer({
  prisma,
  pair,
  scene,
}: {
  prisma: PrismaClient
  pair: { halkenburg: CharacterIdentity; balsamilco: CharacterIdentity }
  scene: {
    strike: EventRow
    death: EventRow
    hospitalId: string
    unknownId: string
    ordinals: ReadonlyMap<string, number>
  }
}): Promise<void> {
  const { halkenburg, balsamilco } = pair
  await endOriginalOccupancy({ prisma, character: halkenburg, untilEventId: scene.strike.id })
  await endOriginalOccupancy({ prisma, character: balsamilco, untilEventId: scene.strike.id })
  await upsertOccupancy(prisma, {
    id: 'occupancy-halkenburg-in-balsamilco',
    bodyId: balsamilco.originalBody.id,
    consciousnessId: halkenburg.originalConsciousness.id,
    fromEventId: scene.strike.id,
  })
  await upsertConsciousnessState(prisma, {
    id: 'consciousness-state-halkenburg-transferred',
    consciousnessId: halkenburg.originalConsciousness.id,
    state: 'TRANSFERRED',
    fromEventId: scene.strike.id,
  })
  await upsertConsciousnessState(prisma, {
    id: 'consciousness-state-balsamilco-suppressed',
    consciousnessId: balsamilco.originalConsciousness.id,
    state: 'SUPPRESSED',
    fromEventId: scene.strike.id,
  })

  const managed = ['presence-halkenburg-hospital', 'presence-halkenburg-corpse']
  const prior = await prisma.presence.findMany({
    where: { entityId: halkenburg.originalBody.id, id: { notIn: managed } },
    select: { id: true, untilEventId: true },
  })
  for (const presence of prior) {
    if (!closesAfter(presence, scene.strike.id, scene.ordinals)) continue
    await prisma.presence.update({
      where: { id: presence.id },
      data: { untilEventId: scene.strike.id },
    })
  }

  await upsertPresence(prisma, {
    id: 'presence-halkenburg-hospital',
    bodyId: halkenburg.originalBody.id,
    locationId: scene.hospitalId,
    fromEventId: scene.strike.id,
    untilEventId: scene.death.id,
    precision: 'ZONE',
    certainty: 'CONFIRMED',
  })
  await upsertPresence(prisma, {
    id: 'presence-halkenburg-corpse',
    bodyId: halkenburg.originalBody.id,
    locationId: scene.unknownId,
    fromEventId: scene.death.id,
    precision: 'UNKNOWN',
    certainty: 'LAST_KNOWN',
  })
  await endAliveState({ prisma, bodyId: halkenburg.originalBody.id, untilEventId: scene.death.id })
  await upsertBodyState(prisma, {
    id: 'body-state-halkenburg-dead',
    bodyId: halkenburg.originalBody.id,
    state: 'DEAD',
    fromEventId: scene.death.id,
  })
}

/** Kacho's biological continuity ends outside the ship. */
async function kachoDies({
  prisma,
  kacho,
  scene,
}: {
  prisma: PrismaClient
  kacho: CharacterIdentity
  scene: { death: EventRow; ordinals: ReadonlyMap<string, number> }
}): Promise<void> {
  await endOriginalOccupancy({ prisma, character: kacho, untilEventId: scene.death.id })
  await endAliveState({ prisma, bodyId: kacho.originalBody.id, untilEventId: scene.death.id })
  await upsertBodyState(prisma, {
    id: 'body-state-kacho-dead',
    bodyId: kacho.originalBody.id,
    state: 'DEAD',
    fromEventId: scene.death.id,
  })
  await upsertConsciousnessState(prisma, {
    id: 'consciousness-state-kacho-destroyed',
    consciousnessId: kacho.originalConsciousness.id,
    state: 'DESTROYED',
    fromEventId: scene.death.id,
  })

  const presences = await prisma.presence.findMany({
    where: { entityId: kacho.originalBody.id },
    select: { id: true, untilEventId: true },
  })
  for (const presence of presences) {
    if (!closesAfter(presence, scene.death.id, scene.ordinals)) continue
    await prisma.presence.update({
      where: { id: presence.id },
      data: { untilEventId: scene.death.id },
    })
  }
}

/**
 * Without You is a distinct post-mortem Nen entity, not Kacho's surviving body.
 *
 * It wears Kacho's appearance, which is why it carries an AppearanceState
 * rather than being filed as her: a reader who knows only what is on panel sees
 * Kacho, and the map has to be able to say both things at once.
 */
async function withoutYouReturns({
  prisma,
  kacho,
  scene,
}: {
  prisma: PrismaClient
  kacho: CharacterIdentity
  scene: {
    returns: EventRow
    protected: EventRow
    fugetsuRoomId: string
    witnessProtectionId: string
  }
}): Promise<string> {
  const bodyShape = {
    originalCharacterId: null,
    label: 'Without You — Kacho construct',
    bodyType: 'CONSTRUCT' as const,
    firstVisibleEventId: scene.returns.id,
  }
  const body = await prisma.body.upsert({
    where: { id: 'body-without-you-kacho' },
    update: bodyShape,
    create: { id: 'body-without-you-kacho', ...bodyShape },
    select: { id: true },
  })
  const mindShape = {
    originCharacterId: null,
    label: 'Without You',
    consciousnessType: 'NEN_ENTITY' as const,
    firstVisibleEventId: scene.returns.id,
  }
  const mind = await prisma.consciousness.upsert({
    where: { id: 'consciousness-without-you-kacho' },
    update: mindShape,
    create: { id: 'consciousness-without-you-kacho', ...mindShape },
    select: { id: true },
  })

  await upsertOccupancy(prisma, {
    id: 'occupancy-without-you-kacho',
    bodyId: body.id,
    consciousnessId: mind.id,
    fromEventId: scene.returns.id,
    occupancyType: 'ORIGINAL',
  })
  await upsertBodyState(prisma, {
    id: 'body-state-without-you-active',
    bodyId: body.id,
    state: 'ALIVE',
    fromEventId: scene.returns.id,
  })

  const appearance = {
    entityId: body.id,
    entityType: 'BODY' as const,
    appearanceCharacterId: kacho.id,
    fromEventId: scene.returns.id,
    cause: 'NEN_ABILITY' as const,
  }
  await prisma.appearanceState.upsert({
    where: { id: 'appearance-without-you-as-kacho' },
    update: { ...appearance, appearanceAssetId: null, untilEventId: null },
    create: { id: 'appearance-without-you-as-kacho', ...appearance },
  })

  // Without You goes where Fugetsu goes, and between the failed escape and the
  // confinement Fugetsu is back in her own apartment — so the construct is in
  // 1011 with her, not in the Ministry of Justice at large. It used to be filed
  // at the bureau, which put the twins in two different rooms of the ship for
  // seventeen events, the bed they share on panel included.
  await upsertPresence(prisma, {
    id: 'presence-without-you-fugetsu-room',
    bodyId: body.id,
    locationId: scene.fugetsuRoomId,
    fromEventId: scene.returns.id,
    untilEventId: scene.protected.id,
    precision: 'EXACT_ROOM',
    certainty: 'CONFIRMED',
  })
  // The bureau record this replaced, dropped so a rerun does not leave the
  // construct standing in two places at once.
  await prisma.presence.deleteMany({ where: { id: 'presence-without-you-justice-bureau' } })
  // The construct is not held in the bureau at large: it is shut in the witness
  // protection area with Fugetsu, which is where it finds her exhausted and
  // arranges for Melody to cross her in the halls.
  await upsertPresence(prisma, {
    id: 'presence-without-you-witness-protection',
    bodyId: body.id,
    locationId: scene.witnessProtectionId,
    fromEventId: scene.protected.id,
    precision: 'ZONE',
    certainty: 'CONFIRMED',
  })
  return body.id
}

export async function compileIdentities(prisma: PrismaClient): Promise<CompileIdentitiesReport> {
  const character = (slug: string) => requiredCharacter(prisma, slug)
  const event = (title: string) => requiredEvent(prisma, title)
  const location = (slug: string) => requiredLocation(prisma, slug)

  const [halkenburg, balsamilco, shikaku, sumidori, kacho] = await Promise.all([
    character('prince-halkenburg'),
    character('balsamilco-might'),
    character('shikaku'),
    character('sumidori'),
    character('prince-kacho'),
  ])
  const [
    shikakuStrike,
    balsamilcoStrike,
    halkenburgBodyDeath,
    kachoDeath,
    withoutYouReturn,
    // Chapter 400 is where the confinement is on panel: Melody is let in to
    // examine Fugetsu, who is already being held in witness protection.
    fugetsuProtected,
  ] = await Promise.all([
    event('Halkenburg commits to the Succession Contest'),
    event("Halkenburg takes Balsamilco's body"),
    event("Halkenburg's body dies"),
    event('Kacho dies and Without You awakens'),
    event('Without You rejoins Fugetsu aboard the Black Whale'),
    event('The Phantom Troupe confirms the hideout is on Tier 2'),
  ])
  const [centralHospital, fugetsuRoom, witnessProtection, unknownLocation] = await Promise.all([
    location('tier-3-central-hospital'),
    location('tier-1-royal-residential-sector-room-1011'),
    location('tier-2-vip-witness-protection-area'),
    location('black-whale-unknown'),
  ])
  const ordinals = await new EventIndex(prisma).ordinals()

  await grimmelSwap({ prisma, pair: { sumidori, shikaku }, strike: shikakuStrike })
  await halkenburgTransfer({
    prisma,
    pair: { halkenburg, balsamilco },
    scene: {
      strike: balsamilcoStrike,
      death: halkenburgBodyDeath,
      hospitalId: centralHospital.id,
      unknownId: unknownLocation.id,
      ordinals,
    },
  })
  await kachoDies({ prisma, kacho, scene: { death: kachoDeath, ordinals } })
  const withoutYouBodyId = await withoutYouReturns({
    prisma,
    kacho,
    scene: {
      returns: withoutYouReturn,
      protected: fugetsuProtected,
      fugetsuRoomId: fugetsuRoom.id,
      witnessProtectionId: witnessProtection.id,
    },
  })

  return { halkenburgTransfers: 2, kachoBodyEnded: true, withoutYouBodyId }
}
