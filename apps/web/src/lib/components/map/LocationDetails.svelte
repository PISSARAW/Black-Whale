<script lang="ts">
  import { page } from '$app/stores'
  import { SvelteURLSearchParams } from 'svelte/reactivity'
  import { mapState } from '$lib/state/mapState.svelte'
  import { displayName } from '$lib/utils/displayNames'
  import { link, locale, t } from '$lib/i18n'
  import { resolveRegionLocationSlug } from '$lib/map/mapAssetRegistry'

  interface MapLocation {
    id: string
    slug: string
    name: string
    type: string
    parentLocationId: string | null
  }
  interface MapPresence {
    entityId: string
    locationId: string | null
    certainty: string
  }
  interface MapBody {
    id: string
    originalCharacterId: string | null
  }
  interface MapCharacter {
    id: string
    canonicalName: string
  }

  let locations = $derived(($page.data.worldState?.locations || []) as MapLocation[])
  let presences = $derived(($page.data.worldState?.presences || []) as MapPresence[])
  let bodies = $derived(($page.data.worldState?.bodies || []) as MapBody[])
  let characters = $derived(($page.data.worldState?.characters || []) as MapCharacter[])

  function matchesSlug(slug: string | undefined, target: string) {
    return slug === target || Boolean(slug?.endsWith(`-${target}`))
  }

  function belongsToLocation(
    location: MapLocation,
    targetSlug: string,
    byId: Map<string, MapLocation>,
  ) {
    let current: MapLocation | null | undefined = location
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

    const byId = new Map(locations.map((location) => [location.id, location]))
    const location = locations.find((candidate) => matchesSlug(candidate.slug, targetSlug))
    if (!location) return null

    let tier: MapLocation | null | undefined = location
    while (tier?.parentLocationId && tier.type !== 'TIER') tier = byId.get(tier.parentLocationId)

    const presentCharacters = presences.flatMap((presence) => {
      const presenceLocation = presence.locationId ? byId.get(presence.locationId) : undefined
      if (!presenceLocation || !belongsToLocation(presenceLocation, targetSlug, byId)) return []

      const body = bodies.find((candidate) => candidate.id === presence.entityId)
      const character = body
        ? characters.find((candidate) => candidate.id === body.originalCharacterId)
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

  /**
   * The same room, on foot, at the same event. Use the loader's resolved event
   * id so default selections and legacy sequence links also keep their cast
   * and voyage hour when the visitor leaves the map.
   */
  let walkHref = $derived.by(() => {
    const slug = resolveRegionLocationSlug(mapState.selectedLocationId)
    // The loader answers this: reading it here would have meant the whole
    // blueprint in the browser for one id. See `lib/tour/walkTargets.ts`.
    const space = slug ? ($page.data.walkTargets?.[slug] ?? null) : null
    if (!space) return null
    const params = new SvelteURLSearchParams({ space })
    if ($page.data.selectedEventId) params.set('eventId', $page.data.selectedEventId)
    return `${$link('/tour')}?${params}`
  })

  function closePanel() {
    mapState.selectLocation(null)
  }
</script>

{#if mapState.selectedLocationId && locationDetails}
  <aside
    class="location-panel absolute top-0 right-0 z-40 flex h-full w-[22rem] flex-col overflow-y-auto border-l border-[#FFD700] bg-[#1a1a1a] p-6 text-[#FFFFF0] shadow-2xl"
    aria-label={$t.mapUi.locationDetails}
  >
    <button
      type="button"
      onclick={closePanel}
      class="absolute top-2 right-2 grid h-11 w-11 place-items-center text-gray-400 hover:text-white"
      aria-label={$t.mapUi.closeLocationDetails}
    >
      ✕
    </button>

    <h2 class="mb-1 pr-8 text-xl font-bold tracking-wider text-[#FFD700] uppercase">
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

    {#if walkHref}
      <a
        href={walkHref}
        class="mt-6 inline-block rounded border border-[#FFD700]/60 px-3 py-1.5 text-center text-xs tracking-wider text-[#FFD700] uppercase transition-colors hover:bg-[#FFD700]/10"
      >
        {$t.mapUi.walkThere} →
      </a>
    {/if}

    <p class="mt-auto pt-8 text-xs text-gray-500">
      {$t.mapUi.derivedFrom}
    </p>
  </aside>
{/if}

<style>
  .location-panel {
    max-width: 100%;
    overscroll-behavior: contain;
  }
  @media (max-width: 600px) {
    .location-panel {
      top: auto;
      bottom: 0;
      width: 100%;
      height: 58%;
      padding: 1rem;
      border-top: 1px solid var(--accent-gold);
      border-left: 0;
    }
    .location-panel h2 {
      font-size: 1rem;
    }
  }
</style>
