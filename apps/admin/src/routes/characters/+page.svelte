<script lang="ts">
  import type { PageData } from './$types'
  import CanonSource from '$lib/components/CanonSource.svelte'

  let { data }: { data: PageData } = $props()

  let searchQuery = $state('')
  let filteredCharacters = $derived(
    data.characters.filter(
      (char) =>
        char.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (char.aliases &&
          char.aliases.some((alias: string) =>
            alias.toLowerCase().includes(searchQuery.toLowerCase()),
          )),
    ),
  )
</script>

<svelte:head><title>Characters — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Characters</h1>
<p class="text-gray-500 mb-2">{data.characters.length} total characters</p>
<CanonSource file="data/characters/characters.json" />

<div class="flex justify-between items-center mb-6 gap-4">
  <div class="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search characters..."
      bind:value={searchQuery}
      class="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
    />
    <svg
      class="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  </div>
</div>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <table class="w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Slug</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Importance</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Modeling Level</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Aliases</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">First Visible</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if filteredCharacters.length === 0}
        <tr>
          <td colspan="7" class="px-4 py-6 text-center text-gray-400">No characters found</td>
        </tr>
      {:else}
        {#each filteredCharacters as character (character.id)}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{character.canonicalName}</td>
            <td class="px-4 py-3 text-gray-600">{character.slug}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium
                {character.narrativeImportance === 'PRIMARY'
                  ? 'bg-purple-100 text-purple-700'
                  : character.narrativeImportance === 'SECONDARY'
                    ? 'bg-blue-100 text-blue-700'
                    : character.narrativeImportance === 'MINOR'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-orange-100 text-orange-700'}
              "
              >
                {character.narrativeImportance}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{character.modelingLevel}</td>
            <td class="px-4 py-3 text-gray-600">
              {#if character.aliases && character.aliases.length > 0}
                {character.aliases.join(', ')}
              {:else}
                -
              {/if}
            </td>
            <td class="px-4 py-3 text-gray-600"
              >{character.firstVisibleEventId.substring(0, 8)}...</td
            >
            <td class="px-4 py-3">
              <a href="/characters/{character.slug}" class="text-blue-600 hover:text-blue-800"
                >View</a
              >
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
