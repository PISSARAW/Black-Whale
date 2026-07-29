<script lang="ts">
  import { page } from '$app/stores'
  import { mapState } from '$lib/state/mapState.svelte'
  import { displayName } from '$lib/utils/displayNames'
  import { locale, t } from '$lib/i18n'
  import { resolveRegionLocationSlug } from '$lib/map/mapAssetRegistry'

  let locations = $derived($page.data.worldState?.locations || [])
  let presences = $derived($page.data.worldState?.presences || [])
  let bodies = $derived($page.data.worldState?.bodies || [])
  let characters = $derived($page.data.worldState?.characters || [])

  function matchesSlug(slug: string | undefined, target: string) {
    return slug === target || Boolean(slug?.endsWith(`-${target}`))
  }

  function belongsToLocation(location: any, targetSlug: string, byId: Map<string, any>) {
    let current = location
    let depth = 0

    while (current && depth < 8) {
      if (matchesSlug(current.slug, targetSlug)) return true
      current = current.parentLocationId ? byId.get(current.parentLocationId) : null
      depth += 1
    }

    return false
  }

  let locationDetails = $derived.by(() => {
    const targetSlug = resolveRegionLocationSlug(mapState.selectedLocationId)
    if (!targetSlug) return null

    const byId = new Map<string, any>(locations.map((location: any) => [location.id, location]))
    const location = locations.find((candidate: any) => matchesSlug(candidate.slug, targetSlug))
    if (!location) return null

    let tier = location
    while (tier?.parentLocationId && tier.type !== 'TIER') tier = byId.get(tier.parentLocationId)

    const presentCharacters = presences.flatMap((presence: any) => {
      const presenceLocation = byId.get(presence.locationId)
      if (!presenceLocation || !belongsToLocation(presenceLocation, targetSlug, byId)) return []

      const body = bodies.find((candidate: any) => candidate.id === presence.entityId)
      const character = body
        ? characters.find((candidate: any) => candidate.id === body.originalCharacterId)
        : null

      return character
        ? [
            {
              id: character.id,
              name: displayName(character.canonicalName, $locale),
              certainty: presence.certainty,
            },
          ]
        : []
    })

    return {
      name: location.name,
      tier: tier?.name || 'Black Whale',
      parent: location.parentLocationId ? byId.get(location.parentLocationId)?.name : null,
      presentCharacters,
    }
  })

  function closePanel() {
    mapState.selectLocation(null)
  }
</script>

{#if mapState.selectedLocationId && locationDetails}
  <aside
    class="absolute top-0 right-0 z-40 flex h-full w-[22rem] flex-col overflow-y-auto border-l border-[#FFD700] bg-[#1a1a1a] p-6 text-[#FFFFF0] shadow-2xl"
    aria-label={$t.mapUi.locationDetails}
  >
    <button
      type="button"
      onclick={closePanel}
      class="absolute top-4 right-4 text-gray-400 hover:text-white"
      aria-label={$t.mapUi.closeLocationDetails}
    >
      ✕
    </button>

    <h2 class="mb-1 text-xl font-bold tracking-wider text-[#FFD700] uppercase">
      {locationDetails.name}
    </h2>
    <p class="mb-6 text-sm text-gray-400">
      {locationDetails.tier}{locationDetails.parent ? ` · ${locationDetails.parent}` : ''}
    </p>

    <section>
      <h3 class="mb-2 border-b border-gray-700 pb-1 text-sm font-semibold tracking-wider uppercase">
        {$t.mapUi.charactersHere}
      </h3>
      {#if locationDetails.presentCharacters.length > 0}
        <ul class="space-y-2 text-sm text-gray-300">
          {#each locationDetails.presentCharacters as character (character.id)}
            <li class="flex items-center justify-between gap-3">
              <span class="flex items-center">
                <span class="mr-2 h-2 w-2 rounded-full bg-emerald-400"></span>
                {character.name}
              </span>
              <span class="text-[10px] tracking-wide text-gray-500 uppercase"
                >{(character.certainty || 'UNKNOWN').replaceAll('_', ' ')}</span
              >
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-sm text-gray-400">{$t.mapUi.noCharacterHere}</p>
      {/if}
    </section>

    <p class="mt-auto pt-8 text-xs text-gray-500">
      {$t.mapUi.derivedFrom}
    </p>
  </aside>
{/if}
