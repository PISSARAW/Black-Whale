<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';

  // Mock data for location details
  const mockLocationData: Record<string, any> = {
    'room-1014': {
      name: 'Chambre 1014',
      tier: 'Tier 1',
      sector: 'Secteur Royal',
      characters: ['Kurapika', 'Oito', 'Woble', 'Bill'],
      events: ['Réunion de sécurité', 'Formation au Nen']
    },
    'room-1004': {
      name: 'Chambre 1004',
      tier: 'Tier 1',
      sector: 'Secteur Royal',
      characters: ['Tserriednich'],
      events: ['Entraînement Nen']
    }
  };

  let locationDetails = $derived(mapState.selectedLocationId ? mockLocationData[mapState.selectedLocationId] : null);

  function closePanel() {
    mapState.selectLocation(null);
  }
</script>

{#if mapState.selectedLocationId && locationDetails}
  <div class="absolute top-0 right-0 h-full w-80 bg-[#1a1a1a] border-l border-[#FFD700] text-[#FFFFF0] p-6 shadow-2xl flex flex-col z-40 transition-transform">
    <button onclick={closePanel} class="absolute top-4 right-4 text-gray-400 hover:text-white">
      ✕
    </button>
    
    <h2 class="text-xl font-bold uppercase tracking-wider mb-1 text-[#FFD700]">{locationDetails.name}</h2>
    <p class="text-sm text-gray-400 mb-6">{locationDetails.tier} · {locationDetails.sector}</p>

    <div class="mb-6">
      <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Personnes présentes</h3>
      <ul class="space-y-1">
        {#each locationDetails.characters as char}
          <li class="flex items-center text-sm">
            <span class="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
            {char} <span class="text-gray-500 ml-2 text-xs">— confirmée</span>
          </li>
        {/each}
      </ul>
    </div>

    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Événements</h3>
      <ul class="space-y-1 text-sm text-gray-300 list-disc list-inside">
        {#each locationDetails.events as event}
          <li>{event}</li>
        {/each}
      </ul>
    </div>

    <div class="mt-auto text-xs text-gray-500">
      Dernière mise à jour: Événement 04
    </div>
  </div>
{/if}
