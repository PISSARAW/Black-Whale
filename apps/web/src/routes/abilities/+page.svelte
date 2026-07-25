<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>Abilities — Black Whale</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-8">
  <header class="mb-12">
    <h1 class="text-3xl font-bold text-bw-gold mb-2">Base de données du Nen</h1>
    <p class="text-gray-400">Liste des capacités enregistrées dans le moteur.</p>
  </header>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    {#each data.abilities || [] as ability}
      <a href={`/nen`} class="block group relative bg-bw-navy/50 border border-bw-gold/20 rounded-xl p-6 overflow-hidden hover:border-bw-gold/60 transition-colors">
        <div class="absolute inset-0 bg-gradient-to-br from-bw-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div class="relative">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold text-white group-hover:text-bw-gold transition-colors">{ability.name}</h2>
              <p class="text-gray-500 text-sm mt-1 uppercase tracking-wider">{ability.owner}</p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full bg-bw-gold/10 text-bw-gold border border-bw-gold/30">
              {ability.category || 'Unknown'}
            </span>
          </div>
          
          <p class="text-gray-400 text-sm mt-2 line-clamp-2">{ability.description || 'No description available.'}</p>
          
          <div class="mt-6 flex items-center text-bw-gold/80 text-sm font-semibold">
            <span>Voir l'interaction dynamique</span>
            <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </a>
    {/each}

    {#if !data.abilities || data.abilities.length === 0}
      <div class="col-span-full py-12 text-center border border-dashed border-gray-700 rounded-xl">
        <p class="text-gray-500">Aucune capacité trouvée.</p>
      </div>
    {/if}
  </div>
</div>
