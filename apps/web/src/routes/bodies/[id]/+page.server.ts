import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/db'
import { bodyRowInclude, buildBodyRecord } from '$lib/server/identity-records'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const row = await prisma.body.findUnique({ where: { id: params.id }, include: bodyRowInclude })
  const record = row ? buildBodyRecord(row, readSpoilerLimit(cookies) ?? null) : null

  // A body the reader's cap hides is reported missing rather than withheld: the
  // archive answering "exists, come back later" is itself the spoiler.
  if (!record) throw error(404, 'Body not found')

  return { record }
}
