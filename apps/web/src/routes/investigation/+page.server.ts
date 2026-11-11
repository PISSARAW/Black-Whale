import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ cookies }) => ({
  spoilerLimit: readSpoilerLimit(cookies) ?? null,
})
