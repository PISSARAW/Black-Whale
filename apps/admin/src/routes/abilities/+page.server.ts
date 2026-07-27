import type { PageServerLoad } from './$types'
import { getPrisma } from '$lib/server/db'

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma()

  const abilities = await prisma.nenAbility.findMany({
    orderBy: { name: 'asc' },
  })

  const characters = await prisma.character.findMany({
    orderBy: { canonicalName: 'asc' },
  })

  return {
    abilities: abilities as any[],
    characters: characters as any[],
  }
}
