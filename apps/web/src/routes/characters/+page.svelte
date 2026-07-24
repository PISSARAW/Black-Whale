<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Characters — Black Whale</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto">
  <h1 class="text-3xl font-bold text-bw-gold mb-8">Characters</h1>
  
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {#each data.characters as character (character.id)}
      <a href="/characters/{character.slug}" class="block bg-[#111] border border-[#333] rounded-lg p-4 hover:border-bw-gold hover:bg-[#1a1a1a] transition-all">
        <h2 class="text-xl font-bold text-gray-100 mb-2">{character.canonicalName}</h2>
        <div class="flex gap-2">
          {#if character.faction}
            <span class="text-xs bg-[#222] text-gray-400 px-2 py-1 rounded">{character.faction}</span>
          {/if}
          <span class="text-xs border border-[#333] text-gray-500 px-2 py-1 rounded">Ch. {character.firstVisibleChapter}</span>
        </div>
      </a>
    {:else}
      <p class="text-gray-500 col-span-full">Aucun personnage visible avec les filtres actuels.</p>
    {/each}
  </div>
</div>
