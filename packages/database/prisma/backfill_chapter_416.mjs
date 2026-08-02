import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function requiredEvent(title) {
  const event = await prisma.narrativeEvent.findFirst({ where: { title } })
  if (!event) throw new Error(`Narrative event missing: ${title}`)
  return event
}

async function requiredCharacter(slug) {
  const character = await prisma.character.findUnique({
    where: { slug },
    include: { originalBody: true },
  })
  if (!character?.originalBody) throw new Error(`Character body missing: ${slug}`)
  return character
}

async function requiredLocation(slug) {
  const location = await prisma.location.findUnique({ where: { slug } })
  if (!location) throw new Error(`Location missing: ${slug}`)
  return location
}

async function upsertParticipation(event, character, participationType) {
  const id = `ch416-participation-${event.sequence}-${character.slug}`
  await prisma.eventParticipation.upsert({
    where: { id },
    update: {
      eventId: event.id,
      participantId: character.id,
      participantType: 'CHARACTER',
      participationType,
    },
    create: {
      id,
      eventId: event.id,
      participantId: character.id,
      participantType: 'CHARACTER',
      participationType,
    },
  })
}

async function moveBody({ id, character, location, event }) {
  await prisma.presence.updateMany({
    where: {
      entityId: character.originalBody.id,
      untilEventId: null,
      id: { not: id },
    },
    data: { untilEventId: event.id },
  })
  await prisma.presence.upsert({
    where: { id },
    update: {
      entityType: 'BODY',
      entityId: character.originalBody.id,
      locationId: location.id,
      fromEventId: event.id,
      untilEventId: null,
      precision: 'EXACT_ROOM',
      certainty: 'CONFIRMED',
    },
    create: {
      id,
      entityType: 'BODY',
      entityId: character.originalBody.id,
      locationId: location.id,
      fromEventId: event.id,
      precision: 'EXACT_ROOM',
      certainty: 'CONFIRMED',
    },
  })
}

async function markDead(character, event) {
  const id = `ch416-${character.slug}-dead`
  await prisma.bodyState.updateMany({
    where: {
      bodyId: character.originalBody.id,
      untilEventId: null,
      id: { not: id },
    },
    data: { untilEventId: event.id },
  })
  await prisma.bodyState.upsert({
    where: { id },
    update: {
      bodyId: character.originalBody.id,
      state: 'DEAD',
      fromEventId: event.id,
      untilEventId: null,
    },
    create: {
      id,
      bodyId: character.originalBody.id,
      state: 'DEAD',
      fromEventId: event.id,
    },
  })
}

async function main() {
  const [camillaConfrontation, moswanaCurse, falseDeathPlan, room1004Breach, vipJail, room1004] =
    await Promise.all([
      requiredEvent('Benjamin confronts Camilla under special martial law'),
      requiredEvent('Moswana sacrifices herself and curses Benjamin'),
      requiredEvent('Tserriednich prepares Salkov to witness his false death'),
      requiredEvent('Benjamin breaches room 1004 and shoots Tserriednich'),
      requiredLocation('tier-1-vip-jail'),
      requiredLocation('tier-1-royal-residential-sector-room-1004'),
    ])

  const slugs = [
    'prince-benjamin',
    'prince-camilla',
    'prince-tserriednich',
    'furykov',
    'butch',
    'mozbe',
    'fukataki',
    'moswana',
    'salkov',
    'danjin',
  ]
  const characters = new Map(
    (await Promise.all(slugs.map(requiredCharacter))).map((character) => [
      character.slug,
      character,
    ]),
  )

  const participationGroups = [
    [
      camillaConfrontation,
      [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-camilla', 'ACTIVE'],
        ['furykov', 'OBSERVER'],
        ['butch', 'OBSERVER'],
        ['mozbe', 'OBSERVER'],
        ['fukataki', 'VICTIM'],
      ],
    ],
    [
      moswanaCurse,
      [
        ['moswana', 'ACTIVE'],
        ['prince-benjamin', 'VICTIM'],
        ['prince-camilla', 'OBSERVER'],
        ['furykov', 'OBSERVER'],
      ],
    ],
    [
      falseDeathPlan,
      [
        ['prince-tserriednich', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
      ],
    ],
    [
      room1004Breach,
      [
        ['prince-benjamin', 'ACTIVE'],
        ['prince-tserriednich', 'VICTIM'],
        ['furykov', 'ACTIVE'],
        ['butch', 'ACTIVE'],
        ['salkov', 'OBSERVER'],
        ['danjin', 'PASSIVE'],
      ],
    ],
  ]
  for (const [event, participants] of participationGroups) {
    for (const [slug, type] of participants)
      await upsertParticipation(event, characters.get(slug), type)
  }

  for (const event of [camillaConfrontation, moswanaCurse]) {
    await prisma.narrativeEvent.update({
      where: { id: event.id },
      data: { locationId: vipJail.id },
    })
  }
  for (const event of [falseDeathPlan, room1004Breach]) {
    await prisma.narrativeEvent.update({
      where: { id: event.id },
      data: { locationId: room1004.id },
    })
  }

  const detentionSlugs = [
    'prince-benjamin',
    'prince-camilla',
    'furykov',
    'butch',
    'mozbe',
    'fukataki',
  ]
  for (const slug of detentionSlugs) {
    const character = characters.get(slug)
    // A previous run of the chapter backfill may already have closed the
    // character's room-1001 presence at the later breach. Pull that boundary
    // back to the confrontation before inserting the intermediate room-1002
    // presence, otherwise the two rooms overlap for events 1–3.
    await prisma.presence.updateMany({
      where: {
        entityId: character.originalBody.id,
        untilEventId: room1004Breach.id,
        id: { notIn: [`ch416-presence-${slug}-vip-jail`, `ch416-presence-${slug}-room1004`] },
      },
      data: { untilEventId: camillaConfrontation.id },
    })
    // Remove the erroneous intermediate location produced by the first version
    // of this backfill, which treated Camilla's detention scene as room 1002.
    await prisma.presence.deleteMany({ where: { id: `ch416-presence-${slug}-room1002` } })
    await moveBody({
      id: `ch416-presence-${slug}-vip-jail`,
      character,
      location: vipJail,
      event: camillaConfrontation,
    })
  }
  const moswana = characters.get('moswana')
  await prisma.presence.deleteMany({ where: { id: 'ch416-presence-moswana-room1002' } })
  await moveBody({
    id: 'ch416-presence-moswana-vip-jail',
    character: moswana,
    location: vipJail,
    event: moswanaCurse,
  })
  for (const slug of ['prince-benjamin', 'furykov', 'butch']) {
    await moveBody({
      id: `ch416-presence-${slug}-room1004`,
      character: characters.get(slug),
      location: room1004,
      event: room1004Breach,
    })
  }
  for (const slug of ['prince-tserriednich', 'salkov', 'danjin']) {
    await moveBody({
      id: `ch416-presence-${slug}-room1004`,
      character: characters.get(slug),
      location: room1004,
      event: falseDeathPlan,
    })
  }

  await markDead(characters.get('fukataki'), camillaConfrontation)
  await markDead(characters.get('moswana'), moswanaCurse)

  console.log('Chapter 416 world state synchronized.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
