<script lang="ts">
  import type { PageData } from './$types'
  import CanonSource from '$lib/components/CanonSource.svelte'

  let { data }: { data: PageData } = $props()

  let searchQuery = $state('')
  let filteredFacts = $derived(
    data.facts.filter(
      (fact) =>
        fact.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fact.predicate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(fact.value).toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  const subjectTypeOptions = [
    { value: 'CHARACTER', label: 'Character' },
    { value: 'BODY', label: 'Body' },
    { value: 'CONSCIOUSNESS', label: 'Consciousness' },
    { value: 'LOCATION', label: 'Location' },
    { value: 'EVENT', label: 'Event' },
    { value: 'ABILITY', label: 'Ability' },
    { value: 'AFFILIATION', label: 'Affiliation' },
    { value: 'COHORT', label: 'Cohort' },
  ]

  let events = $derived(data.events || [])
  let characters = $derived(data.characters || [])
  let locations = $derived(data.locations || [])

  function getSubjectName(subjectType: string, subjectId: string): string {
    if (subjectType === 'CHARACTER') {
      const character = characters.find((c) => c.id === subjectId)
      return character ? character.canonicalName : 'Unknown'
    }
    if (subjectType === 'LOCATION') {
      const location = locations.find((l) => l.id === subjectId)
      return location ? location.name : 'Unknown'
    }
    if (subjectType === 'EVENT') {
      const event = events.find((e) => e.id === subjectId)
      return event ? event.title : 'Unknown'
    }
    return subjectId
  }

  function getSubjectTypeLabel(subjectType: string): string {
    const option = subjectTypeOptions.find((o) => o.value === subjectType)
    return option ? option.label : subjectType
  }
</script>

<svelte:head><title>Facts — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Facts</h1>
<p class="text-gray-500 mb-2">{data.facts.length} total facts</p>
<CanonSource file="data/ via prisma/seed.ts" />

<div class="flex justify-between items-center mb-6 gap-4">
  <div class="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search facts..."
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
        <th class="px-4 py-3 text-left font-semibold text-gray-700">ID</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Subject Type</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Predicate</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Value</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Truth Status</th>
        <th class="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#if filteredFacts.length === 0}
        <tr>
          <td colspan="7" class="px-4 py-6 text-center text-gray-400">No facts found</td>
        </tr>
      {:else}
        {#each filteredFacts as fact (fact.id)}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-600">{fact.id}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {getSubjectTypeLabel(fact.subjectType)}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600"
              >{getSubjectName(fact.subjectType, fact.subjectId)}</td
            >
            <td class="px-4 py-3 text-gray-600">{fact.predicate}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs truncate">{JSON.stringify(fact.value)}</td>
            <td class="px-4 py-3">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium
                {fact.truthStatus === 'CONFIRMED'
                  ? 'bg-green-100 text-green-700'
                  : fact.truthStatus === 'STRONGLY_IMPLIED'
                    ? 'bg-blue-100 text-blue-700'
                    : fact.truthStatus === 'DEDUCTION'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'}
              "
              >
                {fact.truthStatus}
              </span>
            </td>
            <td class="px-4 py-3">
              <a href="/facts/{fact.id}" class="text-blue-600 hover:text-blue-800">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>
