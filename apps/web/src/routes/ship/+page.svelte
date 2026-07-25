<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import MapContainer from '$lib/components/map/MapContainer.svelte';
  import LocationDetails from '$lib/components/map/LocationDetails.svelte';
  import UnknownPositions from '$lib/components/map/UnknownPositions.svelte';
  import { mapState } from '$lib/state/mapState.svelte';
  import PerspectiveContextBar from '$lib/components/perspective/PerspectiveContextBar.svelte';
  import PerspectiveSelector from '$lib/components/perspective/PerspectiveSelector.svelte';
  import PerspectiveTimeline from '$lib/components/perspective/PerspectiveTimeline.svelte';
  import WhyPanel from '$lib/components/perspective/WhyPanel.svelte';
  import KnowledgeStatus from '$lib/components/perspective/KnowledgeStatus.svelte';
  import ConsciousnessTransferTransition from '$lib/components/perspective/ConsciousnessTransferTransition.svelte';
  import type { FollowMode, PerspectiveContext, PerspectiveOption } from '$lib/components/perspective/types';

  let { data }: { data: PageData } = $props();

  // Toolbar & Factions setup
  const factions = [
    { id: 'princes', label: 'Princes' },
    { id: 'guards', label: 'Gardes' },
    { id: 'hunters', label: 'Hunters' },
    { id: 'spider', label: 'Brigade' },
    { id: 'mafia', label: 'Mafias' }
  ];

  const followLabel: Record<FollowMode, string> = {
    consciousness: 'suivre la conscience',
    body: 'suivre le corps',
    appearance: "suivre l'apparence publique"
  };

  let perspectiveOptions = $derived.by(() => {
    const fromCharacters: PerspectiveOption[] = (data.worldState?.characters || []).map((char: any) => ({
      id: char.id,
      label: char.canonicalName,
      kind: 'character'
    }));

    return [{ id: 'reader', label: 'Vue du lecteur', kind: 'reader' as const }, ...fromCharacters];
  });

  let currentEvt = $derived(data.events.find((event: any) => event.sequence === data.sequence) || data.events[data.events.length - 1]);

  let selectedPerspective = $derived(
    perspectiveOptions.find((opt) => opt.id === mapState.selectedPerspectiveId) || perspectiveOptions[0]
  );

  let contextState = $derived.by((): PerspectiveContext => {
    const perspectiveName = selectedPerspective?.label || 'Vue du lecteur';
    const observer = data.perspective?.observer;
    const observerCharacter = data.worldState?.characters?.find((char: any) => char.id === observer?.characterId);
    const occupiedBody = data.worldState?.bodies?.find((body: any) => body.id === observer?.currentBodyId);
    const anomaly = Boolean(observer?.currentBodyId && observer?.consciousnessId && observer.currentBodyId !== observer.consciousnessId);

    const canonicalPerspective = observerCharacter?.canonicalName || perspectiveName;
    const occupiedBodyLabel = occupiedBody?.label || occupiedBody?.id || canonicalPerspective;

    return {
      chapter: data.spoilerLimit || currentEvt?.sequence || 0,
      eventLabel: `${data.sequence ?? 0}`,
      spoilerLimit: data.spoilerLimit ?? null,
      perspectiveName: canonicalPerspective,
      followedConsciousness: observer?.consciousnessId || canonicalPerspective,
      occupiedBody: occupiedBodyLabel,
      apparentIdentity: occupiedBodyLabel,
      followMode: mapState.followMode,
      hasAnomaly: anomaly
    };
  });

  let timelinePoints = $derived.by(() => {
    const baseSequence = data.sequence || 0;

    return {
      reality: [
        { id: 'r0', label: 'Evenement reel', index: baseSequence - 2 },
        { id: 'r1', label: currentEvt?.title || 'Etat courant', index: baseSequence }
      ],
      body: [
        { id: 'b0', label: 'Deplacement corporel', index: baseSequence - 1 },
        { id: 'b1', label: 'Etat biologique', index: baseSequence }
      ],
      consciousness: [
        { id: 'c0', label: 'Ancrage mental', index: baseSequence - 1 },
        { id: 'c1', label: 'Transfert', index: baseSequence, emphasis: contextState.hasAnomaly }
      ],
      knowledge: [
        { id: 'k0', label: 'Information recue', index: baseSequence - 2 },
        { id: 'k1', label: 'Mise a jour perspective', index: baseSequence, detail: selectedPerspective?.kind === 'reader' ? 'Canon filtre spoilers' : 'Point de vue subjectif' }
      ]
    };
  });

  $effect(() => {
    mapState.setFollowMode((data.followMode as FollowMode) || 'consciousness');

    const selectedByUrl = perspectiveOptions.find((option) => option.id === data.selectedPerspectiveId);
    if (selectedByUrl) {
      mapState.setPerspective(selectedByUrl.id, selectedByUrl.label, selectedByUrl.kind);
    }

    if (!selectedPerspective) {
      return;
    }

    mapState.setPerspective(selectedPerspective.id, selectedPerspective.label, selectedPerspective.kind);
  });

  // Timeline slider change
  function handleTimelineChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const newSeq = parseInt(input.value);
    
    // Instead of doing full page reload, we could fetch via API.
    // For the MVP, a reload with param works
    window.location.href = `/ship?sequence=${newSeq}`;
  }

  function handlePerspectiveSelect(id: string) {
    const found = perspectiveOptions.find((option) => option.id === id);
    if (!found) return;

    mapState.setPerspective(found.id, found.label, found.kind);

    const url = new URL($page.url);
    url.searchParams.set('perspective', found.id);
    url.searchParams.set('follow', mapState.followMode);
    goto(url.toString(), { keepFocus: true });
  }

  function handleFollowModeSelect(mode: FollowMode) {
    mapState.setFollowMode(mode);

    const url = new URL($page.url);
    url.searchParams.set('perspective', mapState.selectedPerspectiveId);
    url.searchParams.set('follow', mode);
    goto(url.toString(), { keepFocus: true, replaceState: true });
  }
