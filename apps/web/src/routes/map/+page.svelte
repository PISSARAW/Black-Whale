<script lang="ts">
  import MapContainer from '$lib/components/map/MapContainer.svelte';
  import LocationDetails from '$lib/components/map/LocationDetails.svelte';
  import UnknownPositions from '$lib/components/map/UnknownPositions.svelte';
  import { mapState } from '$lib/state/mapState.svelte';

  // Toolbar & Factions setup (mocked for V1 UI)
  const factions = [
    { id: 'princes', label: 'Princes' },
    { id: 'guards', label: 'Gardes' },
    { id: 'hunters', label: 'Hunters' },
    { id: 'spider', label: 'Brigade' },
    { id: 'mafia', label: 'Mafias' }
  ];
</script>

<svelte:head>
  <title>Black Whale Map - Hunter x Hunter</title>
</svelte:head>

<div class="flex flex-col h-screen w-full bg-[#050505] text-[#FFFFF0] font-sans overflow-hidden">
  
  <!-- Top Navigation / Toolbar -->
  <header class="flex-none h-14 bg-[#111] border-b border-[#333] flex items-center justify-between px-6 z-10">
    <div class="flex items-center gap-6">
      <h1 class="text-xl font-bold tracking-widest text-[#FFD700]">BLACK WHALE</h1>
      
      <div class="flex items-center gap-2 border-l border-gray-700 pl-6">
        <span class="text-xs text-gray-500 uppercase tracking-widest">Chapitre 390</span>
        <span class="text-gray-400">·</span>
        <span class="text-sm font-semibold">Événement 14</span>
      </div>
    </div>
    
    <div class="flex items-center gap-4">
      <button 
        class="text-sm text-gray-400 hover:text-white transition-colors"
        class:text-white={mapState.filters.showUnknownPositions}
        on:click={() => mapState.filters.showUnknownPositions = !mapState.filters.showUnknownPositions}
      >
        Positions inconnues
      </button>
      <button 
        class="text-sm border border-red-900 bg-red-950/30 text-red-400 px-3 py-1 rounded hover:bg-red-900/50 transition-colors"
        on:click={() => mapState.filters.spoilersEnabled = !mapState.filters.spoilersEnabled}
      >
        {mapState.filters.spoilersEnabled ? 'Spoilers On' : 'Spoilers Off'}
      </button>
    </div>
  </header>

  <div class="flex flex-1 overflow-hidden">
    
    <!-- Left Sidebar: Tiers Navigation -->
    <aside class="w-16 md:w-48 bg-[#0a0a0a] border-r border-[#222] flex flex-col pt-4 shrink-0 z-20">
      <button 
        class="text-left px-4 py-3 text-sm font-bold border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
        class:text-[#FFD700]={mapState.currentZoomLevel === 'OVERVIEW'}
        on:click={() => mapState.selectTier(null)}
      >
        <span class="hidden md:inline">VUE GLOBALE</span>
        <span class="md:hidden text-center block">ALL</span>
      </button>
      
      {#each [1,2,3,4,5] as tierNum}
        <button 
          class="text-left px-4 py-3 text-sm border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
          class:text-[#FFD700]={mapState.selectedTier === `tier-${tierNum}`}
          class:bg-[#151515]={mapState.selectedTier === `tier-${tierNum}`}
          on:click={() => mapState.selectTier(`tier-${tierNum}`)}
        >
          <span class="hidden md:inline">TIER {tierNum}</span>
          <span class="md:hidden text-center block">T{tierNum}</span>
        </button>
      {/each}
      
      <div class="mt-auto p-4 hidden md:block">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Filtres</h3>
        <div class="flex flex-col gap-2">
          {#each factions as faction}
            <label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
              <input type="checkbox" 
                class="accent-[#FFD700] bg-transparent border-gray-600"
                checked={mapState.filters.factions.includes(faction.id)}
                on:change={() => mapState.toggleFactionFilter(faction.id)}
              />
              {faction.label}
            </label>
          {/each}
        </div>
      </div>
    </aside>

    <!-- Main Map Area -->
    <main class="flex-1 relative overflow-hidden bg-black">
      
      <MapContainer />
      
      <LocationDetails />
      <UnknownPositions />
      
    </main>
  </div>
  
  <!-- Bottom Timeline (mock) -->
  <footer class="flex-none h-16 bg-[#111] border-t border-[#333] flex items-center px-6 z-10">
    <span class="text-xs text-gray-500 mr-4">TIMELINE</span>
    <input type="range" min="0" max="100" value="14" class="w-full accent-[#FFD700]" />
  </footer>

</div>
