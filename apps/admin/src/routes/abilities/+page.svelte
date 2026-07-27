<script lang="ts">
  import type { PageData } from './$types'
  import { enhance } from '$app/forms'

  let { data }: { data: PageData } = $props()

  let searchQuery = $state('')
  let showCreateModal = $state(false)
  let newAbility = $state({
    id: '',
    ownerId: '',
    name: '',
    category: 'CONJURATION' as const,
    description: '',
    canonStatus: 'CANON' as const,
    moduleKey: '',
  })

  let filteredAbilities = $derived(
    data.abilities.filter(
      (ability) =>
        ability.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ability.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ability.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  const categoryOptions = [
    { value: 'CONJURATION', label: 'Conjuration' },
    { value: 'MANIPULATION', label: 'Manipulation' },
    { value: 'TRANSMUTATION', label: 'Transmutation' },
    { value: 'EMITTER', label: 'Emitter' },
    { value: 'ENHANCER', label: 'Enhancer' },
    { value: 'SPECIALIST', label: 'Specialist' },
  ]

  const canonStatusOptions = [
    { value: 'CANON', label: 'Canon' },
    { value: 'SEMI_CANON', label: 'Semi-Canon' },
    { value: 'NON_CANON', label: 'Non-Canon' },
  ]

  function openCreateModal() {
    showCreateModal = true
  }

  function closeCreateModal() {
    showCreateModal = false
    newAbility = {
      id: '',
      ownerId: '',
      name: '',
      category: 'CONJURATION',
      description: '',
      canonStatus: 'CANON',
      moduleKey: '',
    }
  }

  let characters = $derived(data.characters || [])

  function getOwnerName(ownerId: string): string {
    const character = characters.find((c) => c.id === ownerId)
    return character ? character.canonicalName : 'Unknown'
  }

  function handleOverlayClick(e: any) {
    if (e.target === e.currentTarget) {
      closeCreateModal()
    }
  }
</script>

<svelte:head><title>Abilities — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Nen Abilities</h1>
<p class="text-gray-500 mb-6">{data.abilities.length} total abilities</p>

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
  <button
    onclick={openCreateModal}
    class="bg-bw-gold text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
  >
    + Add Ability
  </button>
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
        {#each filteredAbilities as ability}
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

{#if showCreateModal}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onclick={handleOverlayClick}
  >
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
      <h2 class="text-xl font-bold text-bw-gold mb-4">Create New Ability</h2>

      <form method="POST" use:enhance class="space-y-4" onsubmit={closeCreateModal}>
        <div>
          <label for="ability-id" class="block text-sm font-medium text-gray-700 mb-1">ID *</label>
          <input
            id="ability-id"
            type="text"
            bind:value={newAbility.id}
            name="id"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>

        <div>
          <label for="ability-name" class="block text-sm font-medium text-gray-700 mb-1"
            >Name *</label
          >
          <input
            id="ability-name"
            type="text"
            bind:value={newAbility.name}
            name="name"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>

        <div>
          <label for="ability-owner" class="block text-sm font-medium text-gray-700 mb-1"
            >Owner *</label
          >
          <select
            id="ability-owner"
            bind:value={newAbility.ownerId}
            name="ownerId"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">Select a character...</option>
            {#each characters as character}
              <option value={character.id}>{character.canonicalName}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="ability-category" class="block text-sm font-medium text-gray-700 mb-1"
            >Category</label
          >
          <select
            id="ability-category"
            bind:value={newAbility.category}
            name="category"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            {#each categoryOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="ability-canon" class="block text-sm font-medium text-gray-700 mb-1"
            >Canon Status</label
          >
          <select
            id="ability-canon"
            bind:value={newAbility.canonStatus}
            name="canonStatus"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            {#each canonStatusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="ability-desc" class="block text-sm font-medium text-gray-700 mb-1"
            >Description</label
          >
          <textarea
            id="ability-desc"
            bind:value={newAbility.description}
            name="description"
            rows="3"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          ></textarea>
        </div>

        <div>
          <label for="ability-module" class="block text-sm font-medium text-gray-700 mb-1"
            >Module Key</label
          >
          <input
            id="ability-module"
            type="text"
            bind:value={newAbility.moduleKey}
            name="moduleKey"
            placeholder="Optional module identifier"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
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
            Create Ability
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
