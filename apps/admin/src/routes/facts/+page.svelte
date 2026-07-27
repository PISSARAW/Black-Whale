<script lang="ts">
  import type { PageData } from './$types'
  import { enhance } from '$app/forms'

  let { data }: { data: PageData } = $props()

  let searchQuery = $state('')
  let showCreateModal = $state(false)
  let jsonPlaceholder = '{"key": "value"}'

  let newFact = $state({
    id: '',
    subjectType: 'CHARACTER' as const,
    subjectId: '',
    predicate: '',
    value: {} as Record<string, any>,
    valueJson: '{}',
    validFromEventId: '',
    validUntilEventId: null as string | null,
    truthStatus: 'CONFIRMED' as const,
    firstVisibleEventId: '',
  })

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

  const truthStatusOptions = [
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'STRONGLY_IMPLIED', label: 'Strongly Implied' },
    { value: 'DEDUCED', label: 'Deduction' },
    { value: 'CONTESTED', label: 'Contested' },
  ]

  function openCreateModal() {
    showCreateModal = true
  }

  function closeCreateModal() {
    showCreateModal = false
    newFact = {
      id: '',
      subjectType: 'CHARACTER',
      subjectId: '',
      predicate: '',
      value: {},
      valueJson: '{}',
      validFromEventId: '',
      validUntilEventId: null,
      truthStatus: 'CONFIRMED',
      firstVisibleEventId: '',
    }
  }

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

  function handleOverlayClick(e: any) {
    if (e.target === e.currentTarget) {
      closeCreateModal()
    }
  }
</script>

<svelte:head><title>Facts — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Facts</h1>
<p class="text-gray-500 mb-6">{data.facts.length} total facts</p>

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
  <button
    onclick={openCreateModal}
    class="bg-bw-gold text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
  >
    + Add Fact
  </button>
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
                    : fact.truthStatus === 'DEDUCED'
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

{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={handleOverlayClick}
  >
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
      <h2 class="text-xl font-bold text-bw-gold mb-4">Create New Fact</h2>

      <form method="POST" use:enhance class="space-y-4" onsubmit={closeCreateModal}>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">ID *</label>
          <input
            type="text"
            bind:value={newFact.id}
            name="id"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Subject Type</label>
          <select
            bind:value={newFact.subjectType}
            name="subjectType"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            {#each subjectTypeOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Subject ID *</label>
          <select
            bind:value={newFact.subjectId}
            name="subjectId"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">Select a subject...</option>
            {#if newFact.subjectType === 'CHARACTER'}
              {#each characters as character (character.id)}
                <option value={character.id}>{character.canonicalName}</option>
              {/each}
            {:else if newFact.subjectType === 'LOCATION'}
              {#each locations as location (location.id)}
                <option value={location.id}>{location.name}</option>
              {/each}
            {:else if newFact.subjectType === 'EVENT'}
              {#each events as event (event.id)}
                <option value={event.id}>{event.title} (Seq: {event.sequence})</option>
              {/each}
            {:else}
              <option value="">No subjects available for this type</option>
            {/if}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Predicate *</label>
          <input
            type="text"
            bind:value={newFact.predicate}
            name="predicate"
            required
            placeholder="e.g., is, has, can, knows"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Value (JSON)</label>
          <textarea
            bind:value={newFact.valueJson}
            oninput={(e: any) => {
              try {
                newFact.value = JSON.parse((e.target as HTMLTextAreaElement).value)
                newFact.valueJson = (e.target as HTMLTextAreaElement).value
              } catch {
                // Keep previous value if invalid JSON
              }
            }}
            name="value"
            rows="4"
            placeholder={jsonPlaceholder}
            class="w-full border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Truth Status</label>
          <select
            bind:value={newFact.truthStatus}
            name="truthStatus"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            {#each truthStatusOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Valid From Event</label>
          <select
            bind:value={newFact.validFromEventId}
            name="validFromEventId"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">Select an event...</option>
            {#each events as event (event.id)}
              <option value={event.id}>{event.title} (Seq: {event.sequence})</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Valid Until Event (Optional)</label
          >
          <select
            bind:value={newFact.validUntilEventId}
            name="validUntilEventId"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">None (still valid)</option>
            {#each events as event (event.id)}
              <option value={event.id}>{event.title} (Seq: {event.sequence})</option>
            {/each}
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">First Visible Event</label>
          <select
            bind:value={newFact.firstVisibleEventId}
            name="firstVisibleEventId"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">Select an event...</option>
            {#each events as event (event.id)}
              <option value={event.id}>{event.title} (Seq: {event.sequence})</option>
            {/each}
          </select>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onclick={closeCreateModal}
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-bw-gold text-black rounded-md font-medium hover:bg-yellow-500"
          >
            Create Fact
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .bw-gold {
    color: #ffd700;
  }
</style>
