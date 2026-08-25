import { getPrisma } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
  const prisma = await getPrisma()
  // Cookie values are client-controlled; reject anything that is not a plain
  // non-negative integer rather than letting NaN reach the Prisma clause.
  const parsed = Number.parseInt(cookies.get('adminSpoilerLimit') ?? '', 10)
  const spoilerLimit = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null

  const whereClause = spoilerLimit
    ? {
        chapter: { number: { lte: spoilerLimit } },
      }
    : {}

  const events = await prisma.narrativeEvent.findMany({
    where: whereClause,
    include: {
      chapter: true,
      presencesFrom: {
        include: { body: { include: { character: true } }, location: true },
      },
      presencesUntil: {
        include: { body: { include: { character: true } }, location: true },
      },
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
  })

  return { events }
}
