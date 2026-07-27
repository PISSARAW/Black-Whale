<script lang="ts">
  import { page } from '$app/stores'
  import { mapState } from '$lib/state/mapState.svelte'
  import { toEnglishDisplayName } from '$lib/utils/displayNames'

  let unknownCharacters = $derived.by(() => {
    const worldState = $page.data.worldState
    const locations = new Map<string, any>(
      (worldState?.locations || []).map((location: any) => [location.id, location]),
    )
    const bodies = worldState?.bodies || []
    const characters = worldState?.characters || []

    return (worldState?.presences || [])
      .filter((presence: any) => {
        const location = presence.locationId ? locations.get(presence.locationId) : null
        return !location || location.type === 'UNKNOWN'
      })
      .map((presence: any) => {
        const body = bodies.find((candidate: any) => candidate.id === presence.entityId)
        const character = body
          ? characters.find((candidate: any) => candidate.id === body.originalCharacterId)
          : null

        return {
          id: presence.entityId,
          label: character
            ? toEnglishDisplayName(character.canonicalName)
            : 'Unidentified individual',
          state: character ? 'known identity' : 'unknown identity',
        }
      })
  })

  let identifiedCount = $derived(
    unknownCharacters.filter((character: any) => character.state === 'known identity').length,
  )
</script>

{#if mapState.filters.showUnknownPositions}
  <div
    class="absolute bottom-4 left-4 z-40 flex max-h-[min(38rem,calc(100%-2rem))] w-80 flex-col rounded-lg border border-gray-700 bg-[#1a1a1a] p-4 text-[#FFFFF0] shadow-lg"
  >
    <div class="mb-3 flex items-center justify-between border-b border-gray-700 pb-2">
      <h3 class="text-sm font-bold tracking-wider text-gray-400 uppercase">Unknown location</h3>
      <button
        type="button"
        onclick={() => (mapState.filters.showUnknownPositions = false)}
        class="text-gray-500 hover:text-white"
        aria-label="Close unknown positions">✕</button
      >
    </div>

    <div class="mb-3 space-y-1 rounded border border-gray-700 bg-[#121212] p-2 text-xs">
      <p>{unknownCharacters.length} bodies without a mapped location</p>
      <p>{identifiedCount} identified · {unknownCharacters.length - identifiedCount} unknown</p>
    </div>

    {#if unknownCharacters.length > 0}
      <ul class="min-h-0 space-y-2 overflow-y-auto pr-1 text-sm">
        {#each unknownCharacters as character (character.id)}
          <li class="flex items-center text-gray-300">
            <span class="mr-2 h-2 w-2 rounded-full bg-gray-500"></span>
            <span>{character.label}</span>
            <span class="ml-2 text-xs text-gray-500">{character.state}</span>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-gray-400">Every tracked body has a mapped location at this event.</p>
    {/if}
  </div>
{/if}
