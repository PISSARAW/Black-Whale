import { getPrisma } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma()
  const characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
  })

  const events = await prisma.narrativeEvent.findMany({
    orderBy: { sequence: 'asc' },
  })

  return {
    characters: characters as any[],
    events: events as any[],
  }
}
