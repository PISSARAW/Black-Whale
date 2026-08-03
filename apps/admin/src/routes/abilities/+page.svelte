<script lang="ts">
  import type { PageData } from './$types'
  import CanonSource from '$lib/components/CanonSource.svelte'

  let { data }: { data: PageData } = $props()

  let searchQuery = $state('')
  let filteredAbilities = $derived(
    data.abilities.filter(
      (ability) =>
        ability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ability.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ability.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  let characters = $derived(data.characters || [])

  function getOwnerName(ownerId: string): string {
    const character = characters.find((c) => c.id === ownerId)
    return character ? character.canonicalName : 'Unknown'
  }
</script>

<svelte:head><title>Abilities — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Nen Abilities</h1>
<p class="text-gray-500 mb-2">{data.abilities.length} total abilities</p>
<CanonSource file="data/abilities/abilities.json" />

<div class="flex justify-between items-center mb-6 gap-4">
  <div class="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search abilities..."
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
        <th class="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Owner</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Canon Status</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Module Key</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if filteredAbilities.length === 0}
        <tr>
          <td colspan="7" class="px-4 py-6 text-center text-gray-400">No abilities found</td>
        </tr>
      {:else}
        {#each filteredAbilities as ability (ability.id)}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{ability.name}</td>
            <td class="px-4 py-3 text-gray-600">{ability.id}</td>
            <td class="px-4 py-3 text-gray-600">{getOwnerName(ability.ownerId)}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
              >
                {ability.category}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium
                {ability.canonStatus === 'CANON'
                  ? 'bg-green-100 text-green-700'
                  : ability.canonStatus === 'SEMI_CANON'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'}
              "
              >
                {ability.canonStatus}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{ability.moduleKey || '-'}</td>
            <td class="px-4 py-3">
              <a href="/abilities/{ability.id}" class="text-blue-600 hover:text-blue-800">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .bw-gold {
    color: #ffd700;
  }
</style>
