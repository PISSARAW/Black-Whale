import { error } from '@sveltejs/kit'
import { findCharacterRef } from '$lib/server/character-lookup'
import { loadKnowledgeMap } from '$lib/server/knowledge-map'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { buildSubjectiveView, listCursorEvents } from '$lib/server/subjective-view'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, cookies, url }) => {
  const spoilerLimit = readSpoilerLimit(cookies) ?? null
  const character = await findCharacterRef(params.character, spoilerLimit)

  if (!character) throw error(404, 'Character not found')

  const [view, events, knowledge] = await Promise.all([
    buildSubjectiveView(character.id, url.searchParams.get('eventId'), spoilerLimit),
    listCursorEvents(spoilerLimit),
    loadKnowledgeMap(character.id, character.canonicalName, spoilerLimit),
  ])

  return {
    character,
    view,
    events,
    // What the observer holds at the cursor — rows that open later are theirs to
    // learn, not theirs to know here.
    knowledge: view
      ? knowledge.entries.filter((entry) => entry.fromChapter <= view.cursor.chapter)
      : [],
    spoilerLimit,
  }
}
