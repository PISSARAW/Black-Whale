<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();

  // Group characters by faction
  const charactersByFaction = data.characters.reduce((acc: Record<string, any[]>, char: any) => {
    const faction = char.factionId || 'Indépendant';
    if (!acc[faction]) acc[faction] = [];
    acc[faction].push(char);
    return acc;
  }, {});
</script>

<svelte:head><title>Characters — Black Whale</title></svelte:head>

<div class="p-6 max-w-7xl mx-auto bg-[#050505] min-h-screen">
  <h1 class="text-4xl font-bold text-[#FFD700] mb-2 tracking-widest uppercase">Registre des Passagers</h1>
  <p class="text-gray-400 mb-8">Liste des personnages connus à bord du Black Whale 1, classés par affiliation.</p>
  
  <div class="space-y-12">
    {#each Object.entries(charactersByFaction) as [faction, chars]}
      <section>
        <h2 class="text-2xl font-semibold text-gray-200 border-b border-gray-800 pb-2 mb-6 capitalize">{faction.replace('prince-', 'Faction ')}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {#each chars as character (character.id)}
            <a href="/characters/{character.id}" class="group block bg-[#0a0a0a] border border-[#222] rounded-xl p-5 hover:border-[#FFD700] hover:bg-[#111] transition-all relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-b from-[#FFD700]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <h3 class="text-lg font-bold text-gray-100 group-hover:text-[#FFD700] transition-colors">{character.canonicalName}</h3>
              
              {#if character.aliases && character.aliases.length > 0}
                <p class="text-xs text-gray-500 mb-3 italic">"{character.aliases.join('", "')}"</p>
              {/if}
              
              <p class="text-sm text-gray-400 mt-3 line-clamp-3 leading-relaxed">{character.description}</p>
              
              <div class="mt-4 pt-4 border-t border-[#222] flex justify-between items-center">
                <span class="text-[10px] uppercase tracking-widest text-gray-600 bg-gray-900 px-2 py-1 rounded">
                  {character.canonStatus === 'canon' ? 'Canon' : 'Non-canon'}
                </span>
                {#if character.firstAppearanceChapterId}
                  <span class="text-xs text-gray-500">{character.firstAppearanceChapterId.replace('-', ' ')}</span>
                {/if}
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>
