import { localizedLoad } from '$lib/server/localized-load'
import { error } from '@sveltejs/kit'
import { findCharacterRef } from '$lib/server/character-lookup'
import { loadKnowledgeMap } from '$lib/server/knowledge-map'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = localizedLoad(
  async ({ params, cookies }: Parameters<PageServerLoad>[0]) => {
    const spoilerLimit = readSpoilerLimit(cookies) ?? null
    const character = await findCharacterRef(params.character, spoilerLimit)

    if (!character) throw error(404, 'Character not found')

    const map = await loadKnowledgeMap(character.id, character.canonicalName, spoilerLimit)

    return { character, entries: map.entries, edges: map.edges, spoilerLimit }
  },
)
