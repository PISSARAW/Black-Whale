<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  const unknownCharacters = [
    'Nobunaga',
    'Phinks',
    'Feitan'
  ];
</script>

{#if mapState.filters.showUnknownPositions}
  <div class="absolute bottom-4 left-4 w-64 bg-[#1a1a1a] border border-gray-700 text-[#FFFFF0] p-4 shadow-lg z-40 rounded-lg">
    <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Position Inconnue</h3>
      <button on:click={() => mapState.filters.showUnknownPositions = false} class="text-gray-500 hover:text-white">✕</button>
    </div>
    
    <ul class="space-y-2 text-sm">
      {#each unknownCharacters as char}
        <li class="flex items-center text-gray-300">
          <span class="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
          {char}
        </li>
      {/each}
    </ul>
  </div>
{/if}
