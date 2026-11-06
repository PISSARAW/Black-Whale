import { localizedLoad } from '$lib/server/localized-load'
import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/db'
import { buildConsciousnessRecord, consciousnessRowInclude } from '$lib/server/identity-records'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = localizedLoad(
  async ({ params, cookies }: Parameters<PageServerLoad>[0]) => {
    const row = await prisma.consciousness.findUnique({
      where: { id: params.id },
      include: consciousnessRowInclude,
    })
    const record = row ? buildConsciousnessRecord(row, readSpoilerLimit(cookies) ?? null) : null

    if (!record) throw error(404, 'Consciousness not found')

    return { record }
  },
)
