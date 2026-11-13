import { localizedLoad } from '$lib/server/localized-load'
import { loadAbilityVisibility } from '$lib/server/ability-visibility'
import { nenRuntime } from '$lib/server/nen'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { readDataFile } from '$lib/server/data-files'
import type { PageServerLoad } from './$types'
import abilityUses from '../../../../../data/abilities/uses.json'
import { ABILITY_PRESENTATIONS } from '$lib/nen/abilityPresentations.gen'

export const load: PageServerLoad = localizedLoad(
  async ({ cookies }: Parameters<PageServerLoad>[0]) => {
    // The catalogue is bundled data, not a query: nothing can fail here, so the
    // hand-written three-ability fallback this route used to carry is gone. In
    // production the API host it called never existed, so that stale list was
    // the only thing the page had ever shown.
    const spoilerLimit = readSpoilerLimit(cookies)
    const visibility = await loadAbilityVisibility()
    const catalogue = await readDataFile<Array<{ id: string; modifiedAt: string }>>(
      'abilities/abilities.json',
    )

    // Applied here rather than in the page: the page enumerated the client-side
    // registry, so every technique in the archive reached the browser whatever
    // the reader's cap said. The catalogue is the list now.
    const abilities = nenRuntime
      .listAbilities()
      .filter((ability) => visibility.isVisible(ability.id, spoilerLimit))
      .map((ability) => ({
        ...ability,
        sources: [
          ...new Set(
            abilityUses
              .filter(
                (use) =>
                  use.abilityId === ability.id &&
                  (spoilerLimit === undefined || use.chapter <= spoilerLimit),
              )
              .map((use) => use.chapter),
          ),
        ].sort((left, right) => left - right),
      }))
    const visibleIds = new Set(abilities.map(({ id }) => id))
    const presentations = ABILITY_PRESENTATIONS.filter(({ abilityId }) =>
      visibleIds.has(abilityId),
    ).map((presentation) => ({
      ...presentation,
      actions: presentation.actions.filter(({ entry }) => {
        const source = entry.source
        return (
          spoilerLimit === undefined || source?.kind !== 'chapter' || source.chapter <= spoilerLimit
        )
      }),
    }))

    return {
      abilities,
      presentations,
      spoilerLimit: spoilerLimit ?? null,
      modifiedAt: catalogue.reduce(
        (latest, ability) => (ability.modifiedAt > latest ? ability.modifiedAt : latest),
        '1970-01-01',
      ),
    }
  },
)