</script>

<svelte:head>
  <title>Black Whale Map - Hunter x Hunter</title>
</svelte:head>

<div class="v2-shell flex flex-col h-screen w-full text-[#FFFFF0] overflow-hidden px-3 py-3 gap-3">
  
  <section class="flex-none grid grid-cols-1 gap-3">
    <div class="flex items-center justify-between px-1">
      <h1 class="font-condensed text-2xl tracking-[0.17em] text-[#e5c57a]">BLACK WHALE</h1>
      <div class="flex items-center gap-2 text-xs">
        <button
          class="px-3 py-1 rounded border border-[#415062] hover:bg-[#213040]"
          onclick={() => mapState.setCompareWithReader(!mapState.compareWithReader)}
        >
          {mapState.compareWithReader ? 'Masquer comparaison canonique' : 'Comparer a la vue du lecteur'}
        </button>
        <a href="/compare" class="px-3 py-1 rounded border border-[#4a5f66] hover:bg-[#1a2d31]">Perspective Comparison</a>
      </div>
    </div>

    <PerspectiveContextBar context={contextState} modeLabel={followLabel[mapState.followMode]} />

    {#if contextState.hasAnomaly}
      <ConsciousnessTransferTransition
        visible={true}
        fromBody={contextState.perspectiveName}
        toBody={contextState.occupiedBody}
        consciousness={contextState.followedConsciousness}
      />
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-[20rem_1fr] gap-3">
      <PerspectiveSelector
        options={perspectiveOptions}
        selectedPerspective={mapState.selectedPerspectiveId}
        followMode={mapState.followMode}
        onPerspectiveSelect={handlePerspectiveSelect}
        onFollowModeSelect={handleFollowModeSelect}
      />

      <div class="bw-panel p-3 flex flex-wrap gap-2 items-center">
        <KnowledgeStatus state="confirmed" label="Position actuelle" details="Observation directe" />
        <KnowledgeStatus state="suspected" label="Position supposee" details="Rapport non verifie" />
        <KnowledgeStatus state="outdated" label="Derniere position" details="Peut etre obsolet" />
        <button
          class="text-xs px-3 py-1 rounded border border-[#4f5f71] hover:bg-[#243445]"
          onclick={() => mapState.filters.showUnknownPositions = !mapState.filters.showUnknownPositions}
        >
          {mapState.filters.showUnknownPositions ? 'Masquer localisation inconnue' : 'Afficher localisation inconnue'}
        </button>
        <button
          class="text-xs px-3 py-1 rounded border border-red-900 bg-red-950/30 text-red-300 hover:bg-red-900/50"
          onclick={() => mapState.filters.spoilersEnabled = !mapState.filters.spoilersEnabled}
        >
          {mapState.filters.spoilersEnabled ? 'Spoilers actifs' : 'Spoilers inactifs'}
        </button>
      </div>
    </div>
  </section>

  <div class="flex flex-1 overflow-hidden">
    
    <!-- Left Sidebar: Tiers Navigation -->
    <aside class="w-16 md:w-48 bg-[#0a0a0a] border-r border-[#222] flex flex-col pt-4 shrink-0 z-20 rounded-l-lg">
      <button 
        class="text-left px-4 py-3 text-sm font-bold border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
        class:text-[#FFD700]={mapState.currentZoomLevel === 'OVERVIEW'}
        onclick={() => mapState.selectTier(null)}
      >
        <span class="hidden md:inline">VUE GLOBALE</span>
        <span class="md:hidden text-center block">ALL</span>
      </button>
      
      {#each [1,2,3,4,5] as tierNum}
        <button 
          class="text-left px-4 py-3 text-sm border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
          class:text-[#FFD700]={mapState.selectedTier === `tier-${tierNum}`}
          class:bg-[#151515]={mapState.selectedTier === `tier-${tierNum}`}
          onclick={() => mapState.selectTier(`tier-${tierNum}`)}
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
                onchange={() => mapState.toggleFactionFilter(faction.id)}
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
      <WhyPanel
        open={mapState.explainPanelOpen && !!mapState.explainTarget}
        subject={mapState.explainTarget?.subject || ''}
        displayedValue={mapState.explainTarget?.value || ''}
        source={mapState.explainTarget?.source || ''}
        observedAt={mapState.explainTarget?.observedAt || ''}
        freshness={mapState.explainTarget?.freshness || ''}
        state={mapState.explainTarget?.knowledgeState || 'unknown'}
        revealReality={mapState.compareWithReader}
        canonicalValue={mapState.explainTarget?.canonicalValue || 'inconnue'}
        onClose={() => mapState.closeExplainPanel()}
      />
      
      <LocationDetails />
      <UnknownPositions />
      
    </main>
  </div>
  
  <!-- Bottom Timeline -->
  <footer class="flex-none grid gap-2">
    <div class="h-16 bg-[#111] border border-[#333] rounded-lg flex items-center px-6 z-10 gap-4">
      <span class="text-xs text-gray-500 mr-4 font-bold">TIMELINE</span>

      {#if data.events.length > 0}
        <input
          type="range"
          min={data.events[0].sequence}
          max={data.events[data.events.length - 1].sequence}
          value={data.sequence}
          onchange={handleTimelineChange}
          class="w-full accent-[#FFD700]"
        />
      {:else}
        <span class="text-sm text-gray-400">Aucun evenement disponible.</span>
      {/if}
    </div>

    <PerspectiveTimeline
      reality={timelinePoints.reality}
      body={timelinePoints.body}
      consciousness={timelinePoints.consciousness}
      knowledge={timelinePoints.knowledge}
      currentIndex={data.sequence || 0}
    />
  </footer>

</div>

<style>
  .v2-shell {
    background:
      radial-gradient(940px 420px at 12% -20%, rgba(39, 99, 92, 0.24), transparent 70%),
      radial-gradient(960px 420px at 92% -25%, rgba(108, 82, 41, 0.24), transparent 68%),
      #070b10;
  }
</style>
