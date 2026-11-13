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

  let locations = $derived(
    ($page.data.locations || $page.data.worldState?.locations || []) as MapLocation[],
  )
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
  <aside class="location-panel" aria-label={$t.mapUi.locationDetails}>
    <button
      type="button"
      onclick={closePanel}
      class="close"
      aria-label={$t.mapUi.closeLocationDetails}
    >
      ✕
    </button>

    <h2>
      {locationDetails.name}
    </h2>
    <p class="context">
      {locationDetails.tier}{locationDetails.parent ? ` · ${locationDetails.parent}` : ''}
    </p>

    <section>
      <h3>
        {$t.mapUi.charactersHere}
      </h3>
      {#if locationDetails.presentCharacters.length > 0}
        <ul>
          {#each locationDetails.presentCharacters as character (character.id)}
            <li>
              <span class="person">
                <span class="dot"></span>
                {character.name}
              </span>
              <span class="certainty"
                >{($t.mapUi.certainty as Record<string, string>)[character.certainty] ||
                  $t.mapUi.certainty.UNKNOWN}</span
              >
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty">{$t.mapUi.noCharacterHere}</p>
      {/if}
    </section>

    {#if walkHref}
      <a href={walkHref} class="walk">
        {$t.mapUi.walkThere} →
      </a>
    {/if}

    <p class="source">
      {$t.mapUi.derivedFrom}
    </p>
  </aside>
{/if}

<style>
  .location-panel {
    position: absolute;
    z-index: 40;
    top: 0;
    right: 0;
    display: flex;
    width: 22rem;
    max-width: 100%;
    height: 100%;
    flex-direction: column;
    overflow-y: auto;
    border-left: 1px solid var(--accent-gold);
    padding: 1.5rem;
    background: var(--surface-panel);
    color: var(--text-primary);
    box-shadow: -1rem 0 2.5rem rgba(0, 0, 0, 0.45);
    overscroll-behavior: contain;
  }
  .close {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border: 0;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
  }
  .close:hover {
    color: var(--text-primary);
  }
  h2 {
    margin: 0 0 0.25rem;
    padding-right: 2rem;
    color: var(--accent-gold-bright);
    font-size: 1.15rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .context,
  .empty {
    margin: 0 0 1.5rem;
    color: var(--text-muted);
    font-size: 0.78rem;
  }
  h3 {
    margin: 0 0 0.5rem;
    border-bottom: 1px solid var(--line);
    padding-bottom: 0.35rem;
    color: var(--text-secondary);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  ul {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
  }
  .person {
    display: flex;
    align-items: center;
  }
  .dot {
    width: 0.45rem;
    height: 0.45rem;
    margin-right: 0.5rem;
    border-radius: 50%;
    background: var(--state-known);
  }
  .certainty {
    color: var(--text-faint);
    font: 0.52rem var(--font-mono);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .walk {
    display: block;
    margin-top: 1.5rem;
    border: 1px solid var(--line-strong);
    border-radius: 0.35rem;
    padding: 0.55rem;
    color: var(--accent-gold-bright);
    text-align: center;
    text-decoration: none;
    font: 0.62rem var(--font-mono);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .walk:hover {
    background: rgba(200, 169, 86, 0.1);
  }
  .source {
    margin: auto 0 0;
    padding-top: 2rem;
    color: var(--text-faint);
    font-size: 0.62rem;
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
