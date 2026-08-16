<script lang="ts">
  import { page } from '$app/stores'
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
   * The same room, on foot.
   *
   * `/tour` reads the blueprint and nothing else — no passenger, no chapter, no
   * spoiler cap — and this does not change that: it is an outgoing link, so the
   * walk learns nothing from the map by being linked to. The reconstruction has
   * a space for every room the catalogue puts aboard, which is what makes the
   * offer honest rather than a dead end.
   */
  let walkTo = $derived.by(() => {
    const slug = resolveRegionLocationSlug(mapState.selectedLocationId)
    // The loader answers this: reading it here would have meant the whole
    // blueprint in the browser for one id. See `lib/tour/walkTargets.ts`.
    return slug ? ($page.data.walkTargets?.[slug] ?? null) : null
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

    {#if walkTo}
      <a
        href={`${$link('/tour')}?space=${walkTo}`}
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
