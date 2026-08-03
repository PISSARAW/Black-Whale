import { loadAbilityVisibility } from '$lib/server/ability-visibility'
import { nenRuntime } from '$lib/server/nen'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
  // The catalogue is bundled data, not a query: nothing can fail here, so the
  // hand-written three-ability fallback this route used to carry is gone. In
  // production the API host it called never existed, so that stale list was
  // the only thing the page had ever shown.
  const spoilerLimit = readSpoilerLimit(cookies)
  const visibility = await loadAbilityVisibility()

  // Applied here rather than in the page: the page enumerated the client-side
  // registry, so every technique in the archive reached the browser whatever
  // the reader's cap said. The catalogue is the list now.
  const abilities = nenRuntime
    .listAbilities()
    .filter((ability) => visibility.isVisible(ability.id, spoilerLimit))

  return { abilities, spoilerLimit: spoilerLimit ?? null }
}
