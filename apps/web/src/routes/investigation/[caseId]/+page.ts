import { error } from '@sveltejs/kit'
import { caseById } from '$lib/investigation/catalog'
import type { PageLoad } from './$types'

export const load: PageLoad = ({ params }) => {
  if (!caseById(params.caseId, 'fr')) error(404, 'Investigation case not found')
  return { caseId: params.caseId }
}
