import type { PageServerLoad } from './$types'
import { getPrisma } from '$lib/server/db'

export const load: PageServerLoad = async () => {
  const prisma = await getPrisma()

  const chapters = await prisma.chapter.findMany({
    orderBy: { number: 'asc' },
    include: {
      events: {
        orderBy: { sequence: 'asc' },
      },
    },
  })

  return {
    chapters,
  }
}
