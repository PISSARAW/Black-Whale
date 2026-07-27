import { getPrisma } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma()
  const facts = await prisma.fact.findMany({
    orderBy: { id: 'asc' },
  })

  const characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
  })

  const locations = await prisma.location.findMany({
    orderBy: { name: 'asc' },
  })

  const events = await prisma.narrativeEvent.findMany({
    orderBy: { sequence: 'asc' },
  })

  return {
    facts: facts as any[],
    characters: characters as any[],
    locations: locations as any[],
    events: events as any[],
  }
}
