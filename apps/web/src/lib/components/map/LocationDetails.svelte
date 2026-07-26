<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte';

  // Mock data for location details
  const mockLocationData: Record<string, any> = {
    'room-1014': {
      name: 'Room 1014',
      tier: 'Tier 1',
      sector: 'Royal Sector',
      characters: ['Kurapika', 'Oito', 'Woble', 'Bill'],
      events: ['Security meeting', 'Nen training']
    },
    'room-1004': {
      name: 'Room 1004',
      tier: 'Tier 1',
      sector: 'Royal Sector',
      characters: ['Tserriednich'],
      events: ['Nen training']
    }
  };

  let locationDetails = $derived(mapState.selectedLocationId ? mockLocationData[mapState.selectedLocationId] : null);

  function closePanel() {
    mapState.selectLocation(null);
  }

  const tabs = ['Identity', 'Body', 'Consciousness', 'Knowledge', 'Perspectives'];
  let activeTab = $state('Identity');
</script>

{#if mapState.selectedLocationId && locationDetails}
  <div class="absolute top-0 right-0 h-full w-[22rem] bg-[#1a1a1a] border-l border-[#FFD700] text-[#FFFFF0] p-6 shadow-2xl flex flex-col z-40 transition-transform overflow-y-auto">
    <button onclick={closePanel} class="absolute top-4 right-4 text-gray-400 hover:text-white">
      ✕
    </button>
    
    <h2 class="text-xl font-bold uppercase tracking-wider mb-1 text-[#FFD700]">{locationDetails.name}</h2>
    <p class="text-sm text-gray-400 mb-6">{locationDetails.tier} · {locationDetails.sector}</p>

    <div class="mb-4">
      <div class="flex flex-wrap gap-2">
        {#each tabs as tab}
          <button
            type="button"
            class="text-xs px-2 py-1 rounded border"
            class:border-[#FFD700]={activeTab === tab}
            class:bg-[#2a2a2a]={activeTab === tab}
            class:border-gray-700={activeTab !== tab}
            onclick={() => (activeTab = tab)}
          >
            {tab}
          </button>
        {/each}
      </div>
    </div>

    {#if activeTab === 'Identity'}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Displayed identity</h3>
        <ul class="space-y-2 text-sm text-gray-300">
          {#each locationDetails.characters as char}
            <li class="flex items-center">
              <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              {char}
            </li>
          {/each}
        </ul>
      </div>
    {:else if activeTab === 'Body'}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Perceived biological state</h3>
        <KnowledgeStatus state="confirmed" label="Bodies present" details="Direct observation" />
        <div class="mt-2">
          <KnowledgeStatus state="outdated" label="Injuries" details="Last mentioned: event 389-18" />
        </div>
      </div>
    {:else if activeTab === 'Consciousness'}
      <div class="mb-5 space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Consciousness</h3>
        <KnowledgeStatus state="suspected" label="Possible anomaly" details="Unusual behavior" />
        <KnowledgeStatus state="believed" label="Active consciousness" details="Assumed continuity" />
      </div>
    {:else if activeTab === 'Knowledge'}
      <div class="mb-5 space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Observer knowledge</h3>
        <KnowledgeStatus state="confirmed" label="Position" details="Personally observed" />
        <KnowledgeStatus state="reported" label="Affiliation" details="Report received from Melody" />
        <KnowledgeStatus state="rumor" label="Ability" details="Unverified source" />
      </div>
    {:else}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Diverging perspectives</h3>
        <p class="text-sm text-gray-300">Some perspectives show a stable identity; others flag a contradiction.</p>
      </div>
    {/if}

    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Events</h3>
      <ul class="space-y-1 text-sm text-gray-300 list-disc list-inside">
        {#each locationDetails.events as event}
          <li>{event}</li>
        {/each}
      </ul>
    </div>

    <div class="mt-auto text-xs text-gray-500">
      Last updated: Event 04
    </div>
  </div>
{/if}
