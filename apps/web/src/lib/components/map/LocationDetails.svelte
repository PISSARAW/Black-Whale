<script lang="ts">
  import { mapState } from '$lib/state/mapState.svelte';
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte';

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

  const tabs = ['Identite', 'Corps', 'Conscience', 'Connaissances', 'Perspectives'];
  let activeTab = $state('Identite');
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

    {#if activeTab === 'Identite'}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Identite affichee</h3>
        <ul class="space-y-2 text-sm text-gray-300">
          {#each locationDetails.characters as char}
            <li class="flex items-center">
              <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
              {char}
            </li>
          {/each}
        </ul>
      </div>
    {:else if activeTab === 'Corps'}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Etat biologique percu</h3>
        <KnowledgeStatus state="confirmed" label="Corps presentes" details="Observation directe" />
        <div class="mt-2">
          <KnowledgeStatus state="outdated" label="Blessures" details="Derniere mention: evenement 389-18" />
        </div>
      </div>
    {:else if activeTab === 'Conscience'}
      <div class="mb-5 space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Conscience</h3>
        <KnowledgeStatus state="suspected" label="Anomalie possible" details="Comportement inhabituel" />
        <KnowledgeStatus state="believed" label="Conscience active" details="Presomption de continuite" />
      </div>
    {:else if activeTab === 'Connaissances'}
      <div class="mb-5 space-y-2">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Connaissances de l'observateur</h3>
        <KnowledgeStatus state="confirmed" label="Position" details="Observee personnellement" />
        <KnowledgeStatus state="reported" label="Affiliation" details="Rapport recu de Melody" />
        <KnowledgeStatus state="rumor" label="Capacite" details="Source non verifiee" />
      </div>
    {:else}
      <div class="mb-5">
        <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Perspectives divergentes</h3>
        <p class="text-sm text-gray-300">Certaines perspectives affichent une identite stable, d'autres signalent une contradiction.</p>
      </div>
    {/if}

    <div>
      <h3 class="text-sm font-semibold uppercase tracking-wider mb-2 border-b border-gray-700 pb-1">Evenements</h3>
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
