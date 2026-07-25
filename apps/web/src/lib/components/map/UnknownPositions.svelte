<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  const unknownCharacters = [
    { label: 'Nobunaga', state: 'identite connue' },
    { label: 'Soldat probablement lie a Benjamin', state: 'identite partielle' },
    { label: 'Deux individus non identifies', state: 'inconnu' }
  ];

  const summary = {
    bodies: 12,
    identified: 7,
    partial: 3,
    unknown: 2
  };
</script>

{#if mapState.filters.showUnknownPositions}
  <div class="absolute bottom-4 left-4 w-72 bg-[#1a1a1a] border border-gray-700 text-[#FFFFF0] p-4 shadow-lg z-40 rounded-lg">
    <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider">Localisation inconnue</h3>
      <button onclick={() => mapState.filters.showUnknownPositions = false} class="text-gray-500 hover:text-white">✕</button>
    </div>

    <div class="text-xs mb-3 p-2 border border-gray-700 rounded bg-[#121212] space-y-1">
      <p>{summary.bodies} corps detectes</p>
      <p>{summary.identified} personnes identifiees</p>
      <p>{summary.partial} personnes partiellement identifiees</p>
      <p>{summary.unknown} personnes inconnues</p>
    </div>
    
    <ul class="space-y-2 text-sm">
      {#each unknownCharacters as char}
        <li class="flex items-center text-gray-300">
          <span class="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
          <span>{char.label}</span>
          <span class="text-xs text-gray-500 ml-2">{char.state}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}
