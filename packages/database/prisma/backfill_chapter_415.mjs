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
  const id = `ch415-participation-${event.sequence}-${character.slug}`
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

async function moveBody({ id, character, location, event, precision }) {
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
      precision,
      certainty: 'CONFIRMED',
    },
    create: {
      id,
      entityType: 'BODY',
      entityId: character.originalBody.id,
      locationId: location.id,
      fromEventId: event.id,
      precision,
      certainty: 'CONFIRMED',
    },
  })
}

async function markKanjidolInjured(kanjidol, event) {
  await prisma.bodyState.updateMany({
    where: {
      bodyId: kanjidol.originalBody.id,
      untilEventId: null,
      id: { not: 'ch415-kanjidol-injured' },
    },
    data: { untilEventId: event.id },
  })
  await prisma.bodyState.upsert({
    where: { id: 'ch415-kanjidol-injured' },
    update: {
      bodyId: kanjidol.originalBody.id,
      state: 'INJURED',
      fromEventId: event.id,
      untilEventId: null,
    },
    create: {
      id: 'ch415-kanjidol-injured',
      bodyId: kanjidol.originalBody.id,
      state: 'INJURED',
      fromEventId: event.id,
    },
  })
}

async function main() {
  const [
    flashback,
    message,
    camps,
    detention,
    room1003,
    room1004,
    room1005,
    room1006,
    room1011,
    room1013,
    room1014,
    royalSector,
  ] = await Promise.all([
    requiredEvent('Furykov confronts Beyond about his sacrificial curse'),
    requiredEvent('Kurapika and Oito prepare a message for the mainland'),
    requiredEvent('The royal camps respond to special martial law'),
    requiredEvent('Ridge subdues Kanjidol during martial law'),
    requiredLocation('tier-1-royal-residential-sector-room-1003'),
    requiredLocation('tier-1-royal-residential-sector-room-1004'),
    requiredLocation('tier-1-royal-residential-sector-room-1005'),
    requiredLocation('tier-1-royal-residential-sector-room-1006'),
    requiredLocation('tier-1-royal-residential-sector-room-1011'),
    requiredLocation('tier-1-royal-residential-sector-room-1013'),
    requiredLocation('tier-1-royal-residential-sector-room-1014'),
    requiredLocation('tier-1-royal-residential-sector'),
  ])

  const slugs = [
    'furykov',
    'beyond-netero',
    'kurapika',
    'queen-oito',
    'bill',
    'babimyna',
    'prince-zhanglei',
    'coventoba',
    'prince-tubeppa',
    'maor',
    'rihan',
    'theta',
    'salkov',
    'prince-tyson',
    'prince-fugetsu',
    'biscuit-krueger',
    'vergei',
    'prince-marayam',
    'ridge',
    'kanjidol',
  ]
  const characters = new Map(
    (await Promise.all(slugs.map(requiredCharacter))).map((character) => [
      character.slug,
      character,
    ]),
  )

  const participationGroups = [
    [
      flashback,
      [
        ['furykov', 'ACTIVE'],
        ['beyond-netero', 'ACTIVE'],
      ],
    ],
    [
      message,
      [
        ['kurapika', 'ACTIVE'],
        ['queen-oito', 'ACTIVE'],
        ['bill', 'PASSIVE'],
        ['babimyna', 'OBSERVER'],
      ],
    ],
    [
      camps,
      [
        ['prince-zhanglei', 'PASSIVE'],
        ['coventoba', 'OBSERVER'],
        ['prince-tubeppa', 'PASSIVE'],
        ['maor', 'OBSERVER'],
        ['rihan', 'OBSERVER'],
        ['theta', 'OBSERVER'],
        ['salkov', 'OBSERVER'],
        ['prince-tyson', 'PASSIVE'],
        ['prince-fugetsu', 'PASSIVE'],
        ['biscuit-krueger', 'OBSERVER'],
        ['vergei', 'OBSERVER'],
        ['prince-marayam', 'PASSIVE'],
      ],
    ],
    [
      detention,
      [
        ['ridge', 'ACTIVE'],
        ['kanjidol', 'VICTIM'],
      ],
    ],
  ]
  for (const [event, participants] of participationGroups) {
    for (const [slug, type] of participants)
      await upsertParticipation(event, characters.get(slug), type)
  }

  await prisma.narrativeEvent.update({
    where: { id: message.id },
    data: { locationId: room1014.id },
  })
  await prisma.narrativeEvent.update({
    where: { id: camps.id },
    data: { locationId: royalSector.id },
  })
  await prisma.narrativeEvent.update({
    where: { id: detention.id },
    data: { locationId: royalSector.id },
  })

  for (const slug of ['kurapika', 'queen-oito', 'bill', 'babimyna']) {
    await moveBody({
      id: `ch415-presence-${slug}-room1014`,
      character: characters.get(slug),
      location: room1014,
      event: message,
      precision: 'EXACT_ROOM',
    })
  }
  const campRooms = [
    [room1003, ['prince-zhanglei', 'coventoba']],
    [room1004, ['theta', 'salkov']],
    [room1005, ['prince-tubeppa', 'maor', 'rihan']],
    [room1006, ['prince-tyson']],
    [room1011, ['prince-fugetsu']],
    [room1013, ['biscuit-krueger', 'vergei', 'prince-marayam']],
  ]
  for (const [location, roomSlugs] of campRooms) {
    for (const slug of roomSlugs) {
      await moveBody({
        id: `ch415-presence-${slug}-${location.slug}`,
        character: characters.get(slug),
        location,
        event: camps,
        precision: 'EXACT_ROOM',
      })
    }
  }
  for (const slug of ['ridge', 'kanjidol']) {
    await moveBody({
      id: `ch415-presence-${slug}-royal-sector`,
      character: characters.get(slug),
      location: royalSector,
      event: detention,
      precision: 'ZONE',
    })
  }
  await markKanjidolInjured(characters.get('kanjidol'), detention)

  console.log('Chapter 415 world state synchronized.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
