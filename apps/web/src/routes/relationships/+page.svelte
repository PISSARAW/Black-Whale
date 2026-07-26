<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let selectedFactionId: string | null = $state(null);
  
  // Computed map of characters by faction
  const charactersByFaction = $derived(
    data.characters.reduce((acc: Record<string, any[]>, char: any) => {
      const faction = char.factionId || 'unaffiliated';
      if (!acc[faction]) acc[faction] = [];
      acc[faction].push(char);
      return acc;
    }, {})
  );

  const getCharactersForFaction = (factionId: string) => {
    return charactersByFaction[factionId] || [];
  };
</script>

<svelte:head><title>Relationships & Factions — Black Whale</title></svelte:head>

<div class="flex h-screen bg-[#050505] overflow-hidden text-[#FFFFF0] font-sans">
  
  <!-- Factions Sidebar -->
  <aside class="w-1/3 bg-[#0a0a0a] border-r border-[#222] overflow-y-auto p-6 flex flex-col gap-4">
    <h1 class="text-2xl font-bold text-[#FFD700] uppercase tracking-widest mb-4">Allegiance Network</h1>
    
    {#each data.factions as faction}
      <button 
        class="text-left p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group {selectedFactionId === faction.id ? 'border-[#FFD700] bg-[#111]' : 'border-[#222] hover:border-gray-500 hover:bg-[#151515] bg-transparent'}"
        onclick={() => selectedFactionId = faction.id === selectedFactionId ? null : faction.id}
      >
        <div class="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <h3 class="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{faction.name}</h3>
        <p class="text-sm text-gray-400 mt-1 line-clamp-2">{faction.description}</p>
        
        <div class="mt-3 flex items-center justify-between">
          <span class="text-xs font-mono text-gray-500 uppercase">
            {getCharactersForFaction(faction.id).length} Member(s)
          </span>
          <span class="text-xs text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity">Inspect →</span>
        </div>
      </button>
    {/each}
  </aside>

  <!-- Faction Details / Intel Area -->
  <main class="flex-1 p-10 bg-black overflow-y-auto flex flex-col items-center justify-center relative">
    {#if selectedFactionId}
      {@const activeFaction = data.factions.find((f: any) => f.id === selectedFactionId)}
      <div class="w-full max-w-3xl animate-fade-in">
        <div class="mb-10 text-center">
          <h2 class="text-5xl font-bold text-[#FFD700] uppercase tracking-widest">{activeFaction?.name}</h2>
          <p class="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">{activeFaction?.description}</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {#each getCharactersForFaction(selectedFactionId) as char}
            <div class="bg-[#111] border border-[#333] p-5 rounded-lg hover:border-gray-500 transition-colors">
              <h4 class="text-xl font-bold text-white mb-2">{char.canonicalName}</h4>
              {#if char.aliases && char.aliases.length > 0}
                <p class="text-xs text-gray-500 italic mb-2">"{char.aliases.join('", "')}"</p>
              {/if}
              <p class="text-sm text-gray-400">{char.description}</p>
            </div>
          {:else}
            <div class="col-span-full text-center text-gray-600 border border-dashed border-gray-800 p-8 rounded-lg">
              No known affiliated members at this time.
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-center">
        <div class="inline-block w-32 h-32 border-4 border-dashed border-gray-800 rounded-full flex items-center justify-center mb-6 mx-auto">
          <span class="text-[#FFD700] font-bold text-4xl opacity-50">?</span>
        </div>
        <h2 class="text-2xl text-gray-500 uppercase tracking-widest font-bold">Select a Faction</h2>
        <p class="text-gray-600 mt-2">Analyze its allegiance network.</p>
      </div>
    {/if}
  </main>
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
</style>
