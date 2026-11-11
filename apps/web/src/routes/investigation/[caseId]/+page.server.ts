import { error } from '@sveltejs/kit'
import { caseById, caseVisibleAtChapter } from '$lib/investigation/catalog'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ params, cookies }) => {
  const definition = caseById(params.caseId, 'fr')
  if (!definition) error(404, 'Investigation case not found')

  const spoilerLimit = readSpoilerLimit(cookies)
  if (!caseVisibleAtChapter(definition.metadata, spoilerLimit)) {
    error(404, 'Investigation case not found')
  }

  return { caseId: params.caseId, spoilerLimit: spoilerLimit ?? null }
}
