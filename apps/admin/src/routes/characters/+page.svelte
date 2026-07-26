<script lang="ts">
import type { PageData } from './$types';
import { enhance } from '$app/forms';

let { data }: { data: PageData } = $props();

let searchQuery = $state('');
let showCreateModal = $state(false);
let newCharacter = $state({
  slug: '',
  canonicalName: '',
  aliases: [] as string[],
  description: '',
  narrativeImportance: 'PRIMARY' as const,
  modelingLevel: 1,
  firstVisibleEventId: ''
});

let filteredCharacters = $derived(
  data.characters.filter(char => 
    char.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    char.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (char.aliases && char.aliases.some((alias: string) => alias.toLowerCase().includes(searchQuery.toLowerCase())))
  )
);

const narrativeImportanceOptions = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'MINOR', label: 'Minor' },
  { value: 'BACKGROUND', label: 'Background' }
];

function openCreateModal() {
  showCreateModal = true;
}

function closeCreateModal() {
  showCreateModal = false;
  newCharacter = {
    slug: '',
    canonicalName: '',
    aliases: [],
    description: '',
    narrativeImportance: 'PRIMARY',
    modelingLevel: 1,
    firstVisibleEventId: ''
  };
}

function addAlias() {
  newCharacter.aliases.push('');
  newCharacter = { ...newCharacter };
}

function removeAlias(index: number) {
  newCharacter.aliases = newCharacter.aliases.filter((_, i) => i !== index);
  newCharacter = { ...newCharacter };
}

function updateAlias(index: number, value: string) {
  newCharacter.aliases[index] = value;
  newCharacter = { ...newCharacter };
}

let events = $derived(data.events || []);

function handleModalClick(e: any) {
  e.stopPropagation();
}

function handleOverlayClick(e: any) {
  if (e.target === e.currentTarget) {
    closeCreateModal();
  }
}
</script>

<svelte:head><title>Characters — BW Admin</title></svelte:head>

<h1 class="text-2xl font-bold text-bw-gold mb-4">Characters</h1>
<p class="text-gray-500 mb-6">{data.characters.length} total characters</p>

<div class="flex justify-between items-center mb-6 gap-4">
  <div class="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search characters..."
      bind:value={searchQuery}
      class="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
    />
    <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
  <button
    onclick={openCreateModal}
    class="bg-bw-gold text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
  >
    + Add Character
  </button>
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
        {#each filteredCharacters as character}
          <tr class="border-t border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{character.canonicalName}</td>
            <td class="px-4 py-3 text-gray-600">{character.slug}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-xs font-medium 
                {character.narrativeImportance === 'PRIMARY' ? 'bg-purple-100 text-purple-700' :
                  character.narrativeImportance === 'SECONDARY' ? 'bg-blue-100 text-blue-700' :
                  character.narrativeImportance === 'MINOR' ? 'bg-gray-100 text-gray-700' :
                  'bg-orange-100 text-orange-700'}
              ">
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
            <td class="px-4 py-3 text-gray-600">{character.firstVisibleEventId.substring(0, 8)}...</td>
            <td class="px-4 py-3">
              <a href="/characters/{character.slug}" class="text-blue-600 hover:text-blue-800">View</a>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick={handleOverlayClick}>
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
      <h2 class="text-xl font-bold text-bw-gold mb-4">Create New Character</h2>
      
      <form method="POST" use:enhance class="space-y-4" onsubmit={closeCreateModal}>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Canonical Name *</label>
          <input
            type="text"
            bind:value={newCharacter.canonicalName}
            name="canonicalName"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
          <input
            type="text"
            bind:value={newCharacter.slug}
            name="slug"
            required
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            bind:value={newCharacter.description}
            name="description"
            rows="3"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Narrative Importance</label>
          <select
            bind:value={newCharacter.narrativeImportance}
            name="narrativeImportance"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            {#each narrativeImportanceOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Modeling Level</label>
          <input
            type="number"
            bind:value={newCharacter.modelingLevel}
            name="modelingLevel"
            min="1"
            max="4"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">First Visible Event</label>
          <select
            bind:value={newCharacter.firstVisibleEventId}
            name="firstVisibleEventId"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
          >
            <option value="">Select an event...</option>
            {#each events as event}
              <option value={event.id}>{event.title} (Seq: {event.sequence})</option>
            {/each}
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Aliases</label>
          <div class="space-y-2">
            {#each newCharacter.aliases as alias, index}
              <div class="flex gap-2">
                <input
                  type="text"
                  value={alias}
                  oninput={(e: any) => updateAlias(index, (e.target as HTMLInputElement).value)}
                  placeholder="Alias..."
                  class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bw-gold focus:border-transparent"
                />
                <button
                  type="button"
                  onclick={() => removeAlias(index)}
                  class="text-red-500 hover:text-red-700 px-2 py-2"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            {/each}
            <button
              type="button"
              onclick={addAlias}
              class="text-bw-gold hover:text-yellow-600 text-sm font-medium flex items-center gap-1"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Alias
            </button>
          </div>
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
            Create Character
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .bw-gold { color: #FFD700; }
</style>
